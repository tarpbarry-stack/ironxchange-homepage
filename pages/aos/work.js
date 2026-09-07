import Head from "next/head";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

import {
  commitMosObjectCommand,
  commitMosContainerPlacement,
  createMosRelationship
} from "../../lib/mos/ixiMosClient";

import {
  mergeAosCanonicalObject
} from "../../lib/mos/mergeAosCanonicalObject.mjs";

import IXISystemIndexCard
  from "../../components/ixi-mos/IXISystemIndexCard";

import IXIAosBoardSkinPicker
  from "../../components/ixi-aos/board-skin-runtime/IXIAosBoardSkinPicker";

import {
  IXI_AOS_DEFAULT_BOARD_SKIN_ID,
  getIXIAosBoardSkin,
  normalizeIXIAosBoardSkinId,
  readIXIAosBoardSkinId,
  writeIXIAosBoardSkinId
} from "../../components/ixi-aos/board-skin-runtime/IXIAosBoardSkinLibrary";

import IXIAosOperatingCardRuntime
  from "../../components/ixi-aos/card-runtime/IXIAosOperatingCardRuntime";

import useIXIMosObjectCreation
  from "../../components/ixi-mos/object-creation/useIXIMosObjectCreation";

import IXIAosSystemObjectTemplatePicker
  from "../../components/ixi-mos/object-creation/IXIAosSystemObjectTemplatePicker";

import {
  isAosDraftId
} from "../../lib/mos/ixiAosProvisioningContract";

import useIXIAosWorkspaceRegistry
  from "../../components/ixi-mos/workspace/useIXIAosWorkspaceRegistry";

import useIXIEquipmentWorkspace
  from "../../components/ixi-mos/equipment/useIXIEquipmentWorkspace";

import IXIAosWorkspaceBoard
  from "../../components/ixi-mos/workspace/IXIAosWorkspaceBoard";

import {
  resolveAosWorkspaceParentName
} from "../../lib/mos/ixiAosHierarchyContract.mjs";

import {
  getCanonicalAosPassportId
} from "../../lib/mos/ixiAosPassportPresentation.mjs";

import { getListingId } from "../../lib/listingFormatters";
import {
  fetchIxiMachineState,
  saveIxiMachinePatch,
} from "../../lib/ixiMachineStateClient";

import {
  hydrateIXIListingCollection
} from "../../lib/listings/hydrateIXIListingMedia";

import {
  filterAosOwnedMachines
} from "../../lib/listings/IXIAosOwnedInventoryPolicy.mjs";

import { captureIXEvent } from "../../lib/posthog";

import IXIDragEngine from "../../components/ixi-chassis/IXIDragEngine";
import IXIEnvironmentRail from "../../components/IXIEnvironmentRail";
import IXIChassisControls from "../../components/ixi-chassis/IXIChassisControls";
import IXICardScaleControl
  from "../../components/ixi-chassis/IXICardScaleControl";
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
  readSitewideCardScaleMode,
  resolveSitewideCardScaleMode,
  writeSitewideCardScaleMode
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

const [aosRelationships, setAosRelationships] =
  useState([]);

const [systemIndexes, setSystemIndexes] =
  useState([]);

const [aosCurrentUser, setAosCurrentUser] =
  useState(null);

const [systemObjectPickerOpen, setSystemObjectPickerOpen] =
  useState(false);

const [systemObjectPickerParent, setSystemObjectPickerParent] =
  useState(null);

const [boardSkinPickerOpen, setBoardSkinPickerOpen] =
  useState(false);

const [boardSkinId, setBoardSkinId] =
  useState(IXI_AOS_DEFAULT_BOARD_SKIN_ID);

const boardSkin =
  getIXIAosBoardSkin(boardSkinId);
  
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
  const [hasLoadedRemoteIxiState, setHasLoadedRemoteIxiState] =
    useState(false);
  const [workspaceSettings, setWorkspaceSettings] =
  useState({});
  const [ixiColorFilters, setIxiColorFilters] = useState([]);
  const [ixiOutlineFilter, setIxiOutlineFilter] = useState("all");

  const [pocketThumbSize, setPocketThumbSize] = useState("medium");

  const [cardScaleMode, setCardScaleMode] = useState("xl");
  const cardScaleMetrics = getIXICardScalePreset(cardScaleMode);

  useEffect(() => {
    const savedMode = readSitewideCardScaleMode();

    if (savedMode) {
      setCardScaleMode(savedMode);
    }
  }, []);

  useEffect(() => {
    setBoardSkinId(
      readIXIAosBoardSkinId()
    );
  }, []);

  const hasAppliedRemoteLayoutRef = useRef(false);
  const workspaceLayoutSaveQueueRef = useRef(
    Promise.resolve()
  );
  
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

setBoardSkinId(
  workspaceSettings.boardSkinId
    ? writeIXIAosBoardSkinId(
        workspaceSettings.boardSkinId
      )
    : readIXIAosBoardSkinId()
);

const workspaceLayout =
  remoteIxiState?.[IXI_AOS_WORK_LAYOUT_ID] || {};
console.log("IXI WORKSPACE LAYOUT LOADED", workspaceLayout);

setIxiCardState(remoteIxiState);
setHasLoadedRemoteIxiState(true);

setCardScaleMode(
  resolveSitewideCardScaleMode(
    workspaceSettings.cardScaleMode
  )
);
        
setSavedIds(
  getSavedListingIdsFromUser(currentUser)
);

const res = await fetch(
  `/api/account-listings?scope=aos-owned&authorId=${encodeURIComponent(String(userId))}`
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
  await hydrateIXIListingCollection(filterAosOwnedMachines(data));

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

  async function loadAosIdentity() {
    try {
      const SharetribeSdk =
        await import("sharetribe-flex-sdk");

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

      if (cancelled) return;

      setAosCurrentUser({
        ...currentUserResponse.data.data,
        included:
          currentUserResponse.data.included || []
      });
    } catch (error) {
      console.error(
        "IXI AOS IDENTITY LOAD FAILED:",
        error
      );
    }
  }

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

      setAosRelationships(
        Array.isArray(environment?.relationships)
          ? environment.relationships
          : []
      );

setSystemIndexes(
  Array.isArray(
    environment?.systemIndexes
  )
    ? environment.systemIndexes
    : []
);
    } catch (error) {
      console.error(
        "IXI AOS WORK SCOREBOARD LOAD FAILED:",
        error
      );
    }
  }

  loadAosIdentity();
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
  /*
   * Do not manufacture a "first layout" while the authenticated IX Core
   * layout is still in flight. Environment objects often arrive first;
   * treating that timing window as an empty remote layout puts every MOS
   * object back on Board and permanently masks the later readback.
   */
  if (!hasLoadedRemoteIxiState) {
    return;
  }

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

  const equipmentSystemIndexObjectId =
    String(
      (systemIndexes || []).find(index =>
        String(index?.indexId || "") === "equipment"
      )?.objectId || ""
    ).trim();

  if (!equipmentSystemIndexObjectId) {
    return;
  }

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
      const objectId =
        String(
          object?.objectId ||
          object?.id ||
          ""
        ).trim();

      const objectType =
        String(
          object?.objectType || ""
        )
          .trim()
          .toLowerCase();

      return (
        objectId &&
        !validSystemIndexIds.includes(objectId) &&
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
          equipmentSystemIndexObjectId,

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

    /*
     * Existing durable AOS objects must remain manageable after
     * the workspace runtime migration. Older saved layouts did
     * not know about these identities and could otherwise leave
     * a valid object stranded outside every workspace surface.
     *
     * This is presentation recovery only: canonical containment,
     * ownership, object data, and revision history are untouched.
     */
    validMosObjectIds.forEach(
      objectId => {
        const alreadyPlaced =
          Object.values(
            nextPlacements
          ).some(ids =>
            Array.isArray(ids) &&
            ids
              .map(String)
              .includes(objectId)
          );

        if (!alreadyPlaced) {
          nextPlacements =
            moveObjectToWorkspaceSurface({
              placements:
                nextPlacements,

              objectId,

              targetSurface:
                "board"
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
      equipmentSystemIndexObjectId,
      ...validMosObjectIds
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
  hasLoadedRemoteIxiState,
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

  relationships:
    aosRelationships,

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

function getCanonicalMosObjectForWorkspaceId(workspaceObjectId) {
  const id = String(workspaceObjectId || "").trim();
  if (!id) return null;

  const workspaceObject =
    getAosWorkspaceObjectById(id) || null;

  const workspacePassportId = getCanonicalAosPassportId(
    workspaceObject || {}
  );

  const activeObjects = (aosObjects || []).filter(object =>
    !["archived", "deleted", "soft-deleted"].includes(
      String(object?.status || "active").trim().toLowerCase()
    )
  );
  const exactObject = activeObjects.find(object =>
    String(object?.objectId || "").trim() === id
  );
  if (exactObject) return exactObject;

  const sourceMatches = activeObjects.filter(object =>
    String(object?.metadata?.sourceListingId || "").trim() === id ||
    (Array.isArray(object?.identities) ? object.identities : []).some(identity =>
      String(identity?.sourceType || "").trim() === "sharetribe-listing" &&
      String(identity?.sourceId || "").trim() === id
    )
  );
  if (sourceMatches.length === 1) return sourceMatches[0];
  if (sourceMatches.length > 1) {
    const error = new Error(
      "IDENTITY CONFLICT · THIS LISTING IS LINKED TO MULTIPLE ACTIVE IX CORE OBJECTS"
    );
    error.code = "IXI_AOS_CANONICAL_MACHINE_CONFLICT";
    throw error;
  }

  const passportMatches = workspacePassportId
    ? activeObjects.filter(object =>
        getCanonicalAosPassportId(object) === workspacePassportId
      )
    : [];
  if (passportMatches.length === 1) return passportMatches[0];
  if (passportMatches.length > 1) {
    const error = new Error(
      `IDENTITY CONFLICT · PASSPORT ${workspacePassportId} HAS MULTIPLE ACTIVE IX CORE OBJECTS`
    );
    error.code = "IXI_AOS_CANONICAL_PASSPORT_CONFLICT";
    throw error;
  }

  /*
   * The workspace registry may already contain the permanent canonical
   * readback while the environment array is completing its post-save
   * refresh. A durable object_* identity with its owning Entity is safe
   * to use; browser-only drafts and Sharetribe listing IDs are not.
   */
  if (
    !isAosDraftId(id) &&
    String(workspaceObject?.objectId || "").trim() === id &&
    String(workspaceObject?.entityId || "").trim()
  ) {
    return workspaceObject;
  }

  return null;
}

function getWorkspaceIdForCanonicalObject(object = {}) {
  const sourceListingId =
    String(object?.metadata?.sourceListingId || "").trim() ||
    String((Array.isArray(object?.identities) ? object.identities : [])
      .find(identity =>
        String(identity?.sourceType || "").trim() === "sharetribe-listing"
      )?.sourceId || "").trim();

  return sourceListingId ||
    String(object?.objectId || object?.id || "").trim();
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

const saveAosWorkspaceObject = useCallback(async (payload = {}) => {
  const command = payload?.command;
  if (!command) {
    const error = new Error("AOS Work requires a versioned object command.");
    error.code = "IXI_AOS_COMMAND_REQUIRED";
    throw error;
  }

  const result = await commitMosObjectCommand(command);
  const canonical = result?.object;
  const objectId = String(canonical?.objectId || "").trim();
  const entityId = String(canonical?.entityId || "").trim();
  const activeEntityId = String(aosEntity?.entityId || "").trim();

  if (!objectId) {
    const error = new Error("IX-Core did not return the canonical saved AOS object.");
    error.code = "IXI_AOS_CANONICAL_READBACK_REQUIRED";
    throw error;
  }

  if (!activeEntityId || entityId !== activeEntityId) {
    const error = new Error("Saved object does not belong to the active AOS Entity.");
    error.code = "AOS_BROWSER_ENTITY_MISMATCH";
    error.status = 403;
    throw error;
  }

  const acceptedObject = payload?.object
    ? mergeAosCanonicalObject(payload.object, canonical)
    : canonical;

  setAosObjects(current => current.map(existing => {
    if (String(existing?.objectId || "") !== objectId) return existing;
    /*
     * The mutation response is authoritative for persisted values/revision,
     * but older IX-Core projections can omit fieldDefinitions. Merge from the
     * submitted object here so a customer-authored label (for example
     * "TITLE") is not replaced by its stable storage key ("custom_2") after
     * the save completes. mergeAosCanonicalObject still prefers definitions
     * returned by IX-Core when they are present.
     */
    return mergeAosCanonicalObject(
      payload?.object || existing,
      canonical
    );
  }));

  return {
    ...result,
    object: acceptedObject
  };
}, [aosEntity?.entityId]);
  
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

/* ---------- UNIVERSAL AOS CONTAINER BOARD / RECALL / RETURN ---------- */
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

  const objectsById = new Map(
    (aosObjects || []).map(object => [
      String(object?.objectId || "").trim(),
      object
    ])
  );
  const relationshipChildIds = (aosRelationships || [])
    .filter(relationship =>
      String(relationship?.status || "active").trim().toLowerCase() === "active" &&
      String(
        relationship?.relationshipKey ||
        relationship?.relationshipType ||
        relationship?.relationshipLabel ||
        ""
      ).trim().toLowerCase() === "contains" &&
      String(relationship?.sourceObjectId || "").trim() === containerId
    )
    .map(relationship =>
      objectsById.get(String(relationship?.targetObjectId || "").trim())
    )
    .filter(Boolean)
    .map(getWorkspaceIdForCanonicalObject);

  /* Keep legacy direct children readable while old records are migrated. */
  const legacyChildIds = (
    aosObjects || []
  )
    .filter(object =>
      String(
        object?.directContainerId ||
        ""
      ) === containerId
    )
    .map(getWorkspaceIdForCanonicalObject)
    .filter(Boolean);

  return [...new Set([
    ...relationshipChildIds,
    ...legacyChildIds
  ])];
}

async function clearContainerChildrenToParent(
  container
) {
  const containerId = String(
    container?.objectId ||
    container?.id ||
    ""
  ).trim();

  const parentContainerId = String(
    container?.directContainerId ||
    ""
  ).trim();

  if (!containerId || !parentContainerId) {
    const error = new Error(
      "THIS CARD DOES NOT HAVE A CANONICAL PARENT"
    );
    error.code = "IXI_AOS_CLEAR_PARENT_REQUIRED";
    throw error;
  }

  const childIds =
    getDirectContainerChildIds(container);

  if (!childIds.length) {
    return {
      ok: true,
      moved: 0,
      parentContainerId
    };
  }

  const canonicalChildren = [];

  for (const childId of childIds) {
    const placement =
      await commitMosContainerPlacement({
        objectId: childId,
        destinationContainerId:
          parentContainerId,
        metadata: {
          createdFrom:
            "aos-clear-children-to-parent",
          clearedContainerId:
            containerId,
          destinationParentId:
            parentContainerId
        }
      });

    canonicalChildren.push(
      placement.object
    );
  }

  const canonicalById = new Map(
    canonicalChildren.map(object => [
      String(object?.objectId || ""),
      object
    ])
  );

  setAosObjects(current =>
    current.map(object => {
      const canonical = canonicalById.get(
        String(object?.objectId || "")
      );

      return canonical
        ? mergeAosCanonicalObject(
            object,
            canonical
          )
        : object;
    })
  );

  let nextPlacements =
    workspacePlacements;

  childIds.forEach(childId => {
    nextPlacements =
      moveObjectToWorkspaceSurface({
        placements:
          nextPlacements,
        objectId:
          childId,
        targetSurface:
          `container:${parentContainerId}`
      });
  });

  setWorkspacePlacements(
    nextPlacements
  );

  const layoutResult =
    await saveWorkspaceLayout(
      nextPlacements
    );

  if (!layoutResult) {
    const error = new Error(
      "IX CORE MOVED THE CHILDREN, BUT THE WORKSPACE LAYOUT WAS NOT CONFIRMED"
    );
    error.code =
      "IXI_AOS_CLEAR_PARENT_LAYOUT_UNCONFIRMED";
    throw error;
  }

  showAosObjectNotice({
    objectId:
      containerId,
    message:
      `${childIds.length} CHILD${childIds.length === 1 ? "" : "REN"} RETURNED TO PARENT`,
    tone:
      "success",
    duration:
      2600
  });

  return {
    ok: true,
    moved: childIds.length,
    parentContainerId,
    children: canonicalChildren
  };
}


/* =========================================================
   SMART CONTAINER TEMPORARY WORKSPACE SNAPSHOTS

   PURPOSE

   BOARD and RECALL are temporary workspace operations.

   Before either operation changes the placement of a
   container's direct children, remember exactly where
   those affected children were.

   RETURN restores that arrangement.

   THIS DOES NOT CHANGE:

   - canonical containment
   - relationships
   - object identity
   - MOS truth

   It is workspace presentation history only.
   ========================================================= */

const containerReturnSnapshotsRef =
  useRef({});


function captureContainerReturnSnapshot({
  container,
  childIds
}) {
  const containerId =
    String(
      container?.objectId ||
      container?.id ||
      ""
    ).trim();

  if (
    !containerId ||
    !Array.isArray(childIds) ||
    !childIds.length
  ) {
    return;
  }

  const childIdSet =
    new Set(
      childIds.map(String)
    );

  const placements = {};

  Object.entries(
    workspacePlacements || {}
  ).forEach(
    ([
      surfaceId,
      objectIds
    ]) => {
      if (
        !Array.isArray(
          objectIds
        )
      ) {
        return;
      }

      const affectedIds =
        objectIds.filter(
          objectId =>
            childIdSet.has(
              String(objectId)
            )
        );

      if (
        affectedIds.length
      ) {
        placements[
          surfaceId
        ] = [
          ...affectedIds
        ];
      }
    }
  );

  containerReturnSnapshotsRef
    .current[
      containerId
    ] = {
      containerId,

      childIds: [
        ...childIds
      ],

      placements,

      capturedAt:
        Date.now()
    };
}


function hasContainerReturnSnapshot(
  container
) {
  const containerId =
    String(
      container?.objectId ||
      container?.id ||
      ""
    ).trim();

  return Boolean(
    containerId &&
    containerReturnSnapshotsRef
      .current[
        containerId
      ]
  );
}


async function returnContainerChildren(
  container
) {
  const containerId =
    String(
      container?.objectId ||
      container?.id ||
      ""
    ).trim();

  if (!containerId) {
    return;
  }

  const snapshot =
    containerReturnSnapshotsRef
      .current[
        containerId
      ];

  if (!snapshot) {
    return;
  }

  const childIds =
    new Set(
      (
        snapshot.childIds ||
        []
      ).map(String)
    );

  if (!childIds.size) {
    delete (
      containerReturnSnapshotsRef
        .current[
          containerId
        ]
    );

    return;
  }

  /*
   * First remove the affected direct
   * children from wherever they are now.
   */
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
        Array.isArray(
          objectIds
        )
          ? objectIds.filter(
              objectId =>
                !childIds.has(
                  String(objectId)
                )
            )
          : [];
    }
  );

  /*
   * Then restore each child to the exact
   * workspace surface recorded before
   * BOARD / RECALL.
   *
   * Preserve the recorded ordering of the
   * affected children on each surface.
   */
  Object.entries(
    snapshot.placements ||
    {}
  ).forEach(
    ([
      surfaceId,
      objectIds
    ]) => {
      if (
        !Array.isArray(
          objectIds
        ) ||
        !objectIds.length
      ) {
        return;
      }

      const existingIds =
        Array.isArray(
          nextPlacements[
            surfaceId
          ]
        )
          ? nextPlacements[
              surfaceId
            ]
          : [];

      nextPlacements[
        surfaceId
      ] = [
        ...existingIds,
        ...objectIds.filter(
          objectId =>
            !existingIds
              .map(String)
              .includes(
                String(objectId)
              )
        )
      ];
    }
  );

  setWorkspacePlacements(
    nextPlacements
  );

  await saveWorkspaceLayout(
    nextPlacements
  );

  /*
   * RETURN consumes the snapshot.
   *
   * A future BOARD / RECALL operation
   * captures a new one.
   */
  delete (
    containerReturnSnapshotsRef
      .current[
        containerId
      ]
  );
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

/*
 * Only capture the starting arrangement
 * once for this temporary operation.
 *
 * Repeated BOARD presses must not replace
 * the original RETURN destination.
 */
if (
  !hasContainerReturnSnapshot(
    container
  )
) {
  captureContainerReturnSnapshot({
    container,
    childIds
  });
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

/*
 * Same doctrine as BOARD:
 *
 * preserve the arrangement that existed
 * before this temporary operation.
 */
if (
  !hasContainerReturnSnapshot(
    container
  )
) {
  captureContainerReturnSnapshot({
    container,

    childIds: [
      ...childIds
    ]
  });
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

function selectBoardSkin(nextSkinId) {
  const next =
    normalizeIXIAosBoardSkinId(
      nextSkinId
    );

  setBoardSkinId(
    writeIXIAosBoardSkinId(next)
  );

  saveWorkspaceSettings({
    boardSkinId: next
  });

  captureIXEvent(
    "aos_board_skin_selected",
    {
      boardSkinId: next,
      page: "aos-work"
    }
  );
}
  
function saveWorkspaceLayout(
  nextContainers = workspacePlacements
) {
  const persistLayout = () =>
    saveIxiMachinePatch({
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

  /*
   * Workspace writes must reach IX Core in the same order as the
   * gestures that produced them. A late response from an older move
   * must never overwrite the newest Board/container placement.
   */
  const queuedSave =
    workspaceLayoutSaveQueueRef.current
      .catch(() => null)
      .then(persistLayout);

  workspaceLayoutSaveQueueRef.current =
    queuedSave;

  return queuedSave;
}


const {
  createRootContainerDraft,
  createChildContainerDraft,
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

  
function updateCardScaleMode(nextMode) {
  setCardScaleMode(current => {
    if (nextMode === current) {
      return current;
    }

    const next =
      writeSitewideCardScaleMode(nextMode);

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
async function createRootContainerFromTemplate(
  template
) {
  const result =
    createRootContainerDraft({
      template
    });

  const draftId =
    String(result?.objectId || "").trim();

  if (!draftId) {
    throw new Error(
      "AOS did not return the new draft identity."
    );
  }

  updateIxiCardState(draftId, {
    color: "none",
    outline: 1,
    face: 1,
    actionNotice: null
  });

  closeSystemObjectTemplatePicker();

  return result;
}


async function createChildContainerFromTemplate(
  template
) {
  const parentObject =
    systemObjectPickerParent;

  if (!parentObject) {
    throw new Error(
      "Select the parent AOS card again."
    );
  }

  const result =
    createChildContainerDraft({
      container:
        parentObject,
      template
    });

  const draftId =
    String(result?.objectId || "").trim();

  if (!draftId) {
    throw new Error(
      "AOS did not return the new child draft identity."
    );
  }

  updateIxiCardState(draftId, {
    color: "none",
    outline: 1,
    face: 1,
    actionNotice: null
  });

  closeSystemObjectTemplatePicker();

  return result;
}


function openSystemObjectTemplatePicker(
  parentObject = null
) {
  setSystemObjectPickerParent(
    parentObject || null
  );
  setSystemObjectPickerOpen(true);
}


function closeSystemObjectTemplatePicker() {
  setSystemObjectPickerOpen(false);
  setSystemObjectPickerParent(null);
}


function createSelectedContainerTemplate(
  template
) {
  return systemObjectPickerParent
    ? createChildContainerFromTemplate(
        template
      )
    : createRootContainerFromTemplate(
        template
      );
}


const saveAosWorkspaceObjectOrDraft =
  useCallback(async (payload = {}) => {
    const objectId =
      String(
        payload?.objectId ||
        payload?.object?.objectId ||
        ""
      ).trim();

    if (isAosDraftId(objectId)) {
      return saveMosObjectName({
        objectId,
        displayName:
          payload?.displayName ||
          payload?.object?.displayName,
        businessIdentifiers:
          payload?.businessIdentifiers ||
          payload?.object?.businessIdentifiers,
        fields:
          payload?.fields ||
          payload?.object?.fields,
        fieldDefinitions:
          payload?.fieldDefinitions ||
          payload?.object?.fieldDefinitions,
        media:
          payload?.media ||
          payload?.object?.media,
        metadata: {
          ...(payload?.object?.metadata || {}),
          ...(payload?.metadata || {})
        }
      });
    }

    return saveAosWorkspaceObject(
      payload
    );
  }, [
    saveAosWorkspaceObject,
    saveMosObjectName
  ]);


/* Card + selects presentation before opening a contained draft. */
function openChildContainerTemplatePicker(
  parentObject
) {
  openSystemObjectTemplatePicker(
    parentObject
  );
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

async function handleWorkspaceDragEnd(event) {
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
  const targetWorkspaceObjectId = String(
    overData.targetObjectId || ""
  ).trim();
  const targetWorkspaceObject =
    getAosWorkspaceObjectById(targetWorkspaceObjectId);
  const targetIsCanonicalContainer = Boolean(
    targetWorkspaceObjectId &&
    targetWorkspaceObject?.entityId
  );

  if (targetIsCanonicalContainer) {
    const previousPlacements =
      workspacePlacements;

    let sourceObject = null;

    try {
      sourceObject =
        getCanonicalMosObjectForWorkspaceId(dragId);
    } catch (error) {
      showAosObjectNotice({
        objectId: dragId,
        message: error?.message || "IX CORE IDENTITY CONFLICT",
        tone: "error",
        duration: 4200
      });
      setActiveDndId(null);
      clearMachineDragState?.();
      return;
    }

    if (!sourceObject?.objectId) {
      showAosObjectNotice({
        objectId: dragId,
        message: isAosDraftId(dragId)
          ? "SAVE THIS CARD BEFORE MOVING IT INTO ANOTHER CONTAINER"
          : "MOVE BLOCKED · THE EXISTING IX CORE OBJECT COULD NOT BE RESOLVED",
        tone: "error",
        duration: 4200
      });
      setActiveDndId(null);
      clearMachineDragState?.();
      return;
    }

    nextPlacements =
      moveObjectToWorkspaceSurface({
        placements:
          workspacePlacements,

        objectId:
          dragId,

        targetSurface:
          dropTargetSurface
      });

    /*
     * ONE OBJECT / MANY RELATIONSHIPS / ONE VISUAL PLACEMENT
     *
     * The gesture owns the visible result. Land the card and release the
     * drag immediately. The listing ID remains the visual card identity.
     * Persistence creates only an idempotent, non-exclusive relationship
     * between the existing Objects; it never provisions, clones, checks in,
     * checks out, or rewrites the legacy exclusive-parent field.
     */
    setWorkspacePlacements(
      nextPlacements
    );

    setIxiCardState(current => ({
      ...current,
      [IXI_AOS_WORK_LAYOUT_ID]: {
        ...(current?.[IXI_AOS_WORK_LAYOUT_ID] || {}),
        workspacePlacements:
          nextPlacements,
        machineContainers:
          nextPlacements,
        updatedAt:
          Date.now()
      }
    }));

    setActiveDndId(null);
    clearMachineDragState?.();

    void (async () => {
      try {
        const relationshipResponse = await createMosRelationship({
          sourceObjectId: targetWorkspaceObjectId,
          targetObjectId: sourceObject.objectId,
          relationshipType: "contains",
          metadata: {
            createdFrom: "aos-work-drop",
            sourceWorkspaceObjectId: dragId,
            targetWorkspaceObjectId
          }
        });

        const relationship = relationshipResponse?.relationship;
        if (!relationship?.relationshipId) {
          const error = new Error(
            "IX CORE DID NOT CONFIRM THE CONTAINER RELATIONSHIP"
          );
          error.code = "IXI_AOS_RELATIONSHIP_READBACK_REQUIRED";
          throw error;
        }

        setAosRelationships(current => [
          ...(current || []).filter(item =>
            String(item?.relationshipId || "") !==
              String(relationship.relationshipId)
          ),
          relationship
        ]);

        let layoutResult = null;
        try {
          layoutResult = await saveWorkspaceLayout(nextPlacements);
        } catch (layoutError) {
          console.error("AOS SESSION PLACEMENT SAVE FAILED:", layoutError);
        }
        if (!layoutResult) {
          showAosObjectNotice({
            objectId: dragId,
            message: "RELATIONSHIP SAVED · SESSION PLACEMENT SAVE NEEDS RETRY",
            tone: "error",
            duration: 4200
          });
          return;
        }

        showAosObjectNotice({
          objectId: dragId,
          message: "RELATIONSHIP CONFIRMED · ONE OBJECT · ONE PASSPORT",
          tone: "success",
          duration: 2200
        });
      } catch (error) {
        console.error("AOS CONTAINER RELATIONSHIP FAILED:", error);

        /* A real IX Core rejection restores the exact pre-drop state. */
        setWorkspacePlacements(
          previousPlacements
        );

        setIxiCardState(current => ({
          ...current,
          [IXI_AOS_WORK_LAYOUT_ID]: {
            ...(current?.[IXI_AOS_WORK_LAYOUT_ID] || {}),
            workspacePlacements:
              previousPlacements,
            machineContainers:
              previousPlacements,
            updatedAt:
              Date.now()
          }
        }));

        void saveWorkspaceLayout(
          previousPlacements
        );

        showAosObjectNotice({
          objectId: dragId,
          message: error?.message || "IX Core could not confirm this relationship.",
          tone: "error",
          duration: 3200
        });
      }
    })();

    return;
  }

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

void saveWorkspaceLayout(
  nextPlacements
).then(layoutResult => {
  if (layoutResult) return;

  showAosObjectNotice({
    objectId: dragId,
    message:
      "WORKSPACE LAYOUT SAVE FAILED · YOUR CARD REMAINS WHERE YOU DROPPED IT",
    tone: "error",
    duration: 4200
  });
}).catch(error => {
  console.error(
    "AOS WORKSPACE LAYOUT SAVE FAILED:",
    error
  );
});

/*
 * Keep the hydrated remote-state mirror current. This prevents a later
 * local reconciliation in the same session from reapplying the layout
 * that existed before the drop.
 */
setIxiCardState(current => ({
  ...current,
  [IXI_AOS_WORK_LAYOUT_ID]: {
    ...(current?.[IXI_AOS_WORK_LAYOUT_ID] || {}),
    workspacePlacements: nextPlacements,
    machineContainers: nextPlacements,
    updatedAt: Date.now()
  }
}));

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
    cardContext="inventory"
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
 * DURABLE AOS OBJECT
 *
 * Preserve the real AOS card while
 * dragging. Do not fall back to the
 * legacy ListingCard overlay.
 */
if (
  object?.objectId &&
  String(
    object?.objectType || ""
  )
    .trim()
    .toLowerCase() !==
    "machine"
) {
  const parentObject =
    object?.directContainerId
      ? getAosWorkspaceObjectById?.(
          object.directContainerId
        )
      : null;

  const parentLabel =
    resolveAosWorkspaceParentName({
      object,
      parentObject
    });

  const directChildren =
    (aosObjects || [])
      .filter(child =>
        String(
          child?.directContainerId ||
          ""
        ) ===
        String(
          objectId
        )
      );

  return (
    <IXIAosOperatingCardRuntime
      object={
        object
      }

      items={
        directChildren
      }

      parentLabel={
        parentLabel
      }

      dragHandleProps={{}}

      ixiState={
        ixiCardState[
          objectId
        ] || {
          color: "none",
          outline: 1,
          face: 1,
          actionNotice: null
        }
      }

      /*
       * Overlay is presentation only.
       */
      onIxiStateChange={() => {}}

      armedDestination=""

      onExposeObject={() => {}}
      onSaveObject={null}
      onAddObject={null}
      onDeleteObject={null}
    />
  );
}

/*
 * Actual IronXchange machine/listing uses the current machine-card
 * runtime through the Board renderer; no legacy overlay is mounted.
 */
return null;
}}
    activeDndId={activeDndId}
    savedIds={savedIds}
    ixiCardState={ixiCardState}
    cardScaleMode={cardScaleMode}
  >
 <main
  className={`aos-work-board ${boardSkin.className}`}
  data-ixi-board-skin={boardSkin.skinId}
 >
  <h1 className="aos-work-board-title">IXI AOS WORK</h1>
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
  () => openSystemObjectTemplatePicker()
}
  onMore={() => {
    setBoardSkinPickerOpen(
      current => !current
    );
  }}
  moreExpanded={boardSkinPickerOpen}
/>

<IXIAosBoardSkinPicker
  open={boardSkinPickerOpen}
  selectedSkinId={boardSkinId}
  onSelect={selectBoardSkin}
  onClose={() => setBoardSkinPickerOpen(false)}
/>

<IXIAosSystemObjectTemplatePicker
  open={systemObjectPickerOpen}
  entityId={aosEntity?.entityId || null}
  parentObject={systemObjectPickerParent}
  onClose={closeSystemObjectTemplatePicker}
  onCreate={createSelectedContainerTemplate}
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
    openChildContainerTemplatePicker
  }

onExposeContainerChildren={
  boardContainerChildren
}

onGatherContainerChildren={
  recallContainerChildren
}

onReturnContainerChildren={
  returnContainerChildren
}

onClearContainerToParent={
  clearContainerChildrenToParent
}

  onCreateObjectChild={
  openChildContainerTemplatePicker
}

  onSaveObject={
    saveAosWorkspaceObjectOrDraft
  }

  onDeleteObject={
    deleteMosWorkspaceObject
  }
/>
    
<IXICardScaleControl
  value={cardScaleMode}
  onChange={updateCardScaleMode}
  surfaceLabel="AOS Work"
/>

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
          font-family: 'Inter Variable', Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #0b0b0b;
          color: #d6d6d6;
        }

      main {
          min-height: 100vh;
          padding: 14px 5% 160px;
          position: relative;
          isolation: isolate;
          background-color: #090a0a;
          background-position: center top;
          background-repeat: repeat-y;
          background-size: 100% auto;
        }

        .aos-work-board-skin-v12 {
          background-color: #050606;
          background-image: none;
        }

        .aos-work-board-skin-ixi-101 {
          background-color: #090a0a;
          background-image: url('/images/ixi-aos-board-ixi-101.webp');
        }

        .aos-work-board-skin-ixi-102 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-102.webp');
        }

        .aos-work-board-skin-ixi-103 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-103.webp');
        }

        .aos-work-board-skin-ixi-104 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-104.webp');
        }

        .aos-work-board-skin-ixi-105 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-105.webp');
        }

        .aos-work-board-skin-ixi-106 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-106.webp');
        }

        .aos-work-board-skin-ixi-107 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-107.webp');
        }

        .aos-work-board-skin-ixi-108 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-108.webp');
        }

        .aos-work-board-skin-ixi-109 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-109.webp');
        }

        .aos-work-board-skin-ixi-110 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-110.webp');
        }

        .aos-work-board-skin-ixi-111 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-111.webp');
        }

        .aos-work-board-skin-ixi-112 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-112.webp');
        }

        .aos-work-board-skin-ixi-113 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-113.webp');
        }

        .aos-work-board-skin-ixi-114 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-114.webp');
        }

        .aos-work-board-skin-ixi-115 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-115.webp');
        }

        .aos-work-board-skin-ixi-116 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-116.webp');
        }

        .aos-work-board-skin-ixi-117 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-117.webp');
        }

        .aos-work-board-skin-ixi-118 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-118.webp');
        }

        .aos-work-board-skin-ixi-119 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-119.webp');
        }

        .aos-work-board-skin-ixi-120 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-120.webp');
        }

        .aos-work-board-skin-ixi-121 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-121.webp');
        }

        .aos-work-board-skin-ixi-122 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-122.webp');
        }

        .aos-work-board-skin-ixi-123 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-123.webp');
        }

        .aos-work-board-skin-ixi-124 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-124.webp');
        }

        .aos-work-board-title {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
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
.mobile-search-surface {
  display: none;
}

.desktop-search-surface {
  display: block;
}
@media (max-width: 850px) {
  main {
    padding: 18px 4% 48px;
    background-size: auto 100vh;
    background-position: center top;
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
