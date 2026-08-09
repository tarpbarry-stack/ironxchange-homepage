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

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

import IXIAosScoreboard
  from "../../components/ixi-mos/IXIAosScoreboard";

import IXIPocketStationStyles
  from "../../components/ixi-chassis/IXIPocketStationStyles";

import {
  loadIXIMosEnvironment
} from "../../lib/mos/loadIXIMosEnvironment";

import ListingCard from "../../components/ListingCard";

import IXISystemIndexCard
  from "../../components/ixi-mos/IXISystemIndexCard";

import useIXIMosObjectCreation
  from "../../components/ixi-mos/object-creation/useIXIMosObjectCreation";

import useIXIAosWorkspaceRegistry
  from "../../components/ixi-mos/workspace/useIXIAosWorkspaceRegistry";

import useIXIEquipmentWorkspace
  from "../../components/ixi-mos/equipment/useIXIEquipmentWorkspace";

import IXIAosWorkspaceBoard
  from "../../components/ixi-mos/workspace/IXIAosWorkspaceBoard";

import { getListingId } from "../../lib/listingFormatters";
import {
  fetchIxiMachineState,
  saveIxiMachinePatch,
} from "../../lib/ixiMachineStateClient";

import {
  hydrateIXIListingCollection
} from "../../lib/listings/hydrateIXIListingMedia";

import { captureIXEvent } from "../../lib/posthog";

import IXIDragEngine from "../../components/ixi-chassis/IXIDragEngine";
import IXIEnvironmentRail from "../../components/IXIEnvironmentRail";
import IXIChassisControls from "../../components/ixi-chassis/IXIChassisControls";
import IXIPocketL1 from "../../components/ixi-chassis/IXIPocketL1";
import IXIPocketL2 from "../../components/ixi-chassis/IXIPocketL2";
import IXIPocketR1 from "../../components/ixi-chassis/IXIPocketR1";
import IXIPocketR2 from "../../components/ixi-chassis/IXIPocketR2";
import IXIChassis from "../../components/ixi-chassis/IXIChassis";
import IXIWorkspaceEngine from "../../components/ixi-chassis/IXIWorkspaceEngine";
import { getIXICardScalePreset } from "../../lib/ixiCardScalePresets";
import IXISortableMachineCard from "../../components/ixi-chassis/IXISortableMachineCard";
import WorkspaceDropZone from "../../components/ixi-chassis/WorkspaceDropZone";
import WorkspaceDropPad from "../../components/ixi-chassis/WorkspaceDropPad";
import useIXISellerMachineOps from "../../components/ixi-chassis/useIXISellerMachineOps";

import {
  createEmptyWorkspaceContainers,
  sanitizeWorkspaceContainers
} from "../../components/ixi-chassis/IXIWorkspacePersistenceEngine";

const IXI_AOS_WORK_SETTINGS_ID =
  "__ixi_aos_work_settings__";

const IXI_AOS_WORK_LAYOUT_ID =
  "__ixi_aos_work_layout__";

const IXI_EQUIPMENT_INDEX_OBJECT_ID =
  "system-index:equipment";

import {
  getMachineContainerFromContainers,
  reorderMachineWithinContainerState,
  moveMachineToContainerAtPositionState,
  moveMachineToContainerState
} from "../../components/ixi-chassis/IXIMachineContainerEngine";

import {
  createEmptyWorkspacePlacements,
  sanitizeWorkspacePlacements,
  getObjectWorkspaceSurface,
  moveObjectToWorkspaceSurface,
  moveObjectToWorkspacePosition,
  reorderObjectWithinWorkspaceSurface,
  resolveWorkspaceObjects,
  validateWorkspacePlacements
} from "../../components/ixi-chassis/IXIWorkspacePlacementEngine";

import {
  rotatePocketState,
  movePocketToContainerState
} from "../../components/ixi-chassis/IXIPocketEngine";

import {
  getNextCardScaleMode
} from "../../components/ixi-chassis/IXIScaleEngine";

import {
  workspaceCollisionDetection,
  createWorkspaceDragStartHandler,
  createWorkspaceDragCancelHandler,
  createWorkspaceDragEndHandler,
  universalWorkspaceCollisionDetection
} from "../../components/ixi-chassis/IXIDndEngineHelpers";

import {
  fetchCurrentUserWithSavedListings,
  getSavedListingIdsFromUser,
  filterSavedListings,
  toggleSavedListing
} from "../../lib/savedListings";

import {
  IXI_COMMANDS
} from "../../components/ixi-object-system/IXICommandBus";

import {
  setIXIActionNotice
} from "../../components/ixi-object-system/IXIActionNoticeEngine";

export default function IXIAosWorkPage() {
  console.log("IXI AOS WORK PAGE IS RUNNING");
  
  const [listings, setListings] = useState([]);

  const [aosEntity, setAosEntity] =
  useState(null);

const [aosObjects, setAosObjects] =
  useState([]);

const [systemIndexes, setSystemIndexes] =
  useState([]);

const [aosCurrentUser, setAosCurrentUser] =
  useState(null);
  
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

const [
  workspacePlacements,
  setWorkspacePlacements
] = useState(() => ({
  ...createEmptyWorkspacePlacements(),

  /*
   * AOS working deck for Equipment.
   *
   * This is UI placement only.
   * It is NOT canonical Equipment
   * membership.
   */
  indexEquipment: []
}));

/*
 * TEMPORARY COMPATIBILITY BRIDGE
 *
 * Existing chassis helpers still receive
 * machineContainers while we migrate them
 * to universal object terminology.
 *
 * There is ONE state object, not two.
 */
const machineContainers =
  workspacePlacements;

const setMachineContainers =
  setWorkspacePlacements;


const [leftPocketOpen, setLeftPocketOpen] = useState(false);
const [rightPocketOpen, setRightPocketOpen] = useState(false);
  
const [topRailMode, setTopRailMode] = useState("off");

const POCKET_TARGETS = [
  "pocketLeft",
  "pocketLeft2",
  "pocketRight",
  "pocketRight2"
];

  const DIRECT_CONTAINER_TARGETS = [
  ...POCKET_TARGETS
];

  const [ixiCardState, setIxiCardState] = useState({});
  const [ixiUserId, setIxiUserId] = useState("guest");
  const [workspaceSettings, setWorkspaceSettings] =
  useState({});
  const [ixiColorFilters, setIxiColorFilters] = useState([]);
  const [ixiOutlineFilter, setIxiOutlineFilter] = useState("all");

  const [pocketThumbSize, setPocketThumbSize] = useState("medium");

  const [cardScaleMode, setCardScaleMode] = useState("xl");
  const cardScaleMetrics = getIXICardScalePreset(cardScaleMode);

  const hasAppliedRemoteLayoutRef = useRef(false);
  
  const [activeDndId, setActiveDndId] = useState("");
  const {
  getSellerListingCardProps
} = useIXISellerMachineOps({
  setSellerListings: setListings,
  showActionNotice: ({ listingId, message, tone }) =>
    setIXIActionNotice({
      setState: setIxiCardState,
      listingId,
      message,
      tone
    })
});

const handleWorkspaceDragStart =
  createWorkspaceDragStartHandler({
    setActiveDndId
  });

const handleWorkspaceDragCancel =
  createWorkspaceDragCancelHandler({
    setActiveDndId,
    clearMachineDragState
  });

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

const remoteIxiResponse =
  await fetchIxiMachineState(String(userId));

const remoteIxiState =
  remoteIxiResponse?.state || remoteIxiResponse || {};

const workspaceSettings =
  remoteIxiState?.[IXI_AOS_WORK_SETTINGS_ID] || {};

setWorkspaceSettings(workspaceSettings);

const workspaceLayout =
  remoteIxiState?.[IXI_AOS_WORK_LAYOUT_ID] || {};
console.log("IXI WORKSPACE LAYOUT LOADED", workspaceLayout);

setIxiCardState(remoteIxiState);

if (workspaceSettings.cardScaleMode) {
  setCardScaleMode(workspaceSettings.cardScaleMode);
}
        
setSavedIds(
  getSavedListingIdsFromUser(currentUser)
);

const res = await fetch(
  `/api/account-listings?authorId=${encodeURIComponent(String(userId))}`
);

const data = await res.json();

      const firstIXIListing = Array.isArray(data)
  ? data.find(item =>
      item.ixiMedia ||
      item.publicData?.ixiMedia ||
      item.attributes?.publicData?.ixiMedia
    )
  : null;

console.log(
  "FIRST INVENTORY PASSPORT DEBUG",
  JSON.stringify(
    {
      title:
        firstIXIListing?.title ||
        firstIXIListing?.attributes?.title ||
        "",

      passportId:
        firstIXIListing?.passportId ||
        firstIXIListing?.publicData?.passportId ||
        firstIXIListing?.attributes?.publicData?.passportId ||
        "",

      passportUrl:
        firstIXIListing?.passportUrl ||
        firstIXIListing?.publicData?.passportUrl ||
        firstIXIListing?.attributes?.publicData?.passportUrl ||
        "",

      ixiMediaPassportId:
        firstIXIListing?.ixiMedia?.passportId ||
        firstIXIListing?.publicData?.ixiMedia?.passportId ||
        firstIXIListing?.attributes?.publicData?.ixiMedia?.passportId ||
        ""
    },
    null,
    2
  )
);

if (Array.isArray(data)) {
  const hydratedListings =
  await hydrateIXIListingCollection(data);

const firstHydratedIXIListing =
  hydratedListings.find(item =>
    item.ixiMediaSource === "ixi"
  );

console.log(
  "INVENTORY HYDRATED LISTING RESULT",
  {
    title: firstHydratedIXIListing?.title,
    imageObjectsLength:
      firstHydratedIXIListing?.imageObjects?.length,
    imageUrlsLength:
      firstHydratedIXIListing?.imageUrls?.length,
    imagesLength:
      firstHydratedIXIListing?.images?.length,
    firstImageUrl:
      firstHydratedIXIListing?.imageUrls?.[0],
    source:
      firstHydratedIXIListing?.ixiMediaSource
  }
);

setListings(hydratedListings);
}

      } catch (err) {
        console.error("Saved page load failed:", err);
        setSavedIds([]);
      }
    }

    loadSavedPage();
  }, []);

useEffect(() => {
  let cancelled = false;

  async function loadAosScoreboardEnvironment() {
    try {
     const environment =
  await loadIXIMosEnvironment({
    includeObjects: true
  });

console.log(
  "AOS OBJECTS AFTER LOAD",
  environment?.objects
);

if (cancelled) {
  return;
}

      setAosEntity(
        environment?.entity || null
      );

      setAosObjects(
        Array.isArray(
          environment?.objects
        )
          ? environment.objects
          : []
      );

setSystemIndexes(
  Array.isArray(
    environment?.systemIndexes
  )
    ? environment.systemIndexes
    : []
);
      
      const SharetribeSdk =
        await import(
          "sharetribe-flex-sdk"
        );

      const aosSdk =
        SharetribeSdk.createInstance({
          clientId:
            process.env
              .NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
        });

      const currentUserResponse =
        await aosSdk.currentUser.show({
          include: ["profileImage"]
        });

      if (cancelled) {
        return;
      }

      setAosCurrentUser({
        ...currentUserResponse.data.data,

        included:
          currentUserResponse
            .data
            .included || []
      });
    } catch (error) {
      console.error(
        "IXI AOS WORK SCOREBOARD LOAD FAILED:",
        error
      );
    }
  }

  loadAosScoreboardEnvironment();

  return () => {
    cancelled = true;
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

const sellerListings = useMemo(() => {
  return listings.filter(item => {
    const publicData =
      item.publicData ||
      item.attributes?.publicData ||
      {};

    const listingStatus =
      item.listingStatus ||
      publicData.listingStatus;

    const machineChannel =
      publicData.machineChannel ||
      "";

    const ownershipRole =
      publicData.ownershipRole ||
      "";

    if (listingStatus === "archived") {
      return false;
    }

    /* Never show auction work objects */

    if (
      machineChannel === "auction"
    ) {
      return false;
    }

    if (
      machineChannel ===
      "auction-archive"
    ) {
      return false;
    }

    /* Never show research/private work */

    if (
      ownershipRole ===
      "non-owner"
    ) {
      return false;
    }

    return true;
  });
}, [listings]);

const workspaceListings = useMemo(() => {
  return sellerListings;
}, [sellerListings]);

const containerStateKey = useMemo(() => {
  return workspaceListings
    .map(item => {
      const id = String(getListingId(item));
      return `${id}:${ixiCardState[id]?.container || "board"}`;
    })
    .join("|");
}, [workspaceListings, ixiCardState]);
   
useEffect(() => {
  if (
    !workspaceListings.length ||
    !systemIndexes.length
  ) {
    return;
  }

  const validMachineIds =
    workspaceListings
      .map(item =>
        String(
          getListingId(item) ||
          ""
        )
      )
      .filter(Boolean);

  /*
   * Universal AOS workspace identities.
   *
   * Equipment itself is a Board object,
   * alongside machines and eventually
   * Jobs, Locations, People, Containers,
   * etc.
   */
  const validSystemIndexIds =
  workspaceSystemIndexes
    .map(index =>
      String(
        index?.objectId ||
        ""
      )
    )
    .filter(Boolean);

const validMosObjectIds =
  (aosObjects || [])
    .filter(object => {
      const objectType =
        String(
          object?.objectType || ""
        )
          .trim()
          .toLowerCase();

      return (
        objectType &&
        objectType !== "system-index" &&
        objectType !== "machine"
      );
    })
    .map(object =>
      String(
        object?.objectId ||
        object?.id ||
        ""
      )
    )
    .filter(Boolean);

const validWorkspaceObjectIds = [
  ...validSystemIndexIds,
  ...validMosObjectIds,
  ...validMachineIds
];

  const savedLayout =
    ixiCardState?.[
      IXI_AOS_WORK_LAYOUT_ID
    ];

const savedPlacements =
  savedLayout?.workspacePlacements ||
  savedLayout?.machineContainers;
  
  if (
  savedPlacements &&
  !hasAppliedRemoteLayoutRef.current
) {
    /*
     * MIGRATE EXISTING AOS LAYOUT
     *
     * Do NOT automatically place missing
     * objects yet. We decide where they
     * belong below.
     */
    let nextPlacements =
      sanitizeWorkspacePlacements({
placements:
  savedPlacements,

        validObjectIds:
          validWorkspaceObjectIds,

        includeUnplacedObjects:
          false
      });

    /*
     * Equipment System Index itself must
     * live on the Board.
     */
    nextPlacements =
      moveObjectToWorkspaceSurface({
        placements:
          nextPlacements,

        objectId:
          IXI_EQUIPMENT_INDEX_OBJECT_ID,

        targetSurface:
          "board",

        /*
         * Preserve the visual behavior
         * we already have: Equipment
         * begins at the front.
         */
        position:
          "start"
      });

    /*
     * Any owned machine that has no saved
     * workspace location begins tucked
     * inside Equipment.
     */
    validMachineIds.forEach(
      machineId => {
        const alreadyPlaced =
          Object.values(
            nextPlacements
          ).some(ids =>
            Array.isArray(ids) &&
            ids
              .map(String)
              .includes(machineId)
          );

        if (!alreadyPlaced) {
          nextPlacements =
            moveObjectToWorkspaceSurface({
              placements:
                nextPlacements,

              objectId:
                machineId,

              targetSurface:
                "indexEquipment"
            });
        }
      }
    );

    const validation =
      validateWorkspacePlacements(
        nextPlacements
      );

    if (!validation.ok) {
      console.error(
        "IXI AOS WORKSPACE PLACEMENT INVALID",
        validation
      );
    }

    setWorkspacePlacements(
      nextPlacements
    );

    hasAppliedRemoteLayoutRef.current =
      true;

    return;
  }

  if (
    hasAppliedRemoteLayoutRef.current
  ) {
    return;
  }

  /*
   * FIRST AOS LAYOUT
   *
   * Equipment itself lives on Board.
   * Owned machines begin tucked inside it.
   */
  const nextPlacements = {
    ...createEmptyWorkspacePlacements(),

    board: [
      IXI_EQUIPMENT_INDEX_OBJECT_ID
    ],

    indexEquipment:
      [...validMachineIds]
  };

  setWorkspacePlacements(
    nextPlacements
  );

  hasAppliedRemoteLayoutRef.current =
    true;
}, [
  containerStateKey,
  systemIndexes,
  aosObjects
]);
  
  const visibleSavedListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const source =
      savedBoardMode === "custom" && savedBoardListings.length
        ? savedBoardListings
        : workspaceListings;

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
  workspaceListings,
  workspaceFilters,
  machineContainers,
  ixiCardState,
  ixiColorFilters,
  ixiOutlineFilter
]);


/* ---------- AOS EQUIPMENT CONTAINER ---------- */

/* ---------- AOS EQUIPMENT SYSTEM INDEX ---------- */

const workspaceSystemIndexes =
  useMemo(() => {
    return (
      systemIndexes || []
    )
      .filter(Boolean)
      .map(index => {
        const indexId =
          String(
            index?.indexId ||
            ""
          ).trim();

        if (!indexId) {
          return null;
        }

        const objectId =
          String(
            index?.objectId ||
            `system-index:${indexId}`
          );

        const legacySurfaceId =
  indexId === "equipment"
    ? "indexEquipment"
    : "";

const surfaceId =
  String(
    index?.workspace?.surfaceId ||
    legacySurfaceId ||
    `index:${indexId}`
  );

        return {
          ...index,

          objectType:
            "system-index",

          objectId,

          workspace: {
            ...(index?.workspace || {}),

            surfaceId,

            dropPolicy: {
              enabled:
                index?.workspace
                  ?.dropPolicy
                  ?.enabled !== false,

              acceptedObjectTypes:
  Array.isArray(
    index?.workspace
      ?.dropPolicy
      ?.acceptedObjectTypes
  )
    ? index.workspace
        .dropPolicy
        .acceptedObjectTypes
    : indexId === "equipment"
      ? ["machine"]
      : []
            }
          }
        };
      })
      .filter(Boolean);
  }, [systemIndexes]);

  
const equipmentIndex =
  useMemo(() => {
    return (
      workspaceSystemIndexes.find(
        index =>
          String(
            index?.indexId ||
            ""
          ) === "equipment"
      ) || null
    );
  }, [
    workspaceSystemIndexes
  ]);

  const equipmentWorkspaceIndex =
  useMemo(() => {
    if (!equipmentIndex) {
      return null;
    }

    const tuckedIds =
      new Set(
        (
          machineContainers
            .indexEquipment ||
          []
        ).map(String)
      );

    const tuckedItems =
      (
        equipmentIndex.items ||
        []
      ).filter(item => {
        const machineId =
          String(
            getListingId(item) ||
            ""
          );

        return tuckedIds.has(
          machineId
        );
      });

    return {
      ...equipmentIndex,

      /*
       * Canonical membership remains
       * represented by itemCount.
       *
       * items is the current visible
       * workspace deck only.
       */
      items:
        tuckedItems
    };
  }, [
    equipmentIndex,
    machineContainers
  ]);

  const {
  objectRegistry:
    aosWorkspaceObjectRegistry,

  boardItems:
    aosBoardItems
} = useIXIAosWorkspaceRegistry({
  workspaceListings,

  aosObjects,

  workspaceSystemIndexes,

  equipmentWorkspaceIndex,

  workspacePlacements,

  visibleSavedListings
});

  function getAosWorkspaceObjectById(
  objectId
) {
  const id =
    String(
      objectId || ""
    );

  if (!id) {
    return null;
  }

  return (
    aosWorkspaceObjectRegistry
      ?.get(id) ||
    null
  );
}

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

function showAosObjectNotice({
  objectId,
  message,
  tone = "success",
  duration = 1600
}) {
  return setIXIActionNotice({
    setState:
      setIxiCardState,

    listingId:
      objectId,

    message,
    tone,
    duration
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
}

const {
  exposeEquipmentMachineToBoard,

  returnMachineToEquipment,

  exposeAllEquipmentToBoard,

  returnAllEquipmentHome
} = useIXIEquipmentWorkspace({
  equipmentIndex,

  machineContainers,

  ixiCardState,

  executeIXITransaction
});

/* ---------- UNIVERSAL AOS CONTAINER BOARD / RECALL ---------- */

function getDirectContainerChildIds(
  container
) {
  const containerId =
    String(
      container?.objectId ||
      container?.id ||
      ""
    );

  if (!containerId) {
    return [];
  }

  /*
   * EQUIPMENT
   *
   * Equipment is still backed by
   * IronXchange listings.
   */
 if (
  container?.indexId ===
    "equipment" ||
  String(
    container?.displayName || ""
  )
    .trim()
    .toLowerCase() ===
    "equipment"
) {
  /*
   * EQUIPMENT CANONICAL MEMBERSHIP
   *
   * NEVER use container.items here.
   *
   * The card's items array is the
   * current tucked/deck projection.
   * After BOARD it intentionally
   * becomes empty.
   *
   * equipmentIndex.items remains
   * the canonical owned-machine set.
   */
  return (
    equipmentIndex?.items || []
  )
    .map(item =>
      String(
        getListingId(item) ||
        ""
      )
    )
    .filter(Boolean);
}

  /*
   * MOS CONTAINERS
   *
   * Only direct canonical children.
   *
   * Example:
   *
   * LOCATIONS
   *   -> Wichita Falls
   *   -> Dallas
   *
   * WF SHOP does NOT come out here
   * if WF SHOP belongs to Wichita Falls.
   */
  return (
    aosObjects || []
  )
    .filter(object =>
      String(
        object?.directContainerId ||
        ""
      ) === containerId
    )
    .map(object =>
      String(
        object?.objectId ||
        object?.id ||
        ""
      )
    )
    .filter(Boolean);
}


async function boardContainerChildren(
  container
) {
  const childIds =
    getDirectContainerChildIds(
      container
    );

  if (!childIds.length) {
    return;
  }

  let nextPlacements =
    workspacePlacements;

  childIds.forEach(
    objectId => {
      nextPlacements =
        moveObjectToWorkspaceSurface({
          placements:
            nextPlacements,

          objectId,

          targetSurface:
            "board"
        });
    }
  );

  setWorkspacePlacements(
    nextPlacements
  );

  await saveWorkspaceLayout(
    nextPlacements
  );
}


async function recallContainerChildren(
  container
) {

const isEquipment =
  container?.indexId ===
    "equipment" ||
  String(
    container?.displayName || ""
  )
    .trim()
    .toLowerCase() ===
    "equipment";

if (isEquipment) {
  returnAllEquipmentHome?.();
  return;
}  
  const childIds =
    new Set(
      getDirectContainerChildIds(
        container
      )
    );

  if (!childIds.size) {
    return;
  }

  const nextPlacements = {};

  Object.entries(
    workspacePlacements || {}
  ).forEach(
    ([
      surfaceId,
      objectIds
    ]) => {
      nextPlacements[
        surfaceId
      ] =
        Array.isArray(objectIds)
          ? objectIds.filter(
              objectId =>
                !childIds.has(
                  String(objectId)
                )
            )
          : [];
    }
  );

  setWorkspacePlacements(
    nextPlacements
  );

  await saveWorkspaceLayout(
    nextPlacements
  );
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
  if (!activeDndId) {
    return null;
  }

  const id =
    String(activeDndId);

  /*
   * Universal workspace registry first.
   *
   * This can resolve:
   * machine
   * system index
   * job
   * location
   * person
   * custom container
   * etc.
   */
  if (
    aosWorkspaceObjectRegistry?.has(id)
  ) {
    return (
      aosWorkspaceObjectRegistry.get(id) ||
      null
    );
  }

  /*
   * Legacy fallback.
   */
  return (
    getListingById(id) ||
    null
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

 function clearMachineDragState() {
  setDraggingListingId("");
  setGhostListingId("");
}
 
  
function rotatePocket(pocketKey) {
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

  const result = IXI_COMMANDS.moveObjectToContainerStart({
    objectId: listingId,
    containerKey: "board",
    ixiCardState,
    machineContainers
  });

  executeIXITransaction(result);
}

function sendListingToBack(listing) {
  const listingId = String(getListingId(listing));

  const result = IXI_COMMANDS.moveObjectToContainerEnd({
    objectId: listingId,
    containerKey: "board",
    ixiCardState,
    machineContainers
  });

  executeIXITransaction(result);
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

function movePocketToStack(
  pocketKey,
  stackKey
) {
  return;
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
  if (!ixiUserId) {
    return null;
  }

  const nextSettings = {
    ...workspaceSettings,
    ...patch,
    updatedAt: Date.now()
  };

  setWorkspaceSettings(nextSettings);

  return saveIxiMachinePatch({
    userId: ixiUserId,
    listingId: IXI_AOS_WORK_SETTINGS_ID,
    patch: nextSettings
  });
}
  
function saveWorkspaceLayout(
  nextContainers = workspacePlacements
) {
  return saveIxiMachinePatch({
    userId: ixiUserId,
    listingId: IXI_AOS_WORK_LAYOUT_ID,

    patch: {
      workspacePlacements:
        nextContainers,

      machineContainers:
        nextContainers,

      updatedAt:
        Date.now()
    }
  });
}


const {
  createRootSystemIndexByName,
  createObjectInContainer,
  saveMosObjectName,
  deleteMosWorkspaceObject
} = useIXIMosObjectCreation({
  entityId:
    aosEntity?.entityId || "",

  userId:
    ixiUserId,

  workspaceSystemIndexes,

  workspacePlacements,

  setWorkspacePlacements,

  saveWorkspaceLayout,

  setAosObjects,

  setSystemIndexes,

  onObjectNotice:
    showAosObjectNotice
});

  
function cycleCardScaleMode() {
  setCardScaleMode(current => {
    const next = getNextCardScaleMode(current);

    saveIxiMachinePatch({
      userId: ixiUserId,
      listingId: IXI_AOS_WORK_SETTINGS_ID,
      patch: {
        cardScaleMode: next,
        updatedAt: Date.now()
      }
    });

    return next;
  });
}
async function createRootSystemIndex() {
  const rawName =
    window.prompt(
      "Name this index"
    );

  const displayName =
    String(
      rawName || ""
    ).trim();

  if (!displayName) {
    return;
  }

  try {
    await createRootSystemIndexByName(
      displayName
    );
  } catch (error) {
    console.error(
      "AOS SYSTEM INDEX CREATE FAILED:",
      error
    );

    window.alert(
      error?.message ||
      "Could not create Index."
    );
  }
}


/*
 * TEMPORARY.
 *
 * This browser-prompt workflow will be
 * removed when IXILocationCreateCard
 * is connected.
 *
 * The important change now is that
 * persistence/containment no longer
 * lives in work.js.
 */
async function createObjectInsideSystemIndex(
  parentObject
) {
  try {
    await createObjectInContainer({
      container:
        parentObject,

      /*
       * GENERIC AOS OBJECT
       *
       * The customer supplies meaning
       * through the name and structure.
       */
      objectType:
        "generic",

      displayName:
        "NEW OBJECT",

      metadata: {
        creationState:
          "naming",

        createdFrom:
          "aos-container-plus",

        parentDisplayName:
          String(
            parentObject?.displayName ||
            parentObject?.label ||
            ""
          ).trim()
      },

      exposeToBoard:
        true
    });
  } catch (error) {
    console.error(
      "AOS OBJECT CREATE FAILED:",
      error
    );

    window.alert(
      error?.message ||
      "Could not create object."
    );
  }
}

return (
  <>
    <Head>
        <title>IXI AOS Work | IronXchange</title>

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
toggleSearchSurfaceRevealed
  }) => {
          const handleBaseWorkspaceDragEnd =
  createWorkspaceDragEndHandler({
    getMachineContainer,
    machineContainers,
    moveMachineWithinContainer,
    moveMachineToContainerAtPosition,
    moveMachineToContainer,
    setLeftPocketMode,
    setLeftPocket2Mode,
    setRightPocketMode,
    setRightPocket2Mode,
    setActiveDndId,
    clearMachineDragState
  });

function handleWorkspaceDragEnd(event) {
  const active =
    event?.active;

  const over =
    event?.over;

  const dragData =
    active?.data?.current || {};

  const dragType =
    String(
      dragData.type || ""
    );

  /*
   * AOS COLLECTION CHILD
   *
   * This is a machine being dragged
   * OUT of Equipment / another
   * collection viewer.
   *
   * Do not send this through the
   * normal sortable dispatcher.
   */
  if (
    dragType ===
    "collection-child"
  ) {
    const machineId =
      String(
        dragData.objectId ||
        active?.id ||
        ""
      );

    if (!machineId) {
      setActiveDndId(null);
      clearMachineDragState?.();
      return;
    }

    const overId =
      String(
        over?.id || ""
      );

   const overData =
  over?.data?.current || {};

const overContainer =
  String(
    overData.containerId ||
    overData.targetContainer ||
    ""
  );

const validDirectTargets =
  new Set([
    "stackTop",
    "stackBottom",

    "pocketLeft",
    "pocketRight",
    "pocketLeft2",
    "pocketRight2"
  ]);

/*
 * COLLECTION CHILD EXTRACTION
 *
 * A machine leaving an Index is going
 * to BOARD unless the user explicitly
 * enters a pocket or stack destination.
 *
 * System Index ON-targets do not get
 * to accidentally capture this outbound
 * extraction path.
 */
let targetContainer =
  validDirectTargets.has(
    overContainer
  )
    ? overContainer
    : validDirectTargets.has(
        overId
      )
      ? overId
      : "board";
    /*
     * Critical rule:
     *
     * A collection child dropped over
     * ordinary board space OR another
     * board card becomes BOARD.
     *
     * Board is no longer a geometric
     * fallback from closestCenter.
     * It is our explicit default for
     * an extracted child.
     */
    moveMachineToContainer(
      machineId,
      targetContainer
    );

    if (
      targetContainer ===
      "pocketLeft"
    ) {
      setLeftPocketMode?.(
        "peek"
      );
    }

    if (
      targetContainer ===
      "pocketRight"
    ) {
      setRightPocketMode?.(
        "peek"
      );
    }

    if (
      targetContainer ===
      "pocketLeft2"
    ) {
      setLeftPocket2Mode?.(
        "peek"
      );
    }

    if (
      targetContainer ===
      "pocketRight2"
    ) {
      setRightPocket2Mode?.(
        "peek"
      );
    }

    setActiveDndId(null);
    clearMachineDragState?.();

    return;
  }

  /*
   * EVERYTHING ELSE
   *
   * Existing Marketplace / Board /
   * pocket / stack behavior remains
   * on the proven chassis path.
   */
 const dragId =
  String(
    active?.id || ""
  );

const overId =
  String(
    over?.id || ""
  );

if (!dragId) {
  setActiveDndId(null);
  clearMachineDragState?.();
  return;
}

const knownWorkspaceSurfaces =
  new Set([
    "board",
    "stackTop",
    "stackBottom",
    "pocketLeft",
    "pocketRight",
    "pocketLeft2",
    "pocketRight2"
  ]);

const sourceSurface =
  String(
    active?.data?.current
      ?.containerId ||
    getObjectWorkspaceSurface({
      placements:
        workspacePlacements,

      objectId:
        dragId
    }) ||
    ""
  );

const overData =
  over?.data?.current || {};

const overSurface =
  String(
    overData.containerId ||
    overData.targetContainer ||
    ""
  );

const dropIntent =
  String(
    overData.dropIntent ||
    ""
  );

const dropTargetSurface =
  String(
    overData.targetSurface ||
    ""
  );

const dropAccepted =
  overData.accepted === true;

let nextPlacements =
  workspacePlacements;


/*
 * DROP ON / INTO A CONTAINER
 *
 * The target advertises the surface
 * that represents its contained deck.
 *
 * Equipment currently advertises:
 *
 * targetSurface = indexEquipment
 *
 * Future containers can advertise
 * their own target surface without
 * changing this drag-end engine.
 */
if (
  dropIntent === "on" &&
  dropAccepted &&
  dropTargetSurface
) {
  nextPlacements =
    moveObjectToWorkspaceSurface({
      placements:
        workspacePlacements,

      objectId:
        dragId,

      targetSurface:
        dropTargetSurface
    });
}

/*
 * Dropped directly onto a workspace
 * surface such as Board/Pocket/Stack.
 */
else if (
  knownWorkspaceSurfaces.has(
    overId
  )
) {
  nextPlacements =
    moveObjectToWorkspaceSurface({
      placements:
        workspacePlacements,

      objectId:
        dragId,

      targetSurface:
        overId
    });
}

/*
 * Dropped onto another sortable object.
 */
else if (
  overId &&
  overId !== dragId
) {
  const targetSurface =
    knownWorkspaceSurfaces.has(
      overSurface
    )
      ? overSurface
      : getObjectWorkspaceSurface({
          placements:
            workspacePlacements,

          objectId:
            overId
        }) ||
        "board";

  if (
    sourceSurface ===
    targetSurface
  ) {
    const ids =
      workspacePlacements[
        sourceSurface
      ] || [];

    const fromIndex =
      ids.findIndex(
        id =>
          String(id) ===
          dragId
      );

    const toIndex =
      ids.findIndex(
        id =>
          String(id) ===
          overId
      );

    nextPlacements =
      reorderObjectWithinWorkspaceSurface({
        placements:
          workspacePlacements,

        surfaceId:
          sourceSurface,

        objectId:
          dragId,

        targetObjectId:
          overId,

        insertAfter:
          fromIndex < toIndex
      });
  } else {
    nextPlacements =
      moveObjectToWorkspacePosition({
        placements:
          workspacePlacements,

        objectId:
          dragId,

        targetSurface,

        targetObjectId:
          overId,

        insertAfter:
          false
      });
  }
}

/*
 * Empty / ambiguous space means Board.
 */
else {
  nextPlacements =
    moveObjectToWorkspaceSurface({
      placements:
        workspacePlacements,

      objectId:
        dragId,

      targetSurface:
        "board"
    });
}

setWorkspacePlacements(
  nextPlacements
);

saveWorkspaceLayout(
  nextPlacements
);

setActiveDndId(null);
clearMachineDragState?.();

return;
}

  
    function sendMachineToArmedDestination(listing) {
  if (!armedDestination) return;

  const id = String(getListingId(listing));

  if (
    !DIRECT_CONTAINER_TARGETS.includes(
      armedDestination
    )
  ) {
    return;
  }

  moveMachineToContainer(
    id,
    armedDestination
  );
}

    return (
  <IXIDragEngine
    sensors={sensors}
   workspaceCollisionDetection={
  universalWorkspaceCollisionDetection
}
    handleWorkspaceDragStart={handleWorkspaceDragStart}
    handleWorkspaceDragEnd={handleWorkspaceDragEnd}
    handleWorkspaceDragCancel={handleWorkspaceDragCancel}
    getActiveDndObject={
  getActiveDndListing
}
    renderActiveDndObject={({
  object,
  objectId
}) => {
  /*
   * SYSTEM INDEX / CONTAINER
   */
  if (
    object?.objectType ===
    "system-index"
  ) {
    return (
      <IXISystemIndexCard
        index={
          object
        }

        objectId={
          objectId
        }

        /*
         * Overlay is presentation only.
         * Never install another drag
         * activator inside the overlay.
         */
        dragHandleProps={{}}

workspaceDropPolicy={
  object?.workspace
    ?.dropPolicy ||
  null
}

workspaceDropSurface={
  object?.workspace
    ?.surfaceId ||
  ""
}
      
        ixiState={
          ixiCardState[
            objectId
          ] || {
            color: "none",
            outline: 1,
            face: 1
          }
        }

        ixiCardState={
          ixiCardState
        }

        onIxiStateChange={() => {}}

        armedDestination=""
        onSendFront={() => {}}
        onSendBack={() => {}}
        onSendToArmedDestination={() => {}}

        onExposeObject={() => {}}
        onOpenConsole={() => {}}
      />
    );
  }

  /*
   * Return null for normal listings.
   *
   * IXIDragEngine then uses its
   * existing ListingCard fallback.
   */
  return null;
}}
    activeDndId={activeDndId}
    savedIds={savedIds}
    ixiCardState={ixiCardState}
    cardScaleMode={cardScaleMode}
  >
 <main>
  <section className="saved-environment-shell">
    <IXIEnvironmentRail
      activeEnvironment="AOS"
      hasAccount={!!aosEntity}
      hasRelationship={!!aosEntity}
      hasInventory={workspaceListings.length > 0}
      armedDestination={armedDestination}
      toggleArmedDestination={toggleArmedDestination}
    />
  </section>

<IXIAosScoreboard
  entity={aosEntity}
  currentUser={aosCurrentUser}
  ownedListings={workspaceListings}
  aosObjects={aosObjects}
  onAdd={
  createRootSystemIndex
}
  onMore={() => {
    console.log(
      "AOS WORK MORE"
    );
  }}
/>

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
  listings={workspaceListings}  
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
  railRevealed={railRevealed}
  toggleRailRevealed={toggleRailRevealed}

  searchSurfaceRevealed={searchSurfaceRevealed}
  toggleSearchSurfaceRevealed={toggleSearchSurfaceRevealed}/>
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
              
<IXIAosWorkspaceBoard
  items={
    aosBoardItems
  }

getWorkspaceObjectById={
  getAosWorkspaceObjectById
}

  savedIds={
    savedIds
  }

  ixiCardState={
    ixiCardState
  }

  cardScaleMode={
    cardScaleMode
  }

  cardScaleMetrics={
    cardScaleMetrics
  }

  armedDestination={
    armedDestination
  }

  draggingListingId={
    draggingListingId
  }

  ghostListingId={
    ghostListingId
  }

  getSellerListingCardProps={
    getSellerListingCardProps
  }

  toggleSave={
    toggleSave
  }

  updateIxiCardState={
    updateIxiCardState
  }

  cycleMachineFace={
    cycleMachineFace
  }

  sendListingToFront={
    sendListingToFront
  }

  sendListingToBack={
    sendListingToBack
  }

  sendMachineToArmedDestination={
    sendMachineToArmedDestination
  }

  exposeEquipmentMachineToBoard={
    exposeEquipmentMachineToBoard
  }

  returnAllEquipmentHome={
    returnAllEquipmentHome
  }

    onAddObject={
    createObjectInsideSystemIndex
  }

onExposeContainerChildren={
  boardContainerChildren
}

onGatherContainerChildren={
  recallContainerChildren
}

   onCreateObjectChild={
  createObjectInsideSystemIndex
}

  onSaveObjectName={
    saveMosObjectName
  }

  onDeleteObject={
    deleteMosWorkspaceObject
  }
/>
    
<button
  type="button"
  onClick={cycleCardScaleMode}
  style={{
    position: "fixed",
    right: "24px",
    bottom: "24px",
    zIndex: 9999,
    background: "#111",
    color: "#FFC400",
    border: "1px solid rgba(255,196,0,.55)",
    borderRadius: "8px",
    padding: "8px 10px",
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: ".08em",
    cursor: "pointer"
  }}
>
  SCALE: {cardScaleMode.toUpperCase()}
</button>

        {visibleSavedListings.length === 0 && (
  <div className="empty">
    <h3>HELP US BUILD OUR MARKETPLACE</h3>
    <p>
      Touch a machine. Create a relationship. Machines will appear here.
    </p>
  </div>
)}
</main>
  </IXIDragEngine>
);
  }}
</IXIWorkspaceEngine>

<IXIPocketStationStyles />
  
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
  padding: 14px 5% 160px;
          background:
            radial-gradient(circle at 50% 0%, rgba(255,196,0,.05), transparent 34%),
            linear-gradient(180deg, rgba(255,255,255,.014), rgba(255,255,255,0)),
            #0b0b0b;
        }

       .saved-environment-shell {
  width: 100%;
  margin: 0 auto;
}


      :global(.ixi-drag-overlay-card) {
  width: auto;
  max-width: none;

  position: relative;

  pointer-events: none;

  z-index: 999999;
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
}
       
      `}</style>
    </>
  );
}
