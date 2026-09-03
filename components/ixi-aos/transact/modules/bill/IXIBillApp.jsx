import { useEffect, useMemo, useRef, useState } from "react";

import { validateIXITransactFile, createIXIPendingAttachment } from "../../IXITransactFilePolicy";
import { createIXIBill, createIXIBillPayment, updateIXIBill } from "./IXIBillCommands";
import { applyIXIBillAction } from "./IXIBillRecordEngine";
import IXIBillCard from "./IXIBillCard";
import IXIBillStyles from "./IXIBillStyles";

const clean = value => String(value ?? "").trim();
const MAX_BILL_FILE_BYTES = 25 * 1024 * 1024;
const BILL_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const BILL_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"];

const COPY = {
  en: {
    bills: "BILLS",
    subtitle: "Accounts payable · obligations",
    newBill: "+ NEW BILL",
    due: "DUE / ATTENTION",
    overdue: "OVERDUE",
    week: "DUE THIS WEEK",
    approval: "NEEDS APPROVAL",
    exception: "MATCH EXCEPTION",
    empty: "No Bills in this context yet.",
    search: "SEARCH",
    all: "ALL BILLS",
    newTitle: "NEW BILL / INVOICE",
    newSub: "Record an obligation — not a payment",
    vendor: "VENDOR *",
    invoice: "INVOICE / BILL # *",
    description: "WHAT IS THIS FOR? *",
    amount: "AMOUNT *",
    invoiceDate: "INVOICE DATE *",
    dueDate: "DUE DATE",
    category: "CATEGORY",
    related: "RELATED TO",
    po: "PURCHASE ORDER",
    poCommitted: "PO COMMITTED AMOUNT",
    received: "RECEIVED COMPLETE",
    document: "INVOICE / DOCUMENT",
    notes: "NOTES",
    save: "SAVE BILL",
    saving: "SAVING BILL…",
    cancel: "CANCEL",
    fileHelp: "PDF / JPG / PNG · max 25MB",
    yes: "YES",
    no: "NO"
  },
  es: {
    bills: "FACTURAS / CUENTAS",
    subtitle: "Cuentas por pagar · obligaciones",
    newBill: "+ NUEVA FACTURA",
    due: "VENCIMIENTO / ATENCIÓN",
    overdue: "VENCIDAS",
    week: "VENCEN ESTA SEMANA",
    approval: "REQUIEREN APROBACIÓN",
    exception: "EXCEPCIÓN DE CONCILIACIÓN",
    empty: "Aún no hay facturas en este contexto.",
    search: "BUSCAR",
    all: "TODAS",
    newTitle: "NUEVA FACTURA / CUENTA",
    newSub: "Registra una obligación — no un pago",
    vendor: "PROVEEDOR *",
    invoice: "N° DE FACTURA / CUENTA *",
    description: "¿PARA QUÉ ES? *",
    amount: "MONTO *",
    invoiceDate: "FECHA DE FACTURA *",
    dueDate: "FECHA DE VENCIMIENTO",
    category: "CATEGORÍA",
    related: "RELACIONADO CON",
    po: "ORDEN DE COMPRA",
    poCommitted: "MONTO COMPROMETIDO OC",
    received: "RECEPCIÓN COMPLETA",
    document: "FACTURA / DOCUMENTO",
    notes: "NOTAS",
    save: "GUARDAR FACTURA",
    saving: "GUARDANDO…",
    cancel: "CANCELAR",
    fileHelp: "PDF / JPG / PNG · máx. 25MB",
    yes: "SÍ",
    no: "NO"
  }
};

function createRequestId() {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) return `BILL-${globalThis.crypto.randomUUID()}`;
  return `BILL-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function blankInput(context = {}) {
  return {
    clientRequestId: createRequestId(),
    vendorLabel: "",
    invoiceNumber: "",
    description: "",
    amount: "",
    invoiceDate: today(),
    dueDate: "",
    category: "",
    currency: "USD",
    purchaseOrderId: "",
    purchaseOrderNumber: "",
    poCommittedAmount: "",
    receivedAmount: "",
    receivedComplete: false,
    notes: "",
    attachments: [],
    requiredAuthority: 0,
    requiredRole: "",
    currentApproverId: "",
    currentApproverLabel: "",
    relatedLabel: clean(context.primary?.label)
  };
}

function daysFromToday(dateValue) {
  const due = new Date(`${clean(dateValue)}T12:00:00`);
  if (Number.isNaN(due.getTime())) return null;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  return Math.ceil((due.getTime() - start.getTime()) / 86400000);
}

export default function IXIBillApp({
  context = {},
  object = null,
  initialRecords = [],
  authority = {},
  policy = undefined,
  language = "en",
  onLanguageChange = null,
  onBack = null,
  onRecordChange = null
}) {
  const [records, setRecords] = useState(Array.isArray(initialRecords) ? initialRecords : []);
  const [mode, setMode] = useState("queue");
  const [selectedId, setSelectedId] = useState("");
  const [input, setInput] = useState(() => blankInput(context));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const t = COPY[language === "es" ? "es" : "en"];
  const originObject = object || context.primary || {};

  const selected = useMemo(
    () => records.find(record => clean(record?.identity?.billRecordId || record?.identity?.billDocumentId) === selectedId) || null,
    [records, selectedId]
  );

  useEffect(() => {
    setRecords(Array.isArray(initialRecords) ? initialRecords : []);
  }, [initialRecords]);

  const summary = useMemo(() => {
    let overdue = 0;
    let overdueAmount = 0;
    let dueWeek = 0;
    let dueWeekAmount = 0;
    let approval = 0;
    let approvalAmount = 0;
    let exception = 0;
    let exceptionAmount = 0;
    for (const record of records) {
      const amount = Number(record?.bill?.amount || 0);
      const paymentStatus = clean(record?.payment?.status);
      const days = daysFromToday(record?.bill?.dueDate);
      if (paymentStatus !== "paid" && days !== null && days < 0) { overdue += 1; overdueAmount += amount; }
      if (paymentStatus !== "paid" && days !== null && days >= 0 && days <= 7) { dueWeek += 1; dueWeekAmount += amount; }
      if (clean(record?.approval?.status) === "pending") { approval += 1; approvalAmount += amount; }
      if (clean(record?.purchaseMatch?.status) === "exception") { exception += 1; exceptionAmount += amount; }
    }
    return { overdue, overdueAmount, dueWeek, dueWeekAmount, approval, approvalAmount, exception, exceptionAmount };
  }, [records]);

  function patch(key, value) {
    setInput(current => ({ ...current, [key]: value }));
  }

  function chooseFile(file) {
    if (!file) return;
    const result = validateIXITransactFile(file, { maxBytes: MAX_BILL_FILE_BYTES, allowedMimeTypes: BILL_MIME_TYPES, allowedExtensions: BILL_EXTENSIONS });
    if (!result.valid) {
      setError(result.message);
      return;
    }
    const attachment = createIXIPendingAttachment(file, { type: "vendor-invoice" });
    setInput(current => ({ ...current, attachments: [attachment] }));
    setError("");
  }

  async function saveBill() {
    if (busy) return;
    const nextErrors = {};
    if (!clean(input.vendorLabel)) nextErrors.vendorLabel = true;
    if (!clean(input.invoiceNumber)) nextErrors.invoiceNumber = true;
    if (!clean(input.description)) nextErrors.description = true;
    if (!(Number(input.amount) > 0)) nextErrors.amount = true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(clean(input.invoiceDate))) nextErrors.invoiceDate = true;
    if (clean(input.dueDate) && clean(input.dueDate) < clean(input.invoiceDate)) nextErrors.dueDate = true;
    if ((input.attachments || []).some(item => !clean(item?.storageKey || item?.key) || !["uploaded", "available", "verified"].includes(clean(item?.status).toLowerCase()))) nextErrors.attachments = true;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      if (nextErrors.attachments) setError("The invoice file must finish secure upload before this Bill can be saved. Remove it or retry after upload completes.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const result = await createIXIBill({ object: originObject, context, input, policy, metadata: { source: "ixi-transact-bill" } });
      const record = result.record;
      await onRecordChange?.(record, { action: "create", response: result.response });
      setRecords(current => [...current.filter(item => clean(item?.identity?.billDocumentId) !== clean(record?.identity?.billDocumentId)), record]);
      setSelectedId(clean(record?.identity?.billRecordId || record?.identity?.billDocumentId));
      setMode("record");
      setInput(blankInput(context));
    } catch (err) {
      setError(clean(err?.message) || "Bill save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function recordAction(action, payload = {}) {
    if (!selected || busy) return;
    setBusy(true);
    setError("");
    try {
      let paymentResponse = null;
      if (action === "record-payment") {
        const persisted = await createIXIBillPayment({ object: originObject, context, record: selected, input: payload, metadata: { source: "ixi-transact-bill-card" } });
        paymentResponse = persisted.response;
      }
      const local = applyIXIBillAction({ record: selected, action, actor: context.actor || {}, authority, policy, payload });
      const persisted = await updateIXIBill({ record: local, action, metadata: { source: "ixi-transact-bill-card", paymentFinancialDocumentId: clean(paymentResponse?.data?.record?.financialDocument?.financialDocumentId || paymentResponse?.financialDocument?.financialDocumentId) } });
      const next = persisted.record;
      await onRecordChange?.(next, { action, paymentResponse, response: persisted.response, payload });
      setRecords(current => current.map(item => clean(item?.identity?.billRecordId || item?.identity?.billDocumentId) === selectedId ? next : item));
    } catch (err) {
      setError(clean(err?.message) || "Bill action failed.");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "record" && selected) {
    return <IXIBillCard record={selected} context={context} authority={authority} policy={policy} language={language} onLanguageChange={onLanguageChange} onAction={recordAction} busy={busy} error={error} onBack={() => { setMode("queue"); setSelectedId(""); setError(""); }} />;
  }

  return (
    <div className="ixi-bill-app">
      {mode === "new" ? (
        <div className="bill-new">
          <div className="bill-app-head"><div><strong>{t.newTitle}</strong><small>{t.newSub}</small></div><button onClick={() => { setMode("queue"); setError(""); }}>{t.cancel}</button></div>
          <div className="bill-form-grid">
            <label className="wide">{t.vendor}<input className={errors.vendorLabel ? "invalid" : ""} value={input.vendorLabel} onChange={event => patch("vendorLabel", event.target.value)} /></label>
            <label>{t.invoice}<input className={errors.invoiceNumber ? "invalid" : ""} value={input.invoiceNumber} onChange={event => patch("invoiceNumber", event.target.value)} /></label>
            <label>{t.amount}<input className={errors.amount ? "invalid" : ""} inputMode="decimal" value={input.amount} onChange={event => patch("amount", event.target.value)} /></label>
            <label className="wide">{t.description}<textarea className={errors.description ? "invalid" : ""} value={input.description} onChange={event => patch("description", event.target.value)} /></label>
            <label>{t.invoiceDate}<input className={errors.invoiceDate ? "invalid" : ""} type="date" value={input.invoiceDate} onChange={event => patch("invoiceDate", event.target.value)} /></label>
            <label>{t.dueDate}<input type="date" value={input.dueDate} onChange={event => patch("dueDate", event.target.value)} /></label>
            <label>{t.category}<input value={input.category} onChange={event => patch("category", event.target.value)} placeholder="Electric / Utilities" /></label>
            <label>{t.related}<input readOnly value={input.relatedLabel || context.primary?.label || ""} /></label>
            <label>{t.po}<input value={input.purchaseOrderNumber} onChange={event => patch("purchaseOrderNumber", event.target.value)} placeholder="None / PO-####" /></label>
            <label>{t.poCommitted}<input inputMode="decimal" value={input.poCommittedAmount} onChange={event => patch("poCommittedAmount", event.target.value)} /></label>
            <label>{t.received}<select value={input.receivedComplete ? "yes" : "no"} onChange={event => patch("receivedComplete", event.target.value === "yes")}><option value="no">{t.no}</option><option value="yes">{t.yes}</option></select></label>
            <label className="wide">{t.document}<div className="bill-file-box"><input ref={fileRef} type="file" accept="application/pdf,image/jpeg,image/png" onChange={event => chooseFile(event.target.files?.[0])} /><small>{input.attachments?.[0]?.fileName || t.fileHelp}</small></div></label>
            <label className="wide">{t.notes}<textarea value={input.notes} onChange={event => patch("notes", event.target.value)} /></label>
          </div>
          {error ? <div className="bill-error" role="alert">{error}</div> : null}
          <div className="bill-new-actions"><button className="bill-secondary-button" onClick={() => setMode("queue")}>{t.cancel}</button><button className="bill-primary-button" disabled={busy} onClick={saveBill}>{busy ? t.saving : t.save}</button></div>
        </div>
      ) : (
        <div className="bill-queue">
          <div className="bill-app-head"><div><strong>{t.bills}</strong><small>{t.subtitle} · {context.primary?.label || "AOS"}</small></div><button className="bill-primary-button" onClick={() => { setInput(blankInput(context)); setMode("new"); }}>{t.newBill}</button></div>
          <div className="bill-summary-grid">
            <div><small>{t.overdue}</small><strong className="red">{summary.overdue} · ${summary.overdueAmount.toLocaleString()}</strong></div>
            <div><small>{t.week}</small><strong>{summary.dueWeek} · ${summary.dueWeekAmount.toLocaleString()}</strong></div>
            <div><small>{t.approval}</small><strong className="yellow">{summary.approval} · ${summary.approvalAmount.toLocaleString()}</strong></div>
            <div><small>{t.exception}</small><strong className="yellow">{summary.exception} · ${summary.exceptionAmount.toLocaleString()}</strong></div>
          </div>
          <div className="bill-queue-list">
            {records.length ? records.map(record => {
              const id = clean(record?.identity?.billRecordId || record?.identity?.billDocumentId);
              return <button className="bill-queue-item" key={id} onClick={() => { setSelectedId(id); setMode("record"); }}><div><strong>{record?.bill?.vendorLabel}</strong><span>{Number(record?.bill?.amount || 0).toLocaleString("en-US", { style: "currency", currency: record?.bill?.currency || "USD" })}</span><small>{record?.identity?.invoiceNumber} · {record?.bill?.dueDate || "No due date"}</small></div><b>{clean(record?.purchaseMatch?.status) === "exception" ? t.exception : clean(record?.approval?.status) === "pending" ? t.approval : clean(record?.payment?.status).toUpperCase()} ›</b></button>;
            }) : <div className="empty-row">{t.empty}</div>}
          </div>
          <div className="bill-new-actions"><button className="bill-secondary-button" onClick={() => onBack?.()}>{t.all}</button><button className="bill-secondary-button" type="button">⌕ {t.search}</button></div>
          <IXIBillStyles />
        </div>
      )}
      {mode === "new" ? <IXIBillStyles /> : null}
    </div>
  );
}
