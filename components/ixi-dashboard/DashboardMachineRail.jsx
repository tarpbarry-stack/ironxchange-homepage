import { useEffect, useMemo, useState } from "react";
import { cleanMachineTitle } from "../../lib/listingFormatters";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { dashboardKey, filterMachineSearch, passportOf } from "./dashboardContract.mjs";
import { machineRailDragId, railPrefix } from "./machineWorkspaceDrop.mjs";
import IXIWorkspaceRailTile from "../ixi-os/IXIWorkspaceRailTile";
import IXIWorkspaceRailHeader from "../ixi-os/IXIWorkspaceRailHeader";

function thumbnail(item) {
  const candidates = [item.imageUrl, item.imageObjects?.[0]?.url, item.images?.[0], item.imageUrls?.[0], item.image];
  for (const candidate of candidates) {
    const value = typeof candidate === "string" ? candidate : candidate?.url || candidate?.src;
    if (value) return value;
  }
  return "";
}

function RailMachine({ item, side, selected, src, onSelect, onOpen }) {
  const key = dashboardKey(item);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: machineRailDragId(side, key) });
  return <article ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? .5 : 1, marginBottom: 10 }}>
    <IXIWorkspaceRailTile title={cleanMachineTitle(item.title || "Machine")} image={src} side={side} selected={selected}
      facts={[{ label: "SN", value: item.serialNumber || item.publicData?.serialNumber || "—" }, { label: "ID", value: passportOf(item) || "—" }]}
      onSelect={() => onSelect(key)} onBoard={() => onOpen(item)} dragHandleProps={{ ...attributes, ...listeners }} />
  </article>;
}

export default function DashboardMachineRail({ title, side, items, loading, error, query, onQuery, selectedKey, onSelect, onOpen, armed, onArm, onRetry, filter, onFilter, onHide, className = "" }) {
  const [limit, setLimit] = useState(24);
  const { setNodeRef, isOver } = useDroppable({ id: `${railPrefix}${side}` });
  useEffect(() => setLimit(24), [query, filter]);
  const matches = useMemo(() => filterMachineSearch(items, query), [items, query]);
  return <aside className={`dash-rail dash-rail-${side} ${className}`} aria-label={title}>
    <IXIWorkspaceRailHeader title={title} count={loading ? "…" : items.length} side={side} armed={armed} onArm={onArm} onClose={onHide} />
    <div className="dash-rail-tools">
      <input aria-label={`Search ${title.toLowerCase()} machines`} placeholder="Search machine, SN, ID…" value={query} onChange={event => onQuery(event.target.value)} />
      {onFilter && <select aria-label="Owned machine filter" value={filter} onChange={event => onFilter(event.target.value)}><option value="all">ALL OWNED</option><option value="live">LIVE</option><option value="private">PRIVATE</option><option value="auction">AUCTION</option></select>}
    </div>
    <div className={`dash-rail-list ${isOver ? "dash-rail-drop-over" : ""}`} ref={setNodeRef}>
      {error && <div className="dash-load-error" role="alert">{error}<button onClick={onRetry}>RETRY</button></div>}
      {loading && !items.length && <div className="dash-rail-empty" role="status">Loading machines…</div>}
      {!loading && !error && !matches.length && <div className="dash-rail-empty">{query ? "No matching machines." : side === "left" ? "Your owned machines will appear here." : "Save a machine or mark a relationship to keep it here."}<a href={side === "left" ? "/post-free" : "/browse-v2"}>{side === "left" ? "ADD A MACHINE ↗" : "BROWSE MACHINES ↗"}</a></div>}
      <SortableContext id={`${railPrefix}${side}`} items={matches.slice(0, limit).map(item => machineRailDragId(side, dashboardKey(item)))} strategy={verticalListSortingStrategy}>
      {matches.slice(0, limit).map(item => {
        const key = dashboardKey(item), src = thumbnail(item);
        return <RailMachine key={key} item={item} side={side} selected={selectedKey === key} src={src} onSelect={onSelect} onOpen={onOpen} />;
      })}
      </SortableContext>
      {matches.length > limit && <button className="dash-more" onClick={() => setLimit(value => value + 24)}>SHOW MORE · {matches.length - limit} remaining</button>}
    </div>
    <div className="dash-rail-footer">{matches.length} {matches.length === 1 ? "machine" : "machines"}<a href={side === "left" ? "/account/my-listings-v2" : "/saved"}>{side === "left" ? "INVENTORY ↗" : "WORKSPACE ↗"}</a></div>
  </aside>;
}
