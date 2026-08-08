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

  className,
  style: externalStyle,

  children
}) {
  const sortableId =
    clean(id);

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

  const style = {
    ...(
      externalStyle ||
      {}
    ),

    transform:
      CSS.Transform.toString(
        transform
      ),

    transition,

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
