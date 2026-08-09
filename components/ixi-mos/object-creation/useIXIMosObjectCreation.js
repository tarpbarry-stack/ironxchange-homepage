import {
  createMosObject,
  placeMosObject,
  createMosCommandId,
  updateMosObject
} from "../../../lib/mos/ixiMosClient";

import {
  loadIXIMosEnvironment
} from "../../../lib/mos/loadIXIMosEnvironment";

import {
  moveObjectToWorkspaceSurface
} from "../../ixi-chassis/IXIWorkspacePlacementEngine";


function clean(value) {
  return String(
    value || ""
  ).trim();
}


function getMosObjectId(object = {}) {
  return clean(
    object?.objectId ||
    object?.id ||
    ""
  );
}


export default function useIXIMosObjectCreation({
  entityId = "",
  userId = "",

  workspaceSystemIndexes = [],
  workspacePlacements = {},

  setWorkspacePlacements,
  saveWorkspaceLayout,

  setAosObjects,
  setSystemIndexes
}) {

  /*
   * =========================================================
   * RELOAD CANONICAL MOS ENVIRONMENT
   * =========================================================
   *
   * MOS remains the source of truth for:
   *
   * object identity
   * containment
   * relationships
   *
   * Workspace placement is updated separately.
   */
  async function reloadMosEnvironment() {
    const environment =
      await loadIXIMosEnvironment({
        includeObjects: true
      });

    setAosObjects?.(
      Array.isArray(
        environment?.objects
      )
        ? environment.objects
        : []
    );

    setSystemIndexes?.(
      Array.isArray(
        environment?.systemIndexes
      )
        ? environment.systemIndexes
        : []
    );

    return environment;
  }


  /*
   * =========================================================
   * EXPOSE OBJECT TO THIS USER'S BOARD
   * =========================================================
   *
   * IMPORTANT:
   *
   * This changes workspace placement only.
   *
   * It does NOT change canonical MOS containment.
   */
  async function exposeObjectToBoard(
    objectId,
    {
      position
    } = {}
  ) {
    const id =
      clean(objectId);

    if (!id) {
      return workspacePlacements;
    }

    const nextPlacements =
      moveObjectToWorkspaceSurface({
        placements:
          workspacePlacements,

        objectId:
          id,

        targetSurface:
          "board",

        ...(position
          ? { position }
          : {})
      });

    setWorkspacePlacements?.(
      nextPlacements
    );

    await saveWorkspaceLayout?.(
      nextPlacements
    );

    return nextPlacements;
  }


  /*
   * =========================================================
   * CREATE ROOT SYSTEM INDEX
   * =========================================================
   *
   * Example:
   *
   * LOCATIONS
   * PEOPLE
   * JOBS
   * TOOLS
   *
   * The customer supplies the name.
   *
   * The frontend does not manufacture a hierarchy.
   */
  async function createRootSystemIndexByName(
    rawDisplayName
  ) {
    const displayName =
      clean(rawDisplayName);

    if (!displayName) {
      throw new Error(
        "Index name is required."
      );
    }

    const resolvedEntityId =
      clean(entityId);

    if (!resolvedEntityId) {
      throw new Error(
        "AOS Entity is not available."
      );
    }


    /*
     * If the customer already created
     * this persisted System Index,
     * do not create a duplicate.
     *
     * Just expose the existing card
     * back onto this user's Board.
     */
    const existingIndex =
      (
        Array.isArray(
          workspaceSystemIndexes
        )
          ? workspaceSystemIndexes
          : []
      ).find(index => {
        const existingName =
          clean(
            index?.displayName ||
            index?.label ||
            ""
          ).toLowerCase();

        return (
          existingName ===
            displayName.toLowerCase() &&
          index?.metadata
            ?.persisted === true
        );
      });


    if (existingIndex) {
      const existingObjectId =
        getMosObjectId(
          existingIndex
        );

      if (!existingObjectId) {
        throw new Error(
          "Persisted Index has no objectId."
        );
      }

      await exposeObjectToBoard(
        existingObjectId
      );

      return {
        created: false,
        existing: true,
        object:
          existingIndex,
        objectId:
          existingObjectId
      };
    }


    /*
     * Create the actual durable
     * first-class MOS System Index.
     */
    const response =
      await createMosObject({
        entityId:
          resolvedEntityId,

        objectType:
          "system-index",

        displayName,

        fields: {
          parentSystemIndexId:
            null
        },

        source:
          "manual",

        actorId:
          userId || null,

        metadata: {
          createdFrom:
            "aos-work",

          hierarchyRole:
            "index"
        }
      });


    const createdObject =
      response?.object ||
      response?.data ||
      response;


    const createdObjectId =
      getMosObjectId(
        createdObject
      );


    if (!createdObjectId) {
      throw new Error(
        "MOS created the Index but returned no objectId."
      );
    }


    /*
     * Reload canonical truth first.
     */
    const environment =
      await reloadMosEnvironment();


    /*
     * Workspace exposure is independent.
     */
    await exposeObjectToBoard(
      createdObjectId
    );


    return {
      created: true,
      existing: false,

      object:
        createdObject,

      objectId:
        createdObjectId,

      environment
    };
  }


  /*
   * =========================================================
   * CREATE OBJECT INSIDE ANY PERSISTED MOS CONTAINER
   * =========================================================
   *
   * This is the primitive we actually need.
   *
   * LOCATION
   *   -> Wichita Falls
   *
   * Wichita Falls
   *   -> WF Shop
   *
   * JOB
   *   -> child operational objects
   *
   * Building
   *   -> Room
   *
   * etc.
   *
   * No frontend hierarchy levels are hardcoded.
   */
  async function createObjectInContainer({
    container,
    objectType:
      rawObjectType,
    displayName:
      rawDisplayName,

    fields = {},
    metadata = {},

    exposeToBoard = true
  }) {
    const destinationContainerId =
      getMosObjectId(
        container
      );


    if (!destinationContainerId) {
      throw new Error(
        "Destination container is missing objectId."
      );
    }


    /*
     * Legacy manufactured projections
     * such as system-index:equipment
     * are not durable MOS containers.
     */
    if (
      !destinationContainerId
        .startsWith("object_")
    ) {
      throw new Error(
        "This container has not yet been migrated to the persisted AOS container model."
      );
    }


    const objectType =
      clean(
        rawObjectType
      ).toLowerCase();


    if (!objectType) {
      throw new Error(
        "Object type is required."
      );
    }


    const displayName =
      clean(
        rawDisplayName
      );


    if (!displayName) {
      throw new Error(
        "Object name is required."
      );
    }


    const resolvedEntityId =
      clean(entityId);


    if (!resolvedEntityId) {
      throw new Error(
        "AOS Entity is not available."
      );
    }


    /*
     * STEP 1
     *
     * Create the durable MOS object.
     */
    const createResponse =
      await createMosObject({
        entityId:
          resolvedEntityId,

        objectType,

        displayName,

        fields: {
          ...(fields || {})
        },

        source:
          "manual",

        actorId:
          userId || null,

        metadata: {
          createdFrom:
            "aos-container",

          createdInsideContainerId:
            destinationContainerId,

          ...(metadata || {})
        }
      });


    const createdObject =
      createResponse?.object ||
      createResponse?.data ||
      createResponse;


    const createdObjectId =
      getMosObjectId(
        createdObject
      );


    if (!createdObjectId) {
      throw new Error(
        "MOS created the object but returned no objectId."
      );
    }


    /*
     * STEP 2
     *
     * Canonical MOS containment.
     *
     * THIS is what says:
     *
     * Wichita Falls belongs to LOCATIONS.
     *
     * Board position is unrelated.
     */
    await placeMosObject({
      objectId:
        createdObjectId,

      destinationContainerId,

      actorId:
        userId || null,

      commandId:
        createMosCommandId(
          "container-add"
        ),

      metadata: {
        source:
          "aos-container",

        parentName:
          clean(
            container?.displayName ||
            container?.label ||
            ""
          )
      }
    });


    /*
 * STEP 3
 *
 * Expose the newly-created real
 * object to this user's workspace
 * immediately.
 *
 * Do this BEFORE reloading MOS truth.
 */
if (exposeToBoard) {
  await exposeObjectToBoard(
    createdObjectId
  );
}


/*
 * STEP 4
 *
 * Now reload canonical MOS truth.
 *
 * The created object already has
 * workspace placement, so this refresh
 * only updates object/container truth.
 */
const environment =
  await reloadMosEnvironment();

    return {
      object:
        createdObject,

      objectId:
        createdObjectId,

      parentObjectId:
        destinationContainerId,

      environment
    };
  }

  async function createLocationInContainer(
  container
) {
  return createObjectInContainer({
    container,

    objectType:
      "location",

    displayName:
      "NEW LOCATION",

    metadata: {
      creationState:
        "naming",

      createdFrom:
        "location-card-plus"
    },

    exposeToBoard:
      true
  });
}

async function saveMosObjectName({
  objectId,
  displayName
}) {
  const id =
    clean(objectId);

  const name =
    clean(displayName);

  if (!id) {
    throw new Error(
      "Object ID is required."
    );
  }

  if (!name) {
    throw new Error(
      "Object name is required."
    );
  }

  const response =
    await updateMosObject({
      objectId:
        id,

      displayName:
        name,

      actorId:
        userId || null,

      metadata: {
        creationState:
          "complete"
      }
    });

  const updatedObject =
    response?.object ||
    response?.data ||
    response;

  /*
   * Reload canonical MOS truth so every
   * projection/card sees the new name.
   */
  await reloadMosEnvironment();

  return {
    object:
      updatedObject,

    objectId:
      id
  };
}

  return {
  reloadMosEnvironment,

  exposeObjectToBoard,

  createRootSystemIndexByName,

  createObjectInContainer,

  createLocationInContainer,

  saveMosObjectName
};
}
