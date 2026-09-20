import { sidebarObjectTitle, transactionDisplayTitle } from "./IXITransactDisplay.mjs";
import { searchIXITransact } from "./IXITransactSearch.mjs";
import IXITransactAccountingReports from "../ixi-transact-dashboard/IXITransactAccountingReports";
import { paymentHistorySummary } from "../ixi-aos/transact/payments/IXIPaymentHistory";
import IXIPaymentStatusBadge from "../ixi-aos/transact/payments/IXIPaymentStatusBadge";
import paymentStyles from "../ixi-aos/transact/payments/IXIPaymentStatusBadge.module.css";
import IXIPaymentsPanel from "../ixi-aos/transact/payments/IXIPaymentsPanel";
import { paymentDocument, paymentScopeObject } from "../ixi-aos/transact/payments/IXIPaymentModel";
import { createIXITransactContext } from "../ixi-aos/transact/IXITransactContext";
import { formatIXIAccountingMoney as formatIXIMoney } from "../ixi-aos/transact/IXIMoney";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/router";

import { loadIXICanonicalMosEnvironment } from "../../lib/mos/IXIMosEnvironmentProjection";
import { hydrateIXIListingMedia } from "../../lib/listings/hydrateIXIListingMedia";
import {
  loadIXIFinancialAccessContext,
  loadIXITransactDashboard
} from "../ixi-transact-dashboard/data/IXITransactDashboardClient";
import {
  buildIXITransactDashboardQuery,
  getDefaultIXITransactAccountingPeriod
} from "../ixi-transact-dashboard/data/IXITransactDashboardQueryContract";
import { normalizeIXITransactDashboardProjection } from "../ixi-transact-dashboard/data/IXITransactDashboardProjectionAdapter";
import { buildIXITransactFastEnvironment } from "../ixi-transact-dashboard/data/IXITransactFastBootstrap.mjs";
import {
  getIXITransactActionableRecords,
  getIXITransactWorkspaceRecords,
  normalizeIXITransactPassportRecords
} from "../ixi-transact-dashboard/data/IXITransactPassportRecordProjection.mjs";
import { loadIXIAosPassportFinancialDocuments } from "../ixi-aos/financial-runtime/IXIAosFinancialReadClient";
import { getIXITransactModules } from "../ixi-aos/transact/IXITransactModuleRegistry";
import {
  buildIXIAosCommandContexts,
  buildIXIAosRecentStory,
  getIXIAosContextGroups,
  getIXIAosRelationshipEvidence,
  getIXIAosRelatedContexts,
  getIXIFinancialQueryScope,
  getIXITransactAttentionBand,
  getIXITransactControlCounts,
  getIXITransactObjectDirectories
} from "./IXIAosCommandCenterModel";

import IXITransactRecordWorkspace from "./IXITransactRecordWorkspace";
import IXITransactWorkingTabs, { UnfinishedWorksheetDialog, WorksheetPanel } from "./IXITransactWorkingTabs";
import IXITransactMachineHistory from "./IXITransactMachineHistory";
import styles from "./IXIAosCommandCenter.module.css";
import IXITransactSidePanel from "./IXITransactSidePanel";
import IXITransactObjectPicker from "./IXITransactObjectPicker";
import { createIXITransactHistoryCache } from "./IXITransactHistoryCache.mjs";
import useIXITransactHistory from "./useIXITransactHistory";
import { createIXITransactRecordCache } from "./IXITransactRecordCache.mjs";
import { loadIXIAosFinancialDocument } from "../ixi-aos/financial-runtime/IXIAosFinancialReadClient";

const IXITransactApp = dynamic(
  () => import("../ixi-aos/transact/IXITransactApp"),
  {
    ssr: false,
    loading: () => <div className={styles.loadingState}><strong>OPENING TRAN$ACT APP</strong><span>Loading the selected governed worksheet…</span></div>
  }
);

const IXITransactAppDirectory = dynamic(() => import("./IXITransactAppDirectory"), {
  ssr: false,
  loading: () => <p role="status">Loading apps…</p>,
});

const SCOPE_OPTIONS = [
  ["company", "CO", "Company"],
  ["location", "LO", "Locations"],
  ["machine", "MC", "Machines"],
  ["person", "PE", "People"],
  ["work", "WO", "Work Orders"],
  ["object", "AO", "Other"]
];

const WORKSPACES = [
  ["today", "TODAY", "01"],
  ["work", "WORK & ASSETS", "02"],
  ["purchasing", "PURCHASING", "03"],
  ["sales", "SALES", "04"],
  ["ar", "A/R", "05"],
  ["ap", "A/P", "06"],
  ["treasury", "TREASURY", "07"],
  ["gl", "GL / CLOSE", "08"],
  ["records", "RECORDS", "09"],
  ["reporting", "REPORTING", "10"]
];

const TRANSACT_LOGIN_HREF = `/login?returnTo=${encodeURIComponent("/transact")}`;

const clean = value => String(value ?? "").trim();
const safeArray = value => Array.isArray(value) ? value : [];

function contextLabel(kind = "object") {
  return {
    company: "COMPANY",
    location: "LOCATION",
    machine: "MACHINE",
    person: "PERSON",
    work: "WORK ORDER",
    object: "AOS OBJECT"
  }[kind] || "AOS OBJECT";
}

function relativeTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 1440)}d`;
}

function displayTimestamp(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "NOT RETURNED";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).toUpperCase();
}

function recordAmount(record = {}) {
  const value = record.openBalance ?? record.amount ?? record.total ?? record.balance;
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function mapFinancialRecords(records = [], family = "FINANCIAL") {
  return safeArray(records).map((item, index) => ({
    id: clean(item.recordId || item.financialDocumentId || item.accountId || item.id || `${family}-${index}`),
    title: clean(item.documentNumber || item.recordId || item.financialDocumentId || item.accountName || item.name || item.id || family),
    party: clean(item.customerName || item.vendorName || item.partyName || item.label || item.source || family),
    date: clean(item.dueDate || item.dueAt || item.date || item.postedAt || "—"),
    status: clean(item.status || item.paymentStatus || item.state || item.accountType || "ACTIVE").toUpperCase(),
    amount: recordAmount(item),
    raw: item,
    document: item.financialDocument || item
  }));
}

function buildQueue({ projection, context, related, currency, passportRecords = [] }) {
  const financial = safeArray(projection?.attention).map((item, index) => ({
    id: clean(item.alertId || item.id || `financial-${index}`),
    band: getIXITransactAttentionBand(item),
    title: clean(item.title || item.label || item.documentNumber || item.code || item.type || "Financial attention"),
    detail: clean(item.detail || item.description || item.message || "Review the authoritative TRAN$ACT record."),
    value: Number.isFinite(Number(item.amount)) ? formatIXIMoney(Number(item.amount), currency) : clean(item.value || ""),
    source: "IXI FINANCIAL",
    href: "/transact/ledger?workspace=gl",
    raw: item.financialDocumentId ? { title: item.documentNumber || item.label, document: { financialDocumentId: item.financialDocumentId } } : null
  }));

  const operational = [context, ...safeArray(related)]
    .filter(Boolean)
    .filter(item => /(BLOCK|OVERDUE|PENDING|HOLD|REVIEW|DUE)/.test(item.status))
    .map(item => {
      const attention = { status: item.status, title: item.title };
      return {
        id: `aos-${item.id}`,
        band: getIXITransactAttentionBand(attention),
        title: `${contextLabel(item.kind)} · ${item.status}`,
        detail: item.title,
        value: "",
        source: "AOS WORK",
        href: "/aos/work"
      };
    });

  const passportWork = getIXITransactActionableRecords(passportRecords).map(record => ({
    id: `passport-${record.id}`,
    band: getIXITransactAttentionBand(record),
    title: `${record.type.replace(/-/g, " ").toUpperCase()} · ${record.title}`,
    detail: `${record.party || "CANONICAL PASSPORT RECORD"} · ${record.status}`,
    value: record.amount === null ? "" : formatIXIMoney(record.amount, currency),
    source: "IXI FINANCIAL",
    href: "/transact/ledger",
    raw: record
  }));

  const unique = new Map();
  [...financial, ...passportWork, ...operational].forEach(item => {
    if (!unique.has(item.id)) unique.set(item.id, item);
  });
  return [...unique.values()];
}

function connectionSummary(related = []) {
  const groups = safeArray(related).reduce((summary, item) => {
    const key = item.kind || "object";
    summary[key] = (summary[key] || 0) + 1;
    return summary;
  }, {});
  return Object.entries(groups)
    .sort((a, b) => b[1] - a[1])
    .map(([kind, count]) => ({ kind, count, label: `${contextLabel(kind)}${count === 1 ? "" : "S"}` }));
}

function operatorLabel(accessData = {}) {
  const actor = accessData.actor || {};
  return clean(actor.displayName || actor.name || actor.role || safeArray(actor.roles)[0] || "AUTHORIZED OPERATOR").toUpperCase();
}

function buildTransactObject(context = {}, financialRecords = []) {
  const canonical = context?.source?.canonical || context?.source || {};
  const presentation = context?.source?.presentation || {};

  return {
    ...canonical,
    ...presentation,
    id: context.sourceId,
    objectId: context.sourceId,
    canonicalObjectId: context.sourceId,
    objectType: context.kind,
    displayName: context.title,
    title: context.title,
    passportId: context.passportId,
    imageUrl: context.imageUrl,
    serialNumber: context.serialNumber,
    stockNumber: context.stockNumber,
    customerAssetId: context.assetId,
    assetId: context.assetId,
    financialRecords,
    relatedFinancialRecords: financialRecords,
    assetFinancialTransactions: financialRecords
  };
}

function StatusBadge({ value }) {
  const normalized = clean(value || "ACTIVE").toUpperCase();
  if (["PAID", "UNPAID", "PART PAID", "PARTIALLY PAID", "PARTIAL"].includes(normalized)) return <IXIPaymentStatusBadge status={normalized} />;
  const tone = /FAIL|BLOCK|DENY|OVERDUE|CONFLICT/.test(normalized)
    ? "danger"
    : /PAID|POSTED|CLOSED|VERIFIED|COMPLETE|CURRENT/.test(normalized)
      ? "verified"
      : "neutral";
  return <span className={styles.badge} data-tone={tone}>{normalized}</span>;
}

function IXIContextImage({
  context,
  mediaClassName,
  fallbackClassName,
  fallback = "IXI",
  label = "",
  eager = false,
  as = "div"
}) {
  const Element = as;
  const elementRef = useRef(null);
  const [hydratedImage, setHydratedImage] = useState(null);
  const imageUrl = context?.kind === "machine" &&
    hydratedImage?.id === context?.id && hydratedImage?.source === context?.source
    ? hydratedImage.imageUrl
    : context?.imageUrl || "";

  useEffect(() => {
    if (context?.kind !== "machine") return undefined;
    const listing = context?.source?.presentation || context?.source?.presentationSource || context?.source;
    let active = true;
    let observer = null;

    const loadImage = async () => {
      const hydrated = await hydrateIXIListingMedia(listing, { dedupeRequests: true });
      if (active && hydrated?.imageUrl) setHydratedImage({ id: context.id, source: context.source, imageUrl: hydrated.imageUrl });
    };

    if (eager || typeof IntersectionObserver === "undefined") {
      loadImage();
    } else if (elementRef.current) {
      observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        observer?.disconnect();
        loadImage();
      }, { rootMargin: "160px 0px" });
      observer.observe(elementRef.current);
    }

    return () => {
      active = false;
      observer?.disconnect();
    };
  }, [context?.id, context?.kind, context?.source, eager]);

  return imageUrl
    ? <Element ref={elementRef} className={mediaClassName} data-context-kind={context?.kind} role="img" aria-label={label} style={{ backgroundImage: `url(${imageUrl})` }} />
    : <Element ref={elementRef} className={fallbackClassName} aria-hidden="true">{fallback}</Element>;
}

function ContextIdentityCard({ context, interactive = false, onActivate }) {
  return <section className={styles.identityCard} aria-label="Selected object">
    <IXIContextImage key={context.id} context={context} mediaClassName={styles.identityMedia} fallbackClassName={styles.identityMark} label={`${context.title} identity image`} eager />
    <div><span>{contextLabel(context.kind)}</span><h2>{interactive ? <button type="button" onClick={onActivate} title="Open transaction history">{context.title}</button> : context.title}</h2>
      {context.location ? <p>{context.location}</p> : null}
      <dl>{context.serialNumber ? <div><dt>SN</dt><dd>{context.serialNumber}</dd></div> : null}{context.stockNumber ? <div><dt title="STOCK NUMBER">ID</dt><dd>{context.stockNumber}</dd></div> : null}<div><dt>PASSPORT</dt><dd>{context.passportId || "Not recorded"}</dd></div></dl>
      <details className={styles.identityDetails}><summary>Details</summary><dl><div><dt>OBJECT ID</dt><dd>{context.sourceId}</dd></div>{context.subtitle && context.subtitle !== context.location ? <div><dt>DESCRIPTION</dt><dd>{context.subtitle}</dd></div> : null}</dl></details>
    </div>
  </section>;
}

function RecordTable({ records, currency, emptyMessage, onSelect, paymentRecords = [], onMarkPaid }) {
  if (!records.length) {
    return <div className={styles.emptyState}><strong>NO RECORDS RETURNED</strong><span>{emptyMessage}</span></div>;
  }
  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead><tr><th>RECORD</th><th>PARTY / SOURCE</th><th>STATUS</th><th>DUE / DATE</th><th>AMOUNT</th><th>PAYMENT</th><th aria-label="Open record" /></tr></thead>
        <tbody>
          {records.map(record => { const paid = paymentHistorySummary(paymentRecords.find(item => paymentDocument(item).financialDocumentId === record.id) || record.raw || record.document, paymentRecords); return (
            <tr key={record.id}>
              <td><strong>{record.title}</strong></td>
              <td>{record.party}</td>
              <td><StatusBadge value={paid?.status || record.status} /></td>
              <td>{record.date}</td>
              <td className={styles.money}>{record.amount === null ? "—" : formatIXIMoney(record.amount, currency)}</td>
              <td>{paid?.currency ? <small>{formatIXIMoney(paid.paid, paid.currency)} PAID · {formatIXIMoney(paid.balance, paid.currency)} DUE</small> : "—"}</td>
              <td>{paid && !paid.aggregate && paid.active && paid.balance > 0 && onMarkPaid ? <button type="button" className={styles.rowAction} onClick={() => onMarkPaid(paid.id)}>MARK PAID</button> : null}<button type="button" className={paymentStyles.badge} data-tone="action" onClick={() => onSelect?.(record)}>VIEW</button></td>
            </tr>
          ); })}
        </tbody>
      </table>
    </div>
  );
}

function WorkspaceHeader({ eyebrow, title, detail, count, actionLabel = "OPEN LEDGER", href = "/transact/ledger" }) {
  return (
    <div className={styles.workspaceHeader}>
      <div><span>{eyebrow}</span><h2>{title}</h2><p>{detail}</p></div>
      <div className={styles.workspaceHeaderActions}>
        {count !== undefined ? <b>{count} RETURNED</b> : null}
        <Link href={href}>{actionLabel}</Link>
      </div>
    </div>
  );
}

const EMPTY_RECORDS = Object.freeze([]);
function refreshWorksheetRecords(tabs, passportId, records) {
  return tabs.map(tab => {
    if (tab.dirty || tab.context.passportId !== passportId || tab.financialRecords === records) return tab;
    const previous = new Map(tab.financialRecords.map(record => [paymentDocument(record).financialDocumentId, (record.record || record).server?.revision]));
    if (previous.size === records.length && records.every(record => {
      const id = paymentDocument(record).financialDocumentId;
      const revision = (record.record || record).server?.revision;
      return Number.isInteger(revision) && previous.get(id) === revision;
    })) return tab;
    return { ...tab, object: buildTransactObject(tab.context, records), financialRecords: records };
  });
}

export default function IXITransactCommandCenter({ runtime, active = true }) {
  const router = useRouter();
  const readAccess = runtime?.loadAccess || loadIXIFinancialAccessContext;
  const readDashboard = runtime?.loadDashboard || loadIXITransactDashboard;
  const readOperatingEnvironment = runtime?.loadOperatingEnvironment || loadIXICanonicalMosEnvironment;
  const [environment, setEnvironment] = useState(null);
  const [access, setAccess] = useState(null);
  const [projectionPayload, setProjectionPayload] = useState(null);
  const [selectedKind, setSelectedKind] = useState("company");
  const [selectedId, setSelectedId] = useState("");
  const [activeWorkspace, setActiveWorkspace] = useState("today");
  const [period, setPeriod] = useState(getDefaultIXITransactAccountingPeriod());
  const [query, setQuery] = useState("");
  const [companyRecords, setCompanyRecords] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [openPanel, setOpenPanel] = useState("");
  const [searchIndex, setSearchIndex] = useState(-1);
  const workspaceMenu = useRef(null);
  const historyStates = useRef(new Map());
  useEffect(() => { if (!active) { setOpenPanel(""); setNewMenuOpen(false); } }, [active]);
  const [queuePage, setQueuePage] = useState(0);
  const [selectedQueueId, setSelectedQueueId] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [workingTabs, setWorkingTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState("");
  const [closingTab, setClosingTab] = useState(null);
  const deepLinkOpened = useRef(null);
  const financialQueryKey = useRef("");
  const [activeModuleId, setActiveModuleId] = useState("");
  const [selectedDirectoryId, setSelectedDirectoryId] = useState("");
  const [passportRefreshKey, setPassportRefreshKey] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [contextRefreshKey, setContextRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState("");
  const [financialLoading, setFinancialLoading] = useState(false);
  const [error, setError] = useState("");
  const [financialError, setFinancialError] = useState("");
  const contextHydrationStarted = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      setFinancialError("");
      try {
        let accessPayload;
        try {
          accessPayload = await readAccess({ signal: controller.signal });
        } catch (accessError) {
          if (runtime || accessError?.status !== 401 || controller.signal.aborted) throw accessError;
          accessPayload = await readAccess({ signal: controller.signal });
        }
        if (controller.signal.aborted) return;

        const fastEnvironment = buildIXITransactFastEnvironment(accessPayload);
        if (!fastEnvironment) {
          const bootstrapError = new Error("IXI Financial did not return a canonical Entity and permanent Passport.");
          bootstrapError.code = "IXI_TRANSACT_FAST_CONTEXT_INCOMPLETE";
          throw bootstrapError;
        }

        setAccess(accessPayload);
        setEnvironment(fastEnvironment);
      } catch (loadError) {
        if (loadError?.name !== "AbortError") {
          if (loadError?.status === 401) {
            window.location.assign(TRANSACT_LOGIN_HREF);
            return;
          }
          setError(loadError?.message || "IXI TRAN$ACT could not be loaded.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [readAccess, runtime]);

  useEffect(() => {
    if (!access || contextHydrationStarted.current) return undefined;

    const controller = new AbortController();
    contextHydrationStarted.current = true;
    async function loadOperatingContext() {
      setContextLoading(true);
      setContextError("");
      try {
        const aosResult = await readOperatingEnvironment({ signal: controller.signal, force: contextRefreshKey > 0 });
        if (controller.signal.aborted) return;
        if (!aosResult?.isAuthenticated) {
          window.location.assign(TRANSACT_LOGIN_HREF);
          return;
        }
        setEnvironment(aosResult);
      } catch (loadError) {
        if (loadError?.name !== "AbortError") {
          setContextError(loadError?.message || "Canonical operating context could not be loaded.");
        }
      } finally {
        if (!controller.signal.aborted) setContextLoading(false);
      }
    }
    loadOperatingContext();
    return () => { controller.abort(); contextHydrationStarted.current = false; };
  }, [access, contextRefreshKey, readOperatingEnvironment]);

  // Canonical cards are usable first. Listing details/media enrich those same
  // identities in the background; they cannot admit or create another machine.
  useEffect(() => {
    if (!active || !environment?.userId || !runtime?.loadOperatingPresentations) return undefined;
    const controller = new AbortController();
    runtime.loadOperatingPresentations({ signal: controller.signal }).then(ownedListings => {
      if (!controller.signal.aborted) setEnvironment(current => ({ ...current, ownedListings }));
    }).catch(loadError => {
      if (!controller.signal.aborted && loadError?.name !== "AbortError") {
        setContextError("Some machine photos and listing details could not load. Refresh to retry.");
      }
    });
    return () => controller.abort();
  }, [active, environment?.userId, contextRefreshKey, runtime]);

  const accessData = access?.data || {};
  const entityPassportId = clean(accessData.defaults?.entityPassportId || accessData.entities?.[0]?.passportId || environment?.entity?.passportId);
  useEffect(() => { setCompanyRecords([]); setSearchError(""); }, [entityPassportId, accessData.actor?.passportId]);
  const recordScope = JSON.stringify([entityPassportId, accessData.actor?.passportId, accessData.permissions, accessData.deniedPermissions]);
  const recordCache = useMemo(() => createIXITransactRecordCache({ read: loadIXIAosFinancialDocument }), [recordScope]);
  useEffect(() => () => recordCache.invalidate(), [recordCache]);
  const historyCache = useMemo(() => createIXITransactHistoryCache({ read: loadIXIAosPassportFinancialDocuments }), [recordScope]);
  useEffect(() => () => historyCache.clear(), [historyCache]);
  useEffect(() => { historyStates.current.clear(); }, [recordScope]);
  const contexts = useMemo(() => buildIXIAosCommandContexts({
    entity: environment?.entity || {},
    entityPassportId,
    aosObjects: environment?.objects || [],
    ownedListings: environment?.ownedListings || [],
    systemIndexes: environment?.systemIndexes || []
  }), [entityPassportId, environment]);
  const groups = useMemo(() => getIXIAosContextGroups(contexts), [contexts]);

  useEffect(() => {
    const candidates = groups[selectedKind] || [];
    if (candidates.length && !candidates.some(item => item.id === selectedId)) setSelectedId(candidates[0].id);
  }, [groups, selectedId, selectedKind]);

  const selectedContext = useMemo(() => (
    contexts.find(item => item.id === selectedId) || groups.company[0] || contexts[0] || null
  ), [contexts, groups.company, selectedId]);
  const relationships = environment?.relationships || [];
  const relationshipEvidence = useMemo(() => getIXIAosRelationshipEvidence(
    selectedContext,
    contexts,
    relationships
  ), [contexts, relationships, selectedContext]);
  const related = useMemo(() => getIXIAosRelatedContexts(
    selectedContext,
    contexts,
    relationships
  ), [contexts, relationships, selectedContext]);
  const passportHistory = useIXITransactHistory({ cache: historyCache,
    passportId: clean(selectedContext?.passportId), active: active && Boolean(access), refreshKey: `${passportRefreshKey}:${activeTabId}:${activeWorkspace}` });
  const passportRecords = passportHistory.records || EMPTY_RECORDS;
  const passportRecordsReadyFor = passportHistory.records ? selectedContext?.passportId : "";
  const passportRecordsLoading = passportHistory.loading;
  const passportRecordsError = passportHistory.error;
  useEffect(() => {
    if (!passportHistory.records || passportHistory.stale) return;
    recordCache.reconcile(passportHistory.records);
    setWorkingTabs(tabs => refreshWorksheetRecords(tabs, selectedContext?.passportId, passportHistory.records));
  }, [passportHistory.records, passportHistory.stale, selectedContext?.passportId, recordCache]);

  useEffect(() => {
    if (!active || !selectedContext || !access) return undefined;
    const financialScope = getIXIFinancialQueryScope(selectedContext, entityPassportId);
    if (!financialScope) {
      setProjectionPayload(null);
      setFinancialError("");
      return undefined;
    }
    const dashboardQuery = buildIXITransactDashboardQuery({ ...financialScope, accountingPeriod: period });
    const queryKey = JSON.stringify(dashboardQuery);
    if (financialQueryKey.current !== queryKey) setProjectionPayload(null);
    financialQueryKey.current = queryKey;
    const controller = new AbortController();
    async function loadFinancial() {
      setFinancialLoading(true);
      setFinancialError("");
      try {
        const result = await readDashboard({
          query: dashboardQuery,
          signal: controller.signal
        });
        if (!controller.signal.aborted) setProjectionPayload(result);
      } catch (loadError) {
        if (loadError?.name !== "AbortError") {
          setProjectionPayload(null);
          setFinancialError(loadError?.message || "Financial projection unavailable.");
        }
      } finally {
        if (!controller.signal.aborted) setFinancialLoading(false);
      }
    }
    loadFinancial();
    return () => controller.abort();
  }, [access, active, entityPassportId, period, refreshKey, selectedContext, readDashboard]);

  const projection = useMemo(() => projectionPayload ? normalizeIXITransactDashboardProjection(projectionPayload) : null, [projectionPayload]);
  const currency = projection?.currency || "USD";
  const queue = useMemo(() => buildQueue({ projection, context: selectedContext, related, currency, passportRecords }), [currency, passportRecords, projection, related, selectedContext]);
  const controlCounts = useMemo(() => getIXITransactControlCounts(queue.map(item => ({ ...item, status: item.band }))), [queue]);
  const story = useMemo(() => buildIXIAosRecentStory(
    selectedContext,
    contexts,
    relationships,
    12
  ), [contexts, relationships, selectedContext]);
  const connections = useMemo(() => connectionSummary(related), [related]);
  const currentGroup = groups[selectedKind] || [];
  const directoryProjection = useMemo(() => {
    try {
      return { directories: getIXITransactObjectDirectories(contexts, environment?.systemIndexes || [], {
        aosObjects: environment?.objects || [], railProjections: environment?.railProjections || {}
      }), error: "" };
    } catch (error) {
      return { directories: [], error: error?.message || "AOS folder membership could not be verified." };
    }
  }, [contexts, environment?.systemIndexes, environment?.objects, environment?.railProjections]);
  const objectDirectories = directoryProjection.directories;
  useEffect(() => {
    if (!objectDirectories.length) {
      setSelectedDirectoryId("");
      return;
    }
    if (!objectDirectories.some(directory => directory.id === selectedDirectoryId)) {
      setSelectedDirectoryId(objectDirectories[0].id);
    }
  }, [objectDirectories, selectedDirectoryId]);
  const selectedDirectory = objectDirectories.find(directory => directory.id === selectedDirectoryId) || objectDirectories[0] || null;
  const objectDirectory = useMemo(
    () => [...safeArray(selectedDirectory?.items)].sort((left, right) => left.title.localeCompare(right.title)),
    [selectedDirectory]
  );
  const selectedQueueItem = queue.find(item => item.id === selectedQueueId) || queue[0] || null;
  useEffect(() => {
    if (query.trim().length < 2 || !entityPassportId || !access) { setSearchLoading(false); return undefined; }
    const controller = new AbortController();
    setSearchLoading(true); setSearchError("");
    const timer = setTimeout(() => {
      historyCache.load(entityPassportId)
        .then(records => { if (!controller.signal.aborted) setCompanyRecords(records); })
        .catch(error => { if (!controller.signal.aborted) setSearchError(error.message || "Transaction search unavailable. Retry."); })
        .finally(() => { if (!controller.signal.aborted) setSearchLoading(false); });
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, entityPassportId, access, passportRefreshKey, historyCache]);
  const searchResults = useMemo(() => searchIXITransact({ query, contexts,
    records: [...new Map([...companyRecords, ...passportRecords].map(record => [paymentDocument(record).financialDocumentId, record])).values()]
  }), [query, contexts, companyRecords, passportRecords]);
  useEffect(() => setQueuePage(0), [selectedContext?.id, queue.length]);

  function selectContext(context) {
    setOpenPanel(""); recordCache.cancelPrefetch();
    setSelectedKind(context.kind);
    setSelectedId(context.id);
    setQuery("");
    setSelectedRecord(null);
    setActiveModuleId("");
    setActiveTabId("");
    setActiveWorkspace(context.kind === "company" ? "today" : "object-history");
  }

  function selectWorkspace(id) {
    if (workspaceMenu.current) workspaceMenu.current.open = false;
    setOpenPanel("");
    setActiveWorkspace(id);
    setActiveTabId("");
    setActiveModuleId("");
    setSelectedRecord(null);
  }

  function refreshAuthoritativeContext() {
    recordCache.invalidate();
    historyCache.invalidate();
    setWorkingTabs(tabs => tabs.map(tab => tab.dirty ? tab : { ...tab, recordRefresh: (tab.recordRefresh || 0) + 1 }));
    runtime?.invalidateFinancial();
    contextHydrationStarted.current = false;
    setContextRefreshKey(value => value + 1);
    setRefreshKey(value => value + 1);
    setPassportRefreshKey(value => value + 1);
  }

  function activateTab(tab) {
    setOpenPanel(""); setSelectedRecord(null); recordCache.cancelPrefetch();
    setSelectedKind(tab.context.kind);
    setSelectedId(tab.context.id);
    setActiveTabId(tab.id);
    setActiveModuleId(tab.moduleId || "");
    setActiveWorkspace(tab.paymentTab ? "payments" : tab.financialDocumentId ? "record-view" : "object-app");
  }

  function openTransactionRecord(record) {
    if (record?.reportKey) {
      const id = `report-${selectedContext.id}-${record.reportKey}`;
      const existingReport = workingTabs.find(tab => tab.id === id);
      if (existingReport) { activateTab(existingReport); return; }
      const tab = { id, reportKey: record.reportKey, label: record.title, context: selectedContext,
        object: buildTransactObject(selectedContext, passportRecords), financialRecords: passportRecords, dirty: false };
      setWorkingTabs(tabs => [...tabs, tab]); activateTab(tab); return;
    }
    setQuery("");
    setSelectedRecord(record);
    const financialDocumentId = clean(record?.document?.financialDocumentId || paymentDocument(record?.raw)?.financialDocumentId || record?.id);
    if (!financialDocumentId || !selectedContext) return;
    const existing = workingTabs.find(tab => tab.financialDocumentId === financialDocumentId);
    if (existing) { activateTab(existing); return; }
    recordCache.load(financialDocumentId).catch(() => {});
    const references = record?.document?.references || [];
    const targetContext = contexts.find(context => references.some(ref => ["asset", "machine", "object"].includes(ref.role) && ref.passportId === context.passportId)) || selectedContext;
    const records = [...new Map([...companyRecords, ...passportRecords].map(item => [paymentDocument(item).financialDocumentId, item])).values()];
    const tab = { id: financialDocumentId, financialDocumentId, label: transactionDisplayTitle(record.document || paymentDocument(record.raw), record.title),
      context: targetContext, object: buildTransactObject(targetContext, records), financialRecords: records, dirty: false };
    setWorkingTabs(tabs => [...tabs, tab]);
    activateTab(tab);
  }

  function openTransactModule(moduleId) {
    if (!selectedContext) return;
    setNewMenuOpen(false);
    const id = `app-${selectedContext.id}-${moduleId}`;
    const existing = workingTabs.find(tab => tab.id === id);
    if (existing) { activateTab(existing); return; }
    const tab = { id, moduleId, label: selectedModules.find(item => item.id === moduleId)?.label || moduleId,
      context: selectedContext, object: buildTransactObject(selectedContext, passportRecords), financialRecords: passportRecords, dirty: false };
    setWorkingTabs(tabs => [...tabs, tab]);
    activateTab(tab);
  }

  function returnToObjectHistory() {
    setOpenPanel("");
    setActiveTabId("");
    setActiveModuleId("");
    setSelectedRecord(null);
    setActiveWorkspace("object-history");
  }

  function closeTab(tab, discard = false) {
    if (tab.dirty && !discard) { setClosingTab(tab); return; }
    setWorkingTabs(tabs => tabs.filter(item => item.id !== tab.id));
    setClosingTab(null);
    if (activeTabId === tab.id) returnToObjectHistory();
  }

  function markTabDirty(id) {
    setWorkingTabs(tabs => tabs.map(tab => tab.id === id && !tab.dirty ? { ...tab, dirty: true } : tab));
  }

  function worksheetSaved(id) {
    const savedTab = workingTabs.find(tab => tab.id === id);
    if (!savedTab) return;
    // A confirmed write may affect company, counterparty and machine histories.
    // Retain those rows but require a fresh read before using their balances.
    historyCache.invalidate();
    recordCache.invalidate([...new Set([savedTab.financialDocumentId,
      ...savedTab.financialRecords.map(record => paymentDocument(record).financialDocumentId)].filter(Boolean))]);
    runtime?.invalidateFinancial();
    setWorkingTabs(tabs => tabs.map(tab => tab.id === id
      ? { ...tab, dirty: false, recordRefresh: (tab.recordRefresh || 0) + 1 } : tab));
    setPassportRefreshKey(value => value + 1);
    setRefreshKey(value => value + 1);
    if (!savedTab.context.passportId) return;
    // The write has finished. One shared background read updates all clean tabs;
    // failure is a retryable read error, never a reason to submit the write again.
    historyCache.load(savedTab.context.passportId).then(records => {
      recordCache.reconcile(records);
      setWorkingTabs(tabs => refreshWorksheetRecords(tabs, savedTab.context.passportId, records));
    }).catch(() => {});
  }

  function retryHistory() {
    historyCache.invalidate([selectedContext?.passportId]);
    setPassportRefreshKey(value => value + 1);
  }

  useEffect(() => {
    if (!workingTabs.some(tab => tab.dirty)) return undefined;
    const protect = event => { event.preventDefault(); event.returnValue = ""; };
    const protectLink = event => {
      const link = event.target.closest?.("a[href]");
      if (!link || link.target === "_blank" || event.ctrlKey || event.metaKey || event.shiftKey || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (["/transact", "/transact/ledger"].includes(url.pathname) && url.origin === window.location.origin) return;
      if (!window.confirm("There are unfinished worksheet edits. Leave TRAN$ACT and discard those edits? Saved transactions will remain.")) { event.preventDefault(); event.stopPropagation(); }
    };
    router.beforePopState(({ as }) => {
      const path = as.split("?")[0].split("#")[0];
      const allowed = ["/transact", "/transact/ledger"].includes(path) || window.confirm("There are unfinished worksheet edits. Leave TRAN$ACT and discard those edits? Saved transactions will remain.");
      if (!allowed) router.replace(router.asPath, undefined, { scroll: false });
      return allowed;
    });
    window.addEventListener("beforeunload", protect);
    document.addEventListener("click", protectLink, true);
    return () => { router.beforePopState(() => true); window.removeEventListener("beforeunload", protect); document.removeEventListener("click", protectLink, true); };
  }, [workingTabs, router]);

  useEffect(() => {
    if (!active || !router.isReady || deepLinkOpened.current === router.asPath || !contexts.length || contextLoading) return;
    const params = new URLSearchParams(router.asPath.split("?")[1] || "");
    const passport = params.get("passport");
    if (!passport) { deepLinkOpened.current = router.asPath; return; }
    const context = contexts.find(item => item.passportId === passport);
    if (!context) return;
    if (selectedContext?.id !== context.id) { selectContext(context); return; }
    if (passportRecordsLoading) return;
    deepLinkOpened.current = router.asPath;
    const id = params.get("record");
    if (id) openTransactionRecord(normalizeIXITransactPassportRecords(passportRecords).find(item => item.id === id) || { title: "SHARED TRANSACTION", document: { financialDocumentId: id } });
  }, [active, router.isReady, router.asPath, contexts, contextLoading, selectedContext, passportRecordsLoading, passportRecords]);

  const normalizedPassportRecords = useMemo(
    () => normalizeIXITransactPassportRecords(passportRecords),
    [passportRecords]
  );
  const recordsByWorkspace = useMemo(() => ({
    purchasing: getIXITransactWorkspaceRecords(passportRecords, "purchasing"),
    sales: getIXITransactWorkspaceRecords(passportRecords, "sales"),
    ar: getIXITransactWorkspaceRecords(passportRecords, "ar"),
    ap: getIXITransactWorkspaceRecords(passportRecords, "ap"),
    treasury: getIXITransactWorkspaceRecords(passportRecords, "treasury"),
    gl: [
      ...getIXITransactWorkspaceRecords(passportRecords, "gl"),
      ...mapFinancialRecords(projection?.gl?.exceptions, "GL EXCEPTION"),
      ...mapFinancialRecords(projection?.gl?.journals, "JOURNAL")
    ]
  }), [passportRecords, projection]);

  function renderToday() {
    const proofLive = Boolean(projectionPayload && !financialError);
    return (
      <div className={styles.todayGrid}>
        <section className={styles.queuePanel}>
          <WorkspaceHeader eyebrow="EXCEPTION-FIRST WORK" title="WHAT NEEDS YOU" detail="Prioritized from server-returned financial and operating exceptions. Nothing is auto-posted here." count={queue.length} />
          <div className={styles.queueBands} aria-label="Today control totals">
            {["BLOCKED", "MONEY EXPOSED", "WAITING", "RECONCILE", "CLOSE", "REVIEW"].map(band => <div key={band} data-band={band}><span>{band}</span><strong>{controlCounts[band] || 0}</strong></div>)}
          </div>
          {queue.length ? (
            <div className={styles.queueList}>
              {queue.slice(queuePage * 20, (queuePage + 1) * 20).map(item => (
                <button type="button" className={styles.queueRow} data-active={selectedQueueItem?.id === item.id} data-band={item.band} key={item.id} onClick={() => setSelectedQueueId(item.id)}>
                  <span className={styles.queueSignal} />
                  <span className={styles.queueCopy}><b>{item.title}</b><small>{item.detail}</small></span>
                  <span className={styles.queueMeta}><b>{item.value || item.band}</b><small>{item.source}</small></span>
                  <span className={styles.chevron}>›</span>
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState} data-proof={proofLive}>
              <strong>{proofLive ? "NO EXCEPTIONS RETURNED" : "NOT YET EVALUATED"}</strong>
              <span>{proofLive ? "The current projection returned no attention items. This is not a close certification; review completeness evidence at right." : "TRAN$ACT will not claim a clean state until the authoritative projection is available."}</span>
            </div>
          )}
          {queue.length > 20 ? <div className={styles.workspaceHeaderActions}><button type="button" disabled={queuePage === 0} onClick={() => setQueuePage(page => page - 1)}>PREVIOUS</button><span>Page {queuePage + 1} of {Math.ceil(queue.length / 20)} · {queue.length} items</span><button type="button" disabled={(queuePage + 1) * 20 >= queue.length} onClick={() => setQueuePage(page => page + 1)}>NEXT</button></div> : null}
        </section>

        <aside className={styles.todaySide}>
          <section className={styles.focusCard}>
            <span className={styles.miniLabel}>CURRENT DECISION</span>
            {selectedQueueItem ? <><StatusBadge value={selectedQueueItem.band} /><h3>{selectedQueueItem.title}</h3><p>{selectedQueueItem.detail}</p><button type="button" className={styles.rowAction} onClick={() => selectedQueueItem.raw ? openTransactionRecord(selectedQueueItem.raw) : router.push(selectedQueueItem.href)}>OPEN SOURCE RECORD →</button></> : <><h3>No selected exception</h3><p>When work is returned, select it to see the controlling source and next authorized action.</p></>}
          </section>
          <section className={styles.closeCard}>
            <div><span className={styles.miniLabel}>PERIOD CONTROL</span><StatusBadge value={projection?.executive?.closeReadiness || "NOT CERTIFIED"} /></div>
            <h3>{period}</h3>
            <p>Queue completion never substitutes for source coverage, reconciliation evidence, approvals, and governed close.</p>
            <Link href="/transact/ledger?workspace=gl">OPEN CLOSE WORKSPACE <span>→</span></Link>
          </section>
        </aside>
      </div>
    );
  }

  function openPaymentRecord(sourceId = "") {
    if (!selectedContext) return;
    const id = `payments-${selectedContext.id}-${sourceId || "all"}`;
    const existing = workingTabs.find(tab => tab.id === id);
    if (existing) { activateTab(existing); return; }
    const sourceObject = paymentScopeObject(buildTransactObject(selectedContext, passportRecords), selectedContext.kind, entityPassportId);
    const source = normalizedPassportRecords.find(record => record.id === sourceId);
    const tab = { id, paymentTab: true, paymentSourceId: sourceId, label: source ? `PAYMENT · ${source.title}` : "PAYMENTS",
      context: selectedContext, object: sourceObject, financialRecords: passportRecords, dirty: false };
    setWorkingTabs(tabs => [...tabs, tab]);
    activateTab(tab);
  }

  function renderWorkspace() {
    if (["record-view", "object-app", "payments"].includes(activeWorkspace)) return null;
    if (activeWorkspace === "object-history") return null;

    if (activeWorkspace === "today") return renderToday();

    if (activeWorkspace === "work" || activeWorkspace === "records") {
      return (
        <section className={styles.workPanel}>
          <WorkspaceHeader eyebrow={activeWorkspace === "work" ? "OPERATING CONTEXT + FINANCIAL EVIDENCE" : "LIFETIME PASSPORT HISTORY"} title={activeWorkspace === "work" ? "WORK & ASSET STORY" : "RECORD CHRONOLOGY"} detail={activeWorkspace === "work" ? "The same canonical business object, connected to its work, people, locations and financial evidence." : "The complete authorized Passport record history remains visible independently of the selected accounting period."} count={normalizedPassportRecords.length + story.length} actionLabel={activeWorkspace === "work" ? "RETURN TO AOS" : "OPEN LEDGER"} href={activeWorkspace === "work" ? "/aos/work" : "/transact/ledger"} />
          {normalizedPassportRecords.length || passportRecordsLoading || passportRecordsError ? <RecordTable records={normalizedPassportRecords} currency={currency} emptyMessage={passportRecordsLoading ? "Loading lifetime Passport records…" : passportRecordsError || "No governed financial records were returned for this Passport."} onSelect={openTransactionRecord} paymentRecords={passportRecords} onMarkPaid={openPaymentRecord} /> : null}
          {activeWorkspace === "work" ? <div className={styles.storyList}>{story.length ? story.map(item => <div className={styles.storyRow} key={item.id}><span className={styles.storyGlyph}>{contextLabel(item.kind).slice(0, 2)}</span><div><strong>{item.title}</strong><span>{item.detail}</span></div><time>{relativeTime(item.updatedAt)}</time></div>) : <div className={styles.emptyState}><strong>NO OPERATING CHRONOLOGY RETURNED</strong><span>No related AOS events were returned for this canonical context.</span></div>}</div> : null}
        </section>
      );
    }

    if (activeWorkspace === "reporting") {
      const reports = projection?.reports && typeof projection.reports === "object"
        ? Object.entries(projection.reports).map(([key, value]) => ({ id: `report-${key}`, reportKey: key, title: clean(value?.title || value?.label || key.replace(/[-_]/g, " ")).toUpperCase(), party: clean(value?.description || "Authoritative financial projection"), date: displayTimestamp(value?.generatedAt || projection?.generatedAt), status: clean(value?.status || "AVAILABLE"), amount: null, raw: value }))
        : [];
      return <section className={styles.workPanel}><WorkspaceHeader eyebrow="READ-ONLY PROJECTIONS" title="REPORTING & AUDIT" detail="Every report remains a view of canonical accounting truth and must retain drill-down lineage." count={reports.length} /><RecordTable records={reports} currency={currency} emptyMessage="No server-returned reports are available for this scope." onSelect={openTransactionRecord} paymentRecords={passportRecords} onMarkPaid={openPaymentRecord} /></section>;
    }

    const labels = {
      purchasing: ["PURCHASE TO PAY", "PURCHASING", "Purchase orders, receiving evidence, bills, approvals and payment remain distinct accounting states."],
      sales: ["DEAL TO SETTLEMENT", "SALES", "Commercial activity remains connected to invoicing and collection without duplicating the deal or machine."],
      ar: ["CUSTOMER MONEY", "ACCOUNTS RECEIVABLE", "Invoices, collections, unapplied cash and overdue balances for the selected scope."],
      ap: ["VENDOR OBLIGATIONS", "ACCOUNTS PAYABLE", "Approved bills, credits, holds, due dates and payment readiness for the selected scope."],
      treasury: ["CASH CONTROL", "TREASURY", "Book cash, operating accounts, reconciliation status and governed cash movement."],
      gl: ["ACCOUNTING TRUTH", "GENERAL LEDGER / CLOSE", "Posting exceptions, journals, period controls and close evidence in the governed ledger workspace."]
    };
    const [eyebrow, title, detail] = labels[activeWorkspace] || labels.gl;
    const records = recordsByWorkspace[activeWorkspace] || [];
    return <section className={styles.workPanel}><WorkspaceHeader eyebrow={eyebrow} title={title} detail={`${detail} Passport history is not hidden by the reporting-period selector.`} count={records.length} /><RecordTable records={records} currency={currency} emptyMessage={passportRecordsLoading ? "Loading authoritative Passport records…" : passportRecordsError || "No server-returned records are available for this scope."} onSelect={openTransactionRecord} paymentRecords={passportRecords} onMarkPaid={openPaymentRecord} /></section>;
  }

  const selectedDetail = selectedRecord || selectedQueueItem;
  const permissions = safeArray(accessData.permissions);
  const denied = safeArray(accessData.deniedPermissions);
  const selectedModules = getIXITransactModules({
    objectType: selectedContext?.kind || "object",
    permissions
  });
  const objectContextActive = Boolean(selectedContext && selectedContext.kind !== "company");
  const activeModule = selectedModules.find(module => module.id === activeModuleId) || null;
  const financialScopeSupported = Boolean(getIXIFinancialQueryScope(selectedContext, entityPassportId));
  const connectionHealthy = Boolean(access && (projectionPayload || !financialScopeSupported));
  const connectionLabel = access && projectionPayload
    ? "IXI CORE + FINANCIAL CONNECTED"
    : connectionHealthy
      ? "IXI CORE CONNECTED · PASSPORT HISTORY"
      : "AUTHORITY / PROJECTION INCOMPLETE";
  const workspaceTitle = activeWorkspace === "record-view"
    ? "TRANSACTION RECORD"
    : activeWorkspace === "object-history"
    ? "TRANSACTION HISTORY"
    : activeWorkspace === "object-app"
      ? activeModule?.label || "TRAN$ACT APP"
      : WORKSPACES.find(([id]) => id === activeWorkspace)?.[1] || "TRAN$ACT";

  useEffect(() => setSearchIndex(-1), [query, searchResults]);
  function chooseSearchResult(result) { if (!result) return; if (result.resultType === "transaction") openTransactionRecord(result); else selectContext(result); }
  function searchKeyDown(event) {
    if (event.key === "Escape") { setQuery(""); return; }
    if (!searchResults.length) return;
    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault(); const next = Math.max(0, Math.min(searchResults.length - 1, searchIndex + (event.key === "ArrowDown" ? 1 : -1)));
      setSearchIndex(next); document.getElementById(`ixi-search-result-${next}`)?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter") { event.preventDefault(); chooseSearchResult(searchResults[Math.max(0, searchIndex)]); }
  }
  const historyStateKey = selectedContext?.passportId || "";
  if (!historyStates.current.has(historyStateKey)) historyStates.current.set(historyStateKey, {});
  useEffect(() => {
    if (!active || activeWorkspace !== "object-history" || passportRecordsLoading || !passportRecords.length) return undefined;
    const warm = () => { import("../ixi-aos/transact/IXITransactApp").catch(() => {}); };
    const idle = window.requestIdleCallback ? window.requestIdleCallback(warm, { timeout: 2000 }) : window.setTimeout(warm, 300);
    return () => { if (window.cancelIdleCallback) window.cancelIdleCallback(idle); else window.clearTimeout(idle); };
  }, [active, activeWorkspace, passportRecordsLoading, passportRecords.length]);
  const appPreferenceKey = entityPassportId && accessData.actor?.passportId
    ? `ixi:transact:app-order:v1:${entityPassportId}:${accessData.actor.passportId}` : "";

  return (
    <div className={styles.shell} data-ui-rebuild="true">
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/transact" aria-label="TRAN$ACT home"><span className={styles.mark}>IXI</span><span className={styles.brandCopy}><strong>TRAN$ACT</strong><small>FINANCIAL OPERATING SYSTEM</small></span></Link>
        <details ref={workspaceMenu} className={styles.workspaceMenu} onKeyDown={event => { if (event.key === "Escape") { event.currentTarget.open = false; event.currentTarget.querySelector("summary")?.focus(); } }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false; }}><summary>Workspaces ▾</summary><nav aria-label="TRAN$ACT workspaces">{WORKSPACES.map(([id, label, number]) => <button type="button" key={id} data-active={activeWorkspace === id} onClick={() => selectWorkspace(id)}><span>{number}</span><strong>{label}</strong>{id === "today" && queue.length ? <b>{queue.length}</b> : null}</button>)}<Link href="/transact/ledger">EXECUTIVE / LEDGER CONTROL</Link></nav></details>
        <div className={styles.entityScope}>
          {environment?.entity?.logoUrl ? <img className={styles.entityLogo} src={environment.entity.logoUrl} alt={`${environment.entity.displayName || "Entity"} logo`} /> : null}
          <span>ENTITY</span><strong>{environment?.entity?.displayName || "AUTHENTICATED ENTITY"}</strong>
        </div>
        <label className={styles.periodControl}><span>ACCOUNTING PERIOD</span><input type="month" value={period} onChange={event => setPeriod(event.target.value)} /></label>
        <div className={styles.searchWrap}>
          <input id="ixi-transact-global-search" className={styles.search} type="search" role="combobox" aria-autocomplete="list" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search machine, party or record…" aria-label="Search TRAN$ACT" aria-controls="ixi-transact-search-results" aria-expanded={searchResults.length > 0} aria-activedescendant={searchIndex >= 0 ? `ixi-search-result-${searchIndex}` : undefined} onKeyDown={searchKeyDown} />
          {searchResults.length ? <div className={styles.searchResults} id="ixi-transact-search-results" role="listbox" aria-label="Search results">{searchResults.map((result, index) => <button type="button" role="option" id={`ixi-search-result-${index}`} aria-selected={searchIndex === index} key={result.resultId} onClick={() => chooseSearchResult(result)}><span><strong>{result.title}</strong><small>{result.party || result.passportId}</small></span><b>{result.resultType === "transaction" ? "TRANSACTION" : contextLabel(result.kind)}</b></button>)}</div> : null}
          {query.trim().length >= 2 ? <span role="status" className={styles.searchStatus}>{searchError || (searchLoading ? "Searching…" : !searchResults.length ? "No matches" : "")}</span> : null}
        </div>
        <button type="button" className={`${styles.newAction} ${styles.paymentsAction}`} onClick={() => openPaymentRecord()} title="Open payments and record a payment" disabled={!selectedContext}>PAYMENTS</button>
        <button type="button" className={styles.newAction} onClick={() => setNewMenuOpen(value => !value)} aria-expanded={newMenuOpen} disabled={!selectedContext}>+ NEW</button>
        <a className={styles.aosAction} href="/aos/work">RETURN TO AOS</a>
      </header>

      <IXITransactSidePanel className={styles.newTransactionMenu} label="New transaction" dockAt={100000} open={newMenuOpen} onDismiss={() => setNewMenuOpen(false)}><p>{selectedContext?.title}</p><div className={styles.appLauncher}>{selectedModules.map(module => <button type="button" key={module.id} onClick={() => openTransactModule(module.id)}><strong>{module.label}</strong></button>)}</div></IXITransactSidePanel>

      <div className={styles.desktop}>
        <IXITransactSidePanel className={styles.navigation} label="Object directory" dockAt={1280} open={openPanel === "directory"} onDismiss={() => setOpenPanel("")}>
          <nav className={styles.workspaceRail} aria-label="Workspace shortcuts">
            {WORKSPACES.map(([id, label, number]) => <button type="button" key={id} data-active={activeWorkspace === id} aria-current={activeWorkspace === id ? "page" : undefined} onClick={() => selectWorkspace(id)}><span>{number}</span><strong>{label}</strong>{id === "today" && queue.length ? <b>{queue.length}</b> : null}</button>)}
          </nav>
          <section className={styles.objectDirectory} aria-label="Governed AOS Object directory">
            <header>
              <strong className={styles.objectDirectoryCount} aria-label={`${objectDirectory.length} objects`}>{objectDirectory.length}</strong>
              <select className={styles.objectDirectorySelect} aria-label="Object directory" value={selectedDirectory?.id || ""} onChange={event => setSelectedDirectoryId(event.target.value)}>{objectDirectories.map(directory => <option value={directory.id} key={directory.id}>{directory.menuLabel.toUpperCase()}</option>)}</select>
            </header>
            {directoryProjection.error ? <p role="alert">The AOS folder list could not load. Use REFRESH to retry.</p> : null}
            <div className={styles.objectDirectoryList} role="list">
              {objectDirectory.map(item => (
                <div role="listitem" key={item.id}><button type="button" className={styles.objectTile} data-active={selectedContext?.id === item.id} aria-pressed={selectedContext?.id === item.id} onClick={() => selectContext(item)}>
                  <span className={styles.objectTileImage}>
                    <IXIContextImage
                      key={item.id}
                      context={item}
                      mediaClassName={styles.objectTileMedia}
                      fallbackClassName={styles.objectTileMark}
                      fallback={contextLabel(item.kind).slice(0, 2)}
                      label={`${sidebarObjectTitle(item)} thumbnail`}
                      as="span"
                    />
                    {selectedContext?.id === item.id ? <span className={styles.objectTileSelected} aria-hidden="true">SELECTED</span> : null}
                  </span>
                  <strong className={styles.objectTileTitle}>{sidebarObjectTitle(item)}</strong>
                  {item.serialNumber ? <small className={`${styles.objectTileField} ${styles.objectTileSerial}`}><b>SN</b><span>{item.serialNumber}</span></small> : null}
                  <small className={`${styles.objectTileField} ${styles.objectTileIdentity}`}><b>ID</b><span>{item.stockNumber || item.assetId || item.passportId || "NOT RECORDED"}</span></small>
                  <span className={styles.objectTileAction}>{item.kind === "company" ? "COMPANY WORKSPACE" : "TRANSACTION HISTORY"}<span aria-hidden="true">↗</span></span>
                </button></div>
              ))}
            </div>
          </section>
          <div className={styles.navFooter}><Link href="/transact/ledger">LEDGER CONTROL →</Link></div>
        </IXITransactSidePanel>

        <main className={styles.main} data-history-active={activeWorkspace === "object-history" && !activeTabId}>
          <div className={styles.pageHeader}>
            <div><span className={styles.eyebrow}>{environment?.entity?.displayName || "IXI ENTITY"} · {contextLabel(selectedContext?.kind)}</span><h1>{workspaceTitle}</h1></div>
            <div className={styles.headerActions}><button type="button" className={styles.directoryToggle} onClick={() => setOpenPanel("directory")}>Objects</button><button type="button" onClick={refreshAuthoritativeContext}>REFRESH</button></div>
          </div>

          <div className={styles.compactContext}><strong>{selectedContext?.title || "Connecting…"}</strong><button type="button" className={styles.appsToggle} onClick={() => setOpenPanel("apps")}>Apps</button></div>
          <div className={styles.objectPickers} aria-label="Financial story scope">{SCOPE_OPTIONS.map(([kind, code, label]) => <IXITransactObjectPicker key={kind} label={label} items={groups[kind] || []} selectedId={selectedContext?.id} onSelect={selectContext} />)}</div>

          {loading ? <div className={styles.loadingState}><strong>VERIFYING TRAN$ACT SESSION</strong><span>Connecting to your authenticated operating company…</span><small>Unauthenticated sessions return to the secure sign-in automatically.</small></div> : null}
          {!loading && error ? <div className={styles.errorBanner} role="alert"><strong>TRAN$ACT UNAVAILABLE</strong><span>{error}</span><small>No financial values have been fabricated.</small><a className={styles.loginAction} href={TRANSACT_LOGIN_HREF}>LOG IN AND RETURN TO TRAN$ACT</a></div> : null}
          {contextLoading ? <div className={styles.loadingState} role="status"><strong>COMPANY CONNECTED</strong><span>Loading governed financial operating context…</span><small>Machines appear only through the authoritative company Equipment projection.</small></div> : null}
          {contextError ? <div className={styles.errorBanner} role="alert"><strong>OPERATING CONTEXT INCOMPLETE</strong><span>{contextError}</span><small>The authenticated company remains available; unresolved Objects are not displayed.</small></div> : null}
          {financialError ? <div className={styles.errorBanner} role="alert"><strong>FINANCIAL PROJECTION UNAVAILABLE</strong><span>{financialError}</span><small>Operating context remains visible; accounting completeness is not asserted.</small></div> : null}
          {activeTabId && passportRecordsError ? <div className={styles.errorBanner} role="alert"><strong>BALANCES NEED REFRESH</strong><span>{passportRecordsError} Any confirmed save remains saved.</span><button type="button" onClick={retryHistory}>RETRY BALANCES</button></div> : null}
          {activeTabId && passportHistory.stale && !passportRecordsError ? <p role="status">Updating transaction balances…</p> : null}
          {!loading && !error && selectedContext ? <>
            {workingTabs.length ? <IXITransactWorkingTabs tabs={workingTabs} activeId={activeTabId} onSelect={activateTab} onHistory={returnToObjectHistory} onClose={closeTab} /> : null}
            <div className={styles.historyPane} id="transact-history-panel" role="tabpanel" aria-label="Transaction history" aria-labelledby={workingTabs.length ? "transact-tab-history" : undefined} hidden={Boolean(activeTabId)}>
              <div className={styles.historyViewport} hidden={activeWorkspace !== "object-history"}><IXITransactMachineHistory key={selectedContext?.id} context={selectedContext} entity={environment?.entity}
                savedState={historyStates.current.get(historyStateKey)} recordCache={recordCache} active={active && activeWorkspace === "object-history" && !activeTabId}
                records={passportRecords} loading={passportRecordsReadyFor !== selectedContext?.passportId} error={passportRecordsError} refreshing={passportHistory.stale} currency={currency}
                onOpenRecord={openTransactionRecord} onMarkPaid={openPaymentRecord} onRetry={retryHistory} /></div>
              {renderWorkspace()}
            </div>
            {workingTabs.map(tab => <WorksheetPanel key={tab.id} tab={tab} active={activeTabId === tab.id} onDirty={markTabDirty}>
              {tab.reportKey ? <IXITransactAccountingReports reports={projection?.reports || {}} initialReport={tab.reportKey} currency={currency} period={period} entity={environment?.entity} onOpenRecord={openTransactionRecord} /> : tab.paymentTab ? <IXIPaymentsPanel
                context={createIXITransactContext({ object: tab.object, actor: accessData.actor || {}, entity: environment?.entity || {}, permissions })}
                object={tab.object} sourceIds={tab.paymentSourceId ? [tab.paymentSourceId] : null} initialOpenId={tab.paymentSourceId}
                onClose={() => closeTab(tab)} onChanged={() => worksheetSaved(tab.id)} /> : tab.financialDocumentId ? <IXITransactRecordWorkspace financialDocumentId={tab.financialDocumentId} recordCache={recordCache} refreshVersion={tab.recordRefresh || 0} active={activeTabId === tab.id} dirty={tab.dirty}
                object={tab.object} actor={accessData.actor || {}} entity={environment?.entity || {}} permissions={permissions}
                financialRecords={tab.financialRecords} onBack={returnToObjectHistory} onOpenRecord={openTransactionRecord} onMarkPaid={() => openPaymentRecord(tab.financialDocumentId)}
                onFinancialRecordsChange={() => worksheetSaved(tab.id)} /> : <IXITransactApp workspaceEmbedded
                  object={tab.object} initialModuleId={tab.moduleId} actor={accessData.actor || {}} entity={environment?.entity || {}}
                  permissions={permissions} financialRecords={tab.financialRecords} onFinancialRecordsChange={() => worksheetSaved(tab.id)}
                  onClose={() => closeTab(tab)} />}
            </WorksheetPanel>)}
          </> : null}
          {closingTab ? <UnfinishedWorksheetDialog tab={closingTab} onCancel={() => setClosingTab(null)} onDiscard={() => closeTab(closingTab, true)} onReturn={() => { activateTab(closingTab); setClosingTab(null); }} /> : null}
        </main>

        <IXITransactSidePanel className={styles.contextPanel} label="Selected object and apps" dockAt={1000} open={openPanel === "apps"} onDismiss={() => setOpenPanel("")}>
          <div className={styles.contextTitle}><span>ACTIVE CONTEXT</span><strong>{objectContextActive ? "TRAN$ACT APPS" : "PROOF & LINEAGE"}</strong></div>
          {selectedContext ? <ContextIdentityCard context={selectedContext} interactive={objectContextActive} onActivate={returnToObjectHistory} /> : null}
          {objectContextActive ? <IXITransactAppDirectory key={appPreferenceKey || "session"} modules={selectedModules} activeModuleId={activeModuleId} onOpen={openTransactModule} onHistory={returnToObjectHistory} historyActive={activeWorkspace === "object-history" && !activeTabId} preferenceKey={appPreferenceKey} /> : <section className={styles.proofCard}>
            <div><span>IDENTITY</span><StatusBadge value={access ? "VERIFIED" : "WAITING"} /></div>
            <div><span>FINANCIAL</span><StatusBadge value={projectionPayload ? "CURRENT" : "NOT PROVEN"} /></div>
            <div><span>SOURCE COVERAGE</span><strong>{projectionPayload ? "SERVER RETURNED" : "NOT RETURNED"}</strong></div>
            <div><span>GENERATED</span><strong>{displayTimestamp(projection?.generatedAt)}</strong></div>
            <div><span>LINEAGE</span><strong>{projection?.lineageVersion || "NOT RETURNED"}</strong></div>
            <div><span>PERIOD</span><strong>{period}</strong></div>
            <div><span>PASSPORT RECORDS</span><strong>{passportRecordsLoading ? "LOADING" : normalizedPassportRecords.length}</strong></div>
          </section>}
          {!objectContextActive && selectedDetail ? <section className={styles.detailCard}><span>SELECTED WORK</span><h3>{selectedDetail.title}</h3><p>{selectedDetail.detail || selectedDetail.party || "Authoritative record selected for review."}</p>{selectedDetail.status ? <StatusBadge value={selectedDetail.status} /> : null}</section> : null}
          {!objectContextActive ? <section className={styles.connectionCard}><div><span>CANONICAL RELATIONSHIPS</span><strong>{relationshipEvidence.length}</strong></div>{connections.length ? connections.slice(0, 6).map(item => <p key={item.kind}><span>{item.label}</span><b>{item.count}</b></p>) : <small>No active IX-Core relationships returned.</small>}</section> : null}
        </IXITransactSidePanel>
      </div>

      <footer className={styles.statusbar}><span data-live={connectionHealthy}>● {connectionLabel}</span><span>{financialLoading ? "REFRESHING AUTHORITATIVE PROJECTION" : `${contextLabel(selectedContext?.kind)} CONTEXT · ${period}`}</span><span>VIEWS NEVER CHANGE POSTED TRUTH</span></footer>
    </div>
  );
}
