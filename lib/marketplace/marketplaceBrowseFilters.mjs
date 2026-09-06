const RANGE_FIELDS = [
  "yearMin",
  "yearMax",
  "priceMin",
  "priceMax",
  "hoursMin",
  "hoursMax"
];

const RANGE_PAIRS = [
  ["yearMin", "yearMax", "YEAR"],
  ["priceMin", "priceMax", "PRICE"],
  ["hoursMin", "hoursMax", "HOURS"]
];

function isYearField(field) {
  return field === "yearMin" || field === "yearMax";
}

function cleanNumericText(value) {
  return String(value ?? "")
    .trim()
    .replace(/[$,\s]/g, "");
}

export function parseMarketplaceRangeValue(
  field,
  value,
  currentYear = new Date().getFullYear()
) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return { value: null, error: "" };
  }

  const cleaned = cleanNumericText(raw);

  if (!/^\d+(?:\.\d+)?$/.test(cleaned)) {
    return {
      value: null,
      error: "ENTER NUMBERS ONLY"
    };
  }

  const numericValue = Number(cleaned);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return {
      value: null,
      error: "ENTER A VALID NON-NEGATIVE NUMBER"
    };
  }

  if (isYearField(field)) {
    if (!Number.isInteger(numericValue)) {
      return {
        value: null,
        error: "ENTER A FOUR-DIGIT YEAR"
      };
    }

    if (numericValue < 1900 || numericValue > currentYear + 2) {
      return {
        value: null,
        error: `YEAR MUST BE 1900–${currentYear + 2}`
      };
    }
  }

  return {
    value: numericValue,
    error: ""
  };
}

export function validateMarketplaceRangeFilters(
  filters = {},
  currentYear = new Date().getFullYear()
) {
  const values = {};
  const errors = {};

  RANGE_FIELDS.forEach(field => {
    const parsed = parseMarketplaceRangeValue(
      field,
      filters[field],
      currentYear
    );

    values[field] = parsed.value;

    if (parsed.error) {
      errors[field] = parsed.error;
    }
  });

  RANGE_PAIRS.forEach(([minimumField, maximumField, label]) => {
    const minimum = values[minimumField];
    const maximum = values[maximumField];

    if (
      minimum !== null &&
      maximum !== null &&
      minimum > maximum
    ) {
      const message = `${label} MINIMUM CANNOT EXCEED MAXIMUM`;
      errors[minimumField] = message;
      errors[maximumField] = message;
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    values,
    errors,
    message: Object.values(errors)[0] || ""
  };
}

function numericListingValue(value) {
  const normalized = Number(
    String(value ?? "").replace(/[^0-9.]/g, "")
  );

  return Number.isFinite(normalized) ? normalized : 0;
}

export function matchesMarketplaceRanges(
  listing = {},
  ranges = {}
) {
  const year = numericListingValue(
    listing.year || listing.publicData?.year
  );
  const price = numericListingValue(
    listing.price || listing.publicData?.price
  );
  const hours = numericListingValue(
    listing.hours || listing.publicData?.hours
  );

  return (
    (ranges.yearMin === null || year >= ranges.yearMin) &&
    (ranges.yearMax === null || year <= ranges.yearMax) &&
    (ranges.priceMin === null || price >= ranges.priceMin) &&
    (ranges.priceMax === null || price <= ranges.priceMax) &&
    (ranges.hoursMin === null || hours >= ranges.hoursMin) &&
    (ranges.hoursMax === null || hours <= ranges.hoursMax)
  );
}

function validModelYear(listing = {}) {
  const year = Number(listing.year || listing.publicData?.year || 0);
  return Number.isInteger(year) && year > 0 ? year : null;
}

export function sortMarketplaceListings(listings = [], sortMode = "custom") {
  return listings
    .map((listing, originalIndex) => ({ listing, originalIndex }))
    .sort((left, right) => {
      const a = left.listing;
      const b = right.listing;

      const priceA = numericListingValue(a.price || a.publicData?.price);
      const priceB = numericListingValue(b.price || b.publicData?.price);
      const hoursA = numericListingValue(a.hours || a.publicData?.hours);
      const hoursB = numericListingValue(b.hours || b.publicData?.hours);
      const yearA = validModelYear(a);
      const yearB = validModelYear(b);

      let comparison = 0;

      if (sortMode === "price-low") comparison = priceA - priceB;
      if (sortMode === "price-high") comparison = priceB - priceA;
      if (sortMode === "hours-low") comparison = hoursA - hoursB;
      if (sortMode === "hours-high") comparison = hoursB - hoursA;

      if (sortMode === "newest" || sortMode === "year-new") {
        if (yearA === null && yearB !== null) comparison = 1;
        else if (yearA !== null && yearB === null) comparison = -1;
        else if (yearA !== null && yearB !== null) comparison = yearB - yearA;
      }

      if (sortMode === "year-old") {
        if (yearA === null && yearB !== null) comparison = 1;
        else if (yearA !== null && yearB === null) comparison = -1;
        else if (yearA !== null && yearB !== null) comparison = yearA - yearB;
      }

      return comparison || left.originalIndex - right.originalIndex;
    })
    .map(({ listing }) => listing);
}

