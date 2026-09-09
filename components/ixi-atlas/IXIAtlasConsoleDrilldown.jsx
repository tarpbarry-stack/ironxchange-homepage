import IXIBrowseObjectConsoleRouter from "../ixi-marketplace/IXIBrowseObjectConsoleRouter";
import styles from "./IXITechnicalAtlas.module.css";

const CONSOLE_FUNCTIONS = Object.freeze([
  { id: "01", name: "EXPAND", detail: "Outside actuators add a stable module slot to the left or right." },
  { id: "02", name: "PROTECTED PRIMARY", detail: "The Machine Card remains the protected object and cannot be removed." },
  { id: "03", name: "STABLE SLOTS", detail: "Every panel keeps its slot identity, position and selected face." },
  { id: "04", name: "FACE CYCLE", detail: "The bottom actuator changes only that module’s working face." },
  { id: "05", name: "COLLAPSE", detail: "An inside actuator removes its module without disturbing the machine." },
  { id: "06", name: "SCALE AS ONE", detail: "The gearbox scales the complete assembled console—not separate cards." },
]);

export function IXIAtlasConsoleInspector({ detail, onDetailChange }) {
  return (
    <div className={styles.consoleInspector}>
      <div className={styles.inspectorIdentity}>
        <span>SELECTED COMPONENT</span><strong>08</strong><i>PRODUCTION</i>
      </div>
      <p className={styles.inspectorCode}>IXI-OBJ-CON / REV 1.0</p>
      <h2>CONSOLE COUPLING</h2>
      <p className={styles.inspectorShort}>One machine opens a controlled working system.</p>
      <div className={styles.detailSwitch} aria-label="Console detail level">
        <button type="button" className={detail === "FIELD" ? styles.detailActive : ""} onClick={() => onDetailChange("FIELD")}>FIELD</button>
        <button type="button" className={detail === "ENGINEERING" ? styles.detailActive : ""} onClick={() => onDetailChange("ENGINEERING")}>ENGINEERING</button>
      </div>
      <section><h3>OPERATING RULE</h3><p>Open left or right, change each module face independently and collapse modules without leaving the machine.</p></section>
      <section><h3>CAPACITY</h3><p>One protected Machine Card plus four removable modules. Outside expansion controls disappear automatically at five panels.</p></section>
      {detail === "ENGINEERING" && (
        <>
          <section><h3>STATE CONTRACT</h3><p>Ordered stable slot IDs, protected listing slot, per-slot face state, legacy migration and a five-slot hard limit.</p></section>
          <section className={styles.inspectorSources}><h3>SOURCE OF TRUTH</h3><code>IXIBrowseObjectConsoleRouter.jsx</code><code>IXIMarketplaceObjectConsole.jsx</code><code>IXIObjectConsoleEngine.js</code></section>
        </>
      )}
    </div>
  );
}

export default function IXIAtlasConsoleDrilldown({
  objectId,
  item,
  ixiCardState,
  updateIxiCardState,
  renderParentCard,
  cardScaleMode,
  gear,
  onShiftGear,
  consoleDepth,
  onBack,
}) {
  return (
    <div className={styles.consoleDrilldown}>
      <div className={styles.consoleDrillHeader}>
        <button type="button" className={styles.drillBack} onClick={onBack}>← BACK TO MACHINE CARD</button>
        <div><span>TA-001 / COMPONENT 08</span><b>OBJECT CONSOLE</b></div>
        <div className={styles.gearbox} role="group" aria-label="Console size gearbox">
          <button type="button" onClick={() => onShiftGear(-1)} disabled={gear === 1} aria-label="Make console larger">+</button>
          <strong aria-live="polite" aria-label={`Gear ${gear}`}>{gear}</strong>
          <button type="button" onClick={() => onShiftGear(1)} disabled={gear === 7} aria-label="Make console smaller">−</button>
        </div>
      </div>

      <div className={styles.consoleTelemetry}>
        <span>PASSPORT <b>{item.passportId}</b></span>
        <span>ASSEMBLY <b>{consoleDepth} / 5 PANELS</b></span>
        <span>SCALE <b>GEAR {gear}</b></span>
        <i>{consoleDepth === 5 ? "MAXIMUM SPREAD" : "EXPANSION AVAILABLE"}</i>
      </div>

      <div className={styles.consoleDrillStage}>
        <div className={styles.consoleDrillGuide}>
          <span>← LEFT EXPANSION</span><b>PROTECTED MACHINE OBJECT</b><span>RIGHT EXPANSION →</span>
        </div>
        <div className={styles.consoleDrillViewport}>
          <div className={styles.consoleDrillMount}>
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
        </div>
        <div className={styles.consoleDrillHint}>OUTSIDE ACTUATORS EXPAND · INSIDE ACTUATORS COLLAPSE · BOTTOM ACTUATORS CHANGE MODULE FACE</div>
      </div>

      <div className={styles.consoleFunctionGrid}>
        {CONSOLE_FUNCTIONS.map((item) => (
          <div key={item.id}>
            <b>{item.id}</b><span>{item.name}</span><p>{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
