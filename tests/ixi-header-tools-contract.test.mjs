import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(path) {
  return fs.readFileSync(
    new URL(`../${path}`, import.meta.url),
    "utf8"
  );
}

test("the shared top header exposes one workspace tools rail", () => {
  const navbar = read("components/Navbar.js");

  assert.match(
    navbar,
    /data-ixi-header-tools="true"/u
  );
  assert.match(
    navbar,
    /className="header-tools"/u
  );
});

test("Ticket and card scale controls portal into the header rail", () => {
  const portal = read(
    "components/ixi-chassis/IXIHeaderToolPortal.jsx"
  );
  const ticket = read(
    "components/ixi-tickets/IXIGlobalTicketLauncher.jsx"
  );
  const scale = read(
    "components/ixi-chassis/IXICardScaleControl.jsx"
  );

  assert.match(portal, /createPortal\(children, target\)/u);
  assert.match(
    portal,
    /\[data-ixi-header-tools="true"\]/u
  );
  assert.match(ticket, /<IXIHeaderToolPortal>/u);
  assert.match(scale, /<IXIHeaderToolPortal>/u);
});

test("header placement preserves floating fallback and scale behavior", () => {
  const ticket = read(
    "components/ixi-tickets/IXIGlobalTicketLauncher.jsx"
  );
  const scale = read(
    "components/ixi-chassis/IXICardScaleControl.jsx"
  );

  assert.match(ticket, /position: fixed/u);
  assert.match(ticket, /position: static/u);
  assert.match(scale, /position: fixed/u);
  assert.match(scale, /position: static/u);
  assert.match(scale, /type="range"/u);
  assert.match(
    scale,
    /stepCardScaleMode\(currentMode, 1\)/u
  );
  assert.match(
    scale,
    /stepCardScaleMode\(currentMode, -1\)/u
  );
});
