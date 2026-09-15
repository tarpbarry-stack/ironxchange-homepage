import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const coreRoot = process.env.IXI_CORE_CONTRACT_ROOT;
const repo = fileURLToPath(new URL("../", import.meta.url));

// Render the production console, adapter, editor bridge, card and rail together.
// No component or membership result is mocked. CSS modules alone are inert here.
async function harness(t) {
  const require = createRequire(import.meta.url);
  const coreRequire = createRequire(path.join(path.resolve(coreRoot), "package.json"));
  const { JSDOM } = coreRequire("jsdom");
  const dom = new JSDOM('<div id="root"></div>', { url: "https://card-test.invalid/" });
  const previous = new Map();
  for (const [key, value] of Object.entries({
    window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    IS_REACT_ACT_ENVIRONMENT: true
  })) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  const React = require("react");
  const { createRoot } = require("react-dom/client");
  const { transformSync } = require("next/dist/build/swc");
  const root = createRoot(document.getElementById("root"));
  t.after(async () => {
    await React.act(() => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const modules = new Map();
  function load(file) {
    const full = path.resolve(repo, file);
    if (modules.has(full)) return modules.get(full).exports;
    const module = { exports: {} };
    modules.set(full, module);
    const compiled = transformSync(fs.readFileSync(full, "utf8"), {
      filename: full,
      jsc: { parser: { syntax: "ecmascript", jsx: true }, target: "es2022", transform: { react: { runtime: "automatic" } } },
      module: { type: "commonjs" }
    });
    const sourceRequire = createRequire(full);
    new Function("require", "module", "exports", compiled.code)(name => {
      if (name.endsWith(".css")) return {};
      if (name.startsWith(".")) {
        const target = path.resolve(path.dirname(full), name);
        const resolved = ["", ".js", ".jsx", ".mjs"].map(ext => target + ext)
          .find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
        if (resolved && /\.[cm]?jsx?$/.test(resolved)) return load(resolved);
      }
      return sourceRequire(name);
    }, module, module.exports);
    return module.exports;
  }
  return {
    React, dom, load,
    render: element => React.act(() => root.render(element)),
    click: element => React.act(() => element.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })))
  };
}

test("Card 007 retains authorized child references through its console and all presentation variants", {
  skip: coreRoot ? false : "Run the required paired gate with IXI_CORE_CONTRACT_ROOT."
}, async t => {
  const h = await harness(t);
  const Card = h.load("components/ixi-aos/cards/007/IXIAosCard007EmployeeApplication.jsx").default;
  const Console = h.load("components/ixi-aos/console-runtime/IXIAosNumberedObjectConsole.jsx").default;
  const yard = {
    objectId: "object-yard", passportId: "IXIYARD001", entityId: "entity-test",
    objectType: "generic", displayName: "Customer Yard", revision: 8,
    fields: { addressLine1: "12 Depot Road" }, metadata: { rootContainer: false }
  };
  const machines = [1, 2].map(number => ({
    objectId: `object-machine-${number}`, passportId: `IXIMACH00${number}`,
    entityId: yard.entityId, objectType: "machine", displayName: "Same machine label",
    revision: number, referenceOnly: true
  }));
  const unchanged = structuredClone({ yard, machines });
  const exposed = [];
  let saves = 0;
  function view(variant, children = machines, object = yard, console = true) {
    const props = {
      object: { ...object, metadata: { ...object.metadata, cardVariant: variant } },
      children, onExposeObject: (...args) => exposed.push(args),
      onSaveObject: () => { saves++; }
    };
    return console
      ? h.React.createElement(Console, { ...props, cardNumber: 7, renderPrimaryCard: cardProps => h.React.createElement(Card, cardProps) })
      : h.React.createElement(Card, props);
  }
  for (const variant of ["A", "B", "C"]) {
    await h.render(view(variant));
    const buttons = document.querySelectorAll('.u007-child-rail button[aria-label="Preview Same machine label"]');
    assert.equal(buttons.length, 2, `Variant ${variant} must receive both distinct canonical child references`);
    // B deliberately hides its rail with CSS; it retains the same collection.
    if (variant !== "B") {
      await h.click(buttons[1]);
      assert.equal(exposed.at(-1)[0], machines[1], "Opening a preview must retain the exact machine identity");
      assert.equal(exposed.at(-1)[1].objectId, yard.objectId);
      assert.equal(exposed.at(-1)[1].passportId, yard.passportId);
    }
  }
  // Face Lab passes children directly without the operating console's objects alias.
  await h.render(view("A", machines, yard, false));
  assert.equal(document.querySelectorAll(".u007-child-rail button").length, 2);
  await h.render(view("A", [], { ...yard, displayName: "Renamed Yard" }));
  assert.equal(document.querySelectorAll(".u007-child-rail button").length, 0, "An empty current collection must not revive stale references");
  await h.render(view("A", [machines[0]], { ...yard, displayName: "Renamed Yard" }));
  assert.equal(document.querySelectorAll(".u007-child-rail button").length, 1);
  await h.click(document.querySelector(".u007-child-rail button"));
  assert.equal(exposed.at(-1)[0], machines[0]);
  assert.equal(exposed.at(-1)[1].displayName, "Renamed Yard");
  assert.equal(saves, 0, "Rendering, changing appearance, renaming in projection and opening a preview do not save records");
  assert.deepEqual({ yard, machines }, unchanged);
});
