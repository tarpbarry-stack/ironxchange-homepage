import { useMemo, useState } from "react";

import { getIXIBillAvailableActions, getIXIBillVarianceRequirement } from "./IXIBillPolicyEngine";
import IXIBillStyles from "./IXIBillStyles";

const clean = value => String(value ?? "").trim();
const money = value => Number(value || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });

const COPY = {
  en: {
    bill: "Bill / Invoice",
    vendor: "VENDOR",
    amount: "AMOUNT",
    invoice: "INVOICE #",
    invoiceDate: "INVOICE DATE",
    dueDate: "DUE DATE",
    description: "DESCRIPTION",
    category: "CATEGORY",
    context: "LOCATION / ENTITY",
    related: "RELATED TO",
    po: "PURCHASE ORDER",
    match: "THREE-WAY MATCH",
    committed: "PO COMMITTED",
    received: "RECEIVED",
    billed: "BILLED (THIS INVOICE)",
    matchStatus: "MATCH STATUS",
    variance: "VARIANCE",
    files: "FILES / DOCUMENTS",
    approval: "APPROVAL",
    required: "REQUIRED AUTHORITY",
    approver: "CURRENT APPROVER",
    status: "STATUS",
    waiting: "WAITING FOR",
    actionNeeded: "ACTION NEEDED",
    approve: "APPROVE",
    return: "RETURN",
    reject: "REJECT",
    approveVariance: "APPROVE VARIANCE",
    payment: "PAYMENT",
    paymentStatus: "PAYMENT STATUS",
    method: "PAYMENT METHOD",
    scheduledDate: "SCHEDULED DATE",
    paidDate: "PAID DATE",
    amountPaid: "AMOUNT PAID",
    schedule: "SCHEDULE PAYMENT",
    recordPayment: "RECORD PAYMENT",
    notes: "NOTES",
    activity: "ACTIVITY (latest)",
    edit: "EDIT",
    void: "VOID",
    print: "PRINT",
    share: "SHARE",
    open: "OPEN",
    approved: "APPROVED",
    paid: "PAID",
    unpaid: "UNPAID",
    scheduled: "SCHEDULED",
    partial: "PARTIAL",
    overdue: "OVERDUE",
    unmatched: "UNMATCHED",
    matched: "MATCHED",
    exception: "EXCEPTION",
    na: "N/A",
    readyPayment: "READY FOR PAYMENT",
    none: "None"
  },
  es: {
    bill: "Factura / Cuenta",
    vendor: "PROVEEDOR",
    amount: "MONTO",
    invoice: "N° DE FACTURA",
    invoiceDate: "FECHA DE FACTURA",
    dueDate: "FECHA DE VENCIMIENTO",
    description: "DESCRIPCIÓN",
    category: "CATEGORÍA",
    context: "UBICACIÓN / ENTIDAD",
    related: "RELACIONADO CON",
    po: "ORDEN DE COMPRA",
    match: "CONCILIACIÓN DE TRES VÍAS",
    committed: "OC COMPROMETIDA",
    received: "RECIBIDO",
    billed: "FACTURADO (ESTA FACT.)",
    matchStatus: "ESTADO DE CONCILIACIÓN",
    variance: "VARIACIÓN",
    files: "ARCHIVOS / DOCUMENTOS",
    approval: "APROBACIÓN",
    required: "AUTORIDAD REQUERIDA",
    approver: "APROBADOR ACTUAL",
    status: "ESTADO",
    waiting: "ESPERANDO A",
    actionNeeded: "ACCIÓN REQUERIDA",
    approve: "APROBAR",
    return: "DEVOLVER",
    reject: "RECHAZAR",
    approveVariance: "APROBAR VARIACIÓN",
    payment: "PAGO",
    paymentStatus: "ESTADO DE PAGO",
    method: "MÉTODO DE PAGO",
    scheduledDate: "FECHA PROGRAMADA",
    paidDate: "FECHA DE PAGO",
    amountPaid: "MONTO PAGADO",
    schedule: "PROGRAMAR PAGO",
    recordPayment: "REGISTRAR PAGO",
    notes: "NOTAS",
    activity: "ACTIVIDAD (más reciente)",
    edit: "EDITAR",
    void: "ANULAR",
    print: "IMPRIMIR",
    share: "COMPARTIR",
    open: "ABIERTA",
    approved: "APROBADA",
    paid: "PAGADA",
    unpaid: "SIN PAGAR",
    scheduled: "PROGRAMADA",
    partial: "PARCIAL",
    overdue: "VENCIDA",
    unmatched: "SIN CONCILIAR",
    matched: "CONCILIADA",
    exception: "EXCEPCIÓN",
    na: "N/A",
    readyPayment: "LISTA PARA PAGO",
    none: "Ninguna"
  }
};

function localeDate(value, language) {
  if (!clean(value)) return "—";
  const date = new Date(`${clean(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return clean(value);
  return date.toLocaleDateString(language === "es" ? "es-MX" : "en-US", { year: "numeric", month: "short", day: "numeric" });
}

function statusLabel(value, t) {
  const key = clean(value).toLowerCase().replace(/-/g, "");
  const map = {
    open: t.open,
    approved: t.approved,
    paid: t.paid,
    unpaid: t.unpaid,
    scheduled: t.scheduled,
    partial: t.partial,
    overdue: t.overdue,
    unmatched: t.unmatched,
    matched: t.matched,
    exception: t.exception,
    "n/a": t.na
  };
  return map[clean(value).toLowerCase()] || map[key] || clean(value).toUpperCase();
}

export default function IXIBillCard({
  record = {}, context = {}, authority = {}, policy = undefined, language = "en", onLanguageChange = null,
  onAction = null, busy = false, error = "", onBack = null
}) {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [paymentDraft, setPaymentDraft] = useState({ amount: record?.bill?.amount || "", method: "ACH", reference: "", paidDate: new Date().toISOString().slice(0, 10) });
  const [scheduleDate, setScheduleDate] = useState(record?.bill?.dueDate || "");
  const t = COPY[language === "es" ? "es" : "en"];
  const actions = useMemo(() => getIXIBillAvailableActions({ record, actor: context.actor || {}, authority, policy }), [record, context.actor, authority, policy]);
  const varianceRequirement = useMemo(() => getIXIBillVarianceRequirement(record, policy), [record, policy]);
  const approvalPending = clean(record?.approval?.status) === "pending";
  const paymentStatus = clean(record?.payment?.status || "unpaid");
  const matchStatus = clean(record?.purchaseMatch?.status || "n/a");
  const hasPo = Boolean(clean(record?.purchaseMatch?.purchaseOrderNumber));
  const latest = Array.isArray(record.timeline) && record.timeline.length ? record.timeline[record.timeline.length - 1] : null;

  function act(action, payload = {}) {
    if (busy) return;
    onAction?.(action, payload);
  }

  return (
    <div className="ixi-bill-card">
      <div className="bill-toolbar">
        <button type="button" onClick={() => onBack?.()} aria-label="Back">‹</button>
        <div className="bill-language"><button className={language === "en" ? "on" : ""} onClick={() => onLanguageChange?.("en")}>ENG</button><span>/</span><button className={language === "es" ? "on" : ""} onClick={() => onLanguageChange?.("es")}>ESP</button></div>
        <button type="button" aria-label="More">•••</button>
      </div>

      <div className="bill-head">
        <div><strong>{record?.identity?.billNumber || record?.identity?.invoiceNumber || "BILL"}</strong><span>{t.bill}</span></div>
        <b className={`status ${clean(record.status)}`}>{statusLabel(record.status, t)}</b>
      </div>

      <div className="bill-scroll">
        <section className="identity-grid">
          <div className="wide"><small>{t.vendor}</small><strong>{record?.bill?.vendorLabel || "—"}</strong></div>
          <div><small>{t.amount}</small><strong className="amount">{money(record?.bill?.amount)}</strong></div>
          <div><small>{t.invoice}</small><strong>{record?.identity?.invoiceNumber || "—"}</strong></div>
          <div><small>{t.invoiceDate}</small><strong>{localeDate(record?.bill?.invoiceDate, language)}</strong></div>
          <div><small>{t.dueDate}</small><strong className="yellow">{localeDate(record?.bill?.dueDate, language)}</strong></div>
          <div className="wide"><small>{t.description}</small><strong>{record?.bill?.description || "—"}</strong></div>
          <div><small>{t.category}</small><strong>{record?.bill?.category || "—"}</strong></div>
          <div className="wide"><small>{t.context}</small><strong>⌖ {record?.context?.locationLabel || record?.context?.primaryObjectLabel || "—"}</strong></div>
          <div><small>{t.related}</small><strong>{record?.context?.primaryObjectLabel || "—"}</strong></div>
          <div><small>{t.po}</small><strong>{record?.purchaseMatch?.purchaseOrderNumber || t.none}</strong></div>
        </section>

        {hasPo ? (
          <section className="bill-section">
            <h3>{t.match}</h3>
            <div className="match-grid">
              <div><small>{t.committed}</small><strong>{money(record.purchaseMatch.poCommittedAmount)}</strong></div>
              <div><small>{t.received}</small><strong>{record.purchaseMatch.receivedComplete ? "✓" : money(record.purchaseMatch.receivedAmount)}</strong></div>
              <div><small>{t.billed}</small><strong>{money(record.purchaseMatch.billedAmount)}</strong></div>
              <div><small>{t.matchStatus}</small><strong className={matchStatus === "matched" ? "green" : "yellow"}>{statusLabel(matchStatus, t)}</strong></div>
              <div><small>{t.variance}</small><strong className={Math.abs(Number(record.purchaseMatch.variance || 0)) > 0 ? "red" : ""}>{money(record.purchaseMatch.variance)}</strong></div>
            </div>
            {matchStatus === "exception" && actions.has("approve-variance") ? <button className="full-action yellow-action" onClick={() => act("approve-variance")}>{t.approveVariance} {money(varianceRequirement.variance)}</button> : null}
          </section>
        ) : null}

        <section className="bill-section">
          <h3>{t.files}</h3>
          {(record.documents || []).length ? record.documents.map((doc, index) => <div className="document-row" key={doc.documentId || doc.fileName || index}><span>▤</span><div><strong>{doc.fileName || doc.title || "Invoice document"}</strong><small>{doc.status || "attached"}</small></div><b>›</b></div>) : <div className="empty-row">—</div>}
        </section>

        <section className="bill-section">
          <h3>{t.approval}</h3>
          <div className="approval-grid"><div><small>{t.required}</small><strong>{record?.approval?.requiredRoleLabel || record?.approval?.requiredRole || "—"}{record?.approval?.requiredAuthority ? ` (${money(record.approval.requiredAuthority)})` : ""}</strong></div><div><small>{t.approver}</small><strong>{record?.approval?.currentApproverLabel || record?.approval?.approvedByLabel || "—"}</strong></div><div className="wide"><small>{t.status}</small><strong className={clean(record?.approval?.status) === "approved" ? "green" : "yellow"}>{statusLabel(record?.approval?.status, t)}</strong></div></div>
          {approvalPending ? (
            <div className="action-needed">
              <small>{t.actionNeeded}</small>
              {actions.has("approve") ? <><div className="approval-actions"><button className="approve" onClick={() => act("approve")}>✓ {t.approve}</button><button onClick={() => act("return")}>↶ {t.return}</button></div><button className="reject" onClick={() => act("reject")}>× {t.reject}</button></> : <strong>{t.waiting}: {record?.approval?.currentApproverLabel || record?.approval?.requiredRoleLabel || "APPROVER"}</strong>}
            </div>
          ) : null}
        </section>

        <section className="bill-section">
          <h3>{t.payment}</h3>
          <div className="payment-grid"><div><small>{t.paymentStatus}</small><strong className={paymentStatus === "paid" ? "green" : "yellow"}>{statusLabel(paymentStatus, t)}</strong></div><div><small>{t.method}</small><strong>{record?.payment?.method || "—"}</strong></div><div><small>{t.scheduledDate}</small><strong>{localeDate(record?.payment?.scheduledDate, language)}</strong></div><div><small>{t.paidDate}</small><strong>{localeDate(record?.payment?.paidDate, language)}</strong></div><div><small>{t.amountPaid}</small><strong>{money(record?.payment?.amountPaid)}</strong></div></div>
          {(record.status === "approved" || record?.approval?.status === "approved") && paymentStatus !== "paid" ? (
            <div className="payment-actions">
              {actions.has("schedule-payment") ? <button onClick={() => setScheduleOpen(value => !value)}>▣ {t.schedule}</button> : null}
              {actions.has("record-payment") ? <button onClick={() => setPaymentOpen(value => !value)}>✓ {t.recordPayment}</button> : null}
            </div>
          ) : null}
          {scheduleOpen ? <div className="inline-form"><input type="date" value={scheduleDate} onChange={event => setScheduleDate(event.target.value)} /><button onClick={() => { act("schedule-payment", { scheduledDate: scheduleDate }); setScheduleOpen(false); }}>{t.schedule}</button></div> : null}
          {paymentOpen ? <div className="inline-form payment-form"><input inputMode="decimal" value={paymentDraft.amount} onChange={event => setPaymentDraft(current => ({ ...current, amount: event.target.value }))} /><select value={paymentDraft.method} onChange={event => setPaymentDraft(current => ({ ...current, method: event.target.value }))}><option>ACH</option><option>CHECK</option><option>WIRE</option><option>CARD</option><option>CASH</option></select><input placeholder="Reference" value={paymentDraft.reference} onChange={event => setPaymentDraft(current => ({ ...current, reference: event.target.value }))} /><input type="date" value={paymentDraft.paidDate} onChange={event => setPaymentDraft(current => ({ ...current, paidDate: event.target.value }))} /><button onClick={() => { act("record-payment", paymentDraft); setPaymentOpen(false); }}>{t.recordPayment}</button></div> : null}
        </section>

        <section className="bill-section"><h3>{t.notes}</h3><div className="notes-row">{record?.bill?.notes || "—"}</div></section>
        <section className="bill-section"><h3>{t.activity}</h3>{latest ? <div className="activity-row"><span>●</span><div><strong>{latest.label}</strong><small>{latest.actorLabel || ""} · {latest.occurredAt ? new Date(latest.occurredAt).toLocaleString(language === "es" ? "es-MX" : "en-US") : ""}</small></div></div> : <div className="empty-row">—</div>}</section>

        {error ? <div className="bill-error" role="alert">{error}</div> : null}
      </div>

      <div className="bill-footer-actions"><button onClick={() => act("edit")}>✎ {t.edit}</button>{actions.has("void") ? <button onClick={() => act("void")}>⊘ {t.void}</button> : null}<button onClick={() => window?.print?.()}>▣ {t.print}</button><button type="button">⌯ {t.share}</button></div>
      <IXIBillStyles />
    </div>
  );
}
