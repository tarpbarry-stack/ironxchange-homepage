import { useEffect, useMemo, useState } from "react";
import { clean, getFieldDefinitions, getObjectDisplayName, getObjectFields } from "../IXIAosSemanticObjectPresentation";

function valueText(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return clean(value?.displayName || value?.label || value?.name || value?.value);
  return String(value ?? "");
}

function parseValue(definition, rawValue) {
  const type = clean(definition?.fieldType || definition?.type).toLowerCase();
  if (["number", "integer", "money", "currency"].includes(type)) {
    const number = Number(rawValue);
    return Number.isFinite(number) ? number : null;
  }
  if (["tags", "array", "list", "multi-select", "multiselect"].includes(type)) {
    return String(rawValue || "").split(",").map(clean).filter(Boolean);
  }
  return rawValue;
}

const CONFIG = {
  4: { topCount: 2, topMode: "right-stack", bodyTop: 112, bodyBottom: 112 },
  5: { topCount: 4, topMode: "grid-4", bodyTop: 101, bodyBottom: 112 },
  6: { topCount: 4, topMode: "grid-4", bodyTop: 101, bodyBottom: 112 },
  7: { topCount: 2, topMode: "grid-2", bodyTop: 116, bodyBottom: 112 },
  8: { topCount: 2, topMode: "grid-2", bodyTop: 116, bodyBottom: 112 },
  9: { topCount: 2, topMode: "grid-2", bodyTop: 188, bodyBottom: 52 },
  10: { topCount: 4, topMode: "grid-4", bodyTop: 155, bodyBottom: 52 },
  11: { topCount: 4, topMode: "grid-4", bodyTop: 155, bodyBottom: 52 },
  12: { topCount: 3, topMode: "grid-3", bodyTop: 150, bodyBottom: 52 },
  13: { topCount: 2, topMode: "grid-2", bodyTop: 148, bodyBottom: 52 },
  14: { topCount: 4, topMode: "grid-4", bodyTop: 156, bodyBottom: 52 },
  15: { topCount: 3, topMode: "grid-3", bodyTop: 150, bodyBottom: 52 },
  16: { topCount: 3, topMode: "grid-3", bodyTop: 150, bodyBottom: 52 },
  17: { topCount: 2, topMode: "grid-2", bodyTop: 140, bodyBottom: 52 }
};

export default function IXIAosInlineFace1Editor({ cardNumber, object = {}, onSaveObject = null, children }) {
  const [runtimeObject, setRuntimeObject] = useState(object);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(getObjectDisplayName(object));
  const [draft, setDraft] = useState({});

  useEffect(() => { if (!editing) setRuntimeObject(object); }, [object, editing]);

  const definitions = useMemo(
    () => getFieldDefinitions(runtimeObject).filter(definition => definition?.editable !== false && clean(definition?.fieldId)),
    [runtimeObject]
  );
  const fields = getObjectFields(runtimeObject);
  const config = CONFIG[Number(cardNumber)] || { topCount: 2, topMode: "grid-2", bodyTop: 135, bodyBottom: 52 };
  const topDefinitions = definitions.slice(0, config.topCount);
  const bodyDefinitions = definitions.slice(config.topCount);

  function beginEdit(event) {
    const button = event?.target?.closest?.("button.header-action.edit");
    if (!button || editing) return;
    event.preventDefault();
    event.stopPropagation();
    const next = {};
    definitions.forEach(definition => { next[definition.fieldId] = valueText(fields?.[definition.fieldId]); });
    setName(getObjectDisplayName(runtimeObject));
    setDraft(next);
    setEditing(true);
  }

  function cancel(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setEditing(false);
  }

  async function save(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (saving) return;
    const nextFields = { ...fields };
    definitions.forEach(definition => { nextFields[definition.fieldId] = parseValue(definition, draft[definition.fieldId]); });
    const nextObject = { ...runtimeObject, displayName: clean(name) || getObjectDisplayName(runtimeObject), fields: nextFields };
    setSaving(true);
    try {
      await onSaveObject?.({ object: nextObject, objectId: nextObject?.objectId || nextObject?.id, displayName: nextObject.displayName, fields: nextFields });
      setRuntimeObject(nextObject);
      setEditing(false);
    } finally { setSaving(false); }
  }

  return (
    <div className={`ixi-inline-face1-editor c${String(cardNumber).padStart(3,"0")}-inline-edit ${editing ? "is-editing" : ""}`} onClickCapture={beginEdit}>
      {typeof children === "function" ? children(runtimeObject) : children}
      {editing ? <>
        <input className="ixi-inline-name" aria-label="Display name" value={name} onChange={event => setName(event.target.value)} onPointerDown={event => event.stopPropagation()} />
        <nav className="ixi-inline-actions" onPointerDown={event => event.stopPropagation()}>
          <button type="button" disabled={saving} onClick={save}>{saving ? "SAVING" : "SAVE"}</button>
          <button type="button" disabled={saving} onClick={cancel}>CANCEL</button>
        </nav>
        <div className={`ixi-inline-top ${config.topMode}`}>
          {topDefinitions.map(definition => <label key={definition.fieldId}><span>{definition.label}</span><input value={draft[definition.fieldId] ?? ""} onChange={event => setDraft(current => ({ ...current, [definition.fieldId]: event.target.value }))} onPointerDown={event => event.stopPropagation()} /></label>)}
        </div>
        <section className="ixi-inline-body" style={{ top: config.bodyTop, bottom: config.bodyBottom }} onPointerDown={event => event.stopPropagation()}>
          <div className="ixi-inline-body-title">EDIT FIELDS</div>
          <div className="ixi-inline-body-scroll">
            {bodyDefinitions.map(definition => <label key={definition.fieldId}><span>{definition.label}</span><input value={draft[definition.fieldId] ?? ""} onChange={event => setDraft(current => ({ ...current, [definition.fieldId]: event.target.value }))} /></label>)}
            {!bodyDefinitions.length ? <div className="ixi-inline-empty">NO ADDITIONAL EDITABLE FIELDS</div> : null}
          </div>
        </section>
      </> : null}
      <style jsx>{`
        .ixi-inline-face1-editor{position:relative;width:298px;height:471px}
        .ixi-inline-name{position:absolute;top:20px;left:10px;z-index:410;width:174px;height:18px;padding:0 5px;border:1px solid #3b423d;border-radius:3px;background:#111512;color:#f6f7f6;font:800 11px/16px Arial;outline:none}
        .ixi-inline-actions{position:absolute;top:17px;right:8px;z-index:420;display:flex;gap:4px}
        .ixi-inline-actions button{height:22px;padding:0 7px;border:1px solid rgba(255,255,255,.10);border-radius:4px;background:#111411;color:#dce0dd;font:800 7px/20px Arial}.ixi-inline-actions button:first-child{color:#ffc400}
        .is-editing :global(.ixi-aos-card-header-controls){visibility:hidden!important}
        .is-editing :global([class*="identity"] h2),.is-editing :global([class*="identity"]>strong){visibility:hidden!important}
        .ixi-inline-top{position:absolute;z-index:405;pointer-events:auto}
        .ixi-inline-top label{min-width:0;display:flex;flex-direction:column;justify-content:center;padding:4px 6px;border:1px solid #3a403b;border-radius:4px;background:rgba(9,12,10,.94)}
        .ixi-inline-top span,.ixi-inline-body label span{display:block;margin-bottom:3px;color:#aeb5b0;font:700 6px/1 Arial;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .ixi-inline-top input,.ixi-inline-body input{width:100%;min-width:0;height:22px;padding:0 5px;border:1px solid #59615b;border-radius:4px;background:#090c0a;color:#f3f5f3;font:700 9px/20px Arial;outline:none}
        .ixi-inline-top.grid-2{top:50px;left:7px;right:7px;height:58px;display:grid;grid-template-columns:repeat(2,1fr);gap:5px}
        .ixi-inline-top.grid-3{top:50px;left:7px;right:7px;height:92px;display:grid;grid-template-columns:repeat(3,1fr);gap:5px}
        .ixi-inline-top.grid-4{top:50px;left:7px;right:7px;height:98px;display:grid;grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(2,1fr);gap:4px}
        .ixi-inline-top.right-stack{top:48px;right:7px;width:91px;height:59px;display:grid;grid-template-rows:repeat(2,1fr);gap:1px}
        .ixi-inline-top.right-stack label{border-radius:0;padding:2px 5px}.ixi-inline-top.right-stack span{font-size:5px}.ixi-inline-top.right-stack input{height:18px;font-size:8px}
        .ixi-inline-body{position:absolute;left:7px;right:7px;z-index:404;overflow:hidden;border:1px solid #343a35;border-radius:5px;background:rgba(8,11,9,.94)}
        .ixi-inline-body-title{height:19px;display:flex;align-items:center;padding:0 7px;border-bottom:1px solid #252a26;color:#ffc400;font:950 6px/1 Arial;letter-spacing:.04em}
        .ixi-inline-body-scroll{height:calc(100% - 19px);padding:5px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#4b514d transparent}
        .ixi-inline-body label{display:block;margin-bottom:5px;padding:5px;border:1px solid #303631;border-radius:4px;background:#111512}
        .ixi-inline-empty{height:100%;display:flex;align-items:center;justify-content:center;color:#69706b;font:800 6px/1 Arial}
      `}</style>
    </div>
  );
}
