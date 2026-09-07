import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(relativePath) {
  return fs.readFileSync(relativePath, "utf8");
}

const workspaceBoard = read(
  "components/ixi-mos/workspace/IXIAosWorkspaceBoard.jsx"
);
const board = read(
  "components/ixi-chassis/IXIBoard.js"
);
const sortableCard = read(
  "components/ixi-chassis/IXISortableMachineCard.js"
);
const sortableObject = read(
  "components/ixi-chassis/IXISortableObject.jsx"
);
const collisionEngine = read(
  "components/ixi-chassis/IXIDndEngineHelpers.js"
);
const dropTarget = read(
  "components/ixi-chassis/IXIObjectDropTarget.jsx"
);

test("AOS container policy reaches the universal sortable chassis", () => {
  assert.match(
    workspaceBoard,
    /getItemReorderBehavior=\{[\s\S]*?isContainerWorkspaceObject\(item\)[\s\S]*?"self-only"/
  );
  assert.match(
    board,
    /getItemReorderBehavior,/
  );
  assert.match(
    board,
    /getItemReorderBehavior\([\s\S]*?item[\s\S]*?\)/
  );
  assert.match(
    board,
    /reorderBehavior=\{[\s\S]*?reorderBehavior[\s\S]*?\}/
  );
  assert.match(
    sortableCard,
    /reorderBehavior=\{[\s\S]*?reorderBehavior[\s\S]*?\}/
  );
});

test("self-only containers stay planted during a foreign drag", () => {
  assert.match(
    sortableObject,
    /reorderBehavior === "self-only"[\s\S]*?activeId[\s\S]*?!isSelfDragging/
  );
  assert.match(
    sortableObject,
    /suppressForeignTransform[\s\S]*?\? null[\s\S]*?: transform/
  );
});

test("valid ON targets win collision detection and publish accepting state", () => {
  assert.match(
    collisionEngine,
    /isIXIDropOnTargetId[\s\S]*?accepted === true/
  );
  assert.match(
    collisionEngine,
    /if \([\s\S]*?onTargetHits\.length[\s\S]*?\)[\s\S]*?return onTargetHits/
  );
  assert.match(
    dropTarget,
    /disabled:[\s\S]*?!canAccept/
  );
  assert.match(
    dropTarget,
    /accepting[\s\S]*?"ixi-drop-accepting"/
  );
});
