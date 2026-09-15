// Reordering a filtered category changes its slots without dropping other apps.
export function mergeVisibleAppOrder(order = [], visibleOrder = []) {
  const current = [...new Set(order)];
  const currentIds = new Set(current);
  const nextVisible = [...new Set(visibleOrder)].filter(id => currentIds.has(id));
  const visibleIds = new Set(nextVisible);
  let position = 0;
  return current.map(id => visibleIds.has(id) ? nextVisible[position++] : id);
}
