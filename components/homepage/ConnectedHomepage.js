import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { captureIXEvent } from "../../lib/posthog";
import { fetchPublicMarketplaceListings } from "../../lib/listings/publicMarketplaceClient";
import styles from "./ConnectedHomepage.module.css";

const FALLBACK_LISTING = Object.freeze({
  id: "69f9042e-bd3d-4a6e-a78c-05b0b806d6b7",
  title: "2021 KOMATSU WA470-8",
  year: "2021",
  make: "KOMATSU",
  model: "WA470-8",
  hours: "4,892",
  price: "$315,000",
  location: "DENVER, CO",
  passportId: "IXI-10472",
  imageUrls: ["/images/2023-komatsu-wa475-10.jpg"],
  imageCount: 1,
  publicData: {
    year: "2021",
    make: "KOMATSU",
    model: "WA470-8",
    hours: "4,892",
    price: "$315,000",
    location: "DENVER, CO",
    passportId: "IXI-10472",
    machineAccess: "public",
    machineChannel: "marketplace",
  },
});

const NAV = [["/browse-v2", "MARKETPLACE"], ["/aos/work", "AOS"], ["/transact", "TRAN$ACT"], ["#system", "WHY IXI"]];
const CHANNELS = [["MARKETPLACE", "Reach buyers everywhere."], ["SELLER YARD", "List across your yards."], ["EMAIL", "Share with your network."], ["SMS", "Send to buyers directly."], ["WHATSAPP", "Reach international buyers."]];
const FINANCIAL_STAGES = [["ACQUISITION", "Purchase the machine."], ["WORK", "Track utilization and jobs."], ["EXPENSES", "Capture every cost."], ["INVOICE", "Bill customers."], ["SOLD", "Close the machine."], ["SETTLEMENT", "Complete the financial story."]];

function clean(value, fallback = "") { const text = String(value ?? "").trim(); return text || fallback; }

function Icon({ name }) {
  const paths = {
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    arrow: <><path d="M4 12h15" /><path d="m14 7 5 5-5 5" /></>,
    cart: <><path d="M3 5h2l2 10h10l2-7H6" /><circle cx="9" cy="19" r="1" /><circle cx="17" cy="19" r="1" /></>,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" /></>,
    money: <><circle cx="12" cy="12" r="9" /><path d="M15 8.5c-.8-.7-1.8-1-3-1-1.7 0-3 .8-3 2s1.1 1.8 3.2 2.2 3.1 1.1 3.1 2.4-1.4 2.3-3.3 2.3c-1.2 0-2.4-.4-3.2-1.1M12 5.5v13" /></>,
    passport: <><rect x="4" y="3" width="16" height="18" rx="2" /><circle cx="12" cy="11" r="3.5" /><path d="M8.5 11h7M12 7.5c1 1 1 6 0 7M8 17h8" /></>,
    entity: <><path d="M4 20h16M6 20V8l6-4 6 4v12M9 11h2M13 11h2M9 15h2M13 15h2" /></>,
    people: <><circle cx="12" cy="7" r="3" /><path d="M5.5 21c.5-5.2 2.6-8 6.5-8s6 2.8 6.5 8" /></>,
    machine: <><path d="M4 17h12l3-5h-4l-2-5H8l-2 7H4z" /><circle cx="7" cy="18" r="2" /><circle cx="16" cy="18" r="2" /></>,
    work: <><rect x="5" y="5" width="14" height="16" rx="2" /><path d="M9 5V3h6v2M9 10h6M9 14h6M9 18h4" /></>,
  };
  return <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">{paths[name] || paths.arrow}</svg>;
}

function ButtonLink({ href, children, tone = "primary" }) { return <Link className={styles[tone]} href={href}>{children}<Icon name="arrow" /></Link>; }

function HeroIxiRail({ active = 4 }) {
  return <div className={styles.heroIxiRail} aria-hidden="true">
    {[1, 2, 3, 4, 5, 6, 7].map(number => <i className={number === active ? styles.railActive : ""} key={number} />)}
  </div>;
}

function HeroMachinePhoto() {
  return <div className={styles.heroMachinePhoto}>
    <Image src="/images/2023-komatsu-wa475-10.jpg" alt="" fill sizes="240px" />
    <span>IXI VERIFIED</span>
  </div>;
}

function HeroMarketplaceTableau({ listing }) {
  return <div className={`${styles.heroProductTableau} ${styles.heroMarketplaceTableau}`} aria-label="Marketplace listing and distribution Console preview">
    <div className={styles.heroMockCard}>
      <header><small>MARKETPLACE</small><b>{clean(listing.passportId, "IXI-10472")}</b></header>
      <HeroMachinePhoto />
      <div className={styles.heroMachineIdentity}><b>{clean(listing.title, "2021 KOMATSU WA470-8")}</b><span>{clean(listing.hours, "4,892")} HRS</span></div>
      <div className={styles.heroMachineValue}><b>{clean(listing.price, "$315,000")}</b><span>{clean(listing.location, "DENVER, CO")}</span></div>
      <HeroIxiRail active={5} />
    </div>
    <div className={styles.heroMockConsole}>
      <header><span>IXI CONSOLE</span><b>DISTRIBUTE</b></header>
      <div className={styles.distributionMap}><strong>ONE LISTING</strong><i /><span>MARKETPLACE</span><span>SELLER YARD</span><span>EMAIL · SMS</span><span>WHATSAPP</span></div>
      <footer>5 CHANNELS <b>READY</b></footer>
    </div>
  </div>;
}

function HeroAosTableau({ listing }) {
  return <div className={`${styles.heroProductTableau} ${styles.heroAosTableau}`} aria-label="Private AOS machine and operations Console preview">
    <div className={`${styles.heroMockCard} ${styles.heroPrivateCard}`}>
      <header><small>PRIVATE · MACHINE</small><b>+ &nbsp; EDIT &nbsp; $ &nbsp; ⋮</b></header>
      <HeroMachinePhoto />
      <div className={styles.heroMachineIdentity}><b>{clean(listing.title, "2021 KOMATSU WA470-8")}</b><span>PRIMARY</span></div>
      <div className={styles.heroAosRelationships}><span>PEOPLE</span><span>LOCATIONS</span><span>ACTIVE WORK</span></div>
      <div className={styles.heroPlacement}><span>LIVE</span><b>PRIV</b><span>AUCT</span></div>
      <HeroIxiRail active={4} />
    </div>
    <div className={`${styles.heroMockConsole} ${styles.heroOperationsConsole}`}>
      <header><span>AOS CONSOLE</span><b>OPERATE</b></header>
      <div className={styles.operationsGrid}><span>ENTITY</span><span>PEOPLE</span><span>LOCATIONS</span><span>WORK</span><i>ONE PASSPORT SYSTEM</i></div>
      <footer>RELATIONSHIPS <b>CONNECTED</b></footer>
    </div>
  </div>;
}

function HeroTransactTableau({ listing }) {
  return <div className={`${styles.heroProductTableau} ${styles.heroTransactTableau}`} aria-label="TRAN$ACT machine and financial Console preview">
    <div className={`${styles.heroMockCard} ${styles.heroTransactCard}`}>
      <header><small>TRAN$ACT</small><b>{clean(listing.passportId, "IXI-10472")}</b></header>
      <div className={styles.transactMark}>TRAN<span>$</span>ACT<small>MACHINE FINANCIAL FILE</small></div>
      <div className={styles.transactTiles}><span>ACQUIRE</span><span>WORK</span><span>EXPENSE</span><span>INVOICE</span><span>SOLD</span><span>SETTLE</span></div>
      <HeroIxiRail active={6} />
    </div>
    <div className={`${styles.heroMockConsole} ${styles.heroLedgerConsole}`}>
      <header><span>FINANCIAL CONSOLE</span><b>CONTROL</b></header>
      <div className={styles.ledgerRows}><span><b>COST BASIS</b><i>$247,800</i></span><span><b>OPEN WORK</b><i>$18,420</i></span><span><b>MARKET VALUE</b><i>$315,000</i></span><strong>POSITION <b>+$48,780</b></strong></div>
      <footer>PASSPORT LEDGER <b>LIVE</b></footer>
    </div>
  </div>;
}

function GatewayBay({ number, title, headline, detail, tone, icon }) {
  return <article className={`${styles.gatewayBay} ${styles[tone]}`}><div className={styles.bayHead}><Icon name={icon} /><span>{number}</span><b>{title}</b></div><strong>{headline}</strong><small>{detail}</small></article>;
}

function GatewayHitAreas() {
  return <nav className={styles.gatewayHitAreas} aria-label="Enter an IronXchange product">
    <Link className={`${styles.gatewayHitArea} ${styles.gatewayMarketLink}`} href="/browse-v2" aria-label="Enter the IXI Marketplace"><span>ENTER MARKETPLACE</span></Link>
    <Link className={`${styles.gatewayHitArea} ${styles.gatewayAosLink}`} href="/aos/work" aria-label="Enter IXI AOS"><span>ENTER AOS</span></Link>
    <Link className={`${styles.gatewayHitArea} ${styles.gatewayTransactLink}`} href="/transact" aria-label="Enter IXI TRAN$ACT"><span>ENTER TRAN$ACT</span></Link>
  </nav>;
}

function MarketplaceVisual({ listing }) {
  return <div className={styles.marketplaceVisual}><HeroMarketplaceTableau listing={listing} /><div className={styles.channelSpine} aria-hidden="true" /><div className={styles.channelList}>{CHANNELS.map(([name, detail]) => <div className={styles.channel} key={name}><i /><span><b>{name}</b><small>{detail}</small></span></div>)}</div></div>;
}

function AosVisual() {
  const nodes = [["people", "PEOPLE", "Your team", "people"], ["entity", "YARD A", "Denver, CO", "yardA"], ["entity", "YARD B", "Phoenix, AZ", "yardB"], ["machine", "MACHINES", "Your fleet", "machines"], ["work", "ACTIVE WORK", "Jobs & tasks", "activeWork"]];
  return <div className={styles.aosVisual}><div className={styles.aosLines} aria-hidden="true" /><div className={styles.aosEntity}><Icon name="entity" /><span><b>ENTITY</b><small>ONE PASSPORT SYSTEM</small></span></div>{nodes.map(([icon, title, detail, position]) => <div className={`${styles.aosNode} ${styles[position]}`} key={title}><Icon name={icon} /><span><b>{title}</b><small>{detail}</small></span></div>)}</div>;
}

function TransactVisual() {
  return <div className={styles.transactVisual}><div className={styles.transactIdentity} aria-hidden="true"><span>IXI</span> TRAN<b>$</b>ACT<small>ONE PASSPORT · COMPLETE FINANCIAL CONTROL</small></div><div className={styles.financeLine} aria-hidden="true" />{FINANCIAL_STAGES.map(([name, detail], index) => <div className={styles.financeStage} key={name}><span>{String(index + 1).padStart(2, "0")}</span><i>{index + 1}</i><b>{name}</b><small>{detail}</small></div>)}</div>;
}

function BenefitSection({ number, product, headline, body, benefit, href, tone, image, children }) {
  return <section className={`${styles.benefit} ${styles[tone]}`} id={product.toLowerCase().replace("$", "s")}><Image className={styles.benefitImage} src={image} alt="" fill sizes="100vw" /><div className={styles.benefitShade} /><div className={styles.benefitRail}><i /><span>{number}</span></div><div className={styles.benefitCopy}><div className={styles.productLabel}><span>{number}</span><b>{product}</b></div><h2>{headline}<em>.</em></h2><p>{body}</p><div className={styles.benefitActions}><ButtonLink href={href} tone={tone === "marketTone" ? "primary" : "cyanButton"}>EXPLORE {product}</ButtonLink><span>{benefit}</span></div></div><div className={styles.benefitVisual}>{children}</div></section>;
}

export default function ConnectedHomepage() {
  const [listing, setListing] = useState(FALLBACK_LISTING);
  useEffect(() => {
    captureIXEvent("homepage_viewed", { page: "ixi-bay-gateway-v3" });
    fetchPublicMarketplaceListings({ surface: "home" }).then(listings => {
      if (!Array.isArray(listings)) return;
      const preferred = listings.find(item => /WA475|WA470/i.test(clean(item.title || item.model))) || listings[0];
      if (preferred) setListing(preferred);
    }).catch(error => { if (error?.name !== "AbortError") setListing(FALLBACK_LISTING); });
  }, []);

  return <div className={styles.page}>
    <Head><title>IronXchange — Your Machine Is the Beginning</title><meta name="description" content="One Passport connects the marketplace, the work, and the money." /><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" /><link rel="preload" as="image" href="/images/ixi-homepage-bay-gateway.webp" fetchPriority="high" /></Head>
    <header className={styles.siteHeader}><Link href="/gateway" className={styles.brand} aria-label="IronXchange gateway"><Image src="/images/ironxchange-logo.png" width={1807} height={396} priority alt="IronXchange" /></Link><nav aria-label="IronXchange products">{NAV.map(([href, label]) => <Link href={href} key={label}>{label}</Link>)}</nav><div className={styles.headerActions}><Link href="/browse-v2"><Icon name="search" /><span>SEARCH</span></Link><Link href="/login">SIGN IN</Link><Link href="/post-free" className={styles.postMachine}>POST A MACHINE</Link></div></header>
    <main>
      <section className={styles.hero} aria-labelledby="hero-title"><Image className={styles.heroImage} src="/images/ixi-homepage-bay-gateway.webp" alt="" fill priority fetchPriority="high" sizes="100vw" /><div className={styles.heroShade} /><div className={styles.blueprintGrid} /><div className={styles.sideDoctrine}>BUILT FOR<br />THE PEOPLE<br />WHO MOVE IRON.</div><div className={styles.heroCopy}><h1 id="hero-title">YOUR MACHINE<br />IS THE BEGINNING<span>.</span></h1><p>One Passport connects the marketplace,<br />the work, and the money.</p><div className={styles.heroActions}><ButtonLink href="/post-free">BRING A MACHINE INTO IXI</ButtonLink><ButtonLink href="#system" tone="secondary">SEE HOW IXI WORKS</ButtonLink></div></div><div className={styles.gatewayJourney}><div className={styles.gatewayRail} aria-hidden="true"><i /><i /><i /></div><GatewayBay number="01" title="MARKETPLACE" headline="LIST ONCE. DISTRIBUTE EVERYWHERE." detail="Reach buyers without rebuilding the listing." tone="marketTone" icon="cart" /><GatewayBay number="02" title="AOS" headline="OPERATE THE WHOLE BUSINESS." detail="Machines. People. Locations. Work." tone="aosTone" icon="gear" /><GatewayBay number="03" title="TRAN$ACT" headline="CONTROL THE ENTIRE ENTITY." detail="Every cost. Every document. Every dollar." tone="transactTone" icon="money" /></div><div className={styles.heroDoorObjects}><div className={styles.heroDoorObject}><HeroMarketplaceTableau listing={listing} /></div><div className={styles.heroDoorObject}><HeroAosTableau listing={listing} /></div><div className={styles.heroDoorObject}><HeroTransactTableau listing={listing} /></div></div><GatewayHitAreas /><div className={styles.heroStatement}><b>ONE MACHINE. ONE PASSPORT<span>.</span> ONE OPERATING SYSTEM<span>.</span></b><small>BUILT FOR THE PEOPLE WHO MOVE IRON.</small></div></section>
      <section className={styles.systemIntro} id="system"><span>IXI / THE CONNECTED MACHINE SYSTEM</span><h2>BRING THE MACHINE IN.<br /><em>IXI CARRIES IT FORWARD.</em></h2><p>Create the record once. Every system adds value without making you start over.</p></section>
      <BenefitSection number="01" product="MARKETPLACE" headline="DISTRIBUTE WITHOUT REBUILDING" body="Create the machine once. Publish it, share it, and move it everywhere." benefit="ONE RECORD. EVERY CHANNEL." href="/browse-v2" tone="marketTone" image="/images/ixi-homepage-bay-marketplace.webp"><MarketplaceVisual listing={listing} /></BenefitSection>
      <BenefitSection number="02" product="AOS" headline="OPERATE WHAT YOU OWN" body="Connect machines, people, locations, and work around the same Passport." benefit="THE BUSINESS AROUND THE MACHINE." href="/aos/work" tone="aosTone" image="/images/ixi-homepage-bay-aos.webp"><AosVisual /></BenefitSection>
      <BenefitSection number="03" product="TRAN$ACT" headline="CONTROL THE ENTIRE ENTITY" body="Every acquisition, cost, document, payment, and settlement in one financial story." benefit="EVERY DOLLAR FOLLOWS THE MACHINE." href="/transact" tone="transactTone" image="/images/ixi-homepage-bay-transact.webp"><TransactVisual /></BenefitSection>
      <section className={styles.finalCta}><span>THE GATEWAY TO IRONXCHANGE</span><h2>BRING YOUR FIRST MACHINE INTO IXI<span>.</span></h2><p>Start free. Build the record once. Let IXI carry it forward.</p><div><ButtonLink href="/post-free">POST A MACHINE — FREE</ButtonLink><ButtonLink href="/browse-v2" tone="secondary">BROWSE MACHINES</ButtonLink></div><small>NO LISTING FEES. NO CREDIT CARD. NO REBUILDING THE RECORD.</small></section>
    </main>
    <footer className={styles.footer}><Image src="/images/ironxchange-logo.png" width={1807} height={396} alt="IronXchange" /><nav>{[["/browse-v2", "MARKETPLACE"], ["/aos/work", "AOS"], ["/transact", "TRAN$ACT"], ["/contact", "CONTACT"], ["/terms", "TERMS"], ["/privacy", "PRIVACY"]].map(([href, label]) => <Link href={href} key={label}>{label}</Link>)}</nav><span>BUILT FOR THE PEOPLE WHO MOVE IRON.</span></footer>
  </div>;
}
