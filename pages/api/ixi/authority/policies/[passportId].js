import { proxyIXIAuthorityRequest } from "../../../../../lib/ixi-authority/ixiAuthorityProxy";

const clean = value => String(value ?? "").trim();

export default async function handler(req, res) {
  const passportId = clean(req.query?.passportId);

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
    return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "GET or PUT required." } });
  }

  return proxyIXIAuthorityRequest({
    req,
    res,
    path: `/authority/policies/${encodeURIComponent(passportId)}`,
    method: req.method,
    body: req.method === "PUT" ? req.body : undefined
  });
}
