import { useEffect, useMemo, useState } from "react";

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

function locationOf(object = {}) {
  const fields = fieldsOf(object);
  return clean(fields?.primaryLocation || fields?.location || fields?.yard);
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
  const [draft, setDraft] = useState({});

  useEffect(() => {
    setRuntimeObject(object);
    if (!editing) loadDraft(object);
  }, [object]);

  const people = useMemo(() => asArray(children).filter(Boolean), [children]);

  const employeeLocations = useMemo(() => {
    const counts = new Map();
    people.forEach(person => {
      const label = locationOf(person);
      if (!label) return;
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [people]);

  function loadDraft(source) {
    const fields = fieldsOf(source);
    setDraft({
      displayName: displayNameOf(source),
      company: clean(fields?.company),
      openJobs: String(fields?.openJobs ?? ""),
      teams: String(fields?.teams ?? fields?.crews ?? ""),
      containerLabel: clean(fields?.containerLabel || source?.pluralLabel || "EMPLOYEES")
    });
  }

  function beginEdit() {
    loadDraft(runtimeObject);
    setEditing(true);
  }

  function patch(field, value) {
    setDraft(current => ({ ...current, [field]: value }));
  }

  function cancelEdit() {
    loadDraft(runtimeObject);
    setEditing(false);
  }

  async function saveEdit() {
    if (saving) return;
    setSaving(true);

    const nextFields = {
      ...fieldsOf(runtimeObject),
      company: clean(draft.company),
      openJobs: Number(draft.openJobs || 0),
      teams: Number(draft.teams || 0),
      containerLabel: clean(draft.containerLabel) || "EMPLOYEES"
    };

    const nextObject = {
      ...runtimeObject,
      displayName: clean(draft.displayName) || displayNameOf(runtimeObject),
      pluralLabel: clean(draft.containerLabel) || runtimeObject?.pluralLabel,
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

  return (
    <div className={`personnel-app-shell personnel-app-variant-${variant}`}>
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

      {!editing ? (
        <div className="personnel-app-header-controls">
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
        </div>
      ) : null}

      {editing ? (
        <div className="personnel-app-editor" onPointerDown={event => event.stopPropagation()}>
          <header>
            <div>
              <small>EDIT PERSONNEL CONTAINER</small>
              <strong>{draft.displayName || "EMPLOYEES"}</strong>
            </div>
            <nav>
              <button type="button" disabled={saving} onClick={saveEdit}>SAVE</button>
              <button type="button" disabled={saving} onClick={cancelEdit}>CANCEL</button>
            </nav>
          </header>

          <div className="personnel-app-editor-scroll">
            <section>
              <h4>IDENTITY</h4>
              <label>
                <span>CONTAINER NAME</span>
                <input value={draft.displayName || ""} onChange={event => patch("displayName", event.target.value)} />
              </label>
              <label>
                <span>PEOPLE LABEL</span>
                <input value={draft.containerLabel || ""} onChange={event => patch("containerLabel", event.target.value)} />
              </label>
              <label>
                <span>COMPANY</span>
                <input value={draft.company || ""} onChange={event => patch("company", event.target.value)} />
              </label>
            </section>

            <section>
              <h4>OPERATING COUNTS</h4>
              <div className="personnel-app-two">
                <label>
                  <span>OPEN JOBS</span>
                  <input inputMode="numeric" value={draft.openJobs || ""} onChange={event => patch("openJobs", event.target.value)} />
                </label>
                <label>
                  <span>TEAMS / CREWS</span>
                  <input inputMode="numeric" value={draft.teams || ""} onChange={event => patch("teams", event.target.value)} />
                </label>
              </div>
            </section>

            <section>
              <h4>EMPLOYEE LOCATIONS · DERIVED</h4>
              <div className="personnel-app-location-list">
                {employeeLocations.length ? employeeLocations.map(([label, count]) => (
                  <div key={label}><span>{label}</span><b>{count}</b></div>
                )) : <p>NO EMPLOYEE LOCATIONS SAVED</p>}
              </div>
              <p className="personnel-app-note">Locations come from the Employee objects in this container. They are not manually maintained here.</p>
            </section>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        .personnel-app-shell{position:relative;width:298px;height:471px;overflow:hidden;border-radius:13px}.personnel-app-header-controls{position:absolute;inset:0;pointer-events:none;z-index:90}.personnel-app-header-controls .ixi-aos-card-header-controls{pointer-events:auto}

        /* 005 / 006 must remain useful when customer-defined categories exceed the sample data. */
        .personnel-app-shell .ixi-personnel-v12 .pc-content{overflow-y:auto!important;overflow-x:hidden!important;scrollbar-width:thin;scrollbar-color:#4b514d #0b0d0c;padding-right:2px}.personnel-app-shell .ixi-personnel-v12 .pc-section{min-height:0}.personnel-app-shell .ixi-personnel-v12 .pc-section-body{overflow-y:auto!important;overflow-x:hidden!important;scrollbar-width:thin;scrollbar-color:#424844 #101310}.personnel-app-shell .ixi-personnel-v12 .pc-department-bars,.personnel-app-shell .ixi-personnel-v12 .pc-capability-bars,.personnel-app-shell .ixi-personnel-v12 .pc-capability-tiles,.personnel-app-shell .ixi-personnel-v12 .pc-key-capability-grid,.personnel-app-shell .ixi-personnel-v12 .pc-quick-grid,.personnel-app-shell .ixi-personnel-v12 .pc-relationship-list{overflow-y:auto!important;overflow-x:hidden!important;scrollbar-width:thin}.personnel-app-shell .ixi-personnel-v12 .pc-content::-webkit-scrollbar,.personnel-app-shell .ixi-personnel-v12 .pc-section-body::-webkit-scrollbar{width:4px}.personnel-app-shell .ixi-personnel-v12 .pc-content::-webkit-scrollbar-thumb,.personnel-app-shell .ixi-personnel-v12 .pc-section-body::-webkit-scrollbar-thumb{background:#454c47;border-radius:3px}

        .personnel-app-editor{position:absolute;inset:43px 7px 20px;z-index:250;overflow:hidden;border:1px solid #505752;border-radius:7px;background:#090c0a;box-shadow:0 18px 38px rgba(0,0,0,.72);color:#f4f5f4;font-family:Arial,Helvetica,sans-serif}.personnel-app-editor>header{height:47px;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 7px 6px 9px;border-bottom:1px solid #343a35;background:linear-gradient(180deg,#171b18,#101310)}.personnel-app-editor>header>div{min-width:0}.personnel-app-editor>header small{display:block;margin-bottom:4px;color:#ffc400;font-size:5px;font-weight:950;letter-spacing:.2px}.personnel-app-editor>header strong{display:block;max-width:165px;overflow:hidden;color:#fff;font-size:10px;font-weight:950;text-overflow:ellipsis;white-space:nowrap}.personnel-app-editor nav{display:flex;gap:3px}.personnel-app-editor nav button{height:25px;padding:0 8px;border:1px solid #4b524e;border-radius:4px;background:#111512;color:#ffc400;font-size:6px;font-weight:950}.personnel-app-editor-scroll{position:absolute;inset:47px 0 0;overflow-y:auto;padding:7px;scrollbar-width:thin;scrollbar-color:#555c57 #090c0a}.personnel-app-editor section{margin:0 0 7px;padding:7px;border:1px solid #303631;border-radius:5px;background:#111512}.personnel-app-editor h4{margin:0 0 7px;color:#ffc400;font-size:6px;font-weight:950;letter-spacing:.15px}.personnel-app-editor label{display:block;margin-bottom:7px}.personnel-app-editor label:last-child{margin-bottom:0}.personnel-app-editor label span{display:block;margin-bottom:3px;color:#9da5a0;font-size:5px;font-weight:900}.personnel-app-editor input{width:100%;height:28px;padding:0 7px;border:1px solid #3c433e;border-radius:4px;background:#080b09;color:#fff;font-size:8px;font-weight:800;outline:none}.personnel-app-editor input:focus{border-color:rgba(255,196,0,.62);box-shadow:0 0 0 1px rgba(255,196,0,.10)}.personnel-app-two{display:grid;grid-template-columns:1fr 1fr;gap:6px}.personnel-app-location-list{max-height:92px;overflow-y:auto;border:1px solid #292f2b;border-radius:4px;background:#0b0e0c}.personnel-app-location-list div{height:25px;display:flex;align-items:center;justify-content:space-between;padding:0 7px;border-bottom:1px solid #242925}.personnel-app-location-list div:last-child{border-bottom:0}.personnel-app-location-list span{color:#cbd0cd;font-size:6px;font-weight:850}.personnel-app-location-list b{color:#fff;font-size:7px}.personnel-app-location-list p,.personnel-app-note{margin:0;padding:7px;color:#777f7a;font-size:5.5px;line-height:1.35}.personnel-app-note{padding:6px 1px 0}
      `}</style>
    </div>
  );
}
