import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = file => readFileSync(new URL(file, root), "utf8");

test("Ticket browser gateway resolves the trusted session and AOS Entity", () => {
  const proxy = read("lib/ixi-tickets/ixiTicketProxy.js");

  assert.match(proxy, /resolveAosBrowserSession\(req, res\)/u);
  assert.match(proxy, /resolveIxCoreAosContext\(\{ session \}\)/u);
  assert.match(proxy, /requestIxCoreTicket\(\{/u);
  assert.match(proxy, /principalId: session\.userId/u);
  assert.match(proxy, /entityId: context\.entityId/u);
  assert.doesNotMatch(proxy, /ticket-single-owner-build/u);
});

test("Ticket internal request signs the complete canonical path and identity", () => {
  const client = read("lib/server/aos/ixiMosInternalClient.js");

  assert.match(client, /export async function requestIxCoreTicket/u);
  assert.match(client, /const targetPath = `\/tickets\/v1\$\{/u);
  assert.match(client, /principalId: normalizedPrincipalId/u);
  assert.match(client, /entityId: normalizedEntityId/u);
  assert.match(client, /"X-IXI-Internal-Signature": signature/u);
  assert.match(client, /signal: AbortSignal\.timeout\(timeoutMs\)/u);
});
