const fs = require("fs");
const path = require("path");

console.log("AWS Taxonomy Master Builder Loaded");

// TODAY ONLY:
// This file is just the staging point.
// We are not scrubbing, sorting, deduping, or restructuring today.
// The only allowed cleanup today is CAT → CATERPILLAR when we wire the skid steer taxonomy in.

const outputPath = path.join(process.cwd(), "config", "awsTaxonomyMaster.json");

const master = {
  generatedAt: new Date().toISOString(),
  note: "IronXchange AWS taxonomy master starter file. No broad cleanup applied.",
  categories: []
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(master, null, 2));

console.log("Generated:", outputPath);
