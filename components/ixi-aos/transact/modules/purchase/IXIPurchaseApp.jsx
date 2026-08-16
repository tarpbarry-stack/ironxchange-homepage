import {
  useMemo,
  useRef,
  useState
} from "react";

import {
  createIXIPurchaseDraft,
  validateIXIPurchase
} from "./IXIPurchaseContract";

import {
  createIXIPurchase
} from "./IXIPurchaseCommands";

import IXIPurchaseStyles from "./IXIPurchaseStyles";

const clean = value => String(value ?? "").trim();

const COPY = {
  en: {
    title: "CREATE PURCHASE / PO",
    machine: "Machine",
    wo: "Work Order",
    location: "Location",
    employee: "Employee",
    details: "PURCHASE DETAILS",
    type: "REQUEST TYPE",
    request: "PURCHASE REQUEST",
    po: "PURCHASE ORDER (PO)",
    vendor: "VENDOR",
    needed: "REQUEST / NEEDED BY DATE",
    priority: "PRIORITY",
    items: "ITEMS / DESCRIPTION",
    description: "Description",
    qty: "Qty",
    unit: "Unit",
    unitCost: "Est. Unit Cost",
    add: "+ ADD ITEM / DESCRIPTION",
    shipping: "ESTIMATED SHIPPING",
    total: "ESTIMATED TOTAL",
    charge: "CHARGE TO",
    cost: "COST CODE (OPTIONAL)",
    notes: "NOTES (OPTIONAL)",
    attach: "ATTACHMENTS (OPTIONAL)",
    addAttach: "ADD ATTACHMENT",
    attachmentQueued: "Attachment queued",
    cancel: "CANCEL",
    cancelSub: "Discard changes",
    save: "CREATE REQUEST / PO",
    saving: "SAVING…",
    saveSub: "Return to Work Order",
    foot: "This purchase request / PO will be related to the work order and tracked through IXI Financial.",
    required: "Vendor, a valid needed-by date and at least one valid item are required.",
    saveFailed: "The purchase could not be saved. Nothing was added to the Work Order. Correct the issue and retry.",
    normal: "Normal",
    high: "High",
    critical: "Critical"
  },
  es: {
    title: "CREAR COMPRA / OC",
    machine: "Máquina",
    wo: "Orden de Trabajo",
    location: "Ubicación",
    employee: "Empleado",
    details: "DETALLES DE COMPRA",
    type: "TIPO DE SOLICITUD",
    request: "SOLICITUD DE COMPRA",
    po: "ORDEN DE COMPRA (OC)",
    vendor: "PROVEEDOR",
    needed: "FECHA REQUERIDA",
    priority: "PRIORIDAD",
    items: "ARTÍCULOS / DESCRIPCIÓN",
    description: "Descripción",
    qty: "Cant.",
    unit: "Unidad",
    unitCost: "Costo Unit. Est.",
    add: "+ AGREGAR ARTÍCULO / DESCRIPCIÓN",
    shipping: "ENVÍO ESTIMADO",
    total: "TOTAL ESTIMADO",
    charge: "CARGAR A",
    cost: "CÓDIGO DE COSTO (OPCIONAL)",
    notes: "NOTAS (OPCIONAL)",
    attach: "ARCHIVOS ADJUNTOS (OPCIONAL)",
    addAttach: "AGREGAR ARCHIVO",
    attachmentQueued: "Archivo preparado",
    cancel: "CANCELAR",
    cancelSub: "Descartar cambios",
    save: "CREAR SOLICITUD / OC",
    saving: "GUARDANDO…",
    saveSub: "Regresar a la Orden de Trabajo",
    foot: "Esta solicitud / OC se relacionará con la orden y se registrará mediante IXI Financial.",
    required: "Proveedor, fecha válida y al menos un artículo válido son obligatorios.",
    saveFailed: "No se pudo guardar la compra. No se agregó nada a la Orden de Trabajo. Corrige el problema e inténtalo de nuevo.",
    normal: "Normal",
    high: "Alta",
    critical: "Crítica"
  }
};

function blankLine() {
  return {
    lineId: `LINE-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    description: "",
    quantity: 1,
    unit: "EA",
    estimatedUnitCost: ""
  };
}

function createClientRequestId() {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto?.randomUUID
  ) {
    return `PUR-${globalThis.crypto.randomUUID()}`;
  }

  return `PUR-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export default function IXIPurchaseApp({
  context = {},
  workOrder = {},
  language = "en",
  onLanguageChange = null,
  onCancel = null,
  onSave = null
}) {
  const [lang, setLangLocal] = useState(language === "es" ? "es" : "en");
  const [requestType, setRequestType] = useState("purchase-request");
  const [vendorLabel, setVendorLabel] = useState("");
  const [neededByDate, setNeededByDate] = useState("");
  const [priority, setPriority] = useState("normal");
  const [items, setItems] = useState([blankLine()]);
  const [shipping, setShipping] = useState("");
  const [costCode, setCostCode] = useState("");
  const [notes, setNotes] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  const clientRequestIdRef = useRef(createClientRequestId());
  const t = COPY[lang];
  const primary = context.primary || {};
  const location = context.location || {};
  const actor = context.actor || {};
  const workOrderNumber = clean(
    workOrder.identity?.number ||
    workOrder.workOrderNumber ||
    workOrder.number
  ) || "WORK ORDER";
  const workOrderId = clean(workOrder.identity?.workOrderId);

  const input = useMemo(
    () => ({
      clientRequestId: clientRequestIdRef.current,
      requestType,
      vendorLabel,
      neededByDate,
      priority,
      items,
      estimatedShipping: Number(shipping || 0),
      chargeTo: workOrderNumber,
      costCode,
      currency: "USD",
      notes,
      attachments: attachment
        ? [
            {
              type: "purchase-support",
              fileName: attachment.name,
              mimeType: attachment.type,
              size: attachment.size,
              status: "local-pending-upload"
            }
          ]
        : []
    }),
    [
      requestType,
      vendorLabel,
      neededByDate,
      priority,
      items,
      shipping,
      workOrderNumber,
      costCode,
      notes,
      attachment
    ]
  );

  const draft = useMemo(
    () => createIXIPurchaseDraft({ context, workOrder, input }),
    [context, workOrder, input]
  );

  function setLang(nextLanguage) {
    setLangLocal(nextLanguage);
    onLanguageChange?.(nextLanguage);
  }

  function patchItem(index, key, value) {
    setItems(current =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [key]: value }
          : item
      )
    );
  }

  function removeItem(index) {
    setItems(current => {
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      return next.length ? next : [blankLine()];
    });
  }

  async function save() {
    if (saving) {
      return;
    }

    const nextDraft = createIXIPurchaseDraft({
      context,
      workOrder,
      input
    });
    const validation = validateIXIPurchase(nextDraft);

    setErrors(validation.errors);
    setSaveError("");

    if (!validation.valid) {
      return;
    }

    setSaving(true);

    try {
      let persisted = null;

      if (clean(primary.passportId) && workOrderId) {
        persisted = await createIXIPurchase({
          object: {
            passportId: primary.passportId,
            objectType: primary.objectType,
            label: primary.label
          },
          context,
          workOrder,
          input,
          metadata: {
            source: "ixi-transact-work-order-purchase"
          }
        });
      }

      await onSave?.(
        persisted?.draft || nextDraft,
        input,
        persisted?.response || null
      );
    } catch (error) {
      console.error("IXI TRAN$ACT PURCHASE SAVE FAILED", error);
      setSaveError(clean(error?.message) || t.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="tx-purchase">
      <div className="po-lang" aria-label="Language">
        <button
          type="button"
          className={lang === "en" ? "on" : ""}
          onClick={() => setLang("en")}
          disabled={saving}
        >
          ENG
        </button>
        <span>/</span>
        <button
          type="button"
          className={lang === "es" ? "on" : ""}
          onClick={() => setLang("es")}
          disabled={saving}
        >
          ESP
        </button>
      </div>

      <div className="po-head">
        <div className="po-icon" aria-hidden="true">🛒</div>
        <div className="po-title">
          <strong>{t.title}</strong>
          <div className="po-context">
            <div><b>{primary.label || "—"}</b><small>{t.machine}</small></div>
            <div><b>{workOrderNumber}</b><small>{t.wo}</small></div>
            <div><b>{location.label || "—"}</b><small>{t.location}</small></div>
            <div><b>{actor.displayName || actor.name || actor.label || "—"}</b><small>{t.employee}</small></div>
          </div>
        </div>
      </div>

      <div className="po-section">{t.details}</div>

      <label>{t.type} <em>*</em></label>
      <div className="po-modes">
        <button
          type="button"
          className={requestType === "purchase-request" ? "on" : ""}
          onClick={() => setRequestType("purchase-request")}
          disabled={saving}
        >
          {t.request}
        </button>
        <button
          type="button"
          className={requestType === "purchase-order" ? "on" : ""}
          onClick={() => setRequestType("purchase-order")}
          disabled={saving}
        >
          {t.po}
        </button>
      </div>

      <label>{t.vendor} <em>*</em></label>
      <div className={`po-field ${errors.vendor ? "invalid" : ""}`}>
        <span aria-hidden="true">▣</span>
        <input
          value={vendorLabel}
          onChange={event => setVendorLabel(event.target.value)}
          disabled={saving}
          autoComplete="organization"
        />
      </div>

      <div className="po-two">
        <div>
          <label>{t.needed} <em>*</em></label>
          <div className={`po-field ${errors.neededByDate ? "invalid" : ""}`}>
            <input
              type="date"
              value={neededByDate}
              onChange={event => setNeededByDate(event.target.value)}
              disabled={saving}
            />
          </div>
        </div>
        <div>
          <label>{t.priority}</label>
          <div className="po-field">
            <select
              value={priority}
              onChange={event => setPriority(event.target.value)}
              disabled={saving}
            >
              <option value="normal">{t.normal}</option>
              <option value="high">{t.high}</option>
              <option value="critical">{t.critical}</option>
            </select>
          </div>
        </div>
      </div>

      <label>{t.items} <em>*</em></label>
      <div className={`po-lines ${errors.items || errors.itemLine ? "invalid" : ""}`}>
        <div className="po-line-head" aria-hidden="true">
          <span>{t.description}</span>
          <span>{t.qty}</span>
          <span>{t.unit}</span>
          <span>{t.unitCost}</span>
          <span />
        </div>

        {items.map((item, index) => (
          <div className="po-line" key={item.lineId || index}>
            <input
              aria-label={t.description}
              value={item.description}
              onChange={event => patchItem(index, "description", event.target.value)}
              placeholder={t.description}
              disabled={saving}
            />
            <input
              aria-label={t.qty}
              inputMode="decimal"
              value={item.quantity}
              onChange={event => patchItem(index, "quantity", event.target.value)}
              disabled={saving}
            />
            <select
              aria-label={t.unit}
              value={item.unit}
              onChange={event => patchItem(index, "unit", event.target.value)}
              disabled={saving}
            >
              <option>EA</option>
              <option>FT</option>
              <option>YD</option>
              <option>HR</option>
              <option>GAL</option>
            </select>
            <input
              aria-label={t.unitCost}
              inputMode="decimal"
              value={item.estimatedUnitCost}
              onChange={event => patchItem(index, "estimatedUnitCost", event.target.value)}
              placeholder="$"
              disabled={saving}
            />
            <button
              type="button"
              aria-label="Remove item"
              onClick={() => removeItem(index)}
              disabled={saving}
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          className="po-add"
          onClick={() => setItems(current => [...current, blankLine()])}
          disabled={saving}
        >
          {t.add}
        </button>
      </div>

      <div className="po-two">
        <div>
          <label>{t.shipping}</label>
          <div className="po-field">
            <span aria-hidden="true">$</span>
            <input
              inputMode="decimal"
              value={shipping}
              onChange={event => setShipping(event.target.value)}
              disabled={saving}
            />
          </div>
        </div>
        <div>
          <label>{t.total}</label>
          <div className="po-field">
            <span aria-hidden="true">▤</span>
            <input
              className="po-total"
              readOnly
              value={`$${draft.purchase.estimatedTotal.toFixed(2)}`}
            />
          </div>
        </div>
      </div>

      <div className="po-two">
        <div>
          <label>{t.charge} <em>*</em></label>
          <div className="po-field locked-field">
            <input readOnly value={workOrderNumber} />
          </div>
        </div>
        <div>
          <label>{t.cost}</label>
          <div className="po-field">
            <input
              value={costCode}
              onChange={event => setCostCode(event.target.value)}
              disabled={saving}
            />
          </div>
        </div>
      </div>

      <label>{t.notes}</label>
      <textarea
        className="po-notes"
        value={notes}
        onChange={event => setNotes(event.target.value)}
        disabled={saving}
      />

      <label>{t.attach}</label>
      <div className="po-attach">
        <label className="po-file-button">
          <span>⌕ {t.addAttach}</span>
          <small>{attachment ? `${t.attachmentQueued}: ${attachment.name}` : "PDF / JPG / PNG"}</small>
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            onChange={event => setAttachment(event.target.files?.[0] || null)}
            disabled={saving}
          />
        </label>
      </div>

      {Object.keys(errors).length ? (
        <div className="po-errors" role="alert">{t.required}</div>
      ) : null}

      {saveError ? (
        <div className="po-errors po-save-error" role="alert">
          {saveError === t.saveFailed ? saveError : `${t.saveFailed} (${saveError})`}
        </div>
      ) : null}

      <div className="po-actions">
        <button
          type="button"
          onClick={() => onCancel?.()}
          disabled={saving}
        >
          {t.cancel}
          <small>{t.cancelSub}</small>
        </button>
        <button
          type="button"
          className="save"
          onClick={save}
          disabled={saving}
        >
          {saving ? t.saving : t.save}
          <small>{t.saveSub}</small>
        </button>
      </div>

      <div className="po-foot">ⓘ {t.foot}</div>
      <IXIPurchaseStyles />
    </div>
  );
}
