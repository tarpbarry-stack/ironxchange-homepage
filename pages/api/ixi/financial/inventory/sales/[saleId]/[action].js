const { proxyIXIFinancialRequest } = require("../../../../../../../lib/ixi-financial/ixiFinancialProxy");
export default function handler(req, res) {
  const { saleId, action } = req.query;
  if (req.method !== "POST" || !["adjustment", "refund", "return"].includes(action) || typeof saleId !== "string") return res.status(405).json({ ok: false, errors: [{ message: "Choose a valid sale action." }] });
  return proxyIXIFinancialRequest({ req, res, path: `/financial/inventory/sales/${encodeURIComponent(saleId)}/${action}`, method: "POST", body: req.body });
}
