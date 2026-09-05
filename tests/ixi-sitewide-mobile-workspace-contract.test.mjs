import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  IXI_WORKSPACE_CARD_FAMILIES,
  getIXIWorkspaceCardFootprint,
  getIXIWorkspaceConsoleSlotCount
} from "../lib/ixiWorkspaceFootprint.js";

const board = fs.readFileSync(
  "components/ixi-chassis/IXIBoard.js",
  "utf8"
);

const sortableObject = fs.readFileSync(
  "components/ixi-chassis/IXISortableObject.jsx",
  "utf8"
);

test("the sitewide workspace contract contains the four real card families", () => {
  assert.deepEqual(
    IXI_WORKSPACE_CARD_FAMILIES,
    {
      MARKETPLACE: "marketplace",
      PRIVATE: "private",
      AUCTION: "auction",
      AOS: "aos"
    }
  );
});

test("the four real card families preserve their native outer geometry", () => {
  const marketplace =
    getIXIWorkspaceCardFootprint({
      cardFamily: "marketplace"
    });

  for (const cardFamily of [
    "private",
    "auction",
    "aos"
  ]) {
    const footprint =
      getIXIWorkspaceCardFootprint({
        cardFamily
      });

    assert.equal(
      footprint.nativeWidth,
      300
    );
    assert.equal(
      footprint.nativeHeight,
      475
    );
  }

  assert.equal(
    marketplace.nativeWidth,
    300
  );
  assert.equal(
    marketplace.nativeHeight,
    400
  );
});

test("Console state expands the sortable footprint instead of overlaying siblings", () => {
  assert.equal(
    getIXIWorkspaceConsoleSlotCount({
      consoleSlots: [
        { type: "listing" },
        { type: "module" }
      ]
    }),
    2
  );

  assert.equal(
    getIXIWorkspaceConsoleSlotCount({
      consoleLeftOpen: true,
      consoleRightOpen: true
    }),
    3
  );

  for (const cardFamily of [
    "marketplace",
    "private",
    "auction",
    "aos"
  ]) {
    const consoleFootprint =
      getIXIWorkspaceCardFootprint({
        cardFamily,
        consoleSlotCount: 2
      });

    assert.equal(
      consoleFootprint.nativeWidth,
      599
    );
    assert.equal(
      consoleFootprint.nativeHeight,
      cardFamily === "marketplace"
        ? 400
        : 475
    );
  }
});

test("IXIBoard publishes an explicit live footprint to the sortable chassis", () => {
  assert.match(
    board,
    /getIXIWorkspaceCardFootprint/
  );
  assert.match(
    board,
    /width:\s*`\$\{workspaceFootprint\.renderedWidth\}px`/
  );
  assert.match(
    board,
    /height:\s*`\$\{workspaceFootprint\.renderedHeight\}px`/
  );
  assert.match(
    board,
    /dataWorkspaceFootprint=\{\s*workspaceFootprint\s*\}/s
  );
  assert.match(
    sortableObject,
    /data-ixi-console-slots/
  );
});

test("custom AOS widths are not multiplied by Console depth a second time", () => {
  const footprint =
    getIXIWorkspaceCardFootprint({
      cardFamily: "aos",
      consoleSlotCount: 2,
      nativeWidth: 599,
      nativeHeight: 475,
      nativeWidthIncludesSlots: true
    });

  assert.equal(
    footprint.nativeWidth,
    599
  );
  assert.equal(
    footprint.consoleSlotCount,
    2
  );
});

test("AOS per-object reorder behavior reaches the universal sortable wrapper", () => {
  assert.match(
    board,
    /item\?\.objectId[\s\S]*IXI_WORKSPACE_CARD_FAMILIES\.AOS/
  );
  assert.match(
    board,
    /usesCanonicalAosFootprint/
  );
  assert.match(
    board,
    /getItemReorderBehavior/
  );
  assert.match(
    board,
    /reorderBehavior=\{\s*reorderBehavior\s*\}/s
  );
});
