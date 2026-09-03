import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const card = fs.readFileSync(
  "components/ixi-machine-card/marketplace/MarketplaceListingCard.js",
  "utf8"
);
const formatters = fs.readFileSync(
  "lib/listingFormatters.js",
  "utf8"
);
const foundation = fs.readFileSync(
  "pages/mobile-foundation.js",
  "utf8"
);

test("production card keeps canonical slug navigation", () => {
  assert.match(card, /href=\{getListingHref\(listing, from\)\}/);
  assert.match(formatters, /const basePath =/);
  assert.match(formatters, /`\/listing\/\$\{descriptor\}--\$\{passportId\}`/);
  assert.match(formatters, /\?from=\$\{encodeURIComponent\(/);
});

test("mobile certification still uses the real production card", () => {
  assert.match(foundation, /import IXIMachineCard from/);
  assert.match(foundation, /<IXIMachineCard/);
  assert.doesNotMatch(foundation, /MobileListingCard|MobileMachineCard/);
});

test("slug round-trip tranche adds no duplicate mobile slug", () => {
  assert.equal(
    fs.existsSync("pages/listing-mobile"),
    false,
    "A separate mobile slug route must not exist"
  );
  assert.equal(
    fs.existsSync("pages/mobile-listing.js"),
    false,
    "A separate mobile listing page must not exist"
  );
});

test("certified full-width face behavior remains intact", () => {
  assert.match(foundation, /machineFace=\{machineFace\}/);
  assert.match(foundation, /onCycleMachineFace=\{cycleProductionMachineFace\}/);
  assert.match(foundation, /resolveIXIMobileSingleCardMetrics/);
});
