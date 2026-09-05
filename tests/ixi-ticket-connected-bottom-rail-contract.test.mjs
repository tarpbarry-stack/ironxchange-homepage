import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const railShell = read("components/ixi-aos/cards/generic/IXIAosGenericCardRailShell.jsx");
const containerLayout = read("components/ixi-aos/cards/generic/IXIAosGenericContainerLayoutV12.jsx");
const objectLayout = read("components/ixi-aos/cards/generic/IXIAosGenericObjectLayout007.jsx");

const affectedCards = [
  "components/ixi-aos/cards/004/IXIAosCard004Personnel.jsx",
  "components/ixi-aos/cards/005/IXIAosCard005Personnel.jsx",
  "components/ixi-aos/cards/006/IXIAosCard006Personnel.jsx",
  "components/ixi-aos/cards/008/IXIAosCard008Profile.jsx"
];

test("CT-260905-000001 and CT-260905-000002 keep one real IXI rail on Cards 004, 005, 006 and 008", () => {
  for (const path of affectedCards) {
    assert.match(read(path), /IXIAosGenericCardRailShell/u, `${path} must retain the shared functional rail shell`);
  }
  assert.match(railShell, /<IXIObjectRail/u);
  assert.doesNotMatch(containerLayout, /gcv12-bottom-rail/u);
  assert.doesNotMatch(objectLayout, /go007-rail/u);
});

test("the four-card layouts reserve exactly the real 16px IXI rail height", () => {
  assert.match(containerLayout, /\.gcv12-child-rail\{[^}]*bottom:16px;height:57px/u);
  assert.match(containerLayout, /\.gcv12-editor\{[^}]*inset:43px 7px 16px/u);
  assert.match(objectLayout, /\.go007-scroll\{[^}]*bottom:64px/u);
  assert.match(objectLayout, /\.go007-actions\{[^}]*bottom:16px;height:48px/u);
  assert.match(objectLayout, /\.go007-editor\{[^}]*inset:42px 7px 16px/u);
});

test("native AOS card geometry remains 300 by 475", () => {
  assert.match(railShell, /width: 298px;[\s\S]*height: 471px;/u);
  assert.match(containerLayout, /width:298px;height:471px/u);
  assert.match(objectLayout, /width:298px;height:471px/u);
});
