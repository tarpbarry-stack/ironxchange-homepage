export const IXI_CONTAINER_TYPES = {
  BOARD: "board",
  POCKET: "pocket",
  STACK: "stack",
  SELLER_DECK: "seller-deck",
  EVENT_DECK: "event-deck",
  THEATER_RAIL: "theater-rail",
  THEATER_STACK: "theater-stack",
  CUSTOM_CONTAINER: "custom-container",
  AUCTION_BOARD: "auction-board"
};

export function createIXIContainer({
  id,
  type,
  ownerId = "",
  parentId = "",
  objectIds = []
}) {
  const now = new Date().toISOString();

  return {
    id: String(id || ""),
    type,
    ownerId: String(ownerId || ""),
    parentId: String(parentId || ""),
    objectIds: Array.isArray(objectIds) ? objectIds.map(String) : [],
    createdAt: now,
    updatedAt: now
  };
}

export function addObjectToContainer(container = {}, objectId) {
  const id = String(objectId || "");
  if (!id) return container;

  const existing = Array.isArray(container.objectIds)
    ? container.objectIds.map(String)
    : [];

  if (existing.includes(id)) return container;

  return {
    ...container,
    objectIds: [...existing, id],
    updatedAt: new Date().toISOString()
  };
}

export function removeObjectFromContainer(container = {}, objectId) {
  const id = String(objectId || "");

  return {
    ...container,
    objectIds: Array.isArray(container.objectIds)
      ? container.objectIds.map(String).filter(itemId => itemId !== id)
      : [],
    updatedAt: new Date().toISOString()
  };
}

export function moveObjectBetweenContainers({
  sourceContainer = {},
  targetContainer = {},
  objectId
}) {
  return {
    sourceContainer: removeObjectFromContainer(sourceContainer, objectId),
    targetContainer: addObjectToContainer(targetContainer, objectId)
  };
}

export function canContainerAcceptObject({
  container = {},
  objectState = {},
  sourceParentId = ""
}) {
  if (!container?.type) return false;

  if (
    container.type === IXI_CONTAINER_TYPES.SELLER_DECK ||
    container.type === IXI_CONTAINER_TYPES.EVENT_DECK
  ) {
    const requiredParentId =
      objectState?.sourceParentId || sourceParentId || "";

    return (
      requiredParentId &&
      String(container.parentId || container.ownerId || "") ===
        String(requiredParentId)
    );
  }

  return true;
}
