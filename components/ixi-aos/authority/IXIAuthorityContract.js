import {
  IXI_AUTHORITY_SCOPE_TYPES,
  IXI_AUTHORITY_SUBJECT_TYPES,
  getIXIAuthorityCapability
} from "./IXIAuthorityRegistry";

const clean = value => String(value ?? "").trim();
const array = value => (Array.isArray(value) ? value : []);
const object = value => (value && typeof value === "object" && !Array.isArray(value) ? value : {});
const unique = value => Array.from(new Set(array(value).map(clean).filter(Boolean)));

export const IXI_AUTHORITY_POLICY_SCHEMA = "ixi-authority-policy-v1";
export const IXI_AUTHORITY_DECISION_SCHEMA = "ixi-authority-decision-v1";

export function normalizeIXIAuthoritySubject(input = {}) {
  const source = object(input);
  const type = clean(source.type);
  return {
    type: IXI_AUTHORITY_SUBJECT_TYPES.includes(type) ? type : "principal",
    id: clean(source.id || source.principalId || source.roleId || source.groupId)
  };
}

export function normalizeIXIAuthorityScope(input = {}) {
  const source = object(input);
  const type = clean(source.type);
  return {
    type: IXI_AUTHORITY_SCOPE_TYPES.includes(type) ? type : "target",
    passportId: clean(source.passportId),
    passportIds: unique(source.passportIds),
    locationPassportId: clean(source.locationPassportId),
    entityPassportId: clean(source.entityPassportId)
  };
}

export function normalizeIXIAuthorityRule(input = {}, index = 0) {
  const source = object(input);
  const effect = clean(source.effect).toLowerCase() === "allow" ? "allow" : "deny";
  const capabilities = unique(source.capabilities).filter(id => getIXIAuthorityCapability(id));
  return {
    ruleId: clean(source.ruleId) || `rule_${index + 1}`,
    effect,
    subject: normalizeIXIAuthoritySubject(source.subject),
    capabilities,
    scope: normalizeIXIAuthorityScope(source.scope),
    conditions: object(source.conditions),
    limits: object(source.limits),
    enabled: source.enabled !== false,
    note: clean(source.note)
  };
}

export function normalizeIXIAuthorityPolicy(input = {}) {
  const source = object(input);
  const target = object(source.target);
  const inheritance = object(source.inheritance);
  return {
    schema: IXI_AUTHORITY_POLICY_SCHEMA,
    policyId: clean(source.policyId),
    target: {
      passportId: clean(target.passportId || source.targetPassportId),
      objectId: clean(target.objectId),
      objectType: clean(target.objectType),
      label: clean(target.label)
    },
    inheritance: {
      inheritFromAncestors: inheritance.inheritFromAncestors !== false,
      propagateToChildren: inheritance.propagateToChildren !== false
    },
    rules: array(source.rules).map(normalizeIXIAuthorityRule),
    metadata: object(source.metadata),
    audit: object(source.audit)
  };
}

export function createIXIAuthorityPolicy({ policyId = "", target = {}, rules = [], inheritance = {}, metadata = {}, actorPassportId = "" } = {}) {
  const now = new Date().toISOString();
  return normalizeIXIAuthorityPolicy({
    policyId,
    target,
    rules,
    inheritance,
    metadata,
    audit: {
      createdAt: now,
      createdBy: clean(actorPassportId),
      updatedAt: now,
      updatedBy: clean(actorPassportId)
    }
  });
}

export function createIXIAuthorityDecision({ allowed = false, capability = "", targetPassportId = "", reason = "default-deny", policyId = "", ruleId = "", sourcePassportId = "", metadata = {} } = {}) {
  return {
    schema: IXI_AUTHORITY_DECISION_SCHEMA,
    allowed: allowed === true,
    decision: allowed === true ? "allow" : "deny",
    capability: clean(capability),
    targetPassportId: clean(targetPassportId),
    reason: clean(reason) || "default-deny",
    policyId: clean(policyId),
    ruleId: clean(ruleId),
    sourcePassportId: clean(sourcePassportId),
    metadata: object(metadata)
  };
}

export default {
  IXI_AUTHORITY_POLICY_SCHEMA,
  IXI_AUTHORITY_DECISION_SCHEMA,
  normalizeIXIAuthorityPolicy,
  createIXIAuthorityPolicy,
  createIXIAuthorityDecision
};
