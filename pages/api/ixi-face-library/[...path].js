/* =========================================================
   IXI FACE LIBRARY — PRIVATE SAME-ORIGIN PROXY

   Browser -> Vercel -> IX-Core

   This is intentionally NOT a generic IX-Core tunnel.
   Only the Face Library route contract below is allowed.
   IX-Core remains authoritative for identity, tenant scope,
   permissions, validation, persistence, versioning and audit.
   ========================================================= */

const MAX_BODY_BYTES = 1024 * 1024;
const REQUEST_TIMEOUT_MS = 30000;

const ROUTES = [
  { method: "GET", pattern: /^faces$/ },
  { method: "GET", pattern: /^faces\/[^/]+$/ },
  { method: "POST", pattern: /^faces\/[^/]+\/retire$/ },
  { method: "PUT", pattern: /^faces\/[^/]+\/permissions$/ },
  { method: "POST", pattern: /^drafts$/ },
  { method: "POST", pattern: /^drafts\/clone$/ },
  { method: "PATCH", pattern: /^drafts\/[^/]+$/ },
  { method: "POST", pattern: /^drafts\/[^/]+\/validate$/ },
  { method: "POST", pattern: /^drafts\/[^/]+\/publish$/ },
  { method: "GET", pattern: /^assignments$/ },
  { method: "POST", pattern: /^assignments$/ },
  { method: "DELETE", pattern: /^assignments\/[^/]+$/ },
  { method: "GET", pattern: /^resolve$/ }
];

function clean(value) {
  return String(value ?? "").trim();
}

function getBaseUrl() {
  return clean(
    process.env.IXI_CORE_BASE_URL ||
    process.env.IX_CORE_BASE_URL ||
    process.env.IXI_FACE_LIBRARY_API_BASE_URL
  ).replace(/\/+$/, "");
}

function getPath(req) {
  const parts = Array.isArray(req.query?.path) ? req.query.path : [];
  return parts
    .map(part => clean(part))
    .filter(Boolean)
    .map(part => encodeURIComponent(decodeURIComponent(part)))
    .join("/");
}

function isAllowed(method, path) {
  return ROUTES.some(route => route.method === method && route.pattern.test(path));
}

function sameOriginRequest(req) {
  const origin = clean(req.headers.origin);
  if (!origin) return true; // navigation/server clients may omit Origin; IX-Core still authorizes.

  const forwardedHost = clean(req.headers["x-forwarded-host"]);
  const host = forwardedHost || clean(req.headers.host);
  const proto = clean(req.headers["x-forwarded-proto"]) || "https";
  if (!host) return false;

  try {
    return new URL(origin).origin === `${proto}://${host}`;
  } catch {
    return false;
  }
}

function copyQuery(req, target) {
  Object.entries(req.query || {}).forEach(([key, value]) => {
    if (key === "path") return;

    if (Array.isArray(value)) {
      value.forEach(item => target.searchParams.append(key, String(item)));
    } else if (value !== undefined && value !== null) {
      target.searchParams.set(key, String(value));
    }
  });
}

function buildForwardHeaders(req) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json"
  };

  // Preserve existing authenticated session material. Do not accept or synthesize
  // actor/entity/role headers as trusted identity claims from the browser.
  if (req.headers.cookie) headers.Cookie = req.headers.cookie;
  if (req.headers.authorization) headers.Authorization = req.headers.authorization;
  if (req.headers["if-match"]) headers["If-Match"] = req.headers["if-match"];
  if (req.headers["idempotency-key"]) headers["Idempotency-Key"] = req.headers["idempotency-key"];
  if (req.headers["x-request-id"]) headers["X-Request-Id"] = req.headers["x-request-id"];

  return headers;
}

function serializeBody(req) {
  if (["GET", "HEAD"].includes(req.method)) return undefined;
  if (req.body === undefined || req.body === null || req.body === "") return undefined;

  const serialized = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  if (Buffer.byteLength(serialized, "utf8") > MAX_BODY_BYTES) {
    const error = new Error("FACE_LIBRARY_REQUEST_TOO_LARGE");
    error.status = 413;
    throw error;
  }
  return serialized;
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb"
    }
  }
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, private, max-age=0");
  res.setHeader("Pragma", "no-cache");

  if (!sameOriginRequest(req)) {
    return res.status(403).json({
      code: "FACE_LIBRARY_ORIGIN_DENIED",
      message: "Face Library request origin denied."
    });
  }

  const method = clean(req.method).toUpperCase();
  const path = getPath(req);

  if (!isAllowed(method, path)) {
    return res.status(404).json({
      code: "FACE_LIBRARY_ROUTE_NOT_ALLOWED",
      message: "Face Library route is not allowed."
    });
  }

  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    return res.status(503).json({
      code: "FACE_LIBRARY_BACKEND_NOT_CONFIGURED",
      message: "IX-Core Face Library backend is not configured."
    });
  }

  const target = new URL(`${baseUrl}/aos/face-library/${path}`);
  copyQuery(req, target);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const upstream = await fetch(target.toString(), {
      method,
      headers: buildForwardHeaders(req),
      body: serializeBody(req),
      redirect: "manual",
      signal: controller.signal
    });

    const responseBody = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "application/json; charset=utf-8";
    const requestId = upstream.headers.get("x-request-id");
    const etag = upstream.headers.get("etag");

    res.status(upstream.status);
    res.setHeader("Content-Type", contentType);
    if (requestId) res.setHeader("X-Request-Id", requestId);
    if (etag) res.setHeader("ETag", etag);

    return res.send(responseBody);
  } catch (error) {
    const status = Number(error?.status) || (error?.name === "AbortError" ? 504 : 502);
    const code = error?.name === "AbortError"
      ? "FACE_LIBRARY_BACKEND_TIMEOUT"
      : clean(error?.message) === "FACE_LIBRARY_REQUEST_TOO_LARGE"
        ? "FACE_LIBRARY_REQUEST_TOO_LARGE"
        : "FACE_LIBRARY_BACKEND_UNAVAILABLE";

    return res.status(status).json({
      code,
      message: code === "FACE_LIBRARY_BACKEND_TIMEOUT"
        ? "IX-Core Face Library request timed out."
        : code === "FACE_LIBRARY_REQUEST_TOO_LARGE"
          ? "Face Library request exceeds the allowed size."
          : "IX-Core Face Library backend is unavailable."
    });
  } finally {
    clearTimeout(timeout);
  }
}
