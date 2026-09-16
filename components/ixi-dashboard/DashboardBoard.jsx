import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { DndContext, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import IXISortableMachineCard from "../ixi-chassis/IXISortableMachineCard";
import IXIObjectConsoleRouter from "../ixi-chassis/IXIObjectConsoleRouter";
import IXIMachineCard from "../ixi-machine-card/IXIMachineCard";
import { getMachineCardFamily } from "../ixi-machine-card/getMachineCardFamily";
import { dashboardId, dashboardKey } from "./dashboardContract.mjs";

const OwnedCard = dynamic(() => import("../ixi-machine-card/private/IXIOwnedPrivateListingRuntime"), { ssr: false });

export default function DashboardBoard({ machines, ownedKeys, states, onPatch, size, onReorder, onReturn, selectedKey, onSelect, getSellerProps, onDirty, dirtyKeys, onSaved, toggleSave, savedIds, onScroll, scrollTop }) {
  const boardRef = useRef(null);
  const [{ width, height }, setBounds] = useState({ width: 900, height: 600 });
  const restoredScroll = useRef(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  useEffect(() => {
    const element = boardRef.current;
    const observer = new ResizeObserver(entries => setBounds({ width: entries[0].contentRect.width, height: entries[0].contentRect.height }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (machines.length && !restoredScroll.current) {
      boardRef.current.scrollTop = scrollTop || 0;
      restoredScroll.current = true;
    }
  }, [machines.length, scrollTop]);
  const ids = machines.map(dashboardKey);
  const desiredScale = { natural: 1, work: 1.2, focus: 1.4 }[size] || 1.2;
  return <div className="dash-board-scroll" ref={boardRef} onScroll={event => onScroll(event.currentTarget.scrollTop)}>
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
      if (over && active.id !== over.id && ids.includes(over.id)) onReorder(arrayMove(ids, ids.indexOf(active.id), ids.indexOf(over.id)));
    }}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="dash-board-cards">
          {machines.map((item, index) => {
            const key = dashboardKey(item), id = dashboardId(item), owned = ownedKeys.has(key), state = states[id] || {};
            const regularDepth = state.consoleSlots?.length || 1 + Number(Boolean(state.consoleLeftOpen)) + Number(Boolean(state.consoleRightOpen));
            const transactionDepth = state.transactOpen ? Math.max(1, Number(state.transactConsoleDepth) || 1) : 1;
            const nativeWidth = regularDepth * 300 - (owned ? (regularDepth - 1) * 2 : 0) + (transactionDepth - 1) * 298;
            const nativeHeight = owned || getMachineCardFamily(item) === "auction" || state.transactOpen ? 475 : 400;
            const scale = Math.min(size === "fit" ? Math.max(0.65, Math.min(1.2, (height - 90) / nativeHeight)) : desiredScale, Math.max(0.25, (width - 32) / nativeWidth));
            const cardContext = owned ? "inventory" : "workspace";
            const sellerProps = owned ? getSellerProps(item) : {};
            const patch = (_id, change) => onPatch(id, change);
            const moveTo = end => onReorder(end ? [...ids.filter(value => value !== key), key] : [key, ...ids.filter(value => value !== key)]);
            return <IXISortableMachineCard id={key} key={key} containerId="dashboard-board" className="dash-open-machine" style={{ width: nativeWidth * scale, minWidth: 0 }}>
              {({ dragHandleProps }) => <section data-dashboard-machine={key} aria-label={`Working machine ${item.title}`} onPointerDownCapture={() => onSelect(key)} onChangeCapture={event => {
                if (event.target.matches("input:not([type=search]),textarea,select") && !event.target.readOnly && !/search|find/i.test(event.target.placeholder || event.target.getAttribute("aria-label") || "")) onDirty(key);
              }}>
                <div className={`dash-open-caption ${selectedKey === key ? "active" : ""}`}>
                  <button {...dragHandleProps} className="dash-drag-handle" aria-label={`Reorder ${item.title}`} title="Drag to reorder">⠿</button>
                  <span>{String(index + 1).padStart(2, "0")} · {item.inventorySessionOnly ? "OPEN TRANSACTION" : owned ? "OWNED" : "RELATIONSHIP"}</span>
                  {dirtyKeys.has(key) && <strong className="dash-unsaved">UNSAVED</strong>}
                  <button className="dash-return" aria-label={`Return ${item.title} to rail`} onClick={() => onReturn(key)}>RETURN <span aria-hidden="true">×</span></button>
                </div>
                <div className="dash-card-footprint" style={{ width: nativeWidth * scale, height: nativeHeight * scale }}>
                  <div className="dash-card-transform" style={{ width: nativeWidth, height: nativeHeight, transform: `scale(${scale})`, "--dash-listing-width": `${300 + (transactionDepth - 1) * 298}px`, "--dash-console-width": `${nativeWidth}px` }}>
                    <IXIObjectConsoleRouter cardFamily={owned ? "private" : getMachineCardFamily(item)} cardContext={cardContext} objectId={id} item={item} sellerCardProps={sellerProps} ixiCardState={states} updateIxiCardState={patch} enableCardScaling={false} dragHandleProps={dragHandleProps} renderParentCard={consoleProps => {
                      const Card = owned ? OwnedCard : IXIMachineCard;
                      return <Card {...sellerProps} {...consoleProps} listing={item} cardContext={cardContext} presentation={owned ? "seller" : undefined} sellerMode={owned} from="account" suppressFamilyLog showSave={!owned} saved={savedIds.includes(id)} onToggleSaved={() => toggleSave(item)} ixiState={state} onIxiStateChange={patch} machineFace={state.face || 1} onCycleMachineFace={() => patch(id, { face: ((state.face || 1) % 4) + 1 })} onSendFront={() => moveTo(false)} onSendBack={() => moveTo(true)} armedDestination="dashboard-rail" onSendToArmedDestination={() => onReturn(key)} dragHandleProps={dragHandleProps} consoleActuatorVariant="tall" onFinancialRecordsChange={() => onSaved(key)} onOwnedObjectSaved={(next, result) => { sellerProps.onOwnedObjectSaved?.(next, result); onSaved(key); }} />;
                    }} />
                  </div>
                </div>
              </section>}
            </IXISortableMachineCard>;
          })}
          {!machines.length && <div className="dash-board-empty"><div className="dash-empty-symbol" aria-hidden="true">IXI</div><h2>Your machines. Your working space.</h2><p>Select a machine from either side and open it here.</p><span>Photos · Details · Consoles · TRAN$ACT</span></div>}
        </div>
      </SortableContext>
    </DndContext>
  </div>;
}
