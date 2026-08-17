import {
  IXI_FACE_LIBRARY_ACTIONS,
  normalizeFaceLibraryPermissions
} from "./IXIFaceLibraryContract";

const clean = value => String(value ?? "").trim();
const safeArray = value => Array.isArray(value) ? value : [];
const safeObject = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};

function normalizedSet(value) {
  return new Set(safeArray(value).map(item => clean(item).toLowerCase()).filter(Boolean));
}

function explicitDecision(policy = {}, action = "") {
  const normalized = normalizeFaceLibraryPermissions(policy);
  const target = clean(action).toLowerCase();
  const denied = normalizedSet(normalized.deniedActions);
  const allowed = normalizedSet(normalized.allowedActions);

  if (denied.has(target) || denied.has("*")) return false;
  if (allowed.has(target) || allowed.has("*")) return true;
  return null;
}

export function getFaceLibraryEffectivePolicy({
  systemPolicy = {},
  companyPolicy = {},
  actorPolicy = {},
  facePolicy = {},
  assignmentPolicy = {}
} = {}) {
  const layers = [systemPolicy, companyPolicy, actorPolicy, facePolicy, assignmentPolicy]
    .map(normalizeFaceLibraryPermissions);

  const allowedActions = new Set();
  const deniedActions = new Set();
  const viewScopes = new Set();
  const dataScopes = new Set();
  const assignmentScopes = new Set();

  for (const layer of layers) {
    layer.allowedActions.forEach(value => allowedActions.add(value));
    layer.deniedActions.forEach(value => deniedActions.add(value));
    layer.viewScopes.forEach(value => viewScopes.add(value));
    layer.dataScopes.forEach(value => dataScopes.add(value));
    layer.assignmentScopes.forEach(value => assignmentScopes.add(value));
  }

  // Explicit denial always wins across every layer.
  deniedActions.forEach(value => allowedActions.delete(value));

  return {
    allowedActions: Array.from(allowedActions),
    deniedActions: Array.from(deniedActions),
    viewScopes: Array.from(viewScopes),
    dataScopes: Array.from(dataScopes),
    assignmentScopes: Array.from(assignmentScopes)
  };
}

export function canFaceLibraryAction({
  action,
  systemPolicy = {},
  companyPolicy = {},
  actorPolicy = {},
  facePolicy = {},
  assignmentPolicy = {}
} = {}) {
  const target = clean(action);
  if (!target || !IXI_FACE_LIBRARY_ACTIONS.includes(target)) return false;

  const layers = [assignmentPolicy, facePolicy, actorPolicy, companyPolicy, systemPolicy]
    .map(safeObject);

  // Deny wins, regardless of which layer contributed it.
  for (const layer of layers) {
    if (explicitDecision(layer, target) === false) return false;
  }

  for (const layer of layers) {
    if (explicitDecision(layer, target) === true) return true;
  }

  return false;
}

export function hasFaceDataScope(policy = {}, scope = "") {
  const target = clean(scope).toLowerCase();
  if (!target) return true;

  const normalized = normalizeFaceLibraryPermissions(policy);
  const scopes = normalizedSet(normalized.dataScopes);
  return scopes.has(target) || scopes.has("*");
}

export function hasAssignmentScope(policy = {}, scope = "") {
  const target = clean(scope).toLowerCase();
  if (!target) return true;

  const normalized = normalizeFaceLibraryPermissions(policy);
  const scopes = normalizedSet(normalized.assignmentScopes);
  return scopes.has(target) || scopes.has("*");
}

export function filterAuthorizedFaceCapabilities({
  capabilityIds = [],
  capabilityPermissionScopes = {},
  effectivePolicy = {}
} = {}) {
  const scopeMap = safeObject(capabilityPermissionScopes);

  return safeArray(capabilityIds).filter(capabilityId => {
    const id = clean(capabilityId);
    if (!id) return false;

    const requiredScope = clean(scopeMap[id]);
    return !requiredScope || hasFaceDataScope(effectivePolicy, requiredScope);
  });
}

export default {
  getFaceLibraryEffectivePolicy,
  canFaceLibraryAction,
  hasFaceDataScope,
  hasAssignmentScope,
  filterAuthorizedFaceCapabilities
};
