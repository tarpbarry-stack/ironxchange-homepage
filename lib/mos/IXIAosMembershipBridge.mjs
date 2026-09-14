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

function projectionIntegrityError(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

function canonicalReference({
  reference,
  passportId = "",
  admission,
  role
}) {
  if (
    !admission ||
    typeof admission.resolveObjectId !== "function" ||
    !admission.objectsById
  ) {
    throw projectionIntegrityError(
      "IXI_AOS_PROJECTION_ADMISSION_REQUIRED",
      "Canonical admission is required before resolving a rail projection."
    );
  }

  const suppliedReference = clean(reference);
  let objectId = "";

  try {
    objectId = clean(admission.resolveObjectId(suppliedReference));
  } catch (cause) {
    throw projectionIntegrityError(
      "IXI_AOS_PROJECTION_IDENTITY_CONFLICT",
      `Rail ${role} identity resolves through conflicting aliases.`,
      { role, reference: suppliedReference, causeCode: cause?.code || null }
    );
  }

  const object = objectId
    ? admission.objectsById.get(objectId)
    : null;

  if (!object) {
    throw projectionIntegrityError(
      "IXI_AOS_PROJECTION_IDENTITY_UNRESOLVED",
      `Rail ${role} does not resolve to an admitted canonical Object.`,
      { role, reference: suppliedReference }
    );
  }

  const suppliedPassportId = clean(passportId);
  const canonicalPassportId = clean(object?.passportId);

  if (suppliedPassportId && suppliedPassportId !== canonicalPassportId) {
    throw projectionIntegrityError(
      "IXI_AOS_PROJECTION_PASSPORT_MISMATCH",
      `Rail ${role} Passport does not match the admitted canonical Object.`,
      {
        role,
        objectId,
        suppliedPassportId,
        canonicalPassportId
      }
    );
  }

  return objectId;
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

function projectionMemberObjectId(member, admission) {
  return canonicalReference({
    reference:
      member?.objectId ||
      member?.sourceObjectId ||
      member?.identity?.objectId ||
      member,
    passportId:
      member?.passportId ||
      member?.sourcePassportId ||
      member?.identity?.passportId,
    admission,
    role: "member"
  });
}

export function getInvalidAosSystemIndexMemberships({
  relationships = [],
  systemIndexObjectIds = [],
  admission
} = {}) {
  const indexIds = new Set(
    [...systemIndexObjectIds]
      .map(objectId => canonicalReference({
        reference: objectId,
        admission,
        role: "system-index"
      }))
      .filter(Boolean)
  );

  if (indexIds.size < 2) return [];

  return (Array.isArray(relationships) ? relationships : [])
    .map(relationshipRecord)
    .filter(isAosMembershipRelationship)
    .filter(relationship => {
      const memberObjectId = canonicalReference({
        reference: relationship?.sourceObjectId,
        passportId:
          relationship?.sourcePassportId ||
          relationship?.sourceIdentity?.passportId,
        admission,
        role: "member"
      });
      const ownerObjectId = canonicalReference({
        reference: relationship?.targetObjectId,
        passportId:
          relationship?.targetPassportId ||
          relationship?.targetIdentity?.passportId,
        admission,
        role: "owner"
      });

      return (
        memberObjectId !== ownerObjectId &&
        indexIds.has(memberObjectId) &&
        indexIds.has(ownerObjectId)
      );
    });
}

export function removeAosRailProjectionMemberships({
  railProjections = {},
  memberships = [],
  admission
} = {}) {
  const removalsByOwner = new Map();

  (Array.isArray(memberships) ? memberships : [])
    .map(relationshipRecord)
    .filter(isAosMembershipRelationship)
    .forEach(relationship => {
      const memberObjectId = canonicalReference({
        reference: relationship?.sourceObjectId,
        passportId:
          relationship?.sourcePassportId ||
          relationship?.sourceIdentity?.passportId,
        admission,
        role: "member"
      });
      const ownerObjectId = canonicalReference({
        reference: relationship?.targetObjectId,
        passportId:
          relationship?.targetPassportId ||
          relationship?.targetIdentity?.passportId,
        admission,
        role: "owner"
      });

      if (!removalsByOwner.has(ownerObjectId)) {
        removalsByOwner.set(ownerObjectId, new Set());
      }
      removalsByOwner.get(ownerObjectId).add(memberObjectId);
    });

  const removeMembers = (members, removals) =>
    (Array.isArray(members) ? members : []).filter(member =>
      !removals.has(projectionMemberObjectId(member, admission))
    );

  const cleanProjection = (projection, removals) => {
    if (Array.isArray(projection)) {
      return removeMembers(projection, removals);
    }
    if (!projection || typeof projection !== "object") {
      return projection;
    }

    const nextProjection = { ...projection };
    ["members", "items", "references"].forEach(key => {
      if (Array.isArray(projection[key])) {
        nextProjection[key] = removeMembers(projection[key], removals);
      }
    });
    return nextProjection;
  };

  if (railProjections instanceof Map) {
    const nextProjections = new Map(railProjections);
    removalsByOwner.forEach((removals, ownerObjectId) => {
      if (nextProjections.has(ownerObjectId)) {
        nextProjections.set(
          ownerObjectId,
          cleanProjection(nextProjections.get(ownerObjectId), removals)
        );
      }
    });
    return nextProjections;
  }

  const nextProjections = {
    ...(railProjections && typeof railProjections === "object"
      ? railProjections
      : {})
  };
  removalsByOwner.forEach((removals, ownerObjectId) => {
    if (Object.prototype.hasOwnProperty.call(nextProjections, ownerObjectId)) {
      nextProjections[ownerObjectId] =
        cleanProjection(nextProjections[ownerObjectId], removals);
    }
  });
  return nextProjections;
}

export function getAosMembershipObjectIds({
  parentObjectId,
  relationships = [],
  admission
} = {}) {
  if (!clean(parentObjectId)) return [];

  const railOwnerObjectId = canonicalReference({
    reference: parentObjectId,
    admission,
    role: "owner"
  });

  return [...new Set(
    (Array.isArray(relationships) ? relationships : [])
      .map(relationshipRecord)
      .filter(isAosMembershipRelationship)
      .filter(relationship => {
        const targetObjectId = canonicalReference({
          reference: relationship?.targetObjectId,
          passportId:
            relationship?.targetPassportId ||
            relationship?.targetIdentity?.passportId,
          admission,
          role: "owner"
        });
        return targetObjectId === railOwnerObjectId;
      })
      .sort((left, right) =>
        clean(left?.orderKey).localeCompare(clean(right?.orderKey))
      )
      .map(relationship => canonicalReference({
        reference: relationship?.sourceObjectId,
        passportId:
          relationship?.sourcePassportId ||
          relationship?.sourceIdentity?.passportId,
        admission,
        role: "member"
      }))
      .filter(objectId => objectId && objectId !== railOwnerObjectId)
  )];
}

export function getAosCorroboratedLegacyMembershipObjectIds({
  parentObjectId,
  relationships = [],
  admission
} = {}) {
  if (!clean(parentObjectId)) return [];

  const railOwnerObjectId = canonicalReference({
    reference: parentObjectId,
    admission,
    role: "owner"
  });

  return [...new Set(
    (Array.isArray(relationships) ? relationships : [])
      .map(relationshipRecord)
      .filter(relationship =>
        active(relationship) &&
        !clean(relationship?.behaviorId)
      )
      .filter(relationship => {
        const targetObjectId = canonicalReference({
          reference: relationship?.targetObjectId,
          admission,
          role: "owner"
        });
        if (targetObjectId !== railOwnerObjectId) return false;
        const sourceObjectId = canonicalReference({
          reference: relationship?.sourceObjectId,
          admission,
          role: "member"
        });
        const sourceObject = admission.objectsById.get(sourceObjectId);
        return clean(sourceObject?.directContainerId) === railOwnerObjectId;
      })
      .map(relationship => canonicalReference({
        reference: relationship?.sourceObjectId,
        admission,
        role: "member"
      }))
      .filter(objectId => objectId && objectId !== railOwnerObjectId)
  )];
}

export function getAosRailProjectionObjectIds({
  railOwnerObjectId,
  railProjections = {},
  admission
} = {}) {
  if (!clean(railOwnerObjectId)) return [];

  const ownerId = canonicalReference({
    reference: railOwnerObjectId,
    admission,
    role: "owner"
  });
  const projection = projectionForOwner(railProjections, ownerId);

  return [...new Set(
    projectionMembers(projection)
      .map(member => canonicalReference({
        reference:
          member?.objectId ||
          member?.sourceObjectId ||
          member?.identity?.objectId ||
          member,
        passportId:
          member?.passportId ||
          member?.sourcePassportId ||
          member?.identity?.passportId,
        admission,
        role: "member"
      }))
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
