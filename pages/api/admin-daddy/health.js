const { getIXIAccessToken, getIXICoreBaseUrl } = require("../../../lib/ixi-authority/ixiAuthorityProxy");

async function probe({ name, url, headers = {} }) {
  const started = Date.now();
  try {
    const response = await fetch(url, { headers: { Accept: "application/json", ...headers } });
    return {
      service: name,
      state: response.ok ? "healthy" : response.status >= 500 ? "failed" : "degraded",
      statusCode: response.status,
      latencyMs: Date.now() - started,
      checkedAt: new Date().toISOString()
    };
  } catch {
    return {
      service: name,
      state: "failed",
      statusCode: null,
      latencyMs: Date.now() - started,
      checkedAt: new Date().toISOString()
    };
  }
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

  const base = getIXICoreBaseUrl();
  const services = await Promise.all([
    probe({ name: "ix-core", url: `${base}/health` }),
    probe({ name: "authority", url: `${base}/authority/access-context`, headers: { Authorization: `Bearer ${accessToken}` } })
  ]);

  const failed = services.filter(item => item.state === "failed").length;
  const degraded = services.filter(item => item.state === "degraded").length;

  return res.status(200).json({
    ok: failed === 0,
    state: failed ? "failed" : degraded ? "degraded" : "healthy",
    generatedAt: new Date().toISOString(),
    services
  });
}
