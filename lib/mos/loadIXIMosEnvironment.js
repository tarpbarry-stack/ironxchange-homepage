import {
  createMosEntity,
  fetchMosEntities,
  fetchMosObjects
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

  return (
    clean(identity.companyName) ||
    clean(identity.displayName) ||
    clean(identity.name) ||
    clean(identity.email) ||
    "IXI Entity"
  );
}

function findEntityForUser(
  entities = [],
  userId
) {
  const normalizedUserId =
    clean(userId);

  if (!normalizedUserId) {
    return null;
  }

  return (
    entities.find(entity =>
      clean(
        entity.sharetribeUserId
      ) === normalizedUserId
    ) || null
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
      entity: null,
      objects: [],
      listingEnvironment,
      errors: {
        authentication:
          "Authenticated user required."
      }
    };
  }

  const entityResponse =
    await fetchMosEntities();

  const entities =
    Array.isArray(
      entityResponse?.entities
    )
      ? entityResponse.entities
      : [];

  let entity =
    findEntityForUser(
      entities,
      userId
    );

  let entityCreated = false;

  if (!entity) {
    const createResponse =
      await createMosEntity({
        displayName:
          getEntityDisplayName(
            listingEnvironment
          ),

        sharetribeUserId:
          userId,

        actorId:
          userId,

        metadata: {
          source:
            "ixi-mos-environment",

          createdFrom:
            "authenticated-sharetribe-user"
        }
      });

    entity =
      createResponse?.entity ||
      null;

    entityCreated =
      Boolean(entity);
  }

  if (!entity?.entityId) {
    throw new Error(
      "IXI MOS could not resolve an Entity for the authenticated user."
    );
  }

  let objects = [];

  if (includeObjects) {
    const objectResponse =
      await fetchMosObjects({
        entityId:
          entity.entityId
      });

    objects =
      Array.isArray(
        objectResponse?.objects
      )
        ? objectResponse.objects
        : [];
  }

  return {
    ok: true,
    isAuthenticated: true,
    userId,
    entity,
    entityCreated,
    objects,
    listingEnvironment,
    errors: {}
  };
}

export default loadIXIMosEnvironment;
