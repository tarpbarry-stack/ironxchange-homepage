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
  numberedAos: fs.readFileSync(
    "components/ixi-aos/console-runtime/IXIAosNumberedObjectConsole.jsx",
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
    /className="ixi-aos-location-console-face-button"/
  );
  assert.match(
    sources.numberedAos,
    /className="ixi-aos-numbered-console-face-button"/
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

test("current AOS Consoles loop each open face slot independently", () => {
  for (const source of [sources.location, sources.numberedAos]) {
    assert.match(source, /cycleConsoleSlotFace/u);
    assert.match(source, /slots: consoleSlots,[\s\S]*?slotId,[\s\S]*?faces: AVAILABLE_FACES/u);
    assert.match(source, /onPointerDown=\{stop\}/u);
    assert.match(source, /onClick=\{event => cycleSlotFace\(slot\.slotId, event\)\}/u);
  }
});

test("current AOS Console actuators retain approved bottom-edge geometry", () => {
  assert.match(
    sources.location,
    /\.ixi-aos-location-console-face-button\{[^}]*bottom:-1px;[^}]*width:34px;height:5px;/u
  );
  assert.match(
    sources.numberedAos,
    /\.ixi-aos-numbered-console-face-button\{[^}]*bottom:-1px;[^}]*width:34px;height:5px;/u
  );
  assert.doesNotMatch(sources.location, /aos-face-id/u);
});

test("machine console cycles each workspace independently and persists its face", () => {
  assert.match(
    sources.transact,
    /cycleConsoleSlotFace\(\{/
  );
  assert.match(
    sources.transact,
    /slotId,\s*faces:\s*MACHINE_CONSOLE_FACES/
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
    /\.tx-console-face-button \{[\s\S]*?position: absolute;[\s\S]*?bottom: -1px;/
  );
  assert.match(
    sources.transact,
    /width: 34px;[\s\S]*?height: 5px;/
  );
  assert.doesNotMatch(sources.transact, /tx-console-face-button span/);
});
