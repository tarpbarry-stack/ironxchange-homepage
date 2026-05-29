const fs = require("fs");
const path = require("path");

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildCategory(categoryName, rows) {
  const makeMap = {};

  rows.forEach(row => {
    const make = String(row.make || "").trim();
    const model = String(row.model || "").trim();

    if (!make || !model) return;

    if (!makeMap[make]) {
      makeMap[make] = [];
    }

    makeMap[make].push(model);
  });

  return {
    id: slugify(categoryName),
    name: categoryName,
    subcategories: Object.keys(makeMap)
      .sort()
      .map(make => ({
        id: `${slugify(categoryName)}-${slugify(make)}`,
        name: make,
        subcategories: makeMap[make]
          .sort()
          .map(model => ({
            id: `${slugify(categoryName)}-${slugify(make)}-${slugify(model)}`,
            name: model,
            subcategories: []
          }))
      }))
  };
}

console.log("Generator Loaded");
