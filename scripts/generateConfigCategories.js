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

const categoriesConfig = {
  categories: [
    buildCategory("SKID STEER / CTL", []),
    buildCategory("DOZERS", [])
  ]
};

const output = `// IronXchange V12 master Sharetribe-compatible category tree.
// GENERATED FILE. DO NOT HAND EDIT.

const categoriesConfig = ${JSON.stringify(categoriesConfig, null, 2)};

export default categoriesConfig;
`;

const outputPath = path.join(process.cwd(), "config", "configCategories.js");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output);

console.log("Generated:", outputPath);
