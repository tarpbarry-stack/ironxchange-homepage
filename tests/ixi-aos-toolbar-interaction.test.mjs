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
  const { DndContext } = require("@dnd-kit/core");
  const { transformSync } = require("next/dist/build/swc");
  const file = new URL("../components/ixi-mos/workspace/IXIAosToolbarChassis.jsx", import.meta.url);
  const compiled = transformSync(fs.readFileSync(file, "utf8"), {
    filename: file.pathname, jsc: { parser: { syntax: "ecmascript", jsx: true }, target: "es2022",
      transform: { react: { runtime: "automatic" } } }, module: { type: "commonjs" }
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", compiled.code)(name => {
    if (name.endsWith("ToolbarModel.mjs")) return model;
    if (name.endsWith("MembershipPolicy")) return policy;
    if (name.endsWith(".module.css")) return new Proxy({}, { get: (_, key) => String(key) });
    return require(name);
  }, module, module.exports);
  const Chassis = module.exports.default;
  const root = createRoot(dom.window.document.getElementById("root"));
  const locations = { objectId: "object_locations", passportId: "IXILOC2345", displayName: "Locations", itemObjectIds: ["object_yard"] };
  const yard = { objectId: "object_yard", passportId: "IXIYAR2345", displayName: "Customer Yard", itemObjectIds: ["object_machine"] };
  const machine = { objectId: "object_machine", passportId: "IXIMAC2345", displayName: "Ripper", objectType: "machine", imageUrl: "/existing-ripper.jpg" };
  const parked = { objectId: "object_parked", passportId: "IXIPAR2345", displayName: "Working selection" };
  let boardMounts = 0;
  function Board() {
    React.useEffect(() => { boardMounts++; }, []);
    return React.createElement("input", { "aria-label": "Board draft", defaultValue: "Keep this draft" });
  }
  const moves = [], opened = [];
  const props = { registry: new Map([locations, yard, machine, parked].map(object => [object.objectId, object])),
    indexes: [locations], placements: { board: [locations.objectId], pocketLeft2: [parked.objectId] },
    session: { objects: {} }, ready: true, preferenceKey: "test-entity:test-principal",
    onMove: (...args) => moves.push(args), onBoard: (...args) => opened.push(args), onReturn: () => {}, onConnect: () => {} };
  const doc = dom.window.document;
  const click = async button => { assert.ok(button); await React.act(async () => button.click()); };
  try {
    await React.act(async () => root.render(React.createElement(DndContext, null,
      React.createElement(Chassis, props, React.createElement(Board)))));
    const left = doc.getElementById("aos-left-toolbar");
    const right = doc.getElementById("aos-right-toolbar");
    const board = doc.querySelector('[aria-label="Board draft"]');
    assert.match(left.textContent, /Working selection/);
    await click(left.querySelector('button[title="Browse Locations"]'));
    assert.match(right.textContent, /Customer Yard/);
    await click(right.querySelector('button[title="Browse Customer Yard"]'));
    assert.match(left.textContent, /Ripper/);
    assert.match(left.textContent, /Working selection/, "browsing must not evict parked Objects");
    const mini = left.querySelector('button[title="Open Ripper on Board"]');
    assert.equal(mini.querySelector('img').getAttribute('src'), "/existing-ripper.jpg");
    await click(mini);
    assert.deepEqual(opened, [[machine.objectId, yard.objectId]], "clicking a machine opens its canonical Board card");
    assert.match(right.textContent, /Customer Yard/, "opening a machine must not replace the opposite container browser");
    await click(left.querySelector('[aria-label="Fold left toolbar"]'));
    assert.equal(left.getAttribute("aria-hidden"), "true");
    assert.equal(right.getAttribute("aria-hidden"), null);
    await click(right.querySelector('[aria-label="Fold right toolbar"]'));
    assert.equal(right.getAttribute("aria-hidden"), "true");
    assert.equal(doc.querySelector('[aria-label="Board draft"]'), board);
    assert.equal(board.value, "Keep this draft");
    assert.equal(boardMounts, 1);
    await click(doc.querySelector('[aria-controls="aos-left-toolbar"]'));
    assert.equal(doc.getElementById("aos-left-toolbar"), left);
    assert.match(left.textContent, /Ripper/);
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
