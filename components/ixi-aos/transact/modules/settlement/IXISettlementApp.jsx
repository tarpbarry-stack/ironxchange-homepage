import { useEffect, useMemo, useState } from "react";
import {
  calculateIXISettlementWaterfall,
  getIXISettlementBlockers,
  projectIXIAssetSettlement,
} from "./IXISettlementEngine";
import {
  approveIXISettlement,
  createIXISettlement,
  recordIXISettlementRecipientPayment,
  reopenIXISettlement,
  updateIXISettlement,
} from "./IXISettlementCommands";
import IXISettlementStyles from "./IXISettlementStyles";
import { uploadIXIAosFinancialAttachment } from "../../../financial-runtime/IXIAosFinancialReadClient";
import { validateIXITransactFile } from "../../IXITransactFilePolicy";

const clean = (value) => String(value ?? "").trim();
const usd = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(value || 0),
  );
const today = () => new Date().toISOString().slice(0, 10);
const rowId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const COPY = {
  en: {
    languageCode: "en",
    title: "SETTLEMENT",
    sale: "SALE & COLLECTION",
    economics: "MACHINE ECONOMICS",
    expenses: "DETAILED EXPENSE REVIEW",
    commissions: "COMMISSIONS / BOUNTIES",
    payoffs: "LIENS / PAYOFFS",
    disbursements: "OTHER RECIPIENTS",
    owners: "OWNER ADJUSTMENTS",
    waterfall: "SETTLEMENT WATERFALL",
    review: "REVIEW & APPROVAL",
    payments: "PAYMENTS",
    salePrice: "SALE PRICE",
    collected: "COLLECTED",
    credits: "CREDITS",
    buyerBalance: "BUYER BALANCE",
    acquisition: "ACQUISITION",
    makeReady: "MAKE-READY",
    postCosts: "POST-ACQUISITION COSTS",
    income: "ASSET INCOME",
    sellingCosts: "SELLING COSTS / OVERRIDE",
    commissionsTotal: "MACHINE COMMISSIONS",
    profit: "ECONOMIC PROFIT / LOSS",
    addExpense: "+ EXPENSE ADJUSTMENT",
    addCommission: "+ COMMISSION / BOUNTY",
    addPayoff: "+ LIEN / PAYOFF",
    addDisbursement: "+ RECIPIENT",
    addReimbursement: "+ OWNER REIMBURSEMENT",
    addPrior: "+ PRIOR DISTRIBUTION",
    recipient: "RECIPIENT",
    passport: "PASSPORT / ID",
    type: "TYPE",
    method: "CALCULATION",
    rate: "RATE %",
    fixed: "FIXED AMOUNT",
    target: "TARGET",
    adjustment: "ADJUSTMENT",
    final: "FINAL AMOUNT",
    treatment: "ECONOMIC TREATMENT",
    status: "STATUS",
    dueDate: "DUE DATE",
    conditions: "CONDITIONS",
    reference: "REFERENCE",
    notes: "NOTES",
    payee: "PAYEE",
    amount: "AMOUNT",
    paidBy: "PAID BY ENTITY",
    account: "BANK / ACCOUNT",
    included: "INCLUDE",
    remove: "REMOVE",
    reimbursement: "REIMBURSEMENT",
    prior: "PRIOR DISTRIBUTION",
    retained: "RETAINED COMPANY PROCEEDS",
    totalSettlement: "TOTAL OWNER SETTLEMENT",
    unallocated: "UNALLOCATED CASH",
    reviewedBy: "REVIEWED BY",
    approvalNote: "APPROVAL NOTE",
    lossShortfall: "UNFUNDED LOSS SHORTFALL (NO AUTOMATIC CAPITAL CALL)",
    prepare: "PREPARE SETTLEMENT",
    update: "UPDATE PREPARED SETTLEMENT",
    edit: "EDIT PREPARED SETTLEMENT",
    approve: "APPROVE SETTLEMENT",
    reopen: "REOPEN FOR CORRECTION",
    correctionReason: "CORRECTION / REOPEN REASON",
    pay: "RECORD PAYMENT",
    paymentDate: "PAYMENT DATE",
    paymentMethod: "PAYMENT METHOD",
    paymentReference: "PAYMENT REFERENCE",
    checkNumber: "CHECK NUMBER",
    working: "WORKING…",
    back: "‹ TRAN$ACT",
    canonical: "CANONICAL",
    excluded: "EXCLUDED",
    documents: "SETTLEMENT EVIDENCE",
    addDocument: "+ PAYOFF / COMMISSION / WIRE DOCUMENT",
    verified: "VERIFIED",
    expenseHelp:
      "Canonical costs and income are listed here. Draft, rejected, void, reversed and cancelled records are visible but excluded.",
    foot: "Every dollar remains linked to its source. Settlement approval establishes entitlement; each payout is a separate IXI Financial event.",
  },
  es: {
    languageCode: "es",
    title: "LIQUIDACIÓN",
    sale: "VENTA Y COBRO",
    economics: "ECONOMÍA DE LA MÁQUINA",
    expenses: "REVISIÓN DETALLADA DE GASTOS",
    commissions: "COMISIONES / INCENTIVOS",
    payoffs: "GRAVÁMENES / PAGOS",
    disbursements: "OTROS BENEFICIARIOS",
    owners: "AJUSTES DE PROPIETARIOS",
    waterfall: "DISTRIBUCIÓN DE LIQUIDACIÓN",
    review: "REVISIÓN Y APROBACIÓN",
    payments: "PAGOS",
    salePrice: "PRECIO DE VENTA",
    collected: "COBRADO",
    credits: "CRÉDITOS",
    buyerBalance: "SALDO DEL COMPRADOR",
    acquisition: "ADQUISICIÓN",
    makeReady: "PREPARACIÓN",
    postCosts: "COSTOS POSTERIORES",
    income: "INGRESO DEL ACTIVO",
    sellingCosts: "COSTOS DE VENTA / AJUSTE",
    commissionsTotal: "COMISIONES DE LA MÁQUINA",
    profit: "GANANCIA / PÉRDIDA ECONÓMICA",
    addExpense: "+ AJUSTE DE GASTO",
    addCommission: "+ COMISIÓN / INCENTIVO",
    addPayoff: "+ GRAVAMEN / PAGO",
    addDisbursement: "+ BENEFICIARIO",
    addReimbursement: "+ REEMBOLSO AL PROPIETARIO",
    addPrior: "+ DISTRIBUCIÓN PREVIA",
    recipient: "BENEFICIARIO",
    passport: "PASAPORTE / ID",
    type: "TIPO",
    method: "CÁLCULO",
    rate: "TASA %",
    fixed: "MONTO FIJO",
    target: "OBJETIVO",
    adjustment: "AJUSTE",
    final: "MONTO FINAL",
    treatment: "TRATAMIENTO ECONÓMICO",
    status: "ESTADO",
    dueDate: "FECHA DE VENCIMIENTO",
    conditions: "CONDICIONES",
    reference: "REFERENCIA",
    notes: "NOTAS",
    payee: "BENEFICIARIO",
    amount: "MONTO",
    paidBy: "ENTIDAD PAGADORA",
    account: "BANCO / CUENTA",
    included: "INCLUIR",
    remove: "ELIMINAR",
    reimbursement: "REEMBOLSO",
    prior: "DISTRIBUCIÓN PREVIA",
    retained: "FONDOS RETENIDOS POR LA EMPRESA",
    totalSettlement: "LIQUIDACIÓN TOTAL A PROPIETARIOS",
    unallocated: "EFECTIVO SIN ASIGNAR",
    reviewedBy: "REVISADO POR",
    approvalNote: "NOTA DE APROBACIÓN",
    lossShortfall: "DÉFICIT DE PÉRDIDA NO FINANCIADO (SIN APORTE AUTOMÁTICO)",
    prepare: "PREPARAR LIQUIDACIÓN",
    update: "ACTUALIZAR LIQUIDACIÓN",
    edit: "EDITAR LIQUIDACIÓN PREPARADA",
    approve: "APROBAR LIQUIDACIÓN",
    reopen: "REABRIR PARA CORRECCIÓN",
    correctionReason: "MOTIVO DE CORRECCIÓN / REAPERTURA",
    pay: "REGISTRAR PAGO",
    paymentDate: "FECHA DE PAGO",
    paymentMethod: "MÉTODO DE PAGO",
    paymentReference: "REFERENCIA DE PAGO",
    checkNumber: "NÚMERO DE CHEQUE",
    working: "PROCESANDO…",
    back: "‹ TRAN$ACT",
    canonical: "CANÓNICO",
    excluded: "EXCLUIDO",
    documents: "EVIDENCIA DE LIQUIDACIÓN",
    addDocument: "+ DOCUMENTO DE PAGO / COMISIÓN / TRANSFERENCIA",
    verified: "VERIFICADO",
    expenseHelp:
      "Los costos e ingresos canónicos aparecen aquí. Los registros en borrador, rechazados, anulados, revertidos o cancelados se muestran pero no se incluyen.",
    foot: "Cada dólar conserva su origen. La aprobación establece el derecho; cada desembolso es un evento financiero IXI separado.",
  },
};

function Field({ label, children }) {
  return (
    <div className="stl-field">
      <label>{label}</label>
      {children}
    </div>
  );
}
function Input({ value, onChange, ...props }) {
  return (
    <input
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      {...props}
    />
  );
}
function Section({ title, children }) {
  return (
    <>
      <div className="stl-section">{title}</div>
      {children}
    </>
  );
}
function Money({ label, value, big = false, tone = "" }) {
  return (
    <div className={`stl-money ${big ? "big" : ""} ${tone}`}>
      <span>{label}</span>
      <b>{usd(value)}</b>
    </div>
  );
}
function Remove({ label, onClick }) {
  return (
    <button type="button" className="stl-danger stl-small" onClick={onClick}>
      {label}
    </button>
  );
}
function Toggle({ label, checked, onChange }) {
  return (
    <label className="stl-check">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />{" "}
      {label}
    </label>
  );
}
const option = (t, en, es) => (t.title === "LIQUIDACIÓN" ? es : en);

const emptyCommission = (entity) => ({
  commissionId: rowId("COM"),
  recipientLabel: "",
  recipientPassportId: "",
  commissionType: "salesperson",
  calculationMethod: "fixed",
  ratePercent: "",
  fixedAmount: "",
  targetAmount: "",
  adjustmentAmount: "",
  finalApprovedAmount: "",
  payerEntityLabel: clean(entity?.label || entity?.companyName),
  payerEntityPassportId: clean(entity?.passportId),
  economicTreatment: "machine-selling-expense",
  status: "projected",
  dueDate: "",
  conditions: "",
  reference: "",
  notes: "",
  included: true,
});
const emptyMoneyRow = (prefix, label = "") => ({
  rowId: rowId(prefix),
  label,
  payeeLabel: "",
  payeePassportId: "",
  amount: "",
  status: "open",
  reference: "",
  paidByEntityLabel: "",
  cashAccountLabel: "",
  notes: "",
  included: true,
});

export default function IXISettlementApp({
  context = {},
  object = {},
  dealId = "",
  sale = null,
  acquisition = null,
  financialRecords = [],
  initialRecord = null,
  stageRail = null,
  language = "en",
  onBack = null,
  onRecordChange = null,
}) {
  const resolvedSale = sale || object.assetSale || object.saleRecord || {};
  const resolvedAcq =
    acquisition || object.assetAcquisition || object.acquisitionRecord || {};
  const [lang, setLang] = useState(language === "es" ? "es" : "en");
  const t = COPY[lang];
  const [record, setRecord] = useState(initialRecord);
  const [editing, setEditing] = useState(!initialRecord);
  const [sellingCosts, setSellingCosts] = useState(
    initialRecord?.projection?.sellingCosts ?? "",
  );
  const [expenseAdjustments, setExpenseAdjustments] = useState(
    initialRecord?.expenseAdjustments || [],
  );
  const [commissions, setCommissions] = useState(
    initialRecord?.commissions || object.salesCommissions || [],
  );
  const [liabilities, setLiabilities] = useState(
    initialRecord?.liabilities || object.settlementLiabilities || [],
  );
  const [disbursements, setDisbursements] = useState(
    initialRecord?.disbursements || [],
  );
  const [reimbursements, setReimbursements] = useState(
    initialRecord?.reimbursements || object.ownerReimbursements || [],
  );
  const [priorDistributions, setPriorDistributions] = useState(
    initialRecord?.priorDistributions || object.ownerDistributions || [],
  );
  const [retainedProceeds, setRetainedProceeds] = useState(
    initialRecord?.retainedProceeds || "",
  );
  const [reviewedBy, setReviewedBy] = useState(
    initialRecord?.controls?.reviewedBy || "",
  );
  const [approvalNote, setApprovalNote] = useState(
    initialRecord?.controls?.approvalNote || "",
  );
  const [correctionReason, setCorrectionReason] = useState("");
  const [payRecipientId, setPayRecipientId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(today());
  const [payMethod, setPayMethod] = useState("wire");
  const [payReference, setPayReference] = useState("");
  const [payBankReference, setPayBankReference] = useState("");
  const [payCheckNumber, setPayCheckNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState(initialRecord?.documents || []);
  const [error, setError] = useState("");
  const capitalEvents =
    resolvedAcq.ownership?.events || object.capitalEvents || [];

  useEffect(() => {
    setRecord(initialRecord);
    setEditing(
      !initialRecord ||
        ["draft", "reopened"].includes(clean(initialRecord?.status)),
    );
    setSellingCosts(initialRecord?.projection?.sellingCosts ?? "");
    setExpenseAdjustments(initialRecord?.expenseAdjustments || []);
    setCommissions(initialRecord?.commissions || object.salesCommissions || []);
    setLiabilities(
      initialRecord?.liabilities || object.settlementLiabilities || [],
    );
    setDisbursements(initialRecord?.disbursements || []);
    setReimbursements(
      initialRecord?.reimbursements || object.ownerReimbursements || [],
    );
    setPriorDistributions(
      initialRecord?.priorDistributions || object.ownerDistributions || [],
    );
    setRetainedProceeds(initialRecord?.retainedProceeds || "");
    setReviewedBy(initialRecord?.controls?.reviewedBy || "");
    setApprovalNote(initialRecord?.controls?.approvalNote || "");
    setDocuments(initialRecord?.documents || []);
    // The canonical record identity is the hydration boundary; object projections may be recreated every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRecord]);

  const manual = useMemo(
    () => ({
      sellingCosts: sellingCosts === "" ? undefined : Number(sellingCosts),
      expenseAdjustments,
      commissions,
      liabilities,
      disbursements,
      reimbursements,
      priorDistributions,
    }),
    [
      sellingCosts,
      expenseAdjustments,
      commissions,
      liabilities,
      disbursements,
      reimbursements,
      priorDistributions,
    ],
  );
  const projection = useMemo(
    () =>
      projectIXIAssetSettlement({
        sale: resolvedSale,
        acquisition: resolvedAcq,
        financialRecords,
        manual,
      }),
    [resolvedSale, resolvedAcq, financialRecords, manual],
  );
  const waterfall = useMemo(
    () =>
      calculateIXISettlementWaterfall({
        owners: resolvedAcq.ownership?.owners || [],
        projection,
        capitalEvents,
        reimbursements,
        priorDistributions,
        retainedProceeds,
        returnCapitalFirst:
          resolvedAcq.settlementTerms?.returnCapitalFirst !== false,
      }),
    [
      resolvedAcq,
      projection,
      capitalEvents,
      reimbursements,
      priorDistributions,
      retainedProceeds,
    ],
  );
  const blockers = useMemo(
    () =>
      getIXISettlementBlockers({
        sale: resolvedSale,
        projection,
        waterfall,
        liabilities,
        commissions: projection.commissions,
        disbursements,
      }),
    [resolvedSale, projection, waterfall, liabilities, disbursements],
  );

  function patchRow(setter, id, key, value) {
    setter((list) =>
      list.map((row) =>
        clean(
          row.rowId ||
            row.commissionId ||
            row.liabilityId ||
            row.disbursementId ||
            row.reimbursementId ||
            row.distributionId,
        ) === id
          ? { ...row, [key]: value }
          : row,
      ),
    );
  }
  function removeRow(setter, id) {
    setter((list) =>
      list.filter(
        (row) =>
          clean(
            row.rowId ||
              row.commissionId ||
              row.liabilityId ||
              row.disbursementId ||
              row.reimbursementId ||
              row.distributionId,
          ) !== id,
      ),
    );
  }
  const idOf = (row) =>
    clean(
      row.rowId ||
        row.commissionId ||
        row.liabilityId ||
        row.disbursementId ||
        row.reimbursementId ||
        row.distributionId,
    );

  function settlementInput() {
    return {
      dealId,
      reviewedBy,
      approvalNote,
      liabilities,
      disbursements,
      expenseAdjustments,
      reimbursements,
      priorDistributions,
      capitalEvents,
      retainedProceeds,
      documents,
      returnCapitalFirst:
        resolvedAcq.settlementTerms?.returnCapitalFirst !== false,
    };
  }

  async function addDocuments(files) {
    const id = clean(record?.financialBinding?.financialDocumentId);
    if (!id) return;
    setUploading(true);
    setError("");
    try {
      const uploaded = [];
      for (const file of Array.from(files || [])) {
        const check = validateIXITransactFile(file, {
          maxBytes: 10 * 1024 * 1024,
          allowedMimeTypes: [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
          ],
          allowedExtensions: [".pdf", ".jpg", ".jpeg", ".png", ".webp"],
        });
        if (!check.valid) throw new Error(check.message);
        uploaded.push(
          await uploadIXIAosFinancialAttachment({
            financialDocumentId: id,
            file,
            type: "settlement-evidence",
          }),
        );
      }
      setDocuments((current) => [...current, ...uploaded]);
    } catch (cause) {
      setError(cause?.message || "Settlement evidence could not be secured.");
    } finally {
      setUploading(false);
    }
  }

  async function prepare() {
    setBusy(true);
    setError("");
    try {
      let next, response;
      if (record?.financialBinding?.financialDocumentId) {
        const proposed = {
          ...record,
          schema: "ixi-asset-settlement-v2",
          version: Number(record.version || 1),
          projection,
          waterfall,
          liabilities,
          commissions: projection.commissions,
          disbursements,
          expenseAdjustments,
          reimbursements,
          priorDistributions,
          capitalEvents,
          retainedProceeds: Number(retainedProceeds || 0),
          documents,
          controls: {
            ...(record.controls || {}),
            reviewedBy: clean(reviewedBy),
            approvalNote: clean(approvalNote),
            calculationVersion: "settlement-v2",
          },
          status: "ready",
          audit: {
            ...(record.audit || {}),
            updatedAt: new Date().toISOString(),
          },
        };
        next = await updateIXISettlement({
          record: proposed,
          action: "prepare-settlement",
        });
      } else {
        const result = await createIXISettlement({
          object: {
            ...object,
            passportId:
              context.primary?.passportId ||
              resolvedSale.context?.assetPassportId,
            objectId:
              context.primary?.objectId || resolvedSale.context?.assetObjectId,
            label: context.primary?.label || resolvedSale.context?.assetLabel,
          },
          context,
          sale: resolvedSale,
          acquisition: resolvedAcq,
          projection,
          waterfall,
          input: settlementInput(),
          blockers,
        });
        next = result.record;
        response = result.response;
      }
      setRecord(next);
      setEditing(false);
      await onRecordChange?.(
        next,
        { action: "prepare-settlement", response },
        context,
      );
    } catch (cause) {
      setError(cause?.message || "Settlement could not be prepared");
    } finally {
      setBusy(false);
    }
  }

  async function approve() {
    if (clean(approvalNote).length < 3) {
      setError(
        lang === "es"
          ? "Se requiere una nota de aprobación."
          : "Approval note is required.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const next = await updateIXISettlement({
        record: approveIXISettlement(
          { ...record, controls: { ...(record.controls || {}), approvalNote } },
          context.actor || {},
          approvalNote,
        ),
        action: "approve-settlement",
      });
      setRecord(next);
      await onRecordChange?.(next, { action: "approve-settlement" }, context);
    } catch (cause) {
      setError(cause?.message || "Settlement could not be approved");
    } finally {
      setBusy(false);
    }
  }

  async function reopen() {
    setBusy(true);
    setError("");
    try {
      const next = await updateIXISettlement({
        record: reopenIXISettlement(
          record,
          context.actor || {},
          correctionReason,
        ),
        action: "reopen-settlement",
      });
      setRecord(next);
      setEditing(true);
      await onRecordChange?.(next, { action: "reopen-settlement" }, context);
    } catch (cause) {
      setError(cause?.message || "Settlement could not be reopened");
    } finally {
      setBusy(false);
    }
  }

  const recipients = useMemo(() => {
    if (!record) return [];
    const paid = new Map();
    for (const payment of [
      ...(record.ownerPayments || []),
      ...(record.recipientPayments || []),
    ])
      paid.set(
        clean(payment.recipientId || payment.ownerId),
        (paid.get(clean(payment.recipientId || payment.ownerId)) || 0) +
          Number(payment.amount || 0),
      );
    const ownerRows = (record.waterfall?.owners || []).map((row) => ({
      ...row,
      recipientId: row.ownerId,
      recipientType: "owner",
      recipientLabel: row.label,
      balanceDue: Math.max(
        0,
        Number(row.finalDue || 0) -
          (paid.get(row.ownerId) || Number(row.paid || 0)),
      ),
    }));
    const otherRows = [
      ...(record.commissions || []).map((row) => ({
        ...row,
        recipientId: row.commissionId,
        recipientType: "commission",
        recipientLabel: row.recipientLabel,
        amount: row.finalAmount,
      })),
      ...(record.liabilities || []).map((row) => ({
        ...row,
        recipientId: idOf(row),
        recipientType: "payoff",
        recipientLabel: row.payeeLabel || row.label,
      })),
      ...(record.disbursements || []).map((row) => ({
        ...row,
        recipientId: idOf(row),
        recipientType: "third-party",
        recipientLabel: row.payeeLabel,
      })),
    ]
      .filter((row) => row.included !== false && Number(row.amount || 0) > 0)
      .map((row) => ({
        ...row,
        balanceDue: Math.max(
          0,
          Number(row.amount || 0) - (paid.get(row.recipientId) || 0),
        ),
      }));
    return [...ownerRows, ...otherRows].filter((row) => row.balanceDue > 0.005);
  }, [record]);

  async function pay() {
    const recipient = recipients.find(
      (row) => row.recipientId === payRecipientId,
    );
    if (!recipient) return;
    setBusy(true);
    setError("");
    try {
      const result = await recordIXISettlementRecipientPayment({
        object: {
          ...object,
          passportId: record.context.assetPassportId,
          objectId: record.context.assetObjectId,
          label: record.context.assetLabel,
        },
        context,
        settlement: record,
        recipient,
        input: {
          amount: payAmount,
          date: payDate,
          method: payMethod,
          reference: payReference,
          bankReference: payBankReference,
          checkNumber: payCheckNumber,
          recipientType: recipient.recipientType,
        },
      });
      const proposed = {
        ...record,
        recipientPayments: [
          ...(record.recipientPayments || []),
          result.payment,
        ],
        activity: [
          ...(record.activity || []),
          {
            eventId: rowId("STL-PAY"),
            type: "recipient-payment-recorded",
            occurredAt: new Date().toISOString(),
            recipientId: recipient.recipientId,
            recipientType: recipient.recipientType,
            amount: Number(payAmount || 0),
          },
        ],
      };
      const next = await updateIXISettlement({
        record: proposed,
        action: "recipient-payment",
      });
      setRecord(next);
      setPayAmount("");
      setPayReference("");
      setPayBankReference("");
      setPayCheckNumber("");
      await onRecordChange?.(
        next,
        {
          action: "recipient-payment",
          payment: result.payment,
          response: result.response,
        },
        context,
      );
    } catch (cause) {
      setError(cause?.message || "Payment could not be recorded");
    } finally {
      setBusy(false);
    }
  }

  if (!clean(resolvedSale.identity?.saleId || resolvedSale.identity?.number))
    return (
      <div className="ixi-stl">
        <Header t={t} lang={lang} setLang={setLang} onBack={onBack} status="OPEN" />
        {stageRail}
        <div className="stl-blockers">
          {lang === "es"
            ? "SE REQUIERE LA VENTA. REGISTRE VENDIDO ANTES DE LIQUIDAR."
            : "SALE RECORD REQUIRED. Record SOLD before Settlement."}
        </div>
        <button className="stl-secondary" onClick={() => onBack?.()}>
          {t.back}
        </button>
        <IXISettlementStyles />
      </div>
    );

  if (record && !editing)
    return (
      <div className="ixi-stl" lang={lang === "es" ? "es-MX" : "en-US"}>
        <Header
          t={t}
          lang={lang}
          setLang={setLang}
          onBack={onBack}
          status={clean(record.status).toUpperCase() || "READY"}
        />
        {stageRail}
        <div className="stl-card-record">
          <span>{record.identity?.number || record.references?.saleNumber || "SETTLEMENT"}</span>
          <strong>{usd(record.projection?.salePrice)}</strong>
        </div>
        <div className="stl-context">
          <strong>{record.context?.assetLabel}</strong>
          <small>
            {record.references?.saleNumber} ·{" "}
            {clean(record.status).toUpperCase()} · V{record.version || 1}
          </small>
        </div>
        <div
          className={`stl-status ${record.status === "settled" ? "ok" : ""}`}
        >
          <strong>
            {record.status === "settled"
              ? "✓ SETTLED"
              : clean(record.status).toUpperCase()}
          </strong>
        </div>
        {error ? <div className="stl-blockers">{error}</div> : null}
        <Section title={t.economics}>
          <Money label={t.salePrice} value={record.projection?.salePrice} />
          <Money
            label={t.commissionsTotal}
            value={record.projection?.commissionTotal}
          />
          <Money
            label={t.profit}
            value={record.projection?.economicProfit}
            big
          />
        </Section>
        <Section title={t.waterfall}>
          {(record.waterfall?.owners || []).map((owner) => (
            <div className="stl-row" key={owner.ownerId}>
              <div className="stl-rowhead">
                <strong>{owner.label}</strong>
                <b>{usd(owner.finalDue)}</b>
              </div>
              <small>
                CAPITAL {usd(owner.capitalReturn)} · REIMB{" "}
                {usd(owner.reimbursement)} · PROFIT {usd(owner.profitShare)} ·
                LOSS {usd(owner.allocatedLoss)}
              </small>
              <small>
                PAID {usd(owner.paid)} · BALANCE {usd(owner.balanceDue)}
              </small>
            </div>
          ))}
          <Money
            label={t.unallocated}
            value={record.waterfall?.unallocatedCash}
            big
            tone={
              Math.abs(Number(record.waterfall?.unallocatedCash || 0)) > 0.005
                ? "warn"
                : ""
            }
          />
        </Section>
        <Section title={t.documents}>
          <label className="stl-secondary stl-upload">
            {uploading ? t.working : t.addDocument}
            <input
              hidden
              multiple
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={(event) => {
                addDocuments(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
          {documents.map((document) => (
            <div
              className="stl-row"
              key={document.attachmentId || document.storageKey}
            >
              <div className="stl-rowhead">
                <strong>{document.fileName}</strong>
                <b>{t.verified}</b>
              </div>
            </div>
          ))}
        </Section>
        {record.status === "ready" ? (
          <>
            <button className="stl-secondary" onClick={() => setEditing(true)}>
              {t.edit}
            </button>
            <button className="stl-primary" disabled={busy} onClick={approve}>
              {busy ? t.working : t.approve}
            </button>
          </>
        ) : null}
        {["approved", "partially-paid"].includes(record.status) ? (
          <PaymentPanel
            t={t}
            recipients={recipients}
            values={{
              payRecipientId,
              payAmount,
              payDate,
              payMethod,
              payReference,
              payBankReference,
              payCheckNumber,
            }}
            setters={{
              setPayRecipientId,
              setPayAmount,
              setPayDate,
              setPayMethod,
              setPayReference,
              setPayBankReference,
              setPayCheckNumber,
            }}
            busy={busy}
            onPay={pay}
          />
        ) : null}
        {["approved", "partially-paid", "settled"].includes(record.status) ? (
          <>
            <Section title={t.correctionReason}>
              <Field label={t.correctionReason}>
                <Input
                  value={correctionReason}
                  onChange={setCorrectionReason}
                />
              </Field>
              <button
                className="stl-secondary"
                disabled={busy || !clean(correctionReason)}
                onClick={reopen}
              >
                {t.reopen}
              </button>
            </Section>
          </>
        ) : null}
        <button className="stl-secondary" onClick={() => onBack?.()}>
          {t.back}
        </button>
        <div className="stl-foot">{t.foot}</div>
        <IXISettlementStyles />
      </div>
    );

  return (
    <div className="ixi-stl" lang={lang === "es" ? "es-MX" : "en-US"}>
      <Header
        t={t}
        lang={lang}
        setLang={setLang}
        onBack={onBack}
        status={blockers.length ? "OPEN" : "READY"}
      />
      {stageRail}
      <div className="stl-card-record">
        <span>{resolvedSale.identity?.number || "NEW SETTLEMENT"}</span>
        <strong>{usd(projection.salePrice)}</strong>
      </div>
      <div className="stl-context">
        <strong>
          {resolvedSale.context?.assetLabel || context.primary?.label}
        </strong>
        <small>
          {resolvedSale.identity?.number} · {resolvedSale.sale?.buyerLabel}
        </small>
      </div>
      <Section title={t.sale}>
        <Money label={t.salePrice} value={projection.salePrice} />
        <Money label={t.collected} value={projection.collected} />
        <Money label={t.credits} value={projection.credited} />
        <Money label={t.buyerBalance} value={projection.buyerBalance} big />
      </Section>
      <Section title={t.economics}>
        <Money label={t.acquisition} value={projection.acquisitionCost} />
        <Money label={t.makeReady} value={projection.makeReadyCost} />
        <Money label={t.postCosts} value={projection.postAcquisitionCosts} />
        <Money label={t.income} value={projection.assetIncome} />
        <Field label={t.sellingCosts}>
          <Input
            value={sellingCosts}
            onChange={setSellingCosts}
            inputMode="decimal"
            placeholder={usd(projection.sellingCosts)}
          />
        </Field>
        <Money label={t.commissionsTotal} value={projection.commissionTotal} />
        <Money
          label={t.profit}
          value={projection.economicProfit}
          big
          tone={projection.economicProfit < 0 ? "bad" : ""}
        />
      </Section>
      <Section title={t.expenses}>
        <div className="stl-help">{t.expenseHelp}</div>
        {projection.expenseLedger.map((item) => (
          <div
            className={`stl-row ${item.included ? "" : "muted"}`}
            key={item.ledgerItemId}
          >
            <div className="stl-rowhead stl-ledger-head">
              <strong>{item.label}</strong>
              <b>
                {item.direction === "income" ? "+" : "−"}
                {usd(item.amount)}
              </b>
            </div>
            <small className="stl-ledger-meta">
              <span>{item.date || "—"}</span>
              <span>{item.counterpartyLabel || item.type.toUpperCase()}</span>
              <span>{item.included ? t.canonical : t.excluded}</span>
            </small>
            {item.exclusionReason ? (
              <small>{item.exclusionReason}</small>
            ) : null}
          </div>
        ))}
        {expenseAdjustments.map((row) => (
          <MoneyRow
            key={idOf(row)}
            t={t}
            row={row}
            id={idOf(row)}
            onPatch={(key, value) =>
              patchRow(setExpenseAdjustments, idOf(row), key, value)
            }
            onRemove={() => removeRow(setExpenseAdjustments, idOf(row))}
            labelField
          />
        ))}
        <button
          className="stl-secondary"
          onClick={() =>
            setExpenseAdjustments((list) => [
              ...list,
              emptyMoneyRow("EXP", "OUTSIDE EXPENSE"),
            ])
          }
        >
          {t.addExpense}
        </button>
      </Section>
      <Section title={t.commissions}>
        {commissions.map((row) => (
          <CommissionRow
            key={idOf(row)}
            t={t}
            row={row}
            id={idOf(row)}
            calculated={projection.commissions.find(
              (item) => item.commissionId === idOf(row),
            )}
            onPatch={(key, value) =>
              patchRow(setCommissions, idOf(row), key, value)
            }
            onRemove={() => removeRow(setCommissions, idOf(row))}
          />
        ))}
        <button
          className="stl-secondary"
          onClick={() =>
            setCommissions((list) => [...list, emptyCommission(context.entity)])
          }
        >
          {t.addCommission}
        </button>
      </Section>
      <Section title={t.payoffs}>
        {liabilities.map((row) => (
          <MoneyRow
            key={idOf(row)}
            t={t}
            row={row}
            id={idOf(row)}
            onPatch={(key, value) =>
              patchRow(setLiabilities, idOf(row), key, value)
            }
            onRemove={() => removeRow(setLiabilities, idOf(row))}
            labelField
          />
        ))}
        <button
          className="stl-secondary"
          onClick={() =>
            setLiabilities((list) => [
              ...list,
              emptyMoneyRow("PAYOFF", "LIEN / PAYOFF"),
            ])
          }
        >
          {t.addPayoff}
        </button>
      </Section>
      <Section title={t.disbursements}>
        {disbursements.map((row) => (
          <MoneyRow
            key={idOf(row)}
            t={t}
            row={row}
            id={idOf(row)}
            onPatch={(key, value) =>
              patchRow(setDisbursements, idOf(row), key, value)
            }
            onRemove={() => removeRow(setDisbursements, idOf(row))}
          />
        ))}
        <button
          className="stl-secondary"
          onClick={() =>
            setDisbursements((list) => [...list, emptyMoneyRow("DISB")])
          }
        >
          {t.addDisbursement}
        </button>
      </Section>
      <Section title={t.owners}>
        {reimbursements.map((row) => (
          <OwnerRow
            key={idOf(row)}
            t={t}
            row={row}
            id={idOf(row)}
            owners={waterfall.owners}
            label={t.reimbursement}
            onPatch={(key, value) =>
              patchRow(setReimbursements, idOf(row), key, value)
            }
            onRemove={() => removeRow(setReimbursements, idOf(row))}
          />
        ))}
        <button
          className="stl-secondary"
          onClick={() =>
            setReimbursements((list) => [
              ...list,
              {
                ...emptyMoneyRow("REIMB"),
                ownerId: waterfall.owners?.[0]?.ownerId || "",
              },
            ])
          }
        >
          {t.addReimbursement}
        </button>
        {priorDistributions.map((row) => (
          <OwnerRow
            key={idOf(row)}
            t={t}
            row={row}
            id={idOf(row)}
            owners={waterfall.owners}
            label={t.prior}
            onPatch={(key, value) =>
              patchRow(setPriorDistributions, idOf(row), key, value)
            }
            onRemove={() => removeRow(setPriorDistributions, idOf(row))}
          />
        ))}
        <button
          className="stl-secondary"
          onClick={() =>
            setPriorDistributions((list) => [
              ...list,
              {
                ...emptyMoneyRow("PRIOR"),
                ownerId: waterfall.owners?.[0]?.ownerId || "",
              },
            ])
          }
        >
          {t.addPrior}
        </button>
        <Field label={t.retained}>
          <Input
            value={retainedProceeds}
            onChange={setRetainedProceeds}
            inputMode="decimal"
          />
        </Field>
      </Section>
      <Section title={t.waterfall}>
        {waterfall.owners.map((owner) => (
          <div className="stl-row" key={owner.ownerId}>
            <div className="stl-rowhead">
              <strong>
                {owner.label} · {owner.settlementSharePercent}%
              </strong>
              <b>{usd(owner.finalDue)}</b>
            </div>
            <small>
              CAPITAL {usd(owner.capitalReturn)} · REIMB{" "}
              {usd(owner.reimbursement)} · PROFIT {usd(owner.profitShare)} ·
              LOSS {usd(owner.allocatedLoss)} · PRIOR{" "}
              {usd(owner.priorDistributions)}
            </small>
          </div>
        ))}
        <Money label={t.totalSettlement} value={waterfall.totalFinalDue} big />
        <Money
          label={t.unallocated}
          value={waterfall.unallocatedCash}
          big
          tone={Math.abs(waterfall.unallocatedCash) > 0.005 ? "warn" : ""}
        />
        <Money
          label={t.lossShortfall}
          value={waterfall.totalLossShortfall}
          tone={waterfall.totalLossShortfall > 0.005 ? "bad" : ""}
        />
      </Section>
      {blockers.length ? (
        <div className="stl-blockers">{blockers.join(" · ")}</div>
      ) : null}
      {error ? <div className="stl-blockers">{error}</div> : null}
      <Section title={t.review}>
        <Field label={t.reviewedBy}>
          <Input value={reviewedBy} onChange={setReviewedBy} />
        </Field>
        <Field label={t.approvalNote}>
          <textarea
            value={approvalNote}
            onChange={(event) => setApprovalNote(event.target.value)}
          />
        </Field>
      </Section>
      <button
        className="stl-primary"
        disabled={blockers.length > 0 || busy}
        onClick={prepare}
      >
        {busy ? t.working : record ? t.update : t.prepare}
      </button>
      <button className="stl-secondary" onClick={() => onBack?.()}>
        {t.back}
      </button>
      <div className="stl-foot">{t.foot}</div>
      <IXISettlementStyles />
    </div>
  );
}

function Header({ t, lang, setLang, onBack, status }) {
  return (
    <div className="stl-top">
      <button
        type="button"
        className="stl-back"
        aria-label="Back to TRAN$ACT apps"
        onClick={() => onBack?.()}
      >
        ‹
      </button>
      <div>
        <div className="stl-k">IXI TRAN$ACT</div>
        <div className="stl-title">{t.title}</div>
      </div>
      <div className="stl-head-actions">
        <div className="stl-lang">
          <button
            className={lang === "en" ? "on" : ""}
            onClick={() => setLang("en")}
          >
            ENG
          </button>
          <button
            className={lang === "es" ? "on" : ""}
            onClick={() => setLang("es")}
          >
            ESP
          </button>
        </div>
        <i>{status}</i>
      </div>
    </div>
  );
}

function MoneyRow({ t, row, onPatch, onRemove, labelField = false }) {
  return (
    <div className="stl-row">
      {labelField ? (
        <Field label={t.type}>
          <Input
            value={row.label}
            onChange={(value) => onPatch("label", value)}
          />
        </Field>
      ) : null}
      <div className="stl-grid">
        <Field label={t.payee}>
          <Input
            value={row.payeeLabel}
            onChange={(value) => onPatch("payeeLabel", value)}
          />
        </Field>
        <Field label={t.amount}>
          <Input
            value={row.amount}
            onChange={(value) => onPatch("amount", value)}
            inputMode="decimal"
          />
        </Field>
      </div>
      <div className="stl-grid">
        <Field label={t.passport}>
          <Input
            value={row.payeePassportId}
            onChange={(value) => onPatch("payeePassportId", value)}
          />
        </Field>
        <Field label={t.status}>
          <select
            value={row.status || "open"}
            onChange={(event) => onPatch("status", event.target.value)}
          >
            <option value="open">{option(t, "OPEN", "ABIERTO")}</option>
            <option value="scheduled">
              {option(t, "SCHEDULED", "PROGRAMADO")}
            </option>
            <option value="paid">{option(t, "PAID", "PAGADO")}</option>
            <option value="disputed">
              {option(t, "DISPUTED", "EN DISPUTA")}
            </option>
          </select>
        </Field>
      </div>
      <div className="stl-grid">
        <Field label={t.paidBy}>
          <Input
            value={row.paidByEntityLabel}
            onChange={(value) => onPatch("paidByEntityLabel", value)}
          />
        </Field>
        <Field label={t.account}>
          <Input
            value={row.cashAccountLabel}
            onChange={(value) => onPatch("cashAccountLabel", value)}
          />
        </Field>
      </div>
      <Field label={t.reference}>
        <Input
          value={row.reference}
          onChange={(value) => onPatch("reference", value)}
        />
      </Field>
      <Toggle
        label={t.included}
        checked={row.included !== false}
        onChange={(value) => onPatch("included", value)}
      />
      <Remove label={t.remove} onClick={onRemove} />
    </div>
  );
}

function CommissionRow({ t, row, calculated = {}, onPatch, onRemove }) {
  const label = (english, spanish) =>
    t.languageCode === "es" ? spanish : english;
  return (
    <div className="stl-row">
      <div className="stl-grid">
        <Field label={t.recipient}>
          <Input
            value={row.recipientLabel}
            onChange={(value) => onPatch("recipientLabel", value)}
          />
        </Field>
        <Field label={t.passport}>
          <Input
            value={row.recipientPassportId}
            onChange={(value) => onPatch("recipientPassportId", value)}
          />
        </Field>
      </div>
      <div className="stl-grid">
        <Field label={t.type}>
          <select
            value={row.commissionType || "salesperson"}
            onChange={(event) => onPatch("commissionType", event.target.value)}
          >
            <option value="salesperson">
              {label("SALESPERSON", "VENDEDOR")}
            </option>
            <option value="broker">{label("BROKER", "CORREDOR")}</option>
            <option value="referral">{label("REFERRAL", "REFERIDO")}</option>
            <option value="bounty">{label("BOUNTY", "RECOMPENSA")}</option>
            <option value="bonus">{label("BONUS", "BONO")}</option>
            <option value="management">
              {label("MANAGEMENT", "GERENCIA")}
            </option>
            <option value="other">{label("OTHER", "OTRO")}</option>
          </select>
        </Field>
        <Field label={t.method}>
          <select
            value={row.calculationMethod || "fixed"}
            onChange={(event) =>
              onPatch("calculationMethod", event.target.value)
            }
          >
            <option value="fixed">{label("FIXED", "FIJO")}</option>
            <option value="sale-price">
              {label("% SALE PRICE", "% PRECIO DE VENTA")}
            </option>
            <option value="gross-profit">
              {label("% GROSS PROFIT", "% GANANCIA BRUTA")}
            </option>
            <option value="net-profit">
              {label("% NET PROFIT", "% GANANCIA NETA")}
            </option>
            <option value="above-target">
              {label("% ABOVE TARGET", "% SOBRE META")}
            </option>
            <option value="manual">{label("MANUAL", "MANUAL")}</option>
          </select>
        </Field>
      </div>
      <div className="stl-grid">
        <Field label={t.rate}>
          <Input
            value={row.ratePercent}
            onChange={(value) => onPatch("ratePercent", value)}
            inputMode="decimal"
          />
        </Field>
        <Field label={t.fixed}>
          <Input
            value={row.fixedAmount}
            onChange={(value) => onPatch("fixedAmount", value)}
            inputMode="decimal"
          />
        </Field>
        <Field label={t.target}>
          <Input
            value={row.targetAmount}
            onChange={(value) => onPatch("targetAmount", value)}
            inputMode="decimal"
          />
        </Field>
        <Field label={t.adjustment}>
          <Input
            value={row.adjustmentAmount}
            onChange={(value) => onPatch("adjustmentAmount", value)}
            inputMode="decimal"
          />
        </Field>
      </div>
      <Money label={t.final} value={calculated.finalAmount} big />
      <Field label={t.treatment}>
        <select
          value={row.economicTreatment || "machine-selling-expense"}
          onChange={(event) => onPatch("economicTreatment", event.target.value)}
        >
          <option value="machine-selling-expense">
            {label("MACHINE SELLING EXPENSE", "GASTO DE VENTA DE MÁQUINA")}
          </option>
          <option value="company-overhead">
            {label("COMPANY OVERHEAD", "GASTO GENERAL")}
          </option>
          <option value="owner-specific-charge">
            {label("OWNER-SPECIFIC CHARGE", "CARGO AL PROPIETARIO")}
          </option>
          <option value="pass-through">
            {label("PASS-THROUGH", "TRASPASO")}
          </option>
        </select>
      </Field>
      <div className="stl-grid">
        <Field label={t.status}>
          <select
            value={row.status || "projected"}
            onChange={(event) => onPatch("status", event.target.value)}
          >
            <option value="proposed">{label("PROPOSED", "PROPUESTO")}</option>
            <option value="projected">
              {label("PROJECTED", "PROYECTADO")}
            </option>
            <option value="earned">{label("EARNED", "DEVENGADO")}</option>
            <option value="approved">{label("APPROVED", "APROBADO")}</option>
            <option value="paid">{label("PAID", "PAGADO")}</option>
          </select>
        </Field>
        <Field label={t.dueDate}>
          <Input
            type="date"
            value={row.dueDate}
            onChange={(value) => onPatch("dueDate", value)}
          />
        </Field>
      </div>
      <Field label={t.conditions}>
        <Input
          value={row.conditions}
          onChange={(value) => onPatch("conditions", value)}
        />
      </Field>
      <Field label={t.reference}>
        <Input
          value={row.reference}
          onChange={(value) => onPatch("reference", value)}
        />
      </Field>
      <Toggle
        label={t.included}
        checked={row.included !== false}
        onChange={(value) => onPatch("included", value)}
      />
      <Remove label={t.remove} onClick={onRemove} />
    </div>
  );
}

function OwnerRow({ t, row, owners, label, onPatch, onRemove }) {
  return (
    <div className="stl-row">
      <div className="stl-grid">
        <Field label={t.recipient}>
          <select
            value={row.ownerId || ""}
            onChange={(event) => onPatch("ownerId", event.target.value)}
          >
            {owners.map((owner) => (
              <option key={owner.ownerId} value={owner.ownerId}>
                {owner.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={label}>
          <Input
            value={row.amount}
            onChange={(value) => onPatch("amount", value)}
            inputMode="decimal"
          />
        </Field>
      </div>
      <Field label={t.reference}>
        <Input
          value={row.reference}
          onChange={(value) => onPatch("reference", value)}
        />
      </Field>
      <Remove label={t.remove} onClick={onRemove} />
    </div>
  );
}

function PaymentPanel({ t, recipients, values, setters, busy, onPay }) {
  return (
    <Section title={t.payments}>
      <Field label={t.recipient}>
        <select
          value={values.payRecipientId}
          onChange={(event) => setters.setPayRecipientId(event.target.value)}
        >
          <option value="">{option(t, "SELECT", "SELECCIONE")}</option>
          {recipients.map((row) => (
            <option key={row.recipientId} value={row.recipientId}>
              {row.recipientLabel} · {usd(row.balanceDue)}
            </option>
          ))}
        </select>
      </Field>
      <div className="stl-grid">
        <Field label={t.amount}>
          <Input
            value={values.payAmount}
            onChange={setters.setPayAmount}
            inputMode="decimal"
          />
        </Field>
        <Field label={t.paymentDate}>
          <Input
            type="date"
            value={values.payDate}
            onChange={setters.setPayDate}
          />
        </Field>
      </div>
      <div className="stl-grid">
        <Field label={t.paymentMethod}>
          <select
            value={values.payMethod}
            onChange={(event) => setters.setPayMethod(event.target.value)}
          >
            <option value="wire">{option(t, "WIRE", "TRANSFERENCIA")}</option>
            <option value="ach">ACH</option>
            <option value="check">{option(t, "CHECK", "CHEQUE")}</option>
            <option value="other">{option(t, "OTHER", "OTRO")}</option>
          </select>
        </Field>
        <Field label={t.paymentReference}>
          <Input
            value={values.payReference}
            onChange={setters.setPayReference}
          />
        </Field>
      </div>
      <div className="stl-grid">
        <Field label={t.account}>
          <Input
            value={values.payBankReference}
            onChange={setters.setPayBankReference}
          />
        </Field>
        <Field label={t.checkNumber}>
          <Input
            value={values.payCheckNumber}
            onChange={setters.setPayCheckNumber}
          />
        </Field>
      </div>
      <button
        className="stl-primary"
        disabled={busy || !values.payRecipientId}
        onClick={onPay}
      >
        {busy ? t.working : t.pay}
      </button>
    </Section>
  );
}
