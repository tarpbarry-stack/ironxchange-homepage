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
    method: "GET",
    // The financial proxy has already resolved the authenticated IX-Core
    // Entity. Return that minimal canonical context so TRAN$ACT can render
    // the company surface without loading the complete AOS asset estate.
    includeOperatingContext: true
  });
}
