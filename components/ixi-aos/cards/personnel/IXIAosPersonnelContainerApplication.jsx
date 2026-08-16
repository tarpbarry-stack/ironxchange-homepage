import { useEffect, useMemo, useState } from "react";

import IXICollectionThumbRail from "../../../ixi-object-system/IXICollectionThumbRail";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";
import IXIAosPersonnelContainerCard from "./IXIAosPersonnelContainerCard";

function clean(value) {
  return String(value ?? "").trim();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function fieldsOf(object = {}) {
  return object?.fields && typeof object.fields === "object" ? object.fields : {};
}

function objectIdOf(object = {}) {
  return clean(object?.objectId || object?.id?.uuid || object?.id);
}

function displayNameOf(object = {}) {
  const fields = fieldsOf(object);
  return clean(object?.displayName || object?.label || fields?.displayName || fields?.name) || "EMPLOYEES";
}

function imageOf(object = {}) {
  const fields = fieldsOf(object);
  const first = asArray(object?.media).find(Boolean);
  if (typeof first === "string") return clean(first);
  return clean(first?.url || first?.src || fields?.photoUrl || fields?.imageUrl);
}

function employeeNumberOf(object = {}) {
  const fields = fieldsOf(object);
  return clean(fields?.employeeNumber || fields?.employeeId || objectIdOf(object));
}

function locationOf(object = {}) {
  const fields = fieldsOf(object);
  return clean(fields?.primaryLocation || fields?.location || fields?.yard);
}

function CommandStrip({ object, onRecall, onBoard, onReturn }) {
  function run(event, callback) {
    event.preventDefault();
    event.stopPropagation();
    callback?.(object);
  }

  return (
    <div className="personnel-app-command-strip">
      <button type="button" onClick={event => run(event, onRecall)}>↻ <b>RECALL</b></button>
      <button type="button" onClick={event => run(event, onBoard)}>▦ <b>BOARD</b></button>
      <button type="button" onClick={event => run(event, onReturn)}>↩ <b>RETURN</b></button>
    </div>
  );
}

export default function IXIAosPersonnelContainerApplication({
  variant = 2,
  object = {},
  children = [],
  onAddObject = null,
  onSaveObject = null,
  onHideObject = null,
  onDeleteObject = null,
  onOpenConsole = null,
  onOpenTransact = null,
  onRecall = null,
  onBoard = null,
  onReturn = null,
  onExposeObject = null
}) {
  const [runtimeObject, setRuntimeObject] = useState(object);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftName, setDraftName] = useState(displayNameOf(object));
  const [draftCompany, setDraftCompany] = useState(clean(fieldsOf(object)?.company));
  const [draftOpenJobs, setDraftOpenJobs] = useState(String(fieldsOf(object)?.openJobs ?? ""));
  const [draftTeams, setDraftTeams] = useState(String(fieldsOf(object)?.teams ?? fieldsOf(object)?.crews ?? ""));
  const [activeChildIndex, setActiveChildIndex] = useState(0);

  useEffect(() => {
    setRuntimeObject(object);
    if (!editing) {
      setDraftName(displayNameOf(object));
      setDraftCompany(clean(fieldsOf(object)?.company));
      setDraftOpenJobs(String(fieldsOf(object)?.openJobs ?? ""));
      setDraftTeams(String(fieldsOf(object)?.teams ?? fieldsOf(object)?.crews ?? ""));
    }
  }, [object, editing]);

  const people = useMemo(() => asArray(children).filter(Boolean), [children]);
  const safeIndex = Math.min(activeChildIndex, Math.max(0, people.length - 1));

  function beginEdit() {
    setDraftName(displayNameOf(runtimeObject));
    setDraftCompany(clean(fieldsOf(runtimeObject)?.company));
    setDraftOpenJobs(String(fieldsOf(runtimeObject)?.openJobs ?? ""));
    setDraftTeams(String(fieldsOf(runtimeObject)?.teams ?? fieldsOf(runtimeObject)?.crews ?? ""));
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function saveEdit() {
    if (saving) return;
    setSaving(true);

    const nextFields = {
      ...fieldsOf(runtimeObject),
      company: clean(draftCompany),
      openJobs: Number(draftOpenJobs || 0),
      teams: Number(draftTeams || 0)
    };

    const nextObject = {
      ...runtimeObject,
      displayName: clean(draftName) || displayNameOf(runtimeObject),
      fields: nextFields
    };

    try {
      await onSaveObject?.({
        objectId: objectIdOf(nextObject),
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

  const employeeLocations = useMemo(() => {
    const counts = new Map();
    people.forEach(person => {
      const label = locationOf(person);
      if (!label) return;
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [people]);

  return (
    <div className="personnel-app-shell">
      <div className="personnel-app-card">
        <IXIAosPersonnelContainerCard
          variant={variant}
          object={runtimeObject}
          children={people}
          onAddObject={onAddObject}
          onEdit={beginEdit}
          onHideObject={onHideObject}
          onDeleteObject={onDeleteObject}
          onOpenConsole={onOpenConsole}
          onRecall={onRecall}
          onBoard={onBoard}
          onReturn={onReturn}
          onExposeObject={onExposeObject}
        />
      </div>

      <div className="personnel-app-header-overlay">
        {editing ? (
          <>
            <input
              className="personnel-app-name-input"
              value={draftName}
              onChange={event => setDraftName(event.target.value)}
              onPointerDown={event => event.stopPropagation()}
              aria-label="Container name"
            />
            <div className="personnel-app-edit-actions">
              <button type="button" disabled={saving} onClick={saveEdit}>SAVE</button>
              <button type="button" disabled={saving} onClick={cancelEdit}>CANCEL</button>
            </div>
          </>
        ) : (
          <IXIAosCardHeaderControls
            canAdd
            canEdit
            canTransact={typeof onOpenTransact === "function"}
            onAdd={() => onAddObject?.(runtimeObject)}
            onToggleEdit={beginEdit}
            onTransact={() => onOpenTransact?.(runtimeObject)}
            onHide={onHideObject}
            onDelete={onDeleteObject}
            onOpenConsole={onOpenConsole}
          />
        )}
      </div>

      {editing ? (
        <div className="personnel-app-editor" onPointerDown={event => event.stopPropagation()}>
          <label>
            <span>COMPANY</span>
            <input value={draftCompany} onChange={event => setDraftCompany(event.target.value)} />
          </label>
          <label>
            <span>OPEN JOBS</span>
            <input inputMode="numeric" value={draftOpenJobs} onChange={event => setDraftOpenJobs(event.target.value)} />
          </label>
          <label>
            <span>TEAMS / CREWS</span>
            <input inputMode="numeric" value={draftTeams} onChange={event => setDraftTeams(event.target.value)} />
          </label>
        </div>
      ) : null}

      <div className="personnel-app-locations" title="Employee locations">
        <span>LOCATIONS</span>
        <div>
          {employeeLocations.length
            ? employeeLocations.map(([label, count]) => <b key={label}>{label} · {count}</b>)
            : <b>NO EMPLOYEE LOCATIONS</b>}
        </div>
      </div>

      <style jsx global>{`
        .personnel-app-shell{position:relative;width:298px;height:471px;overflow:hidden;border-radius:13px}.personnel-app-card{position:absolute;inset:0}.personnel-app-header-overlay{position:absolute;top:0;right:0;height:43px;z-index:80}.personnel-app-header-overlay>.ixi-aos-card-header-controls{top:9px;right:8px}.personnel-app-name-input{position:absolute;top:20px;right:96px;width:150px;height:18px;padding:0 5px;border:1px solid #555d58;border-radius:3px;background:#080a09;color:#fff;font:900 9px Arial}.personnel-app-edit-actions{position:absolute;top:8px;right:7px;display:flex;gap:3px}.personnel-app-edit-actions button{height:24px;padding:0 7px;border:1px solid #555d58;border-radius:4px;background:#111512;color:#ffc400;font:950 6px Arial}.personnel-app-editor{position:absolute;top:46px;left:9px;right:9px;z-index:70;display:grid;grid-template-columns:1.5fr .7fr .7fr;gap:4px;padding:5px;border:1px solid #4a514c;border-radius:5px;background:rgba(7,9,8,.98);box-shadow:0 10px 24px #000b}.personnel-app-editor label{min-width:0}.personnel-app-editor span{display:block;margin-bottom:3px;color:#ffc400;font:950 5px Arial}.personnel-app-editor input{width:100%;height:21px;padding:0 5px;border:1px solid #343a35;border-radius:3px;background:#111512;color:#fff;font:800 7px Arial}.personnel-app-locations{position:absolute;left:8px;right:8px;bottom:111px;z-index:35;height:24px;display:grid;grid-template-columns:48px 1fr;align-items:center;gap:4px;padding:3px 5px;border:1px solid #343a35;border-radius:4px;background:#0c0f0d;pointer-events:none}.personnel-app-locations>span{color:#ffc400;font:950 5px Arial}.personnel-app-locations>div{display:flex;gap:8px;overflow-x:auto;white-space:nowrap}.personnel-app-locations b{color:#b9bfbb;font:800 5px Arial}
      `}</style>
    </div>
  );
}
