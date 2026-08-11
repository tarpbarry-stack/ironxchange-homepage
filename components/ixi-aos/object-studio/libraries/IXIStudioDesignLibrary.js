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

    label:
      "MODEL",

    fieldType:
      "text"
  },

  {
    fieldId:
      "vin",

    label:
      "VIN",

    fieldType:
      "text"
  },

  {
    fieldId:
      "miles",

    label:
      "MILES",

    fieldType:
      "number"
  },

  {
    fieldId:
      "value",

    label:
      "VALUE",

    fieldType:
      "money"
  },

  {
    fieldId:
      "location",

    label:
      "LOCATION",

    fieldType:
      "text"
  },

  {
    fieldId:
      "status",

    label:
      "STATUS",

    fieldType:
      "text"
  }
],

    faces: [
      {
        designId:
          "ixi:card:vehicle:face-1",

        name:
          "VEHICLE",

        modules: [
          {
            moduleId:
              "vehicle:identity",

            moduleType:
              IXI_STUDIO_MODULE_TYPES.IDENTITY,

            label:
              "VEHICLE",

            presentationRole:
              IXI_STUDIO_PRESENTATION_ROLES.HEADER,

            width:
              IXI_STUDIO_WIDTHS.FULL,

            config: {
              identityFields: [
                "year",
                "make",
                "model"
              ],

              metricField:
                "miles",

              metricSuffix:
                "MI"
            }
          },

          {
            moduleId:
              "vehicle:photo",

            moduleType:
              IXI_STUDIO_MODULE_TYPES.MEDIA,

            label:
              "PHOTO",

            presentationRole:
              IXI_STUDIO_PRESENTATION_ROLES.HERO,

            width:
              IXI_STUDIO_WIDTHS.FULL
          },

          {
            moduleId:
              "vehicle:vin",

            moduleType:
              IXI_STUDIO_MODULE_TYPES.FIELD,

            label:
              "VIN",

            fieldId:
              "vin",

            presentationRole:
              IXI_STUDIO_PRESENTATION_ROLES.COMPACT,

            width:
              IXI_STUDIO_WIDTHS.FULL,

            config: {
              showLabel:
                true
            }
          },

          {
            moduleId:
              "vehicle:value",

            moduleType:
              IXI_STUDIO_MODULE_TYPES.FIELD,

            label:
              "VALUE",

            fieldId:
              "value",

            presentationRole:
              IXI_STUDIO_PRESENTATION_ROLES.INLINE,

            width:
              IXI_STUDIO_WIDTHS.HALF
          },

          {
            moduleId:
              "vehicle:location",

            moduleType:
              IXI_STUDIO_MODULE_TYPES.FIELD,

            label:
              "LOCATION",

            fieldId:
              "location",

            presentationRole:
              IXI_STUDIO_PRESENTATION_ROLES.INLINE,

            width:
              IXI_STUDIO_WIDTHS.HALF
          },

          {
            moduleId:
              "vehicle:status",

            moduleType:
              IXI_STUDIO_MODULE_TYPES.STATUS,

            label:
              "STATUS",

            fieldId:
              "status",

            presentationRole:
              IXI_STUDIO_PRESENTATION_ROLES.INLINE,

            width:
              IXI_STUDIO_WIDTHS.HALF
          },

          {
            moduleId:
              "vehicle:relationships",

            moduleType:
              IXI_STUDIO_MODULE_TYPES.RELATIONSHIP_SUMMARY,

            label:
              "RELATIONSHIPS",

            presentationRole:
              IXI_STUDIO_PRESENTATION_ROLES.SUMMARY,

            width:
              IXI_STUDIO_WIDTHS.HALF
          }
        ]
      },

      {
        designId:
          "ixi:card:vehicle:face-2",

        name:
          "DETAILS",

        modules: [
          {
            moduleType:
              IXI_STUDIO_MODULE_TYPES.FIELD_GROUP,

            label:
              "VEHICLE DETAILS",

            presentationRole:
              IXI_STUDIO_PRESENTATION_ROLES.PRIMARY,

            width:
              IXI_STUDIO_WIDTHS.FULL,

            config: {
              fields: [
                "year",
                "make",
                "model",
                "vin",
                "miles",
                "value",
                "location",
                "status"
              ]
            }
          }
        ]
      },

      {
        designId:
          "ixi:card:vehicle:face-3",

        name:
          "RELATIONSHIPS",

        modules: [
          {
            moduleType:
              IXI_STUDIO_MODULE_TYPES.RELATIONSHIP_SUMMARY,

            label:
              "RELATIONSHIPS",

            presentationRole:
              IXI_STUDIO_PRESENTATION_ROLES.SUMMARY,

            width:
              IXI_STUDIO_WIDTHS.FULL
          }
        ]
      }
    ],

    capabilities: {
      canContain:
        false,

      canReceiveDrop:
        false,

      hasConsole:
        true
    }
  }),


  /*
   * CONTAINER
   *
   * Not "Location Container."
   * Not "Job Container."
   *
   * Just a reusable Card design with
   * containment capabilities.
   */
  createIXIStudioCardDesign({
    designId:
      "ixi:card:container",

    name:
      "CONTAINER",

    description:
      "Generic recursive Object container.",

    fields: [],

    faces: [
      {
        designId:
          "ixi:card:container:face-1",

        name:
          "CONTAINER",

        modules: [
          {
            moduleId:
              "container:identity",

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
            moduleId:
              "container:deck",

            moduleType:
              IXI_STUDIO_MODULE_TYPES.CHILD_DECK,

            label:
              "OBJECTS",

            presentationRole:
              IXI_STUDIO_PRESENTATION_ROLES.HERO,

            width:
              IXI_STUDIO_WIDTHS.FULL
          },

          {
            moduleId:
              "container:summary",

            moduleType:
              IXI_STUDIO_MODULE_TYPES.CONTAINER_SUMMARY,

            label:
              "SUMMARY",

            presentationRole:
              IXI_STUDIO_PRESENTATION_ROLES.SUMMARY,

            width:
              IXI_STUDIO_WIDTHS.FULL
          },

          {
            moduleId:
              "container:actions",

            moduleType:
              IXI_STUDIO_MODULE_TYPES.CONTAINER_ACTIONS,

            label:
              "ACTIONS",

            presentationRole:
              IXI_STUDIO_PRESENTATION_ROLES.FOOTER,

            width:
              IXI_STUDIO_WIDTHS.FULL
          }
        ]
      },

      {
        designId:
          "ixi:card:container:face-2",

        name:
          "RELATIONSHIPS",

        modules: [
          {
            moduleType:
              IXI_STUDIO_MODULE_TYPES.RELATIONSHIP_SUMMARY,

            label:
              "RELATIONSHIPS",

            presentationRole:
              IXI_STUDIO_PRESENTATION_ROLES.SUMMARY,

            width:
              IXI_STUDIO_WIDTHS.FULL
          }
        ]
      },

      {
        designId:
          "ixi:card:container:face-3",

        name:
          "HISTORY",

        modules: [
          {
            moduleType:
              IXI_STUDIO_MODULE_TYPES.HISTORY,

            label:
              "HISTORY",

            presentationRole:
              IXI_STUDIO_PRESENTATION_ROLES.SUMMARY,

            width:
              IXI_STUDIO_WIDTHS.FULL
          }
        ]
      }
    ],

    capabilities: {
      canContain:
        true,

      canReceiveDrop:
        true,

      hasConsole:
        true
    }
  }),


  /*
   * BLANK
   *
   * Maximum freedom.
   */
  createIXIStudioCardDesign({
    designId:
      "ixi:card:blank",

    name:
      "BLANK",

    description:
      "Blank Object Card.",

    fields: [],

    faces: [
      {
        designId:
          "ixi:card:blank:face-1",

        name:
          "FACE 1",

        modules: []
      }
    ],

    capabilities: {
      canContain:
        false,

      canReceiveDrop:
        false,

      hasConsole:
        true
    }
  })
];


/* =========================================================
   COMPLETE LIBRARY
   ========================================================= */

export const IXI_STUDIO_DESIGN_LIBRARY = {
  cards:
    IXI_STUDIO_CARD_LIBRARY,

  faces:
    IXI_STUDIO_FACE_LIBRARY,

  modules:
    IXI_STUDIO_MODULE_LIBRARY,

  moduleGroups:
    []
};


/* =========================================================
   LOOKUP
   ========================================================= */

export function getIXIStudioCardDesign(
  designId
) {

  const id =
    clean(
      designId
    );


  return (
    IXI_STUDIO_CARD_LIBRARY
      .find(
        design =>
          design.designId ===
          id
      ) ||
    null
  );
}


export function getIXIStudioFaceDesign(
  designId
) {

  const id =
    clean(
      designId
    );


  return (
    IXI_STUDIO_FACE_LIBRARY
      .find(
        design =>
          design.designId ===
          id
      ) ||
    null
  );
}


export function getIXIStudioModuleDesign(
  moduleId
) {

  const id =
    clean(
      moduleId
    );


  return (
    IXI_STUDIO_MODULE_LIBRARY
      .find(
        module =>
          module.moduleId ===
          id
      ) ||
    null
  );
}


/* =========================================================
   FILTER BY SCOPE
   ========================================================= */

export function getIXIStudioDesignsByScope({
  kind,
  scope
} = {}) {

  const resolvedKind =
    cleanLower(
      kind
    );


  const resolvedScope =
    cleanLower(
      scope
    );


  let source =
    [];


  if (
    resolvedKind ===
    IXI_STUDIO_LIBRARY_KINDS.CARD
  ) {
    source =
      IXI_STUDIO_CARD_LIBRARY;
  }


  if (
    resolvedKind ===
    IXI_STUDIO_LIBRARY_KINDS.FACE
  ) {
    source =
      IXI_STUDIO_FACE_LIBRARY;
  }


  if (
    resolvedKind ===
    IXI_STUDIO_LIBRARY_KINDS.MODULE
  ) {
    source =
      IXI_STUDIO_MODULE_LIBRARY;
  }


  return source.filter(
    design =>
      !resolvedScope ||
      design.scope ===
        resolvedScope
  );
}


/* =========================================================
   FORK HELPERS
   ========================================================= */

/*
 * Library designs are never directly
 * installed into an Object.
 *
 * They are FORKED.
 *
 * The created Object owns its copy.
 */


export function forkIXIStudioLibraryModule(
  sourceModule = {}
) {

  const source =
    createIXIStudioLibraryModule(
      sourceModule
    );


  return {
    ...clone(
      source
    ),

    moduleId:
      makeLibraryId(
        "module"
      ),

    metadata: {
      ...safeObject(
        source.metadata
      ),

      forkedFromModuleId:
        source.moduleId
    }
  };
}


export function forkIXIStudioFaceDesign(
  sourceFace = {}
) {

  const source =
    createIXIStudioFaceDesign(
      sourceFace
    );


  return {
    faceId:
      makeLibraryId(
        "face"
      ),

    label:
      source.name,

    faceType:
      "custom",

    layout:
      source.modules.map(
        module =>
          forkIXIStudioLibraryModule(
            module
          )
      ),

    metadata: {
      ...safeObject(
        source.metadata
      ),

      forkedFromDesignId:
        source.designId,

      sourceScope:
        source.scope
    }
  };
}


/* =========================================================
   CARD FORK
   ========================================================= */

export function forkIXIStudioCardDesign(
  sourceDesign = {}
) {

  const source =
    createIXIStudioCardDesign(
      sourceDesign
    );


  return {
    sourceDesignId:
      source.designId,

    sourceScope:
      source.scope,

    fieldDefinitions:
      clone(
        source.fields
      ),

    faces:
      source.faces.map(
        (
          face,
          index
        ) => {

          const forked =
            forkIXIStudioFaceDesign(
              face
            );


          return {
            ...forked,

            faceIndex:
              index + 1,

            faceType:
              index === 0
                ? "primary"
                : "custom"
          };
        }
      ),

    capabilities:
      clone(
        source.capabilities
      )
  };
}


/* =========================================================
   SAVE DESIGN CONTRACT
   ========================================================= */

/*
 * This is the shape the future persistence
 * adapter will save.
 *
 * It does not call AWS.
 */

export function createIXIStudioSavedDesign({
  kind,
  scope =
    IXI_STUDIO_LIBRARY_SCOPES.USER,

  name,
  description = "",

  definition,

  ownerUserId = "",
  ownerEntityId = "",

  sourceDesignId = "",

  metadata = {}
} = {}) {

  const resolvedKind =
    cleanLower(
      kind
    );


  return {
    savedDesignId:
      makeLibraryId(
        "saved-design"
      ),

    kind:
      resolvedKind,

    scope:
      cleanLower(
        scope
      ) ||
      IXI_STUDIO_LIBRARY_SCOPES.USER,

    name:
      clean(
        name
      ) ||
      "UNTITLED DESIGN",

    description:
      clean(
        description
      ),

    definition:
      clone(
        definition
      ),

    ownership: {
      userId:
        clean(
          ownerUserId
        ),

      entityId:
        clean(
          ownerEntityId
        )
    },

    provenance: {
      sourceDesignId:
        clean(
          sourceDesignId
        )
    },

    metadata:
      clone(
        safeObject(
          metadata
        )
      ),

    createdAt:
      new Date()
        .toISOString(),

    updatedAt:
      new Date()
        .toISOString()
  };
}


/* =========================================================
   SAVE CURRENT CARD AS DESIGN
   ========================================================= */

export function buildIXIStudioSavedCardDesign({
  name,

  objectDraft = {},

  cardDefinition = {},

  scope =
    IXI_STUDIO_LIBRARY_SCOPES.USER,

  ownerUserId = "",
  ownerEntityId = ""
} = {}) {

  return createIXIStudioSavedDesign({
    kind:
      IXI_STUDIO_LIBRARY_KINDS.CARD,

    scope,

    name:
      name ||
      objectDraft.displayName ||
      "CARD DESIGN",

    ownerUserId,

    ownerEntityId,

    definition: {
      fieldDefinitions:
        clone(
          safeArray(
            objectDraft
              .fieldDefinitions
          )
        ),

      cardDefinition:
        clone(
          cardDefinition
        )
    }
  });
}


/* =========================================================
   SAVE CURRENT FACE AS DESIGN
   ========================================================= */

export function buildIXIStudioSavedFaceDesign({
  name,

  face = {},

  scope =
    IXI_STUDIO_LIBRARY_SCOPES.USER,

  ownerUserId = "",
  ownerEntityId = ""
} = {}) {

  return createIXIStudioSavedDesign({
    kind:
      IXI_STUDIO_LIBRARY_KINDS.FACE,

    scope,

    name:
      name ||
      face.label ||
      "FACE DESIGN",

    ownerUserId,

    ownerEntityId,

    definition:
      clone(
        face
      )
  });
}


/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

export default {
  IXI_STUDIO_LIBRARY_KINDS,
  IXI_STUDIO_LIBRARY_SCOPES,

  IXI_STUDIO_MODULE_TYPES,

  IXI_STUDIO_PRESENTATION_ROLES,
  IXI_STUDIO_WIDTHS,

  IXI_STUDIO_MODULE_LIBRARY,
  IXI_STUDIO_FACE_LIBRARY,
  IXI_STUDIO_CARD_LIBRARY,

  IXI_STUDIO_DESIGN_LIBRARY,

  createIXIStudioLibraryModule,
  createIXIStudioFaceDesign,
  createIXIStudioCardDesign,
  createIXIStudioModuleGroupDesign,

  getIXIStudioCardDesign,
  getIXIStudioFaceDesign,
  getIXIStudioModuleDesign,

  getIXIStudioDesignsByScope,

  forkIXIStudioLibraryModule,
  forkIXIStudioFaceDesign,
  forkIXIStudioCardDesign,

  createIXIStudioSavedDesign,

  buildIXIStudioSavedCardDesign,
  buildIXIStudioSavedFaceDesign
};
