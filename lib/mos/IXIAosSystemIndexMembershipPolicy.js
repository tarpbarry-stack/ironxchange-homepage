import {
  getIXIAosSystemAdapter
} from "./IXIAosSystemAdapterRegistry.js";

export const AOS_SYSTEM_INDEX_MEMBERSHIP_POLICY_SCHEMA =
  "aos.system-index-membership.v1";

const SYSTEM_INDEX_TEMPLATE_ID = "ixi-system-index-v1";

function clean(value) {
  return String(value ?? "").trim();
}
function cleanKey(value) {
  return clean(value).toLowerCase();
}

function unique(values = [], normalizer = clean) {
  return [...new Set(
    (Array.isArray(values) ? values : [])
      .map(normalizer)
      .filter(Boolean)
  )];
}

export function isExplicitAosSystemIndexObject(object = {}) {
  const metadata = object?.metadata && typeof object.metadata === "object"
    ? object.metadata
    : {};
  const templateId = clean(
    object?.cardTemplateSlug ||
    object?.templateId ||
    metadata?.templateId ||
    metadata?.cardTemplateId
  );

  return (
    metadata.systemIndex === true ||
    metadata.isSystemIndex === true ||
    metadata.systemIndexPresentation === true ||
    metadata.systemAdapter === true ||
    metadata.rootContainer === true ||
    cleanKey(metadata.hierarchyRole) === "index" ||
    templateId === SYSTEM_INDEX_TEMPLATE_ID ||
    cleanKey(object?.objectType) === "system-index"
  );
}

export function normalizeAosSystemIndexMembershipPolicy(policy = null) {
  if (!policy || typeof policy !== "object") return null;
  if (clean(policy.schema) !== AOS_SYSTEM_INDEX_MEMBERSHIP_POLICY_SCHEMA) {
    return null;
  }

  return {
    schema: AOS_SYSTEM_INDEX_MEMBERSHIP_POLICY_SCHEMA,
    enabled: policy.enabled === true,
    defaultWorkspaceHome: policy.defaultWorkspaceHome === true,
    allowedObjectTypes: unique(policy.allowedObjectTypes, cleanKey),
    allowedDefinitionIds: unique(policy.allowedDefinitionIds)
  };
}

export function getAosSystemIndexMembershipPolicy(index = {}) {
  const adapter = getIXIAosSystemAdapter(index);
  if (adapter) {
    return normalizeAosSystemIndexMembershipPolicy({
      schema: AOS_SYSTEM_INDEX_MEMBERSHIP_POLICY_SCHEMA,
      enabled: adapter.canOperationalDrop === true,
      defaultWorkspaceHome: adapter.defaultWorkspaceHome === true,
      allowedObjectTypes: adapter.acceptedObjectTypes || [],
      allowedDefinitionIds: adapter.acceptedDefinitionIds || []
    });
  }

  return normalizeAosSystemIndexMembershipPolicy(
    index?.metadata?.systemIndexMembershipPolicy
  );
}

export function evaluateAosSystemIndexMembership({
  sourceObject = {},
  targetObject = {}
} = {}) {
  if (isExplicitAosSystemIndexObject(sourceObject)) {
    return { allowed: false, reason: "system-index-root" };
  }

  if (!isExplicitAosSystemIndexObject(targetObject)) {
    return { allowed: true, reason: "ordinary-container" };
  }

  const policy = getAosSystemIndexMembershipPolicy(targetObject);
  if (!policy) return { allowed: false, reason: "policy-required" };
  if (!policy.enabled) return { allowed: false, reason: "policy-disabled" };

  const objectType = cleanKey(
    sourceObject?.objectType || sourceObject?.sourceObjectType || sourceObject?.type
  );
  const definitionId = clean(
    sourceObject?.definitionId || sourceObject?.metadata?.definitionId
  );

  if (objectType && policy.allowedObjectTypes.includes(objectType)) {
    return { allowed: true, reason: "object-type-allowed", policy };
  }
  if (definitionId && policy.allowedDefinitionIds.includes(definitionId)) {
    return { allowed: true, reason: "definition-allowed", policy };
  }
  return { allowed: false, reason: "member-rejected", policy };
}

export function getAosSystemIndexWorkspaceDropPolicy(index = {}) {
  const policy = getAosSystemIndexMembershipPolicy(index);
  return {
    enabled: policy?.enabled === true,
    acceptedObjectTypes: [...(policy?.allowedObjectTypes || [])],
    acceptedDefinitionIds: [...(policy?.allowedDefinitionIds || [])]
  };
}

export function resolveAosDefaultSystemIndexHome({
  object = {},
  systemIndexes = []
} = {}) {
  if (isExplicitAosSystemIndexObject(object)) return null;

  const matches = (Array.isArray(systemIndexes) ? systemIndexes : [])
    .filter(index => {
      const policy = getAosSystemIndexMembershipPolicy(index);
      return policy?.defaultWorkspaceHome === true &&
        evaluateAosSystemIndexMembership({
          sourceObject: object,
          targetObject: index
        }).allowed;
    });

  return matches.length === 1 ? matches[0] : null;
}
