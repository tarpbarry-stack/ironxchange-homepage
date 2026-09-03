import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const actuatorSource = readFileSync(new URL("../components/ixi-chassis/IXIObjectCardActuator.jsx", import.meta.url), "utf8");
const marketplaceSource = readFileSync(new URL("../components/ixi-machine-card/marketplace/MarketplaceListingCard.js", import.meta.url), "utf8");

test("Marketplace actuator keeps existing bottom edge while matching full actuator height", () => {
  assert.match(actuatorSource, /variant === "marketplace-full"/);
  assert.match(actuatorSource, /\? 335/);
  assert.match(actuatorSource, /\? 34/);
});

test("Marketplace Listing Card defaults to marketplace full-size actuator", () => {
  assert.match(marketplaceSource, /consoleActuatorVariant = "marketplace-full"/);
});
