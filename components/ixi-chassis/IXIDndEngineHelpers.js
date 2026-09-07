import {
  closestCenter,
  pointerWithin
} from "@dnd-kit/core";

import {
  isIXIDropOnTargetId
} from "./IXIDropIntentEngine";

export function universalWorkspaceCollisionDetection(
  args
) {
  const pointerHits =
    pointerWithin(args);

  /*
   * ENTER / ON target has priority.
   *
   * Once the pointer enters a valid
   * nested container target, that
   * target wins over the sortable
   * parent underneath it.
   *
   * This also applies when the source can contain children. The
   * acceptance engine already rejects self-drop, while the sortable
   * chassis keeps foreign containers planted. Filtering every ON target
   * for a container source would make container nesting impossible.
   */
  const onTargetHits =
  pointerHits.filter(
    collision => {
      if (
        !isIXIDropOnTargetId(
          collision?.id
        )
      ) {
        return false;
      }

      const container =
        collision
          ?.data
          ?.droppableContainer ||
        args.droppableContainers
          ?.find?.(
            candidate =>
              candidate?.id ===
                collision?.id
          );

      return (
        container
          ?.data
          ?.current
          ?.accepted === true
      );
    }
  );
  if (
    onTargetHits.length
  ) {
    return onTargetHits;
  }

  /*
   * Normal IXI behavior remains.
   */
  if (
    pointerHits.length
  ) {
    return pointerHits;
  }

  return closestCenter(
    args
  );
}

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
    const dragId = String(event?.active?.id || "");
    const overId = String(event?.over?.id || "");

    const activeSortable =
      event?.active?.data?.current?.sortable;

    const overSortable =
      event?.over?.data?.current?.sortable;

    const knownContainers = [
      "board",
      "stackTop",
      "stackBottom",
      "pocketLeft",
      "pocketRight",
      "pocketLeft2",
      "pocketRight2"
    ];

    const sourceContainer =
      event?.active?.data?.current?.containerId ||
      (knownContainers.includes(activeSortable?.containerId)
        ? activeSortable.containerId
        : getMachineContainer(dragId));

    const targetContainer =
      overSortable?.containerId ||
      event?.over?.data?.current?.containerId ||
      (knownContainers.includes(overId)
        ? overId
        : getMachineContainer(overId));

    console.log("IXI DND DROP", {
      dragId,
      overId,
      sourceContainer,
      targetContainer,
      activeData: event?.active?.data?.current,
      overData: event?.over?.data?.current
    });

    if (!dragId || !overId) {
      setActiveDndId("");
      clearMachineDragState();
      return;
    }

    if (
      sourceContainer &&
      targetContainer &&
      sourceContainer === targetContainer &&
      dragId !== overId
    ) {
      const ids = machineContainers[sourceContainer] || [];

      const fromIndex = ids.findIndex(
        item => String(item) === String(dragId)
      );

      const toIndex = ids.findIndex(
        item => String(item) === String(overId)
      );

      const insertAfter = fromIndex < toIndex;

      moveMachineWithinContainer(
        sourceContainer,
        dragId,
        overId,
        insertAfter
      );

      setActiveDndId("");
      clearMachineDragState();
      return;
    }

    if (
      sourceContainer !== "board" &&
      targetContainer === "board" &&
      overId &&
      overId !== "board" &&
      dragId !== overId
    ) {
      console.log("IXI INSERT TO BOARD", {
        dragId,
        overId,
        sourceContainer,
        targetContainer
      });

      moveMachineToContainerAtPosition(
        dragId,
        "board",
        overId,
        false
      );

      setActiveDndId("");
      clearMachineDragState();
      return;
    }

    if (
      targetContainer &&
      targetContainer !== sourceContainer &&
      [
        "board",
        "stackTop",
        "stackBottom",
        "pocketLeft",
        "pocketRight",
        "pocketLeft2",
        "pocketRight2"
      ].includes(targetContainer)
    ) {
      moveMachineToContainer(dragId, targetContainer);

      if (targetContainer === "stackTop") {
        setActiveStacksOpen(current => ({
          ...current,
          top: true
        }));
      }

      if (targetContainer === "stackBottom") {
        setActiveStacksOpen(current => ({
          ...current,
          bottom: true
        }));
      }

      if (targetContainer === "pocketLeft") {
        setLeftPocketMode("peek");
      }

      if (targetContainer === "pocketLeft2") {
        setLeftPocket2Mode("peek");
      }

      if (targetContainer === "pocketRight") {
        setRightPocketMode("peek");
      }

      if (targetContainer === "pocketRight2") {
        setRightPocket2Mode("peek");
      }

      setActiveDndId("");
      clearMachineDragState();
      return;
    }

    setActiveDndId("");
    clearMachineDragState();
  };
}
