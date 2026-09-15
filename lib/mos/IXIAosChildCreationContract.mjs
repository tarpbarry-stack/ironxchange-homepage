import { getAosSystemIndexMembershipPolicy, isExplicitAosSystemIndexObject,
  evaluateAosSystemIndexMembership } from "./IXIAosSystemIndexMembershipPolicy.js";

export function getAosChildCreationContract(parent) {
  const isIndex = isExplicitAosSystemIndexObject(parent);
  const policy = getAosSystemIndexMembershipPolicy(parent);
  if (isIndex && (!policy || !policy.enabled)) {
    throw Object.assign(new Error("Configure this index's accepted Objects before adding a child."),
      { code: "AOS_CREATION_PARENT_CONFIGURATION_REQUIRED" });
  }
  const types = policy?.allowedObjectTypes || [];
  const definitions = policy?.allowedDefinitionIds || [];
  return { isIndex, policy, objectType: types.length === 1 && definitions.length === 0 ? types[0] : "generic",
    definitionId: definitions.length === 1 && types.length === 0 ? definitions[0] : null };
}

export function assertAosDraftCreationReady(object) {
  if (!object?.metadata?.draftOnly) return;
  const contract = object.metadata.creationMembershipContract;
  if (contract?.isIndex && !evaluateAosSystemIndexMembership({ sourceObject: object,
    targetObject: { objectType: "system-index", metadata: { systemIndexMembershipPolicy: contract.policy } } }).allowed) {
    throw new Error("Choose a classification or customer definition accepted by the parent index before saving.");
  }
}

export function canClassifyAosCreationDraft(object) {
  return object?.metadata?.draftOnly === true && String(object.objectId || "").startsWith("aos-draft:") &&
    !isExplicitAosSystemIndexObject(object);
}
