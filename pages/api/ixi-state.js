export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  return res.status(410).json({
    ok: false,
    error: "Retired frontend state endpoint",
    replacement: "/ix-core/ixi-machine-state"
  });
}
