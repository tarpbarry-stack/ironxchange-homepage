// IronXchange V12 taxonomy generator
// Reads current taxonomy libraries and outputs Sharetribe-compatible configCategories.js

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

function makeNode(categoryId, makeName, models = []) {
  const makeId = `${categoryId}-${slugify(makeName)}`;

  return {
    id: makeId,
    name: String(makeName || "").trim(),
    subcategories: models.map(model => ({
      id: `${makeId}-${slugify(model)}`,
      name: String(model || "").trim(),
      subcategories: []
    }))
  };
}

const categoriesConfig = {
  categories: []
};

const output = `// IronXchange V12 master Sharetribe-compatible category tree.
// GENERATED FILE. DO NOT HAND EDIT.
// Shape: Category → Make → Model.

const categoriesConfig = ${JSON.stringify(categoriesConfig, null, 2)};

export default categoriesConfig;
`;

const outputPath = path.join(process.cwd(), "config", "configCategories.js");

fs.writeFileSync(outputPath, output);

console.log("Generated:", outputPath);
