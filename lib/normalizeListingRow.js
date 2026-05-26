export function cleanNumber(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/[$,\s]/g, "")
    .trim();
}

export function parseList(value) {
  if (!value) return [];

  return String(value)
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);
}

export function parseExternalLinks(value) {
  if (!value) return [];

  return String(value)
    .split(";")
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      const [label, url] = item
        .split("|")
        .map(v => String(v || "").trim());

      if (!label || !url) return null;

      return {
        label,
        url,
      };
    })
    .filter(Boolean);
}

export function normalizeListingRow(row, index = 0) {
  const year = cleanNumber(row.year);
  const hours = cleanNumber(row.hours);
  const price = cleanNumber(row.price);

  const normalized = {
    rowNumber: index + 2,

    category: String(row.category || "").trim(),
    year,

    make: String(row.make || "").trim(),
    model: String(row.model || "").trim(),

    hours,
    price,

    location: String(row.location || "").trim(),
    description: String(row.description || "").trim(),

    keywords: parseList(row.keywords),

    imageUrls: parseList(row.imageUrls),

    sellerReference: String(row.sellerReference || "").trim(),

    externalLinks: parseExternalLinks(row.externalLinks),

    serialNumber: String(row.serialNumber || "").trim(),

    condition: String(row.condition || "").trim(),

    city: String(row.city || "").trim(),

    state: String(row.state || "").trim(),
  };

  normalized.title =
    `${normalized.year} ${normalized.make} ${normalized.model} - ${normalized.hours} hrs`;

  const errors = [];

  if (!normalized.category) {
    errors.push("Missing category");
  }

  if (!normalized.year || Number.isNaN(Number(normalized.year))) {
    errors.push("Invalid year");
  }

  if (!normalized.make) {
    errors.push("Missing make");
  }

  if (!normalized.model) {
    errors.push("Missing model");
  }

  if (!normalized.hours || Number.isNaN(Number(normalized.hours))) {
    errors.push("Invalid hours");
  }

  if (normalized.price && Number.isNaN(Number(normalized.price))) {
    errors.push("Invalid price");
  }

  if (!normalized.location) {
    errors.push("Missing location");
  }

  if (!normalized.description) {
    errors.push("Missing description");
  }

  return {
    ...normalized,
    isValid: errors.length === 0,
    errors,
  };
}
