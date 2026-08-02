import { SortableContext } from "@dnd-kit/sortable";
import { rectSortingStrategy } from "@dnd-kit/sortable";

import IXIMachineCard from "../ixi-machine-card/IXIMachineCard";

import IXIScaledCardShell from "../ixi-machine-object/IXIScaledCardShell";

import IXIObjectConsole
  from "./IXIObjectConsole";

import {
  getMachineCardFamily
} from "../ixi-machine-card/getMachineCardFamily";

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

const sellerCardProps =
  typeof getSellerListingCardProps === "function"
    ? getSellerListingCardProps(item)
    : {};

const cardFamily =
  getMachineCardFamily(item);

const isAuctionCard =
  cardFamily === "auction";

const consoleLeftOpen =
  ixiCardState?.[id]?.consoleLeftOpen === true;

const consoleRightOpen =
  ixiCardState?.[id]?.consoleRightOpen === true;

const consoleDepth =
  1 +
  (consoleLeftOpen ? 1 : 0) +
  (consoleRightOpen ? 1 : 0);


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
  flex:
    "0 0 auto",

  width:
    "max-content",

  maxWidth:
    "none",

  minWidth:
    0,

  alignSelf:
    "flex-start"
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

 ) : (
  <IXIObjectConsole
    objectId={id}
    item={item}
    cardFamily={cardFamily}
    sellerCardProps={sellerCardProps}

    ixiCardState={ixiCardState}
    updateIxiCardState={updateIxiCardState}

    enableCardScaling={enableCardScaling}
    cardScaleMode={cardScaleMode}

    dragHandleProps={dragHandleProps}

    renderParentCard={({
      consoleDepth: activeConsoleDepth,
      consoleLeftOpen: activeConsoleLeftOpen,
      consoleRightOpen: activeConsoleRightOpen,
      onExpandConsoleLeft,
      onExpandConsoleRight
    }) => (
      <IXIMachineCard
        listing={item}
        cardContext={cardContext}
        consoleDepth={activeConsoleDepth}

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

        saved={savedIds.includes(id)}

        onToggleSaved={() =>
          toggleSave(item)
        }

        from="saved"

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
          ixiCardState[id]?.face || 1
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
          String(draggingListingId)
        }

        isGhostTarget={
          String(id) ===
          String(ghostListingId)
        }

        useDndDrag={false}

        dragHandleProps={
          dragHandleProps
        }
      />
    )}
  />
)

}}
</IXISortableMachineCard>
        );
            })}


</SortableContext>
  );
}
