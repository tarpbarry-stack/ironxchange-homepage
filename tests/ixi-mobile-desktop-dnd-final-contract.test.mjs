import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("pages/aos/mobile-dnd-final.js", "utf8");
const dragEngine = fs.readFileSync("components/ixi-chassis/IXIDragEngine.js", "utf8");
const sortableObject = fs.readFileSync("components/ixi-chassis/IXISortableObject.jsx", "utf8");

test("mobile final DnD reuses Browse V2 desktop sensor and sortable stack", () => {
  assert.match(page, /PointerSensor/);
  assert.match(page, /activationConstraint:\s*\{\s*distance:\s*6/);
  assert.match(page, /IXIDragEngine/);
  assert.match(page, /IXISortableMachineCard/);
  assert.match(page, /workspaceCollisionDetection/);
  assert.match(page, /SortableContext/);
  assert.match(page, /rectSortingStrategy/);
});

test("mobile final DnD keeps approved I and II presentation", () => {
  assert.match(page, /layoutMode === "I"/);
  assert.match(page, /layoutMode === "II"/);
  assert.match(page, /board-one/);
  assert.match(page, /board-two/);
  assert.match(page, /IXIImmutableScaledSurface/);
  assert.match(page, /nativeWidth=\{MOBILE_CARD_WIDTH\}/);
  assert.match(page, /nativeHeight=\{MOBILE_CARD_HEIGHT\}/);
});

test("mobile final DnD uses the production card drag handle rather than native fallback", () => {
  assert.match(page, /dragHandleProps=\{dragHandleProps\}/);
  assert.match(page, /useDndDrag=\{false\}/);
  assert.doesNotMatch(page, /TouchSensor/);
  assert.doesNotMatch(page, /delay:\s*300/);
  assert.doesNotMatch(page, /onBoardDragStart=\{/);
});

test("desktop DragOverlay remains the visual authority and cannot fall behind cards", () => {
  assert.match(dragEngine, /<DragOverlay dropAnimation=\{null\}>/);
  assert.match(page, /renderActiveDndOverlay=\{renderActiveDndOverlay\}/);
  assert.match(page, /ixi-mobile-desktop-dnd-overlay/);
  assert.match(page, /z-index:\s*2147483000/);
  assert.match(sortableObject, /opacity:\s*isDragging\s*\?\s*0\s*:\s*1/);
});

test("drop commits through canonical IXI command and persisted AOS layout", () => {
  assert.match(page, /IXI_COMMANDS\.reorderWithinContainer/);
  assert.match(page, /saveWorkspaceLayout\(nextPlacements\)/);
  assert.match(page, /listingId:\s*IXI_AOS_WORK_LAYOUT_ID/);
  assert.match(page, /workspacePlacements:\s*nextPlacements/);
  assert.match(page, /machineContainers:\s*nextPlacements/);
});
