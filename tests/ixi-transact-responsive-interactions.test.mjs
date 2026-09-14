import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

test("responsive panels and device preferences preserve access and user isolation", {
  skip: process.env.IXI_CORE_CONTRACT_ROOT ? false : "Requires the paired runtime."
}, async t => {
  const require = createRequire(import.meta.url);
  const coreRequire = createRequire(path.join(process.env.IXI_CORE_CONTRACT_ROOT, "package.json"));
  const { JSDOM } = coreRequire("jsdom");
  const dom = new JSDOM('<div id="root"></div>', { url: "https://test.invalid" });
  const previous = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true })) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, writable: true, configurable: true });
  }
  const React = require("react"), { createRoot } = require("react-dom/client");
  const { transformSync } = require("next/dist/build/swc");
  function load(relative) {
    const source = fileURLToPath(new URL(relative, import.meta.url));
    const compiled = transformSync(fs.readFileSync(source, "utf8"), { filename: source, jsc: { parser: { syntax: "ecmascript", jsx: true }, target: "es2022", transform: { react: { runtime: "automatic" } } }, module: { type: "commonjs" } });
    const module = { exports: {} }, sourceRequire = createRequire(source);
    new Function("require", "module", "exports", compiled.code)(name => name.endsWith(".css") ? {} : sourceRequire(name), module, module.exports);
    return module.exports;
  }
  const root = createRoot(document.getElementById("root"));
  t.after(async () => {
    await React.act(() => root.unmount()); dom.window.close();
    for (const [key, descriptor] of previous) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
  });
  await t.test("a drawer opens, dismisses, and docks on resize without reopening later", async () => {
    const listeners = new Set();
    const media = { matches: false, addEventListener: (_, listener) => listeners.add(listener), removeEventListener: (_, listener) => listeners.delete(listener) };
    window.matchMedia = () => media;
    dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    dom.window.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new dom.window.Event("close")); };
    const Panel = load("../components/ixi-command-center/IXITransactSidePanel.jsx").default;
    function Harness() {
      const [open, setOpen] = React.useState(false);
      return React.createElement(React.Fragment, null,
        React.createElement("button", { id: "open", onClick: () => setOpen(true) }, "Apps"),
        React.createElement(Panel, { label: "Apps and details", dockAt: 1600, open, onDismiss: () => setOpen(false) }, React.createElement("button", { id: "worksheet" }, "Open worksheet")));
    }
    await React.act(() => root.render(React.createElement(Harness)));
    assert.equal(document.querySelector("dialog").open, false);
    await React.act(() => document.getElementById("open").click());
    assert.equal(document.querySelector("dialog").open, true);
    await React.act(() => document.querySelector('button[aria-label="Close Apps and details"]').click());
    assert.equal(document.querySelector("dialog").open, false);
    await React.act(() => document.getElementById("open").click());
    await React.act(() => document.querySelector("dialog").close());
    assert.equal(document.querySelector("dialog").open, false);
    await React.act(() => document.getElementById("open").click());
    await React.act(() => { media.matches = true; for (const listener of listeners) listener(); });
    assert.ok(document.querySelector('aside[aria-label="Apps and details"] #worksheet'));
    assert.equal(document.querySelector("dialog"), null);
    await React.act(() => { media.matches = false; for (const listener of listeners) listener(); });
    assert.equal(document.querySelector("dialog").open, false);
    assert.ok(document.getElementById("worksheet"));
    await React.act(() => root.render(null));
    assert.equal(listeners.size, 0);
  });
  await t.test("app order survives remount, stays scoped, and remains usable if storage fails", async () => {
    const { useIXITransactAppOrder } = load("../components/ixi-command-center/useIXITransactAppOrder.js");
    let preferences;
    function Harness(props) { preferences = useIXITransactAppOrder(props); return null; }
    const scope = { entityPassportId: "entity-a", actorPassportId: "actor-a", kind: "machine" };
    const render = props => React.act(() => root.render(React.createElement(Harness, props)));
    await render(scope);
    await React.act(() => preferences.save(["bill", "expense"]));
    await React.act(() => root.render(null));
    await render(scope);
    assert.deepEqual(preferences.order, ["bill", "expense"]);
    await render({ ...scope, entityPassportId: "entity-b" });
    assert.deepEqual(preferences.order, []);
    await render({ ...scope, actorPassportId: "actor-b" });
    assert.deepEqual(preferences.order, []);
    await render({ ...scope, kind: "location" });
    assert.deepEqual(preferences.order, []);
    await render(scope);
    assert.deepEqual(preferences.order, ["bill", "expense"]);
    const storagePrototype = dom.window.Storage.prototype;
    const original = storagePrototype.setItem;
    try {
      storagePrototype.setItem = () => { throw new Error("Storage denied"); };
      await React.act(() => preferences.save(["expense", "bill"]));
      assert.deepEqual(preferences.order, ["expense", "bill"]);
      assert.match(preferences.error, /could not be saved/);
    } finally { storagePrototype.setItem = original; }
  });
});
