import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  atlasModules,
  getAtlasPart,
  machineCardParts,
} from "../lib/ixi-atlas/machineCardRegistry.mjs";

test("Machine Card is the first technical assembly", () => {
  assert.equal(atlasModules[0].id, "TA-001");
  assert.equal(atlasModules[0].name, "Machine Card");
  assert.equal(atlasModules[1].name, "Chassis");
});

test("the Machine Card register documents unique production components", () => {
  assert.ok(machineCardParts.length >= 8);
  assert.equal(
    new Set(machineCardParts.map(({ id }) => id)).size,
    machineCardParts.length,
  );
  for (const part of machineCardParts) {
    assert.equal(part.status, "PRODUCTION");
    assert.ok(part.purpose.length > 40);
    assert.ok(part.benefit.length > 40);
    assert.ok(part.sources.length > 0);
    assert.ok(part.specs.length > 2);
  }
});

test("the Machine Rail exposes all seven production command zones", () => {
  const rail = getAtlasPart("rail");
  assert.equal(rail.specs.length, 7);
  assert.match(rail.specs[0], /Forward/);
  assert.match(rail.specs[6], /Backward/);
});

test("unknown component selection safely returns the Machine Object", () => {
  assert.equal(getAtlasPart("not-real").id, "object");
});

test("Atlas uses the current IXI V12 readability contract", () => {
  const css = fs.readFileSync(
    new URL(
      "../components/ixi-atlas/IXITechnicalAtlas.module.css",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(css, /--type-micro:\s*10px/);
  assert.match(css, /--type-label:\s*11px/);
  assert.match(css, /--type-control:\s*12px/);
  assert.match(css, /--type-body:\s*13px/);
  assert.match(css, /--type-title:\s*15px/);
  assert.match(css, /--type-result:\s*20px/);
  assert.match(css, /"Inter Variable"/);
  assert.match(css, /font-variant-numeric:\s*tabular-nums lining-nums/);
  assert.doesNotMatch(css, /font(?:-size)?:\s*[6-9]px/);
  assert.doesNotMatch(css, /font:\s*[^;]*var\(--type-/);
});
