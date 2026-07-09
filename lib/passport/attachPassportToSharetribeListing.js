// /lib/passport/attachPassportToSharetribeListing.js

import { types as sdkTypes } from "sharetribe-flex-sdk";

import {
  ensurePassportForMachine
} from "./ensurePassportForMachine";

const { UUID } = sdkTypes;

export async function attachPassportToSharetribeListing({
  sdk,
  listingId,
} = {}) {
  if (!sdk) {
    throw new Error("attachPassportToSharetribeListing requires sdk");
  }

  if (!listingId) {
    throw new Error("attachPassportToSharetribeListing requires listingId");
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

  await sdk.ownListings.update({
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
