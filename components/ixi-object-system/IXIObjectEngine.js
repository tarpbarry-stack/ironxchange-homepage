export const IXI_OBJECT_TYPES = {
  MACHINE: "machine-object",
  SELLER: "seller-object",
  EVENT: "event-object",
  LOT: "lot-object",
  CUSTOM_CONTAINER: "custom-container",
  THEATER_SESSION: "theater-session",
  WORKSPACE_OBJECT: "workspace-object",
  PASSPORT: "passport-object"
};

export function createIXIObject({
  id,
  type,
  ownerId = "",
  parentId = "",
  data = {}
}) {
  const now = new Date().toISOString();

  return {
    id: String(id),
    type,
    ownerId: String(ownerId || ""),
    parentId: String(parentId || ""),
    createdAt: now,
    updatedAt: now,
    data
  };
}

export function isObjectType(object, type) {
  return object?.type === type;
}

export function isMachineObject(object) {
  return isObjectType(object, IXI_OBJECT_TYPES.MACHINE);
}

export function isSellerObject(object) {
  return isObjectType(object, IXI_OBJECT_TYPES.SELLER);
}

export function isEventObject(object) {
  return isObjectType(object, IXI_OBJECT_TYPES.EVENT);
}

export function updateObjectData(object = {}, patch = {}) {
  return {
    ...object,
    updatedAt: new Date().toISOString(),
    data: {
      ...(object.data || {}),
      ...patch
    }
  };
}
