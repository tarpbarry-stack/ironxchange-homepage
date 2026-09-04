const clean = value => String(value ?? "").trim();

const ALLOWED = Object.freeze([
  { method: "POST", pattern: /^\/tickets\/reserve$/ },
  { method: "GET", pattern: /^\/tickets$/ },
  { method: "POST", pattern: /^\/tickets$/ },
  { method: "GET", pattern: /^\/tickets\/[^/]+$/ },
  { method: "PATCH", pattern: /^\/tickets\/[^/]+$/ },
  { method: "POST", pattern: /^\/tickets\/[^/]+\/(?:closeout|verify|reopen)$/ },
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

function requestId(req) {
  return clean(req?.headers?.["x-request-id"]) || `ixi-ticket-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
        message: "Unsupported IXI Ticket operation."
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

  const upstreamPath = `/tickets/v1${ticketPath}${queryString(req)}`;
  const hasBody = !["GET", "HEAD"].includes(method) && req.body !== undefined;

  try {
    const upstream = await fetch(`${getIXICoreBaseUrl()}${upstreamPath}`, {
      method,
      headers: {
        Accept: "application/json",
        "x-request-id": requestId(req),
        "x-ixi-source": "ticket-single-owner-build",
        ...(hasBody ? { "Content-Type": "application/json" } : {})
      },
      ...(hasBody ? { body: JSON.stringify(req.body ?? {}) } : {})
    });

    const text = await upstream.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = {
        ok: false,
        contract: "ixi-ticket",
        error: {
          code: "IXI_TICKET_BAD_UPSTREAM_RESPONSE",
          message: "IX-Core returned a non-JSON Ticket response."
        }
      };
    }

    return res.status(upstream.status).json(payload);
  } catch {
    return res.status(502).json({
      ok: false,
      contract: "ixi-ticket",
      error: {
        code: "IXI_TICKET_UPSTREAM_UNAVAILABLE",
        message: "IXI Ticket service is unavailable."
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
