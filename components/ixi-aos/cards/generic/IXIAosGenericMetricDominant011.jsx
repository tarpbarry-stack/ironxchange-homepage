import { useEffect, useMemo, useState } from "react";

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

function textValue(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return clean(value?.displayName || value?.label || value?.name || value?.value);
  return String(value ?? "");
}

function numericValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
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
    definitions.forEach(definition => { next[definition.fieldId] = textValue(getObjectFields(object)?.[definition.fieldId]); });
    setName(getObjectDisplayName(object));
    setDraft(next);
  }, [object]);

  async function save() {
    const fields = { ...getObjectFields(object) };
    definitions.forEach(definition => { fields[definition.fieldId] = parseValue(definition, draft[definition.fieldId]); });
    await onSave?.({ ...object, displayName: clean(name) || getObjectDisplayName(object), fields });
  }

  return (
    <div className="c011-editor" onPointerDown={event => event.stopPropagation()}>
      <header><div><small>{getObjectLabel(object)}</small><strong>EDIT OBJECT</strong></div><nav><button disabled={saving} onClick={save}>SAVE</button><button disabled={saving} onClick={onCancel}>CANCEL</button></nav></header>
      <main>
        <label><span>DISPLAY NAME</span><input value={name} onChange={event => setName(event.target.value)} /></label>
        {definitions.map(definition => <label key={definition.fieldId}><span>{definition.label}</span><input value={draft[definition.fieldId] ?? ""} onChange={event => setDraft(current => ({ ...current, [definition.fieldId]: event.target.value }))} /></label>)}
      </main>
    </div>
  );
}

export default function IXIAosGenericMetricDominant011({
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
  const definitions = getFieldDefinitions(runtimeObject);
  const fields = getObjectFields(runtimeObject);
  const relationships = getObjectRelationships(runtimeObject);
  const sampleUse = clean(runtimeObject?.metadata?.sampleUse || presentation?.sampleUse);

  const visible = useMemo(() => definitions
    .filter(definition => clean(definition?.presentationRole || definition?.semanticRole).toLowerCase() !== "business-identifier")
    .map(definition => ({ definition, value: fields?.[definition.fieldId], text: textValue(fields?.[definition.fieldId]), number: numericValue(fields?.[definition.fieldId]) }))
    .filter(item => clean(item.text)), [definitions, fields]);

  const numeric = visible.filter(item => item.number !== null);
  const primary = numeric[0] || visible[0] || null;
  const support = numeric.slice(primary && numeric[0] === primary ? 1 : 0, 4);
  const details = visible.filter(item => item !== primary && !support.includes(item)).slice(0, 5);
  const scaleMax = Math.max(1, ...support.map(item => Math.abs(item.number || 0)));

  async function save(nextObject) {
    setSaving(true);
    try {
      await onSaveObject?.({ objectId: getObjectId(nextObject), object: nextObject, displayName: nextObject.displayName, fields: { ...getObjectFields(nextObject) }, fieldDefinitions: asArray(nextObject.fieldDefinitions), metadata: { ...(nextObject.metadata || {}) }, media: asArray(nextObject.media) });
      setRuntimeObject(nextObject);
      setEditing(false);
    } finally { setSaving(false); }
  }

  function command(event, callback) { event.preventDefault(); event.stopPropagation(); callback?.(runtimeObject); }

  return (
    <article className="ixi-card-011" data-card-number="011" data-card-skin={skinId}>
      <header className="c011-head">
        <div className="c011-identity"><span>{getObjectLabel(runtimeObject)}</span><h2>{getObjectDisplayName(runtimeObject)}</h2>{sampleUse ? <small>SAMPLE · {sampleUse}</small> : null}</div>
        {!editing ? <IXIAosCardHeaderControls canAdd={actions.canCreate && typeof onAddObject === "function"} canEdit={actions.canEdit} canTransact={actions.canTransact && typeof onOpenTransact === "function"} onAdd={() => onAddObject?.(runtimeObject)} onToggleEdit={() => setEditing(true)} onTransact={() => onOpenTransact?.(runtimeObject)} onHide={onHideObject} onDelete={onDeleteObject} onOpenConsole={actions.canOpenConsole ? onOpenConsole : null} skinId={skinId} onSkinChange={onSkinChange} /> : null}
      </header>

      <main className="c011-body">
        <section className="c011-primary">
          <span>{primary?.definition?.label || "PRIMARY METRIC"}</span>
          <strong>{primary?.text || "—"}</strong>
          <small>{clean(presentation?.metricCaption) || "CURRENT VALUE"}</small>
        </section>

        <section className="c011-support-grid">
          {support.map(item => <div className="c011-support" key={item.definition.fieldId}><span>{item.definition.label}</span><strong>{item.text}</strong><i><b style={{ width: `${Math.max(4, Math.min(100, Math.round((Math.abs(item.number || 0) / scaleMax) * 100)))}%` }} /></i></div>)}
          {!support.length ? <div className="c011-support empty"><span>METRIC</span><strong>—</strong><i><b style={{ width: "0%" }} /></i></div> : null}
        </section>

        <section className="c011-details">
          <div className="c011-title">{clean(presentation?.detailsTitle) || "DETAILS"}</div>
          <div className="c011-scroll">{details.map(item => <div className="c011-row" key={item.definition.fieldId}><span>{item.definition.label}</span><strong>{item.text}</strong></div>)}{!details.length ? <div className="c011-empty">NO ADDITIONAL FIELDS</div> : null}</div>
        </section>

        <section className="c011-relations">
          <div className="c011-title">{clean(presentation?.relationshipsTitle) || "RELATIONSHIPS"}</div>
          <div className="c011-scroll">{relationships.slice(0, 3).map(relationship => <button type="button" key={relationship.id} onClick={event => event.stopPropagation()}><span><small>{relationship.label}</small><strong>{relationship.value}</strong></span><b>›</b></button>)}{!relationships.length ? <div className="c011-empty">NO RELATIONSHIPS</div> : null}</div>
        </section>
      </main>

      <nav className="c011-commands"><button onClick={event => command(event,onRecall)}>↻ <b>RECALL</b></button><button onClick={event => command(event,onBoard)}>▦ <b>BOARD</b></button><button onClick={event => command(event,onReturn)}>↩ <b>RETURN</b></button></nav>
      <IXIObjectRail object={runtimeObject} saved={false} color={ixiState?.color || "none"} outline={Number(ixiState?.outline ?? 1)} face={1} onSendFront={onSendFront} onSendBack={onSendBack} onCycleColor={onCycleColor} onCycleOutline={onCycleOutline} onCycleFace={onCycleFace} onRailSend={onRailSend} armedDestination={armedDestination} onSendToArmedDestination={onSendToArmedDestination} />
      {editing ? <Editor object={runtimeObject} saving={saving} onCancel={() => setEditing(false)} onSave={save} /> : null}

      <style jsx global>{`
        .ixi-card-011,.ixi-card-011 *{box-sizing:border-box}.ixi-card-011{--y:#ffc400;--line:#343a35;--soft:#252a26;position:relative;width:298px;height:471px;overflow:hidden;border:1px solid #454b47;border-radius:13px;background:linear-gradient(180deg,#111412,#080a09);color:#f3f5f3;font-family:Arial,Helvetica,sans-serif;box-shadow:inset 0 1px #ffffff12,0 18px 40px #0008}
        .c011-head{position:absolute;inset:0 0 auto;height:48px;padding:7px 10px;border-bottom:1px solid #303531;background:linear-gradient(180deg,#181b19,#101210);z-index:30}.c011-identity{max-width:188px}.c011-identity>span{display:block;color:var(--y);font-size:6px;font-weight:950;letter-spacing:.08em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.c011-identity h2{margin:3px 0 0;color:#f7f8f7;font-size:13px;font-weight:950;line-height:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.c011-identity small{display:block;margin-top:4px;color:#6f7771;font-size:4.8px;font-weight:900;letter-spacing:.06em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .c011-body{position:absolute;top:48px;left:7px;right:7px;bottom:51px;display:flex;flex-direction:column;gap:5px;padding:5px 0;overflow:hidden}.c011-primary{flex:0 0 88px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid #5b5540;border-radius:6px;background:radial-gradient(circle at 50% 15%,rgba(255,196,0,.07),transparent 58%),linear-gradient(180deg,#171915,#10120f);box-shadow:inset 0 1px #ffffff0b}.c011-primary span{color:var(--y);font-size:6px;font-weight:950;letter-spacing:.08em}.c011-primary strong{margin-top:5px;color:#fff;font-size:30px;font-weight:950;line-height:.95}.c011-primary small{margin-top:6px;color:#737b75;font-size:4.7px;font-weight:900;letter-spacing:.06em}
        .c011-support-grid{flex:0 0 67px;display:grid;grid-template-columns:repeat(3,1fr);gap:4px}.c011-support{min-width:0;padding:8px 7px;border:1px solid var(--line);border-radius:5px;background:linear-gradient(180deg,#151815,#101310)}.c011-support span{display:block;color:#89918b;font-size:4.8px;font-weight:950;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.c011-support strong{display:block;margin-top:5px;color:#f0f3f1;font-size:12px;font-weight:950;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.c011-support i{display:block;height:4px;margin-top:7px;overflow:hidden;border-radius:3px;background:#292d2a}.c011-support i b{display:block;height:100%;border-radius:3px;background:var(--y)}
        .c011-details{flex:1;min-height:0;overflow:hidden;border:1px solid var(--line);border-radius:5px;background:#0e110f}.c011-relations{flex:0 0 82px;overflow:hidden;border:1px solid var(--line);border-radius:5px;background:#0e110f}.c011-title{height:19px;display:flex;align-items:center;padding:0 7px;border-bottom:1px solid var(--soft);background:#151916;color:var(--y);font-size:6px;font-weight:950;letter-spacing:.05em}.c011-scroll{height:calc(100% - 19px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:#4b514d transparent}.c011-scroll::-webkit-scrollbar,.c011-editor main::-webkit-scrollbar{width:4px}.c011-scroll::-webkit-scrollbar-track,.c011-editor main::-webkit-scrollbar-track{background:transparent}.c011-scroll::-webkit-scrollbar-thumb,.c011-editor main::-webkit-scrollbar-thumb{border-radius:6px;background:#4b514d}.c011-row{height:23px;display:grid;grid-template-columns:42% 58%;align-items:center;padding:0 8px;border-bottom:1px solid #222723}.c011-row span{color:#828a84;font-size:5.2px;font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.c011-row strong{color:#e8ebe9;font-size:6.8px;font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.c011-relations button{width:100%;height:27px;display:flex;align-items:center;justify-content:space-between;padding:0 8px;border:0;border-bottom:1px solid #222723;background:transparent;color:#e8ebe9;text-align:left}.c011-relations button span{min-width:0}.c011-relations small{display:block;color:#7f8781;font-size:4.5px;font-weight:900}.c011-relations strong{display:block;margin-top:2px;font-size:6.5px;font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.c011-relations button>b{color:var(--y);font-size:10px}.c011-empty{height:100%;display:flex;align-items:center;justify-content:center;color:#59605b;font-size:5px;font-weight:900}
        .c011-commands{position:absolute;left:7px;right:7px;bottom:23px;height:28px;display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:3px 0}.c011-commands button{border:1px solid #2c312d;border-radius:4px;background:linear-gradient(180deg,#131613,#0d100e);color:#8b938d;font-size:7px;font-weight:900}.c011-commands button b{margin-left:3px;color:#d7dbd8;font-size:5.5px;letter-spacing:.04em}
        .c011-editor{position:absolute;inset:0;z-index:200;background:#0b0d0c}.c011-editor>header{height:43px;display:flex;align-items:center;justify-content:space-between;padding:0 9px;border-bottom:1px solid #303531;background:#151815}.c011-editor>header small{display:block;color:var(--y);font-size:5px;font-weight:950}.c011-editor>header strong{display:block;margin-top:3px;font-size:10px}.c011-editor nav{display:flex;gap:4px}.c011-editor button{height:22px;padding:0 8px;border:1px solid #ffffff16;border-radius:4px;background:#111411;color:#dce0dd;font-size:6px;font-weight:950}.c011-editor nav button:first-child{color:var(--y)}.c011-editor main{position:absolute;top:43px;left:0;right:0;bottom:0;padding:8px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#4b514d transparent}.c011-editor label{display:block;margin-bottom:6px;padding:7px;border:1px solid #2b302c;border-radius:5px;background:#101310}.c011-editor label span{display:block;margin-bottom:4px;color:#8d958f;font-size:5px;font-weight:900}.c011-editor input{width:100%;height:25px;padding:0 7px;border:1px solid #333934;border-radius:4px;background:#090b0a;color:#edf0ee;font-size:7px;font-weight:850;outline:none}
      `}</style>
    </article>
  );
}
