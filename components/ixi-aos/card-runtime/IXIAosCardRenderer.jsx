import {
  useMemo,
  useState
} from "react";

import IXIAosCardRuntime
  from "./IXIAosCardRuntime";

import {
  resolveIXICardDefinition
} from "./IXICardDefinitionEngine";

import {
  renderIXIAosContainerModule
} from "../container-runtime/IXIAosContainerModules";

import IXIAosEditableFieldGroup
  from "./modules/IXIAosEditableFieldGroup";

import IXIAosCardHeaderControls
  from "./modules/IXIAosCardHeaderControls";


/*
 * IXI AOS CARD RENDERER
 *
 * This is NOT a taxonomy registry.
 *
 * It does not ask:
 *
 * - location?
 * - employee?
 * - job?
 * - vehicle?
 *
 * It asks only:
 *
 * 1. What Object is this?
 * 2. What Card Definition does it use?
 * 3. What modules does the active Face request?
 *
 * Placement never changes Card identity.
 *
 * IMPORTANT
 * ---------
 *
 * This renderer does NOT own console physics.
 *
 * The existing IXI console system remains
 * responsible for console slots, expansion,
 * persistence, face swapping, and layout.
 */


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


export default function IXIAosCardRenderer({
  object = {},

  projection = null,

  cardDefinition = null,

  template = null,

  objects = [],

  parentLabel = "",

  dragHandleProps = null,

  ixiState = {},
  onIxiStateChange = null,

  saved = false,

  armedDestination = "",

  onSendFront = null,
  onSendBack = null,

  onCycleColor = null,
  onCycleOutline = null,

  onSendToArmedDestination = null,

  /*
   * GENERIC OBJECT EDIT CONTRACT
   *
   * If a caller provides onObjectFieldChange,
   * field writes are delegated outward.
   *
   * If not, the renderer keeps an explicit
   * edit draft in IXI presentation state.
   * That draft is NOT durable Object truth.
   * A later Save action may commit it through
   * the Object service without changing this
   * rendering contract.
   */
  onObjectFieldChange = null,

  onHideObject = null,
  onDeleteObject = null,

  /*
   * CONTAINER OPERATIONS
   */
  onAddObject = null,
  onBoard = null,
  onRecall = null,
  onExposeObject = null,

  /*
   * CONSOLE ENTRY POINT
   */
  onOpenConsole = null,

  onExpandConsoleLeft = null,
  onExpandConsoleRight = null,

  consoleLeftOpen = false,
  consoleRightOpen = false,

  forcedFaceIndex = null,

  faceOnly = false,

  studioEditing = false,

  selectedModuleId = "",

  onSelectModule = null,

  renderCard = null
}) {

  const objectId =
    String(
      object?.objectId ||
      object?.id ||
      ""
    );


  /* =======================================================
     CARD DEFINITION
     ======================================================= */

  const resolvedDefinition =
    useMemo(
      () =>
        cardDefinition ||
        resolveIXICardDefinition({
          object,
          template
        }),
      [
        object,
        cardDefinition,
        template
      ]
    );


  const capabilities =
    resolvedDefinition
      ?.capabilities ||
    {};


  /* =======================================================
     GENERIC EDIT DRAFT
     ======================================================= */

  const editDraft =
    safeObject(
      ixiState?.editDraft
    );


  const draftFields =
    safeObject(
      editDraft?.fields
    );


  const runtimeObject =
    useMemo(
      () => ({
        ...object,

        fields: {
          ...safeObject(
            object?.fields
          ),

          ...draftFields
        }
      }),
      [
        object,
        draftFields
      ]
    );


  function patchEditDraftFields(
    fieldId,
    value
  ) {
    if (
      typeof onObjectFieldChange ===
      "function"
    ) {
      onObjectFieldChange(
        fieldId,
        value
      );

      return;
    }


    if (!objectId) {
      return;
    }


    onIxiStateChange?.(
      objectId,
      {
        editDraft: {
          ...editDraft,

          fields: {
            ...draftFields,

            [fieldId]:
              value
          }
        }
      }
    );
  }


  /* =======================================================
     CONTAINER DECK STATE
     ======================================================= */

  const [
    selectedChildIndex,
    setSelectedChildIndex
  ] =
    useState(0);


  /* =======================================================
     CONTAINED CARD RENDERER
     ======================================================= */

  function renderContainedCard({
    object:
      childObject,

    parent,

    context
  }) {

    if (
      typeof renderCard ===
      "function"
    ) {
      return renderCard({
        object:
          childObject,

        parent,

        context
      });
    }


    return (
      <IXIAosCardRenderer
        object={
          childObject
        }

        objects={
          objects
        }

        parentLabel={
          parent?.displayName ||
          parent?.name ||
          ""
        }

        dragHandleProps={{}}

        ixiState={{}}

        onIxiStateChange={
          () => {}
        }

        saved={
          false
        }

        armedDestination=""

        onSendFront={
          () => {}
        }

        onSendBack={
          () => {}
        }

        onCycleColor={
          () => {}
        }

        onCycleOutline={
          () => {}
        }

        onSendToArmedDestination={
          () => {}
        }

        onAddObject={
          onAddObject
        }

        onBoard={
          onBoard
        }

        onRecall={
          onRecall
        }

        onExposeObject={
          onExposeObject
        }

        onOpenConsole={
          onOpenConsole
        }

        renderCard={
          renderCard
        }
      />
    );
  }


  /* =======================================================
     CARD EDIT STATE
     ======================================================= */

  function toggleEditing() {
    if (!objectId) {
      return;
    }


    const nextEditing =
      !Boolean(
        ixiState?.editing
      );


    onIxiStateChange?.(
      objectId,
      {
        editing:
          nextEditing,

        ...(
          nextEditing
            ? {
                editDraft: {
                  fields: {
                    ...safeObject(
                      object?.fields
                    )
                  }
                }
              }
            : {}
        )
      }
    );
  }


  /* =======================================================
     MODULE DISPATCH
     ======================================================= */

  function renderModule({
    module
  }) {

    const moduleType =
      String(
        module?.moduleType ||
        ""
      )
        .trim()
        .toLowerCase();


    /*
     * GENERIC HEADER ACTIONS
     */
    if (
      moduleType ===
      "card-header-actions"
    ) {
      return (
        <IXIAosCardHeaderControls
          canAdd={
            Boolean(
              capabilities?.canContain
            )
          }

          canEdit={
            capabilities?.editable !==
            false
          }

          editing={
            Boolean(
              ixiState?.editing
            )
          }

          onAdd={
            onAddObject
          }

          onToggleEdit={
            toggleEditing
          }

          onHide={
            onHideObject
          }

          onDelete={
            onDeleteObject
          }

          onOpenConsole={
            onOpenConsole
          }
        />
      );
    }


    /*
     * GENERIC EDITABLE FIELD GROUP
     */
    if (
      moduleType ===
        "editable-field-group" ||
      moduleType ===
        "weighted-field-row"
    ) {
      return (
        <IXIAosEditableFieldGroup
          object={
            runtimeObject
          }

          moduleDefinition={
            module
          }

          editing={
            Boolean(
              ixiState?.editing
            )
          }

          onFieldChange={
            patchEditDraftFields
          }
        />
      );
    }


    /*
     * CONTAINER MODULE PACK
     */
    const containerModule =
      renderIXIAosContainerModule({
        moduleType,

        object:
          runtimeObject,

        parentLabel,

        objects,

        selectedIndex:
          selectedChildIndex,

        onSelectedIndexChange:
          setSelectedChildIndex,

        renderCard:
          renderContainedCard,

        onAddObject,

        onBoard,

        onRecall,

        onExposeObject
      });


    if (
      containerModule !==
      null &&
      containerModule !==
      undefined
    ) {
      return containerModule;
    }


    return null;
  }


  /* =======================================================
     CARD RUNTIME
     ======================================================= */

  return (
    <IXIAosCardRuntime
      object={
        runtimeObject
      }

      projection={
        projection
      }

      cardDefinition={
        resolvedDefinition
      }

      parentLabel={
        parentLabel
      }

      dragHandleProps={
        dragHandleProps
      }

      ixiState={
        ixiState
      }

      onIxiStateChange={
        onIxiStateChange
      }

      saved={
        saved
      }

      armedDestination={
        armedDestination
      }

      onSendFront={
        onSendFront
      }

      onSendBack={
        onSendBack
      }

      onCycleColor={
        onCycleColor
      }

      onCycleOutline={
        onCycleOutline
      }

      onSendToArmedDestination={
        onSendToArmedDestination
      }

      onOpenConsole={
        onOpenConsole
      }

      onExpandConsoleLeft={
        onExpandConsoleLeft
      }

      onExpandConsoleRight={
        onExpandConsoleRight
      }

      consoleLeftOpen={
        consoleLeftOpen
      }

      consoleRightOpen={
        consoleRightOpen
      }

      forcedFaceIndex={
        forcedFaceIndex
      }

      faceOnly={
        faceOnly
      }

      studioEditing={
        studioEditing
      }

      selectedModuleId={
        selectedModuleId
      }

      onSelectModule={
        onSelectModule
      }

      renderModule={
        renderModule
      }
    />
  );
}
