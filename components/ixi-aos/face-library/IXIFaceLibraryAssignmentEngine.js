import { createFaceAssignment } from "./IXIFaceLibraryContract";

const clean = value => String(value ?? "").trim();
const safeArray = value => Array.isArray(value) ? value : [];
const safeObject = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};

function normalizedSet(value) {
  return new Set(safeArray(value).map(item => clean(item)).filter(Boolean));
}

export function getObjectDefinitionId(object = {}) {
  return clean(
    object?.definitionId ||
    object?.objectDefinitionId ||
    object?.definition?.definitionId ||
    object?.definition?.objectDefinitionId ||
    object?.metadata?.definitionId
  );
}

export function getObjectCapabilityIds(object = {}) {
  const capabilities = safeObject(
    object?.capabilities ||
    object?.definition?.capabilities ||
    object?.metadata?.capabilities
  );

  return Object.entries(capabilities)
    .filter(([, value]) => value === true)
    .map(([key]) => clean(key))
    .filter(Boolean);
}

export function assignmentMatchesObject(assignment = {}, object = {}) {
  if (!assignment || assignment.active === false) return false;

  const target = safeObject(assignment?.target);
  const definitionIds = normalizedSet(target.objectDefinitionIds);
  const objectIds = normalizedSet(target.objectIds);
  const requiredCapabilities = normalizedSet(target.requiredCapabilities);

  const objectId = clean(object?.objectId || object?.id?.uuid || object?.id);
  const definitionId = getObjectDefinitionId(object);
  const capabilityIds = normalizedSet(getObjectCapabilityIds(object));

  const hasExplicitObjectTarget = objectIds.size > 0;
  const hasDefinitionTarget = definitionIds.size > 0;
  const hasCapabilityTarget = requiredCapabilities.size > 0;

  if (!hasExplicitObjectTarget && !hasDefinitionTarget && !hasCapabilityTarget) {
    return false;
  }

  if (hasExplicitObjectTarget && !objectIds.has(objectId)) return false;
  if (hasDefinitionTarget && !definitionIds.has(definitionId)) return false;

  for (const capability of requiredCapabilities) {
    if (!capabilityIds.has(capability)) return false;
  }

  return true;
}

export function validateFaceAssignmentTarget(target = {}) {
  const source = safeObject(target);
  const objectDefinitionIds = safeArray(source.objectDefinitionIds).map(clean).filter(Boolean);
  const objectIds = safeArray(source.objectIds).map(clean).filter(Boolean);
  const requiredCapabilities = safeArray(source.requiredCapabilities).map(clean).filter(Boolean);

  const errors = [];
  if (!objectDefinitionIds.length && !objectIds.length && !requiredCapabilities.length) {
    errors.push("assignment-target-required");
  }

  return {
    valid: errors.length === 0,
    errors,
    target: {
      objectDefinitionIds,
      objectIds,
      requiredCapabilities
    }
  };
}

export function createValidatedFaceAssignment(input = {}) {
  const validation = validateFaceAssignmentTarget(input?.target);
  if (!validation.valid) {
    const error = new Error("FACE_ASSIGNMENT_TARGET_INVALID");
    error.details = validation.errors;
    throw error;
  }

  return createFaceAssignment({
    ...input,
    target: validation.target
  });
}

export function resolveAssignedFaces({
  assignments = [],
  object = {},
  faceRecords = []
} = {}) {
  const recordsById = new Map(
    safeArray(faceRecords)
      .filter(record => record?.faceAppId)
      .map(record => [clean(record.faceAppId), record])
  );

  return safeArray(assignments)
    .filter(assignment => assignmentMatchesObject(assignment, object))
    .map(assignment => {
      const record = recordsById.get(clean(assignment.faceAppId));
      if (!record || record.status !== "active" || !record.currentPublishedVersion) return null;

      const version = safeArray(record.versions).find(
        item => Number(item?.version) === Number(assignment?.version || record.currentPublishedVersion)
      );

      if (!version || version.status !== "active") return null;

      return {
        assignment,
        record,
        version,
        slot: Number.isInteger(assignment?.slot) ? assignment.slot : null
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      const a = Number(left.slot || 9999);
      const b = Number(right.slot || 9999);
      return a - b || String(left.version?.label || "").localeCompare(String(right.version?.label || ""));
    });
}

export default {
  assignmentMatchesObject,
  validateFaceAssignmentTarget,
  createValidatedFaceAssignment,
  resolveAssignedFaces,
  getObjectDefinitionId,
  getObjectCapabilityIds
};
