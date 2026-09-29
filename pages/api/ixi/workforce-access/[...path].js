import { resolveAosBrowserSession } from "../../../../lib/server/aos/resolveAosBrowserSession";
import { resolveExistingIxCoreAosContext, requestIxCoreMos } from "../../../../lib/server/aos/ixiMosInternalClient";
import { mutationOriginIsValid } from "../../../../lib/ixi-authority/ixiAuthorityProxy";

const clean = value => String(value ?? "").trim();

function requestPath(req) {
  const segments = Array.isArray(req.query?.path) ? req.query.path : [req.query?.path];
  return `/${segments.filter(Boolean).map(segment => encodeURIComponent(String(segment))).join("/")}`;
}

function allowed(method, path) {
  if (method === "GET") return /^\/people\/[a-zA-Z0-9_-]+$/.test(path);
  if (method === "PUT") return /^\/people\/[a-zA-Z0-9_-]+$/.test(path);
  if (method === "POST") return /^\/(?:people\/[a-zA-Z0-9_-]+\/invitations|invitations\/(?:accept|[a-zA-Z0-9_-]+\/revoke))$/.test(path);
  return false;
}

export function createWorkforceAccessHandler(deps = {}) {
  const sessionFor = deps.sessionFor || resolveAosBrowserSession;
  const contextFor = deps.contextFor || resolveExistingIxCoreAosContext;
  const request = deps.request || requestIxCoreMos;

  return async function handler(req, res) {
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    const method = clean(req.method).toUpperCase();
    const path = requestPath(req);
    if (!allowed(method, path)) {
      return res.status(405).json({ ok: false, error: { code: "WORKFORCE_ACCESS_ROUTE_NOT_ALLOWED", message: "Unsupported System Access operation." } });
    }
    if (method !== "GET" && !mutationOriginIsValid(req)) {
      return res.status(403).json({ ok: false, error: { code: "WORKFORCE_ACCESS_ORIGIN_DENIED", message: "Cross-origin request denied." } });
    }

    try {
      const session = await sessionFor(req, res);
      const accepting = path === "/invitations/accept";
      const context = accepting ? { entityId: "" } : await contextFor({ session });
      const body = method === "GET" ? null : accepting ? {
        entityId: clean(req.body?.entityId),
        id: clean(req.body?.id),
        token: clean(req.body?.token),
        email: clean(session.currentUser?.attributes?.email),
        verifiedEmail: session.currentUser?.attributes?.emailVerified === true
      } : req.body;
      const payload = await request({
        path: `/workforce-access${path}`,
        method,
        body,
        principalId: session.userId,
        entityId: context.entityId
      });
      return res.status(method === "POST" && /\/invitations$/.test(path) ? 201 : 200).json(payload);
    } catch (error) {
      const status = Number(error?.status || error?.statusCode || 502);
      return res.status(status >= 400 && status <= 599 ? status : 502).json({
        ok: false,
        error: {
          code: error?.code || "WORKFORCE_ACCESS_UNAVAILABLE",
          message: error?.message || "System Access is temporarily unavailable.",
          details: error?.details || null
        }
      });
    }
  };
}

export default createWorkforceAccessHandler();

export const config = { api: { bodyParser: { sizeLimit: "256kb" } }, maxDuration: 30 };
