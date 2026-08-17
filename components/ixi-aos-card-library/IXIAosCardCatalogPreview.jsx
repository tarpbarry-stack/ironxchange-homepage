import { useEffect, useMemo, useState } from "react";

import IXIAosCommandAwareObjectConsole from "../ixi-aos/console-runtime/IXIAosCommandAwareObjectConsole";
import IXIAosLocationObjectConsole from "../ixi-aos/console-runtime/IXIAosLocationObjectConsole";
import IXITransactObjectConsole from "../ixi-aos/transact/IXITransactObjectConsole";

import IXIAosCard004Personnel from "../ixi-aos/cards/004/IXIAosCard004Personnel";
import IXIAosCard005Personnel from "../ixi-aos/cards/005/IXIAosCard005Personnel";
import IXIAosCard006Personnel from "../ixi-aos/cards/006/IXIAosCard006Personnel";
import IXIAosCard007EmployeeApplication from "../ixi-aos/cards/007/IXIAosCard007EmployeeApplication";
import IXIAosCard008Profile from "../ixi-aos/cards/008/IXIAosCard008Profile";
import IXIAosCard009 from "../ixi-aos/cards/009/IXIAosCard009";
import IXIAosCard010 from "../ixi-aos/cards/010/IXIAosCard010";

import { adaptAosCardTemplate } from "../ixi-aos/card-runtime/IXIAosCardTemplateAdapter";
import { getUniversal007PreviewItems } from "./IXIAosUniversal007PreviewData";

function clean(value) { return String(value || "").trim(); }
function safeObject(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }

function resolveCatalogCardNumber(template = {}) {
  const direct = Number(template?.templateNumber || template?.metadata?.cardNumber || 0);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const match = clean(template?.templateSlug).match(/(?:^|[-_])(\d{3})(?:$|[-_])/);
  return match ? Number(match[1]) : 0;
}

function universal007Sample() {
  return {
    objectId: "preview-universal-007",
    entityId: "aos-card-preview-entity",
    objectType: "customer-defined-object",
    singularLabel: "OBJECT",
    pluralLabel: "OBJECTS",
    displayName: "WEST TEXAS OPERATIONS",
    status: "active",
    capabilities: { canContain: true, canCreate: true, canTransact: true, editable: true, hasConsole: true, hasRail: true, hasRelationships: true },
    presentation: { detailsTitle: "DETAILS", relationshipsTitle: "RELATIONSHIPS", mediaLabel: "IXI MEDIA" },
    fieldDefinitions: [
      { fieldId: "field_1", label: "STATUS", type: "text", editable: true, presentationOrder: 0 },
      { fieldId: "field_2", label: "REGION", type: "text", editable: true, presentationOrder: 1 },
      { fieldId: "field_3", label: "OWNER", type: "text", editable: true, presentationOrder: 2 },
      { fieldId: "field_4", label: "PRIORITY", type: "text", editable: true, presentationOrder: 3 },
      { fieldId: "field_5", label: "REFERENCE", type: "text", editable: true, presentationOrder: 4 },
      { fieldId: "field_6", label: "CATEGORY", type: "text", editable: true, presentationOrder: 5 },
      { fieldId: "field_7", label: "CONTACT", type: "text", editable: true, presentationOrder: 6 },
      { fieldId: "field_8", label: "NOTES", type: "text", editable: true, presentationOrder: 7 }
    ],
    fields: { field_1: "ACTIVE", field_2: "WEST TEXAS", field_3: "IRONXCHANGE", field_4: "HIGH", field_5: "AOS-007", field_6: "OPERATIONS", field_7: "MAIN OFFICE", field_8: "CUSTOMER DEFINED" },
    relationships: [
      { id: "u007-rel-1", displayLabel: "PRIMARY LOCATION", displayName: "MIDLAND" },
      { id: "u007-rel-2", displayLabel: "RELATED GROUP", displayName: "FIELD OPERATIONS" },
      { id: "u007-rel-3", displayLabel: "ACTIVE PROJECT", displayName: "PROJECT 481" }
    ],
    media: [],
    metadata: { nomenclature: { singular: "OBJECT", plural: "OBJECTS" } }
  };
}

function card009Sample() {
  return {
    objectId: "preview-card-009",
    entityId: "aos-card-preview-entity",
    objectType: "customer-defined-object",
    singularLabel: "EQUIPMENT",
    pluralLabel: "EQUIPMENT",
    displayName: "2023 KOMATSU WA475-10",
    status: "active",
    capabilities: { canContain: false, canCreate: true, canTransact: true, editable: true, hasConsole: true, hasRail: true, hasRelationships: true },
    presentation: { relationshipsTitle: "RELATIONSHIPS", sampleUse: "POWERED / SERIALIZED EQUIPMENT" },
    fieldDefinitions: [
      { fieldId: "businessIdentifier", label: "UNIT #", type: "text", fieldType: "text", editable: true, presentationOrder: 0, semanticRole: "business-identifier", presentationRole: "business-identifier" },
      { fieldId: "year", label: "YEAR", type: "integer", fieldType: "integer", editable: true, presentationOrder: 1 },
      { fieldId: "make", label: "MAKE", type: "text", fieldType: "text", editable: true, presentationOrder: 2 },
      { fieldId: "model", label: "MODEL", type: "text", fieldType: "text", editable: true, presentationOrder: 3 },
      { fieldId: "serialNumber", label: "SERIAL #", type: "text", fieldType: "text", editable: true, presentationOrder: 4 },
      { fieldId: "primaryMeter", label: "HOURS", type: "number", fieldType: "number", editable: true, presentationOrder: 5 },
      { fieldId: "operatingStatus", label: "STATUS", type: "text", fieldType: "text", editable: true, presentationOrder: 6 }
    ],
    fields: { businessIdentifier: "142", year: 2023, make: "KOMATSU", model: "WA475-10", serialNumber: "KMTWA475XPA014821", primaryMeter: 4989, operatingStatus: "ACTIVE" },
    relationships: [
      { id: "c009-rel-1", displayLabel: "HOME YARD", displayName: "MIDLAND" },
      { id: "c009-rel-2", displayLabel: "ASSIGNED TO", displayName: "PROJECT 481" },
      { id: "c009-rel-3", displayLabel: "RESPONSIBLE TEAM", displayName: "FIELD OPERATIONS" }
    ],
    media: [],
    metadata: { sampleUse: "POWERED / SERIALIZED EQUIPMENT", nomenclature: { singular: "EQUIPMENT", plural: "EQUIPMENT" } }
  };
}

function previewObject(template = {}, sample = {}) {
  const cardNumber = resolveCatalogCardNumber(template);
  const hasSampleFields = Object.keys(safeObject(sample?.fields)).length > 0;
  const resolvedSample = cardNumber === 7 && !hasSampleFields ? universal007Sample() : cardNumber === 9 && !hasSampleFields ? card009Sample() : sample;
  const sampleFields = safeObject(resolvedSample?.fields);
  const templateFieldSchema = Array.isArray(template?.fieldSchema) ? template.fieldSchema : [];
  const sampleFieldDefinitions = Array.isArray(resolvedSample?.fieldDefinitions) ? resolvedSample.fieldDefinitions : [];
  const fieldDefinitions = sampleFieldDefinitions.length ? sampleFieldDefinitions : templateFieldSchema.map(item => ({ ...item, fieldId: clean(item?.fieldId || item?.field), label: clean(item?.label), fieldType: clean(item?.fieldType || item?.type), presentationRole: clean(item?.presentationRole || item?.semanticRole || item?.presentation?.role) })).filter(item => item.fieldId);

  return {
    ...resolvedSample,
    objectId: clean(resolvedSample?.objectId) || "aos-card-catalog-preview",
    entityId: clean(resolvedSample?.entityId) || "aos-card-catalog-entity",
    objectType: clean(resolvedSample?.objectType) || clean(template?.baseObjectType) || "generic",
    templateType: clean(template?.baseObjectType) || clean(resolvedSample?.templateType) || "generic",
    templateSlug: clean(template?.templateSlug),
    templateVersion: Number(template?.version || 1),
    templateNumber: Number(template?.templateNumber || 0),
    displayName: clean(resolvedSample?.displayName) || clean(template?.label) || "AOS OBJECT",
    singularLabel: clean(resolvedSample?.singularLabel),
    pluralLabel: clean(resolvedSample?.pluralLabel),
    status: clean(resolvedSample?.status) || "active",
    value: resolvedSample?.value ?? null,
    currency: clean(resolvedSample?.currency) || "USD",
    fields: sampleFields,
    fieldDefinitions,
    relationships: Array.isArray(resolvedSample?.relationships) ? resolvedSample.relationships : [],
    infrastructure: Array.isArray(resolvedSample?.infrastructure) ? resolvedSample.infrastructure : [],
    media: Array.isArray(resolvedSample?.media) ? resolvedSample.media : [],
    presentation: { ...safeObject(template?.presentation), ...safeObject(resolvedSample?.presentation) },
    capabilities: { ...safeObject(template?.capabilities), ...safeObject(resolvedSample?.capabilities) },
    permissions: { ...safeObject(template?.permissions), ...safeObject(resolvedSample?.permissions) },
    effectivePermissions: { ...safeObject(template?.effectivePermissions), ...safeObject(resolvedSample?.effectivePermissions) },
    metadata: { source: "aos-card-catalog-preview", ...safeObject(resolvedSample?.metadata) }
  };
}

function getFaceConfig(object = {}, faceNumber = 1) {
  const faces = object?.presentation?.faces;
  if (Array.isArray(faces)) return safeObject(faces.find(item => Number(item?.face || item?.faceNumber || item?.index) === Number(faceNumber)));
  if (faces && typeof faces === "object") return safeObject(faces[String(faceNumber)] || faces[faceNumber]);
  return {};
}
function getFaceLabel(object = {}, faceNumber = 1) { if (faceNumber === 1) return "OVERVIEW"; const config = getFaceConfig(object, faceNumber); return clean(config?.shortLabel || config?.title || config?.label) || `FACE ${faceNumber}`; }
function getInitialPreviewItems(template = {}, directItems = []) { const items = Array.isArray(directItems) ? directItems : []; if (items.length) return items; if (resolveCatalogCardNumber(template) === 7) return getUniversal007PreviewItems(); return []; }

export default function IXIAosCardCatalogPreview({ template = null, sampleData = {}, projection = null, directItems = [], parentLabel = "", skinId = "ixi:skin:default", onSaveObject = null }) {
  const [state, setState] = useState({});
  const [face, setFace] = useState(1);
  const [transactOpen, setTransactOpen] = useState(false);
  const [previewObjectOverride, setPreviewObjectOverride] = useState(null);
  const [previewItems, setPreviewItems] = useState(() => getInitialPreviewItems(template || {}, directItems));
  const baseObject = useMemo(() => previewObject(template || {}, sampleData), [template, sampleData]);

  useEffect(() => { setPreviewObjectOverride(null); setTransactOpen(false); setFace(1); setPreviewItems(getInitialPreviewItems(template || {}, directItems)); }, [template?.templateSlug, sampleData, directItems]);

  const object = previewObjectOverride || baseObject;
  const definition = useMemo(() => template ? adaptAosCardTemplate({ template, object }) : null, [template, object]);
  if (!template) return <div className="preview-error">NO CARD SELECTED</div>;

  function update(id, patch = {}) { const key = clean(id) || object.objectId; setState(current => ({ ...current, [key]: { ...(current[key] || {}), ...patch } })); }
  async function savePreview(payload = {}) {
    const next = payload?.object && typeof payload.object === "object" ? payload.object : { ...object, displayName: payload?.displayName ?? object.displayName, fields: payload?.fields ?? object.fields, fieldDefinitions: payload?.fieldDefinitions ?? object.fieldDefinitions, metadata: payload?.metadata ?? object.metadata, media: payload?.media ?? object.media };
    setPreviewObjectOverride(next); await onSaveObject?.(payload); return next;
  }
  function addPreviewChild(parentObject) { const nextIndex = previewItems.length + 1; const child = { objectId: `preview-child-${Date.now()}-${nextIndex}`, entityId: parentObject?.entityId || "aos-card-preview-entity", objectType: "generic", singularLabel: "OBJECT", displayName: `NEW OBJECT ${nextIndex}`, fields: {}, fieldDefinitions: [], relationships: [], media: [], metadata: { previewOnly: true } }; setPreviewItems(current => [...current, child]); }

  const current = state[object.objectId] || {};
  const cardNumber = resolveCatalogCardNumber(template);
  const ContainerCard = cardNumber === 4 ? IXIAosCard004Personnel : cardNumber === 5 ? IXIAosCard005Personnel : cardNumber === 6 ? IXIAosCard006Personnel : null;

  if (transactOpen) return <div className="native-card-preview"><IXITransactObjectConsole object={object} ixiState={current} onIxiStateChange={update} onClose={() => setTransactOpen(false)} /><style jsx>{`.native-card-preview{position:relative;width:298px;height:471px}`}</style></div>;

  if (ContainerCard) return <div className="native-card-preview"><ContainerCard object={object} children={previewItems} ixiState={current} onIxiStateChange={update} onSaveObject={savePreview} onAddObject={addPreviewChild} onOpenTransact={() => setTransactOpen(true)} skinId="v12" /><style jsx>{`.native-card-preview{position:relative;width:298px;height:471px}`}</style></div>;
  if (cardNumber === 7) return <div className="native-card-preview"><IXIAosCard007EmployeeApplication object={object} children={previewItems} ixiState={current} onIxiStateChange={update} onSaveObject={savePreview} onAddObject={addPreviewChild} onOpenTransact={() => setTransactOpen(true)} skinId="v12" /><style jsx>{`.native-card-preview{position:relative;width:298px;height:471px}`}</style></div>;
  if (cardNumber === 8) return <div className="native-card-preview"><IXIAosCard008Profile object={object} ixiState={current} onIxiStateChange={update} onSaveObject={savePreview} onAddObject={addPreviewChild} onOpenTransact={() => setTransactOpen(true)} skinId="v12" /><style jsx>{`.native-card-preview{position:relative;width:298px;height:471px}`}</style></div>;
  if (cardNumber === 9) return <div className="native-card-preview"><IXIAosCard009 object={object} ixiState={current} onIxiStateChange={update} onSaveObject={savePreview} onAddObject={addPreviewChild} onOpenTransact={() => setTransactOpen(true)} skinId="v12" /><style jsx>{`.native-card-preview{position:relative;width:298px;height:471px}`}</style></div>;
  if (cardNumber === 10) return <div className="native-card-preview"><IXIAosCard010 object={object} ixiState={current} onIxiStateChange={update} onSaveObject={savePreview} onAddObject={addPreviewChild} onOpenTransact={() => setTransactOpen(true)} skinId="v12" /><style jsx>{`.native-card-preview{position:relative;width:298px;height:471px}`}</style></div>;

  if ([1,2,3].includes(cardNumber)) {
    const faceNumbers = [1,2,3,4,5];
    const consoleDepth = Math.max(1, Number(current?.consoleDepth || 1));
    return (
      <div className="numbered-container-preview" style={{ width: `${consoleDepth * 298}px` }}>
        <div className="face-switch">{faceNumbers.map(faceNumber => <button key={faceNumber} type="button" className={face === faceNumber ? "active" : ""} onClick={() => setFace(faceNumber)}><b>F{faceNumber}</b><small>{getFaceLabel(object, faceNumber)}</small></button>)}</div>
        <div className="console-stage"><IXIAosLocationObjectConsole cardNumber={cardNumber} object={object} projection={projection} objects={previewItems} ixiState={current} onIxiStateChange={update} onSaveObject={savePreview} onAddObject={addPreviewChild} primaryFace={face} onPrimaryFaceChange={setFace} onOpenTransact={() => setTransactOpen(true)} /></div>
        <style jsx>{`.numbered-container-preview{display:flex;flex-direction:column;gap:7px;overflow:visible}.face-switch{width:298px;height:35px;display:grid;grid-template-columns:repeat(5,1fr);gap:3px;padding:3px;border:1px solid #292d2b;border-radius:8px;background:#0d0f0e}.face-switch button{height:27px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:2px 3px;border:1px solid transparent;border-radius:5px;background:transparent;color:#777}.face-switch b{font-size:6px}.face-switch small{max-width:100%;overflow:hidden;font-size:4.2px;font-weight:850;text-overflow:ellipsis;white-space:nowrap}.face-switch .active{border-color:rgba(255,196,0,.52);background:rgba(255,196,0,.07);color:#ffc400}.console-stage{position:relative;display:flex;width:298px;height:471px;overflow:visible}`}</style>
      </div>
    );
  }

  if (!definition) return <div className="preview-error">CARD DEFINITION FAILED</div>;
  return <div className="generic-preview"><IXIAosCommandAwareObjectConsole object={object} objectId={object.objectId} projection={projection} objects={previewItems} cardDefinition={definition} skinId={skinId} parentLabel={clean(parentLabel) || clean(template.librarySection) || "AOS"} ixiCardState={{}} updateIxiCardState={null} previewCardState={current} updatePreviewCardState={update} renderModule={null} studioEditing={false} selectedModuleId="" onSelectModule={null} onSelectFace={null} onCreateFace={null} enableCardScaling={false} cardScaleMode="xl" onOpenTransact={() => setTransactOpen(true)} /></div>;
}
