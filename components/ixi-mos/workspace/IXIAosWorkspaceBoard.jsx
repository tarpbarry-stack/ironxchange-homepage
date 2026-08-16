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


function cleanId(value) {
  return String(value ?? "").trim();
}


function getMosObjectId(item = {}) {
  return cleanId(
    item?.objectId ||
    item?.id?.uuid ||
    item?.id
  );
}


function isSystemIndexPresentation(item = {}) {
  return Boolean(
    item?.metadata?.systemIndexPresentation === true ||
    item?.metadata?.systemAdapter === true
  );
}


function isEquipmentAdapter(item = {}) {
  return Boolean(
    item?.metadata?.adapterId ===
      "ixi-owned-equipment" ||
    (
      item?.metadata?.systemAdapter === true &&
      item?.indexId === "equipment"
    )
  );
}


function isMosWorkspaceObject(item = {}) {
  return Boolean(
    getMosObjectId(item)
  );
}


function isContainerWorkspaceObject(item = {}) {
  return Boolean(
    isSystemIndexPresentation(item) ||
    item?.capabilities?.canContain === true
  );
}


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
           REORDER POLICY

           Container behavior is capability-driven.
           A customer name never changes drag semantics.
           =============================================== */
        getItemReorderBehavior={
          item =>
            isContainerWorkspaceObject(item)
              ? "self-only"
              : "normal"
        }


        /* ===============================================
           CUSTOM OBJECT IDENTITY

           Any durable MOS object is keyed by its objectId.
           IronXchange listings continue through the proven
           listing-card path.
           =============================================== */
        getCustomItemId={
          item => {
            const objectId =
              getMosObjectId(item);

            return objectId || null;
          }
        }


        /* ===============================================
           CUSTOM NATIVE SIZE

           System Index consoles expand as a single native
           console surface. Generic MOS cards remain 298×471.
           =============================================== */
        getCustomItemNativeSize={
          ({
            item,
            id
          }) => {
            if (
              !isSystemIndexPresentation(
                item
              )
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

          /* =============================================
             SYSTEM INDEX PRESENTATION

             This is an explicit UI/template role.
             It is not inferred from the customer's words.
             ============================================= */
          if (
            isSystemIndexPresentation(
              item
            )
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
                        if (
                          isEquipmentAdapter(
                            item
                          )
                        ) {
                          exposeEquipmentMachineToBoard?.(
                            child
                          );

                          return;
                        }

                        onExposeContainerChildren?.({
                          container:
                            item,

                          child
                        });
                      }
                    }

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
             DURABLE MOS OBJECT / GENERIC CONTAINER

             No business noun switches. A Field Rig, vendor,
             dog, person, tool, location, or customer-defined
             object all reach the same MOS card runtime.
             ============================================= */
          if (
            isMosWorkspaceObject(
              item
            )
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
              Array.isArray(item?.items)
                ? item.items
                : Array.isArray(item?.children)
                  ? item.children
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
                  enabled:
                    item?.capabilities
                      ?.canContain === true,

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
