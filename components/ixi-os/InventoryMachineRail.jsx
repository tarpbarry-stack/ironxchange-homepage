import { useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cleanMachineTitle, getCardImages, getListingId } from "../../lib/listingFormatters";
import { openIXIPassportEmail } from "../../lib/marketplace/passportEmailEvents";
import IXIWorkspaceRailTile from "./IXIWorkspaceRailTile";
import IXIWorkspaceRailHeader from "./IXIWorkspaceRailHeader";
import styles from "./inventoryMachineRail.module.css";

function MachineTile({ item, containerId, sold, onBoard }) {
  const id = String(getListingId(item));
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, data: { containerId, railTile: true } });
  const photo = getCardImages(item)[0];
  return <article ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? .4 : 1 }} className={styles.tile}>
    <IXIWorkspaceRailTile title={cleanMachineTitle(item.title || "Machine")}
      image={typeof photo === "string" ? photo : photo?.url || photo?.src}
      badge={sold ? "SOLD" : ""} side={containerId === "railRight" ? "right" : "left"}
      facts={[{ label: "SN", value: item.serialNumber || item.publicData?.serialNumber || "—" }, { label: "ID", value: item.passportId || item.publicData?.passportId || "—" }]}
      onBoard={() => onBoard(id)} dragHandleProps={{ ...attributes, ...listeners }}>
      <button type="button" onClick={() => openIXIPassportEmail(item)}>SEND</button>
    </IXIWorkspaceRailTile>
  </article>;
}

export default function InventoryMachineRail({ title, side, items, containerId, onClose, onBoard, onArm, armed, sold = false }) {
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
    <IXIWorkspaceRailHeader title={title} count={items.length} side={side} armed={armed} onArm={onArm} onClose={onClose} />
    <div className={styles.search}>
      <input type="search" value={query} onChange={event => { setQuery(event.target.value); setLimit(30); }} placeholder="Search this side…" aria-label={`Search ${title.toLowerCase()} tiles`} />
    </div>
    <div ref={setNodeRef} className={`${styles.list} ${isOver ? styles.dropOver : ""}`}>
      <SortableContext id={containerId} items={items.map(item => String(getListingId(item)))} strategy={verticalListSortingStrategy}>
        {!matches.length && <p className={styles.empty}>{query ? "No matching machines." : "Move a machine here from the board or the other side."}</p>}
        {matches.slice(0, limit).map(item => <MachineTile key={String(getListingId(item))} item={item} containerId={containerId} onBoard={onBoard} sold={sold} />)}
      </SortableContext>
      {matches.length > limit && <button type="button" className={styles.more} onClick={() => setLimit(value => value + 30)}>SHOW MORE · {matches.length - limit} remaining</button>}
    </div>
    <footer className={styles.footer}>{items.length} {items.length === 1 ? "MACHINE" : "MACHINES"} · DRAG TO MOVE</footer>
  </aside>;
}
