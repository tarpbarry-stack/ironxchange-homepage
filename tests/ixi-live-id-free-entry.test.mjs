import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  resolveIXILaunchSelection
} from "../lib/listings/resolveIXILaunchSelection.mjs";

function read(path) {
  return fs.readFileSync(
    new URL(`../${path}`, import.meta.url),
    "utf8"
  );
}

const listings = [
  { id: "machine-544k", title: "2017 Deere 544K II" },
  { id: { uuid: "machine-744k" }, title: "2017 Deere 744K II" }
];

test("bare /live selects the first owned machine without requiring an id", () => {
  assert.equal(
    resolveIXILaunchSelection({ listings }),
    listings[0]
  );
});

test("an explicit machine selection still resolves inside the same Launch environment", () => {
  assert.equal(
    resolveIXILaunchSelection({
      requestedListingId: "machine-744k",
      listings
    }),
    listings[1]
  );
});

test("unknown and empty inventories fail closed", () => {
  assert.equal(
    resolveIXILaunchSelection({
      requestedListingId: "missing",
      listings
    }),
    null
  );

  assert.equal(
    resolveIXILaunchSelection({ listings: [] }),
    null
  );
});

test("the /live route does not redirect bare entry to Inventory or synthesize an id URL", () => {
  const source = read("pages/live.js");

  assert.doesNotMatch(
    source,
    /router\.replace\(\s*["']\/account\/my-listings-v2["']/u
  );
  assert.doesNotMatch(
    source,
    /router\.replace\(\s*`\/live\?id=/u
  );
  assert.match(source, /resolveIXILaunchSelection/u);
});

test("the /live entrance loads the governed owned inventory instead of filtering the public catalogue", () => {
  const source = read("pages/live.js");

  assert.match(source, /loadIXIOwnedListings/u);
  assert.match(source, /includePublicListings:\s*false/u);
  assert.doesNotMatch(
    source,
    /\(environment\.listings \|\| \[\]\)\.filter/u
  );
});
