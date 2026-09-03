import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import {
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates
} from "@dnd-kit/sortable";

import IXIMachineCard from "../../components/ixi-machine-card/IXIMachineCard";
import IXIDragEngine from "../../components/ixi-chassis/IXIDragEngine";
import IXISortableMachineCard from "../../components/ixi-chassis/IXISortableMachineCard";
import IXIScaledCardShell from "../../components/ixi-machine-object/IXIScaledCardShell";
import {
  workspaceCollisionDetection,
  createWorkspaceDragStartHandler,
  createWorkspaceDragCancelHandler,
  createWorkspaceDragEndHandler
} from "../../components/ixi-chassis/IXIDndEngineHelpers";
import { IXI_COMMANDS } from "../../components/ixi-object-system/IXICommandBus";
import { hydrateIXIListingMedia } from "../../lib/listings/hydrateIXIListingMedia";
import { getListingId } from "../../lib/listingFormatters";
import {
  fetchIxiMachineState,
  saveIxiMachinePatch
} from "../../lib/ixiMachineStateClient";

const IXI_AOS_WORK_LAYOUT_ID = "__ixi_aos_work_layout__";
const I_SCALE_MODE = "focus";
const II_SCALE_MODE = "compact";

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

function normalizePlacements(raw = {}) {
  const source = raw && typeof raw === "object" ? raw : {};
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.map(String).filter(Boolean) : []
    ])
  );
}

function chooseSourceSurface(placements, listingIds) {
  const preferred = ["board", "indexEquipment"];

  for (const surfaceId of preferred) {
    const ids = (placements?.[surfaceId] || [])
      .map(String)
      .filter(id => listingIds.has(id));

    if (ids.length >= 2) {
      return { surfaceId, ids };
    }
  }

  for (const [surfaceId, rawIds] of Object.entries(placements || {})) {
    const ids = Array.isArray(rawIds)
      ? rawIds.map(String).filter(id => listingIds.has(id))
      : [];

    if (ids.length >= 2) {
      return { surfaceId, ids };
    }
  }

  return { surfaceId: "", ids: [] };
}

export default function MobileBoardCertificationPage() {
  const [listings, setListings] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [layoutMode, setLayoutMode] = useState("I");
  const [ixiUserId, setIxiUserId] = useState("");
  const [ixiCardState, setIxiCardState] = useState({});
  const [placements, setPlacements] = useState({});
  const [sourceSurface, setSourceSurface] = useState("");
  const [activeDndId, setActiveDndId] = useState("");

  const cardScaleMode = layoutMode === "II" ? II_SCALE_MODE : I_SCALE_MODE;

  const sensors = useSensors(
    useSensor(PointerSensor, {
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

        const [inventoryResponse, remoteStateResponse] = await Promise.all([
          fetch(`/api/account-listings?authorId=${encodeURIComponent(userId)}`),
          fetchIxiMachineState(userId)
        ]);

        const inventory = await inventoryResponse.json();
        if (!inventoryResponse.ok) {
          throw new Error(inventory?.error || "Owner inventory could not be loaded.");
        }

        const hydrated = await Promise.all(
          (Array.isArray(inventory) ? inventory : [])
            .filter(isOwnedPrivateCandidate)
            .map(listing => hydrateIXIListingMedia(listing, { dedupeRequests: true }))
        );

        const listingIds = new Set(
          hydrated.map(listing => String(getListingId(listing))).filter(Boolean)
        );

        const remoteState = remoteStateResponse?.state || remoteStateResponse || {};
        const layoutRecord = remoteState?.[IXI_AOS_WORK_LAYOUT_ID] || {};
        const savedPlacements = normalizePlacements(
          layoutRecord?.workspacePlacements || layoutRecord?.machineContainers || {}
        );

        let naturalSource = chooseSourceSurface(savedPlacements, listingIds);

        if (!naturalSource.surfaceId) {
          const fallbackIds = hydrated
            .map(listing => String(getListingId(listing)))
            .filter(Boolean);

          if (fallbackIds.length < 2) {
            throw new Error("At least two owned/private Passport machines are required for mobile board DnD.");
          }

          const fallbackSurface = "board";
          const nextPlacements = {
            ...savedPlacements,
            [fallbackSurface]: fallbackIds
          };

          naturalSource = {
            surfaceId: fallbackSurface,
            ids: fallbackIds
          };

          if (!cancelled) {
            setPlacements(nextPlacements);
          }
        }

        if (cancelled) return;

        setIxiUserId(userId);
        setListings(hydrated);
        setIxiCardState(remoteState);
        setPlacements(current => Object.keys(current).length ? current : savedPlacements);
        setSourceSurface(naturalSource.surfaceId);
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

  const sourceIds = useMemo(
    () => (Array.isArray(placements?.[sourceSurface]) ? placements[sourceSurface] : [])
      .map(String)
      .filter(id => listingById.has(id)),
    [placements, sourceSurface, listingById]
  );

  const orderedListings = useMemo(
    () => sourceIds.map(id => listingById.get(id)).filter(Boolean),
    [sourceIds, listingById]
  );

  function saveWorkspaceLayout(nextPlacements) {
    if (!ixiUserId) return null;

    return saveIxiMachinePatch({
      userId: ixiUserId,
      listingId: IXI_AOS_WORK_LAYOUT_ID,
      patch: {
        workspacePlacements: nextPlacements,
        machineContainers: nextPlacements,
        updatedAt: Date.now()
      }
    });
  }

  function executeIXITransaction(result) {
    if (!result) return;

    const nextIxiCardState = result.nextIxiCardState || ixiCardState;
    const nextPlacements = result.nextMachineContainers || placements;

    setIxiCardState(nextIxiCardState);
    setPlacements(nextPlacements);

    const patches = Array.isArray(result.patchesToPersist)
      ? result.patchesToPersist
      : [];

    patches.forEach(item => {
      if (!item?.listingId) return;
      saveIxiMachinePatch({
        userId: ixiUserId,
        listingId: item.listingId,
        patch: item.patch || {}
      });
    });

    saveWorkspaceLayout(nextPlacements);
  }

  function moveMachineWithinContainer(containerKey, dragId, overId, insertAfter) {
    executeIXITransaction(
      IXI_COMMANDS.reorderWithinContainer({
        containerKey,
        objectId: dragId,
        targetId: overId,
        insertAfter,
        ixiCardState,
        machineContainers: placements
      })
    );
  }

  const handleWorkspaceDragStart = createWorkspaceDragStartHandler({
    setActiveDndId
  });

  const handleWorkspaceDragCancel = createWorkspaceDragCancelHandler({
    setActiveDndId,
    clearMachineDragState: () => {}
  });

  const handleWorkspaceDragEnd = createWorkspaceDragEndHandler({
    getMachineContainer: () => sourceSurface,
    machineContainers: placements,
    moveMachineWithinContainer,
    moveMachineToContainerAtPosition: () => {},
    moveMachineToContainer: () => {},
    setActiveStacksOpen: () => {},
    setLeftPocketMode: () => {},
    setLeftPocket2Mode: () => {},
    setRightPocketMode: () => {},
    setRightPocket2Mode: () => {},
    setActiveDndId,
    clearMachineDragState: () => {}
  });

  function getActiveDndListing() {
    return activeDndId ? listingById.get(String(activeDndId)) || null : null;
  }

  return (
    <>
      <Head>
        <title>IXI Mobile AOS Board I / II</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <IXIDragEngine
        cardContext="inventory"
        listingOrigin="aos-work"
        sensors={sensors}
        workspaceCollisionDetection={workspaceCollisionDetection}
        handleWorkspaceDragStart={handleWorkspaceDragStart}
        handleWorkspaceDragEnd={handleWorkspaceDragEnd}
        handleWorkspaceDragCancel={handleWorkspaceDragCancel}
        getActiveDndListing={getActiveDndListing}
        activeDndId={activeDndId}
        ixiCardState={ixiCardState}
        cardScaleMode={cardScaleMode}
      >
        <main className="shell">
          <header className="header">
            <div>
              <strong>IXI MOBILE · AOS · BOARD</strong>
              <span>BROWSE V2 DND · REAL AOS ORDER · REAL PERSISTENCE</span>
            </div>
            <div className="modeReadout">
              <span>{activeDndId ? "MOVING" : layoutMode === "II" ? "TWO-CARD" : "ONE-CARD"}</span>
              <span>{sourceSurface || "—"} · {sourceIds.length || "—"}</span>
            </div>
          </header>

          <nav className="layoutSwitch" aria-label="Mobile board density">
            <button
              type="button"
              className={layoutMode === "I" ? "active" : ""}
              aria-pressed={layoutMode === "I"}
              onClick={() => setLayoutMode("I")}
            >
              I
            </button>
            <button
              type="button"
              className={layoutMode === "II" ? "active" : ""}
              aria-pressed={layoutMode === "II"}
              onClick={() => setLayoutMode("II")}
            >
              II
            </button>
          </nav>

          {status === "loading" ? <div className="message">Loading your AOS board…</div> : null}
          {status === "error" ? (
            <div className="message error"><strong>BOARD GATE BLOCKED</strong><span>{error}</span></div>
          ) : null}

          {status === "ready" ? (
            <SortableContext
              id={sourceSurface || "board"}
              items={sourceIds}
              strategy={rectSortingStrategy}
            >
              <section
                className={`board ${layoutMode === "II" ? "board-two" : "board-one"}`}
                data-layout-mode={layoutMode}
                data-dnd-contract="browse-v2"
                data-scale-mode={cardScaleMode}
              >
                {orderedListings.map(listing => {
                  const id = String(getListingId(listing));

                  return (
                    <IXISortableMachineCard
                      key={id}
                      id={id}
                      containerId={sourceSurface || "board"}
                      objectType="machine"
                      objectFamily="machine"
                      dragData={{
                        workspaceSurface: sourceSurface || "board",
                        sourceContainerId: sourceSurface || "board"
                      }}
                      className="mobile-aos-sortable-card"
                      style={{
                        width: "max-content",
                        maxWidth: "none",
                        minWidth: 0,
                        alignSelf: "start",
                        position: "relative"
                      }}
                    >
                      {({ dragHandleProps }) => (
                        <IXIScaledCardShell
                          size={cardScaleMode}
                          objectFamily="private"
                        >
                          <IXIMachineCard
                            listing={listing}
                            cardContext="inventory"
                            sellerMode
                            machineFace={Number(ixiCardState[id]?.face || 1)}
                            showSave={false}
                            suppressFamilyLog
                            from="aos-work"
                            useDndDrag={false}
                            dragHandleProps={dragHandleProps}
                            ixiState={ixiCardState[id] || { color: "none", outline: 1 }}
                          />
                        </IXIScaledCardShell>
                      )}
                    </IXISortableMachineCard>
                  );
                })}
              </section>
            </SortableContext>
          ) : null}
        </main>
      </IXIDragEngine>

      <style jsx>{`
        :global(html),:global(body){margin:0;min-width:0;overflow-x:hidden;background:#070707}
        .shell{box-sizing:border-box;min-height:100dvh;width:100%;padding:max(8px,env(safe-area-inset-top)) 0 max(28px,env(safe-area-inset-bottom));overflow-x:hidden;background:#070707;color:#f5f5f5;font-family:Inter,Arial,sans-serif}
        .header{box-sizing:border-box;width:calc(100% - 16px);margin:0 8px 8px;padding:10px 12px;display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:rgba(15,15,15,.94)}
        .header>div:first-child{min-width:0;display:grid;gap:3px}.header strong{color:#ffc400;font-size:11px;line-height:1.1;letter-spacing:.8px}.header span{color:rgba(255,255,255,.68);font-size:9px;line-height:1.2;letter-spacing:.45px}.modeReadout{flex:0 0 auto;display:grid;justify-items:end;gap:2px}.modeReadout span:first-child{color:#7fe1ff;font-weight:800}
        .layoutSwitch{box-sizing:border-box;width:calc(100% - 16px);margin:0 8px 10px;display:grid;grid-template-columns:1fr 1fr;gap:6px}
        .layoutSwitch button{height:44px;border:1px solid rgba(255,255,255,.13);border-radius:8px;background:#111;color:#8f9692;font:900 16px/1 Inter,Arial,sans-serif;letter-spacing:1px}.layoutSwitch button.active{border-color:rgba(255,196,0,.8);background:#19160b;color:#ffc400;box-shadow:inset 0 0 0 1px rgba(255,196,0,.16)}
        .board{box-sizing:border-box;width:100%;display:grid;align-items:start;justify-items:center;overflow:visible;padding:0 5px}
        .board-one{grid-template-columns:minmax(0,1fr);gap:16px 0}
        .board-two{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 4px}
        .message{margin:70px 16px 0;padding:18px;display:grid;gap:8px;text-align:center;font-size:12px;color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.08);border-radius:10px;background:#111}.message.error{color:#ff9b9b;border-color:rgba(255,80,80,.22)}.message strong{color:#ffc400;font-size:11px;letter-spacing:.7px}
        :global(.mobile-aos-sortable-card[data-dragging="true"]){z-index:40!important}
      `}</style>
    </>
  );
}
