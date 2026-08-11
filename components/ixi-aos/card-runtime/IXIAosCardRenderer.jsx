import {
  useMemo,
  useState
} from "react";

import IXIAosCardConsole
  from "./IXIAosCardConsole";

import {
  getIXIAosConsoleState,
  toggleIXIAosConsole
} from "./IXIAosConsoleStateEngine";

import {
  resolveIXICardDefinition,
  getIXIAosObjectId,
  getIXICardFaceCount,
  getIXICardCapabilities
} from "./IXICardDefinitionEngine";

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
 */


export default function IXIAosCardRenderer({
  object = {},

  /*
   * Optional explicit definition.
   */
  cardDefinition = null,

  /*
   * Optional reusable template.
   */
  template = null,

  /*
   * All AOS Objects currently loaded.
   *
   * Needed for container relationships,
   * children, ancestry, etc.
   */
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
   * CONSOLE
   */
  onOpenConsole = null,

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

const objectId =
  getIXIAosObjectId(
    object
  );


const capabilities =
  getIXICardCapabilities(
    resolvedDefinition
  );


const faceCount =
  Math.max(
    1,
    getIXICardFaceCount(
      resolvedDefinition
    )
  );


const consoleState =
  getIXIAosConsoleState(
    ixiState
  );


  
  /*
   * Container deck selection belongs
   * to this Card instance's workspace
   * presentation.
   *
   * It is NOT durable containment truth.
   */
  const [
    selectedChildIndex,
    setSelectedChildIndex
  ] =
    useState(0);


  /*
   * Recursive Card renderer.
   *
   * If caller supplies one, use it.
   *
   * Otherwise this component can render
   * contained Cards through itself.
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
         * Preview Card is presentation
         * only. Do not install another
         * Board drag activator inside it.
         */
        dragHandleProps={{}}

        ixiState={{}}

        onIxiStateChange={
          () => {}
        }

        armedDestination=""

        onSendFront={() => {}}
        onSendBack={() => {}}

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
     * Container module pack.
     *
     * If the requested module does not
     * belong to this pack, it returns null
     * and IXIAosCardRuntime can fall back
     * to its built-in generic modules.
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
     * "I do not own this module."
     *
     * IXIAosCardRuntime will then try
     * its generic built-in modules:
     *
     * object-identity
     * primary-media
     * object-fields
     */
    return null;
  }

function toggleConsole() {

  if (
    !capabilities.hasConsole ||
    !objectId
  ) {
    return;
  }


  const nextConsoleState =
    toggleIXIAosConsole(
      consoleState,
      faceCount
    );


  onIxiStateChange?.(
    objectId,
    {
      console:
        nextConsoleState
    }
  );


  onOpenConsole?.(
    object,
    resolvedDefinition,
    nextConsoleState
  );
}
  
  if (
  capabilities.hasConsole &&
  consoleState.open
) {
  return (
    <IXIAosCardConsole

      object={
        object
      }

      objectId={
        objectId
      }

      cardDefinition={
        resolvedDefinition
      }

      faceCount={
        faceCount
      }

      parentLabel={
        parentLabel
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

      renderModule={
        renderModule
      }

    />
  );
}


return (
  <IXIAosCardRuntime

    object={
      object
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
      toggleConsole
    }

    renderModule={
      renderModule
    }

  />
);
}
