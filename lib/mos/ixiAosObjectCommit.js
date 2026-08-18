import {
  fetchMosObject,
  updateMosObject
} from "./ixiMosClient";

import {
  getAosPassportId
} from "./ixiAosProvisioningContract";

import {
  provisionAosObject
} from "./ixiAosProvisioningClient";

import {
  ensureStudioDefinition
} from "./ixiAosDefinitionLifecycle";

export const IXI_AOS_OBJECT_COMMIT_VERSION =
  "ixi-aos-object-commit-v1";

const SYSTEM_PLACEHOLDER_NAMES = new Set([
  "UNTITLED OBJECT",
  "NEW OBJECT"
]);

function clean(value) {
  return String(value ?? "").trim();
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function extractObject(payload) {
  return (
    payload?.object ||
    payload?.data?.object ||
    payload?.record ||
    null
  );
}

export function assertDurableCustomerName(
  displayName
) {
  const name = clean(displayName);

  if (
    !name ||
    SYSTEM_PLACEHOLDER_NAMES.has(
      name.toUpperCase()
    )
  ) {
    const error = new Error(
      "Name the Object before permanent creation."
    );
    error.code =
      "AOS_OBJECT_CUSTOMER_NAME_REQUIRED";
    throw error;
  }

  return name;
}

function createPresentationMetadata({
  launchPayload,
  channel
}) {
  const studio = safeObject(
    launchPayload?.studio
  );

  return {
    cardDefinition: clone(
      safeObject(
        launchPayload?.cardDefinition
      )
    ),
    objectStudio: {
      contractVersion:
        clean(
          launchPayload?.contractVersion
        ) || "ixi-object-launch-v1",
      channel:
        clean(channel) || "studio",
      draftId:
        clean(studio.draftId),
      revision:
        Number(studio.revision || 0),
      templateSource: clone(
        safeObject(
          launchPayload?.templateSource
        )
      )
    }
  };
}

export function buildProvisioningInputFromStudioLaunch({
  launchPayload,
  entityId,
  actorId = null
} = {}) {
  if (
    clean(
      launchPayload?.contractVersion
    ) !== "ixi-object-launch-v1"
  ) {
    const error = new Error(
      "Unsupported Object Studio launch contract."
    );
    error.code =
      "AOS_STUDIO_LAUNCH_CONTRACT_INVALID";
    throw error;
  }

  const object = safeObject(
    launchPayload?.object
  );
  const studio = safeObject(
    launchPayload?.studio
  );

  const displayName =
    assertDurableCustomerName(
      object.displayName
    );

  const draftId = clean(studio.draftId);
  if (!draftId) {
    const error = new Error(
      "Object Studio launch requires a stable draftId."
    );
    error.code =
      "AOS_STUDIO_DRAFT_ID_REQUIRED";
    throw error;
  }

  const sourceMetadata = safeObject(
    object.metadata
  );

  return {
    entityId: clean(entityId),
    definitionId:
      clean(
        object.definitionId ||
        sourceMetadata.definitionId
      ) || null,
    definitionKey:
      clean(
        object.definitionKey ||
        sourceMetadata.definitionKey
      ) || null,
    objectType:
      clean(object.objectType) || null,
    displayName,
    businessIdentifiers:
      safeArray(
        object.businessIdentifiers
      ),
    fields: safeObject(object.fields),
    media: safeArray(object.media),
    cardTemplateSlug:
      clean(object.cardTemplateSlug) || null,
    cardTemplateVersion:
      object.cardTemplateVersion ?? null,
    source: "object-studio",
    sourceReference: draftId,
    draftId,
    actorId: clean(actorId) || null,
    metadata: {
      ...sourceMetadata,
      fieldDefinitions: clone(
        safeArray(
          object.fieldDefinitions
        )
      ),
      ...createPresentationMetadata({
        launchPayload,
        channel: "studio"
      })
    }
  };
}

export function normalizeExternalCommitEnvelope(
  envelope = {}
) {
  const source = safeObject(envelope);

  if (
    clean(source.contractVersion) !==
      IXI_AOS_OBJECT_COMMIT_VERSION
  ) {
    const error = new Error(
      "Unsupported AOS Object commit contract."
    );
    error.code =
      "AOS_COMMIT_CONTRACT_INVALID";
    throw error;
  }

  const channel = clean(source.channel)
    .toLowerCase();

  if (!["api", "chat"].includes(channel)) {
    const error = new Error(
      "External AOS commit channel must be api or chat."
    );
    error.code =
      "AOS_COMMIT_CHANNEL_INVALID";
    throw error;
  }

  const requestId = clean(source.requestId);
  if (!requestId) {
    const error = new Error(
      "External AOS commit requires requestId for idempotency."
    );
    error.code =
      "AOS_COMMIT_REQUEST_ID_REQUIRED";
    throw error;
  }

  const object = safeObject(source.object);

  return {
    channel,
    requestId,
    input: {
      entityId: clean(source.entityId),
      definitionId:
        clean(object.definitionId) || null,
      definitionKey:
        clean(object.definitionKey) || null,
      objectType:
        clean(object.objectType) || null,
      displayName:
        assertDurableCustomerName(
          object.displayName
        ),
      businessIdentifiers:
        safeArray(
          object.businessIdentifiers
        ),
      fields: safeObject(object.fields),
      media: safeArray(object.media),
      cardTemplateSlug:
        clean(object.cardTemplateSlug) || null,
      cardTemplateVersion:
        object.cardTemplateVersion ?? null,
      source: `trusted-${channel}`,
      sourceReference: requestId,
      draftId: requestId,
      actorId: clean(source.actorId) || null,
      metadata: {
        ...safeObject(object.metadata),
        commitEnvelope: {
          contractVersion:
            IXI_AOS_OBJECT_COMMIT_VERSION,
          channel,
          requestId
        }
      }
    }
  };
}

async function fetchAuthoritativeObject(
  objectId
) {
  const payload = await fetchMosObject(
    objectId
  );
  return extractObject(payload);
}

async function updateStudioObject({
  launchPayload,
  entityId,
  actorId
}) {
  const objectDraft = safeObject(
    launchPayload?.object
  );
  const objectId = clean(
    objectDraft.objectId
  );

  if (!objectId) {
    const error = new Error(
      "Object Studio edit requires permanent objectId."
    );
    error.code =
      "AOS_STUDIO_EDIT_OBJECT_ID_REQUIRED";
    throw error;
  }

  const current =
    await fetchAuthoritativeObject(
      objectId
    );

  if (!current) {
    const error = new Error(
      "Object Studio could not load the permanent Object before update."
    );
    error.code =
      "AOS_STUDIO_EDIT_OBJECT_NOT_FOUND";
    throw error;
  }

  if (
    clean(current.entityId) !==
      clean(entityId)
  ) {
    const error = new Error(
      "Object Studio Object does not belong to the active AOS Entity."
    );
    error.code =
      "AOS_STUDIO_EDIT_ENTITY_MISMATCH";
    throw error;
  }

  const passportId =
    getAosPassportId(current);

  if (!passportId) {
    const error = new Error(
      "Permanent Object is missing IXI Passport identity."
    );
    error.code =
      "AOS_STUDIO_EDIT_PASSPORT_MISSING";
    throw error;
  }

  /*
   * Definition identity is immutable at the Object update boundary.
   * Studio may synchronize an existing definition, but it may not
   * silently attach a newly created definition to an already-born
   * Object until IX-Core exposes an audited reassignment command.
   */
  if (
    clean(objectDraft.definitionId) &&
    clean(current.definitionId) &&
    clean(objectDraft.definitionId) !==
      clean(current.definitionId)
  ) {
    const error = new Error(
      "Object Studio cannot silently replace a permanent Object Definition."
    );
    error.code =
      "AOS_STUDIO_DEFINITION_REASSIGNMENT_FORBIDDEN";
    throw error;
  }

  const metadata = {
    ...safeObject(current.metadata),
    ...safeObject(objectDraft.metadata),
    fieldDefinitions: clone(
      safeArray(
        objectDraft.fieldDefinitions
      )
    ),
    ...createPresentationMetadata({
      launchPayload,
      channel: "studio"
    })
  };

  await updateMosObject({
    objectId,
    displayName:
      assertDurableCustomerName(
        objectDraft.displayName
      ),
    fields: safeObject(objectDraft.fields),
    media: safeArray(objectDraft.media),
    metadata,
    actorId: clean(actorId) || null
  });

  const persisted =
    await fetchAuthoritativeObject(
      objectId
    );
  const persistedPassportId =
    getAosPassportId(persisted || {});

  if (
    !persisted ||
    persistedPassportId !== passportId
  ) {
    const error = new Error(
      "Object Studio update could not verify the original Passport identity."
    );
    error.code =
      "AOS_STUDIO_EDIT_IDENTITY_UNVERIFIED";
    throw error;
  }

  if (
    clean(current.definitionId) !==
      clean(persisted.definitionId)
  ) {
    const error = new Error(
      "Object Studio update changed permanent Object Definition identity unexpectedly."
    );
    error.code =
      "AOS_STUDIO_EDIT_DEFINITION_UNVERIFIED";
    throw error;
  }

  return {
    ok: true,
    updated: true,
    replayed: false,
    object: persisted,
    passport: { passportId },
    identity: {
      objectId,
      passportId
    },
    transact: {
      eligible: true,
      objectId,
      passportId
    }
  };
}

export async function commitAosStudioLaunch({
  launchPayload,
  entityId,
  actorId = null
} = {}) {
  /*
   * Definition persistence is explicit. Merely naming an Object
   * never creates a type/category. The customer must have placed
   * definitionDraft.enabled=true in the Studio contract.
   */
  const definitionResult =
    await ensureStudioDefinition({
      launchPayload,
      entityId,
      actorId
    });

  const preparedLaunchPayload =
    definitionResult.launchPayload ||
    launchPayload;

  const mode = clean(
    preparedLaunchPayload?.studio?.mode
  ).toLowerCase();
  const objectId = clean(
    preparedLaunchPayload?.object?.objectId
  );

  const isPermanentEdit =
    mode === "edit" &&
    objectId &&
    !objectId.startsWith("object:") &&
    !objectId.startsWith("studio:") &&
    !objectId.startsWith("aos-draft:");

  if (isPermanentEdit) {
    if (
      definitionResult.created &&
      !clean(
        preparedLaunchPayload?.object
          ?.definitionId
      )
    ) {
      const error = new Error(
        "A newly created reusable definition cannot be attached to an existing Object without an audited reassignment command."
      );
      error.code =
        "AOS_STUDIO_DEFINITION_REASSIGNMENT_REQUIRED";
      throw error;
    }

    return updateStudioObject({
      launchPayload:
        preparedLaunchPayload,
      entityId,
      actorId
    });
  }

  const input =
    buildProvisioningInputFromStudioLaunch({
      launchPayload:
        preparedLaunchPayload,
      entityId,
      actorId
    });

  return provisionAosObject(input);
}

export async function commitExternalAosObject(
  envelope = {}
) {
  const normalized =
    normalizeExternalCommitEnvelope(
      envelope
    );
  return provisionAosObject(
    normalized.input
  );
}

export function buildCommittedStudioDraft({
  snapshot,
  object
} = {}) {
  const next = clone(
    safeObject(snapshot)
  );
  const persistedObject =
    safeObject(object);
  const objectId = clean(
    persistedObject.objectId
  );

  if (!objectId) return next;

  next.mode = "edit";
  next.objectDraft = {
    ...safeObject(next.objectDraft),
    objectId,
    definitionId:
      clean(persistedObject.definitionId) ||
      null,
    definitionKey:
      clean(persistedObject.definitionKey) ||
      null,
    displayName:
      clean(persistedObject.displayName) ||
      clean(
        next.objectDraft?.displayName
      ),
    fields:
      safeObject(persistedObject.fields),
    media:
      safeArray(persistedObject.media),
    metadata: {
      ...safeObject(
        next.objectDraft?.metadata
      ),
      ...safeObject(
        persistedObject.metadata
      )
    }
  };

  next.cardDefinitionDraft = {
    ...safeObject(
      next.cardDefinitionDraft
    ),
    objectId,
    cardDefinitionId: `card:${objectId}`
  };

  next.dirty = false;
  next.lastCommittedAt =
    new Date().toISOString();

  return next;
}

export default {
  IXI_AOS_OBJECT_COMMIT_VERSION,
  assertDurableCustomerName,
  buildProvisioningInputFromStudioLaunch,
  normalizeExternalCommitEnvelope,
  commitAosStudioLaunch,
  commitExternalAosObject,
  buildCommittedStudioDraft
};
