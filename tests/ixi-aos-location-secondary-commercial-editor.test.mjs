import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Location Cards 001-003 route faces 2-5 through one commercial editor", () => {
  const consoleSource = read("components/ixi-aos/console-runtime/IXIAosLocationObjectConsole.jsx");
  assert.match(consoleSource, /IXIAosCommercialEditorBridge/u);
  assert.match(consoleSource, /faceNumber=\{resolved\}/u);
  assert.match(consoleSource, /persistenceAdapter=\{typeof onSaveObject === "function" \? onSaveObject : null\}/u);
  assert.match(consoleSource, /secondaryShared = \{ \.\.\.shared, object: runtimeObject \}/u);
});

test("Edit is an explicit command, not a DOM interception race", () => {
  const bridge = read("components/ixi-aos/card-runtime/modules/IXIAosCommercialEditorBridge.jsx");
  const controls = read("components/ixi-aos/card-runtime/modules/IXIAosCardHeaderControls.jsx");
  const context = read("components/ixi-aos/card-runtime/IXIAosEditorCommandContext.jsx");

  assert.doesNotMatch(bridge, /onClickCapture|closest\?\./u);
  assert.match(bridge, /openEditor=\{editSession\.begin\}/u);
  assert.match(controls, /resolvedOnEdit/u);
  assert.match(context, /IXIAosEditorCommandProvider/u);
});

test("The retired Face 1 editor and duplicate edit-session hook are removed", () => {
  assert.equal(fs.existsSync(new URL("../components/ixi-aos/card-runtime/modules/IXIAosInlineFace1Editor.jsx", import.meta.url)), false);
  assert.equal(fs.existsSync(new URL("../components/ixi-aos/card-runtime/modules/useIXIAosFace1EditSession.js", import.meta.url)), false);
});
