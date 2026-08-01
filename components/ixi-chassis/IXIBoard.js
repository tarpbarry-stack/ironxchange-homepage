import { SortableContext } from "@dnd-kit/sortable";
import { rectSortingStrategy } from "@dnd-kit/sortable";

import IXIMachineCard from "../ixi-machine-card/IXIMachineCard";

import IXIScaledCardShell from "../ixi-machine-object/IXIScaledCardShell";

import IXIAuctionObjectFace2
  from "../ixi-auction-object/IXIAuctionObjectFace2";

import {
  getMachineCardFamily
} from "../ixi-machine-card/getMachineCardFamily";

import {
  getConsoleDepth,
  getConsoleGridSpan
} from "./IXIObjectConsoleEngine";

export default function IXIBoard({
  items = [],
  cardContext = "workspace",  
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
  cardScaleMode = "xl",
  cardScaleMetrics,
   onRecoverSellerObject,
  onCheckoutObject,

  getCustomItemId,
renderCustomItem,

consolePanelWidth,
consolePanelGap,
}) {
  
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
  items={items.map(item =>
  resolveBoardItemId(item)
)}
  strategy={rectSortingStrategy}
>
    {items.map(item => {
        const id =
  resolveBoardItemId(item);

const consoleDepth =
  getConsoleDepth(
    ixiCardState,
    id
  );

const consoleSpan =
  getConsoleGridSpan(
    consoleDepth
  );

const consoleWidth =
  (
    consoleDepth *
    resolvedConsolePanelWidth
  ) +
  (
    Math.max(
      consoleDepth - 1,
      0
    ) *
    resolvedConsolePanelGap
  );

const sellerCardProps =
  typeof getSellerListingCardProps === "function"
    ? getSellerListingCardProps(item)
    : {};

const cardFamily =
  getMachineCardFamily(item);

const isAuctionCard =
  cardFamily === "auction";

const consoleIsOpen =
  consoleDepth > 1;

function toggleConsoleWidth(event) {
  event.preventDefault();
  event.stopPropagation();

  updateIxiCardState?.(
    id,
    {
      consoleDepth:
        consoleIsOpen
          ? 1
          : 2,

      consoleOpen:
        !consoleIsOpen,

      consoleUpdatedAt:
        Date.now()
    }
  );
}
      
        return (
  <IXISortableMachineCard
  key={id}
  id={id}
  containerId="board"

  className={`ixi-board-sortable-card ${
    item?.type === "SELLER OBJECT"
      ? "ixi-seller-object-sortable-card"
      : ""
  } ${
    consoleDepth > 1
      ? "ixi-console-expanded"
      : ""
  }`}

  style={{
    gridColumn:
      `span ${consoleSpan}`,

    width:
      `${consoleWidth}px`,

    maxWidth:
      consoleDepth > 1
        ? "none"
        : `${resolvedConsolePanelWidth}px`,

    justifySelf:
      "start"
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
      <IXIScaledCardShell size={cardScaleMode}>
        {customItem}
      </IXIScaledCardShell>
    ) : (
      customItem
    )
  ) : item?.type === "SELLER OBJECT" &&
    SellerObjectCard ? (
  <IXIScaledCardShell size={cardScaleMode}>
    <SellerObjectCard
  sellerObject={item}
  objectId={id}
  dragHandleProps={dragHandleProps}
  ixiState={
    ixiCardState[id] || {
      color: "none",
      outline: 1
    }
  }
  ixiCardState={ixiCardState}
  onIxiStateChange={updateIxiCardState}
  onRecoverSellerObject={onRecoverSellerObject}
  onCheckoutObject={onCheckoutObject}
      saved={savedIds.includes(id)}
      armedDestination={armedDestination}
      onSendFront={sendListingToFront}
      onSendBack={sendListingToBack}
           onSendToArmedDestination={sendMachineToArmedDestination}
      onCycleSellerFace={() => cycleMachineFace?.(id)}
    />
  </IXIScaledCardShell>
) : enableCardScaling ? (
  <div className="ixi-console-test-chassis">
    <IXIScaledCardShell size={cardScaleMode}>
      <IXIMachineCard
        listing={item}
        cardContext={cardContext}
        consoleDepth={consoleDepth}
        saved={savedIds.includes(id)}
        onToggleSaved={() => toggleSave(item)}
        from="saved"
        {...sellerCardProps}
        ixiState={
          ixiCardState[id] || {
            color: "none",
            outline: 1
          }
        }
        onIxiStateChange={updateIxiCardState}
        machineFace={ixiCardState[id]?.face || 1}
        onCycleMachineFace={() =>
          cycleMachineFace?.(id)
        }
        onSendFront={sendListingToFront}
        onSendBack={sendListingToBack}
        armedDestination={armedDestination}
        onSendToArmedDestination={
          sendMachineToArmedDestination
        }
        isBoardDraggingCard={
          String(id) ===
          String(draggingListingId)
        }
        isGhostTarget={
          String(id) ===
          String(ghostListingId)
        }
        useDndDrag={false}
        dragHandleProps={dragHandleProps}
      />
    </IXIScaledCardShell>

    {consoleIsOpen && isAuctionCard ? (
      <div className="ixi-console-child-wrap">
        <IXIScaledCardShell size={cardScaleMode}>
          <div className="ixi-console-child-card">
            <IXIAuctionObjectFace2
              listing={item}
              sourceListingUrl={
                sellerCardProps.sourceListingUrl ||
                ""
              }
              dragHandleProps={
                dragHandleProps
              }
              sellerMode={true}
              lotNumberValue={
                sellerCardProps.lotNumberValue
              }
              onLotNumberChange={
                sellerCardProps.onLotNumberChange
              }
              onLotNumberKeyDown={
                sellerCardProps.onLotNumberKeyDown
              }
              hoursValue={
                sellerCardProps.hoursValue
              }
              onHoursChange={
                sellerCardProps.onHoursChange
              }
              onHoursKeyDown={
                sellerCardProps.onHoursKeyDown
              }
              openingBidValue={
                sellerCardProps.priceValue
              }
              onOpeningBidChange={
                sellerCardProps.onPriceChange
              }
              onOpeningBidKeyDown={
                sellerCardProps.onPriceKeyDown
              }
            />
          </div>
        </IXIScaledCardShell>
      </div>
    ) : null}

    <button
      type="button"
      className={`ixi-console-test-actuator ${
        consoleIsOpen
          ? "is-open"
          : ""
      }`}
      aria-label={
        consoleIsOpen
          ? "Close object console"
          : "Open object console"
      }
      title={
        consoleIsOpen
          ? "Close console"
          : "Open console"
      }
      onPointerDown={event => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={toggleConsoleWidth}
    />
  </div>
) : (
  <div className="ixi-console-test-chassis">
  <IXIMachineCard
  listing={item}
  cardContext={cardContext}
  consoleDepth={consoleDepth}
    saved={savedIds.includes(id)}
    onToggleSaved={() => toggleSave(item)}
    from="saved"
    {...sellerCardProps}
    ixiState={
      ixiCardState[id] || {
        color: "none",
        outline: 1
      }
    }
    onIxiStateChange={updateIxiCardState}
    machineFace={ixiCardState[id]?.face || 1}
    onCycleMachineFace={() => cycleMachineFace?.(id)}
    onSendFront={sendListingToFront}
    onSendBack={sendListingToBack}
    armedDestination={armedDestination}
    onSendToArmedDestination={sendMachineToArmedDestination}
    isBoardDraggingCard={
      String(id) === String(draggingListingId)
    }
    isGhostTarget={
      String(id) === String(ghostListingId)
    }
        useDndDrag={false}
    dragHandleProps={dragHandleProps}
  />

{consoleIsOpen && isAuctionCard ? (
  <div className="ixi-console-empty-panel">
    <IXIAuctionObjectFace2
      listing={item}

      sourceListingUrl={
        sellerCardProps.sourceListingUrl ||
        ""
      }

      dragHandleProps={
        dragHandleProps
      }

      sellerMode={true}

      lotNumberValue={
        sellerCardProps.lotNumberValue
      }

      onLotNumberChange={
        sellerCardProps.onLotNumberChange
      }

      onLotNumberKeyDown={
        sellerCardProps.onLotNumberKeyDown
      }

      hoursValue={
        sellerCardProps.hoursValue
      }

      onHoursChange={
        sellerCardProps.onHoursChange
      }

      onHoursKeyDown={
        sellerCardProps.onHoursKeyDown
      }

      openingBidValue={
        sellerCardProps.priceValue
      }

      onOpeningBidChange={
        sellerCardProps.onPriceChange
      }

      onOpeningBidKeyDown={
        sellerCardProps.onPriceKeyDown
      }
    />
  </div>
) : null}
      
 <button
    type="button"
    className={`ixi-console-test-actuator ${
      consoleIsOpen
        ? "is-open"
        : ""
    }`}
    aria-label={
      consoleIsOpen
        ? "Close object console"
        : "Open object console"
    }
    title={
      consoleIsOpen
        ? "Close console"
        : "Open console"
    }
    onPointerDown={event => {
      event.preventDefault();
      event.stopPropagation();
    }}
    onClick={toggleConsoleWidth}
  />
</div>

);

}}
</IXISortableMachineCard>
        );
            })}
<style jsx>{`
  .ixi-console-test-chassis {
  position: relative;

  width: 100%;

  display: flex;
  align-items: flex-start;
  gap: 0;

  overflow: visible;
}
.ixi-console-empty-panel {
  width: 298px;
  min-width: 298px;

  height: 470px;
  min-height: 470px;
  max-height: 470px;

  position: relative;

  flex: 0 0 298px;

  /*
   * The child belongs to the parent object.
   * Overlap the two borders by one pixel so
   * there is one shared seam and no space.
   */
  margin-left: -1px;

  border: 1px solid rgba(255, 255, 255, .10);
  border-radius: 13px;

  background:
    linear-gradient(
      180deg,
      rgba(28, 31, 36, .98),
      rgba(15, 17, 20, .98)
    );

  box-shadow:
    0 10px 28px rgba(0, 0, 0, .34),
    inset 0 1px 0 rgba(255, 255, 255, .04);

  overflow: hidden;
}

  .ixi-console-test-actuator {
    position: absolute;

    top: 50%;
    right: -8px;

    width: 8px;
    height: 58px;

    transform: translateY(-50%);

    padding: 0;

    border:
      1px solid
      rgba(255, 196, 0, .46);

    border-radius:
      3px 0 0 3px;

    background:
      rgba(255, 196, 0, .22);

    cursor: pointer;

    z-index: 300;
  }

  .ixi-console-test-actuator:hover,
  .ixi-console-test-actuator.is-open {
    background:
      rgba(255, 196, 0, .88);

    box-shadow:
      0 0 10px
      rgba(255, 196, 0, .30);
  }
`}</style>
</SortableContext>
  );
}
