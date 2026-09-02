import {
  validateAosProvisioningInput
} from "./ixiAosProvisioningContract";

import {
  assertAosCreationReceipt
} from "./ixiAosCreationBoundary";

const IXI_MOS_BASE =
  "/api/aos/mos";

async function postProvisioningRequest({
  validation,
  signal
}) {
  return fetch(
    `${IXI_MOS_BASE}/objects/provision`,
    {
      method: "POST",
      credentials: "same-origin",
      signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Idempotency-Key":
          validation.provisioningKey
      },
      body: JSON.stringify({
        ...validation.input,
        provisioningKey:
          validation.provisioningKey
      })
    }
  );
}

async function readJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function createRequestError(response, payload) {
  const error = new Error(
    payload?.error?.message ||
    `AOS provisioning failed with status ${response.status}.`
  );
  error.code =
    payload?.error?.code ||
    "AOS_PROVISIONING_FAILED";
  error.status = response.status;
  error.details =
    payload?.error?.details || null;
  return error;
}

export async function provisionAosObject(
  input = {},
  {
    signal = null,
    retryNetworkFailure = true,
    expectedChannel = ""
  } = {}
) {
  const validation =
    validateAosProvisioningInput(input);

  if (!validation.valid) {
    const error = new Error(
      "AOS object is not ready for permanent creation."
    );
    error.code =
      "AOS_PROVISIONING_INPUT_INVALID";
    error.details = {
      errors: validation.errors
    };
    throw error;
  }

  let response;

  try {
    response = await postProvisioningRequest({
      validation,
      signal
    });
  } catch (firstError) {
    if (
      !retryNetworkFailure ||
      signal?.aborted
    ) {
      const error = new Error(
        "IXI AOS could not reach the authenticated provisioning gateway."
      );
      error.code =
        "AOS_PROVISIONING_NETWORK_ERROR";
      error.cause = firstError;
      throw error;
    }

    /*
     * Retry once with the SAME idempotency key. If IX-Core
     * committed before the transport failed, the same permanent
     * Object + Passport is replayed instead of creating a duplicate.
     */
    try {
      response = await postProvisioningRequest({
        validation,
        signal
      });
    } catch (retryError) {
      const error = new Error(
        "IXI AOS could not confirm object provisioning after an idempotent retry."
      );
      error.code =
        "AOS_PROVISIONING_NETWORK_UNCONFIRMED";
      error.cause = retryError;
      error.details = {
        provisioningKey:
          validation.provisioningKey
      };
      throw error;
    }
  }

  const payload =
    await readJsonResponse(response);

  if (
    !response.ok ||
    payload?.ok === false
  ) {
    throw createRequestError(
      response,
      payload
    );
  }

  const receipt =
    assertAosCreationReceipt(
      payload || {},
      {
        expectedEntityId:
          validation.input.entityId,
        expectedChannel
      }
    );

  return {
    ...payload,
    ok: true,
    object: receipt.object,
    passport: receipt.passport,
    identity: receipt.identity,
    transact: receipt.transact,
    creationReceipt: receipt,
    provisioningKey:
      validation.provisioningKey
  };
}

export default {
  provisionAosObject
};
