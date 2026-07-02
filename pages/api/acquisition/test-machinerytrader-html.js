import {
  parseMachineryTrader
} from "../../../lib/acquisition/parsers/parseMachineryTrader";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const { url, html } = req.body || {};

  if (!html || typeof html !== "string") {
    return res.status(400).json({
      error: "Missing HTML."
    });
  }

  try {
    const result = await parseMachineryTrader(url || "", html);

    return res.status(200).json({
      ok: true,
      result
    });
  } catch (error) {
    console.error("MACHINERYTRADER HTML TEST FAILED:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "MachineryTrader HTML parse failed."
    });
  }
}
