/*
 * IXI OBJECT STUDIO DESIGN LIBRARY
 *
 * One library contract for:
 *
 * - complete Card designs
 * - complete Face designs
 * - individual Modules
 * - reusable Module groups
 *
 * The library does NOT determine what an
 * Object is.
 *
 * These are starting designs and reusable
 * building blocks.
 *
 * A customer may use any design for any
 * Object and then change everything.
 */


/* =========================================================
   CONSTANTS
   ========================================================= */

export const IXI_STUDIO_LIBRARY_KINDS =
  Object.freeze({
    CARD:
      "card",

    FACE:
      "face",

    MODULE:
      "module",

    MODULE_GROUP:
      "module-group"
  });


export const IXI_STUDIO_LIBRARY_SCOPES =
  Object.freeze({
    IXI:
      "ixi",

    USER:
      "user",

    ENTITY:
      "entity",

    COMMUNITY:
      "community"
  });


export const IXI_STUDIO_MODULE_TYPES =
  Object.freeze({

    /*
     * DATA / IDENTITY
     */
    IDENTITY:
      "object-identity",

    FIELD:
      "object-field",

    FIELD_GROUP:
      "object-field-group",

    STATUS:
      "status",

    /*
     * MEDIA
     */
    MEDIA:
      "primary-media",

    GALLERY:
      "media-gallery",

    /*
     * RELATIONSHIPS
     */
    RELATIONSHIP:
      "relationship",

    RELATIONSHIP_SUMMARY:
      "relationship-summary",

    CHILD_DECK:
      "container-collection-preview",

    CONTAINER_SUMMARY:
      "container-summary",

    CONTAINER_ACTIONS:
      "container-actions",

    /*
     * HISTORY
     */
    HISTORY:
      "object-history",

    /*
     * FUTURE TRANSACTION MODULES
     *
     * These definitions are valid now.
     * Their data providers can arrive later.
     */
    WORK_ORDERS:
      "work-orders",

    PURCHASE_ORDERS:
      "purchase-orders",

    EXPENSES:
      "expenses",

    INVOICES:
      "invoices",

    SERVICE:
      "service",

    DOCUMENTS:
      "documents"
  });


/* =========================================================
   PRESENTATION ROLES
   ========================================================= */

/*
 * Roles describe presentation intent.
 *
 * They are NOT fixed pixel positions.
 *
 * Object Studio will eventually translate
 * visual drag/drop into these structured
 * presentation definitions.
 */
export const IXI_STUDIO_PRESENTATION_ROLES =
  Object.freeze({
    HERO:
      "hero",

    HEADER:
      "header",

    HEADER_METRIC:
      "header-metric",

    PRIMARY:
      "primary",

    COMPACT:
      "compact",

    INLINE:
      "inline",

    SUMMARY:
      "summary",

    FOOTER:
      "footer",

    AUTO:
      "auto"
  });


export const IXI_STUDIO_WIDTHS =
  Object.freeze({
    FULL:
      "full",

    HALF:
      "half",

    THIRD:
      "third",

    AUTO:
      "auto"
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


function makeLibraryId(
  prefix = "design"
) {
  return [
    prefix,
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2, 9)
  ].join(":");
}


/* =========================================================
   MODULE DEFINITION
   ========================================================= */

export function createIXIStudioLibraryModule({
  moduleId = "",

  moduleType =
    IXI_STUDIO_MODULE_TYPES.FIELD,

  label = "",

  fieldId = "",

  presentationRole =
    IXI_STUDIO_PRESENTATION_ROLES.AUTO,

  width =
    IXI_STUDIO_WIDTHS.AUTO,

  config = {},

  metadata = {}
} = {}) {

  return {
    moduleId:
      clean(
        moduleId
      ) ||
      makeLibraryId(
        "module"
      ),

    moduleType:
      cleanLower(
        moduleType
      ) ||
      IXI_STUDIO_MODULE_TYPES.FIELD,

    label:
      clean(
        label
      ),

    fieldId:
      clean(
        fieldId
      ),

    presentation: {
      role:
        cleanLower(
          presentationRole
        ) ||
        IXI_STUDIO_PRESENTATION_ROLES.AUTO,

      width:
        cleanLower(
          width
        ) ||
        IXI_STUDIO_WIDTHS.AUTO
    },

    config:
      clone(
        safeObject(
          config
        )
      ),

    metadata:
      clone(
        safeObject(
          metadata
        )
      )
  };
}


/* =========================================================
   FACE DESIGN
   ========================================================= */

export function createIXIStudioFaceDesign({
  designId = "",

  scope =
    IXI_STUDIO_LIBRARY_SCOPES.IXI,

  name = "UNTITLED FACE",

  description = "",

  modules = [],

  metadata = {}
} = {}) {

  return {
    designId:
      clean(
        designId
      ) ||
      makeLibraryId(
        "face-design"
      ),

    kind:
      IXI_STUDIO_LIBRARY_KINDS.FACE,

    scope:
      cleanLower(
        scope
      ) ||
      IXI_STUDIO_LIBRARY_SCOPES.IXI,

    name:
      clean(
        name
      ) ||
      "UNTITLED FACE",

    description:
      clean(
        description
      ),

    modules:
      safeArray(
        modules
      ).map(
        module =>
          createIXIStudioLibraryModule(
            module
          )
      ),

    metadata:
      clone(
        safeObject(
          metadata
        )
      )
  };
}


/* =========================================================
   CARD DESIGN
   ========================================================= */

export function createIXIStudioCardDesign({
  designId = "",

  scope =
    IXI_STUDIO_LIBRARY_SCOPES.IXI,

  name =
    "UNTITLED CARD",

  description = "",

  fields = [],

  faces = [],

  capabilities = {},

  metadata = {}
} = {}) {

  return {
    designId:
      clean(
        designId
      ) ||
      makeLibraryId(
        "card-design"
      ),

    kind:
      IXI_STUDIO_LIBRARY_KINDS.CARD,

    scope:
      cleanLower(
        scope
      ) ||
      IXI_STUDIO_LIBRARY_SCOPES.IXI,

    name:
      clean(
        name
      ) ||
      "UNTITLED CARD",

    description:
      clean(
        description
      ),

    /*
     * Suggested Object fields.
     *
     * They are copied into the new Object.
     * They are NOT permanent restrictions.
     */
    fields:
      clone(
        safeArray(
          fields
        )
      ),

    faces:
      safeArray(
        faces
      ).map(
        face =>
          createIXIStudioFaceDesign(
            face
          )
      ),

    capabilities:
      clone(
        safeObject(
          capabilities
        )
      ),

    metadata:
      clone(
        safeObject(
          metadata
        )
      )
  };
}


/* =========================================================
   MODULE GROUP DESIGN
   ========================================================= */

export function createIXIStudioModuleGroupDesign({
  designId = "",

  scope =
    IXI_STUDIO_LIBRARY_SCOPES.IXI,

  name =
    "UNTITLED MODULE GROUP",

  description = "",

  modules = [],

  metadata = {}
} = {}) {

  return {
    designId:
      clean(
        designId
      ) ||
      makeLibraryId(
        "module-group"
      ),

    kind:
      IXI_STUDIO_LIBRARY_KINDS
        .MODULE_GROUP,

    scope:
      cleanLower(
        scope
      ) ||
      IXI_STUDIO_LIBRARY_SCOPES.IXI,

    name:
      clean(
        name
      ) ||
      "UNTITLED MODULE GROUP",

    description:
      clean(
        description
      ),

    modules:
      safeArray(
        modules
      ).map(
        module =>
          createIXIStudioLibraryModule(
            module
          )
      ),

    metadata:
      clone(
        safeObject(
          metadata
        )
      )
  };
}


/* =========================================================
   IXI MODULE LIBRARY
   ========================================================= */

/*
 * These are primitives.
 *
 * Customer-facing labels can remain simple.
 * Internal module types remain stable.
 */

export const IXI_STUDIO_MODULE_LIBRARY = [
  createIXIStudioLibraryModule({
    moduleId:
      "ixi:module:text",

    moduleType:
      IXI_STUDIO_MODULE_TYPES.FIELD,

    label:
      "TEXT",

    presentationRole:
      IXI_STUDIO_PRESENTATION_ROLES.COMPACT,

    width:
      IXI_STUDIO_WIDTHS.HALF,

    config: {
      fieldType:
        "text"
    }
  }),

  createIXIStudioLibraryModule({
    moduleId:
      "ixi:module:number",

    moduleType:
      IXI_STUDIO_MODULE_TYPES.FIELD,

    label:
      "NUMBER",

    presentationRole:
      IXI_STUDIO_PRESENTATION_ROLES.COMPACT,

    width:
      IXI_STUDIO_WIDTHS.HALF,

    config: {
      fieldType:
        "number"
    }
  }),

  createIXIStudioLibraryModule({
    moduleId:
      "ixi:module:money",

    moduleType:
      IXI_STUDIO_MODULE_TYPES.FIELD,

    label:
      "MONEY",

    presentationRole:
      IXI_STUDIO_PRESENTATION_ROLES.COMPACT,

    width:
      IXI_STUDIO_WIDTHS.HALF,

    config: {
      fieldType:
        "money"
    }
  }),

  createIXIStudioLibraryModule({
    moduleId:
      "ixi:module:date",

    moduleType:
      IXI_STUDIO_MODULE_TYPES.FIELD,

    label:
      "DATE",

    presentationRole:
      IXI_STUDIO_PRESENTATION_ROLES.COMPACT,

    width:
      IXI_STUDIO_WIDTHS.HALF,

    config: {
      fieldType:
        "date"
    }
  }),

  createIXIStudioLibraryModule({
    moduleId:
      "ixi:module:photo",

    moduleType:
      IXI_STUDIO_MODULE_TYPES.MEDIA,

    label:
      "PHOTO",

    presentationRole:
      IXI_STUDIO_PRESENTATION_ROLES.HERO,

    width:
      IXI_STUDIO_WIDTHS.FULL
  }),

  createIXIStudioLibraryModule({
    moduleId:
      "ixi:module:status",

    moduleType:
      IXI_STUDIO_MODULE_TYPES.STATUS,

    label:
      "STATUS",

    presentationRole:
      IXI_STUDIO_PRESENTATION_ROLES.INLINE,

    width:
      IXI_STUDIO_WIDTHS.HALF
  }),

  createIXIStudioLibraryModule({
    moduleId:
      "ixi:module:relationship",

    moduleType:
      IXI_STUDIO_MODULE_TYPES.RELATIONSHIP,

    label:
      "RELATIONSHIP",

    presentationRole:
      IXI_STUDIO_PRESENTATION_ROLES.SUMMARY,

    width:
      IXI_STUDIO_WIDTHS.FULL
  }),

  createIXIStudioLibraryModule({
    moduleId:
      "ixi:module:child-deck",

    moduleType:
      IXI_STUDIO_MODULE_TYPES.CHILD_DECK,

    label:
      "CHILD DECK",

    presentationRole:
      IXI_STUDIO_PRESENTATION_ROLES.HERO,

    width:
      IXI_STUDIO_WIDTHS.FULL
  }),

  createIXIStudioLibraryModule({
    moduleId:
      "ixi:module:work-orders",

    moduleType:
      IXI_STUDIO_MODULE_TYPES.WORK_ORDERS,

    label:
      "WORK ORDERS",

    presentationRole:
      IXI_STUDIO_PRESENTATION_ROLES.SUMMARY,

    width:
      IXI_STUDIO_WIDTHS.HALF,

    config: {
      status:
        "open",

      limit:
        3
    }
  }),

  createIXIStudioLibraryModule({
    moduleId:
      "ixi:module:purchase-orders",

    moduleType:
      IXI_STUDIO_MODULE_TYPES.PURCHASE_ORDERS,

    label:
      "PURCHASE ORDERS",

    presentationRole:
      IXI_STUDIO_PRESENTATION_ROLES.SUMMARY,

    width:
      IXI_STUDIO_WIDTHS.HALF,

    config: {
      status:
        "open",

      limit:
        3
    }
  }),

  createIXIStudioLibraryModule({
    moduleId:
      "ixi:module:documents",

    moduleType:
      IXI_STUDIO_MODULE_TYPES.DOCUMENTS,

    label:
      "DOCUMENTS",

    presentationRole:
      IXI_STUDIO_PRESENTATION_ROLES.SUMMARY,

    width:
      IXI_STUDIO_WIDTHS.HALF
  }),

  createIXIStudioLibraryModule({
    moduleId:
      "ixi:module:history",

    moduleType:
      IXI_STUDIO_MODULE_TYPES.HISTORY,

    label:
      "HISTORY",

    presentationRole:
      IXI_STUDIO_PRESENTATION_ROLES.SUMMARY,

    width:
      IXI_STUDIO_WIDTHS.FULL
  })
];


/* =========================================================
   IXI FACE LIBRARY
   ========================================================= */

export const IXI_STUDIO_FACE_LIBRARY = [
  createIXIStudioFaceDesign({
    designId:
      "ixi:face:photo-identity",

    name:
      "PHOTO / ID",

    description:
      "Primary photo and compact identity.",

    modules: [
      {
        moduleType:
          IXI_STUDIO_MODULE_TYPES.IDENTITY,

        label:
          "IDENTITY",

        presentationRole:
          IXI_STUDIO_PRESENTATION_ROLES.HEADER,

        width:
          IXI_STUDIO_WIDTHS.FULL
      },

      {
        moduleType:
          IXI_STUDIO_MODULE_TYPES.MEDIA,

        label:
          "PHOTO",

        presentationRole:
          IXI_STUDIO_PRESENTATION_ROLES.HERO,

        width:
          IXI_STUDIO_WIDTHS.FULL
      }
    ]
  }),

  createIXIStudioFaceDesign({
    designId:
      "ixi:face:relationships",

    name:
      "RELATIONSHIPS",

    description:
      "Relationships surrounding this Object.",

    modules: [
      {
        moduleType:
          IXI_STUDIO_MODULE_TYPES
            .RELATIONSHIP_SUMMARY,

        label:
          "RELATIONSHIPS",

        presentationRole:
          IXI_STUDIO_PRESENTATION_ROLES.SUMMARY,

        width:
          IXI_STUDIO_WIDTHS.FULL
      }
    ]
  }),

  createIXIStudioFaceDesign({
    designId:
      "ixi:face:operations",

    name:
      "OPERATIONS",

    description:
      "Current operating activity.",

    modules: [
      {
        moduleType:
          IXI_STUDIO_MODULE_TYPES.WORK_ORDERS,

        label:
          "WORK ORDERS",

        presentationRole:
          IXI_STUDIO_PRESENTATION_ROLES.SUMMARY,

        width:
          IXI_STUDIO_WIDTHS.HALF
      },

      {
        moduleType:
          IXI_STUDIO_MODULE_TYPES.PURCHASE_ORDERS,

        label:
          "PURCHASE ORDERS",

        presentationRole:
          IXI_STUDIO_PRESENTATION_ROLES.SUMMARY,

        width:
          IXI_STUDIO_WIDTHS.HALF
      }
    ]
  }),

  createIXIStudioFaceDesign({
    designId:
      "ixi:face:documents-history",

    name:
      "DOCUMENTS / HISTORY",

    description:
      "Documents and Object history.",

    modules: [
      {
        moduleType:
          IXI_STUDIO_MODULE_TYPES.DOCUMENTS,

        label:
          "DOCUMENTS",

        presentationRole:
          IXI_STUDIO_PRESENTATION_ROLES.SUMMARY,

        width:
          IXI_STUDIO_WIDTHS.HALF
      },

      {
        moduleType:
          IXI_STUDIO_MODULE_TYPES.HISTORY,

        label:
          "HISTORY",

        presentationRole:
          IXI_STUDIO_PRESENTATION_ROLES.SUMMARY,

        width:
          IXI_STUDIO_WIDTHS.HALF
      }
    ]
  }),

  createIXIStudioFaceDesign({
    designId:
      "ixi:face:blank",

    name:
      "BLANK",

    description:
      "Empty Face.",

    modules: []
  })
];


/* =========================================================
   FIRST IXI CARD DESIGNS
   ========================================================= */

/*
 * We are NOT trying to build all 15–20 now.
 *
 * These first three prove:
 *
 * - a highly polished starting design
 * - a container starting design
 * - a completely blank starting point
 */


export const IXI_STUDIO_CARD_LIBRARY = [

  /*
   * VEHICLE
   *
   * Designed intentionally close to the
   * Equipment Card visual grammar:
   *
   * identity + miles
   * photo
   * VIN
   * value + location
   * room for status / relationships
   */
  createIXIStudioCardDesign({
    designId:
      "ixi:card:vehicle",

    name:
      "VEHICLE",

    description:
      "Vehicle operating card.",

    fields: [
      {
        fieldId:
          "year",

        label:
          "YEAR",

        fieldType:
          "number"
      },

      {
        fieldId:
          "make",

        label:
          "MAKE",

        fieldType:
          "text"
      },

      {
        fieldId:
          "model",
