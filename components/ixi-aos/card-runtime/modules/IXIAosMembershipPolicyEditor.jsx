import { useEffect, useState } from "react";
import { AOS_MEMBER_TYPES } from "../../../../lib/mos/IXIAosMemberTypes.js";
import { fetchMosObjectDefinitions } from "../../../../lib/mos/ixiMosBrowserGatewayClient.js";

export default function IXIAosMembershipPolicyEditor({ object, value, onChange, disabled }) {
  const [definitions, setDefinitions] = useState([]);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    let current = true;
    setDefinitions([]);
    setLoadError("");
    if (object?.entityId) fetchMosObjectDefinitions({ entityId: object.entityId, status: "active" })
      .then(result => { if (current) setDefinitions(result.definitions || []); })
      .catch(() => { if (current) setLoadError("Customer definitions could not be loaded. Existing selections are preserved."); });
    return () => { current = false; };
  }, [object?.entityId]);

  const declaredIds = new Set(definitions.map(definition => definition.definitionId));
  const declaredTypes = new Set(AOS_MEMBER_TYPES.map(([id]) => id));
  const choices = [
    ...AOS_MEMBER_TYPES.map(([id, label]) => ({ id, label, field: "allowedObjectTypes" })),
    ...(value.allowedObjectTypes || []).filter(id => !declaredTypes.has(id))
      .map(id => ({ id, label: `Existing classification: ${id}`, field: "allowedObjectTypes" })),
    ...definitions.map(definition => ({ id: definition.definitionId, label: definition.label || definition.definitionKey, field: "allowedDefinitionIds" })),
    ...(value.allowedDefinitionIds || []).filter(id => !declaredIds.has(id))
      .map(id => ({ id, label: "Existing customer definition", field: "allowedDefinitionIds" }))
  ];
  const toggle = (field, id, checked) => onChange({ ...value, [field]: checked
    ? [...new Set([...(value[field] || []), id])]
    : (value[field] || []).filter(item => item !== id) });
  return (
    <section className="membership-policy">
      <h4>INDEX MEMBERSHIP</h4>
      <p>Choose what this index accepts. Card designs and names do not determine membership.</p>
      {loadError ? <p role="alert">{loadError}</p> : null}
      <fieldset disabled={disabled}>
        <legend>Accepted Objects</legend>
        {choices.map(choice => <label key={`${choice.field}:${choice.id}`}>
          <input type="checkbox" checked={(value[choice.field] || []).includes(choice.id)}
            onChange={event => toggle(choice.field, choice.id, event.target.checked)} />
          <span>{choice.label}</span>
        </label>)}
        <label><input type="checkbox" checked={value.enabled === true}
          onChange={event => onChange({ ...value, enabled: event.target.checked })} />Enable index membership</label>
        {!value.enabled ? <p>Membership is disabled. Existing connections remain available for review.</p> : null}
        <label><input type="checkbox" checked={value.defaultWorkspaceHome === true}
          onChange={event => onChange({ ...value, defaultWorkspaceHome: event.target.checked })} />Use as a default workspace home</label>
      </fieldset>
      <style jsx>{`
        .membership-policy { margin: 12px 0; }
        .membership-policy h4 { margin: 0 0 8px; color: #ffd04b; font-size: 12px; }
        .membership-policy p, .membership-policy legend { font-size: 12px; line-height: 1.4; }
        .membership-policy fieldset { margin: 8px 0; padding: 8px; border: 1px solid #565656; }
        .membership-policy label { display: flex; gap: 8px; align-items: center; min-height: 44px; font-size: 12px; }
        .membership-policy label > span { margin: 0; color: inherit; font-size: 12px; line-height: 1.4; }
        .membership-policy input[type="checkbox"] { width: 18px; height: 18px; padding: 0; flex-shrink: 0; }
      `}</style>
    </section>
  );
}
