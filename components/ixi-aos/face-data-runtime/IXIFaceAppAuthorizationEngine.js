import {
  clean,
  asArray
} from "../card-runtime/IXIAosSemanticObjectPresentation";

import {
  getIXIAuthorizedFaceCapabilityIds
} from "./IXIAuthorizedFaceDataManifest";

/*
 * IXI AOS — FACE APP AUTHORIZATION ENGINE
 *
 * Validates a Face App definition against the already-authorized
 * per-object Face Data Manifest. This engine does not resolve policy;
 * it verifies that the requested Face only consumes capabilities and
 * scopes the current authorization context has granted.
 */

export const IXI_FACE_APP_AUTHORIZATION_SCHEMA =
  "ixi-face-app-authorization-result-v1";

function normalizedSet(value) {
  return new Set(
    asArray(value)
      .map(item => clean(item))
      .filter(Boolean)
  );
}

export function authorizeIXIFaceAppDefinition({
  faceApp = {},
  manifest = {},
  grantedPermissionScopes = []
} = {}) {
  const errors = [];
  const warnings = [];

  if (manifest?.authorized !== true) {
    errors.push({
      code: "MANIFEST_NOT_AUTHORIZED",
      message: "The target object is not authorized for Face data access."
    });
  }

  const availableCapabilities = normalizedSet(
    getIXIAuthorizedFaceCapabilityIds(manifest)
  );

  const requestedDataCapabilities = asArray(faceApp?.dataCapabilities)
    .map(clean)
    .filter(Boolean);

  const requiredCapabilities = asArray(faceApp?.requiredCapabilities)
    .map(clean)
    .filter(Boolean);

  const optionalCapabilities = asArray(faceApp?.optionalCapabilities)
    .map(clean)
    .filter(Boolean);

  const missingDataCapabilities = requestedDataCapabilities
    .filter(capabilityId => !availableCapabilities.has(capabilityId));

  const missingRequiredCapabilities = requiredCapabilities
    .filter(capabilityId => !availableCapabilities.has(capabilityId));

  const missingOptionalCapabilities = optionalCapabilities
    .filter(capabilityId => !availableCapabilities.has(capabilityId));

  missingDataCapabilities.forEach(capabilityId => {
    errors.push({
      code: "DATA_CAPABILITY_NOT_AUTHORIZED",
      capabilityId,
      message: `Face App requested unauthorized data capability: ${capabilityId}`
    });
  });

  missingRequiredCapabilities.forEach(capabilityId => {
    errors.push({
      code: "REQUIRED_CAPABILITY_MISSING",
      capabilityId,
      message: `Required Face capability is unavailable: ${capabilityId}`
    });
  });

  missingOptionalCapabilities.forEach(capabilityId => {
    warnings.push({
      code: "OPTIONAL_CAPABILITY_MISSING",
      capabilityId,
      message: `Optional Face capability is unavailable: ${capabilityId}`
    });
  });

  const grantedScopes = normalizedSet(grantedPermissionScopes);
  const requestedScopes = asArray(faceApp?.permissionScopes)
    .map(clean)
    .filter(Boolean);

  const missingPermissionScopes = requestedScopes
    .filter(scope => !grantedScopes.has(scope));

  missingPermissionScopes.forEach(scope => {
    errors.push({
      code: "PERMISSION_SCOPE_NOT_GRANTED",
      permissionScope: scope,
      message: `Face App requires a permission scope not granted in this authorization context: ${scope}`
    });
  });

  const compatibleObjectCapabilities = asArray(
    faceApp?.compatibleObjectCapabilities
  )
    .map(clean)
    .filter(Boolean);

  const objectCapabilities = manifest?.objectCapabilities || {};

  const incompatibleObjectCapabilities = compatibleObjectCapabilities
    .filter(capability => objectCapabilities?.[capability] !== true);

  incompatibleObjectCapabilities.forEach(capability => {
    warnings.push({
      code: "OBJECT_CAPABILITY_NOT_DECLARED",
      capability,
      message: `Target object does not explicitly declare compatibility capability: ${capability}`
    });
  });

  const authorized = errors.length === 0;

  return {
    schema: IXI_FACE_APP_AUTHORIZATION_SCHEMA,
    authorized,
    faceAppId: clean(faceApp?.faceAppId),
    faceAppVersion: Number(faceApp?.version || 0),
    objectId: clean(manifest?.object?.objectId),
    passportId: clean(manifest?.object?.passportId),
    errors,
    warnings,
    compatibility: {
      requestedDataCapabilities,
      missingDataCapabilities,
      requiredCapabilities,
      missingRequiredCapabilities,
      optionalCapabilities,
      missingOptionalCapabilities,
      requestedPermissionScopes: requestedScopes,
      missingPermissionScopes,
      incompatibleObjectCapabilities
    }
  };
}

export function assertIXIFaceAppAuthorized(options = {}) {
  const result = authorizeIXIFaceAppDefinition(options);

  if (!result.authorized) {
    const message = result.errors
      .map(error => error.message)
      .join("; ");

    const error = new Error(
      message || "IXI Face App is not authorized for this object/context."
    );

    error.code = "IXI_FACE_APP_NOT_AUTHORIZED";
    error.authorization = result;
    throw error;
  }

  return result;
}

export default {
  authorizeIXIFaceAppDefinition,
  assertIXIFaceAppAuthorized
};
