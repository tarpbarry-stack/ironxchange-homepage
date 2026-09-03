import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("pages/aos/mobile-dnd-natural.js", "utf8");
const work = fs.readFileSync("pages/aos/work.js", "utf8");

test("mobile natural DnD uses the same pointer sensor contract as AOS Work", () => {
  assert.match(page, /PointerSensor/);
  assert.match(page, /activationConstraint:\s*\{ distance: 6 \}/);
  assert.match(work, /PointerSensor/);
  assert.match(work, /distance:\s*6/);
  assert.doesNotMatch(page, /TouchSensor|MOBILE_TOUCH_HOLD_MS|MOBILE_TOUCH_TOLERANCE_PX/);
});

test("mobile natural DnD uses canonical IXI drag, sortable, collision and command engines", () => {
  assert.match(page, /IXIDragEngine/);
  assert.match(page, /IXISortableMachineCard/);
  assert.match(page, /workspaceCollisionDetection/);
  assert.match(page, /createWorkspaceDragEndHandler/);
  assert.match(page, /IXI_COMMANDS\.reorderWithinContainer/);
  assert.doesNotMatch(page, /closestCenter|pointerWithin|renderActiveDndOverlay|mobileWorkspaceCollisionDetection/);
});

test("mobile natural DnD loads and writes the authoritative AOS layout record", () => {
  assert.match(page, /fetchIxiMachineState\(userId\)/);
  assert.match(page, /__ixi_aos_work_layout__/);
  assert.match(page, /workspacePlacements/);
  assert.match(page, /machineContainers/);
  assert.match(page, /saveIxiMachinePatch/);
  assert.match(page, /saveWorkspaceLayout\(nextPlacements\)/);
});

test("mobile layer changes presentation only", () => {
  assert.match(page, /IXIImmutableScaledSurface/);
  assert.match(page, /nativeWidth=\{300\}/);
  assert.match(page, /nativeHeight=\{475\}/);
  assert.match(page, /board-one/);
  assert.match(page, /board-two/);
  assert.match(page, /dragHandleProps=\{dragHandleProps\}/);
  assert.doesNotMatch(page, /createEmptyWorkspacePlacements|sessionStorage|localStorage/);
});
