export function clampDealSheetNumber(
  value,
  { minimum = 0, maximum = Number.MAX_SAFE_INTEGER } = {}
) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return minimum;

  return Math.min(
    Math.max(numericValue, minimum),
    maximum
  );
}

export function parseDealSheetNumber(
  value,
  options = {}
) {
  const cleaned = String(value ?? "")
    .replace(/[$,\s]/g, "")
    .replace(/[^0-9.]/g, "");

  const [whole = "", ...decimalParts] = cleaned.split(".");
  const normalized = decimalParts.length
    ? `${whole || "0"}.${decimalParts.join("")}`
    : whole;

  return clampDealSheetNumber(
    normalized || 0,
    options
  );
}

export function sanitizeDealSheetDecimal(
  value,
  { maximum = 50, decimalPlaces = 2 } = {}
) {
  const cleaned = String(value ?? "")
    .replace(/[^0-9.]/g, "");

  const [whole = "", ...decimalParts] = cleaned.split(".");
  const decimal = decimalParts.join("").slice(0, decimalPlaces);
  const normalized = decimalParts.length
    ? `${whole || "0"}.${decimal}`
    : whole;

  if (!normalized) return "";

  const numericValue = Number(normalized);

  if (!Number.isFinite(numericValue)) return "";
  if (numericValue > maximum) return String(maximum);

  return normalized;
}

export function calculateMonthlyPayment(
  principal,
  annualRate,
  months
) {
  const safePrincipal = clampDealSheetNumber(principal);
  const safeMonths = Math.max(1, Math.round(Number(months) || 1));
  const safeRate = clampDealSheetNumber(
    annualRate,
    { maximum: 50 }
  );
  const monthlyRate = safeRate / 100 / 12;

  if (!monthlyRate) {
    return safePrincipal / safeMonths;
  }

  const growth = Math.pow(1 + monthlyRate, safeMonths);

  return safePrincipal * (monthlyRate * growth) / (growth - 1);
}

export function calculateDealSheet({
  offer = 0,
  downPayment = 0,
  tradeCredit = 0,
  repairs = 0,
  tax = 0,
  slip = 0,
  miles = 0,
  loadedRate = 0,
  permits = 0,
  annualRate = 0
} = {}) {
  const safeOffer = clampDealSheetNumber(offer, { maximum: 1_000_000_000 });
  const safeRepairs = clampDealSheetNumber(repairs, { maximum: 100_000_000 });
  const safeTax = clampDealSheetNumber(tax, { maximum: 100_000_000 });
  const safeSlip = clampDealSheetNumber(slip, { maximum: 100_000_000 });
  const safeMiles = clampDealSheetNumber(miles, { maximum: 100_000 });
  const safeLoadedRate = clampDealSheetNumber(loadedRate, { maximum: 100 });
  const safePermits = clampDealSheetNumber(permits, { maximum: 1_000_000 });

  const freight = Math.round(
    safeMiles * safeLoadedRate + safePermits
  );

  const purchaseTotal =
    safeOffer +
    safeRepairs +
    safeTax +
    safeSlip +
    freight;

  const appliedDownPayment = clampDealSheetNumber(
    downPayment,
    { maximum: purchaseTotal }
  );

  const appliedTradeCredit = clampDealSheetNumber(
    tradeCredit,
    {
      maximum: Math.max(
        purchaseTotal - appliedDownPayment,
        0
      )
    }
  );

  const credits =
    appliedDownPayment + appliedTradeCredit;

  const amountFinanced = Math.max(
    purchaseTotal - credits,
    0
  );

  const rate = clampDealSheetNumber(
    annualRate,
    { maximum: 50 }
  );

  return {
    offer: safeOffer,
    repairs: safeRepairs,
    tax: safeTax,
    slip: safeSlip,
    miles: safeMiles,
    loadedRate: safeLoadedRate,
    permits: safePermits,
    freight,
    purchaseTotal,
    downPayment: appliedDownPayment,
    tradeCredit: appliedTradeCredit,
    credits,
    amountFinanced,
    annualRate: rate,
    payments: {
      36: calculateMonthlyPayment(amountFinanced, rate, 36),
      48: calculateMonthlyPayment(amountFinanced, rate, 48),
      60: calculateMonthlyPayment(amountFinanced, rate, 60)
    }
  };
}

