import {
  updateMachineFactsVerified
} from "../../lib/sharetribe/IXISharetribeMutationEngine";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  try {
    const {
      listingId,
      title,
      price,
      hours,
      location,
      description,
      keywords = []
    } = req.body || {};

    if (!listingId) {
      return res.status(400).json({
        ok: false,
        error: "Missing listingId"
      });
    }

    const result = await updateMachineFactsVerified({
      listingId,
      title,
      price,
      hours,
      location,
      description,
      keywords
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("UPDATE MACHINE FACTS ERROR:", error);

    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
