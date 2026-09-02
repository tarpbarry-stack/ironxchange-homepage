import { getListingId } from "../../../lib/listingFormatters";

const clean = value => String(value ?? "").trim();
const publicDataOf = listing => listing?.publicData || listing?.attributes?.publicData || {};

export function createOwnedPrivateTransactObject(listing = {}) {
  const publicData = publicDataOf(listing);
  const passportId = clean(listing?.passportId || publicData?.passportId || listing?.ixiMedia?.passportId || publicData?.ixiMedia?.passportId);
  const objectId = clean(listing?.objectId || publicData?.objectId || listing?.mosObjectId || publicData?.mosObjectId || getListingId(listing));
  const entityPassportId = clean(listing?.entityPassportId || publicData?.entityPassportId || listing?.entity?.passportId || publicData?.entity?.passportId);
  return {
    ...listing,
    objectId,
    id: objectId,
    objectType: clean(listing?.objectType || publicData?.objectType) || "machine",
    displayName: clean(listing?.title || listing?.attributes?.title) || "EQUIPMENT",
    passportId,
    entityPassportId,
    fields: { ...(listing?.fields || {}), entityPassportId, location: clean(listing?.location || publicData?.location || publicData?.city), serialNumber: clean(listing?.serialNumber || publicData?.serialNumber), stockNumber: clean(listing?.stockNumber || publicData?.stockNumber), year: listing?.year ?? publicData?.year ?? "", make: listing?.make ?? publicData?.make ?? "", model: listing?.model ?? publicData?.model ?? "", primaryMeter: listing?.hours ?? publicData?.hours ?? "" },
    capabilities: { ...(listing?.capabilities || {}), canCreate: true, canTransact: true, editable: true, hasConsole: true }
  };
}

export default createOwnedPrivateTransactObject;
