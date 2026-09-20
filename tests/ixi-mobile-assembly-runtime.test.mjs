import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (!path.extname(file)) file += fs.existsSync(`${file}.js`) ? ".js" : ".jsx";
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const compiled = transformSync(fs.readFileSync(file, "utf8"), {
    filename: file,
    jsc: { parser: { syntax: "ecmascript", jsx: true }, target: "es2022", transform: { react: { runtime: "automatic" } } },
    module: { type: "commonjs" }
  });
  new Function("require", "module", "exports", compiled.code)(
    name => name.startsWith(".") ? load(path.resolve(path.dirname(file), name)) : require(name), module, module.exports
  );
  return module.exports;
}

test("touch uses the hold sensor and interactive controls never activate a card drag", () => {
  const { IXICardPointerSensor, IXICardTouchSensor } = load("components/ixi-mobile/IXICardSensors.js");
  const pointer = IXICardPointerSensor.activators[0].handler;
  const touch = IXICardTouchSensor.activators[0].handler;
  const options = {};
  const event = (pointerType, interactive = false) => ({
    nativeEvent: { pointerType, isPrimary: true, button: 0, touches: [{ clientX: 0, clientY: 0 }] },
    target: { closest: () => interactive ? {} : null }
  });
  assert.equal(pointer(event("touch"), options), false);
  assert.equal(pointer(event("mouse"), options), true);
  assert.equal(pointer(event("pen"), options), true);
  assert.equal(pointer(event("mouse", true), options), false);
  assert.equal(touch(event("touch"), options), true);
  assert.equal(touch(event("touch", true), options), false);
});

test("changing phone density and rotating to desktop retains the mounted card and draft", async t => {
  assert.ok(process.env.IXI_CORE_CONTRACT_ROOT, "Run with the pinned paired backend checkout");
  const coreRequire = createRequire(path.join(process.env.IXI_CORE_CONTRACT_ROOT, "package.json"));
  const { JSDOM } = coreRequire("jsdom");
  const dom = new JSDOM('<div id="root"></div>', { url: "https://mobile-review.invalid" });
  const w = dom.window;
  const media = { matches: true, addEventListener: (_, fn) => { media.change = fn; }, removeEventListener: () => {} };
  w.matchMedia = () => media;
  Object.defineProperty(w.HTMLElement.prototype, "clientWidth", { get: () => 374 });
  Object.defineProperty(w.HTMLElement.prototype, "offsetHeight", { get: () => 962 });
  const previous = new Map();
  for (const [key, value] of Object.entries({ window: w, document: w.document, navigator: w.navigator, sessionStorage: w.sessionStorage, IS_REACT_ACT_ENVIRONMENT: true, ResizeObserver: class { observe() {} disconnect() {} } })) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  const React = require("react");
  const { createRoot } = require("react-dom/client");
  const Board = load("components/ixi-chassis/IXIBoardSurface.jsx").default;
  const Shell = load("components/ixi-machine-object/IXIScaledCardShell.js").default;
  let mounts = 0;
  function Draft() {
    React.useEffect(() => { mounts++; }, []);
    return React.createElement("textarea", { "aria-label": "Draft", defaultValue: "Unsaved worksheet" });
  }
  const root = createRoot(w.document.getElementById("root"));
  t.after(async () => {
    await React.act(() => root.unmount());
    w.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  await React.act(() => root.render(React.createElement(Board, { mobileCards: true }, React.createElement(Shell, { nativeWidth: 900, nativeHeight: 475 }, React.createElement(Draft)))));
  const field = w.document.querySelector("textarea");
  field.value = "Keep this unsaved work";
  assert.equal(w.document.querySelector('[data-ixi-mobile-assembly="true"]').style.height, `${962 * 374 / 600}px`);
  await React.act(() => w.document.querySelector('[aria-label="Two cards per row"]').click());
  assert.equal(w.document.querySelector("section").dataset.ixiMobileCardDensity, "II");
  await React.act(() => { media.matches = false; media.change(); });
  assert.equal(w.document.querySelector("textarea"), field);
  assert.equal(field.value, "Keep this unsaved work");
  assert.equal(mounts, 1);
  await React.act(() => { media.matches = true; media.change(); });
  assert.equal(w.document.querySelector("textarea"), field);
  assert.equal(mounts, 1);
});
