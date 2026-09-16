// Dashboard placement is a user view. It never changes inventory or identity.
export const dashboardId = item => String(item?.id?.uuid || item?.id || item?.uuid || "").trim();
export const passportOf = item => String(item?.canonicalIdentity?.passportId || item?.passportId || item?.publicData?.passportId || item?.ixiMedia?.passportId || "").trim();
export const dashboardKey = item => passportOf(item) ? `passport:${passportOf(item)}` : `listing:${dashboardId(item)}`;

export function uniqueMachines(items = []) {
  const seen = new Set();
  return items.filter(item => {
    if (!dashboardId(item)) return false;
    const key = dashboardKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function relationshipIds(savedIds = [], state = {}) {
  return [...new Set([...savedIds.map(String), ...Object.entries(state)
    .filter(([id, value]) => !id.startsWith("__") && value && (
      (value.color && value.color !== "none") || Number(value.outline) > 1 ||
      value.saved === true || value.pinned === true || value.noted === true
    )).map(([id]) => id)])];
}

export function collectRelationships({ authored = [], owned = [], publicListings = [], ids = [] }) {
  const ownedKeys = new Set(owned.map(dashboardKey));
  const linked = new Set(ids.map(String));
  return uniqueMachines([...authored, ...publicListings.filter(item => linked.has(dashboardId(item)) || linked.has(passportOf(item)))])
    .filter(item => !ownedKeys.has(dashboardKey(item)))
    .filter(item => !["sold", "archived", "deleted"].includes(String(item.inventoryLifecycle?.state || item.listingStatus || "").toLowerCase()));
}

export function reconcileOpenKeys(keys = [], machines = [], { complete = true } = {}) {
  const known = new Set(machines.map(dashboardKey));
  return [...new Set(keys.filter(key => typeof key === "string"))].filter(key => !complete || known.has(key));
}

const VIEW_FIELDS = new Set(["face", "consoleSlots", "consoleLeftOpen", "consoleRightOpen", "consoleLeftFace", "consoleRightFace", "consoleUpdatedAt", "transactOpen", "transactConsoleDepth", "transactConsoleSlots", "transactUpdatedAt", "transactModuleOrder", "machineWorkspaceOrderBySlot"]);
export function viewPatch(patch = {}) {
  return Object.fromEntries(Object.entries(patch).filter(([key]) => VIEW_FIELDS.has(key)));
}
export function relationshipPatch(patch = {}) {
  return Object.fromEntries(Object.entries(patch).filter(([key]) => ["color", "outline", "saved", "pinned", "noted"].includes(key)));
}
export function restoreDashboard(raw) {
  if (!raw || raw.version !== 1) return null;
  const states = raw.states && typeof raw.states === "object" && !Array.isArray(raw.states) ? raw.states : {};
  return {
    version: 1,
    open: Array.isArray(raw.open) ? [...new Set(raw.open.filter(value => typeof value === "string"))].slice(0, 100) : [],
    states: Object.fromEntries(Object.entries(states).filter(([key]) => !["__proto__", "constructor", "prototype"].includes(key)).map(([key, value]) => [key, viewPatch(value || {})])),
    size: ["natural", "work", "focus"].includes(raw.size) ? raw.size : "work",
    ownedFilter: ["all", "live", "private", "auction"].includes(raw.ownedFilter) ? raw.ownedFilter : "all",
    leftQuery: String(raw.leftQuery || "").slice(0, 200),
    rightQuery: String(raw.rightQuery || "").slice(0, 200),
    scroll: Math.max(0, Number(raw.scroll) || 0)
  };
}

export function filterMachineSearch(items, query) {
  const terms = String(query || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter(item => {
    const data = item.publicData || {};
    const value = [item.title, item.make, item.model, item.year, item.serialNumber, data.serialNumber,
      item.stockNumber, passportOf(item), item.location].join(" ").toLowerCase();
    return terms.every(term => value.includes(term));
  });
}

export function verifiedInquiryCount(response) {
  const count = response?.data?.meta?.totalItems;
  return Number.isInteger(count) && count >= 0 ? count : null;
}
