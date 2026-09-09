import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = path => fs.readFileSync(path, "utf8");

const pocketContracts = [
  [
    "components/ixi-chassis/IXIPocketL1.js",
    [
      "Send Pocket I machines to IXI Theater",
      "Move Pocket I machines to the top active stack",
      "Return Pocket I machines to the board",
      "Send Pocket I machines"
    ]
  ],
  [
    "components/ixi-chassis/IXIPocketR1.js",
    [
      "Send Pocket II machines",
      "Return Pocket II machines to the board",
      "Move Pocket II machines to the top active stack",
      "Send Pocket II machines to IXI Theater"
    ]
  ],
  [
    "components/ixi-chassis/IXIPocketL2.js",
    [
      "Send Pocket III machines to IXI Theater",
      "Move Pocket III machines to the bottom active stack",
      "Return Pocket III machines to the board",
      "Send Pocket III machines"
    ]
  ],
  [
    "components/ixi-chassis/IXIPocketR2.js",
    [
      "Send Pocket IV machines",
      "Return Pocket IV machines to the board",
      "Move Pocket IV machines to the bottom active stack",
      "Send Pocket IV machines to IXI Theater"
    ]
  ]
];

test("all four pocket rails publish exact accessible action names", () => {
  for (const [path, labels] of pocketContracts) {
    const source = read(path);

    assert.equal(
      (source.match(/className="ixi-pocket-rail-action/g) || []).length,
      4,
      `${path} must retain exactly four pocket rail actions`
    );

    for (const label of labels) {
      assert.ok(
        source.includes(`aria-label="${label}"`),
        `${path} is missing ${label}`
      );
    }
  }
});

test("active-stack toggles expose their name and expanded state", () => {
  const source = read("components/ixi-chassis/IXIActiveStackZone.js");

  assert.match(source, /aria-label=\{`\$\{/u);
  assert.match(source, /"Close"[\s\S]*?"Open"/u);
  assert.match(source, /\}\s+\$\{stackKey\} active stack`\}/u);
  assert.match(source, /aria-expanded=\{[\s\S]*?activeStacksOpen\[stackKey\]/u);
});

test("the chassis owns geometry and Browse V2 has no chassis CSS copy", () => {
  const page = read("pages/browse-v2.js");
  const chassis = read("components/ixi-chassis/IXIChassis.js");

  assert.doesNotMatch(page, /\.ixi-command-chassis\s*\{/u);
  assert.doesNotMatch(page, /\.ixi-pocket-action-rail\s*\{/u);
  assert.doesNotMatch(page, /\.active-stack-dash\s*\{/u);

  assert.match(chassis, /<style jsx global>/u);
  assert.match(chassis, /\.ixi-command-chassis\s*\{/u);
  assert.match(chassis, /margin:\s*0 auto;/u);
  assert.match(chassis, /min-width:\s*1255px/u);
  assert.match(chassis, /max-width:\s*1371px/u);
  assert.match(chassis, /100vw - 1255px/u);
});

test("chassis hit targets are 24px while visual rail marks retain their dimensions", () => {
  const chassis = read("components/ixi-chassis/IXIChassis.js");

  assert.match(
    chassis,
    /\.ixi-pocket-action-rail\.right\s*\{[\s\S]*?width:\s*96px;[\s\S]*?grid-template-columns:\s*repeat\(4, 24px\);[\s\S]*?gap:\s*0;/u
  );
  assert.match(
    chassis,
    /\.ixi-pocket-action-rail \.ixi-pocket-rail-action\s*\{[\s\S]*?width:\s*24px;[\s\S]*?height:\s*24px;/u
  );
  assert.match(
    chassis,
    /\.ixi-pocket-action-rail \.ixi-pocket-rail-action::before\s*\{[\s\S]*?width:\s*15px;[\s\S]*?height:\s*4px;/u
  );
  assert.match(
    chassis,
    /\.active-stack-dash\s*\{[\s\S]*?height:\s*24px;[\s\S]*?margin:\s*-8px 0;/u
  );
  assert.match(
    chassis,
    /\.active-stack-dash::before\s*\{[\s\S]*?width:\s*34px;[\s\S]*?height:\s*3px;/u
  );
  assert.match(chassis, /\.active-stack-zone\s*\{\s*gap:\s*16px;/u);
});

test("stacked tablet pockets keep top-edge actions inside the chassis hit boundary", () => {
  const chassis = read("components/ixi-chassis/IXIChassis.js");
  const tabletRules = chassis.match(
    /@media \(max-width: 1254px\) and \(min-width: 851px\) \{[\s\S]*?\n        \}/u
  )?.[0] || "";

  assert.match(tabletRules, /\.ixi-command-left,[\s\S]*?top:\s*-5px;/u);
  assert.match(
    tabletRules,
    /\.ixi-command-chassis \.ixi-pocket-action-rail \.ixi-pocket-rail-action\s*\{\s*top:\s*0;/u
  );
  assert.match(
    tabletRules,
    /\.ixi-pocket-rail-action::before[\s\S]*?translateY\(-10px\)/u
  );
  assert.match(
    tabletRules,
    /\.ixi-pocket-rail-action::after[\s\S]*?translate\(-50%, -10px\)/u
  );
});

test("pocket states never paint the enlarged hit surfaces", () => {
  const chassis = read("components/ixi-chassis/IXIChassis.js");

  assert.match(
    chassis,
    /\.ixi-pocket-left\.destination-armed[\s\S]*?button\.ixi-pocket-rail-action[\s\S]*?background:\s*transparent !important;[\s\S]*?box-shadow:\s*none !important;/u
  );
  assert.match(
    chassis,
    /\.ixi-pocket-action-rail button\.ixi-pocket-rail-action:hover/u
  );
  assert.match(
    chassis,
    /\.ixi-pocket-left\.destination-armed \.ixi-pocket-rail-action::before[\s\S]*?background:\s*rgba\(0,194,255,\.38\);/u
  );
});

test("no active chassis stylesheet retains the invalid unitless margin", () => {
  const paths = [
    "components/ixi-chassis/IXIChassis.js",
    ...pocketContracts.map(([path]) => path)
  ];

  for (const path of paths) {
    assert.doesNotMatch(read(path), /margin:\s*-14 auto 20px/u);
  }
});
