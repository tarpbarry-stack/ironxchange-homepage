import {
  createIXIAuthorityDecision,
  normalizeIXIAuthorityPolicy
} from "./IXIAuthorityContract";

const clean = value => String(value ?? "").trim();
const array = value => (Array.isArray(value) ? value : []);
const object = value => (value && typeof value === "object" && !Array.isArray(value) ? value : {});
const unique = value => Array.from(new Set(array(value).map(clean).filter(Boolean)));

function principalSnapshot(input = {}) {
  const source = object(input);
  return {
    principalId: clean(source.principalId || source.id || source.employeeId || source.userId),
    passportId: clean(source.passportId || source.ixiPassportId),
    roles: unique(source.roles || source.roleIds),
    groups: unique(source.groups || source.groupIds),
    entityPassportIds: unique(source.entityPassportIds || (source.entityPassportId ? [source.entityPassportId] : [])),
    authenticated: source.authenticated !== false && Boolean(clean(source.principalId || source.id || source.employeeId || source.userId || source.passportId || source.ixiPassportId))
  };
}

function subjectMatches(subject = {}, principal = {}) {
  const type = clean(subject.type);
  const id = clean(subject.id);
  if (type === "all-authenticated") return principal.authenticated === true;
  if (type === "entity-member") return id ? principal.entityPassportIds.includes(id) : principal.entityPassportIds.length > 0;
  if (type === "role") return principal.roles.includes(id);
  if (type === "group") return principal.groups.includes(id);
  if (type === "principal") return [principal.principalId, principal.passportId].filter(Boolean).includes(id);
  return false;
}

function scopeMatches(scope = {}, { targetPassportId = "", ancestorPassportIds = [], entityPassportId = "", locationPassportId = "" } = {}) {
  const type = clean(scope.type) || "target";
  const target = clean(targetPassportId);
  const ancestors = unique(ancestorPassportIds);
  if (type === "target") return !scope.passportId || clean(scope.passportId) === target;
  if (type === "target-and-descendants") {
    const anchor = clean(scope.passportId);
    return !anchor || anchor === target || ancestors.includes(anchor);
  }
  if (type === "entity") return !scope.entityPassportId || clean(scope.entityPassportId) === clean(entityPassportId);
  if (type === "location") return !scope.locationPassportId || clean(scope.locationPassportId) === clean(locationPassportId);
  if (type === "selected-passports") return array(scope.passportIds).map(clean).includes(target);
  return false;
}

function matchingRules(policy, request) {
  const principal = principalSnapshot(request.actor);
  return policy.rules
    .filter(rule => rule.enabled !== false)
    .filter(rule => rule.capabilities.includes(request.capability))
    .filter(rule => subjectMatches(rule.subject, principal))
    .filter(rule => scopeMatches(rule.scope, request));
}

function policyDistance(policy, targetPassportId, ancestorPassportIds) {
  const source = clean(policy?.target?.passportId);
  if (!source) return Number.MAX_SAFE_INTEGER;
  if (source === clean(targetPassportId)) return 0;
  const index = unique(ancestorPassportIds).indexOf(source);
  return index >= 0 ? index + 1 : Number.MAX_SAFE_INTEGER;
}

function candidateFor(policy, rule, request) {
  const distance = policyDistance(policy, request.targetPassportId, request.ancestorPassportIds);
  const isTarget = distance === 0;
  const effect = rule.effect === "allow" ? "allow" : "deny";
  let priority = 900;
  if (isTarget && effect === "deny") priority = 100;
  else if (isTarget && effect === "allow") priority = 200;
  else if (!isTarget && effect === "deny") priority = 300 + Math.min(distance, 99);
  else if (!isTarget && effect === "allow") priority = 500 + Math.min(distance, 99);
  return { policy, rule, distance, priority };
}

export function evaluateIXIAuthority({ actor = {}, capability = "", targetPassportId = "", ancestorPassportIds = [], entityPassportId = "", locationPassportId = "", policies = [], systemDeniedCapabilities = [] } = {}) {
  const normalizedCapability = clean(capability);
  const target = clean(targetPassportId);

  if (!normalizedCapability) {
    return createIXIAuthorityDecision({ allowed: false, capability: normalizedCapability, targetPassportId: target, reason: "capability-required" });
  }

  if (unique(systemDeniedCapabilities).includes(normalizedCapability)) {
    return createIXIAuthorityDecision({ allowed: false, capability: normalizedCapability, targetPassportId: target, reason: "system-hard-deny" });
  }

  const principal = principalSnapshot(actor);
  if (!principal.authenticated) {
    return createIXIAuthorityDecision({ allowed: false, capability: normalizedCapability, targetPassportId: target, reason: "authentication-required" });
  }

  const request = {
    actor: principal,
    capability: normalizedCapability,
    targetPassportId: target,
    ancestorPassportIds: unique(ancestorPassportIds),
    entityPassportId: clean(entityPassportId),
    locationPassportId: clean(locationPassportId)
  };

  const candidates = [];
  array(policies).forEach(rawPolicy => {
    const policy = normalizeIXIAuthorityPolicy(rawPolicy);
    const distance = policyDistance(policy, target, request.ancestorPassportIds);
    if (distance === Number.MAX_SAFE_INTEGER) return;
    if (distance > 0 && policy.inheritance.propagateToChildren === false) return;
    matchingRules(policy, request).forEach(rule => candidates.push(candidateFor(policy, rule, request)));
  });

  candidates.sort((left, right) => {
    if (left.priority !== right.priority) return left.priority - right.priority;
    if (left.distance !== right.distance) return left.distance - right.distance;
    if (left.rule.effect !== right.rule.effect) return left.rule.effect === "deny" ? -1 : 1;
    return String(left.rule.ruleId).localeCompare(String(right.rule.ruleId));
  });

  const winner = candidates[0];
  if (!winner) {
    return createIXIAuthorityDecision({ allowed: false, capability: normalizedCapability, targetPassportId: target, reason: "default-deny" });
  }

  return createIXIAuthorityDecision({
    allowed: winner.rule.effect === "allow",
    capability: normalizedCapability,
    targetPassportId: target,
    reason: winner.distance === 0 ? `explicit-target-${winner.rule.effect}` : `inherited-${winner.rule.effect}`,
    policyId: winner.policy.policyId,
    ruleId: winner.rule.ruleId,
    sourcePassportId: winner.policy.target.passportId,
    metadata: { distance: winner.distance, subject: winner.rule.subject, scope: winner.rule.scope, limits: winner.rule.limits }
  });
}

export function evaluateIXIAuthoritySet({ capabilities = [], ...request } = {}) {
  return unique(capabilities).reduce((result, capability) => {
    result[capability] = evaluateIXIAuthority({ ...request, capability });
    return result;
  }, {});
}

export default {
  evaluateIXIAuthority,
  evaluateIXIAuthoritySet
};
