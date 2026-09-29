import test from "node:test";
import assert from "node:assert/strict";
import { boardTarget, machineRailDragId, railPrefix, resolveMachineWorkspaceDrop } from "../components/ixi-dashboard/machineWorkspaceDrop.mjs";

test("machine rails reorder, open on board, and return without changing rail ownership", () => {
  const leftA = machineRailDragId("left", "machine-a");
  const leftB = machineRailDragId("left", "machine-b");
  const right = machineRailDragId("right", "machine-c");
  const board = ["machine-c", "machine-d"];

  assert.deepEqual(resolveMachineWorkspaceDrop(leftA, leftB, board), { type: "rail-order", side: "left", from: "machine-a", to: "machine-b" });
  assert.deepEqual(resolveMachineWorkspaceDrop(leftA, boardTarget, board), { type: "open", key: "machine-a" });
  assert.deepEqual(resolveMachineWorkspaceDrop(leftA, "machine-c", board), { type: "open", key: "machine-a" });
  assert.deepEqual(resolveMachineWorkspaceDrop("machine-c", `${railPrefix}right`, board), { type: "return", key: "machine-c", side: "right" });
  assert.deepEqual(resolveMachineWorkspaceDrop("machine-c", right, board), { type: "return", key: "machine-c", side: "right" });
  assert.deepEqual(resolveMachineWorkspaceDrop("machine-c", "machine-d", board), { type: "board-order", from: "machine-c", to: "machine-d" });
  assert.equal(resolveMachineWorkspaceDrop(leftA, right, board), null);
  assert.equal(resolveMachineWorkspaceDrop("machine-a", boardTarget, board), null);
});
