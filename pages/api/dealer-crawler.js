export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed"
    });
  }

  const { rows } = req.body;

  if (!rows || !Array.isArray(rows)) {
    return res.status(400).json({
      message: "No dealer rows received"
    });
  }

  return res.status(200).json({
    success: true,
    message: `Backend received ${rows.length - 1} dealer websites`,
    dealerCount: rows.length - 1
  });
}
