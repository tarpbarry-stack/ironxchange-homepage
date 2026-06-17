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
export function createWorkspaceDragEndHandler({
  getMachineContainer,
  machineContainers,
  moveMachineWithinContainer,
  moveMachineToContainerAtPosition,
  moveMachineToContainer,
  setActiveStacksOpen,
  setLeftPocketMode,
  setLeftPocket2Mode,
  setRightPocketMode,
  setRightPocket2Mode,
  setActiveDndId,
  clearMachineDragState
}) {
  return function handleWorkspaceDragEnd(event) {
    console.log("IXI DRAG END FACTORY CONNECTED", event);

    setActiveDndId("");
    clearMachineDragState();
  };
}
