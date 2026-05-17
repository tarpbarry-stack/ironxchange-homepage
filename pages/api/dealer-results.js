import { loadDealerResults } from "../../lib/ixi-store";

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      message: "Method not allowed"
    });
  }

  const results = loadDealerResults();

  return res.status(200).json({
    success: true,
    results
  });
}
