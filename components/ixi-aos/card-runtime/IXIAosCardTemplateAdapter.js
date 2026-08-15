import {
  createIXICardDefinition,
  createIXICardFaceDefinition,
  createDefaultIXICardCapabilities
} from "./IXICardDefinitionEngine";

import {
  getSystemCardPresentation
} from "./system-presentations/IXISystemCardPresentationRegistry";


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


function withPrimaryCardControls({
  layout = [],
  template = {},
  faceIndex = 1
}) {
  if (
    Number(faceIndex) !== 1
  ) {
    return [...layout];
  }


  const next =
    [...layout];


  const hasHeaderControls =
    next.some(
      module =>
        clean(
          module?.moduleType
        ).toLowerCase() ===
        "card-header-actions"
    );


  if (!hasHeaderControls) {
    next.unshift({
      slotId:
        "card-header-actions",

      moduleType:
        "card-header-actions",

      presentation: {
        role:
          "chrome",

        width:
          "full"
      }
    });
  }


  const editable =
    safeObject(
      template?.capabilities
    ).editable !== false;


  const hasEditActions =
    next.some(
      module =>
        clean(
          module?.moduleType
        ).toLowerCase() ===
        "edit-session-actions"
    );


  if (
    editable &&
    !hasEditActions
  ) {
    next.splice(
      1,
      0,
      {
        slotId:
          "edit-session-actions",

        moduleType:
          "edit-session-actions",

        presentation: {
          role:
            "chrome",

          width:
            "full"
        }
      }
    );
  }


  return next;
}


function getTemplatePresentation(
  template = {}
) {
  return (
    getSystemCardPresentation(
      template?.templateSlug
    ) ||
    safeObject(
      template?.presentation
    )
  );
}


function getTemplateFaceLayout({
  template = {},
  faceIndex = 1
}) {
  const presentation =
    getTemplatePresentation(
      template
    );

  const faceLayouts =
    presentation?.faceLayouts;


  if (
    faceLayouts &&
    typeof faceLayouts === "object" &&
    !Array.isArray(faceLayouts)
  ) {
    const keyedLayout =
      faceLayouts[
        String(faceIndex)
      ] ??
      faceLayouts[
        faceIndex
      ];

    if (
      Array.isArray(keyedLayout)
    ) {
      return keyedLayout;
    }
  }


  if (
    Array.isArray(faceLayouts)
  ) {
    const match =
      faceLayouts.find(
        item =>
          Number(
            item?.face ||
            item?.faceIndex
          ) ===
          Number(faceIndex)
      );

    if (
      Array.isArray(
        match?.layout
      )
    ) {
      return match.layout;
    }
  }


  if (
    Number(faceIndex) === 1 &&
    Array.isArray(
      presentation?.faceOneLayout
    )
  ) {
    return presentation.faceOneLayout;
  }


  return [];
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


  const explicitFaceLayout =
    safeArray(
      face?.layout
    );


  const templateFaceLayout =
    getTemplateFaceLayout({
      template,
      faceIndex
    });


  const baseLayout =
    explicitFaceLayout.length
      ? explicitFaceLayout
      : templateFaceLayout.length
        ? templateFaceLayout
        : faceIndex === 1
          ? createFallbackFaceLayout(
              template
            )
          : [];


  const resolvedLayout =
    withPrimaryCardControls({
      layout:
        baseLayout,

      template,

      faceIndex
    });


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
      resolvedLayout,

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
          template?.version || 1
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
