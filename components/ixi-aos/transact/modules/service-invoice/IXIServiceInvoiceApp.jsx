import IXIMoneyInput from "../../IXIMoneyInput";
import { useMemo, useRef, useState, useEffect } from "react";

import { createIXIServiceInvoice, updateIXIServiceInvoice, hydrateIXIServiceInvoice } from "./IXIServiceInvoiceCommands";
import { createIXIServiceInvoiceDraft, validateIXIServiceInvoice } from "./IXIServiceInvoiceContract";
import IXIServiceInvoiceReceipt from "./IXIServiceInvoiceReceipt";
import { loadIXIAosFinancialDocument } from "../../../financial-runtime/IXIAosFinancialReadClient";
import IXIServiceInvoiceStyles from "./IXIServiceInvoiceStyles";

const clean = value => String(value ?? "").trim();
const money = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
const today = () => new Date().toISOString().slice(0, 10);
const plusDays = days => { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };

const COPY = {
  en: {
    title: "SERVICE INVOICE",
    record: "SERVICE INVOICE RECORD",
    create: "CREATE SERVICE INVOICE",
    issue: "ISSUE SERVICE INVOICE",
    billing: "BILLING REVIEW",
    comparison: "QUOTE / AUTHORIZED / ACTUAL",
    terms: "TERMS / DUE",
    payment: "RECORD CUSTOMER PAYMENT"
  },
  es: {
    title: "FACTURA DE SERVICIO",
    record: "REGISTRO DE FACTURA",
    create: "CREAR FACTURA DE SERVICIO",
    issue: "EMITIR FACTURA DE SERVICIO",
    billing: "REVISIÓN DE COBRO",
    comparison: "COTIZADO / AUTORIZADO / REAL",
    terms: "TÉRMINOS / VENCIMIENTO",
    payment: "REGISTRAR PAGO DEL CLIENTE"
  }
};

function Field({ label, children }) { return <div className="sinv-field"><label>{label}</label>{children}</div>; }
function Input({ value, onChange, ...props }) { return <input value={value} onChange={e => onChange(e.target.value)} {...props} />; }

export default function IXIServiceInvoiceApp({ context = {}, object = {}, workOrder: suppliedWorkOrder = null, financialRecords = [], onFinancialRecordsChange = null, initialRecord = null, language = "en", onBack = null, onRecordChange = null }) {
  const [lang, setLang] = useState(language === "es" ? "es" : "en");
  const t = COPY[lang];
  const actor = context.actor || {};
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState("");
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const createCommand = useRef(crypto.randomUUID());
  const workOrders = financialRecords.map(item => { const document = item.financialDocument || item.record?.financialDocument; return document?.workOrder ? { ...document.workOrder, financialBinding: { financialDocumentId: document.financialDocumentId, revision: item.server?.revision || item.record?.server?.revision } } : null; }).filter(item => item?.customer?.name);
  const workOrder = suppliedWorkOrder || workOrders.find(item => item.financialBinding.financialDocumentId === selectedWorkOrderId) || null;
  const [record, setRecord] = useState(initialRecord);
  useEffect(() => { if (initialRecord) setRecord(initialRecord); }, [initialRecord]);
  useEffect(() => {
    if (!workOrder || record) return;
    const id = workOrder.financialBinding?.financialDocumentId || workOrder.identity?.workOrderId;
    const existing = financialRecords.find(item => { const doc = item.financialDocument || item.record?.financialDocument; return doc?.serviceInvoice && doc.sourceFinancialDocumentId === id && !["void", "reversed"].includes(doc.financialState); });
    if (existing) setRecord(hydrateIXIServiceInvoice(existing, financialRecords));
  }, [workOrder, financialRecords, record]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [dueDate, setDueDate] = useState(plusDays(30));
  const [paymentTerms, setPaymentTerms] = useState("NET 30");
  const [taxAmount, setTaxAmount] = useState("");
  const [travelFreightAmount, setTravelFreightAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [voidReason, setVoidReason] = useState("");

  const input = useMemo(() => ({ invoiceDate, dueDate, paymentTerms, taxAmount, travelFreightAmount, memo }), [invoiceDate, dueDate, paymentTerms, taxAmount, travelFreightAmount, memo]);
  const preview = useMemo(() => createIXIServiceInvoiceDraft({ context, workOrder: workOrder || {}, input }), [context, workOrder, input]);

  async function createRecord() {
    const check = validateIXIServiceInvoice(preview);
    setErrors(check.errors);
    if (!check.valid) return;
    setSaving(true);
    try {
      const result = await createIXIServiceInvoice({ object, context, workOrder, input, commandId: createCommand.current, metadata: { source: "ixi-transact-service-invoice" } });
      setRecord(result.record);
      await onRecordChange?.(result.record, { action: "create", response: result.response }, context);
    } catch (error) { setErrors({ save: error.message }); } finally { setSaving(false); }
  }

  async function mutate(action) {
    if (saving) return;
    setSaving(true); setErrors({});
    try {
      const result = await updateIXIServiceInvoice({ record, action, actor, reason: voidReason });
      setRecord(result.record);
      await onFinancialRecordsChange?.();
      await onRecordChange?.(result.record, { action, response: result.response }, context);
    } catch (error) { setErrors({ save: error.message }); }
    finally { setSaving(false); }
  }
  async function reloadInvoice(receipt = null) {
    const canonical = await loadIXIAosFinancialDocument({ financialDocumentId: record.financialBinding.financialDocumentId });
    setRecord(hydrateIXIServiceInvoice(canonical, receipt ? [...financialRecords, receipt] : financialRecords));
    await onFinancialRecordsChange?.();
  }

  if (!workOrder && !record) {
    return <div className="ixi-sinv"><div className="sinv-top"><div><div className="sinv-kicker">IXI TRAN$ACT</div><div className="sinv-title">{t.title}</div></div></div><div className="sinv-error">SELECT A CUSTOMER SERVICE WORK ORDER</div><select aria-label="Service work order" value={selectedWorkOrderId} onChange={event => setSelectedWorkOrderId(event.target.value)}><option value="">Choose work order</option>{workOrders.map(item => <option key={item.financialBinding.financialDocumentId} value={item.financialBinding.financialDocumentId}>{item.identity?.number || item.work?.title || item.financialBinding.financialDocumentId}</option>)}</select><button className="sinv-secondary" onClick={() => onBack?.()}>‹ TRAN$ACT</button><IXIServiceInvoiceStyles /></div>;
  }

  if (record) {
    const r = record;
    const issued = r.status === "issued";
    const paid = r.ar?.status === "paid";
    return <div className="ixi-sinv">
      <div className="sinv-top"><div><div className="sinv-kicker">IXI TRAN$ACT</div><div className="sinv-title">{t.record}</div><div className="sinv-id">{r.identity?.number}</div></div><div className="sinv-lang"><button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>ENG</button><button className={lang === "es" ? "on" : ""} onClick={() => setLang("es")}>ESP</button></div></div>
      <div className="sinv-context"><strong>{r.customer?.name} · {r.asset?.label}</strong><small>{r.source?.customerServiceWorkOrderId} · {r.source?.serviceQuoteNumber} REV {r.source?.acceptedRevision}</small></div>
      <div className="sinv-status"><div className="sinv-statushead"><strong className={paid ? "sinv-ok" : issued ? "sinv-warn" : ""}>{r.status?.toUpperCase()} · {r.ar?.status?.toUpperCase()}</strong><b>{money(r.ar?.balanceDue)}</b></div><small>DUE {r.terms?.dueDate} · {r.terms?.paymentTerms}</small></div>
      <div className="sinv-section">{t.comparison}</div>
      <div className="sinv-money"><span>QUOTED</span><b>{money(r.comparison?.quotedRevenue)}</b></div>
      <div className="sinv-money"><span>AUTHORIZED</span><b>{money(r.comparison?.authorizedRevenue)}</b></div>
      <div className="sinv-money"><span>ACTUAL INTERNAL COST</span><b>{money(r.comparison?.actualInternalCost)}</b></div>
      <div className="sinv-money"><span>INVOICED THIS RECORD</span><b>{money(r.charges?.amountDue)}</b></div>
      <div className="sinv-money"><span>RECEIVED</span><b>{money(r.ar?.amountReceived)}</b></div>
      <div className="sinv-total"><span>BALANCE DUE</span><strong>{money(r.ar?.balanceDue)}</strong></div>
      <div className="sinv-section">BILLING RULE</div>
      <div className="sinv-callout"><b>{clean(r.source?.pricingType).replace(/-/g, " ").toUpperCase()}</b><br/>AUTHORIZED {money(r.billingRule?.authorized)} · ACTUAL BILLABLE {money(r.billingRule?.actualBillable)}</div>
      {r.billingRule?.authorizationException ? <div className="sinv-error">AUTHORIZATION EXCEPTION · {money(r.billingRule?.authorizationExceptionAmount)} ABOVE AUTHORIZED AMOUNT</div> : null}
      {r.status === "draft" ? <button className="sinv-primary" disabled={saving} onClick={() => mutate("issue")}>{t.issue}</button> : null}
      {issued ? <><button className="sinv-primary" onClick={() => setPaymentsOpen(value => !value)}>{paid ? "PAYMENT DETAILS" : "RECORD MONEY RECEIVED"}</button>{paymentsOpen ? <IXIServiceInvoiceReceipt context={context} object={object} invoiceId={r.financialBinding.financialDocumentId} onChanged={reloadInvoice} /> : null}</> : null}
      {r.status === "draft" ? <><Field label="VOID REASON"><Input value={voidReason} onChange={setVoidReason} /></Field><button className="sinv-danger" disabled={saving} onClick={() => mutate("void")}>VOID DRAFT</button></> : null}
      {errors.save ? <div className="sinv-error" role="alert">{errors.save}</div> : null}
      <div className="sinv-section">ACTIVITY</div>{(r.timeline || []).slice().reverse().map(item => <div className="sinv-row" key={item.activityId}><div className="sinv-rowhead"><strong>{clean(item.type).replace(/-/g, " ").toUpperCase()}</strong><b>{item.amount ? money(item.amount) : ""}</b></div><small>{item.actorLabel || "SYSTEM"} · {item.occurredAt}</small></div>)}
      <button className="sinv-secondary" onClick={() => onBack?.()}>‹ TRAN$ACT</button>
      <div className="sinv-foot">Quote authorizes. Work Order records actual work. Service Invoice creates A/R. Payment records cash received.</div>
      <IXIServiceInvoiceStyles />
    </div>;
  }

  const pricingType = preview.source?.pricingType;
  return <div className="ixi-sinv">
    <div className="sinv-top"><div><div className="sinv-kicker">IXI TRAN$ACT</div><div className="sinv-title">{t.title}</div></div><div className="sinv-lang"><button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>ENG</button><button className={lang === "es" ? "on" : ""} onClick={() => setLang("es")}>ESP</button></div></div>
    <div className="sinv-context"><strong>{preview.customer?.name || "CUSTOMER"} · {preview.asset?.label || context.primary?.label}</strong><small>{preview.source?.customerServiceWorkOrderId} · {preview.source?.serviceQuoteNumber} REV {preview.source?.acceptedRevision}</small></div>
    <div className="sinv-section">{t.comparison}</div>
    <div className="sinv-money"><span>QUOTED</span><b>{money(preview.comparison?.quotedRevenue)}</b></div>
    <div className="sinv-money"><span>AUTHORIZED</span><b>{money(preview.comparison?.authorizedRevenue)}</b></div>
    <div className="sinv-money"><span>ACTUAL INTERNAL COST</span><b>{money(preview.comparison?.actualInternalCost)}</b></div>
    <div className="sinv-section">{t.billing}</div>
    <div className="sinv-callout"><b>{clean(pricingType).replace(/-/g, " ").toUpperCase()}</b><br/>{pricingType === "fixed-price" ? "Invoice follows authorized fixed value." : pricingType === "not-to-exceed" ? "Invoice cannot exceed authorization without approved Change Order." : "Invoice follows actual billable work; authorization variance remains visible."}</div>
    <div className="sinv-money"><span>LABOR ACTUAL</span><b>{money(preview.charges?.labor)}</b></div>
    <div className="sinv-money"><span>PARTS / MATERIAL</span><b>{money(preview.charges?.material)}</b></div>
    <div className="sinv-money"><span>OUTSIDE SERVICE</span><b>{money(preview.charges?.outsideService)}</b></div>
    <div className="sinv-money"><span>OTHER</span><b>{money(preview.charges?.other)}</b></div>
    <Field label="TRAVEL / FREIGHT"><IXIMoneyInput value={travelFreightAmount} onValueChange={setTravelFreightAmount} inputMode="decimal" /></Field>
    <Field label="TAX"><IXIMoneyInput value={taxAmount} onValueChange={setTaxAmount} inputMode="decimal" /></Field>
    <div className="sinv-total"><span>AMOUNT DUE</span><strong>{money(preview.charges?.amountDue)}</strong></div>
    {preview.billingRule?.authorizationException ? <div className="sinv-error">AUTHORIZATION EXCEPTION · {money(preview.billingRule.authorizationExceptionAmount)} ABOVE AUTHORIZED AMOUNT</div> : null}
    <div className="sinv-section">{t.terms}</div>
    <div className="sinv-grid2"><Field label="INVOICE DATE"><Input type="date" value={invoiceDate} onChange={setInvoiceDate} /></Field><Field label="DUE DATE"><Input type="date" value={dueDate} onChange={setDueDate} /></Field></div>
    <Field label="PAYMENT TERMS"><Input value={paymentTerms} onChange={setPaymentTerms} /></Field><Field label="MEMO"><textarea value={memo} onChange={e => setMemo(e.target.value)} /></Field>
    <p>Supporting documents remain linked through the source work order. Record deposits and payments against the issued invoice.</p>
    {Object.keys(errors).length ? <div className="sinv-error">{Object.entries(errors).map(([key, value]) => `${key.toUpperCase()}: ${value}`).join(" · ")}</div> : null}
    <button className="sinv-primary" disabled={saving} onClick={createRecord}>{saving ? "CREATING..." : t.create}</button><button className="sinv-secondary" onClick={() => onBack?.()}>‹ TRAN$ACT</button>
    <IXIServiceInvoiceStyles />
  </div>;
}
