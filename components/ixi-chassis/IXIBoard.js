import { SortableContext } from "@dnd-kit/sortable";
import { rectSortingStrategy } from "@dnd-kit/sortable";

import ListingCard from "../ListingCard";

export default function IXIBoard({
  items = [],
  getListingId,
  savedIds = [],
  ixiCardState = {},
  IXISortableMachineCard,
  toggleSave,
  updateIxiCardState,
  sendListingToFront,
  sendListingToBack,
  armedDestination,
  sendMachineToArmedDestination,
  draggingListingId,
  ghostListingId,
  getSellerListingCardProps
}) {
  return (
    <SortableContext
      id="board"
      items={items.map(item => String(getListingId(item)))}
      strategy={rectSortingStrategy}
    >
      {items.map(item => {
        const id = String(getListingId(item));

        const sellerCardProps =
          typeof getSellerListingCardProps === "function"
            ? getSellerListingCardProps(item)
            : {};

        return (
          <IXISortableMachineCard
            key={id}
            id={id}
            containerId="board"
            className="ixi-board-sortable-card"
          >
            {({ dragHandleProps }) => (
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
            )}
          </IXISortableMachineCard>
        );
      })}
    </SortableContext>
  );
}
