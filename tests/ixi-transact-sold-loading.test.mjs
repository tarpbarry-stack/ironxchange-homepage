import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { listingPassportId, soldListingsFromProjection, querySoldListings } from "../lib/listings/IXISoldInventory.mjs";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const load = (path, name, dependencies) => new Function(...Object.keys(dependencies),
  `${read(path).replace(/^import[\s\S]*?;\n/gm, "").replace(/export default /g, "").replace(/export /g, "")}\nreturn ${name};`)(...Object.values(dependencies));
const sale = (index, extra = {}) => ({ saleId: `sale-${index}`, listingId: `listing-${index}`, passportId: `passport-${index}`, salePrice: 100, saleDate: "2026-08-01", buyerLabel: "Buyer", soldByLabel: "Seller", status: "sold", settlementStatus: "open", ...extra });
const listing = sale => ({ id: sale.listingId, passportId: sale.passportId, title: "Machine" });
function sourceLoader(query, show = () => { throw Error("Unexpected individual lookup"); }) {
  return load("lib/server/aos/ixiSoldListingSources.js", "completeSoldListingSources", {
    createInstance: () => ({ listings: { query, show } }), types: { UUID: class { constructor(id) { this.uuid = id; } } },
    normalizeSharetribeListings: response => response.data, listingPassportId
  });
}

test("SOLD resolves only distinct sale listing IDs, batching at the 100-ID limit", async () => {
  const sales = Array.from({ length: 205 }, (_, i) => sale(i));
  const calls = [];
  const resolve = sourceLoader(async query => {
    const ids = query.ids.map(id => id.uuid);
    calls.push(ids);
    return { data: { data: sales.filter(sale => ids.includes(sale.listingId)).map(listing) } };
  });
  const result = await resolve([...sales, { ...sales[0], saleId: "resale" }]);
  assert.deepEqual(calls.map(ids => ids.length), [100, 100, 5]);
  assert.equal(result.listings.length, 205);
  assert.deepEqual(result.issues, []);
  assert.deepEqual((await resolve([], [])).listings, []);
  assert.equal(calls.length, 3);
});

test("missing and mismatched machine sources never expose another Passport or erase sales", async () => {
  const sales = [sale(1), sale(2), sale(3)];
  const result = await sourceLoader(async () => ({ data: { data: [listing(sales[0]), listing({ ...sales[1], passportId: "wrong-passport" }), { id: "unrequested", passportId: sales[2].passportId }] } }))(sales);
  assert.deepEqual(result.listings, [listing(sales[0])]);
  assert.equal(result.issues.length, 2);
  const view = querySoldListings(soldListingsFromProjection(sales, result.listings));
  assert.equal(view.total, 3);
  assert.deepEqual(view.salesSummary.totals, [{ currency: "USD", amountCents: 30000 }]);
});

test("a rejected source batch recovers individual records and preserves unavailable sale issues", async () => {
  const sales = [sale(1), sale(2)];
  const result = await sourceLoader(async () => { throw Error("batch rejected"); }, async ({ id }) => {
    if (id.uuid === "listing-2") throw Error("unavailable");
    return { data: { data: listing(sales[0]) } };
  })(sales);
  assert.equal(result.listings.length, 1);
  assert.equal(result.issues[0].documentId, "sale-2");
});

function endpoint(dependencies = {}) {
  return load("pages/api/sold-inventory.js", "handler", {
    resolveAosBrowserSession: async () => ({ userId: "verified-user" }),
    resolveExistingIxCoreAosContext: async () => ({ entityId: "verified-entity" }),
    requestIxCoreFinancial: async ({ principalId, entityId }) => {
      assert.equal(principalId, "verified-user"); assert.equal(entityId, "verified-entity");
      return { ok: true, data: { sales: Array.from({ length: 105 }, (_, i) => sale(i)), issues: [] } };
    },
    fetchSharetribeListingsByAuthor: async id => { assert.equal(id, "verified-user"); return []; },
    normalizeSharetribeListings: value => value,
    completeSoldListingSources: async sales => ({ listings: sales.map(listing), issues: [] }),
    soldListingsFromProjection, querySoldListings, ...dependencies
  });
}
const response = () => ({ headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.statusCode = n; return this; }, json(data) { this.data = data; return this; } });

test("one authorized snapshot includes all sales; local filters retain totals across pages", async () => {
  const res = response();
  await endpoint()({ method: "GET", query: { snapshot: "1", authorId: "untrusted-user" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers["Cache-Control"], "private, no-store");
  assert.equal(res.data.listings.length, 105);
  const first = querySoldListings(res.data.listings, { from: "2026-08-01", to: "2026-08-31", pageSize: 24 });
  const last = querySoldListings(res.data.listings, { page: 5, pageSize: 24 });
  assert.equal(first.total, 105); assert.equal(last.listings.length, 9);
  assert.deepEqual(first.salesSummary, last.salesSummary);
  const paged = response();
  await endpoint()({ method: "GET", query: { page: "5" } }, paged);
  assert.equal(paged.data.listings.length, 9);
});

test("snapshot loading verifies session and Entity before accessing sales or listing sources", async () => {
  for (const boundary of ["resolveAosBrowserSession", "resolveExistingIxCoreAosContext"]) {
    const res = response();
    await endpoint({ [boundary]: async () => { throw Object.assign(Error("Denied"), { status: 403 }); },
      requestIxCoreFinancial: () => { assert.fail("Sales accessed without authorization"); },
      completeSoldListingSources: () => { assert.fail("Sources accessed without authorization"); }
    })({ method: "GET", query: { snapshot: "1" } }, res);
    assert.equal(res.statusCode, 403);
  }
});

test("historical sales without listing IDs retain the verified author's Passport lookup", async () => {
  const legacy = sale(1, { listingId: "" });
  const res = response();
  await endpoint({ requestIxCoreFinancial: async () => ({ ok: true, data: { sales: [legacy], issues: [] } }),
    fetchSharetribeListingsByAuthor: async id => { assert.equal(id, "verified-user"); return [listing(legacy)]; },
    completeSoldListingSources: async (sales, existing) => ({ listings: existing, issues: [] })
  })({ method: "GET", query: { snapshot: "1" } }, res);
  assert.equal(res.data.listings[0].title, "Machine");
});

test("a slow media manifest does not hold back another machine's ready photo", async () => {
  let releaseSlow;
  const slow = new Promise(resolve => { releaseSlow = resolve; });
  const manifest = url => ({ media: [{ id: url, url }] });
  const hydrate = load("lib/listings/hydrateIXIListingMedia.js", "hydrateIXIListingCollection", {
    getIXIMachineMedia: key => key === "slow" ? slow : Promise.resolve(manifest("fast-photo"))
  });
  let readyFast;
  const firstReady = new Promise(resolve => { readyFast = resolve; });
  const seen = [];
  const all = hydrate([{ id: "slow", machineKey: "slow" }, { id: "fast", machineKey: "fast" }], {
    concurrency: 2, dedupeRequests: true, onListingHydrated: item => { seen.push(item.id); readyFast(item); }
  });
  const first = await firstReady;
  assert.equal(first.imageUrl, "fast-photo");
  assert.deepEqual(seen, ["fast"]);
  releaseSlow(manifest("slow-photo"));
  const result = await all;
  assert.deepEqual(result.map(item => item.id), ["slow", "fast"]);
  assert.deepEqual(seen, ["fast", "slow"]);
});


test("first SOLD load overlaps catalogue and financial reads instead of adding their latency", async () => {
  const started = [];
  let releaseInventory;
  const inventory = new Promise(resolve => { releaseInventory = resolve; });
  let catalogueStarted;
  const catalogue = new Promise(resolve => { catalogueStarted = resolve; });
  const res = response();
  const done = endpoint({
    requestIxCoreFinancial: async () => { started.push("inventory"); return inventory; },
    fetchSharetribeListingsByAuthor: async () => { started.push("catalogue"); catalogueStarted(); return []; }
  })({ method: "GET", query: { snapshot: "1" } }, res);
  await catalogue;
  assert.deepEqual(started, ["inventory", "catalogue"]);
  releaseInventory({ ok: true, data: { sales: [sale(1)], issues: [] } });
  await done;
  assert.equal(res.data.listings.length, 1);
});

test("catalogue failure falls back to the authorized sale ID batch without hiding sales", async () => {
  const res = response();
  await endpoint({ fetchSharetribeListingsByAuthor: async () => { throw Error("catalogue unavailable"); } })({ method: "GET", query: { snapshot: "1" } }, res);
  assert.equal(res.data.listings.length, 105);
});
