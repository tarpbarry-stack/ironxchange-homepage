import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("pages/aos/mobile-dnd.js", "utf8");
const dndHelpers = fs.readFileSync("components/ixi-chassis/IXIDndEngineHelpers.js", "utf8");
const placementEngine = fs.readFileSync("components/ixi-chassis/IXIWorkspacePlacementEngine.js", "utf8");
const sortableMachine = fs.readFileSync("components/ixi-chassis/IXISortableMachineCard.js", "utf8");

test("mobile DnD reuses the canonical IXI drag and sortable engines", () => {
  assert.match(page, /IXIDragEngine/);
  assert.match(page, /IXISortableMachineCard/);
  assert.match(page, /createWorkspaceDragEndHandler/);
  assert.match(sortableMachine, /IXISortableObject/);
});

test("touch activation requires an intentional hold and preserves normal swipe scrolling", () => {
  assert.match(page, /TouchSensor/);
  assert.match(page, /MOBILE_TOUCH_HOLD_MS = 300/);
  assert.match(page, /MOBILE_TOUCH_TOLERANCE_PX = 10/);
  assert.match(page, /delay: MOBILE_TOUCH_HOLD_MS/);
  assert.match(page, /tolerance: MOBILE_TOUCH_TOLERANCE_PX/);
  assert.match(page, /touch-action:auto/);
  assert.doesNotMatch(page, /touch-action:\s*none/);
});

test("drop reorder uses the existing workspace placement engine", () => {
  assert.match(page, /reorderObjectWithinWorkspaceSurface/);
  assert.match(page, /moveObjectToWorkspacePosition/);
  assert.match(page, /moveObjectToWorkspaceSurface/);
  assert.match(dndHelpers, /moveMachineWithinContainer/);
  assert.match(placementEngine, /export function reorderObjectWithinWorkspaceSurface/);
});

test("mobile DnD preserves real private 300x475 cards and I-II board modes", () => {
  assert.match(page, /IXIMachineCard/);
  assert.match(page, /nativeWidth=\{300\}/);
  assert.match(page, /nativeHeight=\{475\}/);
  assert.match(page, /cardContext="inventory"/);
  assert.match(page, /sellerMode/);
  assert.match(page, /board-one/);
  assert.match(page, /board-two/);
  assert.doesNotMatch(page, /MobileMachineCard|ComparisonCard|MobilePrivateCard/);
});

test("certification gate is authenticated and non-persistent", () => {
  assert.match(page, /sdk\.currentUser\.show\(\)/);
  assert.match(page, /api\/account-listings\?authorId=/);
  assert.doesNotMatch(page, /saveIxiMachinePatch|localStorage|sessionStorage/);
});
