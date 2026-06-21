import { SortableContext } from "@dnd-kit/sortable";
import { rectSortingStrategy } from "@dnd-kit/sortable";

import ListingCard from "../ListingCard";

import IXIScaledCardShell from "../ixi-machine-object/IXIScaledCardShell";

export default function IXIBoard({
  items = [],
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
  cardScaleMetrics
}) {
  
  return (
<SortableContext
  id="board"
  items={items.map(item =>
    item?.type === "SELLER OBJECT"
      ? String(item.id)
      : String(getListingId(item))
  )}
  strategy={rectSortingStrategy}
>
    {items.map(item => {
        const id =
          item?.type === "SELLER OBJECT"
            ? String(item.id)
            : String(getListingId(item));
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
             
     item?.type === "SELLER OBJECT" && SellerObjectCard ? (
  <IXIScaledCardShell size={cardScaleMode}>
    <SellerObjectCard
      sellerObject={item}
      dragHandleProps={dragHandleProps}
    />
  </IXIScaledCardShell>
) : enableCardScaling ? (
    <IXIScaledCardShell size={cardScaleMode}>
      <ListingCard
        listing={item}
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
    <ListingCard
      listing={item}
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
