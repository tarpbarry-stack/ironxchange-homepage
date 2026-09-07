import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const donor = read("components/ixi-aos/cards/location/IXIAosLocationOverviewCard.jsx");
const editor = read("components/ixi-aos/card-runtime/modules/IXIAosCommercialObjectEditor.jsx");
const bridge = read("components/ixi-aos/card-runtime/modules/IXIAosCommercialEditorBridge.jsx");
const runtime = read("components/ixi-aos/card-runtime/modules/IXIAosFace1CardRuntime.jsx");

test("Cards 001-019 use the commercial editor header actions", () => {
  assert.match(donor, /\.gov-inline-edit-actions\{position:absolute;top:8px;right:8px/u);
  assert.match(editor, /<nav>/u);
  assert.match(editor, /disabled=\{saving \|\| Boolean\(mediaStatus\)\} onClick=\{save\}>SAVE<\/button>/u);
  assert.match(editor, />CANCEL<\/button>/u);
});

test("edit actions remain in the commercial editor header rather than inside fields", () => {
  const actionsIndex = editor.indexOf("<nav>");
  const fieldEditorIndex = editor.indexOf("<section>");
  assert.ok(actionsIndex > -1);
  assert.ok(fieldEditorIndex > actionsIndex);
  assert.match(bridge, /IXIAosEditorCommandProvider/u);
});

test("the shared repair covers every numbered card from 001 through 019", () => {
  assert.doesNotMatch(runtime, /IXIAosInlineFace1Editor/u);

  for (let number = 1; number <= 18; number += 1) {
    const card = String(number).padStart(3, "0");
    const suffix = number <= 3
      ? "Location"
      : number === 4 || number === 5 || number === 6
      ? "Personnel"
      : number === 7
        ? "EmployeeApplication"
        : number === 8
          ? "Profile"
          : "";
    const source = read(`components/ixi-aos/cards/${card}/IXIAosCard${card}${suffix}.jsx`);
    assert.match(source, /IXIAosCommercialEditorBridge/u, `Card ${card} must use the commercial editor`);
    assert.match(source, /IXIAosFace1CardRuntime/u, `Card ${card} must preserve its Face 1 presentation runtime`);
    if (number === 18) {
      assert.match(source, /cardNumber=\{cardDefinition\.cardNumber\}/u, "Card 018/019 must publish the selected card number");
    } else {
      assert.match(source, new RegExp(`cardNumber=\\{${number}\\}`, "u"), `Card ${card} must publish its card number`);
    }
  }

  const card019 = read("components/ixi-aos/cards/019/IXIAosCard019.jsx");
  assert.match(card019, /IXIAosCard018/u, "Card 019 must delegate to the shared Card 018 contract");
});

test("007A, 007B, and 007C remain on the shared Card 007 edit contract", () => {
  const card007 = read("components/ixi-aos/cards/007/IXIAosCard007EmployeeApplication.jsx");
  assert.match(card007, /\["007A", "007B", "007C"\]/u);
  assert.match(card007, /<IXIAosFace1CardRuntime cardNumber=\{7\}/u);
});
