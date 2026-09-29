import assert from "node:assert/strict";
import test from "node:test";
import { readTransactRailPlacement, writeTransactRailPlacement, readTransactDirectoryOrder, writeTransactDirectoryOrder } from "../components/ixi-command-center/TransactRailPresentation.mjs";

test("TRAN$ACT rail placement and order remain scoped browser presentation", () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
  writeTransactRailPlacement("entity-a:equipment", { machineA: "right", machineB: "left" }, storage);
  writeTransactDirectoryOrder("entity-a:equipment", ["machineB", "machineA"], storage);
  assert.deepEqual(readTransactRailPlacement("entity-a:equipment", storage), { machineA: "right", machineB: "left" });
  assert.deepEqual(readTransactDirectoryOrder("entity-a:equipment", storage), ["machineB", "machineA"]);
  assert.deepEqual(readTransactRailPlacement("entity-b:equipment", storage), {});
  values.set("entity-a:equipment:rails", '{"machineA":"board","machineB":"right","__proto__":"left"}');
  assert.deepEqual(readTransactRailPlacement("entity-a:equipment", storage), { machineB: "right" });
});
