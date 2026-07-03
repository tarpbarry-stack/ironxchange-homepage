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
    .replace(/[^A-Z0-9]+/g, "");
}

function makeMatches(a = "", b = "") {
  const left = normalize(a);
  const right = normalize(b);

  if (!left || !right) return false;

  return (
    left === right ||
    left.includes(right) ||
    right.includes(left)
  );
}

function modelMatches(a = "", b = "") {
  const left = normalize(a);
  const right = normalize(b);

  if (!left || !right) return false;

  return (
    left === right ||
    left.includes(right) ||
    right.includes(left)
  );
}

export function inferMachineCategory(make = "", model = "") {
  const targetMake = normalize(make);
  const targetModel = normalize(model);

  if (!targetMake && !targetModel) return "";

  const categories = getV12CategoryNames();

  // Best match: make + model
  for (const category of categories) {
    const makes = getV12Makes(category);

    const matchedMake = makes.find(item =>
      makeMatches(item, targetMake)
    );

    if (!matchedMake) continue;

    const models = getV12Models(category, matchedMake);

    const matchedModel = models.find(item =>
      modelMatches(item, targetModel)
    );

    if (matchedModel) {
      return category;
    }
  }

  // Fallback: model-only match across taxonomy
  for (const category of categories) {
    const makes = getV12Makes(category);

    for (const taxonomyMake of makes) {
      const models = getV12Models(category, taxonomyMake);

      const matchedModel = models.find(item =>
        modelMatches(item, targetModel)
      );

      if (matchedModel) {
        return category;
      }
    }
  }

  return "";
}
