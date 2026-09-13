const { proxyIXIFinancialRequest } = require("../../../../../../../lib/ixi-financial/ixiFinancialProxy");

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).json({ ok: false, errors: [{ message: "GET required." }] }); }
  const documentId = typeof req.query.financialDocumentId === "string" ? req.query.financialDocumentId.trim() : "";
  const attachmentId = typeof req.query.attachmentId === "string" ? req.query.attachmentId.trim() : "";
  if (!documentId || !attachmentId) return res.status(400).json({ ok: false, errors: [{ message: "Transaction and attachment IDs are required." }] });
  return proxyIXIFinancialRequest({ req, res, path: `/financial/documents/${encodeURIComponent(documentId)}/attachments/${encodeURIComponent(attachmentId)}/download`, method: "GET" });
}
