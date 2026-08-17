import { useEffect, useMemo, useState } from "react";

const clean = value => String(value ?? "").trim();
const uniq = values => Array.from(new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean)));

const CAPABILITIES = Object.freeze([
  "aos.discover",
  "aos.view",
  "aos.edit",
  "aos.move",
  "aos.delete",
  "authority.manage",
  "identity.invite",
  "work-order.view",
  "work-order.time.create",
  "work-order.material.create",
  "transact.gl.view",
  "transact.treasury.view"
]);

function passportIdFor(object = {}, context = {}) {
  return clean(
    object?.passportId ||
    object?.ixiPassportId ||
    object?.passport?.passportId ||
    context?.primary?.passportId ||
    context?.passportId
  );
}

function newRule(passportId = "") {
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
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    const error = new Error(payload?.error?.message || payload?.errors?.[0]?.message || `Request failed (${response.status})`);
    error.code = payload?.error?.code || payload?.errors?.[0]?.code || "IXI_AUTHORITY_REQUEST_FAILED";
    error.status = response.status;
    throw error;
  }
  return payload;
}

export default function IXIAccessPolicyApp({ context = {}, object = {}, onBack = null, onRecordChange = null }) {
  const passportId = useMemo(() => passportIdFor(object, context), [object, context]);
  const [access, setAccess] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [revision, setRevision] = useState(0);
  const [draft, setDraft] = useState(() => newRule(passportId));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const rules = Array.isArray(policy?.rules) ? policy.rules : [];
  const inheritance = policy?.inheritance || { inheritFromAncestors: true, propagateToChildren: true };
  const grants = access?.principal?.directGrants || access?.capabilities?.directGrants || [];
  const canManage = Array.isArray(grants) && grants.includes("authority.manage");

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

      if (!passportId) {
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
      if (loadError?.status === 401 || loadError?.code === "IXI_AUTHENTICATION_REQUIRED") {
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
  }, [passportId]);

  async function signIn(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await jsonRequest("/api/ixi/auth/session", {
        method: "POST",
        body: JSON.stringify(credentials)
      });
      setCredentials(current => ({ ...current, password: "" }));
      await loadAuthority();
    } catch (loginError) {
      setError(loginError?.message || "IXI login failed.");
    } finally {
      setSaving(false);
    }
  }

  function toggleCapability(capability) {
    setDraft(current => {
      const selected = new Set(current.capabilities || []);
      if (selected.has(capability)) selected.delete(capability);
      else selected.add(capability);
      return { ...current, capabilities: Array.from(selected) };
    });
  }

  async function writePolicy(nextRules, nextInheritance = inheritance) {
    if (!passportId || !canManage) return;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const target = {
        passportId,
        objectId: clean(object?.objectId || object?.id || context?.primary?.objectId),
        objectType: clean(object?.objectType || context?.primary?.objectType || "generic"),
        label: clean(object?.displayName || object?.label || context?.primary?.label || "AOS OBJECT")
      };

      const request = {
        ...(policy?.policyId ? { policyId: policy.policyId } : {}),
        target,
        inheritance: nextInheritance,
        rules: nextRules
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
        passportId
      }, context);
    } catch (saveError) {
      setError(saveError?.message || "Policy save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function addRule() {
    const capabilities = uniq(draft.capabilities);
    if (draft.subjectType !== "authenticated" && !clean(draft.subjectId)) {
      setError("Choose a role, person, or group ID.");
      return;
    }
    if (!capabilities.length) {
      setError("Select at least one capability.");
      return;
    }

    const rule = {
      effect: draft.effect,
      subject: {
        type: draft.subjectType,
        ...(draft.subjectType === "authenticated" ? {} : { id: clean(draft.subjectId) })
      },
      capabilities,
      scope: {
        type: draft.scopeType,
        passportId
      },
      note: clean(draft.note),
      enabled: true
    };

    await writePolicy([...rules, rule]);
    setDraft(newRule(passportId));
  }

  return (
    <div className="ap-shell">
      <header>
        <button type="button" className="back" onClick={onBack}>‹</button>
        <div className="title"><span>IXI TRAN$ACT · SECURITY</span><strong>ACCESS / POLICY</strong><small>{passportId || "PASSPORT REQUIRED"}</small></div>
        <div className="mode"><b>{canManage ? "ADMIN" : "READ"}</b><small>REV {revision}</small></div>
      </header>

      <main>
        {loading ? <div className="message">LOADING AUTHORITY…</div> : null}
        {error ? <div className="message error">{error}</div> : null}
        {notice ? <div className="message notice">{notice}</div> : null}

        {authRequired && !loading ? (
          <form className="login" onSubmit={signIn}>
            <div className="eyebrow">SECURE IXI SESSION</div>
            <strong>AUTHENTICATION REQUIRED</strong>
            <small>Credentials are exchanged server-side for an HttpOnly Cognito session. They are not stored in the card.</small>
            <input type="email" autoComplete="username" placeholder="Email" value={credentials.username} onChange={event => setCredentials(current => ({ ...current, username: event.target.value }))} />
            <input type="password" autoComplete="current-password" placeholder="Password" value={credentials.password} onChange={event => setCredentials(current => ({ ...current, password: event.target.value }))} />
            <button type="submit" disabled={saving}>{saving ? "AUTHENTICATING…" : "AUTHENTICATE"}</button>
          </form>
        ) : null}

        {!loading && !authRequired ? (
          <>
            <section className="summary">
              <div><span>PRINCIPAL</span><b>{clean(access?.principal?.principalId) || "—"}</b></div>
              <div><span>POLICY</span><b>{policy?.policyId ? "ACTIVE" : "NONE"}</b></div>
              <div><span>SCOPE</span><b>{inheritance.propagateToChildren ? "TREE" : "OBJECT"}</b></div>
            </section>

            {!passportId ? (
              <div className="message error">THIS OBJECT HAS NO PASSPORT IDENTITY IN THE TRAN$ACT CONTEXT. POLICY CREATION IS BLOCKED UNTIL SERVER PASSPORT RESOLUTION IS ATTACHED.</div>
            ) : null}

            <section>
              <div className="section-title"><span>EXPLICIT RULES</span>{policy && canManage ? <button type="button" disabled={saving} onClick={() => writePolicy(rules, { ...inheritance, propagateToChildren: !inheritance.propagateToChildren })}>{inheritance.propagateToChildren ? "DESCENDANTS ON" : "TARGET ONLY"}</button> : null}</div>
              {!rules.length ? <div className="empty">NO EXPLICIT RULES ON THIS PASSPORT</div> : null}
              {rules.map(rule => (
                <article key={rule.ruleId || `${rule.effect}-${rule.subject?.type}-${rule.subject?.id}`}>
                  <b className={`effect ${rule.effect === "deny" ? "deny" : "allow"}`}>{clean(rule.effect).toUpperCase()}</b>
                  <div><strong>{clean(rule.subject?.id) || clean(rule.subject?.type).toUpperCase()}</strong><span>{(rule.capabilities || []).join(" · ")}</span><small>{clean(rule.scope?.type).replaceAll("-", " ")}</small></div>
                  {canManage ? <button type="button" className="remove" disabled={saving} onClick={() => writePolicy(rules.filter(item => item.ruleId !== rule.ruleId))}>×</button> : null}
                </article>
              ))}
            </section>

            {canManage ? (
              <section className="builder">
                <div className="section-title"><span>ADD RULE</span></div>
                <div className="two">
                  <label><span>DECISION</span><select value={draft.effect} onChange={event => setDraft(current => ({ ...current, effect: event.target.value }))}><option value="deny">DENY</option><option value="allow">ALLOW</option></select></label>
                  <label><span>SUBJECT</span><select value={draft.subjectType} onChange={event => setDraft(current => ({ ...current, subjectType: event.target.value }))}><option value="role">ROLE</option><option value="principal">PERSON</option><option value="group">GROUP</option><option value="authenticated">ALL AUTHENTICATED</option></select></label>
                </div>
                {draft.subjectType !== "authenticated" ? <label><span>SUBJECT ID</span><input value={draft.subjectId} onChange={event => setDraft(current => ({ ...current, subjectId: event.target.value }))} placeholder="role / employee / group ID" /></label> : null}
                <label><span>SCOPE</span><select value={draft.scopeType} onChange={event => setDraft(current => ({ ...current, scopeType: event.target.value }))}><option value="target">THIS OBJECT</option><option value="target-and-descendants">THIS + DESCENDANTS</option></select></label>
                <div className="caps">{CAPABILITIES.map(capability => <button key={capability} type="button" className={draft.capabilities.includes(capability) ? "active" : ""} onClick={() => toggleCapability(capability)}>{capability}</button>)}</div>
                <label><span>CONTROL NOTE</span><input value={draft.note} onChange={event => setDraft(current => ({ ...current, note: event.target.value }))} placeholder="Reason / ticket / approval" /></label>
                <button type="button" className="save" disabled={saving || !passportId} onClick={addRule}>{saving ? "SAVING…" : "ADD POLICY RULE"}</button>
              </section>
            ) : <div className="message">AUTHORITY.MANAGE REQUIRED TO CHANGE POLICY</div>}
          </>
        ) : null}
      </main>

      <style jsx>{`
        .ap-shell,.ap-shell *{box-sizing:border-box}.ap-shell{width:298px;height:471px;overflow:hidden;border:1px solid rgba(255,196,0,.18);border-radius:14px;background:linear-gradient(180deg,rgba(255,196,0,.035),transparent 28%),#0a0c0c;color:#eef0ee;font-family:Arial,sans-serif;box-shadow:0 18px 34px rgba(0,0,0,.42)}header{height:54px;display:flex;align-items:center;gap:7px;padding:7px 8px;border-bottom:1px solid rgba(255,255,255,.07)}.back{width:22px;height:32px;border:1px solid rgba(255,255,255,.09);border-radius:5px;background:#111414;color:#ffc400;font-size:20px}.title{min-width:0;flex:1}.title span{display:block;color:#ffc400;font-size:5px;font-weight:950;letter-spacing:.1em}.title strong{display:block;margin-top:2px;font-size:13px;font-weight:950}.title small{display:block;margin-top:2px;color:#707673;font-size:4.6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mode{text-align:right}.mode b{display:block;color:#ffc400;font-size:5.5px}.mode small{font-size:4.5px;color:#777d7a}main{height:417px;overflow-y:auto;padding:7px;scrollbar-width:thin}.message,.empty{padding:7px;border:1px solid rgba(255,255,255,.07);border-radius:5px;background:#101313;color:#858b88;font-size:5.2px;font-weight:900;line-height:1.45}.error{border-color:rgba(255,85,85,.3);color:#ff9292}.notice{border-color:rgba(255,196,0,.25);color:#ffc400}.summary{display:grid;grid-template-columns:1.2fr .8fr .8fr;gap:4px;margin-bottom:7px}.summary div{min-width:0;padding:6px;border:1px solid rgba(255,255,255,.06);border-radius:4px;background:#0f1212}.summary span,label span{display:block;color:#676d6a;font-size:4.3px;font-weight:950}.summary b{display:block;margin-top:3px;font-size:5.3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.section-title{display:flex;align-items:center;justify-content:space-between;margin:7px 1px 4px}.section-title span{color:#7a807d;font-size:4.7px;font-weight:950;letter-spacing:.1em}.section-title button{padding:4px 5px;border:1px solid rgba(255,196,0,.18);border-radius:4px;background:#111414;color:#ffc400;font-size:4.3px;font-weight:950}article{display:flex;align-items:flex-start;gap:6px;margin-bottom:4px;padding:6px;border:1px solid rgba(255,255,255,.065);border-radius:5px;background:#101313}.effect{flex:0 0 29px;padding:3px 0;border-radius:3px;text-align:center;font-size:4.3px}.effect.allow{color:#8cf1b6;border:1px solid rgba(85,220,140,.18);background:rgba(85,220,140,.1)}.effect.deny{color:#ff9292;border:1px solid rgba(255,84,84,.2);background:rgba(255,84,84,.1)}article div{min-width:0;flex:1}article strong{display:block;font-size:5.4px}article span{display:block;margin-top:2px;color:#c4c8c5;font-size:4.5px;line-height:1.35}article small{display:block;margin-top:2px;color:#676d6a;font-size:4.2px;text-transform:uppercase}.remove{border:0;background:transparent;color:#8b918e;font-size:12px}.builder{margin-top:7px;border-top:1px solid rgba(255,255,255,.06)}.two{display:grid;grid-template-columns:1fr 1fr;gap:5px}label{display:block;margin-top:5px}label span{margin:0 0 3px 1px}select,input{width:100%;height:27px;padding:0 6px;border:1px solid rgba(255,255,255,.08);border-radius:4px;background:#101313;color:#eceeed;font-size:5.2px;font-weight:850;outline:none}select:focus,input:focus{border-color:rgba(255,196,0,.35)}.caps{display:grid;grid-template-columns:1fr 1fr;gap:3px;margin-top:6px}.caps button{min-height:24px;padding:4px;border:1px solid rgba(255,255,255,.07);border-radius:4px;background:#0e1111;color:#777d7a;font-size:4.4px;font-weight:900;text-align:left}.caps button.active{border-color:rgba(255,196,0,.28);background:rgba(255,196,0,.07);color:#ffc400}.save,.login button{width:100%;height:30px;margin-top:7px;border:1px solid rgba(255,196,0,.3);border-radius:5px;background:linear-gradient(180deg,#242015,#17140c);color:#ffc400;font-size:5.7px;font-weight:950;letter-spacing:.05em}.save:disabled,.login button:disabled{opacity:.45}.login{padding:10px;border:1px solid rgba(255,196,0,.12);border-radius:6px;background:#0f1212}.login .eyebrow{color:#ffc400;font-size:4.8px;font-weight:950;letter-spacing:.1em}.login strong{display:block;margin-top:5px;font-size:8px}.login small{display:block;margin:5px 0 7px;color:#747a77;font-size:4.8px;line-height:1.5}.login input{margin-top:5px}
      `}</style>
    </div>
  );
}
