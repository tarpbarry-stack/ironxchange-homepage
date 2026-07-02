// /lib/machine-object/inferMachineCategory.js

import {
  getV12CategoryNames,
  getV12Makes,
  getV12Models
} from "../v12TaxonomyAdapter";

function normalize(value = "") {
  return String(value)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

export function inferMachineCategory(make = "", model = "") {
  const targetMake = normalize(make);
  const targetModel = normalize(model);

  const categories = getV12CategoryNames();

  for (const category of categories) {
    const makes = getV12Makes(category);

    const matchedMake = makes.find(
      item => normalize(item) === targetMake
    );

    if (!matchedMake) continue;

    const models = getV12Models(category, matchedMake);

    const matchedModel = models.find(
      item => normalize(item) === targetModel
    );

    if (matchedModel) {
      return category;
    }
  }

  return "";
}
