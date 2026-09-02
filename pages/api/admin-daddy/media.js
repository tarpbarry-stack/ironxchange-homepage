const { getIXIAccessToken, getIXICoreBaseUrl } = require("../../../lib/ixi-authority/ixiAuthorityProxy");
const { summarizeMediaHealth } = require("../../../lib/admin-daddy/AdminDaddyMediaHealth");

async function readJson(response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) : null; } catch { return null; }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok:false, error:{ code:"METHOD_NOT_ALLOWED", message:"GET required." } });
  }

  const accessToken = getIXIAccessToken(req);
  if (!accessToken) {
    return res.status(401).json({ ok:false, error:{ code:"IXI_AUTHENTICATION_REQUIRED", message:"IXI authenticated session is required." } });
  }

  const candidates = ["/media/jobs", "/media/health"];
  for (const path of candidates) {
    try {
      const response = await fetch(`${getIXICoreBaseUrl()}${path}`, { headers:{ Accept:"application/json", Authorization:`Bearer ${accessToken}` } });
      if (!response.ok) continue;
      const payload = await readJson(response);
      const jobs = Array.isArray(payload) ? payload : Array.isArray(payload?.jobs) ? payload.jobs : [];
      return res.status(200).json({ ok:true, live:true, source:path, summary:summarizeMediaHealth(jobs), jobs });
    } catch {
      // Try the next compatible IX-Core media projection.
    }
  }

  return res.status(200).json({ ok:true, live:false, source:null, summary:summarizeMediaHealth([]), jobs:[], notice:"IX-Core media list/health projection is not exposed yet; existing per-job media APIs remain unchanged." });
}
