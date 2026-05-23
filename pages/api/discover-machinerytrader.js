export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed"
    });
  }

  const targets = [
    {
      company: "MachineryTrader Dealer Directory",
      website: "https://www.machinerytrader.com/dealers",
      category: "MachineryTrader Discovery Source",
      state: "US"
    },
    {
      company: "MachineryTrader Construction Equipment",
      website: "https://www.machinerytrader.com",
      category: "MachineryTrader Discovery Source",
      state: "US"
    }
  ];

  return res.status(200).json({
    success: true,
    message: `Prepared ${targets.length} MachineryTrader targets.`,
    targets
  });
}
