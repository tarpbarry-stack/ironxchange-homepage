import { useEffect, useMemo, useState } from "react";

import {
  DndContext,
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

const clean = value => String(value ?? "").trim();

export const MACHINE_WORKSPACE_IDS = Object.freeze({
  DIRECTORY: "machine-workspace",
  TRANSACT: "transact",
  FINANCIAL: "financial-record-index",
  COST_BASIS: "machine-cost-basis",
  PRICING: "machine-pricing",
});

export const MACHINE_WORKSPACES = Object.freeze([
  {
    id: MACHINE_WORKSPACE_IDS.TRANSACT,
    eyebrow: "APPLICATIONS",
    label: "TRAN$ACT",
    description: "WORK MODULES",
  },
  {
    id: MACHINE_WORKSPACE_IDS.FINANCIAL,
    eyebrow: "MACHINE FACE",
    label: "F$1",
    description: "FINANCIAL RECORDS",
  },
  {
    id: MACHINE_WORKSPACE_IDS.COST_BASIS,
    eyebrow: "MACHINE FACE",
    label: "F$2",
    description: "COST BASIS",
  },
  {
    id: MACHINE_WORKSPACE_IDS.PRICING,
    eyebrow: "MACHINE FACE",
    label: "F$3",
    description: "PRICING",
  },
]);

export function reconcileMachineWorkspaceOrder(order = [], ids = []) {
  const available = ids.map(clean).filter(Boolean);
  const availableSet = new Set(available);
  const retained = (Array.isArray(order) ? order : [])
    .map(clean)
    .filter((id, index, values) =>
      availableSet.has(id) && values.indexOf(id) === index
    );
  return [...retained, ...available.filter(id => !retained.includes(id))];
}

function moveWorkspace(order, activeId, overId) {
  const from = order.indexOf(clean(activeId));
  const to = order.indexOf(clean(overId));
  if (from < 0 || to < 0 || from === to) return order;
  const next = [...order];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function stopDragActivation(event) {
  event.stopPropagation();
}

function WorkspaceTile({ workspace, onOpen }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: workspace.id,
    data: { type: "ixi-machine-workspace", workspaceId: workspace.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`machine-workspace-tile ${isDragging ? "dragging" : ""}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? "none" : transition,
      }}
      data-ixi-machine-workspace={workspace.id}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="machine-workspace-drag-surface"
        aria-label={`Reorder ${workspace.label}`}
        {...attributes}
        {...listeners}
      />
      <div className="machine-workspace-copy">
        <span>{workspace.eyebrow}</span>
        <button
          type="button"
          onPointerDown={stopDragActivation}
          onMouseDown={stopDragActivation}
          onTouchStart={stopDragActivation}
          onKeyDown={stopDragActivation}
          onClick={() => onOpen?.(workspace.id)}
          aria-label={`Open ${workspace.label}`}
        >
          {workspace.label}
        </button>
        <small>{workspace.description}</small>
      </div>
      <b aria-hidden="true">›</b>
    </div>
  );
}

export default function IXIMachineWorkspaceDirectory({
  context = {},
  workspaceOrder = null,
  onWorkspaceOrderChange = null,
  onOpenWorkspace = null,
}) {
  const workspaceIds = useMemo(
    () => MACHINE_WORKSPACES.map(workspace => workspace.id),
    [],
  );
  const savedOrderKey = Array.isArray(workspaceOrder)
    ? workspaceOrder.map(clean).join("|")
    : "";
  const [orderedIds, setOrderedIds] = useState(() =>
    reconcileMachineWorkspaceOrder(workspaceOrder, workspaceIds),
  );
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    setOrderedIds(
      reconcileMachineWorkspaceOrder(workspaceOrder, workspaceIds),
    );
  }, [savedOrderKey, workspaceIds]);

  const workspacesById = useMemo(
    () => new Map(MACHINE_WORKSPACES.map(item => [item.id, item])),
    [],
  );

  function finishDrag({ active, over }) {
    if (!over || clean(active?.id) === clean(over?.id)) return;
    const next = moveWorkspace(orderedIds, active?.id, over?.id);
    setOrderedIds(next);
    onWorkspaceOrderChange?.(next);
  }

  return (
    <div className="machine-workspace-directory">
      <header>
        <span>IXI MACHINE</span>
        <strong>WORKSPACE</strong>
        <small>{clean(context?.primary?.label) || "AOS OBJECT"}</small>
      </header>

      <main>
        <div className="machine-workspace-label">OPEN FOR THIS MACHINE</div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={finishDrag}
        >
          <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
            <div className="machine-workspace-grid">
              {orderedIds.map(id => {
                const workspace = workspacesById.get(id);
                return workspace ? (
                  <WorkspaceTile
                    key={workspace.id}
                    workspace={workspace}
                    onOpen={onOpenWorkspace}
                  />
                ) : null;
              })}
            </div>
          </SortableContext>
        </DndContext>
      </main>

      <style jsx>{`
        .machine-workspace-directory,.machine-workspace-directory *{box-sizing:border-box}
        .machine-workspace-directory{position:relative;width:298px;height:471px;overflow:hidden;border:1px solid rgba(255,196,0,.18);border-radius:14px;background:linear-gradient(180deg,rgba(255,196,0,.035),transparent 31%),#0b0c0c;color:#f4f4f4;font-family:Inter,Arial,sans-serif;box-shadow:0 18px 34px rgba(0,0,0,.42)}
        header{height:61px;padding:10px 11px;border-bottom:1px solid rgba(255,255,255,.09)}
        header span{display:block;color:#ffc400;font-size:8px;font-weight:900;letter-spacing:.075em}
        header strong{display:block;margin-top:3px;font-size:15px;line-height:1.08;font-weight:900}
        header small{display:block;max-width:270px;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#858b88;font-size:7px;font-weight:800;text-transform:uppercase}
        main{position:absolute;inset:61px 0 9px;overflow-y:auto;padding:10px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.18) transparent}
        .machine-workspace-label{margin:0 2px 8px;color:#858b88;font-size:7px;font-weight:900;letter-spacing:.075em}
        .machine-workspace-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        :global(.machine-workspace-tile){position:relative;min-width:0;height:104px;border:1px solid rgba(255,255,255,.1);border-radius:8px;background:linear-gradient(180deg,#151817,#0e1010);box-shadow:0 7px 18px rgba(0,0,0,.22);overflow:hidden;touch-action:none}
        :global(.machine-workspace-tile.dragging){z-index:20;border-color:rgba(255,196,0,.72);box-shadow:0 15px 28px rgba(0,0,0,.55);opacity:.96}
        :global(.machine-workspace-drag-surface){position:absolute;inset:0;width:100%;height:100%;padding:0;border:0;background:transparent;cursor:grab;touch-action:none}
        :global(.machine-workspace-drag-surface:active){cursor:grabbing}
        :global(.machine-workspace-drag-surface:focus-visible){outline:2px solid #ffc400;outline-offset:-3px;border-radius:8px}
        :global(.machine-workspace-copy){position:absolute;inset:14px 20px 12px 13px;pointer-events:none}
        :global(.machine-workspace-copy span){display:block;color:#7f8582;font-size:7px;font-weight:900;letter-spacing:.055em}
        :global(.machine-workspace-copy button){position:relative;max-width:100%;margin:9px 0 0;padding:0;border:0;background:transparent;color:#f3f3f3;font:900 16px/1 Inter,Arial,sans-serif;text-align:left;cursor:pointer;pointer-events:auto}
        :global(.machine-workspace-copy button:hover),:global(.machine-workspace-copy button:focus-visible){outline:none;color:#ffc400}
        :global(.machine-workspace-copy small){display:block;margin-top:9px;color:#ffc400;font-size:7px;font-weight:850;letter-spacing:.02em}
        :global(.machine-workspace-tile>b){position:absolute;right:10px;top:43px;color:#ffc400;font-size:18px;line-height:1;pointer-events:none}
      `}</style>
    </div>
  );
}
