const clean = value => String(value ?? "").trim();
function baseUrl() { return clean(process.env.IXI_CORE_INTERNAL_URL || process.env.IX_CORE_BASE_URL || "http://3.131.46.49:4100").replace(/\/+$/, ""); }
async function proxyIXISalesSigning({ req, res, token, operation = "load" }) {
  const safeToken = clean(token);
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(safeToken) || safeToken.length > 4096) return res.status(400).json({ ok: false, errors: [{ name: "IXISalesSigningTokenError", message: "Signing link is invalid." }] });
  const suffix = operation === "complete" ? "/complete" : "";
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${baseUrl()}/sales-signing/${encodeURIComponent(safeToken)}${suffix}`, { method: operation === "complete" ? "POST" : "GET", headers: { Accept: "application/json", ...(operation === "complete" ? { "Content-Type": "application/json", "X-Request-Id": clean(req.headers["x-request-id"] || `sign-${Date.now()}`), "User-Agent": clean(req.headers["user-agent"]), "X-Forwarded-For": clean(req.headers["x-forwarded-for"] || req.socket?.remoteAddress) } : {}) }, ...(operation === "complete" ? { body: JSON.stringify(req.body || {}) } : {}), signal: controller.signal });
    const payload = await response.json(); res.setHeader("Cache-Control", "no-store, private"); return res.status(response.status).json(payload);
  } catch (error) { return res.status(502).json({ ok: false, errors: [{ name: "IXISalesSigningUnavailableError", message: error?.name === "AbortError" ? "Signing service timed out." : "Signing service is unavailable." }] }); }
  finally { clearTimeout(timer); }
}
module.exports = { proxyIXISalesSigning };
