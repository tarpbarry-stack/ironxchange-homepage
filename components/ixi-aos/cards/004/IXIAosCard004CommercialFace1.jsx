import { useEffect, useMemo, useState } from "react";

import {
  asArray,
  buildChildAggregateGroups,
  clean,
  getFieldDefinitions,
  getObjectFields,
  getObjectId
} from "../../card-runtime/IXIAosSemanticObjectPresentation";

const BUSINESS_ID_FIELD = "businessIdentifier";

function isBusinessIdentifier(definition = {}) {
  const role = clean(definition?.presentationRole || definition?.semanticRole).toLowerCase();
  return clean(definition?.fieldId) === BUSINESS_ID_FIELD || role === "business-identifier";
}

function customDefinitions(object = {}) {
  return getFieldDefinitions(object)
    .filter(definition => definition?.metadata?.card004Custom === true || definition?.card004Custom === true)
    .sort((a, b) => Number(a?.presentationOrder || 0) - Number(b?.presentationOrder || 0));
}

function nextCustomId(definitions = []) {
  const used = new Set(definitions.map(definition => clean(definition?.fieldId)));
  let index = 1;
  while (used.has(`card004_custom_${index}`)) index += 1;
  return `card004_custom_${index}`;
}

export default function IXIAosCard004CommercialFace1({ object = {}, children = [], onSaveObject = null, childrenRenderer = null }) {
  const [runtimeObject, setRuntimeObject] = useState(object);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldName, setFieldName] = useState("");
  const [fieldValue, setFieldValue] = useState("");

  useEffect(() => setRuntimeObject(object), [object]);

  const rawDefinitions = useMemo(() => getFieldDefinitions(runtimeObject), [runtimeObject]);
  const fields = getObjectFields(runtimeObject);
  const existingBusinessDefinition = rawDefinitions.find(isBusinessIdentifier);
  const businessDefinition = existingBusinessDefinition || {
    fieldId: BUSINESS_ID_FIELD,
    label: "CUSTOMER ID",
    type: "text",
    fieldType: "text",
    editable: true,
    presentationRole: "business-identifier",
    semanticRole: "business-identifier",
    presentationOrder: 0
  };
  const definitions = existingBusinessDefinition
    ? rawDefinitions.map(definition => isBusinessIdentifier(definition) ? { ...definition, editable: true } : definition)
    : [businessDefinition, ...rawDefinitions];
  const businessId = String(fields?.[businessDefinition.fieldId] ?? fields?.[BUSINESS_ID_FIELD] ?? "");

  const commercialObject = useMemo(() => ({
    ...runtimeObject,
    fieldDefinitions: definitions,
    metadata: { ...(runtimeObject?.metadata || {}), fieldDefinitions: definitions, card004Face1Commercial: true }
  }), [runtimeObject, definitions]);

  const aggregateGroups = useMemo(() => buildChildAggregateGroups(asArray(children).filter(Boolean)), [children]);
  const heroGroup = aggregateGroups.find(group => group.hero) || aggregateGroups[0] || null;
  const heroEntries = heroGroup?.entries || [];
  const openJobsEntry = heroEntries.find(entry => /open\s*jobs?/i.test(clean(entry?.label))) || heroEntries[1] || heroEntries[0] || null;
  const openJobsValue = openJobsEntry?.value ?? 0;
  const currentCustom = customDefinitions(runtimeObject);

  async function addField(event) {
    event.preventDefault();
    event.stopPropagation();
    const label = clean(fieldName);
    if (!label || saving) return;
    setSaving(true);
    try {
      const fieldId = nextCustomId(definitions);
      const definition = {
        fieldId,
        label,
        type: "text",
        fieldType: "text",
        editable: true,
        presentationOrder: 500 + currentCustom.length,
        metadata: { card004Custom: true },
        card004Custom: true
      };
      const nextDefinitions = [...definitions, definition];
      const nextFields = { ...fields, [fieldId]: fieldValue };
      const nextObject = {
        ...runtimeObject,
        fields: nextFields,
        fieldDefinitions: nextDefinitions,
        metadata: { ...(runtimeObject?.metadata || {}), fieldDefinitions: nextDefinitions, card004Face1Commercial: true }
      };
      await onSaveObject?.({ objectId: getObjectId(nextObject), object: nextObject, fields: nextFields, fieldDefinitions: nextDefinitions, metadata: nextObject.metadata });
      setRuntimeObject(nextObject);
      setFieldName("");
      setFieldValue("");
      setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="c004-commercial-face1">
      {typeof childrenRenderer === "function" ? childrenRenderer(commercialObject) : null}

      <div className="c004-commercial-summary" onPointerDown={event => event.stopPropagation()}>
        <div className="c004-summary-half c004-id-row">
          <small>{clean(businessDefinition.label) || "CUSTOMER ID"}</small>
          <strong>{businessId || "—"}</strong>
        </div>
        <div className="c004-summary-half c004-open-jobs-row">
          <small>{clean(openJobsEntry?.label) || "OPEN JOBS"}</small>
          <strong>{openJobsValue}</strong>
        </div>
      </div>

      <div className="c004-field-extension" onPointerDown={event => event.stopPropagation()}>
        {currentCustom.map(definition => (
          <div className="c004-custom-row" key={definition.fieldId}>
            <small>{clean(definition.label) || "FIELD"}</small>
            <strong>{String(fields?.[definition.fieldId] ?? "—")}</strong>
          </div>
        ))}
        {!adding ? (
          <button type="button" className="c004-add-field" onClick={event => { event.preventDefault(); event.stopPropagation(); setAdding(true); }}>+ ADD FIELD</button>
        ) : (
          <div className="c004-add-editor">
            <input aria-label="New field name" placeholder="FIELD NAME" value={fieldName} onChange={event => setFieldName(event.target.value)} />
            <input aria-label="New field value" placeholder="VALUE" value={fieldValue} onChange={event => setFieldValue(event.target.value)} />
            <div><button type="button" disabled={saving || !clean(fieldName)} onClick={addField}>ADD</button><button type="button" disabled={saving} onClick={event => { event.preventDefault(); event.stopPropagation(); setAdding(false); }}>CANCEL</button></div>
          </div>
        )}
      </div>

      <style jsx>{`
        .c004-commercial-face1{position:relative;width:298px;height:471px}
        :global(.c004-commercial-face1 .gcv12-hero-values){visibility:hidden}
        .c004-commercial-summary{position:absolute;top:48px;right:7px;width:91px;height:59px;z-index:155;display:grid;grid-template-rows:1fr 1fr;overflow:hidden;border-left:1px solid rgba(255,255,255,.055);background:#111411}
        .c004-summary-half{min-height:0;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;padding:4px 8px;border-bottom:1px solid #252a26}
        .c004-summary-half:last-child{border-bottom:0}
        .c004-summary-half small{width:100%;overflow:hidden;color:#969d98;font:900 5px/1.05 Arial;text-align:right;text-overflow:ellipsis;white-space:nowrap}
        .c004-summary-half strong{margin-top:3px;max-width:100%;overflow:hidden;color:#f4f5f4;font:950 10px/1 Arial;text-align:right;text-overflow:ellipsis;white-space:nowrap}
        .c004-id-row strong{font-size:11px;letter-spacing:.015em}
        .c004-field-extension{position:absolute;top:112px;right:7px;width:91px;max-height:92px;z-index:154;overflow-y:auto;border:1px solid #343a35;border-radius:4px;background:#101310;scrollbar-width:thin}
        .c004-custom-row{min-height:24px;display:flex;flex-direction:column;justify-content:center;padding:4px 6px;border-bottom:1px solid #252a26}
        .c004-custom-row small{overflow:hidden;color:#969d98;font:900 5px/1 Arial;text-overflow:ellipsis;white-space:nowrap}.c004-custom-row strong{margin-top:3px;overflow:hidden;color:#f4f5f4;font:950 7px/1 Arial;text-overflow:ellipsis;white-space:nowrap}
        .c004-add-field{width:100%;height:22px;border:0;background:#101310;color:#ffc400;font:950 5.5px/1 Arial;letter-spacing:.045em;cursor:pointer}
        .c004-add-editor{display:grid;gap:3px;padding:4px}.c004-add-editor input{width:100%;height:18px;padding:0 5px;border:1px solid #3a403b;border-radius:3px;background:#090b0a;color:#f4f5f4;font:850 6px/1 Arial;outline:none}.c004-add-editor>div{display:flex;gap:3px}.c004-add-editor button{flex:1;height:18px;border:1px solid #383e39;border-radius:3px;background:#0c0f0d;color:#aeb4af;font:950 5px/1 Arial}.c004-add-editor button:first-child{color:#ffc400}
      `}</style>
    </div>
  );
}
