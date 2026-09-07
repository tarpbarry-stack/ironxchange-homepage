import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("every numbered AOS operating card exposes the shared record-control Face 2", () => {
  const runtime = read("components/ixi-aos/card-runtime/IXIAosOperatingCardRuntime.jsx");
  const identity = read("components/ixi-aos/card-runtime/IXIAosCardIdentityFace.jsx");

  assert.match(runtime, /currentFace === 2[\s\S]*IXIAosCardIdentityFace/u);
  assert.match(runtime, /currentFace === 1 \? 2 : 1/u);
  assert.match(identity, /data-aos-card-identity-face=\{number\}/u);
  assert.match(identity, /RECORD CONTROL/u);
  assert.match(identity, /IXI - \{passportSerial\}/u);
  assert.doesNotMatch(identity, /<strong>\{number\}<\/strong>/u);
  assert.match(identity, /onCycleFace=\{onCycleFace\}/u);
});

test("location cards 001 through 003 use card identification as Face 2 in cards and Console", () => {
  const consoleRuntime = read("components/ixi-aos/console-runtime/IXIAosLocationObjectConsole.jsx");
  const locationOverview = read("components/ixi-aos/cards/location/IXIAosLocationOverviewCard.jsx");

  assert.match(consoleRuntime, /if \(Number\(faceNumber\) === 2\) return "CARD ID"/u);
  assert.match(consoleRuntime, /resolved === 2[\s\S]*IXIAosCardIdentityFace[\s\S]*cardNumber=\{cardNumber\}/u);
  assert.match(locationOverview, /onCycleFace=\{onCycleFace\}/u);
  assert.match(locationOverview, /onRailSend=\{onRailSend\}/u);
});

test("FaceLab previews expose the same Face 2 contract for cards 004 through 017", () => {
  const preview = read("components/ixi-aos-card-library/IXIAosCardCatalogPreview.jsx");

  assert.match(preview, /renderNumberedPreview/u);
  assert.match(preview, /Number\(current\?\.face \|\| 1\) === 2/u);
  assert.match(preview, /IXIAosCardIdentityFace cardNumber=\{cardNumber\}/u);
  assert.match(preview, /onCycleFace=\{\(\) => update\(object\.objectId, \{ face: 2 \}\)\}/u);
});

test("Face 2 permanently deletes the real AOS object only after explicit confirmation", () => {
  const identity = read("components/ixi-aos/card-runtime/IXIAosCardIdentityFace.jsx");
  const creation = read("components/ixi-mos/object-creation/useIXIMosObjectCreation.js");
  const controls = read("components/ixi-aos/card-runtime/modules/IXIAosCardHeaderControls.jsx");

  assert.match(identity, /PERMANENT · NO RECOVERY/u);
  assert.match(identity, /await onDeleteObject\(object\)/u);
  assert.match(identity, /deleteArmed \? "CONFIRM PERMANENT DELETE" : "DELETE FROM AOS"/u);
  assert.match(identity, /REMOVES THIS RECORD FROM IX CORE AND THIS WORKSPACE/u);
  assert.match(creation, /await deleteMosObject\(\{[\s\S]*objectId/u);
  assert.match(creation, /removeWorkspaceObjectId\([\s\S]*workspacePlacements,[\s\S]*objectId/u);
  assert.match(creation, /OBJECT PERMANENTLY DELETED/u);
  assert.match(controls, /onDelete\(runtimeObject\)/u);
});
