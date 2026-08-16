import IXIMachineCard from "../ixi-machine-card/IXIMachineCard";
import {
  DndContext,
  DragOverlay
} from "@dnd-kit/core";


import IXIScaledCardShell
  from "../ixi-machine-object/IXIScaledCardShell";


const IXI_DRAG_NATIVE_WIDTH = 298;
const IXI_DRAG_NATIVE_HEIGHT = 471;


export default function IXIDragEngine({
  sensors,

  workspaceCollisionDetection,

  handleWorkspaceDragStart,
  handleWorkspaceDragEnd,
  handleWorkspaceDragCancel,

  children,

  /*
   * UNIVERSAL OBJECT RESOLVER
   *
   * Preferred path for AOS and future
   * universal IXI object environments.
   */
  getActiveDndObject,

  /*
   * LEGACY RESOLVER
   *
   * Marketplace / Saved / existing
   * environments may still provide this.
   */
  getActiveDndListing,

  /*
   * UNIVERSAL OVERLAY RENDER CONTRACT
   *
   * The environment decides how a
   * non-listing object looks.
   *
   * Examples:
   * system index
   * container
   * job
   * location
   * person
   * tool
   */
  renderActiveDndObject,

  /*
   * LEGACY SELLER COMPATIBILITY
   */
  SellerObjectCard,

  activeDndId,

  savedIds = [],

  ixiCardState = {},

  cardScaleMode = "xl"
}) {
  const activeDndObject =
    typeof getActiveDndObject === "function"
      ? getActiveDndObject()
      : typeof getActiveDndListing === "function"
        ? getActiveDndListing()
        : null;


  function renderOverlayObject() {
    if (!activeDndObject) {
      return null;
    }


    /*
     * UNIVERSAL OBJECT RENDER PATH
     *
     * AOS currently uses this for
     * System Index / Equipment.
     *
     * Future object families can use
     * the same contract without making
     * IXIDragEngine understand them.
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
     * LEGACY SELLER OBJECT FALLBACK
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
                activeDndId || ""
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
     * Keeps Marketplace, Saved,
     * Inventory, Auction, etc.
     * functioning while the universal
     * object contract rolls outward.
     */
    return (
      <IXIMachineCard
        listing={
          activeDndObject
        }

        saved={
          savedIds.includes(
            String(
              activeDndId || ""
            )
          )
        }

        onToggleSaved={() => {}}

        from="saved"

        ixiState={
          ixiCardState[
            String(
              activeDndId || ""
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


      <DragOverlay
        dropAnimation={null}
      >
        {activeDndObject ? (
          <div
            className="
              ixi-drag-overlay-card
            "
          >
            <IXIScaledCardShell
              size={
                cardScaleMode
              }

              nativeWidth={
                IXI_DRAG_NATIVE_WIDTH
              }

              nativeHeight={
                IXI_DRAG_NATIVE_HEIGHT
              }

              tight
            >
              {renderOverlayObject()}
            </IXIScaledCardShell>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
