import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");

test("Card 004 extends its relationship shell to the V12 command-row spacing", () => {
  const card004 = read("components/ixi-aos/cards/004/IXIAosCard004Personnel.jsx");
  const layout = read("components/ixi-aos/cards/generic/IXIAosGenericContainerLayoutV12.jsx");

  assert.match(card004, /IXIAosGenericContainerLayoutV12[\s\S]*stretchRelationships/u);
  assert.match(layout, /stretchRelationships = false/u);
  assert.match(layout, /gcv12-relationships-fill/u);
  assert.match(layout, /\.gcv12-relationships-fill\{flex:1 0 82px\}/u);

  assert.match(layout, /\.gcv12-body\{[^}]*bottom:111px[^}]*gap:5px/u);
  assert.match(layout, /\.gcv12-commands\{[^}]*bottom:78px[^}]*height:28px/u);
});

test("the fill behavior stays opt-in so other V12 container cards do not move", () => {
  const layout = read("components/ixi-aos/cards/generic/IXIAosGenericContainerLayoutV12.jsx");
  assert.match(
    layout,
    /className=\{`gcv12-relationships \$\{stretchRelationships \? "gcv12-relationships-fill" : ""\}`\}/u
  );
});

test("Cards 005 and 006 opt into the same V12 relationship-shell fill", () => {
  for (const path of [
    "components/ixi-aos/cards/005/IXIAosCard005Personnel.jsx",
    "components/ixi-aos/cards/006/IXIAosCard006Personnel.jsx"
  ]) {
    assert.match(read(path), /IXIAosGenericContainerLayoutV12[\s\S]*stretchRelationships/u);
  }
});

test("Card 007B fills its relationship shell to its retained command row", () => {
  const card007B = read("components/ixi-aos/cards/generic/IXIAosGenericUniversalLayout007B.jsx");
  assert.match(card007B, /\.ixi-universal-card-007b \.u007-relationships\s*\{\s*flex: 1 0 104px !important;/u);
  assert.match(card007B, /\.ixi-universal-card-007b \.u007-body\s*\{\s*bottom: 50px !important;/u);
  assert.match(card007B, /\.ixi-universal-card-007b \.u007-commands\s*\{\s*bottom: 23px !important;/u);
});
