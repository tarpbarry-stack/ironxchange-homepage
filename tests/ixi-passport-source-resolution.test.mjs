import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { getPassportSharetribeListingId } from "../lib/passport/passportSources.mjs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Passport presentation follows the verified Sharetribe source instead of the primary AOS source", () => {
  const passport = {
    sourceType: "aos-object",
    sourceId: "object_f87604d6-0f6e-46d9-878b-d2fc374fd6bc",
    sources: [
      { sourceType: "aos-object", sourceId: "object_f87604d6-0f6e-46d9-878b-d2fc374fd6bc" },
      { sourceType: "sharetribe-listing", sourceId: "6aa98a67-ae94-45c1-9d9a-a237566ece24" }
    ]
  };

  assert.equal(
    getPassportSharetribeListingId(passport),
    "6aa98a67-ae94-45c1-9d9a-a237566ece24"
  );
});

test("Passport source resolution fails closed instead of treating an AOS Object as a listing", () => {
  assert.equal(getPassportSharetribeListingId({
    sourceType: "aos-object",
    sourceId: "object_f87604d6-0f6e-46d9-878b-d2fc374fd6bc"
  }), "");
});

test("global SEND resolves the canonical Passport source before loading and delivering", () => {
  const dialog = read("components/passport/PassportEmailDialog.jsx");
  const api = read("pages/api/marketplace/share-email.js");
  const machine = read("pages/api/machines/by-passport/[passportId].js");

  assert.match(dialog, /passportId,/u);
  assert.match(api, /resolvePassportSharetribeListingId\(requestedPassportId\)/u);
  assert.match(machine, /getPassportSharetribeListingId\(passport\)/u);
  assert.doesNotMatch(machine, /clean\(\s*passport\.sourceId\s*\)/u);
});
