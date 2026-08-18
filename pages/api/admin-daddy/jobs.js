import { resolveAosBrowserSession } from "../../../lib/server/aos/resolveAosBrowserSession";
import { requestIxCoreMos, resolveIxCoreAosContext } from "../../../lib/server/aos/ixiMosInternalClient";

function clean(value) { return String(value ?? "").trim(); }

function summarize(jobs = []) {
  const summary = { total: 0, queued: 0, running: 0, retrying: 0, failed: 0, dead: 0, succeeded: 0, cancelled: 0 };
  for (const job of jobs) {
    summary.total += 1;
    const status = clean(job.status).toLowerCase();
    if (Object.prototype.hasOwnProperty.call(summary, status)) summary[status] += 1;
    else if (status === "complete" || status === "completed" || status === "created") summary.succeeded += 1;
    else if (status === "failed-retryable") summary.retrying += 1;
  }
  return summary;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "GET required." } });
  }

  try {
    const session = await resolveAosBrowserSession(req, res);
    const context = await resolveIxCoreAosContext({ session });
    const status = clean(req.query.status);
    const query = new URLSearchParams({ entityId: context.entityId });
    if (status) query.set("status", status);

    const payload = await requestIxCoreMos({
      path: `/imports/jobs?${query.toString()}`,
      principalId: context.userId,
      entityId: context.entityId
    });

    const jobs = Array.isArray(payload?.jobs) ? payload.jobs : [];
    return res.status(200).json({ ok: true, entityId: context.entityId, summary: summarize(jobs), jobs });
  } catch (error) {
    return res.status(Number(error?.status || 500)).json({ ok: false, error: { code: error?.code || "ADMIN_DADDY_JOBS_FAILED", message: error?.message || "Admin Daddy could not load jobs." } });
  }
}
