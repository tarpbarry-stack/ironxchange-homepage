export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { rows } = req.body;

  if (!rows || !Array.isArray(rows)) {
    return res.status(400).json({ message: "No dealer rows received" });
  }

  const dataRows = rows.slice(1);

  const crawlTargets = dataRows
    .map((row) => ({
      company: row[0],
      website: row[1],
      category: row[2],
      state: row[3]
    }))
    .filter((dealer) => dealer.website);

  return res.status(200).json({
    success: true,
    message: `Prepared ${crawlTargets.length} crawl targets`,
    crawlTargets
  });
}
