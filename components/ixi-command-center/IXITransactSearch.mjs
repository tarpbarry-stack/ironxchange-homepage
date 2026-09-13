import { normalizeIXITransactPassportRecords } from "../ixi-transact-dashboard/data/IXITransactPassportRecordProjection.mjs";
const clean = value => String(value ?? "").trim().toLowerCase();

export function searchIXITransact({ query = "", contexts = [], records = [], limit = 30 } = {}) {
  const term = clean(query);
  if (term.length < 2) return [];
  const numeric = term.replace(/[$,\s]/g, "");
  const matches = value => clean(value).includes(term);
  const objects = contexts.filter(item => matches([item.title, item.subtitle, item.passportId, item.sourceId, item.serialNumber, item.stockNumber].join(" ")))
    .map(item => ({ ...item, resultType: "object", resultId: `object:${item.id}` }));
  const transactions = normalizeIXITransactPassportRecords(records).filter(item =>
    matches([item.id, item.title, item.party, item.document.description, item.type, item.document.transactionReference].join(" ")) ||
    (/^\d+(\.\d+)?$/.test(numeric) && item.amount !== null && Number(numeric) === item.amount)
  ).map(item => ({ ...item, resultType: "transaction", resultId: `record:${item.id}` }));
  return [...transactions, ...objects].slice(0, limit);
}
