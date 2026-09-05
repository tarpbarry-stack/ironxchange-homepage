import {
  useDndContext
} from "@dnd-kit/core";

import {
  useSortable
} from "@dnd-kit/sortable";

import {
  CSS
} from "@dnd-kit/utilities";

function clean(value) {
  return String(
    value || ""
  ).trim();
}

export default function IXISortableObject({
  id,

  containerId = "board",

  objectType = "object",
  objectFamily = "",

  dragData = {},

  disabled = false,

  reorderBehavior = "normal",

  dataWorkspaceFootprint = null,

  className,
  style: externalStyle,

  children
}) {
  const sortableId =
    clean(id);

 const {
  active: contextActive
} = useDndContext();

const activeId =
  clean(
    contextActive?.id
  );
  
const isSelfDragging =
  Boolean(
    activeId &&
    activeId === sortableId
  );

const suppressForeignTransform =
  Boolean(
    reorderBehavior === "self-only" &&
    activeId &&
    !isSelfDragging
  );

  const resolvedObjectType =
    clean(objectType) ||
    "object";

  const resolvedObjectFamily =
    clean(objectFamily);

  const {
    attributes,
    listeners,

    setNodeRef,
    setActivatorNodeRef,

    transform,
    transition,

    isDragging,
    over,
    active
  } =
    useSortable({
      id:
        sortableId,

      disabled,

      data: {
        /*
         * UNIVERSAL IXI DND CONTRACT
         *
         * "type" describes the DnD
         * protocol — NOT the business
         * object type.
         */
        type:
          "ixi-object",

        objectId:
          sortableId,

        objectType:
          resolvedObjectType,

        objectFamily:
          resolvedObjectFamily,

        containerId:
          clean(containerId),

        /*
         * Additional environment /
         * relationship information may
         * be supplied without changing
         * the universal wrapper.
         */
        ...(
          dragData &&
          typeof dragData === "object"
            ? dragData
            : {}
        )
      }
    });

const effectiveTransform =
  suppressForeignTransform
    ? null
    : transform;
  
  const style = {
    ...(
      externalStyle ||
      {}
    ),

   transform:
  CSS.Transform.toString(
    effectiveTransform
  ),

    transition: [
      transition,
      externalStyle?.transition
    ]
      .filter(Boolean)
      .join(", ") || undefined,

    /*
     * Keep existing chassis behavior
     * for the first migration stage.
     *
     * Global DragOverlay comes next.
     */
    opacity:
      isDragging
        ? 0
        : 1,

    zIndex:
      isDragging
        ? 9999
        : externalStyle?.zIndex
  };

  const dragHandleProps = {
    ref:
      setActivatorNodeRef,

    ...attributes,
    ...listeners
  };

  const footprint =
    dataWorkspaceFootprint &&
    typeof dataWorkspaceFootprint ===
      "object"
      ? dataWorkspaceFootprint
      : null;

  return (
    <div
      ref={
        setNodeRef
      }

      className={
        className
      }

      style={
        style
      }

      data-ixi-sortable-object={
        sortableId
      }

      data-ixi-object-type={
        resolvedObjectType
      }

      data-ixi-object-family={
        resolvedObjectFamily
      }

      data-ixi-container={
        clean(
          containerId
        )
      }

      data-ixi-card-family={
        footprint?.cardFamily ||
        resolvedObjectFamily
      }

      data-ixi-console-slots={
        footprint?.consoleSlotCount ||
        1
      }

      data-ixi-footprint-width={
        footprint?.renderedWidth ||
        undefined
      }

      data-ixi-footprint-height={
        footprint?.renderedHeight ||
        undefined
      }
    >
      {typeof children ===
      "function"
        ? children({
            dragHandleProps,
            isDragging,
            active,
            over
          })
        : children}
    </div>
  );
}
