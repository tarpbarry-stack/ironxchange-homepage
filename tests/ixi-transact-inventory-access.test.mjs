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

const availabilitySource = fs.readFileSync(new URL("../lib/server/aos/ixiInventoryAvailability.js", import.meta.url), "utf8")
  .replace(/^import[^\n]+\n/gm, "")
  .replaceAll("export async function", "async function");
const availabilityFactory = (resolveContext, request) => new Function(
  "resolveExistingIxCoreAosContext", "requestIxCoreMos", "listingPassportId",
  `${availabilitySource}\nreturn { loadInventoryAvailability, filterPublicInventory };`
)(resolveContext, request, listing => listing.passportId);

test("availability sends the resolved company through the signed tenant boundary", async () => {
  const called = [];
  const api = availabilityFactory(async ({ session }) => {
    assert.equal(session.userId, "owner");
    return { entityId: "company" };
  }, async request => {
    called.push(request);
    if (!request.entityId) throw Object.assign(new Error("Authenticated entityId required"), { status: 401 });
    assert.equal(request.entityId, "company");
    return { ok: true, current: { machine: { state: "sold" } } };
  });
  assert.deepEqual(await api.loadInventoryAvailability("owner"), { machine: { state: "sold" } });
  assert.deepEqual(called, [{ path: "/aos/inventory-availability", principalId: "owner", entityId: "company" }]);
});

test("only an absent AOS account permits an empty availability projection", async () => {
  let reads = 0;
  const absent = availabilityFactory(async () => { throw Object.assign(new Error("No AOS account"), { status: 404 }); }, async () => { reads++; });
  assert.deepEqual(await absent.loadInventoryAvailability("new-seller"), {});
  assert.equal(reads, 0);
  for (const status of [401, 403, 502]) {
    const denied = availabilityFactory(async () => { throw Object.assign(new Error("Context unavailable"), { status }); }, async () => { reads++; });
    await assert.rejects(denied.loadInventoryAvailability("owner"), error => error.status === status);
  }
  const missingRoute = availabilityFactory(async () => ({ entityId: "company" }), async () => { throw Object.assign(new Error("Route not installed"), { status: 404 }); });
  await assert.rejects(missingRoute.loadInventoryAvailability("owner"), error => error.status === 404);
  assert.equal(reads, 0);
});

test("public inventory scopes each seller and excludes sold and returned-private machines", async () => {
  const api = availabilityFactory(async ({ session }) => ({ entityId: `company-${session.userId}` }), async ({ principalId, entityId }) => {
    assert.equal(entityId, `company-${principalId}`);
    return { ok: true, current: principalId === "one" ? { samePassport: { state: "sold" } } : { returned: { state: "owned", forcePrivate: true } } };
  });
  const inventory = [
    { id: "sold", authorId: "one", passportId: "samePassport" },
    { id: "other-company-owned", authorId: "two", passportId: "samePassport" },
    { id: "private-return", authorId: "two", passportId: "returned" },
    { id: "available", authorId: "one", passportId: "available" }
  ];
  assert.deepEqual((await api.filterPublicInventory(inventory)).map(item => item.id), ["other-company-owned", "available"]);
});
