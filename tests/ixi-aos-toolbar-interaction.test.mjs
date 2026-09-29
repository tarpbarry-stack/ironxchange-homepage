import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import * as model from "../components/ixi-mos/workspace/IXIAosToolbarModel.mjs";
import * as policy from "../lib/mos/IXIAosSystemIndexMembershipPolicy.js";

const coreRoot = process.env.IXI_CORE_CONTRACT_ROOT;
test("folding keeps Board state mounted, browsed containers and parked Objects stay independent", {
  skip: coreRoot ? false : "Requires the paired gate's DOM runtime."
}, async () => {
  const require = createRequire(import.meta.url);
  const coreRequire = createRequire(path.join(coreRoot, "package.json"));
  const { JSDOM } = coreRequire("jsdom");
  const dom = new JSDOM("<div id='root'></div>", { url: "https://aos.example.test/", pretendToBeVisual: true });
  const saved = new Map();
  for (const key of ["window", "document", "HTMLElement", "Element", "Node", "MutationObserver", "localStorage", "requestAnimationFrame", "cancelAnimationFrame"]) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: dom.window[key] });
  }
  dom.window.matchMedia = () => ({ matches: false });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const React = require("react");
  const { createRoot } = require("react-dom/client");
  const { DndContext, useDndContext, pointerWithin } = require("@dnd-kit/core");
  let dnd;
  function ObserveDropTargets() { dnd = useDndContext(); return null; }
  const { transformSync } = require("next/dist/build/swc");
  const file = new URL("../components/ixi-mos/workspace/IXIAosToolbarChassis.jsx", import.meta.url);
  const compiled = transformSync(fs.readFileSync(file, "utf8"), {
    filename: file.pathname, jsc: { parser: { syntax: "ecmascript", jsx: true }, target: "es2022",
      transform: { react: { runtime: "automatic" } } }, module: { type: "commonjs" }
  });
  function loadShared(name) {
    const componentFile = new URL(`../components/ixi-os/${name}.jsx`, import.meta.url);
    const result = transformSync(fs.readFileSync(componentFile, "utf8"), {
      filename: componentFile.pathname, jsc: { parser: { syntax: "ecmascript", jsx: true }, target: "es2022",
        transform: { react: { runtime: "automatic" } } }, module: { type: "commonjs" }
    });
    const component = { exports: {} };
    new Function("require", "module", "exports", result.code)(dependency =>
      dependency.endsWith(".module.css") ? new Proxy({}, { get: (_, key) => String(key) }) : require(dependency),
    component, component.exports);
    return component.exports;
  }
  const module = { exports: {} };
  new Function("require", "module", "exports", compiled.code)(name => {
    if (name.endsWith("ToolbarModel.mjs")) return model;
    if (name.endsWith("MembershipPolicy")) return policy;
    if (name.endsWith("IXIWorkspaceRailTile")) return loadShared("IXIWorkspaceRailTile");
    if (name.endsWith("IXIWorkspaceRailHeader")) return loadShared("IXIWorkspaceRailHeader");
    if (name.endsWith(".module.css")) return new Proxy({}, { get: (_, key) => String(key) });
    return require(name);
  }, module, module.exports);
  const Chassis = module.exports.default;
  const root = createRoot(dom.window.document.getElementById("root"));
  const locations = { objectId: "object_locations", passportId: "IXILOC2345", displayName: "Locations", itemObjectIds: ["object_yard"] };
  const yard = { objectId: "object_yard", passportId: "IXIYAR2345", displayName: "Customer Yard", itemObjectIds: ["object_machine"] };
  const machine = { objectId: "object_machine", passportId: "IXIMAC2345", displayName: "Ripper", objectType: "machine", imageUrl: "/existing-ripper.jpg" };
  const parked = { objectId: "object_parked", passportId: "IXIPAR2345", displayName: "Working selection" };
  const pocketed = { objectId: "object_pocketed", passportId: "IXIPOC2345", displayName: "Pocket selection" };
  let boardMounts = 0;
  function Board() {
    React.useEffect(() => { boardMounts++; }, []);
    return React.createElement("input", { "aria-label": "Board draft", defaultValue: "Keep this draft" });
  }
  const moves = [], opened = [];
  const props = { registry: new Map([locations, yard, machine, parked, pocketed].map(object => [object.objectId, object])),
    indexes: [locations], placements: { board: [locations.objectId], "rail:aos-left": [parked.objectId], pocketLeft2: [pocketed.objectId] },
    session: { objects: {} }, ready: true, preferenceKey: "test-entity:test-principal",
    onMove: (...args) => moves.push(args), onBoard: (...args) => opened.push(args), onReturn: () => {}, onConnect: () => {} };
  const doc = dom.window.document;
  const click = async button => { assert.ok(button); await React.act(async () => button.click()); };
  try {
    await React.act(async () => root.render(React.createElement(DndContext, null,
      React.createElement(Chassis, props, React.createElement(Board)), React.createElement(ObserveDropTargets))));
    const boardTarget = dnd.droppableContainers.get("board");
    assert.equal(boardTarget?.node.current, doc.querySelector('[aria-label="Working Board"]'),
      "the full Board must be registered so blank space cannot fall back to the nearest toolbar");
    assert.equal(boardTarget.data.current.dropIntent, "root", "Board drops are placement, not membership");
    assert.equal(dnd.droppableContainers.get("pocketLeft2")?.data.current.targetSurface, "pocketLeft2");
    assert.match(doc.querySelector('[aria-label="Pocket III"]').textContent, /Pocket selection/);
    await click(doc.querySelector('[aria-controls="aos-right-toolbar"]'));
    const boardRect = { left: 330, right: 1016, top: 462, bottom: 1100, width: 686, height: 638 };
    const rightRect = { left: 1036, right: 1280, top: 219, bottom: 1051, width: 244, height: 832 };
    const dropArgs = { droppableContainers: dnd.droppableContainers.getEnabled(),
      droppableRects: new Map([["board", boardRect], [model.AOS_TOOLBAR_SURFACES.right, rightRect]]) };
    assert.equal(pointerWithin({ ...dropArgs, pointerCoordinates: { x: 974, y: 531 } })[0]?.id, "board");
    assert.equal(pointerWithin({ ...dropArgs, pointerCoordinates: { x: 1176, y: 531 } })[0]?.id,
      model.AOS_TOOLBAR_SURFACES.right, "an actual toolbar drop still docks there");
    const left = doc.getElementById("aos-left-toolbar");
    const right = doc.getElementById("aos-right-toolbar");
    const board = doc.querySelector('[aria-label="Board draft"]');
    assert.match(left.textContent, /Working selection/);
    assert.doesNotMatch(left.textContent, /Pocket selection/, "a pocketed Object has one visible station");
    await React.act(async () => {
      const select = doc.getElementById("aos-left-browse");
      select.value = locations.objectId;
      select.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    });
    await click(left.querySelector('button[aria-label="Select Customer Yard"]'));
    assert.match(right.textContent, /Ripper/);
    assert.match(left.textContent, /Working selection/, "browsing must not evict parked Objects");
    const mini = right.querySelector('button[aria-label="Open Ripper on board"]');
    assert.equal(right.querySelector('img').getAttribute('src'), "/existing-ripper.jpg");
    await click(mini);
    assert.deepEqual(opened, [[machine.objectId, yard.objectId]], "clicking a machine opens its canonical Board card");
    assert.match(left.textContent, /Customer Yard/, "opening a machine must not replace the opposite container browser");
    await click(left.querySelector('[aria-label="Close LEFT RAIL"]'));
    assert.equal(left.getAttribute("aria-hidden"), "true");
    assert.equal(right.getAttribute("aria-hidden"), null);
    await click(right.querySelector('[aria-label="Close RIGHT RAIL"]'));
    assert.equal(right.getAttribute("aria-hidden"), "true");
    assert.equal(doc.querySelector('[aria-label="Board draft"]'), board);
    assert.equal(board.value, "Keep this draft");
    assert.equal(boardMounts, 1);
    await click(doc.querySelector('[aria-controls="aos-left-toolbar"]'));
    assert.equal(doc.getElementById("aos-left-toolbar"), left);
    assert.match(right.textContent, /Ripper/);
    assert.match(left.textContent, /Working selection/);
    const action = left.querySelector('[aria-label="Actions for Working selection"]');
    await React.act(async () => { action.value = "right"; action.dispatchEvent(new dom.window.Event("change", { bubbles: true })); });
    assert.deepEqual(moves, [[parked.objectId, model.AOS_TOOLBAR_SURFACES.right]]);
  } finally {
    await React.act(async () => root.unmount());
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
    dom.window.close();
  }
});
