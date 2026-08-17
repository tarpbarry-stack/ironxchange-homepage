import { useEffect, useMemo, useState } from "react";

const clean = value => String(value ?? "").trim();
const uniq = values => Array.from(new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean)));

const CORE_CAPABILITIES = Object.freeze([
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

const EFFECT_OPTIONS = Object.freeze([
  { value: "allow", label: "ALLOW" },
  { value: "deny", label: "DENY" }
]);

const SUBJECT_OPTIONS = Object.freeze([
  { value: "role", label: "ROLE" },
  { value: "principal", label: "PERSON" },
  { value: "group", label: "GROUP" },
  { value: "authenticated", label: "ALL AUTHENTICATED" }
]);

const SCOPE_OPTIONS = Object.freeze([
  { value: "target", label: "THIS OBJECT" },
  { value: "target-and-descendants", label: "THIS + DESCENDANTS" }
]);

function getPassportId(object = {}, context = {}) {
  return clean(
    object?.passportId ||
    object?.ixiPassportId ||
    object?.passport?.passportId ||
    context?.primary?.passportId ||
    context?.passportId
  );
}

function createDraftRule(passportId = "") {
  return {
    effect: "deny",
    subjectType: "role",
    subjectId: "",
    capabilities: ["aos.view"],
    scopeType: "target-and-descendants",
    scopePassportId: passportId,
    note: ""
  };
}

async function readJson(response) {
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok === false) {
    const error = new Error(
      payload?.error?.message ||
      payload?.errors?.[0]?.message ||
      `Request failed (${response.status})`
    );
    error.code = payload?.error?.code || payload?.errors?.[0]?.code || "IXI_AUTHORITY_REQUEST_FAILED";
    error.details = payload?.error?.details || payload?.errors?.[0]?.details || {};
    throw error;
  }
  return payload;
}

function AuthorityBadge({ effect }) {
  return (
    <span className={`badge ${effect === "deny" ? "deny" : "allow"}`}>
      {effect === "deny" ? "DENY" : "ALLOW"}
    </span>
  );
}

export default function IXIAccessPolicyApp({
  context = {},
  object = {},
  onBack = null,
  onRecordChange = null
}) {
  const passportId = useMemo(
    () => getPassportId(object, context),
    [object, context]
  );

  const [accessContext, setAccessContext] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [revision, setRevision] = useState(0);
  const [draft, setDraft] = useState(() => createDraftRule(passportId));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const canManage = Boolean(
    accessContext?.principal?.directGrants?.includes("authority.manage") ||
    accessContext?.capabilities?.directGrants?.includes("authority.manage")
  );

  const rules = Array.isArray(policy?.rules) ? policy.rules : [];
  const inheritance = policy?.inheritance || {
    inheritFromAncestors: true,
    propagateToChildren: true
  };

  useEffect(() => {
    setDraft(current => ({
      ...current,
      scopePassportId: passportId
    }));
  }, [passportId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const contextPromise = fetch("/api/ixi/authority/access-context", {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" }
        }).then(readJson);

        const policyPromise = passportId
          ? fetch(`/api/ixi/authority/policies/${encodeURIComponent(passportId)}`, {
              method: "GET",
              credentials: "include",
              headers: { Accept: "application/json" }
            })
              .then(readJson)
              .catch(error => {
                if (error?.code === "IXI_AUTHORITY_POLICY_NOT_FOUND") {
                  return null;
                }
                throw error;
              })
          : Promise.resolve(null);

        const [contextPayload, policyPayload] = await Promise.all([
          contextPromise,
          policyPromise
        ]);

        if (cancelled) return;

        setAccessContext(contextPayload?.data || null);
        setPolicy(policyPayload?.data?.policy || null);
        setRevision(Number(policyPayload?.data?.revision || 0));
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError?.message || "Unable to load Authority.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [passportId]);

  function toggleCapability(capability) {
    setDraft(current => {
      const selected = new Set(current.capabilities || []);
      if (selected.has(capability)) selected.delete(capability);
      else selected.add(capability);
      return {
        ...current,
        capabilities: Array.from(selected)
      };
    });
  }

  async function savePolicy(nextRules) {
    if (!passportId) {
      setError("This object does not have a Passport yet.");
      return;
    }

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

      const payload = {
        ...(policy?.policyId ? { policyId: policy.policyId } : {}),
        target,
        inheritance,
        rules: nextRules
      };

      const response = await fetch(
        `/api/ixi/authority/policies/${encodeURIComponent(passportId)}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      const result = await readJson(response);
      const nextPolicy = result?.data?.policy || payload;
      const nextRevision = Number(result?.data?.revision || revision + 1);

      setPolicy(nextPolicy);
      setRevision(nextRevision);
      setNotice(`POLICY REVISION ${nextRevision} SAVED`);

      await onRecordChange?.(
        nextPolicy,
        {
          action: "policy-saved",
          revision: nextRevision,
          passportId
        },
        context
      );
    } catch (saveError) {
      setError(saveError?.message || "Authority policy save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function addRule() {
    const subjectId = clean(draft.subjectId);
    const capabilities = uniq(draft.capabilities);

    if (draft.subjectType !== "authenticated" && !subjectId) {
      setError("Choose a role, person, or group identifier.");
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
        ...(draft.subjectType === "authenticated" ? {} : { id: subjectId })
      },
      capabilities,
      scope: {
        type: draft.scopeType,
        passportId: passportId
      },
      note: clean(draft.note),
      enabled: true
    };

    await savePolicy([...rules, rule]);
    setDraft(createDraftRule(passportId));
  }

  async function removeRule(ruleId) {
    await savePolicy(rules.filter(rule => rule.ruleId !== ruleId));
  }

  async function togglePropagation() {
    if (!policy) return;
    const nextPolicy = {
      ...policy,
      inheritance: {
        ...inheritance,
        propagateToChildren: !inheritance.propagateToChildren
      }
    };
    setPolicy(nextPolicy);

    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        `/api/ixi/authority/policies/${encodeURIComponent(passportId)}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            policyId: policy.policyId,
            target: policy.target,
            inheritance: nextPolicy.inheritance,
            rules
          })
        }
      );
      const result = await readJson(response);
      setPolicy(result?.data?.policy || nextPolicy);
      setRevision(Number(result?.data?.revision || revision + 1));
      setNotice("INHERITANCE UPDATED");
    } catch (saveError) {
      setPolicy(policy);
      setError(saveError?.message || "Inheritance update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="access-app">
      <header>
        <button type="button" className="back" onClick={onBack}>‹</button>
        <div>
          <span>IXI TRAN$ACT · SECURITY</span>
          <strong>ACCESS / POLICY</strong>
          <small>{passportId || "NO PASSPORT"}</small>
        </div>
        <div className="status">
          <b>{canManage ? "ADMIN" : "READ"}</b>
          <small>REV {revision || 0}</small>
        </div>
      </header>

      <main>
        {loading ? <div className="state">LOADING AUTHORITY…</div> : null}
        {error ? <div className="error">{error}</div> : null}
        {notice ? <div className="notice">{notice}</div> : null}

        {!loading ? (
          <>
            <section className="summary">
              <div><span>PRINCIPAL</span><b>{clean(accessContext?.principal?.principalId) || "—"}</b></div>
              <div><span>POLICY</span><b>{policy?.policyId ? "ACTIVE" : "NONE"}</b></div>
              <div><span>INHERIT</span><b>{inheritance.propagateToChildren ? "CHILDREN" : "TARGET"}</b></div>
            </section>

            <section className="rules">
              <div className="section-title">
                <span>EFFECTIVE POLICY RULES</span>
                {policy && canManage ? (
                  <button type="button" onClick={togglePropagation} disabled={saving}>
                    {inheritance.propagateToChildren ? "PROPAGATES" : "TARGET ONLY"}
                  </button>
                ) : null}
              </div>

              {!rules.length ? <div className="empty">NO EXPLICIT RULES ON THIS PASSPORT</div> : null}

              {rules.map(rule => (
                <article key={rule.ruleId || `${rule.effect}-${rule.subject?.type}-${rule.subject?.id}`}>
                  <AuthorityBadge effect={rule.effect} />
                  <div className="rule-copy">
                    <strong>{clean(rule.subject?.id) || clean(rule.subject?.type).toUpperCase()}</strong>
                    <span>{(rule.capabilities || []).join(" · ")}</span>
                    <small>{clean(rule.scope?.type).replaceAll("-", " ")}</small>
                  </div>
                  {canManage ? (
                    <button className="remove" type="button" onClick={() => removeRule(rule.ruleId)} disabled={saving}>×</button>
                  ) : null}
                </article>
              ))}
            </section>

            {canManage ? (
              <section className="builder">
                <div className="section-title"><span>ADD RULE</span></div>

                <div className="grid two">
                  <label>
                    <span>DECISION</span>
                    <select value={draft.effect} onChange={event => setDraft(current => ({ ...current, effect: event.target.value }))}>
                      {EFFECT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>SUBJECT</span>
                    <select value={draft.subjectType} onChange={event => setDraft(current => ({ ...current, subjectType: event.target.value }))}>
                      {SUBJECT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                </div>

                {draft.subjectType !== "authenticated" ? (
                  <label className="wide">
                    <span>ROLE / PERSON / GROUP ID</span>
                    <input value={draft.subjectId} onChange={event => setDraft(current => ({ ...current, subjectId: event.target.value }))} placeholder="role_operations / employee id / group id" />
                  </label>
                ) : null}

                <label className="wide">
                  <span>SCOPE</span>
                  <select value={draft.scopeType} onChange={event => setDraft(current => ({ ...current, scopeType: event.target.value }))}>
                    {SCOPE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>

                <div className="capabilities">
                  {CORE_CAPABILITIES.map(capability => {
                    const active = draft.capabilities.includes(capability);
                    return (
                      <button key={capability} type="button" className={active ? "active" : ""} onClick={() => toggleCapability(capability)}>
                        {capability}
                      </button>
                    );
                  })}
                </div>

                <label className="wide">
                  <span>ADMIN NOTE</span>
                  <input value={draft.note} onChange={event => setDraft(current => ({ ...current, note: event.target.value }))} placeholder="Reason / ticket / control note" />
                </label>

                <button className="save" type="button" onClick={addRule} disabled={saving || !passportId}>
                  {saving ? "SAVING…" : "ADD POLICY RULE"}
                </button>
              </section>
            ) : (
              <div className="read-only">AUTHORITY.MANAGE REQUIRED TO CHANGE POLICY</div>
            )}
          </>
        ) : null}
      </main>

      <style jsx>{`
        .access-app,.access-app *{box-sizing:border-box}
        .access-app{position:relative;width:298px;height:471px;overflow:hidden;border:1px solid rgba(255,196,0,.2);border-radius:14px;background:linear-gradient(180deg,rgba(255,196,0,.035),transparent 28%),#0a0c0c;color:#f0f1ef;font-family:Arial,sans-serif;box-shadow:0 18px 34px rgba(0,0,0,.42)}
        header{height:54px;border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;padding:7px 8px;gap:7px}
        .back{width:22px;height:32px;border:1px solid rgba(255,255,255,.09);border-radius:5px;background:#111414;color:#ffc400;font-size:20px;line-height:1}
        header div:nth-child(2){min-width:0;flex:1}
        header span{display:block;color:#ffc400;font-size:5px;font-weight:950;letter-spacing:.11em}
        header strong{display:block;margin-top:2px;font-size:13px;font-weight:950;letter-spacing:.01em}
        header small{display:block;margin-top:2px;color:#707673;font-size:4.7px;font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .status{text-align:right}.status b{display:block;color:#ffc400;font-size:6px}.status small{font-size:4.7px;color:#7b817e}
        main{height:417px;overflow-y:auto;padding:7px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.14) transparent}
        .state,.error,.notice,.read-only,.empty{padding:7px;border:1px solid rgba(255,255,255,.07);border-radius:5px;background:#101313;font-size:5.5px;font-weight:900;letter-spacing:.03em}
        .error{border-color:rgba(255,88,88,.35);color:#ff8f8f}.notice{border-color:rgba(255,196,0,.3);color:#ffc400}.read-only{margin-top:7px;color:#8e9491}.empty{color:#707673}
        .summary{display:grid;grid-template-columns:1.2fr .8fr .8fr;gap:4px;margin-bottom:7px}.summary div{padding:6px;border:1px solid rgba(255,255,255,.06);border-radius:4px;background:#0f1212;min-width:0}.summary span{display:block;color:#656b68;font-size:4.3px;font-weight:950}.summary b{display:block;margin-top:3px;font-size:5.4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .section-title{display:flex;align-items:center;justify-content:space-between;margin:6px 1px 4px}.section-title span{color:#7c827f;font-size:4.8px;font-weight:950;letter-spacing:.1em}.section-title button{border:1px solid rgba(255,196,0,.18);border-radius:4px;background:#121515;color:#ffc400;font-size:4.5px;font-weight:950;padding:4px 5px}
        .rules article{position:relative;display:flex;gap:6px;align-items:flex-start;padding:6px;margin-bottom:4px;border:1px solid rgba(255,255,255,.065);border-radius:5px;background:#101313}.badge{flex:0 0 29px;padding:3px 0;border-radius:3px;text-align:center;font-size:4.5px;font-weight:950}.badge.allow{background:rgba(85,220,140,.12);color:#8cf1b6;border:1px solid rgba(85,220,140,.18)}.badge.deny{background:rgba(255,84,84,.12);color:#ff9292;border:1px solid rgba(255,84,84,.2)}.rule-copy{min-width:0;flex:1}.rule-copy strong{display:block;font-size:5.5px}.rule-copy span{display:block;margin-top:2px;color:#c7cac8;font-size:4.7px;line-height:1.35}.rule-copy small{display:block;margin-top:2px;color:#696f6c;font-size:4.3px;text-transform:uppercase}.remove{border:0;background:transparent;color:#8a908d;font-size:12px;line-height:1}
        .builder{margin-top:7px;padding-top:1px;border-top:1px solid rgba(255,255,255,.06)}.grid.two{display:grid;grid-template-columns:1fr 1fr;gap:5px}.wide{display:block;margin-top:5px}label span{display:block;margin:0 0 3px 1px;color:#6f7572;font-size:4.5px;font-weight:950}select,input{width:100%;height:27px;border:1px solid rgba(255,255,255,.08);border-radius:4px;background:#101313;color:#eceeed;padding:0 6px;font-size:5.3px;font-weight:850;outline:none}select:focus,input:focus{border-color:rgba(255,196,0,.35)}
        .capabilities{display:grid;grid-template-columns:1fr 1fr;gap:3px;margin-top:6px}.capabilities button{min-height:24px;padding:4px;border:1px solid rgba(255,255,255,.07);border-radius:4px;background:#0e1111;color:#777d7a;font-size:4.5px;font-weight:900;text-align:left}.capabilities button.active{border-color:rgba(255,196,0,.28);background:rgba(255,196,0,.07);color:#ffc400}.save{width:100%;height:30px;margin-top:7px;border:1px solid rgba(255,196,0,.3);border-radius:5px;background:linear-gradient(180deg,#242015,#17140c);color:#ffc400;font-size:5.8px;font-weight:950;letter-spacing:.05em}.save:disabled{opacity:.45}
      `}</style>
    </div>
  );
}
