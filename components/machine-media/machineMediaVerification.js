function getImageId(image = {}) {
  return (
    image?.imageId ||
    image?.id?.uuid ||
    image?.id ||
    image?.uuid ||
    null
  );
}

function normalizeId(value) {
  return value?.uuid ? String(value.uuid) : String(value || "");
}

export function extractListingImageIds(listing = {}) {
  const images = Array.isArray(listing?.imageObjects)
    ? listing.imageObjects
    : Array.isArray(listing?.images)
      ? listing.images
      : [];

  return images
    .map(getImageId)
    .filter(Boolean)
    .map(normalizeId);
}

export function verifyMachineMediaUpdate({
  expectedImageIds = [],
  verifiedListing = {}
}) {
  const expected = expectedImageIds.map(normalizeId);
  const actual = extractListingImageIds(verifiedListing);

  if (expected.length !== actual.length) {
    throw new Error(
      `Media verification failed: expected ${expected.length} images, found ${actual.length}.`
    );
  }

  for (let index = 0; index < expected.length; index += 1) {
    if (String(expected[index]) !== String(actual[index])) {
      throw new Error(
        `Media verification failed: image order mismatch at position ${index + 1}.`
      );
    }
  }

  return {
    verified: true,
    expectedImageIds: expected,
    actualImageIds: actual
  };
}
