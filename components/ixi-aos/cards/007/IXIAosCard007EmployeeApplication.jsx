import { useEffect, useState } from "react";

import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";
import IXIAosCard007Employee from "./IXIAosCard007Employee";

function clean(value) {
  return String(value ?? "").trim();
}

function fieldsOf(object = {}) {
  return object?.fields && typeof object.fields === "object" ? object.fields : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function objectIdOf(object = {}) {
  return clean(object?.objectId || object?.id?.uuid || object?.id);
}

function capabilityLabels(object = {}) {
  const fields = fieldsOf(object);
  const source = asArray(fields?.capabilities).length
    ? asArray(fields.capabilities)
    : asArray(fields?.skills);

  return source.map(item => {
    if (typeof item === "string") return clean(item);
    return clean(item?.label || item?.name || item?.value);
  }).filter(Boolean);
}

function mediaUrl(item) {
  if (typeof item === "string") return clean(item);
  return clean(item?.url || item?.src || item?.imageUrl);
}

function firstPhoto(object = {}) {
  const first = asArray(object?.media).find(item => mediaUrl(item));
  return mediaUrl(first) || clean(fieldsOf(object)?.photoUrl || fieldsOf(object)?.imageUrl);
}

export default function IXIAosCard007EmployeeApplication({
  object = {},
  onSaveObject = null,
  onHideObject = null,
  onDeleteObject = null,
  onOpenConsole = null,
  onOpenTransact = null,
  onMessage = null,
  onCall = null,
  onEmail = null,
  onRecords = null,
  skinId = "v12",
  onSkinChange = null
}) {
  const [runtimeObject, setRuntimeObject] = useState(object);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({});
  const [draftMedia, setDraftMedia] = useState(asArray(object?.media));
  const [capabilityText, setCapabilityText] = useState("");

  useEffect(() => {
    setRuntimeObject(object);
    if (!editing) loadDraft(object);
  }, [object]);

  function loadDraft(source) {
    const fields = fieldsOf(source);
    setDraft({
      displayName: clean(source?.displayName),
      employmentStatus: clean(fields?.employmentStatus || source?.status),
      employeeNumber: clean(fields?.employeeNumber || fields?.employeeId),
      jobTitle: clean(fields?.jobTitle || fields?.role || fields?.position),
      department: clean(fields?.department || fields?.workGroup),
      primaryLocation: clean(fields?.primaryLocation || fields?.location || fields?.yard),
      city: clean(fields?.city),
      state: clean(fields?.state),
      workPhone: clean(fields?.workPhone || fields?.phone),
      workEmail: clean(fields?.workEmail || fields?.email),
      capabilities: capabilityLabels(source)
    });
    setDraftMedia(asArray(source?.media));
  }

  function beginEdit() {
    loadDraft(runtimeObject);
    setCapabilityText("");
    setEditing(true);
  }

  function patch(key, value) {
    setDraft(current => ({ ...current, [key]: value }));
  }

  function addCapability() {
    const value = clean(capabilityText);
    if (!value) return;
    setDraft(current => ({
      ...current,
      capabilities: Array.from(new Set([...(current.capabilities || []), value]))
    }));
    setCapabilityText("");
  }

  function removeCapability(value) {
    setDraft(current => ({
      ...current,
      capabilities: asArray(current.capabilities).filter(item => item !== value)
    }));
  }

  function handlePhotoFile(event) {
    const file = event?.target?.files?.[0];
    if (!file || !file.type?.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      const photo = {
        url: String(reader.result || ""),
        name: clean(file.name),
        type: clean(file.type),
        size: Number(file.size || 0),
        source: "employee-photo-upload"
      };
      setDraftMedia(current => [photo, ...asArray(current).filter(item => mediaUrl(item) !== photo.url)]);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function removePhoto() {
    setDraftMedia([]);
  }

  async function save() {
    if (saving) return;
    setSaving(true);

    const nextFields = {
      ...fieldsOf(runtimeObject),
      employmentStatus: clean(draft.employmentStatus),
      employeeNumber: clean(draft.employeeNumber),
      jobTitle: clean(draft.jobTitle),
      department: clean(draft.department),
      primaryLocation: clean(draft.primaryLocation),
      city: clean(draft.city),
      state: clean(draft.state),
      workPhone: clean(draft.workPhone),
      workEmail: clean(draft.workEmail),
      capabilities: asArray(draft.capabilities).map(clean).filter(Boolean)
    };

    const nextObject = {
      ...runtimeObject,
      displayName: clean(draft.displayName) || runtimeObject.displayName,
      status: clean(draft.employmentStatus || runtimeObject.status),
      fields: nextFields,
      media: [...draftMedia]
    };

    try {
      await onSaveObject?.({
        objectId: objectIdOf(nextObject),
        object: nextObject,
        displayName: nextObject.displayName,
        fields: nextFields,
        media: [...draftMedia]
      });
      setRuntimeObject(nextObject);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  const editPreviewObject = editing
    ? { ...runtimeObject, displayName: draft.displayName || runtimeObject.displayName, status: draft.employmentStatus || runtimeObject.status, fields: { ...fieldsOf(runtimeObject), ...draft }, media: draftMedia }
    : runtimeObject;

  const previewPhoto = firstPhoto(editPreviewObject);

  return (
    <div className="employee007-app">
      <IXIAosCard007Employee
        object={editPreviewObject}
        onEdit={beginEdit}
        onHideObject={onHideObject}
        onDeleteObject={onDeleteObject}
        onOpenConsole={onOpenConsole}
        onOpenTransact={onOpenTransact}
        onMessage={onMessage}
        onCall={onCall}
        onEmail={onEmail}
        onRecords={onRecords}
        skinId={skinId}
        onSkinChange={onSkinChange}
      />

      {!editing && typeof onOpenTransact === "function" ? (
        <div className="employee007-transact-gateway">
          <button type="button" title="Open TRAN$ACT" onClick={event => { event.preventDefault(); event.stopPropagation(); onOpenTransact?.(runtimeObject); }}>$</button>
        </div>
      ) : null}

      {editing ? (
        <div className="employee007-editor" onPointerDown={event => event.stopPropagation()}>
          <div className="employee007-editor-head">
            <div><small>EMPLOYEE OBJECT</small><strong>EDIT EMPLOYEE</strong></div>
            <nav>
              <button type="button" disabled={saving} onClick={save}>SAVE</button>
              <button type="button" disabled={saving} onClick={() => { loadDraft(runtimeObject); setEditing(false); }}>CANCEL</button>
            </nav>
          </div>

          <div className="employee007-editor-scroll">
            <section className="employee007-photo-editor">
              <div className="employee007-photo-preview">
                {previewPhoto ? <img src={previewPhoto} alt="Employee" /> : <span>NO PHOTO</span>}
              </div>
              <div className="employee007-photo-actions">
                <strong>EMPLOYEE PHOTO</strong>
                <p>Upload or replace the employee's primary card photo.</p>
                <label>CHANGE PHOTO<input type="file" accept="image/*" onChange={handlePhotoFile} /></label>
                {previewPhoto ? <button type="button" onClick={removePhoto}>REMOVE</button> : null}
              </div>
            </section>

            <section>
              <div className="section-title">IDENTITY & WORK</div>
              <label><span>NAME</span><input value={draft.displayName || ""} onChange={event => patch("displayName", event.target.value)} /></label>
              <div className="two"><label><span>STATUS</span><input value={draft.employmentStatus || ""} onChange={event => patch("employmentStatus", event.target.value)} /></label><label><span>EMPLOYEE ID</span><input value={draft.employeeNumber || ""} onChange={event => patch("employeeNumber", event.target.value)} /></label></div>
              <label><span>JOB TITLE / ROLE</span><input value={draft.jobTitle || ""} onChange={event => patch("jobTitle", event.target.value)} /></label>
              <div className="two"><label><span>DEPARTMENT</span><input value={draft.department || ""} onChange={event => patch("department", event.target.value)} /></label><label><span>PRIMARY LOCATION</span><input value={draft.primaryLocation || ""} onChange={event => patch("primaryLocation", event.target.value)} /></label></div>
              <div className="two"><label><span>CITY</span><input value={draft.city || ""} onChange={event => patch("city", event.target.value)} /></label><label><span>STATE</span><input value={draft.state || ""} onChange={event => patch("state", event.target.value)} /></label></div>
            </section>

            <section>
              <div className="section-title">WORK CONTACT</div>
              <label><span>WORK PHONE</span><input value={draft.workPhone || ""} onChange={event => patch("workPhone", event.target.value)} /></label>
              <label><span>WORK EMAIL</span><input value={draft.workEmail || ""} onChange={event => patch("workEmail", event.target.value)} /></label>
            </section>

            <section className="capability-editor">
              <div className="section-title">CAPABILITIES / SPECIAL SKILLS</div>
              <div className="capability-list">
                {asArray(draft.capabilities).map(value => (
                  <button key={value} type="button" onClick={() => removeCapability(value)}>{value}<b>×</b></button>
                ))}
              </div>
              <div className="capability-add"><input value={capabilityText} placeholder="ADD ANY CAPABILITY" onChange={event => setCapabilityText(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); addCapability(); } }} /><button type="button" onClick={addCapability}>ADD</button></div>
            </section>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .employee007-app{position:relative;width:298px;height:471px}.employee007-transact-gateway{position:absolute;top:8px;right:31px;z-index:230}.employee007-transact-gateway button{width:25px;height:20px;border:0;border-left:1px solid rgba(255,255,255,.055);background:transparent;color:#ffc400;font:500 16px/1 Arial;cursor:pointer}.employee007-transact-gateway button:hover{background:rgba(255,255,255,.02)}
        .employee007-editor{position:absolute;inset:42px 7px 19px;z-index:250;overflow:hidden;border:1px solid #4b524e;border-radius:7px;background:#080b09;box-shadow:0 16px 34px #000d;color:#fff;font-family:Arial,sans-serif}.employee007-editor-head{height:43px;display:flex;align-items:center;justify-content:space-between;padding:0 7px 0 9px;border-bottom:1px solid #343a35;background:linear-gradient(180deg,#171b18,#101310)}.employee007-editor-head small{display:block;margin-bottom:3px;color:#8e9691;font-size:5px;font-weight:900}.employee007-editor-head strong{display:block;color:#ffc400;font-size:8px;font-weight:950}.employee007-editor-head nav{display:flex;gap:3px}.employee007-editor-head button{height:24px;padding:0 7px;border:1px solid #454c47;border-radius:4px;background:#0c0f0d;color:#ffc400;font-size:6px;font-weight:950}.employee007-editor-scroll{position:absolute;inset:43px 0 0;overflow-y:auto;padding:7px;scrollbar-width:thin;scrollbar-color:#555c57 #080b09}.employee007-editor section{margin:0 0 7px;padding:7px;border:1px solid #303631;border-radius:5px;background:#111512}.section-title{margin-bottom:7px;color:#ffc400;font-size:6px;font-weight:950}.employee007-editor label{display:block;margin-bottom:6px}.employee007-editor label span{display:block;margin-bottom:3px;color:#9ea6a1;font-size:5px;font-weight:950}.employee007-editor input{width:100%;height:27px;padding:0 6px;border:1px solid #343a35;border-radius:4px;background:#080b09;color:#fff;font-size:7px;font-weight:800;outline:none}.employee007-editor input:focus{border-color:rgba(255,196,0,.55)}.employee007-editor .two{display:grid;grid-template-columns:1fr 1fr;gap:5px}.employee007-photo-editor{display:grid!important;grid-template-columns:86px 1fr;gap:8px;align-items:stretch}.employee007-photo-preview{height:92px;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid #3b423d;border-radius:5px;background:#070907;color:#686f6b;font-size:6px;font-weight:900}.employee007-photo-preview img{width:100%;height:100%;object-fit:cover}.employee007-photo-actions{min-width:0;display:flex;flex-direction:column;align-items:flex-start}.employee007-photo-actions strong{color:#ffc400;font-size:6px}.employee007-photo-actions p{margin:5px 0 8px;color:#8d958f;font-size:5.5px;line-height:1.3}.employee007-photo-actions label,.employee007-photo-actions button{height:24px;margin:0 0 4px;padding:0 7px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,196,0,.42);border-radius:4px;background:#17150b;color:#ffc400;font-size:6px;font-weight:950;cursor:pointer}.employee007-photo-actions label input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}.employee007-photo-actions button{border-color:#414842;background:#0d100e;color:#aeb5b1}.capability-list{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px}.capability-list button{height:22px;padding:0 6px;border:1px solid #3d4540;border-radius:11px;background:#171c18;color:#e8ebe9;font-size:6px;font-weight:850}.capability-list b{margin-left:5px;color:#ff7a65}.capability-add{display:grid;grid-template-columns:1fr 42px;gap:4px}.capability-add button{border:1px solid rgba(255,196,0,.45);border-radius:4px;background:#17150b;color:#ffc400;font-size:6px;font-weight:950}
      `}</style>
    </div>
  );
}
