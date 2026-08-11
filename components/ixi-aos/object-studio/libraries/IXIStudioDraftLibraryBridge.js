import {
  addIXIStudioFace,
  addIXIStudioFieldDefinition,
  addIXIStudioModule,
  createIXIObjectFieldDefinition,
  normalizeIXIObjectStudioDraft
} from "../IXIObjectStudioDraftEngine";

import {
  IXI_STUDIO_MODULE_TYPES,

  forkIXIStudioCardDesign,
  forkIXIStudioFaceDesign,
  forkIXIStudioLibraryModule
} from "./IXIStudioDesignLibrary";


/*
 * IXI STUDIO DRAFT / LIBRARY BRIDGE
 *
 * PURPOSE
 * -------
 *
 * Design Library
 *      ↓
 * fork
 *      ↓
 * Object Studio Draft
 *
 *
 * This file owns installation behavior for:
 *
 * CARD DESIGNS
 * FACE DESIGNS
 * MODULE DESIGNS
 *
 *
 * IMPORTANT
 * ---------
 *
 * Library designs are NEVER installed by
 * reference.
 *
 * They are copied/forked into the Object.
 *
 * The Object owns the resulting definition.
 */


function safeArray(
  value
) {
  return Array.isArray(
    value
  )
    ? value
    : [];
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


/* =========================================================
   DIRTY STAMP
   ========================================================= */

function stampStudioDraft(
  draft
) {

  const normalized =
    normalizeIXIObjectStudioDraft(
      draft
    );


  return normalizeIXIObjectStudioDraft({
    ...normalized,

    dirty:
      true,

    revision:
      Number(
        normalized.revision ||
        0
      ) + 1,

    updatedAt:
      nowIso()
  });
}


/* =========================================================
   FIELD DEFINITION MERGE
   ========================================================= */

/*
 * Applying another Card design must NOT
 * silently destroy existing Object data.
 *
 * Card design changes presentation.
 *
 * Suggested field definitions from the
 * design are merged into the Object.
 */
function mergeFieldDefinitions(
  existingDefinitions = [],
  incomingDefinitions = []
) {

  const map =
    new Map();


  safeArray(
    existingDefinitions
  ).forEach(
    definition => {

      if (
        definition?.fieldId
      ) {
        map.set(
          definition.fieldId,
          clone(
            definition
          )
        );
      }
    }
  );


  safeArray(
    incomingDefinitions
  ).forEach(
    definition => {

      if (
        !definition?.fieldId
      ) {
        return;
      }


      map.set(
        definition.fieldId,
        createIXIObjectFieldDefinition(
          definition
        )
      );
    }
  );


  return Array.from(
    map.values()
  );
}


/* =========================================================
   INSTALL CARD DESIGN
   ========================================================= */

/*
 * Card design installation:
 *
 * - preserves Object identity
 * - preserves existing Object values
 * - merges suggested field definitions
 * - replaces Card Faces
 * - applies design capabilities
 * - records provenance
 *
 * It does NOT rename the Object.
 */
export function installIXIStudioCardDesign({
  draft,
  design
} = {}) {

  if (
    !draft ||
    !design
  ) {
    return draft;
  }


  const current =
    normalizeIXIObjectStudioDraft(
      draft
    );


  const forked =
    forkIXIStudioCardDesign(
      design
    );


  const next =
    clone(
      current
    );


  next.objectDraft
    .fieldDefinitions =
    mergeFieldDefinitions(
      current.objectDraft
        .fieldDefinitions,

      forked.fieldDefinitions
    );


  /*
   * Initialize any newly introduced fields.
   *
   * Never overwrite existing values.
   */
  next.objectDraft
    .fieldDefinitions
    .forEach(
      field => {

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
            "";
        }
      }
    );


  next.cardDefinitionDraft = {
    ...safeObject(
      current.cardDefinitionDraft
    ),

    objectId:
      current.objectDraft
        .objectId,

    faces:
      clone(
        forked.faces
      ),

    capabilities: {
      ...safeObject(
        current
          .cardDefinitionDraft
          .capabilities
      ),

      ...safeObject(
        forked.capabilities
      )
    },

    metadata: {
      ...safeObject(
        current
          .cardDefinitionDraft
          .metadata
      ),

      sourceDesignId:
        forked.sourceDesignId,

      sourceDesignScope:
        forked.sourceScope
    }
  };


  next.templateSource = {
    scope:
      forked.sourceScope ||
      "ixi",

    templateId:
      forked.sourceDesignId ||
      "",

    templateName:
      design.name ||
      "",

    sourceEntityId:
      "",

    sourceUserId:
      "",

    forkedFromTemplateId:
      forked.sourceDesignId ||
      ""
  };


  next.selection = {
    selectionType:
      "card",

    faceId:
      next
        .cardDefinitionDraft
        .faces[0]
        ?.faceId ||
      "",

    moduleId:
      ""
  };


  return stampStudioDraft(
    next
  );
}


/* =========================================================
   INSTALL FACE DESIGN
   ========================================================= */

export function installIXIStudioFaceDesign({
  draft,
  design
} = {}) {

  if (
    !draft ||
    !design
  ) {
    return draft;
  }


  const forkedFace =
    forkIXIStudioFaceDesign(
      design
    );


  return addIXIStudioFace(
    draft,
    forkedFace
  );
}


/* =========================================================
   FIELD MODULE?
   ========================================================= */

function isFieldModule(
  module
) {

  return (
    module?.moduleType ===
    IXI_STUDIO_MODULE_TYPES.FIELD
  );
}


/* =========================================================
   INSTALL MODULE DESIGN
   ========================================================= */

/*
 * Installing TEXT / NUMBER / MONEY / DATE:
 *
 * creates:
 *
 * 1. Object field definition
 * 2. Object field value
 * 3. Face module pointing at that field
 *
 *
 * Installing PHOTO / RELATIONSHIP / etc:
 *
 * creates only the presentation module.
 */
export function installIXIStudioModuleDesign({
  draft,
  design,
  faceId = ""
} = {}) {

  if (
    !draft ||
    !design
  ) {
    return draft;
  }


  const normalized =
    normalizeIXIObjectStudioDraft(
      draft
    );


  const resolvedFaceId =
    String(
      faceId ||
      normalized.selection
        ?.faceId ||
      normalized
        .cardDefinitionDraft
        .faces[0]
        ?.faceId ||
      ""
    ).trim();


  if (
    !resolvedFaceId
  ) {
    return normalized;
  }


  const forkedModule =
    forkIXIStudioLibraryModule(
      design
    );


  /*
   * DATA FIELD MODULE
   */
  if (
    isFieldModule(
      forkedModule
    )
  ) {

    const fieldDefinition =
      createIXIObjectFieldDefinition({
        label:
          design.label ||
          "NEW FIELD",

        fieldType:
          design.config
            ?.fieldType ||
          "text",

        searchable:
          true
      });


    let next =
      addIXIStudioFieldDefinition(
        normalized,

        fieldDefinition,

        ""
      );


    forkedModule.fieldId =
      fieldDefinition.fieldId;


    forkedModule.label =
      fieldDefinition.label;


    next =
      addIXIStudioModule({
        draft:
          next,

        faceId:
          resolvedFaceId,

        module:
          forkedModule
      });


    return next;
  }


  /*
   * NON-FIELD MODULE
   */
  return addIXIStudioModule({
    draft:
      normalized,

    faceId:
      resolvedFaceId,

    module:
      forkedModule
  });
}


/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

export default {
  installIXIStudioCardDesign,
  installIXIStudioFaceDesign,
  installIXIStudioModuleDesign
};
