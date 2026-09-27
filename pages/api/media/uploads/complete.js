import { forwardIXIMedia } from "../../../../lib/server/media/forwardIXIMedia";
export default function handler(req, res) {
  return forwardIXIMedia(req, res, { action: "complete", path: "/media/uploads/complete", method: "POST", body: req.body || {} });
}
