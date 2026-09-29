import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Card 008 owns one compact Recall Board Return toolbar without a runtime override", async () => {
  const [profileLayout, runtime, strip] = await Promise.all([
    read("components/ixi-aos/cards/generic/IXIAosGenericObjectLayout007.jsx"),
    read("components/ixi-aos/card-runtime/IXIAosOperatingCardRuntime.jsx"),
    read("components/ixi-aos/card-runtime/modules/IXIAosContainerCommandStrip.jsx")
  ]);

  assert.doesNotMatch(profileLayout, /go007-actions/u);
  assert.match(profileLayout, /<IXIAosContainerCommandStrip[\s\S]*?bottomOffset=\{20\}/u);
  assert.match(profileLayout, /onRecall=\{onRecall\}[\s\S]*?onBoard=\{onBoard\}[\s\S]*?onReturn=\{onReturn\}/u);
  assert.match(strip, /bottom: var\(--ixi-aos-command-bottom, 79px\)/u);
  assert.doesNotMatch(runtime, /ixi-aos-canonical-command-overlay/u);
  assert.doesNotMatch(runtime, /\[class\*="-commands"\]/u);
  assert.doesNotMatch(runtime, /<IXIAosContainerCommandStrip/u);
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

test("card families own command placement while sharing exact command behavior", async () => {
  const [strip, runtime, card018, profileLayout, modules] = await Promise.all([
    read("components/ixi-aos/card-runtime/modules/IXIAosContainerCommandStrip.jsx"),
    read("components/ixi-aos/card-runtime/IXIAosOperatingCardRuntime.jsx"),
    read("components/ixi-aos/cards/018/IXIAosCard018.jsx"),
    read("components/ixi-aos/cards/generic/IXIAosGenericObjectLayout007.jsx"),
    read("components/ixi-aos/container-runtime/IXIAosContainerModules.jsx")
  ]);

  assert.match(strip, /left: 5px/u);
  assert.match(strip, /right: 5px/u);
  assert.match(strip, /gap: 4px/u);
  assert.match(strip, /flex: 1 1 0/u);
  assert.match(strip, /min-width: 0/u);
  assert.match(strip, /height: 23px/u);
  assert.match(strip, /bottomOffset = 79/u);
  assert.match(strip, /--ixi-aos-command-bottom/u);
  assert.match(strip, /color: var\(--ix-yellow,#ffc400\)/u);
  assert.doesNotMatch(strip, /color: #00c2ff/u);
  assert.match(strip, /onReturn\)/u);
  assert.doesNotMatch(strip, /onReturn \|\| onRecall/u);
  assert.doesNotMatch(runtime, /<IXIAosContainerCommandStrip/u);
  assert.doesNotMatch(runtime, /display: none !important/u);
  assert.match(card018, /<IXIAosContainerCommandStrip[\s\S]*?onReturn=\{onReturn\}[\s\S]*?bottomOffset=\{79\}/u);
  assert.match(profileLayout, /<IXIAosContainerCommandStrip[\s\S]*?onReturn=\{onReturn\}[\s\S]*?bottomOffset=\{20\}/u);
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
