import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

// Exercise the real API handler with isolated authentication and data services.
const source = fs.readFileSync(new URL("../pages/api/account-listings.js", import.meta.url), "utf8")
  .replace(/^import[\s\S]*?from\s+["'][^"']+["'];\s*/gm, "")
  .replace("export function createAccountListingsHandler", "function createAccountListingsHandler")
  .replace("export default createAccountListingsHandler();", "return createAccountListingsHandler;");
const factory = new Function("resolveAosBrowserSession", "fetchSharetribeListingsByAuthor", "loadInventoryAvailability", "normalizeSharetribeListings", "applyInventoryProjection", "filterAosOwnedMachines", source)(
  () => {}, () => {}, () => {}, value => value, value => value, value => value);
const response = () => ({ statusCode: 200, headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

test("anonymous and other-account inventory reads stop before any private data request", async () => {
  let reads = 0;
  for (const [userId, requested, expected] of [["", "owner", 401], ["other", "owner", 403]]) {
    const handler = factory({ resolveSession: async () => ({ userId }), fetchListings: async () => { reads++; return []; }, loadAvailability: async () => { reads++; return {}; } });
    const res = response();
    await handler({ method: "GET", query: { authorId: requested } }, res);
    assert.equal(res.statusCode, expected);
    assert.match(res.headers["Cache-Control"], /no-store/);
  }
  assert.equal(reads, 0);
});

test("inventory source uses the authenticated account and rejects non-read methods", async () => {
  const called = [];
  const handler = factory({ resolveSession: async () => ({ userId: "owner" }), fetchListings: async id => { called.push(id); return []; }, loadAvailability: async id => { called.push(id); return {}; } });
  const res = response();
  await handler({ method: "GET", query: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(called, ["owner", "owner"]);
  const blocked = response();
  await handler({ method: "POST", query: {} }, blocked);
  assert.equal(blocked.statusCode, 405);
  assert.equal(called.length, 2);
});
