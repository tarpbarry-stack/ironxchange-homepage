import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = path => fs.readFileSync(path, "utf8");

test("TRANSACT typography pass is limited to the launcher home state", () => {
  const app = read("components/ixi-aos/transact/IXITransactApp.jsx");
  const typography = read("components/ixi-aos/transact/IXITransactHomeTypography.jsx");

  assert.match(app, /import IXITransactHomeTypography/u);
  assert.match(app, /!active \? <IXITransactHomeTypography \/>/u);

  assert.match(typography, /\.ixi-transact-app\.home-open/u);
  assert.match(typography, /\.tx-grid button strong/u);
  assert.match(typography, /font-family: var\(--ixi-tx-home-font\)/u);

  assert.doesNotMatch(typography, /\.module-open/u);
  assert.doesNotMatch(typography, /\.tx-module/u);
  assert.doesNotMatch(typography, /\.es-/u);
  assert.doesNotMatch(typography, /\.ixi-machine-rail/u);

  const scopedSelectors = typography
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.startsWith(".") && line.includes(".tx-"));

  assert.ok(scopedSelectors.length > 0);
  assert.ok(
    scopedSelectors.every(line =>
      line.startsWith(".ixi-transact-app.home-open "),
    ),
  );
});
