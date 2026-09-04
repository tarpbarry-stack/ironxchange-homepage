import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("pages/aos/mobile-board.js", "utf8");
const dragEngine = fs.readFileSync("components/ixi-chassis/IXIDragEngine.js", "utf8");

test("mobile AOS board uses the proven Browse V2 DnD stack", () => {
  assert.match(page, /PointerSensor/);
  assert.match(page, /activationConstraint:\s*\{\s*distance:\s*6\s*\}/s);
  assert.match(page, /IXIDragEngine/);
  assert.match(page, /workspaceCollisionDetection/);
  assert.match(page, /IXISortableMachineCard/);
  assert.match(page, /SortableContext/);
  assert.match(page, /rectSortingStrategy/);
});

test("I and II resolve to canonical scales that fit 320 through 430 pixel phones", () => {
  assert.match(page, /function resolveMobileCardScaleMode/);
  assert.match(page, /width >= 424\) return "focus"/);
  assert.match(page, /width >= 364\) return "work"/);
  assert.match(page, /return width >= 392 \? "compact" : "micro"/);
  assert.match(page, /window\.visualViewport\?\.width/);
  assert.match(page, /window\.visualViewport\?\.addEventListener\("resize"/);
  assert.match(page, /MOBILE_BOARD_HORIZONTAL_PADDING = 2/);
  assert.match(page, /MOBILE_BOARD_COLUMN_GAP = 4/);
  assert.match(page, /IXIScaledCardShell/);
  assert.match(page, /cardScaleMode=\{cardScaleMode\}/);
});

test("the active mobile card uses an explicit top-plane DragOverlay", () => {
  assert.match(page, /overlayZIndex=\{1000000\}/);
  assert.match(page, /ixi-drag-overlay-card/);
  assert.match(dragEngine, /overlayZIndex = 999/);
  assert.match(dragEngine, /DragOverlay dropAnimation=\{null\} zIndex=\{overlayZIndex\}/);
});

test("mobile DnD serializes persistence and exposes save failure", () => {
  assert.match(page, /__ixi_aos_work_layout__/);
  assert.match(page, /IXI_COMMANDS\.reorderWithinContainer/);
  assert.match(page, /workspacePlacements:\s*nextPlacements/);
  assert.match(page, /machineContainers:\s*nextPlacements/);
  assert.match(page, /persistenceQueueRef = useRef\(Promise\.resolve\(\)\)/);
  assert.match(page, /await Promise\.all/);
  assert.match(page, /const layoutResult = await saveWorkspaceLayout/);
  assert.match(page, /patchResults\.some\(result => !result\)/);
  assert.match(page, /setSaveState\("error"\)/);
  assert.match(page, /RETRY SAVE/);
});

test("failed experimental mobile DnD mechanics are absent", () => {
  assert.doesNotMatch(page, /TouchSensor/);
  assert.doesNotMatch(page, /300ms|300 ms|delay:\s*300/i);
  assert.doesNotMatch(page, /onBoardDragStart|onBoardDragOver|onBoardDragEnd/);
  assert.doesNotMatch(page, /renderActiveDndOverlay/);
});
