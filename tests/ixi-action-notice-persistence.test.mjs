import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("live action notices are excluded from persistent IXI machine patches", () => {
  const client = read("lib/ixiMachineStateClient.js");

  assert.match(client, /persistentPatchOf\(patch\)/u);
  assert.match(client, /persistentPatch\.actionNotice !== null/u);
  assert.match(client, /delete persistentPatch\.actionNotice/u);
});

test("remote hydration removes and tombstones notices saved by older clients", () => {
  const client = read("lib/ixiMachineStateClient.js");

  assert.match(client, /sanitizeRemoteState\(remotePayload\)/u);
  assert.match(client, /delete sanitizedRecord\.actionNotice/u);
  assert.match(client, /patch: \{ actionNotice: null \}/u);
});
