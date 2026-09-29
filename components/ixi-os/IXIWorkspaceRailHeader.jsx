import styles from "./IXIWorkspaceRailHeader.module.css";

export default function IXIWorkspaceRailHeader({ title, count, side, armed = false, onArm, onClose, children }) {
  return <header className={`${styles.header} ${armed ? styles.armed : ""}`}>
    <div className={styles.label}><small>IXI WORKSPACE</small><strong>{title} <span>{count ?? "…"}</span></strong></div>
    {onArm && <button type="button" className={styles.arm} aria-pressed={armed} onClick={onArm}
      aria-label={`${armed ? "Disarm" : "Arm"} ${title} for blue card send`} title="Select this rail for the blue card control">
      <span aria-hidden="true">●</span> {armed ? "ARMED" : "ARM"}
    </button>}
    {children}
    {onClose && <button type="button" className={styles.close} onClick={onClose} aria-label={`Close ${title}`}>
      {side === "right" ? "›" : "‹"}
    </button>}
  </header>;
}
