// /pages/api/acquisition/parse-url.js

import {
  parseAcquisitionUrl
} from "../../../lib/acquisition";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const { url } = req.body || {};

  if (!url || typeof url !== "string") {
    return res.status(400).json({
      error: "Missing URL."
    });
  }

  try {
    const result = await parseAcquisitionUrl(url);

    return res.status(200).json({
      ok: true,
      result
    });
  } catch (error) {
    console.error("ACQUISITION API FAILED:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Acquisition parse failed."
    });
  }
}
