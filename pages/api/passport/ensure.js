// /pages/api/passport/ensure.js

import machineProvisioningHandler
  from "../ixi/onboarding/machine";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  const sourceType = String(req.body?.sourceType || "").trim();
  const sourceId = String(req.body?.sourceId || "").trim();

  if (sourceType !== "sharetribe-listing" || !sourceId) {
    return res.status(400).json({
      ok: false,
      error: {
        code: "IXI_CANONICAL_MACHINE_SOURCE_REQUIRED",
        message: "Passport creation requires an owned Sharetribe machine listing."
      }
    });
  }

  req.body = { listingId: sourceId };
  return machineProvisioningHandler(req, res);
}
