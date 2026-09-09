import { useCallback, useMemo, useState } from "react";
import IXIMachineCard from "../ixi-machine-card/IXIMachineCard";
import styles from "./IXITechnicalAtlas.module.css";

const FIXTURE = Object.freeze({
  id: { uuid: "IXI-ATLAS-WA475" },
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

const MODES = ["SEE IT", "TOUCH IT", "FOLLOW IT"];
const CALLOUTS = [
  ["identity", "02", "PASSPORT", "liveCalloutIdentity"],
  ["family", "03", "FAMILY ROUTER", "liveCalloutFamily"],
  ["face", "04", "PRIMARY FACE", "liveCalloutFace"],
  ["toolbar", "05", "OBJECT TOOLBAR", "liveCalloutToolbar"],
  ["faces", "06", "FACES", "liveCalloutFaces"],
  ["rail", "07", "MACHINE RAIL", "liveCalloutRail"],
  ["console", "08", "CONSOLE COUPLING", "liveCalloutConsole"],
];
const ACTION_COPY = {
  "SEE IT": "Select a numbered assembly to inspect its contract.",
  "TOUCH IT": "Operate the production card. Try Flip, Color, Strength, Send, Sync or a side actuator.",
  "FOLLOW IT": "Every test action becomes an inspectable Passport Pulse below.",
};

function clock() {
  return new Date().toISOString().slice(11, 23);
}

export default function IXIAtlasLiveTestCell({ selected, onSelect }) {
  const [mode, setMode] = useState("SEE IT");
  const [machineFace, setMachineFace] = useState(1);
  const [relationship, setRelationship] = useState({ color: "none", outline: 1 });
  const [consoleSide, setConsoleSide] = useState("");
  const [sequence, setSequence] = useState(1);
  const [events, setEvents] = useState([
    { id: 0, time: "READY", source: "ATLAS", event: "fixture.mounted", result: "IXI-7F3A9C2D" },
  ]);

  const record = useCallback((source, event, result) => {
    setSequence((value) => value + 1);
    setEvents((current) => [
      { id: sequence, time: clock(), source, event, result },
      ...current,
    ].slice(0, 6));
  }, [sequence]);

  const cycleFace = useCallback(() => {
    const next = machineFace === 4 ? 1 : machineFace + 1;
    setMachineFace(next);
    record("RAIL / 04", "face.changed", `FACE ${String(next).padStart(2, "0")}`);
  }, [machineFace, record]);

  const changeRelationship = useCallback((_id, change) => {
    const next = { ...relationship, ...change };
    const key = Object.prototype.hasOwnProperty.call(change, "color") ? "color" : "strength";
    setRelationship(next);
    record(
      key === "color" ? "RAIL / 02" : "RAIL / 03",
      `relationship.${key}`,
      key === "color" ? next.color.toUpperCase() : `OUTLINE ${next.outline}`,
    );
  }, [record, relationship]);

  const openConsole = useCallback((side) => {
    setConsoleSide(side);
    record(`ACTUATOR / ${side.toUpperCase()}`, "console.requested", "HANDSHAKE CAPTURED");
  }, [record]);

  const specimenClass = useMemo(
    () => `${styles.liveSpecimen} ${mode === "SEE IT" ? styles.inspecting : ""}`,
    [mode],
  );

  return (
    <div className={styles.testCell}>
      <div className={styles.testCellTopline}>
        <div className={styles.modeSwitch} aria-label="Test Cell mode">
          {MODES.map((item) => (
            <button key={item} type="button" className={mode === item ? styles.modeActive : ""}
              onClick={() => setMode(item)} aria-pressed={mode === item}>
              {item}
            </button>
          ))}
        </div>
        <span className={styles.safetySeal}>REAL COMPONENT · CONTROLLED FIXTURE · ZERO WRITES</span>
      </div>

      <div className={styles.testCellStage}>
        <div className={styles.stageCoordinate} aria-hidden="true">A-01 / LIVE TEST CELL</div>
        <div className={specimenClass} onClickCapture={(event) => {
          const anchor = event.target.closest?.("a");
          if (anchor) {
            event.preventDefault();
            event.stopPropagation();
            record("FACE / 01", "navigation.intercepted", "STAYED IN TEST CELL");
            return;
          }
          if (event.target.closest?.('button[aria-label="Send machine"]')) {
            record("RAIL / 05", "machine.send", "COMMAND CAPTURED");
          }
        }}>
          <div className={styles.productionCard}>
            <IXIMachineCard
              listing={FIXTURE}
              cardContext="marketplace"
              suppressFamilyLog
              imagePriority
              machineFace={machineFace}
              ixiState={relationship}
              showSave={false}
              enableMarketplaceDistribution={false}
              onCycleMachineFace={cycleFace}
              onIxiStateChange={changeRelationship}
              onSendFront={() => record("RAIL / 01", "depth.forward", "COMMAND CAPTURED")}
              onSendBack={() => record("RAIL / 07", "depth.backward", "COMMAND CAPTURED")}
              onSendToArmedDestination={() => record("RAIL / 06", "destination.sync", "NO DESTINATION ARMED")}
              onExpandConsoleLeft={() => openConsole("left")}
              onExpandConsoleRight={() => openConsole("right")}
            />
          </div>
          {mode === "SEE IT" && CALLOUTS.map(([id, index, label, className]) => (
            <button type="button" key={id}
              className={`${styles.liveCallout} ${styles[className]} ${selected === id ? styles.activeLiveCallout : ""}`}
              onClick={() => onSelect(id)} aria-pressed={selected === id}>
              <i>{index}</i><span>{label}</span>
            </button>
          ))}
        </div>

        <aside className={`${styles.pulsePanel} ${mode === "FOLLOW IT" ? styles.pulseLive : ""}`}>
          <div className={styles.pulseHead}>
            <div><span>PASSPORT PULSE</span><b>EVENT RECORDER</b></div>
            <i>LIVE</i>
          </div>
          <p>{ACTION_COPY[mode]}</p>
          <dl className={styles.fixtureState}>
            <div><dt>IDENTITY</dt><dd>IXI-7F3A9C2D</dd></div>
            <div><dt>FACE</dt><dd>{String(machineFace).padStart(2, "0")} / 04</dd></div>
            <div><dt>RELATION</dt><dd>{relationship.color.toUpperCase()} / {relationship.outline}</dd></div>
            <div><dt>CONSOLE</dt><dd>{consoleSide ? `${consoleSide.toUpperCase()} REQUEST` : "STANDBY"}</dd></div>
          </dl>
          <div className={styles.eventStream} aria-live="polite">
            {events.map((item) => (
              <div key={item.id}>
                <span>{item.time}</span><b>{item.source}</b><code>{item.event}</code><small>{item.result}</small>
              </div>
            ))}
          </div>
          <button type="button" className={styles.resetCell} onClick={() => {
            setMachineFace(1);
            setRelationship({ color: "none", outline: 1 });
            setConsoleSide("");
            setEvents([{ id: sequence, time: clock(), source: "ATLAS", event: "fixture.reset", result: "BASELINE RESTORED" }]);
          }}>RESET FIXTURE</button>
        </aside>
      </div>
      <div className={styles.nativeDimension} aria-hidden="true">
        <span>300 PX</span><i /><span>400 PX / MARKETPLACE NATIVE</span>
      </div>
    </div>
  );
}
