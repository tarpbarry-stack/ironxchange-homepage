import {
  createMosObject,
  placeMosObject,
  createMosCommandId,
  updateMosObject,
  deleteMosObject
} from "../../../lib/mos/ixiMosClient";

import {
  loadIXIMosEnvironment
} from "../../../lib/mos/loadIXIMosEnvironment";

import {
  moveObjectToWorkspaceSurface
} from "../../ixi-chassis/IXIWorkspacePlacementEngine";


const IXI_SYSTEM_INDEX_TEMPLATE_ID =
  "ixi-system-index-v1";


function clean(value) {
  return String(value ?? "").trim();
}


function getMosObjectId(object = {}) {
  return clean(
    object?.objectId ||
    object?.id?.uuid ||
    object?.id
  );
}


function safeObject(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  )
    ? value
    : {};
}


/*
 * Child-creation semantics are persisted configuration.
 *
 * We never derive a child definition from the parent's name.
 * The customer can call a container anything they want.
 */
function getPersistedChildDefaults(
  container = {}
) {
  const embeddedDefinition =
    safeObject(
      container?.definition ||
      container?.fields?.definition ||
      container?.metadata?.definition
    );

  const creation =
    safeObject(
      embeddedDefinition?.childCreation ||
      embeddedDefinition?.creation ||
      container?.capabilities?.childCreation ||
      container?.metadata?.childCreation
    );

  return {
    definitionId:
      clean(
        creation?.definitionId ||
        creation?.defaultDefinitionId
      ) || null,

    definitionKey:
      clean(
        creation?.definitionKey ||
        creation?.defaultDefinitionKey
      ) || null,

    cardTemplateSlug:
      clean(
        creation?.cardTemplateSlug ||
        creation?.templateSlug ||
        creation?.defaultCardTemplateSlug ||
        creation?.defaultTemplateSlug
      ) || null,

    cardTemplateVersion:
      creation?.cardTemplateVersion ??
      creation?.templateVersion ??
      creation?.defaultCardTemplateVersion ??
      creation?.defaultTemplateVersion ??
      null,

    displayName:
      clean(
        creation?.defaultDisplayName ||
        creation?.placeholderName
      ),

    businessIdentifiers:
      Array.isArray(
        creation?.defaultBusinessIdentifiers
      )
        ? creation.defaultBusinessIdentifiers
        : [],

    fields:
      safeObject(
        creation?.defaultFields
      ),

    metadata:
      safeObject(
        creation?.metadata
      )
  };
}


export default function useIXIMosObjectCreation({
  entityId,
  userId,
  workspaceSystemIndexes,
  workspacePlacements,
  setWorkspacePlacements,
  saveWorkspaceLayout,
  setAosObjects,
  setSystemIndexes,
  onObjectNotice = null
}) {

  async function reloadMosEnvironment() {
    const environment =
      await loadIXIMosEnvironment({
        includeObjects: true
      });

    setAosObjects?.(
      Array.isArray(environment?.objects)
        ? environment.objects
        : []
    );

    setSystemIndexes?.(
      Array.isArray(environment?.systemIndexes)
        ? environment.systemIndexes
        : []
    );

    return environment;
  }


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


  /* =========================================================
     ROOT SYSTEM INDEX CREATION

     System Index is an explicit IXI technical presentation role.
     The customer-supplied displayName remains unrestricted data.

     We intentionally DO NOT search by displayName and silently
     reuse another container. Names are presentation, not identity.
     ========================================================= */
  async function createRootSystemIndexByName(
    rawDisplayName
  ) {
    const displayName =
      clean(rawDisplayName);

    const resolvedEntityId =
      clean(entityId);

    if (!displayName) {
      throw new Error(
        "Index name is required."
      );
    }

    if (!resolvedEntityId) {
      throw new Error(
        "AOS Entity is not available."
      );
    }

    const response =
      await createMosObject({
        entityId:
          resolvedEntityId,

        /*
         * Technical migration path only.
         * This does not encode customer business meaning.
         */
        objectType:
          "system-index",

        cardTemplateSlug:
          IXI_SYSTEM_INDEX_TEMPLATE_ID,

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

          systemIndex:
            true,

          systemIndexPresentation:
            true,

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

    const environment =
      await reloadMosEnvironment();

    await exposeObjectToBoard(
      createdObjectId
    );

    return {
      created: true,
      existing: false,
      object: createdObject,
      objectId: createdObjectId,
      environment
    };
  }


  /* =========================================================
     UNIVERSAL CHILD CREATION

     Preferred path:
       definitionId / definitionKey

     Universal fallback:
       generic technical object

     Never:
       infer child meaning from the container's name.
     ========================================================= */
  async function createObjectInContainer({
    container,

    definitionId:
      rawDefinitionId = null,

    definitionKey:
      rawDefinitionKey = null,

    cardTemplateSlug:
      rawCardTemplateSlug = null,

    cardTemplateVersion = null,

    displayName:
      rawDisplayName,

    businessIdentifiers = null,

    fields = {},
    metadata = {},

    exposeToBoard = true
  }) {
    const destinationContainerId =
      getMosObjectId(
        container
      );

    const resolvedEntityId =
      clean(entityId);

    if (!destinationContainerId) {
      throw new Error(
        "Destination container is missing objectId."
      );
    }

    if (!resolvedEntityId) {
      throw new Error(
        "AOS Entity is not available."
      );
    }

    if (
      container?.capabilities?.canContain !==
      true
    ) {
      throw new Error(
        "Destination object is not a container."
      );
    }

    const defaults =
      getPersistedChildDefaults(
        container
      );

    const definitionId =
      clean(
        rawDefinitionId ||
        defaults.definitionId
      ) || null;

    const definitionKey =
      clean(
        rawDefinitionKey ||
        defaults.definitionKey
      ) || null;

    const cardTemplateSlug =
      clean(
        rawCardTemplateSlug ||
        defaults.cardTemplateSlug
      ) || null;

    const displayName =
      clean(
        rawDisplayName ||
        defaults.displayName ||
        "NEW OBJECT"
      );

    const resolvedBusinessIdentifiers =
      Array.isArray(
        businessIdentifiers
      )
        ? businessIdentifiers
        : defaults.businessIdentifiers;

    const createResponse =
      await createMosObject({
        entityId:
          resolvedEntityId,

        definitionId,
        definitionKey,

        /*
         * If no definition is selected yet, this remains a
         * technically generic MOS Object. No business meaning
         * is attached to the word generic.
         */
        objectType:
          definitionId || definitionKey
            ? null
            : "generic",

        displayName,

        businessIdentifiers:
          resolvedBusinessIdentifiers,

        cardTemplateSlug,

        cardTemplateVersion:
          cardTemplateVersion ??
          defaults.cardTemplateVersion ??
          null,

        fields: {
          ...defaults.fields,
          ...safeObject(fields)
        },

        source:
          "manual",

        actorId:
          userId || null,

        metadata: {
          ...defaults.metadata,

          createdFrom:
            "aos-container",

          createdInsideContainerId:
            destinationContainerId,

          ...safeObject(metadata)
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

        parentObjectId:
          destinationContainerId
      }
    });

    if (exposeToBoard) {
      await exposeObjectToBoard(
        createdObjectId
      );
    }

    const environment =
      await reloadMosEnvironment();

    return {
      object: createdObject,
      objectId: createdObjectId,
      parentObjectId:
        destinationContainerId,
      environment
    };
  }


  async function saveMosObjectName({
    objectId,
    displayName,
    fields,
    metadata
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

        ...(fields !== undefined
          ? { fields }
          : {}),

        actorId:
          userId || null,

        metadata: {
          ...safeObject(metadata),
          creationState:
            "complete"
        }
      });

    const updatedObject =
      response?.object ||
      response?.data ||
      response;

    await reloadMosEnvironment();

    onObjectNotice?.({
      objectId:
        id,

      message:
        `${name} SAVED`,

      tone:
        "success"
    });

    return {
      object: updatedObject,
      objectId: id
    };
  }


  async function deleteMosWorkspaceObject(
    object
  ) {
    const objectId =
      getMosObjectId(
        object
      );

    if (!objectId) {
      throw new Error(
        "Object ID is required."
      );
    }

    await deleteMosObject({
      objectId,
      actorId:
        userId || null
    });

    const nextPlacements = {};

    Object.entries(
      workspacePlacements || {}
    ).forEach(
      ([surfaceId, objectIds]) => {
        nextPlacements[surfaceId] =
          Array.isArray(objectIds)
            ? objectIds.filter(
                id =>
                  String(id) !==
                  objectId
              )
            : [];
      }
    );

    setWorkspacePlacements?.(
      nextPlacements
    );

    await saveWorkspaceLayout?.(
      nextPlacements
    );

    await reloadMosEnvironment();

    return {
      deleted: true,
      objectId
    };
  }


  return {
    reloadMosEnvironment,
    exposeObjectToBoard,
    createRootSystemIndexByName,
    createObjectInContainer,
    saveMosObjectName,
    deleteMosWorkspaceObject
  };
}
