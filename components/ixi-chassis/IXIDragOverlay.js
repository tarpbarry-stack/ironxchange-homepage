import { DragOverlay } from "@dnd-kit/core";
import ListingCard from "../ListingCard";

export default function IXIDragOverlay({
  activeListing,
  activeDndId,
  savedIds,
  ixiCardState
}) {
  return (
     <DragOverlay>
        {getActiveDndListing() ? (
          <div className="ixi-drag-overlay-card">
            <ListingCard
              listing={getActiveDndListing()}
              saved={savedIds.includes(String(activeDndId))}
              onToggleSaved={() => {}}
              from="saved"
              ixiState={
                ixiCardState[String(activeDndId)] || {
                  color: "none",
                  outline: 1
                }
              }
              onIxiStateChange={() => {}}
              onSendFront={() => {}}
              onSendBack={() => {}}
              isBoardDraggingCard={false}
              isGhostTarget={false}
              onBoardDragStart={() => {}}
              onBoardDragOver={() => {}}
              onBoardDragEnd={() => {}}
              useDndDrag={false}
            />
          </div>
        ) : null}
      </DragOverlay>
  );
}
