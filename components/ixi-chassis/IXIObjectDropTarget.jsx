import {
  useEffect
} from "react";

import {
  useDndContext,
  useDroppable
} from "@dnd-kit/core";

import {
  createIXIDropOnTargetId,
  IXI_DROP_INTENTS,
  IXI_DROP_TARGET_ROLES
} from "./IXIDropIntentEngine";

import {
  canIXIObjectAcceptDrop
} from "./IXIDropAcceptanceEngine";


export default function IXIObjectDropTarget({
  targetObject,

  targetObjectId,

  targetSurface = "",

  className = "",

  onDropStateChange,

  children
}) {
  const objectId =
    String(
      targetObjectId ||
      targetObject?.objectId ||
      ""
    );

  const dropTargetId =
    createIXIDropOnTargetId(
      objectId
    );

  const {
    active
  } =
    useDndContext();

  const dragData =
    active?.data?.current ||
    {};

  const acceptance =
    canIXIObjectAcceptDrop({
      dragData,

      target:
        targetObject,

      targetObjectId:
        objectId
    });

  const canAccept =
    Boolean(
      active &&
      acceptance.accepted
    );

 /*
 * A container participates in collision
 * detection only when it can actually
 * accept the active draggable.
 *
 * Rejected targets must not be allowed
 * to shadow Board / Pocket / Stack
 * droppables underneath them.
 */
  const {
  setNodeRef,
  isOver
} =
  useDroppable({
    id:
      dropTargetId,

    disabled:
      !canAccept,

    data: {
      type:
        "ixi-drop-target",

      dropIntent:
        IXI_DROP_INTENTS.ON,

      targetRole:
        IXI_DROP_TARGET_ROLES.CONTAINER,

      targetObjectId:
        objectId,

      targetSurface,

      accepted:
        canAccept
    }
  });

  const accepting =
    Boolean(
      active &&
      canAccept &&
      isOver
    );

  useEffect(() => {
    onDropStateChange?.({
      accepting,
      canAccept,
      acceptance,
      dropTargetId
    });
  }, [
    accepting,
    canAccept,
    dropTargetId
  ]);

  return (
    <div
      ref={
        setNodeRef
      }

      className={[
        "ixi-object-drop-target",

        accepting
          ? "ixi-drop-accepting"
          : "",

        canAccept
          ? "ixi-drop-enabled"
          : "",

        className
      ]
        .filter(Boolean)
        .join(" ")}

      data-ixi-drop-target={
        dropTargetId
      }

      data-ixi-drop-accepting={
        accepting
          ? "true"
          : "false"
      }

      data-ixi-drop-enabled={
        canAccept
          ? "true"
          : "false"
      }
    >
      {typeof children ===
      "function"
        ? children({
            accepting,
            canAccept,
            acceptance,
            dropTargetId
          })
        : children}
    </div>
  );
}
