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
  applyAosWorkspaceSessionCommand,
  commitMosObjectCommand,
  createMosCommandId,
  createMosRelationship,
  endAosWorkspaceSession,
  fetchAosWorkspaceSession,
  openAosWorkspaceSession
} from "../../lib/mos/ixiMosClient";

import {
  buildAosCanonicalAdmission
} from "../../lib/mos/ixiAosCanonicalAdmission.mjs";

import {
  createAosMembershipRelationship,
  createAosRailOrderKey,
  getAosRailProjectionObjectIds,
  getAosMembershipObjectIds
} from "../../lib/mos/IXIAosMembershipBridge.mjs";

import {
  isIXIAosWorkspaceVisibleAdapter
} from "../../lib/mos/IXIAosSystemAdapterRegistry";

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
  createAosWorkspaceSessionController,
  locateWorkspaceObject
} from "../../components/ixi-mos/workspace/IXIAosWorkspaceSessionController.mjs";

import {
  resolveAosWorkspaceParentName
} from "../../lib/mos/ixiAosHierarchyContract.mjs";

import { getListingId } from "../../lib/listingFormatters";
import {
  saveIxiMachinePatch,
} from "../../lib/ixiMachineStateClient";

import {
  hydrateIXIListingCollection
} from "../../lib/listings/hydrateIXIListingMedia";

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

const IXI_AOS_WORK_SETTINGS_ID =
  "__ixi_aos_work_settings__";

const AOS_SESSION_ONLY_CARD_KEYS = new Set([
  "container",
  "sourceParentId",
  "sourceParentType",
  "sourceDeckId",
  "checkedOutFromParent",
  "checkedOutMachineIds",
  "checkoutReason",
  "checkoutAt"
]);

function stripAosSessionOnlyCardState(record = {}) {
  return Object.fromEntries(
    Object.entries(record || {}).filter(([key]) =>
      !AOS_SESSION_ONLY_CARD_KEYS.has(key)
    )
  );
}

import {
  getMachineContainerFromContainers,
  reorderMachineWithinContainerState,
  moveMachineToContainerAtPositionState,
  moveMachineToContainerState
} from "../../components/ixi-chassis/IXIMachineContainerEngine";

import {
  createEmptyWorkspacePlacements,
  getObjectWorkspaceSurface,
  moveObjectToWorkspaceSurface,
  moveObjectToWorkspacePosition,
  reorderObjectWithinWorkspaceSurface,
  resolveWorkspaceObjects
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
  const [listings, setListings] = useState([]);

const [aosEntity, setAosEntity] =
  useState(null);

const [aosAccount, setAosAccount] =
  useState(null);

const [aosPrincipal, setAosPrincipal] =
  useState(null);

const [aosWorkspaceSession, setAosWorkspaceSession] =
  useState(null);

const [workspaceSessionReady, setWorkspaceSessionReady] =
  useState(false);

const [workspaceScopeRequest, setWorkspaceScopeRequest] =
  useState(null);

const [aosObjects, setAosObjects] =
  useState([]);

const [aosRelationships, setAosRelationships] =
  useState([]);

const [aosRailProjections, setAosRailProjections] =
  useState({});

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedScope =
      String(params.get("placementScope") || "personal").toLowerCase();
    const sharedScopeId =
      String(params.get("sharedScopeId") || "").trim();

    setWorkspaceScopeRequest(
      requestedScope === "shared"
        ? { placementScope: "shared", sharedScopeId }
        : { placementScope: "personal", sharedScopeId: null }
    );
  }, []);

  const workspaceSessionControllerRef = useRef(null);
  const containerReturnSnapshotsRef = useRef({});
  
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
  let cancelled = false;

  async function loadAosWorkEnvironment() {
    try {
      const environment =
        await loadIXIMosEnvironment({
          includeObjects: true
        });

      if (cancelled) {
        return;
      }

      const listingEnvironment =
        environment?.listingEnvironment || {};

      const currentUser =
        listingEnvironment?.currentUser || null;

      const userId =
        String(environment?.userId || "guest");

      const remoteIxiState =
        listingEnvironment?.ixiState || {};

      const nextWorkspaceSettings =
        listingEnvironment?.workspaceSettings || {};

      const ownedListings =
        Array.isArray(environment?.ownedListings)
          ? environment.ownedListings
          : [];

      setSdk(listingEnvironment?.sdk || null);
      setAosCurrentUser(currentUser);
      setIxiUserId(userId);
      setSavedIds(
        Array.isArray(listingEnvironment?.savedIds)
          ? listingEnvironment.savedIds
          : []
      );
      setListings(ownedListings);
      setWorkspaceSettings(nextWorkspaceSettings);

      setBoardSkinId(
        nextWorkspaceSettings.boardSkinId
          ? writeIXIAosBoardSkinId(
              nextWorkspaceSettings.boardSkinId
            )
          : readIXIAosBoardSkinId()
      );

      setIxiCardState(Object.fromEntries(
        Object.entries(remoteIxiState).map(([id, record]) => [
          id,
          stripAosSessionOnlyCardState(record)
        ])
      ));

      setCardScaleMode(
        resolveSitewideCardScaleMode(
          nextWorkspaceSettings.cardScaleMode
        )
      );

      setAosEntity(
        environment?.entity || null
      );

      setAosAccount(
        environment?.account || null
      );

      setAosPrincipal(
        environment?.principal || null
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

      setAosRailProjections(
        environment?.railProjections &&
        typeof environment.railProjections === "object"
          ? environment.railProjections
          : {}
      );

setSystemIndexes(
  Array.isArray(
    environment?.systemIndexes
  )
    ? environment.systemIndexes
    : []
);

      /*
       * Machine cards are already usable from the account-listings payload.
       * Enrich their media once, in the background, without delaying AOS.
       */
      void hydrateIXIListingCollection(
        ownedListings,
        {
          dedupeRequests: true,
          concurrency: 4
        }
      ).then(hydratedListings => {
        if (!cancelled) {
          setListings(hydratedListings);
        }
      }).catch(error => {
        console.warn(
          "IXI AOS BACKGROUND MEDIA HYDRATION FAILED:",
          error
        );
      });
    } catch (error) {
      console.error(
        "IXI AOS WORK ENVIRONMENT LOAD FAILED:",
        error
      );
      if (!cancelled) {
        setSavedIds([]);
      }
    }
  }

  void loadAosWorkEnvironment();

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

const aosCanonicalAdmission = useMemo(
  () => buildAosCanonicalAdmission({
    aosObjects,
    workspaceListings
  }),
  [aosObjects, workspaceListings]
);

const canonicalSavedObjectIds = useMemo(
  () => savedIds
    .map(alias => aosCanonicalAdmission.resolveObjectId(alias))
    .filter(Boolean),
  [savedIds, aosCanonicalAdmission]
);

  
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
        aosCanonicalAdmission.resolveObjectId(getListingId(item)) === String(id)
      )
    )
    .filter(Boolean);
    
   const filtered = orderedSource.filter(item => {
  const id = aosCanonicalAdmission.resolveObjectId(getListingId(item));

  if (!id) return false;

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
  ixiOutlineFilter,
  aosCanonicalAdmission
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
            ""
          );

        if (!objectId) {
          return null;
        }

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
    /* Durable relationship previews remain visible while the one operating
     * card moves between workspace surfaces. */
    return equipmentIndex;
  }, [
    equipmentIndex
  ]);

  const {
  admission:
    aosWorkspaceAdmission,

  objectRegistry:
    aosWorkspaceObjectRegistry,

  boardItems:
    aosBoardItems
} = useIXIAosWorkspaceRegistry({
  canonicalAdmission:
    aosCanonicalAdmission,

  workspaceListings,

  aosObjects,

  relationships:
    aosRelationships,

  railProjections:
    aosRailProjections,

  workspaceSystemIndexes,

  equipmentWorkspaceIndex,

  workspacePlacements,

  visibleSavedListings
});

useEffect(() => {
  const tenantId = String(aosAccount?.tenantId || "").trim();
  const principalId = String(aosPrincipal?.principalId || "").trim();
  const entityId = String(aosEntity?.entityId || "").trim();
  const placementScope = workspaceScopeRequest?.placementScope;
  const sharedScopeId = workspaceScopeRequest?.sharedScopeId || null;

  if (!tenantId || !principalId || !entityId || !placementScope) return undefined;
  if (placementScope === "shared" && !sharedScopeId) {
    console.error("IXI AOS SHARED WORKSPACE REQUIRES A SHARED SCOPE ID");
    return undefined;
  }

  let cancelled = false;
  setWorkspaceSessionReady(false);

  const controller = createAosWorkspaceSessionController({
    transport: {
      open: openAosWorkspaceSession,
      read: fetchAosWorkspaceSession,
      command: applyAosWorkspaceSessionCommand,
      end: endAosWorkspaceSession
    },
    relationshipTransport: request => createAosMembershipRelationship({
      createRelationship: createMosRelationship,
      ...request
    }),
    createCommandId: createMosCommandId,
    initialSurfaces: {
      ...createEmptyWorkspacePlacements(),
      indexEquipment: []
    },
    onSession: session => {
      if (!cancelled) setAosWorkspaceSession(session);
    },
    onPlacements: placements => {
      if (!cancelled) setWorkspacePlacements(placements);
    },
    onError: error => {
      console.error("IXI AOS SESSION PLACEMENT FAILED:", error);
    }
  });

  workspaceSessionControllerRef.current = controller;
  void controller.open({
    workspaceId: "aos-work",
    placementScope,
    sharedScopeId,
    ttlMs: 8 * 60 * 60 * 1000
  }).catch(error => {
    if (!cancelled) {
      console.error("IXI AOS WORKSPACE SESSION OPEN FAILED:", error);
      setWorkspaceSessionReady(false);
    }
  });

  return () => {
    cancelled = true;
    if (workspaceSessionControllerRef.current === controller) {
      workspaceSessionControllerRef.current = null;
    }
  };
}, [
  aosAccount?.tenantId,
  aosPrincipal?.principalId,
  aosEntity?.entityId,
  workspaceScopeRequest?.placementScope,
  workspaceScopeRequest?.sharedScopeId
]);

useEffect(() => {
  const controller = workspaceSessionControllerRef.current;
  if (!controller || !aosWorkspaceSession?.sessionId) return;

  const objects = [...aosWorkspaceAdmission.objectsById.values()];
  const equipmentObjectId = String(equipmentIndex?.objectId || "").trim();
  const projectedOwnerByMember = new Map();

  Object.keys(aosRailProjections || {}).forEach(ownerObjectId => {
    getAosRailProjectionObjectIds({
      railOwnerObjectId: ownerObjectId,
      railProjections: aosRailProjections,
      admission: aosWorkspaceAdmission
    }).forEach(memberObjectId => {
      if (!projectedOwnerByMember.has(memberObjectId)) {
        projectedOwnerByMember.set(memberObjectId, ownerObjectId);
      }
    });
  });

  const orderBySurface = new Map();
  const descriptors = objects
    .filter(isIXIAosWorkspaceVisibleAdapter)
    .map(object => {
    const objectId = String(object?.objectId || "").trim();
    const existing = locateWorkspaceObject(controller.readPlacements(), objectId);
    const railOwnerObjectId = projectedOwnerByMember.get(objectId);
    let surfaceId = existing?.surfaceId || "board";
    let operatingState = "operating";

    if (!existing && railOwnerObjectId && railOwnerObjectId !== equipmentObjectId) {
      surfaceId = `container:${railOwnerObjectId}`;
      operatingState = "tucked";
    } else if (
      !existing &&
      object?.presentation?.kind === "ixi-private-machine" &&
      equipmentObjectId
    ) {
      surfaceId = "indexEquipment";
      operatingState = "tucked";
    } else if (surfaceId.startsWith("container:") || surfaceId === "indexEquipment") {
      operatingState = "tucked";
    } else if (surfaceId.startsWith("rail:")) {
      operatingState = "preview";
    }

    const visualOrder = existing?.visualOrder ?? (orderBySurface.get(surfaceId) || 0);
    orderBySurface.set(surfaceId, visualOrder + 1);
    return {
      objectId,
      surfaceId,
      visualOrder,
      operatingState,
      activeSummonedContext: railOwnerObjectId || null
    };
  }).filter(descriptor => descriptor.objectId.startsWith("object_"));

  void controller.admitObjects(descriptors).then(() => {
    setWorkspaceSessionReady(true);
  }).catch(error => {
    console.error("IXI AOS CANONICAL SESSION ADMISSION FAILED:", error);
    setWorkspaceSessionReady(false);
  });
}, [
  aosWorkspaceSession?.sessionId,
  aosWorkspaceAdmission,
  equipmentIndex?.objectId,
  aosRailProjections
]);

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
      ?.get(
        aosWorkspaceAdmission.resolveObjectId(id)
      ) ||
    null
  );
}

function getCanonicalMosObjectForWorkspaceId(workspaceObjectId) {
  const id = String(workspaceObjectId || "").trim();
  if (!id) return null;

  return aosWorkspaceAdmission.resolveObject(id);
}

function getWorkspaceIdForCanonicalObject(object = {}) {
  return String(object?.objectId || "").trim();
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
      ? aosWorkspaceAdmission.resolveObjectId(getListingId(listingOrId))
      : aosWorkspaceAdmission.resolveObjectId(listingOrId);

  if (!id) return;

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

  const nextIxiCardState = Object.fromEntries(
    Object.entries(result.nextIxiCardState || ixiCardState).map(([id, record]) => [
      id,
      stripAosSessionOnlyCardState(record)
    ])
  );

  const nextMachineContainers =
    result.nextMachineContainers || machineContainers;

  setIxiCardState(nextIxiCardState);
  setMachineContainers(nextMachineContainers);

  const patches = Array.isArray(result.patchesToPersist)
    ? result.patchesToPersist
    : [];

  patches.forEach(item => {
    if (!item?.listingId) return;

    const patch = stripAosSessionOnlyCardState(item.patch || {});
    const meaningfulKeys = Object.keys(patch).filter(key =>
      !["touched", "updatedAt"].includes(key)
    );
    if (!meaningfulKeys.length) return;

    saveIxiMachinePatch({
      userId: ixiUserId,
      listingId: item.listingId,
      patch
    });
  });

  const completion = saveWorkspaceLayout(nextMachineContainers);
  void completion.catch(error => {
    console.error("AOS WORKSPACE TRANSACTION FAILED:", error);
  });
  return completion;
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

  executeIXITransaction,

  onSummonObject: objectId => {
    const contextObjectId = String(equipmentIndex?.objectId || "").trim();
    const controller = workspaceSessionControllerRef.current;
    if (!controller || !contextObjectId) return null;
    return controller.summon(objectId, contextObjectId);
  },

  resolveCanonicalObjectId:
    aosCanonicalAdmission.resolveObjectId
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
      aosWorkspaceAdmission.resolveObjectId(
        item?.objectId || getListingId(item) || item?.passportId
      )
    )
    .filter(Boolean);
}

  const relationshipChildIds = getAosMembershipObjectIds({
    parentObjectId: containerId,
    relationships: aosRelationships,
    admission: aosWorkspaceAdmission
  }).filter(objectId => aosWorkspaceObjectRegistry.has(objectId));

  const projectedChildIds = getAosRailProjectionObjectIds({
    railOwnerObjectId: containerId,
    railProjections: aosRailProjections,
    admission: aosWorkspaceAdmission
  }).filter(objectId => aosWorkspaceObjectRegistry.has(objectId));

  return [...new Set([
    ...projectedChildIds,
    ...relationshipChildIds,
  ])];
}

/* ---------- UNIVERSAL AOS SESSION BOARD / RECALL / RETURN ---------- */
function getContainerObjectId(container) {
  const target = container?.container || container;
  return String(target?.objectId || target?.id || "").trim();
}

function getContainerRequestedChildIds(request) {
  const childObjectId = aosWorkspaceAdmission.resolveObjectId(
    request?.child?.objectId ||
    request?.child?.passportId ||
    getListingId(request?.child || {})
  );
  return childObjectId
    ? [childObjectId]
    : getDirectContainerChildIds(request?.container || request);
}

function getContainerReturnSnapshot(container) {
  const containerId = getContainerObjectId(container);
  const local = containerReturnSnapshotsRef.current[containerId];
  if (local?.operationId) return local;

  const childIds = getDirectContainerChildIds(container?.container || container);
  const byOperation = new Map();
  childIds.forEach(objectId => {
    const operationId = String(
      aosWorkspaceSession?.objects?.[objectId]?.returnSnapshot?.operationId || ""
    ).trim();
    if (!operationId) return;
    if (!byOperation.has(operationId)) byOperation.set(operationId, []);
    byOperation.get(operationId).push(objectId);
  });
  if (byOperation.size !== 1) return null;
  const [[operationId, snapshotChildIds]] = byOperation;
  return { operationId, childIds: snapshotChildIds };
}

function hasContainerReturnSnapshot(container) {
  return Boolean(getContainerReturnSnapshot(container)?.operationId);
}

async function returnContainerChildren(container) {
  const containerId = getContainerObjectId(container);
  const snapshot = getContainerReturnSnapshot(container);
  const controller = workspaceSessionControllerRef.current;
  if (!containerId || !snapshot?.operationId || !controller) return;

  await controller.undo(snapshot.operationId);
  delete containerReturnSnapshotsRef.current[containerId];
}

async function boardContainerChildren(container) {
  const containerId = getContainerObjectId(container);
  const childIds = getContainerRequestedChildIds(container);
  const controller = workspaceSessionControllerRef.current;
  if (
    !containerId ||
    !childIds.length ||
    !controller ||
    hasContainerReturnSnapshot(container)
  ) {
    return;
  }

  let nextPlacements = controller.readPlacements();
  childIds.forEach(objectId => {
    nextPlacements = moveObjectToWorkspaceSurface({
      placements: nextPlacements,
      objectId,
      targetSurface: "board"
    });
  });

  const operationId = createMosCommandId("aos-board");
  containerReturnSnapshotsRef.current[containerId] = {
    operationId,
    childIds: [...childIds]
  };

  const boarded = controller.persistLayout(nextPlacements, {
    operationId,
    objectIds: childIds,
    activeSummonedContext: containerId
  });

  try {
    await boarded.completion;
  } catch (error) {
    delete containerReturnSnapshotsRef.current[containerId];
    throw error;
  }
}

async function recallContainerChildren(container) {
  const containerId = getContainerObjectId(container);
  const childIds = getContainerRequestedChildIds(container);
  const controller = workspaceSessionControllerRef.current;
  if (
    !containerId ||
    !childIds.length ||
    !controller ||
    hasContainerReturnSnapshot(container)
  ) {
    return;
  }

  const targetSurface =
    String(container?.indexId || "").trim() === "equipment"
      ? "indexEquipment"
      : `container:${containerId}`;
  let recalledPlacements = controller.readPlacements();
  childIds.forEach(objectId => {
    recalledPlacements = moveObjectToWorkspaceSurface({
      placements: recalledPlacements,
      objectId,
      targetSurface
    });
  });

  const operationId = createMosCommandId("aos-container-recall");
  containerReturnSnapshotsRef.current[containerId] = {
    operationId,
    childIds: [...childIds]
  };

  const recalled = controller.persistLayout(recalledPlacements, {
    operationId,
    objectIds: childIds
  });

  try {
    await recalled.completion;
  } catch (error) {
    delete containerReturnSnapshotsRef.current[containerId];
    throw error;
  }
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
  return aosWorkspaceAdmission.resolveObject(machineId);
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
        item => aosWorkspaceAdmission.resolveObjectId(getListingId(item)) === String(dragId)
      );

      const toIndex = source.findIndex(
        item => aosWorkspaceAdmission.resolveObjectId(getListingId(item)) === String(targetId)
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
  const listingId = aosWorkspaceAdmission.resolveObjectId(
    listing?.objectId || getListingId(listing)
  );

  if (!listingId) return;

  const result = IXI_COMMANDS.moveObjectToContainerStart({
    objectId: listingId,
    containerKey: "board",
    ixiCardState,
    machineContainers
  });

  executeIXITransaction(result);
}

function sendListingToBack(listing) {
  const listingId = aosWorkspaceAdmission.resolveObjectId(
    listing?.objectId || getListingId(listing)
  );

  if (!listingId) return;

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
  nextContainers = workspacePlacements,
  options = {}
) {
  const controller = workspaceSessionControllerRef.current;
  if (!controller || !workspaceSessionReady) {
    const error = new Error("Authenticated AOS workspace session is not ready.");
    error.code = "WORKSPACE_SESSION_NOT_READY";
    return Promise.reject(error);
  }

  const operation = controller.persistLayout(nextContainers, options);
  return operation.completion;
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
    const requestedMachineId =
      String(
        dragData.objectId ||
        active?.id ||
        ""
      );

    const machineId =
      aosWorkspaceAdmission.resolveObjectId(requestedMachineId);

    if (!machineId) {
      showAosObjectNotice({
        objectId: requestedMachineId,
        message: "MOVE BLOCKED · PRIVATE CARD NEEDS ITS EXISTING IX CORE IDENTITY LINK",
        tone: "error",
        duration: 4200
      });
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

    if (
      sourceObject?.actorAuthority?.canRelate !== true ||
      targetWorkspaceObject?.actorAuthority?.canRelate !== true
    ) {
      showAosObjectNotice({
        objectId: dragId,
        message: "RELATIONSHIP NOT AUTHORIZED",
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
     * drag immediately. Canonical objectId remains the operating identity.
     * Persistence creates only an idempotent, non-exclusive relationship
     * between the existing Objects; it never provisions, clones, checks in,
     * checks out, or rewrites the legacy exclusive-parent field.
     */
    setActiveDndId(null);
    clearMachineDragState?.();

    const memberPassportId = String(
      sourceObject?.canonicalIdentity?.passportId ||
      sourceObject?.passportId ||
      ""
    ).trim();
    const parentPassportId = String(
      targetWorkspaceObject?.canonicalIdentity?.passportId ||
      targetWorkspaceObject?.passportId ||
      ""
    ).trim();
    const railPosition = Math.max(
      0,
      (nextPlacements?.[dropTargetSurface] || []).indexOf(sourceObject.objectId)
    );
    const controller = workspaceSessionControllerRef.current;

    if (!memberPassportId || !parentPassportId || !controller || !workspaceSessionReady) {
      showAosObjectNotice({
        objectId: dragId,
        message: "CANONICAL SESSION AND PASSPORT ADMISSION IS REQUIRED BEFORE RELATING CARDS",
        tone: "error",
        duration: 4200
      });
      return;
    }

    const operation = controller.connect({
      nextPlacements,
      objectId: sourceObject.objectId,
      relationship: {
        parentObjectId: targetWorkspaceObjectId,
        parentPassportId,
        memberObjectId: sourceObject.objectId,
        memberPassportId,
        orderKey: createAosRailOrderKey(railPosition)
      }
    });

    void operation.completion.then(result => {
      const relationship = result?.response?.relationship;
      if (!relationship?.relationshipId) {
        const error = new Error("IX CORE DID NOT CONFIRM THE CONTAINER RELATIONSHIP");
        error.code = "IXI_AOS_RELATIONSHIP_READBACK_REQUIRED";
        throw error;
      }
      setAosRelationships(current => [
        ...(current || []).filter(item =>
          String(item?.relationshipId || "") !== String(relationship.relationshipId)
        ),
        relationship
      ]);
      showAosObjectNotice({
        objectId: dragId,
        message: "RELATIONSHIP CONFIRMED · ONE OBJECT · ONE PASSPORT",
        tone: "success",
        duration: 2200
      });
    }).catch(error => {
      console.error("AOS CONTAINER RELATIONSHIP FAILED:", error);
      showAosObjectNotice({
        objectId: dragId,
        message: error?.message || "IX Core could not confirm this relationship.",
        tone: "error",
        duration: 3200
      });
    });

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
  nextPlacements,
  { objectIds: [dragId] }
).then(layoutResult => {
  if (layoutResult) return;

  showAosObjectNotice({
    objectId: dragId,
    message: "WORKSPACE SESSION COMMAND WAS NOT CONFIRMED",
    tone: "error",
    duration: 4200
  });
}).catch(error => {
  console.error(
    "AOS WORKSPACE LAYOUT SAVE FAILED:",
    error
  );
});

setActiveDndId(null);
clearMachineDragState?.();

return;
}

  
    function sendMachineToArmedDestination(listing) {
  if (!armedDestination) return;

  const id = aosWorkspaceAdmission.resolveObjectId(
    listing?.objectId || getListingId(listing)
  );

  if (!id) return;

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
  object?.presentation?.kind !== "ixi-private-machine"
) {
  const parentLabel =
    resolveAosWorkspaceParentName({
      object
    });

  const projectedChildren =
    getDirectContainerChildIds(object)
      .map(getAosWorkspaceObjectById)
      .filter(Boolean);

  return (
    <IXIAosOperatingCardRuntime
      object={
        object
      }

      items={
        projectedChildren
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
    canonicalSavedObjectIds
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

        .aos-work-board-skin-ixi-125 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-125.webp');
        }

        .aos-work-board-skin-ixi-126 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-126.webp');
        }

        .aos-work-board-skin-ixi-127 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-127.webp');
        }

        .aos-work-board-skin-ixi-128 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-128.webp');
        }

        .aos-work-board-skin-ixi-129 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-129.webp');
        }

        .aos-work-board-skin-ixi-130 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-130.webp');
        }

        .aos-work-board-skin-ixi-131 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-131.webp');
        }

        .aos-work-board-skin-ixi-132 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-132.webp');
        }

        .aos-work-board-skin-ixi-133 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-133.webp');
        }

        .aos-work-board-skin-ixi-134 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-134.webp');
        }

        .aos-work-board-skin-ixi-135 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-135.webp');
        }

        .aos-work-board-skin-ixi-136 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-136.webp');
        }

        .aos-work-board-skin-ixi-137 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-137.webp');
        }

        .aos-work-board-skin-ixi-138 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-138.webp');
        }

        .aos-work-board-skin-ixi-139 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-139.webp');
        }

        .aos-work-board-skin-ixi-140 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-140.webp');
        }

        .aos-work-board-skin-ixi-141 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-141.webp');
        }

        .aos-work-board-skin-ixi-142 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-142.webp');
        }

        .aos-work-board-skin-ixi-143 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-143.webp');
        }

        .aos-work-board-skin-ixi-144 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-144.webp');
        }

        .aos-work-board-skin-ixi-145 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-145.webp');
        }

        .aos-work-board-skin-ixi-146 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-146.webp');
        }

        .aos-work-board-skin-ixi-147 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-147.webp');
        }

        .aos-work-board-skin-ixi-148 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-148.webp');
        }

        .aos-work-board-skin-ixi-149 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-149.webp');
        }

        .aos-work-board-skin-ixi-150 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-150.webp');
        }

        .aos-work-board-skin-ixi-151 {
          background-color: #000;
          background-image: url('/images/ixi-aos-board-ixi-151.webp');
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
