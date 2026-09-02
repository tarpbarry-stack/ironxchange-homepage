const {
  proxyIXIFinancialRequest
} = require("../../../../../../../../lib/ixi-financial/ixiFinancialProxy");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      ok: false,
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "POST required."
      }
    });
  }

  const financialDocumentId = String(
    req.query?.financialDocumentId || ""
  ).trim();

  if (!financialDocumentId) {
    return res.status(400).json({
      ok: false,
      error: {
        code: "FINANCIAL_DOCUMENT_ID_REQUIRED",
        message: "financialDocumentId is required."
      }
    });
  }

  return proxyIXIFinancialRequest({
    req,
    res,
    path: `/financial/commands/desktop/journals/${encodeURIComponent(financialDocumentId)}/post`,
    method: "POST",
    body: req.body || {},
    timeoutMs: 30000
  });
}
