import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");

const header = read("components/ixi-aos/card-runtime/modules/IXIAosCardHeaderControls.jsx");
const consoleSource = read("components/ixi-aos/console-runtime/IXIAosLocationObjectConsole.jsx");
const card001Source = read("components/ixi-aos/cards/001/IXIAosCard001Location.jsx");
const locationOverviewSource = read("components/ixi-aos/cards/location/IXIAosLocationOverviewCard.jsx");
const activeCard001Faces = [
  "components/ixi-aos/card-runtime/IXIAosDataContractCardAdapter.jsx",
  "components/ixi-aos/cards/location/IXIAosLocationFace2OperationsV12.jsx",
  "components/ixi-aos/cards/location/IXIAosLocationFace2V12VisualLock.jsx",
  "components/ixi-aos/cards/location/IXIAosLocationFace3Financial.jsx",
  "components/ixi-aos/cards/location/IXIAosLocationFace3OwnedV12.jsx",
  "components/ixi-aos/cards/location/IXIAosLocationFace3LeasedV12.jsx",
  "components/ixi-aos/cards/location/IXIAosLocationFace3V12.jsx",
  "components/ixi-aos/cards/location/IXIAosLocationFace4Obligations.jsx",
  "components/ixi-aos/cards/location/IXIAosLocationFace5Maintenance.jsx",
  "components/ixi-aos/cards/generic/IXIAosGenericConfiguredFaceV12.jsx"
].map(read);
const skin = read("components/ixi-aos/cards/001/IXIAosCard001BlackTitaniumStyles.jsx");
const saddleSteel = read("components/ixi-aos/cards/001/IXIAosCard001SaddleSteelStyles.jsx");
const forgedCommand = read("components/ixi-aos/cards/001/IXIAosCard001ForgedCommandStyles.jsx");
const foundryGreen = read("components/ixi-aos/cards/001/IXIAosCard001FoundryGreenStyles.jsx");
const aerospaceCarbon = read("components/ixi-aos/cards/001/IXIAosCard001AerospaceCarbonStyles.jsx");
const texturePath = path.join(root, "public/ixi/skins/black-titanium-pvd.webp");
const saddleTexturePath = path.join(root, "public/ixi/skins/saddle-steel-leather.webp");
const aerospaceCarbonPath = path.join(root, "public/ixi/skins/aerospace-carbon.webp");
const forgedAssets = [
  "public/ixi/skins/forged-command-leather.webp",
  "public/ixi/skins/forged-command-steel.webp"
].map(file => path.join(root, file));
const foundryAssets = [
  "public/ixi/skins/foundry-green-paper.webp",
  "public/ixi/skins/foundry-green-guilloche.svg",
  "public/ixi/skins/foundry-green-ixi-seal.svg"
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
  assert.match(consoleSource, /id: "foundry-green", label: "FOUNDRY GREEN"/);
  assert.doesNotMatch(consoleSource, /id: "aerospace-carbon", label: "AEROSPACE CARBON"/);
  assert.match(consoleSource, /const \[skinId, setSkinId\] = useState\("v12"\)/);
  assert.match(consoleSource, /skinOptions = Number\(cardNumber\) === 1/);
  assert.match(consoleSource, /onSkinChange: setSkinId/);
  assert.match(consoleSource, /<IXIAosCard001BlackTitaniumStyles \/>/);
  assert.match(consoleSource, /<IXIAosCard001SaddleSteelStyles \/>/);
  assert.match(consoleSource, /<IXIAosCard001ForgedCommandStyles \/>/);
  assert.match(consoleSource, /<IXIAosCard001FoundryGreenStyles \/>/);
  assert.doesNotMatch(consoleSource, /<IXIAosCard001AerospaceCarbonStyles \/>/);
});

test("Card 001 has one 300 by 475 Natural chassis and inherits scaled modes", () => {
  assert.match(consoleSource, /const PANEL_WIDTH = 300;/);
  assert.match(consoleSource, /const PANEL_HEIGHT = 475;/);
  assert.match(consoleSource, /consoleSlots\.length \* PANEL_WIDTH/);
  assert.match(card001Source, /nativeWidth: 300/);
  assert.match(card001Source, /nativeHeight: 475/);
  assert.match(locationOverviewSource, /const W = 300;/);
  assert.match(locationOverviewSource, /const H = 475;/);
  activeCard001Faces.forEach(source => assert.doesNotMatch(source, /\b(?:298|471)(?:px)?\b/));
  assert.doesNotMatch(consoleSource, /aos-generic-console-slot>:is/);
  assert.doesNotMatch(consoleSource, /(?:WORK|FOCUS).*?(?:width|height)/s);
});

test("Black Titanium is body-first and uses one compact PVD material asset", () => {
  const forbiddenGeometry = /(?:^|\n)\s*(?:width|height|min-width|max-width|min-height|max-height|padding|margin|gap|grid-template|position|inset|top|right|bottom|left|transform)\s*:/;
  const skinWithoutCustomProperties = skin.replace(/--[\w-]+\s*:[^;]+;/g, "");
  assert.doesNotMatch(skinWithoutCustomProperties, forbiddenGeometry);
  assert.match(skin, /black-titanium-pvd\.webp/);
  assert.match(skin, /aos-generic-console-slot:has\(\.skin-black-titanium\)/);
  assert.equal(fs.existsSync(texturePath), true);
  assert.ok(fs.statSync(texturePath).size < 8 * 1024);
});

test("Saddle Steel is body-first and uses compact leather and steel materials", () => {
  const forbiddenGeometry = /(?:^|\n)\s*(?:width|height|min-width|max-width|min-height|max-height|padding|margin|gap|grid-template|position|inset|top|right|bottom|left|transform)\s*:/;
  const skinWithoutCustomProperties = saddleSteel.replace(/--[\w-]+\s*:[^;]+;/g, "");
  assert.doesNotMatch(skinWithoutCustomProperties, forbiddenGeometry);
  assert.match(saddleSteel, /saddle-steel-leather\.webp/);
  assert.match(saddleSteel, /saddle-steel-grain\.svg/);
  assert.match(saddleSteel, /aos-generic-console-slot:has\(\.skin-saddle-steel\)/);
  assert.equal(fs.existsSync(saddleTexturePath), true);
  assert.ok(fs.statSync(saddleTexturePath).size < 12 * 1024);
});

test("Forged Command uses compact photographic materials without changing card or rail geometry", () => {
  const forbiddenGeometry = /(?:^|\n)\s*(?:width|height|min-width|max-width|min-height|max-height|padding|margin|gap|grid-template|position|inset|top|right|bottom|left|transform)\s*:/;
  const withoutCustomProperties = forgedCommand.replace(/--[\w-]+\s*:[^;]+;/g, "");
  assert.doesNotMatch(withoutCustomProperties, forbiddenGeometry);

  assert.match(forgedCommand, /\.board-command-rail/);
  assert.doesNotMatch(forgedCommand, /forged-command-shell-v\d+\.webp/);
  assert.doesNotMatch(forgedCommand, /\.skin-forged-command \.board-command-rail[\s\S]*?(?:border-radius|overflow|z-index)\s*:/);
  assert.match(forgedCommand, /aos-generic-console-slot:has\(\.skin-forged-command\)/);
  assert.match(forgedCommand, /forged-command-leather\.webp/);
  assert.match(forgedCommand, /forged-command-steel\.webp/);

  forgedAssets.forEach(file => assert.equal(fs.existsSync(file), true));
  const totalBytes = forgedAssets.reduce((sum, file) => sum + fs.statSync(file).size, 0);
  assert.ok(totalBytes < 64 * 1024, `photographic skin assets must stay under 64 KiB; received ${totalBytes}`);
});

test("Archived Aerospace Carbon experiment remains isolated and geometry-safe", () => {
  const forbiddenGeometry = /(?:^|\n)\s*(?:width|height|min-width|max-width|min-height|max-height|padding|margin|gap|grid-template|position|inset|top|right|bottom|left|transform)\s*:/;
  const withoutCustomProperties = aerospaceCarbon.replace(/--[\w-]+\s*:[^;]+;/g, "");
  assert.doesNotMatch(withoutCustomProperties, forbiddenGeometry);
  assert.match(aerospaceCarbon, /aerospace-carbon\.webp/);
  assert.match(aerospaceCarbon, /aos-generic-console-slot:has\(\.skin-aerospace-carbon\)/);
  assert.match(aerospaceCarbon, /\.board-command-rail/);
  assert.equal(fs.existsSync(aerospaceCarbonPath), true);
  assert.ok(fs.statSync(aerospaceCarbonPath).size < 12 * 1024);
});

test("Foundry Green adapts currency material by face without changing geometry", () => {
  const forbiddenGeometry = /(?:^|\n)\s*(?:width|height|min-width|max-width|min-height|max-height|padding|margin|gap|grid-template|position|inset|top|right|bottom|left|transform)\s*:/;
  const withoutCustomProperties = foundryGreen.replace(/--[\w-]+\s*:[^;]+;/g, "");
  assert.doesNotMatch(withoutCustomProperties, forbiddenGeometry);
  assert.match(foundryGreen, /\.ixi-location-f3-v12\.skin-foundry-green/);
  assert.match(foundryGreen, /foundry-green-paper\.webp/);
  assert.match(foundryGreen, /foundry-green-guilloche\.svg/);
  assert.match(foundryGreen, /foundry-green-ixi-seal\.svg/);
  assert.doesNotMatch(foundryGreen, /foundry-green-medallion\.webp/);
  assert.match(foundryGreen, /\.board-command-rail/);
  assert.match(foundryGreen, /aos-generic-console-slot:has\(\.skin-foundry-green\)/);
  foundryAssets.forEach(file => assert.equal(fs.existsSync(file), true));
  const totalBytes = foundryAssets.reduce((sum, file) => sum + fs.statSync(file).size, 0);
  assert.ok(totalBytes < 72 * 1024, `Foundry Green assets must stay under 72 KiB; received ${totalBytes}`);
});
