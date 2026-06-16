import { useDroppable } from "@dnd-kit/core";

export default function WorkspaceDropZone({
  id,
  className,
  children,
  ...props
}) {
  const { setNodeRef } = useDroppable({
    id
  });

  return (
    <section
      ref={setNodeRef}
      className={className}
      {...props}
    >
      {children}
    </section>
  );
}
