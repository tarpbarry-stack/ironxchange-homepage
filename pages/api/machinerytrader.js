export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const starterTargets = [
    {
      company: "MachineryTrader Dealer Discovery",
      website: "https://www.machinerytrader.com",
      category: "Dealer Discovery",
      state: "US"
    }
  ];

  return res.status(200).json({
    success: true,
    message: `Prepared ${starterTargets.length} MachineryTrader discovery target.`,
    targets: starterTargets
  });
}
