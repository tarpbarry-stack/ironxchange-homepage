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
  "pages/auction-market/index.js",
  "pages/aos/work.js",
  "pages/theater.js"
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
    assert.match(
      source,
      /readSitewideCardScaleMode/u,
      `${path} must hydrate the site-wide scale before data access`
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
    "pages/index.js",
    "components/ixi-mos/workspace/IXIAosWorkspaceBoard.jsx"
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

test("mobile lab stays frozen while AOS and Theater join the site-wide control", () => {
  assert.equal(
    fs.existsSync(
      new URL("../pages/mobile-lab.js", import.meta.url)
    ),
    false
  );
  const theater = read("pages/theater.js");

  assert.match(
    theater,
    /--theater-card-presentation-scale/u
  );
  assert.match(
    theater,
    /transform: scale\(var\(--theater-card-presentation-scale\)\)/u
  );
  assert.doesNotMatch(
    theater,
    /transform: scale\(\.60\)/u
  );
});

test("Face Lab scales both exact V12 native card families", () => {
  const scaledPreview = read(
    "components/ixi-face-studio/IXIFaceLabScaledCard.jsx"
  );
  const faceStudio = read(
    "components/ixi-face-studio/IXIFaceStudio.jsx"
  );
  const facePreview = read(
    "components/ixi-face-studio/IXIFacePreview.jsx"
  );
  const referenceOverlay = read(
    "components/ixi-face-studio/IXIFaceReferenceOverlay.jsx"
  );
  const aosPreview = read(
    "components/ixi-face-studio/IXIAosCardPreview.jsx"
  );

  assert.match(
    scaledPreview,
    /IXICardScaleControl/u
  );
  assert.match(
    scaledPreview,
    /IXIScaledCardShell/u
  );
  assert.match(
    scaledPreview,
    /readSitewideCardScaleMode/u
  );
  assert.match(
    scaledPreview,
    /writeSitewideCardScaleMode/u
  );
  assert.match(
    scaledPreview,
    /objectFamily === "marketplace"/u
  );
  assert.match(
    scaledPreview,
    /data-ixi-face-lab-native-width/u
  );
  assert.match(
    scaledPreview,
    /data-ixi-face-lab-native-height/u
  );
  assert.match(
    scaledPreview,
    /NATIVE \{formatDimension/u
  );
  assert.doesNotMatch(
    scaledPreview,
    /298|391|470|471/u
  );

  assert.match(
    faceStudio,
    /objectFamily="marketplace"/u
  );
  assert.match(
    faceStudio,
    /objectFamily="private"/u
  );
  assert.match(
    faceStudio,
    /preview-shell-marketplace[\s\S]*?height: 400px/u
  );
  assert.match(
    faceStudio,
    /preview-shell-operating[\s\S]*?height: 475px/u
  );
  assert.match(
    faceStudio,
    /surfaceLabel="Face Lab Faces"/u
  );
  assert.equal(
    (
      faceStudio.match(
        /showScaleControl=\{false\}/gu
      ) || []
    ).length,
    2
  );

  assert.match(
    facePreview,
    /CARD_WIDTH = 300/u
  );
  assert.match(
    facePreview,
    /COMPACT_CARD_HEIGHT = 400/u
  );
  assert.match(
    facePreview,
    /TALL_CARD_HEIGHT = 475/u
  );

  assert.match(
    referenceOverlay,
    /\? 400\s*: 475/u
  );

  assert.match(
    aosPreview,
    /width: 300px/u
  );
  assert.match(
    aosPreview,
    /height: 475px/u
  );

  const consumers = [
    "components/ixi-face-studio/IXIFaceStudio.jsx",
    "components/ixi-face-studio/IXITransactFaceLabFrame.jsx",
    "components/ixi-aos-card-library/IXIAosCardCatalogPreview.jsx",
    "pages/facelab/location-f3-owned.js",
    "pages/facelab/location-f3-leased.js"
  ];

  for (const path of consumers) {
    assert.match(
      read(path),
      /IXIFaceLabScaledCard/u,
      `${path} must use the shared Face Lab scale wrapper`
    );
  }
});
