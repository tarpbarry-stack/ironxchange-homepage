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


function getSystemIndexDropPolicy(item = {}) {
  /*
   * Equipment is an explicit IXI adapter and retains its
   * machine-only workspace return/drop policy.
   */
  if (isEquipmentAdapter(item)) {
    return (
      item?.workspace?.dropPolicy ||
      {
        enabled: true,
        acceptedObjectTypes: [
          "machine"
        ]
      }
    );
  }

  /*
   * Persisted customer System Indexes receive objects only
   * when their durable capabilities say they can contain.
   * Other IXI projection adapters (for example FOR SALE)
   * are read/projection surfaces, not accidental containers.
   */
  if (
    item?.capabilities?.canContain ===
    true
  ) {
    return (
      item?.workspace?.dropPolicy ||
      {
        enabled: true,
        acceptedObjectTypes: []
      }
    );
  }

  return {
    enabled: false,
    acceptedObjectTypes: []
  };
}


/*
 * Command payloads carry stable technical identity/capability,
 * not presentation names. This prevents a customer naming a
 * container "Equipment" (or anything else) from changing the
 * command path chosen by older compatibility code downstream.
 */
function getContainerCommandTarget(item = {}) {
  const objectId =
    getMosObjectId(item);

  return {
    objectId,

    indexId:
      isEquipmentAdapter(item)
        ? "equipment"
        : cleanId(item?.indexId),

    directContainerId:
      cleanId(item?.directContainerId) ||
      null,

    capabilities: {
      ...(item?.capabilities || {})
    },

    metadata: {
      ...(item?.metadata || {})
    }
  };
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
           =============================================== */
        getItemReorderBehavior={
          item =>
            isContainerWorkspaceObject(item)
              ? "self-only"
              : "normal"
        }


        /* ===============================================
           CUSTOM OBJECT IDENTITY
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
          const commandTarget =
            getContainerCommandTarget(
              item
            );


          if (
            isSystemIndexPresentation(
              item
            )
          ) {
            const canCreateChild =
              item?.capabilities?.canContain ===
                true &&
              item?.metadata?.systemAdapter !==
                true;

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
                      getSystemIndexDropPolicy(
                        item
                      )
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
                            commandTarget,

                          child
                        });
                      }
                    }

                    onOpenConsole={
                      onOpenConsole
                    }

                    onExposeContents={
                      () =>
                        onExposeContainerChildren?.(
                          commandTarget
                        )
                    }

                    onGatherContents={
                      () =>
                        onGatherContainerChildren?.(
                          commandTarget
                        )
                    }

                    onReturnContents={
                      () =>
                        onReturnContainerChildren?.(
                          commandTarget
                        )
                    }

                    onAddObject={
                      canCreateChild
                        ? onAddObject
                        : null
                    }

                    onSavePresentation={
                      onSaveContainerPresentation
                    }
                  />
                )}
              />
            );
          }


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
                        commandTarget,

                      child
                    });
                  }
                }

                onExposeContents={
                  () =>
                    onExposeContainerChildren?.(
                      commandTarget
                    )
                }

                onGatherContents={
                  () =>
                    onGatherContainerChildren?.(
                      commandTarget
                    )
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
