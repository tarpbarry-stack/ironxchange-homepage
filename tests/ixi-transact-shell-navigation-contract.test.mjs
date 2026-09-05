import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("every operational TRAN$ACT module receives one fixed shell return path", async () => {
  const [app, registrySource, styles] = await Promise.all([
    read("components/ixi-aos/transact/IXITransactApp.jsx"),
    read("components/ixi-aos/transact/IXITransactModuleRegistry.js"),
    read("components/ixi-aos/transact/IXITransactStyles.jsx"),
  ]);
  const registry = await import(
    `data:text/javascript;base64,${Buffer.from(registrySource).toString("base64")}`
  );
  const operational = registry.getIXITransactModules({ objectType: "machine" });

  assert.ok(operational.length >= 23);
  assert.match(app, /<div className="tx-brand">\s*<span>\{t\("IXI TRAN\$ACT"\)\}<\/span>/s);
  assert.match(
    app,
    /<div className="tx-header-actions">[\s\S]*\{active \? \([\s\S]*className="tx-shell-return"/,
  );
  assert.match(app, /onClick=\{back\}/);
  assert.match(app, /data-ixi-transact-return=\{shellReturnLabel\.toLowerCase\(\)\}/);
  assert.match(styles, /\.tx-header\s*\{[^}]*position:\s*absolute/s);
  assert.match(styles, /\.tx-shell-return\s*\{[^}]*height:\s*23px/s);
});

test("shell return destinations preserve worksheet, Acquisition, record, and App Screen hierarchy", async () => {
  const app = await read("components/ixi-aos/transact/IXITransactApp.jsx");

  assert.match(
    app,
    /const \[acquisitionWorkflowIntent, setAcquisitionWorkflowIntent\] = useState\(null\);/,
  );
  assert.match(app, /worksheetOpen\s*\? "CARD"/);
  assert.match(app, /\["freight", "work-order"\]\.includes\(moduleId\)[\s\S]*\? "ACQUISITION"/);
  assert.match(app, /returnToClose[\s\S]*\? "RECORDS"/);
  assert.match(app, /:\s*"APPS";/);
  assert.match(app, /if \(worksheetOpen\) \{\s*closeWorksheet\(\);/s);
  assert.match(app, /setModuleId\("asset-acquisition"\)/);
  assert.match(app, /setModuleId\(""\)/);
});

test("shell return and global close remain separate controls", async () => {
  const app = await read("components/ixi-aos/transact/IXITransactApp.jsx");

  assert.match(app, /className="tx-shell-return"[\s\S]*onClick=\{back\}/);
  assert.ok(app.indexOf('className="tx-shell-return"') < app.indexOf('className="tx-expand"'));
  assert.match(app, /className="tx-close"[\s\S]*onClick=\{worksheetOpen \? closeWorksheet : \(\) => onClose\?\.\(\)\}/);
  assert.match(app, /\u00d7/);
});

test("Purchase Order and Bill render inside the shared TRAN$ACT header shell", async () => {
  const [app, purchaseOrderStyles] = await Promise.all([
    read("components/ixi-aos/transact/IXITransactApp.jsx"),
    read("components/ixi-aos/transact/modules/purchase-order/IXIPurchaseOrderStyles.jsx"),
  ]);

  assert.match(app, /if \(moduleId === "bill"\)\s*body = \(/);
  assert.doesNotMatch(app, /if \(moduleId === "bill"\)\s*return \(/);
  assert.match(app, /else if \(moduleId === "purchase-order"\)\s*body = \(/);
  assert.doesNotMatch(purchaseOrderStyles, /:has\(\.ixi-po-card\)[^\n]*> \.tx-header/);
});
