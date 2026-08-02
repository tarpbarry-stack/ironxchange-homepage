import { SortableContext } from "@dnd-kit/sortable";
import { rectSortingStrategy } from "@dnd-kit/sortable";

import IXIMachineCard from "../ixi-machine-card/IXIMachineCard";

import IXIScaledCardShell from "../ixi-machine-object/IXIScaledCardShell";

import IXIAuctionObjectFace2
  from "../ixi-auction-object/IXIAuctionObjectFace2";

import IXIAuctionObjectFace3
  from "../ixi-auction-object/IXIAuctionObjectFace3";

import IXIAuctionObjectFace4
  from "../ixi-auction-object/IXIAuctionObjectFace4";

import {
  getMachineCardFamily
} from "../ixi-machine-card/getMachineCardFamily";

import {
  getConsoleDepth,
  getConsoleGridSpan,
  normalizeConsoleSlots,
  cycleConsoleSlotFace,
  createConsoleSlotsPatch
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

const savedConsoleSlots =
  ixiCardState?.[id]
    ?.consoleSlots;

const consoleSlots =
  Array.isArray(savedConsoleSlots) &&
  savedConsoleSlots.length >= 2
    ? normalizeConsoleSlots(
        savedConsoleSlots,
        {
          maxSlots: 4
        }
      )
    : [
        {
          slotId: "slot-1",
          face:
            ixiCardState[id]?.face ||
            1
        },
        {
          slotId: "slot-2",
          face: 2
        }
      ];

const childConsoleSlot =
  consoleSlots[1] || {
    slotId: "slot-2",
    face: 2
  };

const childConsoleFace =
  Number(
    childConsoleSlot.face
  ) || 2;

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

function cycleChildConsoleFace(
  event
) {
  event.preventDefault();
  event.stopPropagation();

  const nextSlots =
    cycleConsoleSlotFace({
      slots:
        consoleSlots,

      slotId:
        childConsoleSlot.slotId,

      maxFace: 4
    });

  updateIxiCardState?.(
    id,
    createConsoleSlotsPatch(
      nextSlots
    )
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
            {childConsoleFace === 3 ? (
  <IXIAuctionObjectFace3
    listing={item}
    dragHandleProps={
      dragHandleProps
    }
  />
) : childConsoleFace === 4 ? (
  <IXIAuctionObjectFace4
    listing={item}
    dragHandleProps={
      dragHandleProps
    }
    auctionDispositionBusy={
      sellerCardProps
        .auctionDispositionBusy
    }
    onAuctionDisposition={
      sellerCardProps
        .onAuctionDisposition
    }
  />
) : (
  <IXIAuctionObjectFace2
    listing={item}
    sourceListingUrl={
      sellerCardProps
        .sourceListingUrl ||
      ""
    }
    dragHandleProps={
      dragHandleProps
    }
    sellerMode={true}
    lotNumberValue={
      sellerCardProps
        .lotNumberValue
    }
    onLotNumberChange={
      sellerCardProps
        .onLotNumberChange
    }
    onLotNumberKeyDown={
      sellerCardProps
        .onLotNumberKeyDown
    }
    hoursValue={
      sellerCardProps
        .hoursValue
    }
    onHoursChange={
      sellerCardProps
        .onHoursChange
    }
    onHoursKeyDown={
      sellerCardProps
        .onHoursKeyDown
    }
    openingBidValue={
      sellerCardProps
        .priceValue
    }
    onOpeningBidChange={
      sellerCardProps
        .onPriceChange
    }
    onOpeningBidKeyDown={
      sellerCardProps
        .onPriceKeyDown
    }
  />
)}
             <button
  type="button"
  className="ixi-console-child-face-button"
  aria-label="Change child auction face"
  title={`Auction face ${childConsoleFace}`}
  onPointerDown={event => {
    event.preventDefault();
    event.stopPropagation();
  }}
  onClick={cycleChildConsoleFace}
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
    {childConsoleFace === 3 ? (
  <IXIAuctionObjectFace3
    listing={item}
    dragHandleProps={
      dragHandleProps
    }
  />
) : childConsoleFace === 4 ? (
  <IXIAuctionObjectFace4
    listing={item}
    dragHandleProps={
      dragHandleProps
    }
    auctionDispositionBusy={
      sellerCardProps
        .auctionDispositionBusy
    }
    onAuctionDisposition={
      sellerCardProps
        .onAuctionDisposition
    }
  />
) : (
  <IXIAuctionObjectFace2
    listing={item}
    sourceListingUrl={
      sellerCardProps
        .sourceListingUrl ||
      ""
    }
    dragHandleProps={
      dragHandleProps
    }
    sellerMode={true}
    lotNumberValue={
      sellerCardProps
        .lotNumberValue
    }
    onLotNumberChange={
      sellerCardProps
        .onLotNumberChange
    }
    onLotNumberKeyDown={
      sellerCardProps
        .onLotNumberKeyDown
    }
    hoursValue={
      sellerCardProps
        .hoursValue
    }
    onHoursChange={
      sellerCardProps
        .onHoursChange
    }
    onHoursKeyDown={
      sellerCardProps
        .onHoursKeyDown
    }
    openingBidValue={
      sellerCardProps
        .priceValue
    }
    onOpeningBidChange={
      sellerCardProps
        .onPriceChange
    }
    onOpeningBidKeyDown={
      sellerCardProps
        .onPriceKeyDown
    }
  />
)}

<button
  type="button"
  className="ixi-console-child-face-button"
  aria-label="Change child auction face"
  title={`Auction face ${childConsoleFace}`}
  onPointerDown={event => {
    event.preventDefault();
    event.stopPropagation();
  }}
  onClick={cycleChildConsoleFace}
/>
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
.ixi-console-child-wrap {
  position: relative;
  flex: 0 0 auto;
  margin-left: -1px;
}

.ixi-console-child-card {
  box-sizing: border-box;

  width: 100%;

  height: 471px;
  min-height: 471px;
  max-height: 471px;

  position: relative;

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

  overflow: visible;
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

.ixi-console-child-face-button {
  position: absolute;

  left: 50%;
  right: auto;
  bottom: -1px;

  width: 34px;
  height: 5px;

  transform: translateX(-50%);

  border: 0;
  border-radius: 3px 3px 1px 1px;

  background: rgba(255,255,255,.18);

  padding: 0;
  cursor: pointer;

  z-index: 120;
  pointer-events: auto;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.12),
    0 1px 3px rgba(0,0,0,.32);
}

.ixi-console-child-face-button:hover {
  background: rgba(255,196,0,.95);

  box-shadow:
    0 0 8px rgba(255,196,0,.38);
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
