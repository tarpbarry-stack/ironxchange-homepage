import IXIPaymentsPanel from "../../payments/IXIPaymentsPanel";
import { useEffect, useMemo, useState } from "react";
import { amendIXIFreightOrder, createIXIFreightOrder, loadIXIFreightEvents, loadIXIFreightOrders, loadIXIFreightOrder, loadIXIFreightPeople, loadIXIFreightAlerts } from "./IXIFreightClient";
import { createIXIFreightOrderInput, freightVariance, IXI_FREIGHT_PURPOSES, validateIXIFreightOrderInput, invoiceCharges } from "./IXIFreightContract";
import { createAndMatchIXIFreightInvoice } from "./IXIFreightCommands";
import { loadIXIFreightHistory } from "./IXIFreightHistory";
import { loadIXIAosFinancialAccessContext, loadIXIAosFinancialHistory, uploadIXIAosFinancialAttachment } from "../../../financial-runtime/IXIAosFinancialReadClient";
import { hydrateIXIBillRecord } from "../bill/IXIBillContract";
import { withIXIBillBalance } from "../bill/IXIBillBalance";
import { applyIXIBillAction } from "../bill/IXIBillRecordEngine";
import { updateIXIBill, createIXIBillPayment } from "../bill/IXIBillCommands";
import IXIBillCard from "../bill/IXIBillCard";
import IXIBillStandaloneStyles from "../bill/IXIBillStandaloneStyles";
import IXIMoneyInput from "../../IXIMoneyInput";
import IXIFreightStyles from "./IXIFreightStyles";
import { IXI_TRANSACT_LOCALES, useIXITransactLocale } from "../../IXITransactLocale";

const clean = value => String(value ?? "").trim();
const today = () => new Date().toISOString().slice(0, 10);
const commandId = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
const label = value => clean(value).replace(/-/g, " ").toUpperCase();
const editTime = value => clean(value).slice(0, 16);
const states = ["draft", "requested", "awarded", "dispatched", "picked-up", "in-transit", "delivered", "billed", "reconciled", "paid", "closed", "cancelled"];
const estimates = [["quotedAmount", "QUOTED"], ["agreedAmount", "AGREED BASE"], ["permitEstimate", "PERMITS EST."], ["escortEstimate", "ESCORT EST."], ["fuelSurchargeEstimate", "FUEL EST."], ["otherEstimate", "OTHER EST."]];
const dates = [["requestedPickupAt", "REQUESTED PICKUP"], ["scheduledPickupAt", "SCHEDULED PICKUP"], ["expectedDeliveryAt", "EXPECTED DELIVERY"], ["actualPickupAt", "ACTUAL PICKUP"], ["actualDeliveryAt", "ACTUAL DELIVERY"]];
const charges = [["freight", "BASE FREIGHT"], ["fuelSurcharge", "FUEL SURCHARGE"], ["permits", "PERMITS"], ["escort", "ESCORT"], ["detention", "DETENTION"], ["other", "OTHER"]];
const historyFields = { "route.origin.label": "ORIGIN", "route.origin.address": "ORIGIN ADDRESS", "route.destination.label": "DESTINATION", "route.destination.address": "DESTINATION ADDRESS", "route.origin.objectId": "ORIGIN", "route.destination.containerId": "DESTINATION", "route.destination.objectId": "DESTINATION", "route.routeMiles": "MILES", "asset.weight": "MACHINE WEIGHT", "purpose.type": "PURPOSE", "metadata.notes": "NOTES", "metadata.payer": "RESPONSIBILITY", "metadata.customerRebill": "CUSTOMER REBILL", "metadata.notificationRecipients": "PEOPLE TO UPDATE", "execution.carrierName": "CARRIER", "execution.carrierPassportId": "CARRIER", "execution.mode": "MODE", ...Object.fromEntries(dates.map(([key, title]) => [`execution.${key}`, title])), ...Object.fromEntries(estimates.map(([key, title]) => [`economics.${key}`, title])), amount: "AMOUNT", vendorLabel: "CARRIER", invoiceDate: "INVOICE DATE", dueDate: "DUE DATE", description: "DESCRIPTION", notes: "NOTES", category: "CATEGORY" };
function blankOrder(context = {}, intent) {
  const logistics = intent?.acquisition?.logistics || {};
  return { commandId: commandId("FRT"), status: "draft", purpose: "acquisition-inbound", mode: "external-carrier", carrierName: "", payer: "company", customerRebill: false,
    originLabel: clean(logistics.purchaseLocation || context.location?.label), destinationLabel: clean(logistics.deliverToLabel),
    requestedPickupAt: logistics.pickupDate ? `${logistics.pickupDate.slice(0,10)}T10:00` : "", expectedDeliveryAt: logistics.expectedDeliveryDate ? `${logistics.expectedDeliveryDate.slice(0,10)}T10:00` : "",
    notificationRecipients: [], notes: "" };
}
function draftFromOrder(order) {
  const expected = freightVariance(order).hasExpected;
  return { commandId: commandId("FRT-EDIT"), status: order.status, purpose: order.purpose?.type, mode: order.execution?.mode,
    carrierName: order.execution?.carrierName, carrierPassportId: order.execution?.carrierPassportId,
    originObjectId: order.route?.origin?.objectId, originLabel: order.route?.origin?.label, originAddress: order.route?.origin?.address,
    destinationObjectId: order.route?.destination?.containerId || order.route?.destination?.objectId, destinationLabel: order.route?.destination?.label, destinationAddress: order.route?.destination?.address,
    routeMiles: order.route?.routeMiles || "", weight: order.asset?.weight || "", payer: order.metadata?.payer || "company", customerRebill: Boolean(order.metadata?.customerRebill),
    ...Object.fromEntries(dates.map(([key]) => [key, editTime(order.execution?.[key])])),
    ...Object.fromEntries(estimates.map(([key]) => [key, key === "quotedAmount" ? order.economics?.[key] || "" : expected ? String(order.economics?.[key] ?? 0) : ""])),
    notes: clean(order.metadata?.notes), changeReason: "", notificationRecipients: order.metadata?.notificationRecipients || [] };
}
function blankInvoice(carrierName = "") { return { commandId: commandId("FRT-BILL"), documentType: "carrier-invoice", carrierName, invoiceNumber: "", invoiceDate: today(), dueDate: "", actualCostTotal: "", notes: "", sourceBillDocumentId: "" }; }
function Row({ label: title, value }) { return <div className="fr-data-row" data-freight-row={title}><span>{title}</span><b>{clean(value) || "—"}</b></div>; }
function Field({ title, children, wide = false }) { return <label className={`fr-field${wide ? " wide" : ""}`}><span>{title}</span>{children}</label>; }

export default function IXIFreightApp({ context = {}, object = {}, workflowIntent = null, onBack, onRecordChange, onFinancialRecordsChange }) {
  const { locale, t, setLocale } = useIXITransactLocale();
  const passportId = clean(context.primary?.passportId || object.passportId);
  const money = value => Number(value || 0).toLocaleString(locale, { style: "currency", currency: "USD" });
  const when = value => clean(value) ? new Date(value).toLocaleString(locale) : "—";
  const [orders, setOrders] = useState([]), [selectedId, setSelectedId] = useState("");
  const [mode, setMode] = useState(workflowIntent?.action === "new" ? "new" : "queue"), [tab, setTab] = useState("request");
  const [draft, setDraft] = useState(() => blankOrder(context, workflowIntent)), [invoice, setInvoice] = useState(blankInvoice);
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [events, setEvents] = useState([]), [historyError, setHistoryError] = useState("");
  const [people, setPeople] = useState([]), [alerts, setAlerts] = useState([]), [peopleError, setPeopleError] = useState("");
  const [access, setAccess] = useState({}), [billId, setBillId] = useState(""), [showBillForm, setShowBillForm] = useState(false);
  const [uploadBillId, setUploadBillId] = useState("");
  const [financialHistory, setFinancialHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false), [historyAttempt, setHistoryAttempt] = useState(0);
  const order = orders.find(item => item.identity?.freightOrderId === selectedId);
  const authority = useMemo(() => ({ serverActions: access.capabilities || {} }), [access]);
  const billRecords = useMemo(() => (order?.financialRecords || []).map(hydrateIXIBillRecord).filter(Boolean).map(record => withIXIBillBalance(record, order.financialRecords)), [order]);
  const bill = billRecords.find(record => record.financialBinding?.financialDocumentId === billId);
  const patch = (key, value) => setDraft(current => ({ ...current, [key]: value }));
  const patchInvoice = (key, value) => setInvoice(current => ({ ...current, [key]: value }));
  const upsert = next => { setOrders(current => [next, ...current.filter(item => item.identity?.freightOrderId !== next.identity?.freightOrderId)]); setSelectedId(next.identity.freightOrderId); return next; };
  async function refreshOrder() { const next = await loadIXIFreightOrder(selectedId); upsert(next); return next; }
  async function refresh(signal) {
    setLoading(true); setError("");
    try {
      const [found, resolved] = await Promise.all([loadIXIFreightOrders(passportId, { signal }), loadIXIAosFinancialAccessContext({ signal })]);
      setOrders(found); setAccess(resolved);
    } catch (err) { if (err.name !== "AbortError") setError(t(err.message)); }
    finally { if (!signal?.aborted) setLoading(false); }
  }
  useEffect(() => {
    const controller = new AbortController(); refresh(controller.signal);
    Promise.all([loadIXIFreightPeople({ signal: controller.signal }), loadIXIFreightAlerts({ signal: controller.signal })]).then(([options, updates]) => { setPeople(options); setAlerts(updates); }).catch(err => { if (err.name !== "AbortError") setPeopleError(t("UPDATE RECIPIENTS COULD NOT LOAD. REOPEN FREIGHT TO RETRY.")); });
    return () => controller.abort();
  }, [passportId]);
  useEffect(() => {
    if (tab !== "history" || !order) return;
    const controller = new AbortController();
    setEvents([]); setFinancialHistory([]); setHistoryError(""); setHistoryLoading(true);
    loadIXIFreightHistory({ order, loadEvents: loadIXIFreightEvents, loadFinancialHistory: loadIXIAosFinancialHistory, signal: controller.signal }).then(result => {
      if (controller.signal.aborted) return;
      setEvents(result.events); setFinancialHistory(result.financialHistory);
      setHistoryError(result.incomplete ? "SOME HISTORY COULD NOT LOAD. RETRY TO COMPLETE THIS VIEW." : "");
    }).catch(err => {
      if (!controller.signal.aborted) setHistoryError("SOME HISTORY COULD NOT LOAD. RETRY TO COMPLETE THIS VIEW.");
    }).finally(() => { if (!controller.signal.aborted) setHistoryLoading(false); });
    return () => controller.abort();
  }, [tab, order, historyAttempt]);
  async function saveOrder() {
    if (busy) return;
    const payload = createIXIFreightOrderInput({ context, object, input: draft });
    const validation = validateIXIFreightOrderInput(payload);
    if (!validation.valid) { setError(t(Object.values(validation.errors)[0])); return; }
    setBusy(true); setError("");
    try {
      const next = mode === "edit" ? await amendIXIFreightOrder(selectedId, {
        commandId: draft.commandId, expectedRevision: order.identity.revision, changeReason: clean(draft.changeReason),
        amendment: { status: draft.status, asset: { weight: payload.asset.weight }, purpose: payload.purpose, route: payload.route, economics: payload.economics, metadata: payload.metadata,
          execution: { ...payload.execution, actualPickupAt: clean(draft.actualPickupAt), actualDeliveryAt: clean(draft.actualDeliveryAt) } }
      }) : await createIXIFreightOrder(payload);
      upsert(next); setMode("record"); setTab("request");
      await onRecordChange?.(next, { action: mode === "edit" ? "amend" : "create" });
      upsert(await loadIXIFreightOrder(next.identity.freightOrderId));
    } catch (err) { setError(err.code === "FREIGHT_REVISION_CONFLICT" ? t("THIS REQUEST CHANGED. RELOAD IT, REVIEW THE LATEST DETAILS, AND TRY AGAIN.") : err.message); }
    finally { setBusy(false); }
  }
  async function saveInvoice() {
    if (busy) return; setBusy(true); setError("");
    try {
      const result = await createAndMatchIXIFreightInvoice({ order, input: invoice, context, object });
      upsert(result.order); setShowBillForm(false); setInvoice(blankInvoice(order.execution?.carrierName));
      setUploadBillId(result.financialDocumentId); await onFinancialRecordsChange?.();
    } catch (err) { setError(t(err.message)); if (err.financialDocumentId) { setShowBillForm(false); setUploadBillId(err.financialDocumentId); } }
    finally { setBusy(false); }
  }
  async function billAction(action, payload) {
    if (busy || !bill) return false; setBusy(true); setError("");
    try {
      if (action === "record-payment") {
        // A canonical Payment is the only cash write. The displayed balance is
        // derived from it, so a follow-up Bill patch cannot strand a payment.
        await createIXIBillPayment({ object, context, record: bill, input: payload });
      } else if (action !== "payments-changed") {
        const revised = applyIXIBillAction({ record: bill, action, payload, actor: context.actor, authority });
        await updateIXIBill({ record: revised, action });
      }
      await refreshOrder(); await onFinancialRecordsChange?.(); return true;
    } catch (err) { setError(t(err.message)); return false; }
    finally { setBusy(false); }
  }
  async function uploadEvidence(file) {
    if (!file || busy) return;
    if (file.size > 25 * 1024 * 1024 || !["application/pdf", "image/png", "image/jpeg"].includes(file.type)) { setError(t("CHOOSE A PDF, JPG OR PNG UP TO 25 MB.")); return; }
    setBusy(true); setError("");
    try { await uploadIXIAosFinancialAttachment({ financialDocumentId: uploadBillId, file, type: "carrier-invoice" }); await refreshOrder(); setUploadBillId(""); }
    catch (err) { setError(`${t("BILL SAVED. ATTACHMENT COULD NOT UPLOAD.")} ${err.message}`); }
    finally { setBusy(false); }
  }
  function startBill(type = "carrier-invoice", source = "") {
    setInvoice({ ...blankInvoice(order.execution?.carrierName), documentType: type, sourceBillDocumentId: source || (billRecords.length === 1 ? billRecords[0].financialBinding.financialDocumentId : "") });
    setShowBillForm(true); setError("");
  }
  function editRequest() { setDraft(draftFromOrder(order)); setMode("edit"); setError(""); }
  function requestForm() {
    return <><div className="fr-note">{t("SAVE WHAT YOU KNOW. CARRIER, PRICE AND OPTIONAL DETAILS CAN BE ADDED LATER.")}</div>
      <div className="fr-grid">
        <Field title={t("PURPOSE")}><select value={draft.purpose} onChange={e => patch("purpose", e.target.value)}>{IXI_FREIGHT_PURPOSES.map(value => <option key={value} value={value}>{t(label(value))}</option>)}</select></Field>
        {mode === "edit" ? <Field title={t("STATUS")}><select value={draft.status} onChange={e => patch("status", e.target.value)}>{states.map(value => <option key={value} value={value}>{t(label(value))}</option>)}</select></Field> : null}
        <Field title={t("ORIGIN")}><input value={draft.originLabel || ""} onChange={e => { patch("originLabel", e.target.value); patch("originObjectId", ""); }} /></Field>
        <Field title={t("DESTINATION")}><input value={draft.destinationLabel || ""} onChange={e => { patch("destinationLabel", e.target.value); patch("destinationObjectId", ""); }} /></Field>
        <Field title={t("CARRIER / TRANSPORTER")} wide><input value={draft.carrierName || ""} onChange={e => patch("carrierName", e.target.value)} /></Field>
        <Field title={t("REQUESTED PICKUP")}><input type="datetime-local" value={draft.requestedPickupAt || ""} onChange={e => patch("requestedPickupAt", e.target.value)} /></Field>
        <Field title={t("EXPECTED DELIVERY")}><input type="datetime-local" value={draft.expectedDeliveryAt || ""} onChange={e => patch("expectedDeliveryAt", e.target.value)} /></Field>
        <Field title={t("NOTES / SPECIAL INSTRUCTIONS")} wide><textarea value={draft.notes || ""} onChange={e => patch("notes", e.target.value)} /></Field>
      </div>
      <details><summary>{t("OPTIONAL ROUTE & DELIVERY DETAILS")}</summary><div className="fr-grid">
        {[["originAddress", "ORIGIN ADDRESS"], ["destinationAddress", "DESTINATION ADDRESS"], ["routeMiles", "MILES"], ["weight", "MACHINE WEIGHT"]].map(([key, title]) => <Field key={key} title={t(title)}><input value={draft[key] || ""} onChange={e => patch(key, e.target.value)} /></Field>)}
        {dates.filter(([key]) => !["requestedPickupAt", "expectedDeliveryAt"].includes(key) && (mode === "edit" || key === "scheduledPickupAt")).map(([key, title]) => <Field key={key} title={t(title)}><input type="datetime-local" value={draft[key] || ""} onChange={e => patch(key, e.target.value)} /></Field>)}
      </div><p className="fr-hint">{t("DELIVERY DATES RECORD WHAT HAPPENED. CURRENT YARD PLACEMENT IS MANAGED IN AOS / WORK.")}</p></details>
      <details><summary>{t("OPTIONAL ESTIMATES & RESPONSIBILITY")}</summary><div className="fr-grid">
        <Field title={t("MODE")}><select value={draft.mode} onChange={e => patch("mode", e.target.value)}><option value="external-carrier">{t("EXTERNAL CARRIER")}</option><option value="internal-fleet">{t("INTERNAL FLEET")}</option></select></Field>
        {estimates.map(([key, title]) => <Field key={key} title={t(title)}><IXIMoneyInput value={draft[key] ?? ""} onValueChange={value => patch(key, value)} /></Field>)}
        <Field title={t("RESPONSIBILITY")}><select value={draft.payer} onChange={e => patch("payer", e.target.value)}>{["company", "buyer", "seller", "customer"].map(value => <option key={value} value={value}>{t(label(value))}</option>)}</select></Field>
        <Field title={t("CUSTOMER REBILL")}><select value={draft.customerRebill ? "yes" : "no"} onChange={e => patch("customerRebill", e.target.value === "yes")}><option value="no">{t("NO")}</option><option value="yes">{t("YES")}</option></select></Field>
      </div></details>
      <details><summary>{t("PEOPLE TO UPDATE")}</summary><p className="fr-hint">{t("SELECTED PEOPLE RECEIVE IN-APP FREIGHT UPDATES WHEN THIS REQUEST CHANGES.")}</p>{peopleError ? <div role="alert">{peopleError}</div> : people.map(person => <label className="fr-check" key={person.passportId}><input type="checkbox" checked={(draft.notificationRecipients || []).includes(person.passportId)} onChange={e => patch("notificationRecipients", e.target.checked ? [...(draft.notificationRecipients || []), person.passportId] : draft.notificationRecipients.filter(id => id !== person.passportId))} /><span>{person.label}</span></label>)}</details>
      {mode === "edit" ? <Field title={t("CHANGE NOTE (OPTIONAL)")}><textarea value={draft.changeReason || ""} onChange={e => patch("changeReason", e.target.value)} /></Field> : null}
      <div className="fr-actions"><button className="fr-btn" disabled={busy} onClick={() => setMode(mode === "edit" ? "record" : "queue")}>{t("CANCEL")}</button><button className="fr-btn primary" disabled={busy} onClick={saveOrder}>{t(busy ? "SAVING…" : "SAVE REQUEST")}</button></div>
    </>;
  }
  function requestView() { return <>
    <div className="fr-section">{t("REQUEST")}</div>
    <Row label={t("STATUS")} value={t(label(order.status))} /><Row label={t("PURPOSE")} value={t(label(order.purpose?.type))} />
    <Row label={t("CARRIER")} value={order.execution?.carrierName || t("NOT ASSIGNED")} /><Row label={t("ORIGIN")} value={order.route?.origin?.label || order.route?.origin?.address} /><Row label={t("DESTINATION")} value={order.route?.destination?.label || order.route?.destination?.address} />
    {dates.map(([key, title]) => <Row key={key} label={t(title)} value={when(order.execution?.[key])} />)}
    <Row label={t("NOTES")} value={order.metadata?.notes} />
    <div className="fr-actions one"><button className="fr-btn primary" disabled={busy} onClick={editRequest}>{t("EDIT REQUEST")}</button></div>
  </>; }
  function billsView() {
    const variance = freightVariance(order);
    return <><IXIPaymentsPanel key={selectedId} context={context} object={object} sourceIds={billRecords.map(record => record.financialBinding.financialDocumentId)} language={locale.startsWith("es") ? "es" : "en"} onChanged={async () => { await refreshOrder(); await onFinancialRecordsChange?.(); }} /><div className="fr-kpis">{[["EXPECTED", variance.hasExpected ? money(variance.expected) : t("NOT SET")], ["NET FREIGHT COST", money(variance.actual)], ["PAID", money(order.financial?.paidTotal)], ["OPEN PAYABLE", money(order.financial?.openPayableTotal)]].map(([title, value]) => <div className="fr-kpi" key={title}><span>{t(title)}</span><strong>{value}</strong></div>)}</div>
      {order.financial?.carrierCreditTotal > 0 ? <div className="fr-note">{t("CARRIER CREDIT AVAILABLE")}: {money(order.financial.carrierCreditTotal)}. {t("A CREDIT IS NOT A CASH REFUND.")}</div> : null}
      {order.financial?.missingFinancialDocumentIds?.length ? <div className="fr-error" role="alert">{t("SOME LINKED FINANCIAL RECORDS COULD NOT BE RESOLVED. REVIEW BEFORE RECORDING PAYMENT.")}</div> : null}
      <div className="fr-section">{t("BILLS & CREDITS")}</div>
      {(order.invoices || []).map(item => <div className={`fr-invoice ${item.documentType === "carrier-credit" ? "credit" : ""}`} key={item.billDocumentId}><div><b>{item.invoiceNumber}</b><strong>{item.documentType === "carrier-credit" ? "− " : ""}{money(item.amount)}</strong></div><small>{item.invoiceDate} · {t(label(item.status))}</small><div className="fr-actions"><button className="fr-btn" onClick={() => {
        if (item.documentType === "carrier-credit") { const stored = order.financialRecords.find(record => record.financialDocument?.financialDocumentId === item.billDocumentId); setInvoice({ ...blankInvoice(order.execution?.carrierName), documentType: "carrier-credit", invoiceNumber: item.invoiceNumber, invoiceDate: item.invoiceDate, actualCostTotal: String(item.amount), sourceBillDocumentId: item.sourceBillDocumentId, creditRecord: stored }); setShowBillForm(true); }
        else setBillId(item.billDocumentId);
      }}>{t("OPEN / EDIT")}</button><button className="fr-btn" onClick={() => setUploadBillId(item.billDocumentId)}>{t("ATTACH DOCUMENT")}</button></div></div>)}
      {!showBillForm ? <div className="fr-actions"><button className="fr-btn primary" onClick={() => startBill()}>{t("+ BILL")}</button><button className="fr-btn" disabled={!billRecords.length} onClick={() => startBill("carrier-credit")}>{t("+ CREDIT")}</button></div> : <>
        <div className="fr-section">{t(invoice.creditRecord ? "EDIT CREDIT" : invoice.documentType === "carrier-credit" ? "NEW CREDIT" : "NEW BILL")}</div>
        <div className="fr-grid">
          <Field title={t("CARRIER *")} wide><input value={invoice.carrierName || ""} onChange={e => patchInvoice("carrierName", e.target.value)} /></Field>
          {invoice.documentType === "carrier-credit" ? <Field title={t("ORIGINAL BILL *")} wide><select value={invoice.sourceBillDocumentId} disabled={Boolean(invoice.creditRecord)} onChange={e => patchInvoice("sourceBillDocumentId", e.target.value)}><option value="">{t("SELECT BILL")}</option>{billRecords.map(record => <option key={record.financialBinding.financialDocumentId} value={record.financialBinding.financialDocumentId}>{record.identity.invoiceNumber} · {money(record.bill.amount)}</option>)}</select></Field> : null}
          <Field title={t("INVOICE / CREDIT # *")}><input value={invoice.invoiceNumber} onChange={e => patchInvoice("invoiceNumber", e.target.value)} /></Field>
          <Field title={t("DATE *")}><input type="date" value={invoice.invoiceDate} onChange={e => patchInvoice("invoiceDate", e.target.value)} /></Field>
          <Field title={t("TOTAL *")} wide><IXIMoneyInput value={invoice.actualCostTotal} onValueChange={value => patchInvoice("actualCostTotal", value)} placeholder="0.00" /></Field>
        </div>
        <details><summary>{t("OPTIONAL BILL DETAILS")}</summary><div className="fr-grid"><Field title={t("DUE DATE")}><input type="date" value={invoice.dueDate} onChange={e => patchInvoice("dueDate", e.target.value)} /></Field>{!invoice.creditRecord ? charges.map(([key, title]) => <Field key={key} title={t(title)}><IXIMoneyInput value={invoice[key] || ""} onValueChange={value => patchInvoice(key, value)} /></Field>) : null}<Field title={t("NOTES")} wide><textarea value={invoice.notes} onChange={e => patchInvoice("notes", e.target.value)} /></Field></div></details>
        <Row label={t("DOCUMENT TOTAL")} value={money(invoiceCharges(invoice).amount)} />
        <div className="fr-actions"><button className="fr-btn" disabled={busy} onClick={() => setShowBillForm(false)}>{t("CANCEL")}</button><button className="fr-btn primary" disabled={busy} onClick={saveInvoice}>{t(busy ? "SAVING…" : invoice.documentType === "carrier-credit" ? "SAVE CREDIT" : "SAVE COMPANY BILL")}</button></div>
        {order.metadata?.payer !== "company" || order.metadata?.customerRebill ? <p className="fr-hint">{t("THIS RECORD IS THE COMPANY'S CARRIER BILL. CUSTOMER REBILLING IS RECORDED SEPARATELY.")}</p> : null}
      </>}
      {uploadBillId ? <div className="fr-card"><div className="fr-section">{t("ATTACH DOCUMENT (OPTIONAL)")}</div><input aria-label={t("ATTACH DOCUMENT")} type="file" accept="application/pdf,image/jpeg,image/png" disabled={busy} onChange={e => uploadEvidence(e.target.files?.[0])} /><button className="fr-btn" disabled={busy} onClick={() => setUploadBillId("")}>{t("DONE")}</button></div> : null}
    </>;
  }
  function historyView() {
    const financial = (order.financialRecords || []).flatMap(stored => {
      const doc = stored.financialDocument || {};
      return [{ occurredAt: doc.occurredAt, eventType: `${doc.documentType} ${doc.invoiceNumber || doc.documentNumber || ""}`, actorId: stored.server?.createdBy || "", amount: doc.totals?.total }, ...(doc.billRecord?.timeline || []).map(event => ({ ...event, eventType: event.label, actorId: event.actorLabel, payload: { changes: event.changes || [] } }))];
    });
    const revisions = financialHistory.filter(item => item.operation !== "create").map(item => ({ occurredAt: item.recordedAt, eventType: `${item.record?.financialDocument?.documentType || "document"} revision ${item.revision}`, actorId: item.actorPassportId, amount: item.record?.financialDocument?.totals?.total }));
    const history = [...events, ...financial, ...revisions].sort((a, b) => clean(b.occurredAt).localeCompare(clean(a.occurredAt)));
    return <><div className="fr-section">{t("REQUEST & FINANCIAL HISTORY")}</div><IXIPaymentsPanel context={context} object={object} sourceIds={billRecords.map(record => record.financialBinding?.financialDocumentId).filter(Boolean)} language={locale === "es-MX" ? "es" : "en"} readOnly />{historyLoading ? <div role="status" className="fr-note">{t("LOADING HISTORY…")}</div> : null}{historyError ? <div role="alert" className="fr-error">{t(historyError)}<button className="fr-btn" disabled={historyLoading} onClick={() => setHistoryAttempt(current => current + 1)}>{t("RETRY HISTORY")}</button></div> : null}{history.map((event, index) => <div className="fr-event" key={event.eventId || `${event.occurredAt}-${index}`}><time>{when(event.occurredAt)} · {event.actorId || "IXI"}</time><strong>{t(label(event.eventType))}{event.amount != null ? ` · ${money(event.amount)}` : ""}</strong>{event.payload?.changeReason ? <p>{event.payload.changeReason}</p> : null}{(event.payload?.changes || []).map(change => <Row key={change.field} label={t(historyFields[change.field] || label(change.field))} value={`${Array.isArray(change.before) ? change.before.join(", ") : change.before ?? "—"} → ${Array.isArray(change.after) ? change.after.join(", ") : change.after ?? "—"}`} />)}</div>)}<Row label={t("CREATED")} value={when(order.audit?.createdAt)} /><Row label={t("UPDATED")} value={when(order.audit?.updatedAt)} /></>;
  }
  if (bill) return <div className="ixi-bill-standalone"><IXIBillCard key={billId} record={bill} context={context} authority={authority} language={locale === "es-MX" ? "es" : "en"} onLanguageChange={language => setLocale(language === "es" ? "es-MX" : "en-US")} busy={busy} error={error} onAction={billAction} onBack={() => { setBillId(""); setError(""); }} /><IXIBillStandaloneStyles /></div>;
  return <div className="ixi-freight">
    <div className="fr-head"><div><strong>{mode === "new" ? t("NEW FREIGHT REQUEST") : order?.identity?.freightOrderId || t("FREIGHT")}</strong><small>IXI TRAN$ACT · {t("MACHINE LOGISTICS")}</small></div><div className="fr-lang"><button className={locale === IXI_TRANSACT_LOCALES.ENGLISH ? "on" : ""} onClick={() => setLocale(IXI_TRANSACT_LOCALES.ENGLISH)}>ENG</button><span>/</span><button className={locale === IXI_TRANSACT_LOCALES.SPANISH_MEXICO ? "on" : ""} onClick={() => setLocale(IXI_TRANSACT_LOCALES.SPANISH_MEXICO)}>ESP</button></div></div>
    {mode === "record" ? <div className="fr-tabs">{[["request", "REQUEST"], ["bills", "BILLS / PAYMENTS"], ["history", "HISTORY"]].map(([key, title]) => <button key={key} className={tab === key ? "on" : ""} disabled={busy} onClick={() => { setTab(key); setError(""); }}>{t(title)}</button>)}</div> : null}
    <div className="fr-body">{error ? <div className="fr-error" role="alert">{error}<button className="fr-btn" disabled={busy} onClick={() => order ? refreshOrder().then(() => { setError(""); setMode("record"); }).catch(err => setError(t(err.message))) : refresh()}>{t("RELOAD")}</button></div> : null}
      {loading ? <div className="fr-empty">{t("LOADING FREIGHT…")}</div> : mode === "new" || mode === "edit" ? requestForm() : mode === "record" && order ? tab === "request" ? requestView() : tab === "bills" ? billsView() : historyView() : <>
        {alerts.filter(item => item.assetPassportId === passportId).length ? <details><summary>{t("YOUR FREIGHT UPDATES")}</summary>{alerts.filter(item => item.assetPassportId === passportId).map(item => <div className="fr-event" key={item.sk}>{item.freightOrderId} · {when(item.createdAt)} · {t(label(item.event.eventType))}</div>)}</details> : null}
        <div className="fr-actions one"><button className="fr-btn primary" onClick={() => { setDraft(blankOrder(context)); setMode("new"); setError(""); }}>{t("+ NEW FREIGHT REQUEST")}</button></div>
        <div className="fr-section">{t("MACHINE FREIGHT")}</div>{orders.map(item => <div className="fr-card" key={item.identity.freightOrderId}><button onClick={() => { setSelectedId(item.identity.freightOrderId); setMode("record"); setTab("request"); setShowBillForm(false); setError(""); }}><strong>{item.identity.freightOrderId}</strong><span>{t(label(item.purpose?.type))} · {t(label(item.status))}</span><span>{item.route?.origin?.label || t("ORIGIN")} → {item.route?.destination?.label || t("DESTINATION")}</span><span>{item.execution?.carrierName || t("NOT ASSIGNED")} · {item.invoices?.length ? `${t("ACTUAL")} ${money(item.economics?.actualTotal)}` : freightVariance(item).hasExpected ? money(item.economics.expectedTotal) : t("COST NOT SET")}</span></button></div>)}
      </>}
    </div><div className="fr-foot"><button disabled={busy} onClick={() => mode === "queue" ? onBack?.() : (setMode("queue"), setError(""))}>{t(mode === "queue" ? "TRAN$ACT" : "ALL FREIGHT")}</button><button disabled={busy} onClick={() => onBack?.()}>{t("CLOSE")}</button></div><IXIFreightStyles />
  </div>;
}
