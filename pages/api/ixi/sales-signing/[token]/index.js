const { proxyIXISalesSigning } = require("../../../../../lib/ixi-sales/ixiSalesSigningProxy");
export default function handler(req, res) { if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).end(); } return proxyIXISalesSigning({ req, res, token: req.query.token, operation: "load" }); }
