import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable
} from "@dnd-kit/core";

import {
  useSortable,
  sortableKeyboardCoordinates
} from "@dnd-kit/sortable";

import {
  CSS
} from "@dnd-kit/utilities";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { getListingId } from "../lib/listingFormatters";
import {
  fetchIxiMachineState,
  saveIxiMachinePatch,
} from "../lib/ixiMachineStateClient";

import {
  captureMarketplaceIntelligence
} from "../lib/marketplace/cardIntelligence";

import IXIDragEngine from "../components/ixi-chassis/IXIDragEngine";
import IXIEnvironmentRail from "../components/IXIEnvironmentRail";
import IXIActiveStack from "../components/ixi-chassis/IXIActiveStack";
import IXIBoard from "../components/ixi-chassis/IXIBoard";
import IXIBoardSurface
  from "../components/ixi-chassis/IXIBoardSurface";
import IXICardScaleControl
  from "../components/ixi-chassis/IXICardScaleControl";
import IXIWorkspaceEmptyState
  from "../components/ixi-chassis/IXIWorkspaceEmptyState";
import IXIBrowseObjectConsoleRouter
  from "../components/ixi-marketplace/IXIBrowseObjectConsoleRouter";
import ListingShareProvider
  from "../components/ixi-marketplace/ListingShareProvider";
import MarketplaceCardIntelligence
  from "../components/ixi-marketplace/MarketplaceCardIntelligence";
import IXIChassisControls from "../components/ixi-chassis/IXIChassisControls";
import IXIPocketL1 from "../components/ixi-chassis/IXIPocketL1";
import IXIPocketL2 from "../components/ixi-chassis/IXIPocketL2";
import IXIPocketR1 from "../components/ixi-chassis/IXIPocketR1";
import IXIPocketR2 from "../components/ixi-chassis/IXIPocketR2";
import IXIChassis from "../components/ixi-chassis/IXIChassis";
import IXIWorkspaceEngine from "../components/ixi-chassis/IXIWorkspaceEngine";
import IXIActiveStackZone from "../components/ixi-chassis/IXIActiveStackZone";
import IXISortableMachineCard from "../components/ixi-chassis/IXISortableMachineCard";
import WorkspaceDropZone from "../components/ixi-chassis/WorkspaceDropZone";
import WorkspaceDropPad from "../components/ixi-chassis/WorkspaceDropPad";

import {
  IXI_WORKSPACE_SETTINGS_ID,
  IXI_WORKSPACE_LAYOUT_ID,
  createEmptyWorkspaceContainers,
  sanitizeWorkspaceContainers,
  saveWorkspaceLayoutRecord,
  saveWorkspaceSettingsRecord
} from "../components/ixi-chassis/IXIWorkspacePersistenceEngine";

import {
  getMachineContainerFromContainers,
  reorderMachineWithinContainerState,
  moveMachineToContainerAtPositionState,
  moveMachineToContainerState
} from "../components/ixi-chassis/IXIMachineContainerEngine";

import {
  getStackContainerKey,
  toggleStackOpenState,
  openStackState,
  toggleStackLayoutState,
  getMachineIdsForStack
} from "../components/ixi-chassis/IXIStackEngine";

import {
  rotatePocketState,
  movePocketToContainerState
} from "../components/ixi-chassis/IXIPocketEngine";

import {
  workspaceCollisionDetection,
  createWorkspaceDragStartHandler,
  createWorkspaceDragCancelHandler,
  createWorkspaceDragEndHandler
} from "../components/ixi-chassis/IXIDndEngineHelpers";

import {
  filterSavedListings,
  toggleSavedListing
} from "../lib/savedListings";

import loadIXIListingsEnvironment from "../lib/listings/IXIListingsEngine";

import {
  sendMachineToTheater
} from "../lib/ixiTheaterQueue";
import {
  matchesMarketplaceRanges,
  sortMarketplaceListings,
  validateMarketplaceRangeFilters
} from "../lib/marketplace/marketplaceBrowseFilters.mjs";

import {
  IXI_COMMANDS
} from "../components/ixi-object-system/IXICommandBus";
import {
  readSitewideCardScaleMode,
  resolveSitewideCardScaleMode,
  writeSitewideCardScaleMode
} from "../components/ixi-chassis/IXIScaleEngine";

export default function BrowseV2() {
  const [listings, setListings] = useState([]);
  const [
    inventoryRequestState,
    setInventoryRequestState
  ] = useState({
    status: "loading",
    error: ""
  });
  
  const [savedIds, setSavedIds] = useState([]);
  const [sdk, setSdk] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
const initialWorkspaceFilters = {
  category: "ALL CATEGORIES",
  make: "ALL MAKES",
  model: "ALL MODELS",

  yearMin: "",
  yearMax: "",
  priceMin: "",
  priceMax: "",
  hoursMin: "",
  hoursMax: ""
};
const [workspaceFilters, setWorkspaceFiltersState] = useState(
  initialWorkspaceFilters
);
const [appliedWorkspaceRanges, setAppliedWorkspaceRanges] = useState(
  validateMarketplaceRangeFilters(initialWorkspaceFilters).values
);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const homepageQuery = String(params.get("q") || "").trim();
  const homepageCategory = String(
    params.get("category") || "ALL CATEGORIES"
  ).trim();

  if (homepageQuery) {
    setSearchQuery(homepageQuery);
  }

  if (homepageCategory && homepageCategory !== "ALL CATEGORIES") {
    const nextFilters = {
      ...initialWorkspaceFilters,
      category: homepageCategory
    };

    setWorkspaceFiltersState(nextFilters);
    setAppliedWorkspaceRanges(
      validateMarketplaceRangeFilters(nextFilters).values
    );
  }
}, []);

const workspaceRangeValidation = useMemo(
  () => validateMarketplaceRangeFilters(workspaceFilters),
  [workspaceFilters]
);

function setWorkspaceFilters(nextFilters) {
  const resolvedFilters =
    typeof nextFilters === "function"
      ? nextFilters(workspaceFilters)
      : nextFilters;

  const validation = validateMarketplaceRangeFilters(
    resolvedFilters
  );

  setWorkspaceFiltersState(resolvedFilters);

  // Invalid edits remain visible for correction, while the last valid
  // range continues driving results. A typo must never blank the board.
  if (validation.valid) {
    setAppliedWorkspaceRanges(validation.values);
  }
}

function resetMarketplaceView() {
  setSearchQuery("");
  setWorkspaceFiltersState(initialWorkspaceFilters);
  setAppliedWorkspaceRanges(
    validateMarketplaceRangeFilters(initialWorkspaceFilters).values
  );
  setIxiColorFilters([]);
  setIxiOutlineFilter("all");

  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    url.searchParams.delete("q");
    url.searchParams.delete("category");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }
}

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
  
const [topRailMode, setTopRailMode] = useState("off");

const [activeStackSendMenu, setActiveStackSendMenu] =
  useState("");

const POCKET_TARGETS = [
  "pocketLeft",
  "pocketLeft2",
  "pocketRight",
  "pocketRight2"
];
  const DIRECT_CONTAINER_TARGETS = [
  ...POCKET_TARGETS,
  "stackTop",
  "stackBottom"
];


  const [activeStackHover, setActiveStackHover] = useState("");
  const [ixiCardState, setIxiCardState] = useState({});
  const [ixiUserId, setIxiUserId] = useState("guest");
  
  const [workspaceSettings, setWorkspaceSettings] =
  useState({});
  
  const [ixiColorFilters, setIxiColorFilters] = useState([]);
  const [ixiOutlineFilter, setIxiOutlineFilter] = useState("all");

  const hasActiveMarketplaceView = useMemo(() => {
    return (
      searchQuery.trim().length > 0 ||
      workspaceFilters.category !== initialWorkspaceFilters.category ||
      workspaceFilters.make !== initialWorkspaceFilters.make ||
      workspaceFilters.model !== initialWorkspaceFilters.model ||
      workspaceFilters.yearMin !== initialWorkspaceFilters.yearMin ||
      workspaceFilters.yearMax !== initialWorkspaceFilters.yearMax ||
      workspaceFilters.priceMin !== initialWorkspaceFilters.priceMin ||
      workspaceFilters.priceMax !== initialWorkspaceFilters.priceMax ||
      workspaceFilters.hoursMin !== initialWorkspaceFilters.hoursMin ||
      workspaceFilters.hoursMax !== initialWorkspaceFilters.hoursMax ||
      ixiColorFilters.length > 0 ||
      ixiOutlineFilter !== "all"
    );
  }, [
    searchQuery,
    workspaceFilters,
    ixiColorFilters,
    ixiOutlineFilter
  ]);

  const [pocketThumbSize, setPocketThumbSize] = useState("medium");

const [
  cardScaleMode,
  setCardScaleMode
] = useState("xl");

useEffect(() => {
  const savedMode = readSitewideCardScaleMode();

  if (savedMode) {
    setCardScaleMode(savedMode);
  }
}, []);
  
  const hasAppliedRemoteLayoutRef = useRef(false);
  const inventoryRequestIdRef = useRef(0);
  
const [activeDndId, setActiveDndId] = useState("");
const [workspaceNotice, setWorkspaceNotice] = useState("");
const workspaceNoticeTimerRef = useRef(null);

const parkBrakeOn =
  workspaceSettings?.parkBrakeOn === true;

function showParkBrakeNotice() {
  setWorkspaceNotice("PARK BRAKE ENGAGED");

  if (workspaceNoticeTimerRef.current) {
    clearTimeout(workspaceNoticeTimerRef.current);
  }

  workspaceNoticeTimerRef.current = setTimeout(() => {
    setWorkspaceNotice("");
    workspaceNoticeTimerRef.current = null;
  }, 1600);
}

function blockMechanicalMutation() {
  if (!parkBrakeOn) return false;
  showParkBrakeNotice();
  return true;
}

useEffect(() => {
  return () => {
    if (workspaceNoticeTimerRef.current) {
      clearTimeout(workspaceNoticeTimerRef.current);
    }
  };
}, []);

const startWorkspaceDrag =
  createWorkspaceDragStartHandler({
    setActiveDndId
  });

function handleWorkspaceDragStart(event) {
  if (blockMechanicalMutation()) return;
  startWorkspaceDrag(event);
}

const handleWorkspaceDragCancel =
  createWorkspaceDragCancelHandler({
    setActiveDndId,
    clearMachineDragState
  });

function handleWorkspaceDragEnd(event) {
  if (blockMechanicalMutation()) {
    setActiveDndId("");
    clearMachineDragState();
    return;
  }

  const dragId = String(event?.active?.id || "");
  const overId = String(event?.over?.id || "");

  const activeSortable =
    event?.active?.data?.current?.sortable;

  const overSortable =
    event?.over?.data?.current?.sortable;

  const knownContainers = [
    "board",
    "stackTop",
    "stackBottom",
    "pocketLeft",
    "pocketRight",
    "pocketLeft2",
    "pocketRight2"
  ];

  const sourceContainer =
    event?.active?.data?.current?.containerId ||
    (knownContainers.includes(activeSortable?.containerId)
      ? activeSortable.containerId
      : getMachineContainer(dragId));

  const targetContainer =
    overSortable?.containerId ||
    event?.over?.data?.current?.containerId ||
    (knownContainers.includes(overId)
      ? overId
      : getMachineContainer(overId));

  const result = IXI_COMMANDS.handleRelationshipDrop({
    dragId,
    overId,
    sourceContainer,
    targetContainer,
    ixiCardState,
    machineContainers
  });

  executeIXITransaction(result);

  if (targetContainer === "stackTop") {
    setActiveStacksOpen(current => ({
      ...current,
      top: true
    }));
  }

  if (targetContainer === "stackBottom") {
    setActiveStacksOpen(current => ({
      ...current,
      bottom: true
    }));
  }

  setActiveDndId("");
  clearMachineDragState();
}


  
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 6
    }
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  })
);

  useEffect(() => {
    captureMarketplaceIntelligence(
      "marketplace_inventory_requested",
      { result: "page_opened" }
    );
  }, []);

async function loadBrowseEnvironment({
  retry = false
} = {}) {
  const requestId =
    inventoryRequestIdRef.current + 1;

  inventoryRequestIdRef.current =
    requestId;

  setInventoryRequestState({
    status:
      retry
        ? "retrying"
        : "loading",
    error: ""
  });

  try {
    const environment =
      await loadIXIListingsEnvironment({
        includePrivateState: true,
        publicMarketplacePerformance: true,
        publicMarketplaceSurface: "browse-v2",
        progressiveMedia: true,
        hydrateProgressiveMedia: false,
        onListingsReady: nextListings => {
          if (
            inventoryRequestIdRef.current === requestId
          ) {
            setListings(nextListings);
          }
        },
        onListingsHydrated: nextListings => {
          if (
            inventoryRequestIdRef.current === requestId
          ) {
            setListings(nextListings);
          }
        }
      });

    if (
      inventoryRequestIdRef.current !==
        requestId
    ) {
      return;
    }

    if (
      environment.errors.publicListings
    ) {
      throw environment.errors.publicListings;
    }

    setListings(environment.listings);
    setSdk(environment.sdk);
    setSavedIds(environment.savedIds);
    setIxiUserId(environment.userId);
    setIxiCardState(environment.ixiState);

    const loadedWorkspaceSettings =
  environment.workspaceSettings || {};

    setWorkspaceSettings(
      loadedWorkspaceSettings
    );

    setCardScaleMode(
      resolveSitewideCardScaleMode(
        environment.workspaceSettings?.cardScaleMode
      )
    );

    if (environment.errors.publicListings) {
      console.error(
        "BROWSE PUBLIC LISTINGS FAILED:",
        environment.errors.publicListings
      );
    }

    if (environment.errors.privateState) {
      console.warn(
        "BROWSE PRIVATE STATE UNAVAILABLE — GUEST MODE:",
        environment.errors.privateState
      );
    }

    setInventoryRequestState({
      status: "ready",
      error: ""
    });

    captureMarketplaceIntelligence(
      "marketplace_inventory_ready",
      {
        result: "ready",
        total_count: environment.listings.length
      }
    );
  } catch (error) {
    if (
      inventoryRequestIdRef.current !==
        requestId
    ) {
      return;
    }

    console.error(
      "BROWSE PUBLIC LISTINGS FAILED:",
      error
    );

    setInventoryRequestState({
      status: "error",
      error:
        error?.message ||
        "Marketplace inventory could not be loaded."
    });

    captureMarketplaceIntelligence(
      "marketplace_inventory_failed",
      {
        result: retry ? "retry_failed" : "failed",
        error_code: "public_inventory_failed"
      }
    );
  }
}

useEffect(() => {
  loadBrowseEnvironment();

  return () => {
    inventoryRequestIdRef.current += 1;
  };
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

 const marketplaceListings = useMemo(() => {
  return listings.filter(item => {
    const listingStatus =
      item.listingStatus ||
      item.publicData?.listingStatus ||
      item.attributes?.publicData?.listingStatus;

    return listingStatus !== "archived";
  });
}, [listings]);

const containerStateKey = useMemo(() => {
  return marketplaceListings
    .map(item => {
      const id = String(getListingId(item));
      return `${id}:${ixiCardState[id]?.container || "board"}`;
    })
    .join("|");
}, [marketplaceListings, ixiCardState]);
   
useEffect(() => {
  if (!marketplaceListings.length) return;

  const validMachineIds = marketplaceListings.map(item =>
    String(getListingId(item))
  );

  const savedLayout =
    ixiCardState?.[IXI_WORKSPACE_LAYOUT_ID];

  if (
    savedLayout?.machineContainers &&
    !hasAppliedRemoteLayoutRef.current
  ) {
    setMachineContainers(
      sanitizeWorkspaceContainers(
        savedLayout.machineContainers,
        validMachineIds
      )
    );

    hasAppliedRemoteLayoutRef.current = true;
    return;
  }

  if (hasAppliedRemoteLayoutRef.current) {
  return;
}

  const nextContainers = createEmptyWorkspaceContainers();

  marketplaceListings.forEach(item => {
    const id = String(getListingId(item));
    const savedContainer = ixiCardState[id]?.container;

    const targetContainer =
      nextContainers[savedContainer]
        ? savedContainer
        : "board";

    nextContainers[targetContainer].push(id);
  });

  setMachineContainers(nextContainers);
}, [containerStateKey]);

  const visibleBrowseListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const source =
      savedBoardMode === "custom" && savedBoardListings.length
        ? savedBoardListings
        : marketplaceListings;

const orderedSource =
  (machineContainers.board || [])
    .map(id =>
      source.find(item =>
        String(getListingId(item)) === String(id)
      )
    )
    .filter(Boolean);
    
   const filtered = orderedSource.filter(item => {
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

const matchesWorkspaceRanges = matchesMarketplaceRanges(
  item,
  appliedWorkspaceRanges
);

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

return sortMarketplaceListings(filtered, savedBoardMode);
     }, [
    searchQuery,
    savedBoardMode,
    savedBoardListings,
    marketplaceListings,
    workspaceFilters,
    appliedWorkspaceRanges,
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

function cycleMachineFace(listingOrId) {
  const id =
    typeof listingOrId === "object"
      ? String(getListingId(listingOrId))
      : String(listingOrId);

  const currentFace =
    Number(ixiCardState[id]?.face || 1);

  const nextFace =
    currentFace === 1 ? 2 :
    currentFace === 2 ? 3 :
    currentFace === 3 ? 4 :
    1;

  updateIxiCardState(id, {
    face: nextFace
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
  return getMachineContainerFromContainers(
    machineContainers,
    machineId
  );
}

function executeIXITransaction(result) {
  if (!result) return;
  if (blockMechanicalMutation()) return false;

  const nextIxiCardState =
    result.nextIxiCardState || ixiCardState;

  const nextMachineContainers =
    result.nextMachineContainers || machineContainers;

  setIxiCardState(nextIxiCardState);
  setMachineContainers(nextMachineContainers);

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

  saveWorkspaceLayout(nextMachineContainers);
  return true;
}
  
function moveMachineToContainer(machineId, targetContainer) {
  if (!machineId || !targetContainer) return;

  const result = IXI_COMMANDS.moveObject({
    objectId: machineId,
    targetContainer,
    ixiCardState,
    machineContainers
  });

  executeIXITransaction(result);
}
function moveMachineToContainerAtPosition(
  machineId,
  targetContainer,
  targetId,
  insertAfter = false
) {
  if (!machineId || !targetContainer || !targetId) return;

  const result = IXI_COMMANDS.moveObjectToPosition({
    objectId: machineId,
    targetContainer,
    targetId,
    insertAfter,
    ixiCardState,
    machineContainers
  });

  executeIXITransaction(result);
}
  
 function moveMachineWithinContainer(containerKey, dragId, targetId, insertAfter = false) {
  if (!containerKey || !dragId || !targetId) return;

  const result = IXI_COMMANDS.reorderWithinContainer({
    containerKey,
    objectId: dragId,
    targetId,
    insertAfter,
    ixiCardState,
    machineContainers
  });

  executeIXITransaction(result);
}
  
function moveMachineBackToBoard(machineId) {
  moveMachineToContainer(machineId, "board");
}

function getListingById(machineId) {
  return listings.find(
    item => String(getListingId(item)) === String(machineId)
  );
}

  function getActiveDndListing() {
  if (!activeDndId) return null;

  return getListingById(activeDndId);
}

  function getPocketContainerKey(side) {
  return side === "right"
    ? "pocketRight"
    : "pocketLeft";
}

  function moveListingToSlot(dragId, targetId) {
    if (!dragId || !targetId || dragId === targetId) return;
    if (blockMechanicalMutation()) return;

    setSavedBoardMode("custom");

    setSavedBoardListings(current => {
      const source = current.length
  ? current
  : marketplaceListings;

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

  function clearMachineDragState() {
  setDraggingListingId("");
  setGhostListingId("");
  setActiveStackHover("");
}
  
function rotatePocket(pocketKey) {
  if (blockMechanicalMutation()) return;

  setMachineContainers(current => {
    const finalContainers = rotatePocketState(
      current,
      pocketKey
    );

    if (finalContainers !== current) {
      saveWorkspaceLayout(finalContainers);
    }

    return finalContainers;
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
  const listingId = String(getListingId(listing));

  const result = IXI_COMMANDS.sendObjectToFront({
    objectId: listingId,
    containerKey: "board",
    ixiCardState,
    machineContainers
  });

  executeIXITransaction(result);
}

function sendListingToBack(listing) {
  const listingId = String(getListingId(listing));

  const result = IXI_COMMANDS.sendObjectToBack({
    objectId: listingId,
    containerKey: "board",
    ixiCardState,
    machineContainers
  });

  executeIXITransaction(result);
}
  async function toggleSave(listing) {
    const listingId = String(getListingId(listing));

    captureMarketplaceIntelligence("listing_save_requested", {
      listing_id: listingId,
      saved: !savedIds.includes(listingId),
      result: "requested"
    });

    if (!sdk) {
      captureMarketplaceIntelligence("listing_save_failed", {
        listing_id: listingId,
        result: "authentication_required",
        error_code: "authentication_required"
      });
      window.location.href = "/login";
      return;
    }

    try {
      const result = await toggleSavedListing({
        sdk,
        listing
      });

      setSavedIds(result.savedIds);

      captureMarketplaceIntelligence("listing_save_succeeded", {
        listing_id: listingId,
        saved: result.savedIds.includes(listingId),
        result: "completed"
      });

      setSavedBoardListings(current =>
        current.filter(
          item =>
            String(getListingId(item)) !==
            String(getListingId(listing))
        )
      );
    } catch (err) {
      console.error("Save failed", err);
      captureMarketplaceIntelligence("listing_save_failed", {
        listing_id: listingId,
        result: "failed",
        error_code: "save_failed"
      });
    }
  }

function toggleActiveStack(stackKey) {
  setActiveStacksOpen(current => {
    const nextOpen = toggleStackOpenState(
  current,
  stackKey
);

    saveIxiMachinePatch({
      userId: ixiUserId,
      listingId: IXI_WORKSPACE_LAYOUT_ID,
      patch: {
        machineContainers,
        activeStackLayouts,
        activeStacksOpen: nextOpen,
        updatedAt: Date.now()
      }
    });

    return nextOpen;
  });
}
  
function toggleActiveStackLayout(stackKey) {
  if (blockMechanicalMutation()) return;

  setActiveStackLayouts(current => {
    const nextLayouts = toggleStackLayoutState(
  current,
  stackKey
);

    saveIxiMachinePatch({
      userId: ixiUserId,
      listingId: IXI_WORKSPACE_LAYOUT_ID,
      patch: {
        machineContainers,
        activeStackLayouts: nextLayouts,
        activeStacksOpen,
        updatedAt: Date.now()
      }
    });

    return nextLayouts;
  });
}

function moveActiveStackToContainer(stackKey, targetContainer) {
  const sourceContainer = getStackContainerKey(stackKey);

  const stackIds = Array.isArray(machineContainers[sourceContainer])
    ? machineContainers[sourceContainer].map(String)
    : [];

  const result = IXI_COMMANDS.bulkMoveObjects({
    objectIds: stackIds,
    targetContainer,
    ixiCardState,
    machineContainers
  });

  const moved = executeIXITransaction(result);

  if (!moved) return;

  setActiveStacksOpen(current => ({
    ...current,
    [stackKey]: false
  }));
}

 function sendActiveStackToTheater(stackKey) {
  if (blockMechanicalMutation()) return;

  const sourceContainer = getStackContainerKey(stackKey);
  const stackIds = machineContainers[sourceContainer] || [];

  console.log("IXI THEATER STACK", {
    stackKey,
    machineIds: stackIds
  });
} 
  
function addListingToActiveStack(stackKey, listingId) {
  if (!listingId) return;
  if (blockMechanicalMutation()) return;

 const targetContainer = getStackContainerKey(stackKey);

 setActiveStacksOpen(current =>
  openStackState(current, stackKey)
);

  moveMachineToContainer(
    listingId,
    targetContainer
  );
}
  
function addListingToLeftPocket(listingId) {
  if (!listingId) return;

  moveMachineToContainer(
    listingId,
    "pocketLeft"
  );
}

function movePocketToContainer(pocketKey, targetContainer) {
  const pocketIds = Array.isArray(machineContainers[pocketKey])
    ? machineContainers[pocketKey].map(String)
    : [];

  const result = IXI_COMMANDS.bulkMoveObjects({
    objectIds: pocketIds,
    targetContainer,
    ixiCardState,
    machineContainers
  });

  executeIXITransaction(result);
}

function movePocketToStack(pocketKey, stackKey) {
  if (blockMechanicalMutation()) return;

  const targetContainer = getStackContainerKey(stackKey);

  movePocketToContainer(
    pocketKey,
    targetContainer
  );

 setActiveStacksOpen(current =>
  openStackState(current, stackKey)
);
}

function recallPocketToBoard(pocketKey) {
  movePocketToContainer(
    pocketKey,
    "board"
  );
}

  
function recallPocketMachineToBoard(machineId, pocketKey) {
  if (!machineId || !pocketKey) return;
  if (blockMechanicalMutation()) return;

  setMachineContainers(current => {
    const id = String(machineId);

    const pocketIds = current[pocketKey] || [];
    const boardIds = current.board || [];

        const finalContainers = {
      ...current,
      [pocketKey]: pocketIds.filter(
        item => String(item) !== id
      ),
      board: boardIds.includes(id)
        ? boardIds
        : [...boardIds, id]
    };

    saveWorkspaceLayout(finalContainers);

    return finalContainers;
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

  function saveWorkspaceSettings(patch = {}) {
  const nextSettings = {
    ...workspaceSettings,
    ...patch,
    updatedAt: Date.now()
  };

  // Workspace controls must respond immediately, including during the public
  // identity-loading window. Persistence is added once an IXI identity exists.
  setWorkspaceSettings(nextSettings);

  if (!ixiUserId) {
    return null;
  }

  return saveWorkspaceSettingsRecord({
    saveIxiMachinePatch,
    userId: ixiUserId,
    settings: nextSettings
  });
}

function saveWorkspaceLayout(nextContainers = machineContainers) {
  saveWorkspaceLayoutRecord({
    saveIxiMachinePatch,
    userId: ixiUserId,
    machineContainers: nextContainers,
    activeStackLayouts,
    activeStacksOpen
  });
}
  
function updateCardScaleMode(nextMode) {
  setCardScaleMode(current => {
    if (nextMode === current) {
      return current;
    }

    const next =
      writeSitewideCardScaleMode(nextMode);

    saveIxiMachinePatch({
      userId: ixiUserId,
      listingId: IXI_WORKSPACE_SETTINGS_ID,
      patch: {
        cardScaleMode: next,
        updatedAt: Date.now()
      }
    });

    return next;
  });
}
  
  return (
    <ListingShareProvider>
      <MarketplaceCardIntelligence />
      <Head>
        <title>IXI Marketplace | IronXchange</title>

        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          rel="stylesheet"
        />
      </Head>

            <Navbar />

   
<IXIWorkspaceEngine
  workspaceSettings={workspaceSettings}
  onSaveWorkspaceSettings={saveWorkspaceSettings}
>
 {({
  leftPocketMode,
  setLeftPocketMode,
  rightPocketMode,
  setRightPocketMode,
  leftPocket2Mode,
  setLeftPocket2Mode,
  rightPocket2Mode,
  setRightPocket2Mode,
  armedDestination,
setArmedDestination,
toggleArmedDestination,

railRevealed,
toggleRailRevealed,

searchSurfaceRevealed,
toggleSearchSurfaceRevealed,

parkBrakeOn: workspaceParkBrakeOn,
toggleParkBrake,

cycleActiveStackTarget
}) => {
          const handleWorkspaceDragEnd =
  createWorkspaceDragEndHandler({
    getMachineContainer,
    machineContainers,
    moveMachineWithinContainer,
    moveMachineToContainerAtPosition,
    moveMachineToContainer,
    setActiveStacksOpen,
    setLeftPocketMode,
    setLeftPocket2Mode,
    setRightPocketMode,
    setRightPocket2Mode,
    setActiveDndId,
    clearMachineDragState
  });

  const guardedWorkspaceDragEnd = event => {
    if (blockMechanicalMutation()) {
      setActiveDndId("");
      clearMachineDragState();
      return;
    }

    handleWorkspaceDragEnd(event);
  };

    function sendMachineToArmedDestination(listing) {
  if (!armedDestination) return;
  if (blockMechanicalMutation()) return;

  const id = String(getListingId(listing));

if (armedDestination === "theater") {
  updateIxiCardState(id, {
    theaterNotice: "SENDING TO THEATER..."
  });

  sendMachineToTheater({
    userId: ixiUserId,
    listingId: id,
    receptor: "rail"
  })
    .then(() => {
      updateIxiCardState(id, {
        theaterNotice: "✓ SENT TO THEATER — RAIL"
      });

      setTimeout(() => {
        updateIxiCardState(id, {
          theaterNotice: ""
        });
      }, 1800);
    })
    .catch(err => {
      console.error("BROWSE THEATER SEND FAILED", err);
    });

  return;
}

 if (!DIRECT_CONTAINER_TARGETS.includes(armedDestination)) {
  return;
}

moveMachineToContainer(id, armedDestination);

if (armedDestination === "stackTop") {
  setActiveStacksOpen(current => ({
    ...current,
    top: true
  }));
}

if (armedDestination === "stackBottom") {
  setActiveStacksOpen(current => ({
    ...current,
    bottom: true
  }));
}
}

    return (
  <IXIDragEngine
    cardContext="marketplace"
    listingOrigin="browse"
    sensors={workspaceParkBrakeOn ? [] : sensors}
    workspaceCollisionDetection={workspaceCollisionDetection}
    handleWorkspaceDragStart={handleWorkspaceDragStart}
    handleWorkspaceDragEnd={guardedWorkspaceDragEnd}
    handleWorkspaceDragCancel={handleWorkspaceDragCancel}
    getActiveDndListing={getActiveDndListing}
    activeDndId={activeDndId}
    savedIds={savedIds}
    ixiCardState={ixiCardState}
    cardScaleMode={cardScaleMode}
  >
    <main
      data-marketplace-armed-destination={
        armedDestination || ""
      }
    >
  <section className="saved-environment-shell">
    <IXIEnvironmentRail
  activeEnvironment="IXI MARKETPLACE"
  hasAccount={!!sdk}
  hasRelationship={true}
  hasInventory={!!sdk}
  armedDestination={armedDestination}
  toggleArmedDestination={toggleArmedDestination}
/>
  </section>
      

<IXIChassis>
  <aside className="ixi-command-left">
    <section className="ixi-pocket-row">
 
 <IXIPocketL1
  leftPocketMode={leftPocketMode}
  machineContainers={machineContainers}
  armedDestination={armedDestination}
  WorkspaceDropPad={WorkspaceDropPad}
  movePocketToStack={movePocketToStack}
  recallPocketToBoard={recallPocketToBoard}
  rotatePocket={rotatePocket}
  toggleArmedDestination={toggleArmedDestination}
  pocketThumbSize={pocketThumbSize}
  getListingById={getListingById}
  IXISortableMachineCard={IXISortableMachineCard}
  getIxiColorValue={getIxiColorValue}
  ixiCardState={ixiCardState}
/>

<IXIPocketL2
  leftPocket2Mode={leftPocket2Mode}
  machineContainers={machineContainers}
  armedDestination={armedDestination}
  WorkspaceDropPad={WorkspaceDropPad}
  movePocketToStack={movePocketToStack}
  recallPocketToBoard={recallPocketToBoard}
  rotatePocket={rotatePocket}
  toggleArmedDestination={toggleArmedDestination}
  pocketThumbSize={pocketThumbSize}
  getListingById={getListingById}
  IXISortableMachineCard={IXISortableMachineCard}
  getIxiColorValue={getIxiColorValue}
  ixiCardState={ixiCardState}
/>
</section>
  </aside>

   <div className="ixi-command-center">
  
       <IXIChassisControls
  listings={marketplaceListings}
  searchQuery={searchQuery}
  setSearchQuery={setSearchQuery}
  workspaceFilters={workspaceFilters}
  setWorkspaceFilters={setWorkspaceFilters}
  workspaceFilterErrors={workspaceRangeValidation.errors}
  workspaceFilterErrorMessage={workspaceRangeValidation.message}
  savedBoardMode={savedBoardMode}
  setSavedBoardMode={setSavedBoardMode}
  pocketThumbSize={pocketThumbSize}
  setPocketThumbSize={setPocketThumbSize}
  ixiCardState={ixiCardState}
  ixiColorFilters={ixiColorFilters}
  toggleColorFilter={toggleColorFilter}
  ixiOutlineFilter={ixiOutlineFilter}
  toggleOutlineFilter={toggleOutlineFilter}
  armedDestination={armedDestination}
  toggleArmedDestination={toggleArmedDestination}
  cycleActiveStackTarget={cycleActiveStackTarget}
  railRevealed={railRevealed}
  toggleRailRevealed={toggleRailRevealed}
  searchSurfaceRevealed={searchSurfaceRevealed}
  toggleSearchSurfaceRevealed={toggleSearchSurfaceRevealed}
  parkBrakeOn={workspaceParkBrakeOn}
  toggleParkBrake={toggleParkBrake}
  />
                </div>

  <aside className="ixi-command-right">
  <section className="ixi-pocket-row">
    <IXIPocketR1
  rightPocketMode={rightPocketMode}
  machineContainers={machineContainers}
  armedDestination={armedDestination}
  WorkspaceDropPad={WorkspaceDropPad}
  movePocketToStack={movePocketToStack}
  recallPocketToBoard={recallPocketToBoard}
  rotatePocket={rotatePocket}
  toggleArmedDestination={toggleArmedDestination}
  pocketThumbSize={pocketThumbSize}
  getListingById={getListingById}
  IXISortableMachineCard={IXISortableMachineCard}
  getIxiColorValue={getIxiColorValue}
  ixiCardState={ixiCardState}
/>

<IXIPocketR2
  rightPocket2Mode={rightPocket2Mode}
  machineContainers={machineContainers}
  armedDestination={armedDestination}
  WorkspaceDropPad={WorkspaceDropPad}
  movePocketToStack={movePocketToStack}
  recallPocketToBoard={recallPocketToBoard}
  rotatePocket={rotatePocket}
  toggleArmedDestination={toggleArmedDestination}
  pocketThumbSize={pocketThumbSize}
  getListingById={getListingById}
  IXISortableMachineCard={IXISortableMachineCard}
  getIxiColorValue={getIxiColorValue}
  ixiCardState={ixiCardState}
/>
 </section>
  </aside>
    </IXIChassis>

{workspaceNotice ? (
  <div
    className="workspace-mechanical-notice"
    role="status"
    aria-live="polite"
  >
    {workspaceNotice}
  </div>
) : null}

              
<IXIActiveStackZone
  cardContext="marketplace"
  listingOrigin="browse"
  enableMarketplaceDistribution={true}
  enableMarketplaceIntelligence={true}
  WorkspaceDropZone={WorkspaceDropZone}
  activeStacksOpen={activeStacksOpen}
  activeStackHover={activeStackHover}
  machineContainers={machineContainers}
  armedDestination={armedDestination}
  toggleArmedDestination={toggleArmedDestination}
  toggleActiveStack={toggleActiveStack}
  toggleActiveStackLayout={toggleActiveStackLayout}
  moveActiveStackToContainer={moveActiveStackToContainer}
  sendActiveStackToTheater={sendActiveStackToTheater}
  activeStackSendMenu={activeStackSendMenu}
  setActiveStackSendMenu={setActiveStackSendMenu}
  activeStackLayouts={activeStackLayouts}
  getListingById={getListingById}
  getListingId={getListingId}
  savedIds={savedIds}
  ixiCardState={ixiCardState}
  IXISortableMachineCard={IXISortableMachineCard}
  toggleSave={toggleSave}
  updateIxiCardState={updateIxiCardState}
  cycleMachineFace={cycleMachineFace}
  sendListingToFront={sendListingToFront}
  sendListingToBack={sendListingToBack}
  sendMachineToArmedDestination={sendMachineToArmedDestination}
  cardScaleMode={cardScaleMode}
/>
              
    <IXIBoardSurface
  scaleMode={cardScaleMode}
  centerRows={true}
>
<IXIBoard
  cardContext="marketplace"
  listingOrigin="browse"
  progressiveCardRendering={true}
  enableMarketplaceDistribution={true}
  enableMarketplaceIntelligence={true}
  ConsoleRouterComponent={
    IXIBrowseObjectConsoleRouter
  }
  items={visibleBrowseListings}
  getListingId={getListingId}
  savedIds={savedIds}
  ixiCardState={ixiCardState}
  IXISortableMachineCard={IXISortableMachineCard}
  toggleSave={toggleSave}
  updateIxiCardState={updateIxiCardState}
  cycleMachineFace={cycleMachineFace}
  sendListingToFront={sendListingToFront}
  sendListingToBack={sendListingToBack}
  armedDestination={armedDestination}
  sendMachineToArmedDestination={sendMachineToArmedDestination}
  draggingListingId={draggingListingId}
  ghostListingId={ghostListingId}
  enableCardScaling={true}
  cardScaleMode={cardScaleMode}
    />
        </IXIBoardSurface>

<IXICardScaleControl
  value={cardScaleMode}
  onChange={updateCardScaleMode}
  surfaceLabel="Marketplace"
/>

{inventoryRequestState.status !==
  "ready" ? (
  <section
    className={`inventory-state inventory-state-${inventoryRequestState.status}`}
    role={
      inventoryRequestState.status ===
        "error"
        ? "alert"
        : "status"
    }
    aria-live="polite"
  >
    <strong>
      {inventoryRequestState.status ===
        "loading"
        ? "LOADING MARKETPLACE INVENTORY"
        : inventoryRequestState.status ===
            "retrying"
          ? "RETRYING MARKETPLACE INVENTORY"
          : "MARKETPLACE INVENTORY UNAVAILABLE"}
    </strong>

    {inventoryRequestState.status ===
    "error" ? (
      <>
        <p>
          {inventoryRequestState.error}
        </p>
        <button
          type="button"
          onClick={() =>
            loadBrowseEnvironment({
              retry: true
            })
          }
        >
          RETRY
        </button>
      </>
    ) : (
      <p>
        Connecting to live Marketplace inventory.
      </p>
    )}
  </section>
) : null}

{inventoryRequestState.status === "ready" &&
visibleBrowseListings.length === 0 && (
  <IXIWorkspaceEmptyState
    surface="IXI MARKETPLACE"
    title={
      marketplaceListings.length
        ? hasActiveMarketplaceView
          ? "NO MACHINES MATCH THIS VIEW"
          : "YOUR MARKETPLACE BOARD IS CLEAR"
        : "NO LIVE MACHINES AVAILABLE"
    }
    message={
      marketplaceListings.length
        ? hasActiveMarketplaceView
          ? "Reset the current search and filters to return to the complete marketplace."
          : "Machines placed in stacks or pockets remain exactly where you left them."
        : "New equipment will appear here as soon as it enters the live marketplace."
    }
    actionLabel={
      marketplaceListings.length && hasActiveMarketplaceView
        ? "RESET VIEW"
        : !marketplaceListings.length
          ? "POST A MACHINE"
          : ""
    }
    actionHref={!marketplaceListings.length ? "/post-free" : ""}
    onAction={resetMarketplaceView}
  />
)}
</main>
  </IXIDragEngine>
);
  }}
</IXIWorkspaceEngine>


      <Footer />
                
      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        :global(body) {
          margin: 0;
          font-family: 'Inter Variable', Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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

        .workspace-mechanical-notice {
          position: fixed;
          left: 50%;
          bottom: 28px;
          z-index: 100000;
          transform: translateX(-50%);
          padding: 8px 14px;
          border: 1px solid rgba(229, 62, 62, .55);
          border-radius: 5px;
          background: rgba(16, 8, 8, .94);
          color: rgba(255, 122, 122, .96);
          box-shadow: 0 10px 28px rgba(0, 0, 0, .42);
          font-size: 10px;
          font-weight: 950;
          letter-spacing: .7px;
          pointer-events: none;
        }

        .inventory-state {
          width: min(100%, 760px);
          margin: 28px auto;
          padding: 22px 24px;
          border: 1px solid
            rgba(255, 196, 0, .32);
          border-radius: 10px;
          background:
            rgba(12, 12, 12, .96);
          text-align: center;
          box-shadow:
            0 16px 48px
            rgba(0, 0, 0, .28);
        }

        .inventory-state strong {
          display: block;
          color: #ffc400;
          font-size: 13px;
          letter-spacing: .1em;
        }

        .inventory-state p {
          margin: 10px 0 0;
          color: #bdbdbd;
          font-size: 12px;
        }

        .inventory-state button {
          min-width: 118px;
          min-height: 40px;
          margin-top: 16px;
          border: 1px solid #ffc400;
          border-radius: 7px;
          background: #ffc400;
          color: #111;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .08em;
          cursor: pointer;
        }

        .inventory-state-error {
          border-color:
            rgba(255, 93, 93, .58);
        }

       .saved-environment-shell {
  width: 100%;
  margin: 0 auto;
}



@media (max-width: 850px) {
  main {
    padding: 18px 4% 48px;
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

}
       
      `}</style>
    </ListingShareProvider>
  );
}
