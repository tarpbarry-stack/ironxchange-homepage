import { useMemo, useState } from "react";
import { cleanMachineTitle, getCardImages, getListingId } from "../../lib/listingFormatters";
import { openIXIPassportEmail } from "../../lib/marketplace/passportEmailEvents";
import styles from "./inventoryMachineRail.module.css";

export default function InventoryMachineRail({ title, items, savedIds, onOpen, onSave, onClose, sold = false, emptyMessage }) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(30);
  const matches = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return items;
    return items.filter(item => [item.title, item.make, item.model, item.year, item.serialNumber, item.passportId, item.publicData?.passportId]
      .filter(Boolean).join(" ").toLowerCase().includes(text));
  }, [items, query]);

  return <aside className={styles.rail} aria-label={`${title} machine tiles`}>
    <header className={styles.heading}><div><small>IXI MACHINES</small><h2>{title} <span>{items.length}</span></h2></div><button type="button" onClick={onClose} aria-label={`Close ${title.toLowerCase()} sidebar`}>×</button></header>
    <div className={styles.search}><input type="search" value={query} onChange={event => { setQuery(event.target.value); setLimit(30); }} placeholder="Search machine, SN, ID…" aria-label={`Search ${title.toLowerCase()} tiles`} /></div>
    <div className={styles.list}>
      {!matches.length && <p className={styles.empty}>{query ? "No matching machines." : emptyMessage}</p>}
      {matches.slice(0, limit).map(item => {
        const id = String(getListingId(item));
        const saved = savedIds.includes(id);
        const photo = getCardImages(item)[0];
        return <article className={styles.tile} key={id}>
          <button type="button" className={styles.open} onClick={() => onOpen(item)} aria-label={`Open ${item.title || "machine"} on board`}>
            <div className={styles.photo}>{photo ? <img src={typeof photo === "string" ? photo : photo.url || photo.src} alt="" loading="lazy" /> : <span>IXI</span>}{sold && <b>SOLD</b>}</div>
            <strong>{cleanMachineTitle(item.title || "Machine")}</strong>
            <small>{item.hours ? `${item.hours} HRS` : ""} {item.passportId || item.publicData?.passportId || ""}</small>
          </button>
          <div className={styles.actions}>
            <button type="button" onClick={() => onOpen(item)}>BOARD ↗</button>
            <button type="button" onClick={() => openIXIPassportEmail(item)}>SEND</button>
            <button type="button" onClick={() => onSave(item)} aria-pressed={saved}>{saved ? "SAVED ✓" : "SAVE"}</button>
          </div>
        </article>;
      })}
      {matches.length > limit && <button type="button" className={styles.more} onClick={() => setLimit(value => value + 30)}>SHOW MORE · {matches.length - limit} remaining</button>}
    </div>
    <footer className={styles.footer}>{matches.length} {matches.length === 1 ? "MACHINE" : "MACHINES"}</footer>
  </aside>;
}
