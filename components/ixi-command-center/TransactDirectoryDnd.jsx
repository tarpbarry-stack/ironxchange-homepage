import { DndContext, PointerSensor, KeyboardSensor, pointerWithin, useDroppable, useSensor, useSensors, useDraggable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const boardTarget = "transact-object-workspace";
const railTarget = side => `transact-object-rail-${side}`;
const tileId = id => `transact-object:${id}`;

export function TransactDirectoryDnd({ leftItems, rightItems, onReorder, onMove, onSelect, children }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const sides = { left: leftItems.map(item => String(item.id)), right: rightItems.map(item => String(item.id)) };
  return <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={({ active, over }) => {
    const id = String(active?.data?.current?.objectId || "");
    const source = active?.data?.current?.side || "board";
    const targetSide = over?.data?.current?.side;
    const targetId = String(over?.data?.current?.objectId || "");
    if (!id || !over) return;
    if (String(over.id) === boardTarget && source !== "board") {
      const item = [...leftItems, ...rightItems].find(value => String(value.id) === id);
      if (item) onSelect(item);
    } else if (targetSide && targetSide !== source) onMove(id, targetSide);
    else if (targetSide && source === targetSide && targetId && targetId !== id)
      onReorder(source, sides[source], id, targetId);
  }}>{children}</DndContext>;
}

export function TransactDirectoryList({ items, side, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: railTarget(side), data: { side } });
  return <div ref={setNodeRef} data-drop-over={isOver || undefined}>
    <SortableContext items={items.map(item => tileId(item.id))} strategy={verticalListSortingStrategy}>{children}</SortableContext>
  </div>;
}

export function TransactDirectoryTile({ item, side, children }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: tileId(item.id), data: { objectId: String(item.id), side } });
  return <div role="listitem" ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? .55 : 1, position: "relative" }}>
    {children({ ...attributes, ...listeners, ref: setActivatorNodeRef })}
  </div>;
}

export function TransactBoardDrag({ item }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: `transact-board:${item.id}`, data: { objectId: String(item.id), side: "board" } });
  return <button type="button" ref={setNodeRef} {...attributes} {...listeners} aria-label={`Drag ${item.title} to a rail`} title="Drag to a rail" style={{ touchAction: "none" }}>⠿</button>;
}

export function TransactWorkspaceDrop({ className, children, ...props }) {
  const { setNodeRef, isOver } = useDroppable({ id: boardTarget });
  return <main {...props} ref={setNodeRef} className={className} style={isOver ? { outline: "2px solid #ffcc00", outlineOffset: -3 } : undefined}>{children}</main>;
}
