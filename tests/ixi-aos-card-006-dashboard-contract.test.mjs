import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("personnel container cards preserve the contained people across the render callback", () => {
  [4, 5, 6].forEach(number => {
    const card = read(`components/ixi-aos/cards/00${number}/IXIAosCard00${number}Personnel.jsx`);
    assert.match(card, /children: containedObjects = \[\]/u);
    assert.match(card, /children=\{containedObjects\}/u);
    assert.doesNotMatch(card, /children=\{contractProps\.children\}/u);
  });
});

test("Card 006 renders one data-driven dashboard shell with an integrated ID", () => {
  const card = read("components/ixi-aos/cards/006/IXIAosCard006Personnel.jsx");
  const layout = read("components/ixi-aos/cards/generic/IXIAosGenericContainerLayoutV12.jsx");
  const samples = read("components/ixi-aos-card-library/IXIAosCardSampleData.js");

  assert.match(card, /showBusinessIdentifier=\{false\}/u);
  assert.match(card, /showDashboardBusinessIdentifier/u);
  assert.match(layout, /!aggregateGroups\.length && variant !== 3/u);
  assert.match(layout, /NO PEOPLE AVAILABLE FOR ANALYSIS/u);
  assert.match(layout, /gcv12-dashboard-id/u);
  assert.match(samples, /dashboardTitle: "WORKFORCE STATUS"/u);
});
