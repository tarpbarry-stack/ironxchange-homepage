import { useCallback, useMemo, useState } from "react";
import IXIBrowseObjectConsoleRouter from "../ixi-marketplace/IXIBrowseObjectConsoleRouter";
import IXIMachineCard from "../ixi-machine-card/IXIMachineCard";
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
      record("CONSOLE", "console.layout", `${patch.consoleSlots.length} PANEL${patch.consoleSlots.length === 1 ? "" : "S"}`);
    }
  }, [record]);

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

  const resetFixture = useCallback(() => {
    setMachineFace(1);
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
      onSendFront={() => record("RAIL / 01", "depth.forward", "COMMAND CAPTURED")}
      onSendBack={() => record("RAIL / 07", "depth.backward", "COMMAND CAPTURED")}
      onSendToArmedDestination={() => record("RAIL / 06", "destination.sync", "NO DESTINATION ARMED")}
      {...consoleProps}
    />
  ), [cardState, changeRelationship, cycleFace, machineFace, record]);

  return (
    <div className={styles.objectWorkbench}>
      <div className={styles.workbenchHeader}>
        <div><span>IXI OBJECT WORKBENCH</span><b>MARKETPLACE / CONTROLLED DEMO</b></div>
        <i>REAL COMPONENT · ZERO WRITES</i>
      </div>

      <div className={styles.workbenchBody}>
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
            <button type="button" className={styles.resetCell} onClick={resetFixture}>RESET</button>
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
            <b>{consoleDepth} / 4 PANELS</b>
          </div>
        </div>

        <aside className={styles.controlBay}>
          <div className={styles.controlBayTabs} role="tablist" aria-label="Object Workbench data">
            <button type="button" role="tab" aria-selected={bayTab === "OBJECT"}
              className={bayTab === "OBJECT" ? styles.controlBayTabActive : ""} onClick={() => setBayTab("OBJECT")}>OBJECT</button>
            <button type="button" role="tab" aria-selected={bayTab === "PULSE"}
              className={bayTab === "PULSE" ? styles.controlBayTabActive : ""} onClick={() => setBayTab("PULSE")}>PASSPORT PULSE <i>{events.length}</i></button>
          </div>
          <div className={styles.controlBayBody} role="tabpanel">
            {bayTab === "OBJECT" ? (
              <FieldInspector part={part} detail={detail} onDetailChange={setDetail} />
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
