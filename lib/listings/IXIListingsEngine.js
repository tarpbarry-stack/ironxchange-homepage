// /lib/listings/IXIListingsEngine.js

import {
  fetchCurrentUserWithSavedListings,
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

async function fetchPublicListings() {
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
  includePrivateState = true
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

  /*
   * PUBLIC INVENTORY
   *
   * This must always load independently from login.
   */
  try {
  const publicListings =
    await fetchPublicListings();

  result.listings =
    await hydrateIXIListingCollection(
      publicListings
    );
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
    const sdk =
      await createSharetribeSdk();

    const currentUser =
      await fetchCurrentUserWithSavedListings(
        sdk
      );

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
