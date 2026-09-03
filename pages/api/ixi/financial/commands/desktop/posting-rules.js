const { proxyIXIFinancialRequest } = require("../../../../../../lib/ixi-financial/ixiFinancialProxy");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "POST required." } });
  }
  return proxyIXIFinancialRequest({ req, res, path: "/financial/commands/desktop/posting-rules", method: "POST", body: req.body || {}, timeoutMs: 30000 });
}
