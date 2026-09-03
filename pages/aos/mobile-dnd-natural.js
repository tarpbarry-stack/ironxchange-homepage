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
import IXIImmutableScaledSurface from "../../components/ixi-mobile/IXIImmutableScaledSurface";
import IXIDragEngine from "../../components/ixi-chassis/IXIDragEngine";
import IXISortableMachineCard from "../../components/ixi-chassis/IXISortableMachineCard";
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

export default function MobileNaturalDndPage() {
  const [listings, setListings] = useState([]);
  const [ixiCardState, setIxiCardState] = useState({});
  const [placements, setPlacements] = useState({ board: [] });
  const [ixiUserId, setIxiUserId] = useState("");
  const [activeDndId, setActiveDndId] = useState("");
  const [layoutMode, setLayoutMode] = useState("I");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

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

    async function loadNaturalBoard() {
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

        const candidates = (Array.isArray(inventory) ? inventory : [])
          .filter(isOwnedPrivateCandidate);

        const hydrated = await Promise.all(
          candidates.map(listing => hydrateIXIListingMedia(listing, { dedupeRequests: true }))
        );

        const listingIds = new Set(
          hydrated.map(listing => String(getListingId(listing))).filter(Boolean)
        );

        const remoteState = remoteStateResponse?.state || remoteStateResponse || {};
        const layoutRecord = remoteState?.[IXI_AOS_WORK_LAYOUT_ID] || {};
        const savedPlacements = normalizePlacements(
          layoutRecord?.workspacePlacements || layoutRecord?.machineContainers || {}
        );
        const savedBoard = Array.isArray(savedPlacements.board)
          ? savedPlacements.board.map(String).filter(id => listingIds.has(id))
          : [];

        if (savedBoard.length < 2) {
          throw new Error(
            "Your persisted AOS board does not currently contain two owned/private machines. Put two machines on Board in AOS Work, then reopen this gate."
          );
        }

        if (cancelled) return;
        setIxiUserId(userId);
        setListings(hydrated);
        setIxiCardState(remoteState);
        setPlacements({ ...savedPlacements, board: savedBoard });
        setStatus("ready");
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError?.message || "Natural AOS DnD could not be loaded.");
        setStatus("error");
      }
    }

    loadNaturalBoard();
    return () => { cancelled = true; };
  }, []);

  const listingById = useMemo(
    () => new Map(listings.map(listing => [String(getListingId(listing)), listing])),
    [listings]
  );

  const boardIds = useMemo(
    () => (Array.isArray(placements.board) ? placements.board : [])
      .map(String)
      .filter(id => listingById.has(id)),
    [placements.board, listingById]
  );

  const orderedListings = useMemo(
    () => boardIds.map(id => listingById.get(id)).filter(Boolean),
    [boardIds, listingById]
  );

  function clearMachineDragState() {}

  function getMachineContainer(objectId) {
    const id = String(objectId || "");
    const match = Object.entries(placements).find(([, ids]) =>
      Array.isArray(ids) && ids.map(String).includes(id)
    );
    return match?.[0] || "board";
  }

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

  function moveMachineWithinContainer(containerKey, dragId, targetId, insertAfter = false) {
    executeIXITransaction(
      IXI_COMMANDS.reorderWithinContainer({
        containerKey,
        objectId: dragId,
        targetId,
        insertAfter,
        ixiCardState,
        machineContainers: placements
      })
    );
  }

  function moveMachineToContainerAtPosition(machineId, targetContainer, targetId, insertAfter = false) {
    executeIXITransaction(
      IXI_COMMANDS.moveObjectToPosition({
        objectId: machineId,
        targetContainer,
        targetId,
        insertAfter,
        ixiCardState,
        machineContainers: placements
      })
    );
  }

  function moveMachineToContainer(machineId, targetContainer) {
    executeIXITransaction(
      IXI_COMMANDS.moveObject({
        objectId: machineId,
        targetContainer,
        ixiCardState,
        machineContainers: placements
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
        <title>IXI Mobile AOS Natural DnD</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <main className="shell">
        <header className="header">
          <div>
            <strong>IXI MOBILE · AOS · NATURAL DND</strong>
            <span>DESKTOP DND MECHANICS · REAL AOS LAYOUT · REAL PERSISTENCE</span>
          </div>
          <div className="modeReadout">
            <span>{activeDndId ? "DRAG ACTIVE" : "NATIVE"}</span>
            <span>{boardIds.length || "—"} BOARD MACHINES</span>
          </div>
        </header>

        <nav className="layoutSwitch" aria-label="Mobile board density">
          <button type="button" className={layoutMode === "I" ? "active" : ""} onClick={() => setLayoutMode("I")}>I</button>
          <button type="button" className={layoutMode === "II" ? "active" : ""} onClick={() => setLayoutMode("II")}>II</button>
        </nav>

        {status === "loading" ? <div className="message">Loading the real AOS board…</div> : null}
        {status === "error" ? <div className="message error"><strong>NATURAL DND GATE BLOCKED</strong><span>{error}</span></div> : null}

        {status === "ready" ? (
          <IXIDragEngine
            sensors={sensors}
            workspaceCollisionDetection={workspaceCollisionDetection}
            handleWorkspaceDragStart={handleWorkspaceDragStart}
            handleWorkspaceDragEnd={handleWorkspaceDragEnd}
            handleWorkspaceDragCancel={handleWorkspaceDragCancel}
            getActiveDndObject={() => activeListing}
            activeDndId={activeDndId}
            ixiCardState={ixiCardState}
            cardScaleMode="xl"
            cardContext="inventory"
            listingOrigin="aos-work"
          >
            <SortableContext items={boardIds} strategy={rectSortingStrategy}>
              <section className={boardClassName} data-layout-mode={layoutMode} data-dnd-mechanics="desktop-native">
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
                      {({ dragHandleProps }) => (
                        <IXIImmutableScaledSurface
                          nativeWidth={300}
                          nativeHeight={475}
                          horizontalPadding={layoutMode === "II" ? 4 : 16}
                          className="mobile-natural-machine-surface"
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
        .layoutSwitch{box-sizing:border-box;width:calc(100% - 16px);margin:0 8px 10px;display:grid;grid-template-columns:1fr 1fr;gap:6px}.layoutSwitch button{height:44px;border:1px solid rgba(255,255,255,.13);border-radius:8px;background:#111;color:#8f9692;font:900 16px/1 Inter,Arial,sans-serif}.layoutSwitch button.active{border-color:rgba(255,196,0,.8);background:#19160b;color:#ffc400}
        .board{box-sizing:border-box;width:100%;display:grid;align-items:start;overflow:visible}.board-one{grid-template-columns:minmax(0,1fr);gap:12px 0}.board-two{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 0}
        :global(.machineCell){box-sizing:border-box;min-width:0;width:100%;align-self:start;overflow:visible}
        .message{margin:70px 16px 0;padding:18px;display:grid;gap:8px;text-align:center;font-size:12px;color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.08);border-radius:10px;background:#111}.message.error{color:#ff9b9b;border-color:rgba(255,80,80,.22)}.message strong{color:#ffc400}
      `}</style>
    </>
  );
}
