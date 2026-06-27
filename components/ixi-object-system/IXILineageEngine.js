export const IXI_RETURN_RULES = {
  ORIGINAL_PARENT_ONLY: "original-parent-only"
};

export const IXI_CHECKOUT_REASONS = {
  DRAG_OUT: "drag-out",
  POCKET_SEND: "pocket-send",
  STACK_SEND: "stack-send",
  BOARD_SEND: "board-send",
  CUSTOM_CONTAINER_ADD: "custom-container-add"
};

export function createCheckoutRecord({
  objectId,
  sourceParentId,
  sourceParentType = "seller-object",
  sourceDeckId = "",
  checkoutContainer = "board",
  checkoutReason = IXI_CHECKOUT_REASONS.DRAG_OUT
}) {
  const now = new Date().toISOString();

  return {
    objectId: String(objectId || ""),
    checkedOutFromParent: true,
    sourceParentId: String(sourceParentId || ""),
    sourceParentType,
    sourceDeckId: String(sourceDeckId || ""),
    checkoutContainer,
    checkoutReason,
    returnRule: IXI_RETURN_RULES.ORIGINAL_PARENT_ONLY,
    createdAt: now,
    updatedAt: now
  };
}

export function markCheckedOutFromParent(currentState = {}, checkoutRecord = {}) {
  return {
    ...currentState,
    ...checkoutRecord,
    checkedOutFromParent: true,
    updatedAt: new Date().toISOString()
  };
}

export function canReturnToParent({ objectState = {}, targetParentId }) {
  if (!objectState?.checkedOutFromParent) return false;
  if (!objectState?.sourceParentId) return false;
  if (!targetParentId) return false;

  return String(objectState.sourceParentId) === String(targetParentId);
}

export function returnCheckedOutToParent(currentState = {}) {
  return {
    ...currentState,
    checkedOutFromParent: false,
    checkoutContainer: "",
    checkoutReason: "",
    updatedAt: new Date().toISOString()
  };
}

export function isTemporaryBoardCheckout(objectState = {}) {
  return (
    objectState?.checkedOutFromParent === true &&
    objectState?.checkoutContainer === "board" &&
    !objectState?.saved &&
    !objectState?.pinned &&
    !objectState?.noted &&
    (!objectState?.color || objectState.color === "none") &&
    Number(objectState?.outline || 0) <= 1
  );
}
