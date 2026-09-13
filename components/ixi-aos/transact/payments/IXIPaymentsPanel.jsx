import { useEffect, useMemo, useRef, useState } from "react";
import IXIMoneyInput from "../IXIMoneyInput";
import { loadIXIAosFinancialAccessContext } from "../../financial-runtime/IXIAosFinancialReadClient";
import { createPaymentCommandId, loadIXIPaymentRecords, saveIXIPayment, voidIXIPayment } from "./IXIPaymentCommands";
import { isPaymentCharge, paymentAmount, paymentDocument, paymentSummary, uniquePaymentRecords, validatePaymentDraft } from "./IXIPaymentModel";
import { getIXIWorkOrderRelatedRecords } from "../modules/work-order/IXIWorkOrderProjectionEngine";
import styles from "./IXIPayments.module.css";

const clean = value => String(value ?? "").trim();
const EMPTY = [];
const COPY = {
  en: { title: "PAYMENTS", total: "TOTAL", paid: "PAID", balance: "BALANCE DUE", mark: "MARK PAID", details: "PAYMENT DETAILS", edit: "EDIT PAYMENT", amount: "AMOUNT PAID", date: "PAYMENT DATE", method: "HOW DID YOU PAY?", reference: "CHECK / TRANSFER REFERENCE", notes: "NOTES", optional: "OPTIONAL DETAILS", save: "SAVE PAYMENT", saveDetails: "SAVE DETAILS", cancel: "CANCEL", saving: "SAVING…", loading: "Checking payments…", retry: "RETRY", history: "PAYMENT HISTORY", noCharges: "No saved Bills or Expenses in this view.", historical: "For an earlier payment, choose the date you actually paid.", approval: "Saving will also approve this Bill using your approval access.", approvalNeeded: "This Bill needs an authorized approver before payment can be recorded.", noAccess: "You do not have access to record payments.", hold: "Payment is on hold or disputed. Resolve it in A/P first.", recorded: "Payment saved.", refreshFailed: "Saved, but updated balances could not load. Retry to refresh; do not enter the payment again.", dateMissing: "Payment date not recorded", entry: "Paid with the Expense. No additional payment is needed.", reimbursement: "EMPLOYEE REIMBURSEMENT", credit: "CREDIT APPLIED", creditBalance: "CREDIT / OVERPAYMENT", void: "VOID PAYMENT", voidExplain: "This removes the payment from the paid total and reopens the balance. The original stays in history.", confirmVoid: "CONFIRM VOID", view: "VIEW PAYMENTS", emptyHistory: "No separate payments recorded.", failure: "Payments could not load. Retry before recording a payment.", review: "Review the amount, date and method, then save.", status: { UNPAID: "UNPAID", "PARTIALLY PAID": "PARTIALLY PAID", PAID: "PAID", CREDITED: "CREDITED", VOID: "VOID", "NO BALANCE DUE": "NO BALANCE DUE" } },
  es: { title: "PAGOS", total: "TOTAL", paid: "PAGADO", balance: "SALDO PENDIENTE", mark: "MARCAR PAGADO", details: "DETALLES DEL PAGO", edit: "EDITAR PAGO", amount: "IMPORTE PAGADO", date: "FECHA DE PAGO", method: "¿CÓMO PAGÓ?", reference: "REFERENCIA DE CHEQUE / TRANSFERENCIA", notes: "NOTAS", optional: "DETALLES OPCIONALES", save: "GUARDAR PAGO", saveDetails: "GUARDAR DETALLES", cancel: "CANCELAR", saving: "GUARDANDO…", loading: "Consultando pagos…", retry: "REINTENTAR", history: "HISTORIAL DE PAGOS", noCharges: "No hay facturas ni gastos guardados en esta vista.", historical: "Para un pago anterior, elija la fecha en que realmente pagó.", approval: "Guardar también aprobará esta factura con su autorización.", approvalNeeded: "La factura necesita aprobación antes de registrar el pago.", noAccess: "No tiene permiso para registrar pagos.", hold: "Pago retenido o disputado. Resuélvalo en C/P primero.", recorded: "Pago guardado.", refreshFailed: "Guardado, pero no se pudo actualizar el saldo. Reintente la consulta; no registre otro pago.", dateMissing: "Fecha de pago sin registrar", entry: "Pagado con el gasto. No se necesita otro pago.", reimbursement: "REEMBOLSO AL EMPLEADO", credit: "CRÉDITO APLICADO", creditBalance: "CRÉDITO / PAGO EN EXCESO", void: "ANULAR PAGO", voidExplain: "Se restará el pago del total pagado y se reabrirá el saldo. El original permanece en el historial.", confirmVoid: "CONFIRMAR ANULACIÓN", view: "VER PAGOS", emptyHistory: "No hay pagos separados registrados.", failure: "No se pudieron consultar los pagos. Reintente antes de registrar un pago.", review: "Revise el importe, la fecha y el método antes de guardar.", status: { UNPAID: "SIN PAGAR", "PARTIALLY PAID": "PAGO PARCIAL", PAID: "PAGADO", CREDITED: "ACREDITADO", VOID: "ANULADO", "NO BALANCE DUE": "SIN SALDO PENDIENTE" } }
};
const today = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; };

export default function IXIPaymentsPanel({ context = {}, object = {}, sourceIds = null, workOrder = null, language = "en", onChanged, initialOpenId = "", onClose, title = "" }) {
  const t = COPY[language === "es" || language === "es-MX" ? "es" : "en"];
  const passportId = clean(context.primary?.passportId || object.passportId);
  const idKey = sourceIds === null ? "*" : JSON.stringify([...new Set(sourceIds.filter(Boolean))].sort());
  const [records, setRecords] = useState(EMPTY), [capabilities, setCapabilities] = useState({});
  const [loading, setLoading] = useState(true), [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(null), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false), [attempt, setAttempt] = useState(0), [voiding, setVoiding] = useState(null);
  const [expanded, setExpanded] = useState("");
  const busyRef = useRef(false), mounted = useRef(true), autoOpened = useRef("");
  const formHeading = useRef(null);
  const ids = useMemo(() => idKey === "*" ? null : JSON.parse(idKey), [idKey]);
  const summaries = useMemo(() => {
    const related = workOrder ? new Set(getIXIWorkOrderRelatedRecords(workOrder, records).map(row => row.id)) : null;
    return uniquePaymentRecords(records).filter(isPaymentCharge).filter(record => {
      const id = paymentDocument(record).financialDocumentId;
      return (!ids || ids.includes(id)) && (!related || related.has(id));
    }).map(record => paymentSummary(record, records)).sort((a, b) => Number(b.balance > 0) - Number(a.balance > 0));
  }, [records, ids, workOrder]);
  const money = (value, currency) => Number(value || 0).toLocaleString(language === "es" ? "es-MX" : "en-US", { style: "currency", currency: currency || "USD" });

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError("");
    Promise.all([loadIXIPaymentRecords({ passportId, sourceIds: ids || [], signal: controller.signal }), loadIXIAosFinancialAccessContext({ signal: controller.signal })])
      .then(([found, access]) => { if (!controller.signal.aborted) { setRecords(found); setCapabilities(access.capabilities || {}); } })
      .catch(problem => { if (!controller.signal.aborted) setLoadError(problem.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [passportId, idKey, attempt]);
  useEffect(() => { if (form || voiding) formHeading.current?.focus(); }, [form?.commandId, voiding]);
  function open(summary, payment = null) {
    if (busyRef.current) return;
    const d = payment ? paymentDocument(payment) : null;
    setError(""); setNotice(""); setVoiding(null);
    setForm({ sourceId: summary.id, payment, commandId: createPaymentCommandId(), amount: String(d ? paymentAmount(d) : summary.paidAtEntry ? summary.total : summary.balance), paidDate: d ? clean(d.occurredAt).slice(0,10) : summary.paidAtEntry ? summary.paidDate : today(), method: d ? clean(d.paymentMethod).toUpperCase() || "OTHER" : summary.paidAtEntry ? summary.method : "ACH", reference: clean(d?.transactionReference || (summary.paidAtEntry ? summary.reference : "")), notes: clean(d?.memo || (summary.paidAtEntry ? summary.document.expensePayment?.notes : "")) });
  }
  useEffect(() => {
    if (!loading && !loadError && initialOpenId && autoOpened.current !== initialOpenId) {
      const selected = summaries.find(item => item.id === initialOpenId);
      if (selected) { autoOpened.current = initialOpenId; if (selected.balance > 0 || selected.paidAtEntry) open(selected); else setExpanded(selected.id); }
    }
  }, [loading, loadError, initialOpenId, summaries]);
  async function refreshAfterSave() {
    setForm(null); setVoiding(null); setNotice(t.recorded);
    try { const fresh = await loadIXIPaymentRecords({ passportId, sourceIds: ids || [] }); if (mounted.current) setRecords(fresh); }
    catch { if (mounted.current) setLoadError(t.refreshFailed); }
    // A parent refresh is separate from the committed payment. Its failure must
    // never present a successful write as a failed payment or invite resubmission.
    try { await onChanged?.(); } catch { if (mounted.current) setLoadError(t.refreshFailed); }
  }
  async function save(event) {
    event.preventDefault();
    if (busyRef.current || !form) return;
    const summary = summaries.find(item => item.id === form.sourceId);
    const maximum = summary.paidAtEntry ? summary.total : summary.balance + (form.payment ? paymentAmount(form.payment) : 0);
    const problem = validatePaymentDraft(form, maximum);
    if (problem) { setError(problem); return; }
    busyRef.current = true; setBusy(true); setError("");
    try { await saveIXIPayment({ source: summary.source, records, context, object, input: form, commandId: form.commandId, capabilities, payment: form.payment }); if (mounted.current) await refreshAfterSave(); }
    catch (problem) { if (mounted.current) setError(problem.message); }
    finally { busyRef.current = false; if (mounted.current) setBusy(false); }
  }
  async function confirmVoid() {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError("");
    try { await voidIXIPayment({ payment: voiding.payment, commandId: voiding.commandId, reason: voiding.reason }); if (mounted.current) await refreshAfterSave(); }
    catch (problem) { if (mounted.current) setError(problem.message); }
    finally { busyRef.current = false; if (mounted.current) setBusy(false); }
  }
  const selected = form ? summaries.find(item => item.id === form.sourceId) : null;
  const field = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const allowed = summary => capabilities["financial.payment.create"] && (summary.approved || capabilities["financial.document.approve"]) && !summary.hold && summary.active;
  return <section className={styles.panel} lang={language.startsWith("es") ? "es" : "en"} aria-label={t.title} data-ixi-payment-panel>
    <div className={styles.heading}><strong>{title || t.title}</strong>{onClose ? <button type="button" onClick={onClose} disabled={busy}>{t.cancel}</button> : null}</div>
    {notice ? <p role="status" className={styles.success}>{notice}</p> : null}
    {loadError ? <div role="alert" className={styles.error}><p>{loadError === t.refreshFailed ? loadError : t.failure}</p><button type="button" onClick={() => { setAttempt(value => value + 1); setForm(null); }} disabled={busy}>{t.retry}</button></div> : null}
    {loading ? <p role="status">{t.loading}</p> : null}
    {!loading && !loadError && !summaries.length ? <p>{t.noCharges}</p> : null}
    {!loading && !loadError && summaries.map(summary => <article className={styles.charge} key={summary.id} data-payment-source={summary.id}>
      <div className={styles.chargeHead}><div><strong>{summary.title}</strong>{summary.party ? <small>{summary.party}</small> : null}</div><span className={styles.status} data-paid={summary.balance === 0 && summary.active}>{t.status[summary.status]}</span></div>
      {summary.reimbursement ? <p className={styles.hint}>{t.reimbursement}</p> : null}
      <dl className={styles.totals}><div><dt>{t.total}</dt><dd>{money(summary.total, summary.currency)}</dd></div><div><dt>{t.paid}</dt><dd>{money(summary.paid, summary.currency)}</dd></div><div><dt>{t.balance}</dt><dd>{money(summary.balance, summary.currency)}</dd></div></dl>
      {summary.credited > 0 ? <p>{t.credit}: {money(summary.credited, summary.currency)}</p> : null}
      {summary.creditBalance > 0 ? <p>{t.creditBalance}: {money(summary.creditBalance, summary.currency)}</p> : null}
      {summary.paid > 0 ? <p className={styles.hint}>{summary.paidDate || t.dateMissing}{summary.method ? ` · ${summary.method}` : ""}{summary.reference ? ` · ${summary.reference}` : ""}</p> : null}
      {summary.balance > 0 && summary.active && form?.sourceId !== summary.id ? <><button className={styles.primary} type="button" disabled={busy || !allowed(summary)} onClick={() => open(summary)}>{t.mark}</button>{!allowed(summary) ? <p className={styles.hint}>{summary.hold ? t.hold : !summary.approved && !capabilities["financial.document.approve"] ? t.approvalNeeded : t.noAccess}</p> : null}</> : null}
      {summary.paidAtEntry ? <><p className={styles.hint}>{t.entry}</p><button type="button" disabled={busy || !summary.active || !capabilities["financial.document.patch"]} onClick={() => open(summary)}>{t.details}</button></> : null}
      {summary.allPayments.length ? <><button type="button" aria-expanded={expanded === summary.id} onClick={() => setExpanded(expanded === summary.id ? "" : summary.id)}>{t.history} ({summary.allPayments.length})</button>{expanded === summary.id ? <ol className={styles.history}>{summary.allPayments.map(payment => { const d = paymentDocument(payment); const inactive = ["void", "reversed"].includes(d.financialState); return <li key={d.financialDocumentId}><strong>{money(paymentAmount(d), summary.currency)}{inactive ? ` · ${t.status.VOID}` : ""}</strong><span>{clean(d.occurredAt).slice(0,10)} · {d.paymentMethod}{d.transactionReference ? ` · ${d.transactionReference}` : ""}</span>{d.memo ? <span>{d.memo}</span> : null}{!inactive && capabilities["financial.payment.create"] ? <div className={styles.actions}><button type="button" disabled={busy} onClick={() => open(summary, payment)}>{t.edit}</button><button type="button" disabled={busy} onClick={() => { setForm(null); setError(""); setVoiding({ payment, reason: "", commandId: createPaymentCommandId() }); }}>{t.void}</button></div> : null}</li>; })}</ol> : null}</> : null}
      {selected?.id === summary.id ? <form className={styles.form} onSubmit={save} aria-label={form.payment ? t.edit : summary.paidAtEntry ? t.details : t.mark}>
        <h3 ref={formHeading} tabIndex={-1}>{form.payment ? t.edit : summary.paidAtEntry ? t.details : t.mark}</h3>
        <p>{t.review}</p>
        <label><span>{t.amount}</span><IXIMoneyInput aria-label={t.amount} value={form.amount} onValueChange={value => field("amount", value)} disabled={busy || summary.paidAtEntry} /></label>
        <label><span>{t.date}</span><input aria-label={t.date} type="date" value={form.paidDate} onChange={event => field("paidDate", event.target.value)} disabled={busy} required /></label>
        <p className={styles.hint}>{t.historical}</p>
        <label><span>{t.method}</span><select aria-label={t.method} value={form.method} onChange={event => field("method", event.target.value)} disabled={busy}>{["ACH", "CHECK", "WIRE", "CARD", "CASH", "OTHER"].map(method => <option key={method} value={method}>{language.startsWith("es") ? ({ CHECK:"CHEQUE", CARD:"TARJETA", CASH:"EFECTIVO", OTHER:"OTRO", WIRE:"TRANSFERENCIA" }[method] || method) : method}</option>)}</select></label>
        {!summary.approved ? <p>{t.approval}</p> : null}
        <details><summary>{t.optional}</summary><label><span>{t.reference}</span><input value={form.reference} onChange={event => field("reference", event.target.value)} disabled={busy} /></label><label><span>{t.notes}</span><textarea value={form.notes} onChange={event => field("notes", event.target.value)} disabled={busy} /></label></details>
        {error ? <p role="alert" className={styles.error}>{error}</p> : null}
        <div className={styles.actions}><button type="button" onClick={() => { setForm(null); setError(""); }} disabled={busy}>{t.cancel}</button><button type="submit" className={styles.primary} disabled={busy}>{busy ? t.saving : summary.paidAtEntry ? t.saveDetails : t.save}</button></div>
      </form> : null}
    </article>)}
    {voiding ? <div className={styles.form}><h3 ref={formHeading} tabIndex={-1}>{t.void}</h3><p>{t.voidExplain}</p><label><span>{t.notes} ({t.optional})</span><textarea value={voiding.reason} disabled={busy} onChange={event => setVoiding(current => ({ ...current, reason: event.target.value }))} /></label>{error ? <p role="alert" className={styles.error}>{error}</p> : null}<div className={styles.actions}><button type="button" disabled={busy} onClick={() => setVoiding(null)}>{t.cancel}</button><button type="button" disabled={busy} onClick={confirmVoid}>{busy ? t.saving : t.confirmVoid}</button></div></div> : null}
  </section>;
}
