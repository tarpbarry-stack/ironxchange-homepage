import IXIBrowseObjectConsoleRouter from "../ixi-marketplace/IXIBrowseObjectConsoleRouter";
import styles from "./IXITechnicalAtlas.module.css";

const GEARS = Object.freeze([
  { gear: 1, mode: "FOCUS", use: "Largest inspection view" },
  { gear: 2, mode: "WORK", use: "Large working view" },
  { gear: 3, mode: "XL", use: "Single-card baseline" },
  { gear: 4, mode: "LARGE", use: "Two-panel console" },
  { gear: 5, mode: "MEDIUM", use: "Three-panel console" },
  { gear: 6, mode: "COMPACT", use: "Four-panel console" },
  { gear: 7, mode: "MICRO", use: "Five-panel console" },
]);

export function IXIAtlasGearboxInspector({ detail, onDetailChange }) {
  return (
    <div className={styles.gearInspector}>
      <div className={styles.inspectorIdentity}>
        <span>SELECTED COMPONENT</span><strong>09</strong><i>PRODUCTION</i>
      </div>
      <p className={styles.inspectorCode}>IXI-OBJ-GEAR / REV 1.0</p>
      <h2>CARD GEARBOX</h2>
      <p className={styles.inspectorShort}>One size control for the complete machine object.</p>
      <div className={styles.detailSwitch} aria-label="Gearbox detail level">
        <button type="button" className={detail === "FIELD" ? styles.detailActive : ""} onClick={() => onDetailChange("FIELD")}>FIELD</button>
        <button type="button" className={detail === "ENGINEERING" ? styles.detailActive : ""} onClick={() => onDetailChange("ENGINEERING")}>ENGINEERING</button>
      </div>
      <section><h3>OPERATING RULE</h3><p>Plus makes the object larger. Minus makes it smaller. Only the number changes in the control.</p></section>
      <section><h3>CONSOLE RULE</h3><p>Opening panels automatically selects the smallest safe gear for the assembled console.</p></section>
      {detail === "ENGINEERING" && (
        <>
          <section><h3>GEOMETRY CONTRACT</h3><p>The shell owns width, height and scale. The card, rail and actuators transform together from one origin.</p></section>
          <section className={styles.inspectorSources}><h3>SOURCE OF TRUTH</h3><code>IXIScaledCardShell.js</code><code>ixiObjectGeometry.js</code><code>IXIScaleEngine.js</code></section>
        </>
      )}
    </div>
  );
}

export default function IXIAtlasGearboxDrilldown({
  objectId,
  item,
  ixiCardState,
  updateIxiCardState,
  renderParentCard,
  cardScaleMode,
  gear,
  onShiftGear,
  onSetGear,
  onBack,
}) {
  const active = GEARS.find((entry) => entry.gear === gear) || GEARS[2];

  return (
    <div className={styles.gearDrilldown}>
      <div className={styles.gearDrillHeader}>
        <button type="button" className={styles.drillBack} onClick={onBack}>← BACK TO MACHINE CARD</button>
        <div><span>TA-001 / COMPONENT 09</span><b>CARD GEARBOX</b></div>
        <div className={styles.gearbox} role="group" aria-label="Card size gearbox">
          <button type="button" onClick={() => onShiftGear(-1)} disabled={gear === 1} aria-label="Make card larger">+</button>
          <strong aria-live="polite" aria-label={`Gear ${gear}`}>{gear}</strong>
          <button type="button" onClick={() => onShiftGear(1)} disabled={gear === 7} aria-label="Make card smaller">−</button>
        </div>
      </div>

      <div className={styles.gearTelemetry}>
        <span>GEAR <b>{gear} / 7</b></span>
        <span>MODE <b>{active.mode}</b></span>
        <span>RULE <b>+ LARGER · − SMALLER</b></span>
        <i>{active.use}</i>
      </div>

      <div className={styles.gearStage}>
        <div className={styles.gearCardMount}>
          <IXIBrowseObjectConsoleRouter
            objectId={objectId}
            item={item}
            ixiCardState={ixiCardState}
            updateIxiCardState={updateIxiCardState}
            enableCardScaling
            cardScaleMode={cardScaleMode}
            renderParentCard={renderParentCard}
          />
        </div>
        <div className={styles.gearReadout}><span>OBJECT SCALE</span><b>{active.mode}</b><i>GEAR {gear}</i></div>
      </div>

      <div className={styles.gearSelector} aria-label="All gearbox sizes">
        {GEARS.map((entry) => (
          <button key={entry.gear} type="button" className={gear === entry.gear ? styles.gearSelected : ""}
            onClick={() => onSetGear(entry.gear)} aria-pressed={gear === entry.gear}>
            <b>{entry.gear}</b><span>{entry.mode}</span><small>{entry.use}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
