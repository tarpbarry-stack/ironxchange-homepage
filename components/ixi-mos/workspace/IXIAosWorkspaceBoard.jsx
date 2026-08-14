import IXIBoard
  from "../../ixi-chassis/IXIBoard";

import IXIBoardSurface
  from "../../ixi-chassis/IXIBoardSurface";

import IXISortableMachineCard
  from "../../ixi-chassis/IXISortableMachineCard";

import IXISystemIndexCard
  from "../IXISystemIndexCard";

import IXISystemIndexConsole, {
  getSystemIndexConsoleNativeWidth,
  getSystemIndexConsoleNativeHeight
} from "../system-index/IXISystemIndexConsole";

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

  onAddObject,

  onExposeContainerChildren,
  onGatherContainerChildren,
  onReturnContainerChildren,

  onSaveContainerPresentation,

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


        /* ===============================================
           CONTAINER SORTING BEHAVIOR
           =============================================== */

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
             * Containers remain draggable themselves,
             * but foreign drags do not displace them.
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


        /* ===============================================
           CUSTOM OBJECT IDENTITY
           =============================================== */

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


        /* ===============================================
           CUSTOM NATIVE SIZE

           System Index console width expands from:
           298
           595
           892
           1189
           1486

           Native height always remains 471.
           =============================================== */

        getCustomItemNativeSize={
          ({
            item,
            id
          }) => {
            const objectType =
              String(
                item?.objectType ||
                ""
              )
                .trim()
                .toLowerCase();

            if (
              objectType !==
              "system-index"
            ) {
              return null;
            }

            return {
              width:
                getSystemIndexConsoleNativeWidth({
                  objectId:
                    id,

                  ixiCardState
                }),

              height:
                getSystemIndexConsoleNativeHeight()
            };
          }
        }


        /* ===============================================
           CUSTOM OBJECT RENDER
           =============================================== */

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


          /* =============================================
             SYSTEM INDEX SMART CONTAINER

             IMPORTANT:

             The System Index now owns a real AOS console.

             Face 1 remains the real System Index card.
             Additional 298 × 471 panels are provided by
             the existing IXI Console Engine/Shell.
             ============================================= */

          if (
            objectType ===
            "system-index"
          ) {
            return (
              <IXISystemIndexConsole
                objectId={
                  id
                }

                index={
                  item
                }

                ixiCardState={
                  ixiCardState
                }

                updateIxiCardState={
                  updateIxiCardState
                }

                renderSystemIndexCard={({
                  onOpenConsole
                }) => (
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

                    /*
                     * REAL SYSTEM INDEX CONSOLE.
                     *
                     * No Equipment-return placeholder.
                     * The card's ⋮ -> OPEN CONSOLE now
                     * opens the System Index console slot.
                     */
                    onOpenConsole={
                      onOpenConsole
                    }

                    onExposeContents={
                      onExposeContainerChildren
                    }

                    onGatherContents={
                      onGatherContainerChildren
                    }

                    onReturnContents={
                      onReturnContainerChildren
                    }

                    onAddObject={
                      onAddObject
                    }

                    onSavePresentation={
                      onSaveContainerPresentation
                    }
                  />
                )}
              />
            );
          }


          /* =============================================
             DURABLE MOS OBJECT / CHILD CONTAINER

             Machines remain on the existing
             IronXchange machine path.
             ============================================= */

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

                parentLabel={
                  parentLabel
                }

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
