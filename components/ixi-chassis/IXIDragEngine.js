import {
  DndContext,
  DragOverlay
} from "@dnd-kit/core";

import ListingCard
  from "../ListingCard";


export default function IXIDragEngine({
  sensors,
  workspaceCollisionDetection,

  handleWorkspaceDragStart,
  handleWorkspaceDragEnd,
  handleWorkspaceDragCancel,

  children,

  /*
   * Universal object resolver.
   */
  getActiveDndObject,

  /*
   * Legacy resolver.
   * Keep during migration.
   */
  getActiveDndListing,

  /*
   * UNIVERSAL OVERLAY RENDER CONTRACT.
   *
   * Environment decides how its
   * object should look while dragging.
   */
  renderActiveDndObject,

  /*
   * Legacy Seller compatibility.
   */
  SellerObjectCard,

  activeDndId,

  savedIds = [],
  ixiCardState = {},

  cardScaleMode = "xl"
}) {
  const activeDndObject =
    typeof getActiveDndObject ===
    "function"
      ? getActiveDndObject()
      : typeof getActiveDndListing ===
        "function"
        ? getActiveDndListing()
        : null;

  function renderOverlayObject() {
    if (!activeDndObject) {
      return null;
    }

    /*
     * UNIVERSAL PATH
     *
     * AOS and future object environments
     * should render through this contract.
     */
    if (
      typeof renderActiveDndObject ===
      "function"
    ) {
      const rendered =
        renderActiveDndObject({
          object:
            activeDndObject,

          objectId:
            String(
              activeDndId || ""
            ),

          cardScaleMode
        });

      if (rendered) {
        return rendered;
      }
    }

    /*
     * LEGACY SELLER COMPATIBILITY
     */
    if (
      activeDndObject?.type ===
        "SELLER OBJECT" &&
      SellerObjectCard
    ) {
      return (
        <SellerObjectCard
          sellerObject={
            activeDndObject
          }

          objectId={
            String(
              activeDndId || ""
            )
          }

          ixiState={
            ixiCardState[
              String(
                activeDndId
              )
            ] || {
              color: "none",
              outline: 1
            }
          }
        />
      );
    }

    /*
     * LEGACY MACHINE / LISTING FALLBACK
     *
     * Marketplace, Saved, Inventory,
     * Auction, etc. remain intact while
     * environments migrate.
     */
    return (
      <ListingCard
        listing={
          activeDndObject
        }

        saved={
          savedIds.includes(
            String(
              activeDndId
            )
          )
        }

        onToggleSaved={() => {}}

        from="saved"

        ixiState={
          ixiCardState[
            String(
              activeDndId
            )
          ] || {
            color: "none",
            outline: 1
          }
        }

        onIxiStateChange={() => {}}

        onSendFront={() => {}}
        onSendBack={() => {}}

        isBoardDraggingCard={
          false
        }

        isGhostTarget={
          false
        }

        onBoardDragStart={() => {}}
        onBoardDragOver={() => {}}
        onBoardDragEnd={() => {}}

        useDndDrag={
          false
        }
      />
    );
  }

  return (
    <DndContext
      sensors={
        sensors
      }

      collisionDetection={
        workspaceCollisionDetection
      }

      onDragStart={
        handleWorkspaceDragStart
      }

      onDragEnd={
        handleWorkspaceDragEnd
      }

      onDragCancel={
        handleWorkspaceDragCancel
      }
    >
      {children}

      <DragOverlay>
        {activeDndObject ? (
          <div className="ixi-drag-overlay-card">
            {renderOverlayObject()}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
