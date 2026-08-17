const { proxyIXIAuthorityRequest } = require("../../../../lib/ixi-authority/ixiAuthorityProxy");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "POST required." } });
  }

  return proxyIXIAuthorityRequest({
    req,
    res,
    path: "/authority/evaluate",
    method: "POST",
    body: req.body || {}
  });
}
