import {
  useRef
} from "react";

import {
  placeMosObject,
  updateMosObject,
  deleteMosObject
} from "../../../lib/mos/ixiMosClient";

import {
  provisionAosObject
} from "../../../lib/mos/ixiAosProvisioningClient";

import {
  createAosDraftId,
  isAosDraftId
} from "../../../lib/mos/ixiAosProvisioningContract";

import {
  loadIXIMosEnvironment
} from "../../../lib/mos/loadIXIMosEnvironment";

import {
  moveObjectToWorkspaceSurface
} from "../../ixi-chassis/IXIWorkspacePlacementEngine";


const IXI_SYSTEM_INDEX_TEMPLATE_ID =
  "ixi-system-index-v1";

const DRAFT_DISPLAY_NAME =
  "NEW OBJECT";


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


function safeArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}


function replaceWorkspaceObjectId(
  placements,
  fromObjectId,
  toObjectId
) {
  const fromId = clean(fromObjectId);
  const toId = clean(toObjectId);

  if (!fromId || !toId) {
    return placements || {};
  }

  const next = {};

  Object.entries(
    placements || {}
  ).forEach(
    ([surfaceId, objectIds]) => {
      const ids =
        Array.isArray(objectIds)
          ? objectIds
          : [];

      const replaced =
        ids.map(objectId =>
          String(objectId) === fromId
            ? toId
            : String(objectId)
        );

      next[surfaceId] = [
        ...new Set(replaced)
      ];
    }
  );

  return next;
}


/*
 * Child-creation semantics are persisted configuration.
 *
 * We never derive child meaning from the parent's name.
 * Customer vocabulary remains customer data.
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
      safeArray(
        creation?.defaultBusinessIdentifiers
      ),

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
  /*
   * Drafts live in browser memory only.
   * They are deliberately absent from MOS,
   * Passport, TRAN$ACT and persistent indexes.
   */
  const draftObjectsRef =
    useRef(new Map());


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
    const id = clean(objectId);

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


  function createClientOnlyDraft({
    container,
    definitionId = null,
    definitionKey = null,
    objectType = null,
    cardTemplateSlug = null,
    cardTemplateVersion = null,
    businessIdentifiers = [],
    fields = {},
    metadata = {},
    exposeToBoard = true
  }) {
    const destinationContainerId =
      getMosObjectId(container);

    const draftId =
      createAosDraftId();

    const timestamp =
      new Date().toISOString();

    const draftObject = {
      objectId:
        draftId,

      entityId:
        clean(entityId),

      definitionId:
        clean(definitionId) || null,

      definitionKey:
        clean(definitionKey) || null,

      objectType:
        clean(objectType) || "generic",

      displayName:
        DRAFT_DISPLAY_NAME,

      businessIdentifiers:
        safeArray(businessIdentifiers),

      fields:
        safeObject(fields),

      media: [],

      cardTemplateSlug:
        clean(cardTemplateSlug) || null,

      cardTemplateVersion:
        cardTemplateVersion ?? null,

      directContainerId:
        destinationContainerId || null,

      status:
        "draft",

      source:
        "aos-client-draft",

      capabilities: {
        canMove: true
      },

      metadata: {
        ...safeObject(metadata),

        draftOnly: true,
        creationState: "naming",
        destinationContainerId
      },

      createdAt:
        timestamp,

      updatedAt:
        timestamp
    };

    draftObjectsRef.current.set(
      draftId,
      draftObject
    );

    setAosObjects?.(current => [
      ...(Array.isArray(current)
        ? current
        : []),
      draftObject
    ]);

    if (exposeToBoard) {
      const nextPlacements =
        moveObjectToWorkspaceSurface({
          placements:
            workspacePlacements,
          objectId:
            draftId,
          targetSurface:
            "board"
        });

      setWorkspacePlacements?.(
        nextPlacements
      );

      /*
       * Draft placement is intentionally not
       * persisted. Only permanent object IDs
       * belong in durable workspace layout.
       */
    }

    return {
      draft: true,
      created: false,
      object:
        draftObject,
      objectId:
        draftId,
      parentObjectId:
        destinationContainerId
    };
  }


  async function placeProvisionedObject({
    objectId,
    destinationContainerId,
    draftId,
    metadata = {}
  }) {
    if (!destinationContainerId) {
      return null;
    }

    return placeMosObject({
      objectId,
      destinationContainerId,
      actorId:
        userId || null,

      /*
       * Stable across a retry of this draft.
       * Container placement therefore follows
       * the same idempotent commit intent.
       */
      commandId:
        `aos-place:${draftId}`,

      metadata: {
        source:
          "aos-container",
        parentObjectId:
          destinationContainerId,
        provisioningDraftId:
          draftId,
        ...safeObject(metadata)
      }
    });
  }


  async function provisionPermanentObject({
    draftId,
    destinationContainerId = null,
    definitionId = null,
    definitionKey = null,
    objectType = null,
    displayName,
    businessIdentifiers = [],
    fields = {},
    media = [],
    cardTemplateSlug = null,
    cardTemplateVersion = null,
    source = "manual",
    metadata = {}
  }) {
    const resolvedEntityId =
      clean(entityId);

    const name =
      clean(displayName);

    if (!resolvedEntityId) {
      throw new Error(
        "AOS Entity is not available."
      );
    }

    if (!name) {
      throw new Error(
        "Object name is required before permanent creation."
      );
    }

    const resolvedDraftId =
      clean(draftId) ||
      createAosDraftId();

    const response =
      await provisionAosObject({
        entityId:
          resolvedEntityId,
        definitionId,
        definitionKey,
        objectType,
        displayName:
          name,
        businessIdentifiers:
          safeArray(businessIdentifiers),
        fields:
          safeObject(fields),
        media:
          safeArray(media),
        cardTemplateSlug,
        cardTemplateVersion,
        source,
        actorId:
          userId || null,
        draftId:
          resolvedDraftId,
        metadata: {
          ...safeObject(metadata),
          creationState:
            "complete"
        }
      });

    const createdObject =
      response?.object;

    const createdObjectId =
      getMosObjectId(
        createdObject
      );

    if (!createdObjectId) {
      throw new Error(
        "IX-Core provisioned the object but returned no objectId."
      );
    }

    if (
      !clean(
        response?.identity?.passportId
      )
    ) {
      throw new Error(
        "IX-Core provisioned the object without verified Passport identity."
      );
    }

    await placeProvisionedObject({
      objectId:
        createdObjectId,
      destinationContainerId,
      draftId:
        resolvedDraftId,
      metadata
    });

    return {
      response,
      createdObject,
      createdObjectId,
      draftId:
        resolvedDraftId
    };
  }


  /* =========================================================
     ROOT SYSTEM INDEX CREATION

     System Index is an IXI technical presentation role.
     Customer displayName remains unrestricted customer data.
     ========================================================= */
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

    const draftId =
      createAosDraftId();

    const {
      response,
      createdObject,
      createdObjectId
    } = await provisionPermanentObject({
      draftId,
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

    const environment =
      await reloadMosEnvironment();

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
      passport:
        response.passport,
      identity:
        response.identity,
      transact:
        response.transact,
      environment
    };
  }


  /* =========================================================
     UNIVERSAL CHILD CREATION

     + begins a browser-only draft when the
     caller has not supplied a real name yet.

     No MOS object, Passport or TRAN$ACT
     identity exists until save.
     ========================================================= */
  async function createObjectInContainer({
    container,
    definitionId:
      rawDefinitionId = null,
    definitionKey:
      rawDefinitionKey = null,
    objectType:
      rawObjectType = null,
    cardTemplateSlug:
      rawCardTemplateSlug = null,
    cardTemplateVersion = null,
    displayName:
      rawDisplayName,
    businessIdentifiers = null,
    fields = {},
    metadata = {},
    exposeToBoard = true,
    draftId:
      suppliedDraftId = null
  }) {
    const destinationContainerId =
      getMosObjectId(container);

    if (!destinationContainerId) {
      throw new Error(
        "Destination container is missing objectId."
      );
    }

    if (!clean(entityId)) {
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

    const objectType =
      clean(rawObjectType) ||
      (
        definitionId || definitionKey
          ? null
          : "generic"
      );

    const cardTemplateSlug =
      clean(
        rawCardTemplateSlug ||
        defaults.cardTemplateSlug
      ) || null;

    const displayName =
      clean(
        rawDisplayName ||
        defaults.displayName
      );

    const resolvedBusinessIdentifiers =
      Array.isArray(businessIdentifiers)
        ? businessIdentifiers
        : defaults.businessIdentifiers;

    const resolvedFields = {
      ...defaults.fields,
      ...safeObject(fields)
    };

    const resolvedMetadata = {
      ...defaults.metadata,
      createdFrom:
        "aos-container",
      createdInsideContainerId:
        destinationContainerId,
      ...safeObject(metadata)
    };

    /*
     * The old flow persisted "NEW OBJECT".
     * It is now treated strictly as a draft
     * placeholder and never sent to IX-Core.
     */
    if (
      !displayName ||
      displayName === DRAFT_DISPLAY_NAME ||
      resolvedMetadata.creationState ===
        "naming"
    ) {
      return createClientOnlyDraft({
        container,
        definitionId,
        definitionKey,
        objectType,
        cardTemplateSlug,
        cardTemplateVersion:
          cardTemplateVersion ??
          defaults.cardTemplateVersion ??
          null,
        businessIdentifiers:
          resolvedBusinessIdentifiers,
        fields:
          resolvedFields,
        metadata:
          resolvedMetadata,
        exposeToBoard
      });
    }

    const draftId =
      clean(suppliedDraftId) ||
      createAosDraftId();

    const {
      response,
      createdObject,
      createdObjectId
    } = await provisionPermanentObject({
      draftId,
      destinationContainerId,
      definitionId,
      definitionKey,
      objectType,
      displayName,
      businessIdentifiers:
        resolvedBusinessIdentifiers,
      fields:
        resolvedFields,
      cardTemplateSlug,
      cardTemplateVersion:
        cardTemplateVersion ??
        defaults.cardTemplateVersion ??
        null,
      source:
        "manual",
      metadata:
        resolvedMetadata
    });

    if (exposeToBoard) {
      await exposeObjectToBoard(
        createdObjectId
      );
    }

    const environment =
      await reloadMosEnvironment();

    return {
      object:
        createdObject,
      objectId:
        createdObjectId,
      parentObjectId:
        destinationContainerId,
      passport:
        response.passport,
      identity:
        response.identity,
      transact:
        response.transact,
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

    /* =====================================================
       DRAFT COMMIT
       ===================================================== */
    if (isAosDraftId(id)) {
      const draft =
        draftObjectsRef.current.get(id);

      if (!draft) {
        throw new Error(
          "AOS draft is no longer available. Re-open creation and try again."
        );
      }

      const destinationContainerId =
        clean(
          draft?.metadata
            ?.destinationContainerId ||
          draft?.directContainerId
        ) || null;

      const {
        response,
        createdObject,
        createdObjectId
      } = await provisionPermanentObject({
        draftId:
          id,
        destinationContainerId,
        definitionId:
          draft.definitionId,
        definitionKey:
          draft.definitionKey,
        objectType:
          draft.objectType,
        displayName:
          name,
        businessIdentifiers:
          draft.businessIdentifiers,
        fields: {
          ...safeObject(draft.fields),
          ...safeObject(fields)
        },
        media:
          draft.media,
        cardTemplateSlug:
          draft.cardTemplateSlug,
        cardTemplateVersion:
          draft.cardTemplateVersion,
        source:
          "manual",
        metadata: {
          ...safeObject(draft.metadata),
          ...safeObject(metadata),
          draftOnly:
            false,
          creationState:
            "complete"
        }
      });

      /*
       * Do not mutate/remove the draft until
       * Object + Passport + containment have
       * all succeeded. If any step fails, the
       * same draftId can safely retry.
       */
      const nextPlacements =
        replaceWorkspaceObjectId(
          workspacePlacements,
          id,
          createdObjectId
        );

      setWorkspacePlacements?.(
        nextPlacements
      );

      await saveWorkspaceLayout?.(
        nextPlacements
      );

      draftObjectsRef.current.delete(id);

      const environment =
        await reloadMosEnvironment();

      onObjectNotice?.({
        objectId:
          createdObjectId,
        message:
          `${name} SAVED`,
        tone:
          "success"
      });

      return {
        object:
          createdObject,
        objectId:
          createdObjectId,
        passport:
          response.passport,
        identity:
          response.identity,
        transact:
          response.transact,
        environment
      };
    }

    /* =====================================================
       PERMANENT OBJECT EDIT

       Editing never provisions a new Passport.
       ===================================================== */
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
      object:
        updatedObject,
      objectId:
        id
    };
  }


  async function deleteMosWorkspaceObject(
    object
  ) {
    const objectId =
      getMosObjectId(object);

    if (!objectId) {
      throw new Error(
        "Object ID is required."
      );
    }

    /*
     * Canceling an unsaved draft has no
     * server-side identity to delete.
     */
    if (isAosDraftId(objectId)) {
      draftObjectsRef.current.delete(
        objectId
      );

      setAosObjects?.(current =>
        (Array.isArray(current)
          ? current
          : []
        ).filter(
          item =>
            getMosObjectId(item) !==
            objectId
        )
      );

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

      return {
        deleted: true,
        draft: true,
        objectId
      };
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
