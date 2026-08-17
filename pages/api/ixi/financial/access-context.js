const {
  proxyIXIFinancialRequest
} = require("../../../../lib/ixi-financial/ixiFinancialProxy");

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      ok: false,
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "GET required."
      }
    });
  }

  return proxyIXIFinancialRequest({
    req,
    res,
    path: "/financial/access-context",
    method: "GET"
  });
}
