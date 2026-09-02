import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  consumeMarketplaceDistributionRate,
  resetMarketplaceDistributionControlsForTests,
  runMarketplaceDistributionIdempotently
} from "../lib/marketplace/emailControl.mjs";
import {
  normalizeDistributionListing
} from "../lib/marketplace/loadDistributionListing.mjs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test.afterEach(() => {
  resetMarketplaceDistributionControlsForTests();
});

test("Browse V2 alone opts into centering, batching, distribution, and intelligence", () => {
  const browse = read("pages/browse-v2.js");
  const board = read("components/ixi-chassis/IXIBoard.js");
  const surface = read("components/ixi-chassis/IXIBoardSurface.jsx");
  const stack = read("components/ixi-chassis/IXIActiveStack.js");

  assert.match(browse, /centerRows=\{true\}/u);
  assert.match(browse, /marketplaceBrowsePerformance=\{true\}/u);
  assert.match(browse, /enableMarketplaceDistribution=\{true\}/u);
  assert.match(browse, /enableMarketplaceIntelligence=\{true\}/u);
  assert.match(browse, /listingOrigin="browse"/u);
  assert.match(board, /marketplaceBrowsePerformance = false/u);
  assert.match(board, /enableMarketplaceDistribution = false/u);
  assert.match(board, /enableMarketplaceIntelligence = false/u);
  assert.match(surface, /centerRows = false/u);
  assert.match(stack, /enableMarketplaceDistribution = false/u);
});

test("Browse V2 keeps all sortable IDs while rendering inventory in 24-card batches", () => {
  const board = read("components/ixi-chassis/IXIBoard.js");

  assert.match(board, /IXI_INITIAL_BOARD_CARD_COUNT = 24/u);
  assert.match(board, /IXI_BOARD_CARD_BATCH_SIZE = 24/u);
  assert.match(board, /items=\{sortableItemIds\}/u);
  assert.match(board, /items\.slice\(0, renderLimit\)/u);
  assert.match(board, /IntersectionObserver/u);
});

test("deferred closed Consoles preserve the Marketplace scale shell", () => {
  const router = read(
    "components/ixi-marketplace/IXIBrowseObjectConsoleRouter.jsx"
  );
  const card = read(
    "components/ixi-machine-card/marketplace/MarketplaceListingCard.js"
  );

  assert.match(router, /IXIScaledCardShell/u);
  assert.match(router, /enableCardScaling = false/u);
  assert.match(router, /cardScaleMode = "xl"/u);
  assert.match(router, /size=\{cardScaleMode\}/u);
  assert.match(router, /objectFamily="marketplace"/u);
  assert.match(card, /\.card \{\s*box-sizing: border-box;/u);
});

test("Browse V2 card sizing uses a monotonic non-wrapping scale control", () => {
  const browse = read("pages/browse-v2.js");

  assert.match(
    browse,
    /"micro",\s*"compact",\s*"medium",\s*"large",\s*"xl",\s*"work",\s*"focus"/u
  );
  assert.match(browse, /stepCardScaleMode\(direction\)/u);
  assert.match(browse, /selectCardScaleIndex\(value\)/u);
  assert.match(browse, /Math\.min\(/u);
  assert.match(browse, /Math\.max\(/u);
  assert.match(browse, /aria-label="Make Marketplace cards larger"/u);
  assert.match(browse, /aria-label="Make Marketplace cards smaller"/u);
  assert.match(browse, /type="range"/u);
  assert.match(browse, /direction: rtl/u);
  assert.ok(
    browse.indexOf('aria-label="Make Marketplace cards larger"') <
      browse.indexOf('aria-label="Make Marketplace cards smaller"')
  );
  assert.doesNotMatch(browse, /cycleCardScaleMode/u);
  assert.doesNotMatch(browse, /getNextCardScaleMode/u);
});

test("distribution endpoint is anonymous and has no ownership or channel gate", () => {
  const route = read("pages/api/marketplace/share-email.js");
  const loader = read("lib/marketplace/loadDistributionListing.mjs");

  assert.doesNotMatch(route, /requireAuthenticated|authenticate\(/u);
  assert.doesNotMatch(loader, /machineChannel|channel\s*===/u);
  assert.doesNotMatch(loader, /owner|ownership/u);
  assert.match(loader, /listing\.state !== "published"/u);
  assert.match(route, /Idempotency|runMarketplaceDistributionIdempotently/u);
  assert.match(route, /consumeMarketplaceDistributionRate/u);
});

test("idempotency replays a completed send and rejects changed content", async () => {
  let calls = 0;
  const first = await runMarketplaceDistributionIdempotently({
    key: "test-send-key",
    fingerprint: "content-a",
    task: async () => {
      calls += 1;
      return { recipientCount: 1 };
    }
  });
  const replay = await runMarketplaceDistributionIdempotently({
    key: "test-send-key",
    fingerprint: "content-a",
    task: async () => {
      calls += 1;
      return { recipientCount: 1 };
    }
  });

  assert.equal(first.replayed, false);
  assert.equal(replay.replayed, true);
  assert.equal(calls, 1);

  await assert.rejects(
    runMarketplaceDistributionIdempotently({
      key: "test-send-key",
      fingerprint: "content-b",
      task: async () => ({ recipientCount: 1 })
    }),
    error => error.code === "IDEMPOTENCY_CONFLICT"
  );
});

test("rate control rejects a request beyond the configured window limit", () => {
  consumeMarketplaceDistributionRate({
    key: "test-rate",
    limit: 1,
    windowMs: 60_000,
    now: 1_000
  });

  assert.throws(
    () =>
      consumeMarketplaceDistributionRate({
        key: "test-rate",
        limit: 1,
        windowMs: 60_000,
        now: 1_001
      }),
    error => error.code === "RATE_LIMITED"
  );
});

test("listing normalization preserves ordered images without applying a channel gate", () => {
  const listing = normalizeDistributionListing({
    listing: {
      id: { uuid: "listing-123" },
      attributes: {
        title: "Machine",
        state: "published",
        publicData: { passportId: "IXITEST123" }
      },
      relationships: {
        images: {
          data: [
            { id: { uuid: "image-b" } },
            { id: { uuid: "image-a" } }
          ]
        }
      }
    },
    included: [
      {
        id: { uuid: "image-a" },
        type: "image",
        attributes: { variants: { default: { url: "a.jpg" } } }
      },
      {
        id: { uuid: "image-b" },
        type: "image",
        attributes: { variants: { default: { url: "b.jpg" } } }
      }
    ]
  });

  assert.deepEqual(listing.images, ["b.jpg", "a.jpg"]);
  assert.equal(listing.passportId, "IXITEST123");
});

test("intelligence contract excludes recipient, message, title, price, and location", () => {
  const source = read("lib/marketplace/cardIntelligence.js");

  for (const forbidden of [
    "recipient",
    "message",
    "title",
    "price",
    "location"
  ]) {
    assert.equal(source.includes(`"${forbidden}"`), false);
  }

  assert.match(source, /PROPERTY_NAMES/u);
  assert.match(source, /listing_id/u);
  assert.match(source, /error_code/u);
  assert.doesNotMatch(source, /from "\.\.\/posthog"/u);
});

test("distribution uses the canonical Marketplace origin", () => {
  const provider = read(
    "components/ixi-marketplace/ListingShareProvider.jsx"
  );
  const route = read("pages/api/marketplace/share-email.js");

  assert.match(provider, /NEXT_PUBLIC_MARKETPLACE_CANONICAL_ORIGIN/u);
  assert.match(provider, /https:\/\/preview\.ironxchange\.com/u);
  assert.match(route, /MARKETPLACE_CANONICAL_ORIGIN/u);
  assert.match(route, /https:\/\/preview\.ironxchange\.com/u);
});
