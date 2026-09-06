import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  attestIXIEquipmentSaleSigned,
  createIXIEquipmentSaleSigningInvitation,
  ensureIXIEquipmentSaleInvoice,
  issueIXIEquipmentInvoice,
  saveIXIEquipmentInvoice,
  saveIXIEquipmentSale,
} from "./IXIEquipmentSaleCommands";
import {
  createIXIEquipmentSaleDraft,
  hydrateIXIEquipmentSaleRecord,
  getIXIEquipmentSaleReadiness,
  saleInputFromRecord,
  updateIXIEquipmentSale,
} from "./IXIEquipmentSaleContract";
import IXIEquipmentSaleStyles from "./IXIEquipmentSaleStyles";
import { updateIXIQuote } from "../quote/IXIQuoteCommands";
import { IXISalesStageRail } from "../../sales/IXISalesDealRegister";

const clean = (value) => String(value ?? "").trim();
const usd = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(value || 0),
  );
const stages = [
  "QUOTE",
  "SALES ORDER",
  "SIGNED",
  "INVOICE",
  "SOLD",
  "SETTLEMENT",
];
const tabForEntry = (value) =>
  ["invoice", "preview"].includes(value) ? value : "order";
function Field({ label, children, wide = false }) {
  return (
    <label className={`es-field ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}
function Input({ value, onChange, ...rest }) {
  return (
    <input
      {...rest}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
function Area({ value, onChange, ...rest }) {
  return (
    <textarea
      {...rest}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function ManualSignatureControl({ value, onChange, onSubmit, busy, signed }) {
  if (signed)
    return (
      <section className="es-manual-signature complete">
        <strong>✓ SIGNED DOCUMENTS ON FILE</strong>
        <span>
          {value.signerName || "CUSTOMER"} ·{" "}
          {value.signerDate || "DATE RECORDED"}
        </span>
        <small>
          {clean(value.receivedVia || "recorded").toUpperCase()} · AUDIT
          EVIDENCE RETAINED
        </small>
      </section>
    );
  return (
    <section className="es-manual-signature">
      <strong>MANUAL SIGNATURE CONTROL</strong>
      <p>
        Use when the signed Sales Order and Terms were returned outside IXI.
      </p>
      <label>
        <span>SIGNER NAME</span>
        <Input
          value={value.signerName}
          onChange={(next) => onChange("signerName", next)}
        />
      </label>
      <div>
        <label>
          <span>SIGNED DATE</span>
          <Input
            type="date"
            value={value.signerDate}
            onChange={(next) => onChange("signerDate", next)}
          />
        </label>
        <label>
          <span>RECEIVED VIA</span>
          <select
            value={value.receivedVia}
            onChange={(event) => onChange("receivedVia", event.target.value)}
          >
            <option value="email">EMAIL</option>
            <option value="paper">PAPER</option>
            <option value="other">OTHER</option>
          </select>
        </label>
      </div>
      <label>
        <span>REFERENCE / NOTE</span>
        <Input
          value={value.externalReference}
          onChange={(next) => onChange("externalReference", next)}
          placeholder="Email subject, file, or paper location"
        />
      </label>
      <label className="es-manual-attestation">
        <input
          type="checkbox"
          checked={value.attestation === true}
          onChange={(event) => onChange("attestation", event.target.checked)}
        />
        <span>
          I confirm the customer-signed Sales Order and Terms are on file.
        </span>
      </label>
      <button
        type="button"
        disabled={
          busy ||
          !value.attestation ||
          clean(value.signerName).length < 2 ||
          !value.signerDate
        }
        onClick={onSubmit}
      >
        {busy ? "RECORDING…" : "MARK SIGNED"}
      </button>
    </section>
  );
}

function DealTypeEditor({ value, onChange, disabled = false }) {
  return (
    <div className="es-deal-type">
      <span>TRANSACTION TYPE</span>
      <div>
        <button
          disabled={disabled}
          type="button"
          className={value !== "rental-purchase-option" ? "active" : ""}
          onClick={() => onChange("standard-sale")}
        >
          STANDARD SALE
        </button>
        <button
          disabled={disabled}
          type="button"
          className={value === "rental-purchase-option" ? "active" : ""}
          onClick={() => onChange("rental-purchase-option")}
        >
          RENTAL PURCHASE OPTION
        </button>
      </div>
    </div>
  );
}

const RPO_FIELDS = [
  ["startDate", "START DATE", "date"],
  ["firstPaymentDate", "FIRST PAYMENT", "date"],
  ["finalOptionDate", "FINAL OPTION DATE", "date"],
  ["termMonths", "TERM MONTHS", "number"],
  ["paymentCount", "PAYMENT COUNT", "number"],
  ["initialPayment", "INITIAL PAYMENT", "decimal"],
  ["periodicPayment", "PERIODIC PAYMENT", "decimal"],
  ["taxPerPayment", "TAX / PAYMENT", "decimal"],
  ["recurringFees", "RECURRING FEES", "decimal"],
  ["purchaseCreditAmount", "AMOUNT APPLIED / PAYMENT", "decimal"],
  ["purchaseCreditPercent", "PERCENT APPLIED", "decimal"],
  ["optionPrice", "PURCHASE OPTION PRICE", "decimal"],
  ["currentPayoff", "CURRENT PAYOFF", "decimal"],
  ["usageLimit", "USAGE / HOUR LIMIT", "text"],
  ["excessUsageRate", "EXCESS USAGE RATE", "text"],
];

function RPOEditor({ input, patchRpo, disabled = false, compact = false }) {
  const fields = compact
    ? RPO_FIELDS.filter(([key]) =>
        [
          "startDate",
          "termMonths",
          "periodicPayment",
          "purchaseCreditAmount",
          "optionPrice",
        ].includes(key),
      )
    : RPO_FIELDS;
  return (
    <section className={`es-rpo ${compact ? "compact" : ""}`}>
      <h3>RPO ECONOMICS &amp; CONTROL</h3>
      <div className={compact ? "es-card-pair" : "es-grid"}>
        <CardField label="PAYMENT FREQUENCY">
          <select
            disabled={disabled}
            value={input.rpo?.paymentFrequency || "monthly"}
            onChange={(event) =>
              patchRpo("paymentFrequency", event.target.value)
            }
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="custom">Custom</option>
          </select>
        </CardField>
        <CardField label="PURCHASE CREDIT METHOD">
          <select
            disabled={disabled}
            value={input.rpo?.purchaseCreditType || "amount"}
            onChange={(event) =>
              patchRpo("purchaseCreditType", event.target.value)
            }
          >
            <option value="amount">Fixed amount</option>
            <option value="percent">Percent of payment</option>
          </select>
        </CardField>
        {fields.map(([key, label, type]) => (
          <CardField key={key} label={label}>
            <Input
              disabled={disabled}
              type={
                type === "date"
                  ? "date"
                  : type === "number"
                    ? "number"
                    : undefined
              }
              inputMode={type === "decimal" ? "decimal" : undefined}
              value={input.rpo?.[key]}
              onChange={(value) => patchRpo(key, value)}
            />
          </CardField>
        ))}
      </div>
      {compact ? null : (
        <div className="es-grid es-rpo-language">
          {[
            ["earlyBuyoutTerms", "EARLY BUYOUT TERMS"],
            ["deliveryTerms", "RPO DELIVERY TERMS"],
            ["returnTerms", "RETURN TERMS"],
            ["maintenanceResponsibility", "MAINTENANCE RESPONSIBILITY"],
            ["insuranceRequirements", "INSURANCE REQUIREMENTS"],
            ["lateFeeTerms", "LATE FEE TERMS"],
            ["defaultTerms", "DEFAULT TERMS"],
            ["notes", "RPO NOTES"],
          ].map(([key, label]) => (
            <Field key={key} label={label}>
              <Area
                disabled={disabled}
                value={input.rpo?.[key]}
                onChange={(value) => patchRpo(key, value)}
              />
            </Field>
          ))}
        </div>
      )}
    </section>
  );
}

function AdditionalTermsEditor({
  terms = [],
  onChange,
  disabled = false,
  compact = false,
}) {
  const update = (index, key, value) =>
    onChange(
      terms.map((term, current) =>
        current === index ? { ...term, [key]: value } : term,
      ),
    );
  return (
    <section className={`es-additional ${compact ? "compact" : ""}`}>
      <div className="es-section-head">
        <h3>ADDITIONAL TERMS</h3>
        <button
          disabled={disabled}
          type="button"
          onClick={() =>
            onChange([
              ...terms,
              {
                termId:
                  globalThis.crypto?.randomUUID?.() || `TERM-${Date.now()}`,
                label: "",
                value: "",
                scope: "transaction",
                customerFacing: true,
              },
            ])
          }
        >
          + ADD
        </button>
      </div>
      {compact
        ? terms.map((term, index) => (
            <div className="es-card-term" key={term.termId || index}>
              <Input
                disabled={disabled}
                value={term.label}
                onChange={(value) => update(index, "label", value)}
                placeholder="Term name"
              />
              <Area
                disabled={disabled}
                value={term.value}
                onChange={(value) => update(index, "value", value)}
                placeholder="Term value or language"
              />
              <button
                disabled={disabled}
                type="button"
                aria-label="Remove term"
                onClick={() =>
                  onChange(terms.filter((_, current) => current !== index))
                }
              >
                ×
              </button>
            </div>
          ))
        : terms.map((term, index) => (
            <div className="es-term-row" key={term.termId || index}>
              <Input
                disabled={disabled}
                value={term.label}
                onChange={(value) => update(index, "label", value)}
                placeholder="Term name"
              />
              <Area
                disabled={disabled}
                value={term.value}
                onChange={(value) => update(index, "value", value)}
                placeholder="Term language or value"
              />
              <select
                disabled={disabled}
                value={term.scope || "transaction"}
                onChange={(event) => update(index, "scope", event.target.value)}
              >
                <option value="transaction">Whole transaction</option>
                <option value="rpo">RPO only</option>
                <option value="invoice">Invoice</option>
              </select>
              <label>
                <input
                  disabled={disabled}
                  type="checkbox"
                  checked={term.customerFacing !== false}
                  onChange={(event) =>
                    update(index, "customerFacing", event.target.checked)
                  }
                />{" "}
                CUSTOMER FACING
              </label>
              <button
                disabled={disabled}
                type="button"
                onClick={() =>
                  onChange(terms.filter((_, current) => current !== index))
                }
              >
                REMOVE
              </button>
            </div>
          ))}
    </section>
  );
}

function CommissionEditor({
  rows = [],
  onChange,
  disabled = false,
  compact = false,
}) {
  const update = (index, key, value) =>
    onChange(
      rows.map((row, current) =>
        current === index ? { ...row, [key]: value } : row,
      ),
    );
  return (
    <section className={`es-additional ${compact ? "compact" : ""}`}>
      <div className="es-section-head">
        <div>
          <h3>INTERNAL COMPENSATION</h3>
          <small>NOT SHOWN ON CUSTOMER DOCUMENTS</small>
        </div>
        <button
          disabled={disabled}
          type="button"
          onClick={() =>
            onChange([
              ...rows,
              {
                commissionId:
                  globalThis.crypto?.randomUUID?.() || `COM-${Date.now()}`,
                recipientLabel: "",
                recipientPassportId: "",
                commissionType: "salesperson",
                calculationMethod: "fixed",
                ratePercent: "",
                fixedAmount: "",
                targetAmount: "",
                adjustmentAmount: "",
                economicTreatment: "machine-selling-expense",
                status: "proposed",
                conditions: "",
                reference: "",
                included: true,
                internalOnly: true,
              },
            ])
          }
        >
          + ADD
        </button>
      </div>
      {rows.map((row, index) => (
        <div className="es-term-row" key={row.commissionId || index}>
          <Input
            disabled={disabled}
            value={row.recipientLabel}
            onChange={(value) => update(index, "recipientLabel", value)}
            placeholder="Salesperson, broker, referral or company"
          />
          <select
            disabled={disabled}
            value={row.commissionType || "salesperson"}
            onChange={(event) =>
              update(index, "commissionType", event.target.value)
            }
          >
            <option value="salesperson">SALESPERSON</option>
            <option value="broker">BROKER</option>
            <option value="referral">REFERRAL</option>
            <option value="bounty">MACHINE BOUNTY</option>
            <option value="bonus">BONUS</option>
            <option value="management">MANAGEMENT</option>
            <option value="other">OTHER</option>
          </select>
          <select
            disabled={disabled}
            value={row.calculationMethod || "fixed"}
            onChange={(event) =>
              update(index, "calculationMethod", event.target.value)
            }
          >
            <option value="fixed">FIXED</option>
            <option value="sale-price">% SALE PRICE</option>
            <option value="gross-profit">% GROSS PROFIT</option>
            <option value="net-profit">% NET PROFIT</option>
            <option value="above-target">% ABOVE TARGET</option>
            <option value="manual">MANUAL</option>
          </select>
          <Input
            disabled={disabled}
            inputMode="decimal"
            value={
              row.calculationMethod === "fixed" ||
              row.calculationMethod === "manual"
                ? row.fixedAmount
                : row.ratePercent
            }
            onChange={(value) =>
              update(
                index,
                row.calculationMethod === "fixed" ||
                  row.calculationMethod === "manual"
                  ? "fixedAmount"
                  : "ratePercent",
                value,
              )
            }
            placeholder={
              row.calculationMethod === "fixed" ||
              row.calculationMethod === "manual"
                ? "Amount"
                : "Rate %"
            }
          />
          <Input
            disabled={disabled}
            inputMode="decimal"
            value={row.targetAmount}
            onChange={(value) => update(index, "targetAmount", value)}
            placeholder="Target / hurdle (optional)"
          />
          <Input
            disabled={disabled}
            value={row.conditions}
            onChange={(value) => update(index, "conditions", value)}
            placeholder="Earned conditions / notes"
          />
          <button
            disabled={disabled}
            type="button"
            aria-label="Remove commission"
            onClick={() =>
              onChange(rows.filter((_, current) => current !== index))
            }
          >
            ×
          </button>
        </div>
      ))}
    </section>
  );
}

function saleRecordFromInvoice(base, invoice) {
  if (!invoice) return base;
  const metadata = invoice?.metadata || {};
  const breakdown = metadata?.commercialBreakdown || {};
  return {
    ...base,
    brand: { ...base.brand, ...(metadata.brand || {}) },
    customer: { ...base.customer, ...(metadata.customer || {}) },
    asset: { ...base.asset, ...(metadata.asset || {}) },
    dealType: metadata.dealType || base.dealType,
    rpo: { ...base.rpo, ...(metadata.rpo || {}) },
    additionalTerms: metadata.additionalTerms || base.additionalTerms,
    commercial: {
      ...base.commercial,
      orderDate: clean(invoice.occurredAt).slice(0, 10),
      dueDate: clean(invoice.dueDate).slice(0, 10),
      paymentTerms: clean(invoice.paymentTerms),
    },
    totals: {
      ...base.totals,
      ...breakdown,
      subtotal:
        breakdown.subtotal ??
        invoice?.totals?.subtotal ??
        invoice?.totals?.total ??
        base?.totals?.subtotal,
      total: breakdown.total ?? invoice?.totals?.total ?? base?.totals?.total,
    },
  };
}

function initialSaleRecord({
  context,
  quote,
  initialRecord,
  invoice,
  entryMode,
  dealId,
}) {
  const base = createIXIEquipmentSaleDraft({
    context,
    quote,
    input: { dealId },
  });
  const directInvoice =
    entryMode === "invoice" &&
    invoice &&
    !clean(
      invoice?.sourceFinancialDocumentId || invoice?.metadata?.salesOrderId,
    );
  if (entryMode === "sales-order")
    return initialRecord
      ? hydrateIXIEquipmentSaleRecord({ context, record: initialRecord })
      : base;
  return directInvoice
    ? saleRecordFromInvoice(base, invoice)
    : initialRecord || base;
}

function reopenSignedTerms(record = {}) {
  const at = new Date().toISOString();
  return {
    ...record,
    status: "draft",
    signing: {
      ...(record.signing || {}),
      status: "not-sent",
      tokenVersion: Number(record?.signing?.tokenVersion || 0) + 1,
      expiresAt: "",
      sentAt: "",
      signedAt: "",
      signedPackageHash: "",
    },
    activity: [
      ...(record.activity || []),
      {
        eventId: `SO-REOPEN-${Date.now()}`,
        type: "signed-terms-reopened",
        occurredAt: at,
        priorSignedAt: clean(record?.signing?.signedAt),
        priorSignedPackageHash: clean(record?.signing?.signedPackageHash),
      },
    ],
    audit: { ...(record.audit || {}), updatedAt: at },
  };
}

function CardEditor({
  invoiceEntry,
  linkedInvoice,
  invoiceLocked,
  orderLocked,
  input,
  patch,
  patchRpo,
  setAdditionalTerms,
  invoiceDraft,
  setInvoiceDraft,
}) {
  const commercialLocked = invoiceEntry ? invoiceLocked : orderLocked;
  return (
    <div className="es-card-form">
      {commercialLocked ? (
        <div className="es-card-lock">
          <b>
            {invoiceEntry
              ? "ISSUED INVOICE LOCKED"
              : "SIGNATURE PACKAGE LOCKED"}
          </b>
          <span>
            {invoiceEntry
              ? "Use the downstream credit or replacement control to make a correction."
              : "Create a superseding revision to change commercial terms."}
          </span>
        </div>
      ) : null}
      <DealTypeEditor
        disabled={commercialLocked}
        value={input.dealType}
        onChange={(value) => patch("dealType", value)}
      />
      <section>
        <h3>CUSTOMER</h3>
        <CardField label="CUSTOMER / COMPANY">
          <Input
            disabled={commercialLocked}
            value={input.customerName}
            onChange={(v) => patch("customerName", v)}
          />
        </CardField>
        <CardField label="CONTACT">
          <Input
            disabled={commercialLocked}
            value={input.contactName}
            onChange={(v) => patch("contactName", v)}
          />
        </CardField>
        <div className="es-card-pair">
          <CardField label="EMAIL">
            <Input
              disabled={commercialLocked}
              type="email"
              value={input.customerEmail}
              onChange={(v) => patch("customerEmail", v)}
            />
          </CardField>
          <CardField label="PHONE">
            <Input
              disabled={commercialLocked}
              value={input.customerPhone}
              onChange={(v) => patch("customerPhone", v)}
            />
          </CardField>
        </div>
      </section>
      <section>
        <h3>EQUIPMENT</h3>
        <div className="es-card-pair">
          <CardField label="SERIAL / VIN">
            <Input
              disabled={commercialLocked}
              value={input.serialNumber}
              onChange={(v) => patch("serialNumber", v)}
            />
          </CardField>
          <CardField label="STOCK">
            <Input
              disabled={commercialLocked}
              value={input.stockNumber}
              onChange={(v) => patch("stockNumber", v)}
            />
          </CardField>
        </div>
      </section>
      <section>
        <h3>COMMERCIAL</h3>
        <div className="es-card-pair">
          {[
            "subtotal",
            "tax",
            "freight",
            "fees",
            "tradeAllowance",
            "deposit",
          ].map((key) => (
            <CardField
              key={key}
              label={key.replace(/([A-Z])/g, " $1").toUpperCase()}
            >
              <Input
                disabled={commercialLocked}
                inputMode="decimal"
                value={input[key]}
                onChange={(v) => patch(key, v)}
              />
            </CardField>
          ))}
        </div>
      </section>
      <section>
        <h3>{invoiceEntry ? "INVOICE CONTROL" : "AGREEMENT"}</h3>
        <div className="es-card-pair">
          <CardField label={invoiceEntry ? "INVOICE DATE" : "ORDER DATE"}>
            <Input
              disabled={commercialLocked}
              type="date"
              value={input.orderDate}
              onChange={(v) => patch("orderDate", v)}
            />
          </CardField>
          <CardField label="DUE DATE">
            <Input
              type="date"
              value={invoiceEntry ? invoiceDraft.dueDate : input.dueDate}
              onChange={(v) =>
                invoiceEntry
                  ? setInvoiceDraft((current) => ({ ...current, dueDate: v }))
                  : patch("dueDate", v)
              }
            />
          </CardField>
        </div>
        <CardField label="PAYMENT TERMS">
          <Input
            disabled={commercialLocked}
            value={input.paymentTerms}
            onChange={(v) => patch("paymentTerms", v)}
          />
        </CardField>
        {invoiceEntry ? (
          <>
            <CardField label="CUSTOMER PO">
              <Input
                value={invoiceDraft.customerPoNumber}
                onChange={(v) =>
                  setInvoiceDraft((current) => ({
                    ...current,
                    customerPoNumber: v,
                  }))
                }
              />
            </CardField>
            <CardField label="MEMO">
              <Input
                value={invoiceDraft.memo}
                onChange={(v) =>
                  setInvoiceDraft((current) => ({ ...current, memo: v }))
                }
              />
            </CardField>
            {linkedInvoice ? null : (
              <CardField label="DIRECT INVOICE REASON">
                <Input
                  value={invoiceDraft.directEntryReason}
                  onChange={(v) =>
                    setInvoiceDraft((current) => ({
                      ...current,
                      directEntryReason: v,
                    }))
                  }
                />
              </CardField>
            )}
          </>
        ) : (
          <CardField label="DELIVERY TERMS">
            <Input
              value={input.deliveryTerms}
              onChange={(v) => patch("deliveryTerms", v)}
            />
          </CardField>
        )}
      </section>
      {input.dealType === "rental-purchase-option" ? (
        <RPOEditor
          compact
          input={input}
          patchRpo={patchRpo}
          disabled={commercialLocked}
        />
      ) : null}
      <AdditionalTermsEditor
        compact
        terms={input.additionalTerms}
        onChange={setAdditionalTerms}
        disabled={commercialLocked}
      />
      {!invoiceEntry ? (
        <CommissionEditor
          compact
          rows={input.commissions}
          onChange={(rows) => patch("commissions", rows)}
          disabled={commercialLocked}
        />
      ) : null}
    </div>
  );
}

function CardField({ label, children }) {
  return (
    <label className="es-card-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function StageRail({
  record,
  invoice,
  deal,
  activeStageId,
  onOpenStage,
  onStartStage,
}) {
  if (deal)
    return (
      <IXISalesStageRail
        deal={deal}
        activeStageId={activeStageId}
        onOpenStage={onOpenStage}
        onStartStage={onStartStage}
      />
    );
  const savedOrder = Boolean(
    clean(
      record?.financialBinding?.financialDocumentId ||
        record?.identity?.salesOrderId,
    ),
  );
  const signed =
    ["signed-invoice-pending", "signed"].includes(
      clean(record?.status).toLowerCase(),
    ) &&
    Boolean(clean(record?.signing?.signedAt)) &&
    Boolean(clean(record?.signing?.signedPackageHash));
  const complete = [
    Boolean(clean(record?.related?.quoteId)),
    savedOrder,
    signed,
    Boolean(clean(invoice?.financialDocumentId || record?.related?.invoiceId)),
    Boolean(clean(record?.related?.soldSheetId)),
    Boolean(clean(record?.related?.settlementId)),
  ];
  return (
    <div className="es-stage-rail">
      {stages.map((stage, index) => (
        <div key={stage} className={complete[index] ? "done" : ""}>
          <i>{complete[index] ? "✓" : index + 1}</i>
          <span>{stage}</span>
        </div>
      ))}
    </div>
  );
}

function invoiceDisplayNumber(invoice = null) {
  const number = clean(invoice?.documentNumber);
  if (number) return number;
  const id = clean(invoice?.financialDocumentId);
  return id ? `DRAFT INV-${id.slice(-8).toUpperCase()}` : "NEW DIRECT DRAFT";
}

function OrderDocument({ record }) {
  return (
    <article className="es-document">
      <header>
        <div>
          <small>
            {record?.brand?.legalName || record?.brand?.companyName}
          </small>
          <h1>SALES ORDER</h1>
        </div>
        <div>
          <b>{record?.identity?.number || "DRAFT"}</b>
          <span>{record?.commercial?.orderDate}</span>
        </div>
      </header>
      <section className="es-party">
        <div>
          <span>SOLD TO</span>
          <strong>{record?.customer?.name || "—"}</strong>
          <p>{record?.customer?.contactName}</p>
          <p>{record?.customer?.email}</p>
          <p>{record?.customer?.phone}</p>
        </div>
        <div>
          <span>EQUIPMENT</span>
          <strong>{record?.asset?.label || "—"}</strong>
          <p>Serial / VIN: {record?.asset?.serialNumber || "—"}</p>
          <p>Stock: {record?.asset?.stockNumber || "—"}</p>
          <p>Passport: {record?.asset?.passportId || "—"}</p>
        </div>
      </section>
      <section className="es-commercial">
        <h2>AGREED COMMERCIAL TERMS</h2>
        <div>
          <span>Equipment price</span>
          <b>{usd(record?.totals?.subtotal)}</b>
        </div>
        <div>
          <span>Tax</span>
          <b>{usd(record?.totals?.tax)}</b>
        </div>
        <div>
          <span>Freight / fees</span>
          <b>
            {usd(
              Number(record?.totals?.freight || 0) +
                Number(record?.totals?.fees || 0),
            )}
          </b>
        </div>
        <div>
          <span>Trade allowance</span>
          <b>− {usd(record?.totals?.tradeAllowance)}</b>
        </div>
        <div>
          <span>Deposit</span>
          <b>− {usd(record?.totals?.deposit)}</b>
        </div>
        <div className="total">
          <span>BALANCE DUE</span>
          <strong>{usd(record?.totals?.balanceDue)}</strong>
        </div>
      </section>
      <section className="es-terms-summary">
        <b>PAYMENT</b>
        <span>{record?.commercial?.paymentTerms || "—"}</span>
        <b>DELIVERY</b>
        <span>{record?.commercial?.deliveryTerms || "—"}</span>
        <b>TERMS DOCUMENT</b>
        <span>
          {record?.termsDocument?.documentId || "NOT CONFIGURED"} ·{" "}
          {record?.termsDocument?.version || ""}
        </span>
      </section>
      {record?.dealType === "rental-purchase-option" ? (
        <section className="es-document-rpo">
          <h2>RENTAL PURCHASE OPTION</h2>
          <div>
            <b>Start date</b>
            <span>{record?.rpo?.startDate || "—"}</span>
            <b>Final option date</b>
            <span>{record?.rpo?.finalOptionDate || "—"}</span>
            <b>Payment schedule</b>
            <span>
              {record?.rpo?.paymentCount || 0}{" "}
              {record?.rpo?.paymentFrequency || "monthly"} payments of{" "}
              {usd(record?.rpo?.periodicPayment)}
            </span>
            <b>Applied to purchase</b>
            <span>
              {record?.rpo?.purchaseCreditType === "percent"
                ? `${record?.rpo?.purchaseCreditPercent || 0}% per payment`
                : `${usd(record?.rpo?.purchaseCreditAmount)} per payment`}
            </span>
            <b>Purchase option</b>
            <span>{usd(record?.rpo?.optionPrice)}</span>
            <b>Return terms</b>
            <span>{record?.rpo?.returnTerms || "—"}</span>
          </div>
        </section>
      ) : null}
      {record?.additionalTerms?.filter((term) => term.customerFacing).length ? (
        <section className="es-document-rpo">
          <h2>ADDITIONAL TRANSACTION TERMS</h2>
          <div>
            {record.additionalTerms
              .filter((term) => term.customerFacing)
              .map((term) => (
                <div key={term.termId}>
                  <b>{term.label || "Term"}</b>
                  <span>{term.value}</span>
                </div>
              ))}
          </div>
        </section>
      ) : null}
      <footer>
        This Sales Order is paired with the exact two-page Terms &amp;
        Conditions document identified above. Customer signature freezes both
        documents as one agreed package.
      </footer>
    </article>
  );
}

export default function IXIEquipmentSaleApp({
  context = {},
  object = {},
  deal = null,
  dealId = "",
  quote = null,
  initialRecord = null,
  invoice = null,
  activeStageId = "sales-order",
  initialTab = "order",
  entryMode = "sales-order",
  onOpenStage,
  onStartStage,
  onOpenInvoice,
  onBack,
  onRecordChange,
}) {
  const [mounted, setMounted] = useState(false);
  const [record, setRecord] = useState(() =>
    initialSaleRecord({
      context,
      quote,
      initialRecord,
      invoice,
      entryMode,
      dealId,
    }),
  );
  const [input, setInput] = useState(() =>
    saleInputFromRecord(
      initialSaleRecord({
        context,
        quote,
        initialRecord,
        invoice,
        entryMode,
        dealId,
      }),
    ),
  );
  const [invoiceRecord, setInvoiceRecord] = useState(invoice);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(() => tabForEntry(initialTab));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [signingUrl, setSigningUrl] = useState("");
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [invoiceDraft, setInvoiceDraft] = useState(() => ({
    dueDate: clean(invoice?.dueDate).slice(0, 10),
    customerPoNumber: clean(
      invoice?.externalReference || invoice?.metadata?.customerPoNumber,
    ),
    memo: clean(invoice?.memo || invoice?.metadata?.administrativeNote),
    directEntryReason: clean(invoice?.metadata?.directEntryReason),
  }));
  const [manualSignature, setManualSignature] = useState(() => ({
    signerName: clean(
      initialRecord?.customer?.contactName || initialRecord?.customer?.name,
    ),
    signerTitle: "",
    signerDate: new Date().toISOString().slice(0, 10),
    receivedVia: "email",
    externalReference: "",
    attestation: false,
  }));
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (initialRecord) {
      const hydrated = hydrateIXIEquipmentSaleRecord({
        context,
        record: initialRecord,
      });
      setRecord(hydrated);
      setInput(saleInputFromRecord(hydrated));
      setRevisionOpen(false);
    }
  }, [context, initialRecord]);
  useEffect(() => {
    setInvoiceRecord(invoice);
    setInvoiceDraft({
      dueDate: clean(invoice?.dueDate).slice(0, 10),
      customerPoNumber: clean(
        invoice?.externalReference || invoice?.metadata?.customerPoNumber,
      ),
      memo: clean(invoice?.memo || invoice?.metadata?.administrativeNote),
      directEntryReason: clean(invoice?.metadata?.directEntryReason),
    });
    if (
      entryMode === "invoice" &&
      invoice &&
      !clean(
        invoice?.sourceFinancialDocumentId || invoice?.metadata?.salesOrderId,
      )
    ) {
      const next = saleRecordFromInvoice(
        createIXIEquipmentSaleDraft({ context, quote, input: { dealId } }),
        invoice,
      );
      setRecord(next);
      setInput(saleInputFromRecord(next));
    }
  }, [context, dealId, entryMode, invoice, quote]);
  useEffect(() => setTab(tabForEntry(initialTab)), [initialTab]);
  useEffect(() => {
    if (!open) return;
    const prior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prior;
    };
  }, [open]);
  const draft = useMemo(
    () => updateIXIEquipmentSale(record, input),
    [record, input],
  );
  const readiness = useMemo(() => getIXIEquipmentSaleReadiness(draft), [draft]);
  const patch = (key, value) =>
    setInput((current) => ({ ...current, [key]: value }));
  const patchRpo = (key, value) =>
    setInput((current) => ({
      ...current,
      rpo: { ...(current.rpo || {}), [key]: value },
    }));
  const setAdditionalTerms = (value) =>
    setInput((current) => ({ ...current, additionalTerms: value }));
  async function save(action = "save") {
    setBusy(true);
    setError("");
    try {
      const wasNew = !clean(draft?.financialBinding?.financialDocumentId);
      const workingRecord = revisionOpen ? reopenSignedTerms(draft) : draft;
      const effectiveAction = revisionOpen ? "revise-signed-terms" : action;
      const result = await saveIXIEquipmentSale({
        object,
        context,
        record: workingRecord,
        action: effectiveAction,
      });
      let savedRecord = result.record;
      let ensuredInvoice = invoiceRecord;
      if (entryMode === "sales-order" && !invoiceRecord) {
        const ensured = await ensureIXIEquipmentSaleInvoice(result.record);
        savedRecord = hydrateIXIEquipmentSaleRecord({
          context,
          record: ensured.order,
        });
        ensuredInvoice = ensured.invoice;
        setInvoiceRecord(ensured.invoice);
      }
      if (
        wasNew &&
        invoiceRecord &&
        clean(invoiceRecord.financialState).toLowerCase() === "draft" &&
        !clean(
          invoiceRecord.sourceFinancialDocumentId ||
            invoiceRecord.metadata?.salesOrderId,
        )
      ) {
        const linked = await saveIXIEquipmentInvoice({
          object,
          context,
          record: result.record,
          invoice: invoiceRecord,
          input: invoiceDraft,
        });
        setInvoiceRecord(linked.invoice);
      }
      if (wasNew && clean(quote?.financialBinding?.financialDocumentId)) {
        const convertedQuote = {
          ...quote,
          status: "converted",
          related: {
            ...(quote.related || {}),
            salesOrderId: result.record.identity.salesOrderId,
          },
          activity: [
            ...(quote.activity || []),
            {
              eventId: `QT-CONVERT-${Date.now()}`,
              type: "quote-converted-to-sales-order",
              occurredAt: new Date().toISOString(),
              salesOrderId: result.record.identity.salesOrderId,
            },
          ],
        };
        await updateIXIQuote({
          record: convertedQuote,
          action: "convert-to-sales-order",
        });
      }
      setRevisionOpen(false);
      setRecord(savedRecord);
      setInput(saleInputFromRecord(savedRecord));
      await onRecordChange?.(
        savedRecord,
        {
          action: effectiveAction,
          response: result.response,
          invoice: ensuredInvoice,
        },
        context,
      );
      return savedRecord;
    } catch (caught) {
      setError(clean(caught?.message) || "Sales Order could not be saved.");
      return null;
    } finally {
      setBusy(false);
    }
  }
  async function sendForSignature() {
    setBusy(true);
    setError("");
    try {
      let current = draft;
      if (revisionOpen || !current?.financialBinding?.financialDocumentId)
        current = await save(revisionOpen ? "revise-and-resend" : "prepare");
      if (!current) return;
      if (!getIXIEquipmentSaleReadiness(current).ready)
        throw new Error(
          `Complete before signing: ${getIXIEquipmentSaleReadiness(current).missing.join(", ")}.`,
        );
      const invitation = await createIXIEquipmentSaleSigningInvitation(current);
      const url = `${window.location.origin}${invitation.signingPath}`;
      setSigningUrl(url);
      setRecord(
        invitation?.record?.financialDocument?.salesOrder
          ? {
              ...invitation.record.financialDocument.salesOrder,
              financialBinding: {
                financialDocumentId: invitation.financialDocumentId,
                revision: Number(
                  invitation.record?.server?.revision ||
                    current.financialBinding?.revision,
                ),
              },
            }
          : current,
      );
      await navigator.clipboard?.writeText(url);
      await onRecordChange?.(
        current,
        { action: "send-for-signature", invitation },
        context,
      );
    } catch (caught) {
      setError(clean(caught?.message));
    } finally {
      setBusy(false);
    }
  }
  async function markSignedOutsideIXI() {
    setBusy(true);
    setError("");
    try {
      const result = await attestIXIEquipmentSaleSigned(draft, {
        ...manualSignature,
        existingInvoiceId: clean(
          invoiceRecord?.financialDocumentId ||
            invoiceRecord?.financialBinding?.financialDocumentId,
        ),
      });
      const signedRecord = hydrateIXIEquipmentSaleRecord({
        context,
        record: result.order,
      });
      setRecord(signedRecord);
      setInput(saleInputFromRecord(signedRecord));
      if (result.invoice) setInvoiceRecord(result.invoice);
      await onRecordChange?.(
        signedRecord,
        {
          action: "manual-signature-attestation",
          response: result.response,
          invoice: result.invoice,
        },
        context,
      );
      return signedRecord;
    } catch (caught) {
      setError(
        clean(caught?.message) || "Manual signature could not be recorded.",
      );
      return null;
    } finally {
      setBusy(false);
    }
  }
  async function saveInvoice() {
    setBusy(true);
    setError("");
    try {
      const result = await saveIXIEquipmentInvoice({
        object,
        context,
        record: draft,
        invoice: invoiceRecord,
        input: invoiceDraft,
      });
      setInvoiceRecord(result.invoice);
      await onRecordChange?.(
        record,
        {
          action: invoiceRecord
            ? "edit-draft-invoice"
            : "create-direct-draft-invoice",
          response: result.response,
          invoice: result.invoice,
        },
        context,
      );
      return result.invoice;
    } catch (caught) {
      setError(clean(caught?.message) || "Invoice could not be saved.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function issueInvoice() {
    setBusy(true);
    setError("");
    try {
      const saved = await saveIXIEquipmentInvoice({
        object,
        context,
        record: draft,
        invoice: invoiceRecord,
        input: invoiceDraft,
      });
      const issued = await issueIXIEquipmentInvoice({ invoice: saved.invoice });
      setInvoiceRecord(issued.invoice);
      await onRecordChange?.(
        record,
        {
          action: "issue-invoice",
          response: issued.response,
          invoice: issued.invoice,
        },
        context,
      );
      return issued.invoice;
    } catch (caught) {
      setError(clean(caught?.message) || "Invoice could not be issued.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  const linkedInvoice = Boolean(
    clean(
      invoiceRecord?.sourceFinancialDocumentId ||
        invoiceRecord?.metadata?.salesOrderId,
    ),
  );
  const invoiceLocked =
    Boolean(invoiceRecord) &&
    clean(invoiceRecord?.financialState).toLowerCase() !== "draft";
  const hasSavedOrder = Boolean(
    clean(
      initialRecord?.financialBinding?.financialDocumentId ||
        initialRecord?.identity?.salesOrderId,
    ),
  );
  const directInvoiceWithoutOrder =
    entryMode === "sales-order" &&
    !hasSavedOrder &&
    Boolean(invoiceRecord) &&
    !linkedInvoice &&
    !clean(initialRecord?.lineage?.materializedFromInvoiceId);
  const signedOrder = [
    "sent-for-signature",
    "viewed",
    "signed-invoice-pending",
    "signed",
  ].includes(clean(record?.status).toLowerCase());
  const signatureCompleted = Boolean(
    clean(record?.signing?.signedAt) &&
    clean(record?.signing?.signedPackageHash),
  );
  const orderLocked = signedOrder && !revisionOpen;
  const activeLabel =
    activeStageId === "signed"
      ? "SIGNED / RESEND"
      : entryMode === "invoice"
        ? "INVOICE"
        : "SALES ORDER";
  const revisionControl =
    orderLocked && entryMode !== "invoice" ? (
      <div className="es-revision-control">
        <div>
          <b>SIGNED TERMS ON FILE</b>
          <span>
            Open a working revision to change price or terms and resend.
          </span>
        </div>
        <button type="button" onClick={() => setRevisionOpen(true)}>
          REVISE &amp; RESEND
        </button>
      </div>
    ) : null;
  const workspace =
    mounted && open
      ? createPortal(
          <div className="es-workspace" role="dialog" aria-modal="true">
            <header className="es-bar">
              <div>
                <small>IXI TRAN$ACT</small>
                <strong>EQUIPMENT SALE WORKSPACE</strong>
              </div>
              <nav>
                <button
                  onClick={() => setTab("order")}
                  className={tab === "order" ? "active" : ""}
                >
                  ORDER
                </button>
                <button
                  onClick={() => setTab("preview")}
                  className={tab === "preview" ? "active" : ""}
                >
                  PREVIEW
                </button>
                <button
                  onClick={() => setTab("invoice")}
                  className={tab === "invoice" ? "active" : ""}
                >
                  INVOICE
                </button>
                <button onClick={() => window.print()}>PRINT / PDF</button>
                <button
                  className="save"
                  disabled={busy || (tab !== "invoice" && orderLocked)}
                  onClick={() => (tab === "invoice" ? saveInvoice() : save())}
                >
                  {busy ? "WORKING…" : "SAVE"}
                </button>
                {tab === "invoice" && !invoiceLocked ? (
                  <button
                    type="button"
                    className="issue"
                    disabled={busy}
                    onClick={issueInvoice}
                  >
                    ISSUE INVOICE
                  </button>
                ) : null}
                <button className="close" onClick={() => setOpen(false)}>
                  ×
                </button>
              </nav>
            </header>
            <StageRail
              record={record}
              invoice={invoiceRecord}
              deal={deal}
              activeStageId={activeStageId}
              onOpenStage={onOpenStage}
              onStartStage={onStartStage}
            />
            <div className="es-status">
              <span>{record?.identity?.number || "NEW SALES ORDER"}</span>
              <b>{readiness.percent}% SIGNATURE READY</b>
              <span>{clean(record?.status).toUpperCase()}</span>
            </div>
            {error ? <div className="es-error">{error}</div> : null}
            {signingUrl ? (
              <div className="es-link">
                <b>SIGNING LINK COPIED</b>
                <input readOnly value={signingUrl} />
                <button
                  onClick={() => navigator.clipboard?.writeText(signingUrl)}
                >
                  COPY
                </button>
              </div>
            ) : null}
            {revisionControl}
            <main>
              {tab === "preview" ? (
                <OrderDocument record={draft} />
              ) : tab === "invoice" ? (
                <div className="es-editor">
                  <section>
                    <h2>
                      {linkedInvoice
                        ? "LINKED DRAFT INVOICE"
                        : "DIRECT DRAFT INVOICE"}
                    </h2>
                    {invoiceRecord ? (
                      <div className="es-invoice-banner">
                        <div>
                          <span>INVOICE</span>
                          <strong>
                            {invoiceRecord.documentNumber || "DRAFT"}
                          </strong>
                        </div>
                        <div>
                          <span>STATE</span>
                          <strong>
                            {clean(
                              invoiceRecord.financialState || "draft",
                            ).toUpperCase()}
                          </strong>
                        </div>
                        <div>
                          <span>TOTAL</span>
                          <strong>
                            {usd(
                              invoiceRecord?.totals?.customerTotal ??
                                invoiceRecord?.totals?.total,
                            )}
                          </strong>
                        </div>
                      </div>
                    ) : null}
                    <p className="es-control-note">
                      {linkedInvoice
                        ? "This draft Invoice is linked to the signed package and remains editable until it is issued."
                        : "This is a controlled direct-entry draft. Complete the record now; issue controls remain downstream."}
                    </p>
                    <CardEditor
                      invoiceEntry
                      linkedInvoice={linkedInvoice}
                      invoiceLocked={invoiceLocked}
                      orderLocked={false}
                      input={input}
                      patch={patch}
                      patchRpo={patchRpo}
                      setAdditionalTerms={setAdditionalTerms}
                      invoiceDraft={invoiceDraft}
                      setInvoiceDraft={setInvoiceDraft}
                    />
                  </section>
                </div>
              ) : (
                <div className="es-editor">
                  <section>
                    <h2>TRANSACTION</h2>
                    <DealTypeEditor
                      disabled={orderLocked}
                      value={input.dealType}
                      onChange={(value) => patch("dealType", value)}
                    />
                  </section>
                  {input.dealType === "rental-purchase-option" ? (
                    <RPOEditor
                      input={input}
                      patchRpo={patchRpo}
                      disabled={orderLocked}
                    />
                  ) : null}
                  <AdditionalTermsEditor
                    terms={input.additionalTerms}
                    onChange={setAdditionalTerms}
                    disabled={orderLocked}
                  />
                  <CommissionEditor
                    rows={input.commissions}
                    onChange={(rows) => patch("commissions", rows)}
                    disabled={orderLocked}
                  />
                  <section>
                    <h2>CUSTOMER</h2>
                    <div className="es-grid">
                      <Field label="CUSTOMER / COMPANY">
                        <Input
                          disabled={orderLocked}
                          value={input.customerName}
                          onChange={(v) => patch("customerName", v)}
                        />
                      </Field>
                      <Field label="CONTACT">
                        <Input
                          disabled={orderLocked}
                          value={input.contactName}
                          onChange={(v) => patch("contactName", v)}
                        />
                      </Field>
                      <Field label="EMAIL">
                        <Input
                          disabled={orderLocked}
                          type="email"
                          value={input.customerEmail}
                          onChange={(v) => patch("customerEmail", v)}
                        />
                      </Field>
                      <Field label="PHONE">
                        <Input
                          disabled={orderLocked}
                          value={input.customerPhone}
                          onChange={(v) => patch("customerPhone", v)}
                        />
                      </Field>
                      <Field wide label="ADDRESS">
                        <Input
                          disabled={orderLocked}
                          value={input.customerAddress}
                          onChange={(v) => patch("customerAddress", v)}
                        />
                      </Field>
                    </div>
                  </section>
                  <section>
                    <h2>EQUIPMENT &amp; PRICE</h2>
                    <div className="es-grid">
                      <Field label="SERIAL / VIN">
                        <Input
                          disabled={orderLocked}
                          value={input.serialNumber}
                          onChange={(v) => patch("serialNumber", v)}
                        />
                      </Field>
                      <Field label="STOCK">
                        <Input
                          disabled={orderLocked}
                          value={input.stockNumber}
                          onChange={(v) => patch("stockNumber", v)}
                        />
                      </Field>
                      {[
                        "subtotal",
                        "tax",
                        "freight",
                        "fees",
                        "tradeAllowance",
                        "deposit",
                      ].map((key) => (
                        <Field
                          key={key}
                          label={key.replace(/([A-Z])/g, " $1").toUpperCase()}
                        >
                          <Input
                            disabled={orderLocked}
                            inputMode="decimal"
                            value={input[key]}
                            onChange={(v) => patch(key, v)}
                          />
                        </Field>
                      ))}
                    </div>
                  </section>
                  <section>
                    <h2>AGREEMENT</h2>
                    <div className="es-grid">
                      <Field label="ORDER DATE">
                        <Input
                          disabled={orderLocked}
                          type="date"
                          value={input.orderDate}
                          onChange={(v) => patch("orderDate", v)}
                        />
                      </Field>
                      <Field label="DUE DATE">
                        <Input
                          disabled={orderLocked}
                          type="date"
                          value={input.dueDate}
                          onChange={(v) => patch("dueDate", v)}
                        />
                      </Field>
                      <Field wide label="PAYMENT TERMS">
                        <Input
                          disabled={orderLocked}
                          value={input.paymentTerms}
                          onChange={(v) => patch("paymentTerms", v)}
                        />
                      </Field>
                      <Field wide label="DELIVERY TERMS">
                        <Input
                          disabled={orderLocked}
                          value={input.deliveryTerms}
                          onChange={(v) => patch("deliveryTerms", v)}
                        />
                      </Field>
                    </div>
                    <div
                      className={`es-terms ${record?.termsDocument?.documentId ? "ok" : "missing"}`}
                    >
                      <b>COUNSEL-APPROVED TERMS &amp; CONDITIONS</b>
                      <span>
                        {record?.termsDocument?.documentId ||
                          "ENTITY TERMS TEMPLATE IS NOT CONFIGURED"}
                      </span>
                      <small>
                        {record?.termsDocument?.pageCount || 0} pages · SHA-256
                        locked ·{" "}
                        {record?.termsDocument?.version || "no version"}
                      </small>
                    </div>
                  </section>
                  <div className="es-final">
                    <div>
                      <span>CUSTOMER TOTAL</span>
                      <strong>{usd(draft?.totals?.total)}</strong>
                      <small>
                        Balance after deposit {usd(draft?.totals?.balanceDue)}
                      </small>
                    </div>
                    <button
                      disabled={busy || orderLocked || !readiness.ready}
                      onClick={sendForSignature}
                    >
                      {revisionOpen ? "SAVE & RESEND" : "SEND FOR SIGNATURE"}
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>,
          document.body,
        )
      : null;

  const invoiceEntry = entryMode === "invoice";
  const displayedTotal =
    invoiceEntry && linkedInvoice && invoiceRecord
      ? (invoiceRecord?.totals?.customerTotal ?? invoiceRecord?.totals?.total)
      : draft?.totals?.total;
  if (directInvoiceWithoutOrder && !showNewOrder)
    return (
      <>
        <div className="es-card">
          <header>
            <button
              type="button"
              aria-label="Back to TRAN$ACT apps"
              onClick={onBack}
            >
              ‹
            </button>
            <div>
              <span>IXI TRAN$ACT</span>
              <strong>SALES ORDER</strong>
            </div>
            <i>NONE</i>
          </header>
          <StageRail
            record={record}
            invoice={invoiceRecord}
            deal={deal}
            activeStageId={activeStageId}
            onOpenStage={onOpenStage}
            onStartStage={onStartStage}
          />
          <div className="es-direct-invoice-state">
            <span>NO SALES ORDER ON FILE</span>
            <strong>THIS SALE BEGAN WITH A DIRECT INVOICE</strong>
            <p>
              No signed Sales Order was created for this transaction. The saved
              invoice remains the authoritative customer document.
            </p>
            <div>
              <small>ORIGINAL INVOICE</small>
              <b>{invoiceDisplayNumber(invoiceRecord)}</b>
              <strong>
                {usd(
                  invoiceRecord?.totals?.customerTotal ??
                    invoiceRecord?.totals?.total,
                )}
              </strong>
            </div>
          </div>
          <div className="es-direct-invoice-actions">
            <button type="button" onClick={onOpenInvoice}>
              OPEN ORIGINAL INVOICE
            </button>
            <button type="button" onClick={() => setShowNewOrder(true)}>
              CREATE A NEW SALES ORDER
            </button>
          </div>
          <footer>DIRECT-INVOICE PATH · NO SALES ORDER WAS FABRICATED</footer>
        </div>
        <IXIEquipmentSaleStyles />
      </>
    );
  return (
    <>
      <div className="es-card">
        <header>
          <button
            type="button"
            aria-label="Back to TRAN$ACT apps"
            onClick={onBack}
          >
            ‹
          </button>
          <div>
            <span>IXI TRAN$ACT</span>
            <strong>{activeLabel}</strong>
          </div>
          <i>
            {invoiceEntry
              ? clean(invoiceRecord?.financialState || "draft").toUpperCase()
              : `${readiness.percent}%`}
          </i>
        </header>
        <StageRail
          record={record}
          invoice={invoiceRecord}
          deal={deal}
          activeStageId={activeStageId}
          onOpenStage={onOpenStage}
          onStartStage={onStartStage}
        />
        <div className="es-card-record">
          <span>
            {invoiceEntry
              ? invoiceDisplayNumber(invoiceRecord)
              : record?.identity?.number || "NEW SALES ORDER"}
          </span>
          <strong>{usd(displayedTotal)}</strong>
        </div>
        {error ? <div className="es-error">{error}</div> : null}
        {revisionControl}
        {activeStageId === "signed" ? (
          <ManualSignatureControl
            value={
              signatureCompleted
                ? {
                    ...manualSignature,
                    signerName: clean(
                      record?.signing?.signerName || manualSignature.signerName,
                    ),
                    signerDate: clean(
                      record?.signing?.signerDate || record?.signing?.signedAt,
                    ).slice(0, 10),
                    receivedVia: clean(
                      record?.signing?.receivedVia || "electronic",
                    ),
                  }
                : manualSignature
            }
            onChange={(key, value) =>
              setManualSignature((current) => ({ ...current, [key]: value }))
            }
            onSubmit={markSignedOutsideIXI}
            busy={busy}
            signed={signatureCompleted}
          />
        ) : null}
        <CardEditor
          invoiceEntry={invoiceEntry}
          linkedInvoice={linkedInvoice}
          invoiceLocked={invoiceLocked}
          orderLocked={orderLocked}
          input={input}
          patch={patch}
          patchRpo={patchRpo}
          setAdditionalTerms={setAdditionalTerms}
          invoiceDraft={invoiceDraft}
          setInvoiceDraft={setInvoiceDraft}
        />
        <div className="es-card-actions">
          <button
            type="button"
            onClick={() => {
              setTab(invoiceEntry ? "invoice" : "order");
              setOpen(true);
            }}
          >
            EXPAND
          </button>
          <button
            type="button"
            disabled={busy || (!invoiceEntry && orderLocked)}
            onClick={() => (invoiceEntry ? saveInvoice() : save())}
          >
            {busy
              ? "SAVING…"
              : invoiceEntry
                ? invoiceRecord
                  ? "SAVE INVOICE"
                  : "CREATE INVOICE"
                : "SAVE ORDER"}
          </button>
          {invoiceEntry && !invoiceLocked ? (
            <button
              type="button"
              className="issue"
              disabled={busy}
              onClick={issueInvoice}
            >
              ISSUE INVOICE
            </button>
          ) : null}
          {invoiceEntry ? null : (
            <button
              type="button"
              className="signature"
              disabled={busy || orderLocked || !readiness.ready}
              onClick={sendForSignature}
            >
              {revisionOpen ? "SAVE & RESEND" : "SEND TO SIGN"}
            </button>
          )}
        </div>
        <footer>
          {invoiceEntry
            ? linkedInvoice
              ? `LINKED TO ${record?.identity?.number || "SIGNED SALES ORDER"}`
              : "DIRECT DRAFT · CANONICAL IX CORE"
            : orderLocked
              ? "SIGNED PACKAGE CONTROL ACTIVE"
              : readiness.ready
                ? "READY FOR CUSTOMER SIGNATURE"
                : `${readiness.missing.length} ITEMS TO SIGNATURE READY`}
        </footer>
      </div>
      {workspace}
      <IXIEquipmentSaleStyles />
    </>
  );
}
