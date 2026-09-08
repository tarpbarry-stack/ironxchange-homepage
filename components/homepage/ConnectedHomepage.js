import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

import { captureIXEvent } from "../../lib/posthog";
import { getV12CategoryNames } from "../../lib/v12TaxonomyAdapter";
import styles from "./ConnectedHomepage.module.css";

const FALLBACK_MACHINE = Object.freeze({
  id: "69f9042e-bd3d-4a6e-a78c-05b0b806d6b7",
  year: "2022",
  make: "KOMATSU",
  model: "WA475",
  hours: "4,998 Hrs",
  price: "$170,000",
  location: "TX",
  passportId: "IXIU7UC72H",
});

const PRODUCT_NAV = Object.freeze([
  { href: "/browse-v2", label: "MARKETPLACE" },
  { href: "/aos/work", label: "AOS" },
  { href: "/transact", label: "TRAN$ACT" },
  { href: "#connected-platform", label: "WHY IXI" },
]);

const MARKETPLACE_FEATURES = ["FIND", "KNOW", "SAVE", "SEND", "SELL"];
const AOS_FEATURES = ["ORGANIZE", "ASSIGN", "MOVE", "TRACK"];
const TRANSACT_FEATURES = ["ACQUIRE", "OPERATE", "EARN", "SELL", "SETTLE"];

function clean(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeMachine(listing) {
  if (!listing) return FALLBACK_MACHINE;
  const publicData = listing.publicData || listing.attributes?.publicData || {};
  return {
    id: clean(listing.id?.uuid || listing.id, FALLBACK_MACHINE.id),
    year: clean(listing.year || publicData.year, FALLBACK_MACHINE.year),
    make: clean(listing.make || publicData.make, FALLBACK_MACHINE.make).toUpperCase(),
    model: clean(listing.model || publicData.model, FALLBACK_MACHINE.model).toUpperCase(),
    hours: clean(listing.hours || publicData.hours, FALLBACK_MACHINE.hours),
    price: clean(listing.price, FALLBACK_MACHINE.price),
    location: clean(listing.location || publicData.loc, FALLBACK_MACHINE.location).toUpperCase(),
    passportId: clean(listing.passportId || publicData.passportId, FALLBACK_MACHINE.passportId),
  };
}

function Icon({ name }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></>,
    pin: <><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></>,
    person: <><circle cx="12" cy="8" r="4"/><path d="M4.5 21c.7-5 3.2-7.5 7.5-7.5s6.8 2.5 7.5 7.5"/></>,
    clipboard: <><rect x="6" y="5" width="12" height="16" rx="2"/><path d="M9 5V3h6v2M9 10h6M9 14h6"/></>,
    gear: <><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></>,
    truck: <><path d="M3 7h11v10H3zM14 11h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
    money: <><circle cx="12" cy="12" r="9"/><path d="M15 8.5c-.8-.7-1.8-1-3-1-1.8 0-3 .9-3 2.2 0 3.6 6.2 1.3 6.2 4.8 0 1.4-1.3 2.4-3.2 2.4-1.3 0-2.6-.4-3.5-1.2M12 5v14"/></>,
    file: <><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 12h6M9 16h6"/></>,
    tag: <><path d="M3 12 12 3h7v7l-9 9z"/><circle cx="16" cy="6" r="1"/></>,
    passport: <><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="11" r="3.5"/><path d="M8.5 11h7M12 7.5c1 1 1 6 0 7M8 17h8"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>{paths[name] || paths.file}</svg>;
}

function PassportBadge({ id, cyan = false }) {
  return <span className={`${styles.passportBadge} ${cyan ? styles.cyanBadge : ""}`}><Icon name="passport" /> IXI PASSPORT <b>{id}</b></span>;
}

function ConnectorNode({ className = "" }) {
  return <span aria-hidden="true" className={`${styles.connectorNode} ${className}`}><i /></span>;
}

function HeroMarketplace({ machine }) {
  return (
    <article className={`${styles.heroPanel} ${styles.heroMarketplace}`} aria-label="Marketplace machine Passport">
      <div className={styles.heroPanelLabel}>MARKETPLACE</div>
      <div className={styles.machineStage}>
        <div className={styles.machinePhotoBackdrop} />
        <Image src="/images/ixi-homepage-komatsu-wa475-cutout.png" alt={`${machine.year} ${machine.make} ${machine.model} wheel loader`} fill priority sizes="(max-width: 760px) 94vw, 48vw" className={styles.machineCutout} />
        <span className={styles.stagePassport}><Icon name="passport" /> IXI PASSPORT</span>
      </div>
      <div className={styles.machineIdentity}>
        <div><strong>{machine.year} {machine.make} {machine.model}</strong><span>WHEEL LOADER&nbsp;&nbsp;|&nbsp;&nbsp;{machine.hours}</span></div>
        <div><b>{machine.price}</b><small>{machine.location}</small></div>
      </div>
      <PassportBadge id={machine.passportId} />
    </article>
  );
}

function HeroAos({ machine }) {
  const rows = [["pin", "LOCATION", "WICHITA FALLS, TX"], ["person", "PEOPLE", "3 ASSIGNED"], ["clipboard", "WORK ORDER", "IN PROGRESS"]];
  return (
    <article className={`${styles.heroPanel} ${styles.heroAos}`} aria-label="AOS connected machine context">
      <div className={styles.heroPanelLabel}>AOS</div>
      <p>SAME MACHINE. MORE CAPACITY.</p>
      <div className={styles.aosMachineRow}>
        <Image src="/images/2023-komatsu-wa475-10.jpg" alt="Komatsu WA475-10" width={76} height={58} />
        <div><span>MACHINE</span><strong>{machine.year} {machine.make} {machine.model}</strong><small>{machine.passportId}</small></div><b>›</b>
      </div>
      {rows.map(([icon, label, value]) => <div className={styles.systemRow} key={label}><Icon name={icon}/><span><small>{label}</small><strong>{value}</strong></span><b>›</b></div>)}
    </article>
  );
}

function HeroTransact({ machine }) {
  const rows = [["passport", "ACQUISITION", "RECORDED", "done"], ["clipboard", "WORK ORDER", "IN PROGRESS", "active"], ["truck", "FREIGHT", "SCHEDULED", ""], ["file", "EXPENSE", "2 RECORDS", ""], ["tag", "SALE", "AVAILABLE", ""], ["money", "SETTLEMENT", "PENDING", ""]];
  return (
    <article className={`${styles.heroPanel} ${styles.heroTransact}`} aria-label="Tran$act machine financial record">
      <div className={styles.heroPanelLabel}>TRAN$ACT</div>
      <p>EVERY DOLLAR FOLLOWS THE MACHINE.</p>
      <div className={styles.txPassport}>{machine.passportId}<span>FINANCIAL STORY</span></div>
      {rows.map(([icon, label, value, state]) => <div className={`${styles.systemRow} ${styles.txRow} ${styles[state] || ""}`} key={label}><Icon name={icon}/><span><small>{label}</small><strong>{value}</strong></span><b>›</b></div>)}
    </article>
  );
}

function ProductFeatureLine({ items }) {
  return <div className={styles.featureLine}>{items.map((item, index) => <span key={item}>{item}{index < items.length - 1 ? <i>·</i> : null}</span>)}</div>;
}

function MarketplaceZone({ machine }) {
  return (
    <article className={`${styles.platformZone} ${styles.marketZone}`}>
      <div className={styles.zoneKicker}>MARKETPLACE</div><h3>FIND IT<span>.</span></h3><p>BUILD THE MACHINE ONCE. DISTRIBUTE IT EVERYWHERE.</p>
      <div className={styles.marketCard}>
        <div className={styles.marketCardTop}><strong>{machine.year} {machine.make} {machine.model}</strong><PassportBadge id={machine.passportId}/></div>
        <div className={styles.marketImage}><Image src="/images/2023-komatsu-wa475-10.jpg" fill sizes="(max-width: 860px) 92vw, 30vw" alt={`${machine.make} ${machine.model}`} /></div>
        <div className={styles.marketCardBottom}><b>{machine.price}</b><span>{machine.hours}</span><small>{machine.location}</small></div><div className={styles.dotRail}><i/><i/><i/><i/></div>
      </div>
      <ProductFeatureLine items={MARKETPLACE_FEATURES}/><Link className={`${styles.zoneButton} ${styles.yellowButton}`} href="/browse-v2">ENTER MARKETPLACE <b>→</b></Link>
    </article>
  );
}

function AosZone({ machine }) {
  const connections = [["pin", "LOCATION", "MAIN YARD"], ["person", "TECHNICIAN", "ASSIGNED"], ["clipboard", "WORK ORDER", "IN PROGRESS"], ["gear", "PARTS", "ON ORDER"], ["truck", "FREIGHT", "SCHEDULED"]];
  return (
    <article className={`${styles.platformZone} ${styles.aosZone}`}>
      <div className={styles.zoneKicker}>AOS</div><h3>RUN THE WORK<span>.</span></h3><p>MACHINES. PEOPLE. LOCATIONS. WORK.</p>
      <div className={styles.aosMap}>
        <div className={styles.aosHub}><Image src="/images/2023-komatsu-wa475-10.jpg" width={144} height={96} alt="Komatsu WA475-10" /><strong>{machine.year} {machine.make} {machine.model}</strong><PassportBadge id={machine.passportId}/></div>
        {connections.map(([icon, label, value], index) => <div className={`${styles.aosConnection} ${styles[`connection${index + 1}`]}`} key={label}><Icon name={icon}/><span><small>{label}</small><strong>{value}</strong></span></div>)}
      </div>
      <ProductFeatureLine items={AOS_FEATURES}/><Link className={styles.zoneButton} href="/aos/work">ENTER AOS <b>→</b></Link>
    </article>
  );
}

function TransactZone({ machine }) {
  const records = [["passport", "ACQUISITION", "RECORDED"], ["file", "EXPENSE", "ATTACHED"], ["clipboard", "WORK ORDER", "ACTIVE"], ["truck", "FREIGHT", "MATCHED"], ["file", "INVOICE", "AVAILABLE"], ["tag", "SOLD", "CLOSES AFTER COLLECTION"], ["money", "SETTLEMENT", "DISBURSES PROCEEDS"]];
  return (
    <article className={`${styles.platformZone} ${styles.transactZone}`}>
      <div className={styles.zoneKicker}>TRAN$ACT</div><h3>CONTROL THE MONEY<span>.</span></h3><p>EVERY COST. EVERY DOCUMENT. EVERY DOLLAR.</p>
      <div className={styles.txMachineHeader}><Image src="/images/2023-komatsu-wa475-10.jpg" width={84} height={60} alt="Komatsu WA475-10" /><span><strong>{machine.year} {machine.make} {machine.model}</strong><small>{machine.passportId}</small></span><b>F$</b></div>
      <div className={styles.txRecords}>{records.map(([icon, label, value]) => <div key={label}><Icon name={icon}/><span><strong>{label}</strong><small>{value}</small></span><b>›</b></div>)}</div>
      <div className={styles.salesRail}>{["QUOTE", "ORDER", "SIGNED", "INVOICE", "SOLD", "SETTLE"].map((stage, index) => <span className={index < 2 ? styles.stageDone : index === 2 ? styles.stageNext : ""} key={stage}><i>{index + 1}</i><small>{stage}</small></span>)}</div>
      <ProductFeatureLine items={TRANSACT_FEATURES}/><Link className={`${styles.zoneButton} ${styles.cyanButton}`} href="/transact">EXPLORE TRAN$ACT <b>→</b></Link>
    </article>
  );
}

export default function ConnectedHomepage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL CATEGORIES");
  const [machine, setMachine] = useState(FALLBACK_MACHINE);
  const categories = useMemo(() => ["ALL CATEGORIES", ...getV12CategoryNames()], []);

  useEffect(() => {
    captureIXEvent("homepage_viewed", { page: "connected-machine-gateway-v1" });
    const controller = new AbortController();
    fetch("/api/listings", { signal: controller.signal }).then(response => response.ok ? response.json() : []).then(listings => {
      if (!Array.isArray(listings)) return;
      const preferred = listings.find(item => /WA475/i.test(clean(item.title || item.model))) || listings[0];
      if (preferred) setMachine(normalizeMachine(preferred));
    }).catch(error => { if (error?.name !== "AbortError") setMachine(FALLBACK_MACHINE); });
    return () => controller.abort();
  }, []);

  function submitSearch(event) {
    event?.preventDefault?.();
    const q = query.trim();
    captureIXEvent("homepage_search_performed", { query: q, category, destination: "/browse-v2" });
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category !== "ALL CATEGORIES") params.set("category", category);
    const suffix = params.toString();
    router.push(suffix ? `/browse-v2?${suffix}` : "/browse-v2");
  }

  return (
    <div className={styles.page}>
      <Head><title>IronXchange — Move Machines</title><meta name="description" content="Find, organize, operate and transact heavy equipment through one connected machine Passport." /><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" /></Head>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="IronXchange home"><Image src="/images/ironxchange-logo.png" width={1807} height={396} priority alt="IronXchange" /></Link>
        <nav className={styles.nav} aria-label="IronXchange products">{PRODUCT_NAV.map(item => <Link href={item.href} key={item.label}>{item.label}</Link>)}</nav>
        <div className={styles.headerActions}><Link href="/browse-v2" className={styles.headerLink}><Icon name="search"/><span>SEARCH</span></Link><Link href="/login" className={styles.headerLink}>SIGN IN</Link><Link href="/post-free" className={styles.postButton}>＋ POST A MACHINE</Link></div>
      </header>
      <main>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroGrid}/><div className={styles.microLeft}>IXI<br/><b>BUILT FOR<br/>WHAT MOVES<br/>THE WORLD.</b></div><div className={styles.microRight}>MACHINES<br/>PEOPLE<br/>OPERATIONS<br/>VALUE<i/></div>
          <div className={styles.heroCopy}><h1 id="hero-title">MOVE<br/>MACHINES<span>.</span></h1><p>One machine. Every move.</p><div className={styles.heroActions}><Link href="/browse-v2" className={styles.primaryButton}>BROWSE MACHINES</Link><Link href="/aos/work" className={styles.secondaryButton}>RUN YOUR OPERATION</Link></div><small>MARKETPLACES. OPERATIONS. CAPITAL.<br/>ALL IN MOTION.</small></div>
          <div className={styles.heroSystems}><div className={styles.connectorLine}/><ConnectorNode className={styles.marketNode}/><ConnectorNode className={styles.aosNode}/><ConnectorNode className={styles.txNode}/><HeroMarketplace machine={machine}/><HeroAos machine={machine}/><HeroTransact machine={machine}/></div>
          <form className={styles.heroSearch} onSubmit={submitSearch}><label><span className={styles.srOnly}>Search equipment</span><Icon name="search"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search equipment — WA475, D8T, 14M..." /></label><label><span className={styles.srOnly}>Equipment category</span><select value={category} onChange={event => setCategory(event.target.value)}>{categories.map(item => <option key={item}>{item}</option>)}</select></label><button type="submit">SEARCH</button></form>
          <div className={styles.lifecycle} aria-label="IronXchange machine lifecycle">{["FIND", "KNOW", "OPERATE", "EARN", "SELL", "SETTLE"].map((item, index) => <span key={item} className={index === 0 ? styles.lifeYellow : index > 3 ? styles.lifeCyan : ""}><b>{item}</b>{index < 5 ? <i>→</i> : null}<small>{index === 0 ? "MARKETPLACE" : index === 2 ? "AOS" : index === 4 ? "TRAN$ACT" : ""}</small></span>)}</div>
        </section>
        <section id="connected-platform" className={styles.platform} aria-labelledby="platform-title">
          <div className={styles.platformBackdrop}/><div className={styles.platformIntro}><h2 id="platform-title">A MORE CONNECTED<br/>WAY TO MOVE IRON<span>.</span></h2><p>One machine. One Passport. One complete operating record.</p></div><div className={styles.platformLine}><ConnectorNode/><ConnectorNode/><ConnectorNode/></div>
          <div className={styles.platformGrid}><MarketplaceZone machine={machine}/><AosZone machine={machine}/><TransactZone machine={machine}/></div>
        </section>
        <section className={styles.closing}><div><h2>THE MACHINE IS THE CENTER OF THE SYSTEM<span>.</span></h2><p>Buy it. Work it. Move it. Track it. Sell it.</p></div><div className={styles.closingActions}><Link href="/browse-v2" className={styles.primaryButton}>BROWSE MACHINES</Link><Link href="/post-free" className={styles.secondaryButton}>POST A MACHINE</Link><Link href="/aos/work" className={styles.cyanOutline}>RUN YOUR OPERATION</Link></div></section>
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerBrand}><Image src="/images/ironxchange-logo.png" width={1807} height={396} alt="IronXchange"/><span>BUILT FOR<br/>WHAT MOVES<br/>THE WORLD.</span></div>
        <div className={styles.footerLinks}><div><b>MARKETPLACE</b><Link href="/browse-v2">Browse Machines</Link><Link href="/post-free">Post a Machine</Link><Link href={`/p/${machine.passportId}`}>IXI Passport</Link></div><div><b>AOS</b><Link href="/aos/work">Run Operations</Link><Link href="/aos/work">Manage Work</Link></div><div><b>TRAN$ACT</b><Link href="/transact">Manage Costs</Link><Link href="/transact/ledger">Financial Controls</Link></div><div><b>COMPANY</b><Link href="/contact">Contact</Link></div><div><b>LEGAL</b><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></div>
        <small>© 2026 IronXchange. All rights reserved.</small>
      </footer>
    </div>
  );
}
