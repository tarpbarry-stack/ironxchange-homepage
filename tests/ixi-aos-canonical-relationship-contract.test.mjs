import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = file => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("browser gateway exposes only the governed relationship commands and reads", () => {
  const gateway = read("pages/api/aos/mos/[...path].js");

  assert.match(gateway, /pattern: \/\^\\\/relationships\$\//u);
  assert.match(gateway, /pattern: \/\^\\\/relationships\\\/\[\^\/\]\+\\\/end\$\//u);
  assert.match(gateway, /relationship-graph/u);
  assert.match(gateway, /Idempotency-Key/u);
  assert.match(gateway, /If-Match/u);
});

test("relationship client requires IX Core canonical readback", () => {
  const client = read("lib/mos/ixiMosBrowserGatewayClient.js");

  assert.match(client, /createMosRelationship/u);
  assert.match(client, /fetchMosObjectRelationships\(sourceObjectId/u);
  assert.match(client, /IXI_AOS_RELATIONSHIP_READBACK_REQUIRED/u);
  assert.match(client, /X-IXI-Expected-Revision/u);
});

test("AOS drop waits for a named canonical relationship before changing layout", () => {
  const work = read("pages/aos/work.js");
  const dialog = read("components/ixi-mos/relationships/IXIRelationshipDropDialog.jsx");

  assert.match(work, /setPendingRelationship\(\{/u);
  assert.match(work, /await createMosRelationship\(\{/u);
  assert.match(work, /await saveWorkspaceLayout\(pendingRelationship\.nextPlacements\)/u);
  assert.doesNotMatch(
    work.match(/if \(\s*dropIntent === "on"[\s\S]*?\n\}/u)?.[0] || "",
    /setWorkspacePlacements\(\s*candidatePlacements/u
  );
  assert.match(dialog, /IX Core will not rename it or infer a different meaning/u);
});

test("AOS reload and Container recall use canonical relationships", () => {
  const loader = read("lib/mos/loadIXIMosEnvironment.js");
  const registry = read("components/ixi-mos/workspace/useIXIAosWorkspaceRegistry.js");
  const work = read("pages/aos/work.js");

  assert.match(loader, /Array\.isArray\(environment\.relationships\)/u);
  assert.match(registry, /buildRelatedObjectsMap\(aosObjects, relationships\)/u);
  assert.match(registry, /relatedObjectsByObject\.get\(objectId\)/u);
  assert.match(work, /setAosRelationships/u);
  assert.match(work, /sourceId === containerId/u);
  assert.match(work, /targetId === containerId/u);
});
