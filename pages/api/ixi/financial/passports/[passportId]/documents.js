const { proxyIXIFinancialRequest } = require("../../../../../../lib/ixi-financial/ixiFinancialProxy");

const clean = value => String(value ?? "").trim();

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      ok: false,
      error: { code: "METHOD_NOT_ALLOWED", message: "GET required." }
    });
  }

  const passportId = clean(req.query?.passportId);
  if (!passportId) {
    return res.status(400).json({
      ok: false,
      error: { code: "PASSPORT_ID_REQUIRED", message: "Passport ID is required." }
    });
  }

  return proxyIXIFinancialRequest({
    req,
    res,
    path: `/financial/passports/${encodeURIComponent(passportId)}/documents`,
    method: "GET"
  });
}

