function clean(value) {
  return String(value ?? "").trim();
}

function machineTitle(attributes = {}, publicData = {}) {
  return clean(attributes.title) ||
    clean(`${clean(publicData.year)} ${clean(publicData.make)} ${clean(publicData.model)}`) ||
    "IXI Machine";
}

export function normalizeOwnedMachineListing(listing = {}) {
  const attributes = listing?.attributes || {};
  const publicData = attributes?.publicData || {};
  const price = attributes?.price || {};

  return {
    listingId: clean(listing?.id?.uuid || listing?.id),
    displayName: machineTitle(attributes, publicData),
    value: Number.isFinite(Number(price?.amount))
      ? Number(price.amount) / 100
      : null,
    currency: clean(price?.currency) || "USD",
    channel:
      clean(publicData.machineChannel) ||
      clean(publicData.machineAccess) ||
      "private",
    state: clean(attributes?.state),
    fields: {
      category: clean(publicData.category),
      year: clean(publicData.year),
      make: clean(publicData.make),
      model: clean(publicData.model),
      hours: publicData.hours ?? null,
      serialNumber: clean(publicData.serialNumber),
      stockNumber: clean(publicData.stockNumber),
      city: clean(publicData.city),
      state: clean(publicData.loc || publicData.state),
      description: clean(attributes.description)
    }
  };
}

export default normalizeOwnedMachineListing;
