import categoriesConfig from "../config/configCategories";

export function getV12Categories() {
  return categoriesConfig?.categories || [];
}

export function getV12CategoryNames() {
  return getV12Categories().map(category => category.name);
}

export function getV12CategoryByName(categoryName) {
  const target = String(categoryName || "").trim().toLowerCase();

  return getV12Categories().find(category =>
    String(category.name || "").trim().toLowerCase() === target ||
    String(category.id || "").trim().toLowerCase() === target
  );
}

export function getV12Makes(categoryName) {
  const category = getV12CategoryByName(categoryName);

  return (category?.subcategories || []).map(make => make.name);
}

export function getV12Models(categoryName, makeName) {
  const category = getV12CategoryByName(categoryName);
  const targetMake = String(makeName || "").trim().toLowerCase();

  const make = (category?.subcategories || []).find(item =>
    String(item.name || "").trim().toLowerCase() === targetMake ||
    String(item.id || "").trim().toLowerCase().endsWith(`-${targetMake}`)
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
