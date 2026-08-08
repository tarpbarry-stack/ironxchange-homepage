import {
  fetchAosEnvironment
} from "./ixiMosClient";

import {
  loadIXIListingsEnvironment
} from "../listings/IXIListingsEngine";

import {
  buildAosSystemIndexes
} from "./buildAosSystemIndexes";

import {
  loadIXIOwnedListings
} from "../listings/loadIXIOwnedListings";

function clean(value) {
  return String(value || "").trim();
}

function getEntityDisplayName(environment = {}) {
  const identity =
    environment.identity || {};

  const currentUser =
    environment.currentUser || {};

  const profile =
    currentUser.attributes?.profile ||
    currentUser.profile ||
    {};

  const publicData =
    profile.publicData || {};

  const protectedData =
    profile.protectedData || {};

  return (
    clean(publicData.companyName) ||
    clean(publicData.company) ||
    clean(protectedData.companyName) ||
    clean(identity.companyName) ||
    clean(profile.displayName) ||
    clean(identity.displayName) ||
    clean(identity.name) ||
    clean(identity.email) ||
    "IXI Entity"
  );
}

function getEntityLogoUrl(environment = {}) {
  const currentUser =
    environment.currentUser || {};

  const profileImage =
    currentUser.relationships
      ?.profileImage
      ?.data;

  const included =
    Array.isArray(environment.included)
      ? environment.included
      : [];

  const profileImageId =
    profileImage?.id?.uuid ||
    profileImage?.id ||
    "";

  const imageRecord =
    included.find(item => {
      const itemId =
        item?.id?.uuid ||
        item?.id ||
        "";

      return (
        item?.type === "image" &&
        String(itemId) ===
          String(profileImageId)
      );
    });

  return (
    imageRecord
      ?.attributes
      ?.variants
      ?.default
      ?.url ||
    ""
  );
}

function getEntityOfficeLocation(
  environment = {}
) {
  const currentUser =
    environment.currentUser || {};

  const profile =
    currentUser.attributes?.profile ||
    currentUser.profile ||
    {};

  const publicData =
    profile.publicData || {};

  return (
    clean(
      publicData.sellerLocation
    ) ||
    clean(
      publicData.location
    ) ||
    clean(
      publicData.cityState
    ) ||
    ""
  );
}

export async function loadIXIMosEnvironment({
  includeObjects = true
} = {}) {
  const listingEnvironment =
    await loadIXIListingsEnvironment({
      includePrivateState: true
    });

  const isAuthenticated =
    Boolean(
      listingEnvironment
        ?.isAuthenticated
    );

  const userId =
    clean(
      listingEnvironment?.userId
    );

  if (
    !isAuthenticated ||
    !userId
  ) {
  return {
    ok: false,
    isAuthenticated: false,
    userId: "",

    ownedListings: [],
    systemIndexes: [],

    account: null,
    principal: null,
    entity: null,

    objects: [],
    rootObjects: [],
    projections: {},

    listingEnvironment,

    errors: {
      authentication:
        "Authenticated user required.",

      ownedListings: null
    }
  };
}

let ownedListings = [];
let ownedListingsError = null;

try {
  ownedListings =
    await loadIXIOwnedListings(
      userId
    );
} catch (error) {
  ownedListingsError = error;

  console.error(
    "IXI AOS OWNED LISTINGS LOAD FAILED:",
    error
  );
}

const response =
  await fetchAosEnvironment({
    ownerUserId: userId,

    displayName:
      getEntityDisplayName(
        listingEnvironment
      ),

    metadata: {
      source:
        "preview-aos-environment",

      authenticatedThrough:
        "sharetribe"
    }
  });

const environment =
  response?.environment;

if (
  !environment?.account?.accountId ||
  !environment?.entity?.entityId
) {
  throw new Error(
    "IXI AOS did not return a valid account and Entity."
  );
}

  const normalizedEntity = {
  ...environment.entity,

  displayName:
    environment.entity
      ?.displayName ||
    getEntityDisplayName(
      listingEnvironment
    ),

  logoUrl:
    getEntityLogoUrl(
      listingEnvironment
    ),

  officeLocation:
    getEntityOfficeLocation(
      listingEnvironment
    )
};

const aosObjects =
  includeObjects &&
  Array.isArray(
    environment.objects
  )
    ? environment.objects
    : [];

const rootObjects =
  includeObjects &&
  Array.isArray(
    environment.rootObjects
  )
    ? environment.rootObjects
    : [];

const systemIndexes =
  buildAosSystemIndexes({
    aosObjects,
    ownedListings
  });

return {
  ok: true,

  productName:
    response.productName ||
    "IXI AOS",

  isAuthenticated: true,
  userId,

  ownedListings,
  systemIndexes,

  account:
    environment.account,

  principal:
    environment.principal,

  entity:
normalizedEntity,
  
  objects:
    aosObjects,

  rootObjects,

  projections:
    includeObjects &&
    environment.projections &&
    typeof environment.projections ===
      "object"
      ? environment.projections
      : {},

  bootstrap:
    environment.bootstrap || {
      account: false,
      entity: false,
      membership: false
    },

  listingEnvironment,

  errors: {
    authentication: null,

    ownedListings:
      ownedListingsError
  }
};
}

export default loadIXIMosEnvironment;
