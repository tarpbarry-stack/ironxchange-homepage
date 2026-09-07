import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = file => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("browser gateway exposes only the governed relationship commands and reads", () => {
  const gateway = read("pages/api/aos/mos/[...path].js");

  assert.match(gateway, /pattern: \/\^\\\/relationships\$\//u);
  assert.match(gateway, /pattern: \/\^\\\/relationships\\\/\[\^\/\]\+\\\/end\$\//u);
  assert.match(gateway, /pattern: \/\^\\\/relationships\\\/\[\^\/\]\+\\\/order\$\//u);
  assert.match(gateway, /pattern: \/\^\\\/identity\\\/admit\$\//u);
  assert.match(gateway, /relationship-graph/u);
  assert.match(gateway, /Idempotency-Key/u);
  assert.match(gateway, /If-Match/u);
});

test("relationship client requires IX Core canonical readback", () => {
  const client = read("lib/mos/ixiMosBrowserGatewayClient.js");

  assert.match(client, /createMosRelationship/u);
  assert.match(client, /fetchMosObjectRelationships\(targetObjectId/u);
  assert.match(client, /IXI_AOS_RELATIONSHIP_READBACK_REQUIRED/u);
  assert.match(client, /X-IXI-Expected-Revision/u);
  assert.match(client, /sourcePassportId/u);
  assert.match(client, /targetPassportId/u);
  assert.match(client, /orderMosRelationship/u);
});

test("AOS operational drops preserve one visual identity and create a non-exclusive relationship", () => {
  const work = read("pages/aos/work.js");

  const dropBranch = work.match(
    /if \(\s*dropIntent === "on"[\s\S]*?\n\}/u
  )?.[0] || "";

  assert.match(dropBranch, /nextPlacements\s*=\s*moveObjectToWorkspaceSurface/u);
  assert.doesNotMatch(work, /IXIRelationshipDropDialog/u);
  assert.doesNotMatch(work, /setPendingRelationship/u);
  assert.doesNotMatch(work, /RELATIONSHIP NOT CREATED/u);
  assert.match(work, /const operation = controller\.connect\(\{/u);
  assert.match(work, /relationshipTransport: request => createAosMembershipRelationship\(\{/u);
  assert.match(
    read("components/ixi-mos/workspace/IXIAosWorkspaceSessionController.mjs"),
    /relationshipTransport\(\{[\s\S]*?commandId: operationId/u
  );
  assert.match(work, /ONE OBJECT \/ MANY RELATIONSHIPS \/ ONE VISUAL PLACEMENT/u);
  assert.match(work, /setWorkspacePlacements\([\s\S]*?nextPlacements/u);
  assert.match(work, /parentObjectId:\s*targetWorkspaceObjectId/u);
  assert.match(work, /parentPassportId/u);
  assert.match(work, /memberObjectId:\s*sourceObject\.objectId/u);
  assert.match(work, /memberPassportId/u);
  assert.match(work, /createAosRailOrderKey/u);
  assert.match(work, /targetWorkspaceObject\?\.entityId/u);
  assert.match(work, /aosWorkspaceAdmission\.resolveObject\(id\)/u);
  assert.match(work, /isAosDraftId\(dragId\)/u);
  assert.match(work, /SAVE THIS CARD BEFORE MOVING IT INTO ANOTHER CONTAINER/u);
  assert.match(work, /getCanonicalMosObjectForWorkspaceId\(dragId\)/u);
  assert.doesNotMatch(dropBranch, /directContainerId/u);
  assert.doesNotMatch(dropBranch, /setAosObjects/u);
  assert.doesNotMatch(dropBranch, /previousPlacements/u);
});

test("container drops can never provision or append a Machine", () => {
  const work = read("pages/aos/work.js");

  assert.doesNotMatch(work, /provisionListingMachine/u);
  assert.doesNotMatch(work, /sourceIsOwnedListing/u);
  assert.doesNotMatch(work, /IXI_AOS_MACHINE_PROVISIONING_READBACK_REQUIRED/u);
  assert.match(work, /MOVE BLOCKED · THE EXISTING IX CORE OBJECT COULD NOT BE RESOLVED/u);
  assert.match(read("lib/mos/ixiAosCanonicalAdmission.mjs"), /IXI_AOS_ALIAS_COLLISION/u);
});

test("governed rail membership replaces the emergency bridge atomically", () => {
  const loader = read("lib/mos/loadIXIMosEnvironment.js");
  const registry = read("components/ixi-mos/workspace/useIXIAosWorkspaceRegistry.js");
  const work = read("pages/aos/work.js");
  const bridge = read("lib/mos/IXIAosMembershipBridge.mjs");

  assert.match(loader, /Array\.isArray\(environment\.relationships\)/u);
  assert.match(loader, /environment\.railProjections/u);
  assert.match(registry, /getAosMembershipObjectIds/u);
  assert.match(registry, /getAosRailProjectionObjectIds/u);
  assert.doesNotMatch(registry, /legacyChildObjectIds/u);
  assert.match(bridge, /aos\.rail-membership\.v1/u);
  assert.match(bridge, /neutralContractAvailable:\s*true/u);
  assert.match(work, /setAosRelationships/u);
  for (const source of [loader, registry, work, bridge]) {
    assert.doesNotMatch(source, /["']contains["']/u);
  }
});

test("Private listing Passport fields participate in canonical identity resolution", () => {
  const passport = read("lib/mos/ixiAosPassportPresentation.mjs");

  assert.match(passport, /object\?\.attributes\?\.publicData/u);
  assert.match(passport, /publicData\?\.passportId/u);
  assert.match(passport, /publicData\?\.ixiMedia\?\.passportId/u);
});

test("owned machine cards expose the full non-interactive card as the pointer drag surface", () => {
  const card = read("components/ixi-machine-card/private/PrivateListingCard.js");

  assert.match(card, /beginCardDragFromNonInteractiveSurface/u);
  assert.match(card, /onPointerDown=\{beginCardDragFromNonInteractiveSurface\}/u);
  assert.match(card, /button,input,textarea,select/u);
  assert.match(card, /onDndPointerDown\(event\)/u);
});
