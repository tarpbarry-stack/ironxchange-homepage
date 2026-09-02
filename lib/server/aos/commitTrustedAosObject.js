import {
  normalizeExternalCommitEnvelope
} from "../../mos/ixiAosObjectCommit";

import {
  assertAosCreationReceipt
} from "../../mos/ixiAosCreationBoundary";

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
    normalizeExternalCommitEnvelope(envelope);

  const input = {
    ...normalized.input
  };

  const entityId = clean(input.entityId);
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
        provisioningKey: commandId
      }
    });

  const receipt =
    assertAosCreationReceipt(
      payload || {},
      {
        expectedEntityId: entityId,
        expectedChannel:
          normalized.channel
      }
    );

  return {
    ...payload,
    ok: true,
    object: receipt.object,
    identity: receipt.identity,
    passport: receipt.passport,
    transact: receipt.transact,
    creationReceipt: receipt,
    channel: normalized.channel,
    requestId: normalized.requestId,
    commandId
  };
}

export default commitTrustedAosObject;
