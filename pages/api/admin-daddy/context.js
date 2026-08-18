const { getIXIAccessToken, getIXICoreBaseUrl } = require("../../../lib/ixi-authority/ixiAuthorityProxy");
const { buildFoundationProjection } = require("../../../lib/admin-daddy/AdminDaddyProjection");

async function loadAuthorityContext(req) {
  const accessToken = getIXIAccessToken(req);
  if (!accessToken) return { ok: false, status: 401, payload: null };

  try {
    const response = await fetch(`${getIXICoreBaseUrl()}/authority/access-context`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`
      }
    });

    const text = await response.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }

    return { ok: response.ok, status: response.status, payload };
  } catch {
    return { ok: false, status: 502, payload: null };
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "GET required." } });
  }

  const authority = await loadAuthorityContext(req);
  if (!authority.ok) {
    return res.status(authority.status).json({
      ok: false,
      error: {
        code: authority.status === 401 ? "IXI_AUTHENTICATION_REQUIRED" : "ADMIN_DADDY_AUTHORITY_UNAVAILABLE",
        message: authority.status === 401
          ? "IXI authenticated session is required."
          : "Admin Daddy could not load the IXI Authority context."
      }
    });
  }

  return res.status(200).json({
    ok: true,
    authority: authority.payload,
    projection: buildFoundationProjection()
  });
}
