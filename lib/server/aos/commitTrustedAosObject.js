import {
  normalizeExternalCommitEnvelope
} from "../../mos/ixiAosObjectCommit";

import {
  assertProvisionedAosObject
} from "../../mos/ixiAosProvisioningContract";

import {
  requestIxCoreMos
} from "./ixiMosInternalClient";

function clean(value) {
  return String(value ?? "").trim();
}

export async function commitTrustedAosObject(
  envelope = {}
) {
  const normalized =
    normalizeExternalCommitEnvelope(
      envelope
    );

  const input = {
    ...normalized.input
  };

  const entityId =
    clean(input.entityId);

  if (!entityId) {
    const error = new Error(
      "Trusted AOS commit requires entityId."
    );

    error.code = "AOS_COMMIT_ENTITY_REQUIRED";
    error.status = 400;
    throw error;
  }

  const principalId =
    clean(input.actorId) ||
    `trusted-${normalized.channel}`;

  const commandId =
    `${input.source}:${normalized.requestId}`;

  const payload =
    await requestIxCoreMos({
      path: "/objects/provision",
      method: "POST",
      principalId,
      entityId,
      extraHeaders: {
        "Idempotency-Key": commandId
      },
      body: {
        ...input,
        commandId,
        provisioningKey:
          commandId
      }
    });

  const object =
    payload?.object || null;

  const identity =
    assertProvisionedAosObject(
      object || {}
    );

  const passportId =
    clean(
      payload?.passport?.passportId
    );

  if (
    !passportId ||
    passportId !== identity.passportId
  ) {
    const error = new Error(
      "Trusted AOS commit returned conflicting Passport identity."
    );

    error.code = "AOS_COMMIT_PASSPORT_UNVERIFIED";
    error.status = 502;
    throw error;
  }

  if (
    payload?.transact?.eligible !== true ||
    clean(payload?.transact?.passportId) !== passportId ||
    clean(payload?.transact?.objectId) !== identity.objectId
  ) {
    const error = new Error(
      "Trusted AOS commit did not return verified TRAN$ACT eligibility."
    );

    error.code = "AOS_COMMIT_TRANSACT_UNVERIFIED";
    error.status = 502;
    throw error;
  }

  return {
    ...payload,
    ok: true,
    object,
    identity,
    passport:
      payload.passport,
    channel:
      normalized.channel,
    requestId:
      normalized.requestId,
    commandId
  };
}

export default commitTrustedAosObject;
