import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createIXITransactSessionRuntime } from "../components/ixi-transact-dashboard/data/IXITransactSessionRuntime.mjs";

test("shared layout retains both workspaces and unsaved inputs, resets on authority change and clears on expiry", {
  skip: process.env.IXI_CORE_CONTRACT_ROOT ? false : "Run the required paired gate with IXI_CORE_CONTRACT_ROOT."
}, async t => {
  const require = createRequire(import.meta.url);
  const coreRequire = createRequire(path.join(path.resolve(process.env.IXI_CORE_CONTRACT_ROOT), "package.json"));
  const { JSDOM } = coreRequire("jsdom");
  const dom = new JSDOM('<div id="root"></div>', { url: "https://session-test.invalid/transact" });
  const previous = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document,
    navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true })) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  const React = require("react"), { createRoot } = require("react-dom/client"), { transformSync } = require("next/dist/build/swc");
  let authority = "company-a", expired = false, authReads = 0, runtime, warm;
  dom.window.requestIdleCallback = callback => { warm = callback; return 1; };
  dom.window.cancelIdleCallback = () => {};
  const redirects = [], prefetched = [];
  const router = { pathname: "/transact", asPath: "/transact", isReady: true,
    prefetch: url => { prefetched.push(url); return Promise.resolve(); }, replace: url => { redirects.push(url); return Promise.resolve(); } };
  const clients = { loadIXIFinancialAccessContext: async () => {
    authReads++;
    if (expired) throw Object.assign(new Error("Sign in again"), { status: 401 });
    return { data: { actor: { passportId: "operator" }, defaults: { entityPassportId: authority },
      operatingContext: { entity: { entityId: authority, passportId: authority } } } };
  }, loadIXITransactDashboard: async () => ({}) };
  // Only route navigation and the two expensive view boundaries are replaced.
  // The actual layout and session runtime own retention, authentication and disposal.
  function Records({ active }) { return React.createElement("input", { "aria-label": "Unfinished worksheet", defaultValue: "", "data-active": active }); }
  function Ledger({ active }) { return React.createElement("input", { "aria-label": "Executive period", defaultValue: "2026-09", "data-active": active }); }
  const source = fileURLToPath(new URL("../components/ixi-transact-dashboard/IXITransactSessionLayout.jsx", import.meta.url));
  const compiled = transformSync(fs.readFileSync(source, "utf8"), {
    filename: source, jsc: { parser: { syntax: "ecmascript", jsx: true }, target: "es2022", transform: { react: { runtime: "automatic" } } }, module: { type: "commonjs" }
  });
  const module = { exports: {} }, sourceRequire = createRequire(source);
  new Function("require", "module", "exports", compiled.code)(name => {
    if (name === "next/router") return { useRouter: () => router };
    if (name === "next/dynamic") return loader => loader.toString().includes("CommandCenter") ? Records : Ledger;
    if (name.endsWith("DashboardClient")) return clients;
    if (name.endsWith("SessionRuntime.mjs")) return { createIXITransactSessionRuntime: options => { runtime = createIXITransactSessionRuntime(options); return runtime; } };
    return sourceRequire(name);
  }, module, module.exports);
  const { getIXITransactLayout } = module.exports;
  const root = createRoot(document.getElementById("root"));
  t.after(async () => {
    await React.act(() => root.unmount()); dom.window.close();
    for (const [key, descriptor] of previous) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
  });
  const render = () => React.act(() => root.render(getIXITransactLayout(React.createElement("title", null, router.pathname))));
  const records = () => document.querySelector('[aria-label="Unfinished worksheet"]');
  const ledger = () => document.querySelector('[aria-label="Executive period"]');
  await render(); assert.equal(authReads, 1); assert.ok(records()); assert.equal(ledger(), null);
  const original = records(); original.value = "Draft freight adjustment";
  // Switch before the idle prewarm runs: the previously visited view must survive.
  router.pathname = "/transact/ledger"; router.asPath = "/transact/ledger?workspace=gl"; await render();
  assert.equal(records(), original); assert.ok(records().closest("[hidden]"));
  const executive = ledger(); executive.value = "2026-02";
  router.pathname = "/transact"; router.asPath = "/transact"; await render();
  assert.equal(records(), original); assert.equal(original.value, "Draft freight adjustment");
  assert.equal(ledger(), executive); assert.equal(executive.value, "2026-02");
  await React.act(() => warm()); assert.equal(authReads, 1);
  assert.ok(prefetched.includes("/transact/ledger"));
  authority = "company-b";
  await React.act(() => runtime.loadAccess({ force: true }));
  assert.notEqual(records(), original); assert.equal(records().value, "");
  expired = true;
  await React.act(async () => { await assert.rejects(runtime.loadAccess({ force: true }), { status: 401 }); });
  assert.equal(records(), null); assert.equal(ledger(), null); assert.match(redirects.at(-1), /^\/login\?returnTo=/);
  const disposed = runtime; await React.act(() => root.render(React.createElement("div", null, "Outside TRAN$ACT")));
  await assert.rejects(disposed.loadAccess(), { name: "AbortError" });
});

test("both pages use the persistent layout and internal links use client navigation", () => {
  const read = file => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  assert.match(read("pages/_app.js"), /getLayout\(<Component/);
  for (const file of ["pages/transact/index.js", "pages/transact/ledger.js"]) assert.match(read(file), /\.getLayout = getIXITransactLayout/);
  const records = read("components/ixi-command-center/IXITransactCommandCenter.jsx");
  const ledger = read("components/ixi-transact-dashboard/IXITransactDashboardApp.jsx");
  assert.match(records, /<Link href="\/transact\/ledger"/);
  assert.match(ledger, /<Link href="\/transact"/);
  assert.match(records, /deepLinkOpened.current === router.asPath/);
  assert.match(records, /loading=\{passportRecordsReadyFor !== selectedContext\?\.passportId\}/);
  assert.match(records, /runtime\?\.invalidateFinancial\(\)/);
  assert.match(ledger, /runtime\?\.invalidateFinancial\(\)/);
  assert.doesNotMatch(records + ledger, /<a[^>]*href="\/transact(?:["/?])/);
});
