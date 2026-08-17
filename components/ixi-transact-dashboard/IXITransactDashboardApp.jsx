import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import IXITransactDashboardNavigation from "./IXITransactDashboardNavigation";
import IXITransactDashboardHeader from "./IXITransactDashboardHeader";
import IXITransactDashboardStyles from "./IXITransactDashboardStyles";
import IXIExecutiveDashboard from "./executive/IXIExecutiveDashboard";
import { createIXITransactDashboardQuery } from "./data/IXITransactDashboardQueryContract";
import { loadIXITransactDashboardProjection } from "./data/IXITransactDashboardClient";
import { createIXIExecutiveDesktopModel, getIXIProjectionFreshness } from "./data/IXITransactDashboardProjectionAdapter";

const clean = value => String(value ?? "").trim();

function Placeholder({ workspace }) {
  const label = clean(workspace).replace(/-/g, " ").toUpperCase();
  return (
    <div className="td-workspace-placeholder">
      <div className="td-workspace-title">
        <div><span>IXI TRAN$ACT · V13 DESKTOP</span><h1>{label}</h1></div>
      </div>
      <div className="td-empty-state">
        <span>WORKSPACE FOUNDATION ACTIVE</span>
        <strong>{label}</strong>
        <p>This workspace is intentionally not populated with local or fabricated financial truth. It will consume the same canonical IXI Financial projections and TRAN$ACT domain engines as the V13 modules.</p>
      </div>
    </div>
  );
}

function RecordDrawer({ record, onClose }) {
  if (!record) return null;
  const recordId = clean(record.sourceRecordId || record.recordId || record.alertId || record.key || record.passportId);
  return (
    <>
      <button type="button" className="td-drawer-backdrop" aria-label="Close record inspector" onClick={onClose} />
      <aside className="td-record-drawer" aria-label="Record inspector">
        <div className="td-drawer-head">
          <div>
            <span>IXI SOURCE INSPECTOR</span>
            <strong>{record.title || record.label || record.name || recordId || "CANONICAL RECORD"}</strong>
            <small>{record.sourceRecordType || record.dimension || record.type || "TRAN$ACT RECORD"} {recordId ? `· ${recordId}` : ""}</small>
          </div>
          <button type="button" onClick={onClose}>CLOSE</button>
        </div>
        <div className="td-drawer-body">
          <div className="td-drawer-field"><span>RECORD ID</span><strong>{recordId || "NOT PROVIDED BY PROJECTION"}</strong></div>
          <div className="td-drawer-field"><span>WORKSPACE</span><strong>{clean(record.workspace || "SOURCE")}</strong></div>
          <div className="td-drawer-field"><span>DETAIL</span><strong>{record.detail || record.description || "Open the canonical source record for complete detail and authorized actions."}</strong></div>
          <div className="td-drawer-note">The desktop inspector preserves queue context. It does not create a duplicate financial record. Full commands must continue through canonical TRAN$ACT/AOS command layers and AWS authority.</div>
        </div>
      </aside>
    </>
  );
}

export default function IXITransactDashboardApp({
  entityPassportIds = [],
  entityLabel = "",
  accountingPeriod = "",
  from = "",
  through = "",
  locationPassportIds = [],
  locationLabel = "ALL LOCATIONS",
  currency = "USD",
  apiBaseUrl = "",
  initialWorkspace = "executive",
  initialProjection = null
}) {
  const [workspace, setWorkspace] = useState(initialWorkspace || "executive");
  const [projection, setProjection] = useState(initialProjection);
  const [status, setStatus] = useState(initialProjection ? "current" : "idle");
  const [error, setError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const requestRef = useRef(null);

  const queryKey = JSON.stringify({ entityPassportIds, locationPassportIds, from, through, accountingPeriod, currency });
  const query = useMemo(() => createIXITransactDashboardQuery({
    scope: { entityPassportIds, locationPassportIds },
    period: { from, through, accountingPeriod },
    currency,
    filters: {},
    include: ["executive", "attention", "ar", "ap", "treasury", "gl-controls", "reporting"]
  }), [queryKey]);

  const hasEntityScope = entityPassportIds.some(Boolean);
  const hasPeriod = Boolean(clean(accountingPeriod || through));

  const loadProjection = useCallback(async () => {
    if (!hasEntityScope || !hasPeriod) return;
    requestRef.current?.abort?.();
    const controller = new AbortController();
    requestRef.current = controller;
    setStatus(current => current === "idle" ? "loading" : "refreshing");
    setError("");
    try {
      const result = await loadIXITransactDashboardProjection({ query, apiBaseUrl, signal: controller.signal });
      setProjection(result);
      setStatus(result.status || "current");
    } catch (cause) {
      if (cause?.name === "AbortError") return;
      setError(cause?.message || "IXI Financial projection unavailable.");
      setStatus("error");
    }
  }, [hasEntityScope, hasPeriod, query, apiBaseUrl]);

  useEffect(() => {
    if (!initialProjection) loadProjection();
    return () => requestRef.current?.abort?.();
  }, [loadProjection, initialProjection]);

  const executiveModel = useMemo(() => createIXIExecutiveDesktopModel(projection || {}), [projection]);
  const freshness = useMemo(() => {
    if (status === "error") return { label: "ERROR", state: "stale" };
    if (status === "loading") return { label: "LOADING", state: "aging" };
    if (status === "refreshing") return { label: "REFRESHING", state: "aging" };
    return getIXIProjectionFreshness(executiveModel);
  }, [executiveModel, status]);

  const handleSearch = value => {
    const q = clean(value);
    if (!q) return;
    setSelectedRecord({
      title: q,
      sourceRecordId: q,
      type: "search",
      detail: "Global deterministic record search requires the server search projection. No local financial records are being guessed."
    });
  };

  let content = null;
  if (!hasEntityScope) {
    content = <div className="td-empty-state"><span>FINANCIAL SCOPE REQUIRED</span><strong>SELECT AN AUTHORIZED ENTITY</strong><p>IXI TRAN$ACT will not show company financial numbers until an authorized entity Passport has been resolved.</p></div>;
  } else if (!hasPeriod) {
    content = <div className="td-empty-state"><span>ACCOUNTING PERIOD REQUIRED</span><strong>SELECT PERIOD / AS-OF DATE</strong><p>Reporting semantics are period-aware. The dashboard will not invent a default reporting period when none is supplied.</p></div>;
  } else if (!projection && (status === "loading" || status === "refreshing")) {
    content = <div className="td-empty-state"><span>IXI FINANCIAL</span><strong>LOADING VERIFIED PROJECTION</strong><p>Entity, period and financial control projections are being requested from AWS IXI Financial.</p></div>;
  } else if (status === "error" && !projection) {
    content = <div className="td-empty-state"><span>PROJECTION UNAVAILABLE</span><strong>NO FINANCIAL TRUTH DISPLAYED</strong><p>{error || "IXI Financial dashboard projection is unavailable."}</p><button type="button" onClick={loadProjection}>RETRY IXI FINANCIAL</button></div>;
  } else if (workspace === "executive") {
    content = <IXIExecutiveDashboard model={executiveModel} onOpenRecord={setSelectedRecord} />;
  } else {
    content = <Placeholder workspace={workspace} />;
  }

  return (
    <div className="ixi-transact-desktop">
      <IXITransactDashboardNavigation activeWorkspace={workspace} onSelect={setWorkspace} />
      <IXITransactDashboardHeader
        entityLabel={entityLabel || entityPassportIds[0] || "ENTITY"}
        accountingPeriod={accountingPeriod || through}
        locationLabel={locationLabel}
        freshness={freshness}
        generatedAt={executiveModel.generatedAt}
        attentionCount={executiveModel.attention?.length || 0}
        onRefresh={loadProjection}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearch={handleSearch}
      />
      <main className="td-main">
        {status === "error" && projection ? <div className="td-drawer-note">STALE / LAST USABLE PROJECTION · Refresh failed: {error}</div> : null}
        {content}
      </main>
      <RecordDrawer record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      <IXITransactDashboardStyles />
    </div>
  );
}
