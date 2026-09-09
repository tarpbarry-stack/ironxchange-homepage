import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  atlasModules,
  getAtlasPart,
  machineCardParts,
} from "../lib/ixi-atlas/machineCardRegistry.mjs";
import {
  chassisParts,
  getChassisPart,
} from "../lib/ixi-atlas/chassisRegistry.mjs";

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

test("TA-002 documents the production Chassis as an active build sheet", () => {
  assert.equal(atlasModules[1].id, "TA-002");
  assert.equal(atlasModules[1].state, "ACTIVE");
  assert.ok(chassisParts.length >= 7);
  assert.equal(
    new Set(chassisParts.map(({ id }) => id)).size,
    chassisParts.length,
  );
  for (const part of chassisParts) {
    assert.equal(part.status, "PRODUCTION");
    assert.ok(part.sources.length > 0);
    assert.ok(part.specs.length > 2);
  }
});

test("the Chassis sheet records its real placement geometry", () => {
  assert.match(getChassisPart("chassis").specs.join(" "), /150 × 102px/);
  assert.match(
    getChassisPart("pockets").specs.join(" "),
    /24px action targets/,
  );
  assert.match(
    getChassisPart("mount").specs.join(" "),
    /24-card progressive batches/,
  );
  assert.match(getChassisPart("responsive").specs.join(" "), /851–1254px/);
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
  assert.doesNotMatch(css, /\.atlas button,[\s\S]*?font:\s*inherit/);
});

test("TA-001 mounts the production Machine Card in a zero-write live fixture", () => {
  const testCell = fs.readFileSync(
    new URL("../components/ixi-atlas/IXIAtlasLiveTestCell.jsx", import.meta.url),
    "utf8",
  );

  assert.match(testCell, /import IXIMachineCard/);
  assert.match(testCell, /<IXIMachineCard/);
  assert.match(testCell, /ZERO WRITES/);
  assert.match(testCell, /INSPECT/);
  assert.match(testCell, /OPERATE/);
  assert.match(testCell, /OBJECT/);
  assert.match(testCell, /PASSPORT PULSE/);
  assert.match(testCell, /IXIBrowseObjectConsoleRouter/);
  assert.match(testCell, /role="tablist"/);
  assert.match(testCell, /FACE_NAMES/);
  assert.match(testCell, /GEAR_TO_SCALE_MODE/);
  assert.match(testCell, /AUTO_GEAR_BY_CONSOLE_DEPTH/);
  assert.match(testCell, /enableCardScaling/);
  assert.match(testCell, /Make card and console larger/);
  assert.match(testCell, /Make card and console smaller/);
  assert.doesNotMatch(testCell, /fetch\s*\(/);
});

test("Machine Rail callout opens an interactive production drill-down", () => {
  const testCell = fs.readFileSync(
    new URL("../components/ixi-atlas/IXIAtlasLiveTestCell.jsx", import.meta.url),
    "utf8",
  );
  const drilldown = fs.readFileSync(
    new URL("../components/ixi-atlas/IXIAtlasMachineRailDrilldown.jsx", import.meta.url),
    "utf8",
  );

  assert.match(testCell, /selected === "rail"/);
  assert.match(testCell, /IXIAtlasMachineRailDrilldown/);
  assert.match(drilldown, /import IXIMachineRail/);
  assert.match(drilldown, /<IXIMachineRail/);
  assert.match(drilldown, /BACK TO MACHINE CARD/);
  assert.match(drilldown, /TO FRONT/);
  assert.match(drilldown, /COLOR/);
  assert.match(drilldown, /THICKNESS/);
  assert.match(drilldown, /FACE CHANGE/);
  assert.match(drilldown, /SEND/);
  assert.match(drilldown, /ARMED DELIVERY/);
  assert.match(drilldown, /TO BACK/);
  assert.doesNotMatch(drilldown, /fetch\s*\(/);
});

test("the System Index is an accessible assembly navigator", () => {
  const atlas = fs.readFileSync(
    new URL("../components/ixi-atlas/IXITechnicalAtlas.jsx", import.meta.url),
    "utf8",
  );

  assert.match(atlas, /aria-expanded=\{indexOpen\}/);
  assert.match(atlas, /aria-controls="atlas-system-index"/);
  assert.match(atlas, /SYSTEM HANGAR/);
});
