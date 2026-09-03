import { useEffect, useMemo, useState } from "react";

import { createIXIServiceQuote, updateIXIServiceQuote } from "./IXIServiceQuoteCommands";
import {
  createIXIServiceQuoteDraft,
  validateIXIServiceQuote
} from "./IXIServiceQuoteContract";
import {
  sendIXIServiceQuote,
  markIXIServiceQuoteViewed,
  requestIXIServiceQuoteChanges,
  declineIXIServiceQuote,
  acceptIXIServiceQuote,
  addIXIServiceChangeOrder,
  approveIXIServiceChangeOrder,
  convertIXIServiceQuoteToWorkOrder
} from "./IXIServiceQuoteRecordEngine";
import IXIServiceQuoteStyles from "./IXIServiceQuoteStyles";

const clean = value => String(value ?? "").trim();
const money = value =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(Number(value || 0));

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = days => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

function blankLine() {
  return {
    type: "labor",
    description: "",
    quantity: 1,
    unit: "hour",
    unitPrice: "",
    unitCost: "",
    taxable: true
  };
}

function blankOption(label = "BASE SCOPE", required = true) {
  return {
    label,
    description: "",
    required,
    lines: [blankLine()]
  };
}

const COPY = {
  en: {
    title: "SERVICE QUOTE",
    record: "SERVICE QUOTE RECORD",
    customer: "CUSTOMER",
    request: "SERVICE REQUEST / PROBLEM",
    scope: "CUSTOMER-FACING SCOPE",
    internal: "INTERNAL NOTES",
    pricing: "PRICING TYPE",
    create: "CREATE SERVICE QUOTE"
  },
  es: {
    title: "COTIZACIÓN DE SERVICIO",
    record: "REGISTRO DE COTIZACIÓN",
    customer: "CLIENTE",
    request: "SOLICITUD / PROBLEMA",
    scope: "ALCANCE PARA CLIENTE",
    internal: "NOTAS INTERNAS",
    pricing: "TIPO DE PRECIO",
    create: "CREAR COTIZACIÓN"
  }
};

function Field({ label, children }) {
  return (
    <div className="sq-field">
      <label>{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, ...props }) {
  return (
    <input
      {...props}
      value={value}
      onChange={event => onChange(event.target.value)}
    />
  );
}

export default function IXIServiceQuoteApp({
  context = {},
  object = {},
  initialRecord = null,
  language = "en",
  onBack = null,
  onRecordChange = null,
  onCreateServiceWorkOrder = null,
  onOpenServiceWorkOrder = null
}) {
  const primary = context.primary || {};
  const actor = context.actor || {};

  const [lang, setLang] = useState(language === "es" ? "es" : "en");
  const [clientRequestId] = useState(() => globalThis.crypto?.randomUUID?.() || `SQ-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const t = COPY[lang];
  const [record, setRecord] = useState(initialRecord);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [customerName, setCustomerName] = useState("");
  const [customerContactName, setCustomerContactName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [problem, setProblem] = useState("");
  const [customerScope, setCustomerScope] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [pricingType, setPricingType] = useState("estimate");
  const [options, setOptions] = useState([blankOption()]);
  const [taxAmount, setTaxAmount] = useState("");
  const [quoteDate, setQuoteDate] = useState(today());
  const [validThrough, setValidThrough] = useState(plusDays(14));
  const [paymentTerms, setPaymentTerms] = useState("NET 30");
  const [depositType, setDepositType] = useState("none");
  const [depositValue, setDepositValue] = useState("");
  const [assumptions, setAssumptions] = useState("");
  const [exclusions, setExclusions] = useState("");
  const [documents, setDocuments] = useState([]);

  const [responseText, setResponseText] = useState("");
  const [acceptedBy, setAcceptedBy] = useState("");
  const [acceptMethod, setAcceptMethod] = useState("digital");
  const [customerPoNumber, setCustomerPoNumber] = useState("");
  const [selectedOptionIds, setSelectedOptionIds] = useState([]);
  const [changeDescription, setChangeDescription] = useState("");
  const [changeAmount, setChangeAmount] = useState("");

  useEffect(() => {
    setRecord(initialRecord || null);
  }, [initialRecord]);

  const input = useMemo(
    () => ({
      customerName,
      clientRequestId,
      customerContactName,
      customerEmail,
      customerPhone,
      problem,
      customerScope,
      internalNotes,
      pricingType,
      options,
      taxAmount,
      quoteDate,
      validThrough,
      paymentTerms,
      depositType,
      depositValue,
      assumptions,
      exclusions,
      documents,
      customerPoNumber,
      assetPassportId: primary.passportId,
      assetObjectId: primary.objectId,
      assetObjectType: primary.objectType,
      assetLabel: primary.label
    }),
    [
      customerName,
      clientRequestId,
      customerContactName,
      customerEmail,
      customerPhone,
      problem,
      customerScope,
      internalNotes,
      pricingType,
      options,
      taxAmount,
      quoteDate,
      validThrough,
      paymentTerms,
      depositType,
      depositValue,
      assumptions,
      exclusions,
      documents,
      customerPoNumber,
      primary
    ]
  );

  const preview = useMemo(
    () => createIXIServiceQuoteDraft({ context, input }),
    [context, input]
  );

  function updateLine(optionIndex, lineIndex, key, value) {
    setOptions(current =>
      current.map((option, oi) =>
        oi !== optionIndex
          ? option
          : {
              ...option,
              lines: option.lines.map((line, li) =>
                li !== lineIndex ? line : { ...line, [key]: value }
              )
            }
      )
    );
  }

  function updateOption(optionIndex, patch) {
    setOptions(current =>
      current.map((option, index) =>
        index === optionIndex ? { ...option, ...patch } : option
      )
    );
  }

  function addDocuments(fileList, type) {
    const additions = Array.from(fileList || []).map((file, index) => ({
      documentId: `SQ-DOC-${Date.now()}-${index}`,
      type,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      status: "local-pending-upload"
    }));
    setDocuments(current => [...current, ...additions]);
  }

  async function createRecord() {
    const validation = validateIXIServiceQuote(preview);
    setErrors(validation.errors || {});
    if (!validation.valid) return;

    setSaving(true);
    try {
      const result = await createIXIServiceQuote({
        object: {
          ...object,
          passportId: primary.passportId,
          objectId: primary.objectId,
          objectType: primary.objectType,
          label: primary.label
        },
        context,
        input,
        metadata: { source: "ixi-transact-service-quote" }
      });
      setRecord(result.record);
      await onRecordChange?.(
        result.record,
        { action: "create", response: result.response },
        context
      );
    } catch (error) {
      setErrors(error?.validation?.errors || { command: error?.message || "Service Quote save failed" });
    } finally {
      setSaving(false);
    }
  }

  async function mutate(factory, change) {
    if (saving) return null;
    setSaving(true);
    setErrors({});
    try {
      const next = factory();
      const result = await updateIXIServiceQuote({ record: next, action: change.action });
      setRecord(result.record);
      await onRecordChange?.(result.record, { ...change, response: result.response }, context);
      return result.record;
    } catch (error) {
      setErrors({ command: error?.message || "Service Quote update failed" });
      return null;
    } finally {
      setSaving(false);
    }
  }

  if (record) {
    const accepted = ["accepted", "converted"].includes(record.status);

    return (
      <div className="ixi-sq">
        <div className="sq-top">
          <div>
            <div className="sq-kicker">IXI TRAN$ACT</div>
            <div className="sq-title">{t.record}</div>
            <div className="sq-id">
              {record.identity?.number} · REV {record.identity?.revision}
            </div>
          </div>
          <div className="sq-lang">
            <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>ENG</button>
            <button className={lang === "es" ? "on" : ""} onClick={() => setLang("es")}>ESP</button>
          </div>
        </div>

        <div className="sq-context">
          <strong>{record.customer?.name} · {record.asset?.label}</strong>
          <small>{record.request?.problem}</small>
        </div>

        <div className="sq-status">
          <div className="sq-statushead">
            <strong className={accepted ? "sq-ok" : record.status === "declined" ? "sq-bad" : ""}>
              {clean(record.status).replace(/-/g, " ").toUpperCase()}
            </strong>
            <b>{money(record.economics?.customerQuoteTotal)}</b>
          </div>
          <small>
            {clean(record.commercial?.pricingType).toUpperCase()} · VALID {record.commercial?.validThrough}
          </small>
        </div>

        <div className="sq-section">COMMERCIAL</div>
        <div className="sq-money"><span>SERVICE SUBTOTAL</span><b>{money(record.economics?.quotedServiceRevenue)}</b></div>
        <div className="sq-money"><span>EST. SALES TAX</span><b>{money(record.commercial?.taxAmount)}</b></div>
        <div className="sq-money"><span>CUSTOMER QUOTE TOTAL</span><b>{money(record.economics?.customerQuoteTotal)}</b></div>
        <div className="sq-money"><span>EST. INTERNAL COST</span><b>{money(record.economics?.estimatedInternalCost)}</b></div>
        <div className="sq-money"><span>PROJECTED GROSS PROFIT</span><b>{money(record.economics?.projectedGrossProfit)}</b></div>
        <div className="sq-money"><span>PROJECTED MARGIN</span><b>{record.economics?.projectedMarginPercent}%</b></div>

        {!accepted ? (
          <>
            <div className="sq-section">CUSTOMER RESPONSE</div>
            {["draft", "changes-requested"].includes(record.status) ? (
              <button
                className="sq-primary"
                onClick={() =>
                  mutate(
                    () => sendIXIServiceQuote(record, { channel: "email", recipient: record.customer?.email }, actor),
                    { action: "send" }
                  )
                }
              >
                SEND / RESEND QUOTE
              </button>
            ) : null}

            {record.status === "sent" ? (
              <button
                className="sq-secondary"
                onClick={() => mutate(() => markIXIServiceQuoteViewed(record, actor), { action: "viewed" })}
              >
                MARK VIEWED
              </button>
            ) : null}

            {["sent", "viewed", "changes-requested"].includes(record.status) ? <Field label="CUSTOMER RESPONSE / CHANGE REQUEST">
              <textarea value={responseText} onChange={event => setResponseText(event.target.value)} />
            </Field> : null}

            {["sent", "viewed", "changes-requested"].includes(record.status) ? <div className="sq-actions">
              <button
                className="sq-secondary"
                onClick={() =>
                  mutate(
                    () => requestIXIServiceQuoteChanges(record, { message: responseText }, actor),
                    { action: "changes-requested" }
                  )
                }
              >
                REQUEST CHANGES
              </button>
              <button
                className="sq-danger"
                onClick={() =>
                  mutate(
                    () => declineIXIServiceQuote(record, { reason: responseText }, actor),
                    { action: "decline" }
                  )
                }
              >
                DECLINE
              </button>
            </div> : null}

            {["sent", "viewed"].includes(record.status) ? <><Field label="ACCEPTED BY">
              <TextInput value={acceptedBy} onChange={setAcceptedBy} />
            </Field>
            <div className="sq-grid2">
              <Field label="METHOD">
                <select value={acceptMethod} onChange={event => setAcceptMethod(event.target.value)}>
                  <option value="digital">DIGITAL</option>
                  <option value="signature">SIGNATURE</option>
                  <option value="email">EMAIL</option>
                  <option value="text">TEXT</option>
                  <option value="phone">PHONE</option>
                  <option value="customer-po">CUSTOMER PO</option>
                </select>
              </Field>
              <Field label="CUSTOMER PO #">
                <TextInput value={customerPoNumber} onChange={setCustomerPoNumber} />
              </Field>
            </div>

            {record.options?.filter(option => !option.required).map(option => (
              <label className="sq-row" key={option.optionId}>
                <input
                  type="checkbox"
                  checked={selectedOptionIds.includes(option.optionId)}
                  onChange={event =>
                    setSelectedOptionIds(current =>
                      event.target.checked
                        ? [...current, option.optionId]
                        : current.filter(id => id !== option.optionId)
                    )
                  }
                />
                {" "}{option.label} · {money(option.customerTotal)}
              </label>
            ))}

            <button
              className="sq-primary"
              disabled={saving}
              onClick={() =>
                mutate(
                  () =>
                    acceptIXIServiceQuote(
                      record,
                      {
                        acceptedBy,
                        method: acceptMethod,
                        customerPoNumber,
                        acceptedOptionIds: selectedOptionIds
                      },
                      actor
                    ),
                  { action: "accept" }
                )
              }
            >
              RECORD CUSTOMER ACCEPTANCE
            </button>
            </> : null}
          </>
        ) : (
          <>
            <div className="sq-total">
              <span>AUTHORIZED CUSTOMER VALUE</span>
              <strong>{money(record.economics?.authorizedCustomerTotal)}</strong>
            </div>
            <div className="sq-row">
              <div className="sq-rowhead">
                <strong>ACCEPTED BY</strong>
                <b>{record.acceptance?.acceptedBy || "—"}</b>
              </div>
              <small>
                {record.acceptance?.acceptedAt} · {record.acceptance?.method} · PO {record.acceptance?.customerPoNumber || "—"}
              </small>
            </div>

            {record.status === "accepted" ? (
              <button
                className="sq-primary"
                disabled={saving || !onCreateServiceWorkOrder}
                onClick={async () => {
                  if (saving) return;
                  const workOrder = await onCreateServiceWorkOrder?.(record, context);
                  const workOrderId = clean(
                    workOrder?.identity?.workOrderId ||
                      workOrder?.identity?.number ||
                      workOrder?.workOrderId ||
                      workOrder?.number
                  );
                  const converted = await mutate(
                    () => convertIXIServiceQuoteToWorkOrder(record, workOrderId, actor),
                    { action: "create-service-work-order", workOrderId, workOrder: workOrder || null }
                  );
                  if (converted) await onOpenServiceWorkOrder?.(workOrder, converted, context);
                }}
              >
                {onCreateServiceWorkOrder ? "CREATE CUSTOMER SERVICE WORK ORDER" : "WORK ORDER CONVERSION REQUIRES AOS"}
              </button>
            ) : (
              <div className="sq-callout">
                CUSTOMER SERVICE WORK ORDER · {record.related?.customerServiceWorkOrderId}
              </div>
            )}

            <div className="sq-section">CHANGE ORDERS</div>
            {record.changeOrders?.map(changeOrder => (
              <div className="sq-row" key={changeOrder.changeOrderId}>
                <div className="sq-rowhead">
                  <strong>{changeOrder.changeOrderId} · {clean(changeOrder.status).toUpperCase()}</strong>
                  <b>{money(changeOrder.amount)}</b>
                </div>
                <small>{changeOrder.description}</small>
                {changeOrder.status === "pending" ? (
                  <button
                    className="sq-secondary"
                    onClick={() =>
                      mutate(
                        () =>
                          approveIXIServiceChangeOrder(
                            record,
                            changeOrder.changeOrderId,
                            {
                              acceptedBy: acceptedBy || record.acceptance?.acceptedBy,
                              method: acceptMethod
                            },
                            actor
                          ),
                        { action: "approve-change-order", changeOrderId: changeOrder.changeOrderId }
                      )
                    }
                  >
                    RECORD CUSTOMER APPROVAL
                  </button>
                ) : null}
              </div>
            ))}

            <Field label="NEW CHANGE ORDER">
              <TextInput value={changeDescription} onChange={setChangeDescription} />
            </Field>
            <Field label="CUSTOMER PRICE DELTA">
              <TextInput value={changeAmount} onChange={setChangeAmount} inputMode="decimal" />
            </Field>
            <button
              className="sq-secondary"
              onClick={() =>
                mutate(
                  () => addIXIServiceChangeOrder(record, { description: changeDescription, amount: changeAmount }, actor),
                  { action: "create-change-order" }
                )
              }
            >
              + CREATE CHANGE ORDER
            </button>
          </>
        )}

        <div className="sq-section">SCOPE / OPTIONS</div>
        <div className="sq-callout">{record.request?.customerScope}</div>
        {record.options?.map(option => (
          <div className="sq-row" key={option.optionId}>
            <div className="sq-rowhead">
              <strong>{option.label}{option.required ? " · BASE" : " · OPTIONAL"}</strong>
              <b>{money(option.customerTotal)}</b>
            </div>
            {option.lines?.map(line => (
              <small key={line.lineId}>
                {clean(line.type).toUpperCase()} · {line.description} · {line.quantity} {line.unit} · {money(line.customerTotal)}
              </small>
            ))}
          </div>
        ))}

        <div className="sq-section">ACTIVITY</div>
        <div className="sq-history">
          {record.activity?.slice().reverse().map(event => (
            <div className="sq-row" key={event.eventId}>
              <div className="sq-rowhead">
                <strong>{clean(event.type).replace(/-/g, " ").toUpperCase()}</strong>
                <b>{event.revision ? `REV ${event.revision}` : ""}</b>
              </div>
              <small>{event.actorLabel} · {event.occurredAt}</small>
            </div>
          ))}
        </div>

        {Object.keys(errors).length ? <div className="sq-callout sq-bad">{Object.values(errors).join(" · ")}</div> : null}

        <button className="sq-secondary" onClick={() => onBack?.()}>‹ TRAN$ACT</button>
        <div className="sq-foot">
          Accepted commercial authorization is immutable. Additional authorized work is handled by Change Order.
        </div>
        <IXIServiceQuoteStyles />
      </div>
    );
  }

  return (
    <div className="ixi-sq">
      <div className="sq-top">
        <div>
          <div className="sq-kicker">IXI TRAN$ACT</div>
          <div className="sq-title">{t.title}</div>
        </div>
        <div className="sq-lang">
          <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>ENG</button>
          <button className={lang === "es" ? "on" : ""} onClick={() => setLang("es")}>ESP</button>
        </div>
      </div>

      <div className="sq-context">
        <strong>{primary.label || "CUSTOMER ASSET / AOS CONTEXT"}</strong>
        <small>{primary.objectType || "AOS OBJECT"} · {context.location?.label || "NO LOCATION"}</small>
      </div>

      <div className="sq-section">CUSTOMER / REQUEST</div>
      <Field label={t.customer}>
        <TextInput value={customerName} onChange={setCustomerName} />
      </Field>
      <div className="sq-grid2">
        <Field label="CONTACT">
          <TextInput value={customerContactName} onChange={setCustomerContactName} />
        </Field>
        <Field label="EMAIL">
          <TextInput value={customerEmail} onChange={setCustomerEmail} />
        </Field>
      </div>
      <Field label={t.request}>
        <textarea value={problem} onChange={event => setProblem(event.target.value)} />
      </Field>
      <Field label={t.scope}>
        <textarea value={customerScope} onChange={event => setCustomerScope(event.target.value)} />
      </Field>
      <Field label={t.internal}>
        <textarea value={internalNotes} onChange={event => setInternalNotes(event.target.value)} />
      </Field>

      <div className="sq-section">{t.pricing}</div>
      <div className="sq-choice">
        {[
          ["estimate", "ESTIMATE"],
          ["fixed-price", "FIXED PRICE"],
          ["not-to-exceed", "NOT TO EXCEED"]
        ].map(([id, label]) => (
          <button key={id} className={pricingType === id ? "on" : ""} onClick={() => setPricingType(id)}>
            {label}
          </button>
        ))}
      </div>

      <div className="sq-section">SCOPE / OPTIONS</div>
      {options.map((option, optionIndex) => (
        <div className="sq-row" key={`option-${optionIndex}`}>
          <div className="sq-rowhead">
            <TextInput
              value={option.label}
              onChange={value => updateOption(optionIndex, { label: value })}
            />
            <b>{option.required ? "BASE" : "OPTIONAL"}</b>
          </div>

          {option.lines.map((line, lineIndex) => (
            <div key={`line-${lineIndex}`}>
              <div className="sq-grid2">
                <Field label="TYPE">
                  <select
                    value={line.type}
                    onChange={event => updateLine(optionIndex, lineIndex, "type", event.target.value)}
                  >
                    <option value="labor">LABOR</option>
                    <option value="part-material">PART / MATERIAL</option>
                    <option value="outside-service">OUTSIDE SERVICE</option>
                    <option value="travel-freight">TRAVEL / FREIGHT</option>
                    <option value="other">OTHER</option>
                  </select>
                </Field>
                <Field label="DESCRIPTION">
                  <TextInput
                    value={line.description}
                    onChange={value => updateLine(optionIndex, lineIndex, "description", value)}
                  />
                </Field>
              </div>
              <div className="sq-grid2">
                <Field label="QTY">
                  <TextInput
                    value={line.quantity}
                    onChange={value => updateLine(optionIndex, lineIndex, "quantity", value)}
                    inputMode="decimal"
                  />
                </Field>
                <Field label="UNIT">
                  <TextInput
                    value={line.unit}
                    onChange={value => updateLine(optionIndex, lineIndex, "unit", value)}
                  />
                </Field>
              </div>
              <div className="sq-grid2">
                <Field label="CUSTOMER UNIT PRICE">
                  <TextInput
                    value={line.unitPrice}
                    onChange={value => updateLine(optionIndex, lineIndex, "unitPrice", value)}
                    inputMode="decimal"
                  />
                </Field>
                <Field label="INTERNAL UNIT COST">
                  <TextInput
                    value={line.unitCost}
                    onChange={value => updateLine(optionIndex, lineIndex, "unitCost", value)}
                    inputMode="decimal"
                  />
                </Field>
              </div>
            </div>
          ))}

          <button
            className="sq-secondary"
            onClick={() => updateOption(optionIndex, { lines: [...option.lines, blankLine()] })}
          >
            + ADD LINE
          </button>
        </div>
      ))}

      <button
        className="sq-secondary"
        onClick={() => setOptions(current => [...current, blankOption(`OPTION ${current.length}`, false)])}
      >
        + ADD OPTIONAL / ALTERNATE SCOPE
      </button>

      <div className="sq-total">
        <span>QUOTE TOTAL</span>
        <strong>{money(preview.economics?.customerQuoteTotal)}</strong>
      </div>
      <div className="sq-money"><span>EST. INTERNAL COST</span><b>{money(preview.economics?.estimatedInternalCost)}</b></div>
      <div className="sq-money"><span>PROJECTED GP</span><b>{money(preview.economics?.projectedGrossProfit)}</b></div>
      <div className="sq-money"><span>PROJECTED MARGIN</span><b>{preview.economics?.projectedMarginPercent}%</b></div>

      <div className="sq-section">TERMS / AUTHORIZATION</div>
      <div className="sq-grid2">
        <Field label="QUOTE DATE">
          <TextInput type="date" value={quoteDate} onChange={setQuoteDate} />
        </Field>
        <Field label="VALID THROUGH">
          <TextInput type="date" value={validThrough} onChange={setValidThrough} />
        </Field>
      </div>
      <Field label="PAYMENT TERMS">
        <TextInput value={paymentTerms} onChange={setPaymentTerms} />
      </Field>
      <div className="sq-grid2">
        <Field label="DEPOSIT TYPE">
          <select value={depositType} onChange={event => setDepositType(event.target.value)}>
            <option value="none">NONE</option>
            <option value="fixed">DOLLAR AMOUNT</option>
            <option value="percent">PERCENT</option>
          </select>
        </Field>
        <Field label="DEPOSIT VALUE">
          <TextInput value={depositValue} onChange={setDepositValue} inputMode="decimal" />
        </Field>
      </div>
      <Field label="TAX">
        <TextInput value={taxAmount} onChange={setTaxAmount} inputMode="decimal" />
      </Field>
      <Field label="ASSUMPTIONS">
        <textarea value={assumptions} onChange={event => setAssumptions(event.target.value)} />
      </Field>
      <Field label="EXCLUSIONS">
        <textarea value={exclusions} onChange={event => setExclusions(event.target.value)} />
      </Field>

      <div className="sq-section">DOCUMENTS / PHOTOS</div>
      <div className="sq-docs">
        <label className="sq-secondary">
          + PHOTOS
          <input hidden multiple type="file" accept="image/*" onChange={event => addDocuments(event.target.files, "photo")} />
        </label>
        <label className="sq-secondary">
          + DOCUMENT
          <input hidden multiple type="file" onChange={event => addDocuments(event.target.files, "document")} />
        </label>
      </div>
      {documents.map(document => (
        <div className="sq-row" key={document.documentId}>
          <strong>{document.type.toUpperCase()}</strong>
          <small>{document.fileName}</small>
        </div>
      ))}

      {Object.keys(errors).length ? (
        <div className="sq-error">
          {Object.values(errors).join(" · ").toUpperCase()}
        </div>
      ) : null}

      <button className="sq-primary" disabled={saving} onClick={createRecord}>
        {saving ? "CREATING..." : t.create}
      </button>
      <button className="sq-secondary" onClick={() => onBack?.()}>‹ TRAN$ACT</button>
      <div className="sq-foot">
        Customer pricing and internal estimated cost remain separate. Actual work does not rewrite the accepted quote.
      </div>
      <IXIServiceQuoteStyles />
    </div>
  );
}
