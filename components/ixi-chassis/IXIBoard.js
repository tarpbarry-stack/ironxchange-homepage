import { SortableContext } from "@dnd-kit/sortable";
import { rectSortingStrategy } from "@dnd-kit/sortable";

import IXIMachineCard from "../ixi-machine-card/IXIMachineCard";

import IXIScaledCardShell from "../ixi-machine-object/IXIScaledCardShell";

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

        return (
  <IXISortableMachineCard
  key={id}
  id={id}
  containerId="board"
  className={`ixi-board-sortable-card ${
    item?.type === "SELLER OBJECT" ? "ixi-seller-object-sortable-card" : ""
  }`}
>
          {({ dragHandleProps }) => (
  typeof renderCustomItem === "function" &&
  renderCustomItem({
    item,
    id,
    dragHandleProps
  }) ? (
    renderCustomItem({
      item,
      id,
      dragHandleProps
    })
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
)
)}
          </IXISortableMachineCard>
        );
            })}
</SortableContext>
  );
}
