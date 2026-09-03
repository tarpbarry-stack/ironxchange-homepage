import { useEffect, useMemo, useState } from "react";
import { createIXIGLChart, createIXIJournalEntry, createIXIAccountingPeriod, validateIXIJournalEntry } from "./IXIGeneralLedgerContract";
import { buildIXIGLPostingProjection } from "./IXIGLPostingEngine";
import { buildIXIGLControlReconciliation, evaluateIXIPeriodClose, createIXIReversalJournal } from "./IXIGLPeriodEngine";
import { postIXIJournalEntry } from "./IXIGeneralLedgerCommands";
import { loadIXITransactGL, closeIXITransactPeriod } from "../../../financial-runtime/IXITransactDesktopClient";
import { hydrateIXIGLProjection } from "./IXIGeneralLedgerProjectionAdapter";
import { getIXIGeneralLedgerPolicy } from "./IXIGeneralLedgerPolicyEngine";
import IXIGeneralLedgerStyles from "./IXIGeneralLedgerStyles";

const clean = value => String(value ?? "").trim();
const money = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
const currentPeriod = () => new Date().toISOString().slice(0, 7);
const requestId = prefix => globalThis.crypto?.randomUUID?.() || `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
function Field({ label, children }) { return <div className="gl-field"><label>{label}</label>{children}</div>; }
function serverCloseReview(live, fallback) {
  if (!live) return fallback;
  const controls = live.controls || {};
  const checks = [
    { id: "period-trial-balance", label: "PERIOD TRIAL BALANCE", ok: controls.journalBalanced === true },
    { id: "ending-trial-balance", label: "ENDING TRIAL BALANCE", ok: controls.endingTrialBalanceBalanced === true },
    { id: "balance-sheet", label: "BALANCE SHEET", ok: controls.balanceSheetBalanced === true },
    { id: "period-exceptions", label: "PERIOD POSTING EXCEPTIONS", ok: Number(controls.postingExceptions || 0) === 0, detail: String(controls.postingExceptions || 0) },
    { id: "ending-exceptions", label: "ENDING POSTING EXCEPTIONS", ok: Number(controls.endingPostingExceptions || 0) === 0, detail: String(controls.endingPostingExceptions || 0) }
  ];
  return { period: live.period?.period, status: live.period?.status, checks, ready: controls.ready === true, trialBalance: live.endingTrialBalance || live.trialBalance, exceptions: Number(controls.postingExceptions || 0), unposted: 0 };
}

export default function IXIGeneralLedgerApp({
  context = {}, object = {}, financialRecords = [], initialJournals = [], initialRules = [],
  initialChart = null, initialPeriod = null, arSubledger = 0, apSubledger = 0,
  treasuryCash = 0, bankReconciliations = [], language = "en", onBack = null,
  onRecordChange = null, onFinancialRecordsChange = null
}) {
  const entityPassportId = clean(context.entity?.passportId || context.primary?.passportId || object.passportId);
  const policy = useMemo(() => getIXIGeneralLedgerPolicy({ context }), [context]);
  const [lang, setLang] = useState(language === "es" ? "es" : "en");
  const [mode, setMode] = useState("dashboard");
  const [chart, setChart] = useState(initialChart || createIXIGLChart({ entityPassportId }));
  const [rules, setRules] = useState(Array.isArray(initialRules) ? initialRules : []);
  const [journals, setJournals] = useState(Array.isArray(initialJournals) ? initialJournals : []);
  const [period, setPeriod] = useState(initialPeriod || createIXIAccountingPeriod({ period: currentPeriod(), entityPassportId, actor: context.actor }));
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [manual, setManual] = useState({ description: "", debitAccount: "6110", creditAccount: "2000", amount: "", memo: "", autoReverse: false });
  const [mapping, setMapping] = useState({ documentType: "expense", categoryContains: "", debitAccount: "6110", creditAccount: "1010", description: "" });

  async function refresh(selectedPeriod = period.period) {
    if (!policy.canView) return null;
    setLoading(true);
    try {
      const canonical = hydrateIXIGLProjection(await loadIXITransactGL({ period: selectedPeriod, currency: "USD" }));
      setLive(canonical);
      setJournals(canonical.journals);
      if (canonical.chart.accounts.length) setChart(canonical.chart);
      setPeriod(canonical.period);
      setError("");
      return canonical;
    } catch (cause) {
      setError(clean(cause?.message) || "Authoritative General Ledger could not be loaded.");
      return null;
    } finally { setLoading(false); }
  }
  useEffect(() => {
    if (!policy.canView) return undefined;
    const controller = new AbortController();
    setLoading(true);
    loadIXITransactGL({ period: period.period, currency: "USD", signal: controller.signal })
      .then(result => {
        const canonical = hydrateIXIGLProjection(result);
        setLive(canonical); setJournals(canonical.journals);
        if (canonical.chart.accounts.length) setChart(canonical.chart);
        setPeriod(canonical.period); setError("");
      })
      .catch(cause => { if (cause?.name !== "AbortError") setError(clean(cause?.message) || "Authoritative General Ledger could not be loaded."); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [policy.canView]);

  const posting = useMemo(() => buildIXIGLPostingProjection({ financialRecords, chart, rules, postedJournals: journals, actor: context.actor }), [financialRecords, chart, rules, journals, context.actor]);
  const localControls = useMemo(() => buildIXIGLControlReconciliation({ journals, arSubledger, apSubledger, treasuryCash, bankReconciliations, throughPeriod: period.period }), [journals, arSubledger, apSubledger, treasuryCash, bankReconciliations, period.period]);
  const localReview = useMemo(() => evaluateIXIPeriodClose({ period, postingProjection: posting, journals, chart, controls: localControls }), [period, posting, journals, chart, localControls]);
  const review = useMemo(() => serverCloseReview(live, localReview), [live, localReview]);
  const C = lang === "es"
    ? { title: "LIBRO MAYOR / CIERRE", journal: "DIARIO", exceptions: "EXCEPCIONES", adjust: "AJUSTES", mappings: "MAPEOS", close: "CIERRE", back: "‹ TRAN$ACT" }
    : { title: "GENERAL LEDGER / CLOSE", journal: "JOURNAL", exceptions: "EXCEPTIONS", adjust: "ADJUSTMENTS", mappings: "MAPPINGS", close: "CLOSE", back: "‹ TRAN$ACT" };
  async function notify(record, change) { await onRecordChange?.(record, change, context); }
  async function postOne(journal) {
    if (!policy.canPostJournal) throw new Error("Journal posting authority is required.");
    const result = await postIXIJournalEntry({ object, context, journal, metadata: { source: "ixi-transact-gl", reversalOf: clean(journal.posting?.reversalOf) } });
    await onFinancialRecordsChange?.();
    await refresh(journal.period);
    await notify(result.record, { action: "journal-posted", financialResponse: result.response });
    return result.record;
  }
  async function postReady() {
    if (busy || !policy.canPostJournal) return;
    setBusy(true); setError("");
    try { for (const item of posting.ready) await postOne(item.journal); }
    catch (cause) { setError(clean(cause?.message) || "Journal posting failed."); }
    finally { setBusy(false); }
  }
  async function createManual() {
    if (!policy.canCreateJournal || !policy.canPostJournal) { setError("Journal create and post authority are required."); return; }
    const amount = Number(manual.amount || 0);
    const debit = chart.accounts.find(account => account.code === manual.debitAccount);
    const credit = chart.accounts.find(account => account.code === manual.creditAccount);
    const journal = createIXIJournalEntry({
      sourceDocument: { documentId: requestId("MANUAL"), documentType: "manual-journal", documentNumber: "ADJUSTMENT" },
      period: period.period, entityPassportId, description: manual.description || "Adjusting journal entry",
      lines: [
        { accountCode: debit?.code, accountName: debit?.name, debit: amount, credit: 0, memo: manual.memo },
        { accountCode: credit?.code, accountName: credit?.name, debit: 0, credit: amount, memo: manual.memo }
      ],
      dimensions: { entityPassportId }, ruleId: "manual-adjustment", actor: context.actor
    });
    if (!validateIXIJournalEntry(journal).valid) { setError("Balanced active debit and credit accounts with a positive amount are required."); return; }
    setBusy(true); setError("");
    try {
      const posted = await postOne(journal);
      if (manual.autoReverse) await notify(posted, { action: "auto-reverse-requested", reverseOn: `${period.period}-01` });
      setManual({ description: "", debitAccount: "6110", creditAccount: "2000", amount: "", memo: "", autoReverse: false });
      setMode("journal");
    } catch (cause) { setError(clean(cause?.message) || "Adjustment failed."); }
    finally { setBusy(false); }
  }
  async function reverse(journal) {
    if (!policy.canReverseJournal) { setError("Journal reversal authority is required."); return; }
    setBusy(true); setError("");
    try { await postOne(createIXIReversalJournal(journal, context.actor)); }
    catch (cause) { setError(clean(cause?.message) || "Reversal failed."); }
    finally { setBusy(false); }
  }
  async function closePeriod() {
    if (!policy.canClosePeriod) { setError("Controller period-close authority is required."); return; }
    if (!review.ready) { setError("Authoritative IX Core controls are not ready to close."); return; }
    setBusy(true); setError("");
    try {
      const commandId = requestId("CLOSE");
      const result = await closeIXITransactPeriod({ period: period.period, currency: "USD", commandId, idempotencyKey: `ixi-gl-period-close:${entityPassportId}:${period.period}`, metadata: { source: "ixi-transact-gl" } });
      await onFinancialRecordsChange?.();
      const canonical = hydrateIXIGLProjection({ data: { projection: result.projection, scope: { entityPassportId, period: period.period, currency: "USD" }, lineage: { storageProvider: result.storageProvider, serverCalculated: true, browserCalculated: false } } });
      setLive(canonical); setJournals(canonical.journals); setPeriod(canonical.period);
      await notify(canonical.period, { action: "period-closed", financialResponse: result, review: canonical.controls });
    } catch (cause) { setError(clean(cause?.message) || "Period close failed."); }
    finally { setBusy(false); }
  }
  function addRule() {
    if (!policy.canManageRules) { setError("Posting-rule management authority is required."); return; }
    if (!mapping.documentType || !mapping.debitAccount || !mapping.creditAccount) return;
    const rule = { ...mapping, ruleId: requestId("MAP"), version: "gl-rules-v1", priority: 100, active: true };
    setRules(list => [...list, rule]); notify(rule, { action: "posting-rule-added" });
  }
  const locked = !policy.canView;
  return <div className="ixi-gl" style={{ width: 298, height: 471, overflowY: "auto", overflowX: "hidden" }}>
    <div className="gl-head"><div><div className="gl-kicker">IXI TRAN$ACT · AWS IXI FINANCIAL</div><strong>{C.title}</strong><small>{context.entity?.label || context.primary?.label || "ENTITY"} · {live ? "DYNAMODB AUTHORITATIVE" : locked ? "ACCESS CONTROLLED" : "CONNECTING"}</small></div><button className="gl-back" onClick={() => setLang(lang === "en" ? "es" : "en")}>{lang === "en" ? "ESP" : "ENG"}</button></div>
    <div className="gl-period"><div><small>ACCOUNTING PERIOD</small><strong>{period.period}</strong></div><span className={`gl-pill ${period.status === "closed" ? "good" : locked ? "bad" : ""}`}>{loading ? "LOADING" : locked ? "LOCKED" : period.status?.toUpperCase()}</span></div>
    <div className="gl-metrics"><div className="gl-metric"><span>POSTED JOURNALS</span><strong>{journals.length}</strong></div><div className={`gl-metric ${review.ready ? "good" : "warn"}`}><span>IX CORE CLOSE CONTROL</span><strong>{review.ready ? "READY" : "BLOCKED"}</strong></div><div className="gl-metric"><span>DEBITS</span><strong>{money(review.trialBalance?.debits)}</strong></div><div className="gl-metric"><span>CREDITS</span><strong>{money(review.trialBalance?.credits)}</strong></div></div>
    {error ? <div className="gl-error">{error}</div> : null}
    {locked ? <div className="gl-callout">GENERAL LEDGER IS DENY-BY-DEFAULT. AUTHENTICATED FINANCIAL GL VIEW AUTHORITY IS REQUIRED.</div> : <>
      <div className="gl-tabs"><button className={mode === "dashboard" ? "on" : ""} onClick={() => setMode("dashboard")}>CONTROL</button><button className={mode === "journal" ? "on" : ""} onClick={() => setMode("journal")}>{C.journal}</button><button className={mode === "exceptions" ? "on" : ""} onClick={() => setMode("exceptions")}>{C.exceptions}</button><button className={mode === "adjust" ? "on" : ""} onClick={() => setMode("adjust")}>{C.adjust}</button><button className={mode === "mappings" ? "on" : ""} onClick={() => setMode("mappings")}>{C.mappings}</button><button className={mode === "close" ? "on" : ""} onClick={() => setMode("close")}>{C.close}</button></div>
      {mode === "dashboard" ? <><div className="gl-section">AUTHORITATIVE CONTROL</div>{review.checks.map(check => <div className="gl-check" key={check.id}><span>{check.label}</span><b className={check.ok ? "gl-good" : "gl-bad"}>{check.ok ? "✓" : check.detail || "BLOCKED"}</b></div>)}{posting.counts.ready ? <button className="gl-primary" disabled={busy || period.status === "closed" || !policy.canPostJournal} onClick={postReady}>POST {posting.counts.ready} READY JOURNALS</button> : null}<button className="gl-secondary" disabled={loading} onClick={() => refresh()}>{loading ? "REFRESHING..." : "REFRESH IX CORE"}</button><div className="gl-callout">Browser state is non-authoritative. IX Core validates active Entity accounts, balanced lines, optimistic revision, open period, idempotency, and persists to DynamoDB.</div></> :
      mode === "journal" ? <><div className="gl-section">POSTED / IMMUTABLE JOURNAL</div>{journals.length ? journals.map(journal => <div className="gl-row" key={journal.identity?.journalEntryId}><div className="gl-rowhead"><strong>{journal.identity?.number}</strong><b className="gl-good">POSTED</b></div><small>{journal.period} · {journal.description}<br />SOURCE {journal.source?.documentNumber || journal.source?.financialDocumentId || "MANUAL"}</small>{journal.lines.map(line => <div className="gl-line" key={line.lineId}><span>{line.accountCode}</span><span>{line.accountName}</span><b className="amt">{line.debit ? money(line.debit) : ""}</b><b className="amt">{line.credit ? money(line.credit) : ""}</b></div>)}{!journal.posting?.reversalOf ? <button className="gl-danger" disabled={busy || period.status === "closed" || !policy.canReverseJournal} onClick={() => reverse(journal)}>CREATE CONTROLLED REVERSAL</button> : null}</div>) : <div className="gl-callout">NO POSTED JOURNALS FOR THIS PERIOD.</div>}</> :
      mode === "exceptions" ? <><div className="gl-section">POSTING EXCEPTIONS</div>{posting.exceptions.length ? posting.exceptions.map((item, index) => <div className="gl-row" key={index}><div className="gl-rowhead"><strong>{item.reason}</strong><b className="gl-bad">BLOCKED</b></div><small>{clean(item.source?.documentNumber || item.source?.financialDocumentId || item.source?.documentId)}</small></div>) : <div className="gl-callout gl-good">NO CLIENT-SIDE CLASSIFICATION EXCEPTIONS. SERVER POSTING CONTROLS REMAIN AUTHORITATIVE.</div>}</> :
      mode === "adjust" ? <><div className="gl-section">BALANCED ADJUSTMENT</div><Field label="DESCRIPTION"><input value={manual.description} onChange={event => setManual(value => ({ ...value, description: event.target.value }))} /></Field><div className="gl-grid2"><Field label="DEBIT ACCOUNT"><select value={manual.debitAccount} onChange={event => setManual(value => ({ ...value, debitAccount: event.target.value }))}>{chart.accounts.filter(a => a.active !== false).map(a => <option value={a.code} key={a.code}>{a.code} · {a.name}</option>)}</select></Field><Field label="CREDIT ACCOUNT"><select value={manual.creditAccount} onChange={event => setManual(value => ({ ...value, creditAccount: event.target.value }))}>{chart.accounts.filter(a => a.active !== false).map(a => <option value={a.code} key={a.code}>{a.code} · {a.name}</option>)}</select></Field></div><Field label="AMOUNT"><input inputMode="decimal" value={manual.amount} onChange={event => setManual(value => ({ ...value, amount: event.target.value }))} /></Field><Field label="REASON / MEMO"><textarea value={manual.memo} onChange={event => setManual(value => ({ ...value, memo: event.target.value }))} /></Field><label className="gl-callout"><input type="checkbox" checked={manual.autoReverse} onChange={event => setManual(value => ({ ...value, autoReverse: event.target.checked }))} /> REQUEST AUTO-REVERSAL NEXT PERIOD</label><button className="gl-primary" disabled={busy || period.status === "closed" || !policy.canCreateJournal || !policy.canPostJournal} onClick={createManual}>POST BALANCED ADJUSTMENT</button></> :
      mode === "mappings" ? <><div className="gl-section">POSTING RULE CONTROL</div><Field label="DOCUMENT TYPE"><input value={mapping.documentType} onChange={event => setMapping(value => ({ ...value, documentType: event.target.value }))} /></Field><Field label="CATEGORY CONTAINS"><input value={mapping.categoryContains} onChange={event => setMapping(value => ({ ...value, categoryContains: event.target.value }))} /></Field><div className="gl-grid2"><Field label="DEBIT"><select value={mapping.debitAccount} onChange={event => setMapping(value => ({ ...value, debitAccount: event.target.value }))}>{chart.accounts.map(a => <option value={a.code} key={a.code}>{a.code}</option>)}</select></Field><Field label="CREDIT"><select value={mapping.creditAccount} onChange={event => setMapping(value => ({ ...value, creditAccount: event.target.value }))}>{chart.accounts.map(a => <option value={a.code} key={a.code}>{a.code}</option>)}</select></Field></div><button className="gl-primary" disabled={!policy.canManageRules} onClick={addRule}>ADD VERSIONED RULE</button><div className="gl-callout">Rules are disabled unless explicit posting-rule administration authority is present.</div></> :
      <><div className="gl-section">SERVER-DERIVED CLOSE EVIDENCE</div>{review.checks.map(check => <div className="gl-check" key={check.id}><span>{check.label}</span><b className={check.ok ? "gl-good" : "gl-bad"}>{check.ok ? "✓" : check.detail || "BLOCKED"}</b></div>)}<div className="gl-section">ENDING TRIAL BALANCE</div>{(review.trialBalance?.rows || []).map(row => <div className="gl-line" key={row.accountCode}><span>{row.accountCode}</span><span>{row.accountName}</span><b className="amt">{row.debit ? money(row.debit) : ""}</b><b className="amt">{row.credit ? money(row.credit) : ""}</b></div>)}<div className="gl-callout">DEBITS {money(review.trialBalance?.debits)} · CREDITS {money(review.trialBalance?.credits)} · DIFFERENCE {money(review.trialBalance?.difference)}</div><button className="gl-primary" disabled={busy || !review.ready || period.status === "closed" || !policy.canClosePeriod} onClick={closePeriod}>{period.status === "closed" ? `CLOSED · ${period.close?.closedByLabel || period.close?.closedBy || ""}` : review.ready ? `CLOSE ${period.period}` : "RESOLVE IX CORE BLOCKERS"}</button></>}
    </>}
    <button className="gl-secondary" onClick={() => onBack?.()}>{C.back}</button>
    <div className="gl-foot">POSTED JOURNALS ARE IMMUTABLE · CORRECTIONS USE REVERSALS · CLOSED PERIODS ARE SERVER-LOCKED · SOURCE LINEAGE PRESERVED</div>
    <IXIGeneralLedgerStyles />
  </div>;
}
