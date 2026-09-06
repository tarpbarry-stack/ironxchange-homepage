import { useEffect, useMemo, useState } from "react";
import {
  createIXIAssetSaleDraft,
  projectIXIAssetSaleCollection,
  validateIXIAssetSale,
} from "./IXIAssetSaleContract";
import { createIXIAssetSale, recordIXIAssetSaleReceipt } from "./IXIAssetSaleCommands";
import { uploadIXIAosFinancialAttachment } from "../../../financial-runtime/IXIAosFinancialReadClient";
import { getIXITransactRecordIndex } from "../../IXITransactRecordIndex";
import { getIXIMachineCostBasis } from "../../IXIMachineCostBasisEngine";
import { validateIXITransactFile } from "../../IXITransactFilePolicy";
import IXIAssetSaleStyles from "./IXIAssetSaleStyles";

const clean = value => String(value ?? "").trim();
const money = value => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
}).format(Number(value || 0));
const today = () => new Date().toISOString().slice(0, 10);
const revisionOf = invoice => Number(invoice?.financialBinding?.revision || invoice?.server?.revision || 0);
const invoiceIdOf = invoice => clean(invoice?.financialBinding?.financialDocumentId || invoice?.financialDocumentId);
const billOfSaleDefault = invoice => {
  return clean(invoice?.metadata?.billOfSaleNumber);
};

const COPY = {
  en: {
    title: "SOLD CLOSEOUT",
    invoiceControl: "SOURCE INVOICE",
    invoice: "INVOICE #",
    invoiceState: "INVOICE STATE",
    buyer: "BUYER",
    collection: "CUSTOMER COLLECTION",
    received: "RECEIVED",
    credits: "CREDITS / ALLOWANCES",
    balance: "BALANCE DUE",
    payment: "RECORD CUSTOMER RECEIPT",
    paymentAmount: "RECEIPT AMOUNT",
    paymentDate: "RECEIPT DATE",
    method: "METHOD",
    reference: "BANK / CHECK / QUICKBOOKS REFERENCE",
    closeout: "SALE CLOSEOUT",
    date: "CLOSED / SOLD DATE",
    billOfSale: "BILL OF SALE #",
    hours: "HOURS AT SALE",
    notes: "CLOSEOUT NOTES",
    documents: "CLOSING DOCUMENTS",
    uploading: "SECURING + VERIFYING EVIDENCE…",
    verified: "SERVER VERIFIED",
    record: "VERIFY FUNDS + RECORD SOLD",
    invoiceRequired: "ISSUE THE INVOICE IN STEP 4 BEFORE RECORDING PAYMENT OR SOLD.",
    fundsRequired: "SOLD REMAINS LOCKED UNTIL THE CANONICAL INVOICE BALANCE IS $0.00.",
    paid: "FUNDS VERIFIED · READY TO CLOSE",
    invoiceTotal: "INVOICE TOTAL",
    type: "TYPE",
    asset: "ASSET",
    customer: "CUSTOMER",
    addBillOfSale: "+ BILL OF SALE",
    addDocument: "+ OTHER DOCUMENT",
    blocked: "BLOCKED",
    verifying: "VERIFYING…",
    soldStatus: "✓ SOLD · FUNDS COLLECTED",
    settlement: "SETTLEMENT",
    ready: "READY",
    footer: "INVOICE BILLS · SOLD CLOSES AFTER COLLECTION · SETTLEMENT DISBURSES PROCEEDS",
  },
  es: {
    title: "CIERRE DE VENTA",
    invoiceControl: "FACTURA DE ORIGEN",
    invoice: "FACTURA #",
    invoiceState: "ESTADO DE FACTURA",
    buyer: "COMPRADOR",
    collection: "COBRANZA DEL CLIENTE",
    received: "RECIBIDO",
    credits: "CRÉDITOS / AJUSTES",
    balance: "SALDO PENDIENTE",
    payment: "REGISTRAR PAGO DEL CLIENTE",
    paymentAmount: "IMPORTE RECIBIDO",
    paymentDate: "FECHA DE PAGO",
    method: "MÉTODO",
    reference: "REFERENCIA BANCARIA / CHEQUE / QUICKBOOKS",
    closeout: "CIERRE DE VENTA",
    date: "FECHA DE CIERRE / VENTA",
    billOfSale: "CONTRATO DE VENTA #",
    hours: "HORAS AL VENDER",
    notes: "NOTAS DE CIERRE",
    documents: "DOCUMENTOS DE CIERRE",
    uploading: "PROTEGIENDO + VERIFICANDO EVIDENCIA…",
    verified: "VERIFICADO POR EL SERVIDOR",
    record: "VERIFICAR FONDOS + REGISTRAR VENDIDO",
    invoiceRequired: "EMITA LA FACTURA EN EL PASO 4 ANTES DE REGISTRAR EL PAGO O LA VENTA.",
    fundsRequired: "VENDIDO PERMANECE BLOQUEADO HASTA QUE EL SALDO DE LA FACTURA SEA $0.00.",
    paid: "FONDOS VERIFICADOS · LISTO PARA CERRAR",
    invoiceTotal: "TOTAL DE FACTURA",
    type: "TIPO",
    asset: "ACTIVO",
    customer: "CLIENTE",
    addBillOfSale: "+ CONTRATO DE VENTA",
    addDocument: "+ OTRO DOCUMENTO",
    blocked: "BLOQUEADO",
    verifying: "VERIFICANDO…",
    soldStatus: "✓ VENDIDO · FONDOS COBRADOS",
    settlement: "LIQUIDACIÓN",
    ready: "LISTA",
    footer: "FACTURA GENERA EL COBRO · VENDIDO CIERRA DESPUÉS DEL PAGO · LIQUIDACIÓN DISTRIBUYE LOS FONDOS",
  },
};

function Field({ label, children }) {
  return <div className="sale-field"><label>{label}</label>{children}</div>;
}

function Input({ value, onChange, ...props }) {
  return <input {...props} value={value ?? ""} onChange={event => onChange?.(event.target.value)} />;
}

export default function IXIAssetSaleApp({
  context = {},
  object = {},
  dealId = "",
  sourceInvoice = null,
  financialRecords = [],
  initialRecord = null,
  language = "en",
  onBack = null,
  onRecordChange = null,
}) {
  const primary = context.primary || {};
  const [lang, setLang] = useState(language === "es" ? "es" : "en");
  const copy = COPY[lang];
  const [record, setRecord] = useState(initialRecord);
  const [invoiceSnapshot, setInvoiceSnapshot] = useState(sourceInvoice || {});
  const [localReceipts, setLocalReceipts] = useState(initialRecord?.collection?.receipts || []);
  const [type, setType] = useState(initialRecord?.sale?.type || "sale");
  const [saleDate, setSaleDate] = useState(initialRecord?.sale?.saleDate || today());
  const [billOfSaleNumber, setBillOfSaleNumber] = useState(
    initialRecord?.sale?.billOfSaleNumber || billOfSaleDefault(sourceInvoice),
  );
  const [hoursAtSale, setHoursAtSale] = useState(initialRecord?.sale?.hoursAtSale || "");
  const [notes, setNotes] = useState(initialRecord?.sale?.notes || "");
  const [documents, setDocuments] = useState(initialRecord?.documents || sourceInvoice?.attachments || []);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(today());
  const [payMethod, setPayMethod] = useState("wire");
  const [payReference, setPayReference] = useState("");
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!sourceInvoice) return;
    setInvoiceSnapshot(current => {
      if (invoiceIdOf(current) === invoiceIdOf(sourceInvoice) && revisionOf(current) > revisionOf(sourceInvoice)) return current;
      return sourceInvoice;
    });
    setBillOfSaleNumber(current => current || billOfSaleDefault(sourceInvoice));
  }, [sourceInvoice]);

  const collection = useMemo(() => projectIXIAssetSaleCollection({
    sourceInvoice: invoiceSnapshot,
    financialRecords,
    receipts: localReceipts,
  }), [financialRecords, invoiceSnapshot, localReceipts]);
  const costBasis = useMemo(
    () => getIXIMachineCostBasis(getIXITransactRecordIndex(financialRecords)),
    [financialRecords],
  );

  const customer = useMemo(() => invoiceSnapshot?.metadata?.customer || {}, [invoiceSnapshot]);
  const input = useMemo(() => ({
    dealId,
    sourceFinancialDocumentId: invoiceIdOf(invoiceSnapshot),
    sourceInvoice: invoiceSnapshot,
    financialRecords,
    receipts: collection.receipts,
    type,
    buyerPassportId: clean(customer.passportId),
    buyerId: clean(customer.customerId || customer.id),
    buyerLabel: clean(customer.name || initialRecord?.sale?.buyerLabel),
    buyerContact: clean(customer.contactName || initialRecord?.sale?.buyerContact),
    buyerEmail: clean(customer.email || initialRecord?.sale?.buyerEmail),
    buyerPhone: clean(customer.phone || initialRecord?.sale?.buyerPhone),
    saleDate,
    terms: clean(invoiceSnapshot.paymentTerms || initialRecord?.sale?.terms),
    dueDate: clean(invoiceSnapshot.dueDate || initialRecord?.sale?.dueDate),
    buyerPoNumber: clean(invoiceSnapshot.externalReference || initialRecord?.sale?.buyerPoNumber),
    billOfSaleNumber,
    hoursAtSale,
    notes,
    documents,
    assetCostBasis: costBasis.totalInvested,
  }), [
    billOfSaleNumber,
    collection.receipts,
    customer,
    costBasis.totalInvested,
    dealId,
    documents,
    financialRecords,
    hoursAtSale,
    initialRecord,
    invoiceSnapshot,
    notes,
    saleDate,
    type,
  ]);
  const preview = useMemo(() => createIXIAssetSaleDraft({ context, input }), [context, input]);
  const invoiceState = clean(invoiceSnapshot?.financialState).toLowerCase();
  const invoiceIssued = ["billed", "partially-collected", "collected"].includes(invoiceState);
  const readyToClose = invoiceIssued && collection.balanceDue <= 0.005;
  const verifiedBillOfSale = documents.some(document =>
    clean(document?.type).toLowerCase() === "bill-of-sale" &&
    clean(document?.status).toLowerCase() === "verified" &&
    clean(document?.verification),
  );
  const closeoutReady = readyToClose && Boolean(clean(billOfSaleNumber)) && verifiedBillOfSale;

  async function addDocuments(files, typeLabel) {
    const selected = Array.from(files || []);
    if (!selected.length) return;
    const invoiceId = invoiceIdOf(invoiceSnapshot);
    if (!invoiceId) {
      setError("Issue the canonical Invoice before uploading closing evidence.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of selected) {
        const validation = validateIXITransactFile(file, {
          maxBytes: 10 * 1024 * 1024,
          allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
          allowedExtensions: [".pdf", ".jpg", ".jpeg", ".png", ".webp"],
        });
        if (!validation.valid) throw new Error(validation.message);
        uploaded.push(await uploadIXIAosFinancialAttachment({
          financialDocumentId: invoiceId,
          file,
          type: typeLabel,
        }));
      }
      setDocuments(current => typeLabel === "bill-of-sale"
        ? [...current.filter(document => clean(document?.type).toLowerCase() !== "bill-of-sale"), ...uploaded]
        : [...current, ...uploaded]);
    } catch (caught) {
      setError(clean(caught?.message) || "Closing evidence could not be secured.");
    } finally {
      setUploading(false);
    }
  }

  async function receipt() {
    setError("");
    setWarning("");
    setSaving(true);
    try {
      const result = await recordIXIAssetSaleReceipt({
        object: {
          ...object,
          passportId: primary.passportId,
          objectId: primary.objectId,
          objectType: primary.objectType,
          label: primary.label,
        },
        context,
        sale: preview,
        sourceInvoice: invoiceSnapshot,
        input: {
          amount: payAmount,
          date: payDate,
          method: payMethod,
          reference: payReference,
        },
      });
      const receipts = [...collection.receipts, result.payment];
      const nextInvoice = result.invoice || invoiceSnapshot;
      const next = createIXIAssetSaleDraft({
        context,
        input: { ...input, sourceInvoice: nextInvoice, receipts },
      });
      setLocalReceipts(receipts);
      setInvoiceSnapshot(nextInvoice);
      setPayAmount("");
      setPayReference("");
      setWarning(result.syncWarning);
      await onRecordChange?.(
        next,
        {
          action: "record-buyer-payment",
          payment: result.payment,
          response: result.response,
          invoiceResponse: result.invoiceResponse,
          invoice: nextInvoice,
          warning: result.syncWarning,
        },
        context,
      );
    } catch (caught) {
      setError(clean(caught?.message) || "Customer receipt could not be recorded.");
    } finally {
      setSaving(false);
    }
  }

  async function closeSale() {
    const check = validateIXIAssetSale(preview, invoiceSnapshot);
    setErrors(check.errors);
    setError("");
    if (!check.valid) return;
    setSaving(true);
    try {
      const result = await createIXIAssetSale({
        object: {
          ...object,
          passportId: primary.passportId,
          objectId: primary.objectId,
          objectType: primary.objectType,
          label: primary.label,
        },
        context,
        input,
      });
      setRecord(result.record);
      setInvoiceSnapshot(result.invoice);
      await onRecordChange?.(
        result.record,
        {
          action: "record-sold",
          response: result.response,
          invoice: result.invoice,
          passportState: result.record.passportState,
        },
        context,
      );
    } catch (caught) {
      setError(clean(caught?.message) || "SOLD closeout could not be completed.");
    } finally {
      setSaving(false);
    }
  }

  const shownRecord = record || preview;
  const shownCollection = record?.collection || collection;

  return <div className="ixi-sale">
    <div className="sale-top">
      <div>
        <div className="sale-k">IXI TRAN$ACT</div>
        <div className="sale-title">{copy.title}</div>
        <div className="sale-id">{record?.identity?.number || clean(invoiceSnapshot?.documentNumber)}</div>
      </div>
      <div className="sale-lang">
        <button type="button" className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>ENG</button>
        <button type="button" className={lang === "es" ? "on" : ""} onClick={() => setLang("es")}>ESP</button>
      </div>
    </div>

    <div className="sale-context">
      <strong>{shownRecord.context?.assetLabel || primary.label || copy.asset}</strong>
      <small>{shownRecord.sale?.buyerLabel || copy.customer}</small>
    </div>

    <div className="sale-section">{copy.invoiceControl}</div>
    <div className="sale-grid">
      <Field label={copy.invoice}><Input readOnly value={invoiceSnapshot?.documentNumber || "—"} /></Field>
      <Field label={copy.invoiceState}><Input readOnly value={(invoiceState || "draft").toUpperCase()} /></Field>
    </div>
    <div className="sale-grid">
      <Field label={copy.buyer}><Input readOnly value={shownRecord.sale?.buyerLabel || "—"} /></Field>
      <Field label={copy.invoiceTotal}><Input readOnly value={money(shownCollection.invoiceTotal || shownRecord.sale?.salePrice)} /></Field>
    </div>

    <div className="sale-section">{copy.collection}</div>
    <div className="sale-money"><span>{copy.received}</span><b>{money(shownCollection.amountReceived)}</b></div>
    <div className="sale-money"><span>{copy.credits}</span><b>{money(shownCollection.creditedAmount)}</b></div>
    <div className="sale-total"><span>{copy.balance}</span><strong>{money(shownCollection.balanceDue)}</strong></div>
    {shownCollection.receipts?.map(receiptItem => <div className="sale-row" key={receiptItem.paymentId || receiptItem.recordedAt}>
      <div className="sale-rowhead"><strong>{clean(receiptItem.method).toUpperCase()}</strong><b>{money(receiptItem.amount)}</b></div>
      <small>{receiptItem.date} · {receiptItem.reference || "—"}</small>
    </div>)}

    {!record && invoiceIssued && shownCollection.balanceDue > 0.005 ? <>
      <div className="sale-grid">
        <Field label={copy.paymentAmount}><Input value={payAmount} onChange={setPayAmount} inputMode="decimal" /></Field>
        <Field label={copy.paymentDate}><Input type="date" value={payDate} onChange={setPayDate} /></Field>
      </div>
      <div className="sale-grid">
        <Field label={copy.method}>
          <select value={payMethod} onChange={event => setPayMethod(event.target.value)}>
            <option value="wire">WIRE</option><option value="ach">ACH</option><option value="check">CHECK</option><option value="cash">CASH</option><option value="other">OTHER</option>
          </select>
        </Field>
        <Field label={copy.reference}><Input value={payReference} onChange={setPayReference} /></Field>
      </div>
      <button type="button" className="sale-primary" disabled={saving} onClick={receipt}>{copy.payment}</button>
    </> : null}

    {!record ? <>
      <div className={`sale-readiness ${readyToClose ? "ready" : "locked"}`}>
        {readyToClose ? copy.paid : invoiceIssued ? copy.fundsRequired : copy.invoiceRequired}
      </div>
      <div className="sale-section">{copy.closeout}</div>
      <div className="sale-grid">
        <Field label={copy.type}><select value={type} onChange={event => setType(event.target.value)}><option value="sale">SALE</option><option value="auction-sale">AUCTION SALE</option><option value="trade">TRADE</option><option value="transfer">TRANSFER</option><option value="total-loss">TOTAL LOSS</option><option value="scrap">SCRAP</option><option value="other">OTHER</option></select></Field>
        <Field label={copy.date}><Input type="date" value={saleDate} onChange={setSaleDate} /></Field>
      </div>
      <div className="sale-grid">
        <Field label={copy.billOfSale}><Input value={billOfSaleNumber} onChange={setBillOfSaleNumber} /></Field>
        <Field label={copy.hours}><Input value={hoursAtSale} onChange={setHoursAtSale} inputMode="decimal" /></Field>
      </div>
      <div className="sale-section">{copy.documents}</div>
      <div className="sale-docs">
        <button type="button" disabled={uploading} onClick={() => document.getElementById("sale-bos")?.click()}>{copy.addBillOfSale}</button>
        <button type="button" disabled={uploading} onClick={() => document.getElementById("sale-doc")?.click()}>{copy.addDocument}</button>
      </div>
      <input id="sale-bos" hidden type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={event => { addDocuments(event.target.files, "bill-of-sale"); event.target.value = ""; }} />
      <input id="sale-doc" hidden type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" onChange={event => { addDocuments(event.target.files, "other"); event.target.value = ""; }} />
      {uploading ? <div className="sale-warning">{copy.uploading}</div> : null}
      {documents.map(document => <div className="sale-row" key={document.attachmentId || document.storageKey}>
        <div className="sale-rowhead"><strong>{document.fileName}</strong><b>{copy.verified}</b></div>
        <small>{clean(document.type).replace(/-/g, " ").toUpperCase()} · SHA-256</small>
      </div>)}
      <Field label={copy.notes}><textarea value={notes} onChange={event => setNotes(event.target.value)} /></Field>
      {Object.keys(errors).length ? <div className="sale-error">{copy.blocked}: {Object.values(errors).join(" · ").toUpperCase()}</div> : null}
      <button type="button" className="sale-primary" disabled={saving || uploading || !closeoutReady} onClick={closeSale}>{saving ? copy.verifying : copy.record}</button>
    </> : <div className="sale-status"><strong>{copy.soldStatus}</strong><div className="sale-money"><span>{copy.settlement}</span><b>{copy.ready}</b></div></div>}

    {warning ? <div className="sale-warning">{warning}</div> : null}
    {error ? <div className="sale-error">{error}</div> : null}
    <button type="button" className="sale-secondary" onClick={() => onBack?.()}>‹ TRAN$ACT</button>
    <div className="sale-foot">{copy.footer}</div>
    <IXIAssetSaleStyles />
  </div>;
}
