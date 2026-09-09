import assert from "node:assert/strict";
import test from "node:test";
import {
  atlasModules,
  getAtlasPart,
  machineCardParts
} from "../lib/ixi-atlas/machineCardRegistry.mjs";

test("Machine Card is the first technical assembly", () => {
  assert.equal(atlasModules[0].id, "TA-001");
  assert.equal(atlasModules[0].name, "Machine Card");
  assert.equal(atlasModules[1].name, "Chassis");
});

test("the Machine Card register documents unique production components", () => {
  assert.ok(machineCardParts.length >= 8);
  assert.equal(new Set(machineCardParts.map(({ id }) => id)).size, machineCardParts.length);
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
