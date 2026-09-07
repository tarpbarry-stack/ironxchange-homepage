import IXIBoard
  from "../../ixi-chassis/IXIBoard";

import IXIBoardSurface
  from "../../ixi-chassis/IXIBoardSurface";

import IXISortableMachineCard
  from "../../ixi-chassis/IXISortableMachineCard";

import IXISystemIndexCard
  from "../IXISystemIndexCard";

import IXIAosCard018
  from "../../ixi-aos/cards/018/IXIAosCard018";

import IXIAosCard019
  from "../../ixi-aos/cards/019/IXIAosCard019";

import IXISystemIndexConsole, {
  getSystemIndexConsoleNativeWidth,
  getSystemIndexConsoleNativeHeight
} from "../system-index/IXISystemIndexConsole";

import IXIAosOperatingCardRuntime
  from "../../ixi-aos/card-runtime/IXIAosOperatingCardRuntime";

import {
  getNumberedAosConsoleNativeWidth
} from "../../ixi-aos/console-runtime/IXIAosNumberedObjectConsole";

import {
  getListingId
} from "../../../lib/listingFormatters";

import {
  getIXIAosSystemAdapter
} from "../../../lib/mos/IXIAosSystemAdapterRegistry";

import {
  resolveAosWorkspaceParentName
} from "../../../lib/mos/ixiAosHierarchyContract.mjs";


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


function isLocationsSystemIndex(item = {}, adapter = null) {
  const identities = [
    adapter?.indexId,
    item?.indexId,
    item?.systemIndexId,
    item?.metadata?.indexId,
    item?.displayName,
    item?.name,
    item?.title
  ]
    .map(value => cleanId(value).toLowerCase())
    .filter(Boolean);

  if (identities.includes("locations")) return true;

  const objectId = getMosObjectId(item).toLowerCase();
  return objectId === "system-index:locations" ||
    objectId === "index:locations";
}


function isSystemIndexPresentation(item = {}) {
  return Boolean(
    item?.metadata?.systemIndexPresentation === true ||
    item?.metadata?.systemAdapter === true
  );
}


/*
 * Durable MOS identity is not "anything that has an id".
 * Sharetribe listings also have ids. Requiring the persisted
 * MOS entity/object pair prevents ordinary machines from being
 * intercepted by the custom AOS renderer and guarantees they
 * continue through IXIBoard -> IXIMachineCard -> the current
 * Private / Marketplace / Auction card family.
 */
function isMosWorkspaceObject(item = {}) {
  return Boolean(
    cleanId(item?.objectId) &&
    cleanId(item?.entityId)
  );
}


function isContainerWorkspaceObject(item = {}) {
  return Boolean(
    isSystemIndexPresentation(item) ||
    (
      isMosWorkspaceObject(item) &&
      item?.capabilities?.canContain === true
    )
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

  if (
    isMosWorkspaceObject(item) &&
    item?.capabilities?.canContain === true
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
  onSaveObject,
  onDeleteObject
}) {
  return (
    <IXIBoardSurface
      scaleMode={cardScaleMode}
      centerRows={true}
    >
      <IXIBoard
        items={items}
        cardContext="inventory"
        getListingId={getListingId}
        savedIds={savedIds}
        ixiCardState={ixiCardState}
        IXISortableMachineCard={IXISortableMachineCard}
        toggleSave={toggleSave}
        updateIxiCardState={updateIxiCardState}
        cycleMachineFace={cycleMachineFace}
        sendListingToFront={sendListingToFront}
        sendListingToBack={sendListingToBack}
        armedDestination={armedDestination}
        sendMachineToArmedDestination={sendMachineToArmedDestination}
        draggingListingId={draggingListingId}
        ghostListingId={ghostListingId}
        enableCardScaling={true}
        cardScaleMode={cardScaleMode}
        cardScaleMetrics={cardScaleMetrics}
        getSellerListingCardProps={getSellerListingCardProps}

        getItemReorderBehavior={
          item =>
            isContainerWorkspaceObject(item)
              ? "self-only"
              : "normal"
        }

        getCustomItemId={
          item => {
            /*
             * Only explicit System Index presentations and durable
             * MOS objects belong on the custom AOS renderer path.
             * IronXchange listings deliberately return null here so
             * IXIBoard routes them through IXIMachineCard.
             */
            if (
              !isSystemIndexPresentation(item) &&
              !isMosWorkspaceObject(item)
            ) {
              return null;
            }

            return getMosObjectId(item) || null;
          }
        }

        getCustomItemNativeSize={({ item, id }) => {
          if (isSystemIndexPresentation(item)) {
            if (ixiCardState?.[id]?.transactVisible === true) {
              return {
                width: getNumberedAosConsoleNativeWidth({
                  objectId: id,
                  ixiCardState
                }),
                height: 475
              };
            }

            return {
              width:
                getSystemIndexConsoleNativeWidth({
                  objectId: id,
                  ixiCardState
                }),

              height:
                getSystemIndexConsoleNativeHeight()
            };
          }

          if (isMosWorkspaceObject(item)) {
            return {
              width: getNumberedAosConsoleNativeWidth({
                objectId: id,
                ixiCardState
              }),
              height: 475
            };
          }

          return null;
        }}

        renderCustomItem={({
          item,
          id,
          dragHandleProps
        }) => {
          const commandTarget =
            getContainerCommandTarget(item);

          const systemAdapter =
            getIXIAosSystemAdapter(item);

          if (isSystemIndexPresentation(item)) {
            const canCreateChild =
              !systemAdapter &&
              item?.capabilities?.canContain === true;

            if (ixiCardState?.[id]?.transactVisible === true) {
              return (
                <IXIAosOperatingCardRuntime
                  object={item}
                  ixiState={ixiCardState[id] || {}}
                  onIxiStateChange={updateIxiCardState}
                  onSendFront={sendListingToFront}
                  onSendBack={sendListingToBack}
                  armedDestination={armedDestination}
                  onSendToArmedDestination={sendMachineToArmedDestination}
                />
              );
            }

            return (
              <IXISystemIndexConsole
                objectId={id}
                index={item}
                ixiCardState={ixiCardState}
                updateIxiCardState={updateIxiCardState}

                onOpenTransact={() => updateIxiCardState?.(id, { transactVisible: true })}

                renderSystemIndexCard={({ onOpenConsole, onOpenTransact }) => {
                  const indexState =
                    ixiCardState[id] || {
                      color: "none",
                      outline: 1,
                      face: 1
                    };

                  const exposeObject = child => {
                    if (
                      systemAdapter?.adapterId ===
                      "ixi-owned-equipment"
                    ) {
                      exposeEquipmentMachineToBoard?.(child);
                      return;
                    }

                    onExposeContainerChildren?.({
                      container: commandTarget,
                      child
                    });
                  };

                  const systemIndexCard =
                    systemAdapter?.adapterId === "ixi-owned-equipment"
                      ? {
                          Card: IXIAosCard018,
                          displayName: "EQUIPMENT",
                          templateSlug: "aos-card-018",
                          cardNumber: 18
                        }
                      : isLocationsSystemIndex(item, systemAdapter)
                        ? {
                            Card: IXIAosCard019,
                            displayName: "LOCATIONS",
                            templateSlug: "aos-card-019",
                            cardNumber: 19
                          }
                        : null;

                  if (systemIndexCard) {
                    const NumberedSystemIndexCard = systemIndexCard.Card;

                    return (
                      <NumberedSystemIndexCard
                        object={{
                          ...item,
                          singularLabel: "SYSTEM INDEX",
                          displayName: systemIndexCard.displayName,
                          cardTemplateSlug: systemIndexCard.templateSlug,
                          cardNumber: systemIndexCard.cardNumber
                        }}
                        children={item?.items || []}
                        ixiState={indexState}
                        ixiCardState={ixiCardState}
                        onIxiStateChange={updateIxiCardState}
                        dragHandleProps={dragHandleProps}
                        armedDestination={armedDestination}
                        onSendFront={sendListingToFront}
                        onSendBack={sendListingToBack}
                        onSendToArmedDestination={sendMachineToArmedDestination}
                        onExposeObject={exposeObject}
                        onOpenTransact={onOpenTransact}
                        onAddObject={
                          canCreateChild
                            ? onAddObject
                            : null
                        }
                        onCycleFace={() =>
                          updateIxiCardState?.(id, {
                            face:
                              Number(indexState.face || 1) === 1
                                ? 2
                                : 1
                          })
                        }
                        onRecall={() =>
                          onGatherContainerChildren?.(
                            commandTarget
                          )
                        }
                        onBoard={() =>
                          onExposeContainerChildren?.(
                            commandTarget
                          )
                        }
                        onReturn={() =>
                          onReturnContainerChildren?.(
                            commandTarget
                          )
                        }
                      />
                    );
                  }

                  return (
                    <IXISystemIndexCard
                    index={item}
                    objectId={id}
                    dragHandleProps={dragHandleProps}

                    workspaceDropPolicy={
                      getSystemIndexDropPolicy(item)
                    }

                    workspaceDropSurface={
                      item?.workspace?.surfaceId ||
                      systemAdapter?.workspaceSurfaceId ||
                      ""
                    }

                    ixiState={indexState}

                    ixiCardState={ixiCardState}
                    onIxiStateChange={updateIxiCardState}
                    armedDestination={armedDestination}
                    onSendFront={sendListingToFront}
                    onSendBack={sendListingToBack}
                    onSendToArmedDestination={sendMachineToArmedDestination}

                    onExposeObject={exposeObject}

                    onOpenConsole={onOpenConsole}

                    onExposeContents={() =>
                      onExposeContainerChildren?.(
                        commandTarget
                      )
                    }

                    onGatherContents={() =>
                      onGatherContainerChildren?.(
                        commandTarget
                      )
                    }

                    onReturnContents={() =>
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
                  );
                }}
              />
            );
          }

          if (isMosWorkspaceObject(item)) {
            const parentObject =
              item?.directContainerId &&
              typeof getWorkspaceObjectById === "function"
                ? getWorkspaceObjectById(
                    item.directContainerId
                  )
                : null;

            const parentLabel =
              resolveAosWorkspaceParentName({
                object: item,
                parentObject
              });

            const directChildren =
              Array.isArray(item?.items)
                ? item.items
                : Array.isArray(item?.children)
                  ? item.children
                  : [];

            return (
              <IXIAosOperatingCardRuntime
                object={item}
                parentLabel={parentLabel}
                items={directChildren}

                ixiState={
                  ixiCardState[id] || {
                    color: "none",
                    outline: 1,
                    face: 1,
                    actionNotice: null
                  }
                }

                ixiCardState={ixiCardState}
                onIxiStateChange={updateIxiCardState}
                dragHandleProps={dragHandleProps}

                workspaceDropPolicy={{
                  enabled:
                    item?.capabilities?.canContain === true,
                  acceptedObjectTypes: []
                }}

                workspaceDropSurface="board"
                armedDestination={armedDestination}
                onSendFront={sendListingToFront}
                onSendBack={sendListingToBack}
                onSendToArmedDestination={sendMachineToArmedDestination}

                onExposeObject={child => {
                  onExposeContainerChildren?.({
                    container: commandTarget,
                    child
                  });
                }}

                onExposeContents={() =>
                  onExposeContainerChildren?.(
                    commandTarget
                  )
                }

                onGatherContents={() =>
                  onGatherContainerChildren?.(
                    commandTarget
                  )
                }

                onAddObject={onCreateObjectChild}
                onSaveObject={onSaveObject}
                onDeleteObject={onDeleteObject}
              />
            );
          }

          return null;
        }}
      />
    </IXIBoardSurface>
  );
}
