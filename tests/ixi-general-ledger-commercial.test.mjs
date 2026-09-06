import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const modulePath = name => new URL(`../components/ixi-aos/transact/modules/general-ledger/${name}`, import.meta.url);
const importSource = async url => {
  const source = await readFile(url, "utf8");
  return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
};

const adapter = await importSource(modulePath("IXIGeneralLedgerProjectionAdapter.js"));
const policy = await importSource(modulePath("IXIGeneralLedgerPolicyEngine.js"));
const periodEngine = await importSource(modulePath("IXIGLPeriodEngine.js"));

test("canonical IX Core journals hydrate without inventing economic amounts", () => {
  const result = adapter.hydrateIXIGLProjection({
    data: {
      scope: { entityPassportId: "entity-1", period: "2026-09", currency: "USD" },
      projection: {
        schema: "ixi-financial-gl-projection-v2",
        chart: { source: "ixi-core", accounts: [{ code: "1010", name: "Cash", type: "asset", active: true }] },
        period: { period: "2026-09", status: "open", closed: false },
        postingRules: { source: "ixi-core-dynamodb", rules: [{ identity: { ruleId: "invoice-us", version: 2 }, match: { documentType: "invoice" }, posting: { debitAccountCode: "1100", creditAccountCode: "4100" }, control: { active: true } }] },
        journal: [{
          financialDocumentId: "ifd-je-1", documentType: "journal-entry",
          documentNumber: "JE-1", financialState: "posted", status: "posted",
          period: "2026-09", sourceFinancialDocumentId: "ifd-invoice-1",
          sourceDocumentType: "invoice", sourceDocumentNumber: "INV-1",
          accounting: { balanced: true, totalDebit: 125, totalCredit: 125 },
          lines: [
            { financialLineId: "1", accountCode: "1100", accountName: "A/R", debit: 125, credit: 0, amount: 0 },
            { financialLineId: "2", accountCode: "4100", accountName: "Revenue", debit: 0, credit: 125, amount: 0 }
          ]
        }],
        controls: { ready: true }
      }
    }
  });
  assert.equal(result.journals.length, 1);
  assert.equal(result.journals[0].canonical.source, "ixi-core-dynamodb");
  assert.equal(result.journals[0].source.financialDocumentId, "ifd-invoice-1");
  assert.equal(result.journals[0].totals.debits, 125);
  assert.equal(result.journals[0].totals.credits, 125);
  assert.equal(result.postingRules.rules[0].ruleId, "invoice-us");
  assert.equal(result.postingRules.rules[0].version, 2);
  assert.equal(result.postingRules.rules[0].debitAccount, "1100");
});

test("reversal has unique original-journal lineage and opposite accounting", () => {
  const reversal = periodEngine.createIXIReversalJournal({
    identity: { journalEntryId: "ifd-je-1", number: "JE-1" },
    posting: { status: "posted" },
    lines: [
      { accountCode: "1100", debit: 125, credit: 0 },
      { accountCode: "4100", debit: 0, credit: 125 }
    ]
  }, { passportId: "actor-1" });
  assert.equal(reversal.source.financialDocumentId, "ifd-je-1");
  assert.equal(reversal.source.documentType, "journal-entry");
  assert.equal(reversal.posting.reversalOf, "ifd-je-1");
  assert.equal(reversal.lines[0].credit, 125);
  assert.equal(reversal.lines[1].debit, 125);
});

test("GL policy is explicit, segregated, and deny-by-default", () => {
  assert.equal(policy.getIXIGeneralLedgerPolicy({ context: { permissions: [] } }).canView, false);
  const accounting = policy.getIXIGeneralLedgerPolicy({ context: { permissions: [
    "financial.gl.view", "financial.gl.journal.create", "financial.gl.journal.post",
    "financial.gl.journal.reverse", "financial.reporting.view"
  ] } });
  assert.equal(accounting.canPostJournal, true);
  assert.equal(accounting.canViewReports, true);
  assert.equal(accounting.canClosePeriod, false);
  const controller = policy.getIXIGeneralLedgerPolicy({ context: { permissions: ["financial.gl.period.close"] } });
  assert.equal(controller.canClosePeriod, true);
  assert.equal(controller.canPostJournal, false);
  const controllerRole = policy.getIXIGeneralLedgerPolicy({ context: { roles: ["financial-controller"], permissions: [] } });
  assert.equal(controllerRole.canClosePeriod, true);
  assert.equal(controllerRole.canManageRules, true);
});

test("GL close and reporting use authoritative IX Core routes", async () => {
  const app = await readFile(modulePath("IXIGeneralLedgerApp.jsx"), "utf8");
  const reports = await readFile(new URL("../components/ixi-aos/transact/modules/financial-reporting/IXIFinancialReportingApp.jsx", import.meta.url), "utf8");
  const client = await readFile(new URL("../components/ixi-aos/financial-runtime/IXITransactDesktopClient.js", import.meta.url), "utf8");
  assert.match(app, /loadIXITransactGL/u);
  assert.match(app, /closeIXITransactPeriod/u);
  assert.match(app, /reopenIXITransactPeriod/u);
  assert.match(app, /createIXITransactPostingRule/u);
  assert.doesNotMatch(app, /closeIXIAccountingPeriod/u);
  assert.match(reports, /loadIXITransactGL/u);
  assert.match(reports, /SERVER CALCULATED · BROWSER CALCULATED: NO/u);
  assert.match(client, /commands\/desktop\/close-period/u);
  assert.match(client, /commands\/desktop\/reopen-period/u);
  assert.match(client, /commands\/desktop\/posting-rules/u);
  assert.doesNotMatch(app, /auto-reverse-requested|setMapping/u);
  assert.match(app, /CREATE AUDITED RULE VERSION/u);
  assert.doesNotMatch(reports, /POSTED \/ UNREVERSED JOURNALS/u);
});

test("public FaceLab contains no synthetic ledger or reporting fixtures", async () => {
  const gl = await readFile(new URL("../pages/facelab/general-ledger.js", import.meta.url), "utf8");
  const reporting = await readFile(new URL("../pages/facelab/financial-reporting.js", import.meta.url), "utf8");
  assert.doesNotMatch(gl, /INV-1001|BILL-19482|PAY-9001/u);
  assert.doesNotMatch(reporting, /JE-1001|14870|4250/u);
  assert.match(gl, /permissions:\s*\[\]/u);
  assert.match(reporting, /permissions:\s*\[\]/u);
});

test("asset-sale billing and collection use the canonical A/R ledger path", async () => {
  const posting = await readFile(modulePath("IXIGLPostingEngine.js"), "utf8");
  assert.match(posting, /asset-sale-invoice-receivable/u);
  assert.match(posting, /line\(chart,"1100","debit"/u);
  assert.match(posting, /line\(chart,revenueAccount\(record\),"credit"/u);
  assert.match(posting, /s\.paymentDirection\|\|s\.direction/u);
  assert.match(posting, /ruleId="payment-received"/u);
  assert.match(posting, /line\(chart,cashAccount\(record\),"debit"/u);
  assert.match(posting, /line\(chart,"1100","credit"/u);
  assert.match(posting, /asset-sale-cost-basis-required/u);
  assert.match(posting, /line\(chart,"5100","debit",basis/u);
  assert.match(posting, /line\(chart,"1510","credit",basis/u);
});
