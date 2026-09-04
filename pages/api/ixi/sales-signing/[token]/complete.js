const { proxyIXISalesSigning } = require("../../../../../lib/ixi-sales/ixiSalesSigningProxy");
export default function handler(req, res) { if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).end(); } return proxyIXISalesSigning({ req, res, token: req.query.token, operation: "complete" }); }
