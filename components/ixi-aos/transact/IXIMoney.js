// Presentation uses US accounting notation. Commands receive a decimal string,
// never a formatted number, and an empty field remains empty.
export function parseIXIMoneyInput(value, { allowNegative = false } = {}) {
  const raw = String(value ?? "").trim();
  if (!raw) return { valid: true, value: "" };
  const stripped = raw.replace(/^\$\s*/, "");
  if (!/^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d{0,2})?$/.test(stripped) ||
      (!allowNegative && stripped.startsWith("-"))) return { valid: false };
  let normalized = stripped.replace(/,/g, "");
  if (["-", ".", "-."].includes(normalized)) normalized = normalized.replace(".", "0.");
  if (normalized === "-") return allowNegative ? { valid: true, value: "-" } : { valid: false };
  if (Math.abs(Number(normalized)) > 999999999999.99) return { valid: false };
  return { valid: true, value: normalized };
}

export function formatIXIMoneyInput(value) {
  if (value === "" || value == null || value === "-") return String(value ?? "");
  const parsed = parseIXIMoneyInput(value, { allowNegative: true });
  if (!parsed.valid) return String(value);
  return Number(parsed.value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatIXIAccountingMoney(value, currency = "USD") {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return amount.toLocaleString("en-US", { style: "currency", currency: currency || "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
