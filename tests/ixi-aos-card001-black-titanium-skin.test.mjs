import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");

const header = read("components/ixi-aos/card-runtime/modules/IXIAosCardHeaderControls.jsx");
const consoleSource = read("components/ixi-aos/console-runtime/IXIAosLocationObjectConsole.jsx");
const skin = read("components/ixi-aos/cards/001/IXIAosCard001BlackTitaniumStyles.jsx");
const texturePath = path.join(root, "public/ixi/skins/black-titanium-grain.svg");

test("AOS active skin menu retains V12 Natural and archives legacy choices", () => {
  assert.match(header, /V12 · NATURAL/);
  assert.doesNotMatch(header, /STOCK CERTIFICATE|BOND CERTIFICATE|MODERN MONEY|OLD CURRENCY/);
  assert.doesNotMatch(header, /<IXIAosCardSkinSystemStyles\s*\/>|<IXIAosExpandedSkinStyles\s*\/>/);
  assert.equal(fs.existsSync(path.join(root, "components/ixi-aos/card-runtime/modules/IXIAosCardSkinSystemStyles.jsx")), true);
  assert.equal(fs.existsSync(path.join(root, "components/ixi-aos/card-runtime/modules/IXIAosExpandedSkinStyles.jsx")), true);
});

test("Card 001 controls one skin across Faces 1 through 5", () => {
  assert.match(consoleSource, /id: "black-titanium", label: "BLACK TITANIUM"/);
  assert.match(consoleSource, /const \[skinId, setSkinId\] = useState\("v12"\)/);
  assert.match(consoleSource, /skinOptions = Number\(cardNumber\) === 1/);
  assert.match(consoleSource, /onSkinChange: setSkinId/);
  assert.match(consoleSource, /<IXIAosCard001BlackTitaniumStyles \/>/);
});

test("Black Titanium is appearance-only and uses one lightweight material asset", () => {
  const forbiddenGeometry = /\b(?:width|height|min-width|max-width|min-height|max-height|padding|margin|gap|grid-template|position|inset|top|right|bottom|left|transform)\s*:/;
  const skinWithoutCustomProperties = skin.replace(/--[\w-]+\s*:[^;]+;/g, "");
  assert.doesNotMatch(skinWithoutCustomProperties, forbiddenGeometry);
  assert.match(skin, /black-titanium-grain\.svg/);
  assert.equal(fs.existsSync(texturePath), true);
  assert.ok(fs.statSync(texturePath).size < 2048);
});
