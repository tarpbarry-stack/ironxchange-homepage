// /lib/passport/attachPassportToIntegrationListing.js

import { types as sdkTypes } from "sharetribe-flex-sdk";

import {
  ensurePassportForMachine
} from "./ensurePassportForMachine";

const { UUID } = sdkTypes;

export async function attachPassportToIntegrationListing({
  sdk,
  listingId,
} = {}) {
  if (!sdk) {
    throw new Error("attachPassportToIntegrationListing requires sdk");
  }

  if (!listingId) {
    throw new Error("attachPassportToIntegrationListing requires listingId");
  }

  const result = await ensurePassportForMachine({
    sourceType: "sharetribe-listing",
    sourceId: listingId,
  });

  const passport = result?.passport || result || {};
  const passportId = passport.passportId || "";
  const passportUrl = passport.passportUrl || "";

  if (!passportId) {
    throw new Error("Passport Engine returned no passportId");
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
    passportUrl
  };
}
