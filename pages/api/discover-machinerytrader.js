export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed"
    });
  }

  return res.status(200).json({
    success: true,
    message: "MachineryTrader API route is working.",
    targets: [
      {
        company: "MachineryTrader Dealer Directory",
        website: "https://www.machinerytrader.com/dealers",
        category: "MachineryTrader Discovery Source",
        state: "US"
      }
    ]
  });
}
