import { useEffect, useMemo, useState } from "react";

import IXICollectionThumbRail from "../../../ixi-object-system/IXICollectionThumbRail";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";
import IXIAosPrimaryMediaEditor from "../../card-runtime/modules/IXIAosPrimaryMediaEditor";
import {
  asArray,
  buildChildAggregateGroups,
  clean,
  getFieldDefinitions,
  getObjectActionCapabilities,
  getObjectDisplayName,
  getObjectFields,
  getObjectId,
  getObjectLabel,
  getObjectPluralLabel,
  getObjectPresentation,
  getObjectRelationships,
  getPrimaryImage
} from "../../card-runtime/IXIAosSemanticObjectPresentation";

function childLabel(object = {}) { return getObjectDisplayName(object); }
function fieldInputValue(value) {
  if (Array.isArray(value)) return value.map(item => typeof item === "string" ? clean(item) : clean(item?.label || item?.name || item?.value)).filter(Boolean).join(", ");
  if (value && typeof value === "object") return clean(value?.displayName || value?.label || value?.name || value?.value);
  return String(value ?? "");
}
function parseEditedValue(definition, rawValue) {
  const type = clean(definition?.fieldType).toLowerCase();
  if (["number", "integer", "money", "currency"].includes(type)) { const number = Number(rawValue); return Number.isFinite(number) ? number : null; }
  if (["multi-select", "multiselect", "tags", "list", "array"].includes(type)) return String(rawValue || "").split(",").map(clean).filter(Boolean);
  return rawValue;
}
function MetricRow({ label, value, maximum }) {
  const max = Math.max(1, Number(maximum || 0));
  const count = Number(value || 0);
  const percent = Math.max(count ? 6 : 0, Math.min(100, Math.round((count / max) * 100)));
  return <div className="gcv12-metric-row"><span>{label}</span><i><b style={{ width: `${percent}%` }} /></i><strong>{count}</strong></div>;
}
function ScrollSection({ title, children, className = "" }) {
  return <section className={`gcv12-section ${className}`.trim()}><div className="gcv12-section-title">{title}</div><div className="gcv12-section-scroll">{children}</div></section>;
}

function GenericEditor({ object, saving, onCancel, onSave }) {
  const definitions = getFieldDefinitions(object).filter(definition => definition.editable !== false);
  const [name, setName] = useState(getObjectDisplayName(object));
  const [draft, setDraft] = useState({});
  const [media, setMedia] = useState(asArray(object?.media));

  useEffect(() => {
    setName(getObjectDisplayName(object));
    setMedia(asArray(object?.media));
    const output = {};
    definitions.forEach(definition => { output[definition.fieldId] = fieldInputValue(getObjectFields(object)?.[definition.fieldId]); });
    setDraft(output);
  }, [object]);

  async function save() {
    const nextFields = { ...getObjectFields(object) };
    definitions.forEach(definition => { nextFields[definition.fieldId] = parseEditedValue(definition, draft[definition.fieldId]); });
    await onSave?.({ ...object, displayName: clean(name) || getObjectDisplayName(object), fields: nextFields, media });
  }

  return <div className="gcv12-editor" onPointerDown={event => event.stopPropagation()}>
    <div className="gcv12-editor-head"><div><small>{getObjectLabel(object)}</small><strong>EDIT OBJECT</strong></div><nav><button type="button" disabled={saving} onClick={save}>SAVE</button><button type="button" disabled={saving} onClick={onCancel}>CANCEL</button></nav></div>
    <div className="gcv12-editor-scroll"><IXIAosPrimaryMediaEditor media={media} onChange={setMedia}/><label><span>DISPLAY NAME</span><input value={name} onChange={event => setName(event.target.value)} /></label>{definitions.map(definition => <label key={definition.fieldId}><span>{definition.label}</span><input value={draft[definition.fieldId] ?? ""} onChange={event => setDraft(current => ({ ...current, [definition.fieldId]: event.target.value }))}/></label>)}</div>
  </div>;
}

export default function IXIAosGenericContainerLayoutV12({
  variant = 1, object = {}, children = [], onAddObject = null, onSaveObject = null,
  onHideObject = null, onDeleteObject = null, onOpenConsole = null, onOpenTransact = null,
  onRecall = null, onBoard = null, onReturn = null, onExposeObject = null,
  skinId = "v12", onSkinChange = null
}) {
  const [runtimeObject, setRuntimeObject] = useState(object);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeChildIndex, setActiveChildIndex] = useState(0);
  useEffect(() => setRuntimeObject(object), [object]);

  const items = useMemo(() => asArray(children).filter(Boolean), [children]);
  const aggregateGroups = useMemo(() => buildChildAggregateGroups(items), [items]);
  const heroGroup = aggregateGroups.find(group => group.hero) || aggregateGroups[0] || null;
  const secondaryGroups = aggregateGroups.filter(group => group !== heroGroup);
  const relationships = getObjectRelationships(runtimeObject);
  const presentation = getObjectPresentation(runtimeObject);
  const actions = getObjectActionCapabilities(runtimeObject);
  const safeIndex = Math.min(activeChildIndex, Math.max(0, items.length - 1));
  const totalLabel = clean(presentation?.totalLabel) || `TOTAL ${getObjectPluralLabel(runtimeObject)}`;
  const relationshipsTitle = clean(presentation?.relationshipsTitle) || "RELATIONSHIPS";
  const emptyAggregateTitle = clean(presentation?.summaryTitle) || "SUMMARY";
  const icon = clean(presentation?.icon) || "◆";
  const image = getPrimaryImage(runtimeObject);

  async function saveObject(nextObject) {
    setSaving(true);
    try {
      await onSaveObject?.({ objectId: getObjectId(nextObject), object: nextObject, displayName: nextObject.displayName, fields: { ...getObjectFields(nextObject) }, media: asArray(nextObject.media) });
      setRuntimeObject(nextObject);
      setEditing(false);
    } finally { setSaving(false); }
  }
  function command(event, callback) { event.preventDefault(); event.stopPropagation(); callback?.(runtimeObject); }

  function renderHero() {
    const entries = heroGroup?.entries || [];
    if (variant === 2) return <div className="gcv12-kpis"><div className="gcv12-kpi"><small>{totalLabel}</small><strong>{items.length}</strong></div>{entries.slice(0,3).map(entry => <div className="gcv12-kpi" key={entry.label}><small>{entry.label}</small><strong>{entry.value}</strong></div>)}</div>;
    if (variant === 3) return <ScrollSection title={heroGroup?.label || emptyAggregateTitle} className="gcv12-status-section"><div className="gcv12-status-grid">{entries.map(entry => <div className="gcv12-status-tile" key={entry.label}><span>{icon}</span><small>{entry.label}</small><strong>{entry.value}</strong></div>)}{!entries.length ? <div className="gcv12-empty">NO AGGREGATE DATA</div> : null}</div></ScrollSection>;
    return <div className="gcv12-hero"><div className="gcv12-hero-mark">{image ? <img src={image} alt={getObjectDisplayName(runtimeObject)}/> : <><b>IXI</b><span>{icon}</span></>}</div><div className="gcv12-hero-total"><small>{totalLabel}</small><strong>{items.length}</strong></div><div className="gcv12-hero-values">{entries.slice(0,2).map(entry => <div key={entry.label}><small>{entry.label}</small><strong>{entry.value}</strong></div>)}</div></div>;
  }

  return <article className="ixi-generic-container-v12" data-card-variant={variant} data-card-skin={skinId}>
    <header className="gcv12-header"><div className="gcv12-identity"><span>{getObjectLabel(runtimeObject)}</span><h2>{getObjectDisplayName(runtimeObject)}</h2></div>{!editing ? <IXIAosCardHeaderControls canAdd={actions.canCreate && typeof onAddObject === "function"} canEdit={actions.canEdit} canTransact={actions.canTransact} onAdd={() => onAddObject?.(runtimeObject)} onToggleEdit={() => setEditing(true)} onTransact={() => onOpenTransact?.(runtimeObject)} onHide={onHideObject} onDelete={onDeleteObject} onOpenConsole={actions.canOpenConsole ? onOpenConsole : null} skinId={skinId} onSkinChange={onSkinChange}/> : null}</header>
    <main className="gcv12-body">{renderHero()}{(variant !== 3 ? [heroGroup, ...secondaryGroups] : secondaryGroups).filter(Boolean).map(group => { const maximum = Math.max(1,...group.entries.map(entry => entry.value)); return <ScrollSection key={group.groupId} title={group.label}>{group.entries.map(entry => <MetricRow key={entry.label} label={entry.label} value={entry.value} maximum={maximum}/>)}</ScrollSection>; })}{!aggregateGroups.length ? <ScrollSection title={emptyAggregateTitle}><div className="gcv12-empty">NO DECLARED AGGREGATES</div></ScrollSection> : null}<ScrollSection title={relationshipsTitle} className="gcv12-relationships">{relationships.map(relationship => <button key={relationship.id} type="button" className="gcv12-relationship" onClick={event => event.stopPropagation()}><span><small>{relationship.label}</small><strong>{relationship.value}</strong>{relationship.secondary ? <em>{relationship.secondary}</em> : null}</span><b>›</b></button>)}{!relationships.length ? <div className="gcv12-empty">NO RELATIONSHIPS</div> : null}</ScrollSection></main>
    <nav className="gcv12-commands"><button type="button" onClick={event => command(event,onRecall)}>↻ <b>RECALL</b></button><button type="button" onClick={event => command(event,onBoard)}>▦ <b>BOARD</b></button><button type="button" onClick={event => command(event,onReturn)}>↩ <b>RETURN</b></button></nav>
    <div className="gcv12-child-rail"><IXICollectionThumbRail items={items} activeItemIndex={safeIndex} getItemId={getObjectId} getItemImage={getPrimaryImage} getItemLabel={childLabel} onSelectItem={(item,index)=>{setActiveChildIndex(index);onExposeObject?.(item,runtimeObject);}}/></div><div className="gcv12-bottom-rail"><i/><i/><i/><i/><i/><i/><i/></div>
    {editing ? <GenericEditor object={runtimeObject} saving={saving} onCancel={() => setEditing(false)} onSave={saveObject}/> : null}
    <style jsx global>{`
      .ixi-generic-container-v12,.ixi-generic-container-v12 *{box-sizing:border-box}.ixi-generic-container-v12{--y:#ffc400;--line:#343a35;--soft:#252a26;position:relative;width:298px;height:471px;overflow:hidden;border:1px solid #454b47;border-radius:13px;background:linear-gradient(180deg,#101310,#080a09);color:#f4f5f4;font-family:Arial,Helvetica,sans-serif;box-shadow:inset 0 1px #ffffff12,0 18px 40px #0008}.gcv12-header{position:absolute;inset:0 0 auto;height:43px;padding:7px 10px;border-bottom:1px solid #303531;background:linear-gradient(180deg,#171a18,#101210);z-index:20}.gcv12-identity{max-width:190px}.gcv12-identity>span{display:block;color:var(--y);font-size:6px;font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gcv12-identity h2{margin:4px 0 0;color:#f6f7f6;font-size:14px;line-height:1;font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gcv12-body{position:absolute;top:43px;left:7px;right:7px;bottom:111px;display:flex;flex-direction:column;gap:5px;padding:5px 0;overflow-y:auto}.gcv12-hero{flex:0 0 59px;display:grid;grid-template-columns:1.1fr .9fr 1fr;border:1px solid var(--line);border-radius:5px;background:#111411;overflow:hidden}.gcv12-hero>div{border-right:1px solid var(--soft)}.gcv12-hero>div:last-child{border-right:0}.gcv12-hero-mark{display:flex;align-items:center;justify-content:center;gap:8px;overflow:hidden}.gcv12-hero-mark img{width:100%;height:100%;object-fit:contain;background:#090c0a}.gcv12-hero-mark b{display:grid;place-items:center;width:27px;height:27px;border:1px solid #ffc40066;border-radius:4px;color:var(--y);font-size:8px}.gcv12-hero-mark span{color:var(--y);font-size:20px}.gcv12-hero-total,.gcv12-hero-values{display:flex;flex-direction:column;justify-content:center;padding:6px 8px}.gcv12-hero small,.gcv12-kpi small,.gcv12-status-tile small{color:#969d98;font-size:5px;font-weight:900}.gcv12-hero-total>strong{margin-top:4px;font-size:19px}.gcv12-hero-values{gap:4px}.gcv12-hero-values>div{display:flex;align-items:center;justify-content:space-between}.gcv12-hero-values strong{font-size:9px}.gcv12-kpis{flex:0 0 48px;display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--line);border-radius:5px;background:#111411;overflow:hidden}.gcv12-kpi{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border-right:1px solid var(--soft);min-width:0}.gcv12-kpi:last-child{border-right:0}.gcv12-kpi small{max-width:100%;padding:0 2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gcv12-kpi strong{font-size:12px}.gcv12-section{flex:0 0 82px;min-height:66px;overflow:hidden;border:1px solid var(--line);border-radius:5px;background:#101310}.gcv12-section-title{height:19px;display:flex;align-items:center;padding:0 6px;border-bottom:1px solid var(--soft);color:var(--y);font-size:6px;font-weight:950}.gcv12-section-scroll{height:calc(100% - 19px);overflow-y:auto}.gcv12-metric-row{height:15px;display:grid;grid-template-columns:minmax(0,105px) 1fr 20px;align-items:center;gap:5px;padding:0 6px;border-bottom:1px solid var(--soft)}.gcv12-metric-row>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#c9cecb;font-size:5.5px;font-weight:800}.gcv12-metric-row i{height:4px;background:#292d2a;border-radius:2px;overflow:hidden}.gcv12-metric-row i b{display:block;height:100%;background:var(--y)}.gcv12-metric-row>strong{text-align:right;font-size:7px}.gcv12-status-section{flex:0 0 78px}.gcv12-status-grid{display:grid;grid-template-columns:repeat(4,minmax(58px,1fr));gap:4px;padding:4px;min-width:max-content}.gcv12-status-tile{width:61px;height:49px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border:1px solid var(--line);border-radius:4px;background:#141714}.gcv12-status-tile>span{color:var(--y);font-size:11px}.gcv12-status-tile strong{font-size:10px}.gcv12-relationship{width:100%;min-height:29px;display:grid;grid-template-columns:1fr auto;align-items:center;padding:4px 6px;border:0;border-bottom:1px solid var(--soft);background:transparent;color:#fff;text-align:left}.gcv12-relationship span{min-width:0;display:flex;flex-direction:column}.gcv12-relationship small{color:#89908b;font-size:5px;font-weight:900}.gcv12-relationship strong{margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:7px}.gcv12-relationship em{margin-top:1px;color:#737a75;font-size:5px;font-style:normal}.gcv12-relationship>b{color:#79817c;font-size:13px}.gcv12-empty{padding:10px;color:#656c67;font-size:6px;font-weight:900}.gcv12-commands{position:absolute;left:7px;right:7px;bottom:78px;height:28px;display:grid;grid-template-columns:repeat(3,1fr);border:1px solid var(--line);border-radius:5px;overflow:hidden}.gcv12-commands button{border:0;border-right:1px solid var(--soft);background:#0d100e;color:#969d98;font-size:7px}.gcv12-commands button:last-child{border-right:0}.gcv12-commands b{margin-left:4px;color:#d7dbd8;font-size:6px}.gcv12-child-rail{position:absolute;left:7px;right:7px;bottom:20px;height:53px;overflow:hidden}.gcv12-bottom-rail{position:absolute;left:0;right:0;bottom:0;height:19px;display:grid;grid-template-columns:repeat(7,1fr);border-top:1px solid #303531;background:#0b0e0c}.gcv12-bottom-rail i{border-right:1px solid #202420}.gcv12-editor{position:absolute;inset:43px 7px 20px;z-index:250;overflow:hidden;border:1px solid #4b524e;border-radius:6px;background:#080b09;box-shadow:0 16px 34px #000d}.gcv12-editor-head{height:43px;display:flex;align-items:center;justify-content:space-between;padding:0 8px;border-bottom:1px solid var(--line);background:#121613}.gcv12-editor-head small{display:block;color:#8d958f;font-size:5px;font-weight:900}.gcv12-editor-head strong{display:block;margin-top:3px;color:var(--y);font-size:8px}.gcv12-editor-head nav{display:flex;gap:3px}.gcv12-editor-head button{height:24px;padding:0 7px;border:1px solid #454c47;border-radius:4px;background:#0c0f0d;color:var(--y);font-size:6px;font-weight:950}.gcv12-editor-scroll{position:absolute;inset:43px 0 0;overflow-y:auto;padding:7px}.gcv12-editor-scroll>.ixi-aos-primary-media-editor{margin-bottom:8px}.gcv12-editor label{display:block;margin-bottom:7px}.gcv12-editor label span{display:block;margin-bottom:3px;color:#a0a7a3;font-size:5px;font-weight:950}.gcv12-editor input{width:100%;height:27px;padding:0 6px;border:1px solid #343a35;border-radius:4px;background:#111512;color:#fff;font-size:7px;font-weight:800;outline:none}.gcv12-editor input:focus{border-color:#ffc40088}
    `}</style>
  </article>;
}
