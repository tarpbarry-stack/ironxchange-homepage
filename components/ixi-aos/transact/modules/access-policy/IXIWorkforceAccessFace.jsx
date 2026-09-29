import { useEffect, useMemo, useState } from "react";
import { fetchAosEnvironment } from "../../../../../lib/mos/ixiMosBrowserGatewayClient";
import { getAosPassportId } from "../../../../../lib/mos/ixiAosProvisioningContract";
import IXIWorkforceAccessStyles from "./IXIWorkforceAccessStyles";

const clean = value => String(value ?? "").trim();
const ASSET_TYPES = new Set(["machine", "equipment", "vehicle", "trailer", "tool"]);
const base = () => ({
  revision: 0,
  configured: false,
  accessEnabled: false,
  templateId: "custom",
  machineScope: { mode: "none", passportIds: [] },
  environments: {
    aos: "none",
    launch: "none",
    salesDesk: { enabled: false, role: "sales", scope: "assigned" },
    calendar: "none",
    transact: "none"
  },
  financialRole: "none"
});

const TEMPLATES = Object.freeze({
  sales: { machineScope: { mode: "selected", passportIds: [] }, environments: { aos: "view", launch: "upload", salesDesk: { enabled: true, role: "sales", scope: "assigned" }, calendar: "own", transact: "use" }, financialRole: "none" },
  service: { machineScope: { mode: "selected", passportIds: [] }, environments: { aos: "view", launch: "upload", salesDesk: { enabled: false, role: "viewer", scope: "assigned" }, calendar: "own", transact: "use" }, financialRole: "none" },
  finance: { machineScope: { mode: "all", passportIds: [] }, environments: { aos: "view", launch: "none", salesDesk: { enabled: true, role: "viewer", scope: "company" }, calendar: "team", transact: "use" }, financialRole: "financial-accounting" },
  viewer: { machineScope: { mode: "selected", passportIds: [] }, environments: { aos: "view", launch: "none", salesDesk: { enabled: false, role: "viewer", scope: "assigned" }, calendar: "none", transact: "none" }, financialRole: "none" },
  custom: {}
});

async function request(path, options = {}) {
  const response = await fetch(`/api/ixi/workforce-access${path}`, {
    credentials: "same-origin",
    ...options,
    headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    const error = new Error(payload?.error?.message || `System Access request failed (${response.status}).`);
    error.code = payload?.error?.code;
    throw error;
  }
  return payload;
}

function labelFor(object) {
  const fields = object?.fields || {};
  return clean(object?.displayName || [fields.year, fields.make, fields.model].filter(Boolean).join(" ")) || "MACHINE";
}

export default function IXIWorkforceAccessFace({ context = {}, object = {}, onBack = null, onRecordChange = null }) {
  const personObjectId = clean(object?.objectId || context?.primary?.objectId);
  const [profile, setProfile] = useState(base);
  const [person, setPerson] = useState(null);
  const [machines, setMachines] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [protectedOwner, setProtectedOwner] = useState(false);
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selected = useMemo(() => new Set(profile?.machineScope?.passportIds || []), [profile]);

  async function load() {
    setLoading(true); setError(""); setNotice("");
    try {
      const [access, environment] = await Promise.all([
        request(`/people/${encodeURIComponent(personObjectId)}`),
        fetchAosEnvironment()
      ]);
      setProfile(access.profile || base());
      setPerson(access.person || null);
      setInvitations(access.invitations || []);
      setProtectedOwner(access.protectedOwner === true);
      const objects = environment?.environment?.objects || environment?.objects || [];
      setMachines(objects.filter(item => ASSET_TYPES.has(clean(item?.objectType).toLowerCase())).map(item => ({
        objectId: clean(item.objectId),
        passportId: clean(getAosPassportId(item)),
        label: labelFor(item),
        identifier: clean(item?.fields?.serialNumber || item?.serialNumber || item?.businessIdentifiers?.[0]?.value || getAosPassportId(item))
      })).filter(item => item.passportId).sort((a, b) => a.label.localeCompare(b.label)));
    } catch (loadError) {
      setError(loadError.message || "System Access could not load.");
    } finally { setLoading(false); }
  }

  useEffect(() => { if (personObjectId) load(); }, [personObjectId]);

  function applyTemplate(templateId) {
    const template = TEMPLATES[templateId] || {};
    setProfile(current => ({
      ...current,
      ...template,
      templateId,
      accessEnabled: true,
      machineScope: { ...(template.machineScope || current.machineScope), passportIds: templateId === "custom" ? current.machineScope.passportIds : [] },
      environments: { ...current.environments, ...(template.environments || {}) }
    }));
  }

  function setEnvironment(key, value) {
    setProfile(current => ({ ...current, templateId: "custom", environments: { ...current.environments, [key]: value } }));
  }

  function setMachineMode(mode) {
    setProfile(current => ({ ...current, templateId: "custom", machineScope: { mode, passportIds: mode === "selected" ? current.machineScope.passportIds : [] } }));
  }

  function toggleMachine(passportId) {
    setProfile(current => {
      const values = new Set(current.machineScope.passportIds || []);
      values.has(passportId) ? values.delete(passportId) : values.add(passportId);
      return { ...current, templateId: "custom", machineScope: { mode: "selected", passportIds: [...values] } };
    });
  }

  async function save() {
    setSaving(true); setError(""); setNotice(""); setLink("");
    try {
      const result = await request(`/people/${encodeURIComponent(personObjectId)}`, { method: "PUT", body: JSON.stringify(profile) });
      setProfile(result.profile);
      setInvitations(result.invitations || []);
      setNotice("SYSTEM ACCESS SAVED");
      await onRecordChange?.(result.profile, { action: "workforce-access-saved", personObjectId }, context);
    } catch (saveError) { setError(saveError.message || "System Access save failed."); }
    finally { setSaving(false); }
  }

  async function invite(event) {
    event.preventDefault(); setSaving(true); setError(""); setNotice(""); setLink("");
    try {
      const commandId = globalThis.crypto?.randomUUID?.() || `invite-${Date.now()}`;
      const result = await request(`/people/${encodeURIComponent(personObjectId)}/invitations`, { method: "POST", body: JSON.stringify({ email, commandId }) });
      const url = `${location.origin}/system-access?entity=${encodeURIComponent(result.invitation.entityId)}&invitation=${encodeURIComponent(result.invitation.id)}#${result.token}`;
      setLink(url); setInvitations(current => [result.invitation, ...current.filter(item => item.id !== result.invitation.id)]);
      setNotice("INVITATION READY · COPY THE LINK NOW");
    } catch (inviteError) { setError(inviteError.message || "Invitation could not be created."); }
    finally { setSaving(false); }
  }

  async function revoke(invitation) {
    setSaving(true); setError("");
    try {
      await request(`/invitations/${encodeURIComponent(invitation.id)}/revoke`, { method: "POST", body: JSON.stringify({ revision: invitation.revision }) });
      await load();
    } catch (revokeError) { setError(revokeError.message || "Invitation could not be revoked."); }
    finally { setSaving(false); }
  }

  return <div className="wfa" aria-busy={loading || saving}>
    <IXIWorkforceAccessStyles />
    <header className="wfa-head"><button className="wfa-back" onClick={onBack}>‹ TRAN$ACT</button><div className="wfa-title"><span>OWNER CONTROL</span><strong>SYSTEM ACCESS</strong><small>{person?.displayName || context?.primary?.label || "PERSON"} · {person?.passportId || "PASSPORT"}</small></div><div className="wfa-status">{profile?.status || "LOADING"}</div></header>
    {loading ? <div className="wfa-message">LOADING GOVERNED ACCESS…</div> : null}
    {error ? <div className="wfa-message error" role="alert">{error}</div> : null}
    {notice ? <div className="wfa-message" role="status">{notice}</div> : null}
    {!loading && protectedOwner ? <><div className="wfa-owner"><strong>OWNER · FULL ACCESS</strong><span>Owner authority is permanent, applies to every current and future Object, and cannot be reduced from this face.</span></div><div className="wfa-foot">THE OWNER PERSON, OBJECT, PASSPORT, AND MEMBERSHIP REMAIN CANONICAL.</div></> : null}
    {!loading && !protectedOwner ? <>
      <div className="wfa-section">1 · STARTING PROFILE</div>
      <div className="wfa-template-grid">{Object.keys(TEMPLATES).map(id => <button type="button" key={id} aria-pressed={profile.templateId === id} className={profile.templateId === id ? "on" : ""} onClick={() => applyTemplate(id)}>{id.toUpperCase()}</button>)}</div>
      <label className="wfa-check"><input type="checkbox" checked={profile.accessEnabled === true} onChange={event => setProfile(current => ({ ...current, accessEnabled: event.target.checked }))}/> LOGIN ACCESS ENABLED</label>

      <div className="wfa-section">2 · APPLICATIONS & LEVELS</div>
      <div className="wfa-grid">
        <label className="wfa-field"><span>AOS</span><select value={profile.environments.aos} onChange={event => setEnvironment("aos", event.target.value)}><option value="none">No access</option><option value="view">View</option><option value="edit">View + edit</option><option value="manage">Manage</option></select></label>
        <label className="wfa-field"><span>LAUNCH</span><select value={profile.environments.launch} onChange={event => setEnvironment("launch", event.target.value)}><option value="none">No access</option><option value="upload">Upload / suggest</option><option value="manage">Manage</option></select></label>
        <label className="wfa-field"><span>CALENDAR</span><select value={profile.environments.calendar} onChange={event => setEnvironment("calendar", event.target.value)}><option value="none">No access</option><option value="own">Own work</option><option value="team">Team view</option><option value="manage">Manage</option></select></label>
        <label className="wfa-field"><span>TRAN$ACT</span><select value={profile.environments.transact} onChange={event => setEnvironment("transact", event.target.value)}><option value="none">No access</option><option value="use">Create / work</option><option value="manage">Manage</option></select></label>
      </div>
      <label className="wfa-check"><input type="checkbox" checked={profile.environments.salesDesk.enabled === true} onChange={event => setEnvironment("salesDesk", { ...profile.environments.salesDesk, enabled: event.target.checked })}/> SALES DESK ENABLED</label>
      {profile.environments.salesDesk.enabled ? <div className="wfa-grid"><label className="wfa-field"><span>SALES ROLE</span><select value={profile.environments.salesDesk.role} onChange={event => setEnvironment("salesDesk", { ...profile.environments.salesDesk, role: event.target.value })}><option value="sales">Sales</option><option value="manager">Manager</option><option value="viewer">Viewer</option></select></label><label className="wfa-field"><span>SALES RECORDS</span><select value={profile.environments.salesDesk.scope} disabled={profile.environments.salesDesk.role === "manager"} onChange={event => setEnvironment("salesDesk", { ...profile.environments.salesDesk, scope: event.target.value })}><option value="assigned">Assigned</option><option value="company">Company</option></select></label></div> : null}
      <label className="wfa-field"><span>FINANCIAL AUTHORITY</span><select value={profile.financialRole} onChange={event => setProfile(current => ({ ...current, templateId: "custom", financialRole: event.target.value }))}><option value="none">None</option><option value="financial-viewer">View assigned scope</option><option value="financial-employee">Employee</option><option value="financial-manager">Manager</option><option value="financial-accounting">Accounting</option><option value="financial-controller">Controller</option><option value="financial-admin">Administrator</option></select></label>

      <div className="wfa-section">3 · MACHINES THIS PERSON CAN SEE</div>
      <div className="wfa-choice">{["none", "selected", "all"].map(mode => <button type="button" key={mode} aria-pressed={profile.machineScope.mode === mode} className={profile.machineScope.mode === mode ? "on" : ""} onClick={() => setMachineMode(mode)}>{mode === "none" ? "NONE" : mode === "selected" ? "SELECT" : "ALL"}</button>)}</div>
      {profile.machineScope.mode === "selected" ? <><div className="wfa-machine-actions"><button type="button" onClick={() => setProfile(current => ({ ...current, machineScope: { mode: "selected", passportIds: machines.map(item => item.passportId) } }))}>SELECT ALL</button><button type="button" onClick={() => setProfile(current => ({ ...current, machineScope: { mode: "selected", passportIds: [] } }))}>CLEAR ALL</button></div><div className="wfa-machines">{machines.map(machine => <label className="wfa-machine" key={machine.passportId}><input type="checkbox" checked={selected.has(machine.passportId)} onChange={() => toggleMachine(machine.passportId)}/><span><strong>{machine.label}</strong><small>{machine.identifier} · {machine.passportId}</small></span></label>)}</div></> : null}

      <button type="button" className="wfa-primary" disabled={saving} onClick={save}>{saving ? "SAVING…" : "SAVE SYSTEM ACCESS"}</button>

      <div className="wfa-section">4 · CONNECT LOGIN</div>
      <form className="wfa-invite" onSubmit={invite}><label className="wfa-field"><span>VERIFIED LOGIN EMAIL</span><input required type="email" disabled={profile.status === "active"} value={email} onChange={event => setEmail(event.target.value)} placeholder={profile.status === "active" ? "LOGIN ALREADY CONNECTED" : "name@company.com"}/></label><button className="wfa-secondary" disabled={saving || !profile.configured || profile.accessEnabled !== true || profile.status === "active"}>{saving ? "WORKING…" : profile.status === "active" ? "LOGIN CONNECTED" : "CREATE 7-DAY INVITATION LINK"}</button>{link ? <div className="wfa-link"><p>The secret appears once. It binds this login to this exact Person and Passport.</p><input readOnly value={link}/><button type="button" className="wfa-secondary" onClick={() => navigator.clipboard.writeText(link).catch(() => setError("Select and copy the link above."))}>COPY LINK</button></div> : null}</form>
      {invitations.filter(item => item.status === "pending").map(invitation => <div className="wfa-pending" key={invitation.id}><span>{invitation.email}<small>EXPIRES {clean(invitation.expiresAt).slice(0,10)}</small></span><button type="button" disabled={saving} onClick={() => revoke(invitation)}>REVOKE</button></div>)}
      <div className="wfa-foot">ACCESS CHANGES NEVER RENAME, RECREATE, MOVE, OR REPARENT THE PERSON OBJECT OR PASSPORT. ALL CHANGES ARE REVISION-LOCKED AND AUDITED.</div>
    </> : null}
  </div>;
}
