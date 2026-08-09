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

  children
}) {
  const objectId =
    String(
      targetObjectId ||
      targetObject?.objectId ||
      ""
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


  /*
   * No active drag:
   * keep target registered but disabled.
   *
   * Active incompatible drag:
   * disabled.
   *
   * Active compatible drag:
   * becomes a true ON target.
   */
  const canAccept =
    Boolean(
      active &&
      acceptance.accepted
    );


  const dropTargetId =
    createIXIDropOnTargetId(
      objectId
    );


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
          IXI_DROP_TARGET_ROLES
            .CONTAINER,

        targetObjectId:
          objectId,

        targetSurface,

        accepted:
          canAccept
      }
    });


  const accepting =
    Boolean(
      canAccept &&
      isOver
    );


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
