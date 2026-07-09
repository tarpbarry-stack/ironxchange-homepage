// /pages/api/passport/test-ensure.js

import {
  ensurePassportForMachine
} from "../../../lib/passport/ensurePassportForMachine";

export default async function handler(req, res) {
  try {
    const sourceType = req.query.sourceType || "vercel-test";
    const sourceId = req.query.sourceId || "machine-001";

    const result = await ensurePassportForMachine({
      sourceType,
      sourceId,
      visibility: "private",
      status: "active"
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
