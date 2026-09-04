import IXIMachineCard from "../ixi-machine-card/IXIMachineCard";
import { DndContext, DragOverlay } from "@dnd-kit/core";

import IXIScaledCardShell from "../ixi-machine-object/IXIScaledCardShell";
import { getMachineCardGeometryFamily } from "../ixi-machine-card/getMachineCardFamily";

const IXI_AOS_DRAG_NATIVE_WIDTH = 298;
const IXI_AOS_DRAG_NATIVE_HEIGHT = 471;

export default function IXIDragEngine({
  sensors,
  workspaceCollisionDetection,
  handleWorkspaceDragStart,
  handleWorkspaceDragEnd,
  handleWorkspaceDragCancel,
  children,
  getActiveDndObject,
  getActiveDndListing,
  renderActiveDndObject,
  renderActiveDndOverlay,
  SellerObjectCard,
  activeDndId,
  savedIds = [],
  ixiCardState = {},
  cardScaleMode = "xl",
  cardContext = "workspace",
  listingOrigin = "saved",
  overlayZIndex = 999
}) {
  const activeDndObject =
    typeof getActiveDndObject === "function"
      ? getActiveDndObject()
      : typeof getActiveDndListing === "function"
        ? getActiveDndListing()
        : null;

  const activeObjectType = String(activeDndObject?.objectType || "")
    .trim()
    .toLowerCase();

  const usesAosNativeGeometry =
    typeof renderActiveDndObject === "function" &&
    (activeObjectType === "system-index" ||
      (activeDndObject?.objectId && activeObjectType !== "machine"));

  const overlayObjectFamily = usesAosNativeGeometry
    ? "default"
    : activeDndObject?.type === "SELLER OBJECT"
      ? "seller"
      : getMachineCardGeometryFamily(activeDndObject || {}, cardContext);

  function renderOverlayObject() {
    if (!activeDndObject) return null;

    if (typeof renderActiveDndObject === "function") {
      const rendered = renderActiveDndObject({
        object: activeDndObject,
        objectId: String(activeDndId || ""),
        cardScaleMode
      });
      if (rendered) return rendered;
    }

    if (activeDndObject?.type === "SELLER OBJECT" && SellerObjectCard) {
      return (
        <SellerObjectCard
          sellerObject={activeDndObject}
          objectId={String(activeDndId || "")}
          ixiState={
            ixiCardState[String(activeDndId || "")] || {
              color: "none",
              outline: 1
            }
          }
        />
      );
    }

    return (
      <IXIMachineCard
        listing={activeDndObject}
        cardContext={cardContext}
        saved={savedIds.includes(String(activeDndId || ""))}
        onToggleSaved={() => {}}
        from={listingOrigin}
        suppressFamilyLog={listingOrigin === "browse"}
        ixiState={
          ixiCardState[String(activeDndId || "")] || {
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
    );
  }

  function renderOverlay() {
    if (!activeDndObject) return null;

    if (typeof renderActiveDndOverlay === "function") {
      const rendered = renderActiveDndOverlay({
        object: activeDndObject,
        objectId: String(activeDndId || ""),
        cardScaleMode
      });
      if (rendered) return rendered;
    }

    return (
      <div className="ixi-drag-overlay-card">
        <IXIScaledCardShell
          size={cardScaleMode}
          objectFamily={overlayObjectFamily}
          nativeWidth={usesAosNativeGeometry ? IXI_AOS_DRAG_NATIVE_WIDTH : undefined}
          nativeHeight={usesAosNativeGeometry ? IXI_AOS_DRAG_NATIVE_HEIGHT : undefined}
          tight
        >
          {renderOverlayObject()}
        </IXIScaledCardShell>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={workspaceCollisionDetection}
      onDragStart={handleWorkspaceDragStart}
      onDragEnd={handleWorkspaceDragEnd}
      onDragCancel={handleWorkspaceDragCancel}
    >
      {children}
      <DragOverlay dropAnimation={null} zIndex={overlayZIndex}>
        {renderOverlay()}
      </DragOverlay>
    </DndContext>
  );
}
