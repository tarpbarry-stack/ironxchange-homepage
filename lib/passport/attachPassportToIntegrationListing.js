// /lib/passport/attachPassportToIntegrationListing.js

import {
  types as sdkTypes
} from "sharetribe-flex-sdk";

import {
  requestIxCoreMos
} from "../server/aos/ixiMosInternalClient.js";

import {
  normalizeOwnedMachineListing
} from "../server/onboarding/normalizeOwnedMachineListing.js";

const { UUID } = sdkTypes;

export async function attachPassportToIntegrationListing({
  sdk,
  listingId,
  listing,
  principalId,
  entityId
} = {}) {
  if (!sdk) {
    throw new Error(
      "attachPassportToIntegrationListing requires sdk"
    );
  }

  if (!listingId) {
    throw new Error(
      "attachPassportToIntegrationListing requires listingId"
    );
  }

  if (!principalId || !entityId) {
    throw new Error(
      "Governed principal and Entity identity are required for listing admission"
    );
  }

  const normalizedListing = normalizeOwnedMachineListing(listing);
  if (normalizedListing.listingId !== String(listingId)) {
    throw new Error(
      "The listing admission source does not match the created listing"
    );
  }

  const result = await requestIxCoreMos({
    path: "/aos/machines/sharetribe-listing",
    method: "POST",
    principalId,
    entityId,
    extraHeaders: {
      "Idempotency-Key": `sharetribe-listing:${listingId}`
    },
    body: {
      listing: normalizedListing
    }
  });

  const passport = result?.passport || result || {};
  const passportId = passport.passportId || "";
  const passportUrl = passport.passportUrl || "";

  if (!passportId) {
    throw new Error(
      "Passport Engine returned no passportId"
    );
  }

  await sdk.listings.update({
    id: new UUID(listingId),
    publicData: {
      passportId,
      passportUrl
    }
  });

  return {
    ...passport,
    passportId,
    passportUrl,
    object:
      result?.object ||
      result?.machine ||
      null
  };
}
