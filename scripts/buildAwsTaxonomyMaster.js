const fs = require("fs");
const path = require("path");

console.log("AWS Taxonomy Master Builder Loaded");

// Import current local taxonomy files.
// Today we are only wiring SKID STEER / CTL.
const taxonomyRegistry = require("../lib/taxonomyRegistry");

function normalizeMake(make) {
  if (make === "CAT") return "CATERPILLAR";
  return make;
}


const outputPath = path.join(process.cwd(), "config", "awsTaxonomyMaster.json");

const master = {
  generatedAt: new Date().toISOString(),
  note: "IronXchange AWS taxonomy master starter file. No broad cleanup applied. Only CAT → CATERPILLAR is applied for SKID STEER / CTL.",
  categories: taxonomyRegistry.map(category => {
  const taxonomy =
    require(`../lib/${category.file}`).default ||
    require(`../lib/${category.file}`);

  return {
    name: category.name,
    rows: taxonomy.map(row => ({
      ...row,
      make: normalizeMake(row.make)
    }))
  };
})
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(master, null, 2));

console.log("Generated:", outputPath);
console.log("SKID STEER / CTL rows:", skidSteerRows.length);
