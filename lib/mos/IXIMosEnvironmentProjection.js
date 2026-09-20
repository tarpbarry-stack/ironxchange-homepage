import { getIXIEntityLogoUrl } from "./ixiEntityBranding.mjs";
import {
  fetchAosEnvironment,
  fetchMosObjectDefinitions
} from "./ixiMosClient";



import {
  buildAosSystemIndexes
} from "./buildAosSystemIndexes";



import {
  getCanonicalAosPassportId
} from "./ixiAosPassportPresentation.mjs";

import {
  admitMosCanonicalIdentities
} from "./ixiMosClient";

import {
  normalizeIxCoreAdmissionEnvelope
} from "./ixiAosCanonicalAdmission.mjs";

import {
  normalizeAosRailProjectionHierarchy
} from "./IXIAosMembershipBridge.mjs";


function clean(value) {
  return String(value || "").trim();
}


function getListingId(listing = {}) {
  return clean(
    listing?.listingId ||
    listing?.id?.uuid ||
    listing?.id
  );
}


function getAdmissionAliases(object = {}, ownedListings = []) {
  const passportId = getCanonicalAosPassportId(object);
  const metadata = object?.metadata || {};
  const provisioning = metadata?.provisioning || object?.provisioning || {};
  const bindings = [
    ...(Array.isArray(object?.aliases) ? object.aliases : []),
    ...(Array.isArray(object?.sourceBindings) ? object.sourceBindings : []),
    ...(Array.isArray(metadata?.sourceBindings) ? metadata.sourceBindings : []),
    ...(Array.isArray(provisioning?.sourceBindings) ? provisioning.sourceBindings : []),
    ...(Array.isArray(object?.historicalSourceBindings) ? object.historicalSourceBindings : []),
    ...(Array.isArray(metadata?.historicalSourceBindings) ? metadata.historicalSourceBindings : [])
  ];

  const aliases = bindings.map(binding => ({
    sourceType: clean(
      binding?.sourceType ||
      binding?.identityType ||
      binding?.type ||
      binding?.kind
    ),
    sourceId: clean(
      binding?.sourceId ||
      binding?.identityId ||
      binding?.externalId ||
      binding?.value ||
      binding?.id
    )
  }));

  (ownedListings || []).forEach(listing => {
    if (passportId && getCanonicalAosPassportId(listing) === passportId) {
      aliases.push({
        sourceType: "sharetribe-listing",
        sourceId: getListingId(listing)
      });
    }
  });

  const unique = new Map();
  aliases.forEach(alias => {
    if (!alias.sourceType || !alias.sourceId) return;
    unique.set(`${alias.sourceType}:${alias.sourceId}`, alias);
  });
  return [...unique.values()];
}


async function admitCanonicalObjects({
  objects = [],
  ownedListings = [],
  entityId
}) {
  if (!objects.length) return [];

  const requests = objects.map(object => ({
    objectId: clean(object?.objectId),
    passportId: getCanonicalAosPassportId(object),
    aliases: getAdmissionAliases(object, ownedListings)
  }));
  const response = await admitMosCanonicalIdentities({ requests });
  const admissions = Array.isArray(response?.admissions)
    ? response.admissions
    : [];

  if (admissions.length !== objects.length) {
    const error = new Error("IX Core returned an incomplete canonical identity batch.");
    error.code = "AOS_IDENTITY_BATCH_INCOMPLETE";
    throw error;
  }

  return normalizeCanonicalAdmissions({
    admissions,
    objects,
    entityId
  });
}

function normalizeCanonicalAdmissions({
  admissions = [],
  objects = [],
  entityId
}) {
  if (admissions.length !== objects.length) {
    const error = new Error("IX Core returned an incomplete canonical identity batch.");
    error.code = "AOS_IDENTITY_BATCH_INCOMPLETE";
    throw error;
  }

  return admissions.map((admission, index) => {
    const object = objects[index];
    const requestedObjectId = clean(object?.objectId);
    const requestedPassportId = getCanonicalAosPassportId(object);
    return normalizeIxCoreAdmissionEnvelope({
      response: admission,
      requestedObject: {
        ...object,
        objectId: requestedObjectId,
        passportId: requestedPassportId
      },
      expectedEntityId: entityId
    });
  });
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


// TRAN$ACT already has an authenticated server boundary. Its directory must
// not wait for a second browser SDK login, board state, or listing enrichment.
export async function loadIXICanonicalMosEnvironment({ signal } = {}) {
  let response = await fetchAosEnvironment({ signal });
  // A genuinely new account may enter the existing governed onboarding boundary.
  // Read its completed canonical bootstrap once; never fall back to browser identity
  // or repeat onboarding/admission per card. Established accounts keep one request.
  if (response?.workBootstrapVersion !== "ixi.aos-work-bootstrap.v1" && response?.onboarding) {
    response = await fetchAosEnvironment({ signal });
  }
  if (response?.workBootstrapVersion !== "ixi.aos-work-bootstrap.v1") {
    throw new Error("The governed directory bootstrap is unavailable. Retry to reconnect.");
  }
  const userId = clean(response?.environment?.principal?.principalId);
  if (!userId) throw new Error("The directory did not return an authenticated principal.");
  return projectIXIMosEnvironment({ response, userId,
    listingEnvironment: { userId, isAuthenticated: true } });
}

export async function projectIXIMosEnvironment({ response, userId, ownedListings = [],
  ownedListingsError = null, listingEnvironment = {}, includeObjects = true,
  onAuthenticatedEnvironment } = {}) {

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
      getIXIEntityLogoUrl(
        listingEnvironment, environment.entity
      ),

    officeLocation:
      getEntityOfficeLocation(
        listingEnvironment
      )
  };


  if (typeof onAuthenticatedEnvironment === "function") {
    onAuthenticatedEnvironment({
      ok: true,
      productName:
        response.productName ||
        "IXI AOS",
      isAuthenticated: true,
      userId,
      // Operating objects and listing-backed machine presentations remain
      // withheld until canonical admission completes below.
      ownedListings: [],
      systemIndexes: [],
      objectDefinitions: [],
      account:
        environment.account,
      principal:
        environment.principal,
      entity:
        normalizedEntity,
      objects: [],
      relationships: [],
      rootObjects: [],
      projections: {},
      railProjections: {},
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
        objectDefinitions: null
      },
      hydration: {
        canonicalObjects: "pending"
      }
    });
  }


  const rawAosObjects =
    includeObjects &&
    Array.isArray(
      environment.objects
    )
      ? environment.objects
      : [];

  const objectsWithoutPassport =
    rawAosObjects.filter(object =>
      !getCanonicalAosPassportId(object)
    );

  if (objectsWithoutPassport.length) {
    const error = new Error(
      "IX Core refused AOS/Work because one or more active records do not have a verified IXI Passport."
    );
    error.code = "AOS_IDENTITY_INTEGRITY_FAILED";
    error.details = {
      objectIds: objectsWithoutPassport.map(object =>
        clean(object?.objectId || object?.id)
      ).filter(Boolean)
    };
    throw error;
  }

  const hasBundledWorkBootstrap =
    response?.workBootstrapVersion === "ixi.aos-work-bootstrap.v1";

  const definitionsRequest = hasBundledWorkBootstrap
    ? Promise.resolve({
        value: { definitions: response.definitions || [] },
        error: null
      })
    : includeObjects
    ? fetchMosObjectDefinitions({
        entityId: normalizedEntity.entityId,
        status: "active"
      }).then(
        value => ({ value, error: null }),
        error => ({ value: null, error })
      )
    : Promise.resolve({ value: null, error: null });

  const admissionRequest = hasBundledWorkBootstrap
    ? Promise.resolve(normalizeCanonicalAdmissions({
        admissions: Array.isArray(response.admissions)
          ? response.admissions
          : [],
        objects: rawAosObjects,
        entityId: normalizedEntity.entityId
      }))
    : admitCanonicalObjects({
        objects: rawAosObjects,
        ownedListings,
        entityId: normalizedEntity.entityId
      });

  const [definitionsResult, admittedObjects] = await Promise.all([
    definitionsRequest,
    admissionRequest
  ]);

  const objectDefinitionsError = definitionsResult.error;
  if (objectDefinitionsError) {
    console.error(
      "IXI AOS OBJECT DEFINITIONS LOAD FAILED:",
      objectDefinitionsError
    );
  }

  const objectDefinitions = Array.isArray(
    definitionsResult.value?.definitions
  )
    ? definitionsResult.value.definitions
    : [];

  const definitionMap = buildDefinitionMap(objectDefinitions);
  const hydratedDefinitions = Array.from(definitionMap.values());
  const aosObjects = admittedObjects.map(object =>
    hydrateObjectDefinition({ object, definitionMap })
  );

  const railProjections =
    normalizeAosRailProjectionHierarchy({
      railProjections:
        environment.railProjections || {},
      aosObjects,
      relationships:
        Array.isArray(environment.relationships)
          ? environment.relationships
          : null
    });


  const admittedObjectsById = new Map(
    aosObjects.map(object => [clean(object?.objectId), object])
  );

  const rootObjects =
    includeObjects &&
    Array.isArray(
      environment.rootObjects
    )
      ? environment.rootObjects
          .map(object => admittedObjectsById.get(clean(object?.objectId)))
          .filter(Boolean)
      : [];


  const systemIndexes =
    buildAosSystemIndexes({
      aosObjects,
      ownedListings,
      railProjections
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

    railProjections:
      includeObjects &&
      railProjections &&
      typeof railProjections === "object"
        ? railProjections
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
