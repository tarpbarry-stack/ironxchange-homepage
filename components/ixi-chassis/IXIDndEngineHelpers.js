import {
  closestCenter,
  pointerWithin
} from "@dnd-kit/core";

export function workspaceCollisionDetection(args) {
  const pointerHits = pointerWithin(args);

  if (pointerHits.length) {
    return pointerHits;
  }

  return closestCenter(args);
}

export function createWorkspaceDragStartHandler({
  setActiveDndId
}) {
  return function handleWorkspaceDragStart(event) {
    const dragId = String(event?.active?.id || "");

    if (!dragId) return;

    setActiveDndId(dragId);
  };
}

export function createWorkspaceDragCancelHandler({
  setActiveDndId,
  clearMachineDragState
}) {
  return function handleWorkspaceDragCancel() {
    setActiveDndId("");
    clearMachineDragState();
  };
}
