// Browser-only view preference. It never enters IX-Core or financial commands.
export function readTransactDirectoryOrder(key, storage = globalThis.localStorage) {
  if (!key || !storage) return [];
  try { const saved = JSON.parse(storage.getItem(key) || "[]"); return Array.isArray(saved) ? saved.filter(id => typeof id === "string") : []; }
  catch { return []; }
}

export function writeTransactDirectoryOrder(key, ids, storage = globalThis.localStorage) {
  if (!key || !storage) return;
  try { storage.setItem(key, JSON.stringify(ids)); } catch { /* Optional view order. */ }
}

export function readTransactRailPlacement(key, storage = globalThis.localStorage) {
  if (!key || !storage) return {};
  try {
    const saved = JSON.parse(storage.getItem(`${key}:rails`) || "{}");
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
    return Object.fromEntries(Object.entries(saved).filter(([id, side]) =>
      id && !["__proto__", "constructor", "prototype"].includes(id) && ["left", "right"].includes(side)));
  } catch { return {}; }
}

export function writeTransactRailPlacement(key, placement, storage = globalThis.localStorage) {
  if (!key || !storage) return;
  try { storage.setItem(`${key}:rails`, JSON.stringify(placement)); } catch { /* Optional layout preference. */ }
}
