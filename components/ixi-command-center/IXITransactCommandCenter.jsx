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

import { loadIXIMosEnvironment } from "../../lib/mos/loadIXIMosEnvironment";
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
import IXITransactSidePanel from "./IXITransactSidePanel";
import IXITransactSortableLauncher from "../ixi-aos/transact/IXITransactSortableLauncher";
import { useIXITransactAppOrder } from "./useIXITransactAppOrder";
import styles from "./IXIAosCommandCenter.module.css";

const IXITransactApp = dynamic(
  () => import("../ixi-aos/transact/IXITransactApp"),
  {
    ssr: false,
    loading: () => <div className={styles.loadingState}><strong>OPENING TRAN$ACT APP</strong><span>Loading the selected governed worksheet…</span></div>
  }
);

const SCOPE_OPTIONS = [
  ["company", "CO", "Company"],
  ["location", "LO", "Location"],
  ["machine", "MC", "Machine"],
  ["person", "PE", "Person"],
  ["work", "WO", "Work Order"],
  ["object", "AO", "Any Object"]
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
  const Element = interactive ? "button" : "section";
  const interactionProps = interactive ? { type: "button", onClick: onActivate } : {};

  return (
    <Element className={styles.identityCard} data-interactive={interactive} {...interactionProps}>
      <IXIContextImage
        key={context.id}
        context={context}
        mediaClassName={styles.identityMedia}
        fallbackClassName={styles.identityMark}
        label={`${context.title} identity image`}
        eager
      />
      <div>
        <span>{contextLabel(context.kind)}</span>
        <h2>{context.title}</h2>
        <p>{context.location || context.subtitle}</p>
        <dl>
          <ContextIdentityFields context={context} />
        </dl>
      </div>
    </Element>
  );
}

function ContextIdentityFields({ context, compact = false }) {
  const includeObjectIdentity = context?.kind !== "company";

  return (
    <>
      {includeObjectIdentity ? <>
        <div><dt>{compact ? "SN" : "SERIAL NUMBER"}</dt><dd>{context.serialNumber || "NOT RECORDED"}</dd></div>
        <div><dt>{compact ? "STOCK" : "STOCK NUMBER"}</dt><dd>{context.stockNumber || "NOT RECORDED"}</dd></div>
      </> : null}
      <div><dt>{compact ? "PASSPORT" : "PASSPORT NUMBER"}</dt><dd>{context.passportId || "NOT RECORDED"}</dd></div>
      {includeObjectIdentity ? <div><dt>OBJECT ID</dt><dd>{context.sourceId || "NOT RECORDED"}</dd></div> : null}
    </>
  );
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
              <td><strong>{record.title}</strong><small>{record.id}</small></td>
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

export default function IXITransactCommandCenter({ runtime, active = true }) {
  const router = useRouter();
  const readAccess = runtime?.loadAccess || loadIXIFinancialAccessContext;
  const readDashboard = runtime?.loadDashboard || loadIXITransactDashboard;
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
  useEffect(() => {
    if (!active) { setOpenPanel(""); setNewMenuOpen(false); }
  }, [active]);
  const [queuePage, setQueuePage] = useState(0);
  const [selectedQueueId, setSelectedQueueId] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [workingTabs, setWorkingTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState("");
  const [closingTab, setClosingTab] = useState(null);
  const deepLinkOpened = useRef(null);
  const loadedPassport = useRef("");
  const financialQueryKey = useRef("");
  const [activeModuleId, setActiveModuleId] = useState("");
  const [selectedDirectoryId, setSelectedDirectoryId] = useState("");
  const [passportRefreshKey, setPassportRefreshKey] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState("");
  const [financialLoading, setFinancialLoading] = useState(false);
  const [error, setError] = useState("");
  const [financialError, setFinancialError] = useState("");
  const [passportRecords, setPassportRecords] = useState([]);
  const [passportRecordsReadyFor, setPassportRecordsReadyFor] = useState("");
  const [passportRecordsLoading, setPassportRecordsLoading] = useState(false);
  const [passportRecordsError, setPassportRecordsError] = useState("");
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
        const aosResult = await loadIXIMosEnvironment({ includeObjects: true });
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
  }, [access, refreshKey]);

  const accessData = access?.data || {};
  const entityPassportId = clean(accessData.defaults?.entityPassportId || accessData.entities?.[0]?.passportId || environment?.entity?.passportId);
  useEffect(() => { setCompanyRecords([]); setSearchError(""); }, [entityPassportId, accessData.actor?.passportId]);
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
  useEffect(() => {
    if (!active) return undefined;
    const passportId = clean(selectedContext?.passportId);
    if (!passportId || !access) {
      setPassportRecords([]);
      setPassportRecordsError("");
      return undefined;
    }

    const controller = new AbortController();
    if (loadedPassport.current !== passportId) { setPassportRecords([]); setPassportRecordsReadyFor(""); }
    loadedPassport.current = passportId;
    setPassportRecordsLoading(true);
    setPassportRecordsError("");

    loadIXIAosPassportFinancialDocuments({ passportId, signal: controller.signal })
      .then(records => {
        if (!controller.signal.aborted) { setPassportRecords(records); setPassportRecordsReadyFor(passportId); }
      })
      .catch(loadError => {
        if (!controller.signal.aborted && loadError?.name !== "AbortError") {
          setPassportRecordsError(loadError?.message || "Passport financial records could not be loaded.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setPassportRecordsLoading(false);
      });

    return () => controller.abort();
  }, [access, active, passportRefreshKey, selectedContext?.id, selectedContext?.passportId]);

  useEffect(() => {
    if (!selectedContext || !access) return undefined;
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
      loadIXIAosPassportFinancialDocuments({ passportId: entityPassportId, signal: controller.signal })
        .then(records => { if (!controller.signal.aborted) setCompanyRecords(records); })
        .catch(error => { if (!controller.signal.aborted) setSearchError(error.message || "Transaction search unavailable. Retry."); })
        .finally(() => { if (!controller.signal.aborted) setSearchLoading(false); });
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, entityPassportId, access, passportRefreshKey]);
  const searchResults = useMemo(() => searchIXITransact({ query, contexts,
    records: [...new Map([...companyRecords, ...passportRecords].map(record => [paymentDocument(record).financialDocumentId, record])).values()]
  }), [query, contexts, companyRecords, passportRecords]);
  useEffect(() => setQueuePage(0), [selectedContext?.id, queue.length]);

  function selectContext(context) {
    setOpenPanel("");
    if (selectedId !== context.id) { setPassportRecords([]); setPassportRecordsLoading(true); }
    setSelectedKind(context.kind);
    setSelectedId(context.id);
    setQuery("");
    setSelectedRecord(null);
    setActiveModuleId("");
    setActiveTabId("");
    setActiveWorkspace(context.kind === "company" ? "today" : "object-history");
  }

  function refreshAuthoritativeContext() {
    runtime?.invalidateFinancial();
    contextHydrationStarted.current = false;
    setRefreshKey(value => value + 1);
    setPassportRefreshKey(value => value + 1);
  }

  function activateTab(tab) {
    setOpenPanel("");
    if (selectedId !== tab.context.id) { setPassportRecords([]); setPassportRecordsLoading(true); }
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
    const financialDocumentId = clean(record?.document?.financialDocumentId || record?.raw?.financialDocumentId);
    if (!financialDocumentId || !selectedContext) return;
    const existing = workingTabs.find(tab => tab.financialDocumentId === financialDocumentId);
    if (existing) { activateTab(existing); return; }
    const references = record?.document?.references || [];
    const targetContext = contexts.find(context => references.some(ref => ["asset", "machine", "object"].includes(ref.role) && ref.passportId === context.passportId)) || selectedContext;
    const records = [...new Map([...companyRecords, ...passportRecords].map(item => [paymentDocument(item).financialDocumentId, item])).values()];
    const tab = { id: financialDocumentId, financialDocumentId, label: record.title || financialDocumentId,
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

  async function worksheetSaved(id) {
    runtime?.invalidateFinancial();
    const savedTab = workingTabs.find(tab => tab.id === id);
    setWorkingTabs(tabs => tabs.map(tab => tab.id === id ? { ...tab, dirty: false } : tab));
    setPassportRefreshKey(value => value + 1);
    setRefreshKey(value => value + 1);
    if (!savedTab?.context?.passportId) return;
    try {
      const records = await loadIXIAosPassportFinancialDocuments({ passportId: savedTab.context.passportId });
      setWorkingTabs(tabs => tabs.map(tab => tab.context.passportId === savedTab.context.passportId && (tab.id === id || !tab.dirty)
        ? { ...tab, object: buildTransactObject(tab.context, records), financialRecords: records } : tab));
    } catch {
      // The save already succeeded. History owns the retryable read error;
      // never turn a completed financial command into a second submission.
    }
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

  const appPreferences = useIXITransactAppOrder({ entityPassportId, actorPassportId: accessData.actor?.passportId, kind: selectedContext?.kind });
  useEffect(() => setSearchIndex(-1), [query, searchResults]);
  useEffect(() => {
    if (searchIndex >= 0) document.getElementById(`ixi-search-result-${searchIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [searchIndex]);
  function chooseSearchResult(result) {
    if (!result) return;
    if (result.resultType === "transaction") openTransactionRecord(result);
    else selectContext(result);
  }
  function searchKeyDown(event) {
    if (event.key === "Escape") { setQuery(""); return; }
    if (!searchResults.length) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setSearchIndex(current => current < 0
        ? event.key === "ArrowDown" ? 0 : searchResults.length - 1
        : (current + (event.key === "ArrowDown" ? 1 : -1) + searchResults.length) % searchResults.length);
    } else if (event.key === "Enter" && searchIndex >= 0) {
      event.preventDefault();
      chooseSearchResult(searchResults[searchIndex]);
    }
  }

  return (
    <div className={`${styles.shell} ${styles.responsiveShell}`}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/transact" aria-label="TRAN$ACT home"><span className={styles.mark}>IXI</span><span className={styles.brandCopy}><strong>TRAN$ACT</strong><small>FINANCIAL OPERATING SYSTEM</small></span></Link>
        <div className={styles.entityScope}>
          {environment?.entity?.logoUrl ? <img className={styles.entityLogo} src={environment.entity.logoUrl} alt={`${environment.entity.displayName || "Entity"} logo`} /> : null}
          <span>ENTITY</span><strong>{environment?.entity?.displayName || "AUTHENTICATED ENTITY"}</strong>
        </div>
        <label className={styles.periodControl}><span>ACCOUNTING PERIOD</span><input type="month" value={period} onChange={event => setPeriod(event.target.value)} /></label>
        <div className={styles.searchWrap}>
          <input id="ixi-transact-global-search" className={styles.search} type="search" role="combobox" aria-autocomplete="list" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search machine, Passport, party or record…" aria-label="Search TRAN$ACT" aria-controls="ixi-transact-search-results" aria-expanded={searchResults.length > 0} aria-activedescendant={searchIndex >= 0 ? `ixi-search-result-${searchIndex}` : undefined} onKeyDown={searchKeyDown} />
          {searchResults.length ? <div className={styles.searchResults} id="ixi-transact-search-results" role="listbox" aria-label="Search results">{searchResults.map((result, index) => <button type="button" role="option" id={`ixi-search-result-${index}`} aria-selected={searchIndex === index} key={result.resultId} onClick={() => chooseSearchResult(result)}><span><strong>{result.title}</strong><small>{result.party || result.passportId || result.sourceId}</small></span><b>{result.resultType === "transaction" ? "TRANSACTION" : contextLabel(result.kind)}</b></button>)}</div> : null}
          {query.trim().length >= 2 ? <span role="status" className={styles.searchStatus}>{searchError || (searchLoading ? "Searching…" : !searchResults.length ? "No matches" : "")}</span> : null}
        </div>
        <button type="button" className={styles.newAction} onClick={() => openPaymentRecord()} disabled={!selectedContext}>PAYMENTS · MARK PAID</button>
        <button type="button" className={styles.newAction} onClick={() => setNewMenuOpen(value => !value)} aria-expanded={newMenuOpen} disabled={!selectedContext}>+ NEW</button>
        <a className={styles.aosAction} href="/aos/work">RETURN TO AOS</a>
      </header>

      {newMenuOpen ? <section className={styles.newTransactionMenu} role="dialog" aria-label="Create transaction" onKeyDown={event => { if (event.key === "Escape") setNewMenuOpen(false); }}><h2>NEW TRANSACTION</h2><p>Choose a worksheet for {selectedContext?.title}.</p><button type="button" className={styles.rowAction} onClick={() => setNewMenuOpen(false)}>CLOSE</button><div className={styles.appLauncher}>{selectedModules.map(module => <button type="button" key={module.id} onClick={() => openTransactModule(module.id)}><strong>{module.label}</strong></button>)}</div></section> : null}
      <div className={styles.desktop}>
        <IXITransactSidePanel className={styles.navigation} label="Navigation and machines" dockAt={1200} open={openPanel === "navigation"} onDismiss={() => setOpenPanel("")}>
          <div className={styles.operator}><span>WORKING AS</span><strong>{operatorLabel(accessData)}</strong><small>{permissions.length} GRANTS · {denied.length} DENIES</small></div>
          <nav aria-label="TRAN$ACT workspaces">{WORKSPACES.map(([id, label, number]) => <button type="button" key={id} data-active={activeWorkspace === id} onClick={() => { setOpenPanel(""); setActiveWorkspace(id); setActiveTabId(""); setActiveModuleId(""); setSelectedRecord(null); }}><span>{number}</span><strong>{label}</strong>{id === "today" && queue.length ? <b>{queue.length}</b> : null}</button>)}</nav>
          <section className={styles.objectDirectory} aria-label="Governed AOS Object directory">
            <header>
              <strong className={styles.objectDirectoryCount} aria-label={`${objectDirectory.length} objects`}>{objectDirectory.length}</strong>
              <select className={styles.objectDirectorySelect} aria-label="Object directory" value={selectedDirectory?.id || ""} onChange={event => setSelectedDirectoryId(event.target.value)}>{objectDirectories.map(directory => <option value={directory.id} key={directory.id}>{directory.menuLabel.toUpperCase()}</option>)}</select>
            </header>
            {directoryProjection.error ? <p role="alert">The AOS folder list could not load. Use REFRESH to retry.</p> : null}
            <div className={styles.objectDirectoryList} role="list">
              {objectDirectory.map(item => (
                <div role="listitem" key={item.id}><button type="button" className={styles.objectTile} data-active={selectedContext?.id === item.id} onClick={() => selectContext(item)}>
                  <strong className={styles.objectTileTitle}>{item.title}</strong>
                  <small className={`${styles.objectTileField} ${styles.objectTileSerial}`}><b>SN</b><span>{item.serialNumber || "NOT RECORDED"}</span></small>
                  <small className={`${styles.objectTileField} ${styles.objectTileIdentity}`}><b>ID</b><span>{item.stockNumber || item.assetId || item.passportId || "NOT RECORDED"}</span></small>
                  <IXIContextImage
                    key={item.id}
                    context={item}
                    mediaClassName={styles.objectTileMedia}
                    fallbackClassName={styles.objectTileMark}
                    fallback={contextLabel(item.kind).slice(0, 2)}
                    label={`${item.title} thumbnail`}
                    as="span"
                  />
                </button></div>
              ))}
            </div>
          </section>
          <div className={styles.navFooter}><Link href="/transact/ledger">LEDGER &amp; ACCOUNTING →</Link></div>
        </IXITransactSidePanel>

        <main className={styles.main}>
          <div className={styles.panelControls}>
            <button type="button" className={styles.navigationToggle} aria-haspopup="dialog" onClick={() => setOpenPanel("navigation")}>NAVIGATION &amp; MACHINES</button>
            <button type="button" className={styles.contextToggle} aria-haspopup="dialog" onClick={() => setOpenPanel("context")}>APPS &amp; DETAILS</button>
          </div>
          <div className={styles.pageHeader}>
            <div><span className={styles.eyebrow}>{environment?.entity?.displayName || "IXI ENTITY"} · {contextLabel(selectedContext?.kind)}</span><h1>{workspaceTitle}</h1><p>{selectedContext?.title || "Resolving operating context…"}</p></div>
            <div className={styles.headerActions}><label><span>CURRENT {contextLabel(selectedKind)}</span><select value={selectedContext?.id || ""} onChange={event => { const context = currentGroup.find(item => item.id === event.target.value); if (context) selectContext(context); }}>{currentGroup.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label><button type="button" onClick={refreshAuthoritativeContext}>REFRESH</button></div>
          </div>

          <div className={styles.scopeStrip} aria-label="Financial story scope">{SCOPE_OPTIONS.map(([kind, code, label]) => <button type="button" key={kind} data-active={selectedKind === kind} disabled={!groups[kind]?.length} onClick={() => { const context = groups[kind]?.[0]; if (context) selectContext(context); }}><span>{code}</span><strong>{label}</strong><b>{groups[kind]?.length || 0}</b></button>)}</div>

          {loading ? <div className={styles.loadingState}><strong>VERIFYING TRAN$ACT SESSION</strong><span>Connecting to your authenticated operating company…</span><small>Unauthenticated sessions return to the secure sign-in automatically.</small></div> : null}
          {!loading && error ? <div className={styles.errorBanner} role="alert"><strong>TRAN$ACT UNAVAILABLE</strong><span>{error}</span><small>No financial values have been fabricated.</small><a className={styles.loginAction} href={TRANSACT_LOGIN_HREF}>LOG IN AND RETURN TO TRAN$ACT</a></div> : null}
          {contextLoading ? <div className={styles.loadingState} role="status"><strong>COMPANY CONNECTED</strong><span>Loading governed financial operating context…</span><small>Machines appear only through the authoritative company Equipment projection.</small></div> : null}
          {contextError ? <div className={styles.errorBanner} role="alert"><strong>OPERATING CONTEXT INCOMPLETE</strong><span>{contextError}</span><small>The authenticated company remains available; unresolved Objects are not displayed.</small></div> : null}
          {financialError ? <div className={styles.errorBanner} role="alert"><strong>FINANCIAL PROJECTION UNAVAILABLE</strong><span>{financialError}</span><small>Operating context remains visible; accounting completeness is not asserted.</small></div> : null}
          {passportRecordsError ? <div className={styles.errorBanner} role="alert"><strong>PASSPORT RECORDS UNAVAILABLE</strong><span>{passportRecordsError}</span><small>No substitute records or financial values have been created.</small></div> : null}
          {!loading && !error && selectedContext ? <>
            <IXITransactWorkingTabs tabs={workingTabs} activeId={activeTabId} onSelect={activateTab} onHistory={returnToObjectHistory} onClose={closeTab} />
            <div id="transact-history-panel" role="tabpanel" aria-labelledby="transact-tab-history" hidden={Boolean(activeTabId)}>
              <div hidden={activeWorkspace !== "object-history"}><IXITransactMachineHistory key={selectedContext?.id} context={selectedContext} entity={environment?.entity}
                records={passportRecords} loading={passportRecordsReadyFor !== selectedContext?.passportId} error={passportRecordsError} currency={currency}
                onOpenRecord={openTransactionRecord} onMarkPaid={openPaymentRecord} onRetry={() => setPassportRefreshKey(value => value + 1)} /></div>
              {renderWorkspace()}
            </div>
            {workingTabs.map(tab => <WorksheetPanel key={tab.id} tab={tab} active={activeTabId === tab.id} onDirty={markTabDirty}>
              {tab.reportKey ? <IXITransactAccountingReports reports={projection?.reports || {}} initialReport={tab.reportKey} currency={currency} period={period} entity={environment?.entity} onOpenRecord={openTransactionRecord} /> : tab.paymentTab ? <IXIPaymentsPanel
                context={createIXITransactContext({ object: tab.object, actor: accessData.actor || {}, entity: environment?.entity || {}, permissions })}
                object={tab.object} sourceIds={tab.paymentSourceId ? [tab.paymentSourceId] : null} initialOpenId={tab.paymentSourceId}
                onClose={() => closeTab(tab)} onChanged={() => worksheetSaved(tab.id)} /> : tab.financialDocumentId ? <IXITransactRecordWorkspace financialDocumentId={tab.financialDocumentId}
                object={tab.object} actor={accessData.actor || {}} entity={environment?.entity || {}} permissions={permissions}
                financialRecords={tab.financialRecords} onBack={returnToObjectHistory} onOpenRecord={openTransactionRecord}
                onFinancialRecordsChange={() => worksheetSaved(tab.id)} /> : <IXITransactApp workspaceEmbedded
                  object={tab.object} initialModuleId={tab.moduleId} actor={accessData.actor || {}} entity={environment?.entity || {}}
                  permissions={permissions} financialRecords={tab.financialRecords} onFinancialRecordsChange={() => worksheetSaved(tab.id)}
                  onClose={() => closeTab(tab)} />}
            </WorksheetPanel>)}
          </> : null}
          {closingTab ? <UnfinishedWorksheetDialog tab={closingTab} onCancel={() => setClosingTab(null)} onDiscard={() => closeTab(closingTab, true)} onReturn={() => { activateTab(closingTab); setClosingTab(null); }} /> : null}
        </main>

        <IXITransactSidePanel className={styles.contextPanel} label="Apps and details" dockAt={1600} open={openPanel === "context"} onDismiss={() => setOpenPanel("")}>
          <div className={styles.contextTitle}><span>ACTIVE CONTEXT</span><strong>{objectContextActive ? "TRAN$ACT APPS" : "PROOF & LINEAGE"}</strong></div>
          {selectedContext ? <ContextIdentityCard context={selectedContext} interactive={objectContextActive} onActivate={returnToObjectHistory} /> : null}
          {objectContextActive ? <section className={styles.desktopLauncher} aria-label="TRAN$ACT applications"><button type="button" className={styles.historyApp} data-active={activeWorkspace === "object-history"} onClick={returnToObjectHistory}>TRANSACTION HISTORY</button><IXITransactSortableLauncher modules={selectedModules} moduleOrder={appPreferences.order} onOpen={module => openTransactModule(module.id)} onOrderChange={appPreferences.save} />{appPreferences.error ? <p role="status">{appPreferences.error}</p> : null}</section> : <section className={styles.proofCard}>
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
