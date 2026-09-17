const clean = value => String(value ?? "").trim();

export const orderTradeFromRow = row => ({
  tradeId: row.tradeId,
  passportId: row.passportId,
  objectId: row.objectId,
  listingId: row.listingId,
  ...row.machine,
  allowance: row.allowanceCents / 100,
});

// One operation covers the card, order allowance and linked draft invoice.
// The intermediate order save must not announce completion or remount the form.
export async function saveTradeInOrder({ form, outgoingPassportId, prepareOrder, saveMachine, attachTrade, onMachineSaved }) {
  const machine = Object.fromEntries(["year", "make", "model", "hours", "serialNumber", "location"].map(key => [key, clean(form?.[key])]));
  for (const key of ["year", "make", "model", "hours", "serialNumber"])
    if (!machine[key]) throw new Error(`Complete the trade ${key === "serialNumber" ? "serial" : key} before saving the order.`);
  const allowance = Number(form.allowance);
  if (!/^\d{4}$/.test(machine.year) || !Number.isFinite(Number(machine.hours)) || Number(machine.hours) < 0)
    throw new Error("Enter a four-digit trade year and valid machine hours.");
  if (!clean(form.allowance) || !Number.isFinite(allowance) || allowance < 0 || !Number.isSafeInteger(Math.round(allowance * 100)))
    throw new Error("Enter a valid trade allowance before saving the order.");
  const saved = await prepareOrder();
  if (!saved) throw new Error("The order could not be saved. Your trade details are still here; retry Save Trade.");
  const result = await saveMachine({
    dealId: saved.identity.dealId, outgoingPassportId, tradeId: form.tradeId,
    machine, allowanceCents: Math.round(allowance * 100), existingListingId: form.existingListingId || "",
  });
  const row = result?.row;
  if (!row || row.tradeId !== form.tradeId || !row.passportId || !row.objectId || !row.listingId)
    throw new Error("The saved trade identity could not be verified. Retry this same trade.");
  onMachineSaved?.(row);
  const trade = orderTradeFromRow(row);
  const attached = await attachTrade([...(saved.trades || []).filter(item => item.tradeId !== trade.tradeId), trade], saved);
  if (!attached) throw new Error("Machine saved; order or invoice update needs retry. Keep this trade and retry Save Trade.");
  if (!attached.trades?.some(item => item.tradeId === trade.tradeId && item.passportId === trade.passportId && Number(item.allowance) === trade.allowance))
    throw new Error("The order did not confirm this trade allowance. Retry attaching the saved trade.");
  return attached;
}
