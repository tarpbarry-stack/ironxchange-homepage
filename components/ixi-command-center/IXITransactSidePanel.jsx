import { useEffect, useRef, useState } from "react";
import styles from "./IXITransactSidePanel.module.css";

export default function IXITransactSidePanel({ label, dockAt, open, onDismiss, className, children }) {
  const [docked, setDocked] = useState(false);
  const dialog = useRef(null);
  useEffect(() => {
    const media = window.matchMedia(`(min-width: ${dockAt}px)`);
    const update = () => setDocked(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [dockAt]);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !docked && !node.open) node.showModal();
    if ((!open || docked) && node.open) node.close();
  }, [open, docked]);
  useEffect(() => {
    if (docked && open) onDismiss();
  }, [docked, open, onDismiss]);

  if (docked) return <aside className={className} aria-label={label}>{children}</aside>;
  return <dialog ref={dialog} className={styles.drawer} aria-label={label} onClose={onDismiss}>
    <header className={styles.header}><strong>{label}</strong><button type="button" onClick={onDismiss} aria-label={`Close ${label}`}>CLOSE ×</button></header>
    <div className={`${className} ${styles.content}`}>{children}</div>
  </dialog>;
}
