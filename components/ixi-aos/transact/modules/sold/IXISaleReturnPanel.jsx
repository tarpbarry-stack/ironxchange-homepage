import { announceInventoryChange } from "../../../../../lib/listings/IXIInventoryEvents";
import { useMemo, useRef, useState } from "react";
import { runIXIActionNoticeLifecycle } from "../../../../ixi-object-system/IXIActionNoticeEngine";

const documentOf = item => item?.financialDocument || item?.document?.financialDocument || item?.document || item || {};
const totalOf = item => Number(item?.totals?.total ?? item?.amount ?? 0);
const active = item => !["draft", "void", "voided", "reversed", "cancelled"].includes(item.financialState);
const format = (value, currency) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
const newCommand = () => globalThis.crypto?.randomUUID?.() || `sale-action-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function IXISaleReturnPanel({ invoice, financialRecords = [], context, onSaved }) {
  const [action, setAction] = useState("");
  const [localRecords, setLocalRecords] = useState([]);
  const [localInvoice, setLocalInvoice] = useState(null);
  const [form, setForm] = useState({ effectiveDate: new Date().toISOString().slice(0, 10), amount: "", taxAmount: "0.00", reason: "", creditId: "", paymentMethod: "wire", reference: "", machineReturned: false });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const command = useRef(newCommand());
  const source = localInvoice || invoice;
  const saleId = source?.financialDocumentId || source?.financialBinding?.financialDocumentId;
  const currency = source?.currency || "USD";
  const documents = useMemo(() => [...new Map([...financialRecords, ...localRecords].map(item => {
    const doc = documentOf(item); return [doc.financialDocumentId, doc];
  })).values()], [financialRecords, localRecords]);
  const credits = documents.filter(doc => active(doc) && doc.creditType === "revenue-credit" && doc.sourceFinancialDocumentId === saleId);
  const remaining = Math.max(0, totalOf(source) - credits.reduce((sum, doc) => sum + totalOf(doc), 0));
  const returnCredit = credits.find(doc => doc.assetSaleAdjustment?.kind === "return");
  const returned = source?.metadata?.inventoryLifecycle?.events?.some(event => event.type === "return-to-private");
  function change(patch) { setForm(current => ({ ...current, ...patch })); command.current = newCommand(); setError(""); }
  function choose(next) {
    setAction(next); setError(""); setMessage(""); command.current = newCommand();
    setForm(current => ({ ...current, machineReturned: false, amount: next === "return-credit" ? remaining.toFixed(2) : "",
      creditId: next === "return" ? returnCredit?.financialDocumentId || "" : credits[0]?.financialDocumentId || "" }));
  }
  async function save(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setMessage("");
    const endpoint = ["price-adjustment", "return-credit"].includes(action) ? "adjustment" : action;
    const body = { commandId: command.current, effectiveDate: form.effectiveDate,
      ...(endpoint === "adjustment" ? { kind: action === "return-credit" ? "return" : "price-adjustment", amount: form.amount, taxAmount: form.taxAmount, reason: form.reason }
      : endpoint === "refund" ? { creditId: form.creditId, amount: form.amount, paymentMethod: form.paymentMethod, reference: form.reference }
      : { creditId: form.creditId, reason: form.reason, machineReturned: form.machineReturned,
        expectedRevision: Number(source?.financialBinding?.revision || source?.server?.revision || 0) }) };
    try {
      const payload = await runIXIActionNoticeLifecycle({ objectId: context?.primary?.objectId || context?.primary?.passportId,
        commandId: command.current, source: "ixi-sale-return", savingMessage: "SAVING SALE UPDATE…",
        successMessage: endpoint === "return" ? "RETURNED TO PRIVATE INVENTORY" : "SALE UPDATE SAVED", errorMessage: "SALE UPDATE NOT SAVED",
        operation: async () => {
          const response = await fetch(`/api/ixi/financial/inventory/sales/${encodeURIComponent(saleId)}/${endpoint}`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
          });
          const result = await response.json();
          if (!response.ok || !result.ok) throw new Error(result.errors?.[0]?.message || result.error || "The sale update was not confirmed. Retry this action with the same details.");
          return result;
        } });
      const savedRecord = payload.data?.record;
      const savedDocument = documentOf(savedRecord);
      if (endpoint === "return") {
        if (savedDocument.financialDocumentId === saleId) setLocalInvoice({ ...savedDocument, financialBinding: { financialDocumentId: saleId, revision: savedRecord.server?.revision } });
        else setLocalInvoice({ ...source, metadata: { ...source.metadata, inventoryLifecycle: { ...source.metadata?.inventoryLifecycle, events: [...(source.metadata?.inventoryLifecycle?.events || []), payload.data?.record] } } });
      } else if (savedDocument.financialDocumentId) setLocalRecords(current => [...current, savedRecord]);
      setMessage(endpoint === "return" ? "Machine returned to private inventory. Original sale and payment history retained." : endpoint === "refund" ? "Actual customer refund recorded." : "Customer credit recorded. Record any actual refund separately.");
      setAction(""); command.current = newCommand();
      announceInventoryChange({ saleId, state: endpoint === "return" ? "owned" : "sold" });
      try { await onSaved?.(source.metadata?.assetSaleRecord, { action: `sale-${endpoint}`, response: payload, invoice: source }, context); }
      catch { setMessage(current => `${current} History refresh is pending; refresh it without repeating the saved action.`); }
    } catch (caught) { setError(caught.message); }
    finally { setBusy(false); }
  }
  return <section className="sale-return-panel">
    <h3>SALE ADJUSTMENTS & RETURN</h3>
    {returned ? <p className="result">RETURNED TO PRIVATE · Sale history retained</p> : null}
    <div className="actions">
      <button type="button" disabled={busy || Boolean(returnCredit) || returned} onClick={() => choose("price-adjustment")}>PRICE ADJUSTMENT</button>
      <button type="button" disabled={busy || Boolean(returnCredit) || returned || remaining <= 0} onClick={() => choose("return-credit")}>REVERSE SALE</button>
      <button type="button" disabled={busy || !credits.length} onClick={() => choose("refund")}>RECORD REFUND</button>
      <button type="button" disabled={busy || !returnCredit || returned} onClick={() => choose("return")}>RETURN TO PRIVATE</button>
    </div>
    {action && <form onSubmit={save}>
      <strong>{action === "price-adjustment" ? "Buyer keeps the machine" : action === "return-credit" ? "Credit the remaining sale" : action === "refund" ? "Record funds already refunded" : "Confirm the machine is back"}</strong>
      <p>{action === "return-credit" ? `Remaining invoice: ${format(remaining, currency)}. The machine stays in SOLD until its return is confirmed.` : action === "refund" ? "Enter the actual payment reference. This records the refund; it does not send money." : action === "return" ? "Private inventory is restored after this save. Refunds and partner settlement remain separately traceable." : "The credit changes the customer's sale amount. The machine remains in SOLD."}</p>
      <fieldset disabled={busy}>
        <label>Effective date<input required type="date" value={form.effectiveDate} onChange={event => change({ effectiveDate: event.target.value })} /></label>
        {action !== "return" && <label>Amount ({currency})<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={event => change({ amount: event.target.value })} /></label>}
        {action === "price-adjustment" && Number(source.totals?.tax ?? source.metadata?.commercialBreakdown?.tax ?? 0) > 0 && <label>Tax included in credit<input required type="number" min="0" step="0.01" value={form.taxAmount} onChange={event => change({ taxAmount: event.target.value })} /></label>}
        {action === "refund" && <><label>Customer credit<select required value={form.creditId} onChange={event => change({ creditId: event.target.value })}>{credits.map(credit => <option key={credit.financialDocumentId} value={credit.financialDocumentId}>{credit.documentNumber} · {format(totalOf(credit), currency)}</option>)}</select></label><label>Method<select value={form.paymentMethod} onChange={event => change({ paymentMethod: event.target.value })}>{["wire", "ach", "check", "cash", "other"].map(method => <option key={method}>{method}</option>)}</select></label><label>Actual payment reference<input required value={form.reference} onChange={event => change({ reference: event.target.value })} /></label></>}
        {action !== "refund" && <label>Reason / evidence<textarea required minLength={3} value={form.reason} onChange={event => change({ reason: event.target.value })} /></label>}
        {action === "return" && <label className="check"><input required type="checkbox" checked={form.machineReturned} onChange={event => change({ machineReturned: event.target.checked })} />Machine has returned to our inventory</label>}
        <button type="submit" className="confirm">{busy ? "SAVING…" : action === "return" ? "CONFIRM RETURN TO PRIVATE" : action === "refund" ? "RECORD ACTUAL REFUND" : "RECORD CUSTOMER CREDIT"}</button>
        <button type="button" onClick={() => setAction("")}>CANCEL</button>
      </fieldset>
    </form>}
    {message && <p role="status" className="result">{message}</p>}
    {error && <p role="alert" className="error">{error}</p>}
    <style jsx>{`
      .sale-return-panel{margin:18px 0;border-top:1px solid #74611e;padding-top:14px;color:#eee}h3{font-size:12px;letter-spacing:.06em;color:#ffcf00}.actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}button{padding:11px 8px;border:1px solid #52574b;border-radius:5px;background:#151b14;color:#eee;font-size:11px;font-weight:800;cursor:pointer;min-height:40px}button:disabled{opacity:.4;cursor:default}form{margin-top:16px;padding:12px;border:1px solid #515c4c;border-radius:7px;background:#11180f}form strong{font-size:14px}p{font-size:12px;line-height:1.5}fieldset{padding:0;border:0;display:grid;gap:12px}label{display:grid;gap:6px;font-size:12px}input,select,textarea{box-sizing:border-box;width:100%;padding:10px;background:#090d08;color:#fff;border:1px solid #69725f;border-radius:4px;font:inherit}textarea{min-height:65px}.check{display:flex;align-items:center}.check input{width:20px;height:20px;flex-shrink:0}.confirm{background:#edc200;color:#171b10;border-color:#ffe56c}.result{color:#b7e6c2}.error{color:#ffb4a7}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid #ffcf00;outline-offset:2px}
    `}</style>
  </section>;
}
