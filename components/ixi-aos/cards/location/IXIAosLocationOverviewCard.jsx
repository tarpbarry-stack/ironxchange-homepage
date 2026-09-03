import { useEffect, useMemo, useState } from "react";

import IXIObjectRail from "../../../ixi-object-system/IXIObjectRail";
import IXICollectionThumbRail from "../../../ixi-object-system/IXICollectionThumbRail";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";
import IXIAosPrimaryMediaEditor from "../../card-runtime/modules/IXIAosPrimaryMediaEditor";
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

function fieldInputValue(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return clean(value?.displayName || value?.label || value?.name || value?.value);
  return String(value ?? "");
}

function parseValue(definition, rawValue) {
  const type = clean(definition?.fieldType).toLowerCase();
  if (["number", "integer", "money", "currency"].includes(type)) {
    const n = Number(rawValue);
    return Number.isFinite(n) ? n : null;
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

function uniqueDefinitions(definitions = []) {
  const seen = new Set();
  return definitions.filter(definition => {
    const id = clean(definition?.fieldId);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function draftForObject(object, definitions) {
  const fields = getObjectFields(object);
  const next = {};
  definitions.forEach(definition => {
    next[definition.fieldId] = fieldInputValue(fields?.[definition.fieldId]);
  });
  return next;
}

function Metric({ label, value }) {
  return <div className="gov-metric"><span>{label}</span><strong>{value}</strong></div>;
}

export default function IXIAosLocationOverviewCard({
  variant = "001",
  object = {},
  objects = [],
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
  const [editName, setEditName] = useState(getObjectDisplayName(object));
  const [editDraft, setEditDraft] = useState(() => draftForObject(object, getFieldDefinitions(object)));
  const [editMedia, setEditMedia] = useState(asArray(object?.media));

  useEffect(() => {
    setRuntimeObject(object);
    if (!editing) {
      const definitions = getFieldDefinitions(object).filter(definition => definition.editable !== false);
      setEditName(getObjectDisplayName(object));
      setEditDraft(draftForObject(object, definitions));
      setEditMedia(asArray(object?.media));
    }
  }, [object, editing]);

  const children = useMemo(() => asArray(objects).filter(Boolean), [objects]);
  const aggregates = useMemo(() => buildChildAggregateGroups(children), [children]);
  const relationships = getObjectRelationships(runtimeObject);
  const presentation = getObjectPresentation(runtimeObject);
  const actions = getObjectActionCapabilities(runtimeObject);
  const image = getPrimaryImage(runtimeObject);
  const definitions = getFieldDefinitions(runtimeObject).filter(definition => definition.editable !== false);
  const activeIndex = children.length ? Math.min(Math.max(selectedChildIndex, 0), children.length - 1) : -1;
  const activeChild = activeIndex >= 0 ? children[activeIndex] : null;

  const businessIdentifierDef = firstRoleField(runtimeObject, ["business-identifier"]);
  const descriptorOneDef = firstRoleField(runtimeObject, ["descriptor-primary", "subtitle", "secondary"]);
  const descriptorTwoDef = firstRoleField(runtimeObject, ["descriptor-secondary", "location", "group", "organization"]);
  const descriptorOne = clean(presentation?.primaryDescriptor) || (descriptorOneDef ? getFieldDisplayValue(runtimeObject, descriptorOneDef) : "");
  const descriptorTwo = clean(presentation?.secondaryDescriptor) || (descriptorTwoDef ? getFieldDisplayValue(runtimeObject, descriptorTwoDef) : "");
  const descriptorEditDefinitions = uniqueDefinitions([businessIdentifierDef, descriptorOneDef, descriptorTwoDef]);
  const descriptorEditIds = new Set(descriptorEditDefinitions.map(definition => definition.fieldId));
  const otherEditDefinitions = definitions.filter(definition => !descriptorEditIds.has(definition.fieldId));

  const metricEntries = aggregates[0]?.entries || [];
  const metrics = [
    { label: clean(presentation?.countLabel) || "OBJECTS", value: children.length },
    ...metricEntries.slice(0, 2).map(entry => ({ label: entry.label, value: entry.value }))
  ];
  while (metrics.length < 3) metrics.push({ label: "—", value: "—" });

  function beginEditing() {
    const nextDefinitions = getFieldDefinitions(runtimeObject).filter(definition => definition.editable !== false);
    setEditName(getObjectDisplayName(runtimeObject));
    setEditDraft(draftForObject(runtimeObject, nextDefinitions));
    setEditMedia(asArray(runtimeObject?.media));
    setEditing(true);
  }

  function cancelEditing() {
    const nextDefinitions = getFieldDefinitions(runtimeObject).filter(definition => definition.editable !== false);
    setEditName(getObjectDisplayName(runtimeObject));
    setEditDraft(draftForObject(runtimeObject, nextDefinitions));
    setEditMedia(asArray(runtimeObject?.media));
    setEditing(false);
  }

  async function saveEditing() {
    const nextFields = { ...getObjectFields(runtimeObject) };
    definitions.forEach(definition => {
      nextFields[definition.fieldId] = parseValue(definition, editDraft[definition.fieldId]);
    });

    const nextObject = {
      ...runtimeObject,
      displayName: clean(editName) || getObjectDisplayName(runtimeObject),
      fields: nextFields,
      media: editMedia
    };

    setSaving(true);
    try {
      await onSaveObject?.({
        objectId: getObjectId(nextObject),
        object: nextObject,
        displayName: nextObject.displayName,
        fields: nextFields,
        media: asArray(nextObject.media)
      });
      setRuntimeObject(nextObject);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function setField(fieldId, value) {
    setEditDraft(current => ({ ...current, [fieldId]: value }));
  }

  function command(event, callback) {
    event.preventDefault();
    event.stopPropagation();
    callback?.(runtimeObject);
  }

  const mediaNode = editing && variant !== "002" ? (
    <div className="gov-media-inline-editor">
      <IXIAosPrimaryMediaEditor media={editMedia} onChange={setEditMedia} />
    </div>
  ) : image ? (
    <img src={image} alt={getObjectDisplayName(runtimeObject)}/>
  ) : (
    <div className="gov-media-empty"><b>IXI</b><span>PRIMARY MEDIA</span></div>
  );

  const descriptorNode = (
    <div className="gov-descriptor">
      <span className="gov-mark">◆</span>
      {editing ? (
        <div className="gov-descriptor-inline-editor" onPointerDown={event => event.stopPropagation()}>
          {descriptorEditDefinitions.length ? descriptorEditDefinitions.map(definition => (
            <input
              key={definition.fieldId}
              aria-label={definition.label}
              title={definition.label}
              placeholder={definition.label}
              value={editDraft[definition.fieldId] ?? ""}
              onChange={event => setField(definition.fieldId, event.target.value)}
            />
          )) : <small>NO EDITABLE ADDRESS FIELDS</small>}
        </div>
      ) : (
        <div><strong>{descriptorOne || getObjectLabel(runtimeObject)}</strong><small>{descriptorTwo || ""}</small></div>
      )}
    </div>
  );

  return (
    <article className={`ixi-generic-overview gov-${variant}`} data-card-number={variant} data-editing={editing ? "true" : "false"}>
      <header className="gov-head">
        <div className="gov-identity">
          <span>{getObjectLabel(runtimeObject)}</span>
          {editing ? (
            <input
              className="gov-name-inline-editor"
              aria-label="Display name"
              value={editName}
              onChange={event => setEditName(event.target.value)}
              onPointerDown={event => event.stopPropagation()}
            />
          ) : <strong>{getObjectDisplayName(runtimeObject)}</strong>}
        </div>
        {editing ? (
          <nav className="gov-inline-edit-actions" onPointerDown={event => event.stopPropagation()}>
            <button type="button" disabled={saving} onClick={saveEditing}>{saving ? "SAVING" : "SAVE"}</button>
            <button type="button" disabled={saving} onClick={cancelEditing}>CANCEL</button>
          </nav>
        ) : (
          <IXIAosCardHeaderControls
            canAdd={actions.canCreate && typeof onAddObject === "function"}
            canEdit={actions.canEdit}
            canTransact={actions.canTransact && typeof onOpenTransact === "function"}
            onAdd={() => onAddObject?.(runtimeObject)}
            onToggleEdit={beginEditing}
            onTransact={() => onOpenTransact?.(runtimeObject)}
            onHide={onHideObject}
            onDelete={onDeleteObject}
            onOpenConsole={actions.canOpenConsole ? onOpenConsole : null}
          />
        )}
      </header>

      <main className="gov-body">
        {variant === "003" ? (
          <div className="gov-003-split">
            <div className={`gov-media${editing ? " gov-media-editing" : ""}`}>{mediaNode}</div>
            <div className="gov-003-info">
              {descriptorNode}
              <div className="gov-003-secondary">{clean(presentation?.tertiaryDescriptor) || clean(presentation?.descriptorFallback) || getObjectLabel(runtimeObject)}</div>
            </div>
          </div>
        ) : variant !== "002" ? (
          <div className={`gov-media${editing ? " gov-media-editing" : ""}`}>{mediaNode}</div>
        ) : null}

        {variant !== "003" ? descriptorNode : null}

        {variant !== "002" ? (
          <div className="gov-preview">
            <strong>{clean(presentation?.collectionTitle) || (activeChild ? getObjectDisplayName(activeChild) : "NO OBJECT SELECTED")}</strong>
            <span>{activeChild ? `${activeIndex + 1}/${children.length}` : "0/0"}</span>
            <button type="button" disabled={!activeChild || editing} onClick={event => { event.stopPropagation(); if (activeChild && !editing) onExposeObject?.(activeChild, runtimeObject); }}>OUT ↗</button>
          </div>
        ) : null}

        <div className="gov-metrics">{metrics.slice(0,3).map((metric,index)=><Metric key={`${metric.label}-${index}`} label={metric.label} value={metric.value}/>)}</div>

        <section className="gov-relations">
          <h3>{editing ? "EDIT FIELDS" : clean(presentation?.relationshipsTitle) || "RELATIONSHIPS"}</h3>
          {editing ? (
            <div className="gov-field-editor-scroll" onPointerDown={event => event.stopPropagation()}>
              {otherEditDefinitions.map(definition => (
                <label key={definition.fieldId}>
                  <span>{definition.label}</span>
                  <input
                    value={editDraft[definition.fieldId] ?? ""}
                    onChange={event => setField(definition.fieldId, event.target.value)}
                  />
                </label>
              ))}
              {!otherEditDefinitions.length ? <div className="gov-empty">NO ADDITIONAL EDITABLE FIELDS</div> : null}
            </div>
          ) : (
            <div className="gov-relation-scroll">
              {relationships.map(relationship => (
                <button type="button" key={relationship.id}>
                  <span><small>{relationship.label}</small><strong>{relationship.value}</strong>{relationship.secondary ? <em>{relationship.secondary}</em> : null}</span><b>›</b>
                </button>
              ))}
              {!relationships.length ? <div className="gov-empty">NO RELATIONSHIPS</div> : null}
            </div>
          )}
        </section>
      </main>

      <nav className="gov-commands">
        <button type="button" disabled={editing} onClick={event => command(event,onRecall)}>↻ <span>RECALL</span></button>
        <button type="button" disabled={editing} onClick={event => command(event,onBoard)}>▦ <span>BOARD</span></button>
        <button type="button" disabled={editing} onClick={event => command(event,onReturn)}>↩ <span>RETURN</span></button>
      </nav>

      {variant !== "002" ? (
        <div className="gov-thumbs">
          <IXICollectionThumbRail
            items={children}
            activeItemIndex={activeIndex}
            getItemId={getObjectId}
            getItemImage={getPrimaryImage}
            getItemLabel={getObjectDisplayName}
            onSelectItem={(item,index)=>{ if (!editing) setSelectedChildIndex(index); }}
          />
        </div>
      ) : null}

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
        armedDestination={armedDestination}
        onSendToArmedDestination={onSendToArmedDestination}
      />

      <style jsx global>{`
        .ixi-generic-overview,.ixi-generic-overview *{box-sizing:border-box}.ixi-generic-overview{--y:#ffc400;--line:#343a35;--soft:#252a26;position:relative;width:${W}px;height:${H}px;overflow:hidden;border:1px solid #454b47;border-radius:13px;background:linear-gradient(180deg,#101310,#080a09);color:#f4f5f4;font-family:Arial,Helvetica,sans-serif;box-shadow:inset 0 1px #ffffff12,0 18px 40px #0008}.gov-head{position:absolute;inset:0 0 auto;height:43px;padding:7px 10px;border-bottom:1px solid #303531;background:linear-gradient(180deg,#171a18,#101210);z-index:40}.gov-identity{width:185px}.gov-identity>span{display:block;color:var(--y);font-size:6px;font-weight:950;letter-spacing:.08em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gov-identity>strong{display:block;margin-top:4px;color:#f6f7f6;font-size:14px;font-weight:950;line-height:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gov-name-inline-editor{display:block;width:172px;height:18px;margin-top:2px;padding:0 5px;border:1px solid #3b423d;border-radius:3px;background:#111512;color:#f6f7f6;font-size:11px;font-weight:800;line-height:16px;outline:none}.gov-name-inline-editor:focus{border-color:#ffc40088}.gov-inline-edit-actions{position:absolute;top:8px;right:8px;z-index:260;display:flex;gap:3px}.gov-inline-edit-actions button{height:24px;padding:0 7px;border:1px solid #3b423d;border-radius:4px;background:#101310;color:#dfe3e0;font-size:6px;font-weight:950}.gov-inline-edit-actions button:first-child{color:var(--y);border-color:#ffc40055}.gov-inline-edit-actions button:disabled{opacity:.55}.gov-body{position:absolute;top:43px;left:7px;right:7px;display:flex;flex-direction:column;gap:5px;padding:5px 0;overflow:hidden}.gov-001 .gov-body,.gov-003 .gov-body{bottom:108px}.gov-002 .gov-body{bottom:51px}.gov-media{height:100%;min-height:0;overflow:hidden;border:1px solid var(--line);border-radius:5px;background:#0b0e0c}.gov-001>.gov-body>.gov-media{flex:0 0 112px}.gov-media img{width:100%;height:100%;display:block;object-fit:cover}.gov-media-empty{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;color:#69716c;background:#0d100e}.gov-media-empty b{color:#7d857f;font-size:21px}.gov-media-empty span{font-size:5px;font-weight:900}.gov-media-inline-editor{width:100%;height:100%;padding:4px;overflow:hidden}.gov-media-inline-editor>.ixi-aos-primary-media-editor{width:100%;height:100%;min-height:0;padding:5px;grid-template-columns:72px 1fr;gap:6px}.gov-media-inline-editor .ixi-aos-primary-media-preview{width:72px;height:100%;min-height:56px}.gov-media-inline-editor .ixi-aos-primary-media-copy>div{margin-top:5px}.gov-003 .gov-media-inline-editor{padding:2px}.gov-003 .gov-media-inline-editor>.ixi-aos-primary-media-editor{padding:3px;grid-template-columns:46px 1fr;gap:3px}.gov-003 .gov-media-inline-editor .ixi-aos-primary-media-preview{width:46px;height:54px;min-height:0}.gov-003 .gov-media-inline-editor .ixi-aos-primary-media-copy>small{display:none}.gov-003 .gov-media-inline-editor .ixi-aos-primary-media-copy>div{margin-top:3px;gap:2px}.gov-003 .gov-media-inline-editor .ixi-aos-primary-media-copy label,.gov-003 .gov-media-inline-editor .ixi-aos-primary-media-copy button{height:18px;padding:0 3px;font-size:4.5px}.gov-descriptor{flex:0 0 43px;display:grid;grid-template-columns:20px 1fr;align-items:center;padding:0 8px;border:1px solid var(--line);border-radius:5px;background:#111411}.gov-002 .gov-descriptor{flex-basis:57px}.gov-mark{color:var(--y);font-size:12px;text-align:center}.gov-descriptor strong{display:block;color:#eef1ef;font-size:8px;font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gov-descriptor small{display:block;margin-top:3px;color:#969d98;font-size:6px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gov-descriptor-inline-editor{min-width:0;display:flex;flex-direction:column;gap:2px;overflow:hidden}.gov-descriptor-inline-editor input{width:100%;height:13px;min-height:13px;padding:0 4px;border:1px solid #363d38;border-radius:2px;background:#0d100e;color:#eef1ef;font-size:6px;font-weight:800;line-height:11px;outline:none}.gov-descriptor-inline-editor input:focus{border-color:#ffc40088}.gov-descriptor-inline-editor small{margin:0;font-size:5px}.gov-003-split{flex:0 0 82px;display:grid;grid-template-columns:1fr 1fr;gap:5px}.gov-003-info{min-width:0;display:flex;flex-direction:column;gap:5px}.gov-003-info .gov-descriptor{flex:1}.gov-003-secondary{flex:0 0 22px;display:flex;align-items:center;padding:0 7px;border:1px solid var(--line);border-radius:5px;background:#101310;color:#8f9892;font-size:5.5px;font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gov-preview{flex:0 0 22px;display:grid;grid-template-columns:minmax(0,1fr) 34px 52px;align-items:center;border:1px solid var(--line);border-radius:5px;background:#101310;overflow:hidden}.gov-preview strong{padding:0 8px;overflow:hidden;color:#e8ebe9;font-size:7px;font-weight:900;text-overflow:ellipsis;white-space:nowrap}.gov-preview span{color:#7c857f;font-size:6px;text-align:center}.gov-preview button{height:100%;border:0;border-left:1px solid var(--soft);background:transparent;color:var(--y);font-size:7px;font-weight:950}.gov-preview button:disabled{color:#59605b}.gov-metrics{flex:0 0 43px;display:grid;grid-template-columns:1fr 1.25fr 1fr;gap:4px}.gov-metric{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border:1px solid var(--line);border-radius:5px;background:#111411}.gov-metric span{max-width:100%;padding:0 3px;overflow:hidden;color:#969d98;font-size:5px;font-weight:900;text-overflow:ellipsis;white-space:nowrap}.gov-metric strong{font-size:12px;font-weight:950}.gov-relations{min-height:0;flex:1;overflow:hidden;border:1px solid var(--line);border-radius:5px;background:#101310}.gov-relations h3{height:19px;margin:0;display:flex;align-items:center;padding:0 7px;border-bottom:1px solid var(--soft);background:#151916;color:var(--y);font-size:6px;font-weight:950}.gov-relation-scroll,.gov-field-editor-scroll{height:calc(100% - 19px);overflow-y:auto}.gov-relation-scroll button{width:100%;min-height:24px;display:grid;grid-template-columns:1fr 18px;align-items:center;padding:3px 6px 3px 8px;border:0;border-bottom:1px solid #242925;background:transparent;color:#fff;text-align:left}.gov-relation-scroll button:nth-child(even){background:#ffffff08}.gov-relation-scroll small{display:block;color:#8f9792;font-size:5px;font-weight:900}.gov-relation-scroll strong{display:block;margin-top:1px;font-size:7px;font-weight:900}.gov-relation-scroll em{display:block;color:#6e7771;font-size:5px;font-style:normal}.gov-relation-scroll button>b{color:var(--y);text-align:center}.gov-field-editor-scroll{padding:4px}.gov-field-editor-scroll label{display:grid;grid-template-columns:74px minmax(0,1fr);align-items:center;gap:4px;min-height:25px;padding:3px 4px;border-bottom:1px solid #242925}.gov-field-editor-scroll label:nth-child(even){background:#ffffff06}.gov-field-editor-scroll label span{overflow:hidden;color:#aeb5b0;font-size:6px;font-weight:900;text-overflow:ellipsis;white-space:nowrap}.gov-field-editor-scroll input{width:100%;min-width:0;height:20px;padding:0 5px;border:1px solid #363d38;border-radius:3px;background:#111512;color:#fff;font-size:7px;font-weight:800;outline:none}.gov-field-editor-scroll input:focus{border-color:#ffc40088}.gov-empty{padding:15px;color:#68716b;font-size:5.5px;font-weight:900;text-align:center}.gov-commands{position:absolute;left:7px;right:7px;height:27px;display:grid;grid-template-columns:repeat(3,1fr);border:1px solid var(--line);border-radius:5px;background:#0f120f;overflow:hidden;z-index:20}.gov-001 .gov-commands,.gov-003 .gov-commands{bottom:78px}.gov-002 .gov-commands{bottom:20px}.gov-commands button{border:0;border-right:1px solid var(--soft);background:transparent;color:#b9c0bb;font-size:7px;font-weight:900}.gov-commands button:last-child{border-right:0}.gov-commands button:disabled{color:#59605b}.gov-commands span{margin-left:3px}.gov-thumbs{position:absolute;left:0;right:0;bottom:19px;height:55px;overflow:hidden;border-top:1px solid #292e2a;background:#080a09;z-index:18}
      `}</style>
    </article>
  );
}
