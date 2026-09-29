import styles from "./IXIWorkspaceRailTile.module.css";

/** One visual and control contract for a workspace reference tile. Identity and
 * movement stay with the owning environment; the tile only presents them. */
export default function IXIWorkspaceRailTile({
  title, image, media, badge, facts = [], side = "left", selected = false,
  onSelect, onBoard, dragHandleProps = {}, dragHandleRef, disabled = false,
  children
}) {
  const content = <>
    <div className={styles.image}>
      {media || (image ? <img src={image} alt="" loading="lazy" decoding="async" draggable={false} /> : <span>IXI</span>)}
      {badge && <span className={styles.badge}>{badge}</span>}
    </div>
    <strong className={styles.title}>{title || "Machine"}</strong>
    <div className={styles.facts}>{facts.filter(fact => fact?.value).map((fact, index) =>
      <span key={`${fact.label || "fact"}-${index}`}>{fact.label && <b>{fact.label}</b>}{fact.value}</span>
    )}</div>
  </>;

  return <div className={`${styles.tile} ${selected ? styles.selected : ""}`}>
    {onSelect ? <button type="button" className={styles.body} onClick={onSelect} aria-label={`Select ${title}`}>{content}</button>
      : <div className={styles.body}>{content}</div>}
    <div className={styles.actions}>
      <button type="button" className={styles.board} onClick={onBoard} disabled={!onBoard || disabled}
        aria-label={`Open ${title} on board`} title="Open on board">
        <span aria-hidden="true">{side === "right" ? "←" : "→"}</span>
      </button>
      <button type="button" ref={dragHandleRef} className={styles.drag} disabled={disabled}
        {...dragHandleProps} aria-label={`Drag ${title} to reorder or move`} title="Drag to reorder or move">⠿</button>
      {children && <div className={styles.extra}>{children}</div>}
    </div>
  </div>;
}
