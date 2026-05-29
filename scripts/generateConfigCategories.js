const fs = require("fs");
const path = require("path");

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\//g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const masterPath = path.join(process.cwd(), "config", "awsTaxonomyMaster.json");
const outputPath = path.join(process.cwd(), "config", "configCategories.js");

const master = JSON.parse(fs.readFileSync(masterPath, "utf8"));

function buildCategory(category) {
  const categoryId = slugify(category.name);
  const makeMap = {};

  category.rows.forEach(row => {
    const make = String(row.make || "").trim();
    const model = String(row.model || "").trim();

    if (!make || !model) return;

    if (!makeMap[make]) makeMap[make] = [];
    makeMap[make].push(model);
  });

  return {
    id: categoryId,
    name: category.name,
    subcategories: Object.keys(makeMap).map(make => ({
      id: `${categoryId}-${slugify(make)}`,
      name: make,
      subcategories: makeMap[make].map(model => ({
        id: `${categoryId}-${slugify(make)}-${slugify(model)}`,
        name: model,
        subcategories: []
      }))
    }))
  };
}

const categoriesConfig = {
  categories: master.categories.map(buildCategory)
};

const output = `// IronXchange Sharetribe-compatible category tree.
// GENERATED FILE. DO NOT HAND EDIT.

const categoriesConfig = ${JSON.stringify(categoriesConfig, null, 2)};

export default categoriesConfig;
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output);

console.log("Generated:", outputPath);
