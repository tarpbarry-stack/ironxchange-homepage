import { useEffect, useMemo, useState } from "react";

import {
  buildIXITransactDashboardQuery,
  getDefaultIXITransactAccountingPeriod
} from "./data/IXITransactDashboardQueryContract";

import {
  loadIXIFinancialAccessContext,
  loadIXITransactDashboard
} from "./data/IXITransactDashboardClient";

import {
  normalizeIXITransactDashboardProjection
} from "./data/IXITransactDashboardProjectionAdapter";

import IXITransactGLWorkspace from "./IXITransactGLWorkspace";


const WORKSPACES = [
  ["executive", "EXECUTIVE"],
  ["ar", "A/R"],
  ["ap", "A/P"],
  ["treasury", "TREASURY"],
  ["gl", "GL / CLOSE"],
  ["reporting", "REPORTING"]
];


function money(value, currency = "USD") {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(Number(value));
}


function Metric({ label, value, currency, text = false }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{text ? (value || "—") : money(value, currency)}</strong>
    </div>
  );
}


function GenericRecordTable({ title, records, currency }) {
  const rows = Array.isArray(records) ? records.slice(0, 50) : [];

  return (
    <section className="workspace-panel">
      <div className="panel-title">
        <div>
          <span>WORK QUEUE</span>
          <strong>{title}</strong>
        </div>
        <b>{rows.length} SHOWN</b>
      </div>

      {rows.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>RECORD</th>
                <th>PARTY / SOURCE</th>
                <th>STATUS</th>
                <th>DUE / DATE</th>
                <th className="right">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((record, index) => {
                const id = record.recordId || record.financialDocumentId || record.id || `ROW-${index + 1}`;
                const party = record.customerName || record.vendorName || record.partyName || record.label || record.source || "—";
                const status = record.status || record.paymentStatus || record.state || "—";
                const date = record.dueDate || record.dueAt || record.date || record.postedAt || "—";
                const amount = record.openBalance ?? record.amount ?? record.total ?? record.balance;

                return (
                  <tr key={`${id}-${index}`}>
                    <td><strong>{id}</strong></td>
                    <td>{party}</td>
                    <td>{status}</td>
                    <td>{date}</td>
                    <td className="right">{money(Number(amount), currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">No server-returned records in this scope.</div>
      )}
    </section>
  );
}


function Executive({ projection }) {
  const e = projection.executive;
  const currency = projection.currency;

  return (
    <>
      <div className="metrics-grid">
        <Metric label="REVENUE" value={e.revenue} currency={currency} />
        <Metric label="NET INCOME" value={e.netIncome} currency={currency} />
        <Metric label="BOOK CASH" value={e.cash} currency={currency} />
        <Metric label="OPEN A/R" value={e.openAr} currency={currency} />
        <Metric label="OPEN A/P" value={e.openAp} currency={currency} />
        <Metric label="CLOSE" value={e.closeReadiness} text />
      </div>

      <div className="two-column">
        <section className="workspace-panel">
          <div className="panel-title">
            <div><span>BALANCE SHEET</span><strong>POSITION</strong></div>
          </div>
          <div className="position-grid">
            <Metric label="ASSETS" value={e.assets} currency={currency} />
            <Metric label="LIABILITIES" value={e.liabilities} currency={currency} />
            <Metric label="EQUITY" value={e.equity} currency={currency} />
            <Metric label="OVERDUE A/R" value={e.overdueAr} currency={currency} />
          </div>
        </section>

        <section className="workspace-panel">
          <div className="panel-title">
            <div><span>ATTENTION</span><strong>CONTROL CENTER</strong></div>
            <b>{projection.attention.length}</b>
          </div>
          <div className="attention-list">
            {projection.attention.length ? projection.attention.slice(0, 12).map((alert, index) => (
              <div className="attention-row" key={alert.alertId || index}>
                <span>{alert.severity || "INFO"}</span>
                <strong>{alert.title || alert.type || "ATTENTION"}</strong>
                <p>{alert.detail || ""}</p>
              </div>
            )) : <div className="empty">No server-returned attention items.</div>}
          </div>
        </section>
      </div>
    </>
  );
}


export default function IXITransactDashboardApp() {
  const [workspace, setWorkspace] = useState("executive");
  const [period, setPeriod] = useState(getDefaultIXITransactAccountingPeriod());
  const [access, setAccess] = useState(null);
  const [projectionPayload, setProjectionPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const projection = useMemo(
    () => normalizeIXITransactDashboardProjection(projectionPayload || {}),
    [projectionPayload]
  );

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const accessPayload = await loadIXIFinancialAccessContext({ signal: controller.signal });
        setAccess(accessPayload);

        const defaults = accessPayload?.data?.defaults || {};
        const entityPassportId = defaults.entityPassportId || accessPayload?.data?.entities?.[0]?.passportId || "";

        const query = buildIXITransactDashboardQuery({
          entityPassportIds: entityPassportId ? [entityPassportId] : [],
          accountingPeriod: period
        });

        const dashboardPayload = await loadIXITransactDashboard({
          query,
          signal: controller.signal
        });

        setProjectionPayload(dashboardPayload);
      } catch (loadError) {
        if (loadError?.name !== "AbortError") {
          setError(loadError);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [period, refreshKey]);

  const accessData = access?.data || {};
  const actor = accessData.actor || {};
  const permissions = Array.isArray(accessData.permissions) ? accessData.permissions : [];
  const denied = Array.isArray(accessData.deniedPermissions) ? accessData.deniedPermissions : [];

  let body = null;

  if (workspace === "executive") {
    body = <Executive projection={projection} />;
  } else if (workspace === "ar") {
    body = <GenericRecordTable title="ACCOUNTS RECEIVABLE" records={projection.ar.records} currency={projection.currency} />;
  } else if (workspace === "ap") {
    body = <GenericRecordTable title="ACCOUNTS PAYABLE" records={projection.ap.records} currency={projection.currency} />;
  } else if (workspace === "treasury") {
    body = <GenericRecordTable title="TREASURY ACCOUNTS" records={projection.treasury.accounts} currency={projection.currency} />;
  } else if (workspace === "gl") {
    body = (
      <IXITransactGLWorkspace
        period={period}
        currency={projection.currency || "USD"}
        refreshKey={refreshKey}
        onCommitted={() => setRefreshKey(value => value + 1)}
      />
    );
  } else {
    body = (
      <section className="workspace-panel">
        <div className="panel-title"><div><span>REPORTING</span><strong>FINANCIAL REPORTS</strong></div></div>
        <pre className="report-contract">{JSON.stringify(projection.reports, null, 2)}</pre>
      </section>
    );
  }

  return (
    <div className="transact-desktop">
      <aside className="sidebar">
        <div className="brand">
          <span>IXI</span>
          <strong>TRAN$ACT</strong>
          <small>FINANCIAL OPERATING SYSTEM</small>
        </div>

        <nav>
          {WORKSPACES.map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={workspace === id ? "active" : ""}
              onClick={() => setWorkspace(id)}
            >
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="security-card">
          <span>AUTHORITY</span>
          <strong>{actor.passportId || "AUTHENTICATED"}</strong>
          <small>{permissions.length} GRANTS · {denied.length} DENIES</small>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <span>IXI FINANCIAL / AWS</span>
            <h1>{WORKSPACES.find(([id]) => id === workspace)?.[1] || "TRAN$ACT"}</h1>
          </div>

          <div className="scope-controls">
            <label>
              <span>ACCOUNTING PERIOD</span>
              <input
                type="month"
                value={period}
                onChange={event => setPeriod(event.target.value)}
              />
            </label>
            <button type="button" onClick={() => setRefreshKey(value => value + 1)}>
              REFRESH
            </button>
          </div>
        </header>

        <div className="status-strip">
          <div>
            <span className={access ? "dot green" : "dot"} />
            <b>IDENTITY</b>
            <small>{access ? "VERIFIED" : "WAITING"}</small>
          </div>
          <div>
            <span className={projectionPayload ? "dot green" : "dot"} />
            <b>FINANCIAL</b>
            <small>{projectionPayload ? "PROJECTION LIVE" : "NO PROJECTION"}</small>
          </div>
          <div>
            <b>ENTITY</b>
            <small>{accessData.defaults?.entityPassportId || accessData.entities?.[0]?.passportId || "SERVER DEFAULT"}</small>
          </div>
          <div>
            <b>GENERATED</b>
            <small>{projection.generatedAt || "—"}</small>
          </div>
        </div>

        {error ? (
          <div className="error-banner">
            <strong>{error.code || "IXI FINANCIAL ERROR"}</strong>
            <span>{error.message}</span>
            <small>Financial values are intentionally not fabricated while the authoritative server projection is unavailable.</small>
          </div>
        ) : null}

        <section className={loading ? "content loading" : "content"}>
          {body}
        </section>
      </main>

      <style jsx>{`
        :global(html), :global(body), :global(#__next) { min-height: 100%; background: #070808; }
        :global(body) { margin: 0; }
        .transact-desktop { min-height: 100vh; display: grid; grid-template-columns: 230px minmax(0, 1fr); background: #070808; color: #f3f5f6; font-family: Inter, Arial, sans-serif; }
        .sidebar { position: sticky; top: 0; height: 100vh; box-sizing: border-box; padding: 24px 16px; border-right: 1px solid rgba(255,255,255,.08); background: linear-gradient(180deg,#0d0f0f,#080909); display: flex; flex-direction: column; gap: 24px; }
        .brand { display: grid; gap: 2px; padding: 0 8px 18px; border-bottom: 1px solid rgba(255,255,255,.07); }
        .brand span { color: #ffc400; font-size: 11px; font-weight: 900; letter-spacing: .18em; }
        .brand strong { font-size: 25px; letter-spacing: -.04em; }
        .brand small, .security-card small { color: rgba(255,255,255,.38); font-size: 8px; font-weight: 800; letter-spacing: .08em; }
        nav { display: grid; gap: 5px; }
        nav button { height: 42px; padding: 0 12px; border: 1px solid transparent; border-radius: 6px; background: transparent; color: rgba(255,255,255,.55); text-align: left; font-size: 10px; font-weight: 900; letter-spacing: .05em; cursor: pointer; }
        nav button:hover { background: rgba(255,255,255,.035); color: white; }
        nav button.active { border-color: rgba(255,196,0,.28); background: rgba(255,196,0,.08); color: #ffc400; }
        .security-card { margin-top: auto; padding: 12px; border: 1px solid rgba(255,255,255,.07); border-radius: 7px; display: grid; gap: 5px; }
        .security-card span { color: #ffc400; font-size: 8px; font-weight: 900; }
        .security-card strong { overflow: hidden; text-overflow: ellipsis; font-size: 10px; }
        main { min-width: 0; }
        .topbar { min-height: 88px; padding: 18px 28px; border-bottom: 1px solid rgba(255,255,255,.08); display: flex; align-items: center; justify-content: space-between; gap: 20px; background: rgba(10,11,11,.96); }
        .topbar span, label span, .panel-title span { color: rgba(255,255,255,.38); font-size: 8px; font-weight: 900; letter-spacing: .12em; }
        h1 { margin: 3px 0 0; font-size: 26px; letter-spacing: -.04em; }
        .scope-controls { display: flex; align-items: flex-end; gap: 8px; }
        label { display: grid; gap: 5px; }
        input, .scope-controls button { height: 34px; box-sizing: border-box; border: 1px solid rgba(255,255,255,.1); border-radius: 5px; background: #111313; color: white; padding: 0 10px; font: inherit; }
        .scope-controls button { background: #ffc400; color: #090909; border-color: #ffc400; font-size: 8px; font-weight: 950; cursor: pointer; }
        .status-strip { min-height: 42px; padding: 0 28px; display: flex; align-items: center; gap: 28px; border-bottom: 1px solid rgba(255,255,255,.06); background: #0b0c0c; }
        .status-strip > div { display: flex; align-items: center; gap: 6px; }
        .status-strip b { font-size: 8px; letter-spacing: .08em; }
        .status-strip small { color: rgba(255,255,255,.42); font-size: 8px; }
        .dot { width: 6px; height: 6px; border-radius: 50%; background: #666; }
        .dot.green { background: #58e58a; box-shadow: 0 0 8px rgba(88,229,138,.4); }
        .error-banner { margin: 18px 28px 0; padding: 12px 14px; border: 1px solid rgba(255,91,91,.28); border-radius: 7px; background: rgba(255,91,91,.06); display: grid; gap: 3px; }
        .error-banner strong { color: #ff8585; font-size: 9px; letter-spacing: .08em; }
        .error-banner span { font-size: 12px; }
        .error-banner small { color: rgba(255,255,255,.42); }
        .content { padding: 22px 28px 50px; display: grid; gap: 18px; }
        .content.loading { opacity: .56; }
        .metrics-grid { display: grid; grid-template-columns: repeat(6,minmax(0,1fr)); gap: 10px; }
        .metric { min-width: 0; padding: 14px; border: 1px solid rgba(255,255,255,.075); border-radius: 7px; background: #0d0f0f; display: grid; gap: 7px; }
        .metric span { color: rgba(255,255,255,.38); font-size: 8px; font-weight: 900; letter-spacing: .08em; }
        .metric strong { overflow: hidden; text-overflow: ellipsis; font-size: 20px; letter-spacing: -.04em; }
        .two-column { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 14px; }
        .workspace-panel { min-width: 0; border: 1px solid rgba(255,255,255,.075); border-radius: 8px; background: #0d0f0f; overflow: hidden; }
        .panel-title { min-height: 52px; padding: 0 15px; border-bottom: 1px solid rgba(255,255,255,.065); display: flex; align-items: center; justify-content: space-between; gap: 14px; }
        .panel-title > div { display: grid; gap: 2px; }
        .panel-title strong { font-size: 12px; }
        .panel-title b { color: #ffc400; font-size: 9px; }
        .position-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 1px; background: rgba(255,255,255,.05); }
        .position-grid .metric { border: 0; border-radius: 0; }
        .attention-list { max-height: 330px; overflow: auto; }
        .attention-row { padding: 11px 14px; border-bottom: 1px solid rgba(255,255,255,.05); display: grid; grid-template-columns: 70px 1fr; gap: 4px 10px; }
        .attention-row span { color: #ffc400; font-size: 8px; font-weight: 900; }
        .attention-row strong { font-size: 10px; }
        .attention-row p { grid-column: 2; margin: 0; color: rgba(255,255,255,.48); font-size: 10px; }
        .table-wrap { overflow: auto; max-height: calc(100vh - 245px); }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th { position: sticky; top: 0; z-index: 1; padding: 9px 12px; border-bottom: 1px solid rgba(255,255,255,.07); background: #101212; color: rgba(255,255,255,.35); text-align: left; font-size: 7px; letter-spacing: .08em; }
        td { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,.045); color: rgba(255,255,255,.66); }
        td strong { color: white; }
        .right { text-align: right; }
        .empty { padding: 24px 14px; color: rgba(255,255,255,.35); font-size: 10px; }
        .report-contract { margin: 0; padding: 16px; min-height: 280px; overflow: auto; color: rgba(255,255,255,.65); font-size: 10px; }
        @media (max-width: 1500px) { .metrics-grid { grid-template-columns: repeat(3,minmax(0,1fr)); } }
        @media (max-width: 1100px) { .transact-desktop { grid-template-columns: 78px minmax(0,1fr); } .brand strong, .brand small, nav button span, .security-card { display: none; } .brand span { text-align: center; } nav button { padding: 0; text-align: center; } .two-column { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
