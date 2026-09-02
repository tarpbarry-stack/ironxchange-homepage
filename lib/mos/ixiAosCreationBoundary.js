import {
  assertProvisionedAosObject
} from "./ixiAosProvisioningContract";

export const IXI_AOS_CREATION_BOUNDARY_VERSION =
  "ixi-aos-creation-boundary-v1";

export const IXI_AOS_CREATION_CHANNELS = Object.freeze({
  CONTAINER_PLUS: "container-plus",
  OBJECT_STUDIO: "object-studio",
  BULK_IMPORT: "bulk-import",
  API: "api",
  CHAT: "chat"
});

const CHANNEL_SET = new Set(
  Object.values(IXI_AOS_CREATION_CHANNELS)
);

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

export function normalizeAosCreationChannel(value) {
  const channel = clean(value).toLowerCase();

  if (!CHANNEL_SET.has(channel)) {
    const error = new Error(
      "Unsupported AOS creation channel."
    );
    error.code = "AOS_CREATION_CHANNEL_INVALID";
    error.details = { channel: channel || null };
    throw error;
  }

  return channel;
}

export function buildAosCreationProvenance({
  channel,
  intentId,
  sourceReference = "",
  metadata = {}
} = {}) {
  const normalizedChannel =
    normalizeAosCreationChannel(channel);
  const normalizedIntentId = clean(intentId);

  if (!normalizedIntentId) {
    const error = new Error(
      "AOS permanent creation requires a stable intent identity."
    );
    error.code = "AOS_CREATION_INTENT_ID_REQUIRED";
    throw error;
  }

  return {
    ...safeObject(metadata),
    creationBoundary: {
      contractVersion:
        IXI_AOS_CREATION_BOUNDARY_VERSION,
      channel:
        normalizedChannel,
      intentId:
        normalizedIntentId,
      sourceReference:
        clean(sourceReference) || null
    }
  };
}

export function assertAosCreationReceipt(
  payload = {},
  {
    expectedEntityId = "",
    expectedChannel = ""
  } = {}
) {
  const object =
    payload?.object ||
    payload?.provisioning?.object ||
    payload?.data?.object ||
    null;

  const identity =
    assertProvisionedAosObject(object || {});

  const passport =
    payload?.passport ||
    payload?.provisioning?.passport ||
    payload?.data?.passport ||
    null;

  const passportId = clean(
    passport?.passportId ||
    passport?.id
  );

  if (!passportId || passportId !== identity.passportId) {
    const error = new Error(
      "AOS creation returned conflicting Object and Passport identity."
    );
    error.code = "AOS_CREATION_PASSPORT_UNVERIFIED";
    throw error;
  }

  const entityId = clean(object?.entityId);
  if (
    clean(expectedEntityId) &&
    entityId !== clean(expectedEntityId)
  ) {
    const error = new Error(
      "AOS creation returned an Object outside the requested Entity."
    );
    error.code = "AOS_CREATION_ENTITY_UNVERIFIED";
    error.details = {
      expectedEntityId: clean(expectedEntityId),
      actualEntityId: entityId || null
    };
    throw error;
  }

  const transact = safeObject(payload?.transact);
  if (
    transact.eligible !== true ||
    clean(transact.objectId) !== identity.objectId ||
    clean(transact.passportId) !== passportId
  ) {
    const error = new Error(
      "AOS creation did not return verified TRAN$ACT eligibility."
    );
    error.code = "AOS_CREATION_TRANSACT_UNVERIFIED";
    throw error;
  }

  const channel = clean(expectedChannel)
    ? normalizeAosCreationChannel(expectedChannel)
    : null;

  return {
    ok: true,
    object,
    passport,
    identity,
    transact,
    entityId,
    channel
  };
}

export default {
  IXI_AOS_CREATION_BOUNDARY_VERSION,
  IXI_AOS_CREATION_CHANNELS,
  normalizeAosCreationChannel,
  buildAosCreationProvenance,
  assertAosCreationReceipt
};
