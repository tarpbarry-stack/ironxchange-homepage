import { useEffect, useState } from "react";

import IXIObjectRail from "../../../ixi-object-system/IXIObjectRail";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";
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

function percentValue(value) {
  const number = Number(String(value ?? "").replace("%", ""));
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, number));
}

function Editor({ object, saving, onCancel, onSave }) {
  const definitions = getFieldDefinitions(object).filter(definition => definition.editable !== false);
  const [name, setName] = useState(getObjectDisplayName(object));
  const [draft, setDraft] = useState({});

  useEffect(() => {
    const next = {};
    definitions.forEach(definition => {
      next[definition.fieldId] = valueText(getObjectFields(object)?.[definition.fieldId]);
    });
    setName(getObjectDisplayName(object));
    setDraft(next);
  }, [object]);

  async function save() {
    const fields = { ...getObjectFields(object) };
    definitions.forEach(definition => {
      fields[definition.fieldId] = parseValue(definition, draft[definition.fieldId]);
    });
    await onSave?.({ ...object, displayName: clean(name) || getObjectDisplayName(object), fields });
  }

  return (
    <div className="c012-editor" onPointerDown={event => event.stopPropagation()}>
      <header>
        <div><small>{getObjectLabel(object)}</small><strong>EDIT OBJECT</strong></div>
        <nav><button disabled={saving} onClick={save}>SAVE</button><button disabled={saving} onClick={onCancel}>CANCEL</button></nav>
      </header>
      <main>
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

export default function IXIAosGenericLifecycle012({
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
  const visible = getFieldDefinitions(runtimeObject)
    .filter(definition => clean(definition?.presentationRole || definition?.semanticRole).toLowerCase() !== "business-identifier")
    .map(definition => ({ definition, value: valueText(fields?.[definition.fieldId]) }))
    .filter(item => clean(item.value));

  const status = visible[0] || null;
  const progress = visible[1] || null;
  const stage = visible[2] || null;
  const start = visible[3] || null;
  const due = visible[4] || null;
  const owner = visible[5] || null;
  const milestone = visible[6] || null;
  const extras = visible.slice(7, 11);
  const percent = percentValue(progress?.value);
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
    <article className="ixi-card-012" data-card-number="012" data-card-skin={skinId}>
      <header className="c012-head">
        <div className="c012-identity">
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

      <main className="c012-body">
        <section className="c012-status">
          <div className="c012-status-copy"><span>{status?.definition?.label || "STATUS"}</span><strong>{status?.value || "—"}</strong></div>
          <div className="c012-progress-copy"><span>{progress?.definition?.label || "PROGRESS"}</span><strong>{progress?.value ? `${percent}%` : "—"}</strong></div>
        </section>

        <section className="c012-progress-band">
          <div className="c012-progress-line"><i style={{ width: `${percent}%` }} /><b style={{ left: `calc(${percent}% - 5px)` }} /></div>
          <div className="c012-dates">
            <div><span>{start?.definition?.label || "START"}</span><strong>{start?.value || "—"}</strong></div>
            <div><span>{due?.definition?.label || "TARGET"}</span><strong>{due?.value || "—"}</strong></div>
          </div>
        </section>

        <section className="c012-stage-grid">
          <div className="c012-stage primary"><span>{stage?.definition?.label || "CURRENT STAGE"}</span><strong>{stage?.value || "—"}</strong></div>
          <div className="c012-stage"><span>{owner?.definition?.label || "OWNER"}</span><strong>{owner?.value || "—"}</strong></div>
        </section>

        <section className="c012-milestone">
          <div className="c012-title">{clean(presentation?.milestoneTitle) || "NEXT MILESTONE"}</div>
          <div className="c012-milestone-value"><span>◆</span><strong>{milestone?.value || "—"}</strong></div>
        </section>

        <section className="c012-detail-grid">
          {extras.map(({ definition, value }) => <div key={definition.fieldId}><span>{definition.label}</span><strong>{value}</strong></div>)}
          {!extras.length ? <div><span>DETAIL</span><strong>—</strong></div> : null}
        </section>

        <section className="c012-relations">
          <div className="c012-title">{clean(presentation?.relationshipsTitle) || "RELATIONSHIPS"}</div>
          <div className="c012-scroll">
            {relationships.slice(0, 3).map(relationship => (
              <button type="button" key={relationship.id} onClick={event => event.stopPropagation()}>
                <span><small>{relationship.label}</small><strong>{relationship.value}</strong></span><b>›</b>
              </button>
            ))}
            {!relationships.length ? <div className="c012-empty">NO RELATIONSHIPS</div> : null}
          </div>
        </section>
      </main>

      <nav className="c012-commands">
        <button onClick={event => command(event,onRecall)}>↻ <b>RECALL</b></button>
        <button onClick={event => command(event,onBoard)}>▦ <b>BOARD</b></button>
        <button onClick={event => command(event,onReturn)}>↩ <b>RETURN</b></button>
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
        .ixi-card-012,.ixi-card-012 *{box-sizing:border-box}.ixi-card-012{--y:#ffc400;--line:#343a35;--soft:#252a26;position:relative;width:298px;height:471px;overflow:hidden;border:1px solid #454b47;border-radius:13px;background:linear-gradient(180deg,#111412,#080a09);color:#f3f5f3;font-family:Arial,Helvetica,sans-serif;box-shadow:inset 0 1px #ffffff12,0 18px 40px #0008}
        .c012-head{position:absolute;inset:0 0 auto;height:48px;padding:7px 10px;border-bottom:1px solid #303531;background:linear-gradient(180deg,#181b19,#101210);z-index:30}.c012-identity{max-width:188px}.c012-identity>span{display:block;color:var(--y);font-size:6px;font-weight:950;letter-spacing:.08em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.c012-identity h2{margin:3px 0 0;color:#f7f8f7;font-size:13px;font-weight:950;line-height:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.c012-identity small{display:block;margin-top:4px;color:#6f7771;font-size:4.8px;font-weight:900;letter-spacing:.06em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .c012-body{position:absolute;top:48px;left:7px;right:7px;bottom:51px;display:flex;flex-direction:column;gap:5px;padding:5px 0;overflow:hidden}.c012-status{flex:0 0 58px;display:grid;grid-template-columns:1.45fr .75fr;gap:5px}.c012-status-copy,.c012-progress-copy{display:flex;flex-direction:column;justify-content:center;padding:0 10px;border:1px solid var(--line);border-radius:5px;background:linear-gradient(180deg,#151815,#101310)}.c012-status-copy{border-color:#5b5540}.c012-status span,.c012-stage span,.c012-dates span,.c012-detail-grid span{color:#8b938d;font-size:5px;font-weight:950;letter-spacing:.05em}.c012-status-copy>span{color:var(--y)}.c012-status strong{margin-top:5px;font-size:14px;font-weight:950}.c012-progress-copy strong{font-size:18px;color:var(--y)}
        .c012-progress-band{flex:0 0 58px;padding:11px 10px 7px;border:1px solid var(--line);border-radius:5px;background:#101310}.c012-progress-line{position:relative;height:6px;border-radius:4px;background:#292e2a;box-shadow:inset 0 1px 2px #0008}.c012-progress-line i{display:block;height:100%;border-radius:4px;background:linear-gradient(90deg,#b58b00,var(--y))}.c012-progress-line b{position:absolute;top:-3px;width:11px;height:11px;border:2px solid #171a18;border-radius:50%;background:var(--y);box-shadow:0 0 0 1px #6f651e}.c012-dates{display:flex;justify-content:space-between;margin-top:10px}.c012-dates div:last-child{text-align:right}.c012-dates strong{display:block;margin-top:2px;color:#e5e8e6;font-size:6.5px}
        .c012-stage-grid{flex:0 0 54px;display:grid;grid-template-columns:1.25fr 1fr;gap:5px}.c012-stage{min-width:0;display:flex;flex-direction:column;justify-content:center;padding:0 9px;border:1px solid var(--line);border-radius:5px;background:#111411}.c012-stage.primary{background:linear-gradient(180deg,#171914,#11130f)}.c012-stage strong{margin-top:5px;overflow:hidden;color:#f0f2f1;font-size:9px;font-weight:950;text-overflow:ellipsis;white-space:nowrap}.c012-stage.primary strong{color:var(--y)}
        .c012-milestone{flex:0 0 58px;overflow:hidden;border:1px solid var(--line);border-radius:5px;background:#0e110f}.c012-title{height:19px;display:flex;align-items:center;padding:0 7px;border-bottom:1px solid var(--soft);background:#151916;color:var(--y);font-size:6px;font-weight:950;letter-spacing:.05em}.c012-milestone-value{height:39px;display:flex;align-items:center;gap:8px;padding:0 9px}.c012-milestone-value span{color:var(--y);font-size:10px}.c012-milestone-value strong{min-width:0;overflow:hidden;color:#e8ebe9;font-size:8px;font-weight:950;text-overflow:ellipsis;white-space:nowrap}
        .c012-detail-grid{flex:0 0 42px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;overflow:hidden}.c012-detail-grid>div{min-width:0;display:flex;flex-direction:column;justify-content:center;padding:0 8px;border:1px solid var(--line);border-radius:5px;background:#101310}.c012-detail-grid strong{margin-top:3px;overflow:hidden;color:#e5e8e6;font-size:6.5px;font-weight:900;text-overflow:ellipsis;white-space:nowrap}
        .c012-relations{min-height:0;flex:1;overflow:hidden;border:1px solid var(--line);border-radius:5px;background:#0e110f}.c012-scroll{height:calc(100% - 19px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:#4b514d transparent}.c012-scroll::-webkit-scrollbar,.c012-editor main::-webkit-scrollbar{width:4px}.c012-scroll::-webkit-scrollbar-track,.c012-editor main::-webkit-scrollbar-track{background:transparent}.c012-scroll::-webkit-scrollbar-thumb,.c012-editor main::-webkit-scrollbar-thumb{border-radius:6px;background:#4b514d}.c012-scroll button{width:100%;height:28px;display:flex;align-items:center;justify-content:space-between;padding:0 8px;border:0;border-bottom:1px solid #222723;background:transparent;color:#e8ebe9;text-align:left}.c012-scroll button span{min-width:0}.c012-scroll small{display:block;color:#7f8781;font-size:4.5px;font-weight:900}.c012-scroll strong{display:block;margin-top:2px;font-size:6.5px;font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.c012-scroll button>b{color:var(--y);font-size:10px}.c012-empty{height:100%;display:flex;align-items:center;justify-content:center;color:#59605b;font-size:5px;font-weight:900}
        .c012-commands{position:absolute;left:7px;right:7px;bottom:23px;height:28px;display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:3px 0}.c012-commands button{border:1px solid #2c312d;border-radius:4px;background:linear-gradient(180deg,#131613,#0d100e);color:#8b938d;font-size:7px;font-weight:900}.c012-commands button b{margin-left:3px;color:#d7dbd8;font-size:5.5px;letter-spacing:.04em}
        .c012-editor{position:absolute;inset:0;z-index:200;background:#0b0d0c}.c012-editor>header{height:43px;display:flex;align-items:center;justify-content:space-between;padding:0 9px;border-bottom:1px solid #303531;background:#151815}.c012-editor>header small{display:block;color:var(--y);font-size:5px;font-weight:950}.c012-editor>header strong{display:block;margin-top:3px;font-size:10px}.c012-editor nav{display:flex;gap:4px}.c012-editor button{height:22px;padding:0 8px;border:1px solid #ffffff16;border-radius:4px;background:#111411;color:#dce0dd;font-size:6px;font-weight:950}.c012-editor nav button:first-child{color:var(--y)}.c012-editor main{position:absolute;top:43px;left:0;right:0;bottom:0;padding:8px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#4b514d transparent}.c012-editor label{display:block;margin-bottom:6px;padding:7px;border:1px solid #2b302c;border-radius:5px;background:#101310}.c012-editor label span{display:block;margin-bottom:4px;color:#8d958f;font-size:5px;font-weight:900}.c012-editor input{width:100%;height:25px;padding:0 7px;border:1px solid #333934;border-radius:4px;background:#090b0a;color:#edf0ee;font-size:7px;font-weight:850;outline:none}
      `}</style>
    </article>
  );
}
