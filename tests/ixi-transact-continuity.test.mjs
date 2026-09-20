import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createIXITransactHistoryCache } from '../components/ixi-command-center/IXITransactHistoryCache.mjs';
import { createIXITransactRecordCache } from '../components/ixi-command-center/IXITransactRecordCache.mjs';
const tick = () => new Promise(resolve => setImmediate(resolve));
const record = (id, revision = 1) => ({ financialDocument: { financialDocumentId: id, documentNumber: id, documentType: 'expense', financialState: 'incurred', amount: 500, totals: { total: 500 }, currency: 'USD' }, server: { revision } });

test('visited histories reuse rows and reads; failed refresh retains explicitly stale data', async () => {
  let reads = 0, time = 1, fail = false;
  const cache = createIXITransactHistoryCache({ now: () => time, ttl: 30, read: async ({ passportId }) => { reads++; if (fail) throw new Error('Offline'); return [record(passportId, reads)]; } });
  const a = await cache.load('a'); await cache.load('b');
  assert.equal(await cache.load('a'), a); assert.equal(reads, 2);
  time = 32; fail = true;
  const pending = cache.load('a');
  assert.equal(cache.peek('a').records, a); assert.equal(cache.peek('a').loading, true);
  await assert.rejects(pending, /Offline/);
  assert.equal(cache.peek('a').records, a); assert.equal(cache.peek('a').stale, true);
  assert.equal(cache.peek('a').error, 'Offline');
  fail = false; const fresh = await cache.load('a');
  assert.notEqual(fresh, a); assert.equal(cache.peek('a').stale, false);
});

test('one refresh serves multiple consumers; invalidation fences late reads and caps retained histories', async () => {
  const finishes = [];
  const cache = createIXITransactHistoryCache({ limit: 2, read: ({ passportId, signal }) => new Promise(resolve => finishes.push({ passportId, signal, resolve })) });
  const old = cache.load('a'); const rejected = assert.rejects(old, { name: 'AbortError' });
  assert.equal(cache.load('a'), old); await tick();
  cache.invalidate(); const fresh = cache.load('a'); await tick();
  finishes[1].resolve([record('a', 2)]); await fresh;
  finishes[0].resolve([record('a', 1)]); await rejected;
  assert.equal(cache.peek('a').records[0].server.revision, 2);
  const b = cache.load('b'); await tick(); finishes[2].resolve([]); await b;
  const c = cache.load('c'); await tick(); finishes[3].resolve([]); await c;
  assert.equal(cache.stats().retained, 2); assert.equal(cache.peek('a').records, null);
  const late = cache.load('d'); const lateRejected = assert.rejects(late, { name: 'AbortError' }); await tick();
  cache.clear(); finishes[4].resolve([record('d')]); await lateRejected;
  assert.equal(cache.peek('d').records, null);
});

test('changed revisions invalidate only affected prepared records, including pending old snapshots', async () => {
  let resolve;
  const cache = createIXITransactRecordCache({ read: ({ financialDocumentId }) => financialDocumentId === 'pending' ? new Promise(done => { resolve = done; }) : Promise.resolve(record(financialDocumentId)) });
  const a = await cache.load('a'), b = await cache.load('b'); await tick();
  cache.reconcile([record('a', 2), record('b')]);
  assert.equal(cache.peek('a'), null); assert.equal(cache.peek('b'), b);
  const pending = cache.load('pending'); const rejected = assert.rejects(pending, { name: 'AbortError' }); await tick();
  cache.invalidate(['pending']); resolve(record('pending')); await rejected; await tick();
  assert.equal(cache.peek('pending'), null); assert.equal(cache.peek('b'), b); assert.equal(a.server.revision, 1);
});

test('overlapping prefetch keeps useful requests; VIEW interrupts background work without exceeding two reads', async () => {
  const pending = new Map(); let active = 0, max = 0;
  const cache = createIXITransactRecordCache({ read: ({ financialDocumentId: id, signal }) => new Promise((resolve, reject) => {
    max = Math.max(max, ++active);
    pending.set(id, { signal, finish: () => { active--; resolve(record(id)); } });
    signal.addEventListener('abort', () => { active--; reject(Object.assign(new Error('cancelled'), { name: 'AbortError' })); }, { once: true });
  }) });
  cache.prefetch(['a', 'b', 'c']); await tick(); cache.prefetch(['a', 'b', 'd']);
  assert.equal(pending.get('a').signal.aborted, false); assert.equal(pending.get('b').signal.aborted, false);
  const viewed = cache.load('d'); await tick();
  assert.ok(pending.has('d')); assert.equal(max, 2);
  pending.get('d').finish(); assert.equal((await viewed).financialDocument.financialDocumentId, 'd');
  cache.cancelPrefetch(); await tick();
});

const gate = { skip: process.env.IXI_CORE_CONTRACT_ROOT ? false : 'Run the required paired gate with IXI_CORE_CONTRACT_ROOT.' };
async function harness(t, mocks = {}) {
  const require = createRequire(import.meta.url);
  const coreRequire = createRequire(path.join(path.resolve(process.env.IXI_CORE_CONTRACT_ROOT), 'package.json'));
  const { JSDOM } = coreRequire('jsdom');
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://workflow-test.invalid/transact' });
  const prior = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true })) {
    prior.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { value, writable: true, configurable: true });
  }
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  const React = require('react'), { createRoot } = require('react-dom/client');
  const root = createRoot(document.getElementById('root'));
  t.after(async () => { await React.act(() => root.unmount()); dom.window.close(); for (const [key, desc] of prior) { if (desc) Object.defineProperty(globalThis, key, desc); else delete globalThis[key]; } });
  const { transformSync } = require('next/dist/build/swc'); const modules = new Map();
  const repo = fileURLToPath(new URL('../', import.meta.url));
  function load(file) {
    const full = path.resolve(repo, file);
    if (modules.has(full)) return modules.get(full).exports;
    const module = { exports: {} }; modules.set(full, module);
    const compiled = transformSync(fs.readFileSync(full, 'utf8'), { filename: full, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    const sourceRequire = createRequire(full);
    new Function('require', 'module', 'exports', compiled.code)(name => {
      if (mocks[name] !== undefined) return mocks[name];
      const basename = path.basename(name);
      if (mocks[basename] !== undefined) return mocks[basename];
      if (name.endsWith('.css')) return new Proxy({}, { get: (_, key) => key === '__esModule' ? false : String(key) });
      if (name.startsWith('.')) {
        const target = path.resolve(path.dirname(full), name);
        const resolved = ['', '.js', '.jsx', '.mjs'].map(ext => target + ext).find(file => fs.existsSync(file) && fs.statSync(file).isFile());
        if (resolved && /\.[cm]?jsx?$/.test(resolved)) return load(resolved);
      }
      return sourceRequire(name);
    }, module, module.exports);
    return module.exports;
  }
  const click = button => React.act(async () => { button.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); await tick(); });
  const input = (element, value) => React.act(async () => {
    Object.getOwnPropertyDescriptor(dom.window[element.tagName === 'SELECT' ? 'HTMLSelectElement' : 'HTMLInputElement'].prototype, 'value').set.call(element, value);
    element.dispatchEvent(new dom.window.Event(element.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); await tick();
  });
  return { React, dom, root, load, click, input, render: element => React.act(async () => { root.render(element); await tick(); }) };
}

test('actual history hook follows rapid selection, reuses a visited view, and retains stale rows until retry succeeds', gate, async t => {
  const h = await harness(t); const { React } = h;
  const { default: useHistory } = h.load('components/ixi-command-center/useIXITransactHistory.jsx');
  const finishes = new Map(); let reads = 0;
  const cache = createIXITransactHistoryCache({ read: ({ passportId }) => { reads++; return new Promise((resolve, reject) => finishes.set(passportId, { resolve, reject })); } });
  function View({ id, refreshKey = 0 }) { const state = useHistory({ cache, passportId: id, active: true, refreshKey }); return React.createElement('output', { 'data-stale': state.stale, 'data-error': state.error }, state.records?.[0]?.financialDocument?.financialDocumentId || 'Loading'); }
  await h.render(React.createElement(View, { id: 'a' })); await h.render(React.createElement(View, { id: 'b' }));
  await React.act(() => finishes.get('b').resolve([record('b')]));
  await React.act(() => finishes.get('a').resolve([record('a')])); assert.equal(document.querySelector('output').textContent, 'b');
  await h.render(React.createElement(View, { id: 'a' })); assert.equal(document.querySelector('output').textContent, 'a'); assert.equal(reads, 2);
  await React.act(() => cache.invalidate()); await h.render(React.createElement(View, { id: 'a', refreshKey: 1 }));
  assert.equal(document.querySelector('output').textContent, 'a'); assert.equal(document.querySelector('output').dataset.stale, 'true');
  await React.act(() => finishes.get('a').reject(new Error('Offline'))); assert.equal(document.querySelector('output').dataset.error, 'Offline');
  await h.render(React.createElement(View, { id: 'a', refreshKey: 2 })); await React.act(() => finishes.get('a').resolve([record('a', 2)]));
  assert.equal(document.querySelector('output').dataset.stale, 'false');
});

test('actual expense form blocks same-frame repeat clicks, retries with the same command ID, and has no post-save delay', gate, async t => {
  let resolveWrite, rejectWrite; const calls = []; let savedCallbacks = 0;
  const h = await harness(t, { IXIPaymentsPanel: () => null, IXIExpenseStyles: () => null, IXIExpenseCommands: {
    createIXIExpense: options => { calls.push(options); return new Promise((resolve, reject) => { resolveWrite = resolve; rejectWrite = reject; }); }
  } });
  const { React } = h; const { default: Expense } = h.load('components/ixi-aos/transact/modules/expense/IXIExpenseApp.jsx');
  await h.render(React.createElement(Expense, { context: { primary: { passportId: 'machine-a', objectId: 'object-a', objectType: 'machine', label: 'Machine A' }, actor: { passportId: 'operator' } }, onSave: () => { savedCallbacks++; } }));
  await h.input(document.querySelector('input[placeholder="Hydraulic Supply Co."]'), 'Test vendor');
  await h.input(document.querySelector('input[placeholder="Hydraulic fittings – 1/2 in NPT"]'), 'Test repair');
  await h.input(document.querySelector('input[inputmode="decimal"]'), '500');
  const category = document.querySelector('select'); await h.input(category, [...category.options].find(option => option.value)?.value);
  const button = document.querySelector('button.save');
  // Both events use the same pre-render closure. React state alone cannot lock it.
  await React.act(() => { button.dispatchEvent(new h.dom.window.MouseEvent('click', { bubbles: true })); button.dispatchEvent(new h.dom.window.MouseEvent('click', { bubbles: true })); });
  assert.equal(calls.length, 1);
  await React.act(async () => { rejectWrite(new Error('Connection interrupted')); await tick(); });
  await h.click(button); assert.equal(calls.length, 2); assert.equal(calls[0].commandId, calls[1].commandId); assert.equal(calls[1].idempotencyKey, calls[0].commandId);
  await React.act(async () => { resolveWrite({ draft: { identity: { expenseId: 'expense-a', number: 'EXP-A' } }, response: { ok: true } }); await tick(); });
  assert.equal(savedCallbacks, 1, 'confirmed save must notify in this turn, without a 1,050 ms timer');
  await h.click(button); assert.equal(calls.length, 2);
});

test('actual command center keeps drafts across machines and completes a save before one shared balance refresh, without rehydrating AOS', gate, async t => {
  const require = createRequire(import.meta.url); const React = require('react');
  const entity = { entityId: 'entity-a', passportId: 'company-a', displayName: 'Test Company' };
  const objects = ['a', 'b'].map(id => ({ objectId: `object-${id}`, objectType: 'machine', passportId: `machine-${id}`, displayName: `Machine ${id.toUpperCase()}` }));
  const environment = { isAuthenticated: true, entity, objects, systemIndexes: [{ objectId: 'equipment-index', indexId: 'equipment', metadata: { adapterId: 'ixi-owned-equipment' }, items: objects.map(({ objectId }) => ({ objectId })) }] };
  let aosReads = 0, hold = false, failRefresh, finishRefresh, saveCompleted = 0, dashboardInvalidations = 0;
  const reads = [];
  const clients = { loadIXIAosPassportFinancialDocuments: async ({ passportId }) => {
    reads.push(passportId);
    if (hold && passportId === 'machine-a') return new Promise((resolve, reject) => { finishRefresh = resolve; failRefresh = reject; });
    return [record(`EXP-${passportId}`)];
  }, loadIXIAosFinancialDocument: async ({ financialDocumentId }) => record(financialDocumentId) };
  const router = { asPath: '/transact', pathname: '/transact', isReady: true, beforePopState() {}, replace() {} };
  function Form({ object, onFinancialRecordsChange }) {
    const [value, setValue] = React.useState('');
    return React.createElement('div', null,
      React.createElement('input', { 'aria-label': `Draft ${object.passportId}`, value, onChange: event => setValue(event.target.value) }),
      React.createElement('button', { onClick: async () => { await onFinancialRecordsChange(); saveCompleted++; } }, `Test save ${object.passportId}`));
  }
  function Picker({ label, items, onSelect }) { return React.createElement('div', { 'aria-label': label }, items.map(item => React.createElement('button', { key: item.id, onClick: () => onSelect(item) }, `Choose ${item.title}`))); }
  function Apps({ onOpen }) { return React.createElement('button', { onClick: () => onOpen('expense') }, 'Launch expense'); }
  const h = await harness(t, {
    'next/router': { useRouter: () => router }, 'next/link': ({ children, ...props }) => React.createElement('a', props, children),
    'next/dynamic': loader => loader.toString().includes('AppDirectory') ? Apps : Form,
    IXIMosEnvironmentProjection: { loadIXICanonicalMosEnvironment: async () => { aosReads++; return environment; } },
    IXIAosFinancialReadClient: clients,
    IXITransactObjectPicker: Picker,
    IXITransactSidePanel: ({ children }) => React.createElement('aside', null, children),
    IXITransactAccountingReports: () => null, IXITransactDocumentActions: () => null, IXIPaymentsPanel: () => null,
  });
  const { default: Center } = h.load('components/ixi-command-center/IXITransactCommandCenter.jsx');
  const runtime = { loadAccess: async () => ({ data: { actor: { passportId: 'operator' }, defaults: { entityPassportId: 'company-a' }, operatingContext: { entity }, permissions: [] } }), loadDashboard: async () => ({}), invalidateFinancial: () => { dashboardInvalidations++; } };
  const button = label => [...document.querySelectorAll('button')].find(item => item.textContent === label);
  await h.render(React.createElement(Center, { runtime }));
  assert.ok(button('Choose Machine A'), 'canonical equipment is admitted');
  await h.click(button('Choose Machine A')); await h.click(button('Launch expense'));
  const draftA = document.querySelector('[aria-label="Draft machine-a"]'); assert.ok(draftA);
  await h.input(draftA, 'Unfinished expense A');
  await h.click(button('Choose Machine B')); await h.click(button('Launch expense'));
  const draftB = document.querySelector('[aria-label="Draft machine-b"]'); await h.input(draftB, 'Unfinished expense B');
  await h.click(button('Choose Machine A'));
  assert.equal(document.querySelector('[aria-label="Draft machine-a"]'), draftA);
  assert.equal(draftA.value, 'Unfinished expense A'); assert.equal(reads.filter(id => id === 'machine-a').length, 1);
  await h.click(button('Launch expense')); hold = true;
  await h.click(button('Test save machine-a'));
  assert.equal(saveCompleted, 1, 'completed write callback must not wait on balance networking');
  assert.equal(aosReads, 1, 'saving must not rehydrate operating context');
  assert.equal(reads.filter(id => id === 'machine-a').length, 2, 'one coordinated history refresh');
  assert.equal(dashboardInvalidations, 1); assert.match(document.body.textContent, /Updating transaction balances/);
  await React.act(async () => { failRefresh(new Error('Balance service temporarily unavailable')); await tick(); });
  assert.match(document.body.textContent, /Any confirmed save remains saved/); assert.ok(button('RETRY BALANCES'));
  assert.equal(draftB.value, 'Unfinished expense B');
  await h.click(button('RETRY BALANCES')); await React.act(async () => { finishRefresh([record('EXP-machine-a', 2)]); await tick(); });
  assert.equal(saveCompleted, 1); assert.equal(aosReads, 1); assert.equal(draftB.value, 'Unfinished expense B');
  assert.equal(document.querySelector('[aria-label="Draft machine-a"]'), draftA, 'the saved app must stay mounted');
  await h.click(button('Choose Machine B')); assert.equal(document.querySelector('[aria-label="Draft machine-b"]'), draftB);
});

test('history revision evidence rejects an older record response still in flight', async () => {
  let finish;
  const cache = createIXITransactRecordCache({ read: () => new Promise(resolve => { finish = resolve; }) });
  const pending = cache.load('expense'); await tick(); cache.reconcile([record('expense', 2)]);
  finish(record('expense', 1)); await assert.rejects(pending, /changed while it was loading/);
  assert.equal(cache.peek('expense'), null);
});

test('actual saved worksheet retains its instance for unchanged revisions and never replaces dirty edits during refresh', gate, async t => {
  const require = createRequire(import.meta.url); const React = require('react');
  function Worksheet() { return React.createElement('input', { 'aria-label': 'Saved worksheet draft', defaultValue: '' }); }
  const h = await harness(t, { 'next/dynamic': () => Worksheet, IXITransactDocumentActions: () => null, IXITransactEvidence: () => null });
  const { default: Workspace } = h.load('components/ixi-command-center/IXITransactRecordWorkspace.jsx');
  let revision = 1, reads = 0;
  const cache = createIXITransactRecordCache({ read: async ({ financialDocumentId }) => { reads++; return record(financialDocumentId, revision); } });
  const object = { passportId: 'machine-a', objectType: 'machine' };
  const props = { financialDocumentId: 'EXP-A', object, recordCache: cache, financialRecords: [record('EXP-A')], active: true };
  await h.render(React.createElement(Workspace, props));
  const draft = document.querySelector('[aria-label="Saved worksheet draft"]'); assert.ok(draft);
  draft.value = 'Keep this edit';
  cache.invalidate(['EXP-A']);
  await h.render(React.createElement(Workspace, { ...props, refreshVersion: 1 }));
  assert.equal(document.querySelector('[aria-label="Saved worksheet draft"]'), draft);
  assert.equal(draft.value, 'Keep this edit');
  revision = 2; cache.invalidate(['EXP-A']);
  await h.render(React.createElement(Workspace, { ...props, dirty: true, refreshVersion: 2, financialRecords: [record('EXP-A', 2)] }));
  assert.equal(document.querySelector('[aria-label="Saved worksheet draft"]'), draft); assert.equal(reads, 2);
  await h.render(React.createElement(Workspace, { ...props, dirty: true, active: false, refreshVersion: 2 }));
  await h.render(React.createElement(Workspace, { ...props, dirty: true, refreshVersion: 2 }));
  assert.equal(draft.value, 'Keep this edit'); assert.equal(reads, 2);
  await h.render(React.createElement(Workspace, { ...props, dirty: false, refreshVersion: 2 }));
  assert.notEqual(document.querySelector('[aria-label="Saved worksheet draft"]'), draft); assert.equal(reads, 3);
});
