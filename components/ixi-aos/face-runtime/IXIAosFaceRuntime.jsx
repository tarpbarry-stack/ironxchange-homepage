import IXIAosFaceFrame
  from "./IXIAosFaceFrame";

import IXIAosFaceModuleRuntime
  from "./IXIAosFaceModuleRuntime";

import IXIAosFaceActionFooter
  from "./IXIAosFaceActionFooter";

import {
  getIXIAosFaceDefinition
} from "./IXIAosFaceDefinitionEngine";

import {
  getIXIAosPresentationCssVars,
  getIXIAosPresentationMetrics,
  normalizeIXIAosPresentationMode
} from "../presentation-runtime/IXIAosPresentationMetrics";


export default function IXIAosFaceRuntime({
  object = {},

  cardDefinition = {},

  faceNumber = 1,

  faceDefinition = null,

  presentationMode =
    "medium",

  renderModule = null,

  footerActions = [],

  footer = null,

  relationships = [],

  onOpenRelationship = null,

  onRemoveRelationship = null,

  onOpenContainer = null,

  onSaveNotes = null,

  studioEditing = false,

  selectedModuleId = "",

  onSelectModule = null,

  className = ""
}) {

  const resolvedMode =
    normalizeIXIAosPresentationMode(
      presentationMode
    );


  const metrics =
    getIXIAosPresentationMetrics(
      resolvedMode
    );


  const cssVars =
    getIXIAosPresentationCssVars(
      resolvedMode
    );


  const face =
    faceDefinition ||
    getIXIAosFaceDefinition({
      cardDefinition,
      faceNumber
    });


  const modules =
    Array.isArray(
      face?.modules
    )
      ? face.modules
      : [];


  const isScrollable =
    face?.heightBehavior ===
    "scroll";


  const resolvedFooter =
    footer ||
    (
      Array.isArray(
        footerActions
      ) &&
      footerActions.length
        ? (
          <IXIAosFaceActionFooter
            actions={
              footerActions
            }
          />
        )
        : null
    );


  return (
    <div
      className={[
        "ixi-aos-face-runtime",

        isScrollable
          ? "is-scrollable"
          : "is-bounded",

        className
      ]
        .filter(Boolean)
        .join(" ")}

      style={{
        ...cssVars,

        "--ixi-face-panel-width":
          `${metrics.panel.width}px`,

        "--ixi-face-panel-height":
          `${metrics.panel.height}px`
      }}
    >

      <IXIAosFaceFrame
        presentationMode={
          resolvedMode
        }

        footer={
          resolvedFooter
        }
      >

        <div className="face-module-stack">

          {modules.map(
            (
              module,
              moduleIndex
            ) => {

              const moduleId =
                String(
                  module?.moduleId ||
                  module?.id ||
                  `module-${moduleIndex + 1}`
                );


              return (
                <IXIAosFaceModuleRuntime
                  key={
                    moduleId
                  }

                  module={{
                    ...module,
                    moduleId
                  }}

                  object={
                    object
                  }

                  presentationMode={
                    resolvedMode
                  }

                  renderModule={
                    renderModule
                  }

                  relationships={
                    relationships
                  }

                  onOpenRelationship={
                    onOpenRelationship
                  }

                  onRemoveRelationship={
                    onRemoveRelationship
                  }

                  onOpenContainer={
                    onOpenContainer
                  }

                  onSaveNotes={
                    onSaveNotes
                  }

                  studioEditing={
                    studioEditing
                  }

                  selected={
                    moduleId ===
                    String(
                      selectedModuleId ||
                      ""
                    )
                  }

                  onSelect={
                    selectedModule => {

                      onSelectModule?.({
                        faceId:
                          face?.faceId ||
                          "",

                        faceNumber:
                          face?.faceNumber ||
                          faceNumber,

                        moduleId,

                        module:
                          selectedModule
                      });
                    }
                  }
                />
              );
            }
          )}

        </div>

      </IXIAosFaceFrame>


      <style jsx>{`

        .ixi-aos-face-runtime {
          position:
            relative;

          width:
            100%;

          min-width:
            0;
        }


        .face-module-stack {
          width:
            100%;

          min-width:
            0;

          display:
            flex;

          flex-direction:
            column;

          gap:
            var(
              --ixi-face-gap-md,
              9px
            );
        }


        /*
         * Face 1 generally remains bounded.
         *
         * Other Faces may contain effectively
         * unlimited application depth.
         */
        .is-scrollable
          :global(
            .ixi-aos-face-content
          ) {

          overflow-y:
            auto;

          overflow-x:
            hidden;

          overscroll-behavior:
            contain;

          scrollbar-width:
            thin;
        }

      `}</style>

    </div>
  );
}
