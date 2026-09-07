import { useEffect, useMemo, useRef, useState } from "react";

import IXICollectionThumbRail from "../../../ixi-object-system/IXICollectionThumbRail";
import IXIObjectRail from "../../../ixi-object-system/IXIObjectRail";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";
import IXIAosPrimaryMediaEditor from "../../card-runtime/modules/IXIAosPrimaryMediaEditor";
import { persistIXIAosMediaDraft } from "../../../../lib/media/ixiMediaClient";
import { IXI_AOS_MEDIA_ACCEPT } from "../../../../lib/media/ixiAosMediaContract.mjs";
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

const DEFAULT_VISIBLE_SLOTS = 8;

function inputValue(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return clean(value?.displayName || value?.label || value?.name || value?.value);
  return String(value ?? "");
}

function isBusinessIdentifier(definition = {}) {
  return clean(definition?.fieldId) === BUSINESS_IDENTIFIER_FIELD_ID ||
    clean(definition?.presentationRole).toLowerCase() === BUSINESS_IDENTIFIER_ROLE ||
    clean(definition?.semanticRole).toLowerCase() === BUSINESS_IDENTIFIER_ROLE;
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

function createBlankDefinition(index) {
  return { fieldId: `field_${index + 1}`, label: `FIELD ${index + 1}`, type: "text", fieldType: "text", editable: true, presentationOrder: index };
}

function editableDefinitionsFor(object = {}) {
  const existing = getFieldDefinitions(object).map((definition, index) => ({
    ...definition,
    fieldId: clean(definition?.fieldId || definition?.field || `field_${index + 1}`),
    label: clean(definition?.label || definition?.displayLabel) || `FIELD ${index + 1}`,
    fieldType: clean(definition?.fieldType || definition?.type || "text") || "text",
    editable: definition?.editable !== false
  }));
  if (existing.length >= DEFAULT_VISIBLE_SLOTS) return existing;
  const used = new Set(existing.map(item => item.fieldId));
  const output = [...existing];
  let index = 0;
  while (output.length < DEFAULT_VISIBLE_SLOTS) {
    const blank = createBlankDefinition(index++);
    if (used.has(blank.fieldId)) continue;
    used.add(blank.fieldId);
    output.push(blank);
  }
  return output;
}

function UniversalEditor({ object, saving, onCancel, onSave }) {
  const [name, setName] = useState(getObjectDisplayName(object));
  const [definitions, setDefinitions] = useState(() => editableDefinitionsFor(object));
  const [draft, setDraft] = useState({});
  const [media, setMedia] = useState(asArray(object?.media));
  const [mediaStatus, setMediaStatus] = useState("");
  const [mediaError, setMediaError] = useState("");

  useEffect(() => {
    setName(getObjectDisplayName(object));
    setMedia(asArray(object?.media));
    setMediaStatus("");
    setMediaError("");
    const nextDefinitions = editableDefinitionsFor(object);
    setDefinitions(nextDefinitions);
    const nextDraft = {};
    nextDefinitions.forEach(definition => {
      nextDraft[definition.fieldId] = inputValue(getObjectFields(object)?.[definition.fieldId]);
    });
    setDraft(nextDraft);
  }, [object]);

  function addField() {
    setDefinitions(current => {
      const used = new Set(current.map(item => item.fieldId));
      let index = current.length;
      let blank = createBlankDefinition(index);
      while (used.has(blank.fieldId)) blank = createBlankDefinition(++index);
      setDraft(values => ({ ...values, [blank.fieldId]: "" }));
      return [...current, blank];
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

  async function save() {
    if (saving || mediaStatus) return;
    const nextFields = { ...getObjectFields(object) };
    const normalizedDefinitions = definitions
      .map((definition, index) => ({
        ...definition,
        fieldId: clean(definition.fieldId),
        label: clean(definition.label) || `FIELD ${index + 1}`,
        fieldType: clean(definition.fieldType || definition.type || "text") || "text",
        type: clean(definition.type || definition.fieldType || "text") || "text",
        editable: definition.editable !== false,
        presentationOrder: index
      }))
      .filter(definition => definition.fieldId);

    const retainedIds = new Set(normalizedDefinitions.map(definition => definition.fieldId));
    Object.keys(nextFields).forEach(fieldId => {
      if (fieldId.startsWith("field_") && !retainedIds.has(fieldId)) delete nextFields[fieldId];
    });
    normalizedDefinitions.forEach(definition => {
      nextFields[definition.fieldId] = parseValue(definition, draft[definition.fieldId]);
    });

    try {
      setMediaError("");
      const canonicalMedia = await persistIXIAosMediaDraft({ object, media, onProgress: setMediaStatus });
      await onSave?.({
        ...object,
        displayName: clean(name) || getObjectDisplayName(object),
        fields: nextFields,
        media: canonicalMedia,
        fieldDefinitions: normalizedDefinitions,
        metadata: { ...(object?.metadata || {}), fieldDefinitions: normalizedDefinitions }
      });
      setMedia(canonicalMedia);
      setMediaStatus("");
    } catch (caught) {
      setMediaStatus("");
      setMediaError(clean(caught?.message) || "The photo was not saved.");
    }
  }

  return (
    <div className="u007-editor" onPointerDown={event => event.stopPropagation()}>
      <div className="u007-editor-head">
        <div><small>{getObjectLabel(object)}</small><strong>EDIT OBJECT</strong></div>
        <nav>
          <button type="button" disabled={saving || Boolean(mediaStatus)} onClick={save}>SAVE</button>
          <button type="button" disabled={saving || Boolean(mediaStatus)} onClick={onCancel}>CANCEL</button>
        </nav>
      </div>
      <div className="u007-editor-scroll">
        <IXIAosPrimaryMediaEditor media={media} onChange={setMedia} status={mediaStatus} error={mediaError} disabled={saving || Boolean(mediaStatus)} />
        <section>
          <div className="u007-editor-title">IDENTITY</div>
          <label className="u007-name-field"><span>OBJECT NAME</span><input value={name} onChange={event => setName(event.target.value)} /></label>
        </section>
        <section>
          <div className="u007-editor-title">DETAIL FIELDS</div>
          <div className="u007-editor-columns"><span>LABEL</span><span>VALUE</span><i /></div>
          {definitions.map((definition, index) => (
            <div className="u007-editor-row" key={definition.fieldId}>
              <input aria-label={`Field ${index + 1} label`} value={definition.label} onChange={event => setDefinitions(current => current.map(item => item.fieldId === definition.fieldId ? { ...item, label: event.target.value } : item))} />
              <input aria-label={`${definition.label} value`} value={draft[definition.fieldId] ?? ""} onChange={event => setDraft(current => ({ ...current, [definition.fieldId]: event.target.value }))} />
              <button type="button" onClick={() => removeField(definition.fieldId)}>×</button>
            </div>
          ))}
          <button className="u007-add-field" type="button" onClick={addField}>+ ADD FIELD</button>
        </section>
      </div>
    </div>
  );
}

export default function IXIAosGenericUniversalLayout007({
  object = {}, children = [], ixiState = {}, onSaveObject = null, onAddObject = null,
  onHideObject = null, onDeleteObject = null, onOpenConsole = null, onOpenTransact = null,
  onRecall = null, onBoard = null, onReturn = null, onExposeObject = null,
  onSendFront = null, onSendBack = null, onCycleColor = null, onCycleOutline = null,
  onCycleFace = null, onRailSend = null, armedDestination = "", onSendToArmedDestination = null,
  skinId = "v12", onSkinChange = null, showMediaBusinessIdentifier = true
}) {
  /*
   * The commercial editor bridge is the single runtime owner. Reading through
   * a second local object cache allowed Face 1 to keep an obsolete generated
   * label (custom_2) while the editor already held the customer's real label.
   */
  const runtimeObject = object;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeChildIndex, setActiveChildIndex] = useState(0);
  const mediaInputRef = useRef(null);
  const [mediaStatus, setMediaStatus] = useState("");
  const [mediaError, setMediaError] = useState("");

  const actions = getObjectActionCapabilities(runtimeObject);
  const presentation = getObjectPresentation(runtimeObject);
  const relationships = getObjectRelationships(runtimeObject);
  const items = useMemo(() => asArray(children).filter(Boolean), [children]);
  const definitions = getFieldDefinitions(runtimeObject);
  const fields = getObjectFields(runtimeObject);
  const image = getPrimaryImage(runtimeObject);
  const businessIdentifier = definitions.find(isBusinessIdentifier) || null;
  const businessIdentifierValue = inputValue(fields?.[businessIdentifier?.fieldId]);
  const visibleDefinitions = showMediaBusinessIdentifier
    ? definitions.filter(definition => !isBusinessIdentifier(definition))
    : [businessIdentifier, ...definitions.filter(definition => !isBusinessIdentifier(definition))].filter(Boolean);
  const populatedFields = visibleDefinitions
    .map(definition => ({ definition, value: inputValue(fields?.[definition.fieldId]) }))
    .filter(item => clean(item.value) || isBusinessIdentifier(item.definition));
  const safeIndex = items.length ? Math.min(activeChildIndex, items.length - 1) : 0;
  const detailsTitle = clean(presentation?.detailsTitle) || "DETAILS";
  const relationshipsTitle = clean(presentation?.relationshipsTitle) || "RELATIONSHIPS";

  async function save(nextObject) {
    setSaving(true);
    try {
      await onSaveObject?.({
        objectId: getObjectId(nextObject), object: nextObject, displayName: nextObject.displayName,
        fields: { ...getObjectFields(nextObject) }, fieldDefinitions: asArray(nextObject.fieldDefinitions),
        metadata: { ...(nextObject.metadata || {}) }, media: asArray(nextObject.media)
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function addPrimaryPhoto(event) {
    const file = event?.target?.files?.[0];
    event.target.value = "";
    if (!file || saving || mediaStatus) return;
    try {
      setMediaError("");
      const media = await persistIXIAosMediaDraft({
        object: runtimeObject,
        media: [{ file, pendingUpload: true }],
        onProgress: setMediaStatus
      });
      await save({ ...runtimeObject, media });
      setMediaStatus("");
    } catch (caught) {
      setMediaStatus("");
      setMediaError(clean(caught?.message) || "PHOTO UPLOAD FAILED");
    }
  }

  function command(event, callback) {
    event.preventDefault();
    event.stopPropagation();
    callback?.(runtimeObject);
  }

  function openPhotoPicker(event) {
    event.preventDefault();
    event.stopPropagation();
    mediaInputRef.current?.click();
  }

  return (
    <article className="ixi-universal-card-007" data-card-number="007" data-card-skin={skinId}>
      <header className="u007-header">
        <div className="u007-identity"><span>{getObjectLabel(runtimeObject)}</span><h2>{getObjectDisplayName(runtimeObject)}</h2></div>
        {!editing ? <IXIAosCardHeaderControls canAdd={actions.canCreate && typeof onAddObject === "function"} canEdit={actions.canEdit} canTransact={actions.canTransact && typeof onOpenTransact === "function"} onAdd={() => onAddObject?.(runtimeObject)} onToggleEdit={() => setEditing(true)} onTransact={() => onOpenTransact?.(runtimeObject)} onHide={onHideObject} onDelete={onDeleteObject} onOpenConsole={actions.canOpenConsole ? onOpenConsole : null} skinId={skinId} onSkinChange={onSkinChange} /> : null}
      </header>

      <main className="u007-body">
        <section className="u007-media-shell">
          {image ? <img src={image} alt={getObjectDisplayName(runtimeObject)} /> : <div className="u007-media-empty"><b>IXI</b><span>PRIMARY MEDIA</span></div>}
          {showMediaBusinessIdentifier ? <><div className="u007-media-shade" /><div className="u007-media-id"><span>ID</span><strong>{businessIdentifierValue || "—"}</strong></div></> : null}
          {actions.canEdit ? <button className="u007-media-action" type="button" disabled={saving || Boolean(mediaStatus)} onClick={openPhotoPicker}>{mediaStatus || (image ? "CHANGE PHOTO" : "+ ADD PHOTO")}</button> : null}
          <input ref={mediaInputRef} className="u007-media-input" type="file" accept={IXI_AOS_MEDIA_ACCEPT} onChange={addPrimaryPhoto} />
          {mediaError ? <span className="u007-media-error" role="alert">{mediaError}</span> : null}
        </section>

        <section className="u007-section u007-details">
          <div className="u007-section-title">{detailsTitle}</div>
          <div className="u007-section-scroll">{populatedFields.map(({ definition, value }) => <div className="u007-detail-row" key={definition.fieldId}><span>{isBusinessIdentifier(definition) ? "ID" : definition.label}</span><strong>{value || "—"}</strong></div>)}</div>
        </section>

        <section className="u007-section u007-relationships">
          <div className="u007-section-title">{relationshipsTitle}</div>
          <div className="u007-section-scroll">{relationships.map(relationship => <button type="button" className="u007-relationship-row" key={relationship.id} onClick={event => event.stopPropagation()}><span><small>{relationship.label}</small><strong>{relationship.value}</strong>{relationship.secondary ? <em>{relationship.secondary}</em> : null}</span><b>›</b></button>)}</div>
        </section>
      </main>

      <nav className="u007-commands"><button type="button" onClick={event => command(event, onRecall)}>↻ <b>RECALL</b></button><button type="button" onClick={event => command(event, onBoard)}>▦ <b>BOARD</b></button><button type="button" onClick={event => command(event, onReturn)}>↩ <b>RETURN</b></button></nav>
      <div className="u007-child-rail"><IXICollectionThumbRail items={items} activeItemIndex={safeIndex} getItemId={getObjectId} getItemImage={getPrimaryImage} getItemLabel={getObjectDisplayName} onSelectItem={(item, index) => { setActiveChildIndex(index); onExposeObject?.(item, runtimeObject); }} /></div>
      <IXIObjectRail object={runtimeObject} saved={false} color={ixiState?.color || "none"} outline={Number(ixiState?.outline ?? 1)} face={1} onSendFront={onSendFront} onSendBack={onSendBack} onCycleColor={onCycleColor} onCycleOutline={onCycleOutline} onCycleFace={onCycleFace} onRailSend={onRailSend} armedDestination={armedDestination} onSendToArmedDestination={onSendToArmedDestination} />
      {editing ? <UniversalEditor object={runtimeObject} saving={saving} onCancel={() => setEditing(false)} onSave={save} /> : null}

      <style jsx global>{`
        .ixi-universal-card-007,.ixi-universal-card-007 *{box-sizing:border-box}
        .ixi-universal-card-007{--y:#ffc400;--line:#343a35;--soft:#252a26;position:relative;width:298px;height:471px;overflow:hidden;border:1px solid #454b47;border-radius:13px;background:linear-gradient(180deg,#101310,#080a09);color:#f4f5f4;font-family:Arial,Helvetica,sans-serif;box-shadow:inset 0 1px #ffffff12,0 18px 40px #0008}
        .u007-header{position:absolute;inset:0 0 auto;height:43px;padding:7px 10px;border-bottom:1px solid #303531;background:linear-gradient(180deg,#171a18,#101210);z-index:30}.u007-identity{max-width:188px}.u007-identity>span{display:block;overflow:hidden;color:var(--y);font-size:6px;font-weight:950;letter-spacing:.07em;text-overflow:ellipsis;white-space:nowrap}.u007-identity h2{margin:4px 0 0;overflow:hidden;color:#f6f7f6;font-size:14px;font-weight:950;line-height:1;text-overflow:ellipsis;white-space:nowrap}
        .u007-body{position:absolute;top:43px;left:7px;right:7px;bottom:111px;display:flex;flex-direction:column;gap:5px;min-height:0;padding:5px 0;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#4b514d #0b0e0c}.u007-body::-webkit-scrollbar,.u007-section-scroll::-webkit-scrollbar,.u007-editor-scroll::-webkit-scrollbar{width:5px;height:5px}.u007-body::-webkit-scrollbar-track,.u007-section-scroll::-webkit-scrollbar-track,.u007-editor-scroll::-webkit-scrollbar-track{background:#0b0e0c}.u007-body::-webkit-scrollbar-thumb,.u007-section-scroll::-webkit-scrollbar-thumb,.u007-editor-scroll::-webkit-scrollbar-thumb{background:#4b514d;border:1px solid #171b18;border-radius:999px}
        .u007-media-shell{position:relative;flex:0 0 112px;width:100%;overflow:hidden;border:1px solid var(--line);border-radius:5px;background:#0b0e0c}.u007-media-shell img{display:block;width:100%;height:100%;object-fit:cover;object-position:center;background:#080b09}.u007-media-empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;background:#0d100e;color:#69716c}.u007-media-empty b{color:#7d857f;font-size:21px;font-weight:950}.u007-media-empty span{color:#747c76;font-size:5px;font-weight:900;letter-spacing:.08em}.u007-media-shade{position:absolute;inset:auto 0 0;height:52px;background:linear-gradient(180deg,transparent,#050706e8);pointer-events:none}.u007-media-id{position:absolute;left:8px;right:86px;bottom:7px;min-width:0;z-index:2}.u007-media-id span{display:block;color:#a2aaa4;font-size:5px;font-weight:900;letter-spacing:.05em}.u007-media-id strong{display:block;margin-top:2px;overflow:hidden;color:#fff;font-size:10px;font-weight:950;text-overflow:ellipsis;white-space:nowrap}.u007-media-action{position:absolute;right:7px;bottom:7px;height:21px;max-width:112px;overflow:hidden;padding:0 8px;border:1px solid #ffc40066;border-radius:4px;background:#0d100ed9;color:var(--y);font-size:5.5px;font-weight:950;text-overflow:ellipsis;white-space:nowrap;z-index:2}.u007-media-action:disabled{cursor:wait;opacity:.65}.u007-media-input{display:none}.u007-media-error{position:absolute;left:7px;right:7px;top:7px;z-index:4;padding:4px 6px;border:1px solid #ff6b6b66;border-radius:4px;background:#160909e8;color:#ff8b8b;font-size:5px;font-weight:900}
        .u007-section{flex:0 0 112px;min-height:0;overflow:hidden;border:1px solid var(--line);border-radius:5px;background:#101310}.u007-relationships{flex-basis:104px}.u007-section-title{height:20px;display:flex;align-items:center;padding:0 7px;border-bottom:1px solid var(--soft);background:#151916;color:var(--y);font-size:6px;font-weight:950}.u007-section-scroll{height:calc(100% - 20px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:#4b514d #101310}.u007-detail-row{min-height:22px;display:grid;grid-template-columns:minmax(0,92px) 1fr;align-items:center;gap:7px;padding:4px 7px;border-bottom:1px solid #242925}.u007-detail-row:nth-child(even),.u007-relationship-row:nth-child(even){background:#ffffff08}.u007-detail-row span{overflow:hidden;color:#929a95;font-size:5.5px;font-weight:900;text-overflow:ellipsis;white-space:nowrap}.u007-detail-row strong{overflow:hidden;color:#eef1ef;font-size:7.5px;font-weight:900;text-align:right;text-overflow:ellipsis;white-space:nowrap}
        .u007-relationship-row{width:100%;min-height:27px;display:grid;grid-template-columns:1fr 18px;align-items:center;padding:3px 6px 3px 8px;border:0;border-bottom:1px solid #242925;background:transparent;color:#fff;text-align:left}.u007-relationship-row small{display:block;color:#8f9792;font-size:5px;font-weight:900}.u007-relationship-row strong{display:block;margin-top:1px;font-size:7px;font-weight:900}.u007-relationship-row em{display:block;color:#6e7771;font-size:5px;font-style:normal}.u007-relationship-row>b{color:var(--y);font-size:10px;text-align:center}
        .u007-commands{position:absolute;left:7px;right:7px;bottom:78px;height:27px;display:grid;grid-template-columns:repeat(3,1fr);overflow:hidden;border:1px solid var(--line);border-radius:5px;background:#0f120f;z-index:20}.u007-commands button{border:0;border-right:1px solid var(--soft);background:transparent;color:#b9c0bb;font-size:7px;font-weight:900}.u007-commands button:last-child{border-right:0}.u007-commands b{margin-left:3px;font-size:6px}.u007-child-rail{position:absolute;left:0;right:0;bottom:19px;height:55px;overflow:hidden;border-top:1px solid #292e2a;background:#080a09;z-index:18}
        .u007-editor{position:absolute;inset:0 0 19px;background:#090c0a;z-index:220}.u007-editor-head{height:43px;display:flex;align-items:center;justify-content:space-between;padding:7px 9px;border-bottom:1px solid #303532;background:#151916}.u007-editor-head small{display:block;color:#8c958f;font-size:5px;font-weight:900}.u007-editor-head strong{display:block;margin-top:3px;font-size:10px}.u007-editor-head nav{display:flex;gap:3px}.u007-editor-head button{height:24px;padding:0 8px;border:1px solid #3b423d;border-radius:4px;background:#101310;color:#dfe3e0;font-size:6px;font-weight:900}.u007-editor-head button:first-child{color:var(--y)}.u007-editor-scroll{position:absolute;top:43px;left:0;right:0;bottom:0;padding:8px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#4b514d #090c0a}.u007-editor-scroll>.ixi-aos-primary-media-editor{margin-bottom:8px}.u007-editor-scroll section{margin-bottom:9px;overflow:hidden;border:1px solid #343a35;border-radius:5px;background:#101310}.u007-editor-title{height:21px;display:flex;align-items:center;padding:0 7px;border-bottom:1px solid #252a26;color:var(--y);font-size:6px;font-weight:950}.u007-name-field{display:block;padding:7px}.u007-name-field span{display:block;margin-bottom:4px;color:#929a95;font-size:5px;font-weight:900}.u007-name-field input{width:100%;height:29px;padding:0 7px;border:1px solid #3a413c;border-radius:4px;background:#0b0e0c;color:#fff;font-size:9px;font-weight:900}.u007-editor-columns,.u007-editor-row{display:grid;grid-template-columns:44% 1fr 20px;gap:4px;align-items:center;padding:0 6px}.u007-editor-columns{height:18px;color:#777f79;font-size:5px;font-weight:900}.u007-editor-row{min-height:34px;border-top:1px solid #242925}.u007-editor-row input{width:100%;height:24px;padding:0 5px;border:1px solid #343a35;border-radius:3px;background:#0b0e0c;color:#f2f4f2;font-size:7px;font-weight:850}.u007-editor-row button{width:20px;height:20px;border:1px solid #343a35;border-radius:3px;background:#111512;color:#737b76;font-size:12px}.u007-add-field{width:calc(100% - 12px);height:26px;margin:6px;border:1px solid #ffc40055;border-radius:4px;background:#ffc4000c;color:var(--y);font-size:6px;font-weight:950}
      `}</style>
    </article>
  );
}
