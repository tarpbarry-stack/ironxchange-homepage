import { useEffect, useMemo, useState } from "react";

import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";
import {
  asArray,
  clean,
  getFieldDefinitions,
  getFieldDisplayValue,
  getFieldsByRole,
  getObjectActionCapabilities,
  getObjectDisplayName,
  getObjectFields,
  getObjectId,
  getObjectLabel,
  getObjectPresentation,
  getObjectRelationships,
  getPrimaryImage
} from "../../card-runtime/IXIAosSemanticObjectPresentation";

function initials(value = "") {
  const parts = clean(value).split(/\s+/).filter(Boolean);
  if (!parts.length) return "IX";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function fieldValueText(object, definition) {
  return getFieldDisplayValue(object, definition) || "—";
}

function arrayFromValue(value) {
  if (Array.isArray(value)) {
    return value.map(item => typeof item === "string" ? clean(item) : clean(item?.label || item?.name || item?.value)).filter(Boolean);
  }
  return clean(value) ? [clean(value)] : [];
}

function inputValue(value) {
  if (Array.isArray(value)) return arrayFromValue(value).join(", ");
  if (value && typeof value === "object") return clean(value?.displayName || value?.label || value?.name || value?.value);
  return String(value ?? "");
}

function parseValue(definition, raw) {
  const type = clean(definition?.fieldType).toLowerCase();
  if (["number", "integer", "money", "currency"].includes(type)) {
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }
  if (["multi-select", "multiselect", "tags", "list", "array"].includes(type)) {
    return String(raw || "").split(",").map(clean).filter(Boolean);
  }
  return raw;
}

function choosePresentationFields(object = {}) {
  const definitions = getFieldDefinitions(object);
  const takeRole = role => getFieldsByRole(object, role)[0] || null;
  const used = new Set();
  const use = definition => {
    if (!definition) return null;
    used.add(definition.fieldId);
    return definition;
  };

  const subtitle = use(takeRole("subtitle") || takeRole("secondary"));
  const identifier = use(takeRole("identifier") || takeRole("id"));
  const group = use(takeRole("group") || takeRole("organization"));
  const location = use(takeRole("location"));
  const contactPrimary = use(takeRole("contact-primary") || takeRole("contact"));
  const contactSecondary = use(takeRole("contact-secondary"));

  const attributeDefinitions = definitions.filter(definition =>
    definition.presentationRole === "attribute" ||
    definition.presentationRole === "attribute-list" ||
    definition.presentationRole === "capability"
  );
  attributeDefinitions.forEach(use);

  const fallback = definitions.filter(definition => !used.has(definition.fieldId));
  const next = () => use(fallback.shift() || null);

  return {
    subtitle: subtitle || next(),
    identifier: identifier || next(),
    group: group || next(),
    location: location || next(),
    contactPrimary: contactPrimary || next(),
    contactSecondary: contactSecondary || next(),
    attributes: attributeDefinitions.length ? attributeDefinitions : fallback.slice(0, 1)
  };
}

function GenericEditor({ object, saving, onCancel, onSave }) {
  const definitions = getFieldDefinitions(object).filter(definition => definition.editable !== false);
  const [name, setName] = useState(getObjectDisplayName(object));
  const [draft, setDraft] = useState({});
  const [media, setMedia] = useState(asArray(object?.media));

  useEffect(() => {
    setName(getObjectDisplayName(object));
    const output = {};
    definitions.forEach(definition => {
      output[definition.fieldId] = inputValue(getObjectFields(object)?.[definition.fieldId]);
    });
    setDraft(output);
    setMedia(asArray(object?.media));
  }, [object]);

  const previewImage = useMemo(() => {
    for (const item of media) {
      const url = typeof item === "string" ? clean(item) : clean(item?.url || item?.src || item?.imageUrl);
      if (url) return url;
    }
    return "";
  }, [media]);

  function addPhoto(event) {
    const file = event?.target?.files?.[0];
    if (!file || !file.type?.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const photo = {
        url: String(reader.result || ""),
        name: clean(file.name),
        type: clean(file.type),
        size: Number(file.size || 0),
        source: "object-media-upload"
      };
      setMedia(current => [photo, ...current]);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function save() {
    const nextFields = { ...getObjectFields(object) };
    definitions.forEach(definition => {
      nextFields[definition.fieldId] = parseValue(definition, draft[definition.fieldId]);
    });
    await onSave?.({
      ...object,
      displayName: clean(name) || getObjectDisplayName(object),
      fields: nextFields,
      media
    });
  }

  return (
    <div className="go007-editor" onPointerDown={event => event.stopPropagation()}>
      <div className="go007-editor-head">
        <div><small>{getObjectLabel(object)}</small><strong>EDIT OBJECT</strong></div>
        <nav><button type="button" disabled={saving} onClick={save}>SAVE</button><button type="button" disabled={saving} onClick={onCancel}>CANCEL</button></nav>
      </div>
      <div className="go007-editor-scroll">
        <section className="go007-media-editor">
          <div className="go007-media-preview">{previewImage ? <img src={previewImage} alt="Object" /> : <span>NO PHOTO</span>}</div>
          <div className="go007-media-actions"><strong>PRIMARY IMAGE</strong><p>Upload or replace the image used by this card.</p><label>CHANGE PHOTO<input type="file" accept="image/*" onChange={addPhoto}/></label>{previewImage ? <button type="button" onClick={() => setMedia([])}>REMOVE</button> : null}</div>
        </section>
        <section>
          <div className="go007-editor-section-title">IDENTITY</div>
          <label><span>DISPLAY NAME</span><input value={name} onChange={event => setName(event.target.value)} /></label>
        </section>
        <section>
          <div className="go007-editor-section-title">FIELDS</div>
          {definitions.map(definition => (
            <label key={definition.fieldId}><span>{definition.label}</span><input value={draft[definition.fieldId] ?? ""} onChange={event => setDraft(current => ({ ...current, [definition.fieldId]: event.target.value }))}/></label>
          ))}
        </section>
      </div>
    </div>
  );
}

export default function IXIAosGenericObjectLayout007({
  object = {},
  onAddObject = null,
  onSaveObject = null,
  onHideObject = null,
  onDeleteObject = null,
  onOpenConsole = null,
  onOpenTransact = null,
  onPrimaryAction = null,
  onSecondaryAction = null,
  onRecords = null,
  skinId = "v12",
  onSkinChange = null
}) {
  const [runtimeObject, setRuntimeObject] = useState(object);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => setRuntimeObject(object), [object]);

  const presentationFields = choosePresentationFields(runtimeObject);
  const relationships = getObjectRelationships(runtimeObject).slice(0, 6);
  const actions = getObjectActionCapabilities(runtimeObject);
  const presentation = getObjectPresentation(runtimeObject);
  const image = getPrimaryImage(runtimeObject);
  const displayName = getObjectDisplayName(runtimeObject);
  const objectLabel = getObjectLabel(runtimeObject);
  const attributes = presentationFields.attributes.flatMap(definition => arrayFromValue(getObjectFields(runtimeObject)?.[definition.fieldId]));
  const attributesTitle = clean(presentation?.attributesTitle) || (presentationFields.attributes[0]?.label || "ATTRIBUTES");
  const relationshipsTitle = clean(presentation?.relationshipsTitle) || "RELATIONSHIPS & ASSOCIATIONS";
  const actionOneLabel = clean(presentation?.primaryActionLabel) || "ACTION";
  const actionTwoLabel = clean(presentation?.secondaryActionLabel) || "CONTACT";

  async function save(nextObject) {
    setSaving(true);
    try {
      await onSaveObject?.({
        objectId: getObjectId(nextObject),
        object: nextObject,
        displayName: nextObject.displayName,
        fields: { ...getObjectFields(nextObject) },
        media: asArray(nextObject.media)
      });
      setRuntimeObject(nextObject);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="ixi-generic-object-007" data-card-number="007" data-card-skin={skinId}>
      <header className="go007-header">
        <div className="go007-header-copy"><span>{objectLabel}</span></div>
        <IXIAosCardHeaderControls
          canAdd={actions.canCreate && typeof onAddObject === "function"}
          canEdit={actions.canEdit}
          canTransact={actions.canTransact}
          onAdd={() => onAddObject?.(runtimeObject)}
          onToggleEdit={() => setEditing(true)}
          onTransact={() => onOpenTransact?.(runtimeObject)}
          onHide={onHideObject}
          onDelete={onDeleteObject}
          onOpenConsole={actions.canOpenConsole ? onOpenConsole : null}
          skinId={skinId}
          onSkinChange={onSkinChange}
        />
      </header>

      <div className="go007-scroll">
        <section className="go007-identity-panel">
          <div className="go007-photo">{image ? <img src={image} alt={displayName}/> : <div><b>{initials(displayName)}</b><small>PRIMARY IMAGE</small></div>}</div>
          <div className="go007-identity-copy">
            <h2>{displayName}</h2>
            {presentationFields.subtitle ? <p>{fieldValueText(runtimeObject, presentationFields.subtitle)}</p> : null}
            {presentationFields.identifier ? <div className="go007-fact"><small>{presentationFields.identifier.label}</small><strong>{fieldValueText(runtimeObject, presentationFields.identifier)}</strong></div> : null}
            {presentationFields.group ? <div className="go007-fact"><small>{presentationFields.group.label}</small><strong>{fieldValueText(runtimeObject, presentationFields.group)}</strong></div> : null}
            {presentationFields.location ? <div className="go007-fact"><small>{presentationFields.location.label}</small><strong>{fieldValueText(runtimeObject, presentationFields.location)}</strong></div> : null}
          </div>
        </section>

        {(presentationFields.contactPrimary || presentationFields.contactSecondary) ? (
          <section className="go007-contact-panel">
            {[presentationFields.contactPrimary, presentationFields.contactSecondary].filter(Boolean).map(definition => <button key={definition.fieldId} type="button" onClick={event => event.stopPropagation()}><small>{definition.label}</small><strong>{fieldValueText(runtimeObject, definition)}</strong></button>)}
          </section>
        ) : null}

        {attributes.length ? (
          <section className="go007-section"><div className="go007-section-title">{attributesTitle}</div><div className="go007-tags">{attributes.map((value,index)=><span key={`${value}-${index}`}>{value}</span>)}</div></section>
        ) : null}

        <section className="go007-section go007-relationships"><div className="go007-section-title">{relationshipsTitle}</div><div className="go007-relationship-scroll">{relationships.map(relationship => <button key={relationship.id} type="button" onClick={event => event.stopPropagation()}><span><small>{relationship.label}</small><strong>{relationship.value}</strong>{relationship.secondary ? <em>{relationship.secondary}</em> : null}</span><b>›</b></button>)}{!relationships.length ? <div className="go007-empty">NO RELATIONSHIPS</div> : null}</div></section>
      </div>

      <nav className="go007-actions">
        <button type="button" onClick={() => onPrimaryAction?.(runtimeObject)}><span>◇</span><b>{actionOneLabel}</b></button>
        <button type="button" onClick={() => onSecondaryAction?.(runtimeObject)}><span>▢</span><b>{actionTwoLabel}</b></button>
        <button type="button" onClick={() => onRecords?.(runtimeObject)}><span>▱</span><b>RECORDS</b></button>
      </nav>
      <div className="go007-rail"><i/><i/><i/><i/><i/><i/></div>

      {editing ? <GenericEditor object={runtimeObject} saving={saving} onCancel={() => setEditing(false)} onSave={save}/> : null}

      <style jsx global>{`
        .ixi-generic-object-007,.ixi-generic-object-007 *{box-sizing:border-box}.ixi-generic-object-007{--y:#ffc400;--green:#7bcf2a;--line:#343a35;position:relative;width:298px;height:471px;overflow:hidden;border:1px solid #505653;border-radius:13px;background:radial-gradient(circle at 82% 12%,#17495e21,transparent 27%),linear-gradient(180deg,#101413,#080b0a);color:#f3f5f4;font-family:Arial,Helvetica,sans-serif;box-shadow:inset 0 1px #ffffff14,0 18px 42px #0008}.go007-header{position:absolute;inset:0 0 auto;height:42px;display:flex;align-items:center;padding:0 10px;border-bottom:1px solid #ffffff18;background:linear-gradient(180deg,#171b1a,#101312);z-index:20}.go007-header-copy span{display:block;max-width:145px;color:#e8ebea;font-size:11px;font-weight:900;letter-spacing:.7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.go007-scroll{position:absolute;top:42px;left:0;right:0;bottom:67px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#59605c #0a0c0b}.go007-identity-panel{min-height:136px;display:grid;grid-template-columns:104px 1fr;gap:10px;padding:9px 10px}.go007-photo{height:116px;overflow:hidden;border:1px solid #3d4440;border-radius:7px;background:#0c100e}.go007-photo img{width:100%;height:100%;object-fit:cover}.go007-photo>div{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center}.go007-photo b{font-size:28px;color:#5f6863}.go007-photo small{margin-top:7px;color:#656d68;font-size:5px;font-weight:900}.go007-identity-copy{min-width:0}.go007-identity-copy h2{margin:2px 0 3px;font-size:15px;line-height:1;font-weight:950;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.go007-identity-copy p{margin:0 0 7px;color:#b9c0bc;font-size:7px;font-weight:850;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.go007-fact{padding:5px 0;border-top:1px solid #ffffff12}.go007-fact small{display:block;color:#7e8782;font-size:5px;font-weight:900}.go007-fact strong{display:block;margin-top:2px;color:#eef1ef;font-size:7px;font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.go007-contact-panel{display:grid;grid-template-columns:1fr 1fr;margin:0 10px 7px;border:1px solid var(--line);border-radius:5px;overflow:hidden;background:#111512}.go007-contact-panel button{min-width:0;height:45px;padding:7px;border:0;border-right:1px solid #292e2a;background:transparent;color:#fff;text-align:left}.go007-contact-panel button:last-child{border-right:0}.go007-contact-panel small{display:block;color:#858d88;font-size:5px;font-weight:900}.go007-contact-panel strong{display:block;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:7px}.go007-section{margin:0 10px 7px;border:1px solid var(--line);border-radius:5px;background:#111512;overflow:hidden}.go007-section-title{height:20px;display:flex;align-items:center;padding:0 6px;border-bottom:1px solid #292e2a;color:var(--y);font-size:6px;font-weight:950}.go007-tags{display:flex;flex-wrap:wrap;gap:4px;padding:6px;max-height:82px;overflow-y:auto}.go007-tags span{padding:5px 7px;border:1px solid #3c443f;border-radius:10px;background:#171c18;color:#dde1de;font-size:6px;font-weight:850}.go007-relationship-scroll{max-height:150px;overflow-y:auto}.go007-relationship-scroll button{width:100%;min-height:34px;display:grid;grid-template-columns:1fr auto;align-items:center;padding:5px 7px;border:0;border-bottom:1px solid #292e2a;background:transparent;color:#fff;text-align:left}.go007-relationship-scroll button span{min-width:0;display:flex;flex-direction:column}.go007-relationship-scroll small{color:#7f8782;font-size:5px;font-weight:900}.go007-relationship-scroll strong{margin-top:2px;font-size:7px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.go007-relationship-scroll em{margin-top:2px;color:#6f7772;font-size:5px;font-style:normal}.go007-relationship-scroll button>b{font-size:14px;color:#747d77}.go007-empty{padding:10px;color:#666e69;font-size:6px;font-weight:900}.go007-actions{position:absolute;left:0;right:0;bottom:19px;height:48px;display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #303632;background:#0c0f0d}.go007-actions button{border:0;border-right:1px solid #252a26;background:transparent;color:#aeb5b1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px}.go007-actions button:last-child{border-right:0}.go007-actions span{font-size:12px;color:#d0d5d2}.go007-actions b{max-width:90px;font-size:5px;font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.go007-rail{position:absolute;left:0;right:0;bottom:0;height:19px;display:grid;grid-template-columns:repeat(6,1fr);border-top:1px solid #2d332f;background:#090c0a}.go007-rail i{border-right:1px solid #202420}.go007-editor{position:absolute;inset:42px 7px 19px;z-index:250;overflow:hidden;border:1px solid #4b524e;border-radius:7px;background:#080b09;box-shadow:0 16px 34px #000d}.go007-editor-head{height:43px;display:flex;align-items:center;justify-content:space-between;padding:0 8px;border-bottom:1px solid var(--line);background:#121613}.go007-editor-head small{display:block;color:#8d958f;font-size:5px;font-weight:900}.go007-editor-head strong{display:block;margin-top:3px;color:var(--y);font-size:8px}.go007-editor-head nav{display:flex;gap:3px}.go007-editor-head button{height:24px;padding:0 7px;border:1px solid #454c47;border-radius:4px;background:#0c0f0d;color:var(--y);font-size:6px;font-weight:950}.go007-editor-scroll{position:absolute;inset:43px 0 0;overflow-y:auto;padding:7px}.go007-editor section{margin:0 0 7px;padding:7px;border:1px solid #303631;border-radius:5px;background:#111512}.go007-editor-section-title{margin-bottom:7px;color:var(--y);font-size:6px;font-weight:950}.go007-editor label{display:block;margin-bottom:7px}.go007-editor label>span{display:block;margin-bottom:3px;color:#9ea6a1;font-size:5px;font-weight:950}.go007-editor input{width:100%;height:27px;padding:0 6px;border:1px solid #343a35;border-radius:4px;background:#080b09;color:#fff;font-size:7px;font-weight:800;outline:none}.go007-media-editor{display:grid!important;grid-template-columns:86px 1fr;gap:8px}.go007-media-preview{height:92px;display:grid;place-items:center;overflow:hidden;border:1px solid #3b423d;border-radius:5px;background:#070907;color:#686f6b;font-size:6px;font-weight:900}.go007-media-preview img{width:100%;height:100%;object-fit:cover}.go007-media-actions{display:flex;flex-direction:column;align-items:flex-start}.go007-media-actions strong{color:var(--y);font-size:6px}.go007-media-actions p{margin:5px 0 8px;color:#8d958f;font-size:5.5px;line-height:1.3}.go007-media-actions label,.go007-media-actions button{height:24px;margin:0 0 4px;padding:0 7px;display:flex;align-items:center;border:1px solid #ffc4006b;border-radius:4px;background:#17150b;color:var(--y);font-size:6px;font-weight:950;cursor:pointer}.go007-media-actions label input{position:absolute;width:1px;height:1px;opacity:0}.go007-media-actions button{border-color:#414842;background:#0d100e;color:#aeb5b1}
      `}</style>
    </article>
  );
}
