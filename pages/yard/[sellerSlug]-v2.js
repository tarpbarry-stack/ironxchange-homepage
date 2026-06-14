import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

import {
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
  pointerWithin
} from "@dnd-kit/core";

import {
  useSortable,
  sortableKeyboardCoordinates
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import SellerLogoDecal from "../../components/SellerLogoDecal";

import IXIDragEngine from "../../components/ixi-chassis/IXIDragEngine";
import IXIEnvironmentRail from "../../components/IXIEnvironmentRail";
import IXIActiveStack from "../../components/ixi-chassis/IXIActiveStack";
import IXIBoard from "../../components/ixi-chassis/IXIBoard";
import IXIChassisControls from "../../components/ixi-chassis/IXIChassisControls";
import IXIPocketL1 from "../../components/ixi-chassis/IXIPocketL1";
import IXIPocketL2 from "../../components/ixi-chassis/IXIPocketL2";
import IXIPocketR1 from "../../components/ixi-chassis/IXIPocketR1";
import IXIPocketR2 from "../../components/ixi-chassis/IXIPocketR2";
import IXIChassis from "../../components/ixi-chassis/IXIChassis";
import IXIWorkspaceEngine from "../../components/ixi-chassis/IXIWorkspaceEngine";

import { getListingId } from "../../lib/listingFormatters";
import {
  fetchIxiMachineState,
  saveIxiMachinePatch
} from "../../lib/ixiMachineStateClient";

import {
  fetchCurrentUserWithSavedListings,
  getSavedListingIdsFromUser,
  toggleSavedListing
} from "../../lib/savedListings";

function WorkspaceDropZone({ id, className, children, ...props }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <section ref={setNodeRef} className={className} {...props}>
      {children}
    </section>
  );
}

function WorkspaceDropPad({ id, className, style, ...props }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className={className} style={style} {...props} />
  );
}

function IXISortableMachineCard({
  id,
  containerId,
  className,
  style: externalStyle,
  children
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: String(id),
    data: {
      type: "machine",
      containerId
    }
  });

  const style = {
    ...(externalStyle || {}),
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 9999 : externalStyle?.zIndex
  };

  return (
    <div
      ref={setNodeRef}
      className={className}
      style={style}
      data-ixi-sortable-card={String(id)}
      data-ixi-container={containerId}
    >
      {children({
        dragHandleProps: {
          ref: setActivatorNodeRef,
          ...attributes,
          ...listeners
        },
        isDragging
      })}
    </div>
  );
}

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function clean(value) {
  return value ? String(value).trim() : "";
}

function isInitials(value = "") {
  const v = clean(value);
  return /^[A-Z]{1,4}$/.test(v);
}

function normalizeUrl(url = "") {
  const value = clean(url);
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

function getAuthorId(item) {
  const safeItem = item || {};

  return (
    safeItem.authorId ||
    safeItem.sellerId ||
    safeItem.author?.id?.uuid ||
    safeItem.author?.id ||
    ""
  );
}

function getSellerDisplay(item = {}) {
  const sellerName = clean(item.sellerName);
  const sellerCompany = clean(item.sellerCompany);
  const companyName = clean(item.companyName);
  const authorName = clean(item.authorName);

  const realCompany =
    [sellerCompany, companyName, sellerName, authorName]
      .find(value => value && !isInitials(value) && value !== "Seller Profile") ||
    sellerName ||
    sellerCompany ||
    companyName ||
    authorName ||
    "IronXchange Yard";

  const contactName =
    [sellerName, authorName, sellerCompany, companyName]
      .find(value => value && value !== realCompany) ||
    "";

  return {
    yardTitle: realCompany,
    contactName,
    sellerName,
    sellerCompany,
    companyName,
    authorName
  };
}

export default function SellerYardV2Page() {
  const router = useRouter();
  const { sellerSlug } = router.query;

  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);

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

  const [activeStackSendMenu, setActiveStackSendMenu] = useState("");
  const [activeStackHover, setActiveStackHover] = useState("");

  const [ixiCardState, setIxiCardState] = useState({});
  const [ixiUserId, setIxiUserId] = useState("guest");
  const [ixiColorFilters, setIxiColorFilters] = useState([]);
  const [ixiOutlineFilter, setIxiOutlineFilter] = useState("all");

  const [pocketThumbSize, setPocketThumbSize] = useState("medium");
  const [activeDndId, setActiveDndId] = useState("");

  const POCKET_TARGETS = [
    "pocketLeft",
    "pocketLeft2",
    "pocketRight",
    "pocketRight2"
  ];

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

  function workspaceCollisionDetection(args) {
    const pointerHits = pointerWithin(args);

    if (pointerHits.length) {
      return pointerHits;
    }

    return closestCenter(args);
  }

  function handleWorkspaceDragStart(event) {
    const dragId = String(event?.active?.id || "");

    if (!dragId) return;

    setActiveDndId(dragId);
  }

  function handleWorkspaceDragCancel() {
    setActiveDndId("");
    clearMachineDragState();
  }

  function handleWorkspaceDragEnd(event) {
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
      (knownContainers.includes(overId) ? overId : getMachineContainer(overId));

    console.log("IXI SELLER YARD V2 DND DROP", {
      dragId,
      overId,
      sourceContainer,
      targetContainer,
      activeData: event?.active?.data?.current,
      overData: event?.over?.data?.current
    });

    if (!dragId || !overId) {
      setActiveDndId("");
      clearMachineDragState();
      return;
    }

    if (
      sourceContainer &&
      targetContainer &&
      sourceContainer === targetContainer &&
      dragId !== overId
    ) {
      const ids = machineContainers[sourceContainer] || [];

      const fromIndex = ids.findIndex(
        item => String(item) === String(dragId)
      );

      const toIndex = ids.findIndex(
        item => String(item) === String(overId)
      );

      const insertAfter = fromIndex < toIndex;

      moveMachineWithinContainer(
        sourceContainer,
        dragId,
        overId,
        insertAfter
      );

      setActiveDndId("");
      clearMachineDragState();
      return;
    }

    if (
      targetContainer &&
      targetContainer !== sourceContainer &&
      ["board", "stackTop", "stackBottom", "pocketLeft", "pocketRight", "pocketLeft2", "pocketRight2"].includes(targetContainer)
    ) {
      moveMachineToContainer(dragId, targetContainer);

      if (targetContainer === "stackTop") {
        setActiveStacksOpen(current => ({ ...current, top: true }));
      }

      if (targetContainer === "stackBottom") {
        setActiveStacksOpen(current => ({ ...current, bottom: true }));
      }

      if (targetContainer === "pocketLeft") setLeftPocketMode("peek");
      if (targetContainer === "pocketLeft2") setLeftPocket2Mode("peek");
      if (targetContainer === "pocketRight") setRightPocketMode("peek");
      if (targetContainer === "pocketRight2") setRightPocket2Mode("peek");

      setActiveDndId("");
      clearMachineDragState();
      return;
    }

    setActiveDndId("");
    clearMachineDragState();
  }

  useEffect(() => {
    async function loadSellerYardV2() {
      try {
        const listingsRes = await fetch("/api/listings");
        const listingsData = await listingsRes.json();

        if (Array.isArray(listingsData)) {
          setListings(listingsData);
        }

        const SharetribeSdk = await import("sharetribe-flex-sdk");

        const sdkInstance = SharetribeSdk.createInstance({
          clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
        });

        setSdk(sdkInstance);

        try {
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

          setLoggedIn(true);
        } catch {
          setIxiUserId("guest");
          setSavedIds([]);
          setLoggedIn(false);
        }
      } catch (err) {
        console.error("Seller Yard V2 load failed:", err);
        setListings([]);
        setSavedIds([]);
      } finally {
        setLoading(false);
      }
    }

    loadSellerYardV2();
  }, []);

  const sellerSeedListing = useMemo(() => {
    if (!sellerSlug || listings.length === 0) return null;

    const targetSlug = String(sellerSlug)
      .replace(/-v2$/i, "")
      .toLowerCase();

    return listings.find(item => {
      const display = getSellerDisplay(item);

      const possibleValues = [
        getAuthorId(item),
        display.yardTitle,
        display.sellerName,
        display.sellerCompany,
        display.companyName,
        display.authorName
      ]
        .filter(Boolean)
        .map(value => slugify(String(value)));

      return possibleValues.includes(targetSlug);
    });
  }, [sellerSlug, listings]);

  const sellerAuthorId = sellerSeedListing
    ? getAuthorId(sellerSeedListing)
    : "";

  const sellerListings = useMemo(() => {
    if (!sellerAuthorId) return [];

    return listings.filter(item => {
      const listingStatus =
        item.listingStatus ||
        item.publicData?.listingStatus ||
        item.attributes?.publicData?.listingStatus ||
        "live";

      return (
        String(getAuthorId(item)) === String(sellerAuthorId) &&
        listingStatus !== "archived" &&
        listingStatus !== "deleted"
      );
    });
  }, [listings, sellerAuthorId]);

  const sellerDisplay = getSellerDisplay(sellerSeedListing || {});
  const yardTitle = sellerDisplay.yardTitle;

  const sellerName =
    sellerDisplay.contactName &&
    !isInitials(sellerDisplay.contactName)
      ? sellerDisplay.contactName
      : "";

  const sellerLocation =
    clean(sellerSeedListing?.sellerLocation) ||
    clean(sellerSeedListing?.location) ||
    "Location not listed";

  const sellerLogo =
    sellerSeedListing?.sellerLogo ||
    sellerSeedListing?.profileImage ||
    "";

  const website = normalizeUrl(sellerSeedListing?.sellerWebsite || "");
  const facebook = normalizeUrl(sellerSeedListing?.sellerFacebook || "");
  const instagram = normalizeUrl(sellerSeedListing?.sellerInstagram || "");
  const linkedin = normalizeUrl(sellerSeedListing?.sellerLinkedin || "");
  const youtube = normalizeUrl(sellerSeedListing?.sellerYoutube || "");
  const tiktok = normalizeUrl(sellerSeedListing?.sellerTiktok || "");

  useEffect(() => {
    if (!sellerListings.length) return;

    const nextContainers = {
      board: [],
      stackTop: [],
      stackBottom: [],
      pocketLeft: [],
      pocketRight: [],
      pocketLeft2: [],
      pocketRight2: []
    };

    sellerListings.forEach(item => {
      const id = String(getListingId(item));
      const savedContainer = ixiCardState[id]?.container;

      const targetContainer =
        nextContainers[savedContainer]
          ? savedContainer
          : "board";

      nextContainers[targetContainer].push(id);
    });

    setMachineContainers(nextContainers);
  }, [sellerListings, ixiCardState]);

  const visibleSellerYardListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const source =
      savedBoardMode === "custom" && savedBoardListings.length
        ? savedBoardListings
        : sellerListings;

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

    return [...filtered].sort((a, b) => {
      const priceA = Number(String(a.price || a.publicData?.price || "").replace(/[^0-9]/g, ""));
      const priceB = Number(String(b.price || b.publicData?.price || "").replace(/[^0-9]/g, ""));

      const hoursA = Number(String(a.hours || a.publicData?.hours || "").replace(/[^0-9]/g, ""));
      const hoursB = Number(String(b.hours || b.publicData?.hours || "").replace(/[^0-9]/g, ""));

      const yearA = Number(a.year || a.publicData?.year || 0);
      const yearB = Number(b.year || b.publicData?.year || 0);

      if (savedBoardMode === "price-low") return priceA - priceB;
      if (savedBoardMode === "price-high") return priceB - priceA;
      if (savedBoardMode === "hours-low") return hoursA - hoursB;
      if (savedBoardMode === "hours-high") return hoursB - hoursA;
      if (savedBoardMode === "year-new") return yearB - yearA;
      if (savedBoardMode === "year-old") return yearA - yearB;

      return 0;
    });
  }, [
    searchQuery,
    savedBoardMode,
    savedBoardListings,
    sellerListings,
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

      const isPocket = [
        "pocketLeft",
        "pocketRight",
        "pocketLeft2",
        "pocketRight2"
      ].includes(targetContainer);

      next[targetContainer] = isPocket
        ? [
            id,
            ...(next[targetContainer] || [])
          ]
        : [
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

  function getActiveDndListing() {
    if (!activeDndId) return null;

    return getListingById(activeDndId);
  }

  function moveListingToSlot(dragId, targetId) {
    if (!dragId || !targetId || dragId === targetId) return;

    setSavedBoardMode("custom");

    setSavedBoardListings(current => {
      const source = current.length
        ? current
        : sellerListings;

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
    const listingId = String(getListingId(listing));

    setMachineContainers(current => {
      const boardIds = current.board || [];

      if (!boardIds.includes(listingId)) {
        return current;
      }

      return {
        ...current,
        board: [
          listingId,
          ...boardIds.filter(id => String(id) !== listingId)
        ]
      };
    });
  }

  function sendListingToBack(listing) {
    const listingId = String(getListingId(listing));

    setMachineContainers(current => {
      const boardIds = current.board || [];

      if (!boardIds.includes(listingId)) {
        return current;
      }

      return {
        ...current,
        board: [
          ...boardIds.filter(id => String(id) !== listingId),
          listingId
        ]
      };
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
    return null;
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

  if (loading) {
    return (
      <main className="loading">
        Loading yard...
        <style jsx>{`
          .loading {
            min-height: 100vh;
            background: #0b0b0b;
            color: #d6d6d6;
            padding: 40px;
            font-family: Arial, sans-serif;
          }
        `}</style>
      </main>
    );
  }

  if (!sellerSeedListing) {
    return (
      <main className="loading">
        <div className="not-found-card">
          <img
            src="/images/ironxchange-logo.png"
            alt="IronXchange"
            className="not-found-logo"
          />

          <h1>Seller Yard Not Found</h1>

          <p>
            This seller yard may have moved, been removed, or does not have active listings.
          </p>

          <div className="not-found-actions">
            <a href="/browse">Browse Equipment</a>
            <a href="/">Back to IronXchange</a>
          </div>
        </div>

        <style jsx>{`
          .loading {
            min-height: 100vh;
            background: #0b0b0b;
            color: #d6d6d6;
            padding: 40px;
            font-family: Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .not-found-card {
            width: 100%;
            max-width: 520px;
            background: #151515;
            border: 1px solid #282828;
            border-radius: 16px;
            padding: 34px;
            text-align: center;
          }

          .not-found-logo {
            height: 42px;
            width: auto;
            margin-bottom: 24px;
          }

          h1 {
            margin: 0;
            color: #f2f2f2;
            font-size: 22px;
            text-transform: uppercase;
            letter-spacing: .4px;
          }

          p {
            margin: 12px 0 0;
            color: #999;
            font-size: 14px;
            line-height: 1.55;
          }

          .not-found-actions {
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 24px;
          }

          .not-found-actions a {
            height: 36px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0 14px;
            background: #101010;
            border: 1px solid #2a2a2a;
            border-radius: 8px;
            color: #eaeaea;
            text-decoration: none;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: .45px;
            text-transform: uppercase;
          }

          .not-found-actions a:first-child {
            background: #1a1400;
            border-color: #3a2d00;
            color: #ffc400;
          }

          .not-found-actions a:hover {
            border-color: #ffc400;
            color: #ffc400;
          }
        `}</style>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>{yardTitle} Yard | IronXchange</title>
        <meta
          name="description"
          content={`${yardTitle} equipment yard on IronXchange.`}
        />

        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          rel="stylesheet"
        />
      </Head>

      <Navbar />

      <IXIDragEngine
        sensors={sensors}
        workspaceCollisionDetection={workspaceCollisionDetection}
        handleWorkspaceDragStart={handleWorkspaceDragStart}
        handleWorkspaceDragEnd={handleWorkspaceDragEnd}
        handleWorkspaceDragCancel={handleWorkspaceDragCancel}
        getActiveDndListing={getActiveDndListing}
        activeDndId={activeDndId}
        savedIds={savedIds}
        ixiCardState={ixiCardState}
      >
        <IXIWorkspaceEngine>
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
            toggleArmedDestination
          }) => {
            function sendMachineToArmedDestination(listing) {
              if (!armedDestination) return;
              if (!POCKET_TARGETS.includes(armedDestination)) return;

              const id = String(getListingId(listing));
              moveMachineToContainer(id, armedDestination);
            }

            return (
              <main>
                <section className="yard-shell">
                  <section className="yard-head">
                    <div className="yard-identity">
                      <SellerLogoDecal
                        logo={sellerLogo}
                        name={yardTitle}
                        variant="slug"
                      />

                      <div className="yard-copy">
                        <span className="eyebrow">IronXchange Yard</span>
                        <h1>{yardTitle}</h1>

                        <p>
                          {sellerLocation}
                          {sellerName ? ` · ${sellerName}` : ""}
                        </p>

                        <div className="yard-actions">
                          {website ? (
                            <a href={website} target="_blank" rel="noreferrer" aria-label="Website">
                              <i className="fa-solid fa-globe"></i>
                            </a>
                          ) : null}

                          {facebook ? (
                            <a href={facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
                              <i className="fa-brands fa-facebook-f"></i>
                            </a>
                          ) : null}

                          {instagram ? (
                            <a href={instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                              <i className="fa-brands fa-instagram"></i>
                            </a>
                          ) : null}

                          {linkedin ? (
                            <a href={linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                              <i className="fa-brands fa-linkedin-in"></i>
                            </a>
                          ) : null}

                          {youtube ? (
                            <a href={youtube} target="_blank" rel="noreferrer" aria-label="YouTube">
                              <i className="fa-brands fa-youtube"></i>
                            </a>
                          ) : null}

                          {tiktok ? (
                            <a href={tiktok} target="_blank" rel="noreferrer" aria-label="TikTok">
                              <i className="fa-brands fa-tiktok"></i>
                            </a>
                          ) : null}

                          <a
                            href={
                              loggedIn
                                ? `/inquire?listingId=${sellerListings?.[0]?.id || ""}`
                                : `/login`
                            }
                            className="contact-btn"
                          >
                            Message
                          </a>

                          {sellerSeedListing?.sellerPhone ? (
                            <a
                              href={`tel:${sellerSeedListing.sellerPhone}`}
                              className="contact-btn"
                            >
                              Call
                            </a>
                          ) : null}

                          <a
                            href="#"
                            onClick={e => {
                              e.preventDefault();
                              window.history.back();
                            }}
                            className="browse-all-link"
                          >
                            Back to Machine
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="yard-count">
                      <strong>{sellerListings.length}</strong>
                      <span>Active Machines</span>
                    </div>
                  </section>


                  <section className="saved-environment-shell">
                    <IXIEnvironmentRail
                      activeEnvironment="IXI SELLER YARD"
                      hasAccount={!!sdk}
                      hasRelationship={true}
                      hasInventory={false}
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
                        listings={sellerListings}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        workspaceFilters={workspaceFilters}
                        setWorkspaceFilters={setWorkspaceFilters}
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
                      >
                        <button
                          type="button"
                          className="active-stack-dash"
                          onClick={() => toggleActiveStack(stackKey)}
                        />

                        {activeStacksOpen[stackKey] && (
                          <section
                            className={`active-stack-tray ${
                              activeStackHover === stackKey ? "stack-armed" : ""
                            }`}
                          >
                            <div className="active-stack-pocket-corners">
                              <button
                                type="button"
                                className={`stack-pocket-power top-left ${
                                  armedDestination === "pocketLeft"
                                    ? "destination-armed"
                                    : ""
                                }`}
                                data-label="L1"
                                title="Arm L1"
                                onClick={() =>
                                  toggleArmedDestination("pocketLeft")
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
                                onClick={() =>
                                  setActiveStackSendMenu(current =>
                                    current === stackKey ? "" : stackKey
                                  )
                                }
                              />
                            </div>

                            {activeStackSendMenu === stackKey && (
                              <div className="active-stack-send-menu">
                                <button
                                  type="button"
                                  className={`stack-pocket-power top-left ${
                                    armedDestination === "pocketLeft"
                                      ? "destination-armed"
                                      : ""
                                  }`}
                                  data-label="L1"
                                  title="Arm L1"
                                  onClick={() => {
                                    toggleArmedDestination("pocketLeft");
                                  }}
                                />

                                <button
                                  type="button"
                                  className="stack-send-option"
                                  data-label="L2"
                                  onClick={() =>
                                    moveActiveStackToContainer(
                                      stackKey,
                                      "pocketLeft2"
                                    )
                                  }
                                />

                                <button
                                  type="button"
                                  className="stack-send-option"
                                  data-label="BOARD"
                                  onClick={() =>
                                    moveActiveStackToContainer(
                                      stackKey,
                                      "board"
                                    )
                                  }
                                />

                                <button
                                  type="button"
                                  className="stack-send-option"
                                  data-label="R1"
                                  onClick={() =>
                                    moveActiveStackToContainer(
                                      stackKey,
                                      "pocketRight"
                                    )
                                  }
                                />

                                <button
                                  type="button"
                                  className="stack-send-option"
                                  data-label="R2"
                                  onClick={() =>
                                    moveActiveStackToContainer(
                                      stackKey,
                                      "pocketRight2"
                                    )
                                  }
                                />
                              </div>
                            )}

                            <div
                              className={`active-stack-dropzone ${
                                activeStackLayouts[stackKey] === "vertical"
                                  ? "stack-vertical"
                                  : "stack-horizontal"
                              }`}
                            >
                              <IXIActiveStack
                                stackKey={stackKey}
                                machineIds={
                                  machineContainers[
                                    stackKey === "top" ? "stackTop" : "stackBottom"
                                  ] || []
                                }
                                getListingById={getListingById}
                                getListingId={getListingId}
                                savedIds={savedIds}
                                ixiCardState={ixiCardState}
                                activeStackLayouts={activeStackLayouts}
                                IXISortableMachineCard={IXISortableMachineCard}
                                toggleSave={toggleSave}
                                updateIxiCardState={updateIxiCardState}
                                sendListingToFront={sendListingToFront}
                                sendListingToBack={sendListingToBack}
                                armedDestination={armedDestination}
                                sendMachineToArmedDestination={sendMachineToArmedDestination}
                              />
                            </div>
                          </section>
                        )}
                      </WorkspaceDropZone>
                    ))}
                  </section>

                  <section
                    data-board-target="board"
                    className={`cards ${
                      visibleSellerYardListings.length === 1 ? "single-card" : ""
                    }`}
                  >
                    <IXIBoard
                      items={visibleSellerYardListings}
                      getListingId={getListingId}
                      savedIds={savedIds}
                      ixiCardState={ixiCardState}
                      IXISortableMachineCard={IXISortableMachineCard}
                      toggleSave={toggleSave}
                      updateIxiCardState={updateIxiCardState}
                      sendListingToFront={sendListingToFront}
                      sendListingToBack={sendListingToBack}
                      armedDestination={armedDestination}
                      sendMachineToArmedDestination={sendMachineToArmedDestination}
                      draggingListingId={draggingListingId}
                      ghostListingId={ghostListingId}
                    />
                  </section>

                  {visibleSellerYardListings.length === 0 ? (
                    <div className="empty">
                      <h3>No machines found.</h3>
                      <p>Try another search or filter inside this yard.</p>
                    </div>
                  ) : null}
                </section>
              </main>
            );
          }}
        </IXIWorkspaceEngine>
      </IXIDragEngine>

      <Footer />

      <style jsx>{`
        :global(html),
        :global(body) {
          margin: 0;
          min-height: 100%;
          overflow-x: hidden;
          background: #0b0b0b;
          color: #d6d6d6;
          font-family: Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          text-rendering: geometricPrecision;
        }

        * {
          box-sizing: border-box;
        }

        main {
          min-height: 100vh;
          background:
            radial-gradient(circle at top center, rgba(255,196,0,.035), transparent 30%),
            radial-gradient(circle at 18% 12%, rgba(255,255,255,.018), transparent 22%),
            #0b0b0b;
        }

        .yard-shell {
          max-width: 1920px;
          margin: 0 auto;
          padding: 18px 3% 58px;
        }

        .yard-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;

          margin-bottom: 10px;
          padding: 16px 18px;

          background:
            linear-gradient(180deg, rgba(255,255,255,.028), rgba(255,255,255,0)),
            radial-gradient(circle at top, rgba(255,255,255,.014), transparent 72%),
            #111111;

          border: 1px solid rgba(255,255,255,.065);
          outline: 1px solid rgba(255,255,255,.018);
          border-radius: 14px;

          box-shadow:
            0 1px 0 rgba(255,255,255,.032) inset,
            0 16px 38px rgba(0,0,0,.22);
        }

        .yard-identity {
          display: flex;
          align-items: center;
          gap: 18px;
          min-width: 0;
        }

        .yard-copy {
          min-width: 0;
        }

        .eyebrow {
          display: block;
          margin-bottom: 6px;

          color: #FFC400;

          font-size: 9px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: .72px;
        }

        h1 {
          margin: 0;

          color: #f2f2f2;

          font-size: 26px;
          font-weight: 950;
          line-height: 1.02;
          letter-spacing: -.55px;
          text-transform: uppercase;
        }

        .yard-head p {
          margin: 6px 0 0;

          color: rgba(255,255,255,.42);

          font-size: 12px;
          font-weight: 800;
          letter-spacing: .18px;
        }

        .yard-actions {
          margin-top: 11px;

          display: flex;
          gap: 7px;
          flex-wrap: wrap;
        }

        .yard-actions a {
          width: 31px;
          height: 31px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          background:
            linear-gradient(180deg, rgba(255,255,255,.014), rgba(255,255,255,0)),
            #101010;

          border: 1px solid rgba(255,255,255,.075);
          border-radius: 9px;

          color: rgba(255,255,255,.44);
          text-decoration: none;

          font-size: 13px;

          box-shadow:
            0 1px 0 rgba(255,255,255,.022) inset;

          transition:
            color .14s ease,
            border-color .14s ease,
            background .14s ease,
            transform .14s ease,
            text-shadow .14s ease;
        }

        .yard-actions a:hover {
          transform: translateY(-1px);

          border-color: rgba(255,196,0,.32);
          color: #FFC400;

          background:
            linear-gradient(180deg, rgba(255,196,0,.045), rgba(255,196,0,0)),
            #151515;

          text-shadow: 0 0 14px rgba(255,196,0,.16);
        }

        .yard-actions a[aria-label="Facebook"]:hover {
          color: #1877F2;
          border-color: rgba(24,119,242,.42);
          text-shadow: 0 0 14px rgba(24,119,242,.28);
        }

        .yard-actions a[aria-label="Instagram"]:hover {
          color: #ff4fd8;
          border-color: rgba(255,79,216,.36);
          text-shadow: 0 0 14px rgba(255,79,216,.24);
        }

        .yard-actions a[aria-label="LinkedIn"]:hover {
          color: #f2f2f2;
          border-color: rgba(255,255,255,.25);
          text-shadow: 0 0 14px rgba(255,255,255,.18);
        }

        .yard-actions a[aria-label="YouTube"]:hover {
          color: #FF0000;
          border-color: rgba(255,0,0,.38);
          text-shadow: 0 0 14px rgba(255,0,0,.24);
        }

        .yard-actions a[aria-label="TikTok"]:hover {
          color: #b86cff;
          border-color: rgba(184,108,255,.38);
          text-shadow: 0 0 14px rgba(184,108,255,.26);
        }

        .yard-actions .browse-all-link,
        .contact-btn {
          width: auto !important;
          height: 31px;

          padding: 0 12px;

          background:
            linear-gradient(180deg, rgba(255,196,0,.075), rgba(255,196,0,0)),
            #151515 !important;

          border: 1px solid rgba(255,196,0,.24) !important;
          border-radius: 9px;

          color: #FFC400 !important;

          font-size: 9px !important;
          font-weight: 950;
          letter-spacing: .55px;
          text-transform: uppercase;
        }

        .yard-actions .browse-all-link:hover,
        .contact-btn:hover {
          background:
            linear-gradient(180deg, rgba(255,196,0,.14), rgba(255,196,0,0)),
            #1a1400 !important;

          border-color: rgba(255,196,0,.58) !important;
        }

        .yard-count {
          min-width: 118px;

          padding: 13px 12px;

          text-align: center;

          background:
            linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
            #101010;

          border: 1px solid rgba(255,255,255,.06);
          border-radius: 12px;

          box-shadow:
            0 1px 0 rgba(255,255,255,.025) inset;
        }

        .yard-count strong {
          display: block;

          color: #f2f2f2;

          font-size: 26px;
          font-weight: 950;
          line-height: 1;
        }

        .yard-count span {
          display: block;

          margin-top: 6px;

          color: rgba(255,255,255,.36);

          font-size: 8.75px;
          font-weight: 950;

          text-transform: uppercase;
          letter-spacing: .52px;
        }

        .saved-environment-shell {
          width: 100%;
          margin: 0 auto;
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

        :global(.ixi-board-sortable-card) {
          width: 100%;
          max-width: 300px;
          min-width: 250px;

          justify-self: center;
          align-self: start;

          touch-action: none;
        }

        :global(.ixi-board-sortable-card > *) {
          width: 100%;
        }

        :global(.ixi-drag-overlay-card) {
          width: 300px;
          max-width: 300px;
          pointer-events: none;
          z-index: 999999;
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
          .yard-head {
            display: grid;
            align-items: stretch;
          }

          .yard-identity {
            align-items: flex-start;
          }

          .yard-count {
            width: 100%;
          }

          main {
            padding: 18px 4% 48px;
          }

          .cards {
            grid-template-columns: 1fr;
            gap: 18px;
          }

          .cards.single-card {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .yard-shell {
            padding: 16px 4% 50px;
          }

          .yard-head {
            padding: 16px;
          }

          .yard-identity {
            display: grid;
            gap: 10px;
          }

          h1 {
            font-size: 25px;
          }

          .yard-actions {
            gap: 6px;
          }
        }
      `}</style>
    </>
  );
}




