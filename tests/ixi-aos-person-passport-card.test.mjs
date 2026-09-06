import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { resolveIXIAosOperatingCardNumber } from "../components/ixi-aos/card-runtime/IXIAosOperatingCardResolver.mjs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Person identity preserves deliberately selected Card 007 presentation metadata", () => {
  assert.equal(resolveIXIAosOperatingCardNumber({
    objectType: "person",
    cardTemplateSlug: "universal-object-007",
    metadata: { cardNumber: "007" }
  }), 7);

  assert.equal(resolveIXIAosOperatingCardNumber({
    definition: { objectType: "employee" },
    metadata: { cardNumber: 7 }
  }), 7);
});

test("Person template aliases preserve Card 007 while Profile Card 008 remains available", () => {
  assert.equal(resolveIXIAosOperatingCardNumber({ cardTemplateSlug: "employee-basic-007" }), 7);
  assert.equal(resolveIXIAosOperatingCardNumber({ cardTemplateSlug: "profile-layout-008" }), 8);
});

test("a Person Passport without presentation metadata defaults to Card 007", () => {
  assert.equal(resolveIXIAosOperatingCardNumber({
    objectType: "person",
    capabilities: { canContain: true, canCreate: true }
  }), 7);
});

test("identity precedence does not change non-Person cards", () => {
  assert.equal(resolveIXIAosOperatingCardNumber({
    objectType: "object",
    metadata: { cardNumber: 7 }
  }), 7);
  assert.equal(resolveIXIAosOperatingCardNumber({
    objectType: "container",
    metadata: { cardNumber: 17 }
  }), 17);
});

test("runtime binds Card 008 to the current Profile card", () => {
  const runtime = read("components/ixi-aos/card-runtime/IXIAosOperatingCardRuntime.jsx");
  const profile = read("components/ixi-aos/cards/008/IXIAosCard008Profile.jsx");
  const objectLayout = read("components/ixi-aos/cards/generic/IXIAosGenericObjectLayout007.jsx");
  assert.match(runtime, /8:\s*IXIAosCard008Profile/);
  assert.match(profile, /cardNumber=\{8\}/);
  assert.match(objectLayout, /data-card-number=\{String\(cardNumber\)\.padStart\(3, "0"\)\}/);
});

test("Person transactional capabilities drive the object toolbar with explicit denial precedence", () => {
  const presentation = read("components/ixi-aos/card-runtime/IXIAosSemanticObjectPresentation.js");
  assert.match(presentation, /capabilities\?\.canHaveExpenses/);
  assert.match(presentation, /capabilities\?\.canHaveWorkOrders/);
  assert.match(presentation, /capabilities\?\.canHaveJobTickets/);
  assert.match(presentation, /capabilities\?\.canHaveDocuments/);
  assert.match(presentation, /explicitTransact !== undefined/);
  assert.match(presentation, /explicitTransact === true/);
  assert.match(presentation, /isPerson/);
  assert.match(presentation, /capabilities\?\.canContain \|\|[\s\S]*?isPerson/);
});
