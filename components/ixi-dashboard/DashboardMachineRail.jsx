import { useEffect, useMemo, useState } from "react";
import { cleanMachineTitle } from "../../lib/listingFormatters";
import { dashboardKey, filterMachineSearch, passportOf } from "./dashboardContract.mjs";

function thumbnail(item) {
  const candidates = [item.imageUrl, item.imageObjects?.[0]?.url, item.images?.[0], item.imageUrls?.[0], item.image];
  for (const candidate of candidates) {
    const value = typeof candidate === "string" ? candidate : candidate?.url || candidate?.src;
    if (value) return value;
  }
  return "";
}

export default function DashboardMachineRail({ title, side, items, loading, error, query, onQuery, openKeys, selectedKey, onSelect, onOpen, onRetry, filter, onFilter, onHide }) {
  const [limit, setLimit] = useState(24);
  useEffect(() => setLimit(24), [query, filter]);
  const matches = useMemo(() => filterMachineSearch(items, query), [items, query]);
  return <aside className={`dash-rail dash-rail-${side}`} aria-label={title}>
    <div className="dash-rail-heading"><div><span className="dash-eyebrow">IXI MACHINES</span><h2>{title} <span>{loading ? "…" : items.length}</span></h2></div><button className="dash-icon-button" onClick={onHide} aria-label={`Hide ${title.toLowerCase()}`}>{side === "left" ? "‹" : "›"}</button></div>
    <div className="dash-rail-tools">
      <input aria-label={`Search ${title.toLowerCase()} machines`} placeholder="Search machine, SN, ID…" value={query} onChange={event => onQuery(event.target.value)} />
      {onFilter && <select aria-label="Owned machine filter" value={filter} onChange={event => onFilter(event.target.value)}><option value="all">ALL OWNED</option><option value="live">LIVE</option><option value="private">PRIVATE</option><option value="auction">AUCTION</option></select>}
    </div>
    <div className="dash-rail-list">
      {error && <div className="dash-load-error" role="alert">{error}<button onClick={onRetry}>RETRY</button></div>}
      {loading && !items.length && <div className="dash-rail-empty" role="status">Loading machines…</div>}
      {!loading && !error && !matches.length && <div className="dash-rail-empty">{query ? "No matching machines." : side === "left" ? "Your owned machines will appear here." : "Save a machine or mark a relationship to keep it here."}<a href={side === "left" ? "/post-free" : "/browse-v2"}>{side === "left" ? "ADD A MACHINE ↗" : "BROWSE MACHINES ↗"}</a></div>}
      {matches.slice(0, limit).map(item => {
        const key = dashboardKey(item), open = openKeys.includes(key), src = thumbnail(item);
        return <article key={key} className={`dash-machine-tile ${selectedKey === key ? "selected" : ""} ${open ? "on-board" : ""}`}>
          <button className="dash-tile-select" aria-label={`Select ${item.title}`} aria-pressed={selectedKey === key} onClick={() => onSelect(key)} onDoubleClick={() => onOpen(item)}>
            <div className="dash-tile-image">{src ? <img src={src} alt="" loading="lazy" decoding="async" onError={event => { event.currentTarget.style.visibility = "hidden"; }} /> : <span>IXI</span>}{open && <span className="dash-board-badge">ON BOARD</span>}</div>
            <strong>{cleanMachineTitle(item.title || "Machine")}</strong>
            <span className="dash-tile-facts"><span>{item.price || "Price on request"}</span><span>{passportOf(item)}</span></span>
          </button>
          <button className="dash-tile-open" onClick={() => onOpen(item)} aria-label={`${open ? "Show" : "Open"} ${item.title} on board`}>{open ? "SHOW ON BOARD" : "OPEN ON BOARD"}<span aria-hidden="true">↗</span></button>
        </article>;
      })}
      {matches.length > limit && <button className="dash-more" onClick={() => setLimit(value => value + 24)}>SHOW MORE · {matches.length - limit} remaining</button>}
    </div>
    <div className="dash-rail-footer">{matches.length} {matches.length === 1 ? "machine" : "machines"}<a href={side === "left" ? "/account/my-listings-v2" : "/saved"}>{side === "left" ? "INVENTORY ↗" : "WORKSPACE ↗"}</a></div>
  </aside>;
}
