import { useEffect, useMemo, useState } from "react";

import { loadIXIMosEnvironment } from "../../lib/mos/loadIXIMosEnvironment";
import {
  loadIXIFinancialAccessContext,
  loadIXITransactDashboard
} from "../ixi-transact-dashboard/data/IXITransactDashboardClient";
import {
  buildIXITransactDashboardQuery,
  getDefaultIXITransactAccountingPeriod
} from "../ixi-transact-dashboard/data/IXITransactDashboardQueryContract";
import { normalizeIXITransactDashboardProjection } from "../ixi-transact-dashboard/data/IXITransactDashboardProjectionAdapter";
import {
  buildIXIAosCommandContexts,
  buildIXIAosRecentStory,
  formatIXIMoney,
  getIXIAosContextGroups,
  getIXIAosRelatedContexts,
  getIXIFinancialQueryScope,
  getIXITransactAttentionBand,
  getIXITransactControlCounts
} from "./IXIAosCommandCenterModel";

import styles from "./IXIAosCommandCenter.module.css";

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
    raw: item
  }));
}

function buildQueue({ projection, context, related, currency }) {
  const financial = safeArray(projection?.attention).map((item, index) => ({
    id: clean(item.alertId || item.id || `financial-${index}`),
    band: getIXITransactAttentionBand(item),
    title: clean(item.title || item.type || "Financial attention"),
    detail: clean(item.detail || item.description || item.message || "Review the authoritative TRAN$ACT record."),
    value: Number.isFinite(Number(item.amount)) ? formatIXIMoney(Number(item.amount), currency) : clean(item.value || ""),
    source: "IXI FINANCIAL",
    href: "/transact/ledger"
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

  return [...financial, ...operational];
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

function StatusBadge({ value }) {
  const normalized = clean(value || "ACTIVE").toUpperCase();
  const tone = /FAIL|BLOCK|DENY|OVERDUE|CONFLICT/.test(normalized)
    ? "danger"
    : /PAID|POSTED|CLOSED|VERIFIED|COMPLETE|CURRENT/.test(normalized)
      ? "verified"
      : "neutral";
  return <span className={styles.badge} data-tone={tone}>{normalized}</span>;
}

function RecordTable({ records, currency, emptyMessage, onSelect }) {
  if (!records.length) {
    return <div className={styles.emptyState}><strong>NO RECORDS RETURNED</strong><span>{emptyMessage}</span></div>;
  }
  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead><tr><th>RECORD</th><th>PARTY / SOURCE</th><th>STATUS</th><th>DUE / DATE</th><th>AMOUNT</th><th aria-label="Open record" /></tr></thead>
        <tbody>
          {records.slice(0, 50).map(record => (
            <tr key={record.id}>
              <td><strong>{record.title}</strong><small>{record.id}</small></td>
              <td>{record.party}</td>
              <td><StatusBadge value={record.status} /></td>
              <td>{record.date}</td>
              <td className={styles.money}>{record.amount === null ? "—" : formatIXIMoney(record.amount, currency)}</td>
              <td><button type="button" className={styles.rowAction} onClick={() => onSelect?.(record)}>VIEW</button></td>
            </tr>
          ))}
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
        <a href={href}>{actionLabel}</a>
      </div>
    </div>
  );
}

export default function IXITransactCommandCenter() {
  const [environment, setEnvironment] = useState(null);
  const [access, setAccess] = useState(null);
  const [projectionPayload, setProjectionPayload] = useState(null);
  const [selectedKind, setSelectedKind] = useState("company");
  const [selectedId, setSelectedId] = useState("");
  const [activeWorkspace, setActiveWorkspace] = useState("today");
  const [period, setPeriod] = useState(getDefaultIXITransactAccountingPeriod());
  const [query, setQuery] = useState("");
  const [selectedQueueId, setSelectedQueueId] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState("");
  const [financialLoading, setFinancialLoading] = useState(false);
  const [error, setError] = useState("");
  const [financialError, setFinancialError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let authenticatedBootstrapPublished = false;
    async function load() {
      setLoading(true);
      setContextLoading(false);
      setContextError("");
      setError("");
      setFinancialError("");
      try {
        const accessRequest = loadIXIFinancialAccessContext({ signal: controller.signal }).then(
          value => {
            if (!controller.signal.aborted) setAccess(value);
            return { value, error: null };
          },
          accessError => ({ value: null, error: accessError })
        );
        const aosResult = await loadIXIMosEnvironment({
          includeObjects: true,
          // Canonical admission is read-only. A bounded one-wave read keeps a
          // normal TRAN$ACT workspace from waiting on three serial batches.
          onAuthenticatedEnvironment: authenticatedEnvironment => {
            if (controller.signal.aborted) return;
            authenticatedBootstrapPublished = true;
            setEnvironment(authenticatedEnvironment);
            setLoading(false);
            setContextLoading(true);
          }
        });
        if (controller.signal.aborted) return;
        if (!aosResult?.isAuthenticated) {
          window.location.assign(TRANSACT_LOGIN_HREF);
          return;
        }
        setEnvironment(aosResult);
        setLoading(false);
        setContextLoading(false);
        setContextError("");

        let accessResult = await accessRequest;
        if (accessResult.error?.status === 401 && !controller.signal.aborted) {
          accessResult = await loadIXIFinancialAccessContext({ signal: controller.signal }).then(
            value => ({ value, error: null }),
            accessError => ({ value: null, error: accessError })
          );
        }
        if (controller.signal.aborted) return;
        if (accessResult.error) {
          setAccess(null);
          setFinancialError(accessResult.error.message || "IXI Financial access could not be verified.");
        } else {
          setAccess(accessResult.value);
          setFinancialError("");
        }
      } catch (loadError) {
        if (loadError?.name !== "AbortError") {
          if (authenticatedBootstrapPublished) {
            setContextError(loadError?.message || "Canonical operating context could not be loaded.");
            setContextLoading(false);
          } else {
            setError(loadError?.message || "IXI TRAN$ACT could not be loaded.");
          }
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  const contexts = useMemo(() => buildIXIAosCommandContexts({
    entity: environment?.entity || {},
    aosObjects: environment?.objects || [],
    ownedListings: environment?.ownedListings || []
  }), [environment]);
  const groups = useMemo(() => getIXIAosContextGroups(contexts), [contexts]);

  useEffect(() => {
    const candidates = groups[selectedKind] || [];
    if (candidates.length && !candidates.some(item => item.id === selectedId)) setSelectedId(candidates[0].id);
  }, [groups, selectedId, selectedKind]);

  const selectedContext = useMemo(() => (
    contexts.find(item => item.id === selectedId) || groups.company[0] || contexts[0] || null
  ), [contexts, groups.company, selectedId]);
  const related = useMemo(() => getIXIAosRelatedContexts(selectedContext, contexts), [contexts, selectedContext]);
  const accessData = access?.data || {};
  const entityPassportId = clean(accessData.defaults?.entityPassportId || accessData.entities?.[0]?.passportId || environment?.entity?.passportId);

  useEffect(() => {
    if (!selectedContext || !access) return undefined;
    const financialScope = getIXIFinancialQueryScope(selectedContext, entityPassportId);
    if (!financialScope) {
      setProjectionPayload(null);
      setFinancialError("");
      return undefined;
    }
    const controller = new AbortController();
    async function loadFinancial() {
      setFinancialLoading(true);
      setFinancialError("");
      try {
        const result = await loadIXITransactDashboard({
          query: buildIXITransactDashboardQuery({ ...financialScope, accountingPeriod: period }),
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
  }, [access, entityPassportId, period, refreshKey, selectedContext]);

  const projection = useMemo(() => projectionPayload ? normalizeIXITransactDashboardProjection(projectionPayload) : null, [projectionPayload]);
  const currency = projection?.currency || "USD";
  const queue = useMemo(() => buildQueue({ projection, context: selectedContext, related, currency }), [currency, projection, related, selectedContext]);
  const controlCounts = useMemo(() => getIXITransactControlCounts(queue.map(item => ({ ...item, status: item.band }))), [queue]);
  const story = useMemo(() => buildIXIAosRecentStory(selectedContext, contexts, 12), [contexts, selectedContext]);
  const connections = useMemo(() => connectionSummary(related), [related]);
  const currentGroup = groups[selectedKind] || [];
  const selectedQueueItem = queue.find(item => item.id === selectedQueueId) || queue[0] || null;
  const searchResults = useMemo(() => {
    const normalized = clean(query).toLowerCase();
    if (normalized.length < 2) return [];
    return contexts.filter(item => `${item.title} ${item.subtitle} ${item.passportId} ${item.sourceId}`.toLowerCase().includes(normalized)).slice(0, 12);
  }, [contexts, query]);

  function selectContext(context) {
    setSelectedKind(context.kind);
    setSelectedId(context.id);
    setQuery("");
    setSelectedRecord(null);
  }

  const recordsByWorkspace = {
    purchasing: mapFinancialRecords(projection?.ap?.records, "PURCHASING"),
    sales: mapFinancialRecords(projection?.ar?.records, "SALES"),
    ar: mapFinancialRecords(projection?.ar?.records, "ACCOUNTS RECEIVABLE"),
    ap: mapFinancialRecords(projection?.ap?.records, "ACCOUNTS PAYABLE"),
    treasury: mapFinancialRecords(projection?.treasury?.accounts, "TREASURY"),
    gl: [
      ...mapFinancialRecords(projection?.gl?.exceptions, "GL EXCEPTION"),
      ...mapFinancialRecords(projection?.gl?.journals, "JOURNAL")
    ]
  };

  function renderToday() {
    const proofLive = Boolean(projectionPayload && !financialError);
    return (
      <div className={styles.todayGrid}>
        <section className={styles.queuePanel}>
          <WorkspaceHeader eyebrow="EXCEPTION-FIRST WORK" title="WHAT NEEDS YOU" detail="Prioritized from server-returned financial and operating exceptions. Nothing is auto-posted here." count={queue.length} />
          <div className={styles.queueBands} aria-label="Today control totals">
            {["BLOCKED", "MONEY EXPOSED", "WAITING", "RECONCILE", "CLOSE"].map(band => <div key={band} data-band={band}><span>{band}</span><strong>{controlCounts[band] || 0}</strong></div>)}
          </div>
          {queue.length ? (
            <div className={styles.queueList}>
              {queue.slice(0, 20).map(item => (
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
        </section>

        <aside className={styles.todaySide}>
          <section className={styles.focusCard}>
            <span className={styles.miniLabel}>CURRENT DECISION</span>
            {selectedQueueItem ? <><StatusBadge value={selectedQueueItem.band} /><h3>{selectedQueueItem.title}</h3><p>{selectedQueueItem.detail}</p><a href={selectedQueueItem.href}>OPEN SOURCE RECORD <span>→</span></a></> : <><h3>No selected exception</h3><p>When work is returned, select it to see the controlling source and next authorized action.</p></>}
          </section>
          <section className={styles.closeCard}>
            <div><span className={styles.miniLabel}>PERIOD CONTROL</span><StatusBadge value={projection?.executive?.closeReadiness || "NOT CERTIFIED"} /></div>
            <h3>{period}</h3>
            <p>Queue completion never substitutes for source coverage, reconciliation evidence, approvals, and governed close.</p>
            <a href="/transact/ledger">OPEN CLOSE WORKSPACE <span>→</span></a>
          </section>
        </aside>
      </div>
    );
  }

  function renderWorkspace() {
    if (activeWorkspace === "today") return renderToday();

    if (activeWorkspace === "work" || activeWorkspace === "records") {
      return (
        <section className={styles.workPanel}>
          <WorkspaceHeader eyebrow={activeWorkspace === "work" ? "OPERATING CONTEXT" : "EVIDENCE & LINEAGE"} title={activeWorkspace === "work" ? "WORK & ASSET STORY" : "RECORD CHRONOLOGY"} detail={activeWorkspace === "work" ? "The same canonical business object, connected to its work, people, locations and financial evidence." : "Timestamped AOS context. Financial records remain governed by IXI Financial and the ledger."} count={story.length} actionLabel={activeWorkspace === "work" ? "RETURN TO AOS" : "OPEN LEDGER"} href={activeWorkspace === "work" ? "/aos/work" : "/transact/ledger"} />
          <div className={styles.storyList}>{story.length ? story.map(item => <div className={styles.storyRow} key={item.id}><span className={styles.storyGlyph}>{contextLabel(item.kind).slice(0, 2)}</span><div><strong>{item.title}</strong><span>{item.detail}</span></div><time>{relativeTime(item.updatedAt)}</time></div>) : <div className={styles.emptyState}><strong>NO TIMESTAMPED RECORDS</strong><span>No authorized chronology was returned for this context.</span></div>}</div>
        </section>
      );
    }

    if (activeWorkspace === "reporting") {
      const reports = projection?.reports && typeof projection.reports === "object"
        ? Object.entries(projection.reports).map(([key, value]) => ({ id: `report-${key}`, title: clean(value?.title || value?.label || key.replace(/[-_]/g, " ")).toUpperCase(), party: clean(value?.description || "Authoritative financial projection"), date: displayTimestamp(value?.generatedAt || projection?.generatedAt), status: clean(value?.status || "AVAILABLE"), amount: null, raw: value }))
        : [];
      return <section className={styles.workPanel}><WorkspaceHeader eyebrow="READ-ONLY PROJECTIONS" title="REPORTING & AUDIT" detail="Every report remains a view of canonical accounting truth and must retain drill-down lineage." count={reports.length} /><RecordTable records={reports} currency={currency} emptyMessage="No server-returned reports are available for this scope." onSelect={setSelectedRecord} /></section>;
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
    return <section className={styles.workPanel}><WorkspaceHeader eyebrow={eyebrow} title={title} detail={detail} count={records.length} /><RecordTable records={records} currency={currency} emptyMessage={financialLoading ? "Loading authoritative records…" : "No server-returned records are available for this scope."} onSelect={setSelectedRecord} /></section>;
  }

  const selectedDetail = selectedRecord || selectedQueueItem;
  const permissions = safeArray(accessData.permissions);
  const denied = safeArray(accessData.deniedPermissions);

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <a className={styles.brand} href="/transact" aria-label="TRAN$ACT home"><span className={styles.mark}>IXI</span><span className={styles.brandCopy}><strong>TRAN$ACT</strong><small>FINANCIAL OPERATING SYSTEM</small></span></a>
        <div className={styles.entityScope}><span>ENTITY</span><strong>{environment?.entity?.displayName || "AUTHENTICATED ENTITY"}</strong></div>
        <label className={styles.periodControl}><span>ACCOUNTING PERIOD</span><input type="month" value={period} onChange={event => setPeriod(event.target.value)} /></label>
        <div className={styles.searchWrap}>
          <input id="ixi-transact-global-search" className={styles.search} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search object, Passport, vendor, amount or document…" aria-label="Search TRAN$ACT" aria-controls="ixi-transact-search-results" aria-expanded={searchResults.length > 0} onKeyDown={event => { if (event.key === "Escape") setQuery(""); }} />
          {searchResults.length ? <div className={styles.searchResults} id="ixi-transact-search-results" role="listbox">{searchResults.map(result => <button type="button" role="option" aria-selected="false" key={result.id} onClick={() => selectContext(result)}><span><strong>{result.title}</strong><small>{result.passportId || result.sourceId}</small></span><b>{contextLabel(result.kind)}</b></button>)}</div> : null}
        </div>
        <a className={styles.newAction} href="/transact/ledger">+ NEW</a>
        <a className={styles.aosAction} href="/aos/work">RETURN TO AOS</a>
      </header>

      <div className={styles.desktop}>
        <aside className={styles.navigation}>
          <div className={styles.operator}><span>WORKING AS</span><strong>{operatorLabel(accessData)}</strong><small>{permissions.length} GRANTS · {denied.length} DENIES</small></div>
          <nav aria-label="TRAN$ACT workspaces">{WORKSPACES.map(([id, label, number]) => <button type="button" key={id} data-active={activeWorkspace === id} onClick={() => { setActiveWorkspace(id); setSelectedRecord(null); }}><span>{number}</span><strong>{label}</strong>{id === "today" && queue.length ? <b>{queue.length}</b> : null}</button>)}</nav>
          <div className={styles.navFooter}><span>BOUNDARY</span><p>AOS describes operating context. IXI Financial owns accounting truth.</p><a href="/transact/ledger">LEDGER CONTROL →</a></div>
        </aside>

        <main className={styles.main}>
          <div className={styles.pageHeader}>
            <div><span className={styles.eyebrow}>{environment?.entity?.displayName || "IXI ENTITY"} · {contextLabel(selectedContext?.kind)}</span><h1>{WORKSPACES.find(([id]) => id === activeWorkspace)?.[1] || "TRAN$ACT"}</h1><p>{selectedContext ? `${selectedContext.title} · ${selectedContext.subtitle}` : "Resolving canonical operating context…"}</p></div>
            <div className={styles.headerActions}><label><span>CURRENT {contextLabel(selectedKind)}</span><select value={selectedContext?.id || ""} onChange={event => setSelectedId(event.target.value)}>{currentGroup.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label><button type="button" onClick={() => setRefreshKey(value => value + 1)}>REFRESH</button></div>
          </div>

          <div className={styles.scopeStrip} aria-label="Financial story scope">{SCOPE_OPTIONS.map(([kind, code, label]) => <button type="button" key={kind} data-active={selectedKind === kind} disabled={!groups[kind]?.length} onClick={() => { setSelectedKind(kind); setSelectedId(groups[kind]?.[0]?.id || ""); }}><span>{code}</span><strong>{label}</strong><b>{groups[kind]?.length || 0}</b></button>)}</div>

          {loading ? <div className={styles.loadingState}><strong>VERIFYING TRAN$ACT SESSION</strong><span>Connecting to your authenticated operating company…</span><small>Unauthenticated sessions return to the secure sign-in automatically.</small></div> : null}
          {!loading && error ? <div className={styles.errorBanner} role="alert"><strong>TRAN$ACT UNAVAILABLE</strong><span>{error}</span><small>No financial values have been fabricated.</small><a className={styles.loginAction} href={TRANSACT_LOGIN_HREF}>LOG IN AND RETURN TO TRAN$ACT</a></div> : null}
          {contextLoading ? <div className={styles.loadingState} role="status"><strong>COMPANY CONNECTED</strong><span>Loading canonical machines and operating records…</span><small>Only IX-Core-admitted Objects and permanent Passports will appear.</small></div> : null}
          {contextError ? <div className={styles.errorBanner} role="alert"><strong>OPERATING CONTEXT INCOMPLETE</strong><span>{contextError}</span><small>The authenticated company remains available; unresolved Objects are not displayed.</small></div> : null}
          {financialError ? <div className={styles.errorBanner} role="alert"><strong>FINANCIAL PROJECTION UNAVAILABLE</strong><span>{financialError}</span><small>Operating context remains visible; accounting completeness is not asserted.</small></div> : null}
          {!loading && !error && selectedContext ? renderWorkspace() : null}
        </main>

        <aside className={styles.contextPanel}>
          <div className={styles.contextTitle}><span>ACTIVE CONTEXT</span><strong>PROOF & LINEAGE</strong></div>
          {selectedContext ? <section className={styles.identityCard}><div className={styles.identityMark}>IXI</div><div><span>{contextLabel(selectedContext.kind)}</span><h2>{selectedContext.title}</h2><p>{selectedContext.status}</p><code>{selectedContext.passportId ? `PASSPORT · ${selectedContext.passportId}` : `OBJECT · ${selectedContext.sourceId}`}</code></div></section> : null}
          <section className={styles.proofCard}>
            <div><span>IDENTITY</span><StatusBadge value={access ? "VERIFIED" : "WAITING"} /></div>
            <div><span>FINANCIAL</span><StatusBadge value={projectionPayload ? "CURRENT" : "NOT PROVEN"} /></div>
            <div><span>SOURCE COVERAGE</span><strong>{projectionPayload ? "SERVER RETURNED" : "NOT RETURNED"}</strong></div>
            <div><span>GENERATED</span><strong>{displayTimestamp(projection?.generatedAt)}</strong></div>
            <div><span>LINEAGE</span><strong>{projection?.lineageVersion || "NOT RETURNED"}</strong></div>
            <div><span>PERIOD</span><strong>{period}</strong></div>
          </section>
          {selectedDetail ? <section className={styles.detailCard}><span>SELECTED WORK</span><h3>{selectedDetail.title}</h3><p>{selectedDetail.detail || selectedDetail.party || "Authoritative record selected for review."}</p>{selectedDetail.status ? <StatusBadge value={selectedDetail.status} /> : null}</section> : null}
          <section className={styles.connectionCard}><div><span>CANONICAL RELATIONSHIPS</span><strong>{related.length}</strong></div>{connections.length ? connections.slice(0, 6).map(item => <p key={item.kind}><span>{item.label}</span><b>{item.count}</b></p>) : <small>No direct relationships returned.</small>}</section>
        </aside>
      </div>

      <footer className={styles.statusbar}><span data-live={Boolean(access && projectionPayload)}>● {access && projectionPayload ? "IXI CORE + FINANCIAL CONNECTED" : "AUTHORITY / PROJECTION INCOMPLETE"}</span><span>{financialLoading ? "REFRESHING AUTHORITATIVE PROJECTION" : `${contextLabel(selectedContext?.kind)} CONTEXT · ${period}`}</span><span>VIEWS NEVER CHANGE POSTED TRUTH</span></footer>
    </div>
  );
}
