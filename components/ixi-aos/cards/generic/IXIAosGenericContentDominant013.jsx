import { useEffect, useMemo, useState } from "react";

import IXIObjectRail from "../../../ixi-object-system/IXIObjectRail";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";
import IXIAosPrimaryMediaEditor from "../../card-runtime/modules/IXIAosPrimaryMediaEditor";
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
  getObjectRelationships
} from "../../card-runtime/IXIAosSemanticObjectPresentation";

const W = 298;
const H = 471;

function valueText(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return clean(value?.displayName || value?.label || value?.name || value?.value);
  return String(value ?? "");
}

function parseValue(definition, rawValue) {
  const type = clean(definition?.fieldType || definition?.type).toLowerCase();
  if (["number", "integer", "money", "currency", "percent", "percentage"].includes(type)) {
    const number = Number(rawValue);
    return Number.isFinite(number) ? number : null;
  }
  if (["tags", "array", "list", "multi-select", "multiselect"].includes(type)) {
    return String(rawValue || "").split(",").map(clean).filter(Boolean);
  }
  return rawValue;
}

function isBusinessIdentifier(definition = {}) {
  return clean(definition?.fieldId) === "businessIdentifier" ||
    clean(definition?.presentationRole || definition?.semanticRole).toLowerCase() === "business-identifier";
}

function mediaUrl(item) {
  if (typeof item === "string") return clean(item);
  return clean(item?.url || item?.src || item?.imageUrl || item?.downloadUrl);
}

function mediaName(item, url = "") {
  if (typeof item === "object" && item) {
    const named = clean(item?.name || item?.fileName || item?.title || item?.label);
    if (named) return named;
  }
  try {
    const parsed = new URL(url);
    return decodeURIComponent(parsed.pathname.split("/").filter(Boolean).pop() || "");
  } catch {
    return clean(url).split("/").filter(Boolean).pop() || "";
  }
}

function mediaType(item, url = "") {
  const explicit = clean(typeof item === "object" ? item?.type || item?.mimeType || item?.contentType : "").toLowerCase();
  if (explicit) return explicit;
  const name = mediaName(item, url).toLowerCase();
  if (/\.(png|jpe?g|webp|gif|bmp|svg)$/.test(name)) return "image";
  if (/\.pdf$/.test(name)) return "application/pdf";
  if (/\.(doc|docx)$/.test(name)) return "document/word";
  if (/\.(xls|xlsx|csv)$/.test(name)) return "document/sheet";
  if (/\.(dwg|dxf)$/.test(name)) return "document/drawing";
  return "document";
}

function extensionLabel(item, url = "") {
  const name = mediaName(item, url);
  const match = name.match(/\.([a-z0-9]{1,8})$/i);
  if (match) return match[1].toUpperCase();
  const type = mediaType(item, url);
  if (type.includes("pdf")) return "PDF";
  if (type.includes("image")) return "IMAGE";
  if (type.includes("word")) return "DOC";
  if (type.includes("sheet")) return "SHEET";
  if (type.includes("drawing")) return "DRAWING";
  return "FILE";
}

function firstContent(object = {}) {
  const media = asArray(object?.media);
  for (const item of media) {
    const url = mediaUrl(item);
    if (url) return { item, url, name: mediaName(item, url), type: mediaType(item, url) };
  }
  return null;
}

function Editor({ object, saving, onCancel, onSave }) {
  const definitions = getFieldDefinitions(object).filter(definition => definition.editable !== false);
  const [name, setName] = useState(getObjectDisplayName(object));
  const [draft, setDraft] = useState({});
  const [media, setMedia] = useState(asArray(object?.media));

  useEffect(() => {
    const next = {};
    definitions.forEach(definition => {
      next[definition.fieldId] = valueText(getObjectFields(object)?.[definition.fieldId]);
    });
    setName(getObjectDisplayName(object));
    setDraft(next);
    setMedia(asArray(object?.media));
  }, [object]);

  async function save() {
    const fields = { ...getObjectFields(object) };
    definitions.forEach(definition => {
      fields[definition.fieldId] = parseValue(definition, draft[definition.fieldId]);
    });
    await onSave?.({ ...object, displayName: clean(name) || getObjectDisplayName(object), fields, media });
  }

  return (
    <div className="c013-editor" onPointerDown={event => event.stopPropagation()}>
      <header>
        <div><small>{getObjectLabel(object)}</small><strong>EDIT OBJECT</strong></div>
        <nav><button disabled={saving} onClick={save}>SAVE</button><button disabled={saving} onClick={onCancel}>CANCEL</button></nav>
      </header>
      <main>
        <IXIAosPrimaryMediaEditor media={media} onChange={setMedia} />
        <label><span>DISPLAY NAME</span><input value={name} onChange={event => setName(event.target.value)} /></label>
        {definitions.map(definition => (
          <label key={definition.fieldId}>
            <span>{definition.label}</span>
            <input value={draft[definition.fieldId] ?? ""} onChange={event => setDraft(current => ({ ...current, [definition.fieldId]: event.target.value }))} />
          </label>
        ))}
      </main>
    </div>
  );
}

export default function IXIAosGenericContentDominant013({
  object = {}, ixiState = {}, onSaveObject = null, onAddObject = null,
  onHideObject = null, onDeleteObject = null, onOpenConsole = null, onOpenTransact = null,
  onRecall = null, onBoard = null, onReturn = null, onSendFront = null, onSendBack = null,
  onCycleColor = null, onCycleOutline = null, onCycleFace = null, onRailSend = null,
  armedDestination = "", onSendToArmedDestination = null, skinId = "v12", onSkinChange = null
}) {
  const [runtimeObject, setRuntimeObject] = useState(object);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => setRuntimeObject(object), [object]);

  const actions = getObjectActionCapabilities(runtimeObject);
  const presentation = getObjectPresentation(runtimeObject);
  const fields = getObjectFields(runtimeObject);
  const relationships = getObjectRelationships(runtimeObject);
  const content = useMemo(() => firstContent(runtimeObject), [runtimeObject]);
  const visible = getFieldDefinitions(runtimeObject)
    .filter(definition => !isBusinessIdentifier(definition))
    .map(definition => ({ definition, value: valueText(fields?.[definition.fieldId]) }))
    .filter(item => clean(item.value));

  const typeField = visible[0] || null;
  const versionField = visible[1] || null;
  const statusField = visible[2] || null;
  const effectiveField = visible[3] || null;
  const expiryField = visible[4] || null;
  const ownerField = visible[5] || null;
  const extras = visible.slice(6, 9);
  const sampleUse = clean(runtimeObject?.metadata?.sampleUse || presentation?.sampleUse);
  const contentTitle = clean(presentation?.contentTitle) || "PRIMARY CONTENT";
  const relationshipsTitle = clean(presentation?.relationshipsTitle) || "RELATIONSHIPS";
  const contentIsImage = Boolean(content?.url && (content?.type === "image" || content?.type?.startsWith("image/")));

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

  function command(event, callback) {
    event.preventDefault();
    event.stopPropagation();
    callback?.(runtimeObject);
  }

  return (
    <article className="ixi-card-013" data-card-number="013" data-card-skin={skinId}>
      <header className="c013-head">
        <div className="c013-identity">
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

      <main className="c013-body">
        <section className="c013-content">
          <div className="c013-content-title"><span>{contentTitle}</span>{content?.url ? <a href={content.url} target="_blank" rel="noreferrer" onClick={event => event.stopPropagation()}>OPEN ↗</a> : null}</div>
          <div className="c013-preview">
            {contentIsImage ? (
              <img src={content.url} alt={getObjectDisplayName(runtimeObject)} />
            ) : content ? (
              <div className="c013-file">
                <div className="c013-file-badge"><b>IXI</b><strong>{extensionLabel(content.item, content.url)}</strong></div>
                <div className="c013-file-copy"><span>PRIMARY CONTENT</span><strong>{content.name || getObjectDisplayName(runtimeObject)}</strong><small>{content.type || "FILE"}</small></div>
              </div>
            ) : (
              <div className="c013-empty-preview"><div><b>IXI</b><strong>PRIMARY CONTENT</strong></div><span>DOCUMENT · DRAWING · IMAGE · RECORD</span></div>
            )}
          </div>
        </section>

        <section className="c013-facts">
          <div><span>{typeField?.definition?.label || "TYPE"}</span><strong>{typeField?.value || "—"}</strong></div>
          <div><span>{versionField?.definition?.label || "VERSION"}</span><strong>{versionField?.value || "—"}</strong></div>
          <div><span>{statusField?.definition?.label || "STATUS"}</span><strong>{statusField?.value || "—"}</strong></div>
        </section>

        <section className="c013-validity">
          <div><span>{effectiveField?.definition?.label || "EFFECTIVE"}</span><strong>{effectiveField?.value || "—"}</strong></div>
          <div><span>{expiryField?.definition?.label || "EXPIRES"}</span><strong>{expiryField?.value || "—"}</strong></div>
          <div><span>{ownerField?.definition?.label || "OWNER"}</span><strong>{ownerField?.value || "—"}</strong></div>
        </section>

        {extras.length ? <section className="c013-extra">{extras.map(({ definition, value }) => <div key={definition.fieldId}><span>{definition.label}</span><strong>{value}</strong></div>)}</section> : null}

        <section className="c013-relations">
          <div className="c013-title"><span>{relationshipsTitle}</span><b>{relationships.length}</b></div>
          <div className="c013-relation-scroll">
            {relationships.slice(0, 3).map(relationship => (
              <button type="button" key={relationship.id} onClick={event => event.stopPropagation()}>
                <span><small>{relationship.label}</small><strong>{relationship.value}</strong>{relationship.secondary ? <em>{relationship.secondary}</em> : null}</span><b>›</b>
              </button>
            ))}
            {!relationships.length ? <div className="c013-no-rel">NO RELATIONSHIPS</div> : null}
          </div>
        </section>
      </main>

      <nav className="c013-commands">
        <button onClick={event => command(event, onRecall)}>↻ <b>RECALL</b></button>
        <button onClick={event => command(event, onBoard)}>▦ <b>BOARD</b></button>
        <button onClick={event => command(event, onReturn)}>↩ <b>RETURN</b></button>
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

      {editing ? <Editor object={runtimeObject} saving={saving} onCancel={() => setEditing(false)} onSave={save} /> : null}

      <style jsx global>{`
        .ixi-card-013,.ixi-card-013 *{box-sizing:border-box}.ixi-card-013{--y:#ffc400;--cyan:#00c2ff;--line:#343a35;--soft:#252a26;position:relative;width:${W}px;height:${H}px;overflow:hidden;border:1px solid #454b47;border-radius:13px;background:radial-gradient(circle at 84% 12%,#17495e1c,transparent 26%),linear-gradient(180deg,#111412,#080a09);color:#f3f5f3;font-family:Arial,Helvetica,sans-serif;box-shadow:inset 0 1px #ffffff12,0 18px 40px #0008}
        .c013-head{position:absolute;inset:0 0 auto;height:48px;padding:7px 10px;border-bottom:1px solid #303531;background:linear-gradient(180deg,#181b19,#101210);z-index:30}.c013-identity{max-width:188px}.c013-identity>span{display:block;color:var(--y);font-size:6px;font-weight:950;letter-spacing:.08em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.c013-identity h2{margin:3px 0 0;color:#f7f8f7;font-size:13px;font-weight:950;line-height:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.c013-identity small{display:block;margin-top:4px;color:#6f7771;font-size:4.8px;font-weight:900;letter-spacing:.06em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .c013-body{position:absolute;top:48px;left:7px;right:7px;bottom:51px;display:flex;flex-direction:column;gap:5px;padding:5px 0;overflow:hidden}.c013-content{flex:0 0 151px;overflow:hidden;border:1px solid var(--line);border-radius:5px;background:#0b0e0c}.c013-content-title,.c013-title{height:21px;display:flex;align-items:center;justify-content:space-between;padding:0 7px;border-bottom:1px solid var(--soft);background:#151916}.c013-content-title span,.c013-title span{color:var(--y);font-size:6px;font-weight:950;letter-spacing:.05em}.c013-content-title a{color:var(--cyan);font-size:5px;font-weight:950;text-decoration:none}.c013-preview{height:129px;overflow:hidden;background:linear-gradient(135deg,#0c100e,#111511)}.c013-preview>img{width:100%;height:100%;display:block;object-fit:contain;background:#090b0a}.c013-file{height:100%;display:grid;grid-template-columns:82px 1fr;align-items:center;gap:12px;padding:12px 14px;background:linear-gradient(135deg,#0e120f,#151916)}.c013-file-badge{height:96px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid #4a514c;border-radius:4px;background:linear-gradient(180deg,#171b18,#0b0e0c);box-shadow:inset 0 1px #ffffff0d}.c013-file-badge b{color:var(--y);font-size:14px;letter-spacing:.08em}.c013-file-badge strong{margin-top:9px;color:#e9ecea;font-size:9px}.c013-file-copy{min-width:0;display:flex;flex-direction:column}.c013-file-copy span{color:#7c857f;font-size:5px;font-weight:950}.c013-file-copy strong{margin-top:7px;display:-webkit-box;overflow:hidden;color:#f1f3f2;font-size:9px;line-height:1.2;font-weight:950;-webkit-line-clamp:3;-webkit-box-orient:vertical}.c013-file-copy small{margin-top:8px;color:#737b76;font-size:5px;font-weight:850;text-transform:uppercase}.c013-empty-preview{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}.c013-empty-preview>div{display:flex;align-items:center;gap:9px}.c013-empty-preview b{display:grid;place-items:center;width:35px;height:35px;border:1px solid #ffc40055;border-radius:4px;color:var(--y);font-size:9px}.c013-empty-preview strong{color:#808983;font-size:9px;letter-spacing:.08em}.c013-empty-preview span{color:#59615c;font-size:5px;font-weight:900;letter-spacing:.08em}
        .c013-facts{flex:0 0 49px;display:grid;grid-template-columns:1.2fr .72fr .9fr;gap:5px}.c013-facts>div,.c013-validity>div,.c013-extra>div{min-width:0;display:flex;flex-direction:column;justify-content:center;padding:0 7px;border:1px solid var(--line);border-radius:5px;background:#111411}.c013-facts span,.c013-validity span,.c013-extra span{color:#7e8781;font-size:4.8px;font-weight:950;letter-spacing:.04em}.c013-facts strong,.c013-validity strong,.c013-extra strong{margin-top:4px;overflow:hidden;color:#eef1ef;font-size:7px;font-weight:950;text-overflow:ellipsis;white-space:nowrap}.c013-facts>div:last-child strong{color:var(--y)}
        .c013-validity{flex:0 0 45px;display:grid;grid-template-columns:1fr 1fr 1.2fr;gap:5px}.c013-extra{flex:0 0 39px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}.c013-extra>div{padding:0 6px}
        .c013-relations{min-height:0;flex:1;overflow:hidden;border:1px solid var(--line);border-radius:5px;background:#0e110f}.c013-title>b{display:grid;place-items:center;min-width:20px;height:13px;padding:0 4px;border:1px solid #ffffff10;border-radius:7px;background:#0c0f0d;color:#89918c;font-size:5px}.c013-relation-scroll{height:calc(100% - 21px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:#4d5550 transparent}.c013-relation-scroll::-webkit-scrollbar,.c013-editor main::-webkit-scrollbar{width:4px}.c013-relation-scroll::-webkit-scrollbar-track,.c013-editor main::-webkit-scrollbar-track{background:transparent}.c013-relation-scroll::-webkit-scrollbar-thumb,.c013-editor main::-webkit-scrollbar-thumb{border-radius:3px;background:#4d5550}.c013-relation-scroll::-webkit-scrollbar-thumb:hover,.c013-editor main::-webkit-scrollbar-thumb:hover{background:#7b6a20}.c013-relation-scroll button{width:100%;height:31px;display:grid;grid-template-columns:minmax(0,1fr) 15px;align-items:center;padding:0 7px;border:0;border-bottom:1px solid var(--soft);background:transparent;color:#fff;text-align:left}.c013-relation-scroll button>span{min-width:0;display:flex;flex-direction:column}.c013-relation-scroll small{color:#727a75;font-size:4.7px;font-weight:900}.c013-relation-scroll strong{margin-top:2px;overflow:hidden;color:#e9ecea;font-size:6.5px;font-weight:950;text-overflow:ellipsis;white-space:nowrap}.c013-relation-scroll em{color:#66706a;font-size:4.5px}.c013-relation-scroll button>b{color:#69716c;font-size:10px;text-align:right}.c013-no-rel{height:100%;display:grid;place-items:center;color:#59615c;font-size:5px;font-weight:900}
        .c013-commands{position:absolute;left:7px;right:7px;bottom:24px;height:24px;display:grid;grid-template-columns:repeat(3,1fr);gap:5px;z-index:20}.c013-commands button{border:1px solid #2f3531;border-radius:4px;background:#111411;color:var(--cyan);font-size:7px;font-weight:950}.c013-commands b{margin-left:3px;color:#aab0ac;font-size:5.5px}
        .c013-editor{position:absolute;inset:0;z-index:120;background:#0b0e0c}.c013-editor header{height:46px;display:flex;align-items:center;justify-content:space-between;padding:0 9px;border-bottom:1px solid #303531;background:#141714}.c013-editor header small{display:block;color:var(--y);font-size:5px;font-weight:950}.c013-editor header strong{display:block;margin-top:3px;font-size:10px}.c013-editor nav{display:flex;gap:4px}.c013-editor nav button{height:22px;padding:0 7px;border:1px solid #494f4b;border-radius:4px;background:#111411;color:#dfe2e0;font-size:5.5px;font-weight:950}.c013-editor nav button:first-child{border-color:#6b5d1c;color:var(--y)}.c013-editor main{position:absolute;top:46px;left:0;right:0;bottom:0;overflow-y:auto;padding:8px}.c013-editor label{display:block;margin:6px 0}.c013-editor label span{display:block;margin-bottom:3px;color:#8c948f;font-size:5px;font-weight:950}.c013-editor input{width:100%;height:26px;padding:0 7px;border:1px solid #343a35;border-radius:4px;background:#101310;color:#eef1ef;font-size:7px;font-weight:850;outline:none}.c013-editor input:focus{border-color:#7b6a20}
      `}</style>
    </article>
  );
}
