const {
  proxyIXIFinancialRequest
} = require("../../../../lib/ixi-financial/ixiFinancialProxy");

const clean = value => String(value ?? "").trim();

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

  const params = new URLSearchParams();

  const period = clean(req.query?.period);
  const currency = clean(req.query?.currency || "USD").toUpperCase();

  if (period) {
    params.set("period", period);
  }

  if (currency) {
    params.set("currency", currency);
  }

  const query = params.toString();

  return proxyIXIFinancialRequest({
    req,
    res,
    path: `/financial/gl${query ? `?${query}` : ""}`,
    method: "GET",
    timeoutMs: 30000
  });
}
