const { mutationOriginIsValid } = require("../ixi-authority/ixiAuthorityProxy");

const clean = value => String(value ?? "").trim();

async function proxyIXIFreightRequest({ req, res, path = "", method = "GET", body, timeoutMs = 20000 }) {
  if (!mutationOriginIsValid(req)) {
    return res.status(403).json({ ok:false, error:{ code:"IXI_FREIGHT_ORIGIN_DENIED", message:"Cross-origin IXI Freight mutation denied." } });
  }

  const suffix = clean(path).replace(/^\/+/, "");
  if (suffix.includes("..")) {
    return res.status(400).json({ ok:false, error:{ code:"IXI_FREIGHT_PATH_INVALID", message:"IXI Freight path is invalid." } });
  }

  try {
    const [sessionModule, clientModule] = await Promise.all([
      import("../server/aos/resolveAosBrowserSession"),
      import("../server/aos/ixiMosInternalClient")
    ]);
    const session = await sessionModule.resolveAosBrowserSession(req, res);
    const context = await clientModule.resolveIxCoreAosContext({ session });
    const payload = await Promise.race([
      clientModule.requestIxCoreFreight({
        path: suffix,
        method,
        body: body === undefined ? null : body,
        principalId: session.userId,
        entityId: context.entityId
      }),
      new Promise((_, reject) => setTimeout(() => {
        const error = new Error("IXI Freight service timed out.");
        error.code = "IXI_FREIGHT_UPSTREAM_TIMEOUT";
        error.status = 502;
        reject(error);
      }, timeoutMs))
    ]);
    res.setHeader("Cache-Control", "no-store, private");
    return res.status(200).json(payload);
  } catch (error) {
    const status = Number(error?.status || 502);
    return res.status(status >= 400 && status <= 599 ? status : 502).json({
      ok:false,
      error:{ code:clean(error?.code)||"IXI_FREIGHT_UPSTREAM_UNAVAILABLE", message:clean(error?.message)||"IXI Freight service is unavailable.", details:error?.details||null }
    });
  }
}

module.exports = { proxyIXIFreightRequest };
