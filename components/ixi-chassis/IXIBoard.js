import { SortableContext } from "@dnd-kit/sortable";
import { rectSortingStrategy } from "@dnd-kit/sortable";

import IXIMachineCard from "../ixi-machine-card/IXIMachineCard";

import IXIScaledCardShell from "../ixi-machine-object/IXIScaledCardShell";

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
    300
  ) || 300;

const resolvedConsolePanelGap =
  Number(
    consolePanelGap ??
    cardScaleMetrics?.gap ??
    0
  ) || 0;
  
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
          typeof getSellerListingCardProps === "function"
            ? getSellerListingCardProps(item)
            : {};

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
  </IXIScaledCardShell>
) : (
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
);

}}
</IXISortableMachineCard>
        );
            })}
</SortableContext>
  );
}
