import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

test("the actual ledger hides stale amounts and disables financial actions while switching or failing periods", {
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
  let fulfill, reject;
  const clients = {
    loadIXITransactGL: () => new Promise((resolve, fail) => { fulfill = resolve; reject = fail; }),
    loadIXITransactChartOfAccounts: async () => ({ data: { activeAccounts: [{ active: true, accountCode: "1010", accountName: "Cash", accountType: "asset" }] } })
  };
  const source = fileURLToPath(new URL("../components/ixi-transact-dashboard/IXITransactGLWorkspace.jsx", import.meta.url));
  const compiled = transformSync(fs.readFileSync(source, "utf8"), { filename: source, jsc: { parser: { syntax: "ecmascript", jsx: true }, target: "es2022", transform: { react: { runtime: "automatic" } } }, module: { type: "commonjs" } });
  const module = { exports: {} }, sourceRequire = createRequire(source);
  new Function("require", "module", "exports", compiled.code)(name => name.endsWith("DashboardClient") ? clients : sourceRequire(name), module, module.exports);
  const root = createRoot(document.getElementById("root"));
  t.after(async () => {
    await React.act(() => root.unmount()); dom.window.close();
    for (const [key, descriptor] of previous) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
  });
  const render = (period, refreshKey = 0) => React.act(() => root.render(React.createElement(module.exports.default, { period, refreshKey })));
  const buttons = () => [...document.querySelectorAll("button")];
  const text = () => document.getElementById("root").textContent;
  const fixture = { data: { scope: { entityPassportId: "test-company" }, projection: {
    currency: "USD", period: { period: "2026-09", closed: true }, profitAndLoss: { netIncome: -25 },
    controls: { ready: false, closeCertification: { counts: { unpostedEconomicDocuments: 1 }, exceptions: [{ code: "UNPOSTED_ECONOMIC_DOCUMENT", documentType: "asset-acquisition", financialDocumentId: "acq-test" }] } }
  } } };
  await render("2026-09");
  assert.ok(buttons().find(button => button.textContent.includes("NEW JOURNAL")).disabled);
  assert.equal(document.querySelector(".status-pill").textContent, "LOADING");
  await React.act(() => fulfill(fixture));
  assert.ok(text().includes("-$25.00"));
  assert.ok(text().includes("acq-test"));
  assert.ok(buttons().find(button => button.textContent.includes("NEW JOURNAL")).disabled);
  await render("2026-10");
  assert.ok(!text().includes("-$25.00"));
  assert.equal(document.querySelector(".status-pill").textContent, "LOADING");
  await React.act(() => reject(new Error("Unavailable")));
  assert.equal(document.querySelector(".status-pill").textContent, "UNAVAILABLE");
  assert.ok(!text().includes("-$25.00"));
  assert.ok(buttons().find(button => button.textContent.includes("NEW JOURNAL")).disabled);

  await render("2026-11");
  const obsoleteResponse = fulfill;
  await render("2026-12");
  await React.act(() => obsoleteResponse({ data: { ...fixture.data, projection: { ...fixture.data.projection, period: { period: "2026-11", closed: false } } } }));
  assert.equal(document.querySelector(".status-pill").textContent, "LOADING");
  assert.ok(!text().includes("-$25.00"));
  const openFixture = { data: { ...fixture.data, projection: { ...fixture.data.projection, period: { period: "2026-12", closed: false } } } };
  await React.act(() => fulfill(openFixture));
  await React.act(() => buttons().find(button => button.textContent.includes("NEW JOURNAL")).click());
  const memo = document.querySelector('input[placeholder="Journal purpose / memo"]');
  const valueSetter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set;
  await React.act(() => {
    valueSetter.call(memo, "Unfinished journal memo");
    memo.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  });
  await render("2026-12", 1);
  assert.equal(document.querySelector('input[placeholder="Journal purpose / memo"]'), memo, "Refresh must preserve the mounted worksheet");
  assert.equal(memo.value, "Unfinished journal memo");
  assert.ok(buttons().find(button => button.textContent === "POST JOURNAL").disabled);
  await React.act(() => reject(new Error("Refresh failed")));
  assert.equal(memo.value, "Unfinished journal memo");
  assert.ok(buttons().find(button => button.textContent === "POST JOURNAL").disabled);
});
