import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { ATLAS_REVISION, getAtlasPart, machineCardParts } from "../../lib/ixi-atlas/machineCardRegistry.mjs";
import { atlasGuides, getAtlasGuide } from "../../lib/ixi-atlas/guideRegistry.mjs";
import { atlasLessonHref } from "../../lib/ixi-atlas/helpRoutes.mjs";
import { atlasAssemblyHref, atlasFamilyHref, resolveAtlasView, searchAtlas } from "../../lib/ixi-atlas/navigation.mjs";
import { atlasFamilies, getAtlasFamily } from "../../lib/ixi-atlas/familyRegistry.mjs";
import AtlasFamilyNav from "./AtlasFamilyNav";
import AtlasFieldGuide from "./AtlasFieldGuide";
import AtlasDemoBoundary from "./AtlasDemoBoundary";
import styles from "./IXITechnicalAtlas.module.css";

const AtlasFamilyWorkbench = dynamic(() => import("./AtlasFamilyWorkbench"), { ssr: false, loading: () => <p className={styles.demoNotice} role="status">Opening the family workbench…</p> });
const IXIAtlasLiveTestCell = dynamic(() => import("./IXIAtlasLiveTestCell"), { ssr: false, loading: () => <p className={styles.demoNotice} role="status">Opening the Machine Card demonstration…</p> });
const IXIChassisAtlas = dynamic(() => import("./IXIChassisAtlas"), { loading: () => <p className={styles.demoNotice} role="status">Opening the Chassis blueprint…</p> });
const layerNames = ["ALL", "STRUCTURE", "DATA", "COMMANDS"];

function IXIMark() { return <span className={styles.mark} aria-label="IronXchange"><span>IRON</span><b>X</b><span>CHANGE</span></span>; }

export default function IXITechnicalAtlas() {
  const router = useRouter();
  const view = resolveAtlasView(router.query);
  const [layer, setLayer] = useState("ALL");
  const [query, setQuery] = useState("");
  const [indexOpen, setIndexOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [copyFallback, setCopyFallback] = useState("");
  const searchRef = useRef(null);
  const indexButtonRef = useRef(null);
  const previousPath = useRef("");
  const selectedId = view.kind === "machine" ? view.part : "object";
  const part = getAtlasPart(selectedId);
  const title = view.kind === "family" ? getAtlasFamily(view.family).title : view.kind === "guide" ? getAtlasGuide(view.topic).title : view.kind === "chassis" ? "Chassis" : part.name;
  const matchingParts = machineCardParts.filter(item => layer === "ALL" || item.layer === layer);
  const searchResults = useMemo(() => searchAtlas(query), [query]);

  useEffect(() => {
    const keyboard = event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); searchRef.current?.focus(); }
      if (event.key === "Escape") { setQuery(""); setIndexOpen(false); indexButtonRef.current?.focus(); }
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, []);
  useEffect(() => {
    if (!router.isReady || previousPath.current === router.asPath) return;
    const first = !previousPath.current;
    previousPath.current = router.asPath;
    setQuery(""); setIndexOpen(false); setCopyStatus(""); setCopyFallback("");
    if (!first) document.getElementById("atlas-content")?.focus({ preventScroll: true });
  }, [router.isReady, router.asPath]);
  const selectPart = id => router.push(atlasAssemblyHref("machine", id), undefined, { shallow: true, scroll: false });
  const canonicalHref = view.kind === "family" ? atlasFamilyHref(view.family) : view.kind === "guide" ? atlasLessonHref(view.topic) : atlasAssemblyHref(view.kind, view.part);
  async function copyLesson() {
    const link = `${window.location.origin}${canonicalHref}`;
    try { await navigator.clipboard.writeText(link); setCopyStatus("Lesson link copied"); }
    catch { setCopyFallback(link); setCopyStatus("Select and copy the lesson link below"); }
  }
  return <main className={styles.atlas} onClick={event => {
    if (event.target.closest?.('a[href^="/atlas"]')) {
      setQuery(""); setIndexOpen(false);
    }
  }}>
    <Head><title>{title} | IXI Technical Atlas</title><meta name="description" content="Practical IronXchange instructions, interactive machine controls and system blueprints." /></Head>
    <a className={styles.skipLink} href="#atlas-content">Skip to instructions</a>
    <header className={styles.topbar}>
      <a href="/gateway" className={styles.brand}><IXIMark /></a>
      <div className={styles.titleBlock}><span>IXI TECHNICAL ATLAS</span><b>LEARN THE CONTROLS. KEEP THE WORK MOVING.</b></div>
      <div className={styles.headerMeta}><span>FIELD EDITION 01</span><b>REV {ATLAS_REVISION}</b></div>
      <button ref={indexButtonRef} className={styles.indexButton} type="button" onClick={() => setIndexOpen(!indexOpen)} aria-expanded={indexOpen} aria-controls="atlas-system-index">SYSTEM INDEX <span aria-hidden="true">{indexOpen ? "−" : "+"}</span></button>
    </header>
    {indexOpen && <section id="atlas-system-index" className={styles.systemIndex} aria-label="Atlas System Index">
      <div className={styles.systemIndexLead}><span>SYSTEM HANGAR / EVERY PUBLISHED LESSON</span><h2>START ANYWHERE. EXPLORE EVERYTHING.</h2><p>Machine systems, workspaces and practical instructions are connected here.</p></div>
      <div className={styles.indexAssemblies}><Link shallow href={atlasAssemblyHref("machine")}>01 / MACHINE CARD · INTERACTIVE</Link><Link shallow href={atlasAssemblyHref("chassis")}>02 / CHASSIS · BLUEPRINT</Link>{atlasFamilies.map(family => <Link shallow key={family.id} href={atlasFamilyHref(family.id)}>{family.title.toUpperCase()} · INTERACTIVE</Link>)}</div>
      <div className={styles.guideIndexGrid}>{atlasGuides.map(item => <Link shallow key={item.id} href={atlasLessonHref(item.id)}><small>{item.group}</small><strong>{item.title}</strong><span>{item.coverage} →</span></Link>)}</div>
    </section>}
    <nav className={styles.releaseRail} aria-label="Technical Atlas sections">
      <Link shallow href={atlasAssemblyHref("machine")} aria-current={["machine", "family"].includes(view.kind) ? "page" : undefined}><span>01</span><strong>MACHINE CARD</strong><small>TRY THE CONTROLS</small></Link>
      <Link shallow href={atlasAssemblyHref("chassis")} aria-current={view.kind === "chassis" ? "page" : undefined}><span>02</span><strong>CHASSIS</strong><small>EXPLORE THE BLUEPRINT</small></Link>
      <Link shallow href={atlasLessonHref("overview")} aria-current={view.kind === "guide" ? "page" : undefined}><span>03</span><strong>FIELD GUIDES</strong><small>STEP-BY-STEP INSTRUCTIONS</small></Link>
    </nav>
    <section className={styles.commandBar} aria-label="Atlas navigation and search">
      <div className={styles.breadcrumb}><span>ATLAS</span><i>/</i><span>{view.kind === "guide" ? "FIELD GUIDE" : "ASSEMBLY"}</span><i>/</i><b>{title}</b></div>
      <label className={styles.search}><input ref={searchRef} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search the entire Atlas…" aria-label="Search the entire Atlas" aria-controls={query.trim() ? "atlas-search-results" : undefined} /><kbd>⌘ / Ctrl K</kbd></label>
    </section>
    {query.trim() && <section id="atlas-search-results" className={styles.searchResults} aria-label="Atlas search results"><div className={styles.searchResultHeading}><strong role="status">{searchResults.length} {searchResults.length === 1 ? "RESULT" : "RESULTS"}</strong><button type="button" onClick={() => { setQuery(""); searchRef.current?.focus(); }}>CLEAR SEARCH</button></div>{searchResults.length ? <div className={styles.guideIndexGrid}>{searchResults.map(item => <Link shallow href={item.href} key={item.href}><small>{item.group}</small><strong>{item.title}</strong><span>{item.detail}</span></Link>)}</div> : <p>No matching lesson yet. Try a machine control, workspace or task, or open the System Index.</p>}</section>}
    <div className={styles.lessonTools}><span>{view.kind === "guide" ? "HELP THAT STARTS WITH YOUR TASK" : "ONE MACHINE · CONNECTED WORKING SYSTEMS"}</span><button type="button" onClick={copyLesson}>COPY LESSON LINK ↗</button><span role="status">{copyStatus}</span>{copyFallback && <input readOnly aria-label="Lesson link to copy" value={copyFallback} onFocus={event => event.target.select()} />}</div>
    <div id="atlas-content" tabIndex={-1} className={styles.atlasContent}>
      {view.unavailable && <p className={styles.demoNotice} role="status">That lesson link is not available in this edition. Start here or use the System Index to find another topic.</p>}
      {view.kind === "family" ? (router.isReady && <AtlasFamilyWorkbench key={view.family} familyId={view.family} />) : view.kind === "guide" ? <AtlasFieldGuide topic={view.topic} /> : view.kind === "chassis" ? <IXIChassisAtlas query="" selectedId={view.part} onSelect={id => router.push(atlasAssemblyHref("chassis", id), undefined, { shallow: true, scroll: false })} /> : <>
        <AtlasFamilyNav />
        <section className={styles.heroHead}><div><span className={styles.eyebrow}>TECHNICAL ASSEMBLY TA-001 / INTERACTIVE LESSON</span><h1>THE MACHINE<br /><em>COMES FIRST.</em></h1></div><div><p>Inspect the real Machine Card controls, try them on a sample, and see how each action changes the working view.</p><Link shallow className={styles.readGuideLink} href={atlasLessonHref("machine-card")}>READ THE STEP-BY-STEP GUIDE →</Link></div></section>
        <section className={`${styles.workspace} ${styles.liveWorkspace}`}><div className={styles.drawingPanel}>
          <div className={styles.panelHead}><div><span>LIVE TEST CELL</span><b>IXI MACHINE CARD / MARKETPLACE FAMILY</b></div><div className={styles.viewControls}><span>PRODUCTION COMPONENT</span><span>SAMPLE DATA</span></div></div>
          <AtlasDemoBoundary>{router.isReady && <IXIAtlasLiveTestCell selected={selectedId} onSelect={selectPart} part={part} />}</AtlasDemoBoundary>
          <div className={styles.layerBar}><span>LAYERS</span>{layerNames.map(name => <button type="button" key={name} onClick={() => setLayer(name)} className={layer === name ? styles.layerActive : ""} aria-pressed={layer === name}>{name}</button>)}<i>{matchingParts.length} / {machineCardParts.length} VISIBLE</i></div>
        </div></section>
        <section className={styles.componentIndex}><div className={styles.sectionHead}><div><span>COMPONENT REGISTER</span><h2>SELECT A SYSTEM</h2></div><p>Every component has its own lesson link.</p></div><div className={styles.componentGrid}>{matchingParts.map(item => <button type="button" key={item.id} onClick={() => { selectPart(item.id); document.getElementById("atlas-content")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className={selectedId === item.id ? styles.activeComponent : ""} aria-pressed={selectedId === item.id}><span>{item.index}</span><div><small>{item.code}</small><b>{item.name}</b><p>{item.short}</p></div><i>↗</i></button>)}</div></section>
      </>}
    </div>
    <section className={styles.releaseNext}><span>KEEP EXPLORING</span><h2>YOUR NEXT TASK HAS A GUIDE.</h2><div>{["marketplace", "aos-work", "transact", "sales-desk", "sold", "post-free"].map(id => <Link shallow key={id} href={atlasLessonHref(id)}>{getAtlasGuide(id).title}<b>→</b></Link>)}</div></section>
    <footer className={styles.footer}><IXIMark /><span>IXI TECHNICAL ATLAS / FIELD EDITION 01</span><span>© 2026 IRONXCHANGE</span></footer>
  </main>;
}
