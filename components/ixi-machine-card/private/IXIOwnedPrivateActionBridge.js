const ownedPrivateActions = new Map();

function keyOf(value) {
  return String(value ?? "").trim();
}

export function registerOwnedPrivateActions(objectId, actions) {
  const key = keyOf(objectId);
  if (!key || !actions) return;
  ownedPrivateActions.set(key, actions);
}

export function unregisterOwnedPrivateActions(objectId) {
  const key = keyOf(objectId);
  if (!key) return;
  ownedPrivateActions.delete(key);
}

export function getOwnedPrivateActions(objectId) {
  const key = keyOf(objectId);
  if (!key) return null;
  return ownedPrivateActions.get(key) || null;
}
