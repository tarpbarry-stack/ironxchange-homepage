const CARD_FIELDS = [
  "id",
  "authorId",
  "createdAt",
  "title",
  "type",
  "category",
  "make",
  "model",
  "year",
  "hours",
  "location",
  "price",
  "imageUrl",
  "imageCount",
  "description",
  "keywords",
  "machineAccess",
  "machineChannel",
  "listingStatus",
  "workflowStatus",
  "sellerReference",
  "stockNumber",
  "serialNumber",
  "condition",
  "passportId",
  "passportUrl",
  "ixiMediaMachineKey",
  "sellerName",
  "sellerCompany",
  "sellerLocation",
  "sellerLogo"
];

function hasValue(value) {
  return (
    value !== "" &&
    value !== null &&
    value !== undefined &&
    (!Array.isArray(value) || value.length > 0)
  );
}

export function compactMarketplaceListing(listing = {}) {
  return Object.fromEntries(
    CARD_FIELDS
      .map(field => [field, listing[field]])
      .filter(([, value]) => hasValue(value))
  );
}

export default compactMarketplaceListing;
