const { getIXIAccessToken, getIXICoreBaseUrl } = require("../../../lib/ixi-authority/ixiAuthorityProxy");
const { buildAttentionSummary } = require("../../../lib/admin-daddy/AdminDaddyAttentionEngine");

async function fetchUpstreamEvents(accessToken) {
  const candidates = [
    "/admin-daddy/events",
    "/operations/events"
  ];

  for (const path of candidates) {
    try {
      const response = await fetch(`${getIXICoreBaseUrl()}${path}`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` }
      });
      if (!response.ok) continue;
      const payload = await response.json();
      const events = Array.isArray(payload) ? payload : Array.isArray(payload?.events) ? payload.events : null;
      if (events) return { available: true, source: path, events };
    } catch {
      // Try the next compatible IX-Core projection path.
    }
  }

  return { available: false, source: null, events: [] };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "GET required." } });
  }

  const accessToken = getIXIAccessToken(req);
  if (!accessToken) {
    return res.status(401).json({ ok: false, error: { code: "IXI_AUTHENTICATION_REQUIRED", message: "IXI authenticated session is required." } });
  }

  const upstream = await fetchUpstreamEvents(accessToken);
  const summary = buildAttentionSummary(upstream.events);

  return res.status(200).json({
    ok: true,
    live: upstream.available,
    source: upstream.source,
    ...summary,
    notice: upstream.available ? null : "IX-Core attention event projection is not registered yet."
  });
}
