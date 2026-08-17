const { proxyIXIAuthorityRequest } = require("../../../../../lib/ixi-authority/ixiAuthorityProxy");

export default async function handler(req, res) {
  const passportId = String(req.query?.passportId || "").trim();

  if (!passportId) {
    return res.status(400).json({
      ok: false,
      error: {
        code: "IXI_PASSPORT_REQUIRED",
        message: "Passport ID is required."
      }
    });
  }

  if (!["GET", "PUT"].includes(req.method)) {
    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({
      ok: false,
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "GET or PUT required."
      }
    });
  }

  return proxyIXIAuthorityRequest({
    req,
    res,
    path: `/authority/policies/${encodeURIComponent(passportId)}`,
    method: req.method,
    ...(req.method === "PUT" ? { body: req.body || {} } : {})
  });
}
