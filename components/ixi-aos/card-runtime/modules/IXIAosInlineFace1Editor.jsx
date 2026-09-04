import { useEffect, useMemo, useState } from "react";
import {
  clean,
  getFieldDefinitions,
  getObjectDisplayName,
  getObjectFields
} from "../IXIAosSemanticObjectPresentation";

function valueText(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") {
    return clean(value?.displayName || value?.label || value?.name || value?.value);
  }
  return String(value ?? "");
}

function parseValue(definition, rawValue) {
  const type = clean(definition?.fieldType || definition?.type).toLowerCase();
  if (["number", "integer", "money", "currency"].includes(type)) {
    const number = Number(rawValue);
    return Number.isFinite(number) ? number : null;
  }
  if (["tags", "array", "list", "multi-select", "multiselect"].includes(type)) {
    return String(rawValue || "").split(",").map(clean).filter(Boolean);
  }
  return rawValue;
}

function isBusinessIdentifier(definition = {}) {
  const role = clean(definition?.presentationRole || definition?.semanticRole).toLowerCase();
  const fieldId = clean(definition?.fieldId).toLowerCase();
  return role === "business-identifier" || fieldId === "businessidentifier" || fieldId === "business-identifier";
}

function blankDefinition(index, used) {
  let sequence = index + 1;
  let fieldId = `field_${sequence}`;
  while (used.has(fieldId)) fieldId = `field_${++sequence}`;
  return {
    fieldId,
    label: `FIELD ${sequence}`,
    type: "text",
    fieldType: "text",
    editable: true,
    presentationOrder: index,
    metadata: { userDefined: true }
  };
}

export default function IXIAosInlineFace1Editor({
  cardNumber,
  object = {},
  onSaveObject = null,
  fixedBusinessIdentifierLabel = false,
  children
}) {
  const [runtimeObject, setRuntimeObject] = useState(object);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(getObjectDisplayName(object));
  const [definitions, setDefinitions] = useState([]);
  const [draft, setDraft] = useState({});

  useEffect(() => {
    if (!editing) setRuntimeObject(object);
  }, [object, editing]);

  const editable = useMemo(
    () => getFieldDefinitions(runtimeObject).filter(
      definition => definition?.editable !== false && clean(definition?.fieldId)
    ),
    [runtimeObject]
  );

  function beginEdit(event) {
    const button = event?.target?.closest?.("button.header-action.edit");
    if (!button || editing) return;
    event.preventDefault();
    event.stopPropagation();

    const nextDefinitions = editable.map((definition, index) => ({
      ...definition,
      presentationOrder: Number.isFinite(Number(definition?.presentationOrder))
        ? Number(definition.presentationOrder)
        : index
    }));
    const nextDraft = {};
    nextDefinitions.forEach(definition => {
      nextDraft[definition.fieldId] = valueText(
        getObjectFields(runtimeObject)?.[definition.fieldId]
      );
    });

    setDefinitions(nextDefinitions);
    setDraft(nextDraft);
    setName(getObjectDisplayName(runtimeObject));
    setEditing(true);
  }

  function cancel(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setEditing(false);
  }

  function addField() {
    setDefinitions(current => {
      const used = new Set(current.map(definition => definition.fieldId));
      const definition = blankDefinition(current.length, used);
      setDraft(values => ({ ...values, [definition.fieldId]: "" }));
      return [...current, definition];
    });
  }

  function removeField(fieldId) {
    setDefinitions(current => current.filter(definition => definition.fieldId !== fieldId));
    setDraft(current => {
      const next = { ...current };
      delete next[fieldId];
      return next;
    });
  }

  async function save(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (saving) return;

    const normalized = definitions.map((definition, index) => ({
      ...definition,
      fieldId: clean(definition.fieldId),
      label: fixedBusinessIdentifierLabel && isBusinessIdentifier(definition)
        ? "ID"
        : clean(definition.label) || `FIELD ${index + 1}`,
      type: clean(definition.type || definition.fieldType || "text") || "text",
      fieldType: clean(definition.fieldType || definition.type || "text") || "text",
      editable: definition.editable !== false,
      presentationOrder: index
    })).filter(definition => definition.fieldId);

    const nextFields = { ...getObjectFields(runtimeObject) };
    normalized.forEach(definition => {
      nextFields[definition.fieldId] = parseValue(
        definition,
        draft[definition.fieldId]
      );
    });

    const nextObject = {
      ...runtimeObject,
      displayName: clean(name) || getObjectDisplayName(runtimeObject),
      fields: nextFields,
      fieldDefinitions: normalized,
      metadata: {
        ...(runtimeObject?.metadata || {}),
        fieldDefinitions: normalized
      }
    };

    setSaving(true);
    try {
      await onSaveObject?.({
        object: nextObject,
        objectId: nextObject?.objectId || nextObject?.id,
        displayName: nextObject.displayName,
        fields: nextFields,
        fieldDefinitions: normalized,
        metadata: nextObject.metadata
      });
      setRuntimeObject(nextObject);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={`ixi-face1-edit-contract c${String(cardNumber).padStart(3, "0")}-edit ${editing ? "is-editing" : ""}`}
      onClickCapture={beginEdit}
    >
      {typeof children === "function" ? children(runtimeObject) : children}

      {editing ? (
        <>
          <input
            className="ixi-inline-name"
            aria-label="Display name"
            value={name}
            onChange={event => setName(event.target.value)}
            onPointerDown={event => event.stopPropagation()}
          />

          <nav
            className="ixi-inline-edit-actions"
            aria-label="Edit actions"
            onPointerDown={event => event.stopPropagation()}
          >
            <button type="button" disabled={saving} onClick={save}>
              {saving ? "SAVING" : "SAVE"}
            </button>
            <button type="button" disabled={saving} onClick={cancel}>CANCEL</button>
          </nav>

          <section className="ixi-inline-field-editor" onPointerDown={event => event.stopPropagation()}>
            <div className="ixi-inline-columns">
              <span>FIELD NAME</span>
              <span>VALUE</span>
              <i />
            </div>
            {definitions.map((definition, index) => {
              const fixedBusinessId = fixedBusinessIdentifierLabel && isBusinessIdentifier(definition);
              return (
              <div className={`ixi-inline-row ${fixedBusinessId ? "business-id" : ""}`} key={definition.fieldId}>
                {fixedBusinessId ? (
                  <span className="ixi-inline-fixed-label">ID</span>
                ) : (
                  <input
                    aria-label={`Field ${index + 1} name`}
                    value={definition.label}
                    onChange={event => setDefinitions(current => current.map(item => (
                      item.fieldId === definition.fieldId
                        ? { ...item, label: event.target.value }
                        : item
                    )))}
                  />
                )}
                <input
                  aria-label={`${definition.label} value`}
                  value={draft[definition.fieldId] ?? ""}
                  onChange={event => setDraft(current => ({
                    ...current,
                    [definition.fieldId]: event.target.value
                  }))}
                />
                {!fixedBusinessId ? <button
                  type="button"
                  aria-label={`Remove ${definition.label}`}
                  onClick={() => removeField(definition.fieldId)}
                >
                  ×
                </button> : null}
              </div>
            );})}
            <button className="ixi-inline-add" type="button" onClick={addField}>
              + ADD FIELD
            </button>
          </section>
        </>
      ) : null}

      <style jsx>{`
        .ixi-face1-edit-contract{position:relative;width:298px;height:471px}
        .ixi-inline-name{position:absolute;top:20px;left:10px;z-index:510;width:174px;height:18px;padding:0 5px;border:1px solid #3b423d;border-radius:3px;background:#111512;color:#f6f7f6;font:800 11px/16px Arial;outline:none}
        .ixi-inline-name:focus{border-color:#ffc40088}
        .ixi-inline-edit-actions{position:absolute;top:8px;right:8px;z-index:520;display:flex;gap:3px}
        .ixi-inline-edit-actions button{height:24px;padding:0 7px;border:1px solid #3b423d;border-radius:4px;background:#101310;color:#dfe3e0;font:950 6px/22px Arial}
        .ixi-inline-edit-actions button:first-child{border-color:#ffc40055;color:#ffc400}
        .ixi-inline-edit-actions button:disabled{opacity:.55}
        .ixi-inline-field-editor{position:absolute;inset:43px 7px 51px;z-index:500;padding:6px;overflow-y:auto;border:1px solid #343a35;border-radius:6px;background:#0b0d0c;scrollbar-width:thin;scrollbar-color:#4b514d transparent}
        .ixi-inline-columns,.ixi-inline-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.35fr) 25px;gap:4px;align-items:center}
        .ixi-inline-columns{height:17px;color:#858c87;font:800 5px/1 Arial}
        .ixi-inline-row{margin-bottom:4px}
        .ixi-inline-row.business-id{grid-template-columns:minmax(0,1fr) minmax(0,1.35fr);padding:3px;border:1px solid rgba(255,196,0,.20);border-radius:5px;background:rgba(255,196,0,.025)}
        .ixi-inline-fixed-label{height:24px;display:flex;align-items:center;padding:0 6px;border:1px solid #59615b;border-radius:4px;background:#111411;color:#ffc400;font:950 9px/22px Arial}
        .ixi-inline-row input{width:100%;min-width:0;height:24px;padding:0 6px;border:1px solid #59615b;border-radius:4px;background:#090c0a;color:#f3f5f3;font:700 9px/22px Arial;outline:none}
        .ixi-inline-row input:focus{border-color:#ffc40088}
        .ixi-inline-row button,.ixi-inline-add{height:24px;border:1px solid #ffffff16;border-radius:4px;background:#111411;color:#dce0dd;font:800 7px/22px Arial}
        .ixi-inline-row button{padding:0;color:#8f9791;font-size:12px}
        .ixi-inline-add{width:100%;margin-top:3px;color:#ffc400}
        .is-editing :global(.ixi-aos-card-header-controls),
        .is-editing :global(.ixi-aos-header-ixi-number){visibility:hidden!important}
        .is-editing :global([class*="identity"] h2),
        .is-editing :global([class*="identity"]>strong){visibility:hidden!important}
      `}</style>
    </div>
  );
}
