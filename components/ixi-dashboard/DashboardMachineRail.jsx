import { useEffect, useMemo, useState } from "react";
import { cleanMachineTitle } from "../../lib/listingFormatters";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { dashboardKey, filterMachineSearch, passportOf } from "./dashboardContract.mjs";
import { machineRailDragId, railPrefix } from "./machineWorkspaceDrop.mjs";

function thumbnail(item) {
  const candidates = [item.imageUrl, item.imageObjects?.[0]?.url, item.images?.[0], item.imageUrls?.[0], item.image];
  for (const candidate of candidates) {
    const value = typeof candidate === "string" ? candidate : candidate?.url || candidate?.src;
    if (value) return value;
  }
  return "";
}

function RailMachine({ item, side, selected, open, src, onSelect }) {
  const key = dashboardKey(item);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: machineRailDragId(side, key) });
  return <article ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? .5 : 1 }} className={`dash-machine-tile ${selected ? "selected" : ""} ${open ? "on-board" : ""}`}>
    <button className="dash-tile-select" aria-label={`Select ${item.title}`} aria-pressed={selected} onClick={() => onSelect(key)}>
      <div className="dash-tile-image">{src ? <img src={src} alt="" loading="lazy" decoding="async" onError={event => { event.currentTarget.style.visibility = "hidden"; }} /> : <span>IXI</span>}{open && <span className="dash-board-badge">ON BOARD</span>}</div>
      <strong>{cleanMachineTitle(item.title || "Machine")}</strong>
      <span className="dash-tile-facts"><span>{item.price || "Price on request"}</span><span>{passportOf(item)}</span></span>
    </button>
    <button className="dash-tile-open" {...attributes} {...listeners} aria-label={`Drag ${item.title} to reorder or place on board`} title="Drag to reorder or move to board">DRAG TO BOARD <span aria-hidden="true">⠿</span></button>
  </article>;
}

export default function DashboardMachineRail({ title, side, items, loading, error, query, onQuery, openKeys, selectedKey, onSelect, onRetry, filter, onFilter, onHide }) {
  const [limit, setLimit] = useState(24);
  const { setNodeRef, isOver } = useDroppable({ id: `${railPrefix}${side}` });
  useEffect(() => setLimit(24), [query, filter]);
  const matches = useMemo(() => filterMachineSearch(items, query), [items, query]);
  return <aside className={`dash-rail dash-rail-${side}`} aria-label={title}>
    <div className="dash-rail-heading"><div><span className="dash-eyebrow">IXI MACHINES</span><h2>{title} <span>{loading ? "…" : items.length}</span></h2></div><button className="dash-icon-button" onClick={onHide} aria-label={`Hide ${title.toLowerCase()}`}>{side === "left" ? "‹" : "›"}</button></div>
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
        const key = dashboardKey(item), open = openKeys.includes(key), src = thumbnail(item);
        return <RailMachine key={key} item={item} side={side} selected={selectedKey === key} open={open} src={src} onSelect={onSelect} />;
      })}
      </SortableContext>
      {matches.length > limit && <button className="dash-more" onClick={() => setLimit(value => value + 24)}>SHOW MORE · {matches.length - limit} remaining</button>}
    </div>
    <div className="dash-rail-footer">{matches.length} {matches.length === 1 ? "machine" : "machines"}<a href={side === "left" ? "/account/my-listings-v2" : "/saved"}>{side === "left" ? "INVENTORY ↗" : "WORKSPACE ↗"}</a></div>
  </aside>;
}
