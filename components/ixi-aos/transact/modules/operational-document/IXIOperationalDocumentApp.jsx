import { useMemo, useState } from "react";
import { createIXIAosObjectFinancialDocument } from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import { getIXIFinancialDocument } from "../../../financial-runtime/IXIAosFinancialReadClient";

const clean = value => String(value ?? "").trim();
const CONFIG = Object.freeze({ receipt: { label: "RECEIPT", party: "VENDOR / ISSUER", state: "incurred", direction: "outflow" }, quote: { label: "QUOTE", party: "CUSTOMER", state: "planned", direction: "inflow" }, invoice: { label: "INVOICE", party: "CUSTOMER", state: "receivable", direction: "inflow" }, "freight-order": { label: "FREIGHT ORDER", party: "CARRIER", state: "committed", direction: "outflow" } });

export default function IXIOperationalDocumentApp({ context = {}, object = {}, documentType = "receipt", financialRecords = [], onBack, onSaved }) {
  const config = CONFIG[documentType] || CONFIG.receipt;
  const [form, setForm] = useState({ party: "", reference: "", date: new Date().toISOString().slice(0, 10), amount: "", description: "", origin: clean(context?.location?.label), destination: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedNumber, setSavedNumber] = useState("");
  const related = useMemo(() => financialRecords.map(getIXIFinancialDocument).filter(document => clean(document?.documentType) === documentType).slice(0, 3), [financialRecords, documentType]);
  const field = (name, value) => setForm(current => ({ ...current, [name]: value }));
  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    const amount = Math.round(Number(form.amount) * 100) / 100;
    if (!clean(form.party) || !clean(form.description) || !(amount >= 0)) { setError(`${config.party}, description, and a valid amount are required.`); return; }
    if (documentType === "freight-order" && (!clean(form.origin) || !clean(form.destination))) { setError("Freight origin and destination are required."); return; }
    setSaving(true); setError("");
    try {
      const commandId = globalThis.crypto?.randomUUID?.() || `${documentType}-${Date.now()}`;
      const response = await createIXIAosObjectFinancialDocument({ object: { ...object, ...context.primary, passportId: context.primary?.passportId }, documentType, commandId, idempotencyKey: `ixi-${documentType}:${commandId}`, input: { currency: "USD", amount, total: amount, documentNumber: clean(form.reference), occurredAt: form.date, documentDate: form.date, description: clean(form.description), counterpartyLabel: clean(form.party), financialState: config.state, direction: config.direction, status: config.state, origin: clean(form.origin), destination: clean(form.destination), references: context.references || [] }, metadata: { transactModule: documentType, counterpartyLabel: clean(form.party) } });
      const document = response?.financialDocument || response?.record?.financialDocument || {};
      setSavedNumber(clean(document.documentNumber || document.financialDocumentId) || "SAVED");
      await onSaved?.(response);
    } catch (cause) { setError(clean(cause?.message) || `${config.label} was not saved.`); } finally { setSaving(false); }
  }
  return <form className="op-app" onSubmit={submit}><header><button type="button" onClick={onBack}>‹ TRAN$ACT</button><span>{documentType === "freight-order" ? "LOGISTICS" : "FINANCIAL"}</span><strong>{config.label}</strong></header>{error ? <div className="message error">{error}</div> : null}{savedNumber ? <div className="message saved">SAVED · {savedNumber}</div> : null}<label>{config.party}<input value={form.party} onChange={event => field("party", event.target.value)} /></label><div className="pair"><label>REFERENCE<input value={form.reference} onChange={event => field("reference", event.target.value)} /></label><label>DATE<input type="date" value={form.date} onChange={event => field("date", event.target.value)} /></label></div>{documentType === "freight-order" ? <div className="pair"><label>ORIGIN<input value={form.origin} onChange={event => field("origin", event.target.value)} /></label><label>DESTINATION<input value={form.destination} onChange={event => field("destination", event.target.value)} /></label></div> : null}<label>DESCRIPTION<textarea value={form.description} onChange={event => field("description", event.target.value)} /></label><label>AMOUNT (USD)<input type="number" min="0" step="0.01" value={form.amount} onChange={event => field("amount", event.target.value)} /></label><button className="save" disabled={saving}>{saving ? "SAVING TO PASSPORT..." : `SAVE ${config.label}`}</button>{related.length ? <section><span>RECENT ON THIS OBJECT</span>{related.map(document => <div key={document.financialDocumentId}><b>{document.documentNumber || document.financialDocumentId}</b><small>{document.financialState} · ${Number(document?.totals?.total || 0).toFixed(2)}</small></div>)}</section> : null}<style jsx>{`.op-app{height:100%;box-sizing:border-box;padding:10px;background:#0b0b0b;color:#eee;font:800 9px/1.25 Arial;overflow:auto}.op-app header{display:grid;grid-template-columns:auto 1fr;gap:3px 8px;margin-bottom:10px}.op-app header button{grid-row:1/3;border:1px solid #444;background:#151515;color:#ddd;font:900 9px Arial}.op-app header span{color:#ffc400;letter-spacing:.12em}.op-app header strong{font-size:16px}.op-app label{display:flex;flex-direction:column;gap:4px;margin:8px 0;color:#aaa;letter-spacing:.07em}.op-app input,.op-app textarea{box-sizing:border-box;width:100%;border:1px solid #393939;background:#111;color:#fff;padding:7px;font:700 11px Arial}.op-app textarea{min-height:62px;resize:vertical}.pair{display:grid;grid-template-columns:1fr 1fr;gap:7px}.save{width:100%;border:1px solid #8c7100;background:#ffc400;color:#080808;padding:10px;font:1000 10px Arial;cursor:pointer}.save:disabled{opacity:.55}.message{padding:7px;margin:6px 0;border:1px solid #444}.error{color:#ff8b8b;border-color:#7c3030}.saved{color:#b8edb8;border-color:#376f37}section{margin-top:12px;border-top:1px solid #333;padding-top:8px;color:#aaa}section div{display:flex;justify-content:space-between;gap:6px;padding:5px 0;color:#eee}section small{color:#999}`}</style></form>;
}
