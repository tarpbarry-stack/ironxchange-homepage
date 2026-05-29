const fs = require("fs");
const path = require("path");

const taxonomyRegistry = require("../lib/taxonomyRegistry");

console.log("AWS Taxonomy Master Builder Loaded");

function normalizeMake(make) {
  if (make === "CAT") return "CATERPILLAR";
  return make;
}

function loadTaxonomy(file) {
  if (!file) return [];

  const loaded = require(`../lib/${file}`);
  return loaded.default || loaded;
}

const categories = taxonomyRegistry.map(category => {
  const taxonomy = loadTaxonomy(category.file);

  return {
    name: category.name,
    awsName: category.awsName,
    awsId: category.awsId,
    rows: taxonomy.map(row => ({
      ...row,
      make: normalizeMake(row.make)
    }))
  };
});

const outputPath = path.join(process.cwd(), "config", "awsTaxonomyMaster.json");

const master = {
  generatedAt: new Date().toISOString(),
  note: "IronXchange AWS taxonomy master. No broad cleanup applied. CAT → CATERPILLAR is applied during generation.",
  categories
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(master, null, 2));

console.log("Generated:", outputPath);
console.log("Categories:", master.categories.length);
console.log(
  "Total rows:",
  master.categories.reduce((sum, category) => sum + category.rows.length, 0)
);
