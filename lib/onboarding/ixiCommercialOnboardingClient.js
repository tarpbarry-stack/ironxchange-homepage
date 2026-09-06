export async function ensureCommercialOnboarding() {
  const response = await fetch("/api/ixi/onboarding/bootstrap", {
    method: "POST",
    credentials: "same-origin",
    headers: { Accept: "application/json" }
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.ok === false) {
    const error = new Error(
      payload?.error?.message || "IXI account setup could not be completed."
    );
    error.code = payload?.error?.code || "IXI_ONBOARDING_BOOTSTRAP_FAILED";
    error.status = response.status;
    throw error;
  }

  return payload;
}

export async function provisionListingMachine(listingId) {
  const response = await fetch("/api/ixi/onboarding/machine", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ listingId })
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.ok === false) {
    const error = new Error(
      payload?.error?.message || "IXI Machine provisioning failed."
    );
    error.code = payload?.error?.code || "IXI_MACHINE_PROVISIONING_FAILED";
    error.status = response.status;
    throw error;
  }

  return payload;
}

export async function backfillOwnedMachines({ page = 1, perPage = 20 } = {}) {
  const response = await fetch("/api/ixi/onboarding/backfill", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ page, perPage })
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok && response.status !== 207) {
    const error = new Error(
      payload?.error?.message || "IXI Machine backfill failed."
    );
    error.code = payload?.error?.code || "IXI_MACHINE_BACKFILL_FAILED";
    error.status = response.status;
    throw error;
  }
  return payload;
}

export default {
  ensureCommercialOnboarding,
  provisionListingMachine,
  backfillOwnedMachines
};
