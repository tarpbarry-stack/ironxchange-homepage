import { useMemo, useState } from "react";
import { dashboardKey, filterMachineSearch } from "./dashboardContract.mjs";
import { cleanMachineTitle } from "../../lib/listingFormatters";

function imageOf(item) {
  const raw = item.imageUrl || item.imageObjects?.[0]?.url || item.images?.[0] || item.imageUrls?.[0];
  return typeof raw === "string" ? raw : raw?.url || raw?.src || "";
}

export default function MobileMachineStrip({ owned = [], related = [], ownedStatus = {}, relatedStatus = {}, openKeys = [], selectedKey, onOpen, label = "MACHINES" }) {
  const [scope, setScope] = useState("owned");
  const [query, setQuery] = useState("");
  const items = scope === "owned" ? owned : related;
  const status = scope === "owned" ? ownedStatus : relatedStatus;
  const matches = useMemo(() => filterMachineSearch(items, query).slice(0, 50), [items, query]);

  return <section className="ixi-mobile-machines" aria-label={`${label} machine picker`}>
    <div className="ixi-mobile-machines-head">
      <div className="ixi-mobile-machines-tabs" aria-label="Machine source">
        <button type="button" aria-pressed={scope === "owned"} onClick={() => setScope("owned")}>OWNED <b>{owned.length}</b></button>
        <button type="button" aria-pressed={scope === "related"} onClick={() => setScope("related")}>RELATIONSHIPS <b>{related.length}</b></button>
      </div>
      <span>{label}</span>
    </div>
    <input type="search" aria-label="Find a machine by name, serial number or ID" placeholder="Find machine, SN or ID…" value={query} onChange={event => setQuery(event.target.value)} />
    <div className="ixi-mobile-machines-scroll" role="list" aria-label={`${scope === "owned" ? "Owned" : "Relationship"} machines`}>
      {status.error ? <p role="alert">Machines could not load. Refresh to try again.</p> : status.loading && !items.length ? <p role="status">Loading machines…</p> : !matches.length ? <p>{query ? "No matching machines." : "No machines here yet."}</p> : matches.map(item => {
        const key = dashboardKey(item);
        const src = imageOf(item);
        return <div role="listitem" key={key}><button type="button" className="ixi-mobile-machine" aria-label={`Open ${item.title || "machine"} on board`} aria-pressed={selectedKey === key} onClick={() => onOpen(item)}>
          <span className="ixi-mobile-machine-photo">{src ? <img src={src} alt="" loading="lazy" decoding="async" /> : <b>IXI</b>}</span>
          <strong>{cleanMachineTitle(item.title || "Machine")}</strong>
          <small>{openKeys.includes(key) ? "ON BOARD" : "OPEN ↗"}</small>
        </button></div>;
      })}
    </div>
    <style jsx>{`
      .ixi-mobile-machines { display:none; }
      @media(max-width:760px) {
        .ixi-mobile-machines { display:block; flex:none; width:100%; min-width:0; padding:8px 10px 10px; background:#111610; border-bottom:1px solid #4c482b; color:#e8eddf; }
        .ixi-mobile-machines-head { display:flex; align-items:center; justify-content:space-between; gap:8px; }
        .ixi-mobile-machines-head > span { font-size:9px; font-weight:800; color:#b7a75b; letter-spacing:.6px; }
        .ixi-mobile-machines-tabs { display:flex; gap:5px; }
        .ixi-mobile-machines-tabs button { min-height:44px; padding:5px 8px; border:1px solid #414a35; background:#1b2218; color:#d2dac7; font-size:10px; font-weight:800; }
        .ixi-mobile-machines-tabs button[aria-pressed="true"] { color:#ffd23a; border-color:#af9326; }
        .ixi-mobile-machines-tabs b { margin-left:3px; }
        .ixi-mobile-machines input { width:100%; height:38px; margin:7px 0; padding:8px 10px; border:1px solid #414a35; border-radius:2px; background:#0b100c; color:#f0f2e8; font-size:14px; }
        .ixi-mobile-machines-scroll { display:flex; gap:8px; overflow-x:auto; overscroll-behavior-inline:contain; scroll-snap-type:x proximity; scrollbar-width:none; -webkit-overflow-scrolling:touch; padding:1px 2px 5px; }
        .ixi-mobile-machines-scroll::-webkit-scrollbar { display:none; }
        .ixi-mobile-machines-scroll > div { flex:0 0 112px; width:112px; height:118px; scroll-snap-align:start; }
        .ixi-mobile-machines-scroll > p { min-height:76px; margin:0; padding:22px 4px; font-size:12px; color:#b8c4b2; }
        .ixi-mobile-machine { box-sizing:border-box; display:flex; flex-direction:column; width:112px; height:118px; min-height:118px; max-height:118px; padding:3px; text-align:left; border:1px solid #3b4534; background:#1b2118; color:#ecf0e9; overflow:hidden; }
        .ixi-mobile-machine[aria-pressed="true"] { border-color:#ffc400; }
        .ixi-mobile-machine-photo { display:grid; place-items:center; flex:0 0 68px; width:100%; height:68px; overflow:hidden; background:#0b100c; color:#c9a837; }
        .ixi-mobile-machine-photo img { display:block; width:100%; height:100%; object-fit:contain; object-position:center center; }
        .ixi-mobile-machine strong { display:block; flex:0 0 19px; width:100%; margin:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding:4px 3px 0; font-size:10px; line-height:15px; }
        .ixi-mobile-machine small { display:block; flex:0 0 16px; padding:0 3px; font-size:9px; line-height:16px; color:#ffcd35; font-weight:800; }
      }
    `}</style>
  </section>;
}
