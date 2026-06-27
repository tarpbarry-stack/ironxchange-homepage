export const IXI_RESERVED_STATE_IDS = {
  WORKSPACE_SETTINGS: "__workspaceSettings",
  WORKSPACE_LAYOUT: "__workspaceLayout",
  SELLER_OBJECT_LAYOUT: "__sellerObjectLayout",
  SELLER_OBJECT_SETTINGS: "__sellerObjectSettings",
  THEATER_QUEUE: "__theaterQueue"
};

export function isReservedStateId(id) {
  return String(id || "").startsWith("__");
}

export function getStateRecord(state = {}, id) {
  if (!id) return {};
  return state?.[String(id)] || {};
}

export function setStateRecord(state = {}, id, patch = {}) {
  if (!id) return state;

  return {
    ...(state || {}),
    [String(id)]: {
      ...(state?.[String(id)] || {}),
      ...(patch || {}),
      updatedAt: new Date().toISOString()
    }
  };
}

export function removeReservedRecords(state = {}) {
  return Object.fromEntries(
    Object.entries(state || {}).filter(([id]) => !isReservedStateId(id))
  );
}

export function removeNormalObjectRecords(state = {}) {
  return Object.fromEntries(
    Object.entries(state || {}).filter(([id]) => isReservedStateId(id))
  );
}
