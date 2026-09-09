import IXIScaledCardShell from "../ixi-machine-object/IXIScaledCardShell";
import styles from "./IXITechnicalAtlas.module.css";

const FACE_REGISTER = Object.freeze([
  {
    face: 1,
    name: "PHOTO",
    title: "MACHINE RECOGNITION",
    detail: "Photo, year, make, model, hours, price and location.",
    contents: ["Machine photo", "Identity headline", "Hours", "Price + location"],
  },
  {
    face: 2,
    name: "BUYER",
    title: "BUYER DECISION FACE",
    detail: "Passport, seller identity, serial, stock, machine bio and contact actions.",
    contents: ["IXI Passport", "Seller identity", "Serial + stock", "Buyer actions"],
  },
  {
    face: 3,
    name: "DEAL SHEET",
    title: "PURCHASE WORKSHEET",
    detail: "Offer, down payment, trade, freight, tax, financing and payment estimates.",
    contents: ["Bid structure", "Freight + tax", "Finance amount", "36 / 48 / 60 months"],
  },
  {
    face: 4,
    name: "NETWORK",
    title: "MARKETPLACE ENTRY",
    detail: "Free-listing message and direct actions for joining the IronXchange network.",
    contents: ["Free listing", "No card required", "Network message", "Join + post actions"],
  },
]);

export function IXIAtlasFacesInspector({ machineFace, detail, onDetailChange }) {
  const active = FACE_REGISTER[machineFace - 1] || FACE_REGISTER[0];

  return (
    <div className={styles.facesInspector}>
      <div className={styles.inspectorIdentity}>
        <span>SELECTED COMPONENT</span><strong>06</strong><i>PRODUCTION</i>
      </div>
      <p className={styles.inspectorCode}>IXI-OBJ-FACES / REV 1.0</p>
      <h2>MACHINE FACES</h2>
      <p className={styles.inspectorShort}>Multiple working surfaces. One machine Passport.</p>
      <div className={styles.detailSwitch} aria-label="Machine Faces detail level">
        <button type="button" className={detail === "FIELD" ? styles.detailActive : ""} onClick={() => onDetailChange("FIELD")}>FIELD</button>
        <button type="button" className={detail === "ENGINEERING" ? styles.detailActive : ""} onClick={() => onDetailChange("ENGINEERING")}>ENGINEERING</button>
      </div>
      <section><h3>ACTIVE FACE</h3><p>{String(active.face).padStart(2, "0")} / {active.name} — {active.title}</p></section>
      <section><h3>OPERATING RULE</h3><p>Rail command 04 advances one face. Direct face selectors open any face immediately.</p></section>
      <section><h3>IDENTITY RULE</h3><p>The face changes. The machine, Passport, relationship, console state and gear do not.</p></section>
      {detail === "ENGINEERING" && (
        <>
          <section><h3>FACE CONTRACT</h3><p>Marketplace family owns four production faces inside one fixed 300 × 400 native envelope.</p></section>
          <section className={styles.inspectorSources}><h3>SOURCE OF TRUTH</h3><code>MarketplaceListingCard.js</code><code>IXIMachineObjectFace2.js</code><code>IXIMachineObjectFace3.js</code><code>IXIMachineObjectFace4.js</code></section>
        </>
      )}
    </div>
  );
}

export default function IXIAtlasFacesDrilldown({
  item,
  renderParentCard,
  cardScaleMode,
  gear,
  onShiftGear,
  machineFace,
  onSelectFace,
  mode,
  onModeChange,
  onBack,
}) {
  const active = FACE_REGISTER[machineFace - 1] || FACE_REGISTER[0];

  return (
    <div className={styles.facesDrilldown}>
      <div className={styles.facesDrillHeader}>
        <button type="button" className={styles.drillBack} onClick={onBack}>← BACK TO MACHINE CARD</button>
        <div><span>TA-001 / COMPONENT 06</span><b>MACHINE FACES</b></div>
        <div className={styles.gearbox} role="group" aria-label="Machine Faces size gearbox">
          <button type="button" onClick={() => onShiftGear(-1)} disabled={gear === 1} aria-label="Make card larger">+</button>
          <strong aria-live="polite" aria-label={`Gear ${gear}`}>{gear}</strong>
          <button type="button" onClick={() => onShiftGear(1)} disabled={gear === 7} aria-label="Make card smaller">−</button>
        </div>
      </div>

      <div className={styles.facesTelemetry}>
        <span>PASSPORT <b>{item.passportId}</b></span>
        <span>FACE <b>{String(machineFace).padStart(2, "0")} / 04</b></span>
        <span>GEAR <b>{gear}</b></span>
        <i>IDENTITY + STATE PRESERVED</i>
      </div>

      <div className={styles.facesModeBar}>
        <div className={styles.modeSwitch} aria-label="Machine Faces mode">
          {["INSPECT", "OPERATE"].map((value) => (
            <button key={value} type="button" className={mode === value ? styles.modeActive : ""}
              onClick={() => onModeChange(value)} aria-pressed={mode === value}>{value}</button>
          ))}
        </div>
        <span>RAIL 04 CYCLES THE LIVE CARD · DIRECT SELECTORS OPEN ANY FACE</span>
      </div>

      <div className={styles.facesStage} onClickCapture={(event) => {
        const anchor = event.target.closest?.("a");
        if (anchor) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}>
        <div className={styles.facesCardMount}>
          <IXIScaledCardShell size={cardScaleMode} objectFamily="marketplace">
            {renderParentCard()}
          </IXIScaledCardShell>
        </div>
        {mode === "INSPECT" && (
          <aside className={styles.faceInspectionPlate}>
            <span>FACE {String(active.face).padStart(2, "0")}</span>
            <b>{active.title}</b>
            <p>{active.detail}</p>
            <div>{active.contents.map((value) => <i key={value}>{value}</i>)}</div>
          </aside>
        )}
      </div>

      <div className={styles.faceRegister} aria-label="Marketplace Machine Faces">
        {FACE_REGISTER.map((entry) => (
          <button key={entry.face} type="button" className={machineFace === entry.face ? styles.faceSelected : ""}
            onClick={() => onSelectFace(entry.face)} aria-pressed={machineFace === entry.face}>
            <b>{String(entry.face).padStart(2, "0")}</b>
            <span>{entry.name}</span>
            <small>{entry.detail}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
