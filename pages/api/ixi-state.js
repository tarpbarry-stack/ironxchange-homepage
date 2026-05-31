import {
  getUserIxiState,
  saveUserIxiPatch
} from "../../lib/ixi-store";

export default function handler(req, res) {
  try {
    if (req.method === "GET") {
      const userId = String(req.query.userId || "guest");

      return res.status(200).json({
        state: getUserIxiState(userId)
      });
    }

    if (req.method === "POST") {
      const { userId = "guest", listingId, patch = {} } = req.body || {};

      if (!listingId) {
        return res.status(400).json({
          error: "Missing listingId"
        });
      }

      const state = saveUserIxiPatch({
        userId,
        listingId,
        patch
      });

      return res.status(200).json({
        ok: true,
        state
      });
    }

    return res.status(405).json({
      error: "Method not allowed"
    });
  } catch (err) {
    console.error("IXI state API failed:", err);

    return res.status(500).json({
      error: "IXI state API failed"
    });
  }
}
