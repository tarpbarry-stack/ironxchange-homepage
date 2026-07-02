// /pages/api/test-facebook-html.js

import {
  parseFacebookMarketplace
} from "../../../lib/acquisition/parsers/parseFacebookMarketplace";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed."
    });
  }

  try {
    const { url, html } = req.body || {};

    if (!url || !html) {
      return res.status(400).json({
        ok: false,
        error: "Missing url or html."
      });
    }

    const result = await parseFacebookMarketplace(
      url,
      html
    );

    return res.status(200).json({
      ok: true,
      result
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
