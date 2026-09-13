// Read each source independently: one unavailable Bill must not hide the rest
// of the request's history. A retry is a fresh read, never a financial command.
export async function loadIXIFreightHistory({ order, loadEvents, loadFinancialHistory, signal }) {
  const ids = [...new Set((order.financialRecords || []).map(record => record.financialDocument?.financialDocumentId).filter(Boolean))];
  const results = await Promise.allSettled([
    loadEvents(order.identity.freightOrderId, { signal }),
    ...ids.map(id => loadFinancialHistory(id, { signal }))
  ]);
  if (signal?.aborted) throw new DOMException("History read cancelled.", "AbortError");
  return {
    events: results[0].status === "fulfilled" ? results[0].value : [],
    financialHistory: results.slice(1).flatMap(result => result.status === "fulfilled" ? result.value : []),
    incomplete: results.some(result => result.status === "rejected")
  };
}
