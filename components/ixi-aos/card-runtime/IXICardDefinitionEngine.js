/*
 * IXI AOS CARD DEFINITION ENGINE
 *
 * Core doctrine:
 *
 * - Everything durable is an Object.
 * - Every Object may have a Card Definition.
 * - Face 1 is the primary visible Card face.
 * - Additional Faces belong to the same Card.
 * - Container is a capability of a Card.
 * - Card meaning is NOT determined by objectType.
 * - Placement never changes Card identity.
 * - Customer-created templates are first-class.
 *
 * This engine contains NO React.
 * It contains NO Board logic.
 * It contains NO Marketplace logic.
 * It contains NO Sharetribe logic.
 */

export const IXI_CARD_DEFINITION_VERSION = "ixi-card-definition-v1";

export const IXI_CARD_FACE_TYPES = Object.freeze({
  PRIMARY: "primary",
  DETAIL: "detail",
  RELATIONSHIPS: "relationships",
  HISTORY: "history",
  MEDIA: "media",
  CUSTOM: "custom"
});

export const IXI_CARD_CAPABILITIES = Object.freeze({
  DRAGGABLE: "draggable",
  SORTABLE: "sortable",
  CONTAIN: "contain",
  CREATE: "create",
  RECEIVE_DROP: "receive-drop",
  RAIL: "rail",
  NOTICES: "notices",
  CONSOLE: "console",
  RELATIONSHIPS: "relationships",
  MEDIA: "media",
  EDIT: "edit",
  TRANSACT: "transact"
});

function clean(value) {
  return String(value || "").trim();
}

function cleanLower(value) {
  return clean(value).toLowerCase();
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function getIXIAosObjectId(object = {}) {
  return clean(
    object.objectId ||
    object.id?.uuid ||
    object.id ||
    object.listingId ||
    ""
  );
}

export function getIXIAosObjectName(object = {}) {
  return (
    clean(object.displayName) ||
    clean(object.name) ||
    clean(object.title) ||
    clean(object.attributes?.title) ||
    "UNTITLED OBJECT"
  );
}

/*
 * These are AOS operating capabilities, not business classifications.
 * canCreate is deliberately distinct from canContain: an object may expose
 * a create/relationship action without itself being a physical container.
 */
export function createDefaultIXICardCapabilities(overrides = {}) {
  return {
    draggable: true,
    sortable: true,
    canContain: false,
    canCreate: false,
    canReceiveDrop: false,
    hasRail: true,
    hasNotices: true,
    hasConsole: true,
    hasRelationships: true,
    hasMedia: true,
    editable: true,
    canTransact: false,
    ...safeObject(overrides)
  };
}

export function createIXICardFaceDefinition({
  faceId,
  faceIndex,
  faceType = IXI_CARD_FACE_TYPES.CUSTOM,
  label = "",
  layout = [],
  modules = [],
  metadata = {}
} = {}) {
  const resolvedIndex = Number(faceIndex);
  const index = Number.isFinite(resolvedIndex) && resolvedIndex > 0
    ? resolvedIndex
    : 1;

  return {
    faceId: clean(faceId) || `face-${index}`,
    faceIndex: index,
    faceType: cleanLower(faceType) || IXI_CARD_FACE_TYPES.CUSTOM,
    label: clean(label),
    layout: safeArray(layout),
    modules: safeArray(modules),
    metadata: safeObject(metadata)
  };
}

export function createDefaultIXIFaceOne({ object = {} } = {}) {
  return createIXICardFaceDefinition({
    faceId: "face-1",
    faceIndex: 1,
    faceType: IXI_CARD_FACE_TYPES.PRIMARY,
    label: "PRIMARY",
    layout: [
      { slotId: "identity", moduleType: "object-identity" },
      { slotId: "media", moduleType: "primary-media" },
      { slotId: "fields", moduleType: "object-fields" }
    ],
    metadata: {
      generated: true,
      objectId: getIXIAosObjectId(object)
    }
  });
}

export function createIXICardDefinition({
  cardDefinitionId = "",
  objectId = "",
  templateId = "",
  templateName = "",
  protectedTemplate = false,
  faces = [],
  capabilities = {},
  metadata = {}
} = {}) {
  const resolvedObjectId = clean(objectId);

  const resolvedFaces = safeArray(faces)
    .map((face, index) =>
      createIXICardFaceDefinition({
        ...safeObject(face),
        faceIndex: face?.faceIndex || index + 1
      })
    )
    .sort((a, b) => a.faceIndex - b.faceIndex);

  return {
    version: IXI_CARD_DEFINITION_VERSION,
    cardDefinitionId:
      clean(cardDefinitionId) ||
      (resolvedObjectId ? `card:${resolvedObjectId}` : ""),
    objectId: resolvedObjectId,
    templateId: clean(templateId),
    templateName: clean(templateName),
    protectedTemplate: Boolean(protectedTemplate),
    faces: resolvedFaces,
    capabilities: createDefaultIXICardCapabilities(capabilities),
    metadata: safeObject(metadata)
  };
}

export function getIXICardDefinitionFromObject(object = {}) {
  const embeddedDefinition =
    object.cardDefinition ||
    object.presentation?.cardDefinition ||
    object.metadata?.cardDefinition ||
    null;

  if (embeddedDefinition && typeof embeddedDefinition === "object") {
    return createIXICardDefinition({
      ...embeddedDefinition,
      objectId:
        getIXIAosObjectId(object) ||
        embeddedDefinition.objectId
    });
  }

  return null;
}

export function resolveIXICardDefinition({
  object = {},
  template = null,
  fallbackCapabilities = {}
} = {}) {
  const objectId = getIXIAosObjectId(object);
  const embeddedDefinition = getIXICardDefinitionFromObject(object);

  if (embeddedDefinition) {
    return embeddedDefinition;
  }

  if (template && typeof template === "object") {
    const templateDefinition = template.cardDefinition || template;

    return createIXICardDefinition({
      ...templateDefinition,
      objectId,
      templateId: clean(
        template.templateId ||
        templateDefinition?.templateId
      ),
      templateName: clean(
        template.displayName ||
        template.name ||
        templateDefinition?.templateName
      )
    });
  }

  return createIXICardDefinition({
    objectId,
    faces: [createDefaultIXIFaceOne({ object })],
    capabilities: createDefaultIXICardCapabilities(fallbackCapabilities),
    metadata: { generatedFallback: true }
  });
}

export function getIXICardFaces(cardDefinition = {}) {
  return safeArray(cardDefinition.faces);
}

export function getIXICardFaceByIndex(cardDefinition = {}, faceIndex = 1) {
  const index = Math.max(1, Number(faceIndex || 1));
  const faces = getIXICardFaces(cardDefinition);

  return (
    faces.find(face => Number(face.faceIndex) === index) ||
    faces[index - 1] ||
    faces[0] ||
    null
  );
}

export function getIXICardFaceCount(cardDefinition = {}) {
  return getIXICardFaces(cardDefinition).length;
}

export function getIXICardCapabilities(cardDefinition = {}) {
  return createDefaultIXICardCapabilities(cardDefinition.capabilities);
}

export function canIXICardContain(cardDefinition = {}) {
  return Boolean(getIXICardCapabilities(cardDefinition).canContain);
}

export function canIXICardCreate(cardDefinition = {}) {
  const capabilities = getIXICardCapabilities(cardDefinition);
  return Boolean(capabilities.canCreate || capabilities.canContain);
}

export function canIXICardTransact(cardDefinition = {}) {
  return Boolean(getIXICardCapabilities(cardDefinition).canTransact);
}

export function canIXICardReceiveDrop(cardDefinition = {}) {
  const capabilities = getIXICardCapabilities(cardDefinition);
  return Boolean(capabilities.canReceiveDrop || capabilities.canContain);
}

export function isIXICardDraggable(cardDefinition = {}) {
  return Boolean(getIXICardCapabilities(cardDefinition).draggable);
}

export function isIXICardSortable(cardDefinition = {}) {
  return Boolean(getIXICardCapabilities(cardDefinition).sortable);
}

export function createIXICardTemplate({
  templateId,
  displayName,
  faces = [],
  capabilities = {},
  protectedTemplate = false,
  metadata = {}
} = {}) {
  const id = clean(templateId);

  if (!id) {
    throw new Error("IXI Card Template requires templateId.");
  }

  return {
    templateId: id,
    displayName: clean(displayName) || "UNTITLED TEMPLATE",
    cardDefinition: createIXICardDefinition({
      templateId: id,
      templateName: clean(displayName),
      protectedTemplate,
      faces,
      capabilities,
      metadata
    })
  };
}

export function serializeIXICardDefinition(cardDefinition = {}) {
  return JSON.parse(JSON.stringify(createIXICardDefinition(cardDefinition)));
}

export function validateIXICardDefinition(cardDefinition = {}) {
  const definition = createIXICardDefinition(cardDefinition);
  const errors = [];

  if (!definition.objectId && !definition.templateId) {
    errors.push("Card Definition requires objectId or templateId.");
  }

  if (definition.faces.length === 0) {
    errors.push("Card Definition requires at least one Face.");
  }

  const faceIds = new Set();

  definition.faces.forEach(face => {
    if (faceIds.has(face.faceId)) {
      errors.push(`Duplicate faceId: ${face.faceId}`);
    }
    faceIds.add(face.faceId);
  });

  return {
    valid: errors.length === 0,
    errors,
    definition
  };
}

export default {
  IXI_CARD_DEFINITION_VERSION,
  IXI_CARD_FACE_TYPES,
  IXI_CARD_CAPABILITIES,
  getIXIAosObjectId,
  getIXIAosObjectName,
  createDefaultIXICardCapabilities,
  createIXICardFaceDefinition,
  createDefaultIXIFaceOne,
  createIXICardDefinition,
  getIXICardDefinitionFromObject,
  resolveIXICardDefinition,
  getIXICardFaces,
  getIXICardFaceByIndex,
  getIXICardFaceCount,
  getIXICardCapabilities,
  canIXICardContain,
  canIXICardCreate,
  canIXICardTransact,
  canIXICardReceiveDrop,
  isIXICardDraggable,
  isIXICardSortable,
  createIXICardTemplate,
  serializeIXICardDefinition,
  validateIXICardDefinition
};
