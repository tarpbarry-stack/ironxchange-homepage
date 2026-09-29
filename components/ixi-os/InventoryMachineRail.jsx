import { useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cleanMachineTitle, getCardImages, getListingId } from "../../lib/listingFormatters";
import { openIXIPassportEmail } from "../../lib/marketplace/passportEmailEvents";
import styles from "./inventoryMachineRail.module.css";

function MachineTile({ item, containerId, sold }) {
  const id = String(getListingId(item));
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, data: { containerId, railTile: true } });
  const photo = getCardImages(item)[0];
  return <article ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? .4 : 1 }} className={styles.tile}>
    <div className={styles.tileTop}>
      <button type="button" className={styles.dragSurface} aria-label={`Drag ${item.title || "machine"} to reorder or move`} {...attributes} {...listeners}>
        <div className={styles.photo}>{photo ? <img src={typeof photo === "string" ? photo : photo.url || photo.src} alt="" loading="lazy" /> : <span>IXI</span>}{sold && <b>SOLD</b>}</div>
        <strong>{cleanMachineTitle(item.title || "Machine")}</strong>
        <small>{item.hours ? `${item.hours} HRS` : ""} {item.passportId || item.publicData?.passportId || ""}</small>
        <span className={styles.grip} aria-hidden="true">⋮⋮</span>
      </button>
    </div>
    <div className={styles.actions}>
      <button type="button" onClick={() => openIXIPassportEmail(item)}>SEND</button>
    </div>
  </article>;
}

export default function InventoryMachineRail({ title, side, items, containerId, onClose, sold = false }) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(30);
  const { setNodeRef, isOver } = useDroppable({ id: `inventory-${side}-rail`, data: { containerId } });
  const matches = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return items;
    return items.filter(item => [item.title, item.make, item.model, item.year, item.serialNumber, item.passportId, item.publicData?.passportId]
      .filter(Boolean).join(" ").toLowerCase().includes(text));
  }, [items, query]);

  return <aside className={styles.rail} aria-label={`${title} machine tiles`}>
    <header className={styles.heading}><div><small>IXI MACHINES</small><h2>{title} <span>{items.length}</span></h2></div><button type="button" onClick={onClose} aria-label={`Close ${title.toLowerCase()} sidebar`}>×</button></header>
    <div className={styles.search}>
      <input type="search" value={query} onChange={event => { setQuery(event.target.value); setLimit(30); }} placeholder="Search this side…" aria-label={`Search ${title.toLowerCase()} tiles`} />
    </div>
    <div ref={setNodeRef} className={`${styles.list} ${isOver ? styles.dropOver : ""}`}>
      <SortableContext id={containerId} items={items.map(item => String(getListingId(item)))} strategy={verticalListSortingStrategy}>
        {!matches.length && <p className={styles.empty}>{query ? "No matching machines." : "Move a machine here from the board or the other side."}</p>}
        {matches.slice(0, limit).map(item => <MachineTile key={String(getListingId(item))} item={item} containerId={containerId} sold={sold} />)}
      </SortableContext>
      {matches.length > limit && <button type="button" className={styles.more} onClick={() => setLimit(value => value + 30)}>SHOW MORE · {matches.length - limit} remaining</button>}
    </div>
    <footer className={styles.footer}>{items.length} {items.length === 1 ? "MACHINE" : "MACHINES"} · DRAG TO MOVE</footer>
  </aside>;
}
