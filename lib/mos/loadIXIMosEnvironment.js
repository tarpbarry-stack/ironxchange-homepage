import {
  fetchAosEnvironment
} from "./ixiMosClient";

import {
  loadIXIListingsEnvironment
} from "../listings/IXIListingsEngine";

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
      account: null,
      principal: null,
      entity: null,
      objects: [],
      rootObjects: [],
      projections: {},
      listingEnvironment,
      errors: {
        authentication:
          "Authenticated user required."
      }
    };
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

  return {
    ok: true,
    productName:
      response.productName ||
      "IXI AOS",

    isAuthenticated: true,
    userId,

    account:
      environment.account,

    principal:
      environment.principal,

    entity:
      environment.entity,

    objects:
      includeObjects &&
      Array.isArray(
        environment.objects
      )
        ? environment.objects
        : [],

    rootObjects:
      includeObjects &&
      Array.isArray(
        environment.rootObjects
      )
        ? environment.rootObjects
        : [],

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
    errors: {}
  };
}

export default loadIXIMosEnvironment;
