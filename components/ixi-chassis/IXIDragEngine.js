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
  activeDndId,
  savedIds,
  ixiCardState,
  cardScaleMode = "xl"
}) {
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
        {getActiveDndListing() ? (
          <div className="ixi-drag-overlay-card">
  <IXIScaledCardShell size={cardScaleMode}>
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
  </IXIScaledCardShell>
</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
