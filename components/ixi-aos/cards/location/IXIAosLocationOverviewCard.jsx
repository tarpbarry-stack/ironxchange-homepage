import { useEffect, useMemo, useState } from "react";

import IXIMachineRail from "../../../IXIMachineRail";
import IXICollectionThumbRail from "../../../ixi-object-system/IXICollectionThumbRail";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";
import {
  asArray,
  buildChildAggregateGroups,
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

const W = 298;
const H = 471;
const RAIL = 19;
const HEADER = 43;
const THUMBS = 57;
const COMMANDS = 25;

function fieldInputValue(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return clean(value?.displayName || value?.label || value?.name || value?.value);
  return String(value ?? "");
}

function parseValue(definition, rawValue) {
  const type = clean(definition?.fieldType).toLowerCase();
  if (["number", "integer", "money", "currency"].includes(type)) {
    const number = Number(rawValue);
    return Number.isFinite(number) ? number : null;
  }
  if (["tags", "array", "list", "multi-select", "multiselect"].includes(type)) {
    return String(rawValue || "").split(",").map(clean).filter(Boolean);
  }
  return rawValue;
}

function firstRoleField(object, roles = []) {
  for (const role of roles) {
    const definition = getFieldsByRole(object, role)[0];
    if (definition) return definition;
  }
  return null;
}

function GenericOverviewEditor({ object, saving, onCancel, onSave }) {
  const definitions = getFieldDefinitions(object).filter(definition => definition.editable !== false);
  const [name, setName] = useState(getObjectDisplayName(object));
  const [draft, setDraft] = useState({});

  useEffect(() => {
    setName(getObjectDisplayName(object));
    const output = {};
    definitions.forEach(definition => {
      output[definition.fieldId] = fieldInputValue(getObjectFields(object)?.[definition.fieldId]);
    });
    setDraft(output);
  }, [object]);

  async function save() {
    const nextFields = { ...getObjectFields(object) };
    definitions.forEach(definition => {
      nextFields[definition.fieldId] = parseValue(definition, draft[definition.fieldId]);
    });
    await onSave?.({
      ...object,
      displayName: clean(name) || getObjectDisplayName(object),
      fields: nextFields
    });
  }

  return (
    <div className="gov-editor" onPointerDown={event => event.stopPropagation()}>
      <div className="gov-editor-head"><div><small>{getObjectLabel(object)}</small><strong>EDIT OBJECT</strong></div><nav><button type="button" disabled={saving} onClick={save}>SAVE</button><button type="button" disabled={saving} onClick={onCancel}>CANCEL</button></nav></div>
      <div className="gov-editor-scroll">
        <label><span>DISPLAY NAME</span><input value={name} onChange={event => setName(event.target.value)}/></label>
        {definitions.map(definition => <label key={definition.fieldId}><span>{definition.label}</span><input value={draft[definition.fieldId] ?? ""} onChange={event => setDraft(current => ({ ...current, [definition.fieldId]: event.target.value }))}/></label>)}
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return <div className="gov-metric"><span>{label}</span><strong>{value}</strong></div>;
}

export default function IXIAosLocationOverviewCard({
  variant = "001",
  object = {},
  projection = null,
  objects = [],
  ixiState = {},
  onIxiStateChange = null,
  onSaveObject = null,
  onAddObject = null,
  onHideObject = null,
  onDeleteObject = null,
  onOpenConsole = null,
  onOpenTransact = null,
  onRecall = null,
  onBoard = null,
  onReturn = null,
  onExposeObject = null,
  onSendFront = null,
  onSendBack = null,
  onCycleColor = null,
  onCycleOutline = null,
  armedDestination = "",
  onSendToArmedDestination = null
}) {
  const [runtimeObject, setRuntimeObject] = useState(object);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);

  useEffect(() => setRuntimeObject(object), [object]);

  const children = useMemo(() => asArray(objects).filter(Boolean), [objects]);
  const aggregateGroups = useMemo(() => buildChildAggregateGroups(children), [children]);
  const relationships = getObjectRelationships(runtimeObject);
  const presentation = getObjectPresentation(runtimeObject);
  const actions = getObjectActionCapabilities(runtimeObject);
  const image = getPrimaryImage(runtimeObject);

  const activeIndex = children.length ? Math.min(Math.max(selectedChildIndex, 0), children.length - 1) : -1;
  const activeChild = activeIndex >= 0 ? children[activeIndex] : null;

  const primaryDescriptorDefinition = firstRoleField(runtimeObject, ["descriptor-primary", "subtitle", "secondary"]);
  const secondaryDescriptorDefinition = firstRoleField(runtimeObject, ["descriptor-secondary", "location", "group", "organization"]);
  const primaryDescriptor = clean(presentation?.primaryDescriptor) || (primaryDescriptorDefinition ? getFieldDisplayValue(runtimeObject, primaryDescriptorDefinition) : "");
  const secondaryDescriptor = clean(presentation?.secondaryDescriptor) || (secondaryDescriptorDefinition ? getFieldDisplayValue(runtimeObject, secondaryDescriptorDefinition) : "");

  const firstGroup = aggregateGroups[0] || null;
  const metricEntries = firstGroup?.entries || [];
  const metrics = [
    { label: clean(presentation?.countLabel) || "OBJECTS", value: children.length },
    ...metricEntries.slice(0, 2).map(entry => ({ label: entry.label, value: entry.value }))
  ];

  while (metrics.length < 3) metrics.push({ label: "—", value: "—" });

  const sectionTitle = clean(presentation?.relationshipsTitle) || "RELATIONSHIPS";
  const collectionTitle = clean(presentation?.collectionTitle) || (activeChild ? getObjectDisplayName(activeChild) : "NO OBJECT SELECTED");
  const hasThumbs = variant !== "002";

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

  function command(event, callback) {
    event.preventDefault();
    event.stopPropagation();
    callback?.(runtimeObject);
  }

  return (
    <article className={`ixi-generic-overview gov-${variant}`} data-card-number={variant}>
      <header className="gov-head">
        <div className="gov-identity"><span>{getObjectLabel(runtimeObject)}</span><strong>{getObjectDisplayName(runtimeObject)}</strong></div>
        {!editing ? <IXIAosCardHeaderControls
          canAdd={actions.canCreate && typeof onAddObject === "function"}
          canEdit={actions.canEdit}
          canTransact={actions.canTransact && typeof onOpenTransact === "function"}
          onAdd={() => onAddObject?.(runtimeObject)}
          onToggleEdit={() => setEditing(true)}
          onTransact={() => onOpenTransact?.(runtimeObject)}
          onHide={onHideObject}
          onDelete={onDeleteObject}
          onOpenConsole={actions.canOpenConsole ? onOpenConsole : null}
        /> : null}
      </header>

      <main className="gov-body">
        {variant !== "002" ? (
          <div className={`gov-media ${variant === "003" ? "compact" : ""}`}>
            {image ? <img src={image} alt={getObjectDisplayName(runtimeObject)}/> : <div className="gov-media-empty"><b>IXI</b><span>PRIMARY MEDIA</span></div>}
          </div>
        ) : null}

        <div className="gov-descriptor">
          <span className="gov-mark">◆</span>
          <div><strong>{primaryDescriptor || getObjectLabel(runtimeObject)}</strong><small>{secondaryDescriptor || clean(presentation?.descriptorFallback) || ""}</small></div>
        </div>

        {variant !== "002" ? (
          <div className="gov-preview"><strong title={collectionTitle}>{collectionTitle}</strong><span>{activeChild ? `${activeIndex + 1}/${children.length}` : "0/0"}</span><button type="button" disabled={!activeChild} onClick={event => { event.stopPropagation(); if (activeChild) onExposeObject?.(activeChild, runtimeObject); }}>OUT ↗</button></div>
        ) : null}

        <div className="gov-metrics">{metrics.slice(0, 3).map((metric, index) => <Metric key={`${metric.label}-${index}`} label={metric.label} value={metric.value}/>)}</div>

        <section className="gov-relations">
          <h3>{sectionTitle}</h3>
          <div className="gov-relation-scroll">
            {relationships.map(relationship => <button type="button" key={relationship.id}><span><small>{relationship.label}</small><strong>{relationship.value}</strong>{relationship.secondary ? <em>{relationship.secondary}</em> : null}</span><b>›</b></button>)}
            {!relationships.length ? <div className="gov-empty">NO RELATIONSHIPS</div> : null}
          </div>
        </section>
      </main>

      <nav className="gov-commands"><button type="button" onClick={event => command(event, onRecall)}>↻ <span>RECALL</span></button><button type="button" onClick={event => command(event, onBoard)}>▦ <span>BOARD</span></button><button type="button" onClick={event => command(event, onReturn)}>↩ <span>RETURN</span></button></nav>

      {hasThumbs ? <div className="gov-thumbs"><IXICollectionThumbRail items={children} activeItemIndex={activeIndex} getItemId={getObjectId} getItemImage={getPrimaryImage} getItemLabel={getObjectDisplayName} onSelectItem={(item, index) => setSelectedChildIndex(index)}/></div> : null}

      <IXIMachineRail listing={runtimeObject} saved={false} boardColor={ixiState?.color || "none"} boardOutline={Number(ixiState?.outline ?? 1)} machineFace={1} onSendFront={onSendFront} onSendBack={onSendBack} onCycleColor={onCycleColor} onCycleOutline={onCycleOutline} armedDestination={armedDestination} onSendToArmedDestination={onSendToArmedDestination}/>

      {editing ? <GenericOverviewEditor object={runtimeObject} saving={saving} onCancel={() => setEditing(false)} onSave={save}/> : null}

      <style jsx global>{`
        .ixi-generic-overview,.ixi-generic-overview *{box-sizing:border-box}.ixi-generic-overview{--y:#ffc400;--line:rgba(255,255,255,.095);position:relative;width:${W}px;height:${H}px;overflow:hidden;border:1px solid rgba(255,255,255,.11);border-radius:15px;background:radial-gradient(130% 72% at 50% -8%,rgba(255,255,255,.052),transparent 43%),linear-gradient(180deg,#111419 0%,#0b0e11 54%,#080a0c 100%);color:#f4f6f7;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Arial,sans-serif;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 18px 42px rgba(0,0,0,.46)}.gov-head{position:absolute;inset:0 0 auto;height:${HEADER}px;padding:7px 9px 4px 10px;border-bottom:1px solid rgba(255,255,255,.055);z-index:40}.gov-identity{width:185px;min-width:0}.gov-identity>span{display:block;color:var(--y);font-size:6.6px;font-weight:850;letter-spacing:.105em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gov-identity>strong{display:block;margin-top:4px;overflow:hidden;color:#fafafa;font-family:Georgia,"Times New Roman",serif;font-size:17px;font-weight:800;line-height:1;letter-spacing:-.02em;text-overflow:ellipsis;white-space:nowrap}.gov-body{position:absolute;top:${HEADER}px;left:0;right:0;display:flex;flex-direction:column;min-height:0;overflow:hidden}.gov-001 .gov-body,.gov-003 .gov-body{bottom:${RAIL + THUMBS + COMMANDS + 7}px}.gov-002 .gov-body{bottom:${RAIL + COMMANDS + 7}px;padding:8px 10px 0;gap:6px}.gov-media{flex:0 0 112px;overflow:hidden;border-bottom:1px solid rgba(255,255,255,.055);background:#060809}.gov-media.compact{flex-basis:84px}.gov-media img{width:100%;height:100%;object-fit:cover;display:block}.gov-media-empty{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;color:#60686e}.gov-media-empty b{font-size:21px;letter-spacing:.08em}.gov-media-empty span{font-size:5px;font-weight:900;letter-spacing:.12em}.gov-descriptor{flex:0 0 43px;margin:5px 10px 0;display:grid;grid-template-columns:20px 1fr;align-items:center;padding:0 8px;border:1px solid var(--line);border-radius:7px;background:linear-gradient(180deg,#14191f,#0f1317)}.gov-002 .gov-descriptor{margin:0;flex-basis:57px}.gov-mark{color:var(--y);font-size:12px;text-align:center}.gov-descriptor strong{display:block;color:#eef1f3;font-size:8.2px;font-weight:800;line-height:1.15;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gov-descriptor small{display:block;margin-top:3px;color:#858e95;font-size:6.2px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gov-preview{flex:0 0 22px;display:grid;grid-template-columns:minmax(0,1fr) 34px 52px;align-items:center;border-bottom:1px solid rgba(255,255,255,.055);background:linear-gradient(180deg,#0d1013,#090b0d)}.gov-preview>strong{min-width:0;overflow:hidden;padding:0 8px;color:#e8ebed;font-size:7.5px;font-weight:780;text-overflow:ellipsis;white-space:nowrap}.gov-preview>span{color:#6f7880;font-size:6.5px;text-align:center}.gov-preview>button{height:100%;border:0;border-left:1px solid rgba(255,255,255,.055);background:transparent;color:var(--y);font-size:7.2px;font-weight:850}.gov-preview>button:disabled{opacity:.25}.gov-metrics{flex:0 0 43px;margin:5px 10px 0;display:grid;grid-template-columns:1fr 1.25fr 1fr;gap:4px}.gov-002 .gov-metrics{margin:0;flex-basis:48px}.gov-metric{min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border:1px solid var(--line);border-radius:7px;background:linear-gradient(180deg,#14191f,#0f1317)}.gov-metric span{max-width:100%;padding:0 3px;overflow:hidden;color:#c49a00;font-size:6.2px;font-weight:850;letter-spacing:.07em;text-overflow:ellipsis;white-space:nowrap}.gov-metric strong{color:#fff;font-size:12px;font-weight:800;line-height:1}.gov-relations{min-height:0;margin:6px 10px 0;overflow:hidden;border:1px solid var(--line);border-radius:8px;background:linear-gradient(180deg,#14191f,#0c0f12);flex:1}.gov-002 .gov-relations{margin:0}.gov-relations h3{height:27px;margin:0;display:flex;align-items:center;padding:0 10px 0 13px;border-bottom:1px solid var(--line);color:var(--y);font-size:6.9px;font-weight:850;letter-spacing:.08em}.gov-relation-scroll{height:calc(100% - 27px);overflow-y:auto}.gov-relation-scroll button{width:100%;min-height:29px;display:grid;grid-template-columns:1fr 18px;align-items:center;padding:4px 6px 4px 8px;border:0;border-bottom:1px solid rgba(255,255,255,.05);background:rgba(255,255,255,.008);color:#fff;text-align:left}.gov-relation-scroll button:nth-child(even){background:rgba(255,255,255,.022)}.gov-relation-scroll small{display:block;color:#8f979e;font-size:5px;font-weight:800}.gov-relation-scroll strong{display:block;margin-top:2px;font-size:7.4px;font-weight:780}.gov-relation-scroll em{display:block;color:#707981;font-size:5px;font-style:normal}.gov-relation-scroll button>b{color:#d2a800;font-size:10px;text-align:center}.gov-empty{padding:20px;color:#747d83;font-size:6px;font-weight:850;text-align:center}.gov-commands{position:absolute;left:10px;right:10px;height:${COMMANDS}px;display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid rgba(255,255,255,.055);border-bottom:1px solid rgba(255,255,255,.055);z-index:20}.gov-001 .gov-commands,.gov-003 .gov-commands{bottom:${RAIL + THUMBS + 4}px}.gov-002 .gov-commands{bottom:${RAIL + 3}px}.gov-commands button{border:0;border-right:1px solid rgba(255,255,255,.055);background:transparent;color:#b6bdc2;font-size:7.1px;font-weight:800}.gov-commands button:last-child{border-right:0}.gov-commands button span{margin-left:3px}.gov-thumbs{position:absolute;left:0;right:0;bottom:${RAIL}px;height:${THUMBS}px;border-top:1px solid rgba(255,255,255,.055);background:#080a0b;z-index:18;overflow:hidden}.gov-editor{position:absolute;inset:0 0 16px;background:#0a0d0b;z-index:100}.gov-editor-head{height:43px;display:flex;align-items:center;justify-content:space-between;padding:7px 9px;border-bottom:1px solid #303532;background:#151916}.gov-editor-head small{display:block;color:#8c958f;font-size:5px;font-weight:900}.gov-editor-head strong{display:block;margin-top:3px;font-size:10px}.gov-editor-head nav{display:flex}.gov-editor-head button{height:24px;padding:0 8px;border:1px solid #3b423d;background:#101310;color:#dfe3e0;font-size:6px;font-weight:900}.gov-editor-head button:first-child{color:var(--y)}.gov-editor-scroll{position:absolute;top:43px;left:0;right:0;bottom:0;padding:9px;overflow-y:auto}.gov-editor-scroll label{display:block;margin-bottom:7px}.gov-editor-scroll label span{display:block;margin-bottom:3px;color:#8d9690;font-size:5px;font-weight:900}.gov-editor-scroll input{width:100%;height:28px;padding:0 7px;border:1px solid #363d38;border-radius:4px;background:#111512;color:#fff;font-size:8px;font-weight:800;outline:none}
      `}</style>
    </article>
  );
}
