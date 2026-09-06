const { proxyIXIFinancialRequest } = require("../../../../../../../lib/ixi-financial/ixiFinancialProxy");

const clean = value => String(value ?? "").trim();

export default async function handler(req, res) {
  if (clean(req.method).toUpperCase() !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "POST required." } });
  }
  const financialDocumentId = clean(req.query?.financialDocumentId);
  if (!financialDocumentId) return res.status(400).json({ ok: false, error: { code: "FINANCIAL_DOCUMENT_ID_REQUIRED", message: "Financial document ID is required." } });
  return proxyIXIFinancialRequest({
    req,
    res,
    path: `/financial/documents/${encodeURIComponent(financialDocumentId)}/attachments/init`,
    method: "POST",
    body: req.body || {},
  });
}
