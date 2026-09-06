import { useEffect, useMemo, useRef, useState } from "react";

import { SortableContext } from "@dnd-kit/sortable";
import { rectSortingStrategy } from "@dnd-kit/sortable";

import IXIMachineCard from "../ixi-machine-card/IXIMachineCard";

import IXIScaledCardShell from "../ixi-machine-object/IXIScaledCardShell";

import IXIObjectConsoleRouter
  from "./IXIObjectConsoleRouter";

import {
  getMachineCardFamily
} from "../ixi-machine-card/getMachineCardFamily";

import {
  getIXIScalePreset
} from "../../lib/ixiObjectGeometry";

const IXI_INITIAL_BOARD_CARD_COUNT = 24;
const IXI_BOARD_CARD_BATCH_SIZE = 24;

export default function IXIBoard({
  items = [],
  cardContext = "workspace",
  listingOrigin = "saved",
  marketplaceBrowsePerformance = false,
  enableMarketplaceDistribution = false,
  enableMarketplaceIntelligence = false,
  ConsoleRouterComponent =
    IXIObjectConsoleRouter,
  getListingId,
  savedIds = [],
  ixiCardState = {},
  IXISortableMachineCard,
  toggleSave,
  updateIxiCardState,
  cycleMachineFace,
  sendListingToFront,
  sendListingToBack,
  armedDestination,
  sendMachineToArmedDestination,
  draggingListingId,
  ghostListingId,
  getSellerListingCardProps,
  SellerObjectCard,
  enableCardScaling = false,
  fitCardScalingToCell = false,
  fillCardScalingToCell = false,
  cardScaleMode = "xl",
  cardScaleMetrics,
   onRecoverSellerObject,
  onCheckoutObject,

  getCustomItemId,
renderCustomItem,

getCustomItemNativeSize,

consolePanelWidth,
consolePanelGap,
}) {
  const [renderLimit, setRenderLimit] = useState(
    IXI_INITIAL_BOARD_CARD_COUNT
  );
  const loadMoreRef = useRef(null);
  
  function resolveBoardItemId(item) {
    if (
      typeof getCustomItemId === "function"
    ) {
      const customId =
        getCustomItemId(item);

      if (customId) {
        return String(customId);
      }
    }

    if (
      item?.type === "SELLER OBJECT"
    ) {
      return String(item.id);
    }

    return String(
      getListingId(item)
    );
  }
function resolveBoardItemType(
  item
) {
  if (
    item?.objectType
  ) {
    return String(
      item.objectType
    );
  }

  if (
    item?.type ===
    "SELLER OBJECT"
  ) {
    return "seller";
  }

  /*
   * Ordinary IronXchange
   * listing/machine object.
   */
  return "machine";
}

function resolveBoardItemFamily(
  item
) {
  if (
    item?.objectFamily
  ) {
    return String(
      item.objectFamily
    );
  }

  if (
    item?.objectType ===
    "system-index"
  ) {
    return "container";
  }

  if (
    item?.type ===
    "SELLER OBJECT"
  ) {
    return "seller";
  }

  return "machine";
}

const sortableItemIds = useMemo(
  () => items.map(item =>
    resolveBoardItemId(item)
  ),
  [
    items,
    getListingId,
    getCustomItemId
  ]
);

const renderedItems = useMemo(
  () =>
    marketplaceBrowsePerformance
      ? items.slice(0, renderLimit)
      : items,
  [
    items,
    renderLimit,
    marketplaceBrowsePerformance
  ]
);

useEffect(() => {
  if (!marketplaceBrowsePerformance) {
    return;
  }

  setRenderLimit(current =>
    Math.min(
      Math.max(
        current,
        IXI_INITIAL_BOARD_CARD_COUNT
      ),
      Math.max(
        items.length,
        IXI_INITIAL_BOARD_CARD_COUNT
      )
    )
  );
}, [
  items.length,
  marketplaceBrowsePerformance
]);

useEffect(() => {
  if (!marketplaceBrowsePerformance) {
    return undefined;
  }

  const target = loadMoreRef.current;

  if (
    !target ||
    renderLimit >= items.length
  ) {
    return undefined;
  }

  const observer = new IntersectionObserver(
    entries => {
      if (
        !entries.some(
          entry => entry.isIntersecting
        )
      ) {
        return;
      }

      setRenderLimit(current =>
        Math.min(
          current +
            IXI_BOARD_CARD_BATCH_SIZE,
          items.length
        )
      );
    },
    {
      rootMargin: "900px 0px"
    }
  );

  observer.observe(target);

  return () =>
    observer.disconnect();
}, [
  items.length,
  renderLimit,
  marketplaceBrowsePerformance
]);
  
const resolvedConsolePanelWidth =
  Number(
    consolePanelWidth ??
    cardScaleMetrics?.width ??
    298
  ) || 298;

const resolvedConsolePanelGap =
  Number(
    consolePanelGap ??
    cardScaleMetrics?.gap ??
    12
  ) || 12;
  
  return (
<SortableContext
  id="board"
  items={sortableItemIds}
  strategy={rectSortingStrategy}
>
    {renderedItems.map((item, itemIndex) => {
        const id =
  resolveBoardItemId(item);

      const objectType =
  resolveBoardItemType(
    item
  );

const objectFamily =
  resolveBoardItemFamily(
    item
  );

const sellerCardProps =
  typeof getSellerListingCardProps === "function"
    ? getSellerListingCardProps(item)
    : {};

const cardFamily =
  getMachineCardFamily(item);

const savedConsoleSlots =
  ixiCardState?.[id]
    ?.consoleSlots;

const legacyConsoleDepth =
  1 +
  (
    ixiCardState?.[id]
      ?.consoleLeftOpen === true
      ? 1
      : 0
  ) +
  (
    ixiCardState?.[id]
      ?.consoleRightOpen === true
      ? 1
      : 0
  );

const consoleDepth =
  Array.isArray(
    savedConsoleSlots
  ) &&
  savedConsoleSlots.length > 0
    ? savedConsoleSlots.length
    : legacyConsoleDepth;

const transactConsoleDepth =
  ixiCardState?.[id]
    ?.transactOpen === true
    ? Math.max(
        1,
        Math.floor(
          Number(
            ixiCardState?.[id]
              ?.transactConsoleDepth
          ) || 1
        )
      )
    : 1;

const scalePreset =
  getIXIScalePreset(
    cardScaleMode
  );

const transactFootprintWidth =
  transactConsoleDepth > 1
    ? (
        transactConsoleDepth *
        298 *
        scalePreset.scale
      )
    : null;

const effectiveConsoleDepth =
  Math.max(
    consoleDepth,
    transactConsoleDepth
  );

const customNativeSize =
  typeof getCustomItemNativeSize ===
    "function"
    ? getCustomItemNativeSize({
        item,
        id
      })
    : null;

const customNativeWidth =
  Number(
    customNativeSize?.width
  ) || 298;

const customNativeHeight =
  Number(
    customNativeSize?.height
  ) || 471;

const desktopSortableStyle = {
  width:
    transactFootprintWidth
      ? `${transactFootprintWidth}px`
      : "max-content",
  maxWidth: "none"
};

return (
 <IXISortableMachineCard
  key={id}

  id={id}

  containerId="board"

  objectType={
    objectType
  }

  objectFamily={
    objectFamily
  }

  dragData={{
    workspaceSurface:
      "board",

    sourceContainerId:
      "board"
  }}

    className={`ixi-board-sortable-card ${
      item?.type === "SELLER OBJECT"
        ? "ixi-seller-object-sortable-card"
        : ""
    } ${
      effectiveConsoleDepth > 1
        ? "ixi-console-expanded"
        : ""
    }`}

    style={{
      flex: "0 0 auto",
      ...desktopSortableStyle,
      ...(fitCardScalingToCell
        ? {
            width: "100%",
            maxWidth: "100%"
          }
        : {}),
      minWidth: 0,
      alignSelf: "flex-start"
    }}
  >
    {({ dragHandleProps }) => {
      const customItem =
        typeof renderCustomItem === "function"
          ? renderCustomItem({
              item,
              id,
              dragHandleProps
            })
          : null;

      return customItem ? (
  enableCardScaling ? (
    <IXIScaledCardShell
      size={
        cardScaleMode
      }

      objectFamily={
        objectFamily
      }

      nativeWidth={
        customNativeWidth
      }

      nativeHeight={
        customNativeHeight
      }
    >
      {customItem}
    </IXIScaledCardShell>
  ) : (
    customItem
  )
) : item?.type === "SELLER OBJECT" &&
        SellerObjectCard ? (
        <IXIScaledCardShell
          size={cardScaleMode}
        >
          <SellerObjectCard
            sellerObject={item}
            objectId={id}
            dragHandleProps={
              dragHandleProps
            }

            ixiState={
              ixiCardState[id] || {
                color: "none",
                outline: 1
              }
            }

            ixiCardState={
              ixiCardState
            }

            onIxiStateChange={
              updateIxiCardState
            }

            onRecoverSellerObject={
              onRecoverSellerObject
            }

            onCheckoutObject={
              onCheckoutObject
            }

            saved={
              savedIds.includes(id)
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

            onCycleSellerFace={() =>
              cycleMachineFace?.(id)
            }
          />
        </IXIScaledCardShell>
      ) : (
        <ConsoleRouterComponent
  cardFamily={cardFamily}
  cardContext={cardContext}

  objectId={id}
  item={item}
          sellerCardProps={
            sellerCardProps
          }

          ixiCardState={
            ixiCardState
          }

          updateIxiCardState={
            updateIxiCardState
          }

          enableCardScaling={
            enableCardScaling
          }

          fitCardScalingToCell={
            fitCardScalingToCell
          }

          fillCardScalingToCell={
            fillCardScalingToCell
          }

          cardScaleMode={
            cardScaleMode
          }

          dragHandleProps={
            dragHandleProps
          }

          renderParentCard={({
            consoleDepth:
              activeConsoleDepth,

            consoleLeftOpen:
              activeConsoleLeftOpen,

            consoleRightOpen:
              activeConsoleRightOpen,

            onExpandConsoleLeft,
            onExpandConsoleRight
          }) => (
            <IXIMachineCard
              listing={item}
              cardContext={
                cardContext
              }

consoleActuatorVariant={
  cardContext === "inventory" ||
  cardContext === "enterprise" ||
  cardContext === "auction-work" ||
  cardContext === "auction-market"
    ? "tall"
    : "compact"
}

              consoleDepth={
                activeConsoleDepth
              }

              onExpandConsoleLeft={
                onExpandConsoleLeft
              }

              onExpandConsoleRight={
                onExpandConsoleRight
              }

              consoleLeftOpen={
                activeConsoleLeftOpen
              }

              consoleRightOpen={
                activeConsoleRightOpen
              }

              saved={
                savedIds.includes(id)
              }

              onToggleSaved={() =>
                toggleSave(item)
              }

              from={listingOrigin}

              imagePriority={
                marketplaceBrowsePerformance &&
                itemIndex < 2
              }

              suppressFamilyLog={
                marketplaceBrowsePerformance
              }

              enableMarketplaceDistribution={
                enableMarketplaceDistribution
              }

              enableMarketplaceIntelligence={
                enableMarketplaceIntelligence
              }

              {...sellerCardProps}

              ixiState={
                ixiCardState[id] || {
                  color: "none",
                  outline: 1
                }
              }

              onIxiStateChange={
                updateIxiCardState
              }

              machineFace={
                ixiCardState[id]
                  ?.face || 1
              }

              onCycleMachineFace={() =>
                cycleMachineFace?.(id)
              }

              onSendFront={
                sendListingToFront
              }

              onSendBack={
                sendListingToBack
              }

              armedDestination={
                armedDestination
              }

              onSendToArmedDestination={
                sendMachineToArmedDestination
              }

              isBoardDraggingCard={
                String(id) ===
                String(
                  draggingListingId
                )
              }

              isGhostTarget={
                String(id) ===
                String(
                  ghostListingId
                )
              }

              useDndDrag={false}

              dragHandleProps={
                dragHandleProps
              }
            />
          )}
        />
      );
    }}
  </IXISortableMachineCard>
);
})}
{marketplaceBrowsePerformance &&
renderLimit < items.length ? (
  <div
    ref={loadMoreRef}
    className="ixi-board-load-boundary"
    data-rendered-card-count={
      renderedItems.length
    }
    data-total-card-count={
      items.length
    }
    aria-hidden="true"
    style={{
      flex: "0 0 100%",
      width: "100%",
      height: 1,
      pointerEvents: "none"
    }}
  />
) : null}
</SortableContext>
);
}
