import { forwardIXIMedia } from "../../../../lib/server/media/forwardIXIMedia";
export default function handler(req, res) {
  const jobId = typeof req.query.jobId === "string" ? req.query.jobId.trim() : "";
  if (!jobId) return res.status(400).json({ ok: false, error: "Missing job ID" });
  return forwardIXIMedia(req, res, { action: "job", path: `/media/jobs/${encodeURIComponent(jobId)}`, method: "GET", body: { jobId } });
}
