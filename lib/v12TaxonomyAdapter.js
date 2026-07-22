// /lib/v12TaxonomyAdapter.js

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

function slugify(value) {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cloneTaxonomy(source) {
  return {
    categories: Array.isArray(source?.categories)
      ? source.categories.map(category => ({
          ...category,

          subcategories: Array.isArray(
            category?.subcategories
          )
            ? category.subcategories.map(make => ({
                ...make,

                subcategories: Array.isArray(
                  make?.subcategories
                )
                  ? make.subcategories.map(model => ({
                      ...model,

                      subcategories: Array.isArray(
                        model?.subcategories
                      )
                        ? [...model.subcategories]
                        : []
                    }))
                  : []
              }))
            : []
        }))
      : []
  };
}

/*
 * The bundled taxonomy remains the startup fallback.
 *
 * Runtime acquisition paths are inserted into this copy,
 * so URL Import can use a category/make/model immediately
 * without waiting for a new Vercel deployment.
 */
let runtimeTaxonomy =
  cloneTaxonomy(categoriesConfig);

function resolveCategoryName(categoryName) {
  const raw = clean(categoryName);

  return (
    CATEGORY_ALIASES[raw.toUpperCase()] ||
    raw
  );
}

function findCategory(
  categories,
  categoryName
) {
  const resolved =
    resolveCategoryName(categoryName);

  const target = key(resolved);
  const original = key(categoryName);

  return categories.find(category =>
    key(category?.name) === target ||
    key(category?.id) === target ||
    key(category?.name) === original ||
    key(category?.id) === original
  );
}

function findMake(category, makeName) {
  const targetMake = key(makeName);

  return (
    category?.subcategories || []
  ).find(item =>
    key(item?.name) === targetMake ||
    key(item?.id).endsWith(
      `-${slugify(makeName)}`
    )
  );
}

function findModel(make, modelName) {
  const targetModel = key(modelName);

  return (
    make?.subcategories || []
  ).find(item =>
    key(item?.name) === targetModel ||
    key(item?.id).endsWith(
      `-${slugify(modelName)}`
    )
  );
}

export function resetV12RuntimeTaxonomy() {
  runtimeTaxonomy =
    cloneTaxonomy(categoriesConfig);

  return runtimeTaxonomy;
}

export function setV12RuntimeTaxonomy(
  taxonomy
) {
  if (
    !taxonomy ||
    !Array.isArray(taxonomy.categories)
  ) {
    return runtimeTaxonomy;
  }

  runtimeTaxonomy =
    cloneTaxonomy(taxonomy);

  return runtimeTaxonomy;
}

/*
 * Accepts either:
 *
 * {
 *   category: "Backhoe Loaders",
 *   make: "CATERPILLAR",
 *   model: "420F2"
 * }
 *
 * or:
 *
 * {
 *   category: { id, name },
 *   make: { id, name },
 *   model: { id, name }
 * }
 */
export function applyV12TaxonomyPath(
  input = {}
) {
  const categoryName = clean(
    input?.category?.name ||
    input?.category
  );

  const makeName = clean(
    input?.make?.name ||
    input?.make
  );

  const modelName = clean(
    input?.model?.name ||
    input?.model
  );

  if (
    !categoryName ||
    !makeName ||
    !modelName
  ) {
    return {
      ok: false,
      error:
        "Category, make, and model are required."
    };
  }

  const categories =
    runtimeTaxonomy.categories;

  const canonicalCategoryName =
    resolveCategoryName(categoryName);

  let category =
    findCategory(
      categories,
      canonicalCategoryName
    );

  let categoryCreated = false;
  let makeCreated = false;
  let modelCreated = false;

  if (!category) {
    category = {
      id:
        clean(input?.category?.id) ||
        slugify(canonicalCategoryName),

      name: canonicalCategoryName,
      subcategories: []
    };

    categories.push(category);
    categoryCreated = true;
  }

  if (
    !Array.isArray(
      category.subcategories
    )
  ) {
    category.subcategories = [];
  }

  let make =
    findMake(category, makeName);

  if (!make) {
    make = {
      id:
        clean(input?.make?.id) ||
        slugify(
          `${category.name}-${makeName}`
        ),

      name: makeName,
      subcategories: []
    };

    category.subcategories.push(make);
    makeCreated = true;
  }

  if (
    !Array.isArray(
      make.subcategories
    )
  ) {
    make.subcategories = [];
  }

  let model =
    findModel(make, modelName);

  if (!model) {
    model = {
      id:
        clean(input?.model?.id) ||
        slugify(
          `${category.name}-${make.name}-${modelName}`
        ),

      name: modelName,
      subcategories: []
    };

    make.subcategories.push(model);
    modelCreated = true;
  }

  return {
    ok: true,

    path: {
      category: {
        id: category.id,
        name: category.name
      },

      make: {
        id: make.id,
        name: make.name
      },

      model: {
        id: model.id,
        name: model.name
      }
    },

    created: {
      category: categoryCreated,
      make: makeCreated,
      model: modelCreated
    }
  };
}

export function getV12Categories() {
  return (
    runtimeTaxonomy?.categories || []
  );
}

export function getV12CategoryNames() {
  return getV12Categories().map(
    category => category.name
  );
}

export function getV12CategoryByName(
  categoryName
) {
  return findCategory(
    getV12Categories(),
    categoryName
  );
}

export function getV12Makes(
  categoryName
) {
  const category =
    getV12CategoryByName(categoryName);

  return (
    category?.subcategories || []
  ).map(make => make.name);
}

export function getV12Models(
  categoryName,
  makeName
) {
  const category =
    getV12CategoryByName(categoryName);

  const make =
    findMake(category, makeName);

  return (
    make?.subcategories || []
  ).map(model => model.name);
}

export function getV12TaxonomyPath(
  categoryName,
  makeName,
  modelName
) {
  const category =
    getV12CategoryByName(categoryName);

  const make =
    findMake(category, makeName);

  const model =
    findModel(make, modelName);

  if (!category || !make || !model) {
    return null;
  }

  return {
    category: {
      id: category.id,
      name: category.name
    },

    make: {
      id: make.id,
      name: make.name
    },

    model: {
      id: model.id,
      name: model.name
    }
  };
}

export function getV12TaxonomyRows(
  categoryName
) {
  const category =
    getV12CategoryByName(categoryName);

  if (!category) return [];

  return (
    category.subcategories || []
  ).flatMap(make =>
    (
      make.subcategories || []
    ).map(model => ({
      category: category.name,
      categoryId: category.id,
      make: make.name,
      makeId: make.id,
      model: model.name,
      modelId: model.id
    }))
  );
}
