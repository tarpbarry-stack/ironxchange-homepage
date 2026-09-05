import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  createIXIExpenseDraft,
  validateIXIExpense
} from "./IXIExpenseContract";

import {
  createIXIExpense,
  createIXIExpenseCorrectionDocument,
  updateIXIExpense
} from "./IXIExpenseCommands";

import {
  amendIXIExpenseRecord,
  isIXIExpenseLocked
} from "./IXIExpenseRecordEngine";

import {
  getIXIExpenseCategories,
  getIXIExpenseCategory,
  getIXIExpenseCostPurposes
} from "./IXIExpenseCategoryRegistry";

import {
  createIXIPendingAttachment,
  validateIXITransactFile
} from "../../IXITransactFilePolicy";

import IXIExpenseStyles from "./IXIExpenseStyles";

const clean = value => String(value ?? "").trim();
const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;
const RECEIPT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
];

const COPY = {
  en: {
    title: "ADD EXPENSE",
    sub: "Record a business expense",
    location: "Location",
    employee: "Employee",
    today: "Today",
    currency: "Currency",
    vendor: "VENDOR / MERCHANT",
    bought: "WHAT DID YOU BUY?",
    amount: "AMOUNT",
    paid: "PAID WITH",
    companyCard: "COMPANY CARD",
    companyCash: "COMPANY CASH",
    myMoney: "MY MONEY",
    other: "OTHER",
    category: "EXPENSE CATEGORY",
    date: "EXPENSE DATE",
    reference: "REFERENCE / RECEIPT NUMBER",
    workOrder: "WORK ORDER",
    machine: "ORIGINATING OBJECT",
    notes: "NOTES",
    receipt: "RECEIPT / PHOTO",
    addReceipt: "Tap to add photo or receipt",
    receiptPolicy: "Receipts Optional",
    save: "SAVE EXPENSE",
    saving: "SAVING…",
    saveSub: "Record this expense",
    clear: "CLEAR",
    recorded: "EXPENSE RECORDED",
    returning: "Returning to",
    reimbursement: "REIMBURSEMENT OWED",
    required: "Complete the required fields before saving.",
    saveError: "Expense could not be recorded. Nothing was added. Try again.",
    remove: "Remove receipt",
    recordTitle: "EXPENSE RECORD",
    recordSub: "Canonical Passport expense",
    edit: "EDIT EXPENSE",
    correct: "CORRECT / REVERSE",
    cancelEdit: "CANCEL EDIT",
    changeReason: "CHANGE REASON",
    changeReference: "APPROVAL / SUPPORTING REFERENCE",
    costPurpose: "COST PURPOSE",
    glAccount: "GL ACCOUNT",
    audit: "IMMUTABLE ACTIVITY",
    noActivity: "Original record · No later changes",
    saveEdit: "SAVE AMENDMENT",
    saveCorrection: "SAVE CORRECTION",
    fullReversal: "FULL REVERSAL",
    locked: "ACCOUNTING LOCKED",
    editable: "OPEN FOR EDIT",
    notFound: "The selected Expense record could not be loaded. Return to F$1 and refresh the Passport records.",
    effectiveDate: "CORRECTION DATE",
    attachments: "SUPPORTING FILES",
    back: "‹ BACK TO F$1",
    expense: "EXPENSE",
    optional: "Optional",
    unmapped: "UNMAPPED",
    file: "FILE",
    system: "SYSTEM",
    receiptRequired: "Receipt Required",
    requiredFields: "Required fields",
    companyPolicy: "Company Policy",
    expenseApproval: "Expense Approval"
  },
  es: {
    title: "AGREGAR GASTO",
    sub: "Registrar un gasto comercial",
    location: "Ubicación",
    employee: "Empleado",
    today: "Hoy",
    currency: "Moneda",
    vendor: "PROVEEDOR / COMERCIO",
    bought: "¿QUÉ COMPRASTE?",
    amount: "IMPORTE",
    paid: "PAGADO CON",
    companyCard: "TARJETA EMPRESA",
    companyCash: "EFECTIVO EMPRESA",
    myMoney: "MI DINERO",
    other: "OTRO",
    category: "CATEGORÍA",
    date: "FECHA DEL GASTO",
    reference: "REFERENCIA / NÚMERO DE RECIBO",
    workOrder: "ORDEN DE TRABAJO",
    machine: "OBJETO DE ORIGEN",
    notes: "NOTAS",
    receipt: "RECIBO / FOTO",
    addReceipt: "Toca para agregar foto o recibo",
    receiptPolicy: "Recibos Opcionales",
    save: "GUARDAR GASTO",
    saving: "GUARDANDO…",
    saveSub: "Registrar este gasto",
    clear: "LIMPIAR",
    recorded: "GASTO REGISTRADO",
    returning: "Regresando a",
    reimbursement: "REEMBOLSO PENDIENTE",
    required: "Completa los campos requeridos antes de guardar.",
    saveError: "No se pudo registrar el gasto. No se agregó nada. Intenta de nuevo.",
    remove: "Quitar recibo",
    recordTitle: "REGISTRO DE GASTO",
    recordSub: "Gasto canónico del Pasaporte",
    edit: "EDITAR GASTO",
    correct: "CORREGIR / REVERSAR",
    cancelEdit: "CANCELAR EDICIÓN",
    changeReason: "MOTIVO DEL CAMBIO",
    changeReference: "REFERENCIA DE APROBACIÓN / SOPORTE",
    costPurpose: "PROPÓSITO DEL COSTO",
    glAccount: "CUENTA CONTABLE",
    audit: "ACTIVIDAD INMUTABLE",
    noActivity: "Registro original · Sin cambios posteriores",
    saveEdit: "GUARDAR MODIFICACIÓN",
    saveCorrection: "GUARDAR CORRECCIÓN",
    fullReversal: "REVERSIÓN TOTAL",
    locked: "CONTABILIDAD BLOQUEADA",
    editable: "ABIERTO PARA EDICIÓN",
    notFound: "No se pudo cargar el registro de Gasto seleccionado. Regrese a F$1 y actualice los registros del Pasaporte.",
    effectiveDate: "FECHA DE CORRECCIÓN",
    attachments: "ARCHIVOS DE SOPORTE",
    back: "‹ VOLVER A F$1",
    expense: "GASTO",
    optional: "Opcional",
    unmapped: "SIN ASIGNAR",
    file: "ARCHIVO",
    system: "SISTEMA",
    receiptRequired: "Recibo obligatorio",
    requiredFields: "Campos obligatorios",
    companyPolicy: "Política de la empresa",
    expenseApproval: "Aprobación de gastos"
  }
};

function createClientRequestId() {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return `EXP-${globalThis.crypto.randomUUID()}`;
  }

  return `EXP-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function safeAttachmentUrl(value = "") {
  const href = clean(value);
  return /^(https?:\/\/|\/)/i.test(href) ? href : "";
}

function receiptRequiredByPolicy(policy = {}, amount = 0) {
  const mode = clean(policy?.mode || policy?.receiptPolicy || "optional").toLowerCase();

  if (mode === "required") return true;

  if (mode === "required-above" || mode === "threshold") {
    return Number(amount || 0) >= Number(policy?.threshold || policy?.receiptThreshold || 0);
  }

  return false;
}

export default function IXIExpenseApp({
  context = {},
  object = {},
  workOrder = null,
  initialRecord = null,
  selectedFinancialDocumentId = "",
  onCancel = null,
  onSave = null,
  language = "",
  onLanguageChange = null,
  expensePolicy = null
}) {
  const [record, setRecord] = useState(initialRecord);
  const [mode, setMode] = useState(initialRecord ? "record" : "new");
  const [localLang, setLocalLang] = useState(language || "en");
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [costPurpose, setCostPurpose] = useState("other");
  const [expenseDate, setExpenseDate] = useState(today());
  const [paymentMethod, setPaymentMethod] = useState("company-card");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [changeReference, setChangeReference] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(today());
  const [fullReversal, setFullReversal] = useState(false);

  const fileRef = useRef(null);
  const requestRef = useRef(createClientRequestId());
  const returnTimerRef = useRef(null);

  const lang = language || localLang;
  const t = COPY[lang] || COPY.en;

  const primary = context.primary || {};
  const actor = context.actor || {};
  const location = context.location || {};
  const originLabel = clean(primary.label) || "AOS OBJECT";
  const locationLabel = clean(location.label || context.locationLabel) || originLabel;
  const actorLabel = clean(actor.displayName || actor.name || actor.label) || "—";
  const workOrderNumber = clean(
    workOrder?.identity?.number ||
      workOrder?.workOrderNumber ||
      workOrder?.number
  );

  const policy =
    expensePolicy ||
    context?.expensePolicy ||
    context?.policies?.expense ||
    {};

  const categories = useMemo(() => getIXIExpenseCategories(policy), [policy]);
  const costPurposes = useMemo(() => getIXIExpenseCostPurposes(policy), [policy]);
  const selectedCategory = getIXIExpenseCategory(policy, category);

  const receiptRequired = receiptRequiredByPolicy(
    policy,
    Number(amount || 0)
  );

  const attachment = useMemo(
    () => receipt
      ? createIXIPendingAttachment(receipt.file, { type: "receipt-photo" })
      : null,
    [receipt]
  );

  const input = useMemo(
    () => ({
      clientRequestId: requestRef.current,
      vendor,
      description,
      amount: Number(amount || 0),
      currency: "USD",
      category,
      costPurpose,
      glAccountCode: clean(selectedCategory?.glAccountCode),
      glAccountName: clean(selectedCategory?.glAccountName),
      expenseDate,
      paymentMethod,
      referenceNumber,
      notes,
      receiptRequired,
      attachments: attachment
        ? [...(mode === "new" ? [] : (record?.attachments || [])), attachment]
        : (mode === "new" ? [] : (record?.attachments || []))
    }),
    [
      vendor,
      description,
      amount,
      category,
      costPurpose,
      selectedCategory,
      expenseDate,
      paymentMethod,
      referenceNumber,
      notes,
      receiptRequired,
      attachment,
      mode,
      record
    ]
  );

  useEffect(() => {
    if (!initialRecord) {
      if (selectedFinancialDocumentId) setMode("missing");
      return;
    }

    const details = initialRecord.expense || {};
    setRecord(initialRecord);
    setVendor(clean(details.vendor));
    setDescription(clean(details.description));
    setAmount(String(Number(details.amount || 0)));
    setCategory(clean(details.category));
    setCostPurpose(clean(details.costPurpose || "other"));
    setExpenseDate(clean(details.expenseDate) || today());
    setPaymentMethod(clean(details.paymentMethod) || "other");
    setReferenceNumber(clean(details.referenceNumber));
    setNotes(clean(details.notes));
    setMode("record");
  }, [initialRecord, selectedFinancialDocumentId]);

  useEffect(() => {
    return () => {
      if (returnTimerRef.current) {
        clearTimeout(returnTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (receipt?.previewUrl) {
        try {
          URL.revokeObjectURL(receipt.previewUrl);
        } catch {
          // Ignore browser cleanup errors.
        }
      }
    };
  }, [receipt]);

  function setLanguage(value) {
    if (onLanguageChange) {
      onLanguageChange(value);
    } else {
      setLocalLang(value);
    }
  }

  function revokeReceiptPreview() {
    if (!receipt?.previewUrl) return;
    try {
      URL.revokeObjectURL(receipt.previewUrl);
    } catch {
      // Ignore browser cleanup errors.
    }
  }

  function clearForm() {
    if (saving) return;

    if (record && mode !== "new") {
      const details = record.expense || {};
      revokeReceiptPreview();
      setVendor(clean(details.vendor));
      setDescription(clean(details.description));
      setAmount(String(Number(details.amount || 0)));
      setCategory(clean(details.category));
      setCostPurpose(clean(details.costPurpose || "other"));
      setExpenseDate(clean(details.expenseDate) || today());
      setPaymentMethod(clean(details.paymentMethod) || "other");
      setReferenceNumber(clean(details.referenceNumber));
      setNotes(clean(details.notes));
      setReceipt(null);
      setErrors({});
      setSaveError("");
      setChangeReason("");
      setChangeReference("");
      setFullReversal(false);
      setMode("record");
      return;
    }

    revokeReceiptPreview();
    setVendor("");
    setDescription("");
    setAmount("");
    setCategory("");
    setCostPurpose("other");
    setExpenseDate(today());
    setPaymentMethod("company-card");
    setReferenceNumber("");
    setNotes("");
    setReceipt(null);
    setErrors({});
    setSaveError("");
    setSaved(null);
    requestRef.current = createClientRequestId();
  }

  function chooseReceipt(files) {
    const file = Array.from(files || [])[0];
    if (!file) return;

    const validation = validateIXITransactFile(file, {
      maxBytes: MAX_RECEIPT_BYTES,
      allowedMimeTypes: RECEIPT_MIME_TYPES,
      allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".pdf"]
    });

    if (!validation.valid) {
      setErrors(current => ({
        ...current,
        receipt: validation.message
      }));
      return;
    }

    revokeReceiptPreview();

    setReceipt({
      file,
      previewUrl: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : ""
    });

    setErrors(current => {
      const next = { ...current };
      delete next.receipt;
      return next;
    });
  }

  function removeReceipt() {
    revokeReceiptPreview();
    setReceipt(null);
  }

  async function save() {
    if (saving || saved) return;

    const draft = createIXIExpenseDraft({
      context,
      workOrder: workOrder || {},
      input
    });
    const validation = validateIXIExpense(draft);

    setErrors(validation.errors);
    setSaveError("");

    if (!validation.valid) return;

    setSaving(true);

    try {
      if (mode === "edit") {
        const amended = amendIXIExpenseRecord(record, {
          ...input,
          changeReason,
          changeReference,
          commandId: requestRef.current
        }, actor);
        const persisted = await updateIXIExpense({
          record: amended,
          action: "amend",
          metadata: { source: "ixi-transact-expense-record" }
        });
        setRecord(persisted.record);
        setMode("record");
        setChangeReason("");
        setChangeReference("");
        requestRef.current = createClientRequestId();
        await onSave?.(persisted.record, { ...input, action: "amend", files: receipt ? [receipt.file] : [] }, persisted.response);
        return;
      }

      if (mode === "correction") {
        const persisted = await createIXIExpenseCorrectionDocument({
          object: {
            passportId: primary.passportId,
            objectId: primary.objectId || primary.id,
            objectType: primary.objectType,
            label: primary.label
          },
          context,
          record,
          actor,
          input: {
            ...input,
            changeReason,
            changeReference,
            effectiveDate,
            fullReversal,
            commandId: requestRef.current
          }
        });
        setMode("record");
        await onSave?.(record, { ...input, action: "correction", correction: persisted.correction, files: receipt ? [receipt.file] : [] }, persisted.response);
        return;
      }

      const persisted = await createIXIExpense({
        object: {
          passportId: primary.passportId,
          objectId: primary.objectId || primary.id,
          objectType: primary.objectType,
          label: primary.label
        },
        context,
        workOrder: workOrder || {},
        input,
        commandId: requestRef.current,
        idempotencyKey: requestRef.current,
        metadata: {
          source: workOrderNumber
            ? "ixi-transact-work-order-expense"
            : "ixi-transact-object-expense",
          launchSource: "aos-object-toolbar-dollar"
        }
      });

      const result = persisted?.draft || draft;
      const response = persisted?.response || null;
      const canonicalId = clean(
        result?.identity?.expenseId ||
          result?.identity?.number ||
          requestRef.current
      );

      const committed = {
        ...result,
        identity: {
          ...(result.identity || {}),
          expenseId: canonicalId,
          number: clean(result?.identity?.number) || canonicalId
        },
        status: "incurred"
      };

      setSaved({
        id: canonicalId,
        draft: committed,
        response
      });

      await new Promise(resolve => {
        returnTimerRef.current = setTimeout(resolve, 1050);
      });

      await onSave?.(
        committed,
        {
          ...input,
          files: receipt ? [receipt.file] : []
        },
        response
      );
    } catch (error) {
      setSaveError(clean(error?.message) || t.saveError);
    } finally {
      setSaving(false);
    }
  }

  const policyLabel = receiptRequired
    ? t.receiptRequired
    : clean(policy?.label) || t.receiptPolicy;

  const paymentLabel = {
    "company-card": t.companyCard,
    "company-cash": t.companyCash,
    "my-money": t.myMoney,
    other: t.other
  }[record?.expense?.paymentMethod] || clean(record?.expense?.paymentMethod) || "—";

  if (mode === "missing") {
    return (
      <div className="tx-expense">
        <div className="ex-record-alert">{t.notFound}</div>
        <button className="ex-back" type="button" onClick={onCancel}>{t.back}</button>
        <IXIExpenseStyles />
      </div>
    );
  }

  if (mode === "record" && record) {
    const locked = isIXIExpenseLocked(record);
    const details = record.expense || {};
    const activity = [
      ...(record.amendments || []).map(item => ({ ...item, kind: "AMENDMENT" })),
      ...(record.corrections || []).map(item => ({ ...item, kind: item.fullReversal ? "REVERSAL" : "CORRECTION" }))
    ].sort((a, b) => String(b.occurredAt || "").localeCompare(String(a.occurredAt || "")));
    const categoryEntry = getIXIExpenseCategory(policy, details.category);
    const purposeEntry = costPurposes.find(item => item.id === details.costPurpose);

    return (
      <div className="tx-expense">
        <div className="ex-lang">
          <button className={lang === "en" ? "on" : ""} onClick={() => setLanguage("en")}>ENG</button><i>/</i>
          <button className={lang === "es" ? "on" : ""} onClick={() => setLanguage("es")}>ESP</button>
        </div>
        <div className="ex-head">
          <div className="ex-icon">$</div>
          <div className="ex-title"><strong>{t.recordTitle}</strong><small>{t.recordSub}</small></div>
        </div>
        <div className="ex-record-id">
          <div><small>{t.expense}</small><strong>{record.identity?.number || record.identity?.expenseId}</strong></div>
          <span className={locked ? "locked" : "open"}>{locked ? t.locked : t.editable}</span>
        </div>
        <div className="ex-record-amount"><small>{t.amount}</small><strong>${Number(details.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
        <div className="ex-record-grid">
          <div><small>{t.vendor}</small><b>{details.vendor || "—"}</b></div>
          <div><small>{t.date}</small><b>{details.expenseDate || "—"}</b></div>
          <div className="wide"><small>{t.bought}</small><b>{details.description || "—"}</b></div>
          <div><small>{t.category}</small><b>{categoryEntry?.[lang === "es" ? "labelEs" : "label"] || details.category || "—"}</b></div>
          <div><small>{t.costPurpose}</small><b>{purposeEntry?.[lang === "es" ? "labelEs" : "label"] || details.costPurpose || "—"}</b></div>
          <div><small>{t.paid}</small><b>{paymentLabel}</b></div>
          <div><small>{t.reference}</small><b>{details.referenceNumber || "—"}</b></div>
          <div><small>IXI PASSPORT</small><b>{record.context?.primaryPassportId || "—"}</b></div>
          <div><small>{t.workOrder}</small><b>{record.context?.workOrderNumber || "—"}</b></div>
          <div><small>{t.glAccount}</small><b>{[record.accounting?.glAccountCode, record.accounting?.glAccountName].filter(Boolean).join(" · ") || t.unmapped}</b></div>
          <div><small>{t.employee}</small><b>{record.context?.employeeLabel || "—"}</b></div>
          <div className="wide"><small>{t.notes}</small><b>{details.notes || "—"}</b></div>
        </div>
        <div className="ex-section-title">{t.attachments} · {(record.attachments || []).length}</div>
        <div className="ex-record-files">
          {(record.attachments || []).length ? (record.attachments || []).map((item, index) => {
            const label = clean(item.fileName || item.name || item.attachmentId) || `${t.file} ${index + 1}`;
            const href = safeAttachmentUrl(item.url || item.downloadUrl);
            return href
              ? <a key={item.attachmentId || index} href={href} target="_blank" rel="noreferrer">{label}</a>
              : <span key={item.attachmentId || index}>{label}</span>;
          }) : <span>—</span>}
        </div>
        <div className="ex-section-title">{t.audit}</div>
        <div className="ex-audit">
          {!activity.length ? <div className="empty">{t.noActivity}</div> : activity.map((item, index) => (
            <div key={item.amendmentId || item.correctionId || index}>
              <strong>{item.kind} · {item.reason}</strong>
              <span>{item.occurredAt || item.effectiveDate} · {item.actorLabel || item.actorId || t.system}</span>
              <small>{(item.changes || []).map(change => `${change.field}: ${change.previousValue || "—"} → ${change.revisedValue || "—"}`).join(" · ")}</small>
            </div>
          ))}
        </div>
        <div className="ex-record-actions">
          {!locked ? <button className="primary" onClick={() => { setMode("edit"); requestRef.current = createClientRequestId(); }}>{t.edit}</button> : null}
          <button className="danger" onClick={() => { setMode("correction"); requestRef.current = createClientRequestId(); }}>{t.correct}</button>
          <button onClick={onCancel}>{t.back}</button>
        </div>
        <IXIExpenseStyles />
      </div>
    );
  }

  return (
    <div className="tx-expense">
      <div className="ex-lang">
        <button className={lang === "en" ? "on" : ""} onClick={() => setLanguage("en")} disabled={saving}>ENG</button>
        <i>/</i>
        <button className={lang === "es" ? "on" : ""} onClick={() => setLanguage("es")} disabled={saving}>ESP</button>
      </div>

      <div className="ex-head">
        <div className="ex-icon">$</div>
        <div className="ex-title"><strong>{mode === "edit" ? t.edit : mode === "correction" ? t.correct : t.title}</strong><small>{mode === "new" ? t.sub : record?.identity?.number}</small></div>
      </div>

      {mode !== "new" ? (
        <div className={`ex-mode-banner ${mode}`}>
          {mode === "edit" ? t.saveEdit : t.saveCorrection} · {record?.status?.toUpperCase()}
        </div>
      ) : null}

      <div className="ex-context-row">
        <div><b>⌖ {locationLabel}</b><small>{t.location}</small></div>
        <div><b>● {actorLabel}</b><small>{t.employee}</small></div>
        <div><b>▣ {t.today}</b><small>{expenseDate}</small></div>
        <div><b>$ USD</b><small>{t.currency}</small></div>
      </div>

      <label>{t.vendor} <em>*</em></label>
      <div className={`ex-field ${errors.vendor ? "bad" : ""}`}>
        <input value={vendor} onChange={event => setVendor(event.target.value)} placeholder="Hydraulic Supply Co." disabled={saving} />
        <button type="button" className="field-x" onClick={() => setVendor("")} disabled={saving}>×</button>
      </div>

      <label>{t.bought} <em>*</em></label>
      <div className={`ex-field ${errors.description ? "bad" : ""}`}>
        <input value={description} onChange={event => setDescription(event.target.value)} placeholder="Hydraulic fittings – 1/2 in NPT" disabled={saving} />
        <button type="button" className="field-x" onClick={() => setDescription("")} disabled={saving}>×</button>
      </div>

      <div className="ex-amount-pay">
        <div>
          <label>{t.amount} <em>*</em></label>
          <div className={`ex-field ex-money ${errors.amount ? "bad" : ""}`}>
            <span>$</span>
            <input inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" disabled={saving} />
          </div>
        </div>

        <div>
          <label>{t.paid} <em>*</em></label>
          <div className={`ex-paid ${errors.paymentMethod ? "bad" : ""}`}>
            <button className={paymentMethod === "company-card" ? "on" : ""} onClick={() => setPaymentMethod("company-card")} disabled={saving}>{t.companyCard}</button>
            <button className={paymentMethod === "company-cash" ? "on" : ""} onClick={() => setPaymentMethod("company-cash")} disabled={saving}>{t.companyCash}</button>
            <button className={paymentMethod === "my-money" ? "on" : ""} onClick={() => setPaymentMethod("my-money")} disabled={saving}>{t.myMoney}</button>
            <button className={paymentMethod === "other" ? "on" : ""} onClick={() => setPaymentMethod("other")} disabled={saving}>{t.other}</button>
          </div>
        </div>
      </div>

      {paymentMethod === "my-money" ? (
        <div className="ex-reimbursement">
          ↻ {t.reimbursement} · {actorLabel} · ${Number(amount || 0).toFixed(2)}
        </div>
      ) : null}

      <div className="ex-two">
        <div>
          <label>{t.category} <em>*</em></label>
          <div className={`ex-field ${errors.category ? "bad" : ""}`}>
            <select value={category} onChange={event => setCategory(event.target.value)} disabled={saving}>
              <option value="">{lang === "es" ? "Seleccione categoría" : "Select category"}</option>
              {categories.map(item => (
                <option key={item.id} value={item.id}>{lang === "es" ? item.labelEs : item.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label>{t.date} <em>*</em></label>
          <div className={`ex-field ${errors.expenseDate ? "bad" : ""}`}>
            <input type="date" value={expenseDate} onChange={event => setExpenseDate(event.target.value)} disabled={saving} />
          </div>
        </div>
      </div>

      <div className="ex-two">
        <div>
          <label>{t.costPurpose} <em>*</em></label>
          <div className="ex-field">
            <select value={costPurpose} onChange={event => setCostPurpose(event.target.value)} disabled={saving}>
              {costPurposes.map(item => (
                <option key={item.id} value={item.id}>{lang === "es" ? item.labelEs : item.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label>{t.glAccount}</label>
          <div className="ex-locked">{[selectedCategory?.glAccountCode, selectedCategory?.glAccountName].filter(Boolean).join(" · ") || t.unmapped}</div>
        </div>
      </div>

      {mode !== "new" ? (
        <>
          <label>{t.changeReason} <em>*</em></label>
          <div className="ex-field">
            <input value={changeReason} onChange={event => setChangeReason(event.target.value)} placeholder={lang === "es" ? "Explique por qué cambia el registro" : "Explain why this record is changing"} disabled={saving} />
          </div>
          <div className="ex-two">
            <div>
              <label>{t.changeReference}</label>
              <div className="ex-field"><input value={changeReference} onChange={event => setChangeReference(event.target.value)} placeholder={t.optional} disabled={saving} /></div>
            </div>
            {mode === "correction" ? <div>
              <label>{t.effectiveDate}</label>
              <div className="ex-field"><input type="date" value={effectiveDate} onChange={event => setEffectiveDate(event.target.value)} disabled={saving} /></div>
            </div> : <div />}
          </div>
          {mode === "correction" ? (
            <label className="ex-check"><input type="checkbox" checked={fullReversal} onChange={event => setFullReversal(event.target.checked)} disabled={saving} /> {t.fullReversal}</label>
          ) : null}
        </>
      ) : null}

      <label>{t.reference}</label>
      <div className="ex-field">
        <input value={referenceNumber} onChange={event => setReferenceNumber(event.target.value)} placeholder={t.optional} disabled={saving} />
        <button type="button" className="field-x" onClick={() => setReferenceNumber("")} disabled={saving}>×</button>
      </div>

      <div className="ex-two">
        <div><label>{t.workOrder}</label><div className="ex-locked">{workOrderNumber || "—"}</div></div>
        <div><label>{t.machine}</label><div className="ex-locked">{originLabel}</div></div>
      </div>

      <label>{t.notes}</label>
      <textarea className="ex-notes" value={notes} onChange={event => setNotes(event.target.value)} placeholder={lang === "es" ? "Notas opcionales" : "Optional notes"} disabled={saving} />

      <label>{t.receipt}{receiptRequired ? " *" : ""}</label>
      <div className={`ex-upload ${errors.receipt ? "bad" : ""}`}>
        {receipt ? (
          <div className="receipt-card">
            {receipt.previewUrl ? <img src={receipt.previewUrl} alt="Receipt preview" /> : <div className="pdf-receipt">PDF</div>}
            <span>{receipt.file.name}</span>
            <button type="button" onClick={removeReceipt} aria-label={t.remove} disabled={saving}>×</button>
          </div>
        ) : null}

        <button type="button" className="upload-pick" onClick={() => fileRef.current?.click()} disabled={saving}>
          ⇧
          <span>{t.addReceipt}<small>PDF, JPG, PNG, WEBP · MAX 10MB</small></span>
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          capture="environment"
          disabled={saving}
          onChange={event => {
            chooseReceipt(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {Object.keys(errors).length && !saved ? <div className="ex-errors">{t.required}</div> : null}
      {saveError ? <div className="ex-errors server">{saveError}</div> : null}

      <div className="ex-actions">
        <button className="save" onClick={save} disabled={saving || Boolean(saved)}>
          ▣
          <span>{saving ? t.saving : mode === "edit" ? t.saveEdit : mode === "correction" ? t.saveCorrection : t.save}<small>{mode === "new" ? t.saveSub : changeReason || t.changeReason}</small></span>
        </button>
        <button onClick={clearForm} disabled={saving}>↻ {mode === "new" ? t.clear : t.cancelEdit}</button>
      </div>

      {saved ? (
        <div className="ex-success">
          <b>✓</b>
          <div>
            <strong>{t.recorded}</strong>
            <span>${Number(saved.draft?.expense?.amount || 0).toFixed(2)} · {clean(saved.draft?.expense?.vendor).toUpperCase()}</span>
            <small>{saved.id}</small>
            <em>{t.returning} {workOrderNumber || originLabel}…</em>
          </div>
        </div>
      ) : null}

      <div className="ex-policy">
        * {t.requiredFields} <i /> {t.companyPolicy}: {policyLabel} <i /> {t.expenseApproval}: {clean(policy?.approval) || "OFF"}
      </div>

      <IXIExpenseStyles />
    </div>
  );
}
