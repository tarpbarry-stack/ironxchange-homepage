import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

import { createIXIQuote, updateIXIQuote } from "./IXIQuoteCommands";
import {
  IXIQuoteDefaults,
  createIXIQuoteDraft,
  getIXIQuoteCompleteness,
  quoteInputFromRecord,
  updateIXIQuoteDraft
} from "./IXIQuoteContract";
import { reviseIXIQuote } from "./IXIQuoteRecordEngine";
import IXIQuoteStyles from "./IXIQuoteStyles";

const clean = value => String(value ?? "").trim();
const money = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
const EMPTY = {
  dealType: "standard-sale", rpo: {}, additionalTermsRows: [],
  customerName: "", customerContactName: "", customerPhone: "", customerEmail: "", customerAddress: "", customerCityStateZip: "",
  quotedPrice: "", tax: "", freight: "", fees: "", tradeAllowance: "", tradeDescription: "",
  quoteDate: IXIQuoteDefaults.quoteDate, validThrough: "", paymentTerms: "", depositTerms: "", deliveryTerms: "",
  headline: "EQUIPMENT QUOTATION", customerMessage: "", equipmentDescription: "", conditionTerms: "", warrantyTerms: "", additionalTerms: "", internalNotes: "", status: "draft"
};

function Field({ label, wide = false, children }) {
  return <label className={`qt-field ${wide ? "wide" : ""}`}><span>{label}</span>{children}</label>;
}

function Input({ value, onChange, ...props }) {
  return <input {...props} value={value ?? ""} onChange={event => onChange(event.target.value)} />;
}

function Area({ value, onChange, ...props }) {
  return <textarea {...props} value={value ?? ""} onChange={event => onChange(event.target.value)} />;
}

function DealTypeSelector({ value, onChange, compact = false }) {
  return <div className={`qt-deal-type ${compact ? "compact" : ""}`}><span>TRANSACTION TYPE</span><div><button type="button" className={value !== "rental-purchase-option" ? "active" : ""} onClick={() => onChange("standard-sale")}>STANDARD SALE</button><button type="button" className={value === "rental-purchase-option" ? "active" : ""} onClick={() => onChange("rental-purchase-option")}>RENTAL PURCHASE OPTION</button></div></div>;
}

const RPO_FIELDS = [
  ["startDate", "RPO START DATE", "date"], ["firstPaymentDate", "FIRST PAYMENT DATE", "date"], ["finalOptionDate", "FINAL OPTION DATE", "date"],
  ["termMonths", "TERM (MONTHS)", "number"], ["paymentCount", "PAYMENT COUNT", "number"], ["initialPayment", "INITIAL PAYMENT / DEPOSIT", "decimal"],
  ["periodicPayment", "PERIODIC PAYMENT", "decimal"], ["taxPerPayment", "TAX PER PAYMENT", "decimal"], ["recurringFees", "RECURRING FEES", "decimal"],
  ["purchaseCreditAmount", "AMOUNT APPLIED PER PAYMENT", "decimal"], ["purchaseCreditPercent", "PERCENT APPLIED", "decimal"], ["optionPrice", "PURCHASE OPTION PRICE", "decimal"],
  ["currentPayoff", "CURRENT PAYOFF", "decimal"], ["usageLimit", "USAGE / HOUR LIMIT", "text"], ["excessUsageRate", "EXCESS USAGE RATE", "text"]
];

function RPOEditor({ rpo = {}, patchRpo, compact = false, disabled = false }) {
  const fields = compact ? RPO_FIELDS.filter(([key]) => ["startDate", "termMonths", "periodicPayment", "paymentCount", "purchaseCreditAmount", "optionPrice"].includes(key)) : RPO_FIELDS;
  return <section className={`qt-rpo ${compact ? "compact" : ""}`}><h2>RENTAL PURCHASE OPTION TERMS</h2><div className="qt-form-grid">
    <Field label="PAYMENT FREQUENCY"><select disabled={disabled} value={rpo.paymentFrequency || "monthly"} onChange={event => patchRpo("paymentFrequency", event.target.value)}><option value="weekly">Weekly</option><option value="biweekly">Biweekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="custom">Custom</option></select></Field>
    <Field label="PURCHASE CREDIT METHOD"><select disabled={disabled} value={rpo.purchaseCreditType || "amount"} onChange={event => patchRpo("purchaseCreditType", event.target.value)}><option value="amount">Fixed amount per payment</option><option value="percent">Percentage of payment</option></select></Field>
    {fields.map(([key, label, type]) => <Field key={key} label={label}><Input disabled={disabled} type={type === "date" ? "date" : type === "number" ? "number" : undefined} inputMode={type === "decimal" ? "decimal" : undefined} value={rpo[key]} onChange={value => patchRpo(key, value)} /></Field>)}
    {!compact ? <><Field wide label="EARLY BUYOUT TERMS"><Area disabled={disabled} value={rpo.earlyBuyoutTerms} onChange={value => patchRpo("earlyBuyoutTerms", value)} /></Field><Field label="DELIVERY TERMS"><Area disabled={disabled} value={rpo.deliveryTerms} onChange={value => patchRpo("deliveryTerms", value)} /></Field><Field label="RETURN TERMS"><Area disabled={disabled} value={rpo.returnTerms} onChange={value => patchRpo("returnTerms", value)} /></Field><Field label="MAINTENANCE RESPONSIBILITY"><Area disabled={disabled} value={rpo.maintenanceResponsibility} onChange={value => patchRpo("maintenanceResponsibility", value)} /></Field><Field label="INSURANCE REQUIREMENTS"><Area disabled={disabled} value={rpo.insuranceRequirements} onChange={value => patchRpo("insuranceRequirements", value)} /></Field><Field label="LATE FEE TERMS"><Area disabled={disabled} value={rpo.lateFeeTerms} onChange={value => patchRpo("lateFeeTerms", value)} /></Field><Field label="DEFAULT TERMS"><Area disabled={disabled} value={rpo.defaultTerms} onChange={value => patchRpo("defaultTerms", value)} /></Field><Field wide label="RPO NOTES"><Area disabled={disabled} value={rpo.notes} onChange={value => patchRpo("notes", value)} /></Field></> : null}
  </div></section>;
}

function AdditionalTermsEditor({ terms = [], onChange }) {
  const update = (index, key, value) => onChange(terms.map((term, current) => current === index ? { ...term, [key]: value } : term));
  return <section className="qt-additional-terms"><div className="qt-section-head"><h2>ADDITIONAL TRANSACTION TERMS</h2><button type="button" onClick={() => onChange([...terms, { termId: globalThis.crypto?.randomUUID?.() || `TERM-${Date.now()}`, label: "", value: "", scope: "transaction", customerFacing: true }])}>+ ADD TERM</button></div><p>Add any transaction-specific or RPO provision without changing the standard form.</p>{terms.map((term, index) => <div className="qt-term-row" key={term.termId || index}><Input value={term.label} onChange={value => update(index, "label", value)} placeholder="Term name" /><Area value={term.value} onChange={value => update(index, "value", value)} placeholder="Term language or value" /><select value={term.scope || "transaction"} onChange={event => update(index, "scope", event.target.value)}><option value="transaction">Whole transaction</option><option value="rpo">RPO only</option><option value="invoice">Invoice</option></select><label><input type="checkbox" checked={term.customerFacing !== false} onChange={event => update(index, "customerFacing", event.target.checked)} /> CUSTOMER FACING</label><button type="button" onClick={() => onChange(terms.filter((_, current) => current !== index))}>REMOVE</button></div>)}</section>;
}

function Logo({ brand }) {
  return clean(brand?.logoUrl) ? (
    <Image className="qt-logo-image" src={brand.logoUrl} alt={`${brand.companyName || "Company"} logo`} width={220} height={72} unoptimized />
  ) : <div className="qt-logo-mark">{clean(brand?.companyName).split(/\s+/).map(word => word[0]).join("").slice(0, 3) || "IXI"}</div>;
}

function TotalRows({ totals }) {
  return <div className="qt-total-rows">
    <div><span>EQUIPMENT PRICE</span><b>{money(totals?.subtotal)}</b></div>
    <div><span>SALES TAX</span><b>{money(totals?.tax)}</b></div>
    <div><span>FREIGHT / DELIVERY</span><b>{money(totals?.freight)}</b></div>
    <div><span>OTHER FEES</span><b>{money(totals?.fees)}</b></div>
    <div><span>TRADE ALLOWANCE</span><b>− {money(totals?.tradeAllowance)}</b></div>
    <div className="grand"><span>QUOTED TOTAL</span><strong>{money(totals?.total)}</strong></div>
  </div>;
}

function QuotePresentation({ record }) {
  const brand = record.brand || {};
  const customer = record.customer || {};
  const asset = record.asset || {};
  const commercial = record.commercial || {};
  const presentation = record.presentation || {};
  return <article className="qt-document">
    <header className="qt-document-head">
      <div className="qt-company"><Logo brand={brand} /><div><strong>{brand.companyName || "COMPANY"}</strong><span>{brand.address}</span><span>{[brand.phone, brand.email, brand.website].filter(Boolean).join(" · ")}</span></div></div>
      <div className="qt-document-id"><h1>{presentation.headline || "EQUIPMENT QUOTATION"}</h1><b>{record.identity?.number || "DRAFT QUOTE"}</b><span>{record.dealType === "rental-purchase-option" ? "RENTAL PURCHASE OPTION" : "STANDARD SALE"} · REVISION {record.identity?.revision || 1}</span></div>
    </header>
    <section className="qt-document-meta">
      <div><span>PREPARED FOR</span><strong>{customer.name || "CUSTOMER"}</strong><p>{customer.contactName}</p><p>{customer.phone}</p><p>{customer.email}</p><p>{customer.address}</p><p>{customer.cityStateZip}</p></div>
      <div><span>QUOTE DETAILS</span><p><b>DATE</b>{commercial.quoteDate || "—"}</p><p><b>VALID THROUGH</b>{commercial.validThrough || "OPEN"}</p><p><b>PREPARED BY</b>{record.context?.actorLabel || "—"}</p></div>
    </section>
    {presentation.customerMessage ? <p className="qt-customer-message">{presentation.customerMessage}</p> : null}
    <section className="qt-equipment">
      <div className="qt-equipment-title"><span>EQUIPMENT</span><strong>{asset.label || [asset.year, asset.make, asset.model].filter(Boolean).join(" ") || "EQUIPMENT"}</strong></div>
      <div className="qt-spec-grid">
        <div><span>YEAR</span><b>{asset.year || "—"}</b></div><div><span>MAKE</span><b>{asset.make || "—"}</b></div><div><span>MODEL</span><b>{asset.model || "—"}</b></div>
        <div><span>SERIAL / VIN</span><b>{asset.serialNumber || "—"}</b></div><div><span>STOCK</span><b>{asset.stockNumber || "—"}</b></div><div><span>HOURS</span><b>{asset.hours || "—"}</b></div>
      </div>
      {presentation.equipmentDescription ? <p>{presentation.equipmentDescription}</p> : null}
    </section>
    <div className="qt-document-columns">
      <section><h2>COMMERCIAL TERMS</h2><p><b>PAYMENT</b>{commercial.paymentTerms || "—"}</p><p><b>DEPOSIT</b>{commercial.depositTerms || "—"}</p><p><b>DELIVERY</b>{commercial.deliveryTerms || "—"}</p>{commercial.tradeDescription ? <p><b>TRADE</b>{commercial.tradeDescription}</p> : null}</section>
      <TotalRows totals={record.totals} />
    </div>
    <section className="qt-terms"><h2>CONDITION & TERMS</h2>{presentation.conditionTerms ? <p><b>CONDITION</b>{presentation.conditionTerms}</p> : null}{presentation.warrantyTerms ? <p><b>WARRANTY</b>{presentation.warrantyTerms}</p> : null}{presentation.additionalTerms ? <p>{presentation.additionalTerms}</p> : null}</section>
    {record.dealType === "rental-purchase-option" ? <section className="qt-terms"><h2>RENTAL PURCHASE OPTION</h2><p><b>START / OPTION</b>{record.rpo?.startDate || "—"} / {record.rpo?.finalOptionDate || "—"}</p><p><b>SCHEDULE</b>{record.rpo?.paymentCount || 0} {record.rpo?.paymentFrequency || "monthly"} payments of {money(record.rpo?.periodicPayment)}</p><p><b>APPLIED TO PURCHASE</b>{record.rpo?.purchaseCreditType === "percent" ? `${record.rpo?.purchaseCreditPercent || 0}% per payment` : `${money(record.rpo?.purchaseCreditAmount)} per payment`}</p><p><b>PURCHASE OPTION</b>{money(record.rpo?.optionPrice)}</p><p><b>RETURN TERMS</b>{record.rpo?.returnTerms || "—"}</p></section> : null}
    {record.additionalTerms?.filter(term => term.customerFacing).length ? <section className="qt-terms"><h2>ADDITIONAL TRANSACTION TERMS</h2>{record.additionalTerms.filter(term => term.customerFacing).map(term => <p key={term.termId}><b>{term.label || "TERM"}</b>{term.value}</p>)}</section> : null}
    <footer><strong>{brand.companyName || "COMPANY"}</strong><span>Prepared through IXI TRAN$ACT · Quote {record.identity?.number || "DRAFT"}</span></footer>
  </article>;
}

function QuoteEditor({ input, patch, patchRpo, setAdditionalTerms }) {
  return <div className="qt-editor">
    <section className="qt-deal-section"><DealTypeSelector value={input.dealType} onChange={value => patch("dealType", value)} /></section>
    <section><h2>CUSTOMER</h2><div className="qt-form-grid">
      <Field label="COMPANY / CUSTOMER"><Input value={input.customerName} onChange={value => patch("customerName", value)} /></Field>
      <Field label="CONTACT"><Input value={input.customerContactName} onChange={value => patch("customerContactName", value)} /></Field>
      <Field label="PHONE"><Input value={input.customerPhone} onChange={value => patch("customerPhone", value)} /></Field>
      <Field label="EMAIL"><Input type="email" value={input.customerEmail} onChange={value => patch("customerEmail", value)} /></Field>
      <Field label="ADDRESS"><Input value={input.customerAddress} onChange={value => patch("customerAddress", value)} /></Field>
      <Field label="CITY / STATE / ZIP"><Input value={input.customerCityStateZip} onChange={value => patch("customerCityStateZip", value)} /></Field>
    </div></section>
    <section><h2>EQUIPMENT PRESENTATION</h2><div className="qt-form-grid">
      <Field label="HEADLINE"><Input value={input.headline} onChange={value => patch("headline", value)} /></Field>
      <Field label="CUSTOMER MESSAGE"><Area value={input.customerMessage} onChange={value => patch("customerMessage", value)} /></Field>
      <Field label="EQUIPMENT DESCRIPTION" wide><Area value={input.equipmentDescription} onChange={value => patch("equipmentDescription", value)} /></Field>
    </div></section>
    <section><h2>PRICE</h2><div className="qt-form-grid money-grid">
      <Field label="EQUIPMENT PRICE"><Input inputMode="decimal" value={input.quotedPrice} onChange={value => patch("quotedPrice", value)} /></Field>
      <Field label="SALES TAX"><Input inputMode="decimal" value={input.tax} onChange={value => patch("tax", value)} /></Field>
      <Field label="FREIGHT"><Input inputMode="decimal" value={input.freight} onChange={value => patch("freight", value)} /></Field>
      <Field label="OTHER FEES"><Input inputMode="decimal" value={input.fees} onChange={value => patch("fees", value)} /></Field>
      <Field label="TRADE ALLOWANCE"><Input inputMode="decimal" value={input.tradeAllowance} onChange={value => patch("tradeAllowance", value)} /></Field>
      <Field label="TRADE DESCRIPTION"><Input value={input.tradeDescription} onChange={value => patch("tradeDescription", value)} /></Field>
    </div></section>
    <section><h2>COMMERCIAL TERMS</h2><div className="qt-form-grid">
      <Field label="QUOTE DATE"><Input type="date" value={input.quoteDate} onChange={value => patch("quoteDate", value)} /></Field>
      <Field label="VALID THROUGH"><Input type="date" value={input.validThrough} onChange={value => patch("validThrough", value)} /></Field>
      <Field label="PAYMENT TERMS"><Input value={input.paymentTerms} onChange={value => patch("paymentTerms", value)} placeholder="Cash before release, financing, net terms…" /></Field>
      <Field label="DEPOSIT TERMS"><Input value={input.depositTerms} onChange={value => patch("depositTerms", value)} /></Field>
      <Field label="DELIVERY TERMS" wide><Area value={input.deliveryTerms} onChange={value => patch("deliveryTerms", value)} /></Field>
      <Field label="CONDITION / AS-IS TERMS"><Area value={input.conditionTerms} onChange={value => patch("conditionTerms", value)} /></Field>
      <Field label="WARRANTY"><Area value={input.warrantyTerms} onChange={value => patch("warrantyTerms", value)} /></Field>
      <Field label="ADDITIONAL CUSTOMER TERMS" wide><Area value={input.additionalTerms} onChange={value => patch("additionalTerms", value)} /></Field>
    </div></section>
    <section className="internal"><h2>INTERNAL — NOT CUSTOMER FACING</h2><Field label="SALES NOTES" wide><Area value={input.internalNotes} onChange={value => patch("internalNotes", value)} /></Field></section>
    {input.dealType === "rental-purchase-option" ? <RPOEditor rpo={input.rpo} patchRpo={patchRpo} /> : null}
    <AdditionalTermsEditor terms={input.additionalTermsRows} onChange={setAdditionalTerms} />
  </div>;
}

export default function IXIQuoteApp({ context = {}, object = {}, initialRecord = null, onBack = null, onRecordChange = null }) {
  const [mounted, setMounted] = useState(false);
  const [record, setRecord] = useState(initialRecord);
  const [input, setInput] = useState(() => initialRecord ? quoteInputFromRecord(initialRecord) : { ...EMPTY });
  const [worksheetOpen, setWorksheetOpen] = useState(false);
  const [worksheetMode, setWorksheetMode] = useState("edit");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (initialRecord) { setRecord(initialRecord); setInput(quoteInputFromRecord(initialRecord)); } }, [initialRecord]);
  useEffect(() => {
    if (!worksheetOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [worksheetOpen]);

  const draft = useMemo(() => record ? updateIXIQuoteDraft(record, { context, object, input }) : createIXIQuoteDraft({ context, object, input }), [record, context, object, input]);
  const completeness = useMemo(() => getIXIQuoteCompleteness(draft), [draft]);
  const patch = (key, value) => { setInput(current => ({ ...current, [key]: value })); setSavedMessage(""); };
  const patchRpo = (key, value) => { setInput(current => ({ ...current, rpo: { ...(current.rpo || {}), [key]: value } })); setSavedMessage(""); };
  const setAdditionalTerms = value => { setInput(current => ({ ...current, additionalTermsRows: value })); setSavedMessage(""); };

  async function save(nextRecord = draft, action = "save") {
    if (busy) return null;
    setBusy(true); setError(""); setSavedMessage("");
    try {
      const result = clean(nextRecord?.financialBinding?.financialDocumentId)
        ? await updateIXIQuote({ record: nextRecord, action })
        : await createIXIQuote({ object, context, record: nextRecord });
      setRecord(result.record);
      setInput(quoteInputFromRecord(result.record));
      setSavedMessage("SAVED TO IX CORE");
      await onRecordChange?.(result.record, { action, response: result.response }, context);
      return result.record;
    } catch (caught) {
      setError(clean(caught?.message) || "Quote could not be saved. Your worksheet remains open.");
      return null;
    } finally { setBusy(false); }
  }

  async function newRevision() {
    if (!record?.financialBinding?.financialDocumentId) return save();
    const next = reviseIXIQuote(record, draft, {}, context.actor);
    const saved = await save(next, "revise");
    if (saved) setWorksheetMode("edit");
  }

  const brand = draft.brand || {};
  const worksheet = mounted && worksheetOpen ? createPortal(
    <div className="qt-workspace" style={{ "--quote-accent": /^#[0-9a-f]{6}$/i.test(clean(brand.accentColor)) ? brand.accentColor : "#ffc400" }} role="dialog" aria-modal="true" aria-label="Quote worksheet">
      <div className="qt-workspace-bar">
        <div className="qt-workspace-brand"><Logo brand={brand} /><div><span>IXI TRAN$ACT · QUOTE WORKSHEET</span><strong>{brand.companyName}</strong></div></div>
        <div className="qt-workspace-actions">
          <button className={worksheetMode === "edit" ? "active" : ""} onClick={() => setWorksheetMode("edit")}>EDIT</button>
          <button className={worksheetMode === "preview" ? "active" : ""} onClick={() => setWorksheetMode("preview")}>FORMAL PREVIEW</button>
          {worksheetMode === "preview" ? <button onClick={() => window.print()}>PRINT / PDF</button> : null}
          {record ? <button onClick={newRevision} disabled={busy}>NEW REVISION</button> : null}
          <button className="save" onClick={() => save()} disabled={busy}>{busy ? "SAVING…" : "SAVE QUOTE"}</button>
          <button className="close" onClick={() => setWorksheetOpen(false)}>×</button>
        </div>
      </div>
      <div className="qt-workspace-status"><span>{draft.identity?.number || "UNNUMBERED DRAFT"} · REV {draft.identity?.revision || 1}</span><span>COMPLETENESS {completeness.percent}% · SAVE IS ALWAYS AVAILABLE</span>{savedMessage ? <b>{savedMessage}</b> : null}</div>
      {error ? <div className="qt-workspace-error">{error}</div> : null}
      <main className="qt-workspace-body">{worksheetMode === "preview" ? <QuotePresentation record={draft} /> : <QuoteEditor input={input} patch={patch} patchRpo={patchRpo} setAdditionalTerms={setAdditionalTerms} />}</main>
    </div>, document.body
  ) : null;

  return <>
    <div className="ixi-quote-card" style={{ "--quote-accent": /^#[0-9a-f]{6}$/i.test(clean(brand.accentColor)) ? brand.accentColor : "#ffc400" }}>
      <div className="qt-card-head"><button onClick={onBack}>‹</button><div><span>IXI TRAN$ACT</span><strong>QUOTE</strong></div><Logo brand={brand} /></div>
      <div className="qt-card-company">{brand.companyName}</div>
      <DealTypeSelector compact value={input.dealType} onChange={value => patch("dealType", value)} />
      <div className="qt-card-asset"><span>EQUIPMENT</span><strong>{draft.asset?.label || "CURRENT MACHINE"}</strong><small>{[draft.asset?.serialNumber, draft.asset?.stockNumber].filter(Boolean).join(" · ") || "PASSPORT-LINKED"}</small></div>
      <div className="qt-card-fields">
        <Field label="CUSTOMER / COMPANY"><Input value={input.customerName} onChange={value => patch("customerName", value)} placeholder="Name" /></Field>
        <div className="qt-card-two"><Field label="PHONE"><Input value={input.customerPhone} onChange={value => patch("customerPhone", value)} placeholder="Phone" /></Field><Field label="PRICE"><Input inputMode="decimal" value={input.quotedPrice} onChange={value => patch("quotedPrice", value)} placeholder="$0" /></Field></div>
      </div>
      {input.dealType === "rental-purchase-option" ? <div className="qt-card-rpo"><RPOEditor compact rpo={input.rpo} patchRpo={patchRpo} /></div> : null}
      <div className="qt-card-total"><span>QUOTED TOTAL</span><strong>{money(draft.totals?.total)}</strong></div>
      <div className="qt-card-meter"><div><i style={{ width: `${completeness.percent}%` }} /></div><span>{completeness.percent}% FORMAL COMPLETENESS</span></div>
      {error ? <div className="qt-card-error">{error}</div> : null}
      {savedMessage ? <div className="qt-card-saved">{savedMessage}</div> : null}
      <div className="qt-card-actions"><button className="secondary" onClick={() => setWorksheetOpen(true)}>OPEN WORKSHEET</button><button className="primary" disabled={busy} onClick={() => save()}>{busy ? "SAVING…" : record ? "SAVE" : "CREATE"}</button></div>
      <div className="qt-card-foot">SAVE ANYTIME · COMPLETE AS NEEDED · {draft.identity?.number || "NEW QUOTE"}</div>
    </div>
    {worksheet}
    <IXIQuoteStyles />
  </>;
}
