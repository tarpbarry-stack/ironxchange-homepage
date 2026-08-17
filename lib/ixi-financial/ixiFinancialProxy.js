const {
  getIXIAccessToken,
  getIXICoreBaseUrl,
  mutationOriginIsValid
} = require("../ixi-authority/ixiAuthorityProxy");

const clean = value => String(value ?? "").trim();

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

async function proxyIXIFinancialRequest({
  req,
  res,
  path,
  method = "GET",
  body,
  timeoutMs = 20000
}) {
  if (!mutationOriginIsValid(req)) {
    return res.status(403).json({
      ok: false,
      contract: "ixi-financial-proxy",
      operation: "financial.proxy",
      data: null,
      errors: [{
        code: "IXI_FINANCIAL_ORIGIN_DENIED",
        message: "Cross-origin IXI Financial mutation denied."
      }],
      warnings: []
    });
  }

  const accessToken = getIXIAccessToken(req);

  if (!accessToken) {
    return res.status(401).json({
      ok: false,
      contract: "ixi-financial-proxy",
      operation: "financial.authentication",
      data: null,
      errors: [{
        code: "IXI_AUTHENTICATION_REQUIRED",
        message: "IXI authenticated session is required."
      }],
      warnings: []
    });
  }

  const resolvedPath = clean(path);

  if (!resolvedPath.startsWith("/financial/")) {
    return res.status(500).json({
      ok: false,
      contract: "ixi-financial-proxy",
      operation: "financial.proxy",
      data: null,
      errors: [{
        code: "IXI_FINANCIAL_PROXY_PATH_INVALID",
        message: "IXI Financial proxy path is invalid."
      }],
      warnings: []
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const upstream = await fetch(
      `${getIXICoreBaseUrl()}${resolvedPath}`,
      {
        method,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
          ...(clean(req?.headers?.["x-ixi-entity-id"])
            ? { "X-IXI-Entity-Id": clean(req.headers["x-ixi-entity-id"]) }
            : {}),
          "X-IXI-Source": "ironxchange-transact"
        },
        ...(body === undefined
          ? {}
          : { body: JSON.stringify(safeObject(body)) })
      }
    );

    const text = await upstream.text();
    let payload = null;

    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = {
        ok: false,
        contract: "ixi-financial-proxy",
        operation: "financial.proxy",
        data: null,
        errors: [{
          code: "IXI_FINANCIAL_BAD_UPSTREAM_RESPONSE",
          message: "IX-Core returned a non-JSON Financial response."
        }],
        warnings: []
      };
    }

    res.setHeader("Cache-Control", "no-store, private");
    return res.status(upstream.status).json(payload);
  } catch (error) {
    const timedOut = error?.name === "AbortError";

    return res.status(502).json({
      ok: false,
      contract: "ixi-financial-proxy",
      operation: "financial.proxy",
      data: null,
      errors: [{
        code: timedOut
          ? "IXI_FINANCIAL_UPSTREAM_TIMEOUT"
          : "IXI_FINANCIAL_UPSTREAM_UNAVAILABLE",
        message: timedOut
          ? "IXI Financial service timed out."
          : "IXI Financial service is unavailable."
      }],
      warnings: []
    });
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  proxyIXIFinancialRequest
};
