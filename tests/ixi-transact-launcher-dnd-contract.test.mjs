import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = path => fs.readFileSync(path, "utf8");

test("TRANSACT launcher reorders independently and persists stable module ids", () => {
  const app = read("components/ixi-aos/transact/IXITransactApp.jsx");
  const launcher = read("components/ixi-aos/transact/IXITransactSortableLauncher.jsx");
  const engine = read("components/ixi-aos/transact/IXITransactModuleOrder.js");
  const consoleRuntime = read("components/ixi-aos/transact/IXITransactObjectConsole.jsx");

  assert.match(app, /IXITransactSortableLauncher/u);
  assert.doesNotMatch(app, /modules\.map\(\(item\) => \(\s*<button/u);

  assert.match(launcher, /<DndContext/u);
  assert.match(launcher, /<SortableContext/u);
  assert.match(launcher, /rectSortingStrategy/u);
  assert.match(launcher, /MouseSensor/u);
  assert.match(launcher, /TouchSensor/u);
  assert.match(launcher, /KeyboardSensor/u);
  assert.match(launcher, /distance:\s*6/u);
  assert.match(launcher, /delay:\s*180/u);
  assert.match(launcher, /className="tx-app-drag-surface"/u);
  assert.match(launcher, /className="tx-app-open"/u);
  assert.match(launcher, /onOrderChange\?\.\(nextOrder\)/u);

  assert.match(engine, /reconcileIXITransactModuleOrder/u);
  assert.match(engine, /moveIXITransactModule/u);
  assert.match(engine, /valid\.has\(id\)/u);
  assert.match(engine, /seen\.has\(id\)/u);

  assert.match(consoleRuntime, /transactModuleOrder/u);
  assert.match(consoleRuntime, /onIxiStateChange\(objectId/u);
  assert.match(consoleRuntime, /onModuleOrderChange=\{persistModuleOrder\}/u);
});

test("open control is isolated from the drag activator", () => {
  const launcher = read("components/ixi-aos/transact/IXITransactSortableLauncher.jsx");

  assert.match(launcher, /setActivatorNodeRef/u);
  assert.match(launcher, /onPointerDown=\{stopDragActivation\}/u);
  assert.match(launcher, /onMouseDown=\{stopDragActivation\}/u);
  assert.match(launcher, /onTouchStart=\{stopDragActivation\}/u);
  assert.match(launcher, /onKeyDown=\{stopDragActivation\}/u);
});
