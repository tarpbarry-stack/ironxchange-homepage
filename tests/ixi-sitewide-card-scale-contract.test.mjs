import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(path) {
  return fs.readFileSync(
    new URL(`../${path}`, import.meta.url),
    "utf8"
  );
}

const sharedControlPages = [
  "pages/index.js",
  "pages/browse-v2.js",
  "pages/saved.js",
  "pages/account/my-listings-v2.js",
  "pages/yard/index.js",
  "pages/yard/[sellerSlug].js",
  "pages/auction-work/index.js",
  "pages/auction-market/index.js"
];

test("active desktop card surfaces use the shared V12 scale control", () => {
  for (const path of sharedControlPages) {
    const source = read(path);

    assert.match(
      source,
      /IXICardScaleControl/u,
      `${path} must use the shared control`
    );
    assert.match(
      source,
      /writeSitewideCardScaleMode/u,
      `${path} must publish scale changes site-wide`
    );
  }
});

test("standard boards center complete rows using scaled footprints", () => {
  const centeredBoardPages = [
    "pages/browse-v2.js",
    "pages/saved.js",
    "pages/account/my-listings-v2.js",
    "pages/yard/index.js",
    "pages/yard/[sellerSlug].js",
    "pages/auction-work/index.js",
    "pages/auction-market/index.js",
    "pages/index.js"
  ];

  for (const path of centeredBoardPages) {
    assert.match(
      read(path),
      /centerRows=\{true\}/u,
      `${path} must opt into exact row centering`
    );
  }

});

test("the shared V12 control is monotonic, clamped, and directly selectable", () => {
  const engine = read(
    "components/ixi-chassis/IXIScaleEngine.js"
  );
  const control = read(
    "components/ixi-chassis/IXICardScaleControl.jsx"
  );

  assert.match(
    engine,
    /IXI_CARD_SCALE_STEPS[\s\S]*?"micro",\s*"compact",\s*"medium",\s*"large",\s*"xl",\s*"work",\s*"focus"/u
  );
  assert.match(engine, /Math\.min\(/u);
  assert.match(engine, /Math\.max\(/u);
  assert.match(control, /type="range"/u);
  assert.match(control, /direction: rtl/u);
  assert.match(control, /stepCardScaleMode\(currentMode, 1\)/u);
  assert.match(control, /stepCardScaleMode\(currentMode, -1\)/u);
  assert.ok(
    control.indexOf("cards larger") <
      control.indexOf("cards smaller")
  );
});

test("access-only AOS, mobile lab, and contained Theater geometry stay outside the public site-wide control", () => {
  assert.equal(
    fs.existsSync(
      new URL("../pages/mobile-lab.js", import.meta.url)
    ),
    false
  );
  assert.doesNotMatch(
    read("pages/theater.js"),
    /IXICardScaleControl/u
  );
  assert.doesNotMatch(
    read("pages/aos/work.js"),
    /IXICardScaleControl/u
  );
  assert.doesNotMatch(
    read("components/ixi-mos/workspace/IXIAosWorkspaceBoard.jsx"),
    /centerRows=\{true\}/u
  );
});
