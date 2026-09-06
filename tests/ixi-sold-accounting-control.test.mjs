import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Sold closes the original Invoice instead of creating a second receivable", async () => {
  const [commands, app] = await Promise.all([
    read("components/ixi-aos/transact/modules/sold/IXIAssetSaleCommands.js"),
    read("components/ixi-aos/transact/modules/sold/IXIAssetSaleApp.jsx"),
  ]);

  const closeout = commands.slice(
    commands.indexOf("export async function createIXIAssetSale"),
    commands.indexOf("export async function recordIXIAssetSaleReceipt"),
  );
  assert.match(closeout, /patchIXIAosFinancialDocument/u);
  assert.doesNotMatch(closeout, /createIXIAosObjectFinancialDocument/u);
  assert.match(closeout, /financialDocumentId: financialInvoiceId/u);
  assert.match(closeout, /expectedRevision/u);
  assert.match(closeout, /financialState: "collected"/u);
  assert.doesNotMatch(closeout, /financialState: "receivable"/u);
  assert.match(closeout, /assetSaleRecord: soldRecord/u);
  assert.match(closeout, /financialId !== financialInvoiceId/u);
  assert.match(app, /SOURCE INVOICE/u);
  assert.match(app, /BALANCE IS \$0\.00/u);
  assert.match(commands, /financialState: "paid"/u);
  assert.match(commands, /sourceFinancialDocumentId: invoiceId/u);
});

test("Invoice issuance is an explicit Step 4 command on the same canonical document", async () => {
  const commands = await read("components/ixi-aos/transact/modules/equipment-sale/IXIEquipmentSaleCommands.js");
  assert.match(commands, /export async function issueIXIEquipmentInvoice/u);
  assert.match(commands, /patchIXIAosFinancialDocument/u);
  assert.match(commands, /financialState: "billed"/u);
  assert.match(commands, /invoiceStatus: "issued"/u);
});

test("Settlement remains a separate non-revenue control sourced to the sold Invoice", async () => {
  const commands = await read("components/ixi-aos/transact/modules/settlement/IXISettlementCommands.js");

  assert.match(commands, /documentType: "settlement"/u);
  assert.match(commands, /sourceFinancialDocumentId: saleFinancialDocumentId/u);
  assert.doesNotMatch(commands, /documentType: "invoice"/u);
  assert.match(commands, /paymentDirection: "outflow"/u);
});
