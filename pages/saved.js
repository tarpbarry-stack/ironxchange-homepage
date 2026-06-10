import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

import {
  DndContext,
  useDraggable,
  useDroppable
} from "@dnd-kit/core";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ListingCard from "../components/ListingCard";

import { getListingId } from "../lib/listingFormatters";
import {
  fetchIxiMachineState,
  saveIxiMachinePatch
} from "../lib/ixiMachineStateClient";
import { captureIXEvent } from "../lib/posthog";

import IXSearchSurface from "../components/IXSearchSurface";
import IXSearchSurfaceMobile from "../components/IXSearchSurfaceMobile";
import IXIRelationshipControls from "../components/IXIRelationshipControls";
import IXIEnvironmentRail from "../components/IXIEnvironmentRail";
import IXIControlSurface from "../components/IXIControlSurface";

import {
  fetchCurrentUserWithSavedListings,
  getSavedListingIdsFromUser,
  filterSavedListings,
  toggleSavedListing
} from "../lib/savedListings";

function WorkspaceDropZone({
  id,
  className,
  children,
  ...props
}) {
  const { setNodeRef } = useDroppable({
    id
  });

  return (
    <section
      ref={setNodeRef}
      className={className}
      {...props}
    >
      {children}
    </section>
  );
}

function WorkspaceDropPad({
  id,
  className,
  style,
  ...props
}) {
  const { setNodeRef } = useDroppable({
    id
  });

  return (
    <div
      ref={setNodeRef}
      className={className}
      style={style}
      {...props}
    />
  );
}

export default function SavedListings() {
  const [listings, setListings] = useState([]);
  
function handleWorkspaceDragEnd(event) {
  const dragId = event?.active?.id;
  const overId = event?.over?.id;

  console.log("IXI DND DROP", {
    dragId,
    overId
  });

  if (!dragId || !overId) {
    clearMachineDragState();
    return;
  }

     const pocketTargetMap = {
    pocketLeft: "pocketLeft",
    pocketLeft2: "pocketLeft2",
    pocketRight: "pocketRight",
    pocketRight2: "pocketRight2",
  };

  const stackTargets = [
    "stackTop",
    "stackBottom"
  ];

    if (pocketTargetMap[String(overId)]) {
  const targetPocket = pocketTargetMap[String(overId)];

  moveMachineToContainer(
    String(dragId),
    targetPocket
  );

  if (targetPocket === "pocketLeft") {
    setLeftPocketMode("peek");
  }

  if (targetPocket === "pocketLeft2") {
    setLeftPocket2Mode("peek");
  }

  if (targetPocket === "pocketRight") {
    setRightPocketMode("peek");
  }

  if (targetPocket === "pocketRight2") {
    setRightPocket2Mode("peek");
  }

  clearMachineDragState();
  return;
}

if (stackTargets.includes(String(overId))) {
    moveMachineToContainer(
      String(dragId),
      String(overId)
    );

    setActiveStacksOpen(current => ({
      ...current,
      top: String(overId) === "stackTop" ? true : current.top,
      bottom: String(overId) === "stackBottom" ? true : current.bottom
    }));

    clearMachineDragState();
    return;
  }

  if (String(dragId) !== String(overId)) {
    moveListingToSlot(
      String(dragId),
      String(overId)
    );

    clearMachineDragState();
    return;
  }

  clearMachineDragState();
}
  
  const [savedIds, setSavedIds] = useState([]);
  const [sdk, setSdk] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
const [workspaceFilters, setWorkspaceFilters] = useState({
  category: "ALL CATEGORIES",
  make: "ALL MAKES",
  model: "ALL MODELS",

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
  pocketRight: [],
  pocketLeft2: [],
  pocketRight2: []
});

const [activeStackLayouts, setActiveStackLayouts] = useState({
  top: "horizontal",
  bottom: "horizontal"
});

const [leftPocketOpen, setLeftPocketOpen] = useState(false);
const [rightPocketOpen, setRightPocketOpen] = useState(false);
const [leftPocketMode, setLeftPocketMode] = useState("peek");
const [rightPocketMode, setRightPocketMode] = useState("peek");
const [leftPocket2Mode, setLeftPocket2Mode] = useState("closed");
const [rightPocket2Mode, setRightPocket2Mode] = useState("closed");
  
const [topRailMode, setTopRailMode] = useState("off");

const [armedDestination, setArmedDestination] = useState("");
const [activeStackSendMenu, setActiveStackSendMenu] =
  useState("");
  
const [stackDraggingId, setStackDraggingId] = useState("");
const [stackGhostId, setStackGhostId] = useState("");
const [activeDragMachineId, setActiveDragMachineId] = useState("");
  
const [stackInsertAfter, setStackInsertAfter] = useState(false);

const [activeStackHover, setActiveStackHover] = useState("");
const [ixiCardState, setIxiCardState] = useState({});
  const [ixiUserId, setIxiUserId] = useState("guest");
  const [ixiColorFilters, setIxiColorFilters] = useState([]);
  const [ixiOutlineFilter, setIxiOutlineFilter] = useState("all");

  const [pocketThumbSize, setPocketThumbSize] = useState("medium");

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

  const touchedIds = Object.entries(ixiCardState || {})
    .filter(([id, state]) =>
      (state?.color && state.color !== "none") ||
      Number(state?.outline) > 1 ||
      state?.saved === true ||
      state?.pinned === true ||
      state?.noted === true
    )
    .map(([id]) => String(id));

  return activeListings.filter(item =>
    touchedIds.includes(String(getListingId(item)))
  );
}, [listings, ixiCardState]);

  useEffect(() => {
  if (!workspaceListings.length) return;

  const nextContainers = {
    board: [],
    stackTop: [],
    stackBottom: [],
    pocketLeft: [],
    pocketRight: [],
    pocketLeft2: [],
    pocketRight2: []
  };

  workspaceListings.forEach(item => {
    const id = String(getListingId(item));
    const savedContainer = ixiCardState[id]?.container;

    const targetContainer =
      nextContainers[savedContainer]
        ? savedContainer
        : "board";

    nextContainers[targetContainer].push(id);
  });

  setMachineContainers(nextContainers);
}, [workspaceListings, ixiCardState]);

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

    const itemCategory =
  String(item.type || item.category || "")
    .toUpperCase();

const itemMake =
  String(item.make || "")
    .toUpperCase();

const itemModel =
  String(item.model || "")
    .toUpperCase();

const matchesCategory =
  workspaceFilters.category === "ALL CATEGORIES" ||
  itemCategory === String(workspaceFilters.category).toUpperCase();

const matchesMake =
  workspaceFilters.make === "ALL MAKES" ||
  itemMake === String(workspaceFilters.make).toUpperCase();

const matchesModel =
  workspaceFilters.model === "ALL MODELS" ||
  itemModel === String(workspaceFilters.model).toUpperCase();

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
  matchesCategory &&
  matchesMake &&
  matchesModel &&
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
  const id = String(listingId);

  setIxiCardState(current => {
    const nextRecord = {
      color: "none",
      outline: 1,

      ...(current[id] || {}),

      ...patch,

      touched: true,
      updatedAt: Date.now()
    };

    saveIxiMachinePatch({
      userId: ixiUserId,
      listingId: id,
      patch: nextRecord
    });

    return {
      ...current,
      [id]: nextRecord
    };
  });
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

  updateIxiCardState(id, {
    container: targetContainer
  });

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

function beginMachineDrag(machineId, event) {
  if (!machineId) return;

  const id = String(machineId);

  setActiveDragMachineId(id);
  setDraggingListingId(id);
  setStackDraggingId(id);

  if (event?.dataTransfer) {
    event.dataTransfer.setData("text/plain", id);
    event.dataTransfer.effectAllowed = "move";
  }
}

function getDroppedMachineId(event) {
  return (
    event?.dataTransfer?.getData("text/plain") ||
    activeDragMachineId ||
    draggingListingId ||
    stackDraggingId ||
    ""
  );
}

  function clearMachineDragState() {
  setActiveDragMachineId("");
  setDraggingListingId("");
  setGhostListingId("");
  setStackGhostId("");
  setStackInsertAfter(false);
  setActiveStackHover("");
}
  
 function handleBoardDragStart(listing, event) {
  const id = String(getListingId(listing));
  beginMachineDrag(id, event);
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

    const pocketPadEl = dropTarget?.closest?.("[data-pocket-pad-target]");

  if (dragId && pocketPadEl) {
    moveMachineToContainer(
      dragId,
      pocketPadEl.getAttribute("data-pocket-pad-target")
    );

    setDraggingListingId("");
    setGhostListingId("");
    setActiveStackHover("");
    return;
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

  setDraggingListingId("");
  setGhostListingId("");
  setActiveStackHover("");
  return;
}

const boardEl = dropTarget?.closest?.("[data-board-target]");

if (dragId && boardEl) {
  moveMachineToContainer(dragId, "board");

  setDraggingListingId("");
  setGhostListingId("");
  setActiveStackHover("");
  return;
}

  setDraggingListingId("");
  setGhostListingId("");
  setActiveStackHover("");
}
  
function rotatePocket(pocketKey) {
  if (!pocketKey) return;

  setMachineContainers(current => {
    const ids = current[pocketKey] || [];

    if (ids.length <= 1) return current;

    return {
      ...current,
      [pocketKey]: [
        ...ids.slice(1),
        ids[0]
      ]
    };
  });
}

function cyclePocketMode(side) {
  const cycle = setter => {
    setter(current => {
      if (current === "closed") return "peek";
      if (current === "peek") return "open";
      return "closed";
    });
  };

  if (side === "left") return cycle(setLeftPocketMode);
  if (side === "right") return cycle(setRightPocketMode);
  if (side === "left2") return cycle(setLeftPocket2Mode);
  if (side === "right2") return cycle(setRightPocket2Mode);
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

function getStackContainerKey(stackKey) {
  return stackKey === "top"
    ? "stackTop"
    : "stackBottom";
}

function moveActiveStackToContainer(stackKey, targetContainer) {
  const sourceContainer = getStackContainerKey(stackKey);
  const stackIds = machineContainers[sourceContainer] || [];

  stackIds.forEach(machineId => {
    moveMachineToContainer(
      machineId,
      targetContainer
    );
  });

  setActiveStacksOpen(current => ({
    ...current,
    [stackKey]: false
  }));
}

function saveActiveStack(stackKey) {
  const targetPocket =
    stackKey === "top"
      ? "pocketLeft"
      : "pocketRight";

  moveActiveStackToContainer(
    stackKey,
    targetPocket
  );
}

 function sendActiveStackToTheater(stackKey) {
  const sourceContainer = getStackContainerKey(stackKey);
  const stackIds = machineContainers[sourceContainer] || [];

  console.log("IXI THEATER STACK", {
    stackKey,
    machineIds: stackIds
  });
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
  beginMachineDrag(machineId, event);
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
  const dragId = activeDragMachineId || stackDraggingId;
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

function movePocketToContainer(pocketKey, targetContainer) {
  if (!pocketKey || !targetContainer) return;

  const pocketIds = machineContainers[pocketKey] || [];

  pocketIds.forEach(machineId => {
    moveMachineToContainer(
      machineId,
      targetContainer
    );
  });
}

function movePocketToStack(pocketKey, stackKey) {
  const targetContainer =
    stackKey === "top"
      ? "stackTop"
      : "stackBottom";

  movePocketToContainer(
    pocketKey,
    targetContainer
  );

  setActiveStacksOpen(current => ({
    ...current,
    [stackKey]: true
  }));
}

function recallPocketToBoard(pocketKey) {
  movePocketToContainer(
    pocketKey,
    "board"
  );
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

function cycleTopRailMode() {
  setTopRailMode(current => {
    if (current === "off") return "dim";
    if (current === "dim") return "bright";
    return "off";
  });
}


function getIxiColorValue(color) {
  const colors = {
    green: "rgba(56,161,105,.82)",
    yellow: "rgba(255,196,0,.86)",
    red: "rgba(229,62,62,.86)",
    cyan: "rgba(0,194,255,.82)",
    white: "rgba(255,255,255,.74)",
    blue: "rgba(49,130,206,.82)",
    orange: "rgba(249,133,18,.82)"
  };

  return colors[color] || "rgba(255,255,255,.12)";
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

     <DndContext
  onDragEnd={handleWorkspaceDragEnd}
>
        <main>
  <section className="saved-environment-shell">
    <IXIEnvironmentRail
      activeEnvironment="IXI WORKSPACE"
      hasAccount={!!sdk}
      hasRelationship={true}
      hasInventory={!!sdk}
    />
  </section>
      

<section className="ixi-command-chassis">
  <aside className="ixi-command-left">
    <section className="ixi-pocket-row">
          <section
  data-pocket-target="pocketLeft"
className={`ixi-pocket-left pocket-mode-${leftPocketMode} ${
  (machineContainers.pocketLeft || []).length ? "occupied" : ""
}`}
  onDragOver={(e) => e.preventDefault()}
  onDrop={(e) => {
  e.preventDefault();
  e.stopPropagation();

  const droppedId = getDroppedMachineId(e);

  if (droppedId) {
    moveMachineToContainer(droppedId, "pocketLeft");
  }

  clearMachineDragState();
}}
>
<WorkspaceDropPad
  id="pocketLeft"
  data-pocket-pad-target="pocketLeft"
  className="ixi-pocket-catch-pad catch-l1"
  style={{
    position: "absolute",
    left: 0,
    right: "auto",
    top: "12px",
    width: "340px",
    height: "140px",
    pointerEvents: "auto",
    zIndex: 1,
    background: "transparent",
    outline: "none"
  }}
/>


<div
  className={`ixi-pocket-action-rail left ${
    (machineContainers.pocketLeft || []).length === 0
      ? "is-empty"
      : "has-machines"
  } pocket-mode-${leftPocketMode}`}
>
 <button type="button" className="ixi-pocket-rail-action theater" data-label="IXI THEATER" />

<button
  type="button"
  className="ixi-pocket-rail-action stack"
  data-label="ACTIVE STACK"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();

    movePocketToStack(
      "pocketLeft",
      "top"
    );
  }}
/>

<button
  type="button"
  className="ixi-pocket-rail-action board"
  data-label="BOARD"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    recallPocketToBoard("pocketLeft");
  }}
/>

<button type="button" className="ixi-pocket-rail-action send" data-label="SEND" />
</div>

<button
  type="button"
  className={`ixi-pocket-loop-square left ${
  (machineContainers.pocketLeft || []).length > 0 &&
  leftPocketMode !== "closed"
    ? "is-visible"
    : ""
}`}
  title="Loop Pocket"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    rotatePocket("pocketLeft");
  }}
/>
    
<button
  type="button"
  className={`ixi-pocket-direct-button left ${
  (machineContainers.pocketLeft || []).length > 0 &&
  leftPocketMode === "closed"
    ? "has-load"
    : ""
} ${
  (machineContainers.pocketLeft || []).length > 0 &&
  leftPocketMode !== "closed"
    ? "is-live"
    : ""
}`}
title="Left pocket"
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  cyclePocketMode("left");
}}
/>
    
{leftPocketMode !== "closed" &&
 (machineContainers.pocketLeft || []).length > 0 && (
  <div className={`ixi-pocket-thumbs thumb-size-${pocketThumbSize}`}>
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
   draggable
onDragStart={(e) => {
  e.stopPropagation();
  handleBoardDragStart(machine, e);
}}
onDragEnd={handleBoardDragEnd}            style={{
right: `${leftPocketMode === "open" ? index * 44 : leftPocketMode === "peek" ? index * 16 : index * 8}px`,
 zIndex: index + 1,
  borderColor: getIxiColorValue(
    ixiCardState[String(machineId)]?.color
  )
}}
          >

            {image ? (
              <img
                src={typeof image === "string" ? image : image?.url}
                alt=""
              />
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
  data-pocket-target="pocketLeft2"
  className={`ixi-pocket-left ixi-pocket-l2 pocket-mode-${leftPocket2Mode} ${
    (machineContainers.pocketLeft2 || []).length ? "occupied" : ""
  }`}
  onDragOver={(e) => e.preventDefault()}
  onDrop={(e) => {
    e.preventDefault();
    e.stopPropagation();

    const padTarget = e.target
      ?.closest?.("[data-pocket-pad-target]")
      ?.getAttribute("data-pocket-pad-target");

    if (padTarget !== "pocketLeft2") {
      clearMachineDragState();
      return;
    }

    const droppedId = getDroppedMachineId(e);

    if (droppedId) {
      moveMachineToContainer(droppedId, "pocketLeft2");
    }

    clearMachineDragState();
  }}
>
  
<WorkspaceDropPad
  id="pocketLeft2"
  data-pocket-pad-target="pocketLeft2"
  className="ixi-pocket-catch-pad out-left"
  style={{
    position: "fixed",
    left: 0,
    right: "auto",
    top: "420px",
    width: "150px",
    height: "calc(100vh - 420px)",
    pointerEvents: "auto",
    zIndex: 999,
    background: "transparent",
    outline: "none"
  }}
/>
  

  <div
    className={`ixi-pocket-action-rail left ${
      (machineContainers.pocketLeft2 || []).length === 0
        ? "is-empty"
        : "has-machines"
    } pocket-mode-${leftPocket2Mode}`}
  >
    <button type="button" className="ixi-pocket-rail-action theater" data-label="IXI THEATER" />

    <button
  type="button"
  className="ixi-pocket-rail-action stack"
  data-label="ACTIVE STACK"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();

    movePocketToStack(
      "pocketLeft2",
      "bottom"
    );
  }}
/>
    <button
      type="button"
      className="ixi-pocket-rail-action board"
      data-label="BOARD"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        recallPocketToBoard("pocketLeft2");
      }}
    />

    <button type="button" className="ixi-pocket-rail-action send" data-label="SEND" />
  </div>

  <button
    type="button"
    className={`ixi-pocket-loop-square left ${
      (machineContainers.pocketLeft2 || []).length > 0 &&
      leftPocket2Mode !== "closed"
        ? "is-visible"
        : ""
    }`}
    title="Loop Pocket"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      rotatePocket("pocketLeft2");
    }}
  />

  <button
    type="button"
    className={`ixi-pocket-direct-button left ${
      (machineContainers.pocketLeft2 || []).length > 0 &&
      leftPocket2Mode === "closed"
        ? "has-load"
        : ""
    } ${
      (machineContainers.pocketLeft2 || []).length > 0 &&
      leftPocket2Mode !== "closed"
        ? "is-live"
        : ""
    }`}
    title="Left lower pocket"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      cyclePocketMode("left2");
    }}
  />

  {leftPocket2Mode !== "closed" &&
    (machineContainers.pocketLeft2 || []).length > 0 && (
      <div className={`ixi-pocket-thumbs thumb-size-${pocketThumbSize}`}>
        {(machineContainers.pocketLeft2 || []).slice(0, 7).map((machineId, index) => {
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
             key={`left-pocket-2-thumb-${machineId}`}
className="ixi-pocket-thumb"
draggable
onDragStart={(e) => {
  e.stopPropagation();
  handleBoardDragStart(machine, e);
}}
onDragEnd={handleBoardDragEnd}
style={{
  right: `${leftPocket2Mode === "open" ? index * 44 : leftPocket2Mode === "peek" ? index * 16 : index * 8}px`,
  zIndex: index + 1,
  borderColor: getIxiColorValue(
    ixiCardState[String(machineId)]?.color
  )
}}
>
              {image ? (
                <img
                  src={typeof image === "string" ? image : image?.url}
                  alt=""
                />
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
    </section>
  </aside>

  <div className="ixi-command-center">
  
       <section className="workspace-controls">
  <IXIControlSurface>
    <div className="desktop-search-surface">
      <IXSearchSurface
  searchQuery={searchQuery}
  setSearchQuery={setSearchQuery}
  filters={workspaceFilters}
  setFilters={setWorkspaceFilters}
  sortMode={savedBoardMode}
  setSortMode={setSavedBoardMode}
  pocketThumbSize={pocketThumbSize}
  setPocketThumbSize={setPocketThumbSize}
/>
    </div>

    <div className="mobile-search-surface">
      <IXSearchSurfaceMobile
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filters={workspaceFilters}
        setFilters={setWorkspaceFilters}
        sortMode={savedBoardMode}
        setSortMode={setSavedBoardMode}
      />
    </div>

   <IXIRelationshipControls
  ixiCardState={ixiCardState}
  activeColors={ixiColorFilters}
  onToggleColor={toggleColorFilter}
  activeOutline={ixiOutlineFilter}
  onToggleOutline={toggleOutlineFilter}
  pocketThumbSize={pocketThumbSize}
  setPocketThumbSize={setPocketThumbSize}
/>
  </IXIControlSurface>
</section>

                </div>

  <aside className="ixi-command-right">
  <section className="ixi-pocket-row">
    <section
      data-pocket-target="pocketRight"
    className={`ixi-pocket-left ixi-pocket-right pocket-mode-${rightPocketMode} ${
  (machineContainers.pocketRight || []).length ? "occupied" : ""
}`}
    onDragOver={(e) => e.preventDefault()}
   onDrop={(e) => {
  e.preventDefault();
  e.stopPropagation();

  const droppedId = getDroppedMachineId(e);

  if (droppedId) {
  moveMachineToContainer(droppedId, "pocketRight");
}

  clearMachineDragState();
}}
  > 
<WorkspaceDropPad
  id="pocketRight"
  data-pocket-pad-target="pocketRight"
  className="ixi-pocket-catch-pad catch-r1"
  style={{
    position: "absolute",
    right: -20,
    left: "auto",
    top: "12px",
    width: "360px",
    height: "140px",
    pointerEvents: "auto",
    zIndex: 1,
     background: "transparent",
    outline: "none"
  }}
/>
   
  <div
  className={`ixi-pocket-action-rail right ${
  (machineContainers.pocketRight || []).length === 0 ? "is-empty" : "has-machines"
} pocket-mode-${rightPocketMode}`}
>
<button type="button" className="ixi-pocket-rail-action send" data-label="SEND" />

<button
  type="button"
  className="ixi-pocket-rail-action board"
  data-label="BOARD"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    recallPocketToBoard("pocketRight");
  }}
/>

<button
  type="button"
  className="ixi-pocket-rail-action stack"
  data-label="ACTIVE STACK"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();

    movePocketToStack(
      "pocketRight",
      "top"
    );
  }}
/>

<button type="button" className="ixi-pocket-rail-action theater" data-label="IXI THEATER" />
</div>

<button
  type="button"
  className={`ixi-pocket-loop-square right ${
  (machineContainers.pocketRight || []).length > 0 &&
  rightPocketMode !== "closed"
    ? "is-visible"
    : ""
}`}
  title="Loop Pocket"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    rotatePocket("pocketRight");
  }}
/>
    
<button
  type="button"
className={`ixi-pocket-direct-button right ${
  (machineContainers.pocketRight || []).length > 0 &&
  rightPocketMode === "closed"
    ? "has-load"
    : ""
} ${
  (machineContainers.pocketRight || []).length > 0 &&
  rightPocketMode !== "closed"
    ? "is-live"
    : ""
}`}
title="Right pocket"
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  cyclePocketMode("right");
}}
/>
  

{rightPocketMode !== "closed" &&
 (machineContainers.pocketRight || []).length > 0 && (
  <div className={`ixi-pocket-thumbs r1-thumbs thumb-size-${pocketThumbSize}`}>
    {(machineContainers.pocketRight || []).slice(0, 7).map((machineId, index) => {
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
  key={`right-pocket-thumb-${machineId}`}
  className="ixi-pocket-thumb"
  draggable
  onDragStart={(e) => {
    e.stopPropagation();
    handleBoardDragStart(machine, e);
  }}
  onDragEnd={handleBoardDragEnd}
  style={{
     

left: `${rightPocketMode === "open" ? index * 44 : rightPocketMode === "peek" ? index * 16 : index * 8}px`,
  zIndex: index + 1,
  borderColor: getIxiColorValue(
    ixiCardState[String(machineId)]?.color
  )
}}
        >

          {image ? (
            <img
              src={typeof image === "string" ? image : image?.url}
              alt=""
            />
          ) : (
            <span>
              {machine.year || machine.publicData?.year || ""}
              {" "}
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
  data-pocket-target="pocketRight2"
  className={`ixi-pocket-left ixi-pocket-right ixi-pocket-r2 pocket-mode-${rightPocket2Mode} ${
    (machineContainers.pocketRight2 || []).length ? "occupied" : ""
  }`}
  onDragOver={(e) => e.preventDefault()}
  onDrop={(e) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedId = getDroppedMachineId(e);

    if (droppedId) {
      moveMachineToContainer(droppedId, "pocketRight2");
    }

    clearMachineDragState();
  }}
>
 <WorkspaceDropPad
  id="pocketRight2"
  data-pocket-pad-target="pocketRight2"
  className="ixi-pocket-catch-pad out-right"
  style={{
    position: "fixed",
    right: 0,
    left: "auto",
    top: "405px",
    width: "150px",
    height: "calc(100vh - 405px)",
    pointerEvents: "auto",
    zIndex: 999,
    background: "transparent",
    outline: "none"
  }}
/>

  <div
    className={`ixi-pocket-action-rail right ${
      (machineContainers.pocketRight2 || []).length === 0
        ? "is-empty"
        : "has-machines"
    } pocket-mode-${rightPocket2Mode}`}
  >
    <button
      type="button"
      className="ixi-pocket-rail-action send"
      data-label="SEND"
    />

    <button
      type="button"
      className="ixi-pocket-rail-action board"
      data-label="BOARD"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        recallPocketToBoard("pocketRight2");
      }}
    />

   <button
  type="button"
  className="ixi-pocket-rail-action stack"
  data-label="ACTIVE STACK"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();

    movePocketToStack(
      "pocketRight2",
      "bottom"
    );
  }}
/>

    <button
      type="button"
      className="ixi-pocket-rail-action theater"
      data-label="IXI THEATER"
    />
  </div>

  <button
    type="button"
    className={`ixi-pocket-loop-square right ${
      (machineContainers.pocketRight2 || []).length > 0 &&
      rightPocket2Mode !== "closed"
        ? "is-visible"
        : ""
    }`}
    title="Loop Pocket"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      rotatePocket("pocketRight2");
    }}
  />

  <button
    type="button"
    className={`ixi-pocket-direct-button right ${
      (machineContainers.pocketRight2 || []).length > 0 &&
      rightPocket2Mode === "closed"
        ? "has-load"
        : ""
    } ${
      (machineContainers.pocketRight2 || []).length > 0 &&
      rightPocket2Mode !== "closed"
        ? "is-live"
        : ""
    }`}
    title="Right lower pocket"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      cyclePocketMode("right2");
    }}
  />

  {rightPocket2Mode !== "closed" &&
    (machineContainers.pocketRight2 || []).length > 0 && (
      <div className={`ixi-pocket-thumbs thumb-size-${pocketThumbSize}`}>
        {(machineContainers.pocketRight2 || []).slice(0, 7).map((machineId, index) => {
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
              key={`right-pocket-2-thumb-${machineId}`}
              className="ixi-pocket-thumb"
              draggable
              onDragStart={(e) => {
                e.stopPropagation();
                handleBoardDragStart(machine, e);
              }}
              onDragEnd={handleBoardDragEnd}
              style={{
                left: `${rightPocket2Mode === "open"
                  ? index * 44
                  : rightPocket2Mode === "peek"
                    ? index * 16
                    : index * 8}px`,
                zIndex: index + 1,
                borderColor: getIxiColorValue(
                  ixiCardState[String(machineId)]?.color
                )
              }}
            >
              {image ? (
                <img
                  src={typeof image === "string" ? image : image?.url}
                  alt=""
                />
              ) : (
                <span>
                  {machine.year || machine.publicData?.year || ""}
                  {" "}
                  {machine.make || machine.publicData?.make || ""}
                </span>
              )}
            </div>
          );
        })}
      </div>
    )}
</section>
  </section>
</aside>
</section>

              
<section className="active-stack-zone">
  {["top", "bottom"].map(stackKey => (
      <WorkspaceDropZone
  key={stackKey}
  id={stackKey === "top" ? "stackTop" : "stackBottom"}
  data-active-stack={stackKey}
  className={`active-stack ${
  activeStacksOpen[stackKey] ? "open" : ""
} ${
  (
    machineContainers[
      stackKey === "top" ? "stackTop" : "stackBottom"
    ] || []
  ).length > 0
    ? "has-machines"
    : ""
}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();

       const droppedId = getDroppedMachineId(e);

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

         const droppedId = getDroppedMachineId(e);

          addListingToActiveStack(stackKey, droppedId);
        }}
      />

     {activeStacksOpen[stackKey] && (
  <WorkspaceDropZone
    id={stackKey === "top" ? "stackTop" : "stackBottom"}
    className={`active-stack-tray ${
      activeStackHover === stackKey ? "stack-armed" : ""
    }`}
  >
    <div className="active-stack-pocket-corners">
  <button
  type="button"
  className="stack-pocket-power top-left"
  data-label="L1"
  title="Send stack to L1"
  onClick={() =>
    moveActiveStackToContainer(
      stackKey,
      "pocketLeft"
    )
  }
/>
  <button
    type="button"
    className="stack-pocket-power top-right"
    data-label="R1"
    title="Send stack to R1"
    onClick={() =>
      moveActiveStackToContainer(
        stackKey,
        "pocketRight"
      )
    }
  />

  <button
    type="button"
    className="stack-pocket-power bottom-left"
    data-label="L2"
    title="Send stack to L2"
    onClick={() =>
      moveActiveStackToContainer(
        stackKey,
        "pocketLeft2"
      )
    }
  />

 <button
    type="button"
    className="stack-pocket-power bottom-right"
    data-label="R2"
    title="Send stack to R2"
    onClick={() =>
      moveActiveStackToContainer(
        stackKey,
        "pocketRight2"
      )
    }
  />
</div>

<div className="active-stack-command-pad">
  <button
    type="button"
    className="stack-rail-action theater"
    data-label="IXI THEATER"
    title="IXI Theater"
    onClick={() =>
      sendActiveStackToTheater(stackKey)
    }
  />

  <button
    type="button"
    className="stack-rail-action layout"
    data-label="LAYOUT"
    title="Toggle layout"
    onClick={() => toggleActiveStackLayout(stackKey)}
  />

  <button
    type="button"
    className="stack-rail-action board"
    data-label="BOARD"
    title="Send stack to board"
    onClick={() =>
      moveActiveStackToContainer(
        stackKey,
        "board"
      )
    }
  />

  <button
    type="button"
    className="stack-rail-action send"
    data-label="SEND"
    title="Send stack"
  />
</div>

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

               </WorkspaceDropZone>
      )}
      </WorkspaceDropZone>
  ))}
</section>
              
      <section
  data-board-target="board"
  className={`cards ${
    visibleSavedListings.length === 1 ? "single-card" : ""
  }`}
  onDragOver={(e) => e.preventDefault()}
  onDrop={(e) => {
    e.preventDefault();

    const droppedId = getDroppedMachineId(e);

    if (droppedId) {
      moveMachineToContainer(droppedId, "board");
    }

    clearMachineDragState();
  }}
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

                useDndDrag={true}
              />
            );
          })}
        </section>

        {visibleSavedListings.length === 0 && (
  <div className="empty">
    <h3>HELP US BUILD OUR MARKETPLACE</h3>
    <p>
      Touch a machine. Create a relationship. Machines will appear here.
    </p>
  </div>
)}
              </main>
      </DndContext>

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

       .saved-environment-shell {
  width: 100%;
  margin: 0 auto;
}

.ixi-top-function-rail {
  max-width: 1320px;
  height: 14px;

  margin: 0 auto 8px;

  display: flex;
  align-items: center;
  gap: 12px;

  opacity: .08;

  transition:
    opacity .16s ease,
    filter .16s ease;
}

.ixi-top-function-rail:hover,
.ixi-top-function-rail.mode-dim {
  opacity: .36;
}

.ixi-top-function-rail.mode-bright {
  opacity: .82;
}

.ixi-top-power-dash,
.ixi-top-function-dash {
  width: 24px;
  height: 5px;

  border: 0;
  border-radius: 2px;

  background: rgba(255,255,255,.12);

  padding: 0;
  cursor: pointer;
}

.ixi-top-power-dash {
  background: rgba(255,196,0,.22);
}

.ixi-top-function-rail.mode-dim .ixi-top-power-dash,
.ixi-top-function-rail.mode-bright .ixi-top-power-dash {
  background: rgba(255,196,0,.86);
  box-shadow: 0 0 8px rgba(255,196,0,.24);
}

.ixi-top-function-dash.active {
  background: rgba(255,196,0,.42);
}

.ixi-top-function-dash:hover {
  background: rgba(0,194,255,.72);
  box-shadow: 0 0 8px rgba(0,194,255,.18);
}

.ixi-top-post-free {
  margin-left: auto;

  color: rgba(255,255,255,.10);
  text-decoration: none;

  font-size: 7.5px;
  font-weight: 950;
  letter-spacing: .72px;

  white-space: nowrap;
}

.ixi-top-function-rail.mode-dim .ixi-top-post-free {
  color: rgba(255,255,255,.28);
}

.ixi-top-function-rail.mode-bright .ixi-top-post-free,
.ixi-top-post-free:hover {
  color: rgba(255,196,0,.72);
  text-shadow: 0 0 8px rgba(255,196,0,.14);
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
  width: 100%;
  margin: 0 auto 30px;

  position: relative;

  display: block;
}

.ixi-command-center {
  position: relative;
  z-index: 5;

  width: min(100%, 680px);
  min-width: 0;

  margin: 0 auto;

  display: flex;
  justify-content: center;
}

.ixi-command-left,
.ixi-command-right {
  position: absolute;
  top: 0;

  width: 360px;
  min-height: 160px;

  pointer-events: auto;
  z-index: 3;
}

.ixi-command-left {
  right: calc(50% + clamp(230px, 20vw, 340px) + 12px);
  left: auto;
}

.ixi-command-right {
  left: calc(50% + clamp(230px, 20vw, 340px) + 12px);
  right: auto;
}





       .workspace-controls {
  margin: 0 auto;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
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
top: -20px;
  width: 360px;
max-width: 360px;
  height: 95px;

 margin: 0;
  padding: 18px;

  position: relative;
  z-index: 2;
  
  cursor: pointer;

 border: none;

box-shadow: none;
}

.ixi-pocket-right {
  width: 360px;
  max-width: 360px;
  height: 105px;

  margin: 0;
  padding: 18px;

  position: relative;
  z-index: 2;
}


/* =============================== */
/* IXI POCKET MACHINE CONTROL PLANE */
/* =============================== */

/* =============================== */
/* IXI POCKET CONTROL RAIL V2      */
/* =============================== */

.ixi-pocket-left,
.ixi-pocket-right {
  cursor: default !important;
}

.ixi-pocket-r2 {
  top: -35px;
}

.ixi-pocket-l2 {
  top: -25px;
}

@keyframes ixiPocketPulse {
  0%, 100% {
    opacity: .48;
    transform: translateX(-50%) scale(.82);
  }

  50% {
    opacity: 1;
    transform: translateX(-50%) scale(1.08);
  }
}

/* square thumb-loop actuator, rides above the power dash */
.ixi-pocket-loop-button {
  position: absolute;
  left: 50%;
  top: 0;

  width: 7px;
  height: 7px;

  transform: translate(-50%, -16px);

  border: 1px solid rgba(255,255,255,.12);
  border-radius: 2px;

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.06),
      rgba(255,255,255,0)
    ),
    rgba(255,255,255,.08);

  padding: 0;
  cursor: pointer;

  z-index: 98;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.05),
    0 0 0 1px rgba(0,0,0,.28);
}
.ixi-pocket-loop-button.right {
  left: 50%;
  right: auto;
}

.ixi-pocket-loop-button:hover {
  border-color: rgba(255,255,255,.24);

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.10),
      rgba(255,255,255,0)
    ),
    rgba(255,255,255,.14);

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.08),
    0 0 6px rgba(255,255,255,.08);
}

/* Roll-top cover: fixed dash/lip, cover moves behind it */


/* =============================== */
/* IXI POCKET CATCH ZONE DEBUG     */
/* =============================== */

/* Base catch pad is inert unless explicitly assigned */
.ixi-pocket-catch-pad {
  position: absolute;
  pointer-events: none;
  z-index: 1;
}

/* L1 local catch only */
.ixi-pocket-catch-pad.catch-l1 {
  left: 0;
  right: auto;
  top: 92px;

  width: 360px;
  height: 140px;

  pointer-events: auto;

  background: transparent;
outline: none;
}

/* R1 local catch only */
.ixi-pocket-catch-pad.catch-r1 {
  right: 20;
  left: auto;
  top: 92px;

  width: 340px;
  height: 140px;

  pointer-events: auto;

  background: transparent;
outline: none;
}

/* L2 screen-left lower catch lane only */
.ixi-pocket-l2 .ixi-pocket-catch-pad.out-left {
  position: fixed;

  left: 0;
  right: auto;
  top: 405px;

  width: 150px;
  height: calc(100vh - 405px);

  pointer-events: auto;
  z-index: 999;

 background: transparent;
outline: none;
}

/* R2 screen-right lower catch lane only */
.ixi-pocket-r2 .ixi-pocket-catch-pad.out-right {
  position: fixed;

  right: 0;
  left: auto;
  top: 420px;

  width: 150px;
  height: calc(100vh - 420px);

  pointer-events: auto;
  z-index: 999;

  background: transparent;
outline: none;
}


/* ========================= */
/* IXI POCKET RAW VISUAL V1  */
/* Keeps drag catch intact   */
/* ========================= */

.ixi-pocket-thumbs.thumb-size-small {
  --pocket-thumb-w: 72px;
  --pocket-thumb-h: 48px;
  --pocket-thumbs-top: 42px;
}

.ixi-pocket-thumbs.thumb-size-medium {
  --pocket-thumb-w: 90px;
  --pocket-thumb-h: 60px;
  --pocket-thumbs-top: 30px;
}

.ixi-pocket-thumbs.thumb-size-large {
  --pocket-thumb-w: 108px;
  --pocket-thumb-h: 72px;
  --pocket-thumbs-top: 18px;
}

.ixi-pocket-thumbs {
 position: absolute;

   left: 50%;
  top: var(--pocket-thumbs-top, 30px);

  width: 320px;
  height: 92px;

  transform: translateX(-50%);
  overflow: visible;

  pointer-events: auto;

  z-index: 30;
}

.ixi-pocket-right .ixi-pocket-thumbs {
  left: 50%;
  right: auto;
}

.ixi-pocket-right .ixi-pocket-thumbs.r1-thumbs {
  left: auto;
  right: 20px;
  transform: none;
}
/* PEEK POCKET COVER */

.ixi-pocket-left.pocket-mode-open .ixi-pocket-thumbs,
.ixi-pocket-right.pocket-mode-open .ixi-pocket-thumbs {
  height: 92px;
  overflow: visible;
}

  .ixi-pocket-thumb {
  width: var(--pocket-thumb-w) !important;
  height: var(--pocket-thumb-h) !important;
  
  position: absolute;
  top: 0;

  overflow: hidden;

  border: 2px solid rgba(255,255,255,.12);
  border-radius: 8px 8px 0 0;

  background: #111;

  transition:
    transform .18s ease,
    opacity .18s ease,
    box-shadow .18s ease,
    border-color .18s ease;
}


.ixi-pocket-left.pocket-mode-open .ixi-pocket-thumbs {
  height: 92px;
}

.ixi-pocket-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ixi-pocket-thumb span {
  display: block;
  padding: 5px;

  color: rgba(255,255,255,.62);

  font-size: 7px;
  font-weight: 900;
  line-height: 1.1;
}

/* PEEK STATE — preserve the good look */
/* CLOSED — cards mostly hidden, dash/cover present */
.ixi-pocket-left.pocket-mode-closed .ixi-pocket-thumb {
  transform: translateY(0) rotate(-9deg);
  opacity: .18;
}

.ixi-pocket-right.pocket-mode-closed .ixi-pocket-thumb {
  transform: translateY(0) rotate(9deg);
  opacity: .18;
}

/* PEEK — same plane, tight accordion */
.ixi-pocket-left.pocket-mode-peek .ixi-pocket-thumb {
  transform-origin: right bottom;
  transform: rotate(7deg);
  opacity: .72;
}

.ixi-pocket-right.pocket-mode-peek .ixi-pocket-thumb {
  transform-origin: left bottom;
  transform: rotate(-7deg);
  opacity: .72;
}

/* OPEN — same plane, flat accordion */
.ixi-pocket-left.pocket-mode-open .ixi-pocket-thumb,
.ixi-pocket-right.pocket-mode-open .ixi-pocket-thumb {
  transform: translateY(0) rotate(0deg);
  opacity: 1;
  border-color: rgba(255,255,255,.14);
}

/* =============================== */
/* IXI POCKET DIRECT CONTROL V1    */
/* =============================== */

/* =============================== */
/* IXI POCKET RAIL — WORKING V2    */
/* =============================== */

.ixi-pocket-left,
.ixi-pocket-right {
  cursor: default !important;
}

/* VISUAL RAIL — painted only */
.ixi-pocket-action-rail {
  position: absolute;
  top: 95px;

  width: 150px;
  height: 4px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  background: transparent; 
  
  z-index: 60;
  pointer-events: auto;
}

.ixi-pocket-action-rail.left {
  right: 20px;
}

.ixi-pocket-action-rail.right {
  left: 20px;
}

.ixi-pocket-rail-action {
  position: relative;

  width: 28px;
  height: 4px;

  border: 0;
  border-radius: 0;

  background:  background: transparent;

  padding: 0;
  cursor: pointer;
}

.ixi-pocket-rail-action:hover {
  background: rgba(255,196,0,.86) !important;
  box-shadow: 0 0 8px rgba(255,196,0,.22);
}

.ixi-pocket-rail-action:hover::after {
  content: attr(data-label);

  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);

  white-space: nowrap;

  color: rgba(255,255,255,.72);
  font-size: 7px;
  font-weight: 950;
  letter-spacing: .6px;
  text-transform: uppercase;

  pointer-events: none;
}

/* EMPTY = one solid dormant line */
.ixi-pocket-action-rail.is-empty {
  background: rgba(255,255,255,.04);
}

.ixi-pocket-action-rail.is-empty .ixi-pocket-rail-action {
  opacity: 0;
  pointer-events: none;
}

/* LOADED + CLOSED = one solid dormant line */
.ixi-pocket-action-rail.has-machines.pocket-mode-closed {
  background: rgba(255,255,255,.04);
}

.ixi-pocket-action-rail.has-machines.pocket-mode-closed .ixi-pocket-rail-action {
  opacity: 0;
  pointer-events: none;
}

/* LOADED + STAGED/OPEN = four row-2 search-surface dashes */
.ixi-pocket-action-rail.has-machines.pocket-mode-peek,
.ixi-pocket-action-rail.has-machines.pocket-mode-open {
  background: transparent;
}

.ixi-pocket-action-rail.has-machines.pocket-mode-peek .ixi-pocket-rail-action,
.ixi-pocket-action-rail.has-machines.pocket-mode-open .ixi-pocket-rail-action {
  opacity: 1;
  pointer-events: auto;
  background: rgba(255,255,255,.13);
}

/* ACTUAL BUTTON — real click target */
.ixi-pocket-direct-button {
  position: absolute;
  top: 95px;

  width: 18px;
  height: 4px;

  border: 0;
  border-radius: 2px;

  background: rgba(255,255,255,.18);

  padding: 0;
  cursor: pointer;

  z-index: 99999;
  pointer-events: auto;

  box-shadow: none;
}

/* actuator sits toward SearchSurface */
.ixi-pocket-direct-button.left {
  right: -9px;
}

.ixi-pocket-direct-button.right {
  left: -9px;
}
.ixi-pocket-direct-button:hover {
  background: rgba(255,196,0,.95);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.22),
    0 0 10px rgba(255,196,0,.32);
}

.ixi-pocket-direct-button.has-load {
  background: rgba(255,196,0,.32);
  box-shadow: none;
}

.ixi-pocket-direct-button.is-live {
  background: rgba(255,196,0,.95);

  box-shadow:
    0 0 8px rgba(255,196,0,.42);
}

.ixi-pocket-loop-square {
  position: absolute;

  width: 4px;
  height: 4px;

  border: 1px solid rgba(255,255,255,.22);
  border-radius: 1px;

  background: rgba(255,255,255,.12);

  padding: 0;
  cursor: pointer;

  z-index: 99999;
  pointer-events: auto;

  opacity: 0;
}

.ixi-pocket-loop-square.is-visible {
  opacity: 1;
}

.ixi-pocket-loop-square.left {
  top: 68px;
  right: -2px;
}

.ixi-pocket-loop-square.right {
  top: 68px;
  left: -2px;
}

.ixi-pocket-loop-square:hover {
  border-color: rgba(255,196,0,.62);
  background: rgba(255,196,0,.72);
}


/* =============================== */
/* IXI ACTIVE STACK COMMAND PAD    */
/* GLOBAL — SAVED MASTER CHASSIS   */
/* =============================== */

:global(.active-stack-zone) {
  width: min(100%, 1320px);
  max-width: 1320px;

  margin: 10px auto 24px;

  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;

  align-items: center;
  justify-items: center;

  position: relative;
  z-index: 20;
}

:global(.active-stack) {
  width: 100%;
  position: relative;

  display: grid;
  justify-items: center;
}

:global(.active-stack-dash) {
  width: 34px;
  height: 8px;

  display: block;

  border: 0;
  border-bottom: 3px solid rgba(255,255,255,.14);

  background: transparent;

  cursor: pointer;
  padding: 0;
  margin: 0;

  position: relative;
  z-index: 8;
}

:global(.active-stack-dash:hover) {
  border-bottom-color: rgba(255,196,0,.48);
  box-shadow: 0 3px 8px rgba(255,196,0,.12);
}

:global(.active-stack.open .active-stack-dash) {
  border-bottom-color: rgba(255,196,0,.58);
  box-shadow: 0 3px 10px rgba(255,196,0,.14);
}

:global(.active-stack.has-machines .active-stack-dash) {
  border-bottom-color: rgba(255,196,0,.78);
  box-shadow: 0 3px 12px rgba(255,196,0,.24);
}

:global(.active-stack.has-machines .active-stack-dash::after) {
  content: "";

  position: absolute;
  left: 50%;
  top: 8px;

  width: 5px;
  height: 5px;

  transform: translateX(-50%);

  background: rgba(255,196,0,.92);
  box-shadow: 0 0 8px rgba(255,196,0,.38);
}

/* tray surface */
:global(.active-stack-tray) {
  width: min(100%, 1180px);
  min-height: 230px;

  margin: 8px auto 0;
  padding: 42px 46px 18px;

  position: relative;
  display: block;
  overflow: visible;
  isolation: isolate;

  border: 1px dashed rgba(255,196,0,.14);
  border-radius: 10px;

  background:
    linear-gradient(
      180deg,
      rgba(255,196,0,.035),
      rgba(255,196,0,.008) 48%,
      rgba(255,255,255,.010)
    ),
    rgba(8,8,8,.86);

  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,.025),
    0 0 18px rgba(255,196,0,.045);
}

:global(.active-stack-tray.stack-armed) {
  border-color: rgba(255,196,0,.58);

  background:
    linear-gradient(
      180deg,
      rgba(255,196,0,.065),
      rgba(255,196,0,.014)
    ),
    rgba(8,8,8,.90);

  box-shadow:
    inset 0 0 0 1px rgba(255,196,0,.10),
    0 0 24px rgba(255,196,0,.16);
}

:global(.active-stack-tray::before) {
  content: "ACTIVE STACK DROP ZONE";

  position: absolute;
  left: 14px;
  top: 12px;

  color: rgba(255,255,255,.30);

  font-size: 7px;
  font-weight: 950;
  letter-spacing: .72px;
  text-transform: uppercase;

  pointer-events: none;
  z-index: 1;
}

/* corner destination dashes */
:global(.active-stack-pocket-corners) {
  position: absolute;
  inset: 0;

  pointer-events: none;
  z-index: 42;
}

:global(.stack-pocket-power) {
  position: absolute;

  width: 18px;
  height: 4px;

  border: 0;
  border-radius: 2px;

  background: rgba(0,194,255,.42);

  padding: 0;
  cursor: pointer;
  pointer-events: auto;

  box-shadow: none;
}

:global(.stack-pocket-power:hover) {
  background: rgba(0,194,255,.92);
  box-shadow: 0 0 8px rgba(0,194,255,.30);
}

:global(.stack-pocket-power.top-left) {
  top: 27px;
  left: 14px;
}

:global(.stack-pocket-power.top-right) {
  top: 27px;
  right: 14px;
}

:global(.stack-pocket-power.bottom-left) {
  bottom: 12px;
  left: 14px;
}

:global(.stack-pocket-power.bottom-right) {
  bottom: 12px;
  right: 14px;
}

/* center action rail */
:global(.active-stack-command-pad) {
  position: absolute;
  top: 12px;
  left: 50%;

  width: 150px;
  height: 4px;

  transform: translateX(-50%);

  display: flex;
  align-items: center;
  justify-content: space-between;

  background: transparent;

  z-index: 46;
  pointer-events: auto;
}

:global(.stack-rail-action) {
  position: relative;

  width: 28px;
  height: 4px;

  border: 0;
  border-radius: 0;

  background: rgba(255,255,255,.13);

  padding: 0;
  cursor: pointer;
}

:global(.stack-rail-action:hover) {
  background: rgba(255,196,0,.86);
  box-shadow: 0 0 8px rgba(255,196,0,.22);
}

:global(.stack-rail-action:hover::after) {
  content: attr(data-label);

  position: absolute;
  bottom: 12px;
  left: 50%;

  transform: translateX(-50%);

  white-space: nowrap;

  color: rgba(255,255,255,.72);

  font-size: 7px;
  font-weight: 950;
  letter-spacing: .6px;
  text-transform: uppercase;

  pointer-events: none;
}

/* card field */
:global(.active-stack-dropzone) {
  min-height: 175px;

  position: relative;
  z-index: 2;

  align-items: start;

  border: 1px dashed rgba(255,255,255,.08);
  border-radius: 9px;

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.018),
      rgba(255,255,255,0)
    ),
    rgba(10,10,10,.42);
}

:global(.active-stack-dropzone.stack-horizontal) {
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;

  gap: 18px;

  overflow-x: auto;
  overflow-y: hidden;

  padding: 10px 8px 12px;

  scrollbar-width: thin;
}

:global(.active-stack-dropzone.stack-vertical) {
  display: grid;

  grid-template-columns:
    repeat(auto-fill, minmax(250px, 300px));

  gap: 18px;

  justify-content: center;

  padding: 10px 8px 12px;
}

:global(.active-stack-dropzone.stack-horizontal .active-stack-card) {
  flex: 0 0 285px;
  width: 285px;
  min-width: 285px;
}

:global(.active-stack-dropzone.stack-vertical .active-stack-card) {
  width: 100%;
}

:global(.active-stack-card) {
  position: relative;
  z-index: 3;

  transition:
    transform .15s ease,
    opacity .15s ease,
    box-shadow .15s ease;
}

:global(.active-stack-card:hover) {
  transform: translateY(-2px);
}

:global(.active-stack-card.stack-dragging) {
  z-index: 9999;
  opacity: .96;

  transform: translateY(-4px) scale(1.015);

  box-shadow:
    0 18px 36px rgba(0,0,0,.42),
    0 0 0 1px rgba(255,196,0,.18);
}

:global(.active-stack-card.stack-ghost-target) {
  transform: translateX(8px);
}

        .cards {
          max-width: 1920px;
          margin: 0 auto;

          min-height: 260px;

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
.mobile-search-surface {
  display: none;
}

.desktop-search-surface {
  display: block;
}
@media (max-width: 850px) {
  main {
    padding: 18px 4% 48px;
  }

  .desktop-search-surface {
  display: none;
}

.mobile-search-surface {
  display: block;
}

  .workspace-head {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  margin-bottom: 14px;
}

  .workspace-head h1 {
    font-size: 25px;
  }

  .ixi-command-chassis {
    display: block;
    max-width: 100%;
    margin: 0 auto 18px;
  }

  .ixi-command-center {
    width: 100%;
    max-width: 100%;
  }

  .workspace-controls {
    width: 100%;
    max-width: 100%;
    margin: 0 auto 18px;
  }

  .ixi-command-left,
  .ixi-command-right,
  .ixi-pocket-row,
  .ixi-pocket-left,
  .ixi-pocket-right,
  .active-stack-zone {
    display: none !important;
  }

 .ixi-toolbar {
  width: max-content;
  max-width: 100%;

  margin: 12px auto 0;
  left: 0;

  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: center;

  gap: 16px;
}
.ixi-color-filter {
  flex: 0 0 20px;
}

.ixi-thickness-filter {
  flex: 0 0 24px;
  margin-top: 0;
}
  .ixi-thickness-filter {
    margin-top: 6px;
  }

  .cards {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .cards.single-card {
    grid-template-columns: 1fr;
  }
}
       
      `}</style>
    </>
  );
}
