import { useEffect, useMemo, useState } from "react";

import {
  closeIXITransactAccountingPeriod,
  createIXITransactJournalEntry,
  loadIXITransactGL
} from "./data/IXITransactDashboardClient";


const EPSILON = 0.005;


function clean(value) {
  return String(value ?? "").trim();
}


function safeArray(value) {
  return Array.isArray(value) ? value : [];
}


function number(value) {
  const resolved = Number(value);
  return Number.isFinite(resolved) ? resolved : 0;
}


function money(value, currency = "USD") {
  const resolved = Number(value);

  if (!Number.isFinite(resolved)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: clean(currency || "USD").toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(resolved);
}


function makeCommandId(prefix = "ixi-transact-desktop") {
  const cryptoObject = typeof window !== "undefined" ? window.crypto : null;

  if (cryptoObject?.randomUUID) {
    return `${prefix}-${cryptoObject.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}


function todayForPeriod(period = "") {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  if (!/^\d{4}-\d{2}$/.test(clean(period))) {
    return today;
  }

  if (today.startsWith(`${period}-`)) {
    return today;
  }

  return `${period}-01`;
}


function createBlankLine(side = "debit") {
  return {
    accountCode: "",
    accountName: "",
    description: "",
    debit: side === "debit" ? "" : "",
    credit: side === "credit" ? "" : ""
  };
}


function normalizeGLPayload(payload) {
  const data = payload?.data || {};
  const projection = data?.projection || {};

  return {
    payload,
    entityPassportId: clean(data?.entityPassportId || data?.scope?.entityPassportId),
    actorPassportId: clean(data?.scope?.actorPassportId),
    storageProvider: clean(data?.storageProvider),
    lineage: data?.lineage || {},
    projection: {
      schema: clean(projection?.schema),
      generatedAt: clean(projection?.generatedAt),
      currency: clean(projection?.currency || "USD").toUpperCase(),
      period: projection?.period || {},
      counts: projection?.counts || {},
      journal: safeArray(projection?.journal),
      trialBalance: projection?.trialBalance || {},
      profitAndLoss: projection?.profitAndLoss || {},
      endingTrialBalance: projection?.endingTrialBalance || {},
      cumulativeProfitAndLoss: projection?.cumulativeProfitAndLoss || {},
      balanceSheet: projection?.balanceSheet || {},
      controls: projection?.controls || {}
    }
  };
}


function StatusPill({ good, children, neutral = false }) {
  return (
    <span className={`status-pill ${neutral ? "neutral" : good ? "good" : "bad"}`}>
      {children}
    </span>
  );
}


function Metric({ label, value, detail = "", emphasis = false }) {
  return (
    <div className={`gl-metric ${emphasis ? "emphasis" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
  );
}


function LedgerTable({ title, subtitle, rows, currency }) {
  const resolvedRows = safeArray(rows);

  return (
    <section className="gl-panel">
      <header className="panel-head">
        <div>
          <span>{subtitle}</span>
          <strong>{title}</strong>
        </div>
        <b>{resolvedRows.length} ACCOUNTS</b>
      </header>

      <div className="table-scroll compact-table">
        <table>
          <thead>
            <tr>
              <th>ACCOUNT</th>
              <th>NAME</th>
              <th>TYPE</th>
              <th className="num">DEBIT</th>
              <th className="num">CREDIT</th>
              <th className="num">BALANCE</th>
            </tr>
          </thead>
          <tbody>
            {resolvedRows.length ? resolvedRows.map(row => (
              <tr key={`${row.accountCode}-${row.accountName}`}>
                <td><strong>{row.accountCode || "—"}</strong></td>
                <td>{row.accountName || "Unclassified"}</td>
                <td>{clean(row.accountType || "—").toUpperCase()}</td>
                <td className="num">{money(row.debit, currency)}</td>
                <td className="num">{money(row.credit, currency)}</td>
                <td className="num">{money(row.balance, currency)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="empty-cell">No ledger activity in this population.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}


function StatementRow({ label, value, currency, strong = false }) {
  return (
    <div className={`statement-row ${strong ? "strong" : ""}`}>
      <span>{label}</span>
      <b>{money(value, currency)}</b>
    </div>
  );
}


function JournalRegister({ journals, currency }) {
  const rows = safeArray(journals);

  return (
    <section className="gl-panel journal-panel">
      <header className="panel-head">
        <div>
          <span>PERIOD ACTIVITY</span>
          <strong>JOURNAL REGISTER</strong>
        </div>
        <b>{rows.length} JOURNALS</b>
      </header>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>DOCUMENT</th>
              <th>DATE</th>
              <th>DESCRIPTION</th>
              <th>STATUS</th>
              <th className="num">DEBITS</th>
              <th className="num">CREDITS</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map(document => (
              <tr key={document.financialDocumentId}>
                <td>
                  <strong>{document.documentNumber || "JOURNAL"}</strong>
                  <small className="document-id">{document.financialDocumentId}</small>
                </td>
                <td>{document.documentDate || document.occurredAt || "—"}</td>
                <td>{document.description || "—"}</td>
                <td>{clean(document.status || document.financialState || "—").toUpperCase()}</td>
                <td className="num">{money(document?.accounting?.totalDebit ?? document?.totals?.debit, currency)}</td>
                <td className="num">{money(document?.accounting?.totalCredit ?? document?.totals?.credit, currency)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="empty-cell">No posted journals in this period.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}


function JournalComposer({ period, currency, closed, onCancel, onCommitted }) {
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentDate, setDocumentDate] = useState(() => todayForPeriod(period));
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState([
    createBlankLine("debit"),
    createBlankLine("credit")
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setDocumentDate(todayForPeriod(period));
  }, [period]);

  const totals = useMemo(() => {
    const debit = lines.reduce((sum, line) => sum + number(line.debit), 0);
    const credit = lines.reduce((sum, line) => sum + number(line.credit), 0);

    return {
      debit,
      credit,
      difference: Math.round((debit - credit) * 100) / 100,
      balanced: debit > 0 && credit > 0 && Math.abs(debit - credit) < EPSILON
    };
  }, [lines]);

  function updateLine(index, field, value) {
    setLines(current => current.map((line, lineIndex) => {
      if (lineIndex !== index) return line;

      const next = {
        ...line,
        [field]: value
      };

      if (field === "debit" && number(value) > 0) {
        next.credit = "";
      }

      if (field === "credit" && number(value) > 0) {
        next.debit = "";
      }

      return next;
    }));
  }

  function addLine() {
    setLines(current => [...current, createBlankLine()]);
  }

  function removeLine(index) {
    setLines(current => current.length <= 2 ? current : current.filter((_, lineIndex) => lineIndex !== index));
  }

  async function submit(event) {
    event.preventDefault();
    setError(null);

    if (closed) {
      setError(new Error("This accounting period is closed. A journal cannot be posted from TRAN$ACT Desktop."));
      return;
    }

    if (!/^\d{4}-\d{2}$/.test(clean(period))) {
      setError(new Error("A valid accounting period is required."));
      return;
    }

    if (!clean(documentDate).startsWith(`${period}-`)) {
      setError(new Error("Journal date must belong to the selected accounting period."));
      return;
    }

    const normalizedLines = lines
      .map(line => ({
        accountCode: clean(line.accountCode),
        accountName: clean(line.accountName),
        description: clean(line.description || description || line.accountName),
        debit: number(line.debit),
        credit: number(line.credit)
      }))
      .filter(line => line.accountCode || line.accountName || line.debit || line.credit);

    if (normalizedLines.length < 2) {
      setError(new Error("A journal entry requires at least two accounting lines."));
      return;
    }

    const incomplete = normalizedLines.find(line => !line.accountCode || !line.accountName || (line.debit <= 0 && line.credit <= 0));

    if (incomplete) {
      setError(new Error("Every journal line requires an account code, account name, and a debit or credit amount."));
      return;
    }

    if (!totals.balanced) {
      setError(new Error(`Journal is not balanced. Difference: ${money(totals.difference, currency)}.`));
      return;
    }

    const commandId = makeCommandId("ixi-desktop-journal");

    try {
      setBusy(true);

      const result = await createIXITransactJournalEntry(
        {
          documentNumber: clean(documentNumber),
          financialState: "posted",
          status: "posted",
          currency: clean(currency || "USD").toUpperCase(),
          occurredAt: clean(documentDate),
          documentDate: clean(documentDate),
          period: clean(period),
          description: clean(description || "TRAN$ACT Desktop Journal Entry"),
          sourceSystem: "ixi-transact-desktop",
          references: [],
          lines: normalizedLines.map(line => ({
            ...line,
            category: "general-ledger",
            costCode: line.accountCode,
            currency: clean(currency || "USD").toUpperCase(),
            occurredAt: clean(documentDate),
            references: []
          })),
          metadata: {
            transactSurface: "desktop",
            accountingScope: "entity"
          }
        },
        {
          commandId,
          idempotencyKey: commandId,
          metadata: {
            transactSurface: "desktop",
            accountingScope: "entity"
          }
        }
      );

      await onCommitted?.(result);
    } catch (submitError) {
      setError(submitError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="composer-shell">
      <form onSubmit={submit}>
        <header className="composer-head">
          <div>
            <span>ENTITY-SCOPED ACCOUNTING COMMAND</span>
            <strong>NEW JOURNAL ENTRY</strong>
            <small>Posting writes canonical Financial truth to AWS. Object Passport references are optional on Desktop.</small>
          </div>
          <button type="button" className="ghost-button" onClick={onCancel} disabled={busy}>CANCEL</button>
        </header>

        {closed ? (
          <div className="closed-warning">
            <strong>PERIOD CLOSED</strong>
            <span>{period} is closed. Posting is disabled.</span>
          </div>
        ) : null}

        {error ? (
          <div className="composer-error">
            <strong>{error.code || "JOURNAL NOT POSTED"}</strong>
            <span>{error.message}</span>
          </div>
        ) : null}

        <div className="journal-header-grid">
          <label>
            <span>DOCUMENT NUMBER</span>
            <input value={documentNumber} onChange={event => setDocumentNumber(event.target.value)} placeholder="Optional / server ID still assigned" />
          </label>
          <label>
            <span>DATE</span>
            <input type="date" value={documentDate} onChange={event => setDocumentDate(event.target.value)} required />
          </label>
          <label className="description-field">
            <span>DESCRIPTION</span>
            <input value={description} onChange={event => setDescription(event.target.value)} placeholder="Journal purpose / memo" />
          </label>
        </div>

        <div className="entry-grid-wrap">
          <table className="entry-grid">
            <thead>
              <tr>
                <th>ACCOUNT CODE</th>
                <th>ACCOUNT NAME</th>
                <th>LINE DESCRIPTION</th>
                <th className="num">DEBIT</th>
                <th className="num">CREDIT</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={index}>
                  <td><input value={line.accountCode} onChange={event => updateLine(index, "accountCode", event.target.value)} placeholder="1010" /></td>
                  <td><input value={line.accountName} onChange={event => updateLine(index, "accountName", event.target.value)} placeholder="Account name" /></td>
                  <td><input value={line.description} onChange={event => updateLine(index, "description", event.target.value)} placeholder="Optional line memo" /></td>
                  <td><input className="amount-input" inputMode="decimal" value={line.debit} onChange={event => updateLine(index, "debit", event.target.value)} placeholder="0.00" /></td>
                  <td><input className="amount-input" inputMode="decimal" value={line.credit} onChange={event => updateLine(index, "credit", event.target.value)} placeholder="0.00" /></td>
                  <td><button type="button" className="line-remove" onClick={() => removeLine(index)} disabled={lines.length <= 2}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="composer-footer">
          <button type="button" className="ghost-button" onClick={addLine} disabled={busy}>+ ADD LINE</button>

          <div className="journal-totals">
            <span>DEBITS <b>{money(totals.debit, currency)}</b></span>
            <span>CREDITS <b>{money(totals.credit, currency)}</b></span>
            <span className={totals.balanced ? "balanced" : "unbalanced"}>
              DIFFERENCE <b>{money(totals.difference, currency)}</b>
            </span>
          </div>

          <button type="submit" className="post-button" disabled={busy || closed || !totals.balanced}>
            {busy ? "POSTING…" : "POST JOURNAL"}
          </button>
        </div>
      </form>
    </section>
  );
}


export default function IXITransactGLWorkspace({
  period,
  currency = "USD",
  refreshKey = 0,
  onCommitted
}) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [localRefresh, setLocalRefresh] = useState(0);
  const [closeBusy, setCloseBusy] = useState(false);
  const [closeError, setCloseError] = useState(null);
  const [closeResult, setCloseResult] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await loadIXITransactGL({
          period,
          currency,
          signal: controller.signal
        });

        if (!controller.signal.aborted) {
          setPayload(result);
        }
      } catch (loadError) {
        if (loadError?.name !== "AbortError" && !controller.signal.aborted) {
          setError(loadError);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => controller.abort();
  }, [period, currency, refreshKey, localRefresh]);

  useEffect(() => {
    setCloseError(null);
    setCloseResult(null);
    setComposerOpen(false);
  }, [period, currency]);

  const gl = useMemo(() => normalizeGLPayload(payload), [payload]);
  const projection = gl.projection;
  const periodState = projection.period || {};
  const counts = projection.counts || {};
  const periodTB = projection.trialBalance || {};
  const endingTB = projection.endingTrialBalance || {};
  const pnl = projection.profitAndLoss || {};
  const cumulativePnl = projection.cumulativeProfitAndLoss || {};
  const balanceSheet = projection.balanceSheet || {};
  const controls = projection.controls || {};
  const resolvedCurrency = projection.currency || clean(currency || "USD").toUpperCase();
  const periodIsClosed = periodState.closed === true;
  const periodIsValid = /^\d{4}-\d{2}$/.test(clean(period));
  const closeReady = Boolean(
    payload &&
    periodIsValid &&
    !periodIsClosed &&
    controls.ready === true &&
    periodTB.balanced === true &&
    endingTB.balanced === true &&
    balanceSheet.balanced === true &&
    Number(controls.postingExceptions || 0) === 0 &&
    Number(controls.endingPostingExceptions || 0) === 0
  );

  async function handleCommitted(result) {
    setComposerOpen(false);
    setLocalRefresh(value => value + 1);
    await onCommitted?.(result);
  }

  async function handleClosePeriod() {
    setCloseError(null);
    setCloseResult(null);

    if (!periodIsValid) {
      const validationError = new Error("A valid YYYY-MM accounting period is required before close.");
      validationError.code = "IXI_FINANCIAL_PERIOD_REQUIRED";
      setCloseError(validationError);
      return;
    }

    if (periodIsClosed) {
      const validationError = new Error(`${period} is already closed.`);
      validationError.code = "IXI_FINANCIAL_PERIOD_ALREADY_CLOSED";
      setCloseError(validationError);
      return;
    }

    if (!closeReady) {
      const validationError = new Error("Server-returned GL controls are not ready for close. Resolve all balance and posting exceptions first.");
      validationError.code = "IXI_FINANCIAL_CLOSE_NOT_READY";
      setCloseError(validationError);
      return;
    }

    const confirmed = typeof window !== "undefined"
      ? window.confirm(
          `Close accounting period ${period} in ${resolvedCurrency}?\n\nIX-Core will re-run authoritative close controls and, if they pass, persist the period-close control document. New postings to this period will then be rejected server-side.`
        )
      : false;

    if (!confirmed) {
      return;
    }

    const commandId = makeCommandId(`ixi-close-${period}`);

    try {
      setCloseBusy(true);

      const result = await closeIXITransactAccountingPeriod({
        period,
        currency: resolvedCurrency,
        commandId,
        idempotencyKey: commandId,
        metadata: {
          transactSurface: "desktop",
          accountingScope: "entity",
          periodControl: "close"
        }
      });

      setCloseResult(result);
      setComposerOpen(false);
      setLocalRefresh(value => value + 1);
      await onCommitted?.(result);
    } catch (closeFailure) {
      setCloseError(closeFailure);
    } finally {
      setCloseBusy(false);
    }
  }

  const effectiveCloseDocumentId = clean(
    periodState.closeDocumentId ||
    closeResult?.closeDocumentId ||
    closeResult?.financialDocument?.financialDocumentId
  );

  const effectiveClosedAt = clean(
    periodState.closedAt ||
    closeResult?.period?.closedAt ||
    closeResult?.financialDocument?.closedAt
  );

  const effectiveClosedBy = clean(
    periodState.closedBy ||
    closeResult?.period?.closedBy ||
    closeResult?.financialDocument?.closedBy
  );

  return (
    <div className="gl-workspace">
      <div className="gl-commandbar">
        <div>
          <span>GENERAL LEDGER / ENTITY BOOKS</span>
          <strong>{period || "ALL PERIODS"}</strong>
          <small>{gl.entityPassportId || "ENTITY RESOLVED SERVER-SIDE"} · {gl.storageProvider || "AWS"}</small>
        </div>

        <div className="command-actions">
          <StatusPill good={!periodIsClosed} neutral={!payload}>
            {periodIsClosed ? "CLOSED" : "OPEN"}
          </StatusPill>
          <StatusPill good={controls.ready === true} neutral={!payload}>
            {controls.ready === true ? "CONTROLS READY" : "CONTROL REVIEW"}
          </StatusPill>
          <button
            type="button"
            className="close-period-button"
            onClick={handleClosePeriod}
            disabled={loading || closeBusy || periodIsClosed || !closeReady}
            title={closeReady ? `Close ${period}` : "Close is enabled only when authoritative GL controls are ready."}
          >
            {closeBusy ? "CLOSING…" : periodIsClosed ? "PERIOD CLOSED" : "CLOSE PERIOD"}
          </button>
          <button
            type="button"
            className="new-journal-button"
            onClick={() => setComposerOpen(true)}
            disabled={loading || closeBusy || periodIsClosed}
          >
            + NEW JOURNAL ENTRY
          </button>
        </div>
      </div>

      {closeError ? (
        <div className="close-error">
          <strong>{closeError.code || "PERIOD NOT CLOSED"}</strong>
          <span>{closeError.message}</span>
          <small>IX-Core remains authoritative. No close state is assumed unless the server confirms it.</small>
        </div>
      ) : null}

      {periodIsClosed ? (
        <div className="close-evidence">
          <div>
            <span>PERIOD CONTROL</span>
            <strong>{period} CLOSED</strong>
          </div>
          <div>
            <span>CLOSE DOCUMENT</span>
            <strong>{effectiveCloseDocumentId || "SERVER CONFIRMED"}</strong>
          </div>
          <div>
            <span>CLOSED AT</span>
            <strong>{effectiveClosedAt || "—"}</strong>
          </div>
          <div>
            <span>CLOSED BY</span>
            <strong>{effectiveClosedBy || "—"}</strong>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="gl-error">
          <strong>{error.code || "IXI GENERAL LEDGER ERROR"}</strong>
          <span>{error.message}</span>
          <small>No accounting values are fabricated when the authoritative AWS projection is unavailable.</small>
        </div>
      ) : null}

      {composerOpen ? (
        <JournalComposer
          period={period}
          currency={resolvedCurrency}
          closed={periodIsClosed}
          onCancel={() => setComposerOpen(false)}
          onCommitted={handleCommitted}
        />
      ) : null}

      <div className={loading ? "gl-body loading" : "gl-body"}>
        <div className="gl-metrics">
          <Metric label="PERIOD NET INCOME" value={money(pnl.netIncome, resolvedCurrency)} detail="Current accounting period" emphasis />
          <Metric label="PERIOD DEBITS" value={money(periodTB.debits, resolvedCurrency)} detail={`${counts.journals || 0} posted journals`} />
          <Metric label="PERIOD CREDITS" value={money(periodTB.credits, resolvedCurrency)} detail={`${counts.sourceDocuments || 0} source documents`} />
          <Metric label="ENDING DEBITS" value={money(endingTB.debits, resolvedCurrency)} detail={`${counts.throughPeriodJournals || 0} journals through period`} />
          <Metric label="ENDING CREDITS" value={money(endingTB.credits, resolvedCurrency)} detail={`${counts.throughPeriodDocuments || 0} documents through period`} />
          <Metric label="CUMULATIVE EARNINGS" value={money(cumulativePnl.netIncome, resolvedCurrency)} detail={balanceSheet.balanced ? "Balance sheet balanced" : "Balance sheet review required"} />
        </div>

        <div className="control-strip">
          <div><span>PERIOD</span><strong>{periodState.status?.toUpperCase?.() || "OPEN"}</strong></div>
          <div><span>PERIOD TB</span><strong>{periodTB.balanced ? "BALANCED" : "OUT OF BALANCE"}</strong></div>
          <div><span>ENDING TB</span><strong>{endingTB.balanced ? "BALANCED" : "OUT OF BALANCE"}</strong></div>
          <div><span>BALANCE SHEET</span><strong>{balanceSheet.balanced ? "BALANCED" : "OUT OF BALANCE"}</strong></div>
          <div><span>POSTING EXCEPTIONS</span><strong>{controls.postingExceptions || 0}</strong></div>
          <div><span>AS-OF EXCEPTIONS</span><strong>{controls.endingPostingExceptions || 0}</strong></div>
        </div>

        <JournalRegister journals={projection.journal} currency={resolvedCurrency} />

        <div className="ledger-columns">
          <LedgerTable
            title="PERIOD TRIAL BALANCE"
            subtitle="CURRENT-PERIOD ACTIVITY"
            rows={periodTB.rows}
            currency={resolvedCurrency}
          />
          <LedgerTable
            title="ENDING TRIAL BALANCE"
            subtitle="AS-OF PERIOD END"
            rows={endingTB.rows}
            currency={resolvedCurrency}
          />
        </div>

        <div className="statement-columns">
          <section className="gl-panel statement-panel">
            <header className="panel-head">
              <div><span>PERIOD PERFORMANCE</span><strong>PROFIT & LOSS</strong></div>
            </header>
            <div className="statement-body">
              <StatementRow label="Revenue" value={pnl.revenue} currency={resolvedCurrency} />
              <StatementRow label="Cost of Goods Sold" value={pnl.cogs} currency={resolvedCurrency} />
              <StatementRow label="Gross Profit" value={pnl.grossProfit} currency={resolvedCurrency} strong />
              <StatementRow label="Operating Expense" value={pnl.operatingExpense} currency={resolvedCurrency} />
              <StatementRow label="Net Income" value={pnl.netIncome} currency={resolvedCurrency} strong />
            </div>
          </section>

          <section className="gl-panel statement-panel">
            <header className="panel-head">
              <div><span>ENDING POSITION</span><strong>BALANCE SHEET</strong></div>
              <b>{balanceSheet.balanced ? "BALANCED" : "REVIEW"}</b>
            </header>
            <div className="statement-body">
              <StatementRow label="Assets" value={balanceSheet.assets} currency={resolvedCurrency} />
              <StatementRow label="Liabilities" value={balanceSheet.liabilities} currency={resolvedCurrency} />
              <StatementRow label="Contributed Equity" value={balanceSheet.contributedEquity} currency={resolvedCurrency} />
              <StatementRow label="Cumulative Earnings" value={balanceSheet.currentEarnings} currency={resolvedCurrency} />
              <StatementRow label="Total Equity" value={balanceSheet.equity} currency={resolvedCurrency} strong />
              <StatementRow label="Liabilities + Equity" value={balanceSheet.liabilitiesAndEquity} currency={resolvedCurrency} strong />
              <StatementRow label="Difference" value={balanceSheet.difference} currency={resolvedCurrency} strong />
            </div>
          </section>
        </div>
      </div>

      <style jsx>{`
        .gl-workspace { display: grid; gap: 14px; color: #f2f4f5; }
        .gl-commandbar { min-height: 68px; padding: 12px 14px; border: 1px solid rgba(255,255,255,.08); border-radius: 8px; background: linear-gradient(180deg,#111313,#0c0e0e); display: flex; align-items: center; justify-content: space-between; gap: 20px; }
        .gl-commandbar > div:first-child { display: grid; gap: 3px; }
        .gl-commandbar span, .panel-head span, .gl-metric span, .control-strip span, label span, .close-evidence span { color: rgba(255,255,255,.4); font-size: 8px; font-weight: 900; letter-spacing: .1em; }
        .gl-commandbar strong { font-size: 17px; }
        .gl-commandbar small { color: rgba(255,255,255,.38); font-size: 9px; }
        .command-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
        :global(.status-pill) { display: inline-flex; min-height: 28px; box-sizing: border-box; align-items: center; padding: 0 9px; border-radius: 999px; border: 1px solid rgba(255,255,255,.1); font-size: 8px; font-weight: 950; letter-spacing: .06em; }
        :global(.status-pill.good) { color: #65e894; border-color: rgba(101,232,148,.25); background: rgba(101,232,148,.07); }
        :global(.status-pill.bad) { color: #ff8d8d; border-color: rgba(255,141,141,.25); background: rgba(255,141,141,.07); }
        :global(.status-pill.neutral) { color: rgba(255,255,255,.55); }
        .new-journal-button, .post-button, .close-period-button { min-height: 32px; padding: 0 12px; border-radius: 5px; font-size: 8px; font-weight: 950; letter-spacing: .05em; cursor: pointer; }
        .new-journal-button, .post-button { border: 1px solid #ffc400; background: #ffc400; color: #090909; }
        .close-period-button { border: 1px solid rgba(255,141,141,.5); background: rgba(255,91,91,.08); color: #ff9c9c; }
        .close-period-button:not(:disabled):hover { border-color: #ff8d8d; background: rgba(255,91,91,.14); }
        button:disabled { opacity: .4; cursor: not-allowed; }
        .gl-error, .composer-error, .closed-warning, .close-error { padding: 11px 13px; border-radius: 7px; display: grid; gap: 3px; }
        .gl-error, .composer-error, .close-error { border: 1px solid rgba(255,91,91,.25); background: rgba(255,91,91,.055); }
        .closed-warning { border: 1px solid rgba(255,196,0,.24); background: rgba(255,196,0,.06); }
        .gl-error strong, .composer-error strong, .close-error strong { color: #ff8d8d; font-size: 9px; }
        .closed-warning strong { color: #ffc400; font-size: 9px; }
        .gl-error span, .composer-error span, .closed-warning span, .close-error span { font-size: 11px; }
        .gl-error small, .close-error small { color: rgba(255,255,255,.4); font-size: 9px; }
        .close-evidence { min-height: 58px; padding: 10px 13px; border: 1px solid rgba(101,232,148,.2); border-radius: 7px; background: rgba(101,232,148,.045); display: grid; grid-template-columns: 1fr 1.6fr 1.4fr 1fr; gap: 12px; align-items: center; }
        .close-evidence > div { min-width: 0; display: grid; gap: 3px; }
        .close-evidence strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #dfffea; font-size: 9px; }
        .gl-body { display: grid; gap: 14px; }
        .gl-body.loading { opacity: .45; pointer-events: none; }
        .gl-metrics { display: grid; grid-template-columns: repeat(6,minmax(0,1fr)); gap: 8px; }
        :global(.gl-metric) { min-width: 0; min-height: 76px; box-sizing: border-box; padding: 12px; border: 1px solid rgba(255,255,255,.075); border-radius: 7px; background: #0d0f0f; display: grid; align-content: center; gap: 5px; }
        :global(.gl-metric.emphasis) { border-color: rgba(255,196,0,.24); background: linear-gradient(180deg,rgba(255,196,0,.07),#0d0f0f); }
        :global(.gl-metric strong) { font-size: 18px; letter-spacing: -.035em; overflow: hidden; text-overflow: ellipsis; }
        :global(.gl-metric small) { color: rgba(255,255,255,.34); font-size: 8px; }
        .control-strip { min-height: 44px; padding: 0 12px; border: 1px solid rgba(255,255,255,.065); border-radius: 7px; background: #0b0d0d; display: grid; grid-template-columns: repeat(6,minmax(0,1fr)); align-items: center; }
        .control-strip > div { min-width: 0; padding: 0 10px; border-right: 1px solid rgba(255,255,255,.055); display: grid; gap: 2px; }
        .control-strip > div:last-child { border-right: 0; }
        .control-strip strong { font-size: 9px; overflow: hidden; text-overflow: ellipsis; }
        .gl-panel, .composer-shell { min-width: 0; border: 1px solid rgba(255,255,255,.075); border-radius: 8px; background: #0d0f0f; overflow: hidden; }
        .panel-head { min-height: 50px; padding: 0 13px; border-bottom: 1px solid rgba(255,255,255,.06); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .panel-head > div { display: grid; gap: 2px; }
        .panel-head strong { font-size: 11px; }
        .panel-head b { color: #ffc400; font-size: 8px; }
        .ledger-columns, .statement-columns { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 12px; }
        .table-scroll { overflow: auto; max-height: 360px; }
        .compact-table { max-height: 410px; }
        table { width: 100%; border-collapse: collapse; font-size: 9px; }
        th { position: sticky; top: 0; z-index: 1; padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,.07); background: #111313; color: rgba(255,255,255,.36); text-align: left; font-size: 7px; letter-spacing: .07em; white-space: nowrap; }
        td { padding: 9px 10px; border-bottom: 1px solid rgba(255,255,255,.045); color: rgba(255,255,255,.66); vertical-align: top; }
        td strong { color: white; }
        .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .document-id { display: block; margin-top: 3px; color: rgba(255,255,255,.3); font-size: 7px; }
        .empty-cell { padding: 24px 10px; text-align: center; color: rgba(255,255,255,.35); }
        .statement-body { padding: 5px 14px 10px; }
        :global(.statement-row) { min-height: 34px; border-bottom: 1px solid rgba(255,255,255,.05); display: flex; align-items: center; justify-content: space-between; gap: 20px; font-size: 10px; }
        :global(.statement-row span) { color: rgba(255,255,255,.55); }
        :global(.statement-row b) { font-variant-numeric: tabular-nums; }
        :global(.statement-row.strong) { min-height: 39px; color: white; font-weight: 900; }
        .composer-shell { border-color: rgba(255,196,0,.18); }
        .composer-head { min-height: 62px; padding: 10px 13px; border-bottom: 1px solid rgba(255,255,255,.06); display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .composer-head > div { display: grid; gap: 2px; }
        .composer-head span { color: #ffc400; font-size: 8px; font-weight: 900; letter-spacing: .09em; }
        .composer-head strong { font-size: 13px; }
        .composer-head small { color: rgba(255,255,255,.38); font-size: 9px; }
        .ghost-button { min-height: 30px; padding: 0 10px; border: 1px solid rgba(255,255,255,.1); border-radius: 5px; background: #111313; color: rgba(255,255,255,.68); font-size: 8px; font-weight: 900; cursor: pointer; }
        .composer-error, .closed-warning { margin: 10px 12px 0; }
        .journal-header-grid { padding: 12px; display: grid; grid-template-columns: 190px 160px minmax(260px,1fr); gap: 10px; }
        label { min-width: 0; display: grid; gap: 5px; }
        input { width: 100%; height: 33px; box-sizing: border-box; border: 1px solid rgba(255,255,255,.1); border-radius: 5px; background: #101212; color: white; padding: 0 8px; outline: none; font: inherit; font-size: 10px; }
        input:focus { border-color: rgba(255,196,0,.55); box-shadow: 0 0 0 2px rgba(255,196,0,.05); }
        .entry-grid-wrap { overflow-x: auto; border-top: 1px solid rgba(255,255,255,.055); border-bottom: 1px solid rgba(255,255,255,.055); }
        .entry-grid { min-width: 900px; }
        .entry-grid th:nth-child(1) { width: 110px; }
        .entry-grid th:nth-child(2) { width: 210px; }
        .entry-grid th:nth-child(4), .entry-grid th:nth-child(5) { width: 130px; }
        .entry-grid th:last-child { width: 34px; }
        .entry-grid td { padding: 6px; }
        .entry-grid input { border-color: rgba(255,255,255,.075); background: #0a0c0c; }
        .amount-input { text-align: right; font-variant-numeric: tabular-nums; }
        .line-remove { width: 26px; height: 26px; border: 0; border-radius: 4px; background: rgba(255,255,255,.05); color: rgba(255,255,255,.45); cursor: pointer; }
        .composer-footer { min-height: 58px; padding: 8px 12px; display: flex; align-items: center; gap: 12px; }
        .journal-totals { margin-left: auto; display: flex; align-items: center; gap: 18px; }
        .journal-totals span { color: rgba(255,255,255,.4); font-size: 8px; font-weight: 900; }
        .journal-totals b { margin-left: 5px; color: white; font-size: 10px; font-variant-numeric: tabular-nums; }
        .journal-totals .balanced b { color: #65e894; }
        .journal-totals .unbalanced b { color: #ff8d8d; }
        @media (max-width: 1500px) { .gl-metrics { grid-template-columns: repeat(3,minmax(0,1fr)); } .control-strip { grid-template-columns: repeat(3,minmax(0,1fr)); row-gap: 8px; padding: 9px 12px; } .control-strip > div:nth-child(3) { border-right: 0; } }
        @media (max-width: 1100px) { .gl-commandbar { align-items: flex-start; flex-direction: column; } .command-actions { justify-content: flex-start; } .close-evidence { grid-template-columns: 1fr 1fr; } .ledger-columns, .statement-columns { grid-template-columns: 1fr; } .journal-header-grid { grid-template-columns: 1fr; } .journal-totals { width: 100%; margin-left: 0; order: 3; justify-content: space-between; } .composer-footer { flex-wrap: wrap; } }
      `}</style>
    </div>
  );
}
