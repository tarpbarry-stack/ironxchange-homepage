import { getIXICoreBaseUrl } from "../../../../lib/ixi-authority/ixiAuthorityProxy";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "GET required." } });
  }

  const upstream = await fetch(`${getIXICoreBaseUrl()}/authority/health`, {
    method: "GET",
    headers: { Accept: "application/json" }
  });

  const payload = await upstream.json().catch(() => ({
    ok: false,
    error: {
      code: "IXI_AUTHORITY_BAD_UPSTREAM_RESPONSE",
      message: "IXI Core returned a non-JSON response."
    }
  }));

  return res.status(upstream.status).json(payload);
}
