import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("pages/aos/mobile-board.js", "utf8");

test("mobile AOS board uses the proven Browse V2 DnD stack", () => {
  assert.match(page, /PointerSensor/);
  assert.match(page, /activationConstraint:\s*\{\s*distance:\s*6\s*\}/s);
  assert.match(page, /IXIDragEngine/);
  assert.match(page, /workspaceCollisionDetection/);
  assert.match(page, /IXISortableMachineCard/);
  assert.match(page, /SortableContext/);
  assert.match(page, /rectSortingStrategy/);
});

test("resting and overlay cards share the canonical IXI scale modes", () => {
  assert.match(page, /const I_SCALE_MODE = "focus"/);
  assert.match(page, /const II_SCALE_MODE = "compact"/);
  assert.match(page, /IXIScaledCardShell/);
  assert.match(page, /cardScaleMode=\{cardScaleMode\}/);
  assert.doesNotMatch(page, /IXIImmutableScaledSurface/);
});

test("mobile DnD persists the real AOS work layout", () => {
  assert.match(page, /__ixi_aos_work_layout__/);
  assert.match(page, /IXI_COMMANDS\.reorderWithinContainer/);
  assert.match(page, /workspacePlacements:\s*nextPlacements/);
  assert.match(page, /machineContainers:\s*nextPlacements/);
  assert.match(page, /saveIxiMachinePatch/);
});

test("failed experimental mobile DnD mechanics are absent", () => {
  assert.doesNotMatch(page, /TouchSensor/);
  assert.doesNotMatch(page, /300ms|300 ms|delay:\s*300/i);
  assert.doesNotMatch(page, /onBoardDragStart|onBoardDragOver|onBoardDragEnd/);
  assert.doesNotMatch(page, /renderActiveDndOverlay/);
});
