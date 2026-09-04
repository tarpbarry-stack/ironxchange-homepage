import { useEffect, useRef, useState } from "react";

import IXIObjectRail from "../../../ixi-object-system/IXIObjectRail";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";
import IXIAosPrimaryMediaEditor from "../../card-runtime/modules/IXIAosPrimaryMediaEditor";
import {
  BUSINESS_IDENTIFIER_FIELD_ID,
  BUSINESS_IDENTIFIER_ROLE
} from "../../card-runtime/IXIAosObjectDataContract";
import {
  asArray,
  clean,
  getFieldDefinitions,
  getObjectActionCapabilities,
  getObjectDisplayName,
  getObjectFields,
  getObjectId,
  getObjectLabel,
  getObjectPresentation,
  getObjectRelationships,
  getPrimaryImage
} from "../../card-runtime/IXIAosSemanticObjectPresentation";

const W = 298;
const H = 471;
const MIN_CUSTOM_FIELDS = 6;

function inputValue(value) {
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
  return clean(definition?.fieldId) === BUSINESS_IDENTIFIER_FIELD_ID ||
    clean(definition?.presentationRole).toLowerCase() === BUSINESS_IDENTIFIER_ROLE ||
    clean(definition?.semanticRole).toLowerCase() === BUSINESS_IDENTIFIER_ROLE;
}

function createBlankDefinition(index) {
  return {
    fieldId: `custom_${index + 1}`,
    label: `FIELD ${index + 1}`,
    type: "text",
    fieldType: "text",
    editable: true,
    presentationOrder: index + 1
  };
}

function editableDefinitionsFor(object = {}) {
  const existing = getFieldDefinitions(object).map((definition, index) => ({
    ...definition,
    fieldId: clean(definition?.fieldId || definition?.field || `custom_${index + 1}`),
    label: clean(definition?.label || definition?.displayLabel) || `FIELD ${index + 1}`,
    fieldType: clean(definition?.fieldType || definition?.type || "text") || "text",
    editable: definition?.editable !== false
  }));

  const businessId = existing.find(isBusinessIdentifier) || null;
  const custom = existing.filter(definition => !isBusinessIdentifier(definition));
  const used = new Set(existing.map(item => item.fieldId));

  let index = custom.length;
  while (custom.length < MIN_CUSTOM_FIELDS) {
    let definition = createBlankDefinition(index++);
    while (used.has(definition.fieldId)) definition = createBlankDefinition(index++);
    used.add(definition.fieldId);
    custom.push(definition);
  }

  return [businessId, ...custom].filter(Boolean).map((definition, order) => ({
    ...definition,
    presentationOrder: order
  }));
}

function fileToMedia(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      url: String(reader.result || ""),
      name: clean(file?.name),
      type: clean(file?.type),
      size: Number(file?.size || 0),
      source: "object-media-upload"
    });
    reader.onerror = () => reject(reader.error || new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

function Card009Editor({ object, saving, onCancel, onSave }) {
  const [name, setName] = useState(getObjectDisplayName(object));
  const [definitions, setDefinitions] = useState(() => editableDefinitionsFor(object));
  const [draft, setDraft] = useState({});
  const [media, setMedia] = useState(asArray(object?.media));

  useEffect(() => {
    const nextDefinitions = editableDefinitionsFor(object);
    const nextDraft = {};
    nextDefinitions.forEach(definition => {
      nextDraft[definition.fieldId] = inputValue(getObjectFields(object)?.[definition.fieldId]);
    });
    setName(getObjectDisplayName(object));
    setDefinitions(nextDefinitions);
    setDraft(nextDraft);
    setMedia(asArray(object?.media));
  }, [object]);

  function addField() {
    setDefinitions(current => {
      const used = new Set(current.map(item => item.fieldId));
      let index = current.filter(item => !isBusinessIdentifier(item)).length;
      let definition = createBlankDefinition(index++);
      while (used.has(definition.fieldId)) definition = createBlankDefinition(index++);
      setDraft(values => ({ ...values, [definition.fieldId]: "" }));
      return [...current, definition];
    });
  }

  function removeField(fieldId) {
    const target = definitions.find(item => item.fieldId === fieldId);
    if (isBusinessIdentifier(target)) return;
    setDefinitions(current => current.filter(item => item.fieldId !== fieldId));
    setDraft(current => {
      const next = { ...current };
      delete next[fieldId];
      return next;
    });
  }

  async function save() {
    const normalizedDefinitions = definitions
      .map((definition, index) => ({
        ...definition,
        fieldId: clean(definition.fieldId),
        label: isBusinessIdentifier(definition) ? "ID" : (clean(definition.label) || `FIELD ${index + 1}`),
        fieldType: clean(definition.fieldType || definition.type || "text") || "text",
        type: clean(definition.type || definition.fieldType || "text") || "text",
        editable: definition.editable !== false,
        presentationOrder: index
      }))
      .filter(definition => definition.fieldId);

    const nextFields = { ...getObjectFields(object) };
    normalizedDefinitions.forEach(definition => {
      nextFields[definition.fieldId] = parseValue(definition, draft[definition.fieldId]);
    });

    await onSave?.({
      ...object,
      displayName: clean(name) || getObjectDisplayName(object),
      fields: nextFields,
      fieldDefinitions: normalizedDefinitions,
      media,
      metadata: {
        ...(object?.metadata || {}),
        fieldDefinitions: normalizedDefinitions
      }
    });
  }

  return (
    <div className="c009-editor" onPointerDown={event => event.stopPropagation()}>
      <div className="c009-editor-head">
        <div><small>{getObjectLabel(object)}</small><strong>EDIT OBJECT</strong></div>
        <nav>
          <button type="button" disabled={saving} onClick={save}>SAVE</button>
          <button type="button" disabled={saving} onClick={onCancel}>CANCEL</button>
        </nav>
      </div>
      <div className="c009-editor-scroll">
        <IXIAosPrimaryMediaEditor media={media} onChange={setMedia} />
        <section>
          <div className="c009-editor-title">IDENTITY</div>
          <label><span>OBJECT NAME</span><input value={name} onChange={event => setName(event.target.value)} /></label>
        </section>
        <section>
          <div className="c009-editor-title">FIELDS</div>
          {definitions.map((definition, index) => (
            <div className={`c009-editor-row ${isBusinessIdentifier(definition) ? "business-id" : ""}`} key={definition.fieldId}>
              {isBusinessIdentifier(definition) ? (
                <span className="c009-editor-fixed-label">ID</span>
              ) : (
                <input
                  aria-label={`Field ${index + 1} label`}
                  value={definition.label}
                  onChange={event => setDefinitions(current => current.map(item =>
                    item.fieldId === definition.fieldId ? { ...item, label: event.target.value } : item
                  ))}
                />
              )}
              <input
                aria-label={`${definition.label} value`}
                value={draft[definition.fieldId] ?? ""}
                onChange={event => setDraft(current => ({ ...current, [definition.fieldId]: event.target.value }))}
              />
              <button type="button" disabled={isBusinessIdentifier(definition)} onClick={() => removeField(definition.fieldId)}>
                {isBusinessIdentifier(definition) ? "ID" : "×"}
              </button>
            </div>
          ))}
          <button className="c009-add-field" type="button" onClick={addField}>+ ADD FIELD</button>
        </section>
      </div>
    </div>
  );
}

export default function IXIAosGenericMediaDominant009({
  object = {},
  ixiState = {},
  onSaveObject = null,
  onAddObject = null,
  onHideObject = null,
  onDeleteObject = null,
  onOpenConsole = null,
  onOpenTransact = null,
  onRecall = null,
  onBoard = null,
  onReturn = null,
  onSendFront = null,
  onSendBack = null,
  onCycleColor = null,
  onCycleOutline = null,
  onCycleFace = null,
  onRailSend = null,
  armedDestination = "",
  onSendToArmedDestination = null,
  skinId = "v12",
  onSkinChange = null
}) {
  const [runtimeObject, setRuntimeObject] = useState(object);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const mediaInputRef = useRef(null);

  useEffect(() => setRuntimeObject(object), [object]);

  const actions = getObjectActionCapabilities(runtimeObject);
  const presentation = getObjectPresentation(runtimeObject);
  const definitions = getFieldDefinitions(runtimeObject);
  const fields = getObjectFields(runtimeObject);
  const relationships = getObjectRelationships(runtimeObject);
  const image = getPrimaryImage(runtimeObject);
  const businessIdentifier = definitions.find(isBusinessIdentifier) || null;
  const businessIdentifierValue = inputValue(fields?.[businessIdentifier?.fieldId]);

  const populatedFields = definitions
    .filter(definition => !isBusinessIdentifier(definition))
    .map(definition => ({ definition, value: inputValue(fields?.[definition.fieldId]) }))
    .filter(item => clean(item.value));

  const secondaryFields = populatedFields.slice(3, 6);
  const sampleUse = clean(runtimeObject?.metadata?.sampleUse || presentation?.sampleUse);

  async function save(nextObject) {
    setSaving(true);
    try {
      await onSaveObject?.({
        objectId: getObjectId(nextObject),
        object: nextObject,
        displayName: nextObject.displayName,
        fields: { ...getObjectFields(nextObject) },
        fieldDefinitions: asArray(nextObject.fieldDefinitions),
        metadata: { ...(nextObject.metadata || {}) },
        media: asArray(nextObject.media)
      });
      setRuntimeObject(nextObject);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function addPrimaryPhoto(event) {
    const file = event?.target?.files?.[0];
    if (!file || !file.type?.startsWith("image/")) return;
    const photo = await fileToMedia(file);
    await save({ ...runtimeObject, media: [photo, ...asArray(runtimeObject?.media).slice(1)] });
    event.target.value = "";
  }

  function command(event, callback) {
    event.preventDefault();
    event.stopPropagation();
    callback?.(runtimeObject);
  }

  return (
    <article className="ixi-card-009" data-card-number="009" data-card-skin={skinId}>
      <header className="c009-header">
        <div className="c009-identity">
          <span>{getObjectLabel(runtimeObject)}</span>
          <h2>{getObjectDisplayName(runtimeObject)}</h2>
          {sampleUse ? <small>SAMPLE · {sampleUse}</small> : null}
        </div>
        {!editing ? (
          <IXIAosCardHeaderControls
            canAdd={actions.canCreate && typeof onAddObject === "function"}
            canEdit={actions.canEdit}
            canTransact={actions.canTransact && typeof onOpenTransact === "function"}
            onAdd={() => onAddObject?.(runtimeObject)}
            onToggleEdit={() => setEditing(true)}
            onTransact={() => onOpenTransact?.(runtimeObject)}
            onHide={onHideObject}
            onDelete={onDeleteObject}
            onOpenConsole={actions.canOpenConsole ? onOpenConsole : null}
            skinId={skinId}
            onSkinChange={onSkinChange}
          />
        ) : null}
      </header>

      <main className="c009-body">
        <section className="c009-media">
          {image ? <img src={image} alt={getObjectDisplayName(runtimeObject)} /> : <div className="c009-media-empty"><b>IXI</b><span>PRIMARY MEDIA</span></div>}
          <div className="c009-media-shade" />
          <div className="c009-media-id"><span>ID</span><strong>{businessIdentifierValue || "—"}</strong></div>
          {actions.canEdit ? (
            <button className="c009-photo-action" type="button" disabled={saving} onClick={event => {
              event.preventDefault();
              event.stopPropagation();
              mediaInputRef.current?.click();
            }}>{image ? "CHANGE PHOTO" : "+ ADD PHOTO"}</button>
          ) : null}
          <input ref={mediaInputRef} className="c009-file-input" type="file" accept="image/*" onChange={addPrimaryPhoto} />
        </section>

        <section className="c009-detail-strip">
          {secondaryFields.map(({ definition, value }) => (
            <div className="c009-detail" key={definition.fieldId}><span>{definition.label}</span><strong>{value}</strong></div>
          ))}
        </section>

        <section className="c009-relations">
          <div className="c009-section-title">{clean(presentation?.relationshipsTitle) || "RELATIONSHIPS"}</div>
          <div className="c009-rel-scroll">
            {relationships.slice(0, 3).map(relationship => (
              <button type="button" key={relationship.id} onClick={event => event.stopPropagation()}>
                <span><small>{relationship.label}</small><strong>{relationship.value}</strong></span><b>›</b>
              </button>
            ))}
            {!relationships.length ? <div className="c009-empty">NO RELATIONSHIPS</div> : null}
          </div>
        </section>
      </main>

      <nav className="c009-commands">
        <button type="button" onClick={event => command(event, onRecall)}>↻ <b>RECALL</b></button>
        <button type="button" onClick={event => command(event, onBoard)}>▦ <b>BOARD</b></button>
        <button type="button" onClick={event => command(event, onReturn)}>↩ <b>RETURN</b></button>
      </nav>

      <IXIObjectRail
        object={runtimeObject}
        saved={false}
        color={ixiState?.color || "none"}
        outline={Number(ixiState?.outline ?? 1)}
        face={1}
        onSendFront={onSendFront}
        onSendBack={onSendBack}
        onCycleColor={onCycleColor}
        onCycleOutline={onCycleOutline}
        onCycleFace={onCycleFace}
        onRailSend={onRailSend}
        armedDestination={armedDestination}
        onSendToArmedDestination={onSendToArmedDestination}
      />

      {editing ? <Card009Editor object={runtimeObject} saving={saving} onCancel={() => setEditing(false)} onSave={save} /> : null}

      <style jsx global>{`
        .ixi-card-009,.ixi-card-009 *{box-sizing:border-box}
        .ixi-card-009{--y:#ffc400;--line:#353a36;--soft:#252a26;position:relative;width:${W}px;height:${H}px;overflow:hidden;border:1px solid #454b47;border-radius:13px;background:linear-gradient(180deg,#111412,#080a09);color:#f3f5f3;font-family:Arial,Helvetica,sans-serif;box-shadow:inset 0 1px #ffffff12,0 18px 40px #0008}
        .c009-header{position:absolute;inset:0 0 auto;height:48px;padding:7px 10px;border-bottom:1px solid #303531;background:linear-gradient(180deg,#181b19,#101210);z-index:30}
        .c009-identity{max-width:188px}.c009-identity>span{display:block;overflow:hidden;color:var(--y);font-size:6px;font-weight:950;letter-spacing:.08em;text-overflow:ellipsis;white-space:nowrap}.c009-identity h2{margin:3px 0 0;overflow:hidden;color:#f7f8f7;font-size:13px;font-weight:950;line-height:1;text-overflow:ellipsis;white-space:nowrap}.c009-identity small{display:block;margin-top:4px;overflow:hidden;color:#6f7771;font-size:4.8px;font-weight:900;letter-spacing:.06em;text-overflow:ellipsis;white-space:nowrap}
        .c009-body{position:absolute;top:48px;left:7px;right:7px;bottom:51px;display:flex;flex-direction:column;gap:5px;padding:5px 0;overflow:hidden}
        .c009-media{position:relative;flex:0 0 172px;overflow:hidden;border:1px solid var(--line);border-radius:6px;background:#0a0c0b;box-shadow:inset 0 1px #ffffff0c}.c009-media img{width:100%;height:100%;display:block;object-fit:cover}.c009-media-empty{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:#666d68;background:linear-gradient(135deg,#101310,#090b0a)}.c009-media-empty b{font-size:24px}.c009-media-empty span{font-size:5px;font-weight:900;letter-spacing:.08em}.c009-media-shade{position:absolute;inset:auto 0 0;height:52px;background:linear-gradient(180deg,transparent,#050706e8);pointer-events:none}.c009-media-id{position:absolute;left:8px;right:86px;bottom:7px;min-width:0}.c009-media-id span{display:block;color:#a2aaa4;font-size:5px;font-weight:900;letter-spacing:.05em}.c009-media-id strong{display:block;margin-top:2px;overflow:hidden;color:#fff;font-size:10px;font-weight:950;text-overflow:ellipsis;white-space:nowrap}.c009-photo-action{position:absolute;right:7px;bottom:7px;height:21px;padding:0 7px;border:1px solid #ffffff1a;border-radius:4px;background:#0b0e0cdd;color:var(--y);font-size:5.5px;font-weight:950;letter-spacing:.04em}.c009-file-input{display:none}
        .c009-detail-strip{flex:0 0 39px;display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,.65fr) minmax(0,.8fr);gap:4px}.c009-detail{min-width:0;padding:6px 7px;border:1px solid #2d322e;border-radius:5px;background:#0f120f}.c009-detail span{display:block;overflow:hidden;color:#78807a;font-size:4.5px;font-weight:900;text-overflow:ellipsis;white-space:nowrap}.c009-detail strong{display:block;margin-top:3px;overflow:hidden;color:#dce0dd;font-size:8px;font-weight:900;text-overflow:ellipsis;white-space:nowrap}
        .c009-relations{min-height:0;flex:1;overflow:hidden;border:1px solid var(--line);border-radius:5px;background:#0e110f}.c009-section-title{height:18px;display:flex;align-items:center;padding:0 7px;border-bottom:1px solid var(--soft);background:#141714;color:var(--y);font-size:5.5px;font-weight:950;letter-spacing:.05em}.c009-rel-scroll{height:calc(100% - 18px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.24) transparent}.c009-rel-scroll::-webkit-scrollbar,.c009-editor-scroll::-webkit-scrollbar{width:3px}.c009-rel-scroll::-webkit-scrollbar-track,.c009-editor-scroll::-webkit-scrollbar-track{background:transparent}.c009-rel-scroll::-webkit-scrollbar-thumb,.c009-editor-scroll::-webkit-scrollbar-thumb{border-radius:999px;background:rgba(255,255,255,.22)}.c009-rel-scroll::-webkit-scrollbar-thumb:hover,.c009-editor-scroll::-webkit-scrollbar-thumb:hover{background:rgba(255,196,0,.48)}.c009-rel-scroll button{width:100%;height:26px;display:flex;align-items:center;justify-content:space-between;padding:0 7px;border:0;border-bottom:1px solid #222723;background:transparent;color:#e8ebe8;text-align:left}.c009-rel-scroll button span{min-width:0}.c009-rel-scroll small{display:block;color:#7f8781;font-size:4.5px;font-weight:900}.c009-rel-scroll strong{display:block;margin-top:2px;overflow:hidden;font-size:6.5px;font-weight:900;text-overflow:ellipsis;white-space:nowrap}.c009-rel-scroll button>b{color:var(--y);font-size:10px}.c009-empty{height:100%;display:flex;align-items:center;justify-content:center;color:#59605b;font-size:5px;font-weight:900}
        .c009-commands{position:absolute;left:7px;right:7px;bottom:23px;height:28px;display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:3px 0}.c009-commands button{border:1px solid #2c312d;border-radius:4px;background:linear-gradient(180deg,#131613,#0d100e);color:#8b938d;font-size:7px;font-weight:900}.c009-commands button b{margin-left:3px;color:#d7dbd8;font-size:5.5px;letter-spacing:.04em}
        .c009-editor{position:absolute;inset:0;z-index:200;background:#0b0d0c;color:#f3f5f3}.c009-editor-head{height:43px;display:flex;align-items:center;justify-content:space-between;padding:0 9px;border-bottom:1px solid #303531;background:#151815}.c009-editor-head small{display:block;color:var(--y);font-size:5px;font-weight:950}.c009-editor-head strong{display:block;margin-top:3px;font-size:10px}.c009-editor-head nav{display:flex;gap:4px}.c009-editor-head button{height:22px;padding:0 8px;border:1px solid #ffffff16;border-radius:4px;background:#111411;color:#dce0dd;font-size:6px;font-weight:950}.c009-editor-head nav button:first-child{color:var(--y)}.c009-editor-scroll{position:absolute;top:43px;left:0;right:0;bottom:0;padding:8px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.24) transparent}.c009-editor-scroll section{margin-top:8px;padding:7px;border:1px solid #2b302c;border-radius:6px;background:#101310}.c009-editor-title{margin-bottom:6px;color:var(--y);font-size:5.5px;font-weight:950;letter-spacing:.06em}.c009-editor-scroll label{display:block}.c009-editor-scroll label span{display:block;margin-bottom:4px;color:#8d958f;font-size:5px;font-weight:900}.c009-editor-scroll input{width:100%;height:25px;padding:0 7px;border:1px solid #333934;border-radius:4px;background:#090b0a;color:#edf0ee;font-size:7px;font-weight:850;outline:none}.c009-editor-row{display:grid;grid-template-columns:.85fr 1.25fr 24px;gap:4px;margin-bottom:4px}.c009-editor-row.business-id{padding:3px;border:1px solid rgba(255,196,0,.20);border-radius:5px;background:rgba(255,196,0,.025)}.c009-editor-row button,.c009-add-field{border:1px solid #333934;border-radius:4px;background:#111411;color:#9da49f;font-weight:950}.c009-editor-row button{font-size:12px}.c009-editor-row button:disabled{color:var(--y);font-size:5px}.c009-add-field{width:100%;height:25px;color:var(--y);font-size:6px;letter-spacing:.05em}
        .c009-editor-fixed-label{height:25px;display:flex;align-items:center;padding:0 7px;border:1px solid #333934;border-radius:4px;background:#111411;color:var(--y);font-size:7px;font-weight:950}
      `}</style>
    </article>
  );
}
