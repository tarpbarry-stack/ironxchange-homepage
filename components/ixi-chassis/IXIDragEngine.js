import { DndContext, DragOverlay } from "@dnd-kit/core";
import ListingCard from "../ListingCard";

import IXIScaledCardShell from "../ixi-machine-object/IXIScaledCardShell";

export default function IXIDragEngine({
  sensors,
  workspaceCollisionDetection,
  handleWorkspaceDragStart,
  handleWorkspaceDragEnd,
  handleWorkspaceDragCancel,
  children,
  getActiveDndListing,
  getActiveDndObject,
  SellerObjectCard,
  activeDndId,
  savedIds,
  ixiCardState,
  cardScaleMode = "xl"
}) {
  const activeDndObject =
    typeof getActiveDndObject === "function"
      ? getActiveDndObject()
      : typeof getActiveDndListing === "function"
        ? getActiveDndListing()
        : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={workspaceCollisionDetection}
      onDragStart={handleWorkspaceDragStart}
      onDragEnd={handleWorkspaceDragEnd}
      onDragCancel={handleWorkspaceDragCancel}
    >
      {children}

     <DragOverlay>
  {activeDndObject ? (
    <div className="ixi-drag-overlay-card">
      {activeDndObject?.type === "SELLER OBJECT" && SellerObjectCard ? (
        <SellerObjectCard
          sellerObject={activeDndObject}
        />
      ) : (
        <IXIScaledCardShell size={cardScaleMode}>
          <ListingCard
            listing={activeDndObject}
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
        </IXIScaledCardShell>
      )}
    </div>
  ) : null}
</DragOverlay>
    </DndContext>
  );
}
