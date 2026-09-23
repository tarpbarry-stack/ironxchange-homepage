import { forwardIXIMedia } from "../../../../lib/server/media/forwardIXIMedia";
export default function handler(req, res) {
  const machineKey = typeof req.query.machineKey === "string" ? req.query.machineKey.trim() : "";
  if (!machineKey) return res.status(400).json({ ok: false, error: "Missing machine key" });
  return forwardIXIMedia(req, res, { action: "manifest", path: `/media/machines/${encodeURIComponent(machineKey)}`, method: "GET", body: { machineKey } });
}
