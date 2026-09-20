import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = name => fs.readFileSync(path.join(root, name), "utf8");

test("canonical directory needs one server bootstrap and no browser login, listing census, or per-card admission", async () => {
  const require = createRequire(import.meta.url);
  const { transformSync } = require("next/dist/build/swc");
  const entityId = "test-company";
  const objects = Array.from({ length: 200 }, (_, i) => ({ objectId: `object-${i}`, passportId: `IXITEST${"ABCDEFGHJKMNPQRSTUVWXYZ23456789"[Math.floor(i / 29)]}${"ABCDEFGHJKMNPQRSTUVWXYZ23456789"[i % 29]}A`,
    entityId, objectType: "machine", status: "active", displayName: `Machine ${i}` }));
  const response = { workBootstrapVersion: "ixi.aos-work-bootstrap.v1", definitions: [],
    environment: { account: { accountId: "account-test" }, principal: { principalId: "test-user" },
      entity: { entityId, passportId: "IXIENT2345" }, objects, relationships: [], railProjections: {} },
    admissions: objects.map(object => ({ ok: true, object, identity: { objectId: object.objectId, passportId: object.passportId,
      entityId, aliases: [], evidence: [] } })) };
  let requests = 0;
  const modules = new Map();
  function load(file) {
    if (modules.has(file)) return modules.get(file).exports;
    const module = { exports: {} }; modules.set(file, module);
    const compiled = transformSync(fs.readFileSync(file, "utf8"), {
      filename: file, jsc: { parser: { syntax: "ecmascript" }, target: "es2022" }, module: { type: "commonjs" }
    });
    new Function("require", "module", "exports", compiled.code)(name => {
      assert.doesNotMatch(name, /ListingsEngine|loadIXIOwnedListings|sharetribe.*sdk/, "Directory must not import a second identity/presentation loader");
      if (name === "./ixiMosClient") return {
        fetchAosEnvironment: async ({ signal }) => { assert.equal(signal.aborted, false); requests++; return response; },
        fetchMosObjectDefinitions: () => { throw new Error("Unbudgeted definition request"); },
        admitMosCanonicalIdentities: () => { throw new Error("Unbudgeted repeated admission request"); }
      };
      if (!name.startsWith(".")) return require(name);
      const target = path.resolve(path.dirname(file), name);
      const resolved = [target, target + ".js", target + ".mjs"].find(candidate => fs.existsSync(candidate));
      return load(resolved);
    }, module, module.exports);
    return module.exports;
  }
  const { loadIXICanonicalMosEnvironment } = load(path.join(root, "lib/mos/IXIMosEnvironmentProjection.js"));
  const environment = await loadIXICanonicalMosEnvironment({ signal: new AbortController().signal });
  assert.equal(requests, 1); assert.equal(environment.objects.length, 200);
  assert.deepEqual(environment.objects.map(object => object.passportId), objects.map(object => object.passportId));
  assert.deepEqual(environment.ownedListings, []);
});

test("hidden workspaces cannot initiate dashboard reads or mount through idle prewarming", () => {
  const layout = read("components/ixi-transact-dashboard/IXITransactSessionLayout.jsx");
  assert.doesNotMatch(layout, /requestIdleCallback|setWarm|\|\| warm/);
  assert.match(layout, /ledger \|\| visited\.ledger/);
  assert.match(layout, /next\.loadOperatingEnvironment\(\)/);
  const center = read("components/ixi-command-center/IXITransactCommandCenter.jsx");
  const ledger = read("components/ixi-transact-dashboard/IXITransactDashboardApp.jsx");
  assert.match(center, /if \(!active \|\| !selectedContext \|\| !access\) return undefined/);
  assert.match(ledger, /if \(!active\) return undefined/);
  assert.doesNotMatch(center, /loadIXIMosEnvironment/);
  assert.match(center, /runtime\.loadOperatingPresentations/);
});
