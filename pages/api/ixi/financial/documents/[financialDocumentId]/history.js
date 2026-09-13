const { proxyIXIFinancialRequest } = require("../../../../../../lib/ixi-financial/ixiFinancialProxy");

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "GET required." } });
  }
  const id = typeof req.query?.financialDocumentId === "string" ? req.query.financialDocumentId.trim() : "";
  if (!id) {
    return res.status(400).json({ ok: false, error: { code: "FINANCIAL_DOCUMENT_ID_REQUIRED", message: "Financial document ID is required." } });
  }
  return proxyIXIFinancialRequest({ req, res, path: `/financial/documents/${encodeURIComponent(id)}/history`, method: "GET" });
}
