import IXIBoard
  from "../../ixi-chassis/IXIBoard";

import IXIBoardSurface
  from "../../ixi-chassis/IXIBoardSurface";

import IXISortableMachineCard
  from "../../ixi-chassis/IXISortableMachineCard";

import IXIAosCard018
  from "../../ixi-aos/cards/018/IXIAosCard018";


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

import {
  getNextIXIRelationshipColor,
  getNextIXIRelationshipOutline
} from "../../ixi-object-system/IXIRailStateEngine.mjs";


function cleanId(value) {
  return String(value ?? "").trim();
}


function getMosObjectId(item = {}) {
  return cleanId(
    item?.canonicalIdentity?.objectId ||
    item?.objectId
  );
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
    cleanId(item?.entityId) &&
    item?.presentation?.kind !== "ixi-private-machine"
  );
}


function isContainerWorkspaceObject(item = {}) {
  return Boolean(
    isSystemIndexPresentation(item) ||
    isMosWorkspaceObject(item)
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

  if (isMosWorkspaceObject(item)) {
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


function stopRailEvent(event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
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
  onClearContainerToParent,

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
             * Every admitted object keeps canonical objectId as its sortable
             * identity. Returning null from renderCustomItem below routes a
             * normalized machine through the established IXIMachineCard.
             */
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

          const indexState =
            ixiCardState[id] || {
              color: "none",
              outline: 1,
              face: 1
            };

          const cycleObjectColor = event => {
            stopRailEvent(event);
            const nextColor = getNextIXIRelationshipColor(indexState.color);
            updateIxiCardState?.(id, { color: nextColor });
          };

          const cycleObjectOutline = event => {
            stopRailEvent(event);
            const nextOutline = getNextIXIRelationshipOutline(indexState.outline);
            updateIxiCardState?.(id, { outline: nextOutline });
          };

          const systemAdapter =
            getIXIAosSystemAdapter(item);

          if (isSystemIndexPresentation(item)) {
            const canCreateChild =
              item?.actorAuthority?.canCreateChild === true;
            const canTransact =
              item?.actorAuthority?.canTransact === true;

            if (ixiCardState?.[id]?.transactVisible === true) {
              return (
                <IXIAosOperatingCardRuntime
                  object={item}
                  workspaceDropPolicy={getSystemIndexDropPolicy(item)}
                  workspaceDropSurface={
                    item?.workspace?.surfaceId ||
                    systemAdapter?.workspaceSurfaceId ||
                    ""
                  }
                  ixiState={ixiCardState[id] || {}}
                  onIxiStateChange={updateIxiCardState}
                  onSendFront={sendListingToFront}
                  onSendBack={sendListingToBack}
                  onCycleColor={cycleObjectColor}
                  onCycleOutline={cycleObjectOutline}
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

                onOpenTransact={canTransact
                  ? () => updateIxiCardState?.(id, { transactVisible: true })
                  : null}

                renderSystemIndexCard={({ onOpenConsole, onOpenTransact }) => {
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

                  /*
                   * A governed System Index is always presented by Card 018.
                   * Card number is presentation, never identity: this branch is
                   * selected only by explicit System Index metadata/adapter
                   * identity and never by a customer-visible label.
                   */
                  const systemIndexCard = {
                    Card: IXIAosCard018,
                    displayName: cleanId(item?.displayName || item?.title || item?.name),
                    templateSlug: cleanId(item?.presentation?.templateSlug),
                    cardNumber: 18,
                    childCardMode:
                      systemAdapter?.adapterId === "ixi-owned-equipment"
                        ? "machine"
                        : "object",
                    loopChildDeck: true
                  };

                  const NumberedSystemIndexCard = systemIndexCard.Card;

                  return (
                      <NumberedSystemIndexCard
                        object={{
                          ...item,
                          singularLabel: item?.singularLabel,
                          displayName: systemIndexCard.displayName,
                          ...(systemIndexCard.templateSlug
                            ? { cardTemplateSlug: systemIndexCard.templateSlug }
                            : {}),
                          cardNumber: systemIndexCard.cardNumber
                        }}
                        workspaceDropPolicy={getSystemIndexDropPolicy(item)}
                        workspaceDropSurface={
                          item?.workspace?.surfaceId ||
                          systemAdapter?.workspaceSurfaceId ||
                          ""
                        }
                        children={item?.items || []}
                        ixiState={indexState}
                        ixiCardState={ixiCardState}
                        onIxiStateChange={updateIxiCardState}
                        dragHandleProps={dragHandleProps}
                        armedDestination={armedDestination}
                        onSendFront={sendListingToFront}
                        onSendBack={sendListingToBack}
                        onCycleColor={cycleObjectColor}
                        onCycleOutline={cycleObjectOutline}
                        onSendToArmedDestination={sendMachineToArmedDestination}
                        onExposeObject={exposeObject}
                        childCardMode={systemIndexCard.childCardMode}
                        loopChildDeck={systemIndexCard.loopChildDeck}
                        onOpenTransact={onOpenTransact}
                        onSaveObject={onSaveObject}
                        onDeleteObject={onDeleteObject}
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
                }}
              />
            );
          }

          if (isMosWorkspaceObject(item)) {
            const parentLabel =
              resolveAosWorkspaceParentName({
                object: item
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
                  enabled: true,
                  acceptedObjectTypes: []
                }}

                workspaceDropSurface={`container:${id}`}
                armedDestination={armedDestination}
                onSendFront={sendListingToFront}
                onSendBack={sendListingToBack}
                onCycleColor={cycleObjectColor}
                onCycleOutline={cycleObjectOutline}
                onSendToArmedDestination={sendMachineToArmedDestination}

                onExposeObject={child => {
                  onExposeContainerChildren?.({
                    container: commandTarget,
                    child
                  });
                }}

                onBoard={() =>
                  onExposeContainerChildren?.(
                    commandTarget
                  )
                }

                onRecall={() =>
                  onGatherContainerChildren?.(
                    commandTarget
                  )
                }

                onReturn={() =>
                  onReturnContainerChildren?.(
                    commandTarget
                  )
                }

                onClearToParent={() =>
                  onClearContainerToParent?.(
                    commandTarget
                  )
                }

                onAddObject={item?.actorAuthority?.canCreateChild === true ? onCreateObjectChild : null}
                onSaveObject={item?.actorAuthority?.canEdit === true ? onSaveObject : null}
                onDeleteObject={item?.actorAuthority?.canDelete === true ? onDeleteObject : null}
              />
            );
          }

          return null;
        }}
      />
    </IXIBoardSurface>
  );
}
