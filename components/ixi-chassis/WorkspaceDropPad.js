import { useDroppable } from "@dnd-kit/core";

export default function WorkspaceDropPad({
  id,
  className,
  style,
  ...props
}) {
  const { setNodeRef } = useDroppable({
    id
  });

  return (
    <div
      ref={setNodeRef}
      className={className}
      style={style}
      {...props}
    />
  );
}
