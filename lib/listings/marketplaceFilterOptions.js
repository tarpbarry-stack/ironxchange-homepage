export function taxonomyKey(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/&/g, "AND")
    .replace(/\//g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");
}

export function getListingCategory(item = {}) {
  return (
    item.category ||
    item.type ||
    item.publicData?.category ||
    item.attributes?.publicData?.category ||
    ""
  );
}

export function getListingMake(item = {}) {
  return (
    item.make ||
    item.publicData?.make ||
    item.attributes?.publicData?.make ||
    ""
  );
}

export function getListingModel(item = {}) {
  return (
    item.model ||
    item.publicData?.model ||
    item.attributes?.publicData?.model ||
    ""
  );
}

export function getUniqueListingValues(listings = [], getter, predicate = () => true) {
  const valuesByKey = new Map();

  listings.forEach((item) => {
    if (!predicate(item)) return;

    const value = String(getter(item) || "").trim();
    const key = taxonomyKey(value);

    if (key && !valuesByKey.has(key)) {
      valuesByKey.set(key, value);
    }
  });

  return Array.from(valuesByKey.values()).sort((left, right) =>
    left.localeCompare(right)
  );
}
