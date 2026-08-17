import {
  assertProvisionedAosObject,
  validateAosProvisioningInput
} from "./ixiAosProvisioningContract";

const IX_CORE_BASE =
  "https://staging.ironxchange.com/ix-core";

const IXI_MOS_BASE =
  `${IX_CORE_BASE}/mos/v1`;

function clean(value) {
  return String(value ?? "").trim();
}

export async function provisionAosObject(
  input = {},
  {
    signal = null
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

  const response = await fetch(
    `${IXI_MOS_BASE}/objects/provision`,
    {
      method: "POST",
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

  let payload = null;

  try {
    payload =
      await response.json();
  } catch {
    payload = null;
  }

  if (
    !response.ok ||
    payload?.ok === false
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

    throw error;
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

  if (
    returnedPassportId &&
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
