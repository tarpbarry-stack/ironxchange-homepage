import { useMemo, useState } from "react";

import IXIAosObjectConsole from "../ixi-aos/console-runtime/IXIAosObjectConsole";
import IXIAosCard001Location from "../ixi-aos/cards/001/IXIAosCard001Location";
import IXIAosCard002Location from "../ixi-aos/cards/002/IXIAosCard002Location";
import IXIAosCard003Location from "../ixi-aos/cards/003/IXIAosCard003Location";
import IXIAosLocationFace2Operations from "../ixi-aos/cards/location/IXIAosLocationFace2Operations";
import IXIAosLocationFace3Financial from "../ixi-aos/cards/location/IXIAosLocationFace3FinancialApp";
import IXIAosLocationFace4Obligations from "../ixi-aos/cards/location/IXIAosLocationFace4Obligations";
import IXIAosLocationFace5Maintenance from "../ixi-aos/cards/location/IXIAosLocationFace5Maintenance";
import { adaptAosCardTemplate } from "../ixi-aos/card-runtime/IXIAosCardTemplateAdapter";

const clean = value => String(value || "").trim();

function previewObject(template = {}, sample = {}) {
  const fields = sample?.fields && typeof sample.fields === "object" ? sample.fields : {};
  return {
    objectId: clean(sample.objectId) || "aos-card-catalog-preview",
    entityId: clean(sample.entityId) || "aos-card-catalog-entity",
    objectType: clean(template.baseObjectType) || "generic",
    templateType: clean(template.baseObjectType) || "generic",
    templateSlug: clean(template.templateSlug),
    templateVersion: Number(template.version || 1),
    templateNumber: Number(template.templateNumber || 0),
    displayName: clean(sample.displayName) || clean(template.label) || "AOS OBJECT",
    status: clean(sample.status) || "active",
    value: sample.value ?? null,
    currency: clean(sample.currency) || "USD",
    fields,
    fieldDefinitions: Array.isArray(template.fieldSchema)
      ? template.fieldSchema.map(item => ({ fieldId: clean(item.field || item.fieldId), label: clean(item.label), fieldType: clean(item.type) })).filter(item => item.fieldId)
      : [],
    relationships: Array.isArray(sample.relationships) ? sample.relationships : [],
    infrastructure: Array.isArray(sample.infrastructure) ? sample.infrastructure : [],
    media: Array.isArray(sample.media) ? sample.media : [],
    capabilities: { ...(template.capabilities || {}) },
    metadata: { source: "aos-card-catalog-preview", ...(sample.metadata || {}) }
  };
}

export default function IXIAosCardCatalogPreview({ template = null, sampleData = {}, projection = null, directItems = [], parentLabel = "", skinId = "ixi:skin:default", onSaveObject = null }) {
  const [state, setState] = useState({});
  const [face, setFace] = useState(2);
  const [f2skin, setF2skin] = useState("v12");
  const [financialMode, setFinancialMode] = useState("owned");

  const object = useMemo(() => previewObject(template || {}, sampleData), [template, sampleData]);
  const definition = useMemo(() => (template ? adaptAosCardTemplate({ template, object }) : null), [template, object]);

  if (!template) return <div className="preview-error">NO CARD SELECTED</div>;

  function update(id, patch = {}) {
    const key = clean(id) || object.objectId;
    setState(current => ({ ...current, [key]: { ...(current[key] || {}), ...patch } }));
  }

  const current = state[object.objectId] || {};
  const slug = clean(template.templateSlug);
  const isLocation = ["location-standard", "location-standard-002", "location-standard-003"].includes(slug);
  const shared = {
    object,
    projection,
    objects: Array.isArray(directItems) ? directItems : [],
    ixiState: current,
    onIxiStateChange: update,
    onSaveObject,
    onAddObject: () => {},
    onHideObject: () => {},
    onDeleteObject: () => {},
    onOpenConsole: () => {},
    onRecall: () => {},
    onBoard: () => {},
    onReturn: () => {},
    onExposeObject: () => {}
  };

  if (isLocation) {
    const Card = slug === "location-standard-003" ? IXIAosCard003Location : slug === "location-standard-002" ? IXIAosCard002Location : IXIAosCard001Location;
    const financialObject = { ...object, fields: { ...(object.fields || {}), ownershipStatus: financialMode } };

    return (
      <div className="location-preview">
        <div className="face-switch">
          <button className={face === 1 ? "active" : ""} onClick={() => setFace(1)}>F1 · OVERVIEW</button>
          <button className={face === 2 ? "active" : ""} onClick={() => setFace(2)}>F2 · OPERATIONS</button>
          <button className={face === 3 ? "active" : ""} onClick={() => setFace(3)}>F3 · FINANCIAL</button>
          <button className={face === 4 ? "active" : ""} onClick={() => setFace(4)}>F4 · EXPENSES</button>
          <button className={face === 5 ? "active" : ""} onClick={() => setFace(5)}>F5 · MAINTENANCE</button>
        </div>

        {face === 3 || face === 4 ? (
          <div className="variant-switch">
            <button className={financialMode === "owned" ? "active" : ""} onClick={() => setFinancialMode("owned")}>{face === 4 ? "F4-A · OWNED" : "F3-A · OWNED"}</button>
            <button className={financialMode === "leased" ? "active" : ""} onClick={() => setFinancialMode("leased")}>{face === 4 ? "F4-B · LEASED" : "F3-B · LEASED"}</button>
          </div>
        ) : null}

        <div className="console">
          {face === 5 ? (
            <IXIAosLocationFace5Maintenance {...shared} object={financialObject} demoMode />
          ) : face === 4 ? (
            <IXIAosLocationFace4Obligations {...shared} object={financialObject} demoMode />
          ) : face === 3 ? (
            <IXIAosLocationFace3Financial {...shared} object={financialObject} />
          ) : face === 2 ? (
            <IXIAosLocationFace2Operations {...shared} skinId={f2skin} onSkinChange={setF2skin} />
          ) : (
            <Card {...shared} />
          )}
        </div>

        <style jsx>{`
          .location-preview{width:298px;display:flex;flex-direction:column;gap:6px}
          .face-switch{display:grid;grid-template-columns:repeat(5,1fr);gap:3px}
          .variant-switch{display:grid;grid-template-columns:1fr 1fr;gap:3px}
          .face-switch button,.variant-switch button{height:22px;border:1px solid rgba(255,255,255,.08);border-radius:4px;background:#181818;color:#777;font-size:4.85px;font-weight:950}
          .face-switch button.active,.variant-switch button.active{border-color:rgba(255,196,0,.35);background:rgba(255,196,0,.08);color:#ffc400}
          .console{position:relative;width:298px;height:471px;overflow:hidden}
        `}</style>
      </div>
    );
  }

  if (!definition) return <div className="preview-error">CARD DEFINITION FAILED</div>;

  return (
    <div className="generic">
      <IXIAosObjectConsole object={object} objectId={object.objectId} projection={projection} objects={directItems} cardDefinition={definition} skinId={skinId} parentLabel={clean(parentLabel) || clean(template.librarySection) || "AOS"} ixiCardState={{}} updateIxiCardState={null} previewCardState={current} updatePreviewCardState={update} renderModule={null} studioEditing={false} selectedModuleId="" onSelectModule={null} onSelectFace={null} onCreateFace={null} enableCardScaling={false} cardScaleMode="xl" />
      <style jsx>{`.generic{position:relative;display:flex;justify-content:center}.preview-error{width:298px;height:471px;display:flex;align-items:center;justify-content:center;background:#101010;color:#ffc400}`}</style>
    </div>
  );
}
