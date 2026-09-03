import { useEffect, useMemo, useState } from "react";
import { createIXIGLChart } from "../general-ledger/IXIGeneralLedgerContract";
import { loadIXITransactGL } from "../../../financial-runtime/IXITransactDesktopClient";
import { hydrateIXIGLProjection } from "../general-ledger/IXIGeneralLedgerProjectionAdapter";
import { getIXIGeneralLedgerPolicy } from "../general-ledger/IXIGeneralLedgerPolicyEngine";
import {
  buildIXIIncomeStatement, buildIXIBalanceSheet, buildIXICashFlow,
  buildIXIProfitability, buildIXITrialBalanceReport, buildIXIFinancialExecutiveSummary
} from "./IXIFinancialReportingEngine";
import IXIFinancialReportingStyles from "./IXIFinancialReportingStyles";

const clean = value => String(value ?? "").trim();
const money = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value || 0));
function previousPeriod(period = "") {
  const match = /^(\d{4})-(\d{2})$/.exec(period);
  if (!match) return "";
  let year = Number(match[1]), month = Number(match[2]) - 1;
  if (month === 0) { year -= 1; month = 12; }
  return `${year}-${String(month).padStart(2, "0")}`;
}

export default function IXIFinancialReportingApp({ context = {}, object = {}, journals = [], chart = null, periods = [], language = "en", onBack = null }) {
  const entityPassportId = clean(context.entity?.passportId || context.primary?.passportId || object.passportId);
  const policy = useMemo(() => getIXIGeneralLedgerPolicy({ context }), [context]);
  const latest = useMemo(() => {
    const values = [...periods.map(item => clean(item.period || item.identity?.number)), ...journals.map(item => clean(item.period))].filter(Boolean).sort();
    return values.at(-1) || new Date().toISOString().slice(0, 7);
  }, [periods, journals]);
  const [fromPeriod, setFromPeriod] = useState(latest);
  const [toPeriod, setToPeriod] = useState(latest);
  const [lang, setLang] = useState(language === "es" ? "es" : "en");
  const [mode, setMode] = useState("exec");
  const [dimension, setDimension] = useState("assetPassportId");
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!policy.canViewReports) return undefined;
    const controller = new AbortController();
    setLoading(true);
    loadIXITransactGL({ period: toPeriod, currency: "USD", signal: controller.signal })
      .then(result => { setLive(hydrateIXIGLProjection(result)); setError(""); })
      .catch(cause => { if (cause?.name !== "AbortError") setError(clean(cause?.message) || "Authoritative financial reporting could not be loaded."); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [policy.canViewReports, toPeriod]);

  const resolvedJournals = live?.journals || journals;
  const resolvedChart = live?.chart?.accounts?.length ? live.chart : (chart || createIXIGLChart({ entityPassportId }));
  const prior = previousPeriod(toPeriod);
  const summary = useMemo(() => buildIXIFinancialExecutiveSummary({ journals: resolvedJournals, chart: resolvedChart, fromPeriod, toPeriod, priorFromPeriod: prior, priorToPeriod: prior }), [resolvedJournals, resolvedChart, fromPeriod, toPeriod, prior]);
  const income = summary.income;
  const balance = live?.balanceSheet || summary.balance;
  const cash = useMemo(() => buildIXICashFlow({ journals: resolvedJournals, chart: resolvedChart, fromPeriod, toPeriod }), [resolvedJournals, resolvedChart, fromPeriod, toPeriod]);
  const trial = live?.endingTrialBalance || buildIXITrialBalanceReport({ journals: resolvedJournals, chart: resolvedChart, throughPeriod: toPeriod });
  const profit = useMemo(() => buildIXIProfitability({ journals: resolvedJournals, chart: resolvedChart, fromPeriod, toPeriod, dimension }), [resolvedJournals, resolvedChart, fromPeriod, toPeriod, dimension]);
  const closed = live?.period?.status === "closed";
  const locked = !policy.canViewReports;
  const C = lang === "es"
    ? { title: "REPORTES FINANCIEROS", exec: "RESUMEN", pl: "PyG", bs: "BALANCE", cash: "FLUJO", profit: "RENTABILIDAD", trial: "BALANZA", back: "‹ TRAN$ACT" }
    : { title: "FINANCIAL REPORTING", exec: "EXEC", pl: "P&L", bs: "BALANCE", cash: "CASH FLOW", profit: "PROFITABILITY", trial: "TRIAL", back: "‹ TRAN$ACT" };
  const lines = (rows = [], sign = 1) => rows.length ? rows.map(row => <div className="fr-line" key={row.accountCode}><span>{row.accountCode}</span><span>{row.accountName}</span><b>{money((row.balance || 0) * sign)}</b></div>) : <div className="fr-empty">NO POSTED ACTIVITY</div>;

  return <div className="ixi-fin-report">
    <div className="fr-head"><div><div className="fr-kicker">IXI TRAN$ACT · AWS IXI FINANCIAL</div><strong>{C.title}</strong><small>{context.entity?.label || context.primary?.label || "ENTITY"} · {live ? "IX CORE / DYNAMODB" : locked ? "ACCESS CONTROLLED" : "CONNECTING"}</small></div><button className="fr-lang" onClick={() => setLang(lang === "en" ? "es" : "en")}>{lang === "en" ? "ESP" : "ENG"}</button></div>
    <div className="fr-period"><div className="fr-field"><label>PERIOD</label><input value={toPeriod} onChange={event => { setToPeriod(event.target.value); setFromPeriod(event.target.value); }} placeholder="YYYY-MM" /></div><div className="fr-field"><label>CURRENCY</label><input value="USD" readOnly /></div></div>
    {error ? <div className="fr-callout fr-bad">{error}</div> : null}
    {locked ? <div className="fr-callout">FINANCIAL REPORTING IS DENY-BY-DEFAULT. AUTHENTICATED REPORTING OR GENERAL LEDGER VIEW AUTHORITY IS REQUIRED.</div> : <>
      <div className="fr-metrics"><div className="fr-metric"><span>REVENUE</span><strong>{money(income.totalRevenue)}</strong></div><div className={`fr-metric ${income.netIncome >= 0 ? "fr-good" : "fr-bad"}`}><span>NET INCOME</span><strong>{money(income.netIncome)}</strong></div><div className="fr-metric"><span>CASH CHANGE</span><strong>{money(cash.netChange)}</strong></div><div className={`fr-metric ${balance.balanced ? "fr-good" : "fr-bad"}`}><span>BALANCE SHEET</span><strong>{balance.balanced ? "BALANCED" : "OUT"}</strong></div></div>
      <div className="fr-tabs"><button className={mode === "exec" ? "on" : ""} onClick={() => setMode("exec")}>{C.exec}</button><button className={mode === "pl" ? "on" : ""} onClick={() => setMode("pl")}>{C.pl}</button><button className={mode === "bs" ? "on" : ""} onClick={() => setMode("bs")}>{C.bs}</button><button className={mode === "cash" ? "on" : ""} onClick={() => setMode("cash")}>{C.cash}</button><button className={mode === "profit" ? "on" : ""} onClick={() => setMode("profit")}>{C.profit}</button><button className={mode === "trial" ? "on" : ""} onClick={() => setMode("trial")}>{C.trial}</button></div>
      {loading ? <div className="fr-empty">READING AUTHORITATIVE IX CORE PROJECTION...</div> :
      mode === "exec" ? <><div className="fr-section">EXECUTIVE SUMMARY</div><div className="fr-row"><div className="fr-rowhead"><strong>REVENUE</strong><b>{money(income.totalRevenue)}</b></div><small>POSTED JOURNALS, INCLUDING CONTROLLED REVERSALS · {toPeriod}</small></div><div className="fr-row"><div className="fr-rowhead"><strong>NET INCOME</strong><b>{money(income.netIncome)}</b></div><small>MARGIN {income.marginPercent}%</small></div><div className="fr-row"><div className="fr-rowhead"><strong>ASSETS</strong><b>{money(balance.totalAssets)}</b></div><small>LIABILITIES {money(balance.totalLiabilities)} · EQUITY {money(balance.totalEquity)}</small></div><div className="fr-section">REPORT INTEGRITY</div><div className="fr-callout">{closed ? `CLOSED PERIOD · ${live.period.close?.closedAt || ""}` : "OPEN PERIOD · LIVE REPORTING"}<br />TRIAL BALANCE {trial.balanced ? "BALANCED ✓" : "OUT OF BALANCE"}<br />SERVER CALCULATED · BROWSER CALCULATED: NO</div></> :
      mode === "pl" ? <><div className="fr-section">REVENUE</div>{lines(income.revenue)}<div className="fr-total"><span>TOTAL REVENUE</span><strong>{money(income.totalRevenue)}</strong></div><div className="fr-section">EXPENSES</div>{lines(income.expenses)}<div className="fr-total"><span>NET INCOME</span><strong>{money(income.netIncome)}</strong></div></> :
      mode === "bs" ? <><div className="fr-section">ASSETS</div>{lines(balance.assets)}<div className="fr-total"><span>TOTAL ASSETS</span><strong>{money(balance.totalAssets)}</strong></div><div className="fr-section">LIABILITIES</div>{lines(balance.liabilities)}<div className="fr-section">EQUITY</div>{lines(balance.equity)}<div className={`fr-callout ${balance.balanced ? "fr-good" : "fr-bad"}`}>DIFFERENCE {money(balance.difference)} · {balance.balanced ? "BALANCED ✓" : "REVIEW REQUIRED"}</div></> :
      mode === "cash" ? <><div className="fr-section">CASH FLOW FROM POSTED JOURNALS</div><div className="fr-row"><div className="fr-rowhead"><strong>OPERATING</strong><b>{money(cash.operating)}</b></div></div><div className="fr-row"><div className="fr-rowhead"><strong>INVESTING</strong><b>{money(cash.investing)}</b></div></div><div className="fr-row"><div className="fr-rowhead"><strong>FINANCING</strong><b>{money(cash.financing)}</b></div></div><div className="fr-total"><span>NET CASH CHANGE</span><strong>{money(cash.netChange)}</strong></div><div className="fr-callout">INTERNAL TRANSFERS EXCLUDED {cash.internalTransfersExcluded} · UNCLASSIFIED {money(cash.unclassified)}</div></> :
      mode === "profit" ? <><div className="fr-section">PROFITABILITY DIMENSION</div><div className="fr-field"><label>GROUP BY</label><select value={dimension} onChange={event => setDimension(event.target.value)}><option value="assetPassportId">ASSET / PASSPORT</option><option value="locationPassportId">LOCATION</option><option value="customerPassportId">CUSTOMER</option><option value="workOrderId">WORK ORDER</option></select></div>{profit.length ? <div className="fr-grid3">{profit.slice(0, 12).map(row => <div className="fr-profit" key={row.key}><strong>{row.key}</strong><span>REV {money(row.revenue)}</span><span>COST {money(row.expense)}</span><b>{money(row.netIncome)}</b></div>)}</div> : <div className="fr-empty">NO DIMENSIONAL POSTED ACTIVITY</div>}</> :
      <><div className="fr-section">ENDING TRIAL BALANCE</div>{trial.rows?.length ? trial.rows.map(row => <div className="fr-line" key={row.accountCode}><span>{row.accountCode}</span><span>{row.accountName}</span><b>{money(Number(row.debit || 0) - Number(row.credit || 0))}</b></div>) : <div className="fr-empty">NO POSTED JOURNALS</div>}<div className="fr-total"><span>DEBITS</span><strong>{money(trial.debits)}</strong></div><div className="fr-total"><span>CREDITS</span><strong>{money(trial.credits)}</strong></div><div className={`fr-callout ${trial.balanced ? "fr-good" : "fr-bad"}`}>DIFFERENCE {money(trial.difference)}</div></>}
    </>}
    <button className="fr-back" onClick={() => onBack?.()}>{C.back}</button>
    <div className="fr-foot">READ-ONLY · POSTED JOURNALS · IX CORE PROJECTION · SOURCE LINEAGE PRESERVED</div>
    <IXIFinancialReportingStyles />
  </div>;
}
