import { proxyIXIAuthorityRequest } from "../../../../lib/ixi-authority/ixiAuthorityProxy";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "GET required." } });
  }

  return proxyIXIAuthorityRequest({
    req,
    res,
    path: "/authority/access-context",
    method: "GET"
  });
}
