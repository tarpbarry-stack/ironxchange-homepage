import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { createFamilySample } from "../lib/ixi-atlas/familyDemo.mjs";

const require = createRequire(import.meta.url);
if (!process.env.IXI_CORE_CONTRACT_ROOT) throw new Error("The pinned core checkout is required for the Atlas runtime test.");
const { JSDOM } = require(path.join(process.env.IXI_CORE_CONTRACT_ROOT, "node_modules/jsdom"));
const dom = new JSDOM('<div id="root"></div>', { url: "https://test.invalid" });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = require("react");
const { act } = React;
const { createRoot } = require("react-dom/client");
const swc = require("next/dist/build/swc");
await swc.loadBindings();
const compile = (relative, dependencies = {}) => {
  const file = new URL(`../components/${relative}`, import.meta.url);
  const code = swc.transformSync(fs.readFileSync(file, "utf8"), { filename: file.pathname, jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } } }, module: { type: "commonjs" } }).code;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(id => {
    if (id in dependencies) return dependencies[id];
    if (["react", "react/jsx-runtime"].includes(id)) return require(id);
    throw new Error(`Unmocked dependency: ${id}`);
  }, module, module.exports);
  return module.exports;
};
const context = compile("ixi-machine-card/IXIMachineDemoContext.jsx");
const engine = compile("ixi-object-system/IXIMachineMutationEngine.js");
const bridge = compile("ixi-machine-card/private/IXIOwnedPrivateActionBridge.js");
let cardProps;
let writes;
let financialMounts;
const runtime = compile("ixi-machine-card/private/IXIOwnedPrivateListingRuntime.jsx", {
  "react": React,
  "next/dynamic": () => () => { financialMounts += 1; return null; },
  "./PrivateListingCard": props => { cardProps = props; return null; },
  "../IXIMachineDemoContext": context,
  "./IXIOwnedPrivateActionBridge": bridge,
  "../../ixi-object-system/IXIMachineMutationCommandBus": { IXI_MACHINE_MUTATION_COMMANDS: {} },
  "../../ixi-object-system/IXIMachineMutationEngine": { ...engine, updateMachineFacts: async input => { writes.push(input); return { verified: true }; } },
  "../../../lib/listingFormatters": { getListingId: listing => listing.id?.uuid || listing.id },
}).default;

test("the real private runtime saves a reference locally without writing, registering actions or mounting financial work", async () => {
  writes = []; financialMounts = 0;
  const sample = createFamilySample("reference");
  const notices = []; const saved = [];
  const root = createRoot(document.getElementById("root"));
  try {
    await act(async () => root.render(React.createElement(context.IXIMachineDemoProvider, { value: { onAction: (...args) => notices.push(args) } }, React.createElement(runtime, { listing: sample, ixiState: { transactOpen: true }, onOwnedObjectSaved: value => saved.push(value) }))));
    await act(async () => cardProps.onEdit());
    await act(async () => cardProps.onHoursChange("4900"));
    await act(async () => cardProps.onEdit());
    assert.equal(writes.length, 0);
    assert.equal(saved.length, 1);
    assert.equal(saved[0].hours, "4900");
    assert.equal(saved[0].ownershipRole, "non-owner");
    assert.deepEqual(saved[0].canonicalIdentity, sample.canonicalIdentity);
    assert.equal(bridge.getOwnedPrivateActions(sample.objectId), null);
    await act(async () => cardProps.onOpenTransact());
    assert.equal(financialMounts, 0);
    assert.ok(notices.some(([name]) => name === "TRAN$ACT"));
  } finally { await act(async () => root.unmount()); }
});

test("outside practice the existing private save still invokes the production writer exactly once", async () => {
  writes = []; financialMounts = 0;
  const sample = createFamilySample("private");
  const root = createRoot(document.getElementById("root"));
  try {
    await act(async () => root.render(React.createElement(runtime, { listing: sample })));
    await act(async () => cardProps.onEdit());
    await act(async () => cardProps.onHoursChange("5000"));
    await act(async () => cardProps.onEdit());
    assert.equal(writes.length, 1);
    assert.equal(writes[0].listingId, sample.id.uuid);
    assert.equal(writes[0].after.hours, "5000");
    assert.ok(bridge.getOwnedPrivateActions(sample.objectId));
  } finally { await act(async () => root.unmount()); }
});
after(() => { dom.window.close(); delete globalThis.window; delete globalThis.document; delete globalThis.IS_REACT_ACT_ENVIRONMENT; });
