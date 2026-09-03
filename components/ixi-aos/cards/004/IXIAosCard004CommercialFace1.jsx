import { useEffect, useMemo, useState } from "react";

import {
  asArray,
  buildChildAggregateGroups,
  clean,
  getFieldDefinitions,
  getObjectDisplayName,
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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftId, setDraftId] = useState("");
  const [draftCustom, setDraftCustom] = useState([]);

  useEffect(() => setRuntimeObject(object), [object]);

  const definitions = useMemo(() => getFieldDefinitions(runtimeObject), [runtimeObject]);
  const fields = getObjectFields(runtimeObject);
  const businessDefinition = definitions.find(isBusinessIdentifier) || {
    fieldId: BUSINESS_ID_FIELD,
    label: "CUSTOMER ID",
    type: "text",
    fieldType: "text",
    editable: true,
    presentationRole: "business-identifier",
    semanticRole: "business-identifier",
    presentationOrder: 0
  };
  const businessId = String(fields?.[businessDefinition.fieldId] ?? fields?.[BUSINESS_ID_FIELD] ?? "");

  const aggregateGroups = useMemo(() => buildChildAggregateGroups(asArray(children).filter(Boolean)), [children]);
  const heroGroup = aggregateGroups.find(group => group.hero) || aggregateGroups[0] || null;
  const heroEntries = heroGroup?.entries || [];
  const openJobsEntry = heroEntries.find(entry => /open\s*jobs?/i.test(clean(entry?.label))) || heroEntries[1] || heroEntries[0] || null;
  const openJobsValue = openJobsEntry?.value ?? 0;

  useEffect(() => {
    if (!editing) return;
    setDraftId(businessId);
    setDraftCustom(customDefinitions(runtimeObject).map(definition => ({
      ...definition,
      label: clean(definition?.label || definition?.displayLabel) || "FIELD",
      value: String(fields?.[definition.fieldId] ?? "")
    })));
  }, [editing, runtimeObject]);

  function interceptEdit(event) {
    const button = event.target?.closest?.("button.header-action.edit");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    setEditing(true);
  }

  function addCustomField(event) {
    event.preventDefault();
    event.stopPropagation();
    const fieldId = nextCustomId([...definitions, ...draftCustom]);
    setDraftCustom(current => [...current, {
      fieldId,
      label: "NEW FIELD",
      type: "text",
      fieldType: "text",
      editable: true,
      presentationOrder: 500 + current.length,
      metadata: { card004Custom: true },
      card004Custom: true,
      value: ""
    }]);
  }

  function removeCustomField(event, fieldId) {
    event.preventDefault();
    event.stopPropagation();
    setDraftCustom(current => current.filter(item => item.fieldId !== fieldId));
  }

  async function save(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (saving) return;
    setSaving(true);
    try {
      const existingCustomIds = new Set(customDefinitions(runtimeObject).map(definition => definition.fieldId));
      const nextCustomIds = new Set(draftCustom.map(definition => definition.fieldId));
      const nextDefinitions = definitions
        .filter(definition => !existingCustomIds.has(definition.fieldId) || nextCustomIds.has(definition.fieldId))
        .map(definition => isBusinessIdentifier(definition) ? { ...definition, editable: true } : definition);

      if (!nextDefinitions.some(isBusinessIdentifier)) nextDefinitions.unshift(businessDefinition);

      draftCustom.forEach((definition, index) => {
        const normalized = {
          ...definition,
          label: clean(definition.label) || `FIELD ${index + 1}`,
          type: definition.type || "text",
          fieldType: definition.fieldType || definition.type || "text",
          editable: true,
          presentationOrder: 500 + index,
          metadata: { ...(definition.metadata || {}), card004Custom: true },
          card004Custom: true
        };
        const existingIndex = nextDefinitions.findIndex(item => item.fieldId === normalized.fieldId);
        if (existingIndex >= 0) nextDefinitions[existingIndex] = normalized;
        else nextDefinitions.push(normalized);
      });

      const nextFields = { ...fields, [businessDefinition.fieldId]: draftId };
      existingCustomIds.forEach(fieldId => { if (!nextCustomIds.has(fieldId)) delete nextFields[fieldId]; });
      draftCustom.forEach(definition => { nextFields[definition.fieldId] = definition.value; });

      const nextObject = {
        ...runtimeObject,
        fields: nextFields,
        fieldDefinitions: nextDefinitions,
        metadata: {
          ...(runtimeObject?.metadata || {}),
          fieldDefinitions: nextDefinitions,
          card004Face1Commercial: true
        }
      };

      await onSaveObject?.({
        objectId: getObjectId(nextObject),
        object: nextObject,
        displayName: getObjectDisplayName(nextObject),
        fields: nextFields,
        fieldDefinitions: nextDefinitions,
        metadata: nextObject.metadata
      });
      setRuntimeObject(nextObject);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  const currentCustom = customDefinitions(runtimeObject);

  return (
    <div className={`c004-commercial-face1 ${editing ? "is-editing" : ""}`} onClickCapture={interceptEdit}>
      {typeof childrenRenderer === "function" ? childrenRenderer(runtimeObject) : null}

      <div className="c004-commercial-summary" onPointerDown={event => event.stopPropagation()}>
        {!editing ? (
          <>
            <div className="c004-summary-row c004-id-row"><small>{clean(businessDefinition.label) || "CUSTOMER ID"}</small><strong>{businessId || "—"}</strong></div>
            <div className="c004-summary-row"><small>{clean(openJobsEntry?.label) || "OPEN JOBS"}</small><strong>{openJobsValue}</strong></div>
            {currentCustom.map(definition => (
              <div className="c004-summary-row c004-custom-row" key={definition.fieldId}>
                <small>{clean(definition.label) || "FIELD"}</small><strong>{String(fields?.[definition.fieldId] ?? "—")}</strong>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="c004-edit-row c004-id-edit"><label>{clean(businessDefinition.label) || "CUSTOMER ID"}</label><input aria-label="Customer ID" value={draftId} onChange={event => setDraftId(event.target.value)} /></div>
            <div className="c004-summary-row c004-open-jobs-readonly"><small>{clean(openJobsEntry?.label) || "OPEN JOBS"}</small><strong>{openJobsValue}</strong></div>
            {draftCustom.map((definition, index) => (
              <div className="c004-edit-row c004-custom-edit" key={definition.fieldId}>
                <input aria-label={`Custom field ${index + 1} name`} value={definition.label} onChange={event => setDraftCustom(current => current.map(item => item.fieldId === definition.fieldId ? { ...item, label: event.target.value } : item))} />
                <input aria-label={`${definition.label} value`} value={definition.value} onChange={event => setDraftCustom(current => current.map(item => item.fieldId === definition.fieldId ? { ...item, value: event.target.value } : item))} />
                <button type="button" aria-label={`Remove ${definition.label}`} onClick={event => removeCustomField(event, definition.fieldId)}>×</button>
              </div>
            ))}
            <button type="button" className="c004-add-field" onClick={addCustomField}>+ ADD FIELD</button>
          </>
        )}
      </div>

      {editing ? (
        <div className="c004-edit-actions" onPointerDown={event => event.stopPropagation()}>
          <button type="button" disabled={saving} onClick={save}>SAVE</button>
          <button type="button" disabled={saving} onClick={event => { event.preventDefault(); event.stopPropagation(); setEditing(false); }}>CANCEL</button>
        </div>
      ) : null}

      <style jsx>{`
        .c004-commercial-face1{position:relative;width:298px;height:471px}
        .c004-commercial-summary{position:absolute;top:48px;right:7px;width:91px;height:59px;z-index:155;overflow-y:auto;border-left:1px solid rgba(255,255,255,.055);background:#111411;scrollbar-width:thin}
        :global(.c004-commercial-face1 .gcv12-hero-values){visibility:hidden}
        .c004-summary-row{min-height:18px;display:flex;align-items:center;justify-content:space-between;gap:4px;padding:2px 7px;border-bottom:1px solid #252a26}
        .c004-summary-row small{min-width:0;overflow:hidden;color:#969d98;font:900 5px/1.05 Arial;text-overflow:ellipsis;white-space:nowrap}
        .c004-summary-row strong{max-width:48px;overflow:hidden;color:#f4f5f4;font:950 8.5px/1 Arial;text-overflow:ellipsis;white-space:nowrap;text-align:right}
        .c004-id-row strong{color:#f6f7f6;font-size:10px;letter-spacing:.015em}
        .c004-edit-row{display:grid;grid-template-columns:1fr;gap:2px;padding:3px 5px;border-bottom:1px solid #252a26;background:#111411}
        .c004-edit-row label{color:#ffc400;font:950 5px/1 Arial;letter-spacing:.035em}
        .c004-edit-row input{width:100%;min-width:0;height:16px;padding:0 4px;border:1px solid #3a403b;border-radius:3px;background:#090b0a;color:#f4f5f4;font:850 7px/1 Arial;outline:none}
        .c004-id-edit input{height:18px;font-size:9px;font-weight:950}
        .c004-custom-edit{grid-template-columns:.82fr 1fr 15px;align-items:center;gap:2px;padding:2px 4px}
        .c004-custom-edit input{height:16px;font-size:5.7px}.c004-custom-edit button{width:15px;height:16px;padding:0;border:1px solid #383e39;border-radius:3px;background:#0c0f0d;color:#888f89;font:900 10px/1 Arial}
        .c004-add-field{width:100%;height:18px;border:0;border-top:1px solid #252a26;background:#101310;color:#ffc400;font:950 5.5px/1 Arial;letter-spacing:.045em}
        .c004-edit-actions{position:absolute;top:18px;right:8px;z-index:220;display:flex;gap:3px}
        .c004-edit-actions button{height:20px;padding:0 6px;border:1px solid rgba(255,255,255,.08);border-radius:3px;background:#111411;color:#aeb4af;font:950 5.5px/1 Arial}.c004-edit-actions button:first-child{color:#ffc400}
        .is-editing :global(.ixi-aos-card-header-controls){visibility:hidden!important}
      `}</style>
    </div>
  );
}
