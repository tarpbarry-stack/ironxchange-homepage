import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const runtime = fs.readFileSync(
  "components/ixi-machine-card/private/IXIOwnedPrivateListingRuntime.jsx",
  "utf8"
);
const privateCard = fs.readFileSync(
  "components/ixi-machine-card/private/PrivateListingCard.js",
  "utf8"
);
const face2 = fs.readFileSync(
  "components/ixi-machine-object/IXISellerMachineObjectFace2.js",
  "utf8"
);
const mobileRuntime = fs.readFileSync(
  "lib/ixi-mobile/IXIMobileRuntime.mjs",
  "utf8"
);
const mobilePage = fs.readFileSync(
  "pages/mobile-aos-face1.js",
  "utf8"
);

test("owned/private Face 1 keeps owner toolbar and suppresses legacy lifecycle row", () => {
  assert.match(privateCard, /seller-owner-toolbar/);
  assert.match(privateCard, /title="Add"/);
  assert.match(privateCard, />EDIT<\/button>/);
  assert.match(privateCard, /title="TRAN\$ACT"/);
  assert.match(privateCard, /title="Actions"/);
  assert.match(runtime, /\.owned-private-runtime \.private-listing-card \.seller-actions\{\s*display:none!important;/);
});

test("lifecycle controls remain available on seller Face 2", () => {
  assert.match(face2, />VIEW<\/button>/);
  assert.match(face2, />LAUNCH<\/button>/);
  assert.match(face2, /REACTIVATE/);
  assert.match(face2, />DELETE<\/button>/);
});

test("mobile owned/private geometry is 300x475 and Face 1 only", () => {
  assert.match(mobileRuntime, /private: Object\.freeze\(\{ width: 300, height: 475 \}\)/);
  assert.match(mobilePage, /family: "private"/);
  assert.match(mobilePage, /machineFace=\{1\}/);
  assert.match(mobilePage, /300×475/);
  assert.doesNotMatch(mobilePage, /onCycleMachineFace/);
});
