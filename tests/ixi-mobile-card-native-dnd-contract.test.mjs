import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("pages/aos/mobile-dnd-card-native.js", "utf8");
const privateCard = fs.readFileSync("components/ixi-machine-card/private/PrivateListingCard.js", "utf8");

test("mobile DnD uses the production card pointer fallback instead of a second DnD stack", () => {
  assert.match(page, /onBoardDragStart=\{handleCardDragStart\}/);
  assert.match(page, /onBoardDragOver=\{handleCardDragOver\}/);
  assert.match(page, /onBoardDragEnd=\{handleCardDragEnd\}/);
  assert.doesNotMatch(page, /PointerSensor|TouchSensor|IXIDragEngine|IXISortableMachineCard|renderActiveDndOverlay|workspaceCollisionDetection/);
  assert.match(privateCard, /setPointerCapture/);
  assert.match(privateCard, /document\.elementsFromPoint/);
  assert.match(privateCard, /onPointerDown: startBoardDrag/);
});

test("mobile DnD chooses an existing persisted AOS surface instead of fabricating board placement", () => {
  assert.match(page, /chooseNaturalSourceSurface/);
  assert.match(page, /\["board", "indexEquipment"\]/);
  assert.match(page, /layoutRecord\?\.workspacePlacements/);
  assert.doesNotMatch(page, /createEmptyWorkspacePlacements/);
});

test("drop uses the canonical IXI command and persists the real AOS layout record", () => {
  assert.match(page, /IXI_COMMANDS\.reorderWithinContainer/);
  assert.match(page, /__ixi_aos_work_layout__/);
  assert.match(page, /workspacePlacements: nextPlacements/);
  assert.match(page, /machineContainers: nextPlacements/);
  assert.match(page, /saveIxiMachinePatch/);
});

test("mobile still changes presentation only", () => {
  assert.match(page, /IXIImmutableScaledSurface/);
  assert.match(page, /nativeWidth=\{300\}/);
  assert.match(page, /nativeHeight=\{475\}/);
  assert.match(page, /board-one/);
  assert.match(page, /board-two/);
  assert.doesNotMatch(page, /localStorage|sessionStorage/);
});
