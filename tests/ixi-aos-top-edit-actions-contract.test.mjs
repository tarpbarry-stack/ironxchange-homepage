import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const donor = read("components/ixi-aos/cards/location/IXIAosLocationOverviewCard.jsx");
const editor = read("components/ixi-aos/card-runtime/modules/IXIAosInlineFace1Editor.jsx");
const runtime = read("components/ixi-aos/card-runtime/modules/IXIAosFace1CardRuntime.jsx");

test("Cards 004-017 use the same top edit-action placement as Cards 001-003", () => {
  assert.match(donor, /\.gov-inline-edit-actions\{position:absolute;top:8px;right:8px/u);
  assert.match(editor, /\.ixi-inline-edit-actions\{position:absolute;top:8px;right:8px/u);
  assert.match(editor, /className="ixi-inline-edit-actions"/u);
  assert.match(editor, />\s*\{saving \? "SAVING" : "SAVE"\}\s*<\/button>/u);
  assert.match(editor, />CANCEL<\/button>/u);
});

test("edit actions remain in the card header rather than inside the field editor", () => {
  const actionsIndex = editor.indexOf('className="ixi-inline-edit-actions"');
  const fieldEditorIndex = editor.indexOf('className="ixi-inline-field-editor"');
  assert.ok(actionsIndex > -1);
  assert.ok(fieldEditorIndex > actionsIndex);

  const fieldEditorMarkup = editor.slice(fieldEditorIndex, editor.indexOf("</section>", fieldEditorIndex));
  assert.doesNotMatch(fieldEditorMarkup, /className="ixi-inline-edit-actions"/u);
});

test("the shared repair covers every numbered card from 004 through 017", () => {
  assert.match(runtime, /<IXIAosInlineFace1Editor/u);

  for (let number = 4; number <= 17; number += 1) {
    const card = String(number).padStart(3, "0");
    const suffix = number === 4 || number === 5 || number === 6
      ? "Personnel"
      : number === 7
        ? "EmployeeApplication"
        : number === 8
          ? "Profile"
          : "";
    const source = read(`components/ixi-aos/cards/${card}/IXIAosCard${card}${suffix}.jsx`);
    assert.match(source, /IXIAosFace1CardRuntime/u, `Card ${card} must use the shared Face 1 edit runtime`);
    assert.match(source, new RegExp(`cardNumber=\\{${number}\\}`, "u"), `Card ${card} must publish its card number`);
  }
});

test("007A, 007B, and 007C remain on the shared Card 007 edit contract", () => {
  const card007 = read("components/ixi-aos/cards/007/IXIAosCard007EmployeeApplication.jsx");
  assert.match(card007, /\["007A", "007B", "007C"\]/u);
  assert.match(card007, /<IXIAosFace1CardRuntime cardNumber=\{7\}/u);
});
