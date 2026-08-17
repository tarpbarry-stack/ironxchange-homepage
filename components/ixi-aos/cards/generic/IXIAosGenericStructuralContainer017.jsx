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

function numeric(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function childCount(child = {}) {
  const presentation = child?.presentation || {};
  const metadata = child?.metadata || {};
  const fields = child?.fields || {};
  return numeric(
    presentation.directChildCount ??
    metadata.directChildCount ??
    fields.directChildCount ??
    fields.childCount
  );
}

function childDescriptor(child = {}) {
  return clean(
    child?.presentation?.structuralDescriptor ||
    child?.presentation?.secondaryDescriptor ||
    child?.singularLabel ||
    child?.objectType ||
    child?.type
  );
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
    <div className="c017-editor" onPointerDown={event => event.stopPropagation()}>
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

export default function IXIAosGenericStructuralContainer017({
  object = {}, children = [], objects = [], projection = null, ixiState = {},
  onSaveObject = null, onAddObject = null, onHideObject = null, onDeleteObject = null,
  onOpenConsole = null, onOpenTransact = null, onRecall = null, onBoard = null,
  onReturn = null, onExposeObject = null, onSendFront = null, onSendBack = null,
  onCycleColor = null, onCycleOutline = null, onCycleFace = null, onRailSend = null,
  armedDestination = "", onSendToArmedDestination = null, skinId = "v12", onSkinChange = null
}) {
  const [runtimeObject, setRuntimeObject] = useState(object);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => setRuntimeObject(object), [object]);

  const items = useMemo(() => {
    const source = asArray(children).length ? asArray(children) : asArray(objects);
    return source.filter(Boolean);
  }, [children, objects]);

  const presentation = getObjectPresentation(runtimeObject);
  const relationships = getObjectRelationships(runtimeObject);
  const actions = getObjectActionCapabilities(runtimeObject);
  const directCount = items.length;
  const descendantCount = numeric(
    projection?.descendantCount ??
    projection?.totalDescendants ??
    presentation?.descendantCount ??
    presentation?.totalDescendants ??
    runtimeObject?.metadata?.descendantCount ??
    runtimeObject?.metadata?.totalDescendants
  );
  const directLabel = clean(presentation?.directChildrenLabel) || "DIRECT CHILDREN";
  const descendantLabel = clean(presentation?.descendantsLabel) || "TOTAL BELOW";
  const structureTitle = clean(presentation?.structureTitle) || "STRUCTURE";
  const relationshipsTitle = clean(presentation?.relationshipsTitle) || "RELATIONSHIPS";
  const emptyText = clean(presentation?.emptyContainerLabel) || "READY TO RECEIVE";
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

  function openChild(event, child) {
    event.preventDefault();
    event.stopPropagation();
    onExposeObject?.(child, runtimeObject);
  }

  return (
    <article className="ixi-card-017" data-card-number="017" data-card-skin={skinId}>
      <header className="c017-head">
        <div className="c017-identity">
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

      <main className="c017-body">
        <section className="c017-summary">
          <div className="c017-direct"><span>{directLabel}</span><strong>{directCount}</strong></div>
          <div className="c017-descendants"><span>{descendantLabel}</span><strong>{descendantCount === null ? "—" : descendantCount}</strong><small>{descendantCount === null ? "NOT DECLARED" : "DECLARED PROJECTION"}</small></div>
        </section>

        <section className="c017-structure">
          <div className="c017-title"><span>{structureTitle}</span><b>{directCount}</b></div>
          <div className="c017-structure-scroll">
            {items.map((child, index) => {
              const count = childCount(child);
              return (
                <button type="button" className="c017-child" key={getObjectId(child) || `child-${index}`} onClick={event => openChild(event, child)}>
                  <span className="c017-node">{index === items.length - 1 ? "└" : "├"}</span>
                  <span className="c017-child-copy">
                    <small>{childDescriptor(child) || "OBJECT"}</small>
                    <strong>{getObjectDisplayName(child)}</strong>
                  </span>
                  <span className="c017-child-count">{count === null ? "›" : <><b>{count}</b><small>DIRECT</small></>}</span>
                </button>
              );
            })}
            {!items.length ? <div className="c017-empty"><b>◇</b><strong>0 OBJECTS</strong><span>{emptyText}</span></div> : null}
          </div>
        </section>

        <section className="c017-relations">
          <div className="c017-title"><span>{relationshipsTitle}</span><b>{relationships.length}</b></div>
          <div className="c017-relation-scroll">
            {relationships.slice(0, 4).map(relationship => (
              <button type="button" key={relationship.id} onClick={event => event.stopPropagation()}>
                <span><small>{relationship.label}</small><strong>{relationship.value}</strong>{relationship.secondary ? <em>{relationship.secondary}</em> : null}</span><b>›</b>
              </button>
            ))}
            {!relationships.length ? <div className="c017-no-rel">NO RELATIONSHIPS</div> : null}
          </div>
        </section>
      </main>

      <nav className="c017-commands">
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
        .ixi-card-017,.ixi-card-017 *{box-sizing:border-box}.ixi-card-017{--y:#ffc400;--cyan:#00c2ff;--line:#343a35;--soft:#252a26;position:relative;width:${W}px;height:${H}px;overflow:hidden;border:1px solid #454b47;border-radius:13px;background:radial-gradient(circle at 84% 12%,#17495e1c,transparent 26%),linear-gradient(180deg,#111412,#080a09);color:#f3f5f3;font-family:Arial,Helvetica,sans-serif;box-shadow:inset 0 1px #ffffff12,0 18px 40px #0008}
        .c017-head{position:absolute;inset:0 0 auto;height:48px;padding:7px 10px;border-bottom:1px solid #303531;background:linear-gradient(180deg,#181b19,#101210);z-index:30}.c017-identity{max-width:188px}.c017-identity>span{display:block;color:var(--y);font-size:6px;font-weight:950;letter-spacing:.08em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.c017-identity h2{margin:3px 0 0;color:#f7f8f7;font-size:13px;font-weight:950;line-height:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.c017-identity small{display:block;margin-top:4px;color:#6f7771;font-size:4.8px;font-weight:900;letter-spacing:.06em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .c017-body{position:absolute;top:48px;left:7px;right:7px;bottom:51px;display:flex;flex-direction:column;gap:5px;padding:5px 0;overflow:hidden}.c017-summary{flex:0 0 64px;display:grid;grid-template-columns:1fr 1fr;gap:5px}.c017-direct,.c017-descendants{display:flex;flex-direction:column;justify-content:center;padding:0 10px;border:1px solid var(--line);border-radius:5px;background:linear-gradient(180deg,#151815,#101310)}.c017-direct{border-color:#5b5540}.c017-summary span{color:#8b938d;font-size:5px;font-weight:950;letter-spacing:.055em}.c017-direct span{color:var(--y)}.c017-summary strong{margin-top:4px;font-size:21px;font-weight:950;line-height:1}.c017-descendants strong{color:#eef1ef}.c017-descendants small{margin-top:4px;color:#626a65;font-size:4.5px;font-weight:900;letter-spacing:.04em}
        .c017-structure{min-height:0;flex:1;overflow:hidden;border:1px solid var(--line);border-radius:5px;background:#0e110f}.c017-title{height:21px;display:flex;align-items:center;justify-content:space-between;padding:0 7px;border-bottom:1px solid var(--soft);background:#151916}.c017-title span{color:var(--y);font-size:6px;font-weight:950;letter-spacing:.05em}.c017-title>b{display:grid;place-items:center;min-width:20px;height:13px;padding:0 4px;border:1px solid #ffffff10;border-radius:7px;background:#0c0f0d;color:#89918c;font-size:5px}.c017-structure-scroll{height:calc(100% - 21px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:#4d5550 transparent}.c017-structure-scroll::-webkit-scrollbar,.c017-relation-scroll::-webkit-scrollbar,.c017-editor main::-webkit-scrollbar{width:4px}.c017-structure-scroll::-webkit-scrollbar-track,.c017-relation-scroll::-webkit-scrollbar-track,.c017-editor main::-webkit-scrollbar-track{background:transparent}.c017-structure-scroll::-webkit-scrollbar-thumb,.c017-relation-scroll::-webkit-scrollbar-thumb,.c017-editor main::-webkit-scrollbar-thumb{border-radius:3px;background:#4d5550}.c017-structure-scroll::-webkit-scrollbar-thumb:hover,.c017-relation-scroll::-webkit-scrollbar-thumb:hover,.c017-editor main::-webkit-scrollbar-thumb:hover{background:#7b6a20}
        .c017-child{width:100%;height:41px;display:grid;grid-template-columns:17px minmax(0,1fr) 43px;align-items:center;padding:0 6px;border:0;border-bottom:1px solid var(--soft);background:transparent;color:#f3f5f3;text-align:left;cursor:pointer}.c017-child:hover{background:#171b18}.c017-node{color:#606862;font-size:12px;text-align:center}.c017-child-copy{min-width:0;display:flex;flex-direction:column}.c017-child-copy small{color:#737c76;font-size:4.8px;font-weight:900;letter-spacing:.04em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.c017-child-copy strong{margin-top:3px;overflow:hidden;color:#eef1ef;font-size:7.5px;font-weight:950;text-overflow:ellipsis;white-space:nowrap}.c017-child-count{height:28px;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;padding-left:6px;border-left:1px solid #ffffff0d;color:var(--y);font-size:12px;font-weight:950}.c017-child-count>b{font-size:10px}.c017-child-count>small{margin-top:1px;color:#69716c;font-size:4px;font-weight:900}.c017-empty{height:100%;min-height:92px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#626a65}.c017-empty>b{color:#7a6b28;font-size:15px}.c017-empty>strong{margin-top:6px;color:#89918c;font-size:8px}.c017-empty>span{margin-top:4px;font-size:5px;font-weight:900;letter-spacing:.05em}
        .c017-relations{flex:0 0 92px;overflow:hidden;border:1px solid var(--line);border-radius:5px;background:#0e110f}.c017-relation-scroll{height:calc(100% - 21px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:#4d5550 transparent}.c017-relation-scroll button{width:100%;min-height:31px;display:grid;grid-template-columns:1fr auto;align-items:center;padding:4px 7px;border:0;border-bottom:1px solid var(--soft);background:transparent;color:#fff;text-align:left}.c017-relation-scroll button>span{min-width:0;display:flex;flex-direction:column}.c017-relation-scroll small{color:#737c76;font-size:4.8px;font-weight:900}.c017-relation-scroll strong{margin-top:2px;overflow:hidden;color:#e5e9e6;font-size:7px;font-weight:900;text-overflow:ellipsis;white-space:nowrap}.c017-relation-scroll em{margin-top:1px;color:#6f7772;font-size:4.5px;font-style:normal}.c017-relation-scroll button>b{color:var(--y);font-size:10px}.c017-no-rel{height:100%;display:grid;place-items:center;color:#626a65;font-size:5px;font-weight:900}
        .c017-commands{position:absolute;left:7px;right:7px;bottom:23px;height:25px;display:grid;grid-template-columns:repeat(3,1fr);gap:5px;z-index:20}.c017-commands button{border:1px solid #ffffff12;border-radius:4px;background:#101310;color:var(--cyan);font-size:8px;font-weight:950}.c017-commands b{margin-left:3px;color:#8f9792;font-size:5.5px}
        .c017-editor{position:absolute;inset:7px 7px 24px;z-index:100;overflow:hidden;border:1px solid #4a504c;border-radius:8px;background:#0a0d0b;box-shadow:0 18px 40px #000c}.c017-editor>header{height:42px;display:flex;align-items:center;justify-content:space-between;padding:0 9px;border-bottom:1px solid #303531;background:#151916}.c017-editor>header small{display:block;color:var(--y);font-size:5px;font-weight:950}.c017-editor>header strong{display:block;margin-top:3px;font-size:10px}.c017-editor nav{display:flex;gap:4px}.c017-editor nav button{height:22px;padding:0 7px;border:1px solid #4a504c;border-radius:4px;background:#0e110f;color:#dfe3e0;font-size:5px;font-weight:950}.c017-editor nav button:first-child{border-color:#ffc40055;color:var(--y)}.c017-editor main{height:calc(100% - 42px);overflow-y:auto;padding:8px;scrollbar-width:thin;scrollbar-color:#4d5550 transparent}.c017-editor label{display:block;margin-bottom:7px}.c017-editor label span{display:block;margin-bottom:3px;color:#7f8882;font-size:5px;font-weight:950}.c017-editor input{width:100%;height:26px;padding:0 7px;border:1px solid #343a35;border-radius:4px;background:#111411;color:#eef1ef;font-size:8px;font-weight:850;outline:none}.c017-editor input:focus{border-color:#ffc40088}
      `}</style>
    </article>
  );
}
