import test from 'node:test';
import assert from 'node:assert/strict';
import { createIXITransactRecordCache } from '../components/ixi-command-center/IXITransactRecordCache.mjs';
const record = (id, revision = 1) => ({ financialDocument: { financialDocumentId: id }, server: { revision } });
const tick = () => new Promise(resolve => setImmediate(resolve));

test('preparing 1,000 records admits only 16 and runs at most two reads concurrently', async () => {
  let active = 0, max = 0, reads = 0;
  const cache = createIXITransactRecordCache({ read: async ({ financialDocumentId }) => { reads++; max = Math.max(max, ++active); await tick(); active--; return record(financialDocumentId); } });
  cache.prefetch(Array.from({ length: 1000 }, (_, i) => String(i)));
  for (let i = 0; i < 20; i++) await tick();
  assert.equal(reads, 16); assert.equal(max, 2); assert.equal(cache.stats().prepared, 16);
});

test('VIEW shares an in-flight preload, promotes queued work, and reuses a verified record', async () => {
  const resolve = new Map(), order = [];
  const cache = createIXITransactRecordCache({ read: ({ financialDocumentId }) => { order.push(financialDocumentId); return new Promise(done => resolve.set(financialDocumentId, done)); } });
  cache.prefetch(['a', 'b', 'c', 'd']); await tick();
  const foreground = cache.load('d');
  resolve.get('a')(record('a')); await tick(); assert.deepEqual(order, ['a', 'b', 'd']);
  resolve.get('d')(record('d')); assert.equal((await foreground).financialDocument.financialDocumentId, 'd'); await tick();
  assert.equal((await cache.load('d')).server.revision, 1); assert.equal(order.filter(id => id === 'd').length, 1);
  resolve.get('b')(record('b')); resolve.get('c')?.(record('c')); await tick();
});

test('scope change or confirmed payment invalidates records and rejects late old responses', async () => {
  let finish;
  const cache = createIXITransactRecordCache({ read: () => new Promise(resolve => { finish = resolve; }) });
  const pending = cache.load('same'); const rejected = assert.rejects(pending, { name: 'AbortError' }); await tick();
  cache.invalidate(); finish(record('same', 1)); await rejected; await tick();
  assert.equal(cache.peek('same'), null); assert.equal(cache.stats().prepared, 0);
});

test('switching machine cancels background work without aborting a record the user opened', async () => {
  const pending = new Map();
  const cache = createIXITransactRecordCache({ read: ({ financialDocumentId, signal }) => new Promise(resolve => pending.set(financialDocumentId, { resolve, signal })) });
  cache.prefetch(['a', 'b', 'c']); await tick(); const selected = cache.load('a'); cache.cancelPrefetch();
  assert.equal(pending.get('a').signal.aborted, false); assert.equal(pending.get('b').signal.aborted, true); assert.equal(cache.stats().queued, 0);
  pending.get('a').resolve(record('a')); pending.get('b').resolve(record('b')); await selected; await tick(); assert.equal(cache.peek('b'), null);
});

test('wrong IDs and missing revisions fail closed; retry can recover and TTL forces a new read', async () => {
  let calls = 0, time = 0;
  const cache = createIXITransactRecordCache({ now: () => time, ttl: 30, read: async ({ financialDocumentId }) => { calls++; return calls === 1 ? record('wrong') : calls === 2 ? record(financialDocumentId, 0) : record(financialDocumentId, calls); } });
  await assert.rejects(cache.load('a'), /verified/); await tick();
  await assert.rejects(cache.load('a'), /verified/); await tick();
  assert.equal((await cache.load('a')).server.revision, 3); await tick();
  assert.equal((await cache.load('a')).server.revision, 3); time = 31;
  assert.equal((await cache.load('a')).server.revision, 4);
});


test('display party follows an explicit payment source without changing financial documents', async () => {
  const { buildMachineLedger } = await import('../components/ixi-command-center/IXITransactMachineLedger.mjs');
  const documents = [
    { financialDocument: { financialDocumentId: 'invoice', documentType: 'invoice', documentNumber: 'INV-1', occurredAt: '2026-02-04', financialState: 'incurred', totals: { total: 82000 }, metadata: { customer: { name: 'Customer One' } } }, server: { revision: 1 } },
    { financialDocument: { financialDocumentId: 'payment', documentType: 'payment', occurredAt: '2026-02-04', financialState: 'paid', paymentDirection: 'inflow', sourceFinancialDocumentId: 'invoice', totals: { total: 82000 } }, server: { revision: 1 } },
  ];
  const before = JSON.stringify(documents);
  const result = buildMachineLedger(documents);
  assert.equal(result.rows.find(row => row.id === 'invoice').party, 'Customer One');
  assert.equal(result.rows.find(row => row.id === 'payment').party, 'Customer One');
  assert.equal(result.rows.find(row => row.id === 'invoice').openCents, 0);
  assert.equal(JSON.stringify(documents), before);
});
