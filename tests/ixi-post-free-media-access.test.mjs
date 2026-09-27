import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const filename = new URL("../lib/server/media/forwardIXIMedia.js", import.meta.url).pathname;
const source = transformSync(fs.readFileSync(filename, "utf8"), { filename, jsc: { parser: { syntax: "ecmascript" }, target: "es2022" }, module: { type: "commonjs" } }).code;
function gateway({ listing, sessionError, context, governed }) {
  const module = { exports: {} };
  const dependencies = {
    crypto,
    "sharetribe-flex-sdk": { createInstance: () => ({ listings: { show: async () => ({ data: { data: listing } }) } }), tokenStore: { memoryStore: () => ({}) }, types: { UUID: class { constructor(uuid) { this.uuid = uuid; } } } },
    "../aos/resolveAosBrowserSession": { resolveAosBrowserSession: async () => { if (sessionError) throw sessionError; return {}; } },
    "../aos/ixiMosInternalClient": { resolveExistingIxCoreAosContext: async () => context, requestIxCoreMos: governed }
  };
  new Function("module", "exports", "require", source)(module, module.exports, name => { assert.ok(name in dependencies, name); return dependencies[name]; });
  return module.exports.forwardIXIMedia;
}
function response() { return { statusCode: 200, setHeader() {}, status(code) { this.statusCode = code; return this; }, json(payload) { this.payload = payload; return this; } }; }
const blocked = { ok: false, error: { code: "POST_FREE_GOVERNED_MEDIA_REQUIRED" }, listingId: "listing-one" };
const published = { attributes: { state: "published", publicData: { machineAccess: "public", machineChannel: "marketplace" } } };

test("public manifest ticket requires fresh published visibility and is bound to the machine key", async t => {
  const oldSecret = process.env.IXI_MOS_INTERNAL_SECRET;
  process.env.IXI_MOS_INTERNAL_SECRET = "test-secret";
  t.after(() => { if (oldSecret === undefined) delete process.env.IXI_MOS_INTERNAL_SECRET; else process.env.IXI_MOS_INTERNAL_SECRET = oldSecret; });
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push(options);
    return { status: calls.length === 1 ? 403 : 200, json: async () => calls.length === 1 ? blocked : { ok: true, manifest: { machineKey: "PASS1" } } };
  });
  const forward = gateway({ listing: published, sessionError: new Error("Public reads must not require customer login") });
  const res = response();
  await forward({ method: "GET", headers: { "x-ixi-media-read-ticket": "untrusted" } }, res, { action: "manifest", method: "GET", path: "/media/machines/PASS1", body: { machineKey: "PASS1" } });
  assert.equal(res.statusCode, 200);
  assert.equal(calls[0].headers["x-ixi-media-read-ticket"], undefined);
  const [expires, signature] = calls[1].headers["x-ixi-media-read-ticket"].split(".");
  assert.equal(signature, crypto.createHmac("sha256", "test-secret").update(`ixi-media-read-v1\nPASS1\n${expires}`).digest("hex"));
});

test("draft or private placement never receives a public media ticket", async t => {
  let sends = 0;
  t.mock.method(globalThis, "fetch", async () => { sends++; return { status: 403, json: async () => blocked }; });
  for (const attributes of [
    { state: "draft", publicData: published.attributes.publicData },
    { state: "published", publicData: { machineAccess: "private", machineChannel: "marketplace" } },
    { state: "published", publicData: { machineAccess: "public", machineChannel: "private" } }
  ]) {
    const res = response();
    await gateway({ listing: { attributes }, sessionError: Object.assign(new Error("Sign in required"), { status: 401 }) })({ method: "GET" }, res, { action: "manifest", method: "GET", path: "/media/machines/PASS1", body: { machineKey: "PASS1" } });
    assert.equal(res.statusCode, 401);
  }
  assert.equal(sends, 3);
});

test("private owner read uses fresh governed context and propagates authority denial", async t => {
  t.mock.method(globalThis, "fetch", async () => ({ status: 403, json: async () => blocked }));
  const res = response();
  await gateway({ listing: null, context: { userId: "owner", entityId: "entity" }, governed: async input => {
    assert.equal(input.principalId, "owner"); assert.equal(input.entityId, "entity");
    assert.equal(input.path, "/aos/post-free-media/manifest");
    throw Object.assign(new Error("Access revoked"), { status: 403 });
  } })({ method: "GET" }, res, { action: "manifest", method: "GET", path: "/media/machines/PASS1", body: { machineKey: "PASS1" } });
  assert.equal(res.statusCode, 403);
  assert.equal(res.payload.error, "Access revoked");
});
