import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
  pointerWithin
} from "@dnd-kit/core";

import {
  SortableContext,
  horizontalListSortingStrategy
} from "@dnd-kit/sortable";

import Navbar from "../components/Navbar";
import ListingCard from "../components/ListingCard";
import { getListingId } from "../lib/listingFormatters";
import { fetchIxiMachineState } from "../lib/ixiMachineStateClient";
import {
  IXI_THEATER_QUEUE_ID,
  THEATER_RECEPTOR_KEYS,
  createEmptyTheaterContainers,
  sanitizeTheaterContainers,
  saveTheaterQueue
} from "../lib/ixiTheaterQueue";

import IXIEnvironmentRail from "../components/IXIEnvironmentRail";
import IXISortableMachineCard from "../components/ixi-chassis/IXISortableMachineCard";

const THEATER_DEMO_MACHINE_IDS = [
  "69f7ffd8-f07e-4587-a4dd-4a1fa7626d91",
  "69f90189-5b6b-43ab-a409-f2a1fe56895f"
];

function getImage(machine = {}) {
  const image =
    machine.image ||
    machine.imageUrl ||
    machine.images?.[0] ||
    machine.images?.[0]?.url ||
    machine.publicData?.image ||
    machine.publicData?.imageUrl ||
    machine.publicData?.images?.[0] ||
    machine.attributes?.publicData?.image ||
    machine.attributes?.publicData?.imageUrl ||
    machine.attributes?.publicData?.images?.[0];

  return typeof image === "string" ? image : image?.url || "";
}


function TheaterDraggableCard({
  id,
  children,
  className,
  onClick
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className || ""} ${isDragging ? "is-dragging" : ""}`}
      onClick={onClick}
               style={{
      transform: transform
        ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
        : undefined
    }}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}


function TheaterStackDropZone({
  id,
  children,
  className,
  ...props
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`${className || ""} ${isOver ? "is-over" : ""}`}
      {...props}
    >
      {children}
    </div>
  );
}
export default function IXITheater() {
  const [listings, setListings] = useState([]);
  const [viewCount, setViewCount] = useState(2);
  const [entered, setEntered] = useState(false);
  const [activeDragId, setActiveDragId] = useState("");
  const [ixiUserId, setIxiUserId] = useState("69f7fb56-bad0-40e5-a9d1-2d28cde38739");
 
const [slotPhotoIndexes, setSlotPhotoIndexes] = useState({});
const [screenSlots, setScreenSlots] = useState([0, 1, 2, 3]);
const [selectedSlot, setSelectedSlot] = useState(0);
  
const [theaterContainers, setTheaterContainers] = useState(
  createEmptyTheaterContainers()
);

const [screenFactModes, setScreenFactModes] = useState(["off", "off", "off", "off"]);
  const [screenZoomStates, setScreenZoomStates] = useState([
  { zoom: 1, x: 0, y: 0, dragging: false, lastX: 0, lastY: 0 },
  { zoom: 1, x: 0, y: 0, dragging: false, lastX: 0, lastY: 0 },
  { zoom: 1, x: 0, y: 0, dragging: false, lastX: 0, lastY: 0 },
  { zoom: 1, x: 0, y: 0, dragging: false, lastX: 0, lastY: 0 }
]);

const [zoomSyncOn, setZoomSyncOn] = useState(false);

function cycleScreenFactMode(screenIndex) {
  setScreenFactModes(current => {
    const next = [...current];

    next[screenIndex] =
      next[screenIndex] === "off"
        ? "med"
        : next[screenIndex] === "med"
        ? "high"
        : "off";

    return next;
  });
}

function clampZoom(value) {
  return Math.max(1, Math.min(4, value));
}

function updateZoomState(screenIndex, patch) {
  setScreenZoomStates(current => {
    const next = [...current];

    const updated = {
      ...next[screenIndex],
      ...patch
    };

    if (zoomSyncOn && screenIndex === 0) {
      return next.map(() => ({ ...updated }));
    }

    next[screenIndex] = updated;
    return next;
  });
}

function resetZoomState(screenIndex) {
  updateZoomState(screenIndex, {
    zoom: 1,
    x: 0,
    y: 0,
    dragging: false,
    lastX: 0,
    lastY: 0
  });
}

useEffect(() => {
  async function loadCurrentUser() {
    try {
      const res = await fetch("/api/current-user");

      if (!res.ok) return;

      const user = await res.json();

      const userId =
  user?.id?.uuid ||
  user?.id ||
  user?.user?.id?.uuid ||
  user?.user?.id ||
  user?.currentUser?.id?.uuid ||
  user?.currentUser?.id ||
  "";

      if (userId) {
        setIxiUserId(String(userId));
      }
    } catch (err) {
      console.error("Failed loading IXI user", err);
    }
  }

  loadCurrentUser();
}, []);

  
  useEffect(() => {
    async function loadTheater() {
      try {
        const res = await fetch("/api/listings");
        const data = await res.json();

        if (Array.isArray(data)) {
  setListings(
    data.filter(item => {
      const status =
        item.listingStatus ||
        item.publicData?.listingStatus ||
        item.attributes?.publicData?.listingStatus;

      return status !== "archived";
    })
  );
}
      } catch (err) {
        console.error("IXI Theater load failed", err);
      }
    }

    loadTheater();
  }, []);


  useEffect(() => {
  if (!listings.length) return;

  async function restoreTheaterQueue() {
    try {
      const remoteState = await fetchIxiMachineState(ixiUserId);
      const savedQueue = remoteState?.[IXI_THEATER_QUEUE_ID];

      console.log(
  "THEATER RESTORE",
  remoteState,
  savedQueue,
  IXI_THEATER_QUEUE_ID
);
      console.log("THEATER USER", ixiUserId);
      
      const savedContainers =
        savedQueue?.containers || savedQueue || null;

      if (savedContainers) {
        const restoredContainers =
          sanitizeTheaterContainers(savedContainers);

        const hasAnySavedMachine = Object.values(restoredContainers)
          .some(list => Array.isArray(list) && list.length > 0);

        if (hasAnySavedMachine) {
          setTheaterContainers(restoredContainers);
          return;
        }
      }
    } catch (err) {
      console.error("Failed restoring Theater queue", err);
    }

    updateTheaterContainers(current => {
      if ((current.rail || []).length) return current;

      return {
        ...current,
        rail: listings.map(item => String(getListingId(item)))
      };
    });
  }

  restoreTheaterQueue();
}, [listings, ixiUserId]);


  const railListings = useMemo(() => {
  return (theaterContainers.rail || [])
    .map(machineId =>
      listings.find(
        item => String(getListingId(item)) === String(machineId)
      )
    )
    .filter(Boolean);
}, [theaterContainers.rail, listings]);

const activeDragMachine = useMemo(() => {
  if (!activeDragId) return null;

  return listings.find(
    item => String(getListingId(item)) === String(activeDragId)
  );
}, [activeDragId, listings]);
  
const screenMachines = useMemo(() => {
  return screenSlots
    .slice(0, viewCount)
    .map(slotIndex => railListings[slotIndex])
    .filter(Boolean);
}, [screenSlots, railListings, viewCount]);

function cleanTheaterContainers(containers = {}) {
  const next = {};

  ["rail", ...THEATER_RECEPTOR_KEYS].forEach(key => {
    const seenInContainer = new Set();

    next[key] = (containers[key] || [])
      .map(id => String(id))
      .filter(id => {
        if (!id || seenInContainer.has(id)) return false;

        seenInContainer.add(id);
        return true;
      });
  });

  return next;
}
  
function saveTheaterContainers(nextContainers) {
  const safeContainers =
    sanitizeTheaterContainers(
      cleanTheaterContainers(nextContainers)
    );

  saveTheaterQueue({
    userId: ixiUserId,
    containers: safeContainers
  });

  return safeContainers;
}

function updateTheaterContainers(updater) {
  setTheaterContainers(current => {
    const nextContainers =
      typeof updater === "function"
        ? updater(current)
        : updater;

    return saveTheaterContainers(nextContainers);
  });
}

 function moveTheaterStack(sourceStackKey, targetKey) {
  if (!sourceStackKey || !targetKey || sourceStackKey === targetKey) return;

  updateTheaterContainers(current => {
    const sourceIds = current[sourceStackKey] || [];

    if (!sourceIds.length) return current;

    return {
      ...current,
      [targetKey]: [
        ...(current[targetKey] || []),
        ...sourceIds
      ],
      [sourceStackKey]: []
    };
  });
} 
  
function removeIdFromAllTheaterContainers(current, dragId) {
  const next = { ...current };

  ["rail", ...THEATER_RECEPTOR_KEYS].forEach(key => {
    next[key] = (next[key] || [])
      .filter(id => String(id) !== String(dragId))
      .filter((id, index, arr) =>
        arr.findIndex(item => String(item) === String(id)) === index
      );
  });

  return next;
}

function getTheaterSourceContainer(current, dragId) {
  return ["rail", ...THEATER_RECEPTOR_KEYS].find(key =>
    (current[key] || []).some(id => String(id) === String(dragId))
  );
}

function moveTheaterMachineToContainer(current, dragId, targetContainer, overId = "") {
  const validTargets = ["rail", ...THEATER_RECEPTOR_KEYS];

  if (!validTargets.includes(targetContainer)) return current;

  const id = String(dragId);
  const cleaned = removeIdFromAllTheaterContainers(current, id);

  const targetList = [...(cleaned[targetContainer] || [])]
    .filter(item => String(item) !== id);

  const overIndex = targetList.findIndex(
    item => String(item) === String(overId)
  );

  if (overIndex >= 0) {
    targetList.splice(overIndex, 0, id);
  } else {
    targetList.push(id);
  }

  return {
    ...cleaned,
    [targetContainer]: targetList
  };
}

function handleTheaterDragEnd(event) {
  const dragId = String(event?.active?.id || "");
  const overId = String(event?.over?.id || "");
  const overData = event?.over?.data?.current || {};
  const targetId = String(overData.targetId || overId);

  if (!dragId || !overId || dragId === overId) return;

  const explicitTargetContainer =
    overData.containerId ||
    overData.sortable?.containerId ||
    "";

  updateTheaterContainers(current => {
    const sourceContainer = getTheaterSourceContainer(current, dragId);

    if (!sourceContainer) return current;

    const isOverRailCard = (current.rail || []).some(
      id => String(id) === String(targetId)
    );

    const targetContainer =
      explicitTargetContainer ||
      (THEATER_RECEPTOR_KEYS.includes(overId) ? overId : "") ||
      (isOverRailCard ? "rail" : "");

    if (!targetContainer) return current;

    return moveTheaterMachineToContainer(
      current,
      dragId,
      targetContainer,
      targetId
    );
  });
}
  

function getMachineImages(machine = {}) {
  const rawImages =
    machine.images ||
    machine.publicData?.images ||
    machine.attributes?.publicData?.images ||
    [];

  const images = rawImages
    .map(img => (typeof img === "string" ? img : img?.url))
    .filter(Boolean);

  const hero = getImage(machine);

  if (hero && !images.includes(hero)) {
    return [hero, ...images];
  }

  return images.length ? images : hero ? [hero] : [];
}


function getFactValue(machine = {}, key) {
  return (
    machine[key] ||
    machine.publicData?.[key] ||
    machine.attributes?.publicData?.[key] ||
    machine.quickFacts?.[key] ||
    machine.facts?.[key] ||
    ""
  );
}

function formatFactPrice(value) {
  if (!value) return "—";

  const raw = String(value).replace(/[^0-9]/g, "");
  if (!raw) return String(value);

  return `$${Number(raw).toLocaleString()}`;
}

function formatFactHours(value) {
  if (!value) return "—";

  const raw = String(value).replace(/[^0-9]/g, "");
  if (!raw) return String(value);

  return `${Number(raw).toLocaleString()} HRS`;
}

function nextPhotoForMachine(machine) {
  const id = String(getListingId(machine));
  const images = getMachineImages(machine);

  setSlotPhotoIndexes(current => ({
    ...current,
    [id]: images.length
      ? ((current[id] || 0) + 1) % images.length
      : 0
  }));
}

function prevPhotoForMachine(machine) {
  const id = String(getListingId(machine));
  const images = getMachineImages(machine);

  setSlotPhotoIndexes(current => ({
    ...current,
    [id]: images.length
      ? ((current[id] || 0) - 1 + images.length) % images.length
      : 0
  }));
}
  
  return (
    <>
      <Head>
  <title>IXI Theater | IronXchange</title>

  <link
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
    rel="stylesheet"
  />
</Head>

      <Navbar />

<DndContext
  autoScroll={false}
  collisionDetection={pointerWithin}
  onDragStart={(event) => {
    setActiveDragId(String(event?.active?.id || ""));
  }}
  onDragEnd={(event) => {
    handleTheaterDragEnd(event);
    setActiveDragId("");
  }}
  onDragCancel={() => {
    setActiveDragId("");
  }}
>
  <main>
    {!entered && (
          <section className="theater-lobby">
            <div className="lobby-card">
              <span>IXI THEATER</span>

              <p>
 {new Set(
  Object.values(theaterContainers)
    .flat()
    .map(id => String(id))
    .filter(Boolean)
).size} machines loaded for inspection.
</p>

              <button type="button" onClick={() => setEntered(true)}>
                ENTER THEATER
              </button>
            </div>
          </section>
        )}

        {entered && (
          <section className={`theater-room view-${viewCount}`}>
            <div className="theater-env-shell">
  <IXIEnvironmentRail
    activeEnvironment="IXI THEATER"
    hasAccount
    hasRelationship
    hasInventory
  />
</div>

          <section className="theater-screen">
{screenMachines.map(machine => {
  const id = String(getListingId(machine));
const images = getMachineImages(machine);
const currentPhotoIndex = slotPhotoIndexes[id] || 0;
const image = images[currentPhotoIndex] || getImage(machine);

  const screenPosition = screenMachines.indexOf(machine);
  const factMode = screenFactModes[screenPosition] || "off";

  const zoomState = screenZoomStates[screenPosition] || {
  zoom: 1,
  x: 0,
  y: 0,
  dragging: false,
  lastX: 0,
  lastY: 0
};

return (
  <div
  key={getListingId(machine)}
  className={`screen-slot screen-position-${screenPosition + 1} ${
    zoomState.zoom > 1 ? "zoom-active" : ""
  }`}
  onWheel={(e) => {
    e.preventDefault();

    const nextZoom = clampZoom(
      zoomState.zoom + (e.deltaY < 0 ? 0.25 : -0.25)
    );

    updateZoomState(screenPosition, {
      zoom: nextZoom,
      x: nextZoom === 1 ? 0 : zoomState.x,
      y: nextZoom === 1 ? 0 : zoomState.y
    });
  }}
  onDoubleClick={() => {
    if (zoomState.zoom > 1) {
      resetZoomState(screenPosition);
    } else {
      updateZoomState(screenPosition, {
        zoom: 2,
        x: 0,
        y: 0
      });
    }
  }}
  onMouseDown={(e) => {
    if (zoomState.zoom <= 1) return;

    updateZoomState(screenPosition, {
      dragging: true,
      lastX: e.clientX,
      lastY: e.clientY
    });
  }}
  onMouseMove={(e) => {
    if (!zoomState.dragging || zoomState.zoom <= 1) return;

    updateZoomState(screenPosition, {
      x: zoomState.x + (e.clientX - zoomState.lastX),
      y: zoomState.y + (e.clientY - zoomState.lastY),
      lastX: e.clientX,
      lastY: e.clientY
    });
  }}
  onMouseUp={() => {
    updateZoomState(screenPosition, { dragging: false });
  }}
  onMouseLeave={() => {
    updateZoomState(screenPosition, { dragging: false });
  }}
>

 <div className={`screen-fact-control mode-${factMode}`}>
  <button
    type="button"
    className="screen-fact-dash"
    onClick={() => cycleScreenFactMode(screenPosition)}
    aria-label="Toggle screen facts"
  />

  {factMode !== "off" && (
    <div className={`screen-fact-hud mode-${factMode}`}>
      <span>{getFactValue(machine, "year") || "—"}</span>
      <span>{getFactValue(machine, "model") || "—"}</span>
      <span>{formatFactHours(getFactValue(machine, "hours"))}</span>
      <strong>{formatFactPrice(getFactValue(machine, "price"))}</strong>
    </div>
  )}
</div>

               <button
  type="button"
  className="photo-hit-zone photo-hit-left"
  onClick={() => prevPhotoForMachine(machine)}
  aria-label="Previous photo"
/>

<button
  type="button"
  className="photo-hit-zone photo-hit-right"
  onClick={() => nextPhotoForMachine(machine)}
  aria-label="Next photo"
/>

{image ? (
  <img
    src={image}
    alt=""
    style={{
      transform: `translate(${zoomState.x}px, ${zoomState.y}px) scale(${zoomState.zoom})`
    }}
    draggable={false}
  />
) : (
  <div className="no-photo">NO PHOTO</div>
)}
                  </div>
                );
             })}
</section>

            <section className="theater-card-rail">
              <div className="theater-mode-dashes">
                {[1, 2, 4].map(count => (
                  <button
                    key={count}
                    type="button"
                    className={viewCount === count ? "active" : ""}
                    onClick={() => setViewCount(count)}
                  >
                    {count}
                  </button>
                ))}
              </div>

        

<div className="screen-slot-loader">
  {[0, 1, 2, 3].map(slotIndex => (
    <button
      key={slotIndex}
      type="button"
      className={`${slotIndex < viewCount ? "active" : ""} ${
        selectedSlot === slotIndex ? "selected" : ""
      }`}
      onClick={() => setSelectedSlot(slotIndex)}
    >
      SCREEN {slotIndex + 1}
    </button>
  ))}
</div>
                
            <div className="theater-bottom-dock">
  <TheaterStackDropZone
  id="rail"
  className="theater-loaded-zone"
>
  <div className="loaded-cards">
    <SortableContext
      id="rail"
      items={(theaterContainers.rail || []).map(id => String(id))}
      strategy={horizontalListSortingStrategy}
    >
      {railListings.map((machine, index) => {
        const id = String(getListingId(machine));

        return (
          <IXISortableMachineCard
            key={id}
            id={id}
            containerId="rail"
            className={`loaded-card ${
              screenSlots.includes(index) ? "on-screen" : ""
            }`}
          >
            {({ dragHandleProps }) => (
              <div
                {...dragHandleProps}
                onClick={() => {
                  setScreenSlots(current => {
                    const next = [...current];
                    next[selectedSlot] = index;
                    return next;
                  });
                }}
              >
                {screenSlots.includes(index) && (
                  <div className="loaded-card-screen-label">
                    {screenSlots.indexOf(index) + 1}
                  </div>
                )}

                <div className="loaded-card-scale">
                  <ListingCard
                    listing={machine}
                    saved={false}
                    onToggleSaved={() => {}}
                    from="saved"
                    ixiState={{ color: "none", outline: 1 }}
                    onIxiStateChange={() => {}}
                    onSendFront={() => {}}
                    onSendBack={() => {}}
                    isBoardDraggingCard={false}
                    isGhostTarget={false}
                    onBoardDragStart={() => {}}
                    onBoardDragOver={() => {}}
                    onBoardDragEnd={() => {}}
                  />
                </div>
              </div>
            )}
          </IXISortableMachineCard>
        );
      })}
    </SortableContext>
  </div>
</TheaterStackDropZone>
<div className="theater-import-zone">
  <div className="theater-stack-grid">
    <button
  type="button"
  className="theater-unload-dash"
  title="Unload loaded rail to stack"
  onClick={() => {
    updateTheaterContainers(current => {
      const railIds = current.rail || [];

      if (!railIds.length) return current;

            const stackTargets = THEATER_RECEPTOR_KEYS;
      
      const emptyStack =
        stackTargets.find(
          key => !(current[key] || []).length
        ) || "stack1";

      return saveTheaterContainers({
  ...current,
  [emptyStack]: [
    ...(current[emptyStack] || []),
    ...railIds
  ],
  rail: []
});
    });
  }}
/>
    <div className="theater-stack-matrix">
     {[1, 2, 3, 4, 5, 6].map(stackNumber => {
  const stackKey = `stack${stackNumber}`;
  const stackIds = theaterContainers[stackKey] || [];
  const topMachine = stackIds.length
    ? listings.find(item => String(getListingId(item)) === String(stackIds[stackIds.length - 1]))
    : null;
  const topImage = topMachine ? getImage(topMachine) : "";

  return (
  <TheaterStackDropZone
    key={`theater-stack-${stackNumber}`}
    id={stackKey}
    className="theater-stack-shell"
    data-theater-stack={stackKey}
  >
  
  <div className="theater-stack-control-rail">
            <button
  type="button"
  className="theater-stack-dash load"
  onClick={() => {
    updateTheaterContainers(current => {
      const stackIds = current[stackKey] || [];

      if (!stackIds.length) return current;

     return saveTheaterContainers({
  ...current,
  rail: [
    ...(current.rail || []),
    ...stackIds
  ],
  [stackKey]: []
});
    });
  }}
/>
           <button
  type="button"
  className="theater-stack-dash loop"
  onClick={() => {
    setTheaterContainers(current => {
      const stackIds = current[stackKey] || [];

      if (stackIds.length <= 1) return current;

     return saveTheaterContainers({
  ...current,
  [stackKey]: [
    ...stackIds.slice(1),
    stackIds[0]
  ]
});
    });
  }}
/>
            <button
  type="button"
  className="theater-stack-dash orbit"
  onClick={() => {
    setTheaterContainers(current =>
  saveTheaterContainers({
    ...current,
    [stackKey]: []
  })
);
  }}
/>
          </div>

          <div className="theater-stack-label">
  STACK {stackNumber}
</div>

<div className="theater-stack-thumb-zone">
  {topMachine ? (
    <TheaterDraggableCard
      id={String(getListingId(topMachine))}
      className="theater-stack-thumb-dnd"
    >
      <div className="theater-stack-thumb-head has-machine">
          {topImage ? (
            <img src={topImage} alt="" />
          ) : (
            <span>
              {topMachine.year || ""} {topMachine.make || ""} {topMachine.model || ""}
            </span>
          )}
             </div>
    </TheaterDraggableCard>
  ) : (
    <div className="theater-stack-thumb-head" />
  )}
</div>
          <div className="theater-stack-drop-surface" />
      </TheaterStackDropZone>
  );
})}
    </div>
  </div>
</div>
        </div>
          </section>
          </section>
        )}
          <DragOverlay>
  {activeDragMachine ? (
    <div className="theater-drag-overlay-card">
      <div className="loaded-card-scale">
        <ListingCard
          listing={activeDragMachine}
          saved={false}
          onToggleSaved={() => {}}
          from="saved"
          ixiState={{
            color: "none",
            outline: 1
          }}
          onIxiStateChange={() => {}}
          onSendFront={() => {}}
          onSendBack={() => {}}
          isBoardDraggingCard={false}
          isGhostTarget={false}
          onBoardDragStart={() => {}}
          onBoardDragOver={() => {}}
          onBoardDragEnd={() => {}}
        />
      </div>
    </div>
  ) : null}
</DragOverlay>

</main>
</DndContext>

      <style jsx>{`
       :global(html),
:global(body) {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;

  background: #030303;
  color: #d8d8d8;
  font-family: Arial, sans-serif;
}
     main {
  width: 100vw;
  height: calc(100vh - 72px);

  padding: 0;

  background: #030303;

  overflow: hidden;
}
        .theater-lobby {
          min-height: 78vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lobby-card {
          width: min(520px, 92vw);
          padding: 46px 34px;
          text-align: center;

          border: 1px solid rgba(255,255,255,.045);
          border-radius: 18px;

          background:
            radial-gradient(circle at 50% 0%, rgba(255,255,255,.035), transparent 42%),
            rgba(6,6,6,.92);

          box-shadow: 0 30px 90px rgba(0,0,0,.55);
        }

   .lobby-card span {
  display: block;
  margin-bottom: 14px;

  color: rgba(0,194,255,.92);

  font-size: 10px;
  font-weight: 950;
  letter-spacing: 1.35px;

  text-shadow:
    0 0 10px rgba(0,194,255,.22),
    0 0 22px rgba(0,194,255,.12);
}

        .lobby-card p {
          margin: 0 0 26px;

          color: rgba(225,225,225,.48);

          font-size: 13px;
          font-weight: 800;
          letter-spacing: .25px;
        }

        .lobby-card button {
          height: 34px;
          padding: 0 24px;

          border: 1px solid rgba(255,255,255,.10);
          border-radius: 999px;

          background: rgba(255,255,255,.035);
          color: rgba(235,235,235,.72);

          font-size: 9px;
          font-weight: 950;
          letter-spacing: .9px;

          cursor: pointer;
        }

        .theater-room {
          min-height: 84vh;
          position: relative;
          padding: 18px 20px 0;

          display: grid;
          grid-template-rows: 18px 1fr auto;
          gap: 12px;
        }

        .theater-brand {
          color: rgba(180,180,180,.13);

          font-size: 15px;
          font-weight: 950;
          letter-spacing: -.45px;

          text-shadow: 0 0 18px rgba(180,180,180,.06);
        }

        .theater-env-shell {
  width: 100%;
  height: 22px;

  opacity: 0;
  transition: opacity .18s ease;
}

.theater-env-shell:hover,
.theater-env-shell:focus-within {
  opacity: 1;
}

       .theater-screen {
  height: 54vh;

  display: grid;
  gap: 10px;

 margin: -12px auto 0;
}

        .view-1 .theater-screen {
          grid-template-columns: 1fr;
        }

        .view-2 .theater-screen {
          grid-template-columns: repeat(2, 1fr);
        }

        .view-4 .theater-screen {
          grid-template-columns: repeat(2, 1fr);
          grid-template-rows: repeat(2, minmax(0, 1fr));
        }

     .screen-slot {
  min-width: 0;
  min-height: 0;

  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  background: #050505;
  overflow: hidden;
}

.screen-slot img {
  width: 100%;
  height: 100%;
  max-height: none;
  object-fit: cover;
  object-position: center;

  transition: transform .08s linear;
transform-origin: center center;
user-select: none;
}

.screen-slot.zoom-active {
  cursor: grab;
}

.screen-slot.zoom-active:active {
  cursor: grabbing;
}

.photo-hit-zone {
  position: absolute;
  top: 0;
  bottom: 0;

  width: 24%;

  border: 0;
  background: transparent;

  z-index: 5;
  cursor: pointer;
}

.photo-hit-left {
  left: 0;
}

.photo-hit-right {
  right: 0;
}

.photo-hit-zone:hover {
  background: rgba(255,255,255,.025);
}

        .view-4 .screen-slot img {
          max-height: 31vh;
        }

        .no-photo {
          width: 100%;
          height: 100%;
          min-height: 240px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: rgba(255,255,255,.18);
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 1px;

          background: #111;
        }

.screen-fact-hud {
  position: relative;
  z-index: 12;

  display: flex;
  gap: 7px;
  align-items: center;

  white-space: nowrap;
  width: max-content;
  max-width: none;

  padding: 6px 8px;

  background: rgba(0,0,0,.72);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 6px;

  color: rgba(235,235,235,.68);

  font-size: 8px;
  font-weight: 950;
  letter-spacing: .45px;
  text-transform: uppercase;

  pointer-events: none;
}

.screen-position-1 .screen-fact-hud {
  left: 10px;
}

.screen-position-2 .screen-fact-hud {
  right: 10px;
}

.screen-fact-hud strong {
  color: rgba(255,255,255,.86);
}

.screen-fact-hud.mode-high {
  color: rgba(255,255,255,.82);
  border-color: rgba(0,194,255,.28);
}

.screen-fact-control {
  position: absolute;
  top: 10px;
  z-index: 14;

  display: flex;
  align-items: center;
  gap: 8px;
}

.screen-position-1 .screen-fact-control,
.screen-position-3 .screen-fact-control {
  left: 10px;
}

.screen-position-2 .screen-fact-control,
.screen-position-4 .screen-fact-control {
  right: 10px;
  flex-direction: row-reverse;
}

.screen-fact-dash {
  width: 22px;
  height: 6px;

  border: 0;
  border-radius: 2px;

  background: rgba(255,255,255,.18);

  padding: 0;
  cursor: pointer;
}

.screen-fact-control.mode-med .screen-fact-dash {
  background: rgba(255,255,255,.42);
}

.screen-fact-control.mode-high .screen-fact-dash {
  background: rgba(0,194,255,.86);
  box-shadow: 0 0 10px rgba(0,194,255,.16);
}
        

        .theater-card-rail {
  width: 100%;
  max-width: 100%;
  min-width: 0;

position: relative;

  padding: 0 0 10px;
margin-top: -25px;

  opacity: .12;
  transition: opacity .18s ease;

  overflow: visible;
}

        .theater-card-rail:hover {
          opacity: 1;
        }

     .theater-mode-dashes {
  position: absolute;
  top: 64px;
  left: 50%;
  transform: translateX(-50%);

  display: flex;
  justify-content: center;
  gap: 8px;

  z-index: 20;
}

        .theater-mode-dashes button {
          width: 28px;
          height: 8px;

          border: 0;
          border-radius: 2px;

          background: rgba(255,255,255,.18);
          color: transparent;

          cursor: pointer;
        }

        .theater-mode-dashes button.active {
          background: rgba(180,180,180,.72);
          box-shadow: 0 0 12px rgba(255,255,255,.08);
        }

.screen-slot-loader {
  display: none;
  justify-content: center;
  gap: 8px;

  margin: 0 0 4px;
}

.screen-slot-loader button {
  height: 18px;
  padding: 0 10px;

  border: 1px solid rgba(255,255,255,.08);
  border-radius: 999px;

  background: rgba(255,255,255,.025);
  color: rgba(255,255,255,.38);

  font-size: 8px;
  font-weight: 950;
  letter-spacing: .65px;

  cursor: pointer;
}

.screen-slot-loader button.active {
  color: rgba(255,255,255,.62);
  border-color: rgba(255,255,255,.16);
}

.screen-slot-loader button.selected {
  color: rgba(235,235,235,.92);
  border-color: rgba(180,180,180,.42);
  background: rgba(255,255,255,.075);
  box-shadow: 0 0 12px rgba(255,255,255,.08);
}



     :global(.loaded-cards) {
  width: 100%;
  max-width: 100%;
  min-width: 0;

  display: flex;
  gap: 12px;

  margin-top: 0;

  overflow-x: auto;
  overflow-y: visible;
  
  padding: 0 4px 0;
}

    :global(.loaded-card) {
  flex: 0 0 171px;
  width: 171px;
  height: 235px;

  position: relative;

  opacity: .72;
  cursor: grab;

  overflow: visible;

  transition:
    opacity .16s ease,
    transform .16s ease,
    box-shadow .16s ease;
}

:global(.loaded-card-scale) {
  width: 285px;
  height: 391px;

  transform: scale(.60);
  transform-origin: top left;

  margin-bottom: -18px;
}

:global(.theater-drag-overlay-card) {
  width: 171px;
  height: 235px;
  pointer-events: none;
  overflow: visible;
  opacity: .98;
  z-index: 999999;
}

:global(.loaded-card.is-dragging) {
  opacity: 0;
}


       .loaded-card-screen-label {
  position: absolute;
  top: 3px;
  left: 3px;

  width: 18px;
  height: 18px;

  display: flex;
  align-items: center;
  justify-content: center;

  z-index: 20;

  border: 1px solid rgba(180,180,180,.38);
  border-radius: 2px;

  background: rgba(0,0,0,.72);
  color: rgba(235,235,235,.86);

  font-size: 8px;
  font-weight: 950;
  letter-spacing: 0;

  box-shadow: 0 0 10px rgba(255,255,255,.08);
}

      :global(.loaded-card.on-screen) {
  opacity: 1;
}
       :global(.loaded-card:hover) {
  opacity: 1;
}


    .loaded-cards {
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.18) rgba(0,0,0,.72);
}

.loaded-cards::-webkit-scrollbar {
  height: 6px;
}

.loaded-cards::-webkit-scrollbar-track {
  background: rgba(0,0,0,.72);
  border-radius: 999px;
}

.loaded-cards::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,.16);
  border-radius: 999px;
}

.loaded-cards::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,.28);
}

.theater-bottom-dock {
  width: 100%;
  max-width: 100%;
  min-width: 0;

  display: grid;
  grid-template-columns: 70% 30%;
  align-items: end;
}

:global(.theater-loaded-zone) {
  min-width: 0;
  height: 270px;
  overflow: hidden;

  position: relative;
  top: 55px;

    pointer-events: auto;
  z-index: 100;
}

.theater-import-zone {
  min-width: 0;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;

  overflow: visible;
}

.theater-stack-grid {
  width: 100%;

  display: grid;
  grid-template-columns: 8px 1fr;

  column-gap: 8px;

  align-items: center;

   transform: translateY(44px);
}

.theater-stack-matrix {
  width: 100%;

  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));

  column-gap: 6px;
  row-gap: 12px;

  transform: translateY(-4px);
}

.theater-unload-dash {
  grid-column: 1;
  grid-row: 1 / span 2;

  justify-self: end;
  align-self: center;

  width: 6px;
  height: 32px;

  transform: translate(5px, 2px);
  
  border: 0;
  border-radius: 2px;

  background: rgba(255,255,255,.14);

  padding: 0;
  cursor: pointer;

  z-index: 50;
}

.theater-unload-dash:hover {
  background: rgba(229,62,62,.88);
  box-shadow: 0 0 8px rgba(229,62,62,.24);
}

:global(.theater-stack-shell) {
  width: calc(100% - 10px);
  justify-self: center;

  height: 117px;
  
  position: relative;

  border: 1px solid rgba(255,255,255,.055);
  border-radius: 10px;

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.018),
      rgba(255,255,255,0)
    ),
    rgba(7,7,7,.72);

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.025),
    0 10px 22px rgba(0,0,0,.20);

  overflow: visible;

  pointer-events: auto;
  z-index: 80;
}

:global(.theater-stack-shell::before) {
  content: "";

  position: absolute;
  left: 10px;
  right: 10px;
  top: 9px;

  height: 1px;

  background: rgba(255,196,0,.10);
}

.theater-stack-label {
  position: absolute;
  left: 10px;
  top: 13px;

  color: rgba(255,255,255,.18);

  font-size: 6.5px;
  font-weight: 950;
  letter-spacing: .65px;
  text-transform: uppercase;

  pointer-events: none;
}

.theater-stack-control-rail {
  position: absolute;
  right: 10px;
  top: 13px;

  width: 74px;
  height: 4px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  z-index: 4;
}

.theater-stack-dash {
  width: 18px;
  height: 4px;

  border: 0;
  border-radius: 1px;

  background: rgba(255,255,255,.12);

  padding: 0;
  cursor: pointer;
}

.theater-stack-dash:hover {
  background: rgba(255,196,0,.78);
  box-shadow: 0 0 8px rgba(255,196,0,.20);
}

:global(.theater-stack-thumb-zone) {
  position: absolute;
  left: 50%;
  bottom: 14px;

  width: 96px;
  height: 62px;

  transform: translateX(-50%);

  display: flex;
  align-items: flex-end;
  justify-content: center;

      z-index: 120;
  pointer-events: auto;
}

:global(.theater-stack-thumb-dnd) {
  width: 90px;
  height: 60px;

  display: block;

  position: relative;
  z-index: 90;

  cursor: grab;
}

:global(.theater-stack-thumb-dnd:active) {
  cursor: grabbing;
}

:global(.theater-stack-thumb-head) {
  width: 90px;
  height: 60px;

  border: 1px solid rgba(255,255,255,.12);
  border-radius: 7px 7px 0 0;

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.045),
      rgba(255,255,255,0)
    ),
    rgba(18,18,18,.92);

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.035),
    0 8px 16px rgba(0,0,0,.30);
}

.theater-stack-thumb-head img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.theater-stack-thumb-head span {
  display: block;
  padding: 6px;

  color: rgba(255,255,255,.62);
  font-size: 7px;
  font-weight: 900;
  line-height: 1.1;
}

:global(.theater-stack-drop-surface) {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 6px;
  top: 28px;

  border: 1px dashed rgba(255,255,255,.055);
  border-radius: 8px;

  pointer-events: auto;
  z-index: 20;
}

        .theater-room,
.theater-screen {
  max-width: 100%;
  min-width: 0;
}
        @media (max-width: 850px) {
          .theater-room {
            min-height: 88vh;
            padding: 10px 0 0;
            grid-template-rows: 14px 1fr auto;
            gap: 8px;
          }

          .theater-brand {
            padding-left: 12px;
            font-size: 12px;
          }

          .view-1 .theater-screen,
          .view-2 .theater-screen,
          .view-4 .theater-screen {
            grid-template-columns: 1fr;
            grid-template-rows: none;
          }

          .screen-slot img {
            width: 100vw;
            max-height: 68vh;
          }

          .view-2 .screen-slot:not(:first-child),
          .view-4 .screen-slot:not(:first-child) {
            display: none;
          }

          .loaded-card {
}

.loaded-card.on-screen {
}
        }
      `}</style>
    </>
  );
}
