import {
  assertProvisionedAosObject,
  validateAosProvisioningInput
} from "./ixiAosProvisioningContract";

const IXI_MOS_BASE =
  "/api/aos/mos";

function clean(value) {
  return String(value ?? "").trim();
}

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
        Accept:
          "application/json",
        "Content-Type":
          "application/json",
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

function createRequestError(
  response,
  payload
) {
  const error = new Error(
    payload?.error?.message ||
    `AOS provisioning failed with status ${response.status}.`
  );

  error.code =
    payload?.error?.code ||
    "AOS_PROVISIONING_FAILED";

  error.status =
    response.status;

  error.details =
    payload?.error?.details ||
    null;

  return error;
}

export async function provisionAosObject(
  input = {},
  {
    signal = null,
    retryNetworkFailure = true
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
      errors:
        validation.errors
    };

    throw error;
  }

  let response;

  try {
    response =
      await postProvisioningRequest({
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

      error.cause =
        firstError;

      throw error;
    }

    /*
     * Retry exactly once with the SAME idempotency key. If
     * IX-Core committed the first request before the network
     * failed, the server replays the same Object + Passport.
     */
    try {
      response =
        await postProvisioningRequest({
          validation,
          signal
        });
    } catch (retryError) {
      const error = new Error(
        "IXI AOS could not confirm object provisioning after an idempotent retry."
      );

      error.code =
        "AOS_PROVISIONING_NETWORK_UNCONFIRMED";

      error.cause =
        retryError;

      error.details = {
        provisioningKey:
          validation.provisioningKey
      };

      throw error;
    }
  }

  const payload =
    await readJsonResponse(
      response
    );

  if (
    !response.ok ||
    payload?.ok === false
  ) {
    throw createRequestError(
      response,
      payload
    );
  }

  const object =
    payload?.object ||
    payload?.provisioning?.object ||
    payload?.data?.object ||
    null;

  const identity =
    assertProvisionedAosObject(
      object || {}
    );

  const passport =
    payload?.passport ||
    payload?.provisioning?.passport ||
    payload?.data?.passport ||
    null;

  const returnedPassportId =
    clean(
      passport?.passportId ||
      passport?.id
    );

  if (!returnedPassportId) {
    const error = new Error(
      "IX-Core returned a provisioned AOS Object without a Passport record."
    );

    error.code =
      "AOS_PASSPORT_RECORD_MISSING";

    throw error;
  }

  if (
    returnedPassportId !==
      identity.passportId
  ) {
    const error = new Error(
      "IX-Core returned conflicting Passport identities for the same AOS object."
    );

    error.code =
      "AOS_PASSPORT_IDENTITY_CONFLICT";

    error.details = {
      objectPassportId:
        identity.passportId,
      returnedPassportId
    };

    throw error;
  }

  if (
    payload?.transact?.eligible !==
      true ||
    clean(
      payload?.transact?.passportId
    ) !== identity.passportId
  ) {
    const error = new Error(
      "IX-Core did not return a verified TRAN$ACT-eligible Passport identity."
    );

    error.code =
      "AOS_TRANSACT_IDENTITY_UNVERIFIED";

    throw error;
  }

  return {
    ...payload,
    ok: true,
    object,
    passport,
    identity,
    provisioningKey:
      validation.provisioningKey
  };
}

export default {
  provisionAosObject
};
