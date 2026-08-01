import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function IXISortableMachineCard({
  id,
  containerId,
  className,
  style: externalStyle,
  children
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: String(id),
    data: {
      type: "machine",
      containerId
    }
  });

  const style = {
  ...(externalStyle || {}),
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: 1,
  zIndex: isDragging
    ? 9999
    : externalStyle?.zIndex,
  position: isDragging
    ? "relative"
    : externalStyle?.position
};

  return (
    <div
      ref={setNodeRef}
      className={className}
      style={style}
      data-ixi-sortable-card={String(id)}
      data-ixi-container={containerId}
    >
      {children({
        dragHandleProps: {
          ref: setActivatorNodeRef,
          ...attributes,
          ...listeners
        },
        isDragging
      })}
    </div>
  );
}
