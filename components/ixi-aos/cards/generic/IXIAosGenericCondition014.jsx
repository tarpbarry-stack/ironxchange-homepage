import { useEffect, useState } from "react";

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
  getObjectRelationships,
  getPrimaryImage
} from "../../card-runtime/IXIAosSemanticObjectPresentation";

const W = 298;
const H = 471;

function valueText(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") {
    return clean(value?.displayName || value?.label || value?.name || value?.value);
  }
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
    await onSave?.({
      ...object,
      displayName: clean(name) || getObjectDisplayName(object),
      fields,
      media
    });
  }

  return (
    <div className="c014-editor" onPointerDown={event => event.stopPropagation()}>
      <header>
        <div><small>{getObjectLabel(object)}</small><strong>EDIT OBJECT</strong></div>
        <nav>
          <button type="button" disabled={saving} onClick={save}>SAVE</button>
          <button type="button" disabled={saving} onClick={onCancel}>CANCEL</button>
        </nav>
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

export default function IXIAosGenericCondition014({
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
  const image = getPrimaryImage(runtimeObject);
  const visible = getFieldDefinitions(runtimeObject)
    .filter(definition => clean(definition?.presentationRole || definition?.semanticRole).toLowerCase() !== "business-identifier")
    .map(definition => ({ definition, value: valueText(fields?.[definition.fieldId]) }))
    .filter(item => clean(item.value));

  const severity = visible[0] || null;
  const status = visible[1] || null;
  const condition = visible[2] || null;
  const occurredAt = visible[3] || null;
  const location = visible[4] || null;
  const relatedObject = visible[5] || null;
  const owner = visible[6] || null;
  const currentState = visible[7] || null;
  const extras = visible.slice(8, 11);
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

  function command(event, callback) {
    event.preventDefault();
    event.stopPropagation();
    callback?.(runtimeObject);
  }

  return (
    <article className="ixi-card-014" data-card-number="014" data-card-skin={skinId}>
      <header className="c014-head">
        <div className="c014-identity">
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

      <main className="c014-body">
        <section className="c014-state">
          <div className="c014-severity"><span>{severity?.definition?.label || "SEVERITY"}</span><strong>{severity?.value || "—"}</strong></div>
          <div className="c014-status"><span>{status?.definition?.label || "STATUS"}</span><strong>{status?.value || "—"}</strong></div>
        </section>

        <section className="c014-condition">
          <div className="c014-title">{clean(presentation?.conditionTitle) || condition?.definition?.label || "CONDITION / EVENT"}</div>
          <div className="c014-condition-copy"><b>◆</b><strong>{condition?.value || "—"}</strong></div>
        </section>

        <section className="c014-context-grid">
          <div><span>{occurredAt?.definition?.label || "WHEN"}</span><strong>{occurredAt?.value || "—"}</strong></div>
          <div><span>{location?.definition?.label || "WHERE"}</span><strong>{location?.value || "—"}</strong></div>
          <div><span>{relatedObject?.definition?.label || "RELATED OBJECT"}</span><strong>{relatedObject?.value || "—"}</strong></div>
          <div><span>{owner?.definition?.label || "OWNER"}</span><strong>{owner?.value || "—"}</strong></div>
        </section>

        <section className="c014-current">
          <div className="c014-title">{clean(presentation?.currentStateTitle) || currentState?.definition?.label || "CURRENT CONDITION"}</div>
          <div className="c014-current-value"><span>●</span><strong>{currentState?.value || "—"}</strong></div>
        </section>

        <section className="c014-evidence">
          <div className="c014-title"><span>{clean(presentation?.evidenceTitle) || "EVIDENCE / SUPPORTING DATA"}</span><b>{asArray(runtimeObject?.media).length}</b></div>
          <div className="c014-evidence-body">
            <div className="c014-evidence-media">
              {image ? <img src={image} alt={getObjectDisplayName(runtimeObject)} /> : <div><b>IXI</b><small>PRIMARY EVIDENCE</small></div>}
            </div>
            <div className="c014-extra-grid">
              {extras.map(({ definition, value }) => <div key={definition.fieldId}><span>{definition.label}</span><strong>{value}</strong></div>)}
              {!extras.length ? <div><span>DETAIL</span><strong>—</strong></div> : null}
            </div>
          </div>
        </section>

        <section className="c014-relations">
          <div className="c014-title"><span>{clean(presentation?.relationshipsTitle) || "RELATIONSHIPS"}</span><b>{relationships.length}</b></div>
          <div className="c014-scroll">
            {relationships.slice(0, 3).map(relationship => (
              <button type="button" key={relationship.id} onClick={event => event.stopPropagation()}>
                <span><small>{relationship.label}</small><strong>{relationship.value}</strong></span><b>›</b>
              </button>
            ))}
            {!relationships.length ? <div className="c014-empty">NO RELATIONSHIPS</div> : null}
          </div>
        </section>
      </main>

      <nav className="c014-commands">
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
        .ixi-card-014,.ixi-card-014 *{box-sizing:border-box}.ixi-card-014{--y:#ffc400;--line:#343a35;--soft:#252a26;position:relative;width:${W}px;height:${H}px;overflow:hidden;border:1px solid #454b47;border-radius:13px;background:radial-gradient(circle at 82% 10%,#5f2d1718,transparent 28%),linear-gradient(180deg,#111412,#080a09);color:#f3f5f3;font-family:Arial,Helvetica,sans-serif;box-shadow:inset 0 1px #ffffff12,0 18px 40px #0008}
        .c014-head{position:absolute;inset:0 0 auto;height:48px;padding:7px 10px;border-bottom:1px solid #303531;background:linear-gradient(180deg,#181b19,#101210);z-index:30}.c014-identity{max-width:188px}.c014-identity>span{display:block;color:var(--y);font-size:6px;font-weight:950;letter-spacing:.08em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.c014-identity h2{margin:3px 0 0;color:#f7f8f7;font-size:13px;font-weight:950;line-height:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.c014-identity small{display:block;margin-top:4px;color:#6f7771;font-size:4.8px;font-weight:900;letter-spacing:.06em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .c014-body{position:absolute;top:48px;left:7px;right:7px;bottom:51px;display:flex;flex-direction:column;gap:5px;padding:5px 0;overflow:hidden}.c014-state{flex:0 0 55px;display:grid;grid-template-columns:1.25fr 1fr;gap:5px}.c014-severity,.c014-status{display:flex;flex-direction:column;justify-content:center;padding:0 10px;border:1px solid var(--line);border-radius:5px;background:linear-gradient(180deg,#151815,#101310)}.c014-severity{border-color:#66593a}.c014-state span,.c014-context-grid span,.c014-extra-grid span{color:#8b938d;font-size:5px;font-weight:950;letter-spacing:.05em}.c014-severity span{color:var(--y)}.c014-state strong{margin-top:5px;overflow:hidden;font-size:13px;font-weight:950;text-overflow:ellipsis;white-space:nowrap}.c014-severity strong{color:#fff1b3}
        .c014-condition{flex:0 0 61px;overflow:hidden;border:1px solid var(--line);border-radius:5px;background:#0e110f}.c014-title{height:19px;display:flex;align-items:center;justify-content:space-between;padding:0 7px;border-bottom:1px solid var(--soft);background:#151916;color:var(--y);font-size:6px;font-weight:950;letter-spacing:.05em}.c014-title>b{display:grid;place-items:center;min-width:18px;height:12px;padding:0 4px;border:1px solid #ffffff10;border-radius:7px;background:#0b0e0c;color:#8a928c;font-size:5px}.c014-condition-copy{height:42px;display:flex;align-items:center;gap:9px;padding:0 9px}.c014-condition-copy>b{color:var(--y);font-size:11px}.c014-condition-copy>strong{min-width:0;overflow:hidden;color:#eef1ef;font-size:8px;font-weight:950;text-overflow:ellipsis;white-space:nowrap}
        .c014-context-grid{flex:0 0 78px;display:grid;grid-template-columns:1fr 1fr;gap:5px}.c014-context-grid>div,.c014-extra-grid>div{min-width:0;display:flex;flex-direction:column;justify-content:center;padding:0 8px;border:1px solid var(--line);border-radius:5px;background:#101310}.c014-context-grid strong,.c014-extra-grid strong{margin-top:4px;overflow:hidden;color:#e8ebe9;font-size:6.5px;font-weight:900;text-overflow:ellipsis;white-space:nowrap}
        .c014-current{flex:0 0 50px;overflow:hidden;border:1px solid var(--line);border-radius:5px;background:#0e110f}.c014-current-value{height:31px;display:flex;align-items:center;gap:7px;padding:0 8px}.c014-current-value span{color:var(--y);font-size:8px}.c014-current-value strong{min-width:0;overflow:hidden;color:#e8ebe9;font-size:7px;font-weight:950;text-overflow:ellipsis;white-space:nowrap}
        .c014-evidence{flex:0 0 73px;overflow:hidden;border:1px solid var(--line);border-radius:5px;background:#0e110f}.c014-evidence-body{height:54px;display:grid;grid-template-columns:72px 1fr;gap:5px;padding:5px}.c014-evidence-media{overflow:hidden;border:1px solid var(--soft);border-radius:4px;background:#090c0a}.c014-evidence-media img{width:100%;height:100%;display:block;object-fit:cover}.c014-evidence-media>div{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px}.c014-evidence-media>div b{color:#747c77;font-size:12px}.c014-evidence-media>div small{color:#626a65;font-size:4.3px;font-weight:900}.c014-extra-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px;overflow:hidden}.c014-extra-grid>div{padding:0 6px}
        .c014-relations{min-height:0;flex:1;overflow:hidden;border:1px solid var(--line);border-radius:5px;background:#0e110f}.c014-scroll{height:calc(100% - 19px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:#4d5550 transparent}.c014-scroll::-webkit-scrollbar,.c014-editor main::-webkit-scrollbar{width:4px}.c014-scroll::-webkit-scrollbar-track,.c014-editor main::-webkit-scrollbar-track{background:transparent}.c014-scroll::-webkit-scrollbar-thumb,.c014-editor main::-webkit-scrollbar-thumb{border-radius:3px;background:#4d5550}.c014-scroll::-webkit-scrollbar-thumb:hover,.c014-editor main::-webkit-scrollbar-thumb:hover{background:#7b6a20}.c014-scroll button{width:100%;min-height:28px;display:grid;grid-template-columns:1fr auto;align-items:center;padding:4px 6px;border:0;border-bottom:1px solid var(--soft);background:transparent;color:#fff;text-align:left}.c014-scroll button span{min-width:0;display:flex;flex-direction:column}.c014-scroll button small{color:#7c857f;font-size:4.8px;font-weight:900}.c014-scroll button strong{margin-top:2px;overflow:hidden;font-size:6.5px;text-overflow:ellipsis;white-space:nowrap}.c014-scroll button>b{color:#747c77}.c014-empty{padding:10px;color:#646c67;font-size:5px;font-weight:900;text-align:center}
        .c014-commands{position:absolute;left:7px;right:7px;bottom:23px;height:25px;display:grid;grid-template-columns:repeat(3,1fr);gap:5px;z-index:20}.c014-commands button{border:1px solid #303632;border-radius:4px;background:#101310;color:#00c2ff;font-size:8px;font-weight:950}.c014-commands b{margin-left:3px;color:#aab0ac;font-size:5.5px}
        .c014-editor{position:absolute;inset:0;z-index:100;background:#090b0a}.c014-editor>header{height:43px;display:flex;align-items:center;justify-content:space-between;padding:0 9px;border-bottom:1px solid var(--line);background:#141714}.c014-editor header small{display:block;color:var(--y);font-size:5px;font-weight:950}.c014-editor header strong{display:block;margin-top:3px;font-size:9px}.c014-editor nav{display:flex;gap:4px}.c014-editor nav button{height:22px;padding:0 8px;border:1px solid #4d4430;border-radius:4px;background:#111411;color:var(--y);font-size:5.5px;font-weight:950}.c014-editor main{position:absolute;top:43px;left:0;right:0;bottom:0;overflow-y:auto;padding:8px}.c014-editor main>label{display:block;margin-top:7px}.c014-editor label span{display:block;margin-bottom:4px;color:#8c948f;font-size:5px;font-weight:950}.c014-editor input{width:100%;height:28px;padding:0 7px;border:1px solid #343a35;border-radius:4px;background:#0f120f;color:#f0f2f1;font-size:7px;font-weight:850;outline:none}.c014-editor input:focus{border-color:#806a1f}
      `}</style>
    </article>
  );
}
