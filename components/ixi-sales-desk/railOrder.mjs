// Preserve unseen records when a search or pagination exposes only part of a rail.
export function readRailOrder(value) {
  return Array.isArray(value) ? [...new Set(value.filter(id=>typeof id==="string" && id.length>0))] : [];
}
export function orderedRailIds(saved,available) {
  const present=new Set(available);
  return [...new Set([...readRailOrder(saved).filter(id=>present.has(id)),...available])];
}
export function moveRailItem(saved,available,visible,active,over) {
  if(active===over || !visible.includes(active) || !visible.includes(over)) return saved;
  const full=[...new Set([...readRailOrder(saved),...available])];
  const moved=[...visible];
  moved.splice(moved.indexOf(active),1);
  moved.splice(visible.indexOf(over),0,active);
  const shown=new Set(visible);
  let index=0;
  return full.map(id=>shown.has(id) ? moved[index++] : id);
}
export function railStorageKey(actor,rail) {
  return actor?.entityId && actor?.actorId ? `ixi:sales-rail:v1:${encodeURIComponent(actor.entityId)}:${encodeURIComponent(actor.actorId)}:${rail}` : "";
}
