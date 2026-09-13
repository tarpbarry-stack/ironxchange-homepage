import { useEffect, useRef, useState } from "react";
import IXIMoneyInput from "../../IXIMoneyInput";
import IXIPaymentDateInput from "../../payments/IXIPaymentDateInput";
import { parsePaymentDate } from "../../payments/IXIPaymentDate";
import { loadIXIAosFinancialDocument, loadIXIAosPassportFinancialDocuments } from "../../../financial-runtime/IXIAosFinancialReadClient";
import { buildIXIReceivableProjection } from "../collections/IXICollectionsProjectionEngine";
import { recordIXICollectionPayment } from "../collections/IXICollectionsCommands";

const money = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export default function IXIServiceInvoiceReceipt({ invoiceId, context, object, onChanged }) {
  const [receivable, setReceivable] = useState(null), [error, setError] = useState("");
  const [amount, setAmount] = useState(""), [reference, setReference] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10)), [method, setMethod] = useState("wire");
  const [busy, setBusy] = useState(false);
  const attempt = useRef(null);
  async function readback(signal) {
    const [invoice, records] = await Promise.all([
      loadIXIAosFinancialDocument({ financialDocumentId: invoiceId, signal }),
      loadIXIAosPassportFinancialDocuments({ passportId: context.entity?.passportId, signal })
    ]);
    const pool = [invoice, ...records.filter(item => item.financialDocument?.financialDocumentId !== invoiceId)];
    const value = buildIXIReceivableProjection({ financialRecords: pool }).receivables.find(item => item.invoiceId === invoiceId);
    if (!value) throw new Error("The issued invoice could not be verified. Refresh and reopen it.");
    setReceivable(value);
    return value;
  }
  useEffect(() => {
    const controller = new AbortController();
    readback(controller.signal).catch(cause => { if (!controller.signal.aborted) setError(cause.message); });
    return () => controller.abort();
  }, [invoiceId, context.entity?.passportId]);
  async function save(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const occurredOn = parsePaymentDate(date);
      if (!occurredOn) throw new Error("Enter a valid payment date.");
      const signature = JSON.stringify([invoiceId, amount, reference, method, occurredOn]);
      if (!attempt.current || attempt.current.signature !== signature) attempt.current = { signature, id: crypto.randomUUID() };
      const latest = await readback();
      const response = await recordIXICollectionPayment({ object, context, receivable: latest, input: { amount, reference, method, date: occurredOn, clientRequestId: attempt.current.id } });
      const receipt = response?.data?.record || response?.record;
      if (!receipt?.financialDocument?.financialDocumentId) throw new Error("Payment confirmation was not returned. Refresh before retrying.");
      await readback();
      await onChanged?.(receipt);
      setAmount(""); setReference(""); attempt.current = null;
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  }
  return <section aria-label="Service invoice receipts">
    {error ? <p className="sinv-error" role="alert">{error}</p> : null}
    {!receivable ? <p>Loading saved receipts…</p> : <>
      <p>Received {money(receivable.received)} · Balance {money(receivable.balance)}</p>
      {receivable.payments.map(item => { const document = item.financialDocument || item.record?.financialDocument || item; return <p key={document.financialDocumentId}>{document.occurredAt?.slice(0, 10)} · {money(document.totals?.total ?? document.amount)} · {document.transactionReference}</p>; })}
      {receivable.balance > 0 ? <form onSubmit={save}>
        <label>AMOUNT RECEIVED<IXIMoneyInput value={amount} onValueChange={setAmount} required /></label>
        <IXIPaymentDateInput value={date} onValueChange={setDate} label="DATE RECEIVED" disabled={busy} />
        <label>METHOD<select value={method} onChange={event => setMethod(event.target.value)}>{["wire", "ach", "check", "cash", "card"].map(value => <option key={value} value={value}>{value.toUpperCase()}</option>)}</select></label>
        <label>REFERENCE<input value={reference} onChange={event => setReference(event.target.value)} required /></label>
        <button className="sinv-primary" disabled={busy}>{busy ? "SAVING…" : "RECORD MONEY RECEIVED"}</button>
      </form> : null}
    </>}
  </section>;
}
