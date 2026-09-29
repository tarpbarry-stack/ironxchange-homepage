import { DndContext, PointerSensor, KeyboardSensor, pointerWithin, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const target = "transact-object-workspace";
const tileId = id => `transact-object:${id}`;

export function TransactDirectoryDnd({ items, onReorder, onSelect, children }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const ids = items.map(item => String(item.id));
  return <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={({ active, over }) => {
    const from = String(active?.data?.current?.objectId || "");
    const to = String(over?.data?.current?.objectId || "");
    if (!from || !ids.includes(from) || !over) return;
    if (String(over.id) === target) onSelect(items.find(item => String(item.id) === from));
    else if (to && to !== from && ids.includes(to)) onReorder(ids, from, to);
  }}>{children}</DndContext>;
}

export function TransactDirectoryList({ items, children }) {
  return <SortableContext items={items.map(item => tileId(item.id))} strategy={verticalListSortingStrategy}>{children}</SortableContext>;
}

export function TransactDirectoryTile({ item, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tileId(item.id), data: { objectId: String(item.id) } });
  return <div role="listitem" ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? .55 : 1, position: "relative" }}>
    <button type="button" {...attributes} {...listeners} aria-label={`Drag ${item.title} to reorder or open in workspace`} title="Drag to reorder or open in workspace" style={{ position: "absolute", zIndex: 1, top: 6, right: 6, width: 29, height: 29, border: "1px solid #655622", background: "#191919", color: "#ffcc00", cursor: "grab", touchAction: "none" }}>⠿</button>
    {children}
  </div>;
}

export function TransactWorkspaceDrop({ className, children, ...props }) {
  const { setNodeRef, isOver } = useDroppable({ id: target });
  return <main {...props} ref={setNodeRef} className={className} style={isOver ? { outline: "2px solid #ffcc00", outlineOffset: -3 } : undefined}>{children}</main>;
}
