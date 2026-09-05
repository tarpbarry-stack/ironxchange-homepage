import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const app = fs.readFileSync(
  new URL("../components/ixi-aos/transact/IXITransactApp.jsx", import.meta.url),
  "utf8",
);
const styles = fs.readFileSync(
  new URL("../components/ixi-aos/transact/IXITransactStyles.jsx", import.meta.url),
  "utf8",
);

test("TRAN$ACT card modules use the shared symmetric safe area", () => {
  assert.match(app, /tx-body-safe-area/);
  assert.match(app, /data-ixi-transact-module=\{moduleId \|\| "home"\}/);
  assert.match(
    styles,
    /\.card-open \.module-open \.tx-body-safe-area > :not\(style\)\s*\{[^}]*padding-inline:\s*8px !important;/s,
  );
  assert.doesNotMatch(
    styles,
    /\.module-open \.tx-body\s*\{[^}]*left:\s*-1px/s,
  );
  assert.doesNotMatch(
    styles,
    /\.module-open \.tx-body\s*\{[^}]*right:\s*-1px/s,
  );
});

test("Freight preserves its audited edge-to-edge shell", () => {
  assert.match(
    app,
    /moduleId === "freight" \? "tx-body-edge-to-edge" : "tx-body-safe-area"/,
  );
  assert.match(
    styles,
    /\.card-open \.module-open \.tx-body-edge-to-edge > :not\(style\)\s*\{[^}]*padding-inline:\s*0 !important;/s,
  );
});
