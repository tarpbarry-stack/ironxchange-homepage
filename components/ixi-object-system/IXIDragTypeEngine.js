export const IXI_DRAG_TYPES = {
  MACHINE_OBJECT: "machine-object",
  SELLER_OBJECT: "seller-object",
  SELLER_CHILD_MACHINE: "seller-child-machine",
  CHECKED_OUT_MACHINE: "checked-out-machine",
  EVENT_DECK: "event-deck",
  LOT_OBJECT: "lot-object",
  CUSTOM_CONTAINER: "custom-container"
};

export const IXI_DROP_TYPES = {
  BOARD: "board-dropzone",
  POCKET: "pocket-dropzone",
  STACK: "stack-dropzone",
  SELLER_RETURN: "seller-return-dropzone",
  EVENT_RETURN: "event-return-dropzone",
  THEATER: "theater-dropzone",
  CUSTOM_CONTAINER: "custom-container-dropzone"
};

export function createDragPayload({
  type,
  objectId,
  sourceContainer = "",
  sourceParentId = "",
  sourceParentType = "",
  action = ""
}) {
  return {
    type,
    objectId: String(objectId || ""),
    sourceContainer: String(sourceContainer || ""),
    sourceParentId: String(sourceParentId || ""),
    sourceParentType: String(sourceParentType || ""),
    action: String(action || "")
  };
}

export function createDropPayload({
  type,
  containerId = "",
  parentId = "",
  parentType = ""
}) {
  return {
    type,
    containerId: String(containerId || ""),
    parentId: String(parentId || ""),
    parentType: String(parentType || "")
  };
}

export function isDragType(payload = {}, type) {
  return payload?.type === type;
}

export function isDropType(payload = {}, type) {
  return payload?.type === type;
}

export function isSellerChildDrag(payload = {}) {
  return isDragType(payload, IXI_DRAG_TYPES.SELLER_CHILD_MACHINE);
}

export function isCheckedOutMachineDrag(payload = {}) {
  return isDragType(payload, IXI_DRAG_TYPES.CHECKED_OUT_MACHINE);
}

export function isSellerReturnDrop(payload = {}) {
  return isDropType(payload, IXI_DROP_TYPES.SELLER_RETURN);
}
