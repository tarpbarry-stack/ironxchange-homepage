import IXIBoard
  from "../../ixi-chassis/IXIBoard";

import IXIBoardSurface
  from "../../ixi-chassis/IXIBoardSurface";

import IXISortableMachineCard
  from "../../ixi-chassis/IXISortableMachineCard";

import IXISystemIndexCard
  from "../IXISystemIndexCard";

import IXIMosObjectCard
  from "../IXIMosObjectCard";

import {
  getListingId
} from "../../../lib/listingFormatters";


export default function IXIAosWorkspaceBoard({
  items = [],

  getWorkspaceObjectById = null,

  savedIds = [],
  ixiCardState = {},

  cardScaleMode = "xl",
  cardScaleMetrics = null,

  armedDestination = "",

  draggingListingId = "",
  ghostListingId = "",

  getSellerListingCardProps,

  toggleSave,
  updateIxiCardState,
  cycleMachineFace,

  sendListingToFront,
  sendListingToBack,
  sendMachineToArmedDestination,

    exposeEquipmentMachineToBoard,
  returnAllEquipmentHome,

  onAddObject,

onExposeContainerChildren,
onGatherContainerChildren,

onCreateObjectChild,
onSaveObjectName,
onDeleteObject
}) {
  return (
    <IXIBoardSurface
      scaleMode={
        cardScaleMode
      }
    >
      <IXIBoard
        items={
          items
        }

        cardContext="inventory"

        getListingId={
          getListingId
        }

        savedIds={
          savedIds
        }

        ixiCardState={
          ixiCardState
        }

        IXISortableMachineCard={
          IXISortableMachineCard
        }

        toggleSave={
          toggleSave
        }

        updateIxiCardState={
          updateIxiCardState
        }

        cycleMachineFace={
          cycleMachineFace
        }

        sendListingToFront={
          sendListingToFront
        }

        sendListingToBack={
          sendListingToBack
        }

        armedDestination={
          armedDestination
        }

        sendMachineToArmedDestination={
          sendMachineToArmedDestination
        }

        draggingListingId={
          draggingListingId
        }

        ghostListingId={
          ghostListingId
        }

        enableCardScaling={
          true
        }

        cardScaleMode={
          cardScaleMode
        }

        cardScaleMetrics={
          cardScaleMetrics
        }

        getSellerListingCardProps={
          getSellerListingCardProps
        }

        getItemReorderBehavior={
  item => {
    const objectType =
      String(
        item?.objectType ||
        ""
      )
        .trim()
        .toLowerCase();

    const isSystemIndex =
      objectType ===
      "system-index";

    const isAosContainer =
      Boolean(
        item?.objectId &&
        objectType !==
          "machine"
      );

    /*
     * CONTAINERS MUST STAY PUT
     * while another object is being
     * dragged across the Board.
     *
     * They remain draggable themselves,
     * but foreign drags do not cause
     * sortable displacement.
     */
    if (
      isSystemIndex ||
      isAosContainer
    ) {
      return "self-only";
    }

    return "normal";
  }
}

        getCustomItemId={
          item => {
            const objectType =
              String(
                item?.objectType ||
                ""
              )
                .trim()
                .toLowerCase();

            if (
              objectType ===
                "system-index" ||
              (
                item?.objectId &&
                objectType &&
                objectType !==
                  "machine"
              )
            ) {
              return String(
                item.objectId
              );
            }

            return null;
          }
        }

        renderCustomItem={({
          item,
          id,
          dragHandleProps
        }) => {
          const objectType =
            String(
              item?.objectType ||
              ""
            )
              .trim()
              .toLowerCase();

          /*
           * SYSTEM INDEX
           */
          if (
            objectType ===
            "system-index"
          ) {
            return (
              <IXISystemIndexCard
                index={
                  item
                }

                objectId={
                  id
                }

                dragHandleProps={
                  dragHandleProps
                }

                workspaceDropPolicy={
                  item?.workspace
                    ?.dropPolicy ||
                  null
                }

                workspaceDropSurface={
                  item?.workspace
                    ?.surfaceId ||
                  ""
                }

                ixiState={
                  ixiCardState[
                    id
                  ] || {
                    color: "none",
                    outline: 1,
                    face: 1
                  }
                }

                ixiCardState={
                  ixiCardState
                }

                onIxiStateChange={
                  updateIxiCardState
                }

                armedDestination={
                  armedDestination
                }

                onSendFront={
                  sendListingToFront
                }

                onSendBack={
                  sendListingToBack
                }

                onSendToArmedDestination={
                  sendMachineToArmedDestination
                }

                onExposeObject={
                  child => {
                    exposeEquipmentMachineToBoard?.(
                      child
                    );
                  }
                }

                onOpenConsole={
  () => {
    returnAllEquipmentHome?.();
  }
}

onExposeContents={
  onExposeContainerChildren
}

onGatherContents={
  onGatherContainerChildren
}

onAddObject={
  onAddObject
}
              />
            );
          }

          
          /*
           * DURABLE MOS OBJECT
           *
           * Machines remain on their
           * existing IronXchange path.
           */
               if (
        item?.objectId &&
        objectType &&
        objectType !==
          "machine"
      ) {

const parentObject =
  item?.directContainerId &&
  typeof getWorkspaceObjectById ===
    "function"
    ? getWorkspaceObjectById(
        item.directContainerId
      )
    : null;

const parentLabel =
  String(
    parentObject?.displayName ||
    parentObject?.label ||
    ""
  ).trim();
                 
      const directChildren =
  typeof getWorkspaceObjectById ===
  "function"
    ? (
        item?.items ||
        item?.children ||
        []
      )
    : [];

return (
  <IXIMosObjectCard

    object={
      item
    }

    /*
     * YELLOW PATH LABEL
     *
     * LOCATIONS
     * WICHITA FALLS
     *
     * WICHITA FALLS
     * MAIN SHOP
     */
    parentLabel={
      parentLabel
    }

    /*
     * DIRECT CHILD COLLECTION
     *
     * Right now this uses any direct
     * child collection already carried
     * by the object.
     *
     * We will replace this with the
     * canonical workspace/AWS resolver
     * immediately after this compiles.
     */
    items={
      directChildren
    }

    ixiState={
      ixiCardState[
        id
      ] || {
        color: "none",
        outline: 1,
        face: 1,
        actionNotice: null
      }
    }

    ixiCardState={
      ixiCardState
    }

    onIxiStateChange={
      updateIxiCardState
    }

    dragHandleProps={
      dragHandleProps
    }

    workspaceDropPolicy={{
      enabled: true,
      acceptedObjectTypes: []
    }}

    workspaceDropSurface={
      "board"
    }

    armedDestination={
      armedDestination
    }

    onSendFront={
      sendListingToFront
    }

    onSendBack={
      sendListingToBack
    }

    onSendToArmedDestination={
      sendMachineToArmedDestination
    }

    onExposeObject={
      child => {
        onExposeContainerChildren?.({
          container:
            item,

          child
        });
      }
    }

    onExposeContents={
      onExposeContainerChildren
    }

    onGatherContents={
      onGatherContainerChildren
    }

    onAddChild={
      onCreateObjectChild
    }

    onSaveName={
      onSaveObjectName
    }

    onDelete={
      onDeleteObject
    }
  />
);
      }


      return null;
        }}
      />
    </IXIBoardSurface>
  );
}
