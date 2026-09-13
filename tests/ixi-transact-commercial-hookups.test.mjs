import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const root = new URL("../", import.meta.url);
const cache = new Map();
async function sourceUrl(url) {
  if (cache.has(url.href)) return cache.get(url.href);
  let text = await readFile(url, "utf8");
  for (const match of [...text.matchAll(/from ["'](\.[^"']+)["']/g)]) text = text.replace(match[0], `from "${await sourceUrl(new URL(match[1], url))}"`);
  const result = `data:text/javascript;base64,${Buffer.from(text).toString("base64")}`; cache.set(url.href, result); return result;
}
const load = async file => import(await sourceUrl(new URL(file, root)));
const { normalizeIXITransactAccess } = await load("components/ixi-transact-dashboard/data/IXITransactAccessProjection.mjs");
const { searchIXITransact } = await load("components/ixi-command-center/IXITransactSearch.mjs");
const projection = await load("components/ixi-transact-dashboard/data/IXITransactPassportRecordProjection.mjs");
const { hydrateIXIServiceInvoice } = await load("components/ixi-aos/transact/modules/service-invoice/IXIServiceInvoiceProjection.js");
const { createIXIServiceInvoiceDraft, validateIXIServiceInvoice } = await load("components/ixi-aos/transact/modules/service-invoice/IXIServiceInvoiceContract.js");
const { buildIXISalesDealRegister } = await load("components/ixi-aos/transact/sales/IXISalesDealEngine.js");
const record = (id, type, extra = {}) => ({ server: { revision: 3 }, financialDocument: { financialDocumentId: id, documentType: type, financialState: "billed", amount: 1234.56, currency: "USD", ...extra } });

test("worksheets use only server-approved capabilities, retaining explicit denies", () => {
  const payload = { ok: true, data: { roles: ["owner"], permissions: [], deniedPermissions: ["financial.export"], capabilities: { "financial.view.general-ledger": true, "financial.export": true, "financial.post": false } } };
  const actual = normalizeIXITransactAccess(payload);
  assert.deepEqual(actual.data.permissions, ["financial.view.general-ledger"]);
  assert.deepEqual(payload.data.permissions, []);
  assert.deepEqual(normalizeIXITransactAccess({ ok: true, data: { roles: ["owner"], capabilities: {} } }).data.permissions, []);
});

test("search resolves document number, vendor and precise currency amount to the saved record", () => {
  const records = [record("ifd_bill", "bill", { documentNumber: "BILL-104", vendorName: "Star Freight" })];
  for (const query of ["bill-104", "star freight", "$1,234.56"]) {
    const results = searchIXITransact({ query, records });
    assert.equal(results.length, 1); assert.equal(results[0].id, "ifd_bill"); assert.equal(results[0].resultType, "transaction");
  }
  assert.equal(searchIXITransact({ query: "$1,234.57", records }).length, 0);
});

test("service invoice readback uses incoming canonical payments and never creates an equipment sale", () => {
  const draft = createIXIServiceInvoiceDraft({ workOrder: { identity: { workOrderId: "ifd_work" }, customer: { name: "Customer" }, commercial: { pricingType: "fixed-price", totalAuthorizedRevenue: 1000 } }, input: { invoiceDate: "2026-09-13", dueDate: "2026-10-13", taxAmount: 80, travelFreightAmount: 50 } });
  assert.equal(draft.charges.amountDue, 1130); assert.equal(validateIXIServiceInvoice(draft).valid, true);
  const invoice = record("ifd_service", "invoice", { amount: 1130, serviceInvoice: draft, documentNumber: "SINV-1", sourceFinancialDocumentId: "ifd_work" });
  const incoming = record("ifd_receipt", "payment", { amount: 300, paymentDirection: "inflow", financialState: "paid", sourceFinancialDocumentId: "ifd_service" });
  const outgoing = record("ifd_outgoing", "payment", { amount: 400, paymentDirection: "outflow", financialState: "paid", sourceFinancialDocumentId: "ifd_service" });
  const hydrated = hydrateIXIServiceInvoice(invoice, [invoice, incoming, outgoing]);
  assert.equal(hydrated.identity.serviceInvoiceId, "ifd_service"); assert.equal(hydrated.financialBinding.revision, 3);
  assert.equal(hydrated.status, "issued"); assert.equal(hydrated.ar.amountReceived, 300); assert.equal(hydrated.ar.balanceDue, 830);
  assert.equal(buildIXISalesDealRegister([invoice]).length, 0);
});

test("TODAY excludes an invoice settled by its linked incoming receipt", () => {
  const invoice = record("ifd_invoice", "invoice");
  const receipt = record("ifd_receipt", "payment", { sourceFinancialDocumentId: "ifd_invoice", paymentDirection: "inflow", financialState: "paid" });
  assert.equal(projection.getIXITransactActionableRecords([invoice, receipt]).some(item => item.id === "ifd_invoice"), false);
  assert.equal(projection.getIXITransactWorkspaceRecords([invoice, receipt], "records").length, 2);
});

test("service invoice commands save a canonical draft, persist issue and preserve revision checks", async () => {
  const file = new URL("components/ixi-aos/transact/modules/service-invoice/IXIServiceInvoiceCommands.js", root);
  let source = await readFile(file, "utf8");
  const stubs = {
    "../../../financial-runtime/IXIAosFinancialReadClient": 'export const patchIXIAosFinancialDocument = input => globalThis.__serviceInvoiceTest.patch(input);',
    "../../../financial-runtime/IXIAosFinancialRuntimeAdapter": 'export const createIXIAosObjectFinancialDocument = input => globalThis.__serviceInvoiceTest.create(input); export const createIXIAosFinancialObjectReference = ({object,role}) => ({...object,role});',
    "../../../../ixi-object-system/IXIActionNoticeEngine": 'export const runIXIActionNoticeLifecycle = ({operation}) => operation();'
  };
  for (const match of [...source.matchAll(/from ["'](\.[^"']+)["']/g)]) {
    let url;
    if (stubs[match[1]]) url = `data:text/javascript;base64,${Buffer.from(stubs[match[1]]).toString("base64")}`;
    else url = await sourceUrl(new URL(match[1].endsWith(".js") ? match[1] : `${match[1]}.js`, file));
    source = source.replace(match[0], `from "${url}"`);
  }
  const commands = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
  let saved, patch;
  globalThis.__serviceInvoiceTest = {
    create: async request => { assert.equal(request.input.financialState, "draft"); assert.equal(request.input.sourceFinancialDocumentId, "ifd_work"); saved = record("ifd_created", "invoice", request.input); return { record: saved }; },
    patch: async request => { patch = request; saved = { server: { revision: 4 }, financialDocument: { ...saved.financialDocument, ...request.patch } }; return { data: { record: saved } }; }
  };
  try {
    const created = await commands.createIXIServiceInvoice({ workOrder: { identity: { workOrderId: "WO-1" }, financialBinding: { financialDocumentId: "ifd_work" }, customer: { name: "Customer" }, commercial: { pricingType: "fixed-price", totalAuthorizedRevenue: 1000 } }, input: { invoiceDate: "2026-09-13" }, commandId: "service_test_command" });
    assert.equal(created.record.identity.serviceInvoiceId, "ifd_created"); assert.equal(created.record.status, "draft");
    const issued = await commands.updateIXIServiceInvoice({ record: created.record, action: "issue", actor: { passportId: "IXIACTOR" } });
    assert.equal(patch.expectedRevision, 3); assert.equal(patch.patch.financialState, "billed");
    assert.equal(issued.record.status, "issued"); assert.equal(issued.record.financialBinding.revision, 4);
  } finally { delete globalThis.__serviceInvoiceTest; }
});
