import { authorizeIXIFaceAppDefinition } from "../face-data-runtime/IXIFaceAppAuthorizationEngine";
import { resolveAssignedFaces } from "./IXIFaceLibraryAssignmentEngine";
import {
  getFaceLibraryEffectivePolicy,
  filterAuthorizedFaceCapabilities
} from "./IXIFaceLibraryPolicyEngine";

const clean = value => String(value ?? "").trim();
const safeArray = value => Array.isArray(value) ? value : [];

/*
 * Resolve the faces that may actually render for one object/user context.
 * Server authorization remains primary. This runtime performs defense-in-depth:
 * assignment match, published-version check, data-capability check and scope check.
 */
export function resolveAuthorizedFaceRuntimeSet({
  object = {},
  manifest = {},
  assignments = [],
  faceRecords = [],
  systemPolicy = {},
  companyPolicy = {},
  actorPolicy = {},
  capabilityPermissionScopes = {}
} = {}) {
  if (manifest?.authorized !== true) {
    return {
      authorized: false,
      reason: "manifest-not-authorized",
      faces: [],
      denied: []
    };
  }

  const candidates = resolveAssignedFaces({
    assignments,
    object,
    faceRecords
  });

  const faces = [];
  const denied = [];

  candidates.forEach(candidate => {
    const effectivePolicy = getFaceLibraryEffectivePolicy({
      systemPolicy,
      companyPolicy,
      actorPolicy,
      facePolicy: candidate?.record?.permissions,
      assignmentPolicy: candidate?.assignment?.permissions
    });

    const requestedCapabilities = safeArray(candidate?.version?.dataCapabilities);
    const scopeFilteredCapabilities = filterAuthorizedFaceCapabilities({
      capabilityIds: requestedCapabilities,
      capabilityPermissionScopes,
      effectivePolicy
    });

    if (scopeFilteredCapabilities.length !== requestedCapabilities.length) {
      denied.push({
        faceAppId: clean(candidate?.record?.faceAppId),
        version: candidate?.version?.version,
        reason: "data-scope-denied"
      });
      return;
    }

    const authorization = authorizeIXIFaceAppDefinition({
      faceApp: candidate.version,
      manifest,
      grantedPermissionScopes: effectivePolicy.dataScopes
    });

    if (!authorization.authorized) {
      denied.push({
        faceAppId: clean(candidate?.record?.faceAppId),
        version: candidate?.version?.version,
        reason: "face-data-not-authorized",
        authorization
      });
      return;
    }

    faces.push({
      faceAppId: clean(candidate?.record?.faceAppId),
      version: candidate.version.version,
      label: candidate.version.label,
      rendererKind: candidate.version.rendererKind,
      trustedRendererId: candidate.version.trustedRendererId || "",
      definition: candidate.version.definition || {},
      slot: candidate.slot,
      assignmentId: clean(candidate?.assignment?.assignmentId),
      authorization,
      effectivePolicy
    });
  });

  return {
    authorized: true,
    objectId: clean(manifest?.object?.objectId),
    faces,
    denied
  };
}

export default {
  resolveAuthorizedFaceRuntimeSet
};
