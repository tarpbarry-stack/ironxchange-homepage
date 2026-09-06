import {
  fetchAosEnvironment,
  fetchMosObjectDefinitions
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


function normalizeDefinitionField(
  field = {},
  index = 0
) {
  const fieldId =
    clean(
      field?.fieldId ||
      field?.field ||
      field?.key ||
      field?.slug
    );

  if (!fieldId) {
    return null;
  }

  return {
    ...field,

    fieldId,

    label:
      clean(
        field?.label ||
        field?.displayLabel ||
        fieldId
      ),

    fieldType:
      clean(
        field?.fieldType ||
        field?.type ||
        "text"
      ) || "text",

    presentationOrder:
      Number(
        field?.presentationOrder ??
        field?.presentation?.order ??
        index
      ),

    editable:
      field?.editable !== false &&
      field?.readOnly !== true,

    importable:
      field?.importable !== false,

    exportable:
      field?.exportable !== false,

    apiAddressable:
      field?.apiAddressable !== false
  };
}


function normalizeDefinitionFields(
  definition = {}
) {
  return Array.isArray(
    definition?.fieldSchema
  )
    ? definition.fieldSchema
        .map(normalizeDefinitionField)
        .filter(Boolean)
        .sort(
          (a, b) =>
            a.presentationOrder -
            b.presentationOrder
        )
    : [];
}


function buildDefinitionMap(
  definitions = []
) {
  const map =
    new Map();

  definitions.forEach(
    definition => {
      const definitionId =
        clean(
          definition?.definitionId
        );

      if (!definitionId) {
        return;
      }

      map.set(
        definitionId,
        {
          ...definition,

          fieldDefinitions:
            normalizeDefinitionFields(
              definition
            )
        }
      );
    }
  );

  return map;
}


function hydrateObjectDefinition({
  object,
  definitionMap
}) {
  if (!object) {
    return object;
  }

  const definitionId =
    clean(
      object?.definitionId
    );

  if (!definitionId) {
    return object;
  }

  const definition =
    definitionMap.get(
      definitionId
    );

  if (!definition) {
    return {
      ...object,

      metadata: {
        ...(object?.metadata || {}),

        definitionResolution: {
          status:
            "unresolved",

          definitionId
        }
      }
    };
  }

  return {
    ...object,

    /*
     * Runtime hydration only.
     * AWS remains the durable owner of both records.
     */
    definition,

    fieldDefinitions:
      Array.isArray(
        definition?.fieldDefinitions
      )
        ? definition.fieldDefinitions
        : [],

    businessIdentifierSchema:
      definition?.businessIdentifierSchema ||
      object?.businessIdentifierSchema ||
      null,

    metadata: {
      ...(object?.metadata || {}),

      definitionResolution: {
        status:
          "resolved",

        definitionId,

        definitionKey:
          definition?.definitionKey ||
          object?.definitionKey ||
          null
      }
    }
  };
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
      objectDefinitions: [],

      account: null,
      principal: null,
      entity: null,

      objects: [],
      relationships: [],
      rootObjects: [],
      projections: {},

      listingEnvironment,

      errors: {
        authentication:
          "Authenticated user required.",

        ownedListings: null,
        objectDefinitions: null
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
      ownerUserId:
        userId,

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


  let objectDefinitions = [];
  let objectDefinitionsError = null;

  if (includeObjects) {
    try {
      const definitionsResponse =
        await fetchMosObjectDefinitions({
          entityId:
            normalizedEntity.entityId,

          status:
            "active"
        });

      objectDefinitions =
        Array.isArray(
          definitionsResponse?.definitions
        )
          ? definitionsResponse.definitions
          : [];
    } catch (error) {
      objectDefinitionsError =
        error;

      console.error(
        "IXI AOS OBJECT DEFINITIONS LOAD FAILED:",
        error
      );
    }
  }


  const definitionMap =
    buildDefinitionMap(
      objectDefinitions
    );


  const hydratedDefinitions =
    Array.from(
      definitionMap.values()
    );


  const aosObjects =
    includeObjects &&
    Array.isArray(
      environment.objects
    )
      ? environment.objects.map(
          object =>
            hydrateObjectDefinition({
              object,
              definitionMap
            })
        )
      : [];


  const rootObjects =
    includeObjects &&
    Array.isArray(
      environment.rootObjects
    )
      ? environment.rootObjects.map(
          object =>
            hydrateObjectDefinition({
              object,
              definitionMap
            })
        )
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
    objectDefinitions:
      hydratedDefinitions,

    account:
      environment.account,

    principal:
      environment.principal,

    entity:
      normalizedEntity,

    objects:
      aosObjects,

    relationships:
      includeObjects &&
      Array.isArray(environment.relationships)
        ? environment.relationships
        : [],

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
        ownedListingsError,

      objectDefinitions:
        objectDefinitionsError
    }
  };
}


export default loadIXIMosEnvironment;
