function clean(value) { return String(value ?? "").trim().toLowerCase(); }

function reconcileListing(record = {}) {
  const ixi = clean(record.ixiState || record.listingStatus || record.machineChannel);
  const sharetribe = clean(record.sharetribeState || record.state);
  const issues = [];

  if (ixi === "live" && sharetribe && sharetribe !== "published") {
    issues.push({ type: "ixi-live-sharetribe-not-published", severity: "action" });
  }
  if ((ixi === "sold" || ixi === "archived" || ixi === "deleted") && sharetribe === "published") {
    issues.push({ type: "closed-object-still-published", severity: "critical" });
  }
  if (record.requiresPassport && !record.passportId) {
    issues.push({ type: "missing-passport-reference", severity: "action" });
  }
  if (record.requiresMedia && !record.heroImage) {
    issues.push({ type: "missing-hero-image", severity: "watch" });
  }

  return {
    listingId: record.listingId || record.id || "",
    objectId: record.objectId || "",
    passportId: record.passportId || "",
    ixiState: ixi,
    sharetribeState: sharetribe,
    issues,
    healthy: issues.length === 0
  };
}

function reconcileMarketplace(records = []) {
  const reconciled = (Array.isArray(records) ? records : []).map(reconcileListing);
  const conflicts = reconciled.filter(item => !item.healthy);
  const summary = conflicts.reduce((acc, item) => {
    item.issues.forEach(issue => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
    });
    return acc;
  }, {});
  return { generatedAt: new Date().toISOString(), total: reconciled.length, conflictCount: conflicts.length, summary, conflicts };
}

module.exports = { reconcileListing, reconcileMarketplace };
