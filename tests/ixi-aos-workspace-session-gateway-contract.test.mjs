import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("authenticated browser gateway exposes only governed session placement routes", async () => {
  const gateway = await read("pages/api/aos/mos/[...path].js");
  assert.ok(gateway.includes('pattern: /^\\/aos\\/workspace-sessions$/'));
  assert.ok(gateway.includes('pattern: /^\\/aos\\/workspace-sessions\\/[^/]+$/'));
  assert.ok(gateway.includes('pattern: /^\\/aos\\/workspace-sessions\\/[^/]+\\/commands$/'));
  assert.ok(gateway.includes('pattern: /^\\/aos\\/workspace-sessions\\/[^/]+\\/end$/'));
  assert.match(gateway, /resolveAosBrowserSession/u);
  assert.match(gateway, /resolveIxCoreAosContext/u);
  assert.match(gateway, /headers\["If-Match"\]/u);
});

test("session client sends exact idempotency and revision envelopes", async () => {
  const client = await read("lib/mos/ixiMosBrowserGatewayClient.js");
  assert.match(client, /openAosWorkspaceSession/u);
  assert.match(client, /fetchAosWorkspaceSession/u);
  assert.match(client, /applyAosWorkspaceSessionCommand/u);
  assert.match(client, /"Idempotency-Key": command\.commandId/u);
  assert.match(client, /"X-IXI-Expected-Revision": String\(Number\(expectedRevision\)\)/u);
  assert.match(client, /expectedRevision: Number\(expectedRevision\)/u);
  assert.match(client, /credentials: "same-origin"/u);
});
