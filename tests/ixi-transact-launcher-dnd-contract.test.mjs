import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = path => fs.readFileSync(path, "utf8");

test("TRANSACT launcher reorders independently and persists stable module ids", () => {
  const app = read("components/ixi-aos/transact/IXITransactApp.jsx");
  const launcher = read("components/ixi-aos/transact/IXITransactSortableLauncher.jsx");
  const engine = read("components/ixi-aos/transact/IXITransactModuleOrder.js");
  const consoleRuntime = read("components/ixi-aos/transact/IXITransactObjectConsole.jsx");
  const styles = read("components/ixi-aos/transact/IXITransactStyles.jsx");

  assert.match(app, /IXITransactSortableLauncher/u);
  assert.doesNotMatch(app, /modules\.map\(\(item\) => \(\s*<button/u);

  assert.match(launcher, /<DndContext/u);
  assert.match(launcher, /<SortableContext/u);
  assert.match(launcher, /rectSortingStrategy/u);
  assert.match(launcher, /CSS\.Transform\.toString\(transform\)/u);
  assert.doesNotMatch(launcher, /<DragOverlay/u);
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
  assert.match(consoleRuntime, /onIxiStateChange\(\s*stateObjectId/u);
  assert.match(consoleRuntime, /onModuleOrderChange=\{persistModuleOrder\}/u);

  assert.match(styles, /\.tx-grid[\s\S]*overflow: hidden/u);
  assert.match(styles, /\.tx-app-tile[\s\S]*contain: layout paint/u);
  assert.match(styles, /\.tx-app-tile-dragging[\s\S]*opacity: 1/u);
});

test("open control is isolated from the drag activator", () => {
  const launcher = read("components/ixi-aos/transact/IXITransactSortableLauncher.jsx");

  assert.match(launcher, /setActivatorNodeRef/u);
  assert.match(launcher, /onPointerDown=\{stopDragActivation\}/u);
  assert.match(launcher, /onMouseDown=\{stopDragActivation\}/u);
  assert.match(launcher, /onTouchStart=\{stopDragActivation\}/u);
  assert.match(launcher, /onKeyDown=\{stopDragActivation\}/u);
});

test("every open TRANSACT module mounts inside the 298px shell", () => {
  const styles = read("components/ixi-aos/transact/IXITransactStyles.jsx");

  assert.match(styles, /\.ixi-transact-app\s*\{[\s\S]*?width:\s*298px;[\s\S]*?border:\s*1px solid/u);
  assert.match(
    styles,
    /\.module-open \.tx-body\s*\{[\s\S]*?left:\s*-1px;[\s\S]*?right:\s*-1px;[\s\S]*?padding:\s*0 0 12px;[\s\S]*?overflow-x:\s*hidden;[\s\S]*?overflow-y:\s*auto;/u,
  );
  assert.match(
    styles,
    /\.module-open \.tx-body > \*\s*\{[\s\S]*?width:\s*100%\s*!important;[\s\S]*?min-width:\s*0\s*!important;[\s\S]*?max-width:\s*100%\s*!important;/u,
  );
});


test("module order reconciliation removes stale ids and appends new modules", async () => {
  const source = read("components/ixi-aos/transact/IXITransactModuleOrder.js");
  const encoded = Buffer.from(source, "utf8").toString("base64");
  const engine = await import(`data:text/javascript;base64,${encoded}`);

  assert.deepEqual(
    engine.reconcileIXITransactModuleOrder(
      ["expense", "missing", "expense", "work-order"],
      ["work-order", "expense", "time"],
    ),
    ["expense", "work-order", "time"],
  );

  assert.deepEqual(
    engine.moveIXITransactModule(
      ["work-order", "expense", "time"],
      "time",
      "work-order",
    ),
    ["time", "work-order", "expense"],
  );
});
