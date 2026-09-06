import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(
    path.join(root, relativePath),
    "utf8"
  );
}

async function importStandalone(
  relativePath
) {
  const source = read(relativePath);

  return import(
    `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
  );
}

const geometry = await importStandalone(
  "lib/ixiObjectGeometry.js"
);

const scaleEngine = await importStandalone(
  "components/ixi-chassis/IXIScaleEngine.js"
);

const expectedScaleSequence = [
  "xl",
  "work",
  "focus",
  "large",
  "medium",
  "compact",
  "micro"
];

assert.deepEqual(
  scaleEngine.IXI_CARD_SCALE_SEQUENCE,
  expectedScaleSequence
);

for (
  let index = 0;
  index < expectedScaleSequence.length;
  index += 1
) {
  assert.equal(
    scaleEngine.getNextCardScaleMode(
      expectedScaleSequence[index]
    ),
    expectedScaleSequence[
      (index + 1) %
        expectedScaleSequence.length
    ]
  );
}

assert.equal(
  scaleEngine.getNextCardScaleMode(
    "unknown"
  ),
  "xl"
);

const expectedFootprints = {
  marketplace: {
    xl: [300, 400],
    work: [360, 480],
    focus: [420, 560]
  },
  private: {
    xl: [300, 475],
    work: [360, 570],
    focus: [420, 665]
  },
  auction: {
    xl: [300, 475],
    work: [360, 570],
    focus: [420, 665]
  }
};

for (
  const [
    objectFamily,
    scaleModes
  ] of Object.entries(
    expectedFootprints
  )
) {
  for (
    const [
      scaleMode,
      [width, height]
    ] of Object.entries(scaleModes)
  ) {
    const footprint =
      geometry.getIXIObjectFootprint({
        objectFamily,
        scaleMode
      });

    assert.equal(
      footprint.renderedWidth,
      width,
      `${objectFamily}/${scaleMode} width`
    );

    assert.equal(
      footprint.renderedHeight,
      height,
      `${objectFamily}/${scaleMode} height`
    );
  }
}

const presetSource = read(
  "lib/ixiCardScalePresets.js"
);

assert.match(
  presetSource,
  /getIXIObjectFootprint/
);

assert.doesNotMatch(
  presetSource,
  /width:\s*298|height:\s*391|height:\s*470/
);

const activeStackSource = read(
  "components/ixi-chassis/IXIActiveStack.js"
);

assert.match(
  activeStackSource,
  /getMachineCardGeometryFamily/
);

assert.match(
  activeStackSource,
  /objectFamily=\{objectFamily\}/
);

const dragEngineSource = read(
  "components/ixi-chassis/IXIDragEngine.js"
);

assert.match(
  dragEngineSource,
  /overlayObjectFamily/
);

assert.doesNotMatch(
  dragEngineSource,
  /IXI_DRAG_NATIVE_(WIDTH|HEIGHT)/
);

const pageContexts = {
  "pages/browse-v2.js":
    "marketplace",
  "pages/saved.js":
    "workspace",
  "pages/account/my-listings-v2.js":
    "inventory",
  "pages/auction-work/index.js":
    "auction-work",
  "pages/auction-market/index.js":
    "auction-market",
  "pages/yard/index.js":
    "marketplace",
  "pages/yard/[sellerSlug].js":
    "marketplace",
  "pages/aos/work.js":
    "inventory"
};

for (
  const [relativePath, cardContext] of
    Object.entries(pageContexts)
) {
  assert.match(
    read(relativePath),
    new RegExp(
      `cardContext=["']${cardContext}["']`
    ),
    `${relativePath} must publish its card context`
  );
}

const surfaceContracts = [
  [
    "components/ixi-machine-card/marketplace/MarketplaceListingCard.js",
    ["400px", "180px", "475px", "273px"]
  ],
  [
    "components/ixi-machine-card/private/PrivateListingCard.js",
    ["400px", "180px", "475px", "273px"]
  ],
  [
    "components/ixi-machine-card/auction/AuctionListingCard.js",
    ["475px", "273px"]
  ],
  [
    "components/ixi-machine-object/IXIMarketplaceObjectConsole.jsx",
    ["300", "400"]
  ],
  [
    "components/ixi-private-object/IXIPrivateObjectConsole.jsx",
    ["300", "475"]
  ],
  [
    "components/ixi-auction-object/IXIAuctionObjectConsole.jsx",
    ["300", "475"]
  ]
];

for (
  const [relativePath, values] of
    surfaceContracts
) {
  const source = read(relativePath);

  for (const value of values) {
    assert.ok(
      source.includes(value),
      `${relativePath} must include ${value}`
    );
  }
}

console.log(
  "IXI card geometry contract passed."
);
