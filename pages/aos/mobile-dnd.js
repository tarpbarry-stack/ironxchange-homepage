import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates
} from "@dnd-kit/sortable";

import IXIMachineCard from "../../components/ixi-machine-card/IXIMachineCard";
import IXIImmutableScaledSurface from "../../components/ixi-mobile/IXIImmutableScaledSurface";
import IXIDragEngine from "../../components/ixi-chassis/IXIDragEngine";
import IXISortableMachineCard from "../../components/ixi-chassis/IXISortableMachineCard";
import {
  createWorkspaceDragStartHandler,
  createWorkspaceDragCancelHandler,
  createWorkspaceDragEndHandler,
  workspaceCollisionDetection
} from "../../components/ixi-chassis/IXIDndEngineHelpers";
import {
  createEmptyWorkspacePlacements,
  getObjectWorkspaceSurface,
  moveObjectToWorkspacePosition,
  moveObjectToWorkspaceSurface,
  reorderObjectWithinWorkspaceSurface
} from "../../components/ixi-chassis/IXIWorkspacePlacementEngine";
import { hydrateIXIListingMedia } from "../../lib/listings/hydrateIXIListingMedia";
import { getListingId } from "../../lib/listingFormatters";

const MOBILE_TOUCH_HOLD_MS = 300;
const MOBILE_TOUCH_TOLERANCE_PX = 10;

function publicDataOf(listing = {}) {
  return listing?.publicData || listing?.attributes?.publicData || {};
}

function metadataOf(listing = {}) {
  return listing?.metadata || listing?.attributes?.metadata || {};
}

function getPassportId(listing = {}) {
  const publicData = publicDataOf(listing);
  return String(
    listing?.passportId ||
    publicData?.passportId ||
    listing?.ixiMedia?.passportId ||
    publicData?.ixiMedia?.passportId ||
    ""
  ).trim();
}

function isOwnedPrivateCandidate(listing = {}) {
  const publicData = publicDataOf(listing);
  const metadata = metadataOf(listing);
  const access = String(listing?.machineAccess || publicData?.machineAccess || metadata?.machineAccess || "").trim().toLowerCase();
  const channel = String(listing?.machineChannel || publicData?.machineChannel || metadata?.machineChannel || "").trim().toLowerCase();
  const ownershipRole = String(listing?.ownershipRole || publicData?.ownershipRole || metadata?.ownershipRole || "").trim().toLowerCase();
  const status = String(listing?.listingStatus || publicData?.listingStatus || metadata?.listingStatus || "").trim().toLowerCase();

  return (
    access === "private" &&
    channel !== "auction" &&
    channel !== "auction-archive" &&
    ownershipRole !== "non-owner" &&
    status !== "archived" &&
    status !== "deleted" &&
    Boolean(getPassportId(listing))
  );
}

export default function MobileTouchDndCertificationPage() {
  const [listings, setListings] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [layoutMode, setLayoutMode] = useState("I");
  const [activeDndId, setActiveDndId] = useState("");
  const [placements, setPlacements] = useState(() => createEmptyWorkspacePlacements());

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: MOBILE_TOUCH_HOLD_MS,
        tolerance: MOBILE_TOUCH_TOLERANCE_PX
      }
    }),
    useSensor(MouseSensor, {
      activationConstraint: { distance: 6 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUsersMachines() {
      try {
        const SharetribeSdk = await import("sharetribe-flex-sdk");
        const sdk = SharetribeSdk.createInstance({
          clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
        });
        const currentUserResponse = await sdk.currentUser.show();
        const currentUser = currentUserResponse?.data?.data;
        const userId = String(currentUser?.id?.uuid || currentUser?.id || "").trim();
        if (!userId) throw new Error("Authenticated IXI user session is required.");

        const response = await fetch(`/api/account-listings?authorId=${encodeURIComponent(userId)}`);
        const inventory = await response.json();
        if (!response.ok) throw new Error(inventory?.error || "Owner inventory could not be loaded.");

        const candidates = (Array.isArray(inventory) ? inventory : [])
          .filter(isOwnedPrivateCandidate)
          .slice(0, 8);

        if (candidates.length < 2) {
          throw new Error("At least two owned/private Passport machines are required for the touch DnD gate.");
        }

        const hydrated = await Promise.all(
          candidates.map(listing => hydrateIXIListingMedia(listing, { dedupeRequests: true }))
        );
        if (cancelled) return;

        const ids = hydrated.map(listing => String(getListingId(listing))).filter(Boolean);
        setListings(hydrated);
        setPlacements(current => ({ ...current, board: ids }));
        setStatus("ready");
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError?.message || "Authenticated AOS machines could not be loaded.");
        setStatus("error");
      }
    }

    loadCurrentUsersMachines();
    return () => { cancelled = true; };
  }, []);

  const listingById = useMemo(
    () => new Map(listings.map(listing => [String(getListingId(listing)), listing])),
    [listings]
  );

  const boardIds = useMemo(
    () => (Array.isArray(placements.board) ? placements.board : []).filter(id => listingById.has(String(id))),
    [placements.board, listingById]
  );

  const orderedListings = useMemo(
    () => boardIds.map(id => listingById.get(String(id))).filter(Boolean),
    [boardIds, listingById]
  );

  function clearMachineDragState() {}

  function getMachineContainer(objectId) {
    return getObjectWorkspaceSurface({ placements, objectId }) || "board";
  }

  function moveMachineWithinContainer(surfaceId, objectId, targetObjectId, insertAfter) {
    setPlacements(current =>
      reorderObjectWithinWorkspaceSurface({
        placements: current,
        surfaceId,
        objectId,
        targetObjectId,
        insertAfter
      })
    );
  }

  function moveMachineToContainerAtPosition(objectId, targetSurface, targetObjectId, insertAfter) {
    setPlacements(current =>
      moveObjectToWorkspacePosition({
        placements: current,
        objectId,
        targetSurface,
        targetObjectId,
        insertAfter
      })
    );
  }

  function moveMachineToContainer(objectId, targetSurface) {
    setPlacements(current =>
      moveObjectToWorkspaceSurface({
        placements: current,
        objectId,
        targetSurface
      })
    );
  }

  const handleWorkspaceDragStart = createWorkspaceDragStartHandler({ setActiveDndId });
  const handleWorkspaceDragCancel = createWorkspaceDragCancelHandler({
    setActiveDndId,
    clearMachineDragState
  });
  const handleWorkspaceDragEnd = createWorkspaceDragEndHandler({
    getMachineContainer,
    machineContainers: placements,
    moveMachineWithinContainer,
    moveMachineToContainerAtPosition,
    moveMachineToContainer,
    setActiveStacksOpen: () => {},
    setLeftPocketMode: () => {},
    setLeftPocket2Mode: () => {},
    setRightPocketMode: () => {},
    setRightPocket2Mode: () => {},
    setActiveDndId,
    clearMachineDragState
  });

  const activeListing = activeDndId ? listingById.get(String(activeDndId)) : null;
  const boardClassName = layoutMode === "II" ? "board board-two" : "board board-one";

  return (
    <>
      <Head>
        <title>IXI Mobile AOS Touch DnD Certification</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <main className="shell">
        <header className="header">
          <div><strong>IXI MOBILE · AOS · TOUCH DND</strong><span>SWIPE = SCROLL · HOLD 300MS + MOVE = DRAG</span></div>
          <div className="modeReadout"><span>{activeDndId ? "DRAG ACTIVE" : "SCROLL SAFE"}</span><span>{boardIds.length || "—"} MACHINES</span></div>
        </header>

        <nav className="layoutSwitch" aria-label="Mobile board density">
          <button type="button" className={layoutMode === "I" ? "active" : ""} aria-pressed={layoutMode === "I"} onClick={() => setLayoutMode("I")}>I</button>
          <button type="button" className={layoutMode === "II" ? "active" : ""} aria-pressed={layoutMode === "II"} onClick={() => setLayoutMode("II")}>II</button>
        </nav>

        {status === "loading" ? <div className="message">Loading your AOS DnD board…</div> : null}
        {status === "error" ? <div className="message error"><strong>DND GATE BLOCKED</strong><span>{error}</span></div> : null}

        {status === "ready" ? (
          <IXIDragEngine
            sensors={sensors}
            workspaceCollisionDetection={workspaceCollisionDetection}
            handleWorkspaceDragStart={handleWorkspaceDragStart}
            handleWorkspaceDragEnd={handleWorkspaceDragEnd}
            handleWorkspaceDragCancel={handleWorkspaceDragCancel}
            getActiveDndObject={() => activeListing}
            activeDndId={activeDndId}
            ixiCardState={{}}
            cardScaleMode="natural"
            cardContext="inventory"
            listingOrigin="aos-work"
          >
            <SortableContext items={boardIds} strategy={rectSortingStrategy}>
              <section className={boardClassName} data-layout-mode={layoutMode} data-touch-dnd="hold-300ms">
                {orderedListings.map(listing => {
                  const id = String(getListingId(listing));
                  return (
                    <IXISortableMachineCard
                      key={id}
                      id={id}
                      containerId="board"
                      objectType="machine"
                      objectFamily="private"
                      reorderBehavior="normal"
                      className="machineCell"
                    >
                      {({ dragHandleProps, isDragging }) => (
                        <IXIImmutableScaledSurface
                          nativeWidth={300}
                          nativeHeight={475}
                          horizontalPadding={layoutMode === "II" ? 4 : 16}
                          className={`mobile-dnd-machine-surface ${isDragging ? "dragging" : ""}`}
                        >
                          <IXIMachineCard
                            listing={listing}
                            cardContext="inventory"
                            sellerMode
                            machineFace={1}
                            showSave={false}
                            suppressFamilyLog
                            from="aos-work"
                            useDndDrag={false}
                            dragHandleProps={dragHandleProps}
                          />
                        </IXIImmutableScaledSurface>
                      )}
                    </IXISortableMachineCard>
                  );
                })}
              </section>
            </SortableContext>
          </IXIDragEngine>
        ) : null}
      </main>

      <style jsx>{`
        :global(html),:global(body){margin:0;min-width:0;overflow-x:hidden;background:#070707}
        .shell{box-sizing:border-box;min-height:100dvh;width:100%;padding:max(8px,env(safe-area-inset-top)) 0 max(28px,env(safe-area-inset-bottom));overflow-x:hidden;background:#070707;color:#f5f5f5;font-family:Inter,Arial,sans-serif}
        .header{box-sizing:border-box;width:calc(100% - 16px);margin:0 8px 8px;padding:10px 12px;display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:rgba(15,15,15,.94)}
        .header>div:first-child{min-width:0;display:grid;gap:3px}.header strong{color:#ffc400;font-size:11px;line-height:1.1;letter-spacing:.8px}.header span{color:rgba(255,255,255,.68);font-size:9px;line-height:1.2;letter-spacing:.45px}.modeReadout{flex:0 0 auto;display:grid;justify-items:end;gap:2px}.modeReadout span:first-child{color:#7fe1ff;font-weight:800}
        .layoutSwitch{box-sizing:border-box;width:calc(100% - 16px);margin:0 8px 10px;display:grid;grid-template-columns:1fr 1fr;gap:6px}.layoutSwitch button{height:44px;border:1px solid rgba(255,255,255,.13);border-radius:8px;background:#111;color:#8f9692;font:900 16px/1 Inter,Arial,sans-serif;letter-spacing:1px}.layoutSwitch button.active{border-color:rgba(255,196,0,.8);background:#19160b;color:#ffc400}
        .board{box-sizing:border-box;width:100%;display:grid;align-items:start;overflow:visible}.board-one{grid-template-columns:minmax(0,1fr);gap:12px 0}.board-two{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 0}
        :global(.machineCell){box-sizing:border-box;min-width:0;width:100%;align-self:start;overflow:visible}
        .message{margin:70px 16px 0;padding:18px;display:grid;gap:8px;text-align:center;font-size:12px;color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.08);border-radius:10px;background:#111}.message.error{color:#ff9b9b;border-color:rgba(255,80,80,.22)}.message strong{color:#ffc400;font-size:11px;letter-spacing:.7px}
      `}</style>

      <style jsx global>{`
        .mobile-dnd-machine-surface .card-board-zone{touch-action:auto;-webkit-user-select:none;user-select:none}
        .mobile-dnd-machine-surface.dragging{opacity:.28}
      `}</style>
    </>
  );
}
