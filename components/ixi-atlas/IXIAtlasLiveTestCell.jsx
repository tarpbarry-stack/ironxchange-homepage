import { useCallback, useMemo, useState } from "react";
import IXIBrowseObjectConsoleRouter from "../ixi-marketplace/IXIBrowseObjectConsoleRouter";
import IXIMachineCard from "../ixi-machine-card/IXIMachineCard";
import IXIAtlasMachineRailDrilldown, { IXIAtlasMachineRailInspector } from "./IXIAtlasMachineRailDrilldown";
import styles from "./IXITechnicalAtlas.module.css";

const MACHINE_ID = "IXI-ATLAS-WA475";
const FIXTURE = Object.freeze({
  id: { uuid: MACHINE_ID },
  passportId: "IXI-7F3A9C2D",
  title: "2023 Komatsu WA475-10",
  year: 2023,
  make: "Komatsu",
  model: "WA475-10",
  category: "Wheel Loader",
  hours: 4812,
  location: "Abilene, TX",
  price: 315000,
  imageUrls: ["/images/2023-komatsu-wa475-10.jpg"],
  imageCount: 1,
  keywords: ["Wheel Loader", "Tier 4", "Quick Coupler"],
  publicData: {
    machineAccess: "public",
    machineChannel: "marketplace",
    year: 2023,
    make: "Komatsu",
    model: "WA475-10",
    hours: 4812,
    location: "Abilene, TX",
  },
});

const CALLOUTS = [
  ["identity", "02", "PASSPORT", "liveCalloutIdentity"],
  ["family", "03", "FAMILY ROUTER", "liveCalloutFamily"],
  ["face", "04", "PRIMARY FACE", "liveCalloutFace"],
  ["toolbar", "05", "OBJECT TOOLBAR", "liveCalloutToolbar"],
  ["faces", "06", "FACES", "liveCalloutFaces"],
  ["rail", "07", "MACHINE RAIL", "liveCalloutRail"],
  ["console", "08", "CONSOLE", "liveCalloutConsole"],
];

const FACE_NAMES = ["PHOTO", "BUYER", "RELATION", "WORKFLOW"];
const RELATIONSHIP_COLORS = ["none", "green", "yellow", "red", "cyan", "white", "blue", "orange"];
const RELATIONSHIP_STRENGTHS = [1, 3, 5];

const GEAR_TO_SCALE_MODE = Object.freeze({
  1: "focus",
  2: "work",
  3: "xl",
  4: "large",
  5: "medium",
  6: "compact",
  7: "micro",
});

const AUTO_GEAR_BY_CONSOLE_DEPTH = Object.freeze({
  1: 3,
  2: 4,
  3: 5,
  4: 6,
  5: 7,
});

function clock() {
  return new Date().toISOString().slice(11, 23);
}

function FieldInspector({ part, detail, onDetailChange }) {
  return (
    <div className={styles.objectInspector}>
      <div className={styles.inspectorIdentity}>
        <span>SELECTED ASSEMBLY</span>
        <strong>{part.index}</strong>
        <i>{part.status}</i>
      </div>
      <p className={styles.inspectorCode}>{part.code} / REV {part.version}</p>
      <h2>{part.name}</h2>
      <p className={styles.inspectorShort}>{part.short}</p>
      <div className={styles.detailSwitch} aria-label="Inspector detail level">
        <button type="button" className={detail === "FIELD" ? styles.detailActive : ""} onClick={() => onDetailChange("FIELD")}>FIELD</button>
        <button type="button" className={detail === "ENGINEERING" ? styles.detailActive : ""} onClick={() => onDetailChange("ENGINEERING")}>ENGINEERING</button>
      </div>
      <section><h3>PURPOSE</h3><p>{part.purpose}</p></section>
      <section><h3>CUSTOMER VALUE</h3><p>{part.benefit}</p></section>
      <section><h3>FIELD USE</h3><p>{part.use}</p></section>
      {detail === "ENGINEERING" && (
        <>
          <section><h3>OPERATING SPEC</h3><ul>{part.specs.map((value) => <li key={value}>{value}</li>)}</ul></section>
          <div className={styles.inspectorFlow}>
            <section><h3>INPUTS</h3>{part.inputs.map((value) => <span key={value}>{value}</span>)}</section>
            <section><h3>OUTPUTS</h3>{part.outputs.map((value) => <span key={value}>{value}</span>)}</section>
          </div>
          <section className={styles.inspectorSources}><h3>SOURCE OF TRUTH</h3>{part.sources.map((value) => <code key={value}>{value}</code>)}</section>
        </>
      )}
    </div>
  );
}

function PassportPulse({ events, machineFace, relationship, consoleDepth }) {
  return (
    <div className={styles.pulseContent}>
      <div className={styles.pulseStatus}>
        <span>CONTROLLED FIXTURE</span><i>LIVE</i>
      </div>
      <dl className={styles.fixtureState}>
        <div><dt>PASSPORT</dt><dd>IXI-7F3A9C2D</dd></div>
        <div><dt>FACE</dt><dd>{String(machineFace).padStart(2, "0")} / 04</dd></div>
        <div><dt>RELATION</dt><dd>{relationship.color.toUpperCase()} / {relationship.outline}</dd></div>
        <div><dt>CONSOLE</dt><dd>{consoleDepth === 1 ? "CLOSED" : `${consoleDepth} PANELS`}</dd></div>
      </dl>
      <div className={styles.eventStream} aria-live="polite">
        {events.map((item) => (
          <div key={item.id}>
            <span>{item.time}</span><b>{item.source}</b><code>{item.event}</code><small>{item.result}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function IXIAtlasLiveTestCell({ selected, onSelect, part }) {
  const [mode, setMode] = useState("INSPECT");
  const [bayTab, setBayTab] = useState("OBJECT");
  const [detail, setDetail] = useState("FIELD");
  const [machineFace, setMachineFace] = useState(1);
  const [gear, setGear] = useState(3);
  const [railDestinationArmed, setRailDestinationArmed] = useState(false);
  const [cardState, setCardState] = useState({ color: "none", outline: 1 });
  const [sequence, setSequence] = useState(1);
  const [events, setEvents] = useState([
    { id: 0, time: "READY", source: "ATLAS", event: "fixture.mounted", result: "IXI-7F3A9C2D" },
  ]);

  const record = useCallback((source, event, result) => {
    setSequence((value) => value + 1);
    setEvents((current) => [{ id: sequence, time: clock(), source, event, result }, ...current].slice(0, 7));
  }, [sequence]);

  const ixiCardState = useMemo(() => ({ [MACHINE_ID]: cardState }), [cardState]);
  const consoleDepth = Array.isArray(cardState.consoleSlots) ? cardState.consoleSlots.length : 1;

  const updateCardState = useCallback((_id, patch) => {
    setCardState((current) => ({ ...current, ...patch }));
    if (patch.consoleSlots) {
      const nextDepth = patch.consoleSlots.length;
      const automaticGear = AUTO_GEAR_BY_CONSOLE_DEPTH[nextDepth] || 7;
      setGear((current) => Math.max(current, automaticGear));
      record("CONSOLE", "console.layout", `${nextDepth} PANELS / AUTO GEAR ${automaticGear}`);
    }
  }, [record]);

  const shiftGear = useCallback((direction) => {
    const next = Math.max(1, Math.min(7, gear + direction));
    if (next !== gear) {
      setGear(next);
      record("GEARBOX", "scale.changed", `GEAR ${next}`);
    }
  }, [gear, record]);

  const changeRelationship = useCallback((_id, patch) => {
    setCardState((current) => ({ ...current, ...patch }));
    const key = Object.prototype.hasOwnProperty.call(patch, "color") ? "color" : "strength";
    const result = key === "color" ? patch.color.toUpperCase() : `OUTLINE ${patch.outline}`;
    record(key === "color" ? "RAIL / 02" : "RAIL / 03", `relationship.${key}`, result);
  }, [record]);

  const selectFace = useCallback((face) => {
    setMachineFace(face);
    record("RAIL / 04", "face.changed", `FACE ${String(face).padStart(2, "0")}`);
  }, [record]);

  const cycleFace = useCallback(() => selectFace(machineFace === 4 ? 1 : machineFace + 1), [machineFace, selectFace]);

  const sendFront = useCallback(() => record("RAIL / 01", "depth.forward", "MOVED TO FRONT"), [record]);
  const sendBack = useCallback(() => record("RAIL / 07", "depth.backward", "MOVED TO BACK"), [record]);

  const cycleRailColor = useCallback(() => {
    const current = RELATIONSHIP_COLORS.indexOf(cardState.color);
    const next = RELATIONSHIP_COLORS[(current + 1) % RELATIONSHIP_COLORS.length];
    changeRelationship(MACHINE_ID, { color: next });
  }, [cardState.color, changeRelationship]);

  const cycleRailOutline = useCallback(() => {
    const current = RELATIONSHIP_STRENGTHS.indexOf(cardState.outline);
    const next = RELATIONSHIP_STRENGTHS[(current + 1) % RELATIONSHIP_STRENGTHS.length];
    changeRelationship(MACHINE_ID, { outline: next });
  }, [cardState.outline, changeRelationship]);

  const distributePassport = useCallback((channel) => {
    record("RAIL / 05", "distribution.opened", channel === "COMPOSER" ? "CHANNEL SELECTOR OPEN" : `${channel} DEMO CAPTURED`);
  }, [record]);

  const deliverToArmedDestination = useCallback(() => {
    record("RAIL / 06", "destination.sync", railDestinationArmed ? "SENT TO TOP ACTIVE STACK" : "NO DESTINATION ARMED");
  }, [railDestinationArmed, record]);

  const toggleRailDestination = useCallback(() => {
    const next = !railDestinationArmed;
    setRailDestinationArmed(next);
    record("ENVIRONMENT", "destination.armed", next ? "TOP ACTIVE STACK" : "OFF");
  }, [railDestinationArmed, record]);

  const resetFixture = useCallback(() => {
    setMachineFace(1);
    setGear(3);
    setRailDestinationArmed(false);
    setCardState({ color: "none", outline: 1 });
    setEvents([{ id: sequence, time: clock(), source: "ATLAS", event: "fixture.reset", result: "BASELINE RESTORED" }]);
  }, [sequence]);

  const renderCard = useCallback((consoleProps = {}) => (
    <IXIMachineCard
      listing={FIXTURE}
      cardContext="marketplace"
      suppressFamilyLog
      imagePriority
      machineFace={machineFace}
      ixiState={cardState}
      showSave={false}
      enableMarketplaceDistribution={false}
      onCycleMachineFace={cycleFace}
      onIxiStateChange={changeRelationship}
      onSendFront={sendFront}
      onSendBack={sendBack}
      onSendToArmedDestination={deliverToArmedDestination}
      {...consoleProps}
    />
  ), [cardState, changeRelationship, cycleFace, deliverToArmedDestination, machineFace, sendBack, sendFront]);

  return (
    <div className={styles.objectWorkbench}>
      <div className={styles.workbenchHeader}>
        <div><span>IXI OBJECT WORKBENCH</span><b>MARKETPLACE / CONTROLLED DEMO</b></div>
        <i>REAL COMPONENT · ZERO WRITES</i>
      </div>

      <div className={styles.workbenchBody}>
        {selected === "rail" ? (
          <IXIAtlasMachineRailDrilldown
            listing={FIXTURE}
            relationship={cardState}
            machineFace={machineFace}
            destinationArmed={railDestinationArmed}
            onToggleDestination={toggleRailDestination}
            onBack={() => onSelect("object")}
            onSendFront={sendFront}
            onSendBack={sendBack}
            onCycleColor={cycleRailColor}
            onCycleOutline={cycleRailOutline}
            onCycleFace={cycleFace}
            onDistribution={distributePassport}
            onArmedDelivery={deliverToArmedDestination}
          />
        ) : (
        <div className={styles.machineBench}>
          <div className={styles.benchControls}>
            <div className={styles.modeSwitch} aria-label="Workbench mode">
              {["INSPECT", "OPERATE"].map((value) => (
                <button key={value} type="button" className={mode === value ? styles.modeActive : ""}
                  onClick={() => setMode(value)} aria-pressed={mode === value}>{value}</button>
              ))}
            </div>
            <div className={styles.faceControls} aria-label="Machine faces">
              {FACE_NAMES.map((name, index) => (
                <button key={name} type="button" className={machineFace === index + 1 ? styles.faceActive : ""}
                  onClick={() => selectFace(index + 1)} aria-pressed={machineFace === index + 1}>
                  <span>{String(index + 1).padStart(2, "0")}</span>{name}
                </button>
              ))}
            </div>
            <div className={styles.benchUtilities}>
              <div className={styles.gearbox} role="group" aria-label="Card and console size gearbox">
                <button type="button" onClick={() => shiftGear(-1)} disabled={gear === 1} aria-label="Make card and console larger">+</button>
                <strong aria-live="polite" aria-label={`Gear ${gear}`}>{gear}</strong>
                <button type="button" onClick={() => shiftGear(1)} disabled={gear === 7} aria-label="Make card and console smaller">−</button>
              </div>
              <button type="button" className={styles.resetCell} onClick={resetFixture}>RESET</button>
            </div>
          </div>

          <div className={styles.consoleViewport} onClickCapture={(event) => {
            const anchor = event.target.closest?.("a");
            if (anchor) {
              event.preventDefault();
              event.stopPropagation();
              record("FACE / 01", "navigation.intercepted", "STAYED IN WORKBENCH");
              return;
            }
            if (event.target.closest?.('button[aria-label="Send machine"]')) {
              record("RAIL / 05", "machine.send", "COMMAND CAPTURED");
            }
          }}>
            <div className={`${styles.consoleMount} ${consoleDepth > 1 ? styles.consoleOpen : ""}`}>
              <IXIBrowseObjectConsoleRouter
                objectId={MACHINE_ID}
                item={FIXTURE}
                ixiCardState={ixiCardState}
                updateIxiCardState={updateCardState}
                enableCardScaling
                cardScaleMode={GEAR_TO_SCALE_MODE[gear]}
                renderParentCard={renderCard}
              />
              {mode === "INSPECT" && consoleDepth === 1 && CALLOUTS.map(([id, index, label, className]) => (
                <button type="button" key={id}
                  className={`${styles.liveCallout} ${styles[className]} ${selected === id ? styles.activeLiveCallout : ""}`}
                  onClick={() => onSelect(id)} aria-pressed={selected === id}>
                  <i>{index}</i><span>{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className={styles.consoleHint}>
            <span>{consoleDepth === 1 ? "USE SIDE ACTUATORS TO OPEN CONSOLE" : "SCROLL HORIZONTALLY · BOTTOM CONTROL CHANGES CONSOLE FACE"}</span>
            <b>GEAR {gear} · {consoleDepth} / 5 PANELS</b>
          </div>
        </div>
        )}

        <aside className={styles.controlBay}>
          <div className={styles.controlBayTabs} role="tablist" aria-label="Object Workbench data">
            <button type="button" role="tab" aria-selected={bayTab === "OBJECT"}
              className={bayTab === "OBJECT" ? styles.controlBayTabActive : ""} onClick={() => setBayTab("OBJECT")}>OBJECT</button>
            <button type="button" role="tab" aria-selected={bayTab === "PULSE"}
              className={bayTab === "PULSE" ? styles.controlBayTabActive : ""} onClick={() => setBayTab("PULSE")}>PASSPORT PULSE <i>{events.length}</i></button>
          </div>
          <div className={styles.controlBayBody} role="tabpanel">
            {bayTab === "OBJECT" ? (
              selected === "rail" ? (
                <IXIAtlasMachineRailInspector detail={detail} onDetailChange={setDetail} />
              ) : (
                <FieldInspector part={part} detail={detail} onDetailChange={setDetail} />
              )
            ) : (
              <PassportPulse events={events} machineFace={machineFace} relationship={cardState} consoleDepth={consoleDepth} />
            )}
          </div>
          <div className={styles.controlBayFooter}>
            <span>IXI-7F3A9C2D</span><b>FIELD / ENGINEERING</b>
          </div>
        </aside>
      </div>
    </div>
  );
}
