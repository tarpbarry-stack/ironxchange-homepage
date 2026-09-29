import { DndContext, PointerSensor, KeyboardSensor, pointerWithin, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { resolveMachineWorkspaceDrop } from "./machineWorkspaceDrop.mjs";

export default function MachineWorkspaceDnd({ boardKeys, onBoardOrder, onOpen, onReturn, onRailOrder, onMoveRail, children }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function onDragEnd({ active, over }) {
    if (!over) return;
    const drop = resolveMachineWorkspaceDrop(String(active.id), String(over.id), boardKeys);
    if (drop?.type === "open") onOpen(drop.key);
    if (drop?.type === "return") onReturn(drop.key, drop.side);
    if (drop?.type === "rail-order") onRailOrder(drop.side, drop.from, drop.to);
    if (drop?.type === "rail-move") onMoveRail?.(drop.key, drop.side);
    if (drop?.type === "board-order") onBoardOrder(arrayMove(boardKeys, boardKeys.indexOf(drop.from), boardKeys.indexOf(drop.to)));
  }

  return <DndContext sensors={sensors} collisionDetection={args => {
    const hits = pointerWithin(args);
    return hits.length || args.pointerCoordinates ? hits : closestCenter(args);
  }} onDragEnd={onDragEnd}>{children}</DndContext>;
}
