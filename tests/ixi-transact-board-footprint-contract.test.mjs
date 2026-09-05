import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const board = fs.readFileSync(
  "components/ixi-chassis/IXIBoard.js",
  "utf8"
);

const ownedRuntime = fs.readFileSync(
  "components/ixi-machine-card/private/IXIOwnedPrivateListingRuntime.jsx",
  "utf8"
);

const transactRuntime = fs.readFileSync(
  "components/ixi-machine-card/private/IXIOwnedPrivateTransactRuntime.jsx",
  "utf8"
);

const transactConsole = fs.readFileSync(
  "components/ixi-aos/transact/IXITransactObjectConsole.jsx",
  "utf8"
);

test("owned private TRAN$ACT publishes its active layout identity", () => {
  assert.match(
    ownedRuntime,
    /transactOpen:\s*open/
  );
  assert.match(
    ownedRuntime,
    /layoutObjectId=\{ownerActionBridgeKey\}/
  );
  assert.match(
    ownedRuntime,
    /onClose=\{\(\) => setTransactVisibility\(false\)\}/
  );
  assert.match(
    transactRuntime,
    /layoutObjectId=\{layoutObjectId\}/
  );
});

test("TRAN$ACT console persists independent slot geometry on the board object", () => {
  assert.match(
    transactConsole,
    /stateObjectId\s*=\s*String\(layoutObjectId \|\| objectId\)/
  );
  assert.match(
    transactConsole,
    /transactConsoleSlots:\s*normalized/
  );
  assert.match(
    transactConsole,
    /transactConsoleDepth:\s*normalized\.length/
  );
  assert.match(
    transactConsole,
    /transactConsoleOpen:\s*normalized\.length > 1/
  );
});

test("shared board reserves scaled TRAN$ACT width for flex reflow and DnD geometry", () => {
  assert.match(
    board,
    /transactOpen === true/
  );
  assert.match(
    board,
    /transactConsoleDepth \*\s*298 \*\s*scalePreset\.scale/
  );
  assert.match(
    board,
    /width:\s*transactFootprintWidth\s*\? \x60\$\{transactFootprintWidth\}px\x60\s*:\s*"max-content"/
  );
  assert.match(
    board,
    /effectiveConsoleDepth > 1/
  );
});
