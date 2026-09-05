import { useEffect, useMemo, useState } from "react";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  moveIXITransactModule,
  reconcileIXITransactModuleOrder,
} from "./IXITransactModuleOrder";

const clean = value => String(value ?? "").trim();

function stopDragActivation(event) {
  event.stopPropagation();
}

function ModuleCopy({ item, openControl = false }) {
  return (
    <div className="tx-app-content">
      <span className="tx-app-group">{clean(item?.group).toUpperCase()}</span>
      {openControl ? (
        <button
          type="button"
          className="tx-app-open"
          onPointerDown={stopDragActivation}
          onMouseDown={stopDragActivation}
          onTouchStart={stopDragActivation}
          onKeyDown={stopDragActivation}
          onClick={() => item?.onOpen?.()}
          aria-label={`Open ${clean(item?.label) || "TRANSACT app"}`}
        >
          {item?.label}
        </button>
      ) : (
        <strong className="tx-app-open">{item?.label}</strong>
      )}
      <small className="tx-app-document">{item?.documentType}</small>
    </div>
  );
}

function SortableModuleTile({ item, onOpen }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: "ixi-transact-module",
      moduleId: item.id,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`tx-app-tile ${isDragging ? "tx-app-tile-dragging" : ""}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      data-ixi-transact-module={item.id}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="tx-app-drag-surface"
        aria-label={`Reorder ${item.label}`}
        {...attributes}
        {...listeners}
      />
      <ModuleCopy item={{ ...item, onOpen: () => onOpen?.(item) }} openControl />
    </div>
  );
}

export default function IXITransactSortableLauncher({
  modules = [],
  moduleOrder = null,
  onOpen = null,
  onOrderChange = null,
}) {
  const moduleIds = useMemo(
    () => modules.map(item => clean(item?.id)).filter(Boolean),
    [modules],
  );
  const moduleKey = moduleIds.join("|");
  const savedOrderKey = Array.isArray(moduleOrder)
    ? moduleOrder.map(clean).join("|")
    : "";
  const [orderedIds, setOrderedIds] = useState(() =>
    reconcileIXITransactModuleOrder(moduleOrder, moduleIds),
  );
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    setOrderedIds(
      reconcileIXITransactModuleOrder(moduleOrder, moduleIds),
    );
  }, [savedOrderKey, moduleKey]);

  const modulesById = useMemo(
    () => new Map(modules.map(item => [clean(item?.id), item])),
    [modules],
  );
  const orderedModules = orderedIds
    .map(id => modulesById.get(id))
    .filter(Boolean);
  const activeModule = modulesById.get(activeId) || null;

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function finishDrag({ active, over }) {
    setActiveId("");

    if (!over || clean(active?.id) === clean(over?.id)) return;

    const nextOrder = moveIXITransactModule(
      orderedIds,
      active?.id,
      over?.id,
    );

    setOrderedIds(nextOrder);
    onOrderChange?.(nextOrder);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => setActiveId(clean(active?.id))}
      onDragEnd={finishDrag}
      onDragCancel={() => setActiveId("")}
    >
      <SortableContext
        items={orderedIds}
        strategy={rectSortingStrategy}
      >
        <div
          className="tx-grid"
          data-ixi-transact-sortable-launcher
        >
          {orderedModules.map(item => (
            <SortableModuleTile
              key={item.id}
              item={item}
              onOpen={onOpen}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay
        dropAnimation={{
          duration: 170,
          easing: "cubic-bezier(.2,.8,.2,1)",
        }}
        zIndex={12000}
      >
        {activeModule ? (
          <div className="tx-app-tile tx-app-tile-overlay">
            <ModuleCopy item={activeModule} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
