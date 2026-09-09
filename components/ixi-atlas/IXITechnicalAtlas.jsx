import { useMemo, useState } from "react";
import {
  ATLAS_REVISION,
  atlasModules,
  getAtlasPart,
  machineCardParts,
} from "../../lib/ixi-atlas/machineCardRegistry.mjs";
import IXIChassisAtlas from "./IXIChassisAtlas";
import IXIAtlasLiveTestCell from "./IXIAtlasLiveTestCell";
import styles from "./IXITechnicalAtlas.module.css";

const layerNames = ["ALL", "STRUCTURE", "DATA", "COMMANDS"];

function IXIMark() {
  return (
    <span className={styles.mark} aria-label="IronXchange">
      <span>IRON</span>
      <b>X</b>
      <span>CHANGE</span>
    </span>
  );
}

function Icon({ name }) {
  const paths = {
    search: (
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="m16 16 5 5" />
      </>
    ),
    layers: (
      <>
        <path d="m3 8 9-5 9 5-9 5-9-5Z" />
        <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
      </>
    ),
    book: (
      <>
        <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H20v17H7.5A3.5 3.5 0 0 0 4 22V5.5Z" />
        <path d="M4 18.5A3.5 3.5 0 0 1 7.5 15H20" />
      </>
    ),
    cube: (
      <>
        <path d="m12 2 9 5-9 5-9-5 9-5Z" />
        <path d="m3 7 9 5v10M21 7l-9 5" />
      </>
    ),
    external: (
      <>
        <path d="M15 3h6v6M10 14 21 3" />
        <path d="M18 13v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h7" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function Dossier({ part }) {
  const [view, setView] = useState("FIELD");
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
      <div className={styles.dossierView} aria-label="Dossier detail level">
        <button type="button" className={view === "FIELD" ? styles.dossierViewActive : ""} onClick={() => setView("FIELD")}>FIELD VIEW</button>
        <button type="button" className={view === "ENGINEERING" ? styles.dossierViewActive : ""} onClick={() => setView("ENGINEERING")}>ENGINEERING</button>
      </div>
      <section>
        <h3>PURPOSE</h3>
        <p>{part.purpose}</p>
      </section>
      <section>
        <h3>CUSTOMER VALUE</h3>
        <p>{part.benefit}</p>
      </section>
      {view === "ENGINEERING" && <section>
        <h3>OPERATING SPECIFICATION</h3>
        <ul>
          {part.specs.map((spec) => (
            <li key={spec}>{spec}</li>
          ))}
        </ul>
      </section>}
      {view === "ENGINEERING" && <div className={styles.flowSpec}>
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
      </div>}
      <section>
        <h3>FIELD USE</h3>
        <p>{part.use}</p>
      </section>
      {view === "ENGINEERING" && <section className={styles.sources}>
        <h3>SOURCE OF TRUTH</h3>
        {part.sources.map((source) => (
          <code key={source}>{source}</code>
        ))}
      </section>}
      <div className={styles.recordFoot}>
        <span>INTRODUCED {part.introduced}</span>
        <span>VERIFIED {ATLAS_REVISION}</span>
      </div>
    </aside>
  );
}

export default function IXITechnicalAtlas() {
  const [activeModule, setActiveModule] = useState("TA-001");
  const [selectedId, setSelectedId] = useState("object");
  const [layer, setLayer] = useState("ALL");
  const [query, setQuery] = useState("");
  const [indexOpen, setIndexOpen] = useState(false);
  const part = getAtlasPart(selectedId);
  const matchingParts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return machineCardParts.filter(
      (item) =>
        (layer === "ALL" || item.layer === layer) &&
        (!q ||
          `${item.name} ${item.code} ${item.short}`.toLowerCase().includes(q)),
    );
  }, [layer, query]);

  return (
    <main className={styles.atlas}>
      <header className={styles.topbar}>
        <a href="/gateway" className={styles.brand}>
          <IXIMark />
        </a>
        <div className={styles.titleBlock}>
          <span>IXI TECHNICAL ATLAS</span>
          <b>INTERACTIVE SYSTEM MANUAL</b>
        </div>
        <div className={styles.headerMeta}>
          <span>EDITION 01</span>
          <b>REV {ATLAS_REVISION}</b>
        </div>
        <button
          className={styles.indexButton}
          type="button"
          onClick={() => setIndexOpen(!indexOpen)}
          aria-expanded={indexOpen}
          aria-controls="atlas-system-index"
        >
          <Icon name="book" /> SYSTEM INDEX
        </button>
      </header>

      {indexOpen && (
        <section id="atlas-system-index" className={styles.systemIndex}>
          <div className={styles.systemIndexLead}>
            <span>SYSTEM HANGAR / 06 ASSEMBLIES</span>
            <h2>START WITH THE MACHINE.</h2>
            <p>Move outward from the customer’s object into the surfaces, controls and routes that operate around it.</p>
          </div>
          <div className={styles.systemIndexGrid}>
            {atlasModules.map((module, index) => (
              <button key={module.id} type="button" disabled={module.state !== "ACTIVE"}
                onClick={() => { setActiveModule(module.id); setIndexOpen(false); setQuery(""); }}>
                <small>{String(index + 1).padStart(2, "0")} / {module.state}</small>
                <b>{module.name}</b>
                <span>{module.detail}</span>
                <i>{module.state === "ACTIVE" ? "OPEN →" : "QUEUED"}</i>
              </button>
            ))}
          </div>
        </section>
      )}

      <nav className={styles.moduleRail} aria-label="Technical Atlas modules">
        {atlasModules.map((module) => (
          <button
            key={module.id}
            type="button"
            className={activeModule === module.id ? styles.activeModule : ""}
            disabled={module.state !== "ACTIVE"}
            onClick={() => {
              setActiveModule(module.id);
              setQuery("");
              setIndexOpen(false);
            }}
          >
            <span>{module.id}</span>
            <b>{module.name}</b>
            <small>{module.state}</small>
          </button>
        ))}
      </nav>

      <section className={styles.commandBar}>
        <div className={styles.breadcrumb}>
          <Icon name="cube" />
          <span>ATLAS</span>
          <i>/</i>
          <span>
            {activeModule === "TA-001" ? "OBJECT SYSTEM" : "WORKSPACE SYSTEM"}
          </span>
          <i>/</i>
          <b>
            {activeModule === "TA-001"
              ? "TA-001 MACHINE CARD"
              : "TA-002 CHASSIS"}
          </b>
        </div>
        <label className={styles.search}>
          <Icon name="search" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="SEARCH THIS ASSEMBLY"
            aria-label={`Search ${activeModule === "TA-001" ? "machine card" : "chassis"} components`}
          />
          <kbd>⌘ K</kbd>
        </label>
      </section>

      {activeModule === "TA-001" ? (
        <>
          <section className={styles.heroHead}>
            <div>
              <span className={styles.eyebrow}>
                TECHNICAL ASSEMBLY TA-001 / PRODUCTION SYSTEM
              </span>
              <h1>
                THE MACHINE
                <br />
                <em>COMES FIRST.</em>
              </h1>
            </div>
            <p>
              The Machine Card is the customer-facing object at the center of
              IronXchange. Select any numbered system below to inspect how the
              real production component works.
            </p>
          </section>

          <section className={styles.workspace}>
            <div className={styles.drawingPanel}>
              <div className={styles.panelHead}>
                <div>
                  <span>LIVE TEST CELL</span>
                  <b>IXI MACHINE CARD / MARKETPLACE PRODUCTION FAMILY</b>
                </div>
                <div className={styles.viewControls}>
                  <span>PRODUCTION UI</span>
                  <span>NO PERSISTENCE</span>
                </div>
              </div>
              <IXIAtlasLiveTestCell
                selected={selectedId}
                onSelect={setSelectedId}
              />
              <div className={styles.layerBar}>
                <span>
                  <Icon name="layers" /> LAYERS
                </span>
                {layerNames.map((name) => (
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
                  {matchingParts.length} / {machineCardParts.length} VISIBLE
                </i>
              </div>
            </div>
            <Dossier part={part} />
          </section>

          <section className={styles.componentIndex}>
            <div className={styles.sectionHead}>
              <div>
                <span>COMPONENT REGISTER</span>
                <h2>SELECT A SYSTEM</h2>
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
                  className={
                    selectedId === item.id ? styles.activeComponent : ""
                  }
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
                <span>OBJECT LIFE CYCLE</span>
                <h2>ONE MACHINE. EVERY ENVIRONMENT.</h2>
              </div>
            </div>
            <div className={styles.flowLine}>
              {[
                "Machine record",
                "Family + access",
                "Card presentation",
                "Rail command",
                "Object Console",
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
      ) : (
        <IXIChassisAtlas query={query} onQueryChange={setQuery} />
      )}

      <section className={styles.nextModules}>
        <div className={styles.sectionHead}>
          <div>
            <span>ATLAS ROADMAP</span>
            <h2>NEXT BUILD SHEETS</h2>
          </div>
          <p>
            THE SYSTEM WILL BE DOCUMENTED IN THE ORDER A CUSTOMER EXPERIENCES
            IT.
          </p>
        </div>
        <div className={styles.moduleCards}>
          {atlasModules
            .filter((module) => module.id !== activeModule)
            .map((module) => (
              <article key={module.id}>
                <span>{module.id}</span>
                <small>{module.state}</small>
                <h3>{module.name}</h3>
                <p>{module.detail}</p>
                <div>
                  {module.state === "ACTIVE"
                    ? "OPEN BUILD SHEET"
                    : "BLUEPRINT PENDING"}{" "}
                  <Icon name="external" />
                </div>
              </article>
            ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <IXIMark />
        <span>IXI TECHNICAL ATLAS™ / CONTROLLED SYSTEM DOCUMENT</span>
        <span>© 2026 IRONXCHANGE</span>
      </footer>
    </main>
  );
}
