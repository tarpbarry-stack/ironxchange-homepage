import { forwardIXIMedia } from "../../../../lib/server/media/forwardIXIMedia";
export default function handler(req, res) {
  return forwardIXIMedia(req, res, { action: "init", path: "/media/uploads/init", method: "POST", body: req.body || {} });
}
