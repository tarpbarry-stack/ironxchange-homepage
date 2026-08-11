import {
  createIXICardDefinition,
  createIXICardFaceDefinition,
  createDefaultIXICardCapabilities,
  resolveIXICardDefinition,
  serializeIXICardDefinition,
  validateIXICardDefinition,
  getIXIAosObjectId,
  getIXIAosObjectName
} from "../card-runtime/IXICardDefinitionEngine";


/*
 * IXI OBJECT STUDIO DRAFT ENGINE
 *
 * PURPOSE
 * -------
 * Object Studio edits TWO separate truths:
 *
 * 1. OBJECT DATA
 *    What the Object actually is / knows.
 *
 * 2. CARD DEFINITION
 *    How that Object is presented and operated.
 *
 * Those must never be collapsed together.
 *
 *
 * OBJECT STUDIO V1 DOCTRINE
 * -------------------------
 *
 * - User names Objects.
 * - AOS does not require a noun/taxonomy first.
 * - Face 1 is the primary Card face.
 * - Additional Faces belong to the same Card.
 * - Faces can be reordered.
 * - Modules can be added/reordered/removed.
 * - Capabilities are independent of Object meaning.
 * - Templates are reusable starting designs.
 * - Templates do not own created Objects.
 * - Studio works against draft state first.
 * - AWS persistence comes after the contract is proven.
 */


/* =========================================================
   VERSION
   ========================================================= */

export const IXI_OBJECT_STUDIO_DRAFT_VERSION =
  "ixi-object-studio-draft-v1";


/* =========================================================
   TEMPLATE SOURCE SCOPES
   ========================================================= */

export const IXI_TEMPLATE_SCOPES =
  Object.freeze({
    NONE:
      "none",

    IXI:
      "ixi",

    USER:
      "user",

    ENTITY:
      "entity",

    COMMUNITY:
      "community"
  });


/* =========================================================
   STUDIO SELECTION TYPES
   ========================================================= */

export const IXI_STUDIO_SELECTION_TYPES =
  Object.freeze({
    CARD:
      "card",

    FACE:
      "face",

    MODULE:
      "module",

    OBJECT:
      "object"
  });


/* =========================================================
   COMMON FIELD TYPES
   ========================================================= */

/*
 * These are data/input types.
 *
 * They are NOT Object types.
 */
export const IXI_OBJECT_FIELD_TYPES =
  Object.freeze({
    TEXT:
      "text",

    NUMBER:
      "number",

    MONEY:
      "money",

    DATE:
      "date",

    DATETIME:
      "datetime",

    BOOLEAN:
      "boolean",

    ADDRESS:
      "address",

    EMAIL:
      "email",

    PHONE:
      "phone",

    URL:
      "url",

    ID:
      "id",

    SELECT:
      "select",

    MULTI_SELECT:
      "multi-select",

    JSON:
      "json"
  });


/* =========================================================
   HELPERS
   ========================================================= */

function clean(
  value
) {
  return String(
    value || ""
  ).trim();
}


function cleanLower(
  value
) {
  return clean(
    value
  ).toLowerCase();
}


function safeObject(
  value
) {
  return (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
  )
    ? value
    : {};
}


function safeArray(
  value
) {
  return Array.isArray(
    value
  )
    ? value
    : [];
}


function clone(
  value
) {
  return JSON.parse(
    JSON.stringify(
      value
    )
  );
}


function nowIso() {
  return new Date()
    .toISOString();
}


function makeDraftId(
  prefix = "draft"
) {
  const random =
    Math.random()
      .toString(36)
      .slice(2, 10);

  return [
    prefix,
    Date.now(),
    random
  ].join(":");
}


function normalizeIndex(
  index,
  length
) {
  const count =
    Math.max(
      0,
      Number(
        length || 0
      )
    );


  if (
    count === 0
  ) {
    return 0;
  }


  const numeric =
    Number(
      index
    );


  if (
    !Number.isFinite(
      numeric
    )
  ) {
    return 0;
  }


  return Math.min(
    count - 1,

    Math.max(
      0,
      numeric
    )
  );
}


function moveArrayItem(
  items,
  fromIndex,
  toIndex
) {
  const source =
    safeArray(
      items
    );


  if (
    source.length <= 1
  ) {
    return [
      ...source
    ];
  }


  const from =
    normalizeIndex(
      fromIndex,
      source.length
    );


  const to =
    normalizeIndex(
      toIndex,
      source.length
    );


  if (
    from === to
  ) {
    return [
      ...source
    ];
  }


  const next =
    [
      ...source
    ];


  const [
    moved
  ] =
    next.splice(
      from,
      1
    );


  next.splice(
    to,
    0,
    moved
  );


  return next;
}


/* =========================================================
   OBJECT FIELD DEFINITION
   ========================================================= */

/*
 * Object data and field definitions are separate.
 *
 * Example:
 *
 * field definition:
 * {
 *   fieldId: "vin",
 *   label: "VIN",
 *   fieldType: "text",
 *   searchable: true
 * }
 *
 * Object data:
 * fields.vin = "1FT8W3..."
 */
export function createIXIObjectFieldDefinition({
  fieldId = "",
  label = "",
  fieldType =
    IXI_OBJECT_FIELD_TYPES.TEXT,

  searchable = true,
  required = false,
  showWhenEmpty = false,

  options = [],

  metadata = {}
} = {}) {

  const resolvedId =
    clean(
      fieldId
    ) ||
    makeDraftId(
      "field"
    );


  return {
    fieldId:
      resolvedId,

    label:
      clean(
        label
      ) ||
      "UNTITLED FIELD",

    fieldType:
      cleanLower(
        fieldType
      ) ||
      IXI_OBJECT_FIELD_TYPES.TEXT,

    searchable:
      Boolean(
        searchable
      ),

    required:
      Boolean(
        required
      ),

    showWhenEmpty:
      Boolean(
        showWhenEmpty
      ),

    options:
      safeArray(
        options
      ),

    metadata:
      safeObject(
        metadata
      )
  };
}


/* =========================================================
   STUDIO MODULE DEFINITION
   ========================================================= */

/*
 * Modules are presentation definitions.
 *
 * They may read:
 * - Object fields
 * - relationships
 * - media
 * - future transaction systems
 *
 * Module config does NOT own the actual
 * transaction records.
 */
export function createIXIStudioModule({
  moduleId = "",
  moduleType = "object-field",

  label = "",

  fieldId = "",

  config = {},

  metadata = {}
} = {}) {

  return {
    moduleId:
      clean(
        moduleId
      ) ||
      makeDraftId(
        "module"
      ),

    moduleType:
      cleanLower(
        moduleType
      ) ||
      "custom",

    label:
      clean(
        label
      ),

    fieldId:
      clean(
        fieldId
      ),

    config:
      safeObject(
        config
      ),

    metadata:
      safeObject(
        metadata
      )
  };
}


/* =========================================================
   OBJECT DRAFT
   ========================================================= */

export function createIXIObjectDraft({
  object = null,
  objectId = "",
  displayName = "",
  fields = {},
  fieldDefinitions = [],
  media = [],
  metadata = {}
} = {}) {

  const sourceObject =
    safeObject(
      object
    );


  const resolvedObjectId =
    clean(
      objectId
    ) ||
    getIXIAosObjectId(
      sourceObject
    ) ||
    makeDraftId(
      "object"
    );


  return {
    objectId:
      resolvedObjectId,

    displayName:
      clean(
        displayName
      ) ||
      (
        Object.keys(
          sourceObject
        ).length
          ? getIXIAosObjectName(
              sourceObject
            )
          : "UNTITLED OBJECT"
      ),

    fields: {
      ...safeObject(
        sourceObject.fields
      ),

      ...safeObject(
        fields
      )
    },

    fieldDefinitions:
      safeArray(
        fieldDefinitions.length
          ? fieldDefinitions
          : sourceObject
              ?.fieldDefinitions
      )
        .map(
          definition =>
            createIXIObjectFieldDefinition(
              definition
            )
        ),

    media:
      safeArray(
        media.length
          ? media
          : sourceObject.media
      ),

    metadata: {
      ...safeObject(
        sourceObject.metadata
      ),

      ...safeObject(
        metadata
      )
    }
  };
}


/* =========================================================
   TEMPLATE SOURCE
   ========================================================= */

export function createIXITemplateSource({
  scope =
    IXI_TEMPLATE_SCOPES.NONE,

  templateId = "",

  templateName = "",

  sourceEntityId = "",

  sourceUserId = "",

  forkedFromTemplateId = ""
} = {}) {

  return {
    scope:
      cleanLower(
        scope
      ) ||
      IXI_TEMPLATE_SCOPES.NONE,

    templateId:
      clean(
        templateId
      ),

    templateName:
      clean(
        templateName
      ),

    sourceEntityId:
      clean(
        sourceEntityId
      ),

    sourceUserId:
      clean(
        sourceUserId
      ),

    forkedFromTemplateId:
      clean(
        forkedFromTemplateId
      )
  };
}


/* =========================================================
   INITIAL STUDIO DRAFT
   ========================================================= */

export function createIXIObjectStudioDraft({
  object = null,

  objectDraft = null,

  cardDefinition = null,

  template = null,

  templateSource = null,

  mode = "create"
} = {}) {

  const resolvedObjectDraft =
    objectDraft
      ? createIXIObjectDraft(
          objectDraft
        )
      : createIXIObjectDraft({
          object
        });


  const resolvedCardDefinition =
    cardDefinition
      ? createIXICardDefinition({
          ...cardDefinition,

          objectId:
            resolvedObjectDraft
              .objectId
        })
      : resolveIXICardDefinition({
          object:
            resolvedObjectDraft,

          template
        });


  /*
   * Studio needs at least one Face.
   */
  const cardDefinitionWithFace =
    resolvedCardDefinition
      .faces
      .length
        ? resolvedCardDefinition
        : createIXICardDefinition({
            ...resolvedCardDefinition,

            objectId:
              resolvedObjectDraft
                .objectId,

            faces: [
              createIXICardFaceDefinition({
                faceId:
                  "face-1",

                faceIndex:
                  1,

                faceType:
                  "primary",

                label:
                  "FACE 1",

                layout: []
              })
            ]
          });


  const firstFace =
    cardDefinitionWithFace
      .faces[0] ||
    null;


  const timestamp =
    nowIso();


  return {
    version:
      IXI_OBJECT_STUDIO_DRAFT_VERSION,

    draftId:
      makeDraftId(
        "studio"
      ),

    mode:
      cleanLower(
        mode
      ) ||
      "create",

    objectDraft:
      resolvedObjectDraft,

    cardDefinitionDraft:
      serializeIXICardDefinition(
        cardDefinitionWithFace
      ),

    templateSource:
      createIXITemplateSource(
        templateSource || {
          scope:
            template
              ? IXI_TEMPLATE_SCOPES.IXI
              : IXI_TEMPLATE_SCOPES.NONE,

          templateId:
            template?.templateId ||
            template
              ?.cardDefinition
              ?.templateId ||
            "",

          templateName:
            template?.displayName ||
            template
              ?.cardDefinition
              ?.templateName ||
            ""
        }
      ),

    selection: {
      selectionType:
        IXI_STUDIO_SELECTION_TYPES.CARD,

      faceId:
        firstFace
          ?.faceId ||
        "",

      moduleId:
        ""
    },

    dirty:
      false,

    revision:
      0,

    createdAt:
      timestamp,

    updatedAt:
      timestamp,

    lastCommittedAt:
      null,

    metadata: {
      studioVersion:
        1
    }
  };
}


/* =========================================================
   DRAFT NORMALIZATION
   ========================================================= */

export function normalizeIXIObjectStudioDraft(
  draft = {}
) {

  const source =
    safeObject(
      draft
    );


  const objectDraft =
    createIXIObjectDraft(
      source.objectDraft
    );


  const cardDefinitionDraft =
    createIXICardDefinition({
      ...safeObject(
        source.cardDefinitionDraft
      ),

      objectId:
        objectDraft.objectId
    });


  const firstFace =
    cardDefinitionDraft
      .faces[0] ||
    null;


  return {
    version:
      IXI_OBJECT_STUDIO_DRAFT_VERSION,

    draftId:
      clean(
        source.draftId
      ) ||
      makeDraftId(
        "studio"
      ),

    mode:
      cleanLower(
        source.mode
      ) ||
      "create",

    objectDraft,

    cardDefinitionDraft,

    templateSource:
      createIXITemplateSource(
        source.templateSource
      ),

    selection: {
      selectionType:
        cleanLower(
          source.selection
            ?.selectionType
        ) ||
        IXI_STUDIO_SELECTION_TYPES.CARD,

      faceId:
        clean(
          source.selection
            ?.faceId
        ) ||
        firstFace
          ?.faceId ||
        "",

      moduleId:
        clean(
          source.selection
            ?.moduleId
        )
    },

    dirty:
      Boolean(
        source.dirty
      ),

    revision:
      Number(
        source.revision ||
        0
      ),

    createdAt:
      source.createdAt ||
      nowIso(),

    updatedAt:
      source.updatedAt ||
      nowIso(),

    lastCommittedAt:
      source.lastCommittedAt ||
      null,

    metadata:
      safeObject(
        source.metadata
      )
  };
}


/* =========================================================
   INTERNAL MUTATION WRAPPER
   ========================================================= */

function mutateDraft(
  draft,
  mutator
) {

  const current =
    normalizeIXIObjectStudioDraft(
      draft
    );


  const next =
    clone(
      current
    );


  mutator?.(
    next
  );


  next.dirty =
    true;

  next.revision =
    Number(
      current.revision ||
      0
    ) + 1;

  next.updatedAt =
    nowIso();


  return normalizeIXIObjectStudioDraft(
    next
  );
}


/* =========================================================
   OBJECT IDENTITY EDITS
   ========================================================= */

export function setIXIStudioObjectName(
  draft,
  displayName
) {

  return mutateDraft(
    draft,
    next => {

      next.objectDraft
        .displayName =
        clean(
          displayName
        ) ||
        "UNTITLED OBJECT";
    }
  );
}


/* =========================================================
   OBJECT FIELD DATA
   ========================================================= */

export function setIXIStudioObjectFieldValue(
  draft,
  fieldId,
  value
) {

  const id =
    clean(
      fieldId
    );


  if (!id) {
    return draft;
  }


  return mutateDraft(
    draft,
    next => {

      next.objectDraft.fields[
        id
      ] =
        value;
    }
  );
}


export function removeIXIStudioObjectFieldValue(
  draft,
  fieldId
) {

  const id =
    clean(
      fieldId
    );


  if (!id) {
    return draft;
  }


  return mutateDraft(
    draft,
    next => {

      delete next
        .objectDraft
        .fields[
          id
        ];
    }
  );
}


/* =========================================================
   FIELD DEFINITIONS
   ========================================================= */

export function addIXIStudioFieldDefinition(
  draft,
  definition = {},
  initialValue = ""
) {

  return mutateDraft(
    draft,
    next => {

      const field =
        createIXIObjectFieldDefinition(
          definition
        );


      const exists =
        next.objectDraft
          .fieldDefinitions
          .some(
            existing =>
              existing.fieldId ===
              field.fieldId
          );


      if (
        !exists
      ) {
        next.objectDraft
          .fieldDefinitions
          .push(
            field
          );
      }


      if (
        !Object.prototype
          .hasOwnProperty
          .call(
            next.objectDraft
              .fields,
            field.fieldId
          )
      ) {
        next.objectDraft
          .fields[
            field.fieldId
          ] =
          initialValue;
      }
    }
  );
}


export function updateIXIStudioFieldDefinition(
  draft,
  fieldId,
  patch = {}
) {

  const id =
    clean(
      fieldId
    );


  if (!id) {
    return draft;
  }


  return mutateDraft(
    draft,
    next => {

      next.objectDraft
        .fieldDefinitions =
        next.objectDraft
          .fieldDefinitions
          .map(
            field =>
              field.fieldId === id
                ? createIXIObjectFieldDefinition({
                    ...field,
                    ...safeObject(
                      patch
                    ),
                    fieldId:
                      id
                  })
                : field
          );
    }
  );
}


export function removeIXIStudioFieldDefinition(
  draft,
  fieldId,
  {
    removeValue = true,
    removeModules = false
  } = {}
) {

  const id =
    clean(
      fieldId
    );


  if (!id) {
    return draft;
  }


  return mutateDraft(
    draft,
    next => {

      next.objectDraft
        .fieldDefinitions =
        next.objectDraft
          .fieldDefinitions
          .filter(
            field =>
              field.fieldId !==
              id
          );


      if (
        removeValue
      ) {
        delete next
          .objectDraft
          .fields[
            id
          ];
      }


      if (
        removeModules
      ) {
        next.cardDefinitionDraft
          .faces =
          next.cardDefinitionDraft
            .faces
            .map(
              face => ({
                ...face,

                layout:
                  safeArray(
                    face.layout
                  )
                    .filter(
                      module =>
                        module
                          ?.fieldId !==
                        id
                    ),

                modules:
                  safeArray(
                    face.modules
                  )
                    .filter(
                      module =>
                        module
                          ?.fieldId !==
                        id
                    )
              })
            );
      }
    }
  );
}


/* =========================================================
   MEDIA
   ========================================================= */

export function setIXIStudioMedia(
  draft,
  media = []
) {

  return mutateDraft(
    draft,
    next => {

      next.objectDraft.media =
        safeArray(
          media
        );
    }
  );
}


export function addIXIStudioMedia(
  draft,
  mediaItem
) {

  if (
    !mediaItem
  ) {
    return draft;
  }


  return mutateDraft(
    draft,
    next => {

      next.objectDraft
        .media
        .push(
          mediaItem
        );
    }
  );
}


export function removeIXIStudioMediaAtIndex(
  draft,
  index
) {

  return mutateDraft(
    draft,
    next => {

      const resolvedIndex =
        normalizeIndex(
          index,
          next.objectDraft
            .media
            .length
        );


      next.objectDraft
        .media
        .splice(
          resolvedIndex,
          1
        );
    }
  );
}


/* =========================================================
   FACE LOOKUP
   ========================================================= */

export function getIXIStudioFace(
  draft,
  faceId
) {

  const id =
    clean(
      faceId
    );


  return normalizeIXIObjectStudioDraft(
    draft
  )
    .cardDefinitionDraft
    .faces
    .find(
      face =>
        face.faceId ===
        id
    ) ||
    null;
}


export function getIXIStudioSelectedFace(
  draft
) {

  const normalized =
    normalizeIXIObjectStudioDraft(
      draft
    );


  return (
    normalized
      .cardDefinitionDraft
      .faces
      .find(
        face =>
          face.faceId ===
          normalized.selection
            .faceId
      ) ||

    normalized
      .cardDefinitionDraft
      .faces[0] ||

    null
  );
}


/* =========================================================
   FACE CREATION
   ========================================================= */

export function addIXIStudioFace(
  draft,
  face = {}
) {

  return mutateDraft(
    draft,
    next => {

      const nextIndex =
        next.cardDefinitionDraft
          .faces
          .length + 1;


      const createdFace =
        createIXICardFaceDefinition({
          faceId:
            clean(
              face.faceId
            ) ||
            makeDraftId(
              "face"
            ),

          faceIndex:
            nextIndex,

          faceType:
            face.faceType ||
            (
              nextIndex === 1
                ? "primary"
                : "custom"
            ),

          label:
            clean(
              face.label
            ) ||
            `FACE ${nextIndex}`,

          layout:
            safeArray(
              face.layout
            ),

          modules:
            safeArray(
              face.modules
            ),

          metadata:
            safeObject(
              face.metadata
            )
        });


      next.cardDefinitionDraft
        .faces
        .push(
          createdFace
        );


      next.selection = {
        selectionType:
          IXI_STUDIO_SELECTION_TYPES.FACE,

        faceId:
          createdFace.faceId,

        moduleId:
          ""
      };
    }
  );
}


/* =========================================================
   FACE UPDATE
   ========================================================= */

export function updateIXIStudioFace(
  draft,
  faceId,
  patch = {}
) {

  const id =
    clean(
      faceId
    );


  if (!id) {
    return draft;
  }


  return mutateDraft(
    draft,
    next => {

      next.cardDefinitionDraft
        .faces =
        next.cardDefinitionDraft
          .faces
          .map(
            face =>
              face.faceId === id
                ? createIXICardFaceDefinition({
                    ...face,
                    ...safeObject(
                      patch
                    ),

                    faceId:
                      id,

                    faceIndex:
                      face.faceIndex
                  })
                : face
          );
    }
  );
}


/* =========================================================
   FACE DELETE
   ========================================================= */

export function removeIXIStudioFace(
  draft,
  faceId
) {

  const id =
    clean(
      faceId
    );


  const normalized =
    normalizeIXIObjectStudioDraft(
      draft
    );


  /*
   * A Card must always have Face 1.
   */
  if (
    normalized
      .cardDefinitionDraft
      .faces
      .length <= 1
  ) {
    return normalized;
  }


  return mutateDraft(
    normalized,
    next => {

      next.cardDefinitionDraft
        .faces =
        next.cardDefinitionDraft
          .faces
          .filter(
            face =>
              face.faceId !==
              id
          )
          .map(
            (
              face,
              index
            ) =>
              createIXICardFaceDefinition({
                ...face,

                faceIndex:
                  index + 1,

                /*
                 * First physical position
                 * becomes primary Face.
                 */
                faceType:
                  index === 0
                    ? "primary"
                    : (
                        face.faceType ===
                        "primary"
                          ? "custom"
                          : face.faceType
                      )
              })
          );


      const selectedFaceExists =
        next.cardDefinitionDraft
          .faces
          .some(
            face =>
              face.faceId ===
              next.selection.faceId
          );


      if (
        !selectedFaceExists
      ) {
        next.selection = {
          selectionType:
            IXI_STUDIO_SELECTION_TYPES.FACE,

          faceId:
            next.cardDefinitionDraft
              .faces[0]
              ?.faceId ||
            "",

          moduleId:
            ""
        };
      }
    }
  );
}


/* =========================================================
   FACE REORDER
   ========================================================= */

export function reorderIXIStudioFace(
  draft,
  fromIndex,
  toIndex
) {

  return mutateDraft(
    draft,
    next => {

      const reordered =
        moveArrayItem(
          next.cardDefinitionDraft
            .faces,

          fromIndex,

          toIndex
        );


      next.cardDefinitionDraft
        .faces =
        reordered.map(
          (
            face,
            index
          ) =>
            createIXICardFaceDefinition({
              ...face,

              faceIndex:
                index + 1,

              /*
               * POSITION defines Face 1.
               */
              faceType:
                index === 0
                  ? "primary"
                  : (
                      face.faceType ===
                      "primary"
                        ? "custom"
                        : face.faceType
                    )
            })
        );
    }
  );
}


/* =========================================================
   FACE DUPLICATE
   ========================================================= */

export function duplicateIXIStudioFace(
  draft,
  faceId
) {

  const id =
    clean(
      faceId
    );


  return mutateDraft(
    draft,
    next => {

      const sourceFace =
        next.cardDefinitionDraft
          .faces
          .find(
            face =>
              face.faceId ===
              id
          );


      if (
        !sourceFace
      ) {
        return;
      }


      const copyIndex =
        next.cardDefinitionDraft
          .faces
          .length + 1;


      const copy =
        createIXICardFaceDefinition({
          ...clone(
            sourceFace
          ),

          faceId:
            makeDraftId(
              "face"
            ),

          faceIndex:
            copyIndex,

          faceType:
            "custom",

          label:
            `${sourceFace.label || "FACE"} COPY`
        });


      copy.layout =
        safeArray(
          copy.layout
        ).map(
          module => ({
            ...module,

            moduleId:
              makeDraftId(
                "module"
              )
          })
        );


      copy.modules =
        safeArray(
          copy.modules
        ).map(
          module => ({
            ...module,

            moduleId:
              makeDraftId(
                "module"
              )
          })
        );


      next.cardDefinitionDraft
        .faces
        .push(
          copy
        );


      next.selection = {
        selectionType:
          IXI_STUDIO_SELECTION_TYPES.FACE,

        faceId:
          copy.faceId,

        moduleId:
          ""
      };
    }
  );
}


/* =========================================================
   MODULE LOOKUP
   ========================================================= */

export function getIXIStudioSelectedModule(
  draft
) {

  const normalized =
    normalizeIXIObjectStudioDraft(
      draft
    );


  const face =
    getIXIStudioSelectedFace(
      normalized
    );


  if (
    !face
  ) {
    return null;
  }


  const moduleId =
    clean(
      normalized.selection
        .moduleId
    );


  if (
    !moduleId
  ) {
    return null;
  }


  return safeArray(
    face.layout
  ).find(
    module =>
      module.moduleId ===
      moduleId
  ) || null;
}


/* =========================================================
   MODULE ADD
   ========================================================= */

export function addIXIStudioModule({
  draft,
  faceId,
  module
} = {}) {

  const resolvedFaceId =
    clean(
      faceId
    );


  if (
    !resolvedFaceId
  ) {
    return draft;
  }


  return mutateDraft(
    draft,
    next => {

      const createdModule =
        createIXIStudioModule(
          module
        );


      next.cardDefinitionDraft
        .faces =
        next.cardDefinitionDraft
          .faces
          .map(
            face => {

              if (
                face.faceId !==
                resolvedFaceId
              ) {
                return face;
              }


              return {
                ...face,

                layout: [
                  ...safeArray(
                    face.layout
                  ),

                  createdModule
                ]
              };
            }
          );


      next.selection = {
        selectionType:
          IXI_STUDIO_SELECTION_TYPES.MODULE,

        faceId:
          resolvedFaceId,

        moduleId:
          createdModule.moduleId
      };
    }
  );
}


/* =========================================================
   MODULE UPDATE
   ========================================================= */

export function updateIXIStudioModule({
  draft,
  faceId,
  moduleId,
  patch = {}
} = {}) {

  const resolvedFaceId =
    clean(
      faceId
    );


  const resolvedModuleId =
    clean(
      moduleId
    );


  if (
    !resolvedFaceId ||
    !resolvedModuleId
  ) {
    return draft;
  }


  return mutateDraft(
    draft,
    next => {

      next.cardDefinitionDraft
        .faces =
        next.cardDefinitionDraft
          .faces
          .map(
            face => {

              if (
                face.faceId !==
                resolvedFaceId
              ) {
                return face;
              }


              return {
                ...face,

                layout:
                  safeArray(
                    face.layout
                  )
                    .map(
                      module =>
                        module.moduleId ===
                        resolvedModuleId
                          ? createIXIStudioModule({
                              ...module,

                              ...safeObject(
                                patch
                              ),

                              moduleId:
                                resolvedModuleId
                            })
                          : module
                    )
              };
            }
          );
    }
  );
}


/* =========================================================
   MODULE REMOVE
   ========================================================= */

export function removeIXIStudioModule({
  draft,
  faceId,
  moduleId
} = {}) {

  const resolvedFaceId =
    clean(
      faceId
    );


  const resolvedModuleId =
    clean(
      moduleId
    );


  if (
    !resolvedFaceId ||
    !resolvedModuleId
  ) {
    return draft;
  }


  return mutateDraft(
    draft,
    next => {

      next.cardDefinitionDraft
        .faces =
        next.cardDefinitionDraft
          .faces
          .map(
            face => {

              if (
                face.faceId !==
                resolvedFaceId
              ) {
                return face;
              }


              return {
                ...face,

                layout:
                  safeArray(
                    face.layout
                  )
                    .filter(
                      module =>
                        module.moduleId !==
                        resolvedModuleId
                    )
              };
            }
          );


      if (
        next.selection
          .moduleId ===
        resolvedModuleId
      ) {
        next.selection = {
          selectionType:
            IXI_STUDIO_SELECTION_TYPES.FACE,

          faceId:
            resolvedFaceId,

          moduleId:
            ""
        };
      }
    }
  );
}


/* =========================================================
   MODULE REORDER
   ========================================================= */

export function reorderIXIStudioModule({
  draft,
  faceId,
  fromIndex,
  toIndex
} = {}) {

  const resolvedFaceId =
    clean(
      faceId
    );


  if (
    !resolvedFaceId
  ) {
    return draft;
  }


  return mutateDraft(
    draft,
    next => {

      next.cardDefinitionDraft
        .faces =
        next.cardDefinitionDraft
          .faces
          .map(
            face =>
              face.faceId ===
                resolvedFaceId
                ? {
                    ...face,

                    layout:
                      moveArrayItem(
                        safeArray(
                          face.layout
                        ),

                        fromIndex,

                        toIndex
                      )
                  }
                : face
          );
    }
  );
}


/* =========================================================
   CAPABILITIES
   ========================================================= */

export function setIXIStudioCapability(
  draft,
  capabilityName,
  value
) {

  const name =
    clean(
      capabilityName
    );


  if (
    !name
  ) {
    return draft;
  }


  return mutateDraft(
    draft,
    next => {

      next.cardDefinitionDraft
        .capabilities =
        createDefaultIXICardCapabilities({
          ...safeObject(
            next.cardDefinitionDraft
              .capabilities
          ),

          [name]:
            value
        });
    }
  );
}


/* =========================================================
   TEMPLATE SOURCE
   ========================================================= */

export function setIXIStudioTemplateSource(
  draft,
  templateSource
) {

  return mutateDraft(
    draft,
    next => {

      next.templateSource =
        createIXITemplateSource(
          templateSource
        );
    }
  );
}


/* =========================================================
   SELECTION
   ========================================================= */

export function selectIXIStudioCard(
  draft
) {

  const next =
    normalizeIXIObjectStudioDraft(
      draft
    );


  return {
    ...next,

    selection: {
      selectionType:
        IXI_STUDIO_SELECTION_TYPES.CARD,

      faceId:
        next.selection
          ?.faceId ||
        next.cardDefinitionDraft
          .faces[0]
          ?.faceId ||
        "",

      moduleId:
        ""
    }
  };
}


export function selectIXIStudioFace(
  draft,
  faceId
) {

  const id =
    clean(
      faceId
    );


  const next =
    normalizeIXIObjectStudioDraft(
      draft
    );


  const exists =
    next.cardDefinitionDraft
      .faces
      .some(
        face =>
          face.faceId === id
      );


  if (
    !exists
  ) {
    return next;
  }


  return {
    ...next,

    selection: {
      selectionType:
        IXI_STUDIO_SELECTION_TYPES.FACE,

      faceId:
        id,

      moduleId:
        ""
    }
  };
}


export function selectIXIStudioModule(
  draft,
  faceId,
  moduleId
) {

  const resolvedFaceId =
    clean(
      faceId
    );


  const resolvedModuleId =
    clean(
      moduleId
    );


  const next =
    normalizeIXIObjectStudioDraft(
      draft
    );


  return {
    ...next,

    selection: {
      selectionType:
        IXI_STUDIO_SELECTION_TYPES.MODULE,

      faceId:
        resolvedFaceId,

      moduleId:
        resolvedModuleId
    }
  };
}


/* =========================================================
   APPLY TEMPLATE
   ========================================================= */

/*
 * Templates FORK.
 *
 * Applying a template copies the Card
 * Definition into the Object's draft.
 *
 * Future changes to the original template
 * do not silently mutate this Object.
 */
export function applyIXIStudioTemplate({
  draft,
  template,
  templateSource = null
} = {}) {

  if (
    !template
  ) {
    return draft;
  }


  return mutateDraft(
    draft,
    next => {

      const resolved =
        resolveIXICardDefinition({
          object:
            next.objectDraft,

          template
        });


      next.cardDefinitionDraft =
        serializeIXICardDefinition({
          ...resolved,

          objectId:
            next.objectDraft
              .objectId
        });


      next.templateSource =
        createIXITemplateSource(
          templateSource || {
            scope:
              IXI_TEMPLATE_SCOPES.IXI,

            templateId:
              template.templateId ||
              resolved.templateId,

            templateName:
              template.displayName ||
              resolved.templateName,

            forkedFromTemplateId:
              template.templateId ||
              resolved.templateId
          }
        );


      next.selection = {
        selectionType:
          IXI_STUDIO_SELECTION_TYPES.CARD,

        faceId:
          next.cardDefinitionDraft
            .faces[0]
            ?.faceId ||
          "",

        moduleId:
          ""
      };
    }
  );
}


/* =========================================================
   SERIALIZE FOR LIVE CARD PREVIEW
   ========================================================= */

export function getIXIStudioPreviewObject(
  draft
) {

  const normalized =
    normalizeIXIObjectStudioDraft(
      draft
    );


  return clone(
    normalized.objectDraft
  );
}


export function getIXIStudioPreviewCardDefinition(
  draft
) {

  const normalized =
    normalizeIXIObjectStudioDraft(
      draft
    );


  return serializeIXICardDefinition(
    normalized.cardDefinitionDraft
  );
}


/* =========================================================
   VALIDATION
   ========================================================= */

export function validateIXIObjectStudioDraft(
  draft
) {

  const normalized =
    normalizeIXIObjectStudioDraft(
      draft
    );


  const errors =
    [];


  if (
    !clean(
      normalized.objectDraft
        .objectId
    )
  ) {
    errors.push(
      "Object requires objectId."
    );
  }


  if (
    !clean(
      normalized.objectDraft
        .displayName
    )
  ) {
    errors.push(
      "Object requires displayName."
    );
  }


  const cardValidation =
    validateIXICardDefinition(
      normalized.cardDefinitionDraft
    );


  if (
    !cardValidation.valid
  ) {
    errors.push(
      ...cardValidation.errors
    );
  }


  const fieldIds =
    new Set();


  normalized.objectDraft
    .fieldDefinitions
    .forEach(
      field => {

        if (
          fieldIds.has(
            field.fieldId
          )
        ) {
          errors.push(
            `Duplicate fieldId: ${field.fieldId}`
          );
        }


        fieldIds.add(
          field.fieldId
        );
      }
    );


  return {
    valid:
      errors.length === 0,

    errors,

    draft:
      normalized
  };
}


/* =========================================================
   LAUNCH PAYLOAD
   ========================================================= */

/*
 * This becomes the boundary to IX-Core.
 *
 * IMPORTANT:
 * We are defining the payload NOW,
 * before wiring AWS.
 *
 * Once Studio proves the contract,
 * IX-Core can persist this shape behind
 * stable routes/adapters.
 */
export function buildIXIObjectStudioLaunchPayload(
  draft
) {

  const validation =
    validateIXIObjectStudioDraft(
      draft
    );


  if (
    !validation.valid
  ) {
    return {
      ok:
        false,

      errors:
        validation.errors,

      payload:
        null
    };
  }


  const normalized =
    validation.draft;


  return {
    ok:
      true,

    errors:
      [],

    payload: {
      contractVersion:
        "ixi-object-launch-v1",

      object:
        clone(
          normalized.objectDraft
        ),

      cardDefinition:
        serializeIXICardDefinition(
          normalized
            .cardDefinitionDraft
        ),

      templateSource:
        clone(
          normalized.templateSource
        ),

      studio: {
        mode:
          normalized.mode,

        draftId:
          normalized.draftId,

        revision:
          normalized.revision
      }
    }
  };
}


/* =========================================================
   COMMIT MARKER
   ========================================================= */

export function markIXIStudioDraftCommitted(
  draft
) {

  const normalized =
    normalizeIXIObjectStudioDraft(
      draft
    );


  return {
    ...normalized,

    dirty:
      false,

    lastCommittedAt:
      nowIso(),

    updatedAt:
      nowIso()
  };
}


/* =========================================================
   DRAFT SNAPSHOT
   ========================================================= */

export function serializeIXIObjectStudioDraft(
  draft
) {

  return clone(
    normalizeIXIObjectStudioDraft(
      draft
    )
  );
}


/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

export default {
  IXI_OBJECT_STUDIO_DRAFT_VERSION,

  IXI_TEMPLATE_SCOPES,

  IXI_STUDIO_SELECTION_TYPES,

  IXI_OBJECT_FIELD_TYPES,

  createIXIObjectFieldDefinition,
  createIXIStudioModule,

  createIXIObjectDraft,
  createIXITemplateSource,

  createIXIObjectStudioDraft,
  normalizeIXIObjectStudioDraft,

  setIXIStudioObjectName,

  setIXIStudioObjectFieldValue,
  removeIXIStudioObjectFieldValue,

  addIXIStudioFieldDefinition,
  updateIXIStudioFieldDefinition,
  removeIXIStudioFieldDefinition,

  setIXIStudioMedia,
  addIXIStudioMedia,
  removeIXIStudioMediaAtIndex,

  getIXIStudioFace,
  getIXIStudioSelectedFace,

  addIXIStudioFace,
  updateIXIStudioFace,
  removeIXIStudioFace,
  reorderIXIStudioFace,
  duplicateIXIStudioFace,

  getIXIStudioSelectedModule,

  addIXIStudioModule,
  updateIXIStudioModule,
  removeIXIStudioModule,
  reorderIXIStudioModule,

  setIXIStudioCapability,

  setIXIStudioTemplateSource,
  applyIXIStudioTemplate,

  selectIXIStudioCard,
  selectIXIStudioFace,
  selectIXIStudioModule,

  getIXIStudioPreviewObject,
  getIXIStudioPreviewCardDefinition,

  validateIXIObjectStudioDraft,

  buildIXIObjectStudioLaunchPayload,
  markIXIStudioDraftCommitted,

  serializeIXIObjectStudioDraft
};
