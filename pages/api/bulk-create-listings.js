export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    return res.status(200).json({
      results: [
        {
          row: 1,
          status: "test-ok",
          title: "Bulk route is alive",
          listingId: null
        }
      ]
    });
  } catch (err) {
    return res.status(500).json({
      error: err?.message || "Bulk upload failed"
    });
  }
}
