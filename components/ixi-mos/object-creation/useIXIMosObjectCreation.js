import {
  createMosObject,
  placeMosObject,
  createMosCommandId,
  updateMosObject,
  deleteMosObject
} from "../../../lib/mos/ixiMosClient";

import { loadIXIMosEnvironment } from "../../../lib/mos/loadIXIMosEnvironment";
import { moveObjectToWorkspaceSurface } from "../../ixi-chassis/IXIWorkspacePlacementEngine";

function clean(value) {
  return String(value || "").trim();
}

function getMosObjectId(object = {}) {
  return clean(object?.objectId || object?.id?.uuid || object?.id);
}

function getPersistedChildDefaults(container = {}) {
  const definition =
    container?.definition ||
    container?.fields?.definition ||
    container?.metadata?.definition ||
    {};

  const creation =
    definition?.childCreation ||
    definition?.creation ||
    container?.capabilities?.childCreation ||
    container?.metadata?.childCreation ||
    {};

  return {
    objectType: clean(
      creation?.objectType ||
      creation?.defaultObjectType ||
      ""
    ),
    templateSlug: clean(
      creation?.templateSlug ||
      creation?.defaultTemplateSlug ||
      ""
    ),
    templateVersion:
      creation?.templateVersion ??
      creation?.defaultTemplateVersion ??
      null,
    displayName: clean(
      creation?.defaultDisplayName ||
      creation?.placeholderName ||
      ""
    ),
    fields:
      creation?.defaultFields &&
      typeof creation.defaultFields === "object" &&
      !Array.isArray(creation.defaultFields)
        ? creation.defaultFields
        : {},
    metadata:
      creation?.metadata &&
      typeof creation.metadata === "object" &&
      !Array.isArray(creation.metadata)
        ? creation.metadata
        : {}
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
    const environment = await loadIXIMosEnvironment({ includeObjects: true });

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

  async function exposeObjectToBoard(objectId, { position } = {}) {
    const id = clean(objectId);
    if (!id) return workspacePlacements;

    const nextPlacements = moveObjectToWorkspaceSurface({
      placements: workspacePlacements,
      objectId: id,
      targetSurface: "board",
      ...(position ? { position } : {})
    });

    setWorkspacePlacements?.(nextPlacements);
    await saveWorkspaceLayout?.(nextPlacements);
    return nextPlacements;
  }

  async function createRootSystemIndexByName(rawDisplayName) {
    const displayName = clean(rawDisplayName);
    const resolvedEntityId = clean(entityId);

    if (!displayName) throw new Error("Index name is required.");
    if (!resolvedEntityId) throw new Error("AOS Entity is not available.");

    const existingIndex = (
      Array.isArray(workspaceSystemIndexes)
        ? workspaceSystemIndexes
        : []
    ).find(index => {
      const existingName = clean(index?.displayName || index?.label).toLowerCase();
      return existingName === displayName.toLowerCase() && index?.metadata?.persisted === true;
    });

    if (existingIndex) {
      const existingObjectId = getMosObjectId(existingIndex);
      if (!existingObjectId) throw new Error("Persisted Index has no objectId.");

      await exposeObjectToBoard(existingObjectId);
      return {
        created: false,
        existing: true,
        object: existingIndex,
        objectId: existingObjectId
      };
    }

    const response = await createMosObject({
      entityId: resolvedEntityId,
      objectType: "system-index",
      displayName,
      fields: { parentSystemIndexId: null },
      source: "manual",
      actorId: userId || null,
      metadata: {
        createdFrom: "aos-work",
        hierarchyRole: "index"
      }
    });

    const createdObject = response?.object || response?.data || response;
    const createdObjectId = getMosObjectId(createdObject);

    if (!createdObjectId) {
      throw new Error("MOS created the Index but returned no objectId.");
    }

    const environment = await reloadMosEnvironment();
    await exposeObjectToBoard(createdObjectId);

    return {
      created: true,
      existing: false,
      object: createdObject,
      objectId: createdObjectId,
      environment
    };
  }

  async function createObjectInContainer({
    container,
    objectType: rawObjectType,
    templateSlug: rawTemplateSlug = "",
    templateVersion = null,
    displayName: rawDisplayName,
    fields = {},
    metadata = {},
    exposeToBoard = true
  }) {
    const destinationContainerId = getMosObjectId(container);
    const resolvedEntityId = clean(entityId);

    if (!destinationContainerId) {
      throw new Error("Destination container is missing objectId.");
    }

    if (!destinationContainerId.startsWith("object_")) {
      throw new Error("This container has not yet been migrated to the persisted AOS container model.");
    }

    if (!resolvedEntityId) {
      throw new Error("AOS Entity is not available.");
    }

    const defaults = getPersistedChildDefaults(container);

    /*
     * IMPORTANT:
     * No noun is manufactured here. The caller or the persisted
     * container/schema supplies objectType/template/name. If none is
     * supplied, the durable object remains generically typed.
     */
    const objectType = clean(rawObjectType || defaults.objectType || "generic").toLowerCase();
    const templateSlug = clean(rawTemplateSlug || defaults.templateSlug);
    const displayName = clean(rawDisplayName || defaults.displayName || "NEW OBJECT");

    const createResponse = await createMosObject({
      entityId: resolvedEntityId,
      objectType,
      templateSlug: templateSlug || null,
      templateVersion: templateVersion ?? defaults.templateVersion ?? null,
      displayName,
      fields: {
        ...defaults.fields,
        ...(fields || {})
      },
      source: "manual",
      actorId: userId || null,
      metadata: {
        ...defaults.metadata,
        createdFrom: "aos-container",
        createdInsideContainerId: destinationContainerId,
        ...(metadata || {})
      }
    });

    const createdObject = createResponse?.object || createResponse?.data || createResponse;
    const createdObjectId = getMosObjectId(createdObject);

    if (!createdObjectId) {
      throw new Error("MOS created the object but returned no objectId.");
    }

    await placeMosObject({
      objectId: createdObjectId,
      destinationContainerId,
      actorId: userId || null,
      commandId: createMosCommandId("container-add"),
      metadata: {
        source: "aos-container",
        parentObjectId: destinationContainerId
      }
    });

    if (exposeToBoard) {
      await exposeObjectToBoard(createdObjectId);
    }

    const environment = await reloadMosEnvironment();

    return {
      object: createdObject,
      objectId: createdObjectId,
      parentObjectId: destinationContainerId,
      environment
    };
  }

  async function saveMosObjectName({
    objectId,
    displayName,
    fields,
    metadata
  }) {
    const id = clean(objectId);
    const name = clean(displayName);

    if (!id) throw new Error("Object ID is required.");
    if (!name) throw new Error("Object name is required.");

    const response = await updateMosObject({
      objectId: id,
      displayName: name,
      ...(fields !== undefined ? { fields } : {}),
      actorId: userId || null,
      metadata: {
        ...(metadata || {}),
        creationState: "complete"
      }
    });

    const updatedObject = response?.object || response?.data || response;
    await reloadMosEnvironment();

    onObjectNotice?.({
      objectId: id,
      message: `${name} SAVED`,
      tone: "success"
    });

    return {
      object: updatedObject,
      objectId: id
    };
  }

  async function deleteMosWorkspaceObject(object) {
    const objectId = getMosObjectId(object);
    if (!objectId) throw new Error("Object ID is required.");

    await deleteMosObject({
      objectId,
      actorId: userId || null
    });

    const nextPlacements = {};

    Object.entries(workspacePlacements || {}).forEach(([surfaceId, objectIds]) => {
      nextPlacements[surfaceId] = Array.isArray(objectIds)
        ? objectIds.filter(id => String(id) !== objectId)
        : [];
    });

    setWorkspacePlacements?.(nextPlacements);
    await saveWorkspaceLayout?.(nextPlacements);
    await reloadMosEnvironment();

    return { deleted: true, objectId };
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
