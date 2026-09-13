const clean = value => String(value ?? "").trim();

const ALLOWED = Object.freeze([
  { method: "POST", pattern: /^\/tickets\/reserve$/ },
  { method: "GET", pattern: /^\/tickets$/ },
  { method: "POST", pattern: /^\/tickets$/ },
  { method: "GET", pattern: /^\/tickets\/[^/]+$/ },
  { method: "PATCH", pattern: /^\/tickets\/[^/]+$/ },
  { method: "DELETE", pattern: /^\/tickets\/[^/]+$/ },
  { method: "POST", pattern: /^\/tickets\/[^/]+\/(?:verify|reopen)$/ },
  { method: "POST", pattern: /^\/tickets\/[^/]+\/github\/publish$/ }
]);

function getIXICoreBaseUrl() {
  return clean(
    process.env.IXI_CORE_INTERNAL_URL ||
    process.env.IXI_CORE_URL ||
    process.env.IX_CORE_BASE_URL ||
    "http://3.131.46.49:4100"
  ).replace(/\/+$/, "");
}

function expectedOrigin(req) {
  const forwardedProto = clean(req?.headers?.["x-forwarded-proto"]).split(",")[0] || "https";
  const forwardedHost = clean(req?.headers?.["x-forwarded-host"]).split(",")[0];
  const host = forwardedHost || clean(req?.headers?.host);
  return host ? `${forwardedProto}://${host}` : "";
}

function mutationOriginIsValid(req) {
  const method = clean(req?.method).toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return true;
  const origin = clean(req?.headers?.origin);
  if (!origin) return true;
  const expected = expectedOrigin(req);
  return Boolean(expected && origin === expected);
}

function allowedRequest(method, path) {
  return ALLOWED.some(rule => rule.method === method && rule.pattern.test(path));
}

function buildTicketPath(pathParts = []) {
  if (!Array.isArray(pathParts) || !pathParts.length) return "";
  const safe = pathParts
    .map(part => clean(part))
    .filter(Boolean)
    .map(part => encodeURIComponent(decodeURIComponent(part)));
  return safe.length ? `/${safe.join("/")}` : "";
}

function queryString(req) {
  const params = new URLSearchParams();
  const ignored = new Set(["path"]);
  Object.entries(req?.query || {}).forEach(([key, value]) => {
    if (ignored.has(key) || value == null) return;
    if (Array.isArray(value)) value.forEach(item => params.append(key, String(item)));
    else params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

async function proxyIXITicketRequest({ req, res, ticketPath }) {
  const method = clean(req?.method).toUpperCase();

  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");

  if (!allowedRequest(method, ticketPath)) {
    return res.status(405).json({
      ok: false,
      contract: "ixi-ticket",
      error: {
        code: "IXI_TICKET_ROUTE_DENIED",
        message: ticketPath.endsWith("/closeout")
          ? "Engineering closeout is reserved for the active IXI Agent Bridge lease."
          : "Unsupported IXI Ticket operation."
      }
    });
  }

  if (!mutationOriginIsValid(req)) {
    return res.status(403).json({
      ok: false,
      contract: "ixi-ticket",
      error: {
        code: "IXI_TICKET_ORIGIN_DENIED",
        message: "Cross-origin Ticket mutation denied."
      }
    });
  }

  const upstreamPath = `${ticketPath}${queryString(req)}`;
  const hasBody = !["GET", "HEAD"].includes(method) && req.body !== undefined;

  try {
    const [sessionModule, clientModule] = await Promise.all([
      import("../server/aos/resolveAosBrowserSession"),
      import("../server/aos/ixiMosInternalClient")
    ]);
    const session = await sessionModule.resolveAosBrowserSession(req, res);
    const context = await clientModule.resolveIxCoreAosContext({ session });
    const payload = await clientModule.requestIxCoreTicket({
      path: upstreamPath,
      method,
      body: hasBody ? (req.body ?? {}) : null,
      principalId: session.userId,
      entityId: context.entityId
    });

    return res.status(200).json(payload);
  } catch (error) {
    const status = Number(error?.status || 502);
    const safeStatus = status >= 400 && status <= 599 ? status : 502;
    const upstreamPayload =
      error?.payload && typeof error.payload === "object"
        ? error.payload
        : null;

    return res.status(safeStatus).json(upstreamPayload || {
      ok: false,
      contract: "ixi-ticket",
      error: {
        code: clean(error?.code) || "IXI_TICKET_UPSTREAM_UNAVAILABLE",
        message: clean(error?.message) || "IXI Ticket service is unavailable.",
        details: error?.details || null
      }
    });
  }
}

module.exports = {
  getIXICoreBaseUrl,
  mutationOriginIsValid,
  buildTicketPath,
  proxyIXITicketRequest
};
