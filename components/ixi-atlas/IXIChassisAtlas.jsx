import { useMemo, useState } from "react";
import { ATLAS_REVISION } from "../../lib/ixi-atlas/machineCardRegistry.mjs";
import {
  chassisParts,
  getChassisPart,
} from "../../lib/ixi-atlas/chassisRegistry.mjs";
import styles from "./IXITechnicalAtlas.module.css";

const layers = ["ALL", "STRUCTURE", "DATA", "COMMANDS"];

function Dossier({ part }) {
  return (
    <aside className={styles.dossier} aria-live="polite">
      <div className={styles.dossierHead}>
        <div>
          <span>SELECTED ASSEMBLY</span>
          <strong>{part.index}</strong>
        </div>
        <span className={styles.status}>{part.status}</span>
      </div>
      <p className={styles.partCode}>
        {part.code} / REV {part.version}
      </p>
      <h2>{part.name}</h2>
      <p className={styles.short}>{part.short}</p>
      <section>
        <h3>PURPOSE</h3>
        <p>{part.purpose}</p>
      </section>
      <section>
        <h3>CUSTOMER VALUE</h3>
        <p>{part.benefit}</p>
      </section>
      <section>
        <h3>OPERATING SPECIFICATION</h3>
        <ul>
          {part.specs.map((spec) => (
            <li key={spec}>{spec}</li>
          ))}
        </ul>
      </section>
      <div className={styles.flowSpec}>
        <section>
          <h3>INPUTS</h3>
          {part.inputs.map((value) => (
            <span key={value}>{value}</span>
          ))}
        </section>
        <section>
          <h3>OUTPUTS</h3>
          {part.outputs.map((value) => (
            <span key={value}>{value}</span>
          ))}
        </section>
      </div>
      <section>
        <h3>FIELD USE</h3>
        <p>{part.use}</p>
      </section>
      <section className={styles.sources}>
        <h3>SOURCE OF TRUTH</h3>
        {part.sources.map((source) => (
          <code key={source}>{source}</code>
        ))}
      </section>
      <div className={styles.recordFoot}>
        <span>INTRODUCED {part.introduced}</span>
        <span>VERIFIED {ATLAS_REVISION}</span>
      </div>
    </aside>
  );
}

function ChassisBlueprint({ selected, onSelect, mode, exploded }) {
  const callouts = [
    ["chassis", "COMMAND CHASSIS", "10", "12"],
    ["board", "BOARD SURFACE", "73", "12"],
    ["mount", "OBJECT MOUNT", "75", "42"],
    ["console-slot", "CONSOLE EXPANSION", "70", "72"],
    ["pockets", "POCKET STATIONS", "5", "70"],
    ["stacks", "ACTIVE STACKS", "8", "42"],
    ["responsive", "RESPONSIVE RULES", "71", "89"],
  ];
  return (
    <div
      className={`${styles.chassisViewport} ${styles[`chassis${mode}`]} ${exploded ? styles.chassisExploded : ""}`}
    >
      <div className={styles.chassisDrawing}>
        <button
          type="button"
          className={`${styles.stackStation} ${styles.stackTop}`}
          onClick={() => onSelect("stacks")}
        >
          <span>STACK TOP</span>
          <i />
        </button>
        <div className={styles.leftStations}>
          {[
            ["L2", "pockets"],
            ["L1", "pockets"],
          ].map(([label, id]) => (
            <button type="button" key={label} onClick={() => onSelect(id)}>
              <span>{label}</span>
              <b>150 × 102</b>
              <i />
              <i />
              <i />
              <i />
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`${styles.boardFrame} ${selected === "board" ? styles.selectedDiagram : ""}`}
          onClick={() => onSelect("board")}
        >
          <span className={styles.boardLabel}>BOARD / SORTABLE SURFACE</span>
          <div className={styles.miniCard}>
            <small>IXI OBJECT</small>
            <b>WA475-10</b>
            <em>01</em>
          </div>
          <div className={styles.miniCard}>
            <small>IXI OBJECT</small>
            <b>D8T</b>
            <em>02</em>
          </div>
          <div className={`${styles.miniCard} ${styles.activeMiniCard}`}>
            <small>ACTIVE OBJECT</small>
            <b>TL12V2</b>
            <em>03</em>
          </div>
          <div className={styles.consolePanel}>
            <small>OBJECT CONSOLE</small>
            <b>WORKING SURFACE</b>
            <span />
            <span />
            <span />
          </div>
        </button>
        <div className={styles.rightStations}>
          {[
            ["R1", "pockets"],
            ["R2", "pockets"],
          ].map(([label, id]) => (
            <button type="button" key={label} onClick={() => onSelect(id)}>
              <span>{label}</span>
              <b>150 × 102</b>
              <i />
              <i />
              <i />
              <i />
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`${styles.stackStation} ${styles.stackBottom}`}
          onClick={() => onSelect("stacks")}
        >
          <span>STACK BOTTOM</span>
          <i />
        </button>
      </div>
      {callouts.map(([id, label, x, y], index) => (
        <button
          type="button"
          key={id}
          className={`${styles.chassisCallout} ${selected === id ? styles.activeCallout : ""}`}
          style={{ left: `${x}%`, top: `${y}%` }}
          onClick={() => onSelect(id)}
        >
          <i>{String(index + 1).padStart(2, "0")}</i>
          <span>{label}</span>
        </button>
      ))}
      <span className={styles.chassisDimension}>
        680 PX COMMAND CENTER · 4 POCKET STATIONS · 2 ACTIVE STACKS
      </span>
    </div>
  );
}

export default function IXIChassisAtlas({ query, onQueryChange }) {
  const [selectedId, setSelectedId] = useState("chassis");
  const [layer, setLayer] = useState("ALL");
  const [mode, setMode] = useState("wide");
  const [exploded, setExploded] = useState(false);
  const part = getChassisPart(selectedId);
  const matchingParts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return chassisParts.filter(
      (item) =>
        (layer === "ALL" || item.layer === layer) &&
        (!q ||
          `${item.name} ${item.code} ${item.short}`.toLowerCase().includes(q)),
    );
  }, [layer, query]);

  return (
    <>
      <section className={styles.heroHead}>
        <div>
          <span className={styles.eyebrow}>
            TECHNICAL ASSEMBLY TA-002 / PRODUCTION SYSTEM
          </span>
          <h1>
            THE CHASSIS
            <br />
            <em>HOLDS THE WORK.</em>
          </h1>
        </div>
        <p>
          The Chassis is the spatial operating system around every IXI Board.
          Select any numbered assembly to inspect the real production geometry
          and behavior.
        </p>
      </section>
      <section className={styles.workspace}>
        <div className={styles.drawingPanel}>
          <div className={styles.panelHead}>
            <div>
              <span>ASSEMBLY VIEW</span>
              <b>IXI CHASSIS / DESKTOP CONFIGURATION</b>
            </div>
            <div className={styles.viewControls}>
              <button
                type="button"
                className={mode === "wide" ? styles.controlActive : ""}
                onClick={() => setMode("wide")}
              >
                WIDE
              </button>
              <button
                type="button"
                className={mode === "stacked" ? styles.controlActive : ""}
                onClick={() => setMode("stacked")}
              >
                STACKED
              </button>
              <button
                type="button"
                className={exploded ? styles.controlActive : ""}
                onClick={() => setExploded(!exploded)}
              >
                X-RAY
              </button>
            </div>
          </div>
          <ChassisBlueprint
            selected={selectedId}
            onSelect={setSelectedId}
            mode={mode}
            exploded={exploded}
          />
          <div className={styles.layerBar}>
            <span>LAYERS</span>
            {layers.map((name) => (
              <button
                type="button"
                key={name}
                onClick={() => setLayer(name)}
                className={layer === name ? styles.layerActive : ""}
              >
                {name}
              </button>
            ))}
            <i>
              {matchingParts.length} / {chassisParts.length} VISIBLE
            </i>
          </div>
        </div>
        <Dossier part={part} />
      </section>
      <section className={styles.componentIndex}>
        <div className={styles.sectionHead}>
          <div>
            <span>COMPONENT REGISTER</span>
            <h2>SELECT A CHASSIS SYSTEM</h2>
          </div>
          <p>
            FILTER: {layer} · QUERY: {query || "NONE"}
          </p>
        </div>
        <div className={styles.componentGrid}>
          {matchingParts.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSelectedId(item.id);
                window.scrollTo({ top: 300, behavior: "smooth" });
              }}
              className={selectedId === item.id ? styles.activeComponent : ""}
            >
              <span>{item.index}</span>
              <div>
                <small>{item.code}</small>
                <b>{item.name}</b>
                <p>{item.short}</p>
              </div>
              <i>↗</i>
            </button>
          ))}
        </div>
      </section>
      <section className={styles.systemFlow}>
        <div className={styles.sectionHead}>
          <div>
            <span>PLACEMENT FLOW</span>
            <h2>ONE OBJECT. EXPLICIT DESTINATIONS.</h2>
          </div>
        </div>
        <div className={styles.flowLine}>
          {[
            "Object identity",
            "Sortable mount",
            "Board placement",
            "Pocket / stack",
            "Console depth",
          ].map((label, i) => (
            <div key={label}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <b>{label}</b>
              {i < 4 && <i>→</i>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
