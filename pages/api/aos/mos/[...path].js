import {
  resolveAosBrowserSession
} from "../../../../lib/server/aos/resolveAosBrowserSession";

import {
  requestIxCoreMos,
  resolveIxCoreAosContext
} from "../../../../lib/server/aos/ixiMosInternalClient";


const ROUTES = [
  { methods: ["GET"], pattern: /^\/health$/ },
  { methods: ["POST"], pattern: /^\/aos\/environment$/ },

  { methods: ["GET"], pattern: /^\/entities\/[^/]+$/ },
  { methods: ["GET", "POST"], pattern: /^\/entities\/[^/]+\/object-definitions$/ },
  { methods: ["GET", "PATCH", "DELETE"], pattern: /^\/entities\/[^/]+\/object-definitions\/[^/]+$/ },

  { methods: ["GET"], pattern: /^\/card-templates$/ },
  { methods: ["GET"], pattern: /^\/card-templates\/[^/]+$/ },

  { methods: ["GET"], pattern: /^\/entities\/[^/]+\/objects$/ },
  { methods: ["POST"], pattern: /^\/objects\/provision$/ },
  { methods: ["POST"], pattern: /^\/objects\/provision\/[^/]+\/recover$/ },
  { methods: ["GET", "PATCH", "DELETE"], pattern: /^\/objects\/[^/]+$/ },

  { methods: ["GET"], pattern: /^\/containers\/[^/]+$/ },
  { methods: ["POST"], pattern: /^\/containers\/[^/]+\/place$/ },
  { methods: ["POST"], pattern: /^\/objects\/[^/]+\/remove-from-container$/ },

  { methods: ["POST"], pattern: /^\/movements\/immediate$/ },
  { methods: ["POST"], pattern: /^\/movements\/freight$/ },
  { methods: ["POST"], pattern: /^\/movements\/[^/]+\/complete$/ },

  { methods: ["GET"], pattern: /^\/events$/ },

  { methods: ["GET", "POST"], pattern: /^\/imports\/jobs$/ },
  { methods: ["GET"], pattern: /^\/imports\/jobs\/[^/]+$/ },
  { methods: ["PATCH"], pattern: /^\/imports\/jobs\/[^/]+\/mapping$/ },
  { methods: ["POST"], pattern: /^\/imports\/jobs\/[^/]+\/rows$/ },
  { methods: ["POST"], pattern: /^\/imports\/jobs\/[^/]+\/rows\/[^/]+\/execute$/ },
  { methods: ["POST"], pattern: /^\/imports\/jobs\/[^/]+\/execute$/ },
  { methods: ["POST"], pattern: /^\/imports\/jobs\/[^/]+\/cancel$/ }
];

function clean(value) {
  return String(value ?? "").trim();
}

function safeObject(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  )
    ? { ...value }
    : {};
}

function getGatewayPath(req) {
  const segments =
    Array.isArray(req.query?.path)
      ? req.query.path
      : [req.query?.path];

  return `/${segments
    .filter(Boolean)
    .map(segment => encodeURIComponent(String(segment)))
    .join("/")}`;
}

function isAllowed(method, path) {
  return ROUTES.some(route =>
    route.methods.includes(method) &&
    route.pattern.test(path)
  );
}

function assertEntityPath(path, entityId) {
  const match =
    path.match(/^\/entities\/([^/]+)(?:\/|$)/);

  if (!match) {
    return;
  }

  const claimed =
    decodeURIComponent(match[1]);

  if (claimed !== entityId) {
    const error = new Error(
      "Requested AOS resource does not belong to the authenticated Entity."
    );

    error.code = "AOS_BROWSER_ENTITY_MISMATCH";
    error.status = 403;
    throw error;
  }
}

function buildQuery(req, entityId, path) {
  const params =
    new URLSearchParams();

  Object.entries(req.query || {})
    .forEach(([key, rawValue]) => {
      if (key === "path" || key === "entityId") {
        return;
      }

      const values =
        Array.isArray(rawValue)
          ? rawValue
          : [rawValue];

      values.forEach(value => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    });

  /*
   * Every query-scoped customer resource is pinned to the
   * authenticated Entity. A browser-supplied entityId is ignored.
   */
  if (
    /^\/imports\/jobs(?:\/|$)/.test(path) ||
    /^\/card-templates(?:\/|$)/.test(path) ||
    path === "/events"
  ) {
    params.set("entityId", entityId);
  }

  const query =
    params.toString();

  return query
    ? `${path}?${query}`
    : path;
}

function sanitizeBody({
  path,
  method,
  body,
  entityId,
  userId
}) {
  if (["GET", "HEAD"].includes(method)) {
    return null;
  }

  const next =
    safeObject(body);

  delete next.ownerUserId;

  if (
    path === "/objects/provision" ||
    /^\/objects\/provision\/[^/]+\/recover$/.test(path) ||
    /^\/movements\/(?:immediate|freight)$/.test(path) ||
    /^\/imports\/jobs(?:\/|$)/.test(path)
  ) {
    next.entityId = entityId;
  }

  if (
    path === "/objects/provision" ||
    /^\/objects\/provision\/[^/]+\/recover$/.test(path) ||
    /^\/entities\/[^/]+\/object-definitions(?:\/[^/]+)?$/.test(path) ||
    /^\/objects\/[^/]+$/.test(path) ||
    /^\/containers\/[^/]+\/place$/.test(path) ||
    /^\/objects\/[^/]+\/remove-from-container$/.test(path) ||
    /^\/movements\//.test(path) ||
    /^\/imports\/jobs(?:\/|$)/.test(path)
  ) {
    next.actorId = userId;
  }

  return next;
}

function getForwardHeaders(req) {
  const headers = {};

  const idempotencyKey =
    clean(req.headers["idempotency-key"]);

  const ifMatch =
    clean(req.headers["if-match"]);

  if (idempotencyKey) {
    headers["Idempotency-Key"] =
      idempotencyKey;
  }

  if (ifMatch) {
    headers["If-Match"] = ifMatch;
  }

  return headers;
}

function sendError(res, error) {
  const status =
    Number(error?.status || 500);

  return res.status(
    Number.isFinite(status)
      ? status
      : 500
  ).json({
    ok: false,
    error: {
      code:
        error?.code ||
        "AOS_BROWSER_GATEWAY_FAILED",
      message:
        error?.message ||
        "AOS browser gateway request failed.",
      details:
        error?.details || null
    }
  });
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const method =
    clean(req.method).toUpperCase();

  const path =
    getGatewayPath(req);

  if (!isAllowed(method, path)) {
    res.setHeader("Allow", "");

    return res.status(405).json({
      ok: false,
      error: {
        code: "AOS_BROWSER_ROUTE_NOT_ALLOWED",
        message:
          "This IX-Core MOS operation is not exposed to browser sessions."
      }
    });
  }

  try {
    /* Health contains no customer data and performs no mutation. */
    if (path === "/health") {
      const base =
        clean(process.env.IX_CORE_BASE_URL) ||
        "https://staging.ironxchange.com/ix-core";

      const response =
        await fetch(
          `${base.replace(/\/+$/, "")}/mos/v1/health`,
          {
            headers: {
              Accept: "application/json"
            }
          }
        );

      const payload =
        await response.json();

      return res.status(response.status).json(payload);
    }

    const session =
      await resolveAosBrowserSession(
        req,
        res
      );

    const context =
      await resolveIxCoreAosContext({
        session
      });

    if (path === "/aos/environment") {
      return res.status(200).json(
        context.response
      );
    }

    assertEntityPath(
      path,
      context.entityId
    );

    const targetPath =
      buildQuery(
        req,
        context.entityId,
        path
      );

    const body =
      sanitizeBody({
        path,
        method,
        body: req.body,
        entityId:
          context.entityId,
        userId:
          context.userId
      });

    const payload =
      await requestIxCoreMos({
        path: targetPath,
        method,
        body,
        principalId:
          context.userId,
        entityId:
          context.entityId,
        extraHeaders:
          getForwardHeaders(req)
      });

    return res.status(200).json(payload);

  } catch (error) {
    return sendError(res, error);
  }
}
