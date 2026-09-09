const PUBLIC_MARKETPLACE_SURFACES = new Set([
  "browse-v2",
  "home",
  "saved",
  "yard",
  "seller-yard",
  "seller-yard-v2",
  "theater",
  "listing-navigation"
]);

const PUBLIC_MARKETPLACE_PROJECTIONS = new Set([
  "card",
  "directory"
]);

function clean(value) {
  return String(value || "").trim().toLowerCase();
}

export function resolvePublicMarketplaceProjection(query = {}) {
  const surface = clean(query.surface);
  const projection = clean(query.projection);

  if (
    !PUBLIC_MARKETPLACE_SURFACES.has(surface) ||
    !PUBLIC_MARKETPLACE_PROJECTIONS.has(projection)
  ) {
    return null;
  }

  return {
    surface,
    projection
  };
}

export function createPublicMarketplaceCatalogueUrl({
  surface,
  projection = "card"
} = {}) {
  const resolved = resolvePublicMarketplaceProjection({
    surface,
    projection
  });

  if (!resolved) {
    throw new Error(
      "Unsupported public Marketplace catalogue projection"
    );
  }

  const params = new URLSearchParams(resolved);
  return `/api/listings?${params.toString()}`;
}

export function isPublicMarketplaceSurface(surface) {
  return PUBLIC_MARKETPLACE_SURFACES.has(clean(surface));
}

export const publicMarketplaceSurfaces = Object.freeze(
  [...PUBLIC_MARKETPLACE_SURFACES]
);

export const publicMarketplaceProjections = Object.freeze(
  [...PUBLIC_MARKETPLACE_PROJECTIONS]
);
