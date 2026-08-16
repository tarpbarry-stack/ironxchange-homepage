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

import {
  getIXIAosSystemAdapter
} from "../../../lib/mos/IXIAosSystemAdapterRegistry";


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
  const adapter =
    getIXIAosSystemAdapter(
      item
    );

  if (adapter) {
    return {
      enabled:
        adapter.canOperationalDrop ===
        true,

      acceptedObjectTypes: [
        ...(adapter.acceptedObjectTypes || [])
      ]
    };
  }

  /*
   * Persisted customer System Indexes receive objects only
   * when their durable capabilities say they can contain.
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
 * not presentation names. A customer name can never select an
 * IXI adapter command path.
 */
function getContainerCommandTarget(item = {}) {
  const objectId =
    getMosObjectId(item);

  const adapter =
    getIXIAosSystemAdapter(
      item
    );

  return {
    objectId,

    indexId:
      adapter?.indexId ||
      cleanId(item?.indexId),

    directContainerId:
      cleanId(item?.directContainerId) ||
      null,

    capabilities: {
      ...(item?.capabilities || {})
    },

    metadata: {
      ...(item?.metadata || {}),

      ...(adapter
        ? {
            adapterId:
              adapter.adapterId,

            systemAdapter:
              true
          }
        : {})
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


        getItemReorderBehavior={
          item =>
            isContainerWorkspaceObject(item)
              ? "self-only"
              : "normal"
        }


        getCustomItemId={
          item => {
            const objectId =
              getMosObjectId(item);

            return objectId || null;
          }
        }


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


        renderCustomItem={({
          item,
          id,
          dragHandleProps
        }) => {
          const commandTarget =
            getContainerCommandTarget(
              item
            );

          const systemAdapter =
            getIXIAosSystemAdapter(
              item
            );


          if (
            isSystemIndexPresentation(
              item
            )
          ) {
            const canCreateChild =
              !systemAdapter &&
              item?.capabilities?.canContain ===
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
                      systemAdapter
                        ?.workspaceSurfaceId ||
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
                          systemAdapter
                            ?.adapterId ===
                          "ixi-owned-equipment"
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
