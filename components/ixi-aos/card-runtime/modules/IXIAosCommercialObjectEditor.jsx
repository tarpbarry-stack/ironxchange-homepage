import { useEffect, useState } from "react";

import IXIAosPrimaryMediaEditor from "./IXIAosPrimaryMediaEditor";
import {
  BUSINESS_IDENTIFIER_FIELD_ID,
  BUSINESS_IDENTIFIER_ROLE,
  ensureBusinessIdentifierDefinition,
  getBusinessIdentifierValue
} from "../IXIAosObjectDataContract";
import {
  asArray,
  clean,
  getObjectDisplayName,
  getObjectFields,
  getObjectLabel
} from "../IXIAosSemanticObjectPresentation";
import { persistIXIAosMediaDraft } from "../../../../lib/media/ixiMediaClient";

function inputValue(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") {
    return clean(value?.displayName || value?.label || value?.name || value?.value);
  }
  return String(value ?? "");
}

function parseValue(definition = {}, rawValue) {
  const type = clean(definition?.fieldType || definition?.type).toLowerCase();

  if (["number", "integer", "money", "currency", "percent", "percentage"].includes(type)) {
    const number = Number(rawValue);
    return Number.isFinite(number) ? number : null;
  }

  if (["tags", "array", "list", "multi-select", "multiselect"].includes(type)) {
    return String(rawValue || "").split(",").map(clean).filter(Boolean);
  }

  if (type === "boolean") {
    const normalized = clean(rawValue).toLowerCase();
    if (["true", "yes", "1", "on"].includes(normalized)) return true;
    if (["false", "no", "0", "off"].includes(normalized)) return false;
  }

  return rawValue;
}

function isBusinessIdentifier(definition = {}) {
  return clean(definition?.fieldId) === BUSINESS_IDENTIFIER_FIELD_ID ||
    clean(definition?.presentationRole).toLowerCase() === BUSINESS_IDENTIFIER_ROLE ||
    clean(definition?.semanticRole).toLowerCase() === BUSINESS_IDENTIFIER_ROLE;
}

function createFieldId(definitions = []) {
  const used = new Set(definitions.map(definition => clean(definition?.fieldId)).filter(Boolean));
  let index = definitions.length + 1;
  let fieldId = `custom_${index}`;
  while (used.has(fieldId)) {
    index += 1;
    fieldId = `custom_${index}`;
  }
  return fieldId;
}

function normalizeDefinitions(object = {}) {
  return ensureBusinessIdentifierDefinition(object).map((definition, index) => ({
    ...definition,
    fieldId: clean(definition?.fieldId),
    label: clean(definition?.label || definition?.displayLabel) || `FIELD ${index + 1}`,
    fieldType: clean(definition?.fieldType || definition?.type || "text") || "text",
    type: clean(definition?.type || definition?.fieldType || "text") || "text",
    editable: definition?.editable !== false,
    presentationOrder: index
  })).filter(definition => definition.fieldId);
}

/*
 * COMMERCIAL AOS EDITOR FOUNDATION
 *
 * This component owns editing only. It does not decide card layout, taxonomy,
 * containment, permissions, persistence backend, rail behavior or Console.
 *
 * Guarantees:
 * - customer-defined field labels
 * - add/remove custom fields
 * - protected business identifier field (editable, never removable)
 * - type-aware value parsing
 * - primary media add/change/remove
 * - normalized fieldDefinitions returned with the save payload
 * - no semantic meaning inferred from customer labels
 */
export default function IXIAosCommercialObjectEditor({
  object = {},
  saving = false,
  error = null,
  conflict = null,
  onCancel = null,
  onSave = null,
  onReloadLatest = null,
  mediaEnabled = true
}) {
  const [name, setName] = useState(getObjectDisplayName(object));
  const [definitions, setDefinitions] = useState(() => normalizeDefinitions(object));
  const [draft, setDraft] = useState({});
  const [media, setMedia] = useState(asArray(object?.media));
  const [mediaStatus, setMediaStatus] = useState("");
  const [mediaError, setMediaError] = useState("");

  useEffect(() => {
    const nextDefinitions = normalizeDefinitions(object);

    const nextDraft = {};
    nextDefinitions.forEach(definition => {
      const value = isBusinessIdentifier(definition)
        ? getBusinessIdentifierValue(object)
        : getObjectFields(object)?.[definition.fieldId];
      nextDraft[definition.fieldId] = inputValue(value);
    });

    setName(getObjectDisplayName(object));
    setDefinitions(nextDefinitions);
    setDraft(nextDraft);
    setMedia(asArray(object?.media));
    setMediaStatus("");
    setMediaError("");
  }, [object]);

  function addField() {
    setDefinitions(current => {
      const fieldId = createFieldId(current);
      const nextDefinition = {
        fieldId,
        label: `FIELD ${current.filter(item => !isBusinessIdentifier(item)).length + 1}`,
        fieldType: "text",
        type: "text",
        editable: true,
        presentationOrder: current.length
      };

      setDraft(values => ({ ...values, [fieldId]: "" }));
      return [...current, nextDefinition];
    });
  }

  function removeField(fieldId) {
    const target = definitions.find(definition => definition.fieldId === fieldId);
    if (!target || isBusinessIdentifier(target)) return;

    setDefinitions(current =>
      current
        .filter(definition => definition.fieldId !== fieldId)
        .map((definition, index) => ({ ...definition, presentationOrder: index }))
    );

    setDraft(current => {
      const next = { ...current };
      delete next[fieldId];
      return next;
    });
  }

  function updateDefinition(fieldId, patch) {
    setDefinitions(current => current.map(definition =>
      definition.fieldId === fieldId
        ? { ...definition, ...patch }
        : definition
    ));
  }

  async function save() {
    if (saving || mediaStatus) return;
    setMediaError("");
    const normalizedDefinitions = definitions
      .map((definition, index) => ({
        ...definition,
        fieldId: clean(definition?.fieldId),
        label: isBusinessIdentifier(definition)
          ? "ID"
          : clean(definition?.label) || `FIELD ${index + 1}`,
        fieldType: clean(definition?.fieldType || definition?.type || "text") || "text",
        type: clean(definition?.type || definition?.fieldType || "text") || "text",
        editable: definition?.editable !== false,
        presentationOrder: index
      }))
      .filter(definition => definition.fieldId);

    const retainedIds = new Set(normalizedDefinitions.map(definition => definition.fieldId));
    const nextFields = { ...getObjectFields(object) };

    Object.keys(nextFields).forEach(fieldId => {
      const wasEditableSchemaField = definitions.some(definition => definition.fieldId === fieldId);
      if (wasEditableSchemaField && !retainedIds.has(fieldId)) delete nextFields[fieldId];
    });

    normalizedDefinitions.forEach(definition => {
      nextFields[definition.fieldId] = parseValue(definition, draft[definition.fieldId]);
    });

    try {
      const canonicalMedia = mediaEnabled
        ? await persistIXIAosMediaDraft({ object, media, onProgress: setMediaStatus })
        : asArray(object?.media);

      await onSave?.({
        ...object,
        displayName: clean(name) || getObjectDisplayName(object),
        fields: nextFields,
        fieldDefinitions: normalizedDefinitions,
        media: canonicalMedia,
        metadata: {
          ...(object?.metadata || {}),
          fieldDefinitions: normalizedDefinitions
        }
      });
      setMedia(canonicalMedia);
      setMediaStatus("");
    } catch (caught) {
      setMediaStatus("");
      setMediaError(clean(caught?.message) || "The photo was not saved.");
    }
  }

  return (
    <div className="ixi-aos-commercial-editor" onPointerDown={event => event.stopPropagation()}>
      <header>
        <div>
          <small>{getObjectLabel(object)}</small>
          <strong>EDIT OBJECT</strong>
        </div>
        <nav>
          <button type="button" disabled={saving || Boolean(mediaStatus)} onClick={save}>SAVE</button>
          <button type="button" disabled={saving || Boolean(mediaStatus)} onClick={onCancel}>CANCEL</button>
        </nav>
      </header>

      <main>
        {error ? (
          <div className={`editor-notice ${conflict ? "conflict" : "error"}`} role="alert">
            <strong>{conflict ? "REVISION CONFLICT" : "NOT SAVED"}</strong>
            <span>{clean(error?.message) || "The draft is preserved. Review the problem and retry."}</span>
            {conflict && typeof onReloadLatest === "function" ? (
              <button type="button" disabled={saving} onClick={onReloadLatest}>
                REBASE DRAFT ON LATEST
              </button>
            ) : null}
          </div>
        ) : null}

        {mediaEnabled ? (
          <IXIAosPrimaryMediaEditor
            media={media}
            onChange={setMedia}
            status={mediaStatus}
            error={mediaError}
            disabled={saving || Boolean(mediaStatus)}
          />
        ) : null}

        <section>
          <h4>IDENTITY</h4>
          <label className="identity-field">
            <span>OBJECT NAME</span>
            <input value={name} onChange={event => setName(event.target.value)} />
          </label>
        </section>

        <section>
          <h4>FIELDS</h4>
          <div className="field-columns"><span>LABEL</span><span>VALUE</span><span>TYPE</span><i /></div>

          {definitions.map((definition, index) => {
            const protectedId = isBusinessIdentifier(definition);
            return (
              <div className={`field-row ${protectedId ? "business-id" : ""}`} key={definition.fieldId}>
                {protectedId ? (
                  <span className="fixed-field-label">ID</span>
                ) : (
                  <input
                    aria-label={`Field ${index + 1} label`}
                    value={definition.label}
                    disabled={definition.editable === false}
                    onChange={event => updateDefinition(definition.fieldId, { label: event.target.value })}
                  />
                )}
                <input
                  aria-label={`${definition.label} value`}
                  value={draft[definition.fieldId] ?? ""}
                  disabled={definition.editable === false}
                  onChange={event => setDraft(current => ({ ...current, [definition.fieldId]: event.target.value }))}
                />
                <select
                  aria-label={`${definition.label} type`}
                  value={definition.fieldType || "text"}
                  disabled={protectedId || definition.editable === false}
                  onChange={event => updateDefinition(definition.fieldId, {
                    fieldType: event.target.value,
                    type: event.target.value
                  })}
                >
                  <option value="text">TEXT</option>
                  <option value="number">NUMBER</option>
                  <option value="money">MONEY</option>
                  <option value="date">DATE</option>
                  <option value="datetime">DATE/TIME</option>
                  <option value="boolean">YES/NO</option>
                  <option value="tags">LIST</option>
                </select>
                <button
                  type="button"
                  disabled={protectedId || definition.editable === false}
                  title={protectedId ? "Customer business identifier cannot be removed" : "Remove field"}
                  onClick={() => removeField(definition.fieldId)}
                >
                  {protectedId ? "ID" : "×"}
                </button>
              </div>
            );
          })}

          <button className="add-field" type="button" onClick={addField}>+ ADD FIELD</button>
        </section>
      </main>

      <style jsx global>{`
        .ixi-aos-commercial-editor,.ixi-aos-commercial-editor *{box-sizing:border-box}.ixi-aos-commercial-editor{position:absolute;inset:0;z-index:260;overflow:hidden;border:1px solid #454b47;border-radius:13px;background:linear-gradient(180deg,#101310,#080a09);color:#eef1ef;font-family:Arial,Helvetica,sans-serif;box-shadow:inset 0 1px #ffffff12,0 18px 40px #0008}.ixi-aos-commercial-editor>header{height:43px;display:flex;align-items:center;justify-content:space-between;padding:0 9px;border-bottom:1px solid #303531;background:#151815}.ixi-aos-commercial-editor>header small{display:block;color:#ffc400;font-size:5px;font-weight:950}.ixi-aos-commercial-editor>header strong{display:block;margin-top:3px;font-size:10px}.ixi-aos-commercial-editor>header nav{display:flex;gap:4px}.ixi-aos-commercial-editor button,.ixi-aos-commercial-editor select{height:24px;border:1px solid #3a403b;border-radius:4px;background:#111411;color:#dce0dd;font-size:6px;font-weight:950}.ixi-aos-commercial-editor>header button{padding:0 9px}.ixi-aos-commercial-editor>header button:first-child{border-color:#ffc40066;color:#ffc400}.ixi-aos-commercial-editor button:disabled,.ixi-aos-commercial-editor select:disabled{opacity:.42;cursor:not-allowed}.ixi-aos-commercial-editor>main{position:absolute;top:43px;left:0;right:0;bottom:0;padding:8px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#4b514d transparent}.ixi-aos-commercial-editor .editor-notice{display:flex;flex-direction:column;gap:3px;padding:7px;border:1px solid #a73a3a;border-radius:5px;background:#2a1111;color:#f5d7d7}.ixi-aos-commercial-editor .editor-notice.conflict{border-color:#ffc40066;background:#ffc4000d;color:#ffe89a}.ixi-aos-commercial-editor .editor-notice strong{font-size:6px;letter-spacing:.05em}.ixi-aos-commercial-editor .editor-notice span{font-size:6px;line-height:1.35}.ixi-aos-commercial-editor .editor-notice button{width:100%;margin-top:3px;border-color:#ffc40066;color:#ffc400}.ixi-aos-commercial-editor section{margin-top:8px}.ixi-aos-commercial-editor h4{height:20px;margin:0;display:flex;align-items:center;color:#ffc400;font-size:6px;font-weight:950;letter-spacing:.06em}.ixi-aos-commercial-editor .identity-field{display:block;padding:7px;border:1px solid #2b302c;border-radius:5px;background:#101310}.ixi-aos-commercial-editor label>span{display:block;margin-bottom:4px;color:#8d958f;font-size:5px;font-weight:900}.ixi-aos-commercial-editor input{width:100%;height:26px;padding:0 7px;border:1px solid #343a35;border-radius:4px;background:#090b0a;color:#edf0ee;font-size:7px;font-weight:850;outline:none}.ixi-aos-commercial-editor .fixed-field-label{height:26px;display:flex;align-items:center;padding:0 7px;border:1px solid #5e552d;border-radius:4px;background:#12140f;color:#ffc400;font-size:7px;font-weight:950}.ixi-aos-commercial-editor .field-columns,.ixi-aos-commercial-editor .field-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr) 62px 26px;gap:4px}.ixi-aos-commercial-editor .field-columns{padding:0 4px 4px;color:#68716b;font-size:4.7px;font-weight:900}.ixi-aos-commercial-editor .field-row{margin-bottom:4px}.ixi-aos-commercial-editor .field-row select{width:100%;padding:0 4px}.ixi-aos-commercial-editor .field-row button{width:26px;padding:0}.ixi-aos-commercial-editor .field-row.business-id{padding:4px;border:1px solid #ffc40033;border-radius:5px;background:#ffc40008}.ixi-aos-commercial-editor .add-field{width:100%;margin-top:4px;border-color:#ffc40044;color:#ffc400;background:#111411}
      `}</style>
    </div>
  );
}
