import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync("pages/mobile-foundation.js", "utf8");
const card = fs.readFileSync(
  "components/ixi-machine-card/marketplace/MarketplaceListingCard.js",
  "utf8"
);
const rail = fs.readFileSync("components/IXIMachineRail.js", "utf8");

test("mobile certification continues to use the production IXIMachineCard", () => {
  assert.match(
    page,
    /import IXIMachineCard from "\.\.\/components\/ixi-machine-card\/IXIMachineCard";/
  );
  assert.doesNotMatch(page, /Mobile(?:Marketplace)?Card/);
});

test("mobile face cycle is constrained to production faces 1 through 4", () => {
  assert.match(page, /const FIRST_MACHINE_FACE = 1;/);
  assert.match(page, /const LAST_MACHINE_FACE = 4;/);
  assert.match(page, /current >= LAST_MACHINE_FACE/);
  assert.match(page, /\? FIRST_MACHINE_FACE\s*:\s*current \+ 1/);
});

test("mobile page controls the production card through existing face props", () => {
  assert.match(page, /machineFace=\{machineFace\}/);
  assert.match(page, /onCycleMachineFace=\{cycleProductionMachineFace\}/);
});

test("production rail remains the face-cycle actuator", () => {
  assert.match(rail, /onCycleMachineFace\?\.\(listing\)/);
  assert.match(rail, /aria-label="Flip card"/);
});

test("production Marketplace card still owns faces 2, 3 and 4", () => {
  assert.match(card, /IXIMachineObjectFace2/);
  assert.match(card, /IXIMachineObjectFace3/);
  assert.match(card, /IXIMachineObjectFace4/);
  assert.match(card, /Number\(machineFace \|\| 1\) === 2/);
  assert.match(card, /Number\(machineFace \|\| 1\) === 3/);
  assert.match(card, /Number\(machineFace \|\| 1\) === 4/);
});

test("card geometry and rail implementation are not redefined by the mobile page", () => {
  assert.doesNotMatch(page, /board-command-rail/);
  assert.doesNotMatch(page, /IXIMachineObjectFace[234]/);
  assert.doesNotMatch(page, /className="card marketplace-listing-card/);
});
