import { useEffect, useState } from "react";
import { AOS_MEMBER_TYPES } from "../../../../lib/mos/IXIAosMemberTypes.js";
import { fetchMosObjectDefinitions } from "../../../../lib/mos/ixiMosBrowserGatewayClient.js";

export default function IXIAosCreationTypeEditor({ object, objectType, definitionId, onChange, onDefinition, disabled }) {
  const [definitions, setDefinitions] = useState([]);
  const [error, setError] = useState("");
  const contract = object.metadata?.creationMembershipContract;
  const policy = contract?.isIndex ? contract.policy : null;
  useEffect(() => {
    let current = true;
    fetchMosObjectDefinitions({ entityId: object.entityId, status: "active" })
      .then(result => { if (current) { setDefinitions(result.definitions || []); setError(""); } })
      .catch(() => { if (current) setError("Customer definitions could not be loaded. Retry before choosing a definition."); });
    return () => { current = false; };
  }, [object.entityId]);
  useEffect(() => {
    const selected = definitions.find(item => item.definitionId === definitionId);
    onDefinition(selected || null);
  }, [definitionId, definitions, onDefinition]);
  const types = AOS_MEMBER_TYPES.filter(([id]) => !policy || policy.allowedObjectTypes.includes(id));
  const choices = definitions.filter(item => !policy || policy.allowedDefinitionIds.includes(item.definitionId));
  return <section className="creation-type">
    <label htmlFor={`creation-type-${object.objectId}`}>OBJECT CLASSIFICATION</label>
    <p>Choose what you are adding. Its card design is selected separately.</p>
    {error ? <p role="alert">{error}</p> : null}
    <select id={`creation-type-${object.objectId}`} disabled={disabled}
      value={definitionId ? `definition:${definitionId}` : `type:${objectType || "generic"}`}
      onChange={event => {
        const value = event.target.value;
        onChange(value.startsWith("definition:")
          ? { objectType: "generic", definitionId: value.slice(11) }
          : { objectType: value.slice(5), definitionId: null });
      }}>
      <option value="type:generic">{policy ? "CHOOSE CLASSIFICATION" : "CUSTOM OBJECT"}</option>
      {types.map(([id, label]) => <option key={id} value={`type:${id}`}>{label}</option>)}
      {choices.map(item => <option key={item.definitionId} value={`definition:${item.definitionId}`}>{item.label || item.definitionKey}</option>)}
      {definitionId && !choices.some(item => item.definitionId === definitionId)
        ? <option value={`definition:${definitionId}`}>CUSTOMER DEFINITION — LOADING</option> : null}
    </select>
    <style jsx>{`.creation-type { margin: 12px 0; } .creation-type label, .creation-type p { font-size: 12px; line-height: 1.4; }
      .creation-type select { min-height: 44px; width: 100%; font-size: 12px; }`}</style>
  </section>;
}
