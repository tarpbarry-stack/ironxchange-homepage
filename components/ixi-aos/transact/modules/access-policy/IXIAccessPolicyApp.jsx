import { useEffect, useMemo, useState } from "react";

import {
  getAosPassportId,
  isAosDraftId
} from "../../../../../lib/mos/ixiAosProvisioningContract";

const clean = value => String(value ?? "").trim();
const unique = values => Array.from(new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean)));

const CAPABILITY_GROUPS = Object.freeze([
  { label: "AOS", capabilities: ["aos.discover", "aos.view", "aos.edit", "aos.move", "aos.delete"] },
  { label: "WORK", capabilities: ["work-order.view", "work-order.time.create", "work-order.material.create"] },
  { label: "TRAN$ACT", capabilities: ["transact.gl.view", "transact.treasury.view"] },
  { label: "ADMIN", capabilities: ["authority.manage", "identity.invite"] }
]);

function resolvePassportId(object = {}, context = {}) {
  return clean(getAosPassportId(object) || context?.primary?.passportId);
}

function blankRule(passportId = "") {
  return {
    effect: "deny",
    subjectType: "role",
    subjectId: "",
    capabilities: ["aos.view"],
    scopeType: "target-and-descendants",
    passportId,
    note: ""
  };
}

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    const error = new Error(payload?.error?.message || payload?.errors?.[0]?.message || `Authority request failed (${response.status}).`);
    error.code = payload?.error?.code || payload?.errors?.[0]?.code || "IXI_AUTHORITY_REQUEST_FAILED";
    error.status = response.status;
    error.details = payload?.error?.details || payload?.errors?.[0]?.details || null;
    throw error;
  }
  return payload;
}

const subjectLabel = rule => clean(rule?.subject?.id) || clean(rule?.subject?.type).toUpperCase() || "SUBJECT";
const scopeLabel = rule => clean(rule?.scope?.type || "target").replaceAll("-", " ").toUpperCase();

export default function IXIAccessPolicyApp({ context = {}, object = {}, onBack = null, onRecordChange = null }) {
  const objectId = clean(object?.objectId || object?.id || context?.primary?.objectId);
  const draftObject = isAosDraftId(objectId) || object?.status === "draft" || object?.metadata?.draftOnly === true;
  const passportId = useMemo(() => resolvePassportId(object, context), [object, context]);

  const [access, setAccess] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [revision, setRevision] = useState(0);
  const [draft, setDraft] = useState(() => blankRule(passportId));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const rules = Array.isArray(policy?.rules) ? policy.rules : [];
  const inheritance = policy?.inheritance || { inheritFromAncestors: true, propagateToChildren: true };
  const grants = unique([...(access?.principal?.directGrants || []), ...(access?.capabilities?.directGrants || [])]);
  const denies = unique([...(access?.principal?.directDenies || []), ...(access?.capabilities?.directDenies || [])]);
  const canManage = grants.includes("authority.manage") && !denies.includes("authority.manage");

  useEffect(() => {
    setDraft(current => ({ ...current, passportId }));
  }, [passportId]);

  async function loadAuthority() {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const accessPayload = await jsonRequest("/api/ixi/authority/access-context");
      setAccess(accessPayload?.data || null);
      setAuthRequired(false);

      if (!passportId || draftObject) {
        setPolicy(null);
        setRevision(0);
        return;
      }

      try {
        const policyPayload = await jsonRequest(`/api/ixi/authority/policies/${encodeURIComponent(passportId)}`);
        setPolicy(policyPayload?.data?.policy || null);
        setRevision(Number(policyPayload?.data?.revision || 0));
      } catch (policyError) {
        if (policyError?.status === 404 || policyError?.code === "IXI_AUTHORITY_POLICY_NOT_FOUND") {
          setPolicy(null);
          setRevision(0);
        } else {
          throw policyError;
        }
      }
    } catch (loadError) {
      if (loadError?.status === 401 || ["IXI_AUTHENTICATION_REQUIRED", "IXI_ACCESS_TOKEN_INVALID"].includes(loadError?.code)) {
        setAuthRequired(true);
      } else {
        setError(loadError?.message || "Unable to load IXI Authority.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAuthority();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passportId, draftObject]);

  async function signIn(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await jsonRequest("/api/ixi/auth/session", { method: "POST", body: JSON.stringify(credentials) });
      setCredentials(current => ({ ...current, password: "" }));
      await loadAuthority();
    } catch (loginError) {
      setError(loginError?.message || "IXI authentication failed.");
    } finally {
      setSaving(false);
    }
  }

  function toggleCapability(capability) {
    setDraft(current => {
      const selected = new Set(current.capabilities || []);
      selected.has(capability) ? selected.delete(capability) : selected.add(capability);
      return { ...current, capabilities: Array.from(selected) };
    });
  }

  async function writePolicy(nextRules, nextInheritance = inheritance) {
    if (!passportId || draftObject || !canManage) return;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const request = {
        ...(policy?.policyId ? { policyId: policy.policyId } : {}),
        target: {
          passportId,
          objectId,
          objectType: clean(object?.objectType || object?.templateType || context?.primary?.objectType || "generic"),
          label: clean(object?.displayName || object?.label || context?.primary?.label || "AOS OBJECT")
        },
        inheritance: nextInheritance,
        rules: nextRules,
        metadata: {
          source: "ixi-transact-access-policy",
          objectId,
          passportContract: "ixi-aos-object-provision-v1"
        }
      };

      const result = await jsonRequest(`/api/ixi/authority/policies/${encodeURIComponent(passportId)}`, {
        method: "PUT",
        body: JSON.stringify(request)
      });

      const nextPolicy = result?.data?.policy || request;
      const nextRevision = Number(result?.data?.revision || revision + 1);
      setPolicy(nextPolicy);
      setRevision(nextRevision);
      setNotice(`REVISION ${nextRevision} SAVED`);

      await onRecordChange?.(nextPolicy, {
        action: "policy-saved",
        revision: nextRevision,
        passportId,
        objectId
      }, context);
    } catch (saveError) {
      setError(saveError?.message || "Policy save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function addRule() {
    const capabilities = unique(draft.capabilities);
    if (draft.subjectType !== "authenticated" && !clean(draft.subjectId)) {
      setError("Choose a role, person, or group ID.");
      return;
    }
    if (!capabilities.length) {
      setError("Select at least one capability.");
      return;
    }

    await writePolicy([
      ...rules,
      {
        effect: draft.effect,
        subject: {
          type: draft.subjectType,
          ...(draft.subjectType === "authenticated" ? {} : { id: clean(draft.subjectId) })
        },
        capabilities,
        scope: { type: draft.scopeType, passportId },
        conditions: {},
        limits: {},
        enabled: true,
        note: clean(draft.note)
      }
    ]);

    setDraft(blankRule(passportId));
  }

  return (
    <div className="ap-module">
      <div className="ap-head">
        <button type="button" className="back" onClick={onBack}>‹ TRAN$ACT</button>
        <div className="title">
          <span>SECURITY</span>
          <strong>ACCESS / POLICY</strong>
          <small>{draftObject ? "DRAFT · NO PASSPORT YET" : (passportId || "LEGACY OBJECT · PASSPORT REQUIRED")}</small>
        </div>
        <div className="mode"><b>{canManage ? "ADMIN" : "READ"}</b><small>REV {revision}</small></div>
      </div>

      {loading ? <div className="message">LOADING AUTHORITY…</div> : null}
      {error ? <div className="message error">{error}</div> : null}
      {notice ? <div className="message notice">{notice}</div> : null}

      {authRequired && !loading ? (
        <form className="login" onSubmit={signIn}>
          <span>SECURE IXI SESSION</span>
          <strong>AUTHENTICATION REQUIRED</strong>
          <small>Cognito credentials are exchanged server-side. The token remains HttpOnly and never enters the card runtime.</small>
          <input type="email" autoComplete="username" placeholder="Email" value={credentials.username} onChange={event => setCredentials(current => ({ ...current, username: event.target.value }))} />
          <input type="password" autoComplete="current-password" placeholder="Password" value={credentials.password} onChange={event => setCredentials(current => ({ ...current, password: event.target.value }))} />
          <button type="submit" disabled={saving}>{saving ? "AUTHENTICATING…" : "AUTHENTICATE"}</button>
        </form>
      ) : null}

      {!loading && !authRequired ? (
        <>
          <div className="summary">
            <div><span>PRINCIPAL</span><b>{clean(access?.principal?.principalId) || "—"}</b></div>
            <div><span>POLICY</span><b>{policy?.policyId ? "ACTIVE" : "NONE"}</b></div>
            <div><span>INHERIT</span><b>{inheritance.propagateToChildren ? "TREE" : "OBJECT"}</b></div>
          </div>

          {draftObject ? <div className="message passport-state">DRAFTS ARE NOT POLICY TARGETS. SAVE CREATES THE PERMANENT OBJECT + PASSPORT TOGETHER.</div> : null}
          {!draftObject && !passportId ? <div className="message error">PRE-PROVISIONING LEGACY OBJECT WITHOUT PASSPORT IDENTITY. POLICY WRITES ARE FAIL-CLOSED.</div> : null}

          {!draftObject && passportId ? (
            <>
              <div className="section-title">
                <span>EXPLICIT RULES</span>
                {canManage ? <button type="button" disabled={saving} onClick={() => writePolicy(rules, { ...inheritance, propagateToChildren: !inheritance.propagateToChildren })}>{inheritance.propagateToChildren ? "DESCENDANTS ON" : "TARGET ONLY"}</button> : null}
              </div>

              {!rules.length ? <div className="empty">NO EXPLICIT RULES ON THIS PASSPORT</div> : null}

              {rules.map(rule => (
                <div className="rule" key={rule.ruleId || `${rule.effect}-${rule.subject?.type}-${rule.subject?.id}`}>
                  <b className={`effect ${rule.effect === "deny" ? "deny" : "allow"}`}>{clean(rule.effect).toUpperCase()}</b>
                  <div><strong>{subjectLabel(rule)}</strong><span>{(rule.capabilities || []).join(" · ")}</span><small>{scopeLabel(rule)}</small></div>
                  {canManage ? <button type="button" className="remove" disabled={saving} onClick={() => writePolicy(rules.filter(item => item.ruleId !== rule.ruleId))}>×</button> : null}
                </div>
              ))}

              {canManage ? (
                <div className="builder">
                  <div className="section-title"><span>NEW CONTROL</span></div>
                  <div className="two">
                    <label><span>DECISION</span><select value={draft.effect} onChange={event => setDraft(current => ({ ...current, effect: event.target.value }))}><option value="deny">DENY</option><option value="allow">ALLOW</option></select></label>
                    <label><span>SUBJECT</span><select value={draft.subjectType} onChange={event => setDraft(current => ({ ...current, subjectType: event.target.value }))}><option value="role">ROLE</option><option value="principal">PERSON</option><option value="group">GROUP</option><option value="authenticated">ALL AUTHENTICATED</option></select></label>
                  </div>
                  {draft.subjectType !== "authenticated" ? <label><span>SUBJECT ID</span><input value={draft.subjectId} onChange={event => setDraft(current => ({ ...current, subjectId: event.target.value }))} placeholder="role / employee / group ID" /></label> : null}
                  <label><span>SCOPE</span><select value={draft.scopeType} onChange={event => setDraft(current => ({ ...current, scopeType: event.target.value }))}><option value="target">THIS OBJECT</option><option value="target-and-descendants">THIS + DESCENDANTS</option></select></label>

                  <div className="cap-groups">
                    {CAPABILITY_GROUPS.map(group => (
                      <div className="cap-group" key={group.label}>
                        <span>{group.label}</span>
                        <div>{group.capabilities.map(capability => <button key={capability} type="button" className={draft.capabilities.includes(capability) ? "active" : ""} onClick={() => toggleCapability(capability)}>{capability}</button>)}</div>
                      </div>
                    ))}
                  </div>

                  <label><span>CONTROL NOTE</span><input value={draft.note} onChange={event => setDraft(current => ({ ...current, note: event.target.value }))} placeholder="Reason / approval / ticket" /></label>
                  <button type="button" className="save" disabled={saving} onClick={addRule}>{saving ? "SAVING…" : "ADD POLICY RULE"}</button>
                </div>
              ) : <div className="message">AUTHORITY.MANAGE IS REQUIRED TO CHANGE THIS POLICY.</div>}
            </>
          ) : null}
        </>
      ) : null}

      <style jsx>{`
        .ap-module,.ap-module *{box-sizing:border-box}.ap-module{width:100%;min-height:100%;color:#eef0ee;font-family:"Arial Narrow",Arial,sans-serif}.ap-head{display:grid;grid-template-columns:auto 1fr auto;gap:7px;align-items:center;margin-bottom:7px;padding:7px;border:1px solid #303432;border-radius:6px;background:linear-gradient(#121513,#0d100f)}.back{height:26px;padding:0 7px;border:1px solid #353936;border-radius:4px;background:#090b0a;color:#ffc400;font-size:6px;font-weight:950}.title{min-width:0}.title span{display:block;color:#858b88;font-size:5px;font-weight:950;letter-spacing:.1em}.title strong{display:block;margin-top:2px;color:#ffc400;font-size:12px}.title small{display:block;margin-top:2px;color:#747a76;font-size:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mode{text-align:right}.mode b{display:block;color:#ffc400;font-size:5.5px}.mode small{display:block;margin-top:2px;color:#777d7a;font-size:4.8px}
        .message,.empty{margin-bottom:6px;padding:7px;border:1px solid rgba(255,255,255,.08);border-radius:5px;background:#101313;color:#929895;font-size:6px;font-weight:850;line-height:1.45}.error{border-color:rgba(255,86,86,.35);color:#ff9898}.notice{border-color:rgba(255,196,0,.28);color:#ffc400}.passport-state{border-color:rgba(88,178,255,.24);color:#a8d6ff}.summary{display:grid;grid-template-columns:1.25fr .75fr .75fr;gap:4px;margin-bottom:7px}.summary div{min-width:0;padding:6px;border:1px solid rgba(255,255,255,.07);border-radius:4px;background:#0f1212}.summary span,label span{display:block;color:#727875;font-size:5px;font-weight:950;letter-spacing:.06em}.summary b{display:block;margin-top:3px;font-size:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .section-title{display:flex;align-items:center;justify-content:space-between;margin:7px 1px 4px}.section-title span{color:#858b88;font-size:5.5px;font-weight:950;letter-spacing:.11em}.section-title button{padding:4px 6px;border:1px solid rgba(255,196,0,.2);border-radius:4px;background:#141616;color:#ffc400;font-size:5px;font-weight:900}.rule{display:grid;grid-template-columns:42px 1fr 20px;gap:6px;align-items:center;padding:6px;margin-bottom:4px;border:1px solid rgba(255,255,255,.07);border-radius:5px;background:#0f1212}.effect{padding:5px 3px;border-radius:3px;text-align:center;font-size:5.5px;background:rgba(66,211,146,.1);color:#6ce3ad}.effect.deny{background:rgba(255,78,78,.1);color:#ff8a8a}.rule>div{min-width:0}.rule strong{display:block;font-size:6.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rule span{display:block;margin-top:2px;color:#9da3a0;font-size:5px;line-height:1.3}.rule small{display:block;margin-top:2px;color:#666d69;font-size:4.7px}.remove{width:20px;height:22px;border:1px solid rgba(255,76,76,.18);border-radius:4px;background:#161111;color:#ff8b8b}
        .builder{padding-bottom:7px}.two{display:grid;grid-template-columns:1fr 1fr;gap:5px}label{display:block;margin-bottom:5px}input,select{width:100%;height:27px;margin-top:3px;padding:0 7px;border:1px solid rgba(255,255,255,.09);border-radius:4px;background:#111414;color:#e9ecea;font-size:6.5px;outline:none}input:focus,select:focus{border-color:rgba(255,196,0,.38)}.cap-groups{display:grid;gap:4px;margin:5px 0}.cap-group{padding:5px;border:1px solid rgba(255,255,255,.06);border-radius:4px;background:#0d1010}.cap-group>span{display:block;margin-bottom:4px;color:#646b67;font-size:4.7px;font-weight:950}.cap-group>div{display:flex;flex-wrap:wrap;gap:3px}.cap-group button{padding:4px 5px;border:1px solid rgba(255,255,255,.08);border-radius:3px;background:#141717;color:#777e7a;font-size:4.8px;font-weight:800}.cap-group button.active{border-color:rgba(255,196,0,.4);background:rgba(255,196,0,.1);color:#ffd95c}.save{width:100%;height:29px;border:1px solid rgba(255,196,0,.42);border-radius:5px;background:linear-gradient(180deg,#2a2410,#15130d);color:#ffc400;font-size:6px;font-weight:950;letter-spacing:.08em}.save:disabled,.section-title button:disabled{opacity:.45}
        .login{padding:10px;border:1px solid rgba(255,196,0,.18);border-radius:6px;background:#0e1111}.login>span{color:#ffc400;font-size:5px;font-weight:950;letter-spacing:.12em}.login strong{display:block;margin-top:4px;font-size:11px}.login small{display:block;margin:5px 0 8px;color:#858b88;font-size:5.8px;line-height:1.45}.login button{width:100%;height:29px;margin-top:3px;border:1px solid rgba(255,196,0,.38);border-radius:4px;background:#19170e;color:#ffc400;font-size:6px;font-weight:950}
      `}</style>
    </div>
  );
}
