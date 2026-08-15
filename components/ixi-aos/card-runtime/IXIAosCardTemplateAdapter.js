import {
  createIXICardDefinition,
  createIXICardFaceDefinition,
  createDefaultIXICardCapabilities
} from "./IXICardDefinitionEngine";


function clean(
  value
) {
  return String(
    value || ""
  ).trim();
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


function safeObject(
  value
) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  )
    ? value
    : {};
}


function normalizeCapabilities(
  template = {}
) {
  const source =
    safeObject(
      template?.capabilities
    );

  return createDefaultIXICardCapabilities({
    canContain:
      Boolean(
        source.canContain
      ),

    canReceiveDrop:
      Boolean(
        source.canContain ||
        source.canReceiveDrop
      ),

    hasMedia:
      source.canHaveMedia !==
        false,

    hasConsole:
      source.hasConsole !==
        false,

    hasRail:
      source.hasRail !==
        false,

    hasRelationships:
      source.hasRelationships !==
        false,

    editable:
      source.editable !==
        false
  });
}


function createFallbackFaceLayout(
  template = {}
) {
  const fields =
    safeArray(
      template?.fieldSchema
    );


  const layout = [
    {
      slotId:
        "identity",

      moduleType:
        "object-identity"
    }
  ];


  if (
    fields.length
  ) {
    layout.push({
      slotId:
        "fields",

      moduleType:
        "object-field-group",

      config: {
        fields:
          fields
            .map(
              field =>
                clean(
                  field?.field ||
                  field?.fieldId
                )
            )
            .filter(
              Boolean
            )
      }
    });
  }


  return layout;
}


function adaptFace({
  face,
  index,
  template
}) {
  const faceIndex =
    Math.max(
      1,
      Number(
        face?.face ||
        face?.faceIndex ||
        index + 1
      )
    );


  return createIXICardFaceDefinition({
    faceId:
      clean(
        face?.faceId
      ) ||
      `face-${faceIndex}`,

    faceIndex,

    faceType:
      faceIndex === 1
        ? "primary"
        : "custom",

    label:
      clean(
        face?.label
      ) ||
      (
        faceIndex === 1
          ? clean(
              template?.label
            ) ||
            "PRIMARY"
          : `FACE ${faceIndex}`
      ),

    layout:
  safeArray(
    face?.layout
  ).length
    ? safeArray(
        face?.layout
      )
    : (
        faceIndex === 1
  ? (
      safeArray(
        template
          ?.presentation
          ?.faceOneLayout
      ).length
        ? safeArray(
            template
              ?.presentation
              ?.faceOneLayout
          )
        : createFallbackFaceLayout(
            template
          )
    )
  : []
      ),

    metadata: {
      rendererSlug:
        clean(
          face?.rendererSlug
        ),

      source:
        "aws-card-template"
    }
  });
}


export function adaptAosCardTemplate({
  template = {},
  object = {}
} = {}) {
  const faceSchema =
    safeArray(
      template?.faceSchema
    );


  const faces =
    (
      faceSchema.length
        ? faceSchema
        : [
            {
              face: 1
            }
          ]
    ).map(
      (face, index) =>
        adaptFace({
          face,
          index,
          template
        })
    );


  return createIXICardDefinition({
    cardDefinitionId:
      `template:${
        clean(
          template?.templateSlug
        ) ||
        clean(
          template?.templateNumber
        ) ||
        "unknown"
      }:v${
        Number(
          template?.version || 1
        )
      }`,

    objectId:
      clean(
        object?.objectId ||
        object?.id
      ),

    templateId:
      clean(
        template?.templateSlug
      ),

    templateName:
      clean(
        template?.label
      ) ||
      clean(
        template?.templateSlug
      ) ||
      "AOS CARD",

    protectedTemplate:
      template?.ownerType ===
        "system",

    faces,

    capabilities:
      normalizeCapabilities(
        template
      ),

    metadata: {
      templateNumber:
        Number(
          template?.templateNumber ||
          0
        ),

      templateVersion:
        Number(
          template?.version ||
          1
        ),

      librarySection:
        clean(
          template?.librarySection
        ),

      baseObjectType:
        clean(
          template?.baseObjectType
        ),

      source:
        "aws-card-library"
    }
  });
}


export default
adaptAosCardTemplate;
