import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(
  "components/ixi-machine-card/private/PrivateListingCard.js",
  "utf8",
);

test("private Face 1 keeps machine identity and Hours on one line", () => {
  assert.match(
    source,
    /\.title-row\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) max-content;/u,
  );
  assert.match(
    source,
    /\.card \.title-row > h3:not\(\.hours-inline\)[\s\S]*?text-overflow:\s*ellipsis;[\s\S]*?white-space:\s*nowrap;/u,
  );
  assert.match(
    source,
    /\.hours-inline[\s\S]*?width:\s*60px;[\s\S]*?justify-self:\s*end;/u,
  );
});

test("private Face 1 pins price left and reserves exactly two state characters", () => {
  assert.match(
    source,
    /\.price-row\s*\{[\s\S]*?display:\s*grid;[\s\S]*?grid-template-columns:\s*88px minmax\(0, 1fr\);/u,
  );
  assert.match(
    source,
    /\.price-input\s*\{[\s\S]*?text-align:\s*left;/u,
  );
  assert.match(
    source,
    /\.location-row\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) 27px;/u,
  );
  assert.match(
    source,
    /\.state-input\s*\{[\s\S]*?min-width:\s*27px;[\s\S]*?max-width:\s*27px;/u,
  );
  assert.match(source, /className="state-input location-input"[\s\S]*?maxLength=\{2\}/u);
});
