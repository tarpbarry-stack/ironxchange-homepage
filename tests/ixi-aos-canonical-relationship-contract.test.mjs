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

test("container placement uses the governed IX Core command and canonical readback", () => {
  const client = read("lib/mos/ixiMosBrowserGatewayClient.js");

  assert.match(client, /commitMosContainerPlacement/u);
  assert.match(client, /aos-container-place/u);
  assert.match(client, /await fetchMosObject\(objectId/u);
  assert.match(client, /canonicalObject\.directContainerId/u);
  assert.match(client, /IXI_AOS_CONTAINER_READBACK_REQUIRED/u);
});

test("AOS operational container drops change workspace placement without inventing a relationship", () => {
  const work = read("pages/aos/work.js");

  const dropBranch = work.match(
    /if \(\s*dropIntent === "on"[\s\S]*?\n\}/u
  )?.[0] || "";

  assert.match(dropBranch, /nextPlacements\s*=\s*moveObjectToWorkspaceSurface/u);
  assert.doesNotMatch(work, /IXIRelationshipDropDialog/u);
  assert.doesNotMatch(work, /setPendingRelationship/u);
  assert.doesNotMatch(work, /RELATIONSHIP NOT CREATED/u);
  assert.match(work, /await commitMosContainerPlacement\(\{/u);
  assert.match(work, /destinationContainerId:\s*targetWorkspaceObjectId/u);
  assert.match(work, /targetWorkspaceObject\?\.capabilities\?\.canContain === true/u);
  assert.match(work, /createdFrom: "aos-work-drop"/u);
  assert.match(work, /getCanonicalAosPassportId\(object\) === workspacePassportId/u);
});

test("AOS relationships remain available without becoming container membership", () => {
  const loader = read("lib/mos/loadIXIMosEnvironment.js");
  const registry = read("components/ixi-mos/workspace/useIXIAosWorkspaceRegistry.js");
  const work = read("pages/aos/work.js");

  assert.match(loader, /Array\.isArray\(environment\.relationships\)/u);
  assert.match(registry, /Canonical MOS child membership comes ONLY from/u);
  assert.match(registry, /directChildrenByParent\s*\.get\(objectId\)/u);
  assert.doesNotMatch(registry, /buildRelatedObjectsMap/u);
  assert.doesNotMatch(work, /setAosRelationships/u);
});

test("owned machine cards expose the full non-interactive card as the pointer drag surface", () => {
  const card = read("components/ixi-machine-card/private/PrivateListingCard.js");

  assert.match(card, /beginCardDragFromNonInteractiveSurface/u);
  assert.match(card, /onPointerDown=\{beginCardDragFromNonInteractiveSurface\}/u);
  assert.match(card, /button,input,textarea,select/u);
  assert.match(card, /onDndPointerDown\(event\)/u);
});
