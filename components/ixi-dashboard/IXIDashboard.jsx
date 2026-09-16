import Head from "next/head";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../Navbar";
import DashboardMachineRail from "./DashboardMachineRail";
import useIXISellerMachineOps from "../ixi-chassis/useIXISellerMachineOps";
import { fetchIxiMachineState, saveIxiMachinePatch } from "../../lib/ixiMachineStateClient";
import { getSavedListingIdsFromUser, toggleSavedListing } from "../../lib/savedListings";
import { fetchPublicMarketplaceListings } from "../../lib/listings/publicMarketplaceClient";
import { filterAosOwnedMachines } from "../../lib/listings/IXIAosOwnedInventoryPolicy.mjs";
import { preserveOpenInventoryTransactions, releaseClosedInventoryTransactions } from "../../lib/listings/IXIInventorySession.mjs";
import { subscribeInventoryChanges } from "../../lib/listings/IXIInventoryEvents";
import { isPublicMarketplaceMachine, isPrivateMachine, getMachineChannel } from "../../lib/machine-access/IXIMachineAccess";
import { hydrateIXIListingMedia } from "../../lib/listings/hydrateIXIListingMedia";
import { dashboardId, dashboardKey, uniqueMachines, relationshipIds, collectRelationships, reconcileOpenKeys, viewPatch, relationshipPatch, restoreDashboard, verifiedInquiryCount } from "./dashboardContract.mjs";
import styles from "./dashboard.module.css";

const Board = dynamic(() => import("./DashboardBoard"), { ssr: false, loading: () => <div className="dash-board-loading" role="status">Preparing your board…</div> });
const APPS = [
  ["AOS / WORK", "/aos/work", "Your company", "▦"],
  ["TRAN$ACT", "/transact", "Financial desktop", "$"],
  ["INVENTORY", "/account/my-listings-v2", "Your machines", "▤"],
  ["SOLD", "/sold", "Sales & settlement", "✓"],
  ["THEATER", "/theater", "Compare & present", "▣"],
  ["LAUNCH", "/post-free", "Add a machine", "+"]
];
const liveMachine = item => isPublicMarketplaceMachine(item) && item.sharetribeState === "published" && !["paused", "closed", "deleted", "archived"].includes(item.listingStatus);
const pending = { loading: true, error: "" };

export default function IXIDashboard() {
  const [auth, setAuth] = useState({ loading: true, user: null, sdk: null, error: "" });
  const [authRevision, setAuthRevision] = useState(0);
  const [owned, setOwned] = useState([]), [related, setRelated] = useState([]);
  const [ownedStatus, setOwnedStatus] = useState(pending), [relatedStatus, setRelatedStatus] = useState(pending);
  const [savedIds, setSavedIds] = useState([]), [states, setStates] = useState({});
  const [inquiries, setInquiries] = useState(null), [openKeys, setOpenKeys] = useState([]);
  const [selectedKey, setSelectedKey] = useState(""), [size, setSize] = useState("fit");
  const [ownedFilter, setOwnedFilter] = useState("all"), [leftQuery, setLeftQuery] = useState(""), [rightQuery, setRightQuery] = useState("");
  const [hidden, setHidden] = useState({ left: false, right: false }), [mobileRail, setMobileRail] = useState("");
  const [dirtyKeys, setDirtyKeys] = useState(new Set()), [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0), [scroll, setScroll] = useState(0), [restored, setRestored] = useState(false);
  const scrollPosition = useRef(0);
  const initialBoard = useRef(false), dirtyRef = useRef(dirtyKeys), stateRef = useRef(states), storageRef = useRef(null);
  const writeQueues = useRef(new Map()), mediaRequests = useRef(new Set()), mounted = useRef(true);
  dirtyRef.current = dirtyKeys; stateRef.current = states;
  const userId = String(auth.user?.id?.uuid || auth.user?.id || "");
  const storageKey = userId ? `ixi:dashboard:v1:${userId}` : "";

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    let canceled = false;
    setAuth(value => ({ ...value, loading: true, error: "" }));
    (async () => {
      try {
        const imported = await import("sharetribe-flex-sdk");
        const sdk = (imported.default || imported).createInstance({ clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID });
        const response = await sdk.currentUser.show({ include: ["profileImage"] });
        if (canceled) return;
        const user = { ...response.data.data, included: response.data.included || [] };
        setSavedIds(getSavedListingIdsFromUser(user));
        setAuth({ user, sdk, loading: false, error: "" });
        sdk.transactions.query({ only: "sale", perPage: 1 }).then(result => { if (!canceled) setInquiries(verifiedInquiryCount(result)); }).catch(() => { if (!canceled) setInquiries(null); });
      } catch (error) {
        if (!canceled) setAuth({ loading: false, user: null, sdk: null, error: Number(error?.status) === 401 ? "Sign in to open your dashboard." : "We couldn’t load your account. Please try again." });
      }
    })();
    return () => { canceled = true; };
  }, [authRevision]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = restoreDashboard(JSON.parse(localStorage.getItem(storageKey) || "null"));
      if (saved) {
        setOpenKeys(saved.open); setStates(saved.states); setSize(saved.size); setOwnedFilter(saved.ownedFilter);
        setLeftQuery(saved.leftQuery); setRightQuery(saved.rightQuery); setScroll(saved.scroll); scrollPosition.current = saved.scroll; initialBoard.current = true;
      }
    } catch { /* A damaged local layout must not prevent account access. */ }
    setRestored(true);
  }, [storageKey]);

  useEffect(() => {
    if (!userId || !restored) return;
    let canceled = false;
    setOwnedStatus(pending); setRelatedStatus(pending);
    const inventory = fetch("/api/account-listings", { cache: "no-store" }).then(async response => {
      if (!response.ok) throw new Error("Inventory unavailable");
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Inventory unavailable");
      return uniqueMachines(data);
    });
    const relationships = fetchIxiMachineState(userId, { strict: true });
    inventory.then(items => {
      if (canceled) return;
      const currentOwned = uniqueMachines(filterAosOwnedMachines(items));
      setOwned(previous => preserveOpenInventoryTransactions(previous, currentOwned, stateRef.current));
      setOwnedStatus({ loading: false, error: "" });
      if (!initialBoard.current) { initialBoard.current = true; setOpenKeys(currentOwned.length ? [dashboardKey(currentOwned[0])] : []); }
    }).catch(() => { if (!canceled) setOwnedStatus({ loading: false, error: "Owned inventory couldn’t refresh. Try again." }); });
    (async () => {
      const [inventoryResult, stateResult] = await Promise.allSettled([inventory, relationships]);
      if (canceled) return;
      const authored = inventoryResult.status === "fulfilled" ? inventoryResult.value : [];
      const remoteState = stateResult.status === "fulfilled" ? (stateResult.value?.state || stateResult.value || {}) : {};
      setStates(previous => {
        const next = { ...previous };
        for (const [id, value] of Object.entries(remoteState || {})) if (!id.startsWith("__")) next[id] = { ...next[id], ...relationshipPatch(value || {}) };
        return next;
      });
      const ids = relationshipIds(getSavedListingIdsFromUser(auth.user), remoteState);
      try {
        const authoredIds = new Set(authored.map(dashboardId));
        const publicListings = ids.some(id => !authoredIds.has(id)) ? await fetchPublicMarketplaceListings({ surface: "saved", projection: "card" }) : [];
        if (canceled) return;
        const next = collectRelationships({ authored, owned: filterAosOwnedMachines(authored), publicListings, ids });
        setRelated(next);
        setRelatedStatus({ loading: false, error: inventoryResult.status === "rejected" || stateResult.status === "rejected" ? "Some relationship machines couldn’t load. Try again." : "" });
      } catch { if (!canceled) setRelatedStatus({ loading: false, error: "Relationship machines couldn’t refresh. Try again." }); }
    })();
    return () => { canceled = true; };
  }, [userId, restored, revision, auth.user]);

  useEffect(() => {
    if (!userId) return;
    const refresh = () => { if (!dirtyRef.current.size) setRevision(value => value + 1); };
    const unsubscribe = subscribeInventoryChanges(refresh);
    window.addEventListener("focus", refresh);
    return () => { unsubscribe(); window.removeEventListener("focus", refresh); };
  }, [userId]);

  const allMachines = useMemo(() => uniqueMachines([...owned, ...related]), [owned, related]);
  const machineMap = useMemo(() => new Map(allMachines.map(item => [dashboardKey(item), item])), [allMachines]);
  const openMachines = useMemo(() => openKeys.map(key => machineMap.get(key)).filter(Boolean), [openKeys, machineMap]);
  const ownedKeys = useMemo(() => new Set(owned.map(dashboardKey)), [owned]);
  const currentOwned = useMemo(() => owned.filter(item => !item.inventorySessionOnly), [owned]);
  const visibleOwned = useMemo(() => currentOwned.filter(item => ownedFilter === "all" || (ownedFilter === "live" && liveMachine(item)) || (ownedFilter === "private" && isPrivateMachine(item)) || (ownedFilter === "auction" && getMachineChannel(item) === "auction")), [currentOwned, ownedFilter]);
  useEffect(() => {
    if (ownedStatus.loading || relatedStatus.loading || ownedStatus.error || relatedStatus.error) return;
    setOpenKeys(previous => {
      const next = reconcileOpenKeys(previous, allMachines);
      return next.join("|") === previous.join("|") ? previous : next;
    });
  }, [allMachines, ownedStatus, relatedStatus]);
  useEffect(() => {
    for (const item of openMachines) {
      const key = dashboardKey(item);
      if (mediaRequests.current.has(key)) continue;
      mediaRequests.current.add(key);
      hydrateIXIListingMedia(item, { dedupeRequests: true }).then(hydrated => {
        if (!mounted.current) return;
        const media = Object.fromEntries(["images", "imageObjects", "imageUrls", "imageUrl", "ixiMedia"].filter(field => hydrated?.[field] !== undefined).map(field => [field, hydrated[field]]));
        const merge = items => items.map(value => dashboardKey(value) === key ? { ...value, ...media } : value);
        setOwned(merge); setRelated(merge);
      }).catch(() => { mediaRequests.current.delete(key); });
    }
  }, [openMachines]);

  storageRef.current = { version: 1, open: openKeys, states: Object.fromEntries(Object.entries(states).map(([id, value]) => [id, viewPatch(value)])), size, ownedFilter, leftQuery, rightQuery, scroll: scrollPosition.current };
  const persistView = useCallback(() => {
    if (!storageKey || !restored) return;
    try { localStorage.setItem(storageKey, JSON.stringify(storageRef.current)); } catch { setNotice("This browser couldn’t save your board layout."); }
  }, [storageKey, restored]);
  useEffect(() => { const timer = setTimeout(persistView, 180); return () => clearTimeout(timer); }, [persistView, openKeys, states, size, ownedFilter, leftQuery, rightQuery, scroll]);
  useEffect(() => {
    const beforeLeave = event => { persistView(); if (dirtyRef.current.size) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", beforeLeave); window.addEventListener("pagehide", persistView);
    return () => { window.removeEventListener("beforeunload", beforeLeave); window.removeEventListener("pagehide", persistView); };
  }, [persistView]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 6500); return () => clearTimeout(timer); }, [notice]);

  const showActionNotice = useCallback((id, message) => setNotice(typeof message === "string" ? message : message?.text || message?.message || "Machine updated."), []);
  const { getSellerListingCardProps } = useIXISellerMachineOps({ setSellerListings: setOwned, showActionNotice });
  const markDirty = key => setDirtyKeys(previous => previous.has(key) ? previous : new Set([...previous, key]));
  const clearDirty = key => setDirtyKeys(previous => { const next = new Set(previous); next.delete(key); return next; });
  const updateState = (id, patch) => {
    const presentation = viewPatch(patch), relationship = relationshipPatch(patch);
    if (Object.keys(presentation).length) setStates(previous => ({ ...previous, [id]: { ...previous[id], ...presentation } }));
    if (presentation.transactOpen === false) setOwned(previous => releaseClosedInventoryTransactions(previous, { ...stateRef.current, [id]: { ...stateRef.current[id], ...presentation } }));
    if (!Object.keys(relationship).length) return;
    const previous = writeQueues.current.get(id) || Promise.resolve();
    const next = previous.catch(() => {}).then(async () => {
      const saved = await saveIxiMachinePatch({ userId, listingId: id, patch: relationship });
      if (!saved) throw new Error("Relationship not saved");
      if (mounted.current) setStates(current => ({ ...current, [id]: { ...current[id], ...relationship } }));
    }).catch(() => setNotice("Relationship change wasn’t saved. Please try again."));
    writeQueues.current.set(id, next);
  };
  const returnToRail = key => {
    if (dirtyRef.current.has(key) && !window.confirm("This machine has unsaved changes. Discard them and return it to the rail?")) return;
    clearDirty(key); setOpenKeys(previous => previous.filter(value => value !== key));
    setOwned(previous => previous.filter(item => dashboardKey(item) !== key || !item.inventorySessionOnly));
  };
  const openMachine = item => {
    const key = dashboardKey(item); setOpenKeys(previous => previous.includes(key) ? previous : [...previous, key]); setSelectedKey(key); setMobileRail("");
    requestAnimationFrame(() => document.querySelector(`[data-dashboard-machine="${CSS.escape(key)}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" }));
  };
  const toggleSave = async item => {
    try { const result = await toggleSavedListing({ sdk: auth.sdk, listing: item }); setSavedIds(result.savedIds); setAuth(previous => ({ ...previous, user: { ...result.currentUser, included: previous.user.included } })); }
    catch { setNotice("Saved machines couldn’t update. Please try again."); }
  };
  const toggleRail = side => {
    if (window.matchMedia("(max-width: 760px)").matches) { setHidden(previous => ({ ...previous, [side]: false })); setMobileRail(previous => previous === side ? "" : side); }
    else setHidden(previous => ({ ...previous, [side]: !previous[side] }));
  };
  const hideRail = side => { setHidden(previous => ({ ...previous, [side]: true })); setMobileRail(""); };
  const profile = auth.user?.attributes?.profile || {}, company = profile.publicData?.companyName || profile.displayName || "Your IXI";
  const readyOwned = !ownedStatus.loading && !ownedStatus.error, readyRelated = !relatedStatus.loading && !relatedStatus.error;
  const stats = [
    { label: "ACTIVE LISTINGS", value: readyOwned ? currentOwned.filter(liveMachine).length : "—", href: "/account/my-listings-v2", detail: "Live marketplace listings" },
    { label: "OWNED MACHINES", value: readyOwned ? currentOwned.length : "—", action: () => { setOwnedFilter("all"); setHidden(value => ({ ...value, left: false })); setMobileRail("left"); }, detail: "Current owned inventory" },
    { label: "RELATIONSHIPS", value: readyRelated ? related.length : "—", action: () => { setHidden(value => ({ ...value, right: false })); setMobileRail("right"); }, detail: "Saved & connected machines" },
    { label: "VIEWS", value: "—", detail: "Not yet measured here" },
    { label: "INQUIRIES", value: inquiries ?? "—", href: "/account/messages", detail: "All buyer conversations" }
  ];
  return <div className={styles.dashboard} data-ixi-dashboard="v12">
    <Head><title>Dashboard | IXI</title><meta name="robots" content="noindex,nofollow" /></Head>
    <style jsx global>{`body { margin: 0; background: #090c0a; }`}</style>
    <Navbar />
    <header className="dash-identity"><div className="dash-identity-title"><span className="dash-home-mark">IXI</span><div><span className="dash-eyebrow">{company}</span><h1>DASHBOARD</h1></div><span className="dash-version">V12</span></div><nav aria-label="Your account"><a href="/account/profile">PROFILE</a><a href="/account/messages">MESSAGES</a><details className="dash-account-menu"><summary>ACCOUNT <span>⌄</span></summary><div><a href="/account/profile">Profile & company settings</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><button onClick={async () => { if (dirtyRef.current.size && !window.confirm("Leave with unsaved changes?")) return; persistView(); await auth.sdk?.logout(); dirtyRef.current = new Set(); window.location.href = "/login"; }}>Sign out</button></div></details></nav></header>
    <nav className="dash-apps" aria-label="IXI applications">{APPS.map(([label, href, detail, icon]) => <a href={href} key={href}><span className="dash-app-icon" aria-hidden="true">{icon}</span><span><strong>{label}</strong><small>{detail}</small></span><span className="dash-app-arrow" aria-hidden="true">↗</span></a>)}</nav>
    <div className="dash-stats" aria-label="Account overview">{stats.map(stat => { const Tag = stat.href ? "a" : stat.action ? "button" : "div"; return <Tag key={stat.label} href={stat.href} onClick={stat.action} className="dash-stat" title={stat.detail}><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.detail}</small></Tag>; })}</div>
    {auth.loading ? <div className="dash-page-message" role="status">Opening your dashboard…</div> : auth.error ? <div className="dash-page-message" role="alert"><h2>{auth.error}</h2><a href="/login?next=%2Faccount">SIGN IN</a><button onClick={() => setAuthRevision(value => value + 1)}>TRY AGAIN</button></div> : <main className={`dash-workspace ${hidden.left ? "dash-hide-left" : ""} ${hidden.right ? "dash-hide-right" : ""} ${mobileRail ? `dash-mobile-${mobileRail}` : ""}`}>
      <DashboardMachineRail title="OWNED" side="left" items={visibleOwned} loading={ownedStatus.loading} error={ownedStatus.error} query={leftQuery} onQuery={setLeftQuery} filter={ownedFilter} onFilter={setOwnedFilter} openKeys={openKeys} selectedKey={selectedKey} onSelect={setSelectedKey} onOpen={openMachine} onRetry={() => setRevision(value => value + 1)} onHide={() => hideRail("left")} />
      <section className="dash-board" aria-label="Working board"><div className="dash-board-toolbar"><button className={`dash-rail-toggle ${!hidden.left ? "active" : ""}`} onClick={() => toggleRail("left")}>‹ OWNED</button><div className="dash-board-title"><strong>WORKING BOARD</strong><span>{openMachines.length} OPEN</span></div><div className="dash-board-options"><label>SIZE <select aria-label="Card size" value={size} onChange={event => setSize(event.target.value)}><option value="fit">FIT</option><option value="natural">100%</option><option value="work">120%</option><option value="focus">140%</option></select></label><button className="dash-icon-button" aria-label="Refresh machines" title={dirtyKeys.size ? "Save changes before refreshing" : "Refresh machines"} disabled={Boolean(dirtyKeys.size)} onClick={() => setRevision(value => value + 1)}>↻</button></div><button className={`dash-rail-toggle ${!hidden.right ? "active" : ""}`} onClick={() => toggleRail("right")}>RELATIONSHIPS ›</button></div>
      <Board machines={openMachines} ownedKeys={ownedKeys} states={states} onPatch={updateState} size={size} onReorder={setOpenKeys} onReturn={returnToRail} selectedKey={selectedKey} onSelect={setSelectedKey} getSellerProps={getSellerListingCardProps} onDirty={markDirty} dirtyKeys={dirtyKeys} onSaved={clearDirty} toggleSave={toggleSave} savedIds={savedIds} scrollTop={scroll} onScroll={value => { scrollPosition.current = value; storageRef.current.scroll = value; }} />
      <footer className="dash-board-footer"><span><i /> {dirtyKeys.size ? `${dirtyKeys.size} MACHINE${dirtyKeys.size > 1 ? "S" : ""} WITH UNSAVED CHANGES` : "YOUR IXI WORKING SPACE"}</span><span>OPEN · WORK · RETURN</span></footer></section>
      <DashboardMachineRail title="RELATIONSHIPS" side="right" items={related} loading={relatedStatus.loading} error={relatedStatus.error} query={rightQuery} onQuery={setRightQuery} openKeys={openKeys} selectedKey={selectedKey} onSelect={setSelectedKey} onOpen={openMachine} onRetry={() => setRevision(value => value + 1)} onHide={() => hideRail("right")} />
    </main>}
    {notice && <div className="dash-notice" role="status">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}>×</button></div>}
  </div>;
}
