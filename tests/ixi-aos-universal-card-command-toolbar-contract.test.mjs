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
