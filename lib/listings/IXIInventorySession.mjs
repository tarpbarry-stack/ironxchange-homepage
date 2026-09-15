const idOf = item => String(item.canonicalIdentity?.objectId || item.objectId || item.id?.uuid || item.id || "");
export function hasOpenInventoryTransaction(item, state = {}) {
  return [idOf(item), String(item.id?.uuid || item.id || "")].some(id => state[id]?.transactOpen === true);
}
export function preserveOpenInventoryTransactions(previous = [], current = [], state = {}) {
  const ids = new Set(current.map(idOf));
  return [...current, ...previous.filter(item => !ids.has(idOf(item)) && hasOpenInventoryTransaction(item, state))
    .map(item => ({ ...item, inventorySessionOnly: true }))];
}
export function releaseClosedInventoryTransactions(items = [], state = {}) {
  return items.filter(item => !item.inventorySessionOnly || hasOpenInventoryTransaction(item, state));
}
