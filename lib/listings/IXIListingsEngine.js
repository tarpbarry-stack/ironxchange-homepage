// /lib/listings/IXIListingsEngine.js

import {
  fetchCurrentUserWithSavedListings,
  getSavedListingIdsFromUser
} from "../savedListings";

import {
  fetchIxiMachineState
} from "../ixiMachineStateClient";

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

  return Array.isArray(payload) ? payload : [];
}

async function createSharetribeSdk() {
  const SharetribeSdk = await import("sharetribe-flex-sdk");

  return SharetribeSdk.createInstance({
    clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
  });
}

function getUserId(currentUser) {
  return String(
    currentUser?.id?.uuid ||
    currentUser?.id ||
    "guest"
  );
}

export async function loadIXIListingsEnvironment({
  includePrivateState = true
} = {}) {
  const result = {
    listings: [],
    sdk: null,
    currentUser: null,
    userId: "guest",
    savedIds: [],
    ixiState: {},
    workspaceSettings: {},
    workspaceLayout: {},

    errors: {
      publicListings: null,
      privateState: null
    }
  };

  /*
   * PUBLIC INVENTORY
   *
   * This runs independently and must never depend on login,
   * saved machines, IXI state, or workspace state.
   */
  try {
    result.listings = await fetchPublicListings();
  } catch (error) {
    result.errors.publicListings = error;
    console.error("IXI PUBLIC LISTINGS LOAD FAILED:", error);
  }

  if (!includePrivateState) {
    return result;
  }

  /*
   * PRIVATE / OPTIONAL STATE
   *
   * A 401/403 here must never remove public listings.
   */
  try {
    const sdk = await createSharetribeSdk();

    result.sdk = sdk;

    const currentUser =
      await fetchCurrentUserWithSavedListings(sdk);

    result.currentUser = currentUser;
    result.userId = getUserId(currentUser);

    result.savedIds =
      getSavedListingIdsFromUser(currentUser);

    const remoteResponse =
      await fetchIxiMachineState(result.userId);

    const remoteState =
      remoteResponse?.state ||
      remoteResponse ||
      {};

    result.ixiState = remoteState;

    result.workspaceSettings =
      remoteState?.[IXI_WORKSPACE_SETTINGS_ID] ||
      {};

    result.workspaceLayout =
      remoteState?.[IXI_WORKSPACE_LAYOUT_ID] ||
      {};
  } catch (error) {
    result.errors.privateState = error;

    console.warn(
      "IXI PRIVATE STATE UNAVAILABLE — USING GUEST MODE:",
      error
    );

    result.currentUser = null;
    result.userId = "guest";
    result.savedIds = [];
    result.ixiState = {};
    result.workspaceSettings = {};
    result.workspaceLayout = {};
  }

  return result;
}

export default loadIXIListingsEnvironment;
