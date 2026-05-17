import {
  saveDealerResults,
  loadDealerResults
} from "../../lib/ixi-store";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed"
    });
  }

  const { results } = req.body;

  if (!Array.isArray(results)) {
    return res.status(400).json({
      message: "Invalid results payload"
    });
  }

  saveDealerResults(results);

  return res.status(200).json({
    success: true,
    saved: results.length,
    results: loadDealerResults()
  });
}
