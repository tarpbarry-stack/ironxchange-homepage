import { getIXIAccessToken } from "../../../../lib/ixi-authority/ixiAuthorityProxy";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "GET required." } });
  }

  return res.status(200).json({
    ok: true,
    authenticated: Boolean(getIXIAccessToken(req))
  });
}
