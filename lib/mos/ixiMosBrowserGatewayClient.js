const IXI_MOS_BASE =
  "/api/aos/mos";

const IX_CORE_BASE =
  "/api/aos";

function clean(value) {
  return String(value ?? "").trim();
}

async function requestMos(
  path,
  {
    method = "GET",
    body = null,
    signal = null,
    headers = {}
  } = {}
) {
  const options = {
    method,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...headers
    },
    signal
  };

  if (body !== null) {
    options.headers["Content-Type"] =
      "application/json";
    options.body = JSON.stringify(body);
  }

  let response;

  try {
    response = await fetch(
      `${IXI_MOS_BASE}${path}`,
      options
    );
  } catch (cause) {
    const error = new Error(
      "IXI AOS could not reach the authenticated MOS gateway."
    );
    error.code = "MOS_GATEWAY_NETWORK_ERROR";
    error.cause = cause;
    throw error;
  }

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (
    !response.ok ||
    payload?.ok === false
  ) {
    const error = new Error(
      payload?.error?.message ||
      `IXI MOS gateway request failed with status ${response.status}.`
    );

    error.code =
      payload?.error?.code ||
      "MOS_GATEWAY_REQUEST_FAILED";
    error.status = response.status;
    error.details =
      payload?.error?.details || null;
    throw error;
  }

  return payload;
}

function disabledOperation(code, message) {
  const error = new Error(message);
  error.code = code;
  error.status = 410;
  throw error;
}

export function fetchMosHealth({
  signal = null
} = {}) {
  return requestMos("/health", { signal });
}

export function fetchAosEnvironment({
  ownerUserId = null,
  displayName = "IXI Entity",
  metadata = {},
  signal = null
} = {}) {
  /*
   * ownerUserId is intentionally ignored by the gateway.
   * The server derives the real user from Sharetribe's session cookie.
   */
  return requestMos(
    "/aos/environment",
    {
      method: "POST",
      signal,
      body: {
        ownerUserId,
        displayName,
        metadata
      }
    }
  );
}

export function fetchMosEntities() {
  return disabledOperation(
    "AOS_GLOBAL_ENTITY_ENUMERATION_DISABLED",
    "Browser sessions may not enumerate AOS Entities."
  );
}

export function createMosEntity() {
  return disabledOperation(
    "AOS_RAW_ENTITY_CREATE_DISABLED",
    "AOS Entity creation is owned by the authenticated environment bootstrap."
  );
}

export function fetchMosEntity(
  entityId,
  { signal = null } = {}
) {
  if (!entityId) {
    throw new Error("entityId is required.");
  }

  return requestMos(
    `/entities/${encodeURIComponent(entityId)}`,
    { signal }
  );
}

export function fetchMosObjectDefinitions({
  entityId,
  status = "active",
  signal = null
}) {
  if (!entityId) {
    throw new Error("entityId is required.");
  }

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const query = params.toString();

  return requestMos(
    `/entities/${encodeURIComponent(entityId)}/object-definitions${query ? `?${query}` : ""}`,
    { signal }
  );
}

export function fetchMosObjectDefinition({
  entityId,
  definitionId,
  signal = null
}) {
  if (!entityId || !definitionId) {
    throw new Error(
      "entityId and definitionId are required."
    );
  }

  return requestMos(
    `/entities/${encodeURIComponent(entityId)}/object-definitions/${encodeURIComponent(definitionId)}`,
    { signal }
  );
}

export function createMosObjectDefinition({
  entityId,
  label,
  definitionKey = null,
  capabilities = {},
  fieldSchema = [],
  businessIdentifierSchema = null,
  cardTemplateSlug = null,
  cardTemplateVersion = null,
  metadata = {},
  actorId = null
}) {
  if (!entityId) {
    throw new Error("entityId is required.");
  }

  return requestMos(
    `/entities/${encodeURIComponent(entityId)}/object-definitions`,
    {
      method: "POST",
      body: {
        label,
        definitionKey,
        capabilities,
        fieldSchema,
        businessIdentifierSchema,
        cardTemplateSlug,
        cardTemplateVersion,
        metadata,
        actorId
      }
    }
  );
}

export function updateMosObjectDefinition({
  entityId,
  definitionId,
  ...patch
}) {
  if (!entityId || !definitionId) {
    throw new Error(
      "entityId and definitionId are required."
    );
  }

  return requestMos(
    `/entities/${encodeURIComponent(entityId)}/object-definitions/${encodeURIComponent(definitionId)}`,
    {
      method: "PATCH",
      body: patch
    }
  );
}

export function archiveMosObjectDefinition({
  entityId,
  definitionId,
  actorId = null
}) {
  if (!entityId || !definitionId) {
    throw new Error(
      "entityId and definitionId are required."
    );
  }

  return requestMos(
    `/entities/${encodeURIComponent(entityId)}/object-definitions/${encodeURIComponent(definitionId)}`,
    {
      method: "DELETE",
      body: { actorId }
    }
  );
}

export function fetchMosCardTemplates({
  entityId = null,
  librarySection = null,
  baseObjectType = null,
  signal = null
} = {}) {
  const params = new URLSearchParams();

  if (entityId) params.set("entityId", entityId);
  if (librarySection) {
    params.set("librarySection", librarySection);
  }
  if (baseObjectType) {
    params.set("baseObjectType", baseObjectType);
  }

  const query = params.toString();

  return requestMos(
    `/card-templates${query ? `?${query}` : ""}`,
    { signal }
  );
}

export function fetchMosCardTemplate({
  templateSlug,
  version = null,
  entityId = null,
  signal = null
}) {
  if (!templateSlug) {
    throw new Error("templateSlug is required.");
  }

  const params = new URLSearchParams();
  if (version) params.set("version", String(version));
  if (entityId) params.set("entityId", entityId);
  const query = params.toString();

  return requestMos(
    `/card-templates/${encodeURIComponent(templateSlug)}${query ? `?${query}` : ""}`,
    { signal }
  );
}

export function fetchMosObjects({
  entityId,
  definitionId = null,
  definitionKey = null,
  objectType = null,
  status = "active",
  signal = null
}) {
  if (!entityId) {
    throw new Error("entityId is required.");
  }

  const params = new URLSearchParams();
  if (definitionId) params.set("definitionId", definitionId);
  if (definitionKey) params.set("definitionKey", definitionKey);
  if (objectType) params.set("objectType", objectType);
  if (status) params.set("status", status);
  const query = params.toString();

  return requestMos(
    `/entities/${encodeURIComponent(entityId)}/objects${query ? `?${query}` : ""}`,
    { signal }
  );
}

export function fetchMosObject(
  objectId,
  { signal = null } = {}
) {
  if (!objectId) {
    throw new Error("objectId is required.");
  }

  return requestMos(
    `/objects/${encodeURIComponent(objectId)}`,
    { signal }
  );
}

export function createMosObject() {
  return disabledOperation(
    "AOS_RAW_OBJECT_CREATE_DISABLED",
    "Permanent AOS Objects must be created through the Object + Passport provisioning boundary."
  );
}

export function updateMosObject({
  objectId,
  displayName,
  businessIdentifiers,
  value,
  currency,
  fields,
  identities,
  media,
  cardTemplateSlug,
  cardTemplateVersion,
  metadata,
  actorId = null,
  expectedRevision = null,
  commandId = "",
  idempotencyKey = "",
  definitionVersion = "",
  signal = null
}) {
  if (!objectId) {
    throw new Error("objectId is required.");
  }

  const body = { actorId };
  const values = {
    displayName,
    businessIdentifiers,
    value,
    currency,
    fields,
    identities,
    media,
    cardTemplateSlug,
    cardTemplateVersion,
    metadata
  };

  Object.entries(values).forEach(([key, valueToSend]) => {
    if (valueToSend !== undefined) {
      body[key] = valueToSend;
    }
  });

  if (commandId) body.commandId = clean(commandId);
  if (definitionVersion) body.definitionVersion = clean(definitionVersion);
  if (Number.isInteger(Number(expectedRevision)) && Number(expectedRevision) > 0) {
    body.expectedRevision = Number(expectedRevision);
  }

  const headers = {};
  const resolvedIdempotencyKey = clean(idempotencyKey || commandId);
  if (resolvedIdempotencyKey) headers["Idempotency-Key"] = resolvedIdempotencyKey;
  if (Number.isInteger(Number(expectedRevision)) && Number(expectedRevision) > 0) {
    headers["If-Match"] = String(Number(expectedRevision));
  }

  return requestMos(
    `/objects/${encodeURIComponent(objectId)}`,
    {
      method: "PATCH",
      body,
      headers,
      signal
    }
  );
}

function extractMosObject(payload = {}) {
  return payload?.object || payload?.data?.object || payload?.record || payload?.data?.record || null;
}

/*
 * The one browser-to-IX-Core mutation boundary for AOS object editing.
 * The PATCH response is never trusted as the final UI value by itself: a fresh
 * canonical read is required before the editor can report SAVED.
 */
export async function commitMosObjectCommand(command = {}, { signal = null } = {}) {
  if (clean(command?.contractVersion) !== "ixi-aos-object-command-v1") {
    const error = new Error("Unsupported AOS object command contract.");
    error.code = "IXI_AOS_COMMAND_CONTRACT_INVALID";
    throw error;
  }

  const patch = command?.patch && typeof command.patch === "object" ? command.patch : {};
  const response = await updateMosObject({
    objectId: clean(command.objectId),
    displayName: patch.displayName,
    businessIdentifiers: patch.businessIdentifiers,
    fields: patch.fields,
    media: patch.media,
    metadata: {
      ...(patch.metadata || {}),
      fieldDefinitions: Array.isArray(patch.fieldDefinitions) ? patch.fieldDefinitions : [],
      aosCommand: {
        contractVersion: clean(command.contractVersion),
        commandId: clean(command.commandId),
        definitionVersion: clean(command.definitionVersion),
        issuedAt: clean(command.issuedAt)
      }
    },
    expectedRevision: command.expectedRevision,
    commandId: command.commandId,
    idempotencyKey: command.idempotencyKey,
    definitionVersion: command.definitionVersion,
    signal
  });

  const readback = await fetchMosObject(clean(command.objectId), { signal });
  const canonicalObject = extractMosObject(readback);
  if (!canonicalObject) {
    const error = new Error("IX Core did not return the saved AOS object during canonical readback.");
    error.code = "IXI_AOS_CANONICAL_READBACK_REQUIRED";
    throw error;
  }

  return {
    ...response,
    ok: true,
    commandId: clean(command.commandId),
    object: canonicalObject,
    readback
  };
}

export function deleteMosObject({
  objectId,
  actorId = null
}) {
  if (!objectId) {
    throw new Error("objectId is required.");
  }

  return requestMos(
    `/objects/${encodeURIComponent(objectId)}`,
    {
      method: "DELETE",
      body: { actorId }
    }
  );
}

export function fetchMosContainer(
  containerId,
  {
    view = "direct",
    signal = null
  } = {}
) {
  if (!containerId) {
    throw new Error("containerId is required.");
  }

  return requestMos(
    `/containers/${encodeURIComponent(containerId)}?view=${encodeURIComponent(view)}`,
    { signal }
  );
}

export function placeMosObject({
  objectId,
  destinationContainerId,
  actorId = null,
  commandId = null,
  metadata = {}
}) {
  if (!objectId || !destinationContainerId) {
    throw new Error(
      "objectId and destinationContainerId are required."
    );
  }

  return requestMos(
    `/containers/${encodeURIComponent(destinationContainerId)}/place`,
    {
      method: "POST",
      body: {
        objectId,
        actorId,
        commandId,
        metadata
      }
    }
  );
}

export function removeMosObjectFromContainer({
  objectId,
  actorId = null,
  commandId = null,
  metadata = {}
}) {
  if (!objectId) {
    throw new Error("objectId is required.");
  }

  return requestMos(
    `/objects/${encodeURIComponent(objectId)}/remove-from-container`,
    {
      method: "POST",
      body: {
        actorId,
        commandId,
        metadata
      }
    }
  );
}

export function moveMosObjectImmediately({
  commandId,
  entityId,
  objectId,
  destinationContainerId,
  movementType = "immediate",
  actorId = null,
  reason = null,
  metadata = {}
}) {
  return requestMos(
    "/movements/immediate",
    {
      method: "POST",
      body: {
        commandId,
        entityId,
        objectId,
        destinationContainerId,
        movementType,
        actorId,
        reason,
        metadata
      }
    }
  );
}

export function requestMosFreightMove({
  commandId,
  entityId,
  objectId,
  destinationContainerId,
  actorId = null,
  reason = null,
  metadata = {}
}) {
  return requestMos(
    "/movements/freight",
    {
      method: "POST",
      body: {
        commandId,
        entityId,
        objectId,
        destinationContainerId,
        actorId,
        reason,
        metadata
      }
    }
  );
}

export function completeMosFreightMove({
  movementId,
  commandId,
  actorId = null
}) {
  return requestMos(
    `/movements/${encodeURIComponent(movementId)}/complete`,
    {
      method: "POST",
      body: {
        commandId,
        actorId
      }
    }
  );
}

export function fetchMosEvents({
  entityId = null,
  objectId = null,
  eventType = null,
  signal = null
} = {}) {
  const params = new URLSearchParams();
  if (entityId) params.set("entityId", entityId);
  if (objectId) params.set("objectId", objectId);
  if (eventType) params.set("eventType", eventType);
  const query = params.toString();

  return requestMos(
    `/events${query ? `?${query}` : ""}`,
    { signal }
  );
}

export function createMosCommandId(
  prefix = "cmd"
) {
  const random =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

  return `${prefix}-${random}`;
}

export {
  IX_CORE_BASE,
  IXI_MOS_BASE
};
