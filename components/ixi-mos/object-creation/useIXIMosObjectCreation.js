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

import {
  getAosTemplateNumber
} from "../../../lib/mos/ixiAosSystemObjectTemplateContract.mjs";

import {
  getAosHierarchyDisplayName,
  IXI_AOS_SYSTEM_INDEX_LABEL
} from "../../../lib/mos/ixiAosHierarchyContract.mjs";


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


function isPersonObject(object = {}) {
  const objectType = clean(
    object?.objectType ||
    object?.type ||
    object?.definition?.objectType ||
    object?.metadata?.objectType
  ).toLowerCase();

  return objectType === "person" || objectType === "employee";
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

      next[surfaceId] = [
        ...new Set(
          ids.map(objectId =>
            String(objectId) === fromId
              ? toId
              : String(objectId)
          )
        )
      ];
    }
  );

  return next;
}


function removeWorkspaceObjectId(
  placements,
  objectId
) {
  const id = clean(objectId);
  const next = {};

  Object.entries(
    placements || {}
  ).forEach(
    ([surfaceId, objectIds]) => {
      next[surfaceId] =
        Array.isArray(objectIds)
          ? objectIds.filter(
              candidate =>
                String(candidate) !== id
            )
          : [];
    }
  );

  return next;
}


/*
 * Child creation semantics come only from
 * persisted definition/capability metadata.
 *
 * No customer-facing noun, container name,
 * category label or business term is used to
 * infer what the child means.
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
  workspacePlacements,
  setWorkspacePlacements,
  saveWorkspaceLayout,
  setAosObjects,
  setSystemIndexes,
  onObjectNotice = null
}) {
  /*
   * DRAFT LAW
   *
   * A container + action creates only one
   * browser-memory draft. It has no MOS
   * identity, no Passport and no TRAN$ACT
   * identity until SAVE commits it.
   */
  const draftObjectsRef =
    useRef(new Map());

  /*
   * One in-flight commit per draft. This is
   * an additional browser-side guard on top
   * of IX-Core idempotency. Double clicks,
   * repeated callbacks and network timing
   * cannot create parallel commit attempts
   * for the same draft.
   */
  const draftCommitPromisesRef =
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
    container = null,
    rootContainer = false,
    definitionId = null,
    definitionKey = null,
    objectType = null,
    cardTemplateSlug = null,
    cardTemplateVersion = null,
    businessIdentifiers = [],
    fields = {},
    fieldDefinitions = [],
    metadata = {},
    exposeToBoard = true
  }) {
    const resolvedEntityId =
      clean(entityId);

    const destinationContainerId =
      getMosObjectId(container);

    if (!resolvedEntityId) {
      throw new Error(
        "AOS Entity is not available."
      );
    }

    if (!rootContainer && !destinationContainerId) {
      throw new Error(
        "Destination container is missing objectId."
      );
    }

    const draftId =
      createAosDraftId();

    const timestamp =
      new Date().toISOString();

    const draftObject = {
      objectId:
        draftId,

      entityId:
        resolvedEntityId,

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

      fieldDefinitions:
        safeArray(fieldDefinitions),

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
        canMove: true,
        ...(rootContainer
          ? {
              canContain: true,
              canCreate: true,
              canOpenStack: true,
              canMoveToBoard: true,
              canTransact: true,
              editable: true,
              hasConsole: true,
              hasRail: true,
              hasRelationships: true
            }
          : {})
      },

      metadata: {
        ...safeObject(metadata),
        draftOnly: true,
        creationState: "naming",
        persistenceState: "client-only",
        destinationContainerId:
          destinationContainerId || null,
        rootContainer:
          Boolean(rootContainer)
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
       * Never persist a draft ID into the
       * durable workspace layout. A reload
       * therefore cannot resurrect a draft.
       */
    }

    return {
      draft: true,
      created: false,
      persisted: false,
      object:
        draftObject,
      objectId:
        draftId,
      parentObjectId:
        destinationContainerId || null
    };
  }


  /* =========================================================
     ROOT CUSTOMER CONTAINER DRAFT

     The scoreboard + chooses presentation only. The customer
     supplies business meaning through the card editor. No MOS
     Object or Passport exists until SAVE provisions this draft.
     ========================================================= */
  function createRootContainerDraft({
    template = {},
    fields = {},
    metadata = {}
  } = {}) {
    const sourceTemplate =
      safeObject(template);

    const templateNumber =
      getAosTemplateNumber(
        sourceTemplate
      );

    const cardTemplateSlug =
      clean(sourceTemplate?.templateSlug);

    if (
      !templateNumber ||
      !cardTemplateSlug
    ) {
      throw new Error(
        "Choose an AOS Card from 001 through 017."
      );
    }

    return createClientOnlyDraft({
      rootContainer: true,
      definitionId:
        clean(sourceTemplate?.definitionId) || null,
      definitionKey:
        clean(sourceTemplate?.definitionKey) || null,
      objectType:
        "container",
      cardTemplateSlug,
      cardTemplateVersion:
        sourceTemplate?.version ?? null,
      fields: {
        ...safeObject(fields)
      },
      fieldDefinitions:
        safeArray(sourceTemplate?.fieldSchema)
          .map((definition, index) => ({
            ...safeObject(definition),
            fieldId:
              clean(
                definition?.fieldId ||
                definition?.field
              ) || `field-${index + 1}`,
            label:
              clean(definition?.label) ||
              `FIELD ${index + 1}`
          })),
      metadata: {
        ...safeObject(metadata),
        cardNumber:
          String(templateNumber).padStart(3, "0"),
        templateSlug:
          cardTemplateSlug,
        templateLabel:
          clean(sourceTemplate?.label),
        customerDefined:
          true,
        createdFrom:
          "aos-scoreboard-plus",
        parentDisplayName:
          IXI_AOS_SYSTEM_INDEX_LABEL,
        creationState:
          "naming",
        persistenceState:
          "client-only"
      },
      exposeToBoard: true
    });
  }


  /* =========================================================
     CHILD CUSTOMER CONTAINER DRAFT

     Card + uses the same 001-017 presentation selector as the
     scoreboard. The clicked card supplies hierarchy only; the
     selected template supplies the new child's card contract.
     SAVE remains the only Passport/provisioning transition.
     ========================================================= */
  function createChildContainerDraft({
    container,
    template = {},
    fields = {},
    metadata = {}
  } = {}) {
    const destinationContainerId =
      getMosObjectId(container);

    if (!destinationContainerId) {
      throw new Error(
        "Destination container is missing objectId."
      );
    }

    if (
      container?.capabilities?.canContain !== true &&
      container?.capabilities?.canCreate !== true &&
      !isPersonObject(container)
    ) {
      throw new Error(
        "Destination object does not allow child creation."
      );
    }

    const sourceTemplate =
      safeObject(template);

    const templateNumber =
      getAosTemplateNumber(
        sourceTemplate
      );

    const cardTemplateSlug =
      clean(sourceTemplate?.templateSlug);

    if (
      !templateNumber ||
      !cardTemplateSlug
    ) {
      throw new Error(
        "Choose an AOS Card from 001 through 017."
      );
    }

    return createClientOnlyDraft({
      container,
      definitionId:
        clean(sourceTemplate?.definitionId) || null,
      definitionKey:
        clean(sourceTemplate?.definitionKey) || null,
      objectType:
        "container",
      cardTemplateSlug,
      cardTemplateVersion:
        sourceTemplate?.version ?? null,
      fields: {
        ...safeObject(fields)
      },
      fieldDefinitions:
        safeArray(sourceTemplate?.fieldSchema)
          .map((definition, index) => ({
            ...safeObject(definition),
            fieldId:
              clean(
                definition?.fieldId ||
                definition?.field
              ) || `field-${index + 1}`,
            label:
              clean(definition?.label) ||
              `FIELD ${index + 1}`
          })),
      metadata: {
        ...safeObject(metadata),
        cardNumber:
          String(templateNumber).padStart(3, "0"),
        templateSlug:
          cardTemplateSlug,
        templateLabel:
          clean(sourceTemplate?.label),
        customerDefined:
          true,
        createdFrom:
          "aos-container-plus",
        createdInsideContainerId:
          destinationContainerId,
        parentObjectId:
          destinationContainerId,
        parentDisplayName:
          getAosHierarchyDisplayName(
            container
          ),
        creationState:
          "naming",
        persistenceState:
          "client-only"
      },
      exposeToBoard: true
    });
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

    const resolvedDraftId =
      clean(draftId);

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

    if (!resolvedDraftId) {
      throw new Error(
        "AOS draft identity is required for permanent creation."
      );
    }

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
          draftOnly: false,
          creationState:
            "complete",
          persistenceState:
            "permanent"
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

    if (
      response?.transact?.eligible !== true
    ) {
      throw new Error(
        "IX-Core provisioned the object without verified TRAN$ACT eligibility."
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

     This operation receives the customer's
     completed name before provisioning. The
     technical System Index presentation role
     never supplies customer business meaning.
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

     HARD BOUNDARY:

     This function NEVER provisions a permanent
     object. Container + means "open a draft".
     SAVE is the only transition to permanent
     Object + Passport + TRAN$ACT identity.
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
    businessIdentifiers = null,
    fields = {},
    metadata = {},
    exposeToBoard = true
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
      container?.capabilities?.canContain !== true &&
      container?.capabilities?.canCreate !== true &&
      !isPersonObject(container)
    ) {
      throw new Error(
        "Destination object does not allow child creation."
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
      ...safeObject(metadata),
      createdFrom:
        clean(metadata?.createdFrom) ||
        "aos-container-plus",
      createdInsideContainerId:
        destinationContainerId,
      parentObjectId:
        destinationContainerId,
      parentDisplayName:
        getAosHierarchyDisplayName(
          container
        ),
      creationState:
        "naming",
      persistenceState:
        "client-only"
    };

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


  async function commitDraftObject({
    id,
    name,
    businessIdentifiers,
    fields,
    fieldDefinitions,
    media,
    metadata
  }) {
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
        Array.isArray(businessIdentifiers)
          ? businessIdentifiers
          : draft.businessIdentifiers,
      fields: {
        ...safeObject(draft.fields),
        ...safeObject(fields)
      },
      media:
        Array.isArray(media)
          ? media
          : draft.media,
      cardTemplateSlug:
        draft.cardTemplateSlug,
      cardTemplateVersion:
        draft.cardTemplateVersion,
      source:
        "manual",
      metadata: {
        ...safeObject(draft.metadata),
        ...safeObject(metadata),
        ...(Array.isArray(fieldDefinitions)
          ? { fieldDefinitions }
          : {}),
        draftOnly:
          false,
        creationState:
          "complete",
        persistenceState:
          "permanent"
      }
    });

    /*
     * The draft remains intact until the
     * Object, Passport, TRAN$ACT identity,
     * canonical containment and durable
     * workspace-ID replacement all succeed.
     *
     * A failure before this point can safely
     * retry the same draft/idempotency keys.
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
      created: true,
      draft: false,
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


  async function saveMosObjectName({
    objectId,
    displayName,
    businessIdentifiers,
    fields,
    fieldDefinitions,
    media,
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
       DRAFT -> PERMANENT COMMIT
       ===================================================== */
    if (isAosDraftId(id)) {
      const existingCommit =
        draftCommitPromisesRef.current.get(id);

      if (existingCommit) {
        return existingCommit;
      }

      const commitPromise =
        commitDraftObject({
          id,
          name,
          businessIdentifiers,
          fields,
          fieldDefinitions,
          media,
          metadata
        });

      draftCommitPromisesRef.current.set(
        id,
        commitPromise
      );

      try {
        return await commitPromise;
      } finally {
        if (
          draftCommitPromisesRef.current.get(id) ===
          commitPromise
        ) {
          draftCommitPromisesRef.current.delete(id);
        }
      }
    }

    /* =====================================================
       PERMANENT OBJECT EDIT

       Editing a durable object never creates
       another Object or another Passport.
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
            "complete",
          persistenceState:
            "permanent"
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
     * Canceling a draft deletes browser state
     * only. There is intentionally no server
     * identity to delete.
     */
    if (isAosDraftId(objectId)) {
      if (
        draftCommitPromisesRef.current.has(
          objectId
        )
      ) {
        throw new Error(
          "This object is currently being saved. Wait for the save to finish before deleting it."
        );
      }

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

      const nextPlacements =
        removeWorkspaceObjectId(
          workspacePlacements,
          objectId
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

    const nextPlacements =
      removeWorkspaceObjectId(
        workspacePlacements,
        objectId
      );

    setWorkspacePlacements?.(
      nextPlacements
    );

    const cleanupResults =
      await Promise.allSettled([
        Promise.resolve(
          saveWorkspaceLayout?.(
            nextPlacements
          )
        ),
        Promise.resolve(
          reloadMosEnvironment()
        )
      ]);

    onObjectNotice?.({
      objectId,
      message:
        "OBJECT PERMANENTLY DELETED",
      tone:
        "success"
    });

    return {
      deleted: true,
      objectId,
      workspaceCleanupComplete:
        cleanupResults.every(
          result =>
            result.status ===
            "fulfilled"
        )
    };
  }


  return {
    reloadMosEnvironment,
    exposeObjectToBoard,
    createRootSystemIndexByName,
    createRootContainerDraft,
    createChildContainerDraft,
    createObjectInContainer,
    saveMosObjectName,
    deleteMosWorkspaceObject
  };
}
