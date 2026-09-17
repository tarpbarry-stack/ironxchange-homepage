const { proxyIXIFinancialRequest } = require("../../../../../../lib/ixi-financial/ixiFinancialProxy");

export default async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: { message: "GET or POST required." } });
  }
  const id = String(req.query?.financialDocumentId || "").trim();
  if (!id) return res.status(400).json({ ok: false, error: { message: "Sales Order ID is required." } });
  return proxyIXIFinancialRequest({ req, res, path: `/financial/sales-orders/${encodeURIComponent(id)}/trade-corrections`,
    method: req.method, ...(req.method === "POST" ? { body: req.body || {} } : {}) });
}
