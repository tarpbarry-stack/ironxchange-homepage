const { proxyIXIFinancialRequest } = require("../../../../../lib/ixi-financial/ixiFinancialProxy");
const clean = value => String(value ?? "").trim();

export default async function handler(req, res) {
  const method = clean(req.method).toUpperCase();
  if (!["GET", "PATCH"].includes(method)) {
    res.setHeader("Allow", "GET, PATCH");
    return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "GET or PATCH required." } });
  }
  const financialDocumentId = clean(req.query?.financialDocumentId);
  if (!financialDocumentId) return res.status(400).json({ ok: false, error: { code: "FINANCIAL_DOCUMENT_ID_REQUIRED", message: "Financial document ID is required." } });
  return proxyIXIFinancialRequest({ req, res, path: `/financial/documents/${encodeURIComponent(financialDocumentId)}`, method, ...(method === "PATCH" ? { body: req.body || {} } : {}) });
}
