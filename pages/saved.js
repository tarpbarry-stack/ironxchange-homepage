import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ListingCard from "../components/ListingCard";

import { getListingId } from "../lib/listingFormatters";
import {
  fetchIxiMachineState
} from "../lib/ixiMachineStateClient";
import { captureIXEvent } from "../lib/posthog";

import IXSearchSurface from "../components/IXSearchSurface";

import {
  fetchCurrentUserWithSavedListings,
  getSavedListingIdsFromUser,
  filterSavedListings,
  toggleSavedListing
} from "../lib/savedListings";

export default function SavedListings() {
  const [listings, setListings] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [sdk, setSdk] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [workspaceFilters, setWorkspaceFilters] = useState({
  yearMin: "",
  yearMax: "",
  priceMin: "",
  priceMax: "",
  hoursMin: "",
  hoursMax: ""
});

  const [savedBoardMode, setSavedBoardMode] = useState("saved");
  const [savedBoardListings, setSavedBoardListings] = useState([]);

  const [draggingListingId, setDraggingListingId] = useState("");
const [ghostListingId, setGhostListingId] = useState("");

const [activeStacksOpen, setActiveStacksOpen] = useState({
  top: false,
  bottom: false
});

const [machineContainers, setMachineContainers] = useState({
  board: [],
  stackTop: [],
  stackBottom: [],
  pocketLeft: [],
  pocketRight: []
});

const [activeStackLayouts, setActiveStackLayouts] = useState({
  top: "horizontal",
  bottom: "horizontal"
});

const [leftPocketOpen, setLeftPocketOpen] = useState(false);
const [rightPocketOpen, setRightPocketOpen] = useState(false);

const [armedDestination, setArmedDestination] = useState("");
  
const [stackDraggingId, setStackDraggingId] = useState("");
const [stackGhostId, setStackGhostId] = useState("");
const [stackInsertAfter, setStackInsertAfter] = useState(false);

const [activeStackHover, setActiveStackHover] = useState("");
const [ixiCardState, setIxiCardState] = useState({});
  const [ixiUserId, setIxiUserId] = useState("guest");
  const [ixiColorFilters, setIxiColorFilters] = useState([]);
  const [ixiOutlineFilter, setIxiOutlineFilter] = useState("all");

  useEffect(() => {
    captureIXEvent("saved_workspace_viewed", {
      page: "saved"
    });
  }, []);

  useEffect(() => {
    async function loadSavedPage() {
      try {
        const SharetribeSdk = await import("sharetribe-flex-sdk");

        const sdkInstance = SharetribeSdk.createInstance({
          clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
        });

        setSdk(sdkInstance);

        const currentUser =
          await fetchCurrentUserWithSavedListings(sdkInstance);

        const userId =
  currentUser?.id?.uuid ||
  currentUser?.id ||
  "guest";

setIxiUserId(String(userId));

const remoteIxiState =
  await fetchIxiMachineState(String(userId));

setIxiCardState(remoteIxiState);

        setSavedIds(
          getSavedListingIdsFromUser(currentUser)
        );

        const res = await fetch("/api/listings");
        const data = await res.json();

        if (Array.isArray(data)) {
          setListings(data);
        }
      } catch (err) {
        console.error("Saved page load failed:", err);
        setSavedIds([]);
      }
    }

    loadSavedPage();
  }, []);

  const savedListings = useMemo(() => {
    const activeListings = listings.filter(item => {
      const listingStatus =
        item.listingStatus ||
        item.publicData?.listingStatus ||
        item.attributes?.publicData?.listingStatus;

      return listingStatus !== "archived";
    });

    return filterSavedListings(activeListings, savedIds);
  }, [listings, savedIds]);

  const workspaceListings = useMemo(() => {
  const activeListings = listings.filter(item => {
    const listingStatus =
      item.listingStatus ||
      item.publicData?.listingStatus ||
      item.attributes?.publicData?.listingStatus;

    return listingStatus !== "archived";
  });

  const touchedIds = Object.keys(ixiCardState || {});

  return activeListings.filter(item =>
    touchedIds.includes(String(getListingId(item)))
  );
}, [listings, ixiCardState]);

  const visibleSavedListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const source =
      savedBoardMode === "custom" && savedBoardListings.length
        ? savedBoardListings
        : workspaceListings;

   return source.filter(item => {
  const id = String(getListingId(item));

  if (getMachineContainer(id) !== "board") {
    return false;
  }

  const searchableText = [
        item.title,
        item.type,
        item.category,
        item.make,
        item.model,
        item.location,
        item.hours,
        item.price,
        item.year,
        item.description,
        item.publicData?.description,
        item.publicData?.details
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const ixState = ixiCardState[id] || {
        color: "none",
        outline: 1
      };

      const matchesSearch =
        !q || searchableText.includes(q);

     const matchesIxiColor =
  ixiColorFilters.length === 0 ||
  ixiColorFilters.includes(ixState.color);

     const yearValue = Number(item.year || item.publicData?.year || 0);
const priceValue = Number(String(item.price || "").replace(/[^0-9]/g, ""));
const hoursValue = Number(String(item.hours || "").replace(/[^0-9]/g, ""));

const matchesWorkspaceRanges =
  (!workspaceFilters.yearMin || yearValue >= Number(workspaceFilters.yearMin)) &&
  (!workspaceFilters.yearMax || yearValue <= Number(workspaceFilters.yearMax)) &&
  (!workspaceFilters.priceMin || priceValue >= Number(workspaceFilters.priceMin)) &&
  (!workspaceFilters.priceMax || priceValue <= Number(workspaceFilters.priceMax)) &&
  (!workspaceFilters.hoursMin || hoursValue >= Number(workspaceFilters.hoursMin)) &&
  (!workspaceFilters.hoursMax || hoursValue <= Number(workspaceFilters.hoursMax));

const matchesIxiOutline =
  ixiOutlineFilter === "all" ||
  String(ixState.outline) === String(ixiOutlineFilter);

return (
  matchesSearch &&
  matchesWorkspaceRanges &&
  matchesIxiColor &&
  matchesIxiOutline
);
    });
  }, [
   searchQuery,
  savedListings,
  savedBoardMode,
  savedBoardListings,

    workspaceFilters,

  machineContainers,

  ixiCardState,
  ixiColorFilters,
  ixiOutlineFilter
  ]);

  function updateIxiCardState(listingId, patch) {
    setIxiCardState(current => ({
      ...current,
      [String(listingId)]: {
        color: "none",
        outline: 1,
        ...(current[String(listingId)] || {}),
        ...patch
      }
    }));
  }

 function toggleColorFilter(color) {
  setIxiColorFilters(current => {
    if (current.includes(color)) {
      return current.filter(item => item !== color);
    }

    return [...current, color];
  });
}
  
  function toggleOutlineFilter(outline) {
  setIxiOutlineFilter(current =>
    String(current) === String(outline)
      ? "all"
      : String(outline)
  );
}

 function getMachineContainer(machineId) {
  const id = String(machineId);

  for (const [containerKey, ids] of Object.entries(machineContainers)) {
    if ((ids || []).includes(id)) {
      return containerKey;
    }
  }

  return "board";
}

function moveMachineToContainer(machineId, targetContainer) {
  if (!machineId || !targetContainer) return;

  const id = String(machineId);

  setMachineContainers(current => {
    const next = {};

    Object.keys(current).forEach(containerKey => {
      next[containerKey] = (current[containerKey] || []).filter(
        item => String(item) !== id
      );
    });

    next[targetContainer] = [
      ...(next[targetContainer] || []),
      id
    ];

    return next;
  });
}

  function moveMachineWithinContainer(containerKey, dragId, targetId, insertAfter = false) {
  if (!containerKey || !dragId || !targetId || dragId === targetId) return;

  setMachineContainers(current => {
    const source = current[containerKey] || [];

    const fromIndex = source.findIndex(
      item => String(item) === String(dragId)
    );

    const toIndex = source.findIndex(
      item => String(item) === String(targetId)
    );

    if (fromIndex === -1 || toIndex === -1) {
      return current;
    }

    const nextContainer = [...source];
    const [moved] = nextContainer.splice(fromIndex, 1);

    const adjustedTargetIndex = nextContainer.findIndex(
      item => String(item) === String(targetId)
    );

    const insertIndex = insertAfter
      ? adjustedTargetIndex + 1
      : adjustedTargetIndex;

    nextContainer.splice(insertIndex, 0, moved);

    return {
      ...current,
      [containerKey]: nextContainer
    };
  });
}
  
function moveMachineBackToBoard(machineId) {
  moveMachineToContainer(machineId, "board");
}

function getListingById(machineId) {
  return listings.find(
    item => String(getListingId(item)) === String(machineId)
  );
}

  function getPocketContainerKey(side) {
  return side === "right"
    ? "pocketRight"
    : "pocketLeft";
}

  function moveListingToSlot(dragId, targetId) {
    if (!dragId || !targetId || dragId === targetId) return;

    setSavedBoardMode("custom");

    setSavedBoardListings(current => {
      const source = current.length
  ? current
  : workspaceListings;

      const fromIndex = source.findIndex(
        item => String(getListingId(item)) === String(dragId)
      );

      const toIndex = source.findIndex(
        item => String(getListingId(item)) === String(targetId)
      );

      if (fromIndex === -1 || toIndex === -1) return source;

      const next = [...source];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);

      return next;
    });
  }

 function handleBoardDragStart(listing, event) {
  const id = String(getListingId(listing));

  setDraggingListingId(id);

  if (event?.dataTransfer) {
    event.dataTransfer.setData("text/plain", id);
  }
}

  function handleBoardDragOver(listing) {
    const targetId = String(getListingId(listing));

    if (!draggingListingId || draggingListingId === targetId) return;

    setGhostListingId(targetId);
  }

 function handleBoardDragEnd(event) {
  const dragId = draggingListingId;

  let dropTarget = null;

  if (event) {
    const draggedCard = document.querySelector(
      `[data-listing-card-id="${dragId}"]`
    );

    if (draggedCard) {
      draggedCard.style.pointerEvents = "none";
    }

    dropTarget = document.elementFromPoint(
      event.clientX,
      event.clientY
    );

    if (draggedCard) {
      draggedCard.style.pointerEvents = "";
    }
  }

  const pocketEl = dropTarget?.closest?.("[data-pocket-target]");

  if (dragId && pocketEl) {
    moveMachineToContainer(
      dragId,
      pocketEl.getAttribute("data-pocket-target")
    );

    setDraggingListingId("");
    setGhostListingId("");
    setActiveStackHover("");
    return;
  }
   
  const stackEl = dropTarget?.closest?.("[data-active-stack]");

  if (dragId && stackEl) {
    addListingToActiveStack(
      stackEl.getAttribute("data-active-stack"),
      dragId
    );

    setDraggingListingId("");
    setGhostListingId("");
    setActiveStackHover("");
    return;
  }

  const targetId = ghostListingId;

  if (dragId && targetId) {
    moveListingToSlot(dragId, targetId);
  }

  setDraggingListingId("");
  setGhostListingId("");
  setActiveStackHover("");
}


  function sendListingToFront(listing) {
    const listingId = getListingId(listing);

    setSavedBoardMode("custom");

    setSavedBoardListings(current => {
      const source = current.length
  ? current
  : workspaceListings;

      const target = source.find(
        item => String(getListingId(item)) === String(listingId)
      );

      const rest = source.filter(
        item => String(getListingId(item)) !== String(listingId)
      );

      return target ? [target, ...rest] : source;
    });
  }

  function sendListingToBack(listing) {
    const listingId = getListingId(listing);

    setSavedBoardMode("custom");

    setSavedBoardListings(current => {
     const source = current.length
  ? current
  : workspaceListings;
      
      const target = source.find(
        item => String(getListingId(item)) === String(listingId)
      );

      const rest = source.filter(
        item => String(getListingId(item)) !== String(listingId)
      );

      return target ? [...rest, target] : source;
    });
  }

  async function toggleSave(listing) {
    if (!sdk) {
      window.location.href = "/login";
      return;
    }

    try {
      const result = await toggleSavedListing({
        sdk,
        listing
      });

      setSavedIds(result.savedIds);

      setSavedBoardListings(current =>
        current.filter(
          item =>
            String(getListingId(item)) !==
            String(getListingId(listing))
        )
      );
    } catch (err) {
      console.error("Save failed", err);
    }
  }

function toggleActiveStack(stackKey) {
  setActiveStacksOpen(current => ({
    ...current,
    [stackKey]: !current[stackKey]
  }));
}
  function toggleActiveStackLayout(stackKey) {
  setActiveStackLayouts(current => ({
    ...current,
    [stackKey]:
      current[stackKey] === "horizontal"
        ? "vertical"
        : "horizontal"
  }));
}

function saveActiveStack(stackKey) {
  const sourceContainer =
    stackKey === "top"
      ? "stackTop"
      : "stackBottom";

  const targetPocket =
    stackKey === "top"
      ? "pocketLeft"
      : "pocketRight";

  setMachineContainers(current => {
    const stackIds = current[sourceContainer] || [];
    const existingPocketIds = current[targetPocket] || [];

    const mergedPocketIds = [
      ...existingPocketIds,
      ...stackIds.filter(id => !existingPocketIds.includes(id))
    ];

    return {
      ...current,
      [sourceContainer]: [],
      [targetPocket]: mergedPocketIds
    };
  });

  setActiveStacksOpen(current => ({
    ...current,
    [stackKey]: false
  }));
}
  
function addListingToActiveStack(stackKey, listingId) {
  if (!listingId) return;

  const targetContainer =
    stackKey === "top"
      ? "stackTop"
      : "stackBottom";

  setActiveStacksOpen(current => ({
    ...current,
    [stackKey]: true
  }));

  moveMachineToContainer(
    listingId,
    targetContainer
  );
}

function handleStackDragStart(machineId, event) {
  const id = String(machineId);

  setStackDraggingId(id);

  if (event?.dataTransfer) {
    event.dataTransfer.setData("text/plain", id);
    event.dataTransfer.effectAllowed = "move";
  }
}

function handleStackDragOver(machineId, event) {
  const targetId = String(machineId);

  if (!stackDraggingId || stackDraggingId === targetId) return;

  const rect = event.currentTarget.getBoundingClientRect();
  const midpoint = rect.left + rect.width / 2;

  setStackGhostId(targetId);
  setStackInsertAfter(event.clientX > midpoint);
}
  
function handleStackDragEnd(stackKey) {
  const dragId = stackDraggingId;
  const targetId = stackGhostId;

  const containerKey =
    stackKey === "top"
      ? "stackTop"
      : "stackBottom";

  if (dragId && targetId) {
  moveMachineWithinContainer(
    containerKey,
    dragId,
    targetId,
    stackInsertAfter
  );
}

  setStackDraggingId("");
setStackGhostId("");
setStackInsertAfter(false);
}
  
function addListingToLeftPocket(listingId) {
  if (!listingId) return;

  moveMachineToContainer(
    listingId,
    "pocketLeft"
  );
}

 function recallPocketToBoard(pocketKey) {
  if (!pocketKey) return;

  setMachineContainers(current => {
    const pocketIds = current[pocketKey] || [];
    const boardIds = current.board || [];

    const mergedBoardIds = [
      ...boardIds,
      ...pocketIds.filter(id => !boardIds.includes(id))
    ];

    return {
      ...current,
      board: mergedBoardIds,
      [pocketKey]: []
    };
  });
} 
function recallPocketMachineToBoard(machineId, pocketKey) {
  if (!machineId || !pocketKey) return;

  setMachineContainers(current => {
    const id = String(machineId);

    const pocketIds = current[pocketKey] || [];
    const boardIds = current.board || [];

    return {
      ...current,
      [pocketKey]: pocketIds.filter(
        item => String(item) !== id
      ),
      board: boardIds.includes(id)
        ? boardIds
        : [...boardIds, id]
    };
  });
}  
  
  return (
    <>
      <Head>
        <title>IXI Workspace | IronXchange</title>

        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          rel="stylesheet"
        />
      </Head>

      <Navbar />

      <main>
        <section className="workspace-head">
          <div>
            <span className="eyebrow">IXI WORKSPACE</span>

           <h1></h1>
          </div>

          <div className="count-pill">
            {visibleSavedListings.length} / {workspaceListings.length}
          </div>
        </section>

<section className="ixi-command-chassis">
  <aside className="ixi-command-left">
    <section className="ixi-pocket-row">
      <section
        data-pocket-target="pocketLeft"
        className={`ixi-pocket-left ${
          (machineContainers.pocketLeft || []).length ? "occupied" : ""
        } ${
          leftPocketOpen ? "open" : ""
        }`}
        onClick={() => setLeftPocketOpen(current => !current)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
        }}
      >
        <div className="ixi-pocket-rail">
          <div className="ixi-pocket-line" />

          <button
            type="button"
            className="ixi-pocket-master-dash"
            onClick={(e) => {
              e.stopPropagation();
              setLeftPocketOpen(current => !current);
            }}
          />
        </div>

        {(machineContainers.pocketLeft || []).length > 0 && (
          <div className="ixi-pocket-thumbs">
            {(machineContainers.pocketLeft || []).slice(0, 7).map((machineId, index) => {
              const machine = getListingById(machineId);
              if (!machine) return null;

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

              return (
                <div
                  key={`left-pocket-thumb-${machineId}`}
                  className="ixi-pocket-thumb"
                  style={{
                    left: `${leftPocketOpen ? index * 80 : index * 16}px`,
                    zIndex: index + 1
                  }}
                >
                  {image ? (
                    <img src={typeof image === "string" ? image : image?.url} alt="" />
                  ) : (
                    <span>
                      {machine.year || machine.publicData?.year || ""}{" "}
                      {machine.make || machine.publicData?.make || ""}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section
        data-pocket-target="pocketRight"
        className={`ixi-pocket-left ixi-pocket-right ${
          (machineContainers.pocketRight || []).length ? "occupied" : ""
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
        }}
      >
        <div className="ixi-pocket-line" />
      </section>
    </section>
  </aside>

  <div className="ixi-command-center">
  
        <section className="workspace-controls">
          <IXSearchSurface
  searchQuery={searchQuery}
  setSearchQuery={setSearchQuery}
  filters={workspaceFilters}
  setFilters={setWorkspaceFilters}
  sortMode={savedBoardMode}
  setSortMode={setSavedBoardMode}
/>

          <div className="ixi-toolbar">
            <button
              type="button"
              className={`ixi-color-filter color-none ${ixiColorFilters.includes("none") ? "active" : ""}`}
              onClick={() => toggleColorFilter("none")}
            />

            <button
              type="button"
              className={`ixi-color-filter color-green ${ixiColorFilters.includes("green") ? "active" : ""}`}
              onClick={() => toggleColorFilter("green")}
            />

            <button
              type="button"
             className={`ixi-color-filter color-yellow ${ixiColorFilters.includes("yellow") ? "active" : ""}`}
              onClick={() => toggleColorFilter("yellow")}
            />

            <button
              type="button"
              className={`ixi-color-filter color-red ${ixiColorFilters.includes("red") ? "active" : ""}`}
              onClick={() => toggleColorFilter("red")}
            />

            <button
              type="button"
              className={`ixi-color-filter color-cyan ${ixiColorFilters.includes("cyan") ? "active" : ""}`}
              onClick={() => toggleColorFilter("cyan")}
            />

            <button
              type="button"
              className={`ixi-color-filter color-white ${ixiColorFilters.includes("white") ? "active" : ""}`}
              onClick={() => toggleColorFilter("white")}
            />

            <button
              type="button"
              className={`ixi-color-filter color-blue ${ixiColorFilters.includes("blue") ? "active" : ""}`}
              onClick={() => toggleColorFilter("blue")}
            />

            <button
              type="button"
              className={`ixi-color-filter color-orange ${ixiColorFilters.includes("orange") ? "active" : ""}`}
              onClick={() => toggleColorFilter("orange")}
            />

            <button
              type="button"
              className={`ixi-thickness-filter thin ${String(ixiOutlineFilter) === "1" ? "active" : ""}`}
              onClick={() => toggleOutlineFilter(1)}
            />

            <button
              type="button"
              className={`ixi-thickness-filter medium ${String(ixiOutlineFilter) === "3" ? "active" : ""}`}
              onClick={() => toggleOutlineFilter(3)}
            />

            <button
              type="button"
              className={`ixi-thickness-filter thick ${String(ixiOutlineFilter) === "5" ? "active" : ""}`}
              onClick={() => toggleOutlineFilter(5)}
            />
          </div>
        </section>

                </div>

  <aside className="ixi-command-right">
  </aside>
</section>

              
<section className="active-stack-zone">
  {["top", "bottom"].map(stackKey => (
    <div
  key={stackKey}
  data-active-stack={stackKey}
  className={`active-stack ${activeStacksOpen[stackKey] ? "open" : ""}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();

        const droppedId =
          e.dataTransfer.getData("text/plain") ||
          draggingListingId;

        addListingToActiveStack(stackKey, droppedId);
      }}
    >
      <button
        type="button"
        className="active-stack-dash"
        onClick={() => toggleActiveStack(stackKey)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();

          const droppedId =
            e.dataTransfer.getData("text/plain") ||
            draggingListingId;

          addListingToActiveStack(stackKey, droppedId);
        }}
      />

      {activeStacksOpen[stackKey] && (
        <div
          className={`active-stack-tray ${
  activeStackHover === stackKey ? "stack-armed" : ""
}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();

            const droppedId =
              e.dataTransfer.getData("text/plain") ||
              draggingListingId;

            addListingToActiveStack(stackKey, droppedId);
          }}
        >
          <div
  className={`active-stack-dropzone ${
    activeStackLayouts[stackKey] === "vertical"
      ? "stack-vertical"
      : "stack-horizontal"
  }`}
>
          {(
  machineContainers[
    stackKey === "top" ? "stackTop" : "stackBottom"
  ] || []
).map(machineId => {
  const machine = getListingById(machineId);

  if (!machine) return null;

  const id = String(getListingId(machine));

  return (
    <div
  key={`stack-card-${id}`}
  className={`active-stack-card ${
    String(id) === String(stackDraggingId) ? "stack-dragging" : ""
  } ${
    String(id) === String(stackGhostId) ? "stack-ghost-target" : ""
  }`}
  draggable
  onDragStart={(e) => handleStackDragStart(id, e)}
 onDragOver={(e) => {
  e.preventDefault();
  handleStackDragOver(id, e);
}}
  onDragEnd={() => handleStackDragEnd(stackKey)}
>
      <ListingCard
        listing={machine}
        saved={savedIds.includes(id)}
        onToggleSaved={() => toggleSave(machine)}
        from="saved"
        ixiState={
          ixiCardState[id] || {
            color: "none",
            outline: 1
          }
        }
        onIxiStateChange={updateIxiCardState}
        onSendFront={sendListingToFront}
        onSendBack={sendListingToBack}
        isBoardDraggingCard={false}
isGhostTarget={false}
onBoardDragStart={() => {}}
onBoardDragOver={() => {}}
onBoardDragEnd={() => {}}
      />
    </div>
  );
})}
          </div>

<button
  type="button"
  className="active-stack-layout-toggle"
  onClick={() => toggleActiveStackLayout(stackKey)}
  title="Toggle stack layout"
/>
            
          <button
            type="button"
            className="active-stack-save"
            onClick={() => saveActiveStack(stackKey)}
          />
        </div>
      )}
    </div>
  ))}
</section>
              
        <section
          className={`cards ${
            visibleSavedListings.length === 1 ? "single-card" : ""
          }`}
        >
          {visibleSavedListings.map(item => {
            const id = String(getListingId(item));

            return (
              <ListingCard
                key={id}
                listing={item}
                saved={savedIds.includes(id)}
                onToggleSaved={() => toggleSave(item)}
                from="saved"

                ixiState={
                  ixiCardState[id] || {
                    color: "none",
                    outline: 1
                  }
                }

                onIxiStateChange={updateIxiCardState}

                onSendFront={sendListingToFront}
                onSendBack={sendListingToBack}

                isBoardDraggingCard={
                  String(id) === String(draggingListingId)
                }

                isGhostTarget={
                  String(id) === String(ghostListingId)
                }

                onBoardDragStart={handleBoardDragStart}
                onBoardDragOver={handleBoardDragOver}
                onBoardDragEnd={handleBoardDragEnd}
              />
            );
          })}
        </section>

        {visibleSavedListings.length === 0 && (
          <div className="empty">
            <h3>No saved machines found.</h3>
            <p>
              Save machines from Browse, then work them here inside the IXI Workspace.
            </p>
          </div>
        )}
      </main>

      <Footer />

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        :global(body) {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #0b0b0b;
          color: #d6d6d6;
        }

        main {
           min-height: 72vh;
  padding: 14px 5% 58px;
          background:
            radial-gradient(circle at 50% 0%, rgba(255,196,0,.05), transparent 34%),
            linear-gradient(180deg, rgba(255,255,255,.014), rgba(255,255,255,0)),
            #0b0b0b;
        }

        .workspace-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 18px;
          margin: 0 auto 18px;
          max-width: 1320px;
        }

        .eyebrow {
          display: inline-block;
          margin-bottom: 8px;
          color: rgba(255,196,0,.72);
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .9px;
        }

        .workspace-head h1 {
          margin: 0;
          color: #f2f2f2;
          font-size: 30px;
          font-weight: 950;
          letter-spacing: -.55px;
        }

        .workspace-head p {
          margin: 8px 0 0;
          color: rgba(255,255,255,.42);
          font-size: 13px;
        }

        .count-pill {
          min-width: 112px;
          height: 30px;
          padding: 0 12px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: 1px solid rgba(255,196,0,.14);
          border-radius: 999px;

          background:
            linear-gradient(180deg, rgba(255,196,0,.045), rgba(255,196,0,0)),
            rgba(10,10,10,.86);

          color: rgba(255,255,255,.52);

          font-size: 10px;
          font-weight: 950;
          letter-spacing: .45px;
        }

        .ixi-command-chassis {
  max-width: 1320px;
  margin: 0 auto 30px;

  display: grid;
  grid-template-columns: 320px 640px 320px;
  gap: 18px;

  align-items: start;
}

.ixi-command-left,
.ixi-command-right {
  min-height: 120px;

  position: relative;

  pointer-events: auto;
}

.ixi-command-center {
  position: relative;
  z-index: 5;
}
        .workspace-controls {
          max-width: 640px;
         margin: 0;
          padding: 7px;

          border: 1px solid rgba(255,255,255,.045);
          border-radius: 14px;

          background:
            linear-gradient(180deg, rgba(255,196,0,.035), rgba(255,196,0,0)),
            rgba(8,8,8,.72);

          box-shadow:
            0 12px 30px rgba(0,0,0,.24);
        }

    .ixi-toolbar {
  width: 600px;
  max-width: 100%;

  margin: 18px auto 0;
  position: relative;
  left: 10px;
  
  padding: 0;

  display: grid;

  grid-template-columns:
    repeat(8, 1fr)
    repeat(3, 1fr);

  justify-content: center;
  align-items: center;

  gap: 4px;
}

        .ixi-toolbar button {
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
        }

        .ixi-toolbar button:hover {
          transform: translateY(-1px);

          box-shadow:
            0 0 0 1px rgba(255,255,255,.03),
            0 0 8px rgba(255,196,0,.10);
        }

        .ixi-color-filter.active,
        .ixi-thickness-filter.active {
          box-shadow:
            0 0 0 1px rgba(255,196,0,.08),
            0 0 12px rgba(255,196,0,.18);

          border-color: rgba(255,196,0,.24) !important;
        }

        .ixi-color-filter {
          width: 20px !important;
          height: 8px !important;
          border: 1px solid rgba(255,255,255,.055) !important;
          border-radius: 1px !important;
          padding: 0 !important;

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.025),
            inset 0 -1px 0 rgba(0,0,0,.32);
        }

        .ixi-color-filter.color-none {
          background: rgba(255,255,255,.035) !important;
        }

        .ixi-color-filter.color-green {
          background: rgba(56,161,105,.42) !important;
        }

        .ixi-color-filter.color-yellow {
          background: rgba(255,196,0,.42) !important;
        }

        .ixi-color-filter.color-red {
          background: rgba(229,62,62,.42) !important;
        }

        .ixi-color-filter.color-cyan {
          background: rgba(0,194,255,.42) !important;
        }

        .ixi-color-filter.color-white {
          background: rgba(255,255,255,.34) !important;
        }

        .ixi-color-filter.color-blue {
          background: rgba(49,130,206,.42) !important;
        }

        .ixi-color-filter.color-orange {
          background: rgba(249,133,18,.42) !important;
        }

        .ixi-thickness-filter {
  width: 24px;
  height: 14px;
  border: 1px solid rgba(255,255,255,.055) !important;
  border-radius: 3px;
  background: rgba(255,255,255,.018) !important;
  position: relative;

  margin-left: -2px;
  margin-right: -2px;
}
        .ixi-thickness-filter::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 15px;
  transform: translate(-50%, -50%);
  background: rgba(255,255,255,.28);
}

        .ixi-thickness-filter.thin::after {
          height: 1px;
        }

        .ixi-thickness-filter.medium::after {
          height: 3px;
        }

        .ixi-thickness-filter.thick::after {
          height: 5px;
        }

.pocket-dev-panel {
  max-width: 1320px;
  margin: 0 auto 10px;
  padding: 10px 12px;

  display: flex;
  gap: 12px;

  border: 1px solid rgba(255,196,0,.28);
  border-radius: 10px;

  background: rgba(255,196,0,.06);

  color: rgba(255,196,0,.9);

  font-size: 11px;
  font-weight: 950;
  letter-spacing: .45px;
}

.pocket-dev-panel button {
  height: 24px;
  padding: 0 10px;

  border: 1px solid rgba(255,196,0,.28);
  border-radius: 7px;

  background: rgba(0,0,0,.42);
  color: rgba(255,196,0,.9);

  font-size: 9px;
  font-weight: 950;
  letter-spacing: .45px;

  cursor: pointer;
}

.pocket-dev-panel button:hover {
  border-color: rgba(255,196,0,.62);
  background: rgba(255,196,0,.08);
}

.ixi-pocket-row {
  width: 100%;
  height: 120px;

  margin: 0;

  display: grid;
  gap: 12px;

  position: relative;
  z-index: 2;
}

.ixi-pocket-left {
  width: 360px;
max-width: 360px;
  height: 120px;

 margin: 0;
  padding: 18px;

  position: relative;
  z-index: 2;
  
  cursor: pointer;

 border: none;

background: rgba(255, 0, 0, .12);
outline: 1px solid rgba(255, 0, 0, .75);
box-shadow: none;
}

.ixi-pocket-right {
width: 360px;
max-width: 360px;

  height: 120px;

 margin: 0;
  padding: 18px;

  position: relative;
  z-index: 2;

  cursor: pointer;

  border: none;

background: rgba(255, 0, 0, .12);
outline: 1px solid rgba(255, 0, 0, .75);

box-shadow: none;
}

.ixi-pocket-left,
.ixi-pocket-right {
  background: rgba(255,0,0,.15);
}

.ixi-pocket-debug-label.right {
  left: auto;
  right: 18px;
}

.ixi-pocket-debug-label {
  position: absolute;
  left: 18px;
  top: 18px;

  color: rgba(255,196,0,.84);

  font-size: 11px;
  font-weight: 950;
  letter-spacing: .65px;
  text-transform: uppercase;
}

.ixi-pocket-rail {
  position: absolute;
  left: 18px;
width: 128px;
  top: 92px;

  height: 8px;

  display: flex;
  align-items: center;
  gap: 3px;

background: rgba(0, 194, 255, .20);
outline: 1px solid rgba(0, 194, 255, .8);

  z-index: 20;
}

.ixi-pocket-line {
  width: 96px;
  height: 5px;

  background: #44494D;

  border-radius: 2px;

  opacity: 1;
}

.ixi-pocket-master-dash {
  width: 18px;
  height: 5px;

  border: 0;
  border-radius: 999px;

  background:
    linear-gradient(
      90deg,
      rgba(68,73,77,.78),
      rgba(68,73,77,.96)
    );

  cursor: pointer;
  padding: 0;

  opacity: .62;

  box-shadow:
    0 0 8px rgba(68,73,77,.08);
}

.ixi-pocket-master-dash:hover {
  opacity: .95;

  box-shadow:
    0 0 12px rgba(68,73,77,.18);
}

.ixi-pocket-left:hover .ixi-pocket-line {
  opacity: .72;
}

.ixi-pocket-left.occupied .ixi-pocket-line {
  opacity: .9;

  background:
    linear-gradient(
      90deg,
      rgba(68,73,77,0),
      rgba(68,73,77,.88) 18%,
      rgba(68,73,77,.22) 48%,
      rgba(68,73,77,.74) 74%,
      rgba(68,73,77,0)
    );

  box-shadow:
    0 0 10px rgba(68,73,77,.16);
}

.ixi-pocket-thumbs {
  position: absolute;

  left: 24px;
  top: 15px;

  width: 100%;
  height: 80px;

  overflow-x: auto;
  overflow-y: hidden;

  pointer-events: auto;

  z-index: 9999;

  background: rgba(0, 255, 0, .12);
outline: 1px solid rgba(0, 255, 0, .75);
}

.ixi-pocket-thumb {
  width: 120px;
  height: 80px;

  position: absolute;

  top: 0;

  overflow: hidden;

  border: 1px solid rgba(0,0,0,.55);

  background: #111;

  z-index: 9999;

  border-top-left-radius: 8px;
border-top-right-radius: 8px;

border-bottom-left-radius: 0;
border-bottom-right-radius: 0;}
.ixi-pocket-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;

  filter: grayscale(1) brightness(.72) contrast(1.05);
  transition: filter .16s ease;
}

.ixi-pocket-left.open .ixi-pocket-thumb img {
  filter: grayscale(0) brightness(1) contrast(1);
}

.ixi-pocket-thumb span {
  display: block;
  padding: 5px;

  color: rgba(255,255,255,.62);

  font-size: 7px;
  font-weight: 900;
  line-height: 1.1;
}

.ixi-pocket-left.occupied:not(.open) .ixi-pocket-thumb {
  transform:
    translateY(54px)
    rotate(-4deg);

  opacity: .72;
}
.ixi-pocket-left.open .ixi-pocket-thumb:hover {
  transform: translateY(-6px);

  box-shadow:
    0 12px 20px rgba(0,0,0,.28);
}

.ixi-pocket-left.open {
  height: 90px;

  overflow-x: auto;
  overflow-y: hidden;
}

.ixi-pocket-left.open .ixi-pocket-thumb {
  transform: translateY(-2px);

  opacity: 1;

  border-color: rgba(255,255,255,.12);
}

.ixi-pocket-left.open .ixi-pocket-thumbs {
  overflow-x: auto;
  overflow-y: hidden;
}

.active-stack-zone {
max-width: 1320px;
margin: -10px auto 22px;
display: grid;
gap: 10px;
align-items: start;
}

.active-stack {
width: 100%;
}

.active-stack-dash {
width: 10px;
height: 8px;

display: block;

border: 0;
border-bottom: 3px solid rgba(255,255,255,.12);

background: transparent;

cursor: pointer;
padding: 0;
margin: 0;
}

.active-stack-dash:hover {
border-bottom-color: rgba(255,196,0,.38);
box-shadow: 0 3px 8px rgba(255,196,0,.10);
}

.active-stack.open .active-stack-dash {
border-bottom-color: rgba(255,196,0,.26);
}

.active-stack-tray {
width: 100%;
min-height: 170px;

margin: 8px 0;
padding: 12px 44px 12px 12px;

border: 1px dashed rgba(255,255,255,.075);
border-radius: 10px;

background:
linear-gradient(
180deg,
rgba(255,255,255,.018),
rgba(255,255,255,0)
),
rgba(8,8,8,.72);

position: relative;
}

.active-stack-dropzone {
min-height: 145px;
align-items: start;
}

/* ========================= */
/* HORIZONTAL STACK MODE     */
/* ========================= */

.active-stack-dropzone.stack-horizontal {
display: flex;
flex-wrap: nowrap;

gap: 18px;

overflow-x: auto;
overflow-y: hidden;

padding-bottom: 8px;

scrollbar-width: thin;
}

.active-stack-dropzone.stack-horizontal .active-stack-card {
flex: 0 0 285px;
width: 285px;
min-width: 285px;
}

/* ========================= */
/* VERTICAL STACK MODE       */
/* ========================= */

.active-stack-dropzone.stack-vertical {
display: grid;

grid-template-columns:
repeat(auto-fill, minmax(250px, 300px));

gap: 18px;

justify-content: start;
}

.active-stack-dropzone.stack-vertical .active-stack-card {
width: 100%;
}

/* ========================= */
/* STACK CARD                */
/* ========================= */

.active-stack-card {
  position: relative;
  z-index: 1;

  transition:
    transform .15s ease,
    opacity .15s ease,
    box-shadow .15s ease;
}

.active-stack-card:hover {
  transform: translateY(-2px);
}

.active-stack-card.stack-dragging {
  z-index: 9999;
  opacity: .96;
  transform: translateY(-4px) scale(1.015);

  box-shadow:
    0 18px 36px rgba(0,0,0,.42),
    0 0 0 1px rgba(255,196,0,.18);
}

.active-stack-card.stack-ghost-target {
  transform: translateX(8px);
}

/* ========================= */
/* STACK ARMED STATE         */
/* ========================= */

.active-stack-tray.stack-armed {
border-color: rgba(0,194,255,.42);

background:
linear-gradient(
180deg,
rgba(0,194,255,.045),
rgba(0,194,255,.01)
),
rgba(8,8,8,.82);

box-shadow:
0 0 0 1px rgba(0,194,255,.08),
0 0 18px rgba(0,194,255,.08);
}

/* ========================= */
/* SAVE DASH                 */
/* ========================= */

.active-stack-save {
position: absolute;
right: 8px;
top: 8px;

width: 18px;
height: 18px;

border: 1px solid rgba(255,196,0,.26);
border-radius: 50%;

background: rgba(255,196,0,.045);

cursor: pointer;
padding: 0;
}

.active-stack-save:hover {
border-color: rgba(255,196,0,.65);

box-shadow:
0 0 10px rgba(255,196,0,.16);
}

/* ========================= */
/* LAYOUT TOGGLE DASH        */
/* ========================= */

.active-stack-layout-toggle {
position: absolute;

right: 8px;
top: 36px;

width: 18px;
height: 8px;

border: 0;
border-bottom: 3px solid rgba(0,194,255,.45);

background: transparent;

cursor: pointer;
padding: 0;
}

.active-stack-layout-toggle:hover {
border-bottom-color: rgba(0,194,255,.9);

box-shadow:
0 4px 10px rgba(0,194,255,.14);
}

        .cards {
          max-width: 1320px;
          margin: 0 auto;

          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 300px));
          gap: 22px;
          align-items: start;
          justify-content: center;
        }

        .cards.single-card {
          grid-template-columns: minmax(250px, 300px);
          justify-content: center;
        }

        .empty {
          max-width: 520px;
          margin: 38px auto 0;
          padding: 38px 28px;

          text-align: center;

          border: 1px solid rgba(255,255,255,.06);
          border-radius: 14px;

          background:
            linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
            #111;

          box-shadow:
            0 14px 34px rgba(0,0,0,.18);
        }

        .empty h3 {
          margin: 0 0 8px;
          color: #f2f2f2;
          font-size: 16px;
          font-weight: 950;
        }

        .empty p {
          margin: 0;
          color: rgba(255,255,255,.42);
          font-size: 12px;
        }

        @media (max-width: 850px) {
          main {
            padding: 28px 4% 48px;
          }

          .workspace-head {
            align-items: flex-start;
            flex-direction: column;
          }

          .workspace-head h1 {
            font-size: 25px;
          }

          .count-pill {
            align-self: flex-start;
          }

          .cards {
            grid-template-columns: 1fr;
          }
        }
       
      `}</style>
    </>
  );
}
