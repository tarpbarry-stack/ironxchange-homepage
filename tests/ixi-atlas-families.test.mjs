import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { atlasFamilies } from "../lib/ixi-atlas/familyRegistry.mjs";
import { createFamilySample, patchSampleFacts, sampleDisposition } from "../lib/ixi-atlas/familyDemo.mjs";
import { atlasFamilyHref, resolveAtlasView, searchAtlas } from "../lib/ixi-atlas/navigation.mjs";
import { atlasHelpHref } from "../lib/ixi-atlas/helpRoutes.mjs";
import { isAosOwnedMachine } from "../lib/listings/IXIAosOwnedInventoryPolicy.mjs";

test("header entry points land in the correct family and omit private context", () => {
  for (const [pathname, family] of [["/account/my-listings-v2?record=secret", "private"], ["/auctions/event?company=secret", "auction"], ["/url-import#token", "reference"]]) {
    assert.equal(atlasHelpHref({ pathname }), atlasFamilyHref(family));
    assert.deepEqual(resolveAtlasView({ family }), { kind: "family", family, unavailable: false });
  }
  assert.equal(resolveAtlasView({ family: ["private", "auction"] }).unavailable, true);
  assert.equal(atlasFamilyHref("../../secret"), "/atlas?family=private");
});
test("URL references use the production ownership policy before and after edits", () => {
  const reference = createFamilySample("reference");
  assert.equal(isAosOwnedMachine(reference), false);
  const updated = patchSampleFacts(reference, { hours: "4900", ownershipStatus: "owned", ownershipRole: "owner", passportId: "different", objectId: "different", machineAccess: "public", publicData: { ownershipRole: "owner" } });
  assert.equal(isAosOwnedMachine(updated), false);
  assert.equal(updated.hours, "4900");
  assert.equal(updated.publicData.hours, "4900");
  assert.deepEqual(updated.canonicalIdentity, reference.canonicalIdentity);
  for (const key of ["passportId", "objectId", "machineAccess", "ownershipRole", "ownershipStatus", "sourceUrl"]) assert.equal(updated[key], reference[key]);
  assert.equal(reference.hours, 4812);
  assert.equal(isAosOwnedMachine(createFamilySample("private")), true);
});
test("each practice session starts fresh and edits cannot contaminate another family", () => {
  const first = createFamilySample("private");
  const edited = patchSampleFacts(first, { description: "Changed", hours: 9000 });
  const second = createFamilySample("private");
  assert.equal(edited.description, "Changed");
  assert.deepEqual(first, second);
  assert.notEqual(first.publicData, second.publicData);
  assert.equal(createFamilySample("auction").hours, 4812);
  assert.equal(createFamilySample("reference").hours, 4812);
});
test("family lessons expose all four faces and remain discoverable across the Atlas", () => {
  for (const family of atlasFamilies) {
    assert.equal(family.faces.length, 4);
    assert.equal(family.faceNames.length, 4);
    assert.ok(searchAtlas(family.title).some(result => result.href === atlasFamilyHref(family.id)));
  }
  assert.ok(searchAtlas("closeout").some(result => result.href === "/atlas?family=auction"));
  assert.match(sampleDisposition("hard-delete"), /Passport is preserved/);
  assert.equal(sampleDisposition("unexpected"), "No disposition recorded.");
});
test("practice capability blocks private writes, action bridges and financial mounts", async () => {
  const read = path => readFile(new URL(`../components/${path}`, import.meta.url), "utf8");
  const runtime = await read("ixi-machine-card/private/IXIOwnedPrivateListingRuntime.jsx");
  const seller = await read("ixi-machine-object/IXISellerMachineObjectFace2.js");
  const rail = await read("IXIMachineRail.js");
  assert.match(runtime, /demo \? \{ demonstration: true \} : await updateMachineFacts/);
  assert.match(runtime, /!demo && transactOpen/);
  assert.match(runtime, /if \(!ownerActionBridgeKey \|\| demo\) return undefined/);
  assert.match(seller, /const bridged = demo \? \{\} : getOwnedPrivateActions/);
  for (const action of ["View listing", "Launch listing", "Delete listing"]) assert.ok(seller.includes(`demo.onAction("${action}"`));
  assert.match(seller, /if \(demo\) \{ demo.onAction\(isPaused/);
  assert.match(rail, /demo\) demo.onAction\("Send machine"\)/);
});
