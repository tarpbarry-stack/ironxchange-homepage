import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  IXI_RELATIONSHIP_COLORS,
  IXI_RELATIONSHIP_OUTLINES,
  getNextIXIRelationshipColor,
  getNextIXIRelationshipOutline
} from "../components/ixi-object-system/IXIRailStateEngine.mjs";

const read = path =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("the canonical IXI rail keeps all seven independently wired command zones", async () => {
  const rail = await read("components/IXIMachineRail.js");

  assert.equal((rail.match(/rail-zone rail-half/g) || []).length, 2);
  assert.match(rail, /rail-zone rail-color/u);
  assert.match(rail, /rail-zone rail-width/u);
  assert.match(rail, /rail-zone rail-flip/u);
  assert.match(rail, /rail-zone rail-send/u);
  assert.match(rail, /rail-zone rail-sync/u);
  assert.match(rail, /onSendFront\?\.\(listing\)/u);
  assert.match(rail, /onCycleColor/u);
  assert.match(rail, /onCycleOutline/u);
  assert.match(rail, /onCycleMachineFace\?\.\(listing\)/u);
  assert.match(rail, /onRailSend\?\.\(listing\)/u);
  assert.match(rail, /onSendToArmedDestination\?\.\(listing\)/u);
  assert.match(rail, /onSendBack\?\.\(listing\)/u);
});

test("AOS operating cards supply native color, strength, next-face and previous-face behavior", async () => {
  const runtime = await read(
    "components/ixi-aos/card-runtime/IXIAosOperatingCardRuntime.jsx"
  );

  assert.match(runtime, /getNextIXIRelationshipColor\(ixiState\?\.color\)/u);
  assert.match(runtime, /getNextIXIRelationshipOutline\(ixiState\?\.outline\)/u);
  assert.match(runtime, /const cycleFaceBackward = \(\) =>/u);
  assert.match(runtime, /onCycleColor: cycleColor/u);
  assert.match(runtime, /onCycleOutline: cycleOutline/u);
  assert.match(runtime, /onRailSend:[\s\S]*?cycleFaceBackward/u);
  assert.match(runtime, /const cycleFace = \(\) => setFace\(currentFace === 1 \? 2 : 1\)/u);
});

test("AOS Work wires relationship color and strength into every custom-card path", async () => {
  const board = await read(
    "components/ixi-mos/workspace/IXIAosWorkspaceBoard.jsx"
  );

  assert.match(board, /const cycleObjectColor = event =>/u);
  assert.match(board, /const cycleObjectOutline = event =>/u);
  assert.equal((board.match(/onCycleColor=\{cycleObjectColor\}/g) || []).length, 3);
  assert.equal((board.match(/onCycleOutline=\{cycleObjectOutline\}/g) || []).length, 3);
  assert.doesNotMatch(board, /from "\.\.\/IXISystemIndexCard"/u);
});

test("Cards 001 through 018 retain a canonical IXI rail renderer", async () => {
  const [runtime, location, shell, universal, identity, systemIndex] = await Promise.all([
    read("components/ixi-aos/card-runtime/IXIAosOperatingCardRuntime.jsx"),
    read("components/ixi-aos/cards/location/IXIAosLocationOverviewCard.jsx"),
    read("components/ixi-aos/cards/generic/IXIAosGenericCardRailShell.jsx"),
    read("components/ixi-aos/cards/generic/IXIAosGenericUniversalLayout007.jsx"),
    read("components/ixi-aos/card-runtime/IXIAosCardIdentityFace.jsx"),
    read("components/ixi-mos/IXISystemIndexCard.jsx")
  ]);

  for (let cardNumber = 4; cardNumber <= 18; cardNumber += 1) {
    assert.match(runtime, new RegExp(`${cardNumber}:\\s*IXIAosCard${String(cardNumber).padStart(3, "0")}`));
  }
  assert.match(runtime, /cardNumber <= 3/u);
  assert.match(location, /<IXIObjectRail/u);
  assert.match(shell, /<IXIObjectRail/u);
  assert.match(universal, /<IXIObjectRail/u);
  assert.match(identity, /<IXIObjectRail/u);
  assert.match(systemIndex, /<IXIMachineRail/u);
});

test("container thumbnail rails remain separate from the IXI command rail", async () => {
  const [location, genericContainer, genericShell, universal, systemIndex] = await Promise.all([
    read("components/ixi-aos/cards/location/IXIAosLocationOverviewCard.jsx"),
    read("components/ixi-aos/cards/generic/IXIAosGenericContainerLayoutV12.jsx"),
    read("components/ixi-aos/cards/generic/IXIAosGenericCardRailShell.jsx"),
    read("components/ixi-aos/cards/generic/IXIAosGenericUniversalLayout007.jsx"),
    read("components/ixi-mos/IXISystemIndexCard.jsx")
  ]);

  assert.match(location, /<IXICollectionThumbRail/u);
  assert.match(location, /<IXIObjectRail/u);
  assert.match(genericContainer, /<IXICollectionThumbRail/u);
  assert.match(genericShell, /<IXIObjectRail/u);
  assert.match(universal, /<IXICollectionThumbRail/u);
  assert.match(universal, /<IXIObjectRail/u);
  assert.match(systemIndex, /system-index-thumb-shell/u);
  assert.match(systemIndex, /<IXICollectionThumbRail/u);
  assert.match(systemIndex, /<IXIMachineRail/u);
  assert.match(systemIndex, /onCycleMachineFace=\{goForward\}/u);
  assert.match(systemIndex, /onRailSend=\{goBackward\}/u);
});

test("shared rail state cycles through the established commercial sequence", () => {
  assert.deepEqual(IXI_RELATIONSHIP_COLORS, [
    "none", "green", "yellow", "red", "cyan", "white", "blue", "orange"
  ]);
  assert.deepEqual(IXI_RELATIONSHIP_OUTLINES, [1, 3, 5, 0]);
  assert.equal(getNextIXIRelationshipColor("none"), "green");
  assert.equal(getNextIXIRelationshipColor("orange"), "none");
  assert.equal(getNextIXIRelationshipColor("unknown"), "green");
  assert.equal(getNextIXIRelationshipOutline(1), 3);
  assert.equal(getNextIXIRelationshipOutline(0), 1);
  assert.equal(getNextIXIRelationshipOutline(99), 3);
});

test("wrapped cards paint their rail from persisted IXI state", async () => {
  const shell = await read(
    "components/ixi-aos/cards/generic/IXIAosGenericCardRailShell.jsx"
  );

  assert.match(shell, /const resolvedColor = boardColor \?\? ixiState\?\.color \?\? "none"/u);
  assert.match(shell, /const resolvedOutline = Number\(boardOutline \?\? ixiState\?\.outline \?\? 1\)/u);
  assert.match(shell, /board-color-\$\{resolvedColor\}/u);
  assert.match(shell, /color=\{resolvedColor\}/u);
  assert.match(shell, /outline=\{resolvedOutline\}/u);
});
