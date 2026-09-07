export const IXI_AOS_RAIL_MEMBERSHIP_BEHAVIOR_ID =
  "aos.rail-membership.v1";

function clean(value) {
  return String(value ?? "").trim();
}

function active(relationship = {}) {
  return clean(relationship?.status || "active").toLowerCase() === "active";
}

function relationshipRecord(value = {}) {
  return value?.relationship || value?.edge || value;
}

function projectionForOwner(railProjections = {}, railOwnerObjectId) {
  const ownerId = clean(railOwnerObjectId);
  if (!ownerId || !railProjections || typeof railProjections !== "object") {
    return null;
  }

  if (railProjections instanceof Map) {
    return railProjections.get(ownerId) || null;
  }

  return railProjections[ownerId] || null;
}

function projectionMembers(projection) {
  if (Array.isArray(projection)) return projection;
  if (Array.isArray(projection?.members)) return projection.members;
  if (Array.isArray(projection?.items)) return projection.items;
  if (Array.isArray(projection?.references)) return projection.references;
  return [];
}

export function createAosRailOrderKey(position = 0) {
  const index = Number.isInteger(Number(position)) && Number(position) >= 0
    ? Number(position)
    : 0;
  return String((index + 1) * 100).padStart(6, "0");
}

export function isAosMembershipRelationship(relationship = {}) {
  const record = relationshipRecord(relationship);
  return active(record) &&
    clean(record?.behaviorId) === IXI_AOS_RAIL_MEMBERSHIP_BEHAVIOR_ID;
}

export function getAosMembershipObjectIds({
  parentObjectId,
  relationships = []
} = {}) {
  const railOwnerObjectId = clean(parentObjectId);
  if (!railOwnerObjectId) return [];

  return [...new Set(
    (Array.isArray(relationships) ? relationships : [])
      .map(relationshipRecord)
      .filter(relationship =>
        isAosMembershipRelationship(relationship) &&
        clean(relationship?.targetObjectId) === railOwnerObjectId
      )
      .sort((left, right) =>
        clean(left?.orderKey).localeCompare(clean(right?.orderKey))
      )
      .map(relationship => clean(relationship?.sourceObjectId))
      .filter(objectId => objectId && objectId !== railOwnerObjectId)
  )];
}

export function getAosRailProjectionObjectIds({
  railOwnerObjectId,
  railProjections = {}
} = {}) {
  const ownerId = clean(railOwnerObjectId);
  const projection = projectionForOwner(railProjections, ownerId);

  return [...new Set(
    projectionMembers(projection)
      .map(member => clean(
        member?.objectId ||
        member?.sourceObjectId ||
        member?.identity?.objectId ||
        member
      ))
      .filter(objectId => objectId && objectId !== ownerId)
  )];
}

export async function createAosMembershipRelationship({
  createRelationship,
  parentObjectId,
  parentPassportId,
  memberObjectId,
  memberPassportId,
  definitionId = null,
  relationshipLabel = null,
  orderKey,
  commandId = null
} = {}) {
  if (typeof createRelationship !== "function") {
    throw new Error("AOS rail membership requires a governed relationship command.");
  }

  return createRelationship({
    commandId,
    sourceObjectId: clean(memberObjectId),
    sourcePassportId: clean(memberPassportId),
    targetObjectId: clean(parentObjectId),
    targetPassportId: clean(parentPassportId),
    behaviorId: IXI_AOS_RAIL_MEMBERSHIP_BEHAVIOR_ID,
    definitionId: clean(definitionId) || null,
    relationshipLabel: clean(relationshipLabel) || null,
    orderKey: clean(orderKey)
  });
}

export const IXI_AOS_MEMBERSHIP_BRIDGE_STATUS = Object.freeze({
  mode: "governed-ixi-core-v1.1",
  behaviorId: IXI_AOS_RAIL_MEMBERSHIP_BEHAVIOR_ID,
  neutralContractAvailable: true
});
