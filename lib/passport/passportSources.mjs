function clean(value) {
  return String(value ?? "").trim();
}

const SHARETRIBE_SOURCE_TYPES = new Set([
  "sharetribe-listing",
  "marketplace-listing"
]);

export function getPassportSharetribeListingId(passport = {}) {
  const sources = Array.isArray(passport?.sources)
    ? passport.sources
    : [];
  const source = sources.find(item =>
    SHARETRIBE_SOURCE_TYPES.has(
      clean(item?.sourceType).toLowerCase()
    ) && clean(item?.sourceId)
  );

  if (source) return clean(source.sourceId);

  if (
    SHARETRIBE_SOURCE_TYPES.has(
      clean(passport?.sourceType).toLowerCase()
    )
  ) {
    return clean(passport.sourceId);
  }

  return "";
}

export default getPassportSharetribeListingId;
