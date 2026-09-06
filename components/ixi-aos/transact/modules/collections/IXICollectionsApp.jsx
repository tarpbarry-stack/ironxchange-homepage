import { useEffect, useMemo, useState } from "react";
import { buildIXIReceivableProjection } from "./IXICollectionsProjectionEngine";
import {
  createIXICollectionCaseCommand,
  updateIXICollectionCaseCommand,
  recordIXICollectionPayment,
  recordIXICollectionCredit,
  recordIXIUnappliedCustomerDeposit,
  applyIXICustomerDeposit,
} from "./IXICollectionsCommands";
import {
  logIXICollectionContact,
  addIXIPromiseToPay,
  openIXICollectionDispute,
  escalateIXICollectionCase,
  refreshIXICollectionReceivable,
} from "./IXICollectionsRecordEngine";
import IXICollectionsStyles from "./IXICollectionsStyles";

const clean = (value) => String(value ?? "").trim();
const money = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(value || 0),
  );
const today = () => new Date().toISOString().slice(0, 10);
const financialDocumentOf = (item) =>
  item?.record?.financialDocument ||
  item?.financialDocument ||
  item?.document?.financialDocument ||
  item ||
  {};

function Field({ label, children }) {
  return (
    <div className="coll-field">
      <label>{label}</label>
      {children}
    </div>
  );
}
function Input({ value, onChange, ...props }) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      {...props}
    />
  );
}

export default function IXICollectionsApp({
  context = {},
  object = {},
  financialRecords = [],
  initialCases = [],
  onBack = null,
  onRecordChange = null,
}) {
  const [language, setLanguage] = useState("en");
  const [cases, setCases] = useState(
    Array.isArray(initialCases) ? initialCases : [],
  );
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [contactType, setContactType] = useState("call");
  const [contactName, setContactName] = useState("");
  const [contactSummary, setContactSummary] = useState("");
  const [contactOutcome, setContactOutcome] = useState("");
  const [nextActionAt, setNextActionAt] = useState("");
  const [promiseAmount, setPromiseAmount] = useState("");
  const [promiseDate, setPromiseDate] = useState("");
  const [disputeAmount, setDisputeAmount] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("wire");
  const [paymentReference, setPaymentReference] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [depositCustomer, setDepositCustomer] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("wire");
  const [depositReference, setDepositReference] = useState("");
  const [depositAccount, setDepositAccount] = useState("");

  useEffect(() => {
    setCases(Array.isArray(initialCases) ? initialCases : []);
  }, [initialCases]);

  const projection = useMemo(
    () =>
      buildIXIReceivableProjection({
        financialRecords,
        collectionCases: cases,
      }),
    [financialRecords, cases],
  );
  const selected =
    projection.receivables.find(
      (item) => item.invoiceId === selectedInvoiceId,
    ) || null;
  const collectionCase = selected
    ? cases.find(
        (item) => clean(item.receivable?.invoiceId) === selected.invoiceId,
      ) || null
    : null;
  const unappliedDeposits = useMemo(
    () =>
      financialRecords.filter((item) => {
        const document = financialDocumentOf(item);
        return (
          document?.metadata?.customerDeposit === true &&
          ["unapplied", "partially-applied"].includes(
            clean(document?.metadata?.depositStatus),
          ) &&
          Number(
            document?.metadata?.unappliedAmount ??
              document?.amount ??
              document?.totals?.total,
          ) > 0
        );
      }),
    [financialRecords],
  );
  const copy =
    language === "es"
      ? {
          title: "COBRANZAS / CxC",
          total: "CxC TOTAL",
          current: "CORRIENTE",
          overdue: "VENCIDO",
          attention: "ATENCIÓN",
          open: "CUENTAS ABIERTAS",
          balance: "SALDO ABIERTO",
          contact: "REGISTRAR CONTACTO",
          promise: "PROMESA DE PAGO",
          dispute: "DISPUTA",
          payment: "REGISTRAR PAGO",
          credit: "CRÉDITO / CASTIGO",
          deposit: "DEPÓSITO DE CLIENTE SIN APLICAR",
          deposits: "FONDOS SIN APLICAR",
        }
      : {
          title: "COLLECTIONS / A/R",
          total: "TOTAL A/R",
          current: "CURRENT",
          overdue: "OVERDUE",
          attention: "ATTENTION",
          open: "OPEN RECEIVABLES",
          balance: "OPEN BALANCE",
          contact: "LOG CONTACT",
          promise: "PROMISE TO PAY",
          dispute: "DISPUTE",
          payment: "RECORD PAYMENT",
          credit: "CREDIT / WRITE-OFF",
          deposit: "UNAPPLIED CUSTOMER DEPOSIT",
          deposits: "UNAPPLIED FUNDS",
        };

  async function recordDeposit() {
    setBusy(true);
    setError("");
    try {
      const response = await recordIXIUnappliedCustomerDeposit({
        object,
        context,
        input: {
          customerLabel: depositCustomer,
          amount: depositAmount,
          method: depositMethod,
          reference: depositReference,
          cashAccountLabel: depositAccount,
          date: today(),
        },
      });
      await notify(financialDocumentOf(response), {
        action: "record-unapplied-customer-deposit",
        response,
      });
      setDepositAmount("");
      setDepositReference("");
    } catch (cause) {
      setError(cause?.message || "Customer deposit could not be recorded");
    } finally {
      setBusy(false);
    }
  }

  async function applyDeposit(deposit) {
    setBusy(true);
    setError("");
    try {
      const document = financialDocumentOf(deposit);
      const response = await applyIXICustomerDeposit({
        object,
        context,
        deposit,
        receivable: selected,
        amount: Math.min(
          Number(
            document?.metadata?.unappliedAmount ??
              document?.amount ??
              document?.totals?.total,
          ),
          Number(selected?.balance || 0),
        ),
      });
      await notify(financialDocumentOf(response.application), {
        action: "apply-customer-deposit",
        response,
      });
    } catch (cause) {
      setError(cause?.message || "Customer deposit could not be applied");
    } finally {
      setBusy(false);
    }
  }

  async function notify(record, change) {
    await onRecordChange?.(record, change, context);
  }

  async function openCase() {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const result = await createIXICollectionCaseCommand({
        object,
        context,
        receivable: selected,
      });
      setCases((current) => [
        ...current.filter(
          (item) => item.receivable?.invoiceId !== selected.invoiceId,
        ),
        result.record,
      ]);
      await notify(result.record, {
        action: "open-case",
        response: result.response,
        receivable: selected,
      });
    } catch (cause) {
      setError(cause?.message || "Collection case could not be opened");
    } finally {
      setBusy(false);
    }
  }

  async function persistCase(next, action, extra = {}) {
    setBusy(true);
    setError("");
    try {
      const canonical = await updateIXICollectionCaseCommand({
        record: next,
        action,
      });
      setCases((current) => [
        ...current.filter(
          (item) =>
            item.receivable?.invoiceId !== canonical.receivable?.invoiceId,
        ),
        canonical,
      ]);
      await notify(canonical, { action, ...extra });
      return canonical;
    } catch (cause) {
      setError(cause?.message || "Collection case could not be saved");
      throw cause;
    } finally {
      setBusy(false);
    }
  }

  async function logContact() {
    if (!collectionCase) return;
    const next = logIXICollectionContact(
      collectionCase,
      {
        type: contactType,
        contactName,
        summary: contactSummary,
        outcome: contactOutcome,
        nextActionAt,
      },
      context.actor,
    );
    await persistCase(next, "log-contact");
    setContactSummary("");
    setContactOutcome("");
  }

  async function addPromise() {
    if (!collectionCase) return;
    try {
      const next = addIXIPromiseToPay(
        collectionCase,
        { amount: promiseAmount, dueDate: promiseDate },
        context.actor,
      );
      await persistCase(next, "promise-to-pay");
      setPromiseAmount("");
      setPromiseDate("");
    } catch (cause) {
      setError(cause?.message || "Promise could not be created");
    }
  }

  async function addDispute() {
    if (!collectionCase) return;
    try {
      const next = openIXICollectionDispute(
        collectionCase,
        { amount: disputeAmount, reason: disputeReason },
        context.actor,
      );
      await persistCase(next, "dispute-opened");
      setDisputeAmount("");
      setDisputeReason("");
    } catch (cause) {
      setError(cause?.message || "Dispute could not be opened");
    }
  }

  async function recordPayment() {
    if (!selected || !collectionCase) return;
    setBusy(true);
    setError("");
    try {
      const response = await recordIXICollectionPayment({
        object,
        context,
        receivable: selected,
        collection: collectionCase,
        input: {
          amount: paymentAmount,
          method: paymentMethod,
          reference: paymentReference,
          date: today(),
        },
      });
      const refreshed = refreshIXICollectionReceivable(collectionCase, {
        ...selected,
        balance: Math.max(
          0,
          Number(selected.balance) - Number(paymentAmount || 0),
        ),
      });
      await persistCase(refreshed, "record-payment", { response });
      setPaymentAmount("");
      setPaymentReference("");
    } catch (cause) {
      setError(cause?.message || "Payment could not be recorded");
    } finally {
      setBusy(false);
    }
  }

  async function recordCredit(writeOff = false) {
    if (!selected || !collectionCase) return;
    setBusy(true);
    setError("");
    try {
      const response = await recordIXICollectionCredit({
        object,
        context,
        receivable: selected,
        collection: collectionCase,
        input: { amount: creditAmount, reason: creditReason, writeOff },
      });
      const refreshed = refreshIXICollectionReceivable(collectionCase, {
        ...selected,
        balance: Math.max(
          0,
          Number(selected.balance) - Number(creditAmount || 0),
        ),
      });
      await persistCase(refreshed, writeOff ? "write-off" : "credit", {
        response,
        receivable: selected,
      });
      setCreditAmount("");
      setCreditReason("");
    } catch (cause) {
      setError(cause?.message || "Credit could not be recorded");
    } finally {
      setBusy(false);
    }
  }

  if (!selected)
    return (
      <div className="ixi-coll">
        <div className="coll-top">
          <div>
            <div className="coll-kicker">IXI TRAN$ACT</div>
            <div className="coll-title">{copy.title}</div>
            <div className="coll-sub">
              AWS IXI FINANCIAL · RECEIVABLE CONTROL
            </div>
          </div>
          <div className="coll-lang">
            <button
              className={language === "en" ? "on" : ""}
              onClick={() => setLanguage("en")}
            >
              ENG
            </button>
            <button
              className={language === "es" ? "on" : ""}
              onClick={() => setLanguage("es")}
            >
              ESP
            </button>
          </div>
        </div>
        <div className="coll-metrics">
          <div className="coll-metric">
            <span>{copy.total}</span>
            <strong>{money(projection.totals.totalAR)}</strong>
          </div>
          <div className="coll-metric">
            <span>{copy.current}</span>
            <strong>{money(projection.totals.current)}</strong>
          </div>
          <div className="coll-metric bad">
            <span>{copy.overdue}</span>
            <strong>{money(projection.totals.overdue)}</strong>
          </div>
          <div className="coll-metric">
            <span>1–30</span>
            <strong>{money(projection.totals.days1to30)}</strong>
          </div>
          <div className="coll-metric warn">
            <span>31–60</span>
            <strong>{money(projection.totals.days31to60)}</strong>
          </div>
          <div className="coll-metric bad">
            <span>61+ DAYS</span>
            <strong>
              {money(
                projection.totals.days61to90 + projection.totals.days90plus,
              )}
            </strong>
          </div>
        </div>
        {error ? <div className="coll-error">{error}</div> : null}
        <div className="coll-section">{copy.deposit}</div>
        <div className="coll-grid2">
          <Field label={language === "es" ? "CLIENTE" : "CUSTOMER"}>
            <Input value={depositCustomer} onChange={setDepositCustomer} />
          </Field>
          <Field label={language === "es" ? "MONTO" : "AMOUNT"}>
            <Input
              inputMode="decimal"
              value={depositAmount}
              onChange={setDepositAmount}
            />
          </Field>
        </div>
        <div className="coll-grid2">
          <Field label={language === "es" ? "MÉTODO" : "METHOD"}>
            <select
              value={depositMethod}
              onChange={(event) => setDepositMethod(event.target.value)}
            >
              <option value="wire">WIRE</option>
              <option value="ach">ACH</option>
              <option value="check">CHECK</option>
              <option value="cash">CASH</option>
              <option value="card">CARD</option>
            </select>
          </Field>
          <Field
            label={language === "es" ? "CUENTA RECEPTORA" : "RECEIVING ACCOUNT"}
          >
            <Input value={depositAccount} onChange={setDepositAccount} />
          </Field>
        </div>
        <Field label={language === "es" ? "REFERENCIA" : "REFERENCE"}>
          <Input value={depositReference} onChange={setDepositReference} />
        </Field>
        <button
          className="coll-primary"
          disabled={busy}
          onClick={recordDeposit}
        >
          {busy ? "POSTING…" : copy.deposit}
        </button>
        <div className="coll-section">{copy.deposits}</div>
        {unappliedDeposits.map((item) => {
          const document = financialDocumentOf(item);
          return (
            <div className="coll-row" key={document.financialDocumentId}>
              <div className="coll-head">
                <strong>{document.metadata?.customerLabel}</strong>
                <b>
                  {money(
                    document.metadata?.unappliedAmount ??
                      document.amount ??
                      document.totals?.total,
                  )}
                </b>
              </div>
              <small>
                {document.transactionReference} · {document.paymentMethod}
              </small>
            </div>
          );
        })}
        <div className="coll-section">{copy.open}</div>
        {projection.receivables
          .filter((item) => item.balance > 0)
          .map((item) => (
            <button
              className="coll-row click"
              key={item.invoiceId}
              onClick={() => setSelectedInvoiceId(item.invoiceId)}
            >
              <div className="coll-head">
                <strong>{item.customerLabel}</strong>
                <b>{money(item.balance)}</b>
              </div>
              <small>
                <span
                  className={`coll-badge ${item.status === "overdue" ? "bad" : ""}`}
                >
                  {item.status.toUpperCase()}
                </span>
                {item.invoiceNumber} · DUE {item.dueDate || "—"} ·{" "}
                {item.daysPastDue} DAYS PAST DUE
              </small>
            </button>
          ))}
        {!projection.receivables.some((item) => item.balance > 0) ? (
          <div className="coll-callout">
            NO OPEN RECEIVABLES IN THE CURRENT IXI FINANCIAL PROJECTION.
          </div>
        ) : null}
        <button className="coll-secondary" onClick={() => onBack?.()}>
          ‹ TRAN$ACT
        </button>
        <div className="coll-foot">
          Balances are projected from canonical IXI Financial invoices, payments
          and credits. Collections does not edit A/R directly.
        </div>
        <IXICollectionsStyles />
      </div>
    );

  return (
    <div className="ixi-coll">
      <button
        className="coll-back"
        onClick={() => {
          setSelectedInvoiceId("");
          setError("");
        }}
      >
        ‹ COLLECTIONS
      </button>
      <div className="coll-top">
        <div>
          <div className="coll-kicker">IXI TRAN$ACT</div>
          <div className="coll-title">
            {collectionCase?.identity?.number || "COLLECTION CASE"}
          </div>
          <div className="coll-sub">
            {selected.invoiceNumber} · {selected.customerLabel}
          </div>
        </div>
        <div className="coll-lang">
          <button
            className={language === "en" ? "on" : ""}
            onClick={() => setLanguage("en")}
          >
            ENG
          </button>
          <button
            className={language === "es" ? "on" : ""}
            onClick={() => setLanguage("es")}
          >
            ESP
          </button>
        </div>
      </div>
      <div className="coll-balance">
        <span>{copy.balance}</span>
        <strong>{money(selected.balance)}</strong>
        <small>
          {selected.originalAmount
            ? `${money(selected.originalAmount)} ORIGINAL · ${money(selected.received)} RECEIVED · ${money(selected.credited)} CREDITED`
            : ""}
        </small>
      </div>
      <div className="coll-row">
        <div className="coll-head">
          <strong>{selected.status.toUpperCase()}</strong>
          <b>{selected.daysPastDue} DAYS</b>
        </div>
        <small>
          DUE {selected.dueDate || "—"} · AGING{" "}
          {selected.agingBucket.toUpperCase()}
        </small>
      </div>
      {error ? <div className="coll-error">{error}</div> : null}
      {unappliedDeposits.length ? (
        <>
          <div className="coll-section">{copy.deposits}</div>
          {unappliedDeposits.map((item) => {
            const document = financialDocumentOf(item);
            const amount = Number(
              document.metadata?.unappliedAmount ??
                document.amount ??
                document.totals?.total,
            );
            return (
              <button
                className="coll-row click"
                disabled={busy}
                key={document.financialDocumentId}
                onClick={() => applyDeposit(item)}
              >
                <div className="coll-head">
                  <strong>{document.metadata?.customerLabel}</strong>
                  <b>{money(Math.min(amount, selected.balance))}</b>
                </div>
                <small>
                  {language === "es"
                    ? "APLICAR A ESTA FACTURA"
                    : "APPLY TO THIS INVOICE"}{" "}
                  · {document.transactionReference}
                </small>
              </button>
            );
          })}
        </>
      ) : null}
      {!collectionCase ? (
        <>
          <div className="coll-callout">
            Open a collection case to manage contact history, promises, disputes
            and escalation. The receivable remains the original IXI Financial
            invoice.
          </div>
          <button className="coll-primary" disabled={busy} onClick={openCase}>
            {busy ? "OPENING..." : "OPEN COLLECTION CASE"}
          </button>
        </>
      ) : (
        <>
          <div className="coll-section">{copy.contact}</div>
          <div className="coll-grid2">
            <Field label="TYPE">
              <select
                value={contactType}
                onChange={(event) => setContactType(event.target.value)}
              >
                <option value="call">CALL</option>
                <option value="email">EMAIL</option>
                <option value="text">TEXT</option>
                <option value="meeting">MEETING</option>
              </select>
            </Field>
            <Field label="CONTACT">
              <Input value={contactName} onChange={setContactName} />
            </Field>
          </div>
          <Field label="SUMMARY">
            <textarea
              value={contactSummary}
              onChange={(event) => setContactSummary(event.target.value)}
            />
          </Field>
          <div className="coll-grid2">
            <Field label="OUTCOME">
              <Input value={contactOutcome} onChange={setContactOutcome} />
            </Field>
            <Field label="NEXT ACTION">
              <Input
                type="date"
                value={nextActionAt}
                onChange={setNextActionAt}
              />
            </Field>
          </div>
          <button className="coll-secondary" onClick={logContact}>
            SAVE CONTACT
          </button>
          <div className="coll-section">{copy.promise}</div>
          <div className="coll-grid2">
            <Field label="AMOUNT">
              <Input
                value={promiseAmount}
                onChange={setPromiseAmount}
                inputMode="decimal"
              />
            </Field>
            <Field label="DUE DATE">
              <Input
                type="date"
                value={promiseDate}
                onChange={setPromiseDate}
              />
            </Field>
          </div>
          <button className="coll-secondary" onClick={addPromise}>
            + PROMISE TO PAY
          </button>
          {collectionCase.promises
            ?.slice()
            .reverse()
            .map((item) => (
              <div className="coll-row" key={item.promiseId}>
                <div className="coll-head">
                  <strong>{item.status.toUpperCase()}</strong>
                  <b>{money(item.amount)}</b>
                </div>
                <small>
                  {item.promiseId} · DUE {item.dueDate}
                </small>
              </div>
            ))}
          <div className="coll-section">{copy.dispute}</div>
          <div className="coll-grid2">
            <Field label="AMOUNT">
              <Input
                value={disputeAmount}
                onChange={setDisputeAmount}
                inputMode="decimal"
              />
            </Field>
            <Field label="REASON">
              <Input value={disputeReason} onChange={setDisputeReason} />
            </Field>
          </div>
          <button className="coll-secondary" onClick={addDispute}>
            OPEN DISPUTE
          </button>
          {collectionCase.disputes
            ?.slice()
            .reverse()
            .map((item) => (
              <div className="coll-row" key={item.disputeId}>
                <div className="coll-head">
                  <strong>{item.status.toUpperCase()}</strong>
                  <b>{money(item.amount)}</b>
                </div>
                <small>{item.reason}</small>
              </div>
            ))}
          <div className="coll-section">{copy.payment}</div>
          <div className="coll-grid2">
            <Field label="AMOUNT">
              <Input
                value={paymentAmount}
                onChange={setPaymentAmount}
                inputMode="decimal"
              />
            </Field>
            <Field label="METHOD">
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
              >
                <option value="wire">WIRE</option>
                <option value="ach">ACH</option>
                <option value="check">CHECK</option>
                <option value="cash">CASH</option>
                <option value="card">CARD</option>
              </select>
            </Field>
          </div>
          <Field label="REFERENCE">
            <Input value={paymentReference} onChange={setPaymentReference} />
          </Field>
          <button
            className="coll-primary"
            disabled={busy}
            onClick={recordPayment}
          >
            {busy ? "POSTING..." : "POST PAYMENT TO IXI FINANCIAL"}
          </button>
          <div className="coll-section">{copy.credit}</div>
          <div className="coll-grid2">
            <Field label="AMOUNT">
              <Input
                value={creditAmount}
                onChange={setCreditAmount}
                inputMode="decimal"
              />
            </Field>
            <Field label="REASON">
              <Input value={creditReason} onChange={setCreditReason} />
            </Field>
          </div>
          <div className="coll-actions">
            <button
              className="coll-secondary"
              onClick={() => recordCredit(false)}
            >
              POST CREDIT
            </button>
            <button className="coll-danger" onClick={() => recordCredit(true)}>
              AUTHORIZED WRITE-OFF
            </button>
          </div>
          <div className="coll-section">ACTIVITY</div>
          {collectionCase.contacts
            ?.slice()
            .reverse()
            .map((item) => (
              <div className="coll-row" key={item.contactId}>
                <div className="coll-head">
                  <strong>{item.type.toUpperCase()}</strong>
                  <b>{item.outcome}</b>
                </div>
                <small>
                  {item.contactName} · {item.summary}
                </small>
              </div>
            ))}
          <button
            className="coll-secondary"
            disabled={busy}
            onClick={() =>
              persistCase(
                escalateIXICollectionCase(
                  collectionCase,
                  { level: "manager", reason: "Manual escalation" },
                  context.actor,
                ),
                "escalate",
              )
            }
          >
            ESCALATE TO MANAGER
          </button>
        </>
      )}
      <div className="coll-foot">
        Customer disagreement does not reduce A/R. Only a canonical IXI
        Financial credit, write-off or payment changes the receivable balance.
      </div>
      <IXICollectionsStyles />
    </div>
  );
}
