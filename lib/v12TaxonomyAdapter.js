import categoriesConfig from "../config/configCategories";

const CATEGORY_ALIASES = {
  "SKID STEER/CTL": "Skid Steer / CTL",
  "COMPACTION/ROLLERS": "Compaction / Rollers",
  "DRILLS & PILING": "Drills / Piling",
  "TRENCHERS/PLOWS": "Trenchers",
  "DUMP TRUCKS - ARTIC/RIGID": "Dump Trucks",
  "CRAWLER CARRIERS / LOADER": "Crawler Carriers",
  "SCRAPER": "Scrapers",
  "AERIAL EQUIPMENT": "Aerial Equipment"
};

function clean(value) {
  return String(value || "").trim();
}

function key(value) {
  return clean(value).toLowerCase();
}

function resolveCategoryName(categoryName) {
  const raw = clean(categoryName);
  return CATEGORY_ALIASES[raw.toUpperCase()] || raw;
}

export function getV12Categories() {
  return categoriesConfig?.categories || [];
}

export function getV12CategoryNames() {
  return getV12Categories().map(category => category.name);
}

export function getV12CategoryByName(categoryName) {
  const resolved = resolveCategoryName(categoryName);
  const target = key(resolved);
  const original = key(categoryName);

  return getV12Categories().find(category =>
    key(category.name) === target ||
    key(category.id) === target ||
    key(category.name) === original ||
    key(category.id) === original
  );
}

export function getV12Makes(categoryName) {
  const category = getV12CategoryByName(categoryName);
  return (category?.subcategories || []).map(make => make.name);
}

export function getV12Models(categoryName, makeName) {
  const category = getV12CategoryByName(categoryName);
  const targetMake = key(makeName);

  const make = (category?.subcategories || []).find(item =>
    key(item.name) === targetMake ||
    key(item.id).endsWith(`-${targetMake}`)
  );

  return (make?.subcategories || []).map(model => model.name);
}

export function getV12TaxonomyRows(categoryName) {
  const category = getV12CategoryByName(categoryName);

  if (!category) return [];

  return (category.subcategories || []).flatMap(make =>
    (make.subcategories || []).map(model => ({
      category: category.name,
      categoryId: category.id,
      make: make.name,
      makeId: make.id,
      model: model.name,
      modelId: model.id
    }))
  );
}
