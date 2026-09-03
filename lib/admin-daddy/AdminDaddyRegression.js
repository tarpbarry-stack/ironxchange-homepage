function clean(value) { return String(value ?? "").trim(); }
function pct(value) { const n = Number(value); return Number.isFinite(n) ? n : 0; }

function compareRates({ baseline = {}, current = {}, minimumDrop = 15, criticalDrop = 40 } = {}) {
  const keys = Array.from(new Set([...Object.keys(baseline || {}), ...Object.keys(current || {})]));
  return keys.map(key => {
    const before = pct(baseline[key]);
    const now = pct(current[key]);
    const delta = now - before;
    const drop = before - now;
    const severity = drop >= criticalDrop ? "critical" : drop >= minimumDrop ? "action" : drop > 0 ? "watch" : "info";
    return { key: clean(key), baseline: before, current: now, delta, drop, severity, regressed: drop >= minimumDrop };
  }).sort((a, b) => b.drop - a.drop);
}

function buildRegressionEvents({ source, baseline = {}, current = {}, affectedByField = {} } = {}) {
  return compareRates({ baseline, current })
    .filter(item => item.regressed)
    .map(item => ({
      sourceSystem: "acquisition",
      sourceComponent: clean(source),
      eventType: "parser-regression",
      severity: item.severity,
      title: `${clean(source) || "Acquisition"} ${item.key} degraded`,
      detail: `${item.baseline.toFixed(1)}% → ${item.current.toFixed(1)}% (${item.delta.toFixed(1)} pts)`,
      targetType: "acquisition-source",
      targetId: clean(source),
      metrics: { field: item.key, baseline: item.baseline, current: item.current, drop: item.drop, affected: Number(affectedByField?.[item.key] || 0) },
      actionable: item.severity === "critical" || item.severity === "action"
    }));
}

module.exports = { compareRates, buildRegressionEvents };
