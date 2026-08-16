import { useMemo, useRef, useState } from "react";

import { createIXIPurchaseDraft, validateIXIPurchase } from "./IXIPurchaseContract";
import { createIXIPurchase, issueIXIPurchaseOrderFromRecord } from "./IXIPurchaseCommands";
import { applyIXIPurchaseAction, appendIXIPurchaseRelated } from "./IXIPurchaseRecordEngine";
import { IXI_PURCHASE_ACTIONS, evaluateIXIPurchaseRuntime, resolveIXIPurchasingPolicy } from "./IXIPurchasePolicyEngine";
import { createIXIPendingAttachment, validateIXITransactFile } from "../../IXITransactFilePolicy";
import IXIPurchaseCard from "./IXIPurchaseCard";
import IXIPurchaseStyles from "./IXIPurchaseStyles";

const clean = value => String(value ?? "").trim();
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
const PURCHASE_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];

const COPY = {
  en: {
    title: "NEW PURCHASE REQUEST", sub: "Request company purchasing approval", object: "Origin", wo: "Work Order", location: "Location", employee: "Requested By",
    details: "PURCHASE REQUEST", mode: "PURCHASE PATH", request: "PURCHASE REQUEST", directPo: "DIRECT PURCHASE ORDER", directPoDenied: "Direct PO is controlled by your purchasing authority.",
    vendor: "VENDOR / SUPPLIER", vendorOptional: "VENDOR / SUPPLIER (OPTIONAL)", needed: "NEEDED BY", priority: "PRIORITY", what: "WHAT DO YOU NEED?", why: "WHY DO YOU NEED IT?",
    items: "ITEMS", description: "Description", qty: "Qty", unit: "Unit", unitCost: "Est. Unit Cost", add: "+ ADD ITEM", shipping: "ESTIMATED SHIPPING", total: "ESTIMATED TOTAL",
    charge: "CHARGE TO", cost: "COST CODE (OPTIONAL)", attachments: "QUOTES / SUPPORTING DOCUMENTS", attach: "ADD PDF / JPG / PNG", notes: "ADDITIONAL NOTES (OPTIONAL)",
    cancel: "CANCEL", cancelSub: "Return without saving", save: "SUBMIT PURCHASE REQUEST", savePo: "ISSUE PURCHASE ORDER", saving: "SAVING…", saveSub: "Create canonical Purchase record",
    required: "Complete the required Purchase fields before submission.", saveFailed: "Purchase could not be created. Nothing was committed.", normal: "Normal", high: "High", critical: "Critical",
    quotesRequired: "QUOTE REQUIREMENT", authority: "APPROVAL AUTHORITY", directLimit: "DIRECT PO LIMIT"
  },
  es: {
    title: "NUEVA SOLICITUD DE COMPRA", sub: "Solicitar autorización de compra de la empresa", object: "Origen", wo: "Orden de Trabajo", location: "Ubicación", employee: "Solicitado Por",
    details: "SOLICITUD DE COMPRA", mode: "RUTA DE COMPRA", request: "SOLICITUD DE COMPRA", directPo: "ORDEN DE COMPRA DIRECTA", directPoDenied: "La OC directa depende de su autoridad de compra.",
    vendor: "PROVEEDOR", vendorOptional: "PROVEEDOR (OPCIONAL)", needed: "FECHA NECESARIA", priority: "PRIORIDAD", what: "¿QUÉ NECESITA?", why: "¿POR QUÉ LO NECESITA?",
    items: "ARTÍCULOS", description: "Descripción", qty: "Cant.", unit: "Unidad", unitCost: "Costo Unit. Est.", add: "+ AGREGAR ARTÍCULO", shipping: "ENVÍO ESTIMADO", total: "TOTAL ESTIMADO",
    charge: "CARGAR A", cost: "CÓDIGO DE COSTO (OPCIONAL)", attachments: "COTIZACIONES / DOCUMENTOS", attach: "AGREGAR PDF / JPG / PNG", notes: "NOTAS ADICIONALES (OPCIONAL)",
    cancel: "CANCELAR", cancelSub: "Regresar sin guardar", save: "ENVIAR SOLICITUD", savePo: "EMITIR ORDEN DE COMPRA", saving: "GUARDANDO…", saveSub: "Crear registro canónico de Compra",
    required: "Complete los campos requeridos antes de enviar.", saveFailed: "No se pudo crear la compra. No se comprometió ningún gasto.", normal: "Normal", high: "Alta", critical: "Crítica",
    quotesRequired: "REQUISITO DE COTIZACIONES", authority: "AUTORIDAD DE APROBACIÓN", directLimit: "LÍMITE DE OC DIRECTA"
  }
};

function blankLine() {
  return { lineId: `LINE-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, description: "", quantity: 1, unit: "EA", estimatedUnitCost: "" };
}

function createClientRequestId() {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) return `PUR-${globalThis.crypto.randomUUID()}`;
  return `PUR-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function todayPlus(days = 3) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function relatedRecords(context = {}, workOrder = {}) {
  return [
    { id: clean(context.primary?.objectId || context.primary?.passportId), label: clean(context.primary?.label), type: clean(context.primary?.objectType || "Object") },
    { id: clean(workOrder?.identity?.workOrderId || workOrder?.identity?.number || workOrder?.workOrderNumber), label: clean(workOrder?.identity?.number || workOrder?.workOrderNumber || workOrder?.number), type: "Work Order" },
    { id: clean(context.location?.objectId || context.location?.passportId), label: clean(context.location?.label), type: "Location" },
    { id: clean(context.actor?.employeeId || context.actor?.passportId || context.actor?.userId), label: clean(context.actor?.displayName || context.actor?.name || context.actor?.label), type: "Employee" }
  ].filter(item => item.id && item.label);
}

export default function IXIPurchaseApp({
  context = {}, workOrder = {}, initialPurchase = null, language = "en", onLanguageChange = null, onCancel = null, onSave = null,
  onPurchaseChange = null, purchasingPolicy = null, purchasingAuthority = null
}) {
  const [localLanguage, setLocalLanguage] = useState(language === "es" ? "es" : "en");
  const [record, setRecord] = useState(initialPurchase || null);
  const [requestType, setRequestType] = useState("purchase-request");
  const [vendorLabel, setVendorLabel] = useState("");
  const [neededByDate, setNeededByDate] = useState(todayPlus(3));
  const [priority, setPriority] = useState("normal");
  const [whatNeeded, setWhatNeeded] = useState("");
  const [businessReason, setBusinessReason] = useState("");
  const [items, setItems] = useState([blankLine()]);
  const [shipping, setShipping] = useState("");
  const [costCode, setCostCode] = useState("");
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  const requestIdRef = useRef(createClientRequestId());
  const lang = language === "es" || localLanguage === "es" ? "es" : "en";
  const t = COPY[lang];
  const policy = useMemo(() => resolveIXIPurchasingPolicy(context, purchasingPolicy), [context, purchasingPolicy]);
  const primary = context.primary || {};
  const location = context.location || {};
  const actor = context.actor || {};
  const workOrderNumber = clean(workOrder?.identity?.number || workOrder?.workOrderNumber || workOrder?.number);
  const chargeTo = workOrderNumber || clean(primary.label) || "AOS OBJECT";

  const pendingAttachments = useMemo(
    () => attachments.map(item => createIXIPendingAttachment(item.file, { type: "purchase-support" })),
    [attachments]
  );

  const input = useMemo(() => ({
    clientRequestId: requestIdRef.current, requestType, vendorLabel, neededByDate, priority, whatNeeded, businessReason, items,
    estimatedShipping: Number(shipping || 0), shipToId: clean(location.objectId || location.id), shipToPassportId: clean(location.passportId),
    shipToLabel: clean(location.label), chargeTo, costCode, currency: "USD", notes, quoteCount: attachments.length, attachments: pendingAttachments
  }), [requestType, vendorLabel, neededByDate, priority, whatNeeded, businessReason, items, shipping, location, chargeTo, costCode, notes, attachments.length, pendingAttachments]);

  const draft = useMemo(() => createIXIPurchaseDraft({ context, workOrder, input }), [context, workOrder, input]);
  const runtime = useMemo(() => evaluateIXIPurchaseRuntime({ context, purchase: draft, policy, authority: purchasingAuthority }), [context, draft, policy, purchasingAuthority]);

  function changeLanguage(next) { setLocalLanguage(next); onLanguageChange?.(next); }
  function patchItem(index, key, value) { setItems(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item)); }
  function removeItem(index) { setItems(current => { const next = current.filter((_, itemIndex) => itemIndex !== index); return next.length ? next : [blankLine()]; }); }

  function addFiles(files) {
    const next = [];
    const rejected = [];
    for (const file of Array.from(files || [])) {
      const validation = validateIXITransactFile(file, { maxBytes: MAX_ATTACHMENT_BYTES, allowedMimeTypes: PURCHASE_MIME_TYPES, allowedExtensions: [".pdf", ".jpg", ".jpeg", ".png"] });
      if (!validation.valid) { rejected.push(validation.message); continue; }
      next.push({ file, key: `${file.name}:${file.size}:${file.lastModified}` });
    }
    if (next.length) setAttachments(current => { const map = new Map(current.map(item => [item.key, item])); next.forEach(item => map.set(item.key, item)); return [...map.values()]; });
    setErrors(current => ({ ...current, attachments: rejected[0] || undefined }));
  }

  async function submit() {
    if (saving) return;
    const validation = validateIXIPurchase(draft, { requireVendor: policy.request.requireVendor !== false, requireBusinessReason: policy.request.requireBusinessReason !== false });
    const nextErrors = { ...validation.errors };
    if (runtime.quoteRequirement.requiredQuotes > attachments.length) nextErrors.attachments = `${runtime.quoteRequirement.requiredQuotes} quote(s) required by company policy.`;
    if (requestType === "purchase-order" && !runtime.canDirectPo) nextErrors.requestType = t.directPoDenied;
    setErrors(nextErrors);
    setSaveError("");
    if (Object.values(nextErrors).some(Boolean)) return;

    setSaving(true);
    try {
      const persisted = await createIXIPurchase({
        object: { passportId: primary.passportId, objectId: primary.objectId || primary.id, objectType: primary.objectType, label: primary.label },
        context, workOrder, input, policy, authority: purchasingAuthority,
        metadata: { source: workOrderNumber ? "ixi-transact-work-order-purchase" : "ixi-transact-object-purchase" }
      });

      let nextRecord = persisted.record;
      for (const related of relatedRecords(context, workOrder)) nextRecord = appendIXIPurchaseRelated(nextRecord, related);
      if (vendorLabel) nextRecord = appendIXIPurchaseRelated(nextRecord, { id: clean(input.vendorId || `vendor:${vendorLabel.toLowerCase()}`), label: vendorLabel, type: "Vendor" });

      await onSave?.(persisted.draft, { ...input, files: attachments.map(item => item.file), purchaseRecord: nextRecord }, persisted.response);
      await onPurchaseChange?.(nextRecord, { action: "created", persisted });
      setRecord(nextRecord);
    } catch (error) {
      setSaveError(clean(error?.message) || t.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function purchaseAction(action, payload = {}) {
    if (!record || saving) return;
    setSaving(true);
    setSaveError("");

    try {
      let baseRecord = record;
      let persistence = null;

      if (action === IXI_PURCHASE_ACTIONS.ISSUE_PO) {
        persistence = await issueIXIPurchaseOrderFromRecord({
          object: {
            passportId: primary.passportId,
            objectId: primary.objectId || primary.id,
            objectType: primary.objectType,
            label: primary.label
          },
          context,
          record,
          policy,
          authority: purchasingAuthority,
          metadata: {
            source: workOrderNumber
              ? "ixi-transact-work-order-issue-po"
              : "ixi-transact-object-issue-po"
          }
        });

        baseRecord = persistence.record;
      }

      const next = applyIXIPurchaseAction({
        record: baseRecord,
        action,
        context,
        policy,
        authority: purchasingAuthority,
        actor,
        payload
      });

      // The parent/IX-Core integration seam is authoritative for non-financial
      // Purchase lifecycle persistence. Do not advance visible state until that
      // callback resolves. This gives us rollback-safe behavior even before the
      // dedicated Purchase Record persistence service is introduced.
      await onPurchaseChange?.(next, {
        action,
        payload,
        previous: record,
        persistence
      });

      setRecord(next);
    } catch (error) {
      setSaveError(clean(error?.message) || "Purchase action failed.");
    } finally {
      setSaving(false);
    }
  }

  if (record) {
    return <IXIPurchaseCard record={record} context={context} policy={policy} authority={purchasingAuthority} language={lang} onLanguageChange={changeLanguage} onAction={purchaseAction} busy={saving} error={saveError} />;
  }

  return (
    <div className="tx-purchase">
      <div className="po-lang" aria-label="Language"><button type="button" className={lang === "en" ? "on" : ""} onClick={() => changeLanguage("en")} disabled={saving}>ENG</button><span>/</span><button type="button" className={lang === "es" ? "on" : ""} onClick={() => changeLanguage("es")} disabled={saving}>ESP</button></div>
      <div className="po-head"><div className="po-icon" aria-hidden="true">$</div><div className="po-title"><strong>{t.title}</strong><small style={{ color: "#999", fontSize: 8 }}>{t.sub}</small><div className="po-context"><div><b>{primary.label || "—"}</b><small>{t.object}</small></div><div><b>{workOrderNumber || "—"}</b><small>{t.wo}</small></div><div><b>{location.label || "—"}</b><small>{t.location}</small></div><div><b>{actor.displayName || actor.name || actor.label || "—"}</b><small>{t.employee}</small></div></div></div></div>
      <div className="po-section">{t.details}</div>

      <label>{t.mode} <em>*</em></label>
      <div className="po-modes"><button type="button" className={requestType === "purchase-request" ? "on" : ""} onClick={() => setRequestType("purchase-request")} disabled={saving}>{t.request}</button><button type="button" className={requestType === "purchase-order" ? "on" : ""} onClick={() => runtime.canDirectPo && setRequestType("purchase-order")} disabled={saving || !runtime.canDirectPo} title={!runtime.canDirectPo ? t.directPoDenied : ""}>{t.directPo}</button></div>
      {errors.requestType ? <div className="po-errors">{errors.requestType}</div> : null}

      <div className="po-two"><div><label>{t.authority}</label><div className="po-field locked-field"><input readOnly value={runtime.approval?.label || "Company policy"} /></div></div><div><label>{t.directLimit}</label><div className="po-field locked-field"><input readOnly value={runtime.directPoLimit >= Number.MAX_SAFE_INTEGER ? "UNLIMITED" : `$${Number(runtime.directPoLimit || 0).toLocaleString()}`} /></div></div></div>

      <label>{policy.request.requireVendor === false ? t.vendorOptional : t.vendor} {policy.request.requireVendor === false ? null : <em>*</em>}</label>
      <div className={`po-field ${errors.vendor ? "invalid" : ""}`}><span>▣</span><input value={vendorLabel} onChange={event => setVendorLabel(event.target.value)} disabled={saving} autoComplete="organization" /></div>

      <div className="po-two"><div><label>{t.needed} <em>*</em></label><div className={`po-field ${errors.neededByDate ? "invalid" : ""}`}><input type="date" value={neededByDate} onChange={event => setNeededByDate(event.target.value)} disabled={saving} /></div></div><div><label>{t.priority}</label><div className="po-field"><select value={priority} onChange={event => setPriority(event.target.value)} disabled={saving}><option value="normal">{t.normal}</option><option value="high">{t.high}</option><option value="critical">{t.critical}</option></select></div></div></div>

      <label>{t.what} <em>*</em></label><textarea className="po-notes" value={whatNeeded} onChange={event => setWhatNeeded(event.target.value)} disabled={saving} placeholder="CAT 336 hydraulic pump seal kit, filter and oil." />
      <label>{t.why} {policy.request.requireBusinessReason !== false ? <em>*</em> : null}</label><textarea className={`po-notes ${errors.businessReason ? "invalid" : ""}`} value={businessReason} onChange={event => setBusinessReason(event.target.value)} disabled={saving} placeholder="Machine is down; parts are required to complete repair and return it to service." />

      <label>{t.items} <em>*</em></label>
      <div className={`po-lines ${errors.items || errors.itemLine ? "invalid" : ""}`}><div className="po-line-head"><span>{t.description}</span><span>{t.qty}</span><span>{t.unit}</span><span>{t.unitCost}</span><span /></div>{items.map((item, index) => <div className="po-line" key={item.lineId || index}><input value={item.description} onChange={event => patchItem(index, "description", event.target.value)} disabled={saving} /><input inputMode="decimal" value={item.quantity} onChange={event => patchItem(index, "quantity", event.target.value)} disabled={saving} /><select value={item.unit} onChange={event => patchItem(index, "unit", event.target.value)} disabled={saving}><option>EA</option><option>FT</option><option>YD</option><option>HR</option><option>GAL</option></select><input inputMode="decimal" value={item.estimatedUnitCost} onChange={event => patchItem(index, "estimatedUnitCost", event.target.value)} disabled={saving} placeholder="$" /><button type="button" onClick={() => removeItem(index)} disabled={saving}>×</button></div>)}<button type="button" className="po-add" onClick={() => setItems(current => [...current, blankLine()])} disabled={saving}>{t.add}</button></div>

      <div className="po-two"><div><label>{t.shipping}</label><div className="po-field"><span>$</span><input inputMode="decimal" value={shipping} onChange={event => setShipping(event.target.value)} disabled={saving} /></div></div><div><label>{t.total}</label><div className="po-field"><span>▤</span><input className="po-total" readOnly value={`$${draft.purchase.estimatedTotal.toFixed(2)}`} /></div></div></div>
      <div className="po-two"><div><label>{t.charge}</label><div className="po-field locked-field"><input readOnly value={chargeTo} /></div></div><div><label>{t.cost}</label><div className="po-field"><input value={costCode} onChange={event => setCostCode(event.target.value)} disabled={saving} /></div></div></div>

      <label>{t.attachments}</label><div className={`po-attach ${errors.attachments ? "invalid" : ""}`}><label className="po-file-button"><input type="file" accept="application/pdf,image/jpeg,image/png" multiple onChange={event => addFiles(event.target.files)} disabled={saving} /><span>{t.attach}</span><small>{attachments.length ? `${attachments.length} file(s): ${attachments.map(item => item.file.name).join(", ")}` : "PDF / JPG / PNG · 25MB each"}</small></label></div>
      <div style={{ marginTop: 4, color: runtime.quoteRequirement.requiredQuotes > attachments.length ? "#ffc400" : "#77d66d", fontSize: 7, fontWeight: 900 }}>{t.quotesRequired}: {runtime.quoteRequirement.requiredQuotes} · {attachments.length} ATTACHED</div>

      <label>{t.notes}</label><textarea className="po-notes" value={notes} onChange={event => setNotes(event.target.value)} disabled={saving} />
      {Object.values(errors).some(Boolean) ? <div className="po-errors">{t.required}</div> : null}
      {saveError ? <div className="po-errors po-save-error">{saveError}</div> : null}
      <div className="po-actions"><button type="button" onClick={() => onCancel?.()} disabled={saving}>{t.cancel}<small>{t.cancelSub}</small></button><button type="button" className="save" onClick={submit} disabled={saving}>{saving ? t.saving : requestType === "purchase-order" ? t.savePo : t.save}<small>{t.saveSub}</small></button></div>
      <IXIPurchaseStyles />
    </div>
  );
}
