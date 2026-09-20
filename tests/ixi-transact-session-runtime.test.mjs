import assert from "node:assert/strict";
import test from "node:test";
import { createIXITransactSessionRuntime } from "../components/ixi-transact-dashboard/data/IXITransactSessionRuntime.mjs";

const access = (id = "company-a", extra = {}) => ({ data: {
  actor: { passportId: "operator-a" }, defaults: { entityPassportId: id },
  operatingContext: { entity: { entityId: id, passportId: id } }, ...extra
} });
const query = (period = "2026-09", asset = "") => ({ scope: { entityPassportIds: ["company-a"], assetPassportIds: asset ? [asset] : [] }, period });
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const tick = () => new Promise(resolve => setImmediate(resolve));

test("two views share access and equivalent dashboard reads; one consumer abort does not cancel the other", async () => {
  const result = deferred(); let authReads = 0, dashboardReads = 0, sharedSignal;
  const runtime = createIXITransactSessionRuntime({ readAccess: async () => { authReads++; return access(); },
    readDashboard: ({ signal }) => { dashboardReads++; sharedSignal = signal; return result.promise; } });
  const controller = new AbortController();
  const first = runtime.loadDashboard({ query: query(), signal: controller.signal });
  const cancelled = assert.rejects(first, { name: "AbortError" });
  const second = runtime.loadDashboard({ query: { period: "2026-09", scope: { assetPassportIds: [], entityPassportIds: ["company-a"] } } });
  await tick(); controller.abort(); await cancelled;
  assert.equal(sharedSignal.aborted, false);
  result.resolve({ amount: 150 });
  assert.deepEqual(await second, { amount: 150 });
  assert.deepEqual(await runtime.loadDashboard({ query: query() }), { amount: 150 });
  assert.equal(authReads, 1); assert.equal(dashboardReads, 1); runtime.dispose();
});

test("dashboard freshness, period and asset scopes stay separate and failed reads are retryable", async () => {
  let clock = 1000, reads = 0, fail = false;
  const runtime = createIXITransactSessionRuntime({ now: () => clock, readAccess: async () => access(), readDashboard: async () => {
    reads++; if (fail) throw new Error("temporarily unavailable"); return { reads };
  } });
  assert.equal((await runtime.loadDashboard({ query: query() })).reads, 1);
  assert.equal((await runtime.loadDashboard({ query: query("2026-08") })).reads, 2);
  assert.equal((await runtime.loadDashboard({ query: query("2026-09", "machine-a") })).reads, 3);
  assert.equal((await runtime.loadDashboard({ query: query() })).reads, 1);
  clock += 30_001; fail = true;
  await assert.rejects(runtime.loadDashboard({ query: query() }), /temporarily unavailable/);
  fail = false; assert.equal((await runtime.loadDashboard({ query: query() })).reads, 5); runtime.dispose();
});

test("a successful financial write invalidates cached and in-flight old results", async () => {
  const old = deferred(); let reads = 0;
  const runtime = createIXITransactSessionRuntime({ readAccess: async () => access(), readDashboard: () => ++reads === 1 ? old.promise : Promise.resolve({ paid: true }) });
  const pending = runtime.loadDashboard({ query: query() });
  const stale = assert.rejects(pending, { name: "AbortError" });
  await tick(); runtime.invalidateFinancial();
  assert.deepEqual(await runtime.loadDashboard({ query: query() }), { paid: true });
  old.resolve({ paid: false }); await stale;
  assert.deepEqual(await runtime.loadDashboard({ query: query() }), { paid: true }); runtime.dispose();
});

test("account or capability changes fence old requests and notify the layout to clear protected state", async () => {
  const old = deferred(); let current = access(), snapshot, reads = 0;
  const runtime = createIXITransactSessionRuntime({ readAccess: async () => current,
    readDashboard: () => ++reads === 1 ? old.promise : Promise.resolve({ company: "b" }), onChange: next => { snapshot = next; } });
  const pending = runtime.loadDashboard({ query: query() });
  const stale = assert.rejects(pending, { name: "AbortError" });
  await tick(); const firstGeneration = snapshot.generation;
  current = access("company-b", { actor: { passportId: "operator-b" } });
  await runtime.loadAccess({ force: true }); assert.ok(snapshot.generation > firstGeneration);
  old.resolve({ company: "a" }); await stale;
  const secondGeneration = snapshot.generation;
  current = access("company-b", { actor: { passportId: "operator-b" }, deniedPermissions: ["financial.post"] });
  await runtime.loadAccess({ force: true }); assert.ok(snapshot.generation > secondGeneration);
  runtime.dispose();
});

test("expired access refresh cannot reuse a dashboard query from the previous company", async () => {
  let clock = 1, current = access(), reads = 0;
  const runtime = createIXITransactSessionRuntime({ now: () => clock, readAccess: async () => current, readDashboard: async () => ++reads });
  await runtime.loadAccess(); clock += 60_001; current = access("company-b");
  await assert.rejects(runtime.loadDashboard({ query: query() }), { name: "AbortError" });
  assert.equal(reads, 0); runtime.dispose();
});

test("401 is retried once, then clears access; 403 also clears cached data without retry", async () => {
  let failure = 0, calls = 0, snapshot;
  const runtime = createIXITransactSessionRuntime({ readAccess: async () => {
    calls++; if (failure) throw Object.assign(new Error("access revoked"), { status: failure }); return access();
  }, readDashboard: async () => ({}), onChange: next => { snapshot = next; } });
  await runtime.loadAccess(); failure = 401;
  await assert.rejects(runtime.loadAccess({ force: true }), { status: 401 });
  assert.equal(calls, 3); assert.equal(snapshot.access, null); assert.equal(snapshot.error.status, 401);
  failure = 403;
  await assert.rejects(runtime.loadAccess(), { status: 403 }); assert.equal(calls, 4);
  assert.equal(snapshot.access, null); runtime.dispose();
});

test("separate application visits share no cache and disposal rejects late responses", async () => {
  const late = deferred(); let signal;
  const first = createIXITransactSessionRuntime({ readAccess: async () => access(), readDashboard: args => { signal = args.signal; return late.promise; } });
  const second = createIXITransactSessionRuntime({ readAccess: async () => access("company-b"), readDashboard: async () => ({ private: "b" }) });
  const pending = first.loadDashboard({ query: query() }); const rejected = assert.rejects(pending, { name: "AbortError" });
  await tick(); first.dispose(); assert.equal(signal.aborted, true);
  late.resolve({ private: "a" }); await rejected;
  await assert.rejects(second.loadDashboard({ query: query() }), { name: "AbortError" });
  assert.deepEqual(await second.loadDashboard({ query: { scope: { entityPassportIds: ["company-b"] } } }), { private: "b" });
  await assert.rejects(first.loadAccess(), { name: "AbortError" }); second.dispose();
});

test("synchronous read failures release the pending slot so retry can succeed", async () => {
  let fail = true;
  const runtime = createIXITransactSessionRuntime({ readAccess: () => { if (fail) throw new Error("offline"); return access(); },
    readDashboard: () => { throw new Error("offline dashboard"); } });
  await assert.rejects(runtime.loadAccess(), /offline/); fail = false; await runtime.loadAccess();
  await assert.rejects(runtime.loadDashboard({ query: query() }), /offline dashboard/); runtime.dispose();
});

test("cold startup starts directory and access together, deduplicates subscribers, and publishes only after access", async () => {
  const auth = deferred(), directory = deferred(); let authReads = 0, directoryReads = 0, published = false;
  const runtime = createIXITransactSessionRuntime({ readAccess: () => { authReads++; return auth.promise; },
    readOperatingEnvironment: () => { directoryReads++; return directory.promise; }, readDashboard: async () => ({}) });
  const first = runtime.loadOperatingEnvironment().then(value => { published = true; return value; });
  const second = runtime.loadOperatingEnvironment();
  await tick(); assert.equal(authReads, 1); assert.equal(directoryReads, 1);
  const environment = { isAuthenticated: true, entity: { entityId: "company-a", passportId: "company-a" } };
  directory.resolve(environment); await tick(); assert.equal(published, false);
  auth.resolve(access()); assert.equal(await first, environment); assert.equal(await second, environment);
  assert.equal(await runtime.loadOperatingEnvironment(), environment); assert.equal(directoryReads, 1);
  runtime.dispose();
});

test("directory results are fenced on company changes, explicitly refreshed, and rejected on tenant mismatch", async () => {
  let current = access(), reads = 0;
  const pending = deferred();
  const runtime = createIXITransactSessionRuntime({ readAccess: async () => current, readDashboard: async () => ({}),
    readOperatingEnvironment: () => ++reads === 1 ? pending.promise : Promise.resolve({ isAuthenticated: true, entity: { entityId: "company-b", passportId: "company-b" } }) });
  const old = runtime.loadOperatingEnvironment(); const stale = assert.rejects(old, { name: "AbortError" });
  await tick(); current = access("company-b"); await runtime.loadAccess({ force: true });
  pending.resolve({ isAuthenticated: true, entity: { entityId: "company-a" } }); await stale;
  assert.equal((await runtime.loadOperatingEnvironment()).entity.entityId, "company-b");
  await runtime.loadOperatingEnvironment({ force: true }); assert.equal(reads, 3); runtime.dispose();
  const mismatch = createIXITransactSessionRuntime({ readAccess: async () => access(), readDashboard: async () => ({}),
    readOperatingEnvironment: async () => ({ isAuthenticated: true, entity: { entityId: "foreign-company" } }) });
  await assert.rejects(mismatch.loadOperatingEnvironment(), { status: 403 }); mismatch.dispose();
});

test("slow optional listing details cannot block canonical cards and share one cancellable-consumer read", async () => {
  const details = deferred(); let reads = 0;
  const environment = { isAuthenticated: true, userId: 'user-a', entity: { entityId: 'company-a', passportId: 'company-a' } };
  const runtime = createIXITransactSessionRuntime({ readAccess: async () => access(), readDashboard: async () => ({}),
    readOperatingEnvironment: async () => environment,
    readOperatingPresentations: async ({ userId }) => { assert.equal(userId, 'user-a'); reads++; return details.promise; } });
  const controller = new AbortController();
  const first = runtime.loadOperatingPresentations({ signal: controller.signal });
  const cancelled = assert.rejects(first, { name: 'AbortError' });
  const second = runtime.loadOperatingPresentations(); await tick();
  assert.equal(await runtime.loadOperatingEnvironment(), environment);
  assert.equal(reads, 1); controller.abort(); await cancelled;
  details.resolve([{ id: 'listing-a' }]); assert.deepEqual(await second, [{ id: 'listing-a' }]);
  assert.deepEqual(await runtime.loadOperatingPresentations(), [{ id: 'listing-a' }]);
  assert.equal(reads, 1); runtime.dispose();
});
