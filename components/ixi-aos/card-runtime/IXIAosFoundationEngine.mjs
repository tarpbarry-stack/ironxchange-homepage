/*
 * IXI AOS FOUNDATION ENGINE
 *
 * Pure, presentation-free contracts for objects, fields, faces and commands.
 * The runtime may render one card or thousands of faces; durable meaning lives
 * here and in IX Core, never in a numbered React component.
 */

export const IXI_AOS_FOUNDATION_VERSION = "ixi-aos-foundation-v1";
export const IXI_AOS_DEFINITION_VERSION = "ixi-aos-definition-v1";
export const IXI_AOS_COMMAND_VERSION = "ixi-aos-object-command-v1";

export const IXI_AOS_DEFINITION_STATES = Object.freeze({
  DRAFT: "draft",
  PUBLISHED: "published",
  RETIRED: "retired"
});

export const IXI_AOS_FIELD_TYPES = Object.freeze([
  "text",
  "number",
  "money",
  "date",
  "datetime",
  "boolean",
  "tags"
]);

export const IXI_AOS_MAX_FIELDS = 1000;
export const IXI_AOS_MAX_FACES = 5000;
export const IXI_AOS_MAX_MODULES_PER_FACE = 250;

const BUSINESS_IDENTIFIER_FIELD_ID = "businessIdentifier";
const BUSINESS_IDENTIFIER_ROLE = "business-identifier";

const clean = value => String(value ?? "").trim();
const object = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const array = value => Array.isArray(value) ? value : [];
const clone = value => JSON.parse(JSON.stringify(value ?? null));

function integer(value, fallback = 0) {
  const resolved = Number(value);
  return Number.isInteger(resolved) && resolved >= 0 ? resolved : fallback;
}

function slug(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function uniqueId(prefix, preferred, used, seed) {
  const root = clean(preferred) || `${prefix}-${slug(seed) || "item"}`;
  let candidate = root;
  let sequence = 2;
  while (used.has(candidate)) candidate = `${root}-${sequence++}`;
  used.add(candidate);
  return candidate;
}

export function getIXIAosObjectId(value = {}) {
  const source = object(value);
  return clean(source.objectId || source.passportId || source.id?.uuid || source.id || source.uuid);
}

export function getIXIAosObjectRevision(value = {}) {
  const source = object(value);
  const candidates = [
    source.revision,
    source.server?.revision,
    source.persistence?.revision,
    source.metadata?.revision,
    source.metadata?.serverRevision
  ];
  for (const candidate of candidates) {
    const revision = Number(candidate);
    if (Number.isInteger(revision) && revision >= 0) return revision;
  }
  return 0;
}

export function getIXIAosDefinitionVersion(value = {}) {
  const source = object(value);
  return clean(
    source.definitionVersion ||
    source.cardDefinition?.definitionVersion ||
    source.metadata?.definitionVersion ||
    source.metadata?.cardDefinition?.definitionVersion ||
    source.cardTemplateVersion
  ) || "unversioned";
}

export function isIXIAosBusinessIdentifier(definition = {}) {
  const source = object(definition);
  const role = clean(source.semanticRole || source.presentationRole).toLowerCase();
  return clean(source.fieldId) === BUSINESS_IDENTIFIER_FIELD_ID || role === BUSINESS_IDENTIFIER_ROLE;
}

export function normalizeIXIAosFieldDefinitions(definitions = []) {
  const used = new Set();
  return array(definitions).slice(0, IXI_AOS_MAX_FIELDS).map((entry, index) => {
    const source = object(entry);
    const role = clean(source.semanticRole || source.presentationRole).toLowerCase();
    const businessIdentifier = clean(source.fieldId) === BUSINESS_IDENTIFIER_FIELD_ID || role === BUSINESS_IDENTIFIER_ROLE;
    const fieldId = businessIdentifier
      ? BUSINESS_IDENTIFIER_FIELD_ID
      : uniqueId("field", source.fieldId, used, source.label || index + 1);
    used.add(fieldId);
    const requestedType = clean(source.fieldType || source.type).toLowerCase();
    const fieldType = IXI_AOS_FIELD_TYPES.includes(requestedType) ? requestedType : "text";

    return {
      ...clone(source),
      fieldId,
      label: businessIdentifier ? "ID" : clean(source.label || source.displayLabel) || `FIELD ${index + 1}`,
      fieldType,
      type: fieldType,
      semanticRole: businessIdentifier ? BUSINESS_IDENTIFIER_ROLE : role,
      presentationRole: businessIdentifier ? BUSINESS_IDENTIFIER_ROLE : clean(source.presentationRole || role).toLowerCase(),
      presentationOrder: index,
      required: source.required === true,
      readOnly: source.readOnly === true || source.editable === false,
      editable: source.readOnly !== true && source.editable !== false,
      archived: source.archived === true,
      validation: clone(object(source.validation)),
      visibility: clone(object(source.visibility)),
      policy: clone(object(source.policy)),
      importAliases: array(source.importAliases).map(clean).filter(Boolean)
    };
  });
}

export function normalizeIXIAosFaceDefinitions(faces = []) {
  const used = new Set();
  return array(faces).slice(0, IXI_AOS_MAX_FACES).map((entry, index) => {
    const source = object(entry);
    const faceId = uniqueId("face", source.faceId, used, source.name || source.label || index + 1);
    const modules = array(source.modules || source.layout).slice(0, IXI_AOS_MAX_MODULES_PER_FACE).map((module, moduleIndex) => {
      const value = object(module);
      return {
        ...clone(value),
        moduleId: clean(value.moduleId || value.slotId) || `${faceId}:module-${moduleIndex + 1}`,
        moduleType: clean(value.moduleType).toLowerCase(),
        order: moduleIndex
      };
    });

    return {
      ...clone(source),
      faceId,
      name: clean(source.name || source.label) || `FACE ${index + 1}`,
      label: clean(source.label || source.name) || `FACE ${index + 1}`,
      order: index,
      faceIndex: index + 1,
      state: Object.values(IXI_AOS_DEFINITION_STATES).includes(clean(source.state).toLowerCase())
        ? clean(source.state).toLowerCase()
        : IXI_AOS_DEFINITION_STATES.DRAFT,
      hidden: source.hidden === true,
      layoutId: clean(source.layoutId || source.layoutType) || "freeform",
      modules,
      layout: modules,
      visibility: clone(object(source.visibility)),
      policy: clone(object(source.policy)),
      metadata: clone(object(source.metadata))
    };
  });
}

export function createIXIAosDefinitionEnvelope({
  definitionId = "",
  objectId = "",
  revision = 0,
  version = 1,
  state = IXI_AOS_DEFINITION_STATES.DRAFT,
  fields = [],
  faces = [],
  access = {},
  metadata = {}
} = {}) {
  const resolvedObjectId = clean(objectId);
  return {
    contractVersion: IXI_AOS_DEFINITION_VERSION,
    definitionId: clean(definitionId) || (resolvedObjectId ? `definition:${resolvedObjectId}` : ""),
    objectId: resolvedObjectId,
    revision: integer(revision),
    version: Math.max(1, integer(version, 1)),
    state: Object.values(IXI_AOS_DEFINITION_STATES).includes(clean(state).toLowerCase())
      ? clean(state).toLowerCase()
      : IXI_AOS_DEFINITION_STATES.DRAFT,
    fields: normalizeIXIAosFieldDefinitions(fields),
    faces: normalizeIXIAosFaceDefinitions(faces),
    access: clone(object(access)),
    metadata: clone(object(metadata))
  };
}

export function validateIXIAosDefinitionEnvelope(input = {}) {
  const definition = createIXIAosDefinitionEnvelope(input);
  const errors = [];
  if (!definition.definitionId) errors.push({ path: "definitionId", code: "REQUIRED" });
  if (array(input.fields).length > IXI_AOS_MAX_FIELDS) errors.push({ path: "fields", code: "LIMIT_EXCEEDED" });
  if (array(input.faces).length > IXI_AOS_MAX_FACES) errors.push({ path: "faces", code: "LIMIT_EXCEEDED" });
  if (!definition.faces.length) errors.push({ path: "faces", code: "FACE_REQUIRED" });

  const suppliedFieldIds = new Set();
  array(input.fields).forEach(field => {
    const fieldId = clean(field?.fieldId);
    if (!fieldId) return;
    if (suppliedFieldIds.has(fieldId)) errors.push({ path: `fields.${fieldId}`, code: "DUPLICATE_ID" });
    suppliedFieldIds.add(fieldId);
  });

  const fieldIds = new Set();
  definition.fields.forEach(field => {
    if (fieldIds.has(field.fieldId)) errors.push({ path: `fields.${field.fieldId}`, code: "DUPLICATE_ID" });
    fieldIds.add(field.fieldId);
    if (!clean(field.label)) errors.push({ path: `fields.${field.fieldId}.label`, code: "REQUIRED" });
  });

  const suppliedFaceIds = new Set();
  array(input.faces).forEach(face => {
    const faceId = clean(face?.faceId);
    if (faceId && suppliedFaceIds.has(faceId)) errors.push({ path: `faces.${faceId}`, code: "DUPLICATE_ID" });
    if (faceId) suppliedFaceIds.add(faceId);
    if (array(face?.modules || face?.layout).length > IXI_AOS_MAX_MODULES_PER_FACE) {
      errors.push({ path: `faces.${faceId || "unknown"}.modules`, code: "LIMIT_EXCEEDED" });
    }
  });

  const faceIds = new Set();
  definition.faces.forEach(face => {
    if (faceIds.has(face.faceId)) errors.push({ path: `faces.${face.faceId}`, code: "DUPLICATE_ID" });
    faceIds.add(face.faceId);
    if (face.modules.length > IXI_AOS_MAX_MODULES_PER_FACE) {
      errors.push({ path: `faces.${face.faceId}.modules`, code: "LIMIT_EXCEEDED" });
    }
  });

  return { valid: errors.length === 0, errors, definition };
}

export function createIXIAosDefinitionIndex(input = {}) {
  const definition = createIXIAosDefinitionEnvelope(input);
  return {
    definition,
    fieldsById: new Map(definition.fields.map(field => [field.fieldId, field])),
    facesById: new Map(definition.faces.map(face => [face.faceId, face])),
    visibleFaces: definition.faces.filter(face => !face.hidden && face.state !== IXI_AOS_DEFINITION_STATES.RETIRED)
  };
}

export function publishIXIAosDefinition(input = {}, { actorId = "", at = new Date().toISOString() } = {}) {
  const validation = validateIXIAosDefinitionEnvelope(input);
  if (!validation.valid) {
    const error = new Error("AOS definition cannot be published until validation passes.");
    error.code = "IXI_AOS_DEFINITION_INVALID";
    error.validation = validation;
    throw error;
  }
  return {
    ...validation.definition,
    version: validation.definition.version + 1,
    revision: validation.definition.revision + 1,
    state: IXI_AOS_DEFINITION_STATES.PUBLISHED,
    metadata: {
      ...validation.definition.metadata,
      publishedAt: at,
      publishedBy: clean(actorId) || null
    }
  };
}

export function synchronizeIXIAosBusinessIdentifier(value = {}) {
  const source = clone(object(value));
  const fields = object(source.fields);
  const existing = array(source.businessIdentifiers).map(entry => clone(object(entry))).filter(entry => clean(entry.value));
  const hasEditorValue = Object.prototype.hasOwnProperty.call(fields, BUSINESS_IDENTIFIER_FIELD_ID);
  const editorValue = hasEditorValue ? clean(fields[BUSINESS_IDENTIFIER_FIELD_ID]) : clean(existing[0]?.value);
  const businessIdentifiers = editorValue
    ? [{ ...object(existing[0]), label: "ID", value: editorValue }, ...existing.slice(1)]
    : [];
  return { ...source, fields: { ...fields, [BUSINESS_IDENTIFIER_FIELD_ID]: editorValue }, businessIdentifiers };
}

export function createIXIAosEditSession(value = {}) {
  const baseObject = synchronizeIXIAosBusinessIdentifier(value);
  return {
    contractVersion: IXI_AOS_FOUNDATION_VERSION,
    objectId: getIXIAosObjectId(baseObject),
    baseRevision: getIXIAosObjectRevision(baseObject),
    definitionVersion: getIXIAosDefinitionVersion(baseObject),
    baseObject,
    draft: clone(baseObject),
    dirtyPaths: [],
    validation: { valid: true, errors: [] },
    status: "editing",
    conflict: null
  };
}

export function createIXIAosObjectUpdateCommand({ session, draft, commandId, now = new Date().toISOString() } = {}) {
  const current = object(session);
  const canonicalDraft = synchronizeIXIAosBusinessIdentifier(draft || current.draft);
  const objectId = clean(current.objectId || getIXIAosObjectId(canonicalDraft));
  const resolvedCommandId = clean(commandId);
  if (!objectId) throw Object.assign(new Error("AOS update requires objectId."), { code: "IXI_AOS_OBJECT_ID_REQUIRED" });
  if (!resolvedCommandId) throw Object.assign(new Error("AOS update requires commandId."), { code: "IXI_AOS_COMMAND_ID_REQUIRED" });

  return {
    contractVersion: IXI_AOS_COMMAND_VERSION,
    commandType: "object.update",
    commandId: resolvedCommandId,
    idempotencyKey: resolvedCommandId,
    objectId,
    expectedRevision: integer(current.baseRevision),
    definitionVersion: clean(current.definitionVersion) || "unversioned",
    issuedAt: now,
    patch: {
      displayName: clean(canonicalDraft.displayName),
      businessIdentifiers: array(canonicalDraft.businessIdentifiers),
      fields: clone(object(canonicalDraft.fields)),
      fieldDefinitions: normalizeIXIAosFieldDefinitions(canonicalDraft.fieldDefinitions || canonicalDraft.metadata?.fieldDefinitions),
      media: clone(array(canonicalDraft.media)),
      metadata: clone(object(canonicalDraft.metadata))
    }
  };
}

export function acceptIXIAosCanonicalObject(command = {}, response = {}) {
  const canonical = object(response.object || response.data?.object || response.record || response.data?.record);
  const expectedId = clean(command.objectId);
  const actualId = getIXIAosObjectId(canonical);
  if (!actualId || actualId !== expectedId) {
    throw Object.assign(new Error("IX Core did not return the canonical saved AOS object."), { code: "IXI_AOS_CANONICAL_READBACK_REQUIRED" });
  }
  const revision = getIXIAosObjectRevision(canonical);
  if (
    Number.isInteger(Number(command.expectedRevision)) &&
    Number(command.expectedRevision) >= 0 &&
    revision <= Number(command.expectedRevision)
  ) {
    throw Object.assign(new Error("IX Core returned a stale AOS object revision."), { code: "IXI_AOS_CANONICAL_REVISION_STALE" });
  }
  return synchronizeIXIAosBusinessIdentifier(canonical);
}

export default {
  IXI_AOS_FOUNDATION_VERSION,
  IXI_AOS_DEFINITION_VERSION,
  IXI_AOS_COMMAND_VERSION,
  IXI_AOS_DEFINITION_STATES,
  IXI_AOS_FIELD_TYPES,
  normalizeIXIAosFieldDefinitions,
  normalizeIXIAosFaceDefinitions,
  createIXIAosDefinitionEnvelope,
  validateIXIAosDefinitionEnvelope,
  createIXIAosDefinitionIndex,
  publishIXIAosDefinition,
  synchronizeIXIAosBusinessIdentifier,
  createIXIAosEditSession,
  createIXIAosObjectUpdateCommand,
  acceptIXIAosCanonicalObject
};
