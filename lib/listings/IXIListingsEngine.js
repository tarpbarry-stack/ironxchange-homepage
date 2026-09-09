// /lib/listings/IXIListingsEngine.js

import {
  getSavedListingIdsFromUser
} from "../savedListings";

import {
  fetchIxiMachineState
} from "../ixiMachineStateClient";

import {
  hydrateIXIListingCollection
} from "./hydrateIXIListingMedia";

import {
  ensureIXIAnonymousId
} from "../identity/IXIAnonymousIdentity";

import {
  IXI_WORKSPACE_SETTINGS_ID,
  IXI_WORKSPACE_LAYOUT_ID
} from "../../components/ixi-chassis/IXIWorkspacePersistenceEngine";

import {
  fetchPublicMarketplaceListings
} from "./publicMarketplaceClient";

async function fetchPublicListings({
  publicMarketplacePerformance = false,
  publicMarketplaceSurface = "browse-v2",
  publicMarketplaceProjection = "card"
} = {}) {
  if (publicMarketplacePerformance) {
    return fetchPublicMarketplaceListings({
      surface: publicMarketplaceSurface,
      projection: publicMarketplaceProjection
    });
  }

  const response = await fetch("/api/listings");

  if (!response.ok) {
    throw new Error(
      `Public listings request failed with status ${response.status}`
    );
  }

  const payload = await response.json();

  return Array.isArray(payload)
    ? payload
    : [];
}

async function createSharetribeSdk() {
  const SharetribeSdk =
    await import("sharetribe-flex-sdk");

  return SharetribeSdk.createInstance({
    clientId:
      process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
  });
}

function loadPublicListingCollection({
  publicMarketplacePerformance = false,
  publicMarketplaceSurface = "browse-v2",
  publicMarketplaceProjection = "card",
  hydrateMedia = true
} = {}) {
  if (!publicMarketplacePerformance) {
    return fetchPublicListings().then(listings =>
      hydrateMedia
        ? hydrateIXIListingCollection(listings)
        : listings
    );
  }

  return fetchPublicListings({
    publicMarketplacePerformance: true,
    publicMarketplaceSurface,
    publicMarketplaceProjection
  }).then(listings =>
    hydrateMedia
      ? hydrateIXIListingCollection(
          listings,
          { dedupeRequests: true }
        )
      : listings
  );
}

async function loadAuthenticatedUser() {
  const sdk =
    await createSharetribeSdk();

  const response =
    await sdk.currentUser.show({
      include: ["profileImage"]
    });

  const currentUser = {
    ...(response?.data?.data || {}),
    included:
      Array.isArray(response?.data?.included)
        ? response.data.included
        : []
  };

  return {
    sdk,
    currentUser
  };
}

function getAuthenticatedUserId(currentUser) {
  return String(
    currentUser?.id?.uuid ||
    currentUser?.id ||
    ""
  );
}

function normalizeRemoteState(response) {
  return (
    response?.state ||
    response ||
    {}
  );
}

function applyRemoteStateToResult(
  result,
  remoteState = {}
) {
  result.ixiState = remoteState;

  result.workspaceSettings =
    remoteState?.[IXI_WORKSPACE_SETTINGS_ID] ||
    {};

  result.workspaceLayout =
    remoteState?.[IXI_WORKSPACE_LAYOUT_ID] ||
    {};
}

export async function loadIXIListingsEnvironment({
  includePrivateState = true,
  includePublicListings = true,
  publicMarketplacePerformance = false,
  publicMarketplaceSurface = "browse-v2",
  publicMarketplaceProjection = "card",
  progressiveMedia = false,
  hydrateProgressiveMedia = true,
  onListingsReady = null,
  onListingsHydrated = null
} = {}) {
  const result = {
    listings: [],

    sdk: null,
    currentUser: null,

    identity: {
      type: "anonymous",
      id: "",
      persistent: false
    },

    userId: "",
    isAuthenticated: false,

    savedIds: [],
    ixiState: {},
    workspaceSettings: {},
    workspaceLayout: {},

    errors: {
      publicListings: null,
      authentication: null,
      privateState: null
    }
  };

  const publicListingsRequest =
    includePublicListings
      ? loadPublicListingCollection({
          publicMarketplacePerformance,
          publicMarketplaceSurface,
          publicMarketplaceProjection,
          hydrateMedia: !progressiveMedia
        })
      : Promise.resolve([]);

  const authenticatedUserRequest =
    includePrivateState
      ? loadAuthenticatedUser().then(
          value => ({
            value,
            error: null
          }),
          error => ({
            value: null,
            error
          })
        )
      : null;

  try {
    result.listings =
      await publicListingsRequest;

    if (
      progressiveMedia &&
      typeof onListingsReady === "function"
    ) {
      onListingsReady(result.listings);
    }

    if (
      progressiveMedia &&
      hydrateProgressiveMedia
    ) {
      // The API already supplies a usable hero image. IX-Core manifests enrich
      // the cards after first paint and must never hold the whole board hostage.
      hydrateIXIListingCollection(
        result.listings,
        { dedupeRequests: true }
      ).then(hydratedListings => {
        if (typeof onListingsHydrated === "function") {
          onListingsHydrated(hydratedListings);
        }
      }).catch(error => {
        console.warn(
          "IXI BACKGROUND MEDIA HYDRATION FAILED:",
          error
        );
      });
    }
  } catch (error) {
    result.errors.publicListings = error;

    console.error(
      "IXI PUBLIC LISTINGS LOAD FAILED:",
      error
    );
  }

  if (!includePrivateState) {
    return result;
  }

  /*
   * AUTHENTICATED IDENTITY
   *
   * Try Sharetribe first.
   */
  try {
    const authentication =
      authenticatedUserRequest
        ? await authenticatedUserRequest
        : {
            value:
              await loadAuthenticatedUser(),
            error: null
          };

    if (authentication.error) {
      throw authentication.error;
    }

    const {
      sdk,
      currentUser
    } = authentication.value;

    const authenticatedUserId =
      getAuthenticatedUserId(currentUser);

    if (!authenticatedUserId) {
      throw new Error(
        "Authenticated user returned without an ID."
      );
    }

    result.sdk = sdk;
    result.currentUser = currentUser;

    result.identity = {
      type: "user",
      id: authenticatedUserId,
      persistent: true
    };

    result.userId = authenticatedUserId;
    result.isAuthenticated = true;

    result.savedIds =
      getSavedListingIdsFromUser(currentUser);

    try {
      const remoteResponse =
        await fetchIxiMachineState(
          authenticatedUserId
        );

      const remoteState =
        normalizeRemoteState(remoteResponse);

      applyRemoteStateToResult(
        result,
        remoteState
      );
    } catch (error) {
      result.errors.privateState = error;

      console.error(
        "IXI AUTHENTICATED STATE LOAD FAILED:",
        error
      );
    }

    return result;
  } catch (error) {
    result.errors.authentication = error;

    console.info(
      "IXI USER NOT AUTHENTICATED — USING ANONYMOUS IDENTITY"
    );
  }

  /*
   * ANONYMOUS IDENTITY
   *
   * This ID persists in this browser through a cookie
   * and localStorage.
   */
  const anonymousId =
    ensureIXIAnonymousId();

  result.sdk = null;
  result.currentUser = null;

  result.identity = {
    type: "anonymous",
    id: anonymousId,
    persistent: Boolean(anonymousId)
  };

  result.userId = anonymousId;
  result.isAuthenticated = false;
  result.savedIds = [];

  if (!anonymousId) {
    console.warn(
      "IXI ANONYMOUS IDENTITY COULD NOT BE CREATED."
    );

    return result;
  }

  /*
   * GUEST IXI STATE
   *
   * Load the same card/container/workspace records,
   * but under this browser's anonymous ID.
   */
  try {
    const remoteResponse =
      await fetchIxiMachineState(
        anonymousId
      );

    const remoteState =
      normalizeRemoteState(remoteResponse);

    applyRemoteStateToResult(
      result,
      remoteState
    );
  } catch (error) {
    result.errors.privateState = error;

    console.warn(
      "IXI ANONYMOUS STATE LOAD FAILED — STARTING EMPTY:",
      error
    );

    applyRemoteStateToResult(
      result,
      {}
    );
  }

  return result;
}

export default loadIXIListingsEnvironment;
