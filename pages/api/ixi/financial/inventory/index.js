const { proxyIXIFinancialRequest } = require("../../../../../lib/ixi-financial/ixiFinancialProxy");
export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, errors: [{ message: "GET required." }] });
  const params = new URLSearchParams();
  for (const key of ["q", "from", "to", "sort", "settlement", "status", "page", "pageSize"]) if (typeof req.query[key] === "string") params.set(key, req.query[key]);
  return proxyIXIFinancialRequest({ req, res, path: `/financial/inventory?${params}`, method: "GET" });
}
