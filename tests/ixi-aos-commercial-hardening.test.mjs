import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const bridge = read(
  "components/ixi-aos/card-runtime/modules/IXIAosCommercialEditorBridge.jsx"
);
const editor = read(
  "components/ixi-aos/card-runtime/modules/IXIAosCommercialObjectEditor.jsx"
);
const adapter = read(
  "components/ixi-aos/card-runtime/IXIAosDataContractCardAdapter.jsx"
);
const noticeContext = read(
  "components/ixi-aos/card-runtime/IXIAosCardCommandContext.jsx"
);
const auctionFace = read(
  "components/ixi-auction-object/IXIAuctionObjectFace2.js"
);
const deadlineRail = read(
  "components/ixi-auction-object/IXIAuctionDeadlineRail.js"
);

test("commercial editor renders the actual IXI notification bus lifecycle", () => {
  assert.match(bridge, /IXIAosCardCommandProvider/u);
  assert.match(bridge, /IXIAosActionNotice/u);
  assert.match(bridge, /runIXIActionNoticeLifecycle/u);
  assert.match(bridge, /savingMessage:\s*"SAVING\.\.\."/u);
  assert.match(bridge, /successMessage:\s*"SAVED"/u);
  assert.match(bridge, /errorMessage:\s*"NOT SAVED"/u);
  assert.match(noticeContext, /IXI_ACTION_NOTICE_EVENT/u);
  assert.match(noticeContext, /window\.addEventListener/u);
});

test("commercial editor never fabricates blank schema rows", () => {
  assert.doesNotMatch(editor, /minimumCustomFields/u);
  assert.doesNotMatch(adapter, /createStableCustomFieldDefinition/u);
  assert.doesNotMatch(adapter, /while\s*\(customCount/u);
  assert.match(editor, /function addField\(/u);
  assert.match(editor, /\+ ADD FIELD/u);
});

test("auction calendar dates hydrate deterministically", () => {
  assert.match(auctionFace, /Date\.UTC/u);
  assert.match(auctionFace, /timeZone:\s*"UTC"/u);
});

test("auction local time and countdown begin after hydration", () => {
  assert.match(deadlineRail, /displayTimezone/u);
  assert.match(deadlineRail, /useState\("UTC"\)/u);
  assert.match(deadlineRail, /setDisplayTimezone\([\s\S]*?getUserTimezone/u);
  assert.match(deadlineRail, /remainingMs,[\s\S]*?setRemainingMs[\s\S]*?useState\(null\)/u);
  assert.doesNotMatch(deadlineRail, /useState\(\(\)\s*=>[\s\S]*?Date\.now/u);
});
