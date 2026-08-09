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
            if (
              item?.objectType ===
              "system-index"
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
                 
        return (
          <IXIMosObjectCard
  object={
    item
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
            
  dragHandleProps={
    dragHandleProps
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
