import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";

const clientSource = fs.readFileSync(new URL("../lib/server/aos/ixiMosInternalClient.js", import.meta.url), "utf8");
const client = await import(`data:text/javascript;base64,${Buffer.from(clientSource).toString("base64")}`);
const session = { userId: "owner", displayName: "Test company" };
const existing = { principalId: "owner", entityId: "entity-one", accountId: "account-one", tenantId: "tenant-one", membershipId: "member-one" };
function fixture(t, respond) {
  const oldSecret = process.env.IXI_MOS_INTERNAL_SECRET;
  process.env.IXI_MOS_INTERNAL_SECRET = "transact-context-test-secret";
  t.after(() => { if (oldSecret === undefined) delete process.env.IXI_MOS_INTERNAL_SECRET; else process.env.IXI_MOS_INTERNAL_SECRET = oldSecret; });
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const request = { path: new URL(url).pathname.replace(/^\/ix-core\/mos\/v1/, ""), ...options };
    calls.push(request);
    const answer = respond(request, calls.length);
    return new Response(JSON.stringify(answer.body), { status: answer.status || 200 });
  });
  return calls;
}
const ok = body => ({ body: { ok: true, ...body } });
const denied = (status, code) => ({ status, body: { ok: false, error: { code, message: code } } });

test("existing TRAN$ACT access resolves through one signed read without onboarding or estate loading", async t => {
  const calls = fixture(t, () => ok({ context: existing }));
  const context = await client.resolveIxCoreTransactContext({ session });
  assert.equal(context.entityId, "entity-one");
  assert.deepEqual(calls.map(({ path, method }) => ({ path, method })), [{ path: "/aos/context", method: "GET" }]);
  assert.equal(calls[0].headers["X-IXI-Internal-Principal-Id"], "owner");
  assert.ok(calls[0].headers["X-IXI-Internal-Signature"]);
});

test("company display reads only the resolved Entity and rejects mismatched identity", async t => {
  const calls = fixture(t, ({ path, headers }, count) => {
    if (path === "/aos/context") return ok({ context: existing });
    assert.equal(path, "/entities/entity-one");
    assert.equal(headers["X-IXI-Internal-Principal-Id"], "owner");
    assert.equal(headers["X-IXI-Internal-Entity-Id"], "entity-one");
    return ok({ entity: { entityId: count === 2 ? "entity-one" : "other-company", displayName: "Test company" } });
  });
  const result = await client.resolveIxCoreTransactContext({ session, includeEntity: true });
  assert.equal(result.entity.displayName, "Test company");
  await assert.rejects(client.resolveIxCoreTransactContext({ session, includeEntity: true, allowOnboarding: true }), { code: "IXI_TRANSACT_ENTITY_CONTEXT_INVALID" });
  assert.equal(calls.filter(call => call.method !== "GET").length, 0);
});

test("only explicitly allowed first entry with a missing account invokes governed onboarding", async t => {
  const calls = fixture(t, ({ path, method }) => {
    if (path === "/aos/context") return denied(404, "AOS_ACCOUNT_NOT_FOUND");
    assert.equal(path, "/aos/onboarding/bootstrap");
    assert.equal(method, "POST");
    return ok({ environment: { entity: { entityId: "new-entity" } } });
  });
  await assert.rejects(client.resolveIxCoreTransactContext({ session }), { code: "AOS_ACCOUNT_NOT_FOUND" });
  assert.equal(calls.length, 1);
  const result = await client.resolveIxCoreTransactContext({ session, allowOnboarding: true });
  assert.equal(result.entityId, "new-entity");
  assert.equal(calls.length, 3);
});

test("denials, missing routes, missing Entities and outages never provision or bypass authority", async t => {
  let failure;
  const calls = fixture(t, () => denied(...failure));
  for (failure of [[401, "AUTH_REQUIRED"], [403, "AOS_CONTEXT_MEMBERSHIP_REQUIRED"], [404, "ENTITY_NOT_FOUND"], [404, "ROUTE_NOT_FOUND"], [503, "UNAVAILABLE"]]) {
    await assert.rejects(client.resolveIxCoreTransactContext({ session, allowOnboarding: true }), error => error.status === failure[0] && error.code === failure[1]);
  }
  assert.equal(calls.length, 5);
  assert.ok(calls.every(call => call.path === "/aos/context" && call.method === "GET"));
});

test("each request rechecks membership and cannot reuse authority after revocation", async t => {
  const calls = fixture(t, (_, count) => count === 1 ? ok({ context: existing }) : denied(403, "AOS_CONTEXT_MEMBERSHIP_REQUIRED"));
  await client.resolveIxCoreTransactContext({ session });
  await assert.rejects(client.resolveIxCoreTransactContext({ session }), { status: 403 });
  await assert.rejects(client.resolveIxCoreTransactContext({ session: {} }), { status: 401 });
  assert.equal(calls.length, 2);
});

function proxy(path, dependencies) {
  const url = new URL(path, import.meta.url);
  const source = fs.readFileSync(url, "utf8")
    .replace('import("../server/aos/resolveAosBrowserSession")', "Promise.resolve(dependencies.session)")
    .replace('import("../server/aos/ixiMosInternalClient")', "Promise.resolve(dependencies.client)");
  const module = { exports: {} };
  new Function("require", "module", "dependencies", source)(createRequire(url), module, dependencies);
  return module.exports;
}
const response = () => ({ headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });

test("Financial and Freight gateways use fresh server-resolved identity and preserve command envelopes", async t => {
  t.mock.method(console, "info", () => {});
  for (const service of ["Financial", "Freight"]) {
    let contextInput, upstream;
    const dependencies = {
      session: { resolveAosBrowserSession: async () => session },
      client: {
        resolveIxCoreTransactContext: async input => { contextInput = input; return { entityId: "entity-one" }; },
        [`requestIxCore${service}`]: async input => { upstream = input; return { ok: true, data: {} }; }
      }
    };
    const lower = service.toLowerCase();
    const { [`proxyIXI${service}Request`]: request } = proxy(`../lib/ixi-${lower}/ixi${service}Proxy.js`, dependencies);
    const req = { method: "POST", headers: { host: "app.test", origin: "https://app.test" } };
    const res = response();
    const body = { commandId: "repeatable-command", expectedRevision: 8 };
    await request({ req, res, path: service === "Financial" ? "/financial/documents/example" : "orders/example/amend", method: "POST", body });
    assert.equal(res.code, 200);
    assert.equal(contextInput.session, session);
    assert.ok(!contextInput.allowOnboarding);
    assert.equal(upstream.principalId, "owner");
    assert.equal(upstream.entityId, "entity-one");
    assert.deepEqual(upstream.body, body);
    assert.match(res.headers["Server-Timing"], /ixi-context;dur=/);
    assert.match(res.headers["Cache-Control"], /no-store/);
  }
});

test("gateway membership failure stops before any Financial data read", async t => {
  t.mock.method(console, "info", () => {});
  let reads = 0;
  const { proxyIXIFinancialRequest: request } = proxy("../lib/ixi-financial/ixiFinancialProxy.js", {
    session: { resolveAosBrowserSession: async () => session },
    client: {
      resolveIxCoreTransactContext: async () => { throw Object.assign(new Error("denied"), { status: 403 }); },
      requestIxCoreFinancial: async () => { reads++; }
    }
  });
  const res = response();
  await request({ req: { method: "GET", headers: {} }, res, path: "/financial/access-context", includeOperatingContext: true });
  assert.equal(res.code, 403);
  assert.equal(reads, 0);
});

test("only the Financial access entry permits onboarding and attaches canonical company display", async t => {
  t.mock.method(console, "info", () => {});
  const inputs = [];
  const { proxyIXIFinancialRequest: request } = proxy("../lib/ixi-financial/ixiFinancialProxy.js", {
    session: { resolveAosBrowserSession: async () => session },
    client: {
      resolveIxCoreTransactContext: async input => {
        inputs.push(input);
        return { entityId: "entity-one", entity: { entityId: "entity-one", displayName: "Test company", privateFields: { secret: true } } };
      },
      requestIxCoreFinancial: async () => ({ ok: true, data: { defaults: { entityPassportId: "IXICOMPANY" } } })
    }
  });
  const res = response();
  await request({ req: { method: "GET", headers: {} }, res, path: "/financial/access-context", includeOperatingContext: true });
  assert.equal(inputs[0].includeEntity, true);
  assert.equal(inputs[0].allowOnboarding, true);
  assert.equal(res.body.data.operatingContext.entity.entityId, "entity-one");
  assert.equal(res.body.data.operatingContext.entity.displayName, "Test company");
  assert.equal(res.body.data.operatingContext.entity.passportId, "IXICOMPANY");
  assert.equal(res.body.data.operatingContext.entity.privateFields, undefined);
  await request({ req: { method: "GET", headers: {} }, res: response(), path: "/financial/documents", includeOperatingContext: true });
  assert.equal(inputs[1].allowOnboarding, false);
});

test("gateway timeout still rejects stalled calls and cancels the timer after a completed request", async t => {
  const require = createRequire(import.meta.url);
  const { withIXIGatewayTimeout } = require("../lib/ixi-financial/ixiGatewayTiming.js");
  const clear = t.mock.method(globalThis, "clearTimeout");
  const options = { timeoutMs: 10, code: "UPSTREAM_TIMEOUT", message: "timed out" };
  assert.equal(await withIXIGatewayTimeout(async () => "ready", options), "ready");
  assert.equal(clear.mock.callCount(), 1);
  await assert.rejects(withIXIGatewayTimeout(() => new Promise(() => {}), options), { code: "UPSTREAM_TIMEOUT", status: 502 });
  assert.equal(clear.mock.callCount(), 2);
});
