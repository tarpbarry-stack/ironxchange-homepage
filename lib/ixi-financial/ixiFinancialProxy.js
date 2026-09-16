const {
  mutationOriginIsValid
} = require("../ixi-authority/ixiAuthorityProxy");
const { createIXIGatewayTiming, withIXIGatewayTimeout } = require("./ixiGatewayTiming");

const clean = value => String(value ?? "").trim();

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function attachFinancialOperatingContext({ payload, context } = {}) {
  if (payload?.ok !== true) return payload;

  return {
    ...payload,
    data: {
      ...safeObject(payload.data),
      operatingContext: {
        entity: {
          entityId: clean(context?.entity?.entityId),
          displayName: clean(context?.entity?.displayName) || "IXI Entity",
          passportId: clean(
            payload?.data?.defaults?.entityPassportId ||
            payload?.data?.entities?.[0]?.passportId ||
            context?.entity?.passportId
          ),
          status: clean(context?.entity?.status) || "active",
          officeLocation: clean(context?.entity?.officeLocation)
        }
      }
    }
  };
}

async function proxyIXIFinancialRequest({
  req,
  res,
  path,
  method = "GET",
  body,
  timeoutMs = 20000,
  includeOperatingContext = false
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

  const timing = createIXIGatewayTiming(res, "financial");
  try {
    const [sessionModule, clientModule] = await Promise.all([
      import("../server/aos/resolveAosBrowserSession"),
      import("../server/aos/ixiMosInternalClient")
    ]);

    const session = await timing.measure("session", () => sessionModule.resolveAosBrowserSession(req, res));
    const context = await timing.measure("context", () => clientModule.resolveIxCoreTransactContext({
      session,
      includeEntity: includeOperatingContext,
      allowOnboarding: includeOperatingContext && method === "GET" && resolvedPath === "/financial/access-context"
    }));
    const upstreamPayload = await timing.measure("upstream", () => withIXIGatewayTimeout(
      () => clientModule.requestIxCoreFinancial({
        path: resolvedPath,
        method,
        body: body === undefined ? null : safeObject(body),
        principalId: session.userId,
        entityId: context.entityId
      }),
      { timeoutMs, code: "IXI_FINANCIAL_UPSTREAM_TIMEOUT", message: "IXI Financial service timed out." }
    ));

    const payload = includeOperatingContext
      ? attachFinancialOperatingContext({ payload: upstreamPayload, context })
      : upstreamPayload;

    res.setHeader("Cache-Control", "no-store, private");
    timing.finish(200);
    return res.status(200).json(payload);
  } catch (error) {
    const status = Number(error?.status || 502);
    timing.finish(status >= 400 && status <= 599 ? status : 502);
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
  attachFinancialOperatingContext,
  proxyIXIFinancialRequest
};
