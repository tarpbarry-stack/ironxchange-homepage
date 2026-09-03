const {
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

  try {
    const [sessionModule, clientModule] = await Promise.all([
      import("../server/aos/resolveAosBrowserSession"),
      import("../server/aos/ixiMosInternalClient")
    ]);

    const session = await sessionModule.resolveAosBrowserSession(req, res);
    const context = await clientModule.resolveIxCoreAosContext({ session });
    const payload = await Promise.race([
      clientModule.requestIxCoreFinancial({
        path: resolvedPath,
        method,
        body: body === undefined ? null : safeObject(body),
        principalId: session.userId,
        entityId: context.entityId
      }),
      new Promise((_, reject) => setTimeout(() => {
        const error = new Error("IXI Financial service timed out.");
        error.code = "IXI_FINANCIAL_UPSTREAM_TIMEOUT";
        error.status = 502;
        reject(error);
      }, timeoutMs))
    ]);

    res.setHeader("Cache-Control", "no-store, private");
    return res.status(200).json(payload);
  } catch (error) {
    const status = Number(error?.status || 502);
    return res.status(status >= 400 && status <= 599 ? status : 502).json({
      ok: false,
      contract: "ixi-financial-proxy",
      operation: "financial.proxy",
      data: null,
      errors: [{
        code: clean(error?.code) || "IXI_FINANCIAL_UPSTREAM_UNAVAILABLE",
        message: clean(error?.message) || "IXI Financial service is unavailable.",
        details: error?.details || null
      }],
      warnings: []
    });
  }
}

module.exports = {
  proxyIXIFinancialRequest
};
