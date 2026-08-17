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
    <div className="c015-editor" onPointerDown={event => event.stopPropagation()}>
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

export default function IXIAosGenericAgreement015({
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

  const stateField = visible[0] || null;
  const partyOne = visible[1] || null;
  const partyTwo = visible[2] || null;
  const effective = visible[3] || null;
  const expires = visible[4] || null;
  const renewal = visible[5] || null;
  const notice = visible[6] || null;
  const obligation = visible[7] || null;
  const owner = visible[8] || null;
  const extras = visible.slice(9, 12);
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
    <article className="ixi-card-015" data-card-number="015" data-card-skin={skinId}>
      <header className="c015-head">
        <div className="c015-identity">
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

      <main className="c015-body">
        <section className="c015-state">
          <div><span>{stateField?.definition?.label || "STATE"}</span><strong>{stateField?.value || "—"}</strong></div>
          <aside><small>{owner?.definition?.label || "OWNER"}</small><b>{owner?.value || "—"}</b></aside>
        </section>

        <section className="c015-parties">
          <div><span>{partyOne?.definition?.label || "PARTY"}</span><strong>{partyOne?.value || "—"}</strong></div>
          <div><span>{partyTwo?.definition?.label || "COUNTERPARTY"}</span><strong>{partyTwo?.value || "—"}</strong></div>
        </section>

        <section className="c015-dates">
          {[effective, expires, renewal, notice].map((item, index) => (
            <div key={item?.definition?.fieldId || index}>
              <span>{item?.definition?.label || ["EFFECTIVE","EXPIRES","RENEWAL","NOTICE"][index]}</span>
              <strong>{item?.value || "—"}</strong>
            </div>
          ))}
        </section>

        <section className="c015-obligation">
          <div className="c015-title">{clean(presentation?.obligationTitle) || obligation?.definition?.label || "OBLIGATION / COVERAGE"}</div>
          <p>{obligation?.value || "—"}</p>
        </section>

        <section className="c015-extra">
          {extras.map(({ definition, value }) => <div key={definition.fieldId}><span>{definition.label}</span><strong>{value}</strong></div>)}
          {!extras.length ? <div><span>DETAIL</span><strong>—</strong></div> : null}
        </section>

        <section className="c015-relations">
          <div className="c015-title">{clean(presentation?.relationshipsTitle) || "RELATIONSHIPS"}</div>
          <div className="c015-scroll">
            {relationships.slice(0, 3).map(relationship => (
              <button type="button" key={relationship.id} onClick={event => event.stopPropagation()}>
                <span><small>{relationship.label}</small><strong>{relationship.value}</strong></span><b>›</b>
              </button>
            ))}
            {!relationships.length ? <div className="c015-empty">NO RELATIONSHIPS</div> : null}
          </div>
        </section>
      </main>

      <nav className="c015-commands">
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
        .ixi-card-015,.ixi-card-015 *{box-sizing:border-box}.ixi-card-015{--y:#ffc400;--line:#343a35;--soft:#252a26;position:relative;width:298px;height:471px;overflow:hidden;border:1px solid #454b47;border-radius:13px;background:radial-gradient(circle at 82% 12%,#17495e1d,transparent 25%),linear-gradient(180deg,#111412,#080a09);color:#f3f5f3;font-family:Arial,Helvetica,sans-serif;box-shadow:inset 0 1px #ffffff12,0 18px 40px #0008}
        .c015-head{position:absolute;inset:0 0 auto;height:48px;padding:7px 10px;border-bottom:1px solid #303531;background:linear-gradient(180deg,#181b19,#101210);z-index:30}.c015-identity{max-width:188px}.c015-identity>span{display:block;color:var(--y);font-size:6px;font-weight:950;letter-spacing:.08em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.c015-identity h2{margin:3px 0 0;font-size:13px;font-weight:950;line-height:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.c015-identity small{display:block;margin-top:4px;color:#6f7771;font-size:4.8px;font-weight:900;letter-spacing:.06em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .c015-body{position:absolute;top:48px;left:7px;right:7px;bottom:51px;display:flex;flex-direction:column;gap:5px;padding:5px 0;overflow:hidden}.c015-state{flex:0 0 54px;display:grid;grid-template-columns:1.2fr .8fr;gap:5px}.c015-state>div,.c015-state aside{display:flex;flex-direction:column;justify-content:center;padding:0 9px;border:1px solid var(--line);border-radius:5px;background:#111411}.c015-state>div{border-color:#5b5540}.c015-state span,.c015-state small,.c015-parties span,.c015-dates span,.c015-extra span{color:#8b938d;font-size:5px;font-weight:950;letter-spacing:.05em}.c015-state>div span{color:var(--y)}.c015-state strong{margin-top:4px;color:#f4f6f4;font-size:15px;font-weight:950}.c015-state aside b{margin-top:4px;overflow:hidden;color:#d9ddda;font-size:7px;text-overflow:ellipsis;white-space:nowrap}
        .c015-parties{flex:0 0 52px;display:grid;grid-template-columns:1fr 1fr;gap:5px}.c015-parties>div{min-width:0;display:flex;flex-direction:column;justify-content:center;padding:0 8px;border:1px solid var(--line);border-radius:5px;background:#101310}.c015-parties strong{margin-top:4px;overflow:hidden;color:#eef1ef;font-size:7.5px;font-weight:950;text-overflow:ellipsis;white-space:nowrap}
        .c015-dates{flex:0 0 74px;display:grid;grid-template-columns:1fr 1fr;gap:5px}.c015-dates>div{display:flex;flex-direction:column;justify-content:center;padding:0 8px;border:1px solid var(--line);border-radius:5px;background:#101310}.c015-dates strong{margin-top:4px;color:#eef1ef;font-size:7px;font-weight:950}.c015-dates>div:nth-child(2) strong{color:var(--y)}
        .c015-obligation{flex:0 0 64px;overflow:hidden;border:1px solid var(--line);border-radius:5px;background:#0e110f}.c015-title{height:19px;display:flex;align-items:center;padding:0 7px;border-bottom:1px solid var(--soft);background:#151916;color:var(--y);font-size:6px;font-weight:950;letter-spacing:.05em}.c015-obligation p{height:44px;margin:0;padding:8px;color:#dfe3e0;font-size:7px;font-weight:800;line-height:1.35;overflow:hidden}
        .c015-extra{flex:0 0 42px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;overflow:hidden}.c015-extra>div{display:flex;flex-direction:column;justify-content:center;padding:0 8px;border:1px solid var(--line);border-radius:5px;background:#101310}.c015-extra strong{margin-top:3px;overflow:hidden;color:#e5e8e6;font-size:6.5px;font-weight:900;text-overflow:ellipsis;white-space:nowrap}
        .c015-relations{min-height:0;flex:1;overflow:hidden;border:1px solid var(--line);border-radius:5px;background:#0e110f}.c015-scroll{height:calc(100% - 19px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:#4d5550 transparent}.c015-scroll::-webkit-scrollbar,.c015-editor main::-webkit-scrollbar{width:4px}.c015-scroll::-webkit-scrollbar-thumb,.c015-editor main::-webkit-scrollbar-thumb{border-radius:3px;background:#4d5550}.c015-scroll button{width:100%;height:31px;display:flex;align-items:center;justify-content:space-between;padding:0 7px;border:0;border-bottom:1px solid var(--soft);background:transparent;color:#fff;text-align:left}.c015-scroll small{display:block;color:#727a75;font-size:4.5px;font-weight:900}.c015-scroll strong{display:block;margin-top:2px;font-size:6.5px}.c015-empty{padding:10px;color:#5e6661;font-size:5px;font-weight:900}
        .c015-commands{position:absolute;left:0;right:0;bottom:23px;height:28px;display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #303531;background:#0d100e}.c015-commands button{border:0;border-right:1px solid #252a27;background:transparent;color:#8d958f;font-size:8px}.c015-commands b{margin-left:3px;font-size:5px;letter-spacing:.05em}.c015-commands button:hover{color:var(--y)}
        .c015-editor{position:absolute;inset:0;z-index:90;background:#090c0a}.c015-editor header{height:46px;display:flex;align-items:center;justify-content:space-between;padding:0 9px;border-bottom:1px solid #343a35;background:#151815}.c015-editor header small{display:block;color:#737b75;font-size:5px;font-weight:900}.c015-editor header strong{display:block;margin-top:2px;color:var(--y);font-size:8px}.c015-editor nav{display:flex;gap:4px}.c015-editor button{height:24px;padding:0 8px;border:1px solid #3b423d;border-radius:4px;background:#101411;color:#e8ebe9;font-size:5px;font-weight:950}.c015-editor main{position:absolute;top:46px;bottom:0;left:0;right:0;overflow-y:auto;padding:9px}.c015-editor label{display:block;margin-bottom:8px}.c015-editor label span{display:block;margin-bottom:3px;color:#8b938d;font-size:5px;font-weight:950}.c015-editor input{width:100%;height:28px;padding:0 7px;border:1px solid #353c37;border-radius:4px;background:#101310;color:#f3f5f3;font-size:7px;outline:none}.c015-editor input:focus{border-color:#887019}
      `}</style>
    </article>
  );
}
