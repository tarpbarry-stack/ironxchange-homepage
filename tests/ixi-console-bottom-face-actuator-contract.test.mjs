import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const sources = {
  marketplace: fs.readFileSync(
    "components/ixi-machine-object/IXIMarketplaceObjectConsole.jsx",
    "utf8"
  ),
  private: fs.readFileSync(
    "components/ixi-private-object/IXIPrivateObjectConsole.jsx",
    "utf8"
  ),
  auction: fs.readFileSync(
    "components/ixi-auction-object/IXIAuctionObjectConsole.jsx",
    "utf8"
  ),
  aos: fs.readFileSync(
    "components/ixi-aos/console-runtime/IXIAosObjectConsole.jsx",
    "utf8"
  ),
  location: fs.readFileSync(
    "components/ixi-aos/console-runtime/IXIAosLocationObjectConsole.jsx",
    "utf8"
  ),
  systemIndex: fs.readFileSync(
    "components/ixi-mos/system-index/IXISystemIndexConsole.jsx",
    "utf8"
  ),
  transact: fs.readFileSync(
    "components/ixi-aos/transact/IXITransactObjectConsole.jsx",
    "utf8"
  )
};

test("every production Console family exposes a bottom face actuator", () => {
  assert.match(
    sources.marketplace,
    /ixi-marketplace-console-face-button/
  );
  assert.match(
    sources.private,
    /ixi-private-console-face-button/
  );
  assert.match(
    sources.auction,
    /ixi-auction-console-face-button/
  );
  assert.match(
    sources.aos,
    /ixi-aos-console-face-button/
  );
  assert.match(
    sources.location,
    /className="aos-face-id"/
  );
  assert.match(
    sources.systemIndex,
    /ixi-system-index-console-face-button/
  );
  assert.match(
    sources.transact,
    /className="tx-console-face-button"/
  );
});

test("TRAN$ACT cycles each module independently and persists its face", () => {
  assert.match(
    sources.transact,
    /cycleConsoleSlotFace\(\{/
  );
  assert.match(
    sources.transact,
    /slotId,\s*faces:\s*TRANSACT_CONSOLE_FACES/
  );
  assert.match(
    sources.transact,
    /saveSlots\(\s*cycleConsoleSlotFace/
  );
  assert.match(
    sources.transact,
    /data-ixi-transact-console-face=\{/
  );
  assert.match(
    sources.transact,
    /onPointerDown=\{event => \{\s*event\.preventDefault\(\);\s*event\.stopPropagation\(\);/
  );
});

test("TRAN$ACT face actuator remains on the console bottom edge", () => {
  assert.match(
    sources.transact,
    /\.tx-console-face-button \{[\s\S]*?position: absolute;[\s\S]*?bottom: 0;/
  );
  assert.match(
    sources.transact,
    /width: 36px;[\s\S]*?height: 7px;/
  );
});
