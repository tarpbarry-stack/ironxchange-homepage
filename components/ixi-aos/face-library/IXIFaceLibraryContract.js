/* =========================================================
   IXI AOS — COMPANY FACE LIBRARY CONTRACT

   One durable contract for customer-owned Face Apps.

   Doctrine:
   - a Face IS the application module
   - published versions are immutable
   - drafts are editable, versioned working copies
   - customer vocabulary is authoritative
   - assignments target stable object-definition/capability identity
   - no business meaning is inferred from labels
   - permissions are explicit and server-authoritative
   - browser state is never the durable system of record
   ========================================================= */

export const IXI_FACE_LIBRARY_SCHEMA = "ixi-face-library-v1";
export const IXI_FACE_RECORD_SCHEMA = "ixi-face-record-v1";
export const IXI_FACE_VERSION_SCHEMA = "ixi-face-version-v1";
export const IXI_FACE_ASSIGNMENT_SCHEMA = "ixi-face-assignment-v1";

export const IXI_FACE_LIBRARY_SCOPES = Object.freeze([
  "ixi-system",
  "industry-package",
  "company",
  "personal-draft"
]);

export const IXI_FACE_STATUSES = Object.freeze([
  "draft",
  "active",
  "retired"
]);

export const IXI_FACE_RENDERER_KINDS = Object.freeze([
  "declarative",
  "trusted-hardcoded"
]);

export const IXI_FACE_LIBRARY_ACTIONS = Object.freeze([
  "library.view",
  "face.create",
  "face.edit",
  "face.clone",
  "face.publish",
  "face.retire",
  "face.assign",
  "face.unassign",
  "face.permissions.manage"
]);

const clean = value => String(value ?? "").trim();
const safeArray = value => Array.isArray(value) ? value : [];
const safeObject = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};

export function normalizeFaceLibraryPermissions(policy = {}) {
  const source = safeObject(policy);
  return {
    allowedActions: safeArray(source.allowedActions).map(clean).filter(Boolean),
    deniedActions: safeArray(source.deniedActions).map(clean).filter(Boolean),
    viewScopes: safeArray(source.viewScopes).map(clean).filter(Boolean),
    dataScopes: safeArray(source.dataScopes).map(clean).filter(Boolean),
    assignmentScopes: safeArray(source.assignmentScopes).map(clean).filter(Boolean)
  };
}

export function normalizeFaceAppDefinition(definition = {}) {
  const source = safeObject(definition);
  const rendererKind = IXI_FACE_RENDERER_KINDS.includes(source.rendererKind)
    ? source.rendererKind
    : "declarative";

  return {
    faceAppId: clean(source.faceAppId || source.faceId || source.id),
    label: clean(source.label || source.name) || "UNTITLED FACE",
    description: clean(source.description),
    rendererKind,
    trustedRendererId: clean(source.trustedRendererId),
    heightBehavior: source.heightBehavior === "bounded" ? "bounded" : "scroll",
    dataCapabilities: safeArray(source.dataCapabilities).map(clean).filter(Boolean),
    requiredCapabilities: safeArray(source.requiredCapabilities).map(clean).filter(Boolean),
    optionalCapabilities: safeArray(source.optionalCapabilities).map(clean).filter(Boolean),
    permissionScopes: safeArray(source.permissionScopes).map(clean).filter(Boolean),
    compatibleObjectCapabilities: safeArray(source.compatibleObjectCapabilities).map(clean).filter(Boolean),
    definition: safeObject(source.definition)
  };
}

export function createFaceDraftRecord({
  faceAppId,
  companyId,
  libraryScope = "company",
  label,
  description = "",
  rendererKind = "declarative",
  trustedRendererId = "",
  definition = {},
  dataCapabilities = [],
  requiredCapabilities = [],
  optionalCapabilities = [],
  permissionScopes = [],
  compatibleObjectCapabilities = [],
  createdBy = "",
  sourceFaceAppId = "",
  sourceVersion = null
} = {}) {
  const now = new Date().toISOString();

  return {
    schema: IXI_FACE_RECORD_SCHEMA,
    faceAppId: clean(faceAppId),
    companyId: clean(companyId),
    libraryScope: IXI_FACE_LIBRARY_SCOPES.includes(libraryScope) ? libraryScope : "company",
    status: "draft",
    currentDraftVersion: 1,
    currentPublishedVersion: null,
    latestVersion: 1,
    etag: "",
    permissions: normalizeFaceLibraryPermissions({}),
    source: {
      faceAppId: clean(sourceFaceAppId),
      version: Number.isInteger(sourceVersion) ? sourceVersion : null
    },
    audit: {
      createdBy: clean(createdBy),
      createdAt: now,
      modifiedBy: clean(createdBy),
      modifiedAt: now,
      publishedBy: "",
      publishedAt: "",
      retiredBy: "",
      retiredAt: ""
    },
    versions: [
      createFaceVersion({
        faceAppId,
        version: 1,
        status: "draft",
        label,
        description,
        rendererKind,
        trustedRendererId,
        definition,
        dataCapabilities,
        requiredCapabilities,
        optionalCapabilities,
        permissionScopes,
        compatibleObjectCapabilities,
        createdBy
      })
    ]
  };
}

export function createFaceVersion({
  faceAppId,
  version,
  status = "draft",
  label,
  description = "",
  rendererKind = "declarative",
  trustedRendererId = "",
  definition = {},
  dataCapabilities = [],
  requiredCapabilities = [],
  optionalCapabilities = [],
  permissionScopes = [],
  compatibleObjectCapabilities = [],
  createdBy = "",
  changeReason = ""
} = {}) {
  const normalized = normalizeFaceAppDefinition({
    faceAppId,
    label,
    description,
    rendererKind,
    trustedRendererId,
    definition,
    dataCapabilities,
    requiredCapabilities,
    optionalCapabilities,
    permissionScopes,
    compatibleObjectCapabilities
  });

  return {
    schema: IXI_FACE_VERSION_SCHEMA,
    ...normalized,
    version: Math.max(Number(version) || 1, 1),
    status: IXI_FACE_STATUSES.includes(status) ? status : "draft",
    immutable: status === "active" || status === "retired",
    checksum: "",
    audit: {
      createdBy: clean(createdBy),
      createdAt: new Date().toISOString(),
      changeReason: clean(changeReason)
    }
  };
}

export function createFaceAssignment({
  assignmentId,
  companyId,
  faceAppId,
  version = null,
  target = {},
  slot = null,
  permissions = {},
  createdBy = ""
} = {}) {
  const resolvedTarget = safeObject(target);

  return {
    schema: IXI_FACE_ASSIGNMENT_SCHEMA,
    assignmentId: clean(assignmentId),
    companyId: clean(companyId),
    faceAppId: clean(faceAppId),
    version: Number.isInteger(version) ? version : null,
    target: {
      objectDefinitionIds: safeArray(resolvedTarget.objectDefinitionIds).map(clean).filter(Boolean),
      requiredCapabilities: safeArray(resolvedTarget.requiredCapabilities).map(clean).filter(Boolean),
      objectIds: safeArray(resolvedTarget.objectIds).map(clean).filter(Boolean)
    },
    slot: Number.isInteger(slot) && slot > 1 ? slot : null,
    permissions: normalizeFaceLibraryPermissions(permissions),
    active: true,
    audit: {
      createdBy: clean(createdBy),
      createdAt: new Date().toISOString()
    }
  };
}

export function getFaceVersion(record = {}, version = null) {
  const versions = safeArray(record?.versions);
  if (!versions.length) return null;

  const target = Number.isInteger(version)
    ? version
    : Number(record?.currentPublishedVersion || record?.currentDraftVersion || record?.latestVersion);

  return versions.find(item => Number(item?.version) === target) || null;
}

export default {
  createFaceDraftRecord,
  createFaceVersion,
  createFaceAssignment,
  getFaceVersion,
  normalizeFaceAppDefinition,
  normalizeFaceLibraryPermissions
};
