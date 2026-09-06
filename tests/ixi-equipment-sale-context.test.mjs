import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL(
    "../components/ixi-aos/transact/modules/equipment-sale/IXIEquipmentSaleContract.js",
    import.meta.url,
  ),
  "utf8",
);
const contract = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);

test("a legacy Invoice-derived Sales Order is hydrated with the active machine Passport", () => {
  const record = {
    identity: { dealId: "DEAL-CLEMENTS" },
    context: {},
    customer: { name: "Clements Farm" },
    asset: { label: "2017 Deere 544K II" },
    totals: { subtotal: 82000, total: 82000, balanceDue: 82000 },
    lineage: { materializedFromInvoiceId: "inv-clements" },
  };
  const hydrated = contract.hydrateIXIEquipmentSaleRecord({
    context: {
      primary: {
        passportId: "IXI-MACHINE-544K",
        objectId: "machine-544k",
        objectType: "machine",
        label: "2017 Deere 544K II",
      },
      entity: { passportId: "IXI-ENTITY" },
      actor: { passportId: "IXI-EMPLOYEE" },
    },
    record,
  });

  assert.equal(hydrated.context.primaryPassportId, "IXI-MACHINE-544K");
  assert.equal(hydrated.context.entityPassportId, "IXI-ENTITY");
  assert.equal(hydrated.context.actorPassportId, "IXI-EMPLOYEE");
  assert.equal(hydrated.asset.passportId, "IXI-MACHINE-544K");
  assert.equal(hydrated.identity.clientRequestId.length > 0, true);
  assert.equal(hydrated.lineage.materializedFromInvoiceId, "inv-clements");
  assert.equal(hydrated.totals.total, 82000);
});

test("canonical persisted Sales Order context is preserved during hydration", () => {
  const hydrated = contract.hydrateIXIEquipmentSaleRecord({
    context: { primary: { passportId: "ACTIVE-PASSPORT" } },
    record: {
      identity: { financialDocumentId: "ifd-order" },
      context: { primaryPassportId: "SAVED-PASSPORT" },
      asset: { passportId: "SAVED-PASSPORT" },
    },
  });

  assert.equal(hydrated.context.primaryPassportId, "SAVED-PASSPORT");
  assert.equal(hydrated.asset.passportId, "SAVED-PASSPORT");
  assert.equal(hydrated.identity.financialDocumentId, "ifd-order");
});
