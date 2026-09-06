import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Equipment OUT opens the current Inventory card on Face 1", async () => {
  const workspace = await read(
    "components/ixi-mos/equipment/useIXIEquipmentWorkspace.js"
  );

  assert.match(workspace, /function exposeEquipmentMachineToBoard/);
  assert.match(workspace, /targetContainer:\s*"board"/);
  assert.match(workspace, /nextIxiCardState:\s*faceOneState/);
  assert.match(workspace, /patch:\s*\{[\s\S]*face:\s*1/);
  assert.match(workspace, /executeIXITransaction\?\.\(\s*faceOneResult/);
});

test("AOS board continues to render ordinary equipment through the current machine-card family", async () => {
  const board = await read(
    "components/ixi-mos/workspace/IXIAosWorkspaceBoard.jsx"
  );

  assert.match(board, /IXIBoard/);
  assert.match(board, /getSellerListingCardProps/);
  assert.match(board, /continue through IXIBoard -> IXIMachineCard/);
  assert.doesNotMatch(board, /IXISellerMachineObjectFace2/);
});
