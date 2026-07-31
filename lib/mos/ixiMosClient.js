const IX_CORE_BASE =
  "https://staging.ironxchange.com/ix-core";

const IXI_MOS_BASE =
  `${IX_CORE_BASE}/mos/v1`;
async function requestMos(
  path,
  {
    method = "GET",
    body = null,
    signal = null
  } = {}
) {
  const options = {
    method,
    headers: {
      Accept: "application/json"
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
  } catch (error) {
    const networkError = new Error(
      "IXI MOS could not reach IX-Core."
    );

    networkError.code =
      "MOS_NETWORK_ERROR";

    networkError.cause = error;

    throw networkError;
  }

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.ok === false) {
    const requestError = new Error(
      payload?.error?.message ||
      `IXI MOS request failed with status ${response.status}.`
    );

    requestError.code =
      payload?.error?.code ||
      "MOS_REQUEST_FAILED";

    requestError.status =
      response.status;

    requestError.details =
      payload?.error?.details ||
      null;

    throw requestError;
  }

  return payload;
}

/* ---------- HEALTH ---------- */

export function fetchMosHealth({
  signal = null
} = {}) {
  return requestMos("/health", {
    signal
  });
}

/* ---------- AOS ENVIRONMENT ---------- */

export function fetchAosEnvironment({
  ownerUserId,
  displayName = "IXI Entity",
  metadata = {},
  signal = null
}) {
  if (!ownerUserId) {
    throw new Error(
      "Authenticated ownerUserId is required."
    );
  }

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

/* ---------- ENTITIES ---------- */

export function fetchMosEntities({
  signal = null
} = {}) {
  return requestMos("/entities", {
    signal
  });
}

export function fetchMosEntity(
  entityId,
  {
    signal = null
  } = {}
) {
  if (!entityId) {
    throw new Error(
      "entityId is required."
    );
  }

  return requestMos(
    `/entities/${encodeURIComponent(
      entityId
    )}`,
    {
      signal
    }
  );
}

export function createMosEntity({
  displayName,
  sharetribeUserId = null,
  actorId = null,
  metadata = {}
}) {
  return requestMos("/entities", {
    method: "POST",
    body: {
      displayName,
      sharetribeUserId,
      actorId,
      metadata
    }
  });
}

/* ---------- OBJECTS ---------- */

export function fetchMosObjects({
  entityId,
  objectType = null,
  status = "active",
  signal = null
}) {
  if (!entityId) {
    throw new Error(
      "entityId is required."
    );
  }

  const params =
    new URLSearchParams();

  if (objectType) {
    params.set(
      "objectType",
      objectType
    );
  }

  if (status) {
    params.set(
      "status",
      status
    );
  }

  const query =
    params.toString();

  return requestMos(
    `/entities/${encodeURIComponent(
      entityId
    )}/objects${
      query ? `?${query}` : ""
    }`,
    {
      signal
    }
  );
}

export function fetchMosObject(
  objectId,
  {
    signal = null
  } = {}
) {
  if (!objectId) {
    throw new Error(
      "objectId is required."
    );
  }

  return requestMos(
    `/objects/${encodeURIComponent(
      objectId
    )}`,
    {
      signal
    }
  );
}

export function createMosObject({
  entityId,
  objectType,
  displayName,
  customerCategory = null,
  customerAssetId = null,
  factualTitle = null,
  value = null,
  currency = "USD",
  fields = {},
  identities = [],
  media = [],
  source = "manual",
  actorId = null,
  metadata = {}
}) {
  return requestMos("/objects", {
    method: "POST",
    body: {
      entityId,
      objectType,
      displayName,
      customerCategory,
      customerAssetId,
      factualTitle,
      value,
      currency,
      fields,
      identities,
      media,
      source,
      actorId,
      metadata
    }
  });
}

/* ---------- CONTAINERS ---------- */

export function fetchMosContainer(
  containerId,
  {
    view = "direct",
    signal = null
  } = {}
) {
  if (!containerId) {
    throw new Error(
      "containerId is required."
    );
  }

  return requestMos(
    `/containers/${encodeURIComponent(
      containerId
    )}?view=${encodeURIComponent(
      view
    )}`,
    {
      signal
    }
  );
}

export function placeMosObject({
  objectId,
  destinationContainerId,
  actorId = null,
  commandId = null,
  metadata = {}
}) {
  if (
    !objectId ||
    !destinationContainerId
  ) {
    throw new Error(
      "objectId and destinationContainerId are required."
    );
  }

  return requestMos(
    `/containers/${encodeURIComponent(
      destinationContainerId
    )}/place`,
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
    throw new Error(
      "objectId is required."
    );
  }

  return requestMos(
    `/objects/${encodeURIComponent(
      objectId
    )}/remove-from-container`,
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

/* ---------- MOVEMENTS ---------- */

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
    `/movements/${encodeURIComponent(
      movementId
    )}/complete`,
    {
      method: "POST",
      body: {
        commandId,
        actorId
      }
    }
  );
}

/* ---------- HISTORY ---------- */

export function fetchMosEvents({
  entityId = null,
  objectId = null,
  eventType = null,
  signal = null
} = {}) {
  const params =
    new URLSearchParams();

  if (entityId) {
    params.set(
      "entityId",
      entityId
    );
  }

  if (objectId) {
    params.set(
      "objectId",
      objectId
    );
  }

  if (eventType) {
    params.set(
      "eventType",
      eventType
    );
  }

  const query =
    params.toString();

  return requestMos(
    `/events${
      query ? `?${query}` : ""
    }`,
    {
      signal
    }
  );
}

export function createMosCommandId(
  prefix = "cmd"
) {
  const random =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
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
