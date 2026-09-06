import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const presentationSource = await readFile(
  new URL(
    "../components/ixi-aos/transact/sales/IXISalesStagePresentation.js",
    import.meta.url,
  ),
  "utf8",
);

const railSource = await readFile(
  new URL(
    "../components/ixi-aos/transact/sales/IXISalesDealRegister.jsx",
    import.meta.url,
  ),
  "utf8",
);

const transactSource = await readFile(
  new URL(
    "../components/ixi-aos/transact/IXITransactApp.jsx",
    import.meta.url,
  ),
  "utf8",
);

const rail = await import(
  `data:text/javascript;base64,${Buffer.from(presentationSource).toString("base64")}`
);

test("all sales stages remain navigable while commit validation stays in the stage form", () => {
  assert.doesNotMatch(railSource, /disabled=\{!entry && !startable\}/u);
  assert.match(
    railSource,
    /entry \? onOpenStage\?\.\(stage, entry, deal\) : onStartStage\?\.\(stage, deal\)/u,
  );
  assert.match(
    transactSource,
    /\["sales-order", "signed"\]\.includes\(activeSalesStageId\)/u,
  );
});

test("an Invoice completes Quote and Sales Order progression without fabricating Signed", () => {
  const deal = {
    stageRecords: {
      quote: { documentId: "quote-1" },
      "sales-order": { documentId: "order-1" },
      invoice: {
        documentId: "invoice-1",
        document: { financialState: "billed" },
      },
    },
  };

  assert.equal(
    rail.salesStagePresentation(deal, "quote", "sold").state,
    "completed",
  );
  assert.equal(
    rail.salesStagePresentation(deal, "sales-order", "sold").state,
    "completed",
  );
  assert.equal(
    rail.salesStagePresentation(deal, "signed", "sold").state,
    "available-action",
  );
  assert.equal(
    rail.salesStagePresentation(deal, "invoice", "sold").state,
    "completed",
  );
  assert.equal(rail.salesStagePresentation(deal, "sold", "sold").state, "next");
  assert.equal(
    rail.salesStagePresentation(deal, "settlement", "sold").state,
    "unavailable",
  );
});

test("an Invoice generated from verified customer signature completes stages 1 through 4", () => {
  const deal = {
    stageRecords: {
      invoice: {
        documentId: "invoice-1",
        document: {
          financialState: "billed",
          sourceFinancialDocumentId: "order-1",
          metadata: {
            salesOrderId: "order-1",
            signedPackageHash: "sha256-package",
          },
        },
      },
    },
  };

  for (const stageId of ["quote", "sales-order", "signed", "invoice"])
    assert.equal(
      rail.salesStagePresentation(deal, stageId, "invoice").state,
      "completed",
    );
  assert.equal(
    rail.salesStagePresentation(deal, "sold", "invoice").state,
    "available-action",
  );
  assert.equal(
    rail.salesStagePresentation(deal, "settlement", "invoice").state,
    "unavailable",
  );
});

test("Signed never completes from position alone or from an unverified direct Invoice", () => {
  const deal = {
    stageRecords: {
      invoice: {
        documentId: "invoice-1",
        document: { financialState: "billed", metadata: {} },
      },
    },
  };

  assert.equal(
    rail.salesStagePresentation(deal, "quote", "invoice").state,
    "completed",
  );
  assert.equal(
    rail.salesStagePresentation(deal, "sales-order", "invoice").state,
    "completed",
  );
  assert.notEqual(
    rail.salesStagePresentation(deal, "signed", "invoice").state,
    "completed",
  );
  assert.equal(
    rail.salesStagePresentation(deal, "invoice", "invoice").state,
    "completed",
  );
});

test("Sold becomes completed and Settlement becomes the outlined next action only after Sold persists", () => {
  const deal = {
    stageRecords: {
      invoice: {
        documentId: "invoice-1",
        document: { financialState: "billed" },
      },
      sold: { documentId: "sale-1" },
    },
  };

  assert.equal(
    rail.salesStagePresentation(deal, "sold", "settlement").state,
    "completed",
  );
  assert.equal(
    rail.salesStagePresentation(deal, "settlement", "settlement").state,
    "next",
  );
});

test("an available historical action is clickable without borrowing completed or next styling", () => {
  const deal = {
    stageRecords: {
      invoice: {
        documentId: "invoice-1",
        document: { financialState: "billed" },
      },
    },
  };

  assert.equal(
    rail.salesStagePresentation(deal, "quote", "sold").state,
    "completed",
  );
  assert.equal(
    rail.salesStagePresentation(deal, "sales-order", "sold").state,
    "completed",
  );
  assert.equal(
    rail.salesStagePresentation(deal, "quote", "sold").startable,
    true,
  );
  assert.equal(
    rail.salesStagePresentation(deal, "sales-order", "sold").startable,
    true,
  );
});

test("a saved draft Invoice is visible and openable but cannot unlock SOLD", () => {
  const deal = {
    stageRecords: {
      invoice: {
        documentId: "invoice-1",
        document: { financialState: "draft" },
      },
    },
  };

  assert.equal(
    rail.salesStagePresentation(deal, "invoice", "invoice").state,
    "completed",
  );
  assert.equal(
    rail.salesStagePresentation(deal, "invoice", "invoice").entry.documentId,
    "invoice-1",
  );
  assert.equal(
    rail.salesStagePresentation(deal, "sold", "sold").state,
    "unavailable",
  );
});

test("a saved Sales Order exposes both signature control and Invoice recovery", () => {
  const deal = { stageRecords: { "sales-order": { documentId: "order-1" } } };
  assert.equal(
    rail.salesStagePresentation(deal, "signed", "sales-order").state,
    "available-action",
  );
  assert.equal(
    rail.salesStagePresentation(deal, "invoice", "sales-order").state,
    "available-action",
  );
});
