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
  getIXIFinancialQueryScope
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
  "Command",
  "Sales / A/R",
  "Buy / A/P",
  "Treasury",
  "GL / Close",
  "Reports / Audit"
];

const clean = value => String(value ?? "").trim();

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

function relativeTime(date) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return "";

  const delta = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.round(delta / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function getRecordCount(projection) {
  if (!projection) return null;
  return projection.ar.records.length + projection.ap.records.length + projection.treasury.accounts.length;
}

function buildMetrics({ context, related, contexts, projection, currency }) {
  const machines = context?.kind === "company"
    ? contexts.filter(item => item.kind === "machine")
    : [context, ...related].filter(item => item?.kind === "machine");
  const work = context?.kind === "company"
    ? contexts.filter(item => item.kind === "work")
    : [context, ...related].filter(item => item?.kind === "work");
  const assetValue = machines.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const attention = projection?.attention?.length ?? null;
  const records = getRecordCount(projection);

  if (context?.kind === "machine") {
    return [
      ["Hours", context.hours === null ? "—" : context.hours.toLocaleString("en-US"), "Current machine record", false],
      ["Machine value", context.value ? formatIXIMoney(context.value, currency) : "—", "Owned listing value", false],
      ["Financial records", records ?? "—", projection ? "Server-returned records" : "Projection unavailable", true],
      ["Attention", attention ?? "—", projection ? "Financial exceptions" : "Projection unavailable", false]
    ];
  }

  if (context?.kind === "person" || context?.kind === "work" || context?.kind === "object") {
    return [
      ["Connected", related.length, "Direct AOS relationships", false],
      ["Work orders", work.length, "Connected operating work", false],
      ["Asset value", assetValue ? formatIXIMoney(assetValue, currency) : "—", "Connected machine value", false],
      ["Financial records", records ?? "—", projection ? "Server-returned records" : "Scope not financially mapped", true]
    ];
  }

  return [
    ["Machines", machines.length, context?.kind === "company" ? "Owned active machine universe" : "Connected to this location", false],
    ["Active work", work.filter(item => !/(CLOSED|COMPLETE|SETTLED)/.test(item.status)).length, "Connected work orders", false],
    [context?.kind === "company" ? "Book cash" : "Asset value", context?.kind === "company"
      ? formatIXIMoney(projection?.executive?.cash, currency)
      : (assetValue ? formatIXIMoney(assetValue, currency) : "—"), context?.kind === "company" ? "Authoritative financial projection" : "Connected machine value", true],
    ["Attention", attention ?? "—", projection ? "Server-returned exceptions" : "Projection unavailable", false]
  ];
}

function buildQueue({ projection, context, related }) {
  const financial = (projection?.attention || []).map((item, index) => ({
    id: item.alertId || item.id || `financial-${index}`,
    title: clean(item.title || item.type || "Financial attention"),
    detail: clean(item.detail || item.description || item.message || "Review the authoritative TRAN$ACT record."),
    value: clean(item.amount || item.value || item.severity || ""),
    href: "/transact/ledger",
    action: "OPEN"
  }));

  const operational = [context, ...related]
    .filter(Boolean)
    .filter(item => /(BLOCK|OVERDUE|PENDING|HOLD|REVIEW|DUE)/.test(item.status))
    .map(item => ({
      id: `aos-${item.id}`,
      title: `${contextLabel(item.kind)} · ${item.status}`,
      detail: item.title,
      value: "",
      href: "/aos/work",
      action: "OPEN"
    }));

  return [...financial, ...operational].slice(0, 8);
}

function connectionSummary(related = []) {
  const groups = related.reduce((summary, item) => {
    const key = item.kind || "object";
    summary[key] = (summary[key] || 0) + 1;
    return summary;
  }, {});

  return Object.entries(groups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([kind, count]) => ({ kind, count, label: `${contextLabel(kind)}${count === 1 ? "" : "S"}` }));
}

function RecordRows({ records, emptyMessage }) {
  if (!records.length) return <div className={styles.empty}>{emptyMessage}</div>;

  return records.slice(0, 12).map(record => (
    <div className={styles.recordRow} key={record.id}>
      <div className={styles.recordCopy}>
        <strong>{record.title}</strong>
        <span>{record.subtitle || contextLabel(record.kind)}</span>
      </div>
      <span className={styles.recordStatus}>{record.status}</span>
    </div>
  ));
}

function mapFinancialRecords(records = [], family = "FINANCIAL") {
  return records.map((item, index) => ({
    id: clean(item.recordId || item.financialDocumentId || item.accountId || item.id || `${family}-${index}`),
    title: clean(item.recordId || item.financialDocumentId || item.accountName || item.name || item.id || family),
    subtitle: clean(item.customerName || item.vendorName || item.partyName || item.label || item.source || family),
    status: clean(item.status || item.paymentStatus || item.state || item.accountType || "ACTIVE").toUpperCase()
  }));
}

export default function IXITransactCommandCenter() {
  const [environment, setEnvironment] = useState(null);
  const [access, setAccess] = useState(null);
  const [projectionPayload, setProjectionPayload] = useState(null);
  const [selectedKind, setSelectedKind] = useState("company");
  const [selectedId, setSelectedId] = useState("");
  const [activeWorkspace, setActiveWorkspace] = useState("Command");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [error, setError] = useState("");
  const [financialError, setFinancialError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [aosResult, accessResult] = await Promise.all([
          loadIXIMosEnvironment({ includeObjects: true }),
          loadIXIFinancialAccessContext({ signal: controller.signal }).catch(() => null)
        ]);

        if (controller.signal.aborted) return;

        if (!aosResult?.isAuthenticated) {
          window.location.assign(`/login?returnTo=${encodeURIComponent("/transact")}`);
          return;
        }

        setEnvironment(aosResult);
        setAccess(accessResult);
      } catch (loadError) {
        if (loadError?.name !== "AbortError") {
          setError(loadError?.message || "IXI TRAN$ACT could not be loaded.");
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
    if (!candidates.length) return;
    if (!candidates.some(item => item.id === selectedId)) setSelectedId(candidates[0].id);
  }, [groups, selectedId, selectedKind]);

  const selectedContext = useMemo(() => (
    contexts.find(item => item.id === selectedId) || groups.company[0] || contexts[0] || null
  ), [contexts, groups.company, selectedId]);

  const related = useMemo(
    () => getIXIAosRelatedContexts(selectedContext, contexts),
    [contexts, selectedContext]
  );

  const accessData = access?.data || {};
  const entityPassportId = clean(
    accessData.defaults?.entityPassportId ||
    accessData.entities?.[0]?.passportId ||
    environment?.entity?.passportId
  );

  useEffect(() => {
    if (!selectedContext || !access) {
      setProjectionPayload(null);
      return undefined;
    }

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
        const financialQuery = buildIXITransactDashboardQuery({
          ...financialScope,
          accountingPeriod: getDefaultIXITransactAccountingPeriod()
        });
        const result = await loadIXITransactDashboard({ query: financialQuery, signal: controller.signal });
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
  }, [access, entityPassportId, selectedContext]);

  const projection = useMemo(
    () => projectionPayload ? normalizeIXITransactDashboardProjection(projectionPayload) : null,
    [projectionPayload]
  );
  const currency = projection?.currency || "USD";
  const metrics = useMemo(() => buildMetrics({ context: selectedContext, related, contexts, projection, currency }), [contexts, currency, projection, related, selectedContext]);
  const queue = useMemo(() => buildQueue({ projection, context: selectedContext, related }), [projection, related, selectedContext]);
  const story = useMemo(() => buildIXIAosRecentStory(selectedContext, contexts), [contexts, selectedContext]);
  const connections = useMemo(() => connectionSummary(related), [related]);
  const currentGroup = groups[selectedKind] || [];

  const searchResults = useMemo(() => {
    const normalized = clean(query).toLowerCase();
    if (normalized.length < 2) return [];
    return contexts.filter(item => `${item.title} ${item.subtitle} ${item.passportId}`.toLowerCase().includes(normalized)).slice(0, 10);
  }, [contexts, query]);

  function selectContext(context) {
    setSelectedKind(context.kind);
    setSelectedId(context.id);
    setQuery("");
  }

  function renderWorkspace() {
    if (activeWorkspace === "Command") {
      return (
        <div className={styles.workspace}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div><span className={styles.sectionLabel}>PRIORITIZED</span><h2>ACTION QUEUE</h2></div>
              <p>{queue.length ? `${queue.length} REQUIRES REVIEW` : "NO SERVER-RETURNED EXCEPTIONS"}</p>
            </div>
            {queue.length ? queue.map((item, index) => (
              <div className={styles.queueRow} key={item.id}>
                <span className={styles.signal} />
                <div className={styles.queueCopy}><strong>{item.title}</strong><span>{item.detail}</span></div>
                <span className={styles.queueValue}>{item.value}</span>
                <a className={styles.openAction} href={item.href}>{item.action}</a>
              </div>
            )) : <div className={styles.empty}>No authoritative financial or operational exceptions were returned for this context.</div>}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div><span className={styles.sectionLabel}>CHRONOLOGY</span><h2>{contextLabel(selectedContext?.kind)} STORY</h2></div>
              <p>RECENT AOS CHANGES</p>
            </div>
            {story.length ? story.map(item => (
              <div className={styles.storyRow} key={item.id}>
                <span className={styles.storyGlyph}>{contextLabel(item.kind).slice(0, 2)}</span>
                <div className={styles.storyCopy}><strong>{item.title}</strong><span>{item.detail}</span></div>
                <span className={styles.storyTime}>{relativeTime(item.updatedAt)}</span>
              </div>
            )) : <div className={styles.empty}>No timestamped AOS records are available in this context yet.</div>}
          </section>
        </div>
      );
    }

    if (activeWorkspace === "Sales / A/R") {
      const records = mapFinancialRecords(projection?.ar?.records || [], "ACCOUNTS RECEIVABLE");
      return (
        <section className={styles.panel}>
          <div className={styles.lensIntro}>
            <div><strong>SALES / ACCOUNTS RECEIVABLE</strong><span>Customer invoices and receivables returned for the selected AOS context.</span></div>
            <a className={styles.primaryAction} href="/transact/ledger">OPEN WORKSPACE</a>
          </div>
          <RecordRows records={records} emptyMessage={financialLoading ? "Loading authoritative receivables…" : "No server-returned receivables are available for this scope."} />
        </section>
      );
    }

    if (activeWorkspace === "Buy / A/P") {
      const records = mapFinancialRecords(projection?.ap?.records || [], "ACCOUNTS PAYABLE");
      return (
        <section className={styles.panel}>
          <div className={styles.lensIntro}>
            <div><strong>BUY / ACCOUNTS PAYABLE</strong><span>Vendor bills, expenses and payables returned for the selected AOS context.</span></div>
            <a className={styles.primaryAction} href="/transact/ledger">OPEN WORKSPACE</a>
          </div>
          <RecordRows records={records} emptyMessage={financialLoading ? "Loading authoritative payables…" : "No server-returned payables are available for this scope."} />
        </section>
      );
    }

    if (activeWorkspace === "Treasury") {
      const records = mapFinancialRecords(projection?.treasury?.accounts || [], "TREASURY");
      return (
        <section className={styles.panel}>
          <div className={styles.lensIntro}>
            <div><strong>TREASURY</strong><span>Book cash, operating accounts and cash-position records in this scope.</span></div>
            <a className={styles.primaryAction} href="/transact/ledger">OPEN WORKSPACE</a>
          </div>
          <RecordRows records={records} emptyMessage={financialLoading ? "Loading authoritative treasury accounts…" : "No server-returned treasury accounts are available for this scope."} />
        </section>
      );
    }

    if (activeWorkspace === "GL / Close") {
      const records = [
        ...mapFinancialRecords(projection?.gl?.exceptions || [], "GL EXCEPTION"),
        ...mapFinancialRecords(projection?.gl?.journals || [], "JOURNAL")
      ];
      return (
        <section className={styles.panel}>
          <div className={styles.lensIntro}>
            <div><strong>GENERAL LEDGER / CLOSE</strong><span>Posting exceptions, journals and close controls remain inside the governed ledger workspace.</span></div>
            <a className={styles.primaryAction} href="/transact/ledger">OPEN WORKSPACE</a>
          </div>
          <RecordRows records={records} emptyMessage={financialLoading ? "Loading authoritative ledger controls…" : "No server-returned journals or close exceptions are available for this scope."} />
        </section>
      );
    }

    const reports = projection?.reports && typeof projection.reports === "object"
      ? Object.entries(projection.reports).map(([key, value]) => ({
          id: `report-${key}`,
          title: clean(value?.title || value?.label || key.replace(/[-_]/g, " ")).toUpperCase(),
          subtitle: clean(value?.description || "Authoritative financial report"),
          status: clean(value?.status || "AVAILABLE").toUpperCase()
        }))
      : [];

    return (
      <section className={styles.panel}>
        <div className={styles.lensIntro}>
          <div><strong>REPORTS / AUDIT</strong><span>Read-only projections, lineage and audit evidence from the authoritative financial system.</span></div>
          <a className={styles.primaryAction} href="/transact/ledger">OPEN WORKSPACE</a>
        </div>
        <RecordRows records={reports} emptyMessage={financialLoading ? "Loading authoritative reports…" : "No server-returned reports are available for this scope."} />
      </section>
    );
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.mark}>IXI</span>
          <div className={styles.brandCopy}><strong>TRAN$ACT</strong><span>FINANCIAL OPERATING SYSTEM</span></div>
        </div>

        <div className={styles.searchWrap}>
          <input
            className={styles.search}
            id="ixi-aos-global-search"
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search any machine, person, location, work order or Passport…"
            aria-label="Search TRAN$ACT context"
            aria-controls="ixi-aos-search-results"
            aria-expanded={searchResults.length > 0}
            onKeyDown={event => {
              if (event.key === "Escape") setQuery("");
            }}
          />
          {searchResults.length ? (
            <div className={styles.searchResults} id="ixi-aos-search-results" role="listbox" aria-label="AOS search results">
              {searchResults.map(result => (
                <button className={styles.searchResult} type="button" role="option" aria-selected="false" key={result.id} onClick={() => selectContext(result)}>
                  <strong>{result.title}</strong><span>{contextLabel(result.kind)}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className={styles.topActions}>
          <a className={styles.topAction} href="/account">ACCOUNT</a>
          <a className={styles.primaryAction} href="/transact/ledger">OPEN LEDGER</a>
        </div>
      </header>

      <div className={styles.desktop}>
        <aside className={styles.scopeRail}>
          <span className={styles.scopeLabel}>FINANCIAL STORY THROUGH</span>
          <div className={styles.scopeList}>
            {SCOPE_OPTIONS.map(([kind, code, label]) => (
              <button
                className={styles.scopeButton}
                type="button"
                key={kind}
                data-active={selectedKind === kind}
                disabled={!groups[kind]?.length}
                onClick={() => {
                  setSelectedKind(kind);
                  setSelectedId(groups[kind]?.[0]?.id || "");
                }}
              >
                <span className={styles.scopeCode}>{code}</span>
                <span>{label}</span>
                <span className={styles.scopeCount}>{groups[kind]?.length || 0}</span>
              </button>
            ))}
          </div>
          <hr className={styles.railRule} />
          <span className={styles.scopeLabel}>SYSTEMS</span>
          <nav className={styles.railLinks} aria-label="IXI systems">
            <a href="/aos/work">AOS WORK</a>
            <a href="/transact/ledger">LEDGER / CLOSE</a>
            <a href="/account/my-listings-v2">INVENTORY</a>
            <a href="/browse-v2">MARKETPLACE</a>
            <a href="/auction-market">AUCTION</a>
          </nav>
        </aside>

        <main className={styles.main}>
          {loading ? <div className={styles.statusMessage}>Loading the canonical AOS and TRAN$ACT environment…</div> : null}
          {!loading && error ? <div className={styles.errorMessage} role="alert">{error}</div> : null}
          {!loading && !error && selectedContext ? (
            <>
              <div className={styles.contextHeader}>
                <div>
                  <span className={styles.eyebrow}>{environment?.entity?.displayName || "IXI ENTITY"} · {contextLabel(selectedContext.kind)}</span>
                  <h1>{selectedContext.title}</h1>
                  <p>{selectedContext.subtitle} · {selectedContext.status}</p>
                </div>
                <label className={styles.contextControl}>
                  <span className={styles.scopeLabel}>CURRENT {contextLabel(selectedKind)}</span>
                  <select className={styles.contextSelect} value={selectedContext.id} onChange={event => setSelectedId(event.target.value)}>
                    {currentGroup.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}
                  </select>
                </label>
              </div>

              <div className={styles.lenses} role="tablist" aria-label="TRAN$ACT workspace">
                {WORKSPACES.map(workspace => (
                  <button
                    className={styles.lens}
                    type="button"
                    role="tab"
                    key={workspace}
                    aria-controls="ixi-aos-lens-panel"
                    aria-selected={activeWorkspace === workspace}
                    data-active={activeWorkspace === workspace}
                    onClick={() => setActiveWorkspace(workspace)}
                  >{workspace.toUpperCase()}</button>
                ))}
              </div>

              {financialError && activeWorkspace === "Command" ? <div className={styles.statusMessage}>TRAN$ACT projection unavailable: {financialError}</div> : null}

              <section className={styles.metrics} aria-label="Current context metrics">
                {metrics.map(([label, value, note, financial]) => (
                  <div className={styles.metric} data-financial={financial} key={label}>
                    <span className={styles.metricLabel}>{label}</span>
                    <strong>{financialLoading && financial ? "…" : value}</strong>
                    <p>{note}</p>
                  </div>
                ))}
              </section>

              <div id="ixi-aos-lens-panel" role="tabpanel" aria-live="polite">
                {renderWorkspace()}
              </div>
            </>
          ) : null}
        </main>

        {selectedContext ? (
          <aside className={styles.contextPanel}>
            <section className={styles.identity}>
              <div className={styles.identityVisual}>IXI</div>
              <div className={styles.identityBody}>
                <strong>{selectedContext.title}</strong>
                <span>{contextLabel(selectedContext.kind)} · {selectedContext.status}</span>
                <span className={styles.passport}>{selectedContext.passportId ? `PASSPORT · ${selectedContext.passportId}` : "PASSPORT · NOT ASSIGNED"}</span>
              </div>
            </section>
            <section className={styles.connections}>
              <h2>CONNECTED</h2>
              {connections.length ? connections.map(item => (
                <div className={styles.connection} key={item.kind}>
                  <span className={styles.connectionGlyph}>{contextLabel(item.kind).slice(0, 2)}</span>
                  <div className={styles.connectionCopy}><strong>{item.label}</strong><span>Direct AOS relationship</span></div>
                  <span className={styles.connectionCount}>{item.count}</span>
                </div>
              )) : <div className={styles.empty}>No direct relationships returned.</div>}
            </section>
          </aside>
        ) : null}
      </div>

      <footer className={styles.statusbar}>
        <span className={styles.connected}>IXI CORE CONNECTED</span>
        <span>{selectedContext ? `${contextLabel(selectedContext.kind)} CONTEXT · ${activeWorkspace.toUpperCase()} WORKSPACE` : "LOADING CONTEXT"}</span>
      </footer>
    </div>
  );
}
