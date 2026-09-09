import { useMemo, useState } from "react";
import IXIMachineRail from "../IXIMachineRail";
import styles from "./IXITechnicalAtlas.module.css";

export const RAIL_FUNCTIONS = Object.freeze([
  { id: 1, name: "TO FRONT", event: "depth.forward", description: "Moves this machine to the front of its current container." },
  { id: 2, name: "COLOR", event: "relationship.color", description: "Cycles the visible relationship color without changing identity." },
  { id: 3, name: "THICKNESS", event: "relationship.strength", description: "Cycles relationship strength through the production outline states." },
  { id: 4, name: "FACE CHANGE", event: "face.changed", description: "Advances the machine through its four working faces." },
  { id: 5, name: "SEND", event: "distribution.opened", description: "Opens Passport distribution for SMS, WhatsApp or Email." },
  { id: 6, name: "ARMED DELIVERY", event: "destination.sync", description: "Sends the machine to the currently armed valid destination." },
  { id: 7, name: "TO BACK", event: "depth.backward", description: "Moves this machine to the back of its current container." },
]);

export function IXIAtlasMachineRailInspector({ detail, onDetailChange }) {
  return (
    <div className={styles.railInspector}>
      <div className={styles.inspectorIdentity}>
        <span>SELECTED COMPONENT</span><strong>07</strong><i>PRODUCTION</i>
      </div>
      <p className={styles.inspectorCode}>IXI-MC-RAIL / REV 1.0</p>
      <h2>IXI MACHINE RAIL</h2>
      <p className={styles.inspectorShort}>Seven machine commands. One fixed order.</p>
      <div className={styles.detailSwitch} aria-label="Machine Rail detail level">
        <button type="button" className={detail === "FIELD" ? styles.detailActive : ""} onClick={() => onDetailChange("FIELD")}>FIELD</button>
        <button type="button" className={detail === "ENGINEERING" ? styles.detailActive : ""} onClick={() => onDetailChange("ENGINEERING")}>ENGINEERING</button>
      </div>
      <section><h3>OPERATING RULE</h3><p>The rail acts on the active machine. Console actuators remain a separate control system.</p></section>
      <ol className={styles.railInspectorList}>
        {RAIL_FUNCTIONS.map((item) => <li key={item.id}><b>{String(item.id).padStart(2, "0")}</b><span>{item.name}</span></li>)}
      </ol>
      {detail === "ENGINEERING" && (
        <>
          <section><h3>STATE CONTRACT</h3><p>Color, strength and face persist with the object. Depth changes stay inside the current container. Delivery requires an armed destination.</p></section>
          <section className={styles.inspectorSources}><h3>SOURCE OF TRUTH</h3><code>components/IXIMachineRail.js</code><code>components/ixi-chassis/IXIBoard.js</code></section>
        </>
      )}
    </div>
  );
}

export default function IXIAtlasMachineRailDrilldown({
  listing,
  relationship,
  machineFace,
  destinationArmed,
  onToggleDestination,
  onBack,
  onSendFront,
  onSendBack,
  onCycleColor,
  onCycleOutline,
  onCycleFace,
  onDistribution,
  onArmedDelivery,
}) {
  const [composerOpen, setComposerOpen] = useState(false);
  const actions = useMemo(() => [
    onSendFront,
    onCycleColor,
    onCycleOutline,
    onCycleFace,
    () => { setComposerOpen(true); onDistribution("COMPOSER"); },
    onArmedDelivery,
    onSendBack,
  ], [onArmedDelivery, onCycleColor, onCycleFace, onCycleOutline, onDistribution, onSendBack, onSendFront]);

  const openDistribution = () => {
    setComposerOpen(true);
    onDistribution("COMPOSER");
  };

  return (
    <div className={styles.railDrilldown}>
      <div className={styles.railDrillHeader}>
        <button type="button" onClick={onBack}>← BACK TO MACHINE CARD</button>
        <div><span>TA-001 / COMPONENT 07</span><b>IXI MACHINE RAIL</b></div>
        <i>LIVE PRODUCTION CONTROL</i>
      </div>

      <div className={styles.railTelemetry}>
        <span>PASSPORT <b>{listing.passportId}</b></span>
        <span>FACE <b>{String(machineFace).padStart(2, "0")}</b></span>
        <span>COLOR <b>{relationship.color.toUpperCase()}</b></span>
        <span>STRENGTH <b>{relationship.outline}</b></span>
        <button type="button" className={destinationArmed ? styles.destinationArmed : ""} onClick={onToggleDestination}>
          {destinationArmed ? "TOP STACK ARMED" : "ARM TOP STACK"}
        </button>
      </div>

      <div className={styles.railSpecimenStage}>
        <span className={styles.railEyebrow}>PRODUCTION CONTROL SURFACE / CLICK ANY ZONE</span>
        <div className={styles.railNumbers} aria-hidden="true">
          {RAIL_FUNCTIONS.map((item) => <b key={item.id}>{String(item.id).padStart(2, "0")}</b>)}
        </div>
        <div className={styles.productionRail}>
          <IXIMachineRail
            listing={listing}
            boardColor={relationship.color}
            boardOutline={relationship.outline}
            machineFace={machineFace}
            onSendFront={onSendFront}
            onSendBack={onSendBack}
            onCycleColor={onCycleColor}
            onCycleOutline={onCycleOutline}
            onCycleMachineFace={onCycleFace}
            onRailSend={openDistribution}
            armedDestination={destinationArmed ? { id: "stackTop", label: "TOP ACTIVE STACK" } : null}
            onSendToArmedDestination={onArmedDelivery}
          />
        </div>
        <div className={styles.railLabels} aria-hidden="true">
          {RAIL_FUNCTIONS.map((item) => <span key={item.id}>{item.name}</span>)}
        </div>
      </div>

      <div className={styles.railFunctionGrid}>
        {RAIL_FUNCTIONS.map((item, index) => (
          <button type="button" key={item.id} onClick={actions[index]}>
            <b>{String(item.id).padStart(2, "0")}</b>
            <span>{item.name}</span>
            <p>{item.description}</p>
            <code>{item.event}</code>
          </button>
        ))}
      </div>

      {composerOpen && (
        <div className={styles.railComposer} role="dialog" aria-label="Passport distribution demonstration">
          <div><span>DISTRIBUTE PASSPORT</span><b>{listing.passportId}</b></div>
          {["SMS", "WHATSAPP", "EMAIL"].map((channel) => (
            <button type="button" key={channel} onClick={() => { onDistribution(channel); setComposerOpen(false); }}>{channel}</button>
          ))}
          <button type="button" className={styles.composerClose} onClick={() => setComposerOpen(false)} aria-label="Close distribution demonstration">×</button>
        </div>
      )}
    </div>
  );
}
