const clean = value => String(value ?? "").trim();

// A previous response must never describe a newly selected accounting period.
// This only governs presentation and action availability, never accounting state.
export function accountingViewState({ payload, period, currency = "USD", loading, error } = {}) {
  const projection = payload?.data?.projection;
  if (loading) return { ready: false, status: "LOADING", projection: {} };
  if (error || !projection) return { ready: false, status: "UNAVAILABLE", projection: {} };
  const matches = clean(projection.period?.period) === clean(period)
    && clean(projection.currency).toUpperCase() === clean(currency).toUpperCase();
  if (!matches || typeof projection.period?.closed !== "boolean") {
    return { ready: false, status: "UNAVAILABLE", projection: {} };
  }
  return { ready: true, status: projection.period.closed ? "CLOSED" : "OPEN", projection };
}

export function closeReviewItems(controls = {}) {
  const certification = controls.closeCertification;
  if (!certification) return null;
  const counts = certification.counts || {};
  const reconciliations = certification.reconciliations || {};
  return {
    counts: [
      { label: "Unposted source documents", value: counts.unpostedEconomicDocuments },
      { label: "Unposted journals", value: counts.draftJournals },
      { label: "Unclassified accounts", value: counts.unclassifiedLines },
      { label: "Suspense entries", value: counts.suspenseLines }
    ],
    balances: [
      { label: "Receivables", ...reconciliations.accountsReceivable },
      { label: "Payables", ...reconciliations.accountsPayable },
      { label: "Cash", difference: reconciliations.treasury?.difference, balanced: reconciliations.treasury?.balancedToGL }
    ],
    exceptions: Array.isArray(certification.exceptions) ? certification.exceptions : []
  };
}
