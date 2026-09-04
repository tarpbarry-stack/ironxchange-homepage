const { proxyIXIFinancialRequest } = require("../../../../../../lib/ixi-financial/ixiFinancialProxy");
const clean = value => String(value ?? "").trim();
export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "POST required." } }); }
  const id = clean(req.query?.financialDocumentId);
  if (!id) return res.status(400).json({ ok: false, error: { code: "FINANCIAL_DOCUMENT_ID_REQUIRED", message: "Sales Order ID is required." } });
  return proxyIXIFinancialRequest({ req, res, path: `/financial/sales-orders/${encodeURIComponent(id)}/signing-invitations`, method: "POST", body: req.body || {} });
}
