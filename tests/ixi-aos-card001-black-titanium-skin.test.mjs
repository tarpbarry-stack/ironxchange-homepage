import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");

const header = read("components/ixi-aos/card-runtime/modules/IXIAosCardHeaderControls.jsx");
const consoleSource = read("components/ixi-aos/console-runtime/IXIAosLocationObjectConsole.jsx");
const skin = read("components/ixi-aos/cards/001/IXIAosCard001BlackTitaniumStyles.jsx");
const saddleSteel = read("components/ixi-aos/cards/001/IXIAosCard001SaddleSteelStyles.jsx");
const forgedCommand = read("components/ixi-aos/cards/001/IXIAosCard001ForgedCommandStyles.jsx");
const texturePath = path.join(root, "public/ixi/skins/black-titanium-grain.svg");
const saddleTexturePath = path.join(root, "public/ixi/skins/saddle-steel-grain.svg");
const forgedAssets = [
  "public/ixi/skins/forged-command-shell.webp",
  "public/ixi/skins/forged-command-leather.webp",
  "public/ixi/skins/forged-command-steel.webp"
].map(file => path.join(root, file));

test("AOS active skin menu retains V12 Natural and archives legacy choices", () => {
  assert.match(header, /V12 · NATURAL/);
  assert.doesNotMatch(header, /STOCK CERTIFICATE|BOND CERTIFICATE|MODERN MONEY|OLD CURRENCY/);
  assert.doesNotMatch(header, /<IXIAosCardSkinSystemStyles\s*\/>|<IXIAosExpandedSkinStyles\s*\/>/);
  assert.equal(fs.existsSync(path.join(root, "components/ixi-aos/card-runtime/modules/IXIAosCardSkinSystemStyles.jsx")), true);
  assert.equal(fs.existsSync(path.join(root, "components/ixi-aos/card-runtime/modules/IXIAosExpandedSkinStyles.jsx")), true);
});

test("Card 001 controls one skin across Faces 1 through 5", () => {
  assert.match(consoleSource, /id: "black-titanium", label: "BLACK TITANIUM"/);
  assert.match(consoleSource, /id: "saddle-steel", label: "SADDLE STEEL"/);
  assert.match(consoleSource, /id: "forged-command", label: "FORGED COMMAND"/);
  assert.match(consoleSource, /const \[skinId, setSkinId\] = useState\("v12"\)/);
  assert.match(consoleSource, /skinOptions = Number\(cardNumber\) === 1/);
  assert.match(consoleSource, /onSkinChange: setSkinId/);
  assert.match(consoleSource, /<IXIAosCard001BlackTitaniumStyles \/>/);
  assert.match(consoleSource, /<IXIAosCard001SaddleSteelStyles \/>/);
  assert.match(consoleSource, /<IXIAosCard001ForgedCommandStyles \/>/);
});

test("Black Titanium is appearance-only and uses one lightweight material asset", () => {
  const forbiddenGeometry = /(?:^|\n)\s*(?:width|height|min-width|max-width|min-height|max-height|padding|margin|gap|grid-template|position|inset|top|right|bottom|left|transform)\s*:/;
  const skinWithoutCustomProperties = skin.replace(/--[\w-]+\s*:[^;]+;/g, "");
  assert.doesNotMatch(skinWithoutCustomProperties, forbiddenGeometry);
  assert.match(skin, /black-titanium-grain\.svg/);
  assert.equal(fs.existsSync(texturePath), true);
  assert.ok(fs.statSync(texturePath).size < 2048);
});

test("Saddle Steel is appearance-only and uses one lightweight material asset", () => {
  const forbiddenGeometry = /(?:^|\n)\s*(?:width|height|min-width|max-width|min-height|max-height|padding|margin|gap|grid-template|position|inset|top|right|bottom|left|transform)\s*:/;
  const skinWithoutCustomProperties = saddleSteel.replace(/--[\w-]+\s*:[^;]+;/g, "");
  assert.doesNotMatch(skinWithoutCustomProperties, forbiddenGeometry);
  assert.match(saddleSteel, /saddle-steel-grain\.svg/);
  assert.equal(fs.existsSync(saddleTexturePath), true);
  assert.ok(fs.statSync(saddleTexturePath).size < 2048);
});

test("Forged Command uses compact photographic materials without changing card or rail geometry", () => {
  const decorativeOverlay = /\.ixi-generic-overview\.skin-forged-command::after[\s\S]*?z-index:\s*170;[\s\S]*?\}/;
  assert.match(forgedCommand, decorativeOverlay);

  const withoutPaintOverlay = forgedCommand.replace(decorativeOverlay, "");
  const forbiddenGeometry = /(?:^|\n)\s*(?:width|height|min-width|max-width|min-height|max-height|padding|margin|gap|grid-template|position|inset|top|right|bottom|left|transform)\s*:/;
  const withoutCustomProperties = withoutPaintOverlay.replace(/--[\w-]+\s*:[^;]+;/g, "");
  assert.doesNotMatch(withoutCustomProperties, forbiddenGeometry);

  assert.match(forgedCommand, /\.board-command-rail/);
  assert.match(forgedCommand, /pointer-events:\s*none/);
  assert.match(forgedCommand, /forged-command-shell\.webp/);
  assert.match(forgedCommand, /forged-command-leather\.webp/);
  assert.match(forgedCommand, /forged-command-steel\.webp/);

  forgedAssets.forEach(file => assert.equal(fs.existsSync(file), true));
  const totalBytes = forgedAssets.reduce((sum, file) => sum + fs.statSync(file).size, 0);
  assert.ok(totalBytes < 64 * 1024, `photographic skin assets must stay under 64 KiB; received ${totalBytes}`);
});
