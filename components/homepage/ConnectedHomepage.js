import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

import { captureIXEvent } from "../../lib/posthog";
import { getV12CategoryNames } from "../../lib/v12TaxonomyAdapter";
import styles from "./ConnectedHomepage.module.css";

const FALLBACK_MACHINE = Object.freeze({ id: "69f9042e-bd3d-4a6e-a78c-05b0b806d6b7", year: "2022", make: "KOMATSU", model: "WA475", hours: "4,998 Hrs", price: "$170,000", location: "TX", passportId: "IXIU7UC72H" });
const NAV = [["/browse-v2", "MARKETPLACE"], ["/aos/work", "AOS"], ["/transact", "TRAN$ACT"], ["#platform", "WHY IXI"]];

function clean(value, fallback = "") { const text = String(value ?? "").trim(); return text || fallback; }
function normalizeMachine(listing) {
  if (!listing) return FALLBACK_MACHINE;
  const data = listing.publicData || listing.attributes?.publicData || {};
  return { id: clean(listing.id?.uuid || listing.id, FALLBACK_MACHINE.id), year: clean(listing.year || data.year, FALLBACK_MACHINE.year), make: clean(listing.make || data.make, FALLBACK_MACHINE.make).toUpperCase(), model: clean(listing.model || data.model, FALLBACK_MACHINE.model).toUpperCase(), hours: clean(listing.hours || data.hours, FALLBACK_MACHINE.hours), price: clean(listing.price, FALLBACK_MACHINE.price), location: clean(listing.location || data.loc, FALLBACK_MACHINE.location).toUpperCase(), passportId: clean(listing.passportId || data.passportId, FALLBACK_MACHINE.passportId) };
}

function Icon({ name }) {
  const paths = {
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>, pin: <><path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></>, people: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.3"/><path d="M3 20c.5-4.5 2.5-6.8 6-6.8s5.5 2.3 6 6.8M14 15c3.2-.8 5.5 1 6 4.6"/></>, work: <><rect x="4" y="6" width="16" height="14" rx="2"/><path d="M9 6V3h6v3M8 12h8M8 16h5"/></>, document: <><path d="M6 3h8l4 4v14H6zM14 3v5h5M9 12h6M9 16h6"/></>, passport: <><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="11" r="3.5"/><path d="M8.5 11h7M12 7.5c1 1 1 6 0 7M8 17h8"/></>, arrow: <><path d="M4 12h15M14 7l5 5-5 5"/></>
  };
  return <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">{paths[name] || paths.document}</svg>;
}

function Status({ children, tone = "" }) { return <span className={`${styles.status} ${tone ? styles[tone] : ""}`}><i />{children}</span>; }

function SystemColumn({ number, title, subtitle, rows, tone, status }) {
  return <article className={`${styles.systemColumn} ${tone ? styles[tone] : ""}`}><div className={styles.columnHead}><span>{number}</span><div><b>{title}</b><small>{subtitle}</small></div></div><dl>{rows.map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><Status tone={tone}>{status}</Status></article>;
}

function HeroMarketplace({ machine }) { return <SystemColumn number="01" title="MARKETPLACE" subtitle="FIND + ACQUIRE" tone="yellow" status="AVAILABLE NOW" rows={[["ASSET",`${machine.year} ${machine.make} ${machine.model}`],["HOURS",machine.hours],["ASK",machine.price]]}/>; }
function HeroAos({ machine }) { return <SystemColumn number="02" title="AOS" subtitle="RUN + COORDINATE" status="OPERATION ACTIVE" rows={[["LOCATION","WICHITA FALLS, TX"],["PEOPLE","3 ASSIGNED"],["WORK","WO-2026-184"]]}/>; }
function HeroTransact({ machine }) { return <SystemColumn number="03" title="TRAN$ACT" subtitle="CONTROL + SETTLE" tone="cyan" status="FINANCIAL STORY" rows={[["ACQUISITION","RECORDED"],["COST BASIS","LIVE"],["SETTLEMENT","CONTROLLED"]]}/>; }

function HeroSystem({ machine }) {
  return <div className={styles.heroSystem} aria-label="One machine connected across Marketplace, AOS, and Tran$act">
    <div className={styles.systemTop}><span>IXI / CONNECTED MACHINE SYSTEM</span><Status tone="online">NETWORK ONLINE</Status></div>
    <div className={styles.systemRail}><i/><i/><i/></div>
    <div className={styles.machineViewport}><div className={styles.machineNumber}>IXI / 001</div><div className={styles.machineField}/><Image src="/images/ixi-homepage-komatsu-wa475-cutout.png" alt={`${machine.year} ${machine.make} ${machine.model} wheel loader`} fill priority sizes="(max-width: 900px) 94vw, 58vw" className={styles.machineCutout}/><div className={styles.machineSpecs}><span>{machine.year}</span><b>{machine.make} {machine.model}</b><span>{machine.hours}</span></div></div>
    <div className={styles.passportStrip}><div><Icon name="passport"/><span><small>PERMANENT MACHINE IDENTITY</small><b>IXI PASSPORT</b></span></div><strong>{machine.passportId}</strong><span className={styles.passportLine}/><small>ONE RECORD / EVERY MOVE</small></div>
    <div className={styles.systemColumns}><HeroMarketplace machine={machine}/><HeroAos machine={machine}/><HeroTransact machine={machine}/></div>
  </div>;
}

function MarketplaceZone({ machine }) {
  return <article className={`${styles.product} ${styles.productMarket}`}><header><span>01 / MARKETPLACE</span><h3>FIND IT<span>.</span></h3><p>BUILD THE MACHINE ONCE.<br/>DISTRIBUTE IT EVERYWHERE.</p></header><div className={styles.marketVisual}><Image src="/images/2023-komatsu-wa475-10.jpg" fill sizes="(max-width: 900px) 92vw, 31vw" alt={`${machine.year} ${machine.make} ${machine.model}`}/><div className={styles.marketOverlay}><span>VERIFIED MACHINE</span><b>{machine.year} {machine.make}<br/>{machine.model}</b><small>{machine.hours} &nbsp; / &nbsp; {machine.location}</small></div><div className={styles.marketPrice}>{machine.price}</div></div><ul><li>Search live equipment inventory</li><li>Know the machine through its Passport</li><li>Save, send, compare, and move iron</li></ul><Link href="/browse-v2" className={styles.productLink}>ENTER MARKETPLACE <Icon name="arrow"/></Link></article>;
}

function AosZone({ machine }) {
  const nodes = [["pin","LOCATION","MAIN YARD"],["people","PEOPLE","3 ASSIGNED"],["work","WORK","IN PROGRESS"]];
  return <article className={styles.product}><header><span>02 / AOS</span><h3>RUN THE WORK<span>.</span></h3><p>MACHINES. PEOPLE.<br/>LOCATIONS. WORK.</p></header><div className={styles.aosVisual}><div className={styles.aosMachine}><Image src="/images/2023-komatsu-wa475-10.jpg" width={176} height={116} alt={`${machine.make} ${machine.model}`}/><span><b>{machine.make} {machine.model}</b><small>{machine.passportId}</small></span></div><div className={styles.aosSpine}/>{nodes.map(([icon,label,value],index)=><div className={`${styles.aosNode} ${styles[`aosNode${index+1}`]}`} key={label}><Icon name={icon}/><span><small>{label}</small><b>{value}</b></span></div>)}</div><ul><li>Organize every operating relationship</li><li>Assign people, locations, and work</li><li>Move context without losing the record</li></ul><Link href="/aos/work" className={styles.productLink}>ENTER AOS <Icon name="arrow"/></Link></article>;
}

function TransactZone({ machine }) {
  const ledger = [["ACQUISITION","RECORDED"],["WORK ORDER","ACTIVE"],["FREIGHT","MATCHED"],["EXPENSES","CONTROLLED"],["SETTLEMENT","READY"]];
  return <article className={`${styles.product} ${styles.productTransact}`}><header><span>03 / TRAN$ACT</span><h3>CONTROL THE MONEY<span>.</span></h3><p>EVERY COST. EVERY DOCUMENT.<br/>EVERY DOLLAR.</p></header><div className={styles.txVisual}><div className={styles.txHeader}><span><small>MACHINE LEDGER</small><b>{machine.passportId}</b></span><strong>F$</strong></div>{ledger.map(([label,state],index)=><div className={styles.ledgerRow} key={label}><span>{String(index+1).padStart(2,"0")}</span><b>{label}</b><small>{state}</small><i className={index < 3 ? styles.complete : ""}/></div>)}<div className={styles.txTotal}><span>COMPLETE FINANCIAL STORY</span><b>CONTROLLED</b></div></div><ul><li>Capture cost at the machine level</li><li>Keep documents attached to the story</li><li>Sell, collect, settle, and close cleanly</li></ul><Link href="/transact" className={styles.productLink}>EXPLORE TRAN$ACT <Icon name="arrow"/></Link></article>;
}

export default function ConnectedHomepage() {
  const router = useRouter(); const [query, setQuery] = useState(""); const [category, setCategory] = useState("ALL CATEGORIES"); const [machine, setMachine] = useState(FALLBACK_MACHINE); const categories = useMemo(() => ["ALL CATEGORIES", ...getV12CategoryNames()], []);
  useEffect(() => { captureIXEvent("homepage_viewed", { page: "connected-machine-gateway-v2" }); const controller = new AbortController(); fetch("/api/listings", { signal: controller.signal }).then(response => response.ok ? response.json() : []).then(listings => { if (!Array.isArray(listings)) return; const preferred = listings.find(item => /WA475/i.test(clean(item.title || item.model))) || listings[0]; if (preferred) setMachine(normalizeMachine(preferred)); }).catch(error => { if (error?.name !== "AbortError") setMachine(FALLBACK_MACHINE); }); return () => controller.abort(); }, []);
  function submitSearch(event) { event.preventDefault(); const q = query.trim(); const params = new URLSearchParams(); if (q) params.set("q", q); if (category !== "ALL CATEGORIES") params.set("category", category); captureIXEvent("homepage_search_performed", { query: q, category, destination: "/browse-v2" }); const suffix = params.toString(); router.push(suffix ? `/browse-v2?${suffix}` : "/browse-v2"); }
  return <div className={styles.page}>
    <Head><title>IronXchange — Move Machines</title><meta name="description" content="Find, operate, control, and transact heavy equipment through one connected machine Passport."/><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/></Head>
    <header className={styles.siteHeader}><Link href="/" className={styles.brand} aria-label="IronXchange home"><Image src="/images/ironxchange-logo.png" width={1807} height={396} priority alt="IronXchange"/></Link><nav aria-label="IronXchange products">{NAV.map(([href,label])=><Link href={href} key={label}>{label}</Link>)}</nav><div className={styles.headerActions}><Link href="/browse-v2"><Icon name="search"/> SEARCH</Link><Link href="/login">SIGN IN</Link><Link href="/post-free" className={styles.postMachine}>POST A MACHINE <Icon name="arrow"/></Link></div></header>
    <main><section className={styles.hero} aria-labelledby="hero-title"><div className={styles.draftingGrid}/><div className={styles.edgeCode}>IXI / SYSTEM 001<br/><b>CONNECTED MACHINE COMMERCE</b></div><div className={styles.heroCopy}><span className={styles.eyebrow}><i/> BUILT FOR WHAT MOVES THE WORLD</span><h1 id="hero-title">MOVE<br/>MACHINES<span>.</span></h1><p>One machine. Every move.</p><div className={styles.heroButtons}><Link href="/browse-v2" className={styles.primary}>BROWSE MACHINES <Icon name="arrow"/></Link><Link href="/aos/work" className={styles.secondary}>RUN YOUR OPERATION</Link></div><div className={styles.heroProof}><span><b>FIND</b><small>LIVE INVENTORY</small></span><span><b>OPERATE</b><small>CONNECTED WORK</small></span><span><b>TRANSACT</b><small>FINANCIAL CONTROL</small></span></div></div><HeroSystem machine={machine}/><form className={styles.searchBar} onSubmit={submitSearch}><label><span className={styles.srOnly}>Search equipment</span><Icon name="search"/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search equipment — WA475, D8T, 14M..."/></label><label><span className={styles.srOnly}>Equipment category</span><select value={category} onChange={event=>setCategory(event.target.value)}>{categories.map(item=><option key={item}>{item}</option>)}</select></label><button type="submit">SEARCH <Icon name="arrow"/></button></form><div className={styles.lifecycle}>{["FIND","KNOW","OPERATE","EARN","SELL","SETTLE"].map((item,index)=><span key={item} className={index===0?styles.yellow:index>3?styles.cyan:""}><b>{String(index+1).padStart(2,"0")}</b>{item}<i/></span>)}</div></section>
      <section className={styles.platform} id="platform" aria-labelledby="platform-title"><div className={styles.platformIntro}><span>THE IRONXCHANGE OPERATING SYSTEM</span><h2 id="platform-title">A MORE CONNECTED WAY<br/>TO MOVE IRON<span>.</span></h2><p>One machine. One Passport. One complete operating record.</p></div><div className={styles.platformGrid}><MarketplaceZone machine={machine}/><AosZone machine={machine}/><TransactZone machine={machine}/></div></section>
      <section className={styles.closing}><span>IXI / ONE CONNECTED SYSTEM</span><h2>THE MACHINE IS THE CENTER<br/>OF THE SYSTEM<span>.</span></h2><p>Buy it. Work it. Move it. Track it. Sell it.</p><div><Link href="/browse-v2" className={styles.primary}>BROWSE MACHINES <Icon name="arrow"/></Link><Link href="/post-free" className={styles.secondary}>POST A MACHINE</Link><Link href="/aos/work" className={styles.cyanButton}>RUN YOUR OPERATION <Icon name="arrow"/></Link></div></section>
    </main><footer className={styles.footer}><Image src="/images/ironxchange-logo.png" width={1807} height={396} alt="IronXchange"/><span>MARKETPLACE &nbsp; / &nbsp; AOS &nbsp; / &nbsp; TRAN$ACT</span><small>© 2026 IRONXCHANGE. ALL RIGHTS RESERVED.</small></footer>
  </div>;
}
