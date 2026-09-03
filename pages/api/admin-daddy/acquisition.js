import { resolveAosBrowserSession } from "../../../lib/server/aos/resolveAosBrowserSession";
import { requestIxCoreMos, resolveIxCoreAosContext } from "../../../lib/server/aos/ixiMosInternalClient";
const { buildRegressionEvents } = require("../../../lib/admin-daddy/AdminDaddyRegression");

function clean(value) { return String(value ?? "").trim(); }
function number(value) { const n = Number(value); return Number.isFinite(n) ? n : 0; }

function getSource(event = {}) {
  return clean(
    event.sourceComponent ||
    event.source ||
    event.metadata?.source ||
    event.metadata?.platform ||
    event.payload?.source ||
    event.payload?.platform
  ).toLowerCase();
}

function getRates(event = {}) {
  const candidate = event.metrics?.fieldCompleteness || event.metrics?.rates || event.metadata?.fieldCompleteness || event.payload?.fieldCompleteness || {};
  return candidate && typeof candidate === "object" && !Array.isArray(candidate) ? candidate : {};
}

function aggregate(events = []) {
  const bySource = new Map();
  for (const event of events) {
    const source = getSource(event);
    if (!source) continue;
    const row = bySource.get(source) || { source, total: 0, success: 0, failed: 0, latestAt: null, latestRates: {}, priorRates: {} };
    row.total += 1;
    const type = clean(event.eventType).toLowerCase();
    const status = clean(event.status || event.metrics?.status || event.metadata?.status).toLowerCase();
    if (type.includes("fail") || status === "failed") row.failed += 1;
    else if (type.includes("success") || type.includes("complete") || status === "complete" || status === "succeeded") row.success += 1;
    const at = event.occurredAt || event.createdAt || event.timestamp || null;
    const rates = getRates(event);
    if (at && (!row.latestAt || new Date(at).getTime() > new Date(row.latestAt).getTime())) {
      row.priorRates = row.latestRates;
      row.latestRates = rates;
      row.latestAt = at;
    }
    bySource.set(source, row);
  }
  return Array.from(bySource.values()).map(row => ({
    ...row,
    successRate: row.total ? ((row.success / row.total) * 100) : 0,
    failureRate: row.total ? ((row.failed / row.total) * 100) : 0
  })).sort((a,b) => b.total - a.total);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok:false, error:{ code:"METHOD_NOT_ALLOWED", message:"GET required." } });
  }

  try {
    const session = await resolveAosBrowserSession(req, res);
    const context = await resolveIxCoreAosContext({ session });
    const payload = await requestIxCoreMos({
      path: `/events?entityId=${encodeURIComponent(context.entityId)}`,
      principalId: context.userId,
      entityId: context.entityId
    });
    const events = (Array.isArray(payload?.events) ? payload.events : []).filter(event => {
      const system = clean(event.sourceSystem).toLowerCase();
      const type = clean(event.eventType).toLowerCase();
      return system === "acquisition" || type.includes("acquisition") || type.includes("parser") || type.includes("import");
    });
    const sources = aggregate(events);
    const regressions = sources.flatMap(source => buildRegressionEvents({
      source: source.source,
      baseline: source.priorRates,
      current: source.latestRates
    }));
    return res.status(200).json({ ok:true, live:true, entityId:context.entityId, eventCount:events.length, sources, regressions });
  } catch (error) {
    return res.status(Number(error?.status || 500)).json({ ok:false, error:{ code:error?.code || "ADMIN_DADDY_ACQUISITION_FAILED", message:error?.message || "Admin Daddy could not load acquisition telemetry." } });
  }
}
