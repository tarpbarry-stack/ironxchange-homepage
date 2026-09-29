import { useEffect,useMemo,useState } from "react";
import { dashboardKey,filterMachineSearch,passportOf } from "../ixi-dashboard/dashboardContract.mjs";
import {SortableRailTile,useRailOrder} from "./SortableRail";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { machineRailDragId, railPrefix } from "../ixi-dashboard/machineWorkspaceDrop.mjs";
import {railStorageKey} from "./railOrder.mjs";
import { cleanMachineTitle } from "../../lib/listingFormatters";

export default function SalesDeskRail({ workspace:w,actor,onClose,railOrderRef }) {
  const [scope,setScope]=useState("owned"),[query,setQuery]=useState(""),[limit,setLimit]=useState(24);
  const source=scope==="owned" ? w.owned : w.related;
  const status=scope==="owned" ? w.ownedStatus : w.relatedStatus;
  const rail=useRailOrder(source,dashboardKey,railStorageKey(actor,scope),w.setNotice);
  const matches=useMemo(()=>filterMachineSearch(rail.ordered,query),[rail.ordered,query]);
  const visible=matches.slice(0,limit);
  const { setNodeRef, isOver } = useDroppable({ id: `${railPrefix}left` });
  if (railOrderRef) railOrderRef.current = (side, active, over) => {
    if (side === "left" && rail.ready && !status.loading) rail.reorder(visible.map(dashboardKey), active, over);
  };
  useEffect(()=>setLimit(24),[query,scope]);
  return <aside className="sales-machine-rail" aria-label="Machines">
    <div className="sales-rail-heading"><div><span className="sales-eyebrow">YOUR INVENTORY & CONNECTIONS</span><h2>MACHINES <b>{status.loading ? "…" : source.length}</b></h2></div><button onClick={onClose} aria-label="Hide machine rail">‹</button></div>
    <div className="sales-rail-tools"><select aria-label="Machine source" value={scope} onChange={e=>setScope(e.target.value)}><option value="owned">OWNED MACHINES</option><option value="related">RELATIONSHIP MACHINES</option></select><input aria-label="Search machines" placeholder="Machine, serial number, ID…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
    <div className={`sales-rail-scroll ${isOver ? "sales-rail-drop-over" : ""}`} ref={setNodeRef}>
      {status.error && <div className="sales-error" role="alert">{status.error}<button onClick={w.refresh}>RETRY</button></div>}
      {status.loading && !source.length && <p className="sales-empty" role="status">Loading machines…</p>}
      {!status.loading && !matches.length && <div className="sales-empty"><p>{query ? "No machines match this search." : scope==="owned" ? "Your current inventory appears here." : "Save or mark a machine to keep it here."}</p><a href={scope==="owned" ? "/post-free" : "/browse-v2"}>{scope==="owned" ? "ADD A MACHINE ↗" : "BROWSE MACHINES ↗"}</a></div>}
      <SortableContext id={`${railPrefix}left`} items={visible.map(item => machineRailDragId("left", dashboardKey(item)))} strategy={verticalListSortingStrategy}>
      {visible.map(item=>{
        const key=dashboardKey(item),open=w.openKeys.includes(key);
        const raw=item.imageUrl || item.imageObjects?.[0]?.url || item.images?.[0] || item.imageUrls?.[0];
        const src=typeof raw==="string" ? raw : raw?.url;
        return <SortableRailTile key={key} id={machineRailDragId("left", key)} label={cleanMachineTitle(item.title || "Machine")} moveToBoard disabled={!rail.ready || status.loading} className={`sales-machine ${open ? "sales-placeholder" : ""} ${w.selectedKey===key ? "selected" : ""}`}>
          <button onClick={()=>w.setSelectedKey(key)} aria-label={`Select ${item.title}`}>
            {!open && <div className="sales-machine-image">{src ? <img src={src} alt="" loading="lazy" decoding="async" onError={e=>{e.currentTarget.style.visibility="hidden";}}/> : <span>IXI</span>}</div>}
            {open && <span className="sales-placeholder-mark">↗ <b>ON BOARD</b></span>}
            <strong>{cleanMachineTitle(item.title || "Machine")}</strong>
            <span className="sales-machine-fact"><b>SN</b>{item.serialNumber || item.publicData?.serialNumber || "—"}</span>
            <span className="sales-machine-fact"><b>ID</b>{passportOf(item) || "—"}</span>
            {!open && <span className="sales-machine-price">{item.price || "Price on request"}</span>}
            <span className="sales-machine-action">DRAG TO BOARD<b>⠿</b></span>
          </button>
        </SortableRailTile>;
      })}
      </SortableContext>
      {matches.length>limit && <button className="sales-wide" onClick={()=>setLimit(n=>n+24)}>SHOW MORE · {matches.length-limit}</button>}
    </div><footer className="sales-rail-footer">{matches.length} MACHINES <a href={scope==="owned" ? "/account/my-listings-v2" : "/saved"}>OPEN INVENTORY ↗</a></footer>
  </aside>;
}
