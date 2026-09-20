import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../lib/ixiMobileCardGeometry.js", import.meta.url), "utf8");
const { getMobileAssemblyGeometry, getMobileTransactFootprint } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

test("native card and open Console footprints fit every supported phone and density", () => {
  for (const viewport of [320, 375, 390, 430, 768, 850]) {
    for (const columns of [1, 2]) {
      const availableWidth = (viewport - 16 - (columns - 1) * 4) / columns;
      for (const nativeWidth of [298, 300, 596, 598, 600, 900, 1500]) {
        const layout = getMobileAssemblyGeometry({ nativeWidth, nativeHeight: 475, availableWidth, measuredHeight: 962 });
        assert.ok(layout.renderedWidth <= availableWidth + 0.001);
        assert.ok(layout.width <= 600);
        assert.ok(Math.abs(layout.renderedHeight / layout.height - layout.scale) < 1e-12);
        assert.equal(layout.height, 962, "wrapped content must reserve its full height");
      }
    }
  }
});

test("TRAN$ACT reserves space for every open panel, including odd final rows", () => {
  assert.deepEqual(getMobileTransactFootprint(1), { width: 298, height: 471 });
  assert.deepEqual(getMobileTransactFootprint(2), { width: 596, height: 471 });
  assert.deepEqual(getMobileTransactFootprint(3), { width: 596, height: 942 });
  assert.deepEqual(getMobileTransactFootprint(5), { width: 596, height: 1413 });
});
