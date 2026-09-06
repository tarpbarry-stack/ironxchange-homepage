import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const app = await readFile(
  new URL(
    "../components/ixi-aos/transact/modules/equipment-sale/IXIEquipmentSaleApp.jsx",
    import.meta.url,
  ),
  "utf8",
);
const commands = await readFile(
  new URL(
    "../components/ixi-aos/transact/modules/equipment-sale/IXIEquipmentSaleCommands.js",
    import.meta.url,
  ),
  "utf8",
);
const ensureProxy = await readFile(
  new URL(
    "../pages/api/ixi/financial/sales-orders/[financialDocumentId]/ensure-invoice.js",
    import.meta.url,
  ),
  "utf8",
);
const manualProxy = await readFile(
  new URL(
    "../pages/api/ixi/financial/sales-orders/[financialDocumentId]/manual-signature.js",
    import.meta.url,
  ),
  "utf8",
);

test("saving a new Sales Order automatically ensures one linked Invoice", () => {
  assert.match(app, /entryMode === "sales-order" && !invoiceRecord/u);
  assert.match(app, /ensureIXIEquipmentSaleInvoice\(result\.record\)/u);
  assert.match(commands, /ixi-sales-order-invoice:/u);
  assert.match(ensureProxy, /\/ensure-invoice/u);
});

test("Signed stage provides a controlled outside-IXI attestation", () => {
  assert.match(app, /MANUAL SIGNATURE CONTROL/u);
  assert.match(
    app,
    /I confirm the customer-signed Sales Order and Terms are on file/u,
  );
  assert.match(app, /attestIXIEquipmentSaleSigned/u);
  assert.match(commands, /postSalesOrderWorkflow\(record, "manual-signature"/u);
  assert.match(manualProxy, /\/manual-signature/u);
});
