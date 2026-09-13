import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");
async function sourceUrl(path) {
  let source = await read(path);
  for (const match of [...source.matchAll(/from ["'](\.[^"']+)["']/g)]) {
    const resolved = new URL(match[1], new URL(`../${path}`, import.meta.url));
    const dependency = await readFile(resolved, "utf8");
    source = source.replace(match[0], `from "data:text/javascript;base64,${Buffer.from(dependency).toString("base64")}"`);
  }
  return `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
}
const load = async path => import(await sourceUrl(path));
const routeFile = "pages/api/ixi/financial/documents/[financialDocumentId]/history.js";
const { loadIXIFreightHistory } = await load("components/ixi-aos/transact/modules/freight/IXIFreightHistory.js");
const { loadIXIAosFinancialHistory } = await load("components/ixi-aos/financial-runtime/IXIAosFinancialReadClient.js");
async function route(proxy) {
  const source = await read(routeFile);
  return new Function("require", source.replace("export default async function handler", "return async function handler"))(() => ({ proxyIXIFinancialRequest: proxy }));
}
function response() {
  return { code: 200, headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.code = code; return this; }, json(payload) { this.payload = payload; return this; } };
}

test("the History client resolves an actual web route to the existing authorized Financial proxy", async t => {
  const history = [{ revision: 1, operation: "create" }, { revision: 2, operation: "replace" }];
  const handler = await route(async ({ req, res, path, method }) => {
    assert.equal(method, "GET");
    assert.equal(path, "/financial/documents/bill%2Fone/history");
    assert.equal(req.headers.cookie, "test-session");
    return res.json({ ok: true, data: { history } });
  });
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/ixi/financial/documents/bill%2Fone/history");
    assert.equal(options.credentials, "include");
    const res = response();
    await handler({ method: "GET", query: { financialDocumentId: "bill/one" }, headers: { cookie: "test-session" } }, res);
    return new Response(JSON.stringify(res.payload), { status: res.code });
  });
  assert.deepEqual(await loadIXIAosFinancialHistory("bill/one"), history);
});

test("the History route rejects writes and missing or ambiguous document IDs without reaching the proxy", async () => {
  const handler = await route(() => { assert.fail("Unexpected proxy request"); });
  for (const method of ["POST", "PATCH", "DELETE"]) {
    const res = response(); await handler({ method, query: { financialDocumentId: "bill" } }, res);
    assert.equal(res.code, 405); assert.equal(res.headers.Allow, "GET");
  }
  for (const id of [undefined, " ", ["bill", "other"]]) {
    const res = response(); await handler({ method: "GET", query: { financialDocumentId: id } }, res);
    assert.equal(res.code, 400);
  }
});

test("unavailable Bill history retains successful sources and a successful retry clears incomplete status", async () => {
  const order = { identity: { freightOrderId: "FO-1" }, financialRecords: ["bill-1", "bill-2", "bill-1"].map(financialDocumentId => ({ financialDocument: { financialDocumentId } })) };
  const events = [{ eventType: "freight.created" }];
  const calls = [];
  const first = await loadIXIFreightHistory({ order, loadEvents: async () => events, loadFinancialHistory: async id => {
    calls.push(id); if (id === "bill-2") throw new Error("Temporary failure"); return [{ revision: 1, financialDocumentId: id }];
  } });
  assert.equal(first.incomplete, true); assert.deepEqual(first.events, events);
  assert.deepEqual(calls, ["bill-1", "bill-2"]); assert.equal(first.financialHistory.length, 1);
  const retry = await loadIXIFreightHistory({ order, loadEvents: async () => events, loadFinancialHistory: async id => [{ revision: 1, financialDocumentId: id }] });
  assert.equal(retry.incomplete, false); assert.equal(retry.financialHistory.length, 2);
  const requestFailure = await loadIXIFreightHistory({ order, loadEvents: async () => { throw new Error("Unavailable"); }, loadFinancialHistory: async id => [{ financialDocumentId: id }] });
  assert.equal(requestFailure.incomplete, true); assert.equal(requestFailure.financialHistory.length, 2);
});

test("cancelled history reads cannot become a completed view for another request", async () => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(loadIXIFreightHistory({ order: { identity: { freightOrderId: "FO-1" } }, signal: controller.signal, loadEvents: async () => [], loadFinancialHistory: async () => [] }), { name: "AbortError" });
});

test("non-JSON history failures retain their HTTP status and give a retry instruction", async t => {
  t.mock.method(globalThis, "fetch", async () => new Response("<html>Not found</html>", { status: 404 }));
  await assert.rejects(loadIXIAosFinancialHistory("bill"), error => error.code === "IXI_FINANCIAL_BAD_RESPONSE" && error.status === 404 && /history could not load.*retry/i.test(error.message));
});
