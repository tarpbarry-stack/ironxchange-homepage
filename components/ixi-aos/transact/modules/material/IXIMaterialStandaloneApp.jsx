import { useMemo, useRef, useState } from "react";

import { createIXIMaterialUsage } from "./IXIMaterialCommands";
import { createIXIMaterialDraft, validateIXIMaterial } from "./IXIMaterialContract";
import IXIMaterialStandaloneStyles from "./IXIMaterialStandaloneStyles";

const clean = value => String(value ?? "").trim();
const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;

const COPY = {
  en: {
    title: "PART / MATERIAL",
    sub: "Record material consumed",
    source: "SOURCE OF MATERIAL",
    inventory: "FROM INVENTORY",
    po: "FROM PO / RECEIVED",
    supply: "EXISTING SUPPLY",
    item: "PART / MATERIAL",
    sku: "PART / SKU",
    poNumber: "PURCHASE ORDER",
    receivedItem: "RECEIVED ITEM",
    qty: "QTY TO USE",
    unit: "UNIT",
    unitCost: "UNIT COST",
    cost: "COST TO THIS WORK",
    available: "AVAILABLE",
    sourceLocation: "SOURCE LOCATION",
    date: "DATE USED",
    note: "OPTIONAL NOTE",
    notePh: "What was used / where / why...",
    usedOn: "USED ON",
    relatedWork: "RELATED WORK",
    location: "LOCATION",
    employee: "EMPLOYEE",
    cancel: "CANCEL",
    use: "USE MATERIAL",
    saving: "SAVING...",
    saved: "MATERIAL RECORDED",
    saveAnother: "RECORD ANOTHER",
    inventoryPolicy: "Inventory usage records a pending decrement instruction. Stock is not claimed reduced until the inventory service confirms it.",
    poPolicy: "PO usage consumes from received supply and links back to the PO/receiving record. It does not create another purchase.",
    supplyPolicy: "Existing supply records physical consumption only. No new Expense or Purchase is created.",
    footer: "Material Usage attributes physical cost to this AOS context. It is not a second cash-spend event.",
    required: "Complete the required material, quantity, cost, date and source information.",
    exceeds: "Quantity exceeds the available received/supplied quantity.",
    object: "ORIGIN",
    noPo: "Enter PO number",
    noInventory: "Enter or scan inventory item"
  },
  es: {
    title: "PARTE / MATERIAL",
    sub: "Registrar material consumido",
    source: "ORIGEN DEL MATERIAL",
    inventory: "DEL INVENTARIO",
    po: "DE OC / RECIBIDO",
    supply: "SUMINISTRO EXISTENTE",
    item: "PARTE / MATERIAL",
    sku: "PARTE / SKU",
    poNumber: "ORDEN DE COMPRA",
    receivedItem: "ARTÍCULO RECIBIDO",
    qty: "CANTIDAD A USAR",
    unit: "UNIDAD",
    unitCost: "COSTO UNITARIO",
    cost: "COSTO A ESTE TRABAJO",
    available: "DISPONIBLE",
    sourceLocation: "UBICACIÓN DE ORIGEN",
    date: "FECHA DE USO",
    note: "NOTA OPCIONAL",
    notePh: "Qué se usó / dónde / por qué...",
    usedOn: "USADO EN",
    relatedWork: "TRABAJO RELACIONADO",
    location: "UBICACIÓN",
    employee: "EMPLEADO",
    cancel: "CANCELAR",
    use: "USAR MATERIAL",
    saving: "GUARDANDO...",
    saved: "MATERIAL REGISTRADO",
    saveAnother: "REGISTRAR OTRO",
    inventoryPolicy: "El uso de inventario registra una instrucción pendiente de decremento. No se afirma que el stock bajó hasta que el servicio de inventario lo confirme.",
    poPolicy: "El uso desde OC consume suministro recibido y se vincula a la OC/recepción. No crea otra compra.",
    supplyPolicy: "Suministro existente registra solo consumo físico. No crea otro Gasto ni Compra.",
    footer: "Uso de Material atribuye costo físico a este contexto AOS. No es un segundo evento de gasto de efectivo.",
    required: "Completa material, cantidad, costo, fecha y origen requeridos.",
    exceeds: "La cantidad excede lo disponible recibido/suministrado.",
    object: "ORIGEN",
    noPo: "Ingresa número de OC",
    noInventory: "Ingresa o escanea artículo de inventario"
  }
};

function createClientId() {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return `MAT-${globalThis.crypto.randomUUID()}`;
  }
  return `MAT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeInventoryItems(object = {}, inventoryItems = []) {
  const candidates = Array.isArray(inventoryItems) && inventoryItems.length
    ? inventoryItems
    : Array.isArray(object?.inventoryItems)
      ? object.inventoryItems
      : Array.isArray(object?.fields?.inventoryItems)
        ? object.fields.inventoryItems
        : [];
  return candidates.map((item, index) => ({
    id: clean(item.inventoryItemId || item.id || item.objectId) || `INV-${index + 1}`,
    passportId: clean(item.inventoryPassportId || item.passportId),
    description: clean(item.description || item.name || item.label || item.title),
    sku: clean(item.sku || item.partNumber || item.partNo),
    available: Math.max(0, num(item.availableQuantity ?? item.quantityAvailable ?? item.onHand ?? item.quantity)),
    unit: clean(item.unit || "EA").toUpperCase(),
    unitCost: Math.max(0, num(item.unitCost ?? item.averageCost ?? item.cost)),
    sourceLocationId: clean(item.locationId || item.sourceLocationId),
    sourceLocationLabel: clean(item.locationLabel || item.sourceLocationLabel || item.location)
  })).filter(item => item.description || item.sku);
}

function normalizePoLines(object = {}, purchaseOrderLines = []) {
  const candidates = Array.isArray(purchaseOrderLines) && purchaseOrderLines.length
    ? purchaseOrderLines
    : Array.isArray(object?.purchaseOrderLines)
      ? object.purchaseOrderLines
      : Array.isArray(object?.fields?.purchaseOrderLines)
        ? object.fields.purchaseOrderLines
        : [];
  return candidates.map((line, index) => {
    const received = Math.max(0, num(line.receivedQuantity ?? line.received ?? line.quantityReceived));
    const consumed = Math.max(0, num(line.consumedQuantity ?? line.usedQuantity ?? line.quantityUsed));
    const explicitAvailable = line.availableQuantity ?? line.remainingQuantity;
    return {
      id: clean(line.purchaseOrderLineId || line.lineId || line.id) || `POL-${index + 1}`,
      purchaseOrderId: clean(line.purchaseOrderId || line.poId),
      purchaseOrderNumber: clean(line.purchaseOrderNumber || line.poNumber || line.po),
      receivingRecordId: clean(line.receivingRecordId || line.receiptId),
      description: clean(line.description || line.name || line.label),
      sku: clean(line.sku || line.partNumber),
      received,
      available: Math.max(0, num(explicitAvailable ?? (received - consumed))),
      unit: clean(line.unit || "EA").toUpperCase(),
      unitCost: Math.max(0, num(line.unitCost ?? line.cost))
    };
  }).filter(line => line.description || line.purchaseOrderNumber);
}

export default function IXIMaterialStandaloneApp({
  context = {},
  object = {},
  inventoryItems = [],
  purchaseOrderLines = [],
  language = "en",
  onLanguageChange = null,
  onBack = null,
  onRecordChange = null
}) {
  const [lang, setLangLocal] = useState(language === "es" ? "es" : "en");
  const [source, setSource] = useState("inventory");
  const [inventoryId, setInventoryId] = useState("");
  const [poLineId, setPoLineId] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("EA");
  const [unitCost, setUnitCost] = useState("");
  const [availableQuantity, setAvailableQuantity] = useState(0);
  const [sourceLocationLabel, setSourceLocationLabel] = useState(clean(context.location?.label));
  const [dateUsed, setDateUsed] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const requestIdRef = useRef(createClientId());

  const t = COPY[lang];
  const inventory = useMemo(() => normalizeInventoryItems(object, inventoryItems), [object, inventoryItems]);
  const poLines = useMemo(() => normalizePoLines(object, purchaseOrderLines), [object, purchaseOrderLines]);
  const primary = context.primary || {};
  const actor = context.actor || {};
  const location = context.location || {};
  const workOrder = context.activeWorkOrder || {};
  const workNumber = clean(workOrder?.identity?.number || workOrder?.workOrderNumber || workOrder?.number);
  const extendedCost = Math.round(Math.max(0, num(quantity)) * Math.max(0, num(unitCost)) * 100) / 100;

  function setLang(next) {
    setLangLocal(next);
    onLanguageChange?.(next);
  }

  function chooseInventory(id) {
    setInventoryId(id);
    const item = inventory.find(entry => entry.id === id);
    if (!item) return;
    setDescription(item.description);
    setSku(item.sku);
    setUnit(item.unit || "EA");
    setUnitCost(String(item.unitCost || 0));
    setAvailableQuantity(item.available);
    setSourceLocationLabel(item.sourceLocationLabel || clean(location.label));
  }

  function choosePoLine(id) {
    setPoLineId(id);
    const line = poLines.find(entry => entry.id === id);
    if (!line) return;
    setDescription(line.description);
    setSku(line.sku);
    setPurchaseOrderNumber(line.purchaseOrderNumber);
    setUnit(line.unit || "EA");
    setUnitCost(String(line.unitCost || 0));
    setAvailableQuantity(line.available);
  }

  function resetSource(nextSource) {
    setSource(nextSource);
    setErrors({});
    setInventoryId("");
    setPoLineId("");
    setDescription("");
    setSku("");
    setPurchaseOrderNumber("");
    setQuantity("1");
    setUnit("EA");
    setUnitCost("");
    setAvailableQuantity(0);
    setSourceLocationLabel(clean(location.label));
    setNotes("");
  }

  function resetAfterSave() {
    requestIdRef.current = createClientId();
    setSaved(null);
    resetSource(source);
  }

  async function save() {
    if (saving) return;
    const inventoryItem = inventory.find(entry => entry.id === inventoryId) || {};
    const poLine = poLines.find(entry => entry.id === poLineId) || {};
    const input = {
      clientRequestId: requestIdRef.current,
      source,
      description,
      sku,
      quantity: num(quantity),
      unit,
      unitCost: num(unitCost),
      availableQuantity,
      sourceLocationId: clean(inventoryItem.sourceLocationId),
      sourceLocationLabel,
      inventoryItemId: source === "inventory" ? clean(inventoryItem.id || inventoryId) : "",
      inventoryPassportId: source === "inventory" ? clean(inventoryItem.passportId) : "",
      purchaseOrderId: source === "purchase-order" ? clean(poLine.purchaseOrderId) : "",
      purchaseOrderNumber: source === "purchase-order" ? clean(poLine.purchaseOrderNumber || purchaseOrderNumber) : "",
      purchaseOrderLineId: source === "purchase-order" ? clean(poLine.id || poLineId) : "",
      receivingRecordId: source === "purchase-order" ? clean(poLine.receivingRecordId) : "",
      dateUsed,
      condition: "good",
      referenceNotes: source === "purchase-order" ? clean(poLine.receivingRecordId) : "",
      notes,
      attachments: []
    };

    const draft = createIXIMaterialDraft({ context, workOrder, input });
    const validation = validateIXIMaterial(draft);
    setErrors(validation.errors);
    if (!validation.valid) return;

    setSaving(true);
    try {
      const persisted = await createIXIMaterialUsage({
        object: {
          ...object,
          passportId: clean(object.passportId || primary.passportId),
          objectId: clean(object.objectId || primary.objectId),
          objectType: clean(object.objectType || primary.objectType),
          label: clean(object.label || object.displayName || object.name || primary.label)
        },
        context,
        workOrder,
        input,
        commandId: requestIdRef.current,
        idempotencyKey: `ixi-material:${requestIdRef.current}`,
        metadata: { source: "ixi-transact-standalone-material" }
      });
      const record = persisted?.draft || draft;
      await onRecordChange?.(record, {
        action: "material-save",
        response: persisted?.response || null,
        source,
        originatingObject: primary,
        inventoryAdjustment: record.inventoryAdjustment,
        receivingConsumption: record.receivingConsumption
      }, context);
      setSaved(record);
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="mat-v13">
        <div className="ms-saved">
          <div className="check">✓</div>
          <h3>{t.saved}</h3>
          <strong>{clean(saved.identity?.materialUsageId) || "MAT-#####"}</strong>
          <p>{saved.material?.description} · {saved.material?.quantity} {saved.material?.unit} · ${num(saved.material?.extendedCost).toFixed(2)}</p>
          <p>{clean(primary.label)} · {clean(saved.material?.source).replaceAll("-", " ").toUpperCase()}</p>
          <button onClick={resetAfterSave}>{t.saveAnother}</button>
        </div>
        <IXIMaterialStandaloneStyles />
      </div>
    );
  }

  const policy = source === "inventory" ? t.inventoryPolicy : source === "purchase-order" ? t.poPolicy : t.supplyPolicy;
  const quantityTooHigh = availableQuantity > 0 && num(quantity) > availableQuantity && source !== "existing-supply";

  return (
    <div className="mat-v13">
      <div className="ms-lang">
        <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>ENG</button><i>/</i>
        <button className={lang === "es" ? "on" : ""} onClick={() => setLang("es")}>ESP</button>
      </div>

      <div className="ms-head">
        <div className="ms-icon">◇</div>
        <div className="ms-title"><strong>{t.title}</strong><small>{t.sub}</small></div>
      </div>

      <div className="ms-context">
        <div><b>{clean(primary.label) || "AOS OBJECT"}</b><small>{t.object}</small></div>
        <div><b>{clean(location.label) || "—"}</b><small>{t.location}</small></div>
        <div><b>{clean(actor.displayName || actor.name || actor.label) || "—"}</b><small>{t.employee}</small></div>
      </div>

      <label>{t.source} <em>*</em></label>
      <div className="ms-source">
        <button className={source === "inventory" ? "on" : ""} onClick={() => resetSource("inventory")}><span>▣</span>{t.inventory}</button>
        <button className={source === "purchase-order" ? "on" : ""} onClick={() => resetSource("purchase-order")}><span>▤</span>{t.po}</button>
        <button className={source === "existing-supply" ? "on" : ""} onClick={() => resetSource("existing-supply")}><span>◇</span>{t.supply}</button>
      </div>

      {source === "inventory" && inventory.length ? (
        <><label>{t.item} <em>*</em></label><div className={`ms-field ${errors.description ? "bad" : ""}`}><select value={inventoryId} onChange={event => chooseInventory(event.target.value)}><option value="">{t.noInventory}</option>{inventory.map(item => <option key={item.id} value={item.id}>{item.sku ? `${item.sku} · ` : ""}{item.description}</option>)}</select></div></>
      ) : source === "purchase-order" && poLines.length ? (
        <><label>{t.receivedItem} <em>*</em></label><div className={`ms-field ${errors.purchaseOrder ? "bad" : ""}`}><select value={poLineId} onChange={event => choosePoLine(event.target.value)}><option value="">{t.noPo}</option>{poLines.map(line => <option key={line.id} value={line.id}>{line.purchaseOrderNumber ? `${line.purchaseOrderNumber} · ` : ""}{line.description}</option>)}</select></div></>
      ) : (
        <>
          {source === "purchase-order" ? <><label>{t.poNumber} <em>*</em></label><div className={`ms-field ${errors.purchaseOrder ? "bad" : ""}`}><input value={purchaseOrderNumber} onChange={event => setPurchaseOrderNumber(event.target.value)} placeholder="PO-2048" /></div></> : null}
          <label>{t.item} <em>*</em></label><div className={`ms-field ${errors.description ? "bad" : ""}`}><input value={description} onChange={event => setDescription(event.target.value)} placeholder="CAT hydraulic filter" /></div>
        </>
      )}

      <div className="ms-two">
        <div><label>{t.sku}</label><div className="ms-field"><input value={sku} onChange={event => setSku(event.target.value)} placeholder="1R-1808" /></div></div>
        <div><label>{t.date} <em>*</em></label><div className={`ms-field ${errors.dateUsed ? "bad" : ""}`}><input type="date" value={dateUsed} onChange={event => setDateUsed(event.target.value)} /></div></div>
      </div>

      <div className="ms-three">
        <div><label>{t.qty} <em>*</em></label><div className={`ms-field ${errors.quantity || quantityTooHigh ? "bad" : ""}`}><input inputMode="decimal" value={quantity} onChange={event => setQuantity(event.target.value)} /></div></div>
        <div><label>{t.unit}</label><div className="ms-field"><select value={unit} onChange={event => setUnit(event.target.value)}>{["EA","FT","YD","GAL","QT","LB","SET","BOX","ROLL","LOT"].map(value => <option key={value}>{value}</option>)}</select></div></div>
        <div><label>{t.unitCost} <em>*</em></label><div className="ms-field"><input className="ms-money" inputMode="decimal" value={unitCost} onChange={event => setUnitCost(event.target.value)} placeholder="0.00" /></div></div>
      </div>

      {source !== "existing-supply" ? <div className={`ms-availability ${quantityTooHigh ? "warning" : ""}`}><span>{t.available}</span><b>{availableQuantity || 0} {unit}</b></div> : null}

      {source === "inventory" ? <><label>{t.sourceLocation} <em>*</em></label><div className={`ms-field ${errors.sourceLocation ? "bad" : ""}`}><input value={sourceLocationLabel} onChange={event => setSourceLocationLabel(event.target.value)} placeholder={clean(location.label) || "Shop Inventory"} /></div></> : null}

      <div className="ms-attribution">
        <div><small>{t.usedOn}</small><b>{clean(primary.label) || "AOS OBJECT"}</b></div>
        <div><small>{t.relatedWork}</small><b>{workNumber || "—"}</b></div>
        <div><small>{t.location}</small><b>{clean(location.label) || "—"}</b></div>
        <div><small>{t.cost}</small><b>${extendedCost.toFixed(2)}</b></div>
      </div>

      <label>{t.note}</label>
      <textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder={t.notePh} />

      <div className="ms-policy"><b>{policy}</b></div>
      {(Object.keys(errors).length || quantityTooHigh) ? <div className="ms-errors">{quantityTooHigh ? t.exceeds : t.required}</div> : null}

      <div className="ms-actions">
        <button onClick={() => onBack?.()} disabled={saving}>{t.cancel}</button>
        <button className="use" onClick={save} disabled={saving}>{saving ? t.saving : t.use}</button>
      </div>
      <div className="ms-foot">ⓘ {t.footer}</div>
      <IXIMaterialStandaloneStyles />
    </div>
  );
}
