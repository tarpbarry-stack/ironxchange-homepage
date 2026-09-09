import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Card 008 exposes the same Recall Board Return toolbar as Card 018", async () => {
  const profileLayout = await read(
    "components/ixi-aos/cards/generic/IXIAosGenericObjectLayout007.jsx"
  );

  assert.match(profileLayout, /onRecall = null/u);
  assert.match(profileLayout, /onBoard = null/u);
  assert.match(profileLayout, /onReturn = null/u);
  assert.match(profileLayout, /command\(event, onRecall\)/u);
  assert.match(profileLayout, /command\(event, onBoard\)/u);
  assert.match(profileLayout, /command\(event, onReturn\)/u);
  assert.match(profileLayout, />RECALL<\/b>/u);
  assert.match(profileLayout, />BOARD<\/b>/u);
  assert.match(profileLayout, />RETURN<\/b>/u);
  assert.doesNotMatch(profileLayout, />ACTION<\/b>/u);
  assert.doesNotMatch(profileLayout, />CONTACT<\/b>/u);
  assert.doesNotMatch(profileLayout, />RECORDS<\/b>/u);
});

test("every durable numbered AOS card receives the universal command handlers", async () => {
  const [board, runtime] = await Promise.all([
    read("components/ixi-mos/workspace/IXIAosWorkspaceBoard.jsx"),
    read("components/ixi-aos/card-runtime/IXIAosOperatingCardRuntime.jsx")
  ]);

  assert.match(
    board,
    /workspaceDropSurface=\{`container:\$\{id\}`\}[\s\S]*?onBoard=\{\(\) =>[\s\S]*?onExposeContainerChildren/u
  );
  assert.match(
    board,
    /workspaceDropSurface=\{`container:\$\{id\}`\}[\s\S]*?onRecall=\{\(\) =>[\s\S]*?onGatherContainerChildren/u
  );
  assert.match(
    board,
    /workspaceDropSurface=\{`container:\$\{id\}`\}[\s\S]*?onReturn=\{\(\) =>[\s\S]*?onReturnContainerChildren/u
  );
  assert.match(runtime, /const shared = \{[\s\S]*?onRecall,[\s\S]*?onBoard,[\s\S]*?onReturn,/u);
  assert.match(runtime, /const Card = NUMBERED_CARDS\[cardNumber\]/u);
  assert.match(runtime, /<Card \{\.\.\.consoleProps\} \/>/u);
});

test("every operating card uses the full-width command geometry and exact handlers", async () => {
  const [strip, runtime, card018, modules] = await Promise.all([
    read("components/ixi-aos/card-runtime/modules/IXIAosContainerCommandStrip.jsx"),
    read("components/ixi-aos/card-runtime/IXIAosOperatingCardRuntime.jsx"),
    read("components/ixi-aos/cards/018/IXIAosCard018.jsx"),
    read("components/ixi-aos/container-runtime/IXIAosContainerModules.jsx")
  ]);

  assert.match(strip, /left: 5px/u);
  assert.match(strip, /right: 5px/u);
  assert.match(strip, /gap: 4px/u);
  assert.match(strip, /flex: 1 1 0/u);
  assert.match(strip, /min-width: 0/u);
  assert.match(strip, /height: 23px/u);
  assert.match(strip, /bottom: 79px/u);
  assert.match(strip, /color: #00c2ff/u);
  assert.match(strip, /onReturn\)/u);
  assert.doesNotMatch(strip, /onReturn \|\| onRecall/u);
  assert.match(runtime, /<IXIAosContainerCommandStrip[\s\S]*?onRecall=\{onRecall\}[\s\S]*?onBoard=\{onBoard\}[\s\S]*?onReturn=\{onReturn\}/u);
  assert.match(card018, /<IXIAosContainerCommandStrip[\s\S]*?onReturn=\{onReturn\}/u);
  assert.match(modules, /onReturn=\{\s*onReturn\s*\}/u);
  assert.doesNotMatch(modules, /onReturn=\{\s*onRecall\s*\}/u);
});

test("container Recall gathers every canonical member into that container and Return owns the operation snapshot", async () => {
  const work = await read("pages/aos/work.js");

  assert.match(
    work,
    /async function recallContainerChildren\(container\)[\s\S]*?getContainerRequestedChildIds\(container\)[\s\S]*?targetSurface[\s\S]*?"indexEquipment"[\s\S]*?`container:\$\{containerId\}`/u
  );
  assert.match(
    work,
    /moveObjectToWorkspaceSurface\(\{[\s\S]*?objectId,[\s\S]*?targetSurface[\s\S]*?controller\.persistLayout\(recalledPlacements,[\s\S]*?objectIds: childIds/u
  );
  assert.match(
    work,
    /containerReturnSnapshotsRef\.current\[containerId\] = \{[\s\S]*?operationId,[\s\S]*?childIds: \[\.\.\.childIds\]/u
  );
  assert.doesNotMatch(
    work,
    /async function recallContainerChildren\(container\)[\s\S]{0,900}?controller\.recall\(childIds\)/u
  );
});
test("container Board exposes every canonical member from authoritative session state in one governed operation", async () => {
  const work = await read("pages/aos/work.js");

  assert.match(
    work,
    /async function boardContainerChildren\(container\)[\s\S]*?getContainerRequestedChildIds\(container\)[\s\S]*?controller\.readPlacements\(\)[\s\S]*?targetSurface: "board"/u
  );
  assert.match(
    work,
    /controller\.persistLayout\(nextPlacements, \{[\s\S]*?objectIds: childIds,[\s\S]*?activeSummonedContext: containerId/u
  );
  assert.doesNotMatch(
    work,
    /async function boardContainerChildren\(container\)[\s\S]{0,1400}?summonMany\(/u
  );
});
