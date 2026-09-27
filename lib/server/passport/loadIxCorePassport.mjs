import { getPassportSharetribeListingId } from "../../passport/passportSources.mjs";

function clean(value) {
  return String(value ?? "").trim();
}

function getIxCoreBase() {
  return (
    clean(process.env.IX_CORE_BASE_URL) ||
    "https://staging.ironxchange.com/ix-core"
  ).replace(/\/+$/u, "");
}

export async function loadIxCorePassport(passportId) {
  const normalizedPassportId = clean(passportId).toUpperCase();
  if (!/^[A-Z0-9-]{8,80}$/u.test(normalizedPassportId)) {
    const error = new Error("A valid IXI Machine Passport is required.");
    error.code = "INVALID_PASSPORT_ID";
    error.status = 400;
    throw error;
  }

  let response;
  try {
    response = await fetch(
      `${getIxCoreBase()}/passport/${encodeURIComponent(normalizedPassportId)}`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) }
    );
  } catch (cause) {
    const error = new Error("IX-Core Passport resolution is temporarily unavailable.");
    error.code = "PASSPORT_RESOLUTION_UNAVAILABLE";
    error.status = 502;
    error.retryable = true;
    error.cause = cause;
    throw error;
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.passport) {
    const error = new Error(payload?.error || "IXI Machine Passport was not found.");
    error.code = "PASSPORT_NOT_FOUND";
    error.status = response.status === 404 ? 404 : 502;
    error.retryable = response.status >= 500;
    throw error;
  }

  return payload.passport;
}

export async function resolvePassportSharetribeListingId(passportId) {
  const passport = await loadIxCorePassport(passportId);
  const listingId = getPassportSharetribeListingId(passport);
  if (!listingId) {
    const error = new Error(
      "This Passport does not yet have a verified Marketplace presentation source."
    );
    error.code = "PASSPORT_PRESENTATION_NOT_AVAILABLE";
    error.status = 409;
    throw error;
  }
  return listingId;
}
