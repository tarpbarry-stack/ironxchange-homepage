import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Card 008 leaves Recall Board Return to the one canonical operating toolbar", async () => {
  const [profileLayout, runtime] = await Promise.all([
    read("components/ixi-aos/cards/generic/IXIAosGenericObjectLayout007.jsx"),
    read("components/ixi-aos/card-runtime/IXIAosOperatingCardRuntime.jsx")
  ]);

  assert.doesNotMatch(profileLayout, /go007-actions/u);
  assert.doesNotMatch(profileLayout, />RECALL<\/b>/u);
  assert.match(runtime, /ixi-aos-canonical-command-overlay/u);
  assert.match(runtime, /!transactActive/u);
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
  assert.match(strip, /bottom: 20px/u);
  assert.match(strip, /color: var\(--ix-yellow,#ffc400\)/u);
  assert.doesNotMatch(strip, /color: #00c2ff/u);
  assert.match(strip, /onReturn\)/u);
  assert.doesNotMatch(strip, /onReturn \|\| onRecall/u);
  assert.match(runtime, /<IXIAosContainerCommandStrip[\s\S]*?onRecall=\{onRecall\}[\s\S]*?onBoard=\{onBoard\}[\s\S]*?onReturn=\{onReturn\}/u);
  assert.match(runtime, /\{!transactActive \? \([\s\S]*?<IXIAosContainerCommandStrip/u);
  assert.match(card018, /<IXIAosContainerCommandStrip[\s\S]*?onReturn=\{onReturn\}/u);
  assert.match(modules, /onReturn=\{\s*onReturn\s*\}/u);
  assert.doesNotMatch(modules, /onReturn=\{\s*onRecall\s*\}/u);
});

test("container Recall gathers every canonical member into that container and Return owns the operation snapshot", async () => {
  const work = await read("pages/aos/work.js");
  const recallImplementation = work.match(
    /async function recallContainerChildren\(container\)([\s\S]*?)\n\}\n\s*\nfunction moveMachineToContainer/u
  )?.[1] || "";

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
  assert.doesNotMatch(
    recallImplementation,
    /hasContainerReturnSnapshot/u,
    "Recall must replace the Board snapshot; an existing Return snapshot cannot suppress the command"
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
