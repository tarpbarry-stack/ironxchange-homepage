import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync("pages/aos/work.js", "utf8");
const workspaceBoard = fs.readFileSync(
  "components/ixi-mos/workspace/IXIAosWorkspaceBoard.jsx",
  "utf8"
);
const board = fs.readFileSync(
  "components/ixi-chassis/IXIBoard.js",
  "utf8"
);
const locationRuntime = fs.readFileSync(
  "components/ixi-aos/card-runtime/IXIAosOperatingCardRuntime.jsx",
  "utf8"
);
const locationConsole = fs.readFileSync(
  "components/ixi-aos/console-runtime/IXIAosLocationObjectConsole.jsx",
  "utf8"
);
const systemIndexConsole = fs.readFileSync(
  "components/ixi-mos/system-index/IXISystemIndexConsole.jsx",
  "utf8"
);

test("production AOS Work keeps the authoritative registry and persistence architecture", () => {
  assert.match(page, /useIXIAosWorkspaceRegistry/u);
  assert.match(page, /workspacePlacements/u);
  assert.match(page, /fetchIxiMachineState\(String\(userId\)\)/u);
  assert.match(page, /saveIxiMachinePatch/u);
  assert.match(page, /<IXIAosWorkspaceBoard/u);
  assert.match(workspaceBoard, /<IXISystemIndexConsole/u);
  assert.match(workspaceBoard, /<IXIAosOperatingCardRuntime/u);
  assert.doesNotMatch(page, /mobile-dnd-natural|mobile-dnd-repair/u);
});

test("AOS Work owns the approved shared mobile I and II presentation", () => {
  assert.match(page, /aria-label="AOS Work card density"/u);
  assert.match(page, /IXI_MOBILE_CARD_DENSITY_KEY =\s*"ixi-mobile-card-density"/u);
  assert.match(page, /cardScaleMode=\{presentedCardScaleMode\}/u);
  assert.match(page, /mobilePresentation=\{isMobileCardPresentation\}/u);
  assert.match(page, /mobileCardDensity=\{mobileCardDensity\}/u);
  assert.match(page, /ixi-mobile-aos-work-card-board-i\) \{[\s\S]*?padding-left: 4px;[\s\S]*?padding-right: 4px;/u);
  assert.match(page, /ixi-mobile-aos-work-card-board-ii\) \{[\s\S]*?gap: 10px 4px;[\s\S]*?padding-left: 2px;[\s\S]*?padding-right: 2px;/u);
  assert.match(page, /className="desktop-card-scale-control"/u);
});

test("real AOS cards and their complete Console assemblies fit the mobile cell", () => {
  assert.match(workspaceBoard, /fitCardScalingToCell=\{mobilePresentation\}/u);
  assert.match(workspaceBoard, /fillCardScalingToCell=\{[\s\S]*?mobileCardDensity === "I"/u);
  assert.match(workspaceBoard, /resolveIXIAosOperatingCardNumber/u);
  assert.match(workspaceBoard, /return \{ width: 300, height: 475 \}/u);
  assert.match(workspaceBoard, /width: slots\.length \* 298 \+ 2/u);
  assert.match(board, /customItem[\s\S]*?fitCardScalingToCell[\s\S]*?<IXIFitWidthObjectShell/u);
  assert.match(locationRuntime, /width: 300px;[\s\S]*?height: 475px;/u);
  assert.match(locationRuntime, /width: 298px;[\s\S]*?height: 471px;/u);
  assert.match(page, /\.ixi-console-expanded\) \{\s*grid-column: 1 \/ -1;/u);
});

test("AOS mobile Console opens one real side, can switch sides, and persists through the existing state writer", () => {
  assert.match(locationRuntime, /mobileSingleSideConsole=\{mobileSingleSideConsole\}/u);
  assert.match(locationConsole, /normalizeSingleSideConsoleSlots/u);
  assert.match(locationConsole, /normalizeSingleSideConsoleSlots\([\s\S]*?slotsWithModule,[\s\S]*?\{ side \}/u);
  assert.match(locationConsole, /onIxiStateChange\?\.\([\s\S]*?createConsoleSlotsPatch/u);
  assert.match(systemIndexConsole, /normalizeSingleSideConsoleSlots/u);
  assert.match(systemIndexConsole, /normalizeSingleSideConsoleSlots\([\s\S]*?consoleSlots,[\s\S]*?\{ side \}/u);
  assert.match(workspaceBoard, /mobileSingleSideConsole:\s*mobilePresentation/u);
  assert.match(workspaceBoard, /mobileSingleSideConsole=\{mobilePresentation\}/u);
});

test("AOS mobile vertical scroll wins until an intentional 500 millisecond hold", () => {
  assert.match(page, /MouseSensor/u);
  assert.match(page, /TouchSensor/u);
  assert.match(page, /MOBILE_TOUCH_HOLD_MS = 500/u);
  assert.match(page, /MOBILE_TOUCH_TOLERANCE_PX = 5/u);
  assert.match(page, /delay: MOBILE_TOUCH_HOLD_MS/u);
  assert.match(page, /touch-action: manipulation !important;/u);
  assert.match(page, /-webkit-user-select: none;/u);
  assert.doesNotMatch(page, /PointerSensor/u);
});
