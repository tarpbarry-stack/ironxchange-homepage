import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const tick = () => new Promise(resolve => setImmediate(resolve));
const gate = { skip: process.env.IXI_CORE_CONTRACT_ROOT ? false : 'Requires the pinned paired backend.' };
async function harness(t, mocks) {
  const require = createRequire(import.meta.url);
  const coreRequire = createRequire(path.join(path.resolve(process.env.IXI_CORE_CONTRACT_ROOT), 'package.json'));
  const { JSDOM } = coreRequire('jsdom');
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://period-test.invalid' });
  const prior = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true })) {
    prior.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  const React = require('react');
  const root = require('react-dom/client').createRoot(document.getElementById('root'));
  t.after(async () => { await React.act(() => root.unmount()); dom.window.close(); for (const [key, desc] of prior) { if (desc) Object.defineProperty(globalThis, key, desc); else delete globalThis[key]; } });
  const repo = fileURLToPath(new URL('../', import.meta.url));
  const cache = new Map();
  function load(file) {
    const full = path.resolve(repo, file);
    if (cache.has(full)) return cache.get(full).exports;
    const module = { exports: {} }; cache.set(full, module);
    const { code } = require('next/dist/build/swc').transformSync(fs.readFileSync(full, 'utf8'), { filename: full, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
    new Function('require', 'module', 'exports', code)(name => {
      if (mocks[path.basename(name)]) return mocks[path.basename(name)];
      if (name.startsWith('.')) {
        const target = path.resolve(path.dirname(full), name);
        return load(['', '.js', '.jsx', '.mjs'].map(ext => target + ext).find(p => fs.existsSync(p)));
      }
      return createRequire(full)(name);
    }, module, module.exports);
    return module.exports;
  }
  return { React, dom, load,
    render: element => React.act(async () => { root.render(element); await tick(); }),
    reason: value => React.act(async () => { const area = document.querySelector('textarea'); Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, 'value').set.call(area, value); area.dispatchEvent(new dom.window.Event('input', { bubbles: true })); await tick(); }),
    submit: (times = 1) => React.act(async () => { for (let i = 0; i < times; i++) document.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); await tick(); })
  };
}
const props = { entityPassportId: 'entity-a', period: '2026-08', currency: 'USD', closeDocumentId: 'close-a', allowed: true };

test('reopen requires authority and reason; same-frame repeated submission sends one audited command', gate, async t => {
  const calls = []; let finish;
  const h = await harness(t, { IXITransactDesktopClient: { reopenIXITransactPeriod: input => { calls.push(input); return new Promise(resolve => { finish = resolve; }); } } });
  const Reopen = h.load('components/ixi-transact-dashboard/IXITransactPeriodReopen.jsx').default;
  await h.render(h.React.createElement(Reopen, { ...props, allowed: false }));
  await h.submit(); assert.equal(calls.length, 0); assert.equal(document.querySelector('textarea').disabled, true);
  await h.render(h.React.createElement(Reopen, props)); await h.submit(); assert.equal(calls.length, 0);
  await h.reason('Owner directs reopening the unauthorized closure.'); await h.submit(2);
  assert.equal(calls.length, 1); assert.equal(calls[0].period, '2026-08');
  assert.equal(calls[0].idempotencyKey, 'ixi-gl-period-reopen:entity-a:2026-08:close-a');
  assert.equal(calls[0].entityPassportId, undefined); assert.equal(calls[0].actorPassportId, undefined);
  await h.React.act(async () => { finish({ ok: true }); await tick(); });
  assert.match(document.querySelector('[role="status"]').textContent, /Reopen saved/);
});

test('uncertain write retains reason and command identity; refresh failure cannot resubmit a confirmed reopen', gate, async t => {
  const calls = [];
  const h = await harness(t, { IXITransactDesktopClient: { reopenIXITransactPeriod: async input => { calls.push(input); if (calls.length === 1) throw new Error('Connection interrupted'); return { ok: true }; } } });
  const Reopen = h.load('components/ixi-transact-dashboard/IXITransactPeriodReopen.jsx').default;
  await h.render(h.React.createElement(Reopen, { ...props, onCommitted: async () => { throw new Error('Read failed'); } }));
  await h.reason('Owner requests correction of the period closure.'); await h.submit();
  assert.match(document.querySelector('textarea').value, /Owner requests/);
  await h.submit(); assert.equal(calls.length, 2); assert.equal(calls[0].commandId, calls[1].commandId); assert.equal(calls[0].idempotencyKey, calls[1].idempotencyKey);
  assert.match(document.querySelector('[role="alert"]').textContent, /Reopen saved/);
  await h.submit(); assert.equal(calls.length, 2);
});

test('ledger never labels an unloaded period open or reuses another period close evidence', gate, async t => {
  const pending = new Map();
  const h = await harness(t, { IXITransactDashboardClient: {
    loadIXITransactGL: ({ period }) => new Promise(resolve => pending.set(period, resolve)),
    loadIXITransactChartOfAccounts: async () => ({ ok: true, data: { accounts: [] } })
  } });
  const Ledger = h.load('components/ixi-transact-dashboard/IXITransactGLWorkspace.jsx').default;
  await h.render(h.React.createElement(Ledger, { period: '2026-08', canReopenPeriod: true }));
  assert.match(document.querySelector('.command-actions').textContent, /LOADING/); assert.equal(document.querySelector('form'), null);
  await h.React.act(async () => { pending.get('2026-08')({ ok: true, data: { entityPassportId: 'entity-a', projection: { currency: 'USD', period: { period: '2026-08', status: 'closed', closed: true, closeDocumentId: 'close-a' } } } }); await tick(); });
  assert.equal(document.querySelector('form').getAttribute('aria-label'), 'Reopen accounting period 2026-08');
  await h.render(h.React.createElement(Ledger, { period: '2026-09', canReopenPeriod: true }));
  assert.equal(document.querySelector('form'), null); assert.equal(document.querySelector('.close-evidence'), null);
  assert.match(document.querySelector('.command-actions').textContent, /LOADING/);
  await h.React.act(async () => { pending.get('2026-09')({ ok: true, data: { entityPassportId: 'entity-a', projection: { currency: 'USD', period: { period: '2026-09', status: 'open', closed: false } } } }); await tick(); });
  assert.equal(document.querySelector('form'), null); assert.match(document.querySelector('.command-actions .status-pill').textContent, /^OPEN$/);
});
