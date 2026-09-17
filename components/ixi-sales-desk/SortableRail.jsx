import {useEffect,useMemo,useState} from "react";
import {DndContext,PointerSensor,KeyboardSensor,closestCenter,useSensor,useSensors} from "@dnd-kit/core";
import {SortableContext,useSortable,verticalListSortingStrategy,sortableKeyboardCoordinates} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {readRailOrder,orderedRailIds,moveRailItem} from "./railOrder.mjs";

export function useRailOrder(items,keyOf,storageKey,onNotice) {
  const [state,setState]=useState({key:null,ids:[]});
  useEffect(()=>{
    let ids=[];
    if(storageKey) try {ids=readRailOrder(JSON.parse(localStorage.getItem(storageKey)||"null"));}
    catch {onNotice?.("This browser couldn’t restore your rail order.");}
    setState({key:storageKey,ids});
  },[storageKey]);
  const available=items.map(keyOf);
  const saved=state.key===storageKey ? state.ids : [];
  const ordered=useMemo(()=>{
    const byId=new Map(items.map(item=>[keyOf(item),item]));
    return orderedRailIds(saved,available).map(id=>byId.get(id));
  },[items,saved,keyOf]);
  const reorder=(visible,active,over)=>{
    if(!storageKey || state.key!==storageKey) return;
    const ids=moveRailItem(saved,available,visible,active,over);
    if(ids===saved) return;
    setState({key:storageKey,ids});
    try {localStorage.setItem(storageKey,JSON.stringify(ids));}
    catch {onNotice?.("Order changed, but this browser couldn’t save it for your next visit.");}
  };
  return {ordered,reorder,ready:!!storageKey && state.key===storageKey};
}

export function SortableRail({ids,onReorder,children,disabled=false}) {
  const sensors=useSensors(useSensor(PointerSensor,{activationConstraint:{distance:6}}),useSensor(KeyboardSensor,{coordinateGetter:sortableKeyboardCoordinates}));
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({active,over})=>{
    if(!disabled && over) onReorder(ids,String(active.id),String(over.id));
  }} accessibility={{screenReaderInstructions:{draggable:"Press space to pick up a tile. Use up and down arrows to move it. Press space to drop, or Escape to cancel."}}}>
    <SortableContext items={ids} strategy={verticalListSortingStrategy} disabled={disabled}>{children}</SortableContext>
  </DndContext>;
}

export function SortableRailTile({id,label,className,children,disabled=false,enabled=true}) {
  const {attributes,listeners,setNodeRef,setActivatorNodeRef,transform,transition,isDragging}=useSortable({id,disabled:disabled || !enabled});
  return <article ref={setNodeRef} className={`${className}${enabled ? " sales-sortable-tile" : ""}${isDragging ? " sales-tile-dragging" : ""}`} style={{transform:CSS.Transform.toString(transform),transition}}>
    {enabled && <button ref={setActivatorNodeRef} className="sales-rail-drag" {...attributes} {...listeners} disabled={disabled} aria-label={`Reorder ${label}`} title="Drag to reorder · or press Space and use arrow keys">⠿</button>}
    {children}
  </article>;
}
