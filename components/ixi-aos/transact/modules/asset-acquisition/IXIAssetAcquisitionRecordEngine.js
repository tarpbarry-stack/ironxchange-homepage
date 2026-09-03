const clean = (value) => String(value ?? "").trim();
const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const arr = (value) => (Array.isArray(value) ? value : []);
const round = (value) => Math.round(num(value) * 100) / 100;
const iso = () => new Date().toISOString();

export function getIXIAcquisitionActuals(record = {}, transactions = []) {
  const cutoff = clean(record?.makeReady?.inServiceDate);
  const acquisitionId = clean(record?.identity?.acquisitionId || record?.identity?.number);
  const assetPassportId = clean(record?.context?.primaryPassportId);
  const eligible = arr(transactions).filter((item) => {
    const refs = arr(item?.references || item?.additionalReferences);
    const related = refs.some((ref) => clean(ref?.externalId) === acquisitionId || clean(ref?.passportId) === assetPassportId) || clean(item?.acquisitionId) === acquisitionId || clean(item?.assetPassportId) === assetPassportId;
    if (!related) return false;
    const date = clean(item?.date || item?.occurredAt || item?.transactionDate || item?.createdAt).slice(0, 10);
    if (cutoff && date && date > cutoff) return false;
    return clean(item?.acquisitionCategory || item?.category || item?.metadata?.acquisitionCategory || item?.metadata?.costPhase) === "acquisition" || Boolean(item?.metadata?.acquisitionCost) || Boolean(item?.acquisitionCost);
  });
  const grouped = {};
  for (const item of eligible) {
    const category = clean(item?.acquisitionCategory || item?.metadata?.acquisitionCategory || item?.category || "other");
    const amount = round(item?.amount || item?.total || item?.financial?.amount);
    if (!grouped[category])
      grouped[category] = {
        category,
        label: category.replace(/-/g, " ").toUpperCase(),
        actualAmount: 0,
        records: [],
      };
    grouped[category].actualAmount = round(grouped[category].actualAmount + amount);
    grouped[category].records.push(item);
  }
  const actuals = Object.values(grouped);
  const actualTotal = round(actuals.reduce((sum, item) => sum + num(item.actualAmount), 0));
  return { actuals, actualTotal };
}

export function applyIXIAcquisitionActuals(record = {}, transactions = []) {
  const projection = getIXIAcquisitionActuals(record, transactions);
  const estimated = round(record?.makeReady?.estimates?.reduce((sum, item) => sum + num(item?.estimatedAmount), 0));
  return {
    ...record,
    makeReady: {
      ...(record.makeReady || {}),
      actuals: projection.actuals,
      actualTotal: projection.actualTotal,
      variance: round(projection.actualTotal - estimated),
    },
  };
}

export function addIXIOwnershipCapitalEvent(record = {}, event = {}, actor = {}) {
  const type = clean(event.type || "capital-contribution");
  const occurredAt = clean(event.occurredAt) || iso();
  const entry = {
    eventId: clean(event.eventId) || `OWN-${Date.now()}`,
    type,
    partyId: clean(event.partyId),
    partyLabel: clean(event.partyLabel),
    counterpartyId: clean(event.counterpartyId),
    counterpartyLabel: clean(event.counterpartyLabel),
    amount: round(event.amount),
    ownershipPercentChange: num(event.ownershipPercentChange),
    settlementSharePercentChange: num(event.settlementSharePercentChange),
    effectiveLegalOwnershipPercent: event.effectiveLegalOwnershipPercent == null ? null : num(event.effectiveLegalOwnershipPercent),
    effectiveSettlementSharePercent: event.effectiveSettlementSharePercent == null ? null : num(event.effectiveSettlementSharePercent),
    reference: clean(event.reference),
    notes: clean(event.notes),
    occurredAt,
    actorId: clean(actor.passportId || actor.employeeId || actor.userId || actor.id),
    actorLabel: clean(actor.displayName || actor.name || actor.label),
  };
  let owners = arr(record?.ownership?.owners).map((item) => ({ ...item }));
  if (entry.partyLabel) {
    let idx = owners.findIndex((item) => (clean(item.partyId) === entry.partyId && entry.partyId) || clean(item.partyLabel) === entry.partyLabel);
    if (idx < 0) {
      owners.push({
        ownerId: `OWNER-${owners.length + 1}`,
        partyId: entry.partyId,
        partyLabel: entry.partyLabel,
        legalOwnershipPercent: 0,
        settlementSharePercent: 0,
        initialContribution: 0,
        contributionDate: "",
        contributionReference: "",
        settlementPriority: "pro-rata",
        notes: "",
      });
      idx = owners.length - 1;
    }
    const current = owners[idx];
    owners[idx] = {
      ...current,
      legalOwnershipPercent: entry.effectiveLegalOwnershipPercent == null ? round(num(current.legalOwnershipPercent) + entry.ownershipPercentChange) : entry.effectiveLegalOwnershipPercent,
      settlementSharePercent: entry.effectiveSettlementSharePercent == null ? round(num(current.settlementSharePercent) + entry.settlementSharePercentChange) : entry.effectiveSettlementSharePercent,
    };
  }
  if (entry.counterpartyLabel && (entry.ownershipPercentChange || entry.settlementSharePercentChange)) {
    if (entry.counterpartyLabel === entry.partyLabel) {
      throw new Error("Ownership transfer requires two different parties.");
    }
    const idx = owners.findIndex((item) => (clean(item.partyId) === entry.counterpartyId && entry.counterpartyId) || clean(item.partyLabel) === entry.counterpartyLabel);
    if (idx < 0) {
      throw new Error("Ownership transfer counterparty must be an existing owner.");
    }
    owners[idx] = {
      ...owners[idx],
      legalOwnershipPercent: round(num(owners[idx].legalOwnershipPercent) - entry.ownershipPercentChange),
      settlementSharePercent: round(num(owners[idx].settlementSharePercent) - entry.settlementSharePercentChange),
    };
  }
  const ownership = {
    ...(record.ownership || {}),
    owners,
    legalOwnershipTotal: round(owners.reduce((s, i) => s + num(i.legalOwnershipPercent), 0)),
    settlementShareTotal: round(owners.reduce((s, i) => s + num(i.settlementSharePercent), 0)),
    events: [...arr(record?.ownership?.events), entry],
  };
  return {
    ...record,
    ownership,
    audit: { ...(record.audit || {}), updatedAt: iso() },
  };
}

export function putIXIAssetInService(record = {}, inServiceDate = "", actor = {}) {
  const date = clean(inServiceDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Valid in-service date is required");
  if (clean(record?.acquisition?.purchaseDate) > date) throw new Error("In-service date cannot be before the purchase date.");
  const previousDate = clean(record?.makeReady?.inServiceDate);
  const event = {
    eventId: `ACQ-SVC-${Date.now()}`,
    type: previousDate ? "in-service-date-corrected" : "put-in-service",
    previousDate,
    nextDate: date,
    occurredAt: iso(),
    actorId: clean(actor.passportId || actor.employeeId || actor.userId || actor.id),
    actorLabel: clean(actor.displayName || actor.name || actor.label),
  };
  return {
    ...record,
    makeReady: {
      ...(record.makeReady || {}),
      inServiceDate: date,
      inServiceAt: event.occurredAt,
      inServiceBy: event.actorLabel,
      status: "closed",
    },
    activity: [...arr(record.activity), event],
    audit: { ...(record.audit || {}), updatedAt: event.occurredAt },
  };
}

export default {
  getIXIAcquisitionActuals,
  applyIXIAcquisitionActuals,
  addIXIOwnershipCapitalEvent,
  putIXIAssetInService,
};
