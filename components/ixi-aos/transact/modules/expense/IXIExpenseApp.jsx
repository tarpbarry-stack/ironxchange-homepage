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
  createIXIExpense
} from "./IXIExpenseCommands";

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
    remove: "Remove receipt"
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
    remove: "Quitar recibo"
  }
};

const CATEGORIES = [
  ["parts-fittings", "Parts / Fittings", "Partes / Conexiones"],
  ["supplies", "Supplies", "Suministros"],
  ["fuel", "Fuel", "Combustible"],
  ["outside-service", "Outside Service", "Servicio Externo"],
  ["rental", "Rental", "Renta"],
  ["travel", "Travel", "Viaje"],
  ["other", "Other", "Otro"]
];

function createClientRequestId() {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return `EXP-${globalThis.crypto.randomUUID()}`;
  }

  return `EXP-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
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
  workOrder = null,
  onCancel = null,
  onSave = null,
  language = "",
  onLanguageChange = null,
  expensePolicy = null
}) {
  const [localLang, setLocalLang] = useState(language || "en");
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [expenseDate, setExpenseDate] = useState(today());
  const [paymentMethod, setPaymentMethod] = useState("company-card");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [saveError, setSaveError] = useState("");

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
      expenseDate,
      paymentMethod,
      referenceNumber,
      notes,
      receiptRequired,
      attachments: attachment ? [attachment] : []
    }),
    [
      vendor,
      description,
      amount,
      category,
      expenseDate,
      paymentMethod,
      referenceNumber,
      notes,
      receiptRequired,
      attachment
    ]
  );

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

    revokeReceiptPreview();
    setVendor("");
    setDescription("");
    setAmount("");
    setCategory("");
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
    ? "Receipt Required"
    : clean(policy?.label) || t.receiptPolicy;

  return (
    <div className="tx-expense">
      <div className="ex-lang">
        <button className={lang === "en" ? "on" : ""} onClick={() => setLanguage("en")} disabled={saving}>ENG</button>
        <i>/</i>
        <button className={lang === "es" ? "on" : ""} onClick={() => setLanguage("es")} disabled={saving}>ESP</button>
      </div>

      <div className="ex-head">
        <div className="ex-icon">$</div>
        <div className="ex-title"><strong>{t.title}</strong><small>{t.sub}</small></div>
      </div>

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
              <option value="">Select category</option>
              {CATEGORIES.map(([value, english, spanish]) => (
                <option key={value} value={value}>{lang === "es" ? spanish : english}</option>
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

      <label>{t.reference}</label>
      <div className="ex-field">
        <input value={referenceNumber} onChange={event => setReferenceNumber(event.target.value)} placeholder="Optional" disabled={saving} />
        <button type="button" className="field-x" onClick={() => setReferenceNumber("")} disabled={saving}>×</button>
      </div>

      <div className="ex-two">
        <div><label>{t.workOrder}</label><div className="ex-locked">{workOrderNumber || "—"}</div></div>
        <div><label>{t.machine}</label><div className="ex-locked">{originLabel}</div></div>
      </div>

      <label>{t.notes}</label>
      <textarea className="ex-notes" value={notes} onChange={event => setNotes(event.target.value)} placeholder="Optional notes" disabled={saving} />

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
          <span>{saving ? t.saving : t.save}<small>{t.saveSub}</small></span>
        </button>
        <button onClick={clearForm} disabled={saving}>↻ {t.clear}</button>
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
        * Required fields <i /> Company Policy: {policyLabel} <i /> Expense Approval: {clean(policy?.approval) || "OFF"}
      </div>

      <IXIExpenseStyles />
    </div>
  );
}
