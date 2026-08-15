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
 *
 * Object Studio / AOS will plug into that
 * system separately.
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
   * CONTAINER OPERATIONS
   */
  onAddObject = null,
  onBoard = null,
  onRecall = null,
  onExposeObject = null,

  /*
   * CONSOLE ENTRY POINT
   *
   * The caller may connect this to the
   * existing IXI console system.
   *
   * This renderer itself does not create
   * or manage console state.
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

  /*
   * IMPORTANT:
   *
   * This lets a contained Object render
   * through the SAME Card Renderer.
   *
   * That is how Card identity survives
   * placement inside another Card.
   */
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


  /* =======================================================
     CONTAINER DECK STATE
     ======================================================= */

  /*
   * Container deck selection belongs to
   * workspace presentation.
   *
   * It is NOT durable containment truth.
   */
  const [
    selectedChildIndex,
    setSelectedChildIndex
  ] =
    useState(0);


  /* =======================================================
     CONTAINED CARD RENDERER
     ======================================================= */

  /*
   * If the caller supplies a Card renderer,
   * use it.
   *
   * Otherwise recurse through this same
   * renderer.
   *
   * The container NEVER substitutes another
   * Card family for the child Object.
   */
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

        /*
         * Container preview is presentation
         * only.
         *
         * Do not install another Board drag
         * activator inside the preview.
         */
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
     MODULE DISPATCH
     ======================================================= */

  function renderModule({
    object:
      runtimeObject,

    module,

    face
  }) {

    const moduleType =
      String(
        module?.moduleType ||
        ""
      )
        .trim()
        .toLowerCase();


    /*
     * CONTAINER MODULE PACK
     *
     * This renderer only delegates the
     * module request.
     *
     * It does NOT decide that the Object
     * "is" a container type.
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


    /*
     * Returning null means:
     *
     * "This dispatcher does not own this
     * module."
     *
     * IXIAosCardRuntime may then use its
     * own generic module renderer.
     */
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
