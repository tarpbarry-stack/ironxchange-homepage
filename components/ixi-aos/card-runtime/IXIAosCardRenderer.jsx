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
    const objectId =
      String(
        object?.objectId ||
        object?.id ||
        ""
      );

    if (!objectId) {
      return;
    }

    onIxiStateChange?.(
      objectId,
      {
        editing:
          !Boolean(
            ixiState?.editing
          )
      }
    );
  }


  /* =======================================================
     MODULE DISPATCH
     ======================================================= */

  function renderModule({
    object:
      runtimeObject,

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
     *
     * The Card Definition decides whether
     * this module exists. The renderer only
     * supplies generic behavior.
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
            onObjectFieldChange
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
        object
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
