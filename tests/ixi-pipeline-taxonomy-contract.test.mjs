import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import categoriesConfig from "../config/configCategories.js";
import {
  applyV12TaxonomyPath,
  getV12EquipmentTypes,
  getV12Makes,
  getV12Models,
  getV12TaxonomyPath,
  resetV12RuntimeTaxonomy
} from "../lib/v12TaxonomyAdapter.js";

const EXPECTED_TYPES = [
  "PIPELAYERS",
  "BENDING MACHINES",
  "HYDRAULIC LIFTERS",
  "PADDING MACHINES",
  "WELDERS"
];

test("Pipeline Equipment is a governed four-level taxonomy", () => {
  const pipeline = categoriesConfig.categories.find(
    category => category.name === "Pipeline Equipment"
  );

  assert.ok(pipeline, "Pipeline Equipment must be a top-level category");
  assert.equal(pipeline.hierarchy, "type-make-model");
  assert.deepEqual(
    pipeline.subcategories.map(type => type.name),
    EXPECTED_TYPES
  );

  for (const equipmentType of pipeline.subcategories) {
    assert.deepEqual(
      equipmentType.subcategories,
      [],
      `${equipmentType.name} must remain empty until a real make/model is added`
    );
  }
});

test("existing categories retain Category to Make to Model shape", () => {
  const excavators = categoriesConfig.categories.find(
    category => category.name === "Excavators"
  );

  assert.ok(excavators);
  assert.notEqual(excavators.hierarchy, "type-make-model");
  assert.ok(excavators.subcategories.length > 0);
  assert.ok(excavators.subcategories[0].subcategories.length > 0);
  assert.deepEqual(
    excavators.subcategories[0].subcategories[0].subcategories,
    []
  );
});

test("runtime adapter resolves both legacy and four-level paths", () => {
  resetV12RuntimeTaxonomy();

  assert.deepEqual(
    getV12EquipmentTypes("Pipeline Equipment"),
    EXPECTED_TYPES
  );
  assert.deepEqual(getV12Makes("Pipeline Equipment", "Pipelayers"), []);

  const inserted = applyV12TaxonomyPath({
    category: "Pipeline Equipment",
    equipmentType: "Pipelayers",
    make: "CATERPILLAR",
    model: "PL87"
  });

  assert.equal(inserted.ok, true);
  assert.equal(inserted.path.equipmentType.name, "PIPELAYERS");
  assert.deepEqual(
    getV12Makes("Pipeline Equipment", "Pipelayers"),
    ["CATERPILLAR"]
  );
  assert.deepEqual(
    getV12Models("Pipeline Equipment", "CATERPILLAR", "Pipelayers"),
    ["PL87"]
  );
  assert.ok(
    getV12TaxonomyPath(
      "Pipeline Equipment",
      "CATERPILLAR",
      "PL87",
      "Pipelayers"
    )
  );

  assert.ok(
    getV12TaxonomyPath("Excavators", "CATERPILLAR", "320")
  );

  resetV12RuntimeTaxonomy();
});

test("Sharetribe mapping remains flat and stores equipment type separately", () => {
  for (const file of ["pages/post-free.js", "pages/url-import.js"]) {
    const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

    assert.match(source, /categoryLevel1/);
    assert.match(source, /categoryLevel2/);
    assert.match(source, /categoryLevel3/);
    assert.match(source, /equipmentType,/);
    assert.doesNotMatch(source, /categoryLevel4/);
  }
});

test("Admin Daddy adds a complete real-machine path without OTHER seeds", () => {
  const source = fs.readFileSync(
    new URL("../pages/admin-daddy.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /PIPELINE EQUIPMENT/);
  assert.match(source, /Add Make \+ Model/);
  assert.match(source, /commitMakeModelPath/);
  assert.match(source, /equipmentType: activeEquipmentType/);
});

test("every deployment regenerates the governed taxonomy outputs", () => {
  const packageJson = JSON.parse(
    fs.readFileSync(new URL("../package.json", import.meta.url), "utf8")
  );

  assert.equal(
    packageJson.scripts.prebuild,
    "npm run build-aws-taxonomy-master && npm run generate-taxonomy"
  );
});
