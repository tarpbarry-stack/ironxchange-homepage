import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const identity = read(
  "components/ixi-aos/card-runtime/modules/IXIAosCardHeaderIdentity.jsx"
);
const typography = read(
  "components/ixi-aos/card-runtime/modules/IXIAosCommercialCardTypography.jsx"
);
const configuredFace = read(
  "components/ixi-aos/cards/generic/IXIAosGenericConfiguredFaceV12.jsx"
);
const rail = read("components/IXIMachineRail.js");
const card007 = read(
  "components/ixi-aos/cards/007/IXIAosCard007EmployeeApplication.jsx"
);

test("Cards 004-017 receive one scoped commercial typography foundation", () => {
  assert.match(identity, /IXIAosCommercialCardTypography/u);
  assert.match(typography, /\.ixi-aos-header-identity-shell/u);
  assert.match(typography, /"Inter Variable", Inter/u);
  assert.match(typography, /--aos-commercial-micro: 7px/u);
  assert.match(typography, /overflow-y: auto !important/u);
  assert.match(typography, /-webkit-line-clamp: 2/u);
});

test("Location Faces 4 and 5 retain the standard command band above the rail", () => {
  assert.match(configuredFace, /onRecall = null/u);
  assert.match(configuredFace, /onBoard = null/u);
  assert.match(configuredFace, /onReturn = null/u);
  assert.match(configuredFace, /className="gfv12-commands"/u);
  assert.match(configuredFace, /bottom:51px/u);
  assert.match(configuredFace, /RECALL/u);
  assert.match(configuredFace, /BOARD/u);
  assert.match(configuredFace, /RETURN/u);
});

test("Every machine rail zone has an accessible name", () => {
  const buttons = [...rail.matchAll(/<button[\s\S]*?\/>/gu)].map(match => match[0]);
  assert.equal(buttons.length, 7);
  for (const button of buttons) {
    assert.match(button, /aria-label=/u);
  }
});

test("Card 007 keeps all three independently selectable commercial variants", () => {
  assert.match(card007, /007A/u);
  assert.match(card007, /007B/u);
  assert.match(card007, /007C/u);
  assert.match(card007, /IXIAosGenericUniversalLayout007B/u);
  assert.match(card007, /IXIAosGenericUniversalLayout007C/u);
});
