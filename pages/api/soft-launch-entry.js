const COOKIE_NAME = "ixi_soft_launch";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export default function softLaunchEntry(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=entered; Path=/; HttpOnly; SameSite=Lax; Max-Age=${THIRTY_DAYS}${secure}`
  );
  res.setHeader("Cache-Control", "no-store");
  res.redirect(303, "/gateway");
}
