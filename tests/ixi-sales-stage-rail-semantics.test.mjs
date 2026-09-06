import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const presentationSource = await readFile(
  new URL("../components/ixi-aos/transact/sales/IXISalesStagePresentation.js", import.meta.url),
  "utf8",
);

const rail = await import(
  `data:text/javascript;base64,${Buffer.from(presentationSource).toString("base64")}`
);

test("opening Sold does not present Sold as completed before a persisted Sold record exists", () => {
  const deal = {
    stageRecords: {
      quote: { documentId: "quote-1" },
      "sales-order": { documentId: "order-1" },
      invoice: { documentId: "invoice-1" },
    },
  };

  assert.equal(rail.salesStagePresentation(deal, "quote", "sold").state, "completed");
  assert.equal(rail.salesStagePresentation(deal, "sales-order", "sold").state, "completed");
  assert.equal(rail.salesStagePresentation(deal, "signed", "sold").state, "available-action");
  assert.equal(rail.salesStagePresentation(deal, "invoice", "sold").state, "completed");
  assert.equal(rail.salesStagePresentation(deal, "sold", "sold").state, "next");
  assert.equal(rail.salesStagePresentation(deal, "settlement", "sold").state, "unavailable");
});

test("Sold becomes completed and Settlement becomes the outlined next action only after Sold persists", () => {
  const deal = {
    stageRecords: {
      invoice: { documentId: "invoice-1" },
      sold: { documentId: "sale-1" },
    },
  };

  assert.equal(rail.salesStagePresentation(deal, "sold", "settlement").state, "completed");
  assert.equal(rail.salesStagePresentation(deal, "settlement", "settlement").state, "next");
});

test("an available historical action is clickable without borrowing completed or next styling", () => {
  const deal = { stageRecords: { invoice: { documentId: "invoice-1" } } };

  assert.equal(rail.salesStagePresentation(deal, "quote", "sold").state, "available-action");
  assert.equal(rail.salesStagePresentation(deal, "sales-order", "sold").state, "available-action");
});
