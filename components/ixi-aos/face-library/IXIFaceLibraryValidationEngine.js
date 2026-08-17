import { authorizeIXIFaceAppDefinition } from "../face-data-runtime/IXIFaceAppAuthorizationEngine";
import { normalizeFaceAppDefinition } from "./IXIFaceLibraryContract";

const clean = value => String(value ?? "").trim();
const safeArray = value => Array.isArray(value) ? value : [];
const safeObject = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};

export function validateFaceAppStructure(faceApp = {}) {
  const normalized = normalizeFaceAppDefinition(faceApp);
  const errors = [];
  const warnings = [];

  if (!normalized.faceAppId) errors.push({ code: "FACE_APP_ID_REQUIRED" });
  if (!normalized.label) errors.push({ code: "FACE_LABEL_REQUIRED" });

  if (normalized.rendererKind === "trusted-hardcoded" && !normalized.trustedRendererId) {
    errors.push({ code: "TRUSTED_RENDERER_ID_REQUIRED" });
  }

  if (normalized.rendererKind === "declarative" && !Object.keys(safeObject(normalized.definition)).length) {
    warnings.push({ code: "DECLARATIVE_FACE_EMPTY" });
  }

  const duplicateCapabilities = normalized.dataCapabilities.filter(
    (value, index, all) => all.indexOf(value) !== index
  );

  if (duplicateCapabilities.length) {
    errors.push({
      code: "DUPLICATE_DATA_CAPABILITY",
      values: Array.from(new Set(duplicateCapabilities))
    });
  }

  return {
    valid: errors.length === 0,
    normalized,
    errors,
    warnings
  };
}

export function validateFaceForAuthorizedTargets({
  faceApp = {},
  targetManifests = [],
  grantedPermissionScopes = []
} = {}) {
  const structure = validateFaceAppStructure(faceApp);
  const errors = [...structure.errors];
  const warnings = [...structure.warnings];

  const manifests = safeArray(targetManifests);
  if (!manifests.length) {
    errors.push({
      code: "AUTHORIZED_TARGET_MANIFEST_REQUIRED",
      message: "At least one server-authorized target manifest is required before publication."
    });
  }

  const targetResults = manifests.map(manifest => {
    const result = authorizeIXIFaceAppDefinition({
      faceApp: structure.normalized,
      manifest,
      grantedPermissionScopes
    });

    result.errors.forEach(error => errors.push({
      ...error,
      objectId: clean(manifest?.object?.objectId),
      objectDefinitionId: clean(
        manifest?.object?.objectDefinitionId ||
        manifest?.object?.definitionId
      )
    }));

    result.warnings.forEach(warning => warnings.push({
      ...warning,
      objectId: clean(manifest?.object?.objectId),
      objectDefinitionId: clean(
        manifest?.object?.objectDefinitionId ||
        manifest?.object?.definitionId
      )
    }));

    return result;
  });

  const authorized = structure.valid && errors.length === 0;

  return {
    schema: "ixi-face-library-validation-v1",
    authorized,
    publishable: authorized,
    faceAppId: structure.normalized.faceAppId,
    errors,
    warnings,
    targetResults,
    validatedAt: new Date().toISOString()
  };
}

export function assertFacePublishable(options = {}) {
  const result = validateFaceForAuthorizedTargets(options);
  if (!result.publishable) {
    const error = new Error("FACE_NOT_PUBLISHABLE");
    error.code = "FACE_NOT_PUBLISHABLE";
    error.validation = result;
    throw error;
  }
  return result;
}

export default {
  validateFaceAppStructure,
  validateFaceForAuthorizedTargets,
  assertFacePublishable
};
