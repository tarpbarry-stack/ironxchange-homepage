const { proxyIXIFreightRequest } = require("../../../../lib/ixi-freight/ixiFreightProxy");

export default function handler(req, res) {
  const parts = Array.isArray(req.query.path) ? req.query.path : [];
  const path = parts.map(part => encodeURIComponent(String(part))).join("/");
  const method = String(req.method || "GET").toUpperCase();
  if (!["GET", "POST"].includes(method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok:false, error:{ code:"METHOD_NOT_ALLOWED", message:"GET or POST required." } });
  }
  return proxyIXIFreightRequest({
    req,
    res,
    path,
    method,
    ...(method === "POST" ? { body:req.body || {} } : {})
  });
}
