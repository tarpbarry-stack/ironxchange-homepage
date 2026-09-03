import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  IXI_MARKETPLACE_NATIVE_HEIGHT,
  IXI_MARKETPLACE_NATIVE_WIDTH,
  resolveIXIMobileSingleCardMetrics,
  resolveIXIViewportMode
} from "../lib/ixi-mobile/IXIMobileRuntime.mjs";

const pageSource = fs.readFileSync(
  new URL("../pages/mobile-foundation.js", import.meta.url),
  "utf8"
);

const targetWidths = [320, 360, 375, 390, 412, 430];

test("mobile runtime classifies target phone widths as mobile", () => {
  for (const width of targetWidths) {
    assert.equal(resolveIXIViewportMode(width), "mobile");
  }
  assert.equal(resolveIXIViewportMode(768), "desktop");
});

test("single-card metrics preserve the 300x400 production aspect ratio", () => {
  assert.equal(IXI_MARKETPLACE_NATIVE_WIDTH, 300);
  assert.equal(IXI_MARKETPLACE_NATIVE_HEIGHT, 400);

  for (const viewportWidth of targetWidths) {
    const metrics = resolveIXIMobileSingleCardMetrics({ viewportWidth });

    assert.ok(metrics.scale >= 1);
    assert.ok(metrics.scale <= 1.4);
    assert.ok(metrics.renderedWidth <= viewportWidth);
    assert.equal(
      Number((metrics.renderedHeight / metrics.renderedWidth).toFixed(8)),
      Number((400 / 300).toFixed(8))
    );
  }
});

test("foundation route uses the real production IXIMachineCard", () => {
  assert.match(
    pageSource,
    /import IXIMachineCard from "\.\.\/components\/ixi-machine-card\/IXIMachineCard";/
  );
  assert.match(pageSource, /<IXIMachineCard/);
  assert.doesNotMatch(pageSource, /MobileMachineCard|MobileMarketplaceCard|MobileListingCard/);
});

test("foundation route loads production inventory through IXIListingsEngine", () => {
  assert.match(
    pageSource,
    /import loadIXIListingsEnvironment from "\.\.\/lib\/listings\/IXIListingsEngine";/
  );
  assert.match(pageSource, /includePrivateState: false/);
  assert.match(pageSource, /marketplaceBrowsePerformance: true/);
});

test("foundation route preserves viewport-fit and blocks body horizontal overflow", () => {
  assert.match(pageSource, /viewport-fit=cover/);
  assert.match(pageSource, /overflow-x: hidden/);
});
