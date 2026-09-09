import Image from "next/image";
import { useMemo, useState } from "react";
import {
  ATLAS_REVISION,
  atlasModules,
  getAtlasPart,
  machineCardParts
} from "../../lib/ixi-atlas/machineCardRegistry.mjs";
import styles from "./IXITechnicalAtlas.module.css";

const layerNames = ["ALL", "STRUCTURE", "DATA", "COMMANDS"];

function IXIMark() {
  return (
    <span className={styles.mark} aria-label="IronXchange">
      <span>IRON</span><b>X</b><span>CHANGE</span>
    </span>
  );
}

function Icon({ name }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6"/><path d="m16 16 5 5"/></>,
    layers: <><path d="m3 8 9-5 9 5-9 5-9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
    book: <><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H20v17H7.5A3.5 3.5 0 0 0 4 22V5.5Z"/><path d="M4 18.5A3.5 3.5 0 0 1 7.5 15H20"/></>,
    cube: <><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 7 9 5v10M21 7l-9 5"/></>,
    external: <><path d="M15 3h6v6M10 14 21 3"/><path d="M18 13v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h7"/></>
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function BlueprintCard({ selected, onSelect, exploded, zoom }) {
  const tags = [
    { id: "identity", label: "PASSPORT", x: "72%", y: "8%" },
    { id: "family", label: "FAMILY ROUTER", x: "9%", y: "18%" },
    { id: "face", label: "PRIMARY FACE", x: "4%", y: "39%" },
    { id: "toolbar", label: "OBJECT TOOLBAR", x: "73%", y: "69%" },
    { id: "faces", label: "FACES", x: "6%", y: "76%" },
    { id: "rail", label: "MACHINE RAIL", x: "70%", y: "88%" },
    { id: "console", label: "CONSOLE COUPLING", x: "4%", y: "91%" }
  ];

  return (
    <div className={`${styles.blueprintViewport} ${exploded ? styles.exploded : ""}`}>
      <div className={styles.gridLabels} aria-hidden="true"><span>A</span><span>B</span><span>C</span><span>D</span></div>
      <div className={styles.blueprintScale} style={{ transform: `scale(${zoom})` }}>
        <button className={`${styles.cardSpecimen} ${selected === "object" ? styles.selectedPart : ""}`} onClick={() => onSelect("object")} type="button">
          <div className={styles.cardMeta}><span>PRIVATE / LIVE</span><b>IXI-7F3A9C2D</b></div>
          <div className={styles.machineImage}>
            <Image src="/images/2023-komatsu-wa475-10.jpg" alt="Komatsu WA475-10 wheel loader" fill sizes="300px" priority />
            <span className={styles.imageScan} />
            <span className={styles.faceStamp}>FACE 01 / 04</span>
          </div>
          <div className={styles.machineCopy}>
            <span>2023 WHEEL LOADER</span>
            <h3>KOMATSU WA475-10</h3>
            <div><span>4,812 HOURS</span><span>ABILENE, TX</span></div>
          </div>
          <div className={styles.objectToolbar}><b>+</b><span>EDIT</span><b>$</b><b>⋮</b></div>
          <div className={styles.machineRail} aria-label="Seven-zone IXI Machine Rail">
            {Array.from({ length: 7 }, (_, i) => <i key={i} className={i === 4 ? styles.cyanRail : i === 1 ? styles.yellowRail : ""} />)}
          </div>
        </button>
        {tags.map((tag, i) => (
          <button
            type="button"
            key={tag.id}
            className={`${styles.callout} ${styles[`callout${i}`]} ${selected === tag.id ? styles.activeCallout : ""}`}
            style={{ left: tag.x, top: tag.y }}
            onClick={() => onSelect(tag.id)}
          >
            <i>{String(i + 2).padStart(2, "0")}</i><span>{tag.label}</span>
          </button>
        ))}
        <svg className={styles.calloutLines} viewBox="0 0 900 660" preserveAspectRatio="none" aria-hidden="true">
          <path d="M650 65H565L525 99"/><path d="M165 130h120l54 45"/><path d="M124 275h165l48-18"/>
          <path d="M657 457H560l-47-24"/><path d="M130 505h170l37-50"/><path d="M635 578H535l-38-42"/><path d="M170 602h142l40-51"/>
        </svg>
        <span className={styles.dimensionV}>475 PX / WORKSPACE</span>
        <span className={styles.dimensionH}>300 PX / NATIVE</span>
      </div>
    </div>
  );
}

function Dossier({ part }) {
  return (
    <aside className={styles.dossier} aria-live="polite">
      <div className={styles.dossierHead}>
        <div><span>SELECTED ASSEMBLY</span><strong>{part.index}</strong></div>
        <span className={styles.status}>{part.status}</span>
      </div>
      <p className={styles.partCode}>{part.code} / REV {part.version}</p>
      <h2>{part.name}</h2>
      <p className={styles.short}>{part.short}</p>
      <section><h3>PURPOSE</h3><p>{part.purpose}</p></section>
      <section><h3>CUSTOMER VALUE</h3><p>{part.benefit}</p></section>
      <section>
        <h3>OPERATING SPECIFICATION</h3>
        <ul>{part.specs.map((spec) => <li key={spec}>{spec}</li>)}</ul>
      </section>
      <div className={styles.flowSpec}>
        <section><h3>INPUTS</h3>{part.inputs.map((value) => <span key={value}>{value}</span>)}</section>
        <section><h3>OUTPUTS</h3>{part.outputs.map((value) => <span key={value}>{value}</span>)}</section>
      </div>
      <section><h3>FIELD USE</h3><p>{part.use}</p></section>
      <section className={styles.sources}>
        <h3>SOURCE OF TRUTH</h3>
        {part.sources.map((source) => <code key={source}>{source}</code>)}
      </section>
      <div className={styles.recordFoot}><span>INTRODUCED {part.introduced}</span><span>VERIFIED {ATLAS_REVISION}</span></div>
    </aside>
  );
}

export default function IXITechnicalAtlas() {
  const [selectedId, setSelectedId] = useState("object");
  const [layer, setLayer] = useState("ALL");
  const [exploded, setExploded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [query, setQuery] = useState("");
  const [indexOpen, setIndexOpen] = useState(false);
  const part = getAtlasPart(selectedId);
  const matchingParts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return machineCardParts.filter((item) => (layer === "ALL" || item.layer === layer) && (!q || `${item.name} ${item.code} ${item.short}`.toLowerCase().includes(q)));
  }, [layer, query]);

  return (
    <main className={styles.atlas}>
      <header className={styles.topbar}>
        <a href="/gateway" className={styles.brand}><IXIMark /></a>
        <div className={styles.titleBlock}><span>IXI TECHNICAL ATLAS</span><b>INTERACTIVE SYSTEM MANUAL</b></div>
        <div className={styles.headerMeta}><span>EDITION 01</span><b>REV {ATLAS_REVISION}</b></div>
        <button className={styles.indexButton} type="button" onClick={() => setIndexOpen(!indexOpen)}><Icon name="book"/> SYSTEM INDEX</button>
      </header>

      <nav className={`${styles.moduleRail} ${indexOpen ? styles.indexOpen : ""}`} aria-label="Technical Atlas modules">
        {atlasModules.map((module) => (
          <button key={module.id} type="button" className={module.state === "ACTIVE" ? styles.activeModule : ""} disabled={module.state !== "ACTIVE"}>
            <span>{module.id}</span><b>{module.name}</b><small>{module.state}</small>
          </button>
        ))}
      </nav>

      <section className={styles.commandBar}>
        <div className={styles.breadcrumb}><Icon name="cube"/><span>ATLAS</span><i>/</i><span>OBJECT SYSTEM</span><i>/</i><b>TA-001 MACHINE CARD</b></div>
        <label className={styles.search}><Icon name="search"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="SEARCH THIS ASSEMBLY" aria-label="Search machine card components"/><kbd>⌘ K</kbd></label>
      </section>

      <section className={styles.heroHead}>
        <div><span className={styles.eyebrow}>TECHNICAL ASSEMBLY TA-001 / PRODUCTION SYSTEM</span><h1>THE MACHINE<br/><em>COMES FIRST.</em></h1></div>
        <p>The Machine Card is the customer-facing object at the center of IronXchange. Select any numbered system below to inspect how the real production component works.</p>
      </section>

      <section className={styles.workspace}>
        <div className={styles.drawingPanel}>
          <div className={styles.panelHead}>
            <div><span>ASSEMBLY VIEW</span><b>IXI MACHINE CARD / WORKSPACE CONFIGURATION</b></div>
            <div className={styles.viewControls}>
              <button type="button" className={!exploded ? styles.controlActive : ""} onClick={() => setExploded(false)}>ASSEMBLED</button>
              <button type="button" className={exploded ? styles.controlActive : ""} onClick={() => setExploded(true)}>EXPLODED</button>
              <button type="button" onClick={() => setZoom(Math.max(.82, +(zoom - .08).toFixed(2)))} aria-label="Zoom out">−</button>
              <button type="button" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
              <button type="button" onClick={() => setZoom(Math.min(1.18, +(zoom + .08).toFixed(2)))} aria-label="Zoom in">+</button>
            </div>
          </div>
          <BlueprintCard selected={selectedId} onSelect={setSelectedId} exploded={exploded} zoom={zoom}/>
          <div className={styles.layerBar}>
            <span><Icon name="layers"/> LAYERS</span>
            {layerNames.map((name) => <button type="button" key={name} onClick={() => setLayer(name)} className={layer === name ? styles.layerActive : ""}>{name}</button>)}
            <i>{matchingParts.length} / {machineCardParts.length} VISIBLE</i>
          </div>
        </div>
        <Dossier part={part}/>
      </section>

      <section className={styles.componentIndex}>
        <div className={styles.sectionHead}><div><span>COMPONENT REGISTER</span><h2>SELECT A SYSTEM</h2></div><p>FILTER: {layer} · QUERY: {query || "NONE"}</p></div>
        <div className={styles.componentGrid}>
          {matchingParts.map((item) => (
            <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); window.scrollTo({ top: 300, behavior: "smooth" }); }} className={selectedId === item.id ? styles.activeComponent : ""}>
              <span>{item.index}</span><div><small>{item.code}</small><b>{item.name}</b><p>{item.short}</p></div><i>↗</i>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.systemFlow}>
        <div className={styles.sectionHead}><div><span>OBJECT LIFE CYCLE</span><h2>ONE MACHINE. EVERY ENVIRONMENT.</h2></div></div>
        <div className={styles.flowLine}>
          {["Machine record", "Family + access", "Card presentation", "Rail command", "Object Console"].map((label, i) => <div key={label}><span>{String(i + 1).padStart(2,"0")}</span><b>{label}</b>{i < 4 && <i>→</i>}</div>)}
        </div>
      </section>

      <section className={styles.nextModules}>
        <div className={styles.sectionHead}><div><span>ATLAS ROADMAP</span><h2>NEXT BUILD SHEETS</h2></div><p>THE SYSTEM WILL BE DOCUMENTED IN THE ORDER A CUSTOMER EXPERIENCES IT.</p></div>
        <div className={styles.moduleCards}>{atlasModules.slice(1).map((module) => <article key={module.id}><span>{module.id}</span><small>{module.state}</small><h3>{module.name}</h3><p>{module.detail}</p><div>BLUEPRINT PENDING <Icon name="external"/></div></article>)}</div>
      </section>

      <footer className={styles.footer}><IXIMark/><span>IXI TECHNICAL ATLAS™ / CONTROLLED SYSTEM DOCUMENT</span><span>© 2026 IRONXCHANGE</span></footer>
    </main>
  );
}
