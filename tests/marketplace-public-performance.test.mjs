import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  compactMarketplaceDirectoryEntry,
  compactMarketplaceListing
} from "../lib/listings/compactMarketplaceListing.js";
import {
  createPublicMarketplaceCatalogueUrl,
  resolvePublicMarketplaceProjection
} from "../lib/listings/publicMarketplaceCatalogue.mjs";

function read(path) {
  return fs.readFileSync(
    new URL(`../${path}`, import.meta.url),
    "utf8"
  );
}

const PUBLIC_BOARD_SURFACES = [
  ["pages/index.js", "home"],
  ["pages/browse-v2.js", "browse-v2"],
  ["pages/saved.js", "saved"],
  ["pages/yard/index.js", "yard"],
  ["pages/yard/[sellerSlug].js", "seller-yard"],
  ["pages/yard-v2/[sellerSlug].js", "seller-yard-v2"]
];

test("public projection contract accepts only governed surfaces and shapes", () => {
  assert.deepEqual(
    resolvePublicMarketplaceProjection({
      surface: "yard",
      projection: "card"
    }),
    { surface: "yard", projection: "card" }
  );
  assert.deepEqual(
    resolvePublicMarketplaceProjection({
      surface: "listing-navigation",
      projection: "directory"
    }),
    { surface: "listing-navigation", projection: "directory" }
  );
  assert.equal(
    resolvePublicMarketplaceProjection({
      surface: "account",
      projection: "card"
    }),
    null
  );
  assert.throws(() =>
    createPublicMarketplaceCatalogueUrl({
      surface: "admin",
      projection: "card"
    })
  );
});

test("public catalogue reads cannot become creation boundaries", () => {
  const client = read("lib/listings/publicMarketplaceClient.js");
  const contract = read("lib/listings/publicMarketplaceCatalogue.mjs");

  for (const source of [client, contract]) {
    assert.doesNotMatch(source, /passport\/ensure|objects\/provision/u);
    assert.doesNotMatch(source, /method:\s*"POST"/u);
  }
});

test("card and directory projections remove heavy duplicate records", () => {
  const listing = {
    id: "listing-1",
    passportId: "IXI1",
    createdAt: "2026-09-08T00:00:00.000Z",
    title: "Customer Named Asset",
    category: "CUSTOMER WORD",
    imageUrl: "hero.jpg",
    imageCount: 12,
    link: "/listing/customer-named-asset",
    publicData: { duplicated: true },
    metadata: { duplicated: true },
    images: Array.from({ length: 12 }, (_, index) => `${index}.jpg`),
    imageObjects: [{ url: "hero.jpg" }]
  };

  const card = compactMarketplaceListing(listing);
  const directory = compactMarketplaceDirectoryEntry(listing);

  assert.equal(card.id, listing.id);
  assert.equal(card.passportId, listing.passportId);
  assert.equal(card.imageCount, 12);
  assert.equal("images" in card, false);
  assert.equal("publicData" in card, false);
  assert.deepEqual(directory, {
    id: listing.id,
    passportId: listing.passportId,
    createdAt: listing.createdAt,
    title: listing.title,
    link: listing.link
  });
});

test("every public card board uses compact reads and progressive rendering", () => {
  for (const [path, surface] of PUBLIC_BOARD_SURFACES) {
    const source = read(path);

    assert.match(
      source,
      /progressiveCardRendering=\{true\}/u,
      `${path} must batch card rendering`
    );

    if (path === "pages/index.js" || path.includes("yard-v2")) {
      assert.match(
        source,
        new RegExp(`surface:\\s*"${surface}"`, "u")
      );
    } else {
      assert.match(source, /publicMarketplacePerformance:\s*true/u);
      assert.match(
        source,
        new RegExp(`publicMarketplaceSurface:\\s*"${surface}"`, "u")
      );
    }

    assert.doesNotMatch(
      source,
      /fetch\(\s*"\/api\/listings"/u,
      `${path} must not fetch the legacy full catalogue`
    );
  }
});

test("single-machine public routes do not enumerate the catalogue", () => {
  const listing = read("pages/listing/[slug].js");
  const passport = read("pages/p/[passportId].js");
  const inquire = read("pages/inquire.js");
  const theater = read("pages/theater.js");

  assert.match(listing, /projection:\s*"directory"/u);
  assert.match(listing, /loadIXIListingDetails/u);
  assert.match(passport, /\/api\/machines\/by-passport\//u);
  assert.match(passport, /adaptMachineFilePayload/u);
  assert.match(inquire, /loadIXIListingDetails/u);
  assert.match(theater, /publicMarketplaceSurface:\s*"theater"/u);
  assert.match(theater, /loadTheaterMachineDetails/u);

  for (const source of [listing, passport, inquire, theater]) {
    assert.doesNotMatch(source, /fetch\(\s*"\/api\/listings"/u);
  }
});

test("invalid projection parameters fail closed instead of returning the full catalogue", () => {
  const api = read("pages/api/listings.js");

  assert.match(api, /Unsupported Marketplace catalogue projection/u);
  assert.match(api, /return res\.status\(400\)/u);
});

test("legacy Browse routes converge on Browse V2 without breaking old origin links", () => {
  const config = read("next.config.js");
  const listing = read("pages/listing/[slug].js");

  assert.match(config, /source:\s*"\/browse"[\s\S]*?destination:\s*"\/browse-v2"/u);
  assert.match(listing, /from === "browse" \|\| from === "browser"/u);
  assert.doesNotMatch(listing, /href="\/browse"/u);
});

test("private and operational surfaces retain their dedicated full-data paths", () => {
  assert.match(read("pages/account.js"), /fetch\("\/api\/listings"\)/u);
  assert.match(read("pages/admin-daddy.js"), /fetch\("\/api\/listings"\)/u);
  assert.match(read("pages/mobile-aos-immutable.js"), /fetch\("\/api\/listings"\)/u);
});

test("production build entrypoints do not instantiate Sharetribe without configuration", () => {
  const live = read("pages/live.js");
  const postFreeLegacy = read("pages/post-free1.js");
  const urlImport = read("pages/url-import.js");

  assert.doesNotMatch(live, /^const sdk = createInstance\(/mu);
  assert.match(live, /clientId\s*\?\s*createInstance/u);

  for (const source of [postFreeLegacy, urlImport]) {
    assert.match(source, /sharetribeClientId\s*\?\s*createInstance/u);
  }
});

test("broken local IXI state persistence is retired instead of shadowing IX-Core", () => {
  const route = read("pages/api/ixi-state.js");

  assert.match(route, /status\(410\)/u);
  assert.match(route, /Retired frontend state endpoint/u);
  assert.doesNotMatch(route, /ixi-store/u);
  assert.doesNotMatch(route, /saveUserIxiPatch|fs\.writeFile/u);
});
