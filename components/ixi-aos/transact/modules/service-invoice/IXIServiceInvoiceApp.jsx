import { useMemo, useState } from "react";

import { createIXIServiceInvoice } from "./IXIServiceInvoiceCommands";
import { createIXIServiceInvoiceDraft, validateIXIServiceInvoice } from "./IXIServiceInvoiceContract";
import { issueIXIServiceInvoice, recordIXIServiceInvoicePayment, voidIXIServiceInvoice } from "./IXIServiceInvoiceRecordEngine";
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

export default function IXIServiceInvoiceApp({ context = {}, object = {}, workOrder = null, initialRecord = null, language = "en", onBack = null, onRecordChange = null }) {
  const [lang, setLang] = useState(language === "es" ? "es" : "en");
  const t = COPY[lang];
  const actor = context.actor || {};
  const [record, setRecord] = useState(initialRecord);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [dueDate, setDueDate] = useState(plusDays(30));
  const [paymentTerms, setPaymentTerms] = useState("NET 30");
  const [taxAmount, setTaxAmount] = useState("");
  const [depositCredit, setDepositCredit] = useState("");
  const [otherCredit, setOtherCredit] = useState("");
  const [travelFreightAmount, setTravelFreightAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [documents, setDocuments] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("ACH");
  const [paymentReference, setPaymentReference] = useState("");
  const [voidReason, setVoidReason] = useState("");

  const input = useMemo(() => ({ invoiceDate, dueDate, paymentTerms, taxAmount, depositCredit, otherCredit, travelFreightAmount, memo, documents }), [invoiceDate, dueDate, paymentTerms, taxAmount, depositCredit, otherCredit, travelFreightAmount, memo, documents]);
  const preview = useMemo(() => createIXIServiceInvoiceDraft({ context, workOrder: workOrder || {}, input }), [context, workOrder, input]);

  function addDocuments(files) {
    setDocuments(current => [
      ...current,
      ...Array.from(files || []).map((file, index) => ({ documentId: `SINV-DOC-${Date.now()}-${index}`, type: "service-invoice-document", fileName: file.name, mimeType: file.type, size: file.size, status: "local-pending-upload" }))
    ]);
  }

  async function createRecord() {
    const check = validateIXIServiceInvoice(preview);
    setErrors(check.errors);
    if (!check.valid) return;
    setSaving(true);
    try {
      const result = await createIXIServiceInvoice({ object, context, workOrder, input, metadata: { source: "ixi-transact-service-invoice" } });
      setRecord(result.record);
      await onRecordChange?.(result.record, { action: "create", response: result.response }, context);
    } finally { setSaving(false); }
  }

  async function mutate(next, change) {
    setRecord(next);
    await onRecordChange?.(next, change, context);
  }

  if (!workOrder && !record) {
    return <div className="ixi-sinv"><div className="sinv-top"><div><div className="sinv-kicker">IXI TRAN$ACT</div><div className="sinv-title">{t.title}</div></div></div><div className="sinv-error">CUSTOMER SERVICE WORK ORDER REQUIRED</div><button className="sinv-secondary" onClick={() => onBack?.()}>‹ TRAN$ACT</button><IXIServiceInvoiceStyles /></div>;
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
      {r.status === "draft" ? <button className="sinv-primary" onClick={() => mutate(issueIXIServiceInvoice(r, actor), { action: "issue" })}>{t.issue}</button> : null}
      {issued && !paid ? <><div className="sinv-section">{t.payment}</div><div className="sinv-grid2"><Field label="AMOUNT"><Input value={paymentAmount} onChange={setPaymentAmount} inputMode="decimal" /></Field><Field label="METHOD"><select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}><option>ACH</option><option>WIRE</option><option>CHECK</option><option>CARD</option><option>CASH</option><option>OTHER</option></select></Field></div><Field label="REFERENCE"><Input value={paymentReference} onChange={setPaymentReference} /></Field><button className="sinv-primary" onClick={() => mutate(recordIXIServiceInvoicePayment(r, { amount: paymentAmount, method: paymentMethod, reference: paymentReference }, actor), { action: "record-payment" })}>RECORD PAYMENT</button></> : null}
      {r.status === "draft" ? <><Field label="VOID REASON"><Input value={voidReason} onChange={setVoidReason} /></Field><button className="sinv-danger" onClick={() => mutate(voidIXIServiceInvoice(r, { reason: voidReason }, actor), { action: "void" })}>VOID DRAFT</button></> : null}
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
    <Field label="TRAVEL / FREIGHT"><Input value={travelFreightAmount} onChange={setTravelFreightAmount} inputMode="decimal" /></Field>
    <div className="sinv-grid2"><Field label="TAX"><Input value={taxAmount} onChange={setTaxAmount} inputMode="decimal" /></Field><Field label="DEPOSIT / CREDIT"><Input value={depositCredit} onChange={setDepositCredit} inputMode="decimal" /></Field></div>
    <Field label="OTHER CREDIT"><Input value={otherCredit} onChange={setOtherCredit} inputMode="decimal" /></Field>
    <div className="sinv-total"><span>AMOUNT DUE</span><strong>{money(preview.charges?.amountDue)}</strong></div>
    {preview.billingRule?.authorizationException ? <div className="sinv-error">AUTHORIZATION EXCEPTION · {money(preview.billingRule.authorizationExceptionAmount)} ABOVE AUTHORIZED AMOUNT</div> : null}
    <div className="sinv-section">{t.terms}</div>
    <div className="sinv-grid2"><Field label="INVOICE DATE"><Input type="date" value={invoiceDate} onChange={setInvoiceDate} /></Field><Field label="DUE DATE"><Input type="date" value={dueDate} onChange={setDueDate} /></Field></div>
    <Field label="PAYMENT TERMS"><Input value={paymentTerms} onChange={setPaymentTerms} /></Field><Field label="MEMO"><textarea value={memo} onChange={e => setMemo(e.target.value)} /></Field>
    <div className="sinv-section">DOCUMENTS</div><label className="sinv-secondary" style={{display:"block",textAlign:"center",paddingTop:10}}>+ ATTACH DOCUMENT<input type="file" multiple style={{display:"none"}} onChange={e => addDocuments(e.target.files)} /></label>{documents.map(doc => <div className="sinv-row" key={doc.documentId}><strong>{doc.fileName}</strong></div>)}
    {Object.keys(errors).length ? <div className="sinv-error">{Object.keys(errors).map(key => key.toUpperCase()).join(" · ")}</div> : null}
    <button className="sinv-primary" disabled={saving} onClick={createRecord}>{saving ? "CREATING..." : t.create}</button><button className="sinv-secondary" onClick={() => onBack?.()}>‹ TRAN$ACT</button>
    <IXIServiceInvoiceStyles />
  </div>;
}
