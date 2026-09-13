import { hydrateIXIServiceInvoice } from "../ixi-aos/transact/modules/service-invoice/IXIServiceInvoiceProjection.js";
import { resolveIXITransactRecordModuleId } from "../ixi-aos/transact/IXITransactRecordRouting.js";
import { buildIXISalesDealRegister, findIXISalesDeal } from "../ixi-aos/transact/sales/IXISalesDealEngine.js";

const clean = value => String(value ?? "").trim();
const array = value => Array.isArray(value) ? value : [];
export const recordDocument = record => record?.record?.financialDocument || record?.financialDocument || null;

export function verifyIXITransactSelectedRecord(record, financialDocumentId) {
  if (!clean(financialDocumentId) || clean(recordDocument(record)?.financialDocumentId) !== clean(financialDocumentId)) {
    throw new Error("The selected transaction could not be verified. Return to history and try again.");
  }
  return record;
}

const EMBEDDED_ROUTES = {
  "asset-acquisition": ["assetAcquisition", "asset-acquisition"],
  "rental-expense": ["rentalExpense", "rental-expense"],
  "rental-income": ["rentalIncome", "rental-income"],
  "service-quote": ["serviceQuote", "service-quote"],
  "purchase-order": ["purchaseOrderRecord", "purchase-order"],
  bill: ["billRecord", "bill"],
  "supplier-invoice": ["billRecord", "bill"],
  quote: ["quote", "quote"],
  "sales-order": ["salesOrder", "sales-order"],
  settlement: ["assetSettlement", "settlement"]
};

// Select by durable financial ID. Keep the complete record set for balances,
// corrections and sales lineage; never substitute a newer record of the same type.
export function buildIXITransactRecordView({ record, financialDocumentId, object = {}, financialRecords = [] } = {}) {
  verifyIXITransactSelectedRecord(record, financialDocumentId);
  const document = recordDocument(record);
  const server = (record?.record || record)?.server || {};
  const type = clean(document.documentType).toLowerCase();
  const binding = {
    financialDocumentId: clean(document.financialDocumentId),
    revision: Number(server.revision || 0),
    financialLineId: clean(document.lines?.[0]?.financialLineId),
    line: document.lines?.[0] || null
  };
  const bind = embedded => ({ ...embedded, financialBinding: { ...embedded?.financialBinding, ...binding } });
  const props = {
    object: { ...object },
    selectedFinancialDocumentId: binding.financialDocumentId,
    financialRecords: [record, ...array(financialRecords).filter(item => clean(recordDocument(item)?.financialDocumentId) !== binding.financialDocumentId)]
  };
  let moduleId = "";
  const route = EMBEDDED_ROUTES[type];
  if (route && document[route[0]] && typeof document[route[0]] === "object" && !Array.isArray(document[route[0]])) {
    moduleId = route[1];
    props.object[route[0]] = bind(document[route[0]]);
  } else if (type === "expense") {
    moduleId = "expense";
  } else if (type === "invoice" && document.serviceInvoice) {
    moduleId = "service-invoice";
    props.object.serviceInvoice = hydrateIXIServiceInvoice(record, props.financialRecords);
  } else if (type === "invoice") {
    moduleId = "invoice";
  } else if (type === "work-order") {
    const workModule = resolveIXITransactRecordModuleId({ documentType: type, document, fallbackModuleId: "work-order" });
    const key = workModule === "technology-work" ? "techWorkOrder" : "workOrder";
    if (document[key]) {
      moduleId = workModule;
      props[key === "techWorkOrder" ? "activeTechWorkOrder" : "activeWorkOrder"] = bind(document[key]);
    }
  }
  // A missing revision cannot safely initialize a worksheet that may amend a record.
  if (!Number.isInteger(binding.revision) || binding.revision < 1) moduleId = "";
  const primaryPassports = array(document.references)
    .filter(reference => ["asset", "object", "machine"].includes(clean(reference.role).toLowerCase()))
    .map(reference => clean(reference.passportId)).filter(Boolean);
  if (primaryPassports.length && !primaryPassports.includes(clean(object.passportId))) moduleId = "";
  if (["quote", "sales-order", "invoice", "settlement"].includes(moduleId)) {
    const deal = findIXISalesDeal(buildIXISalesDealRegister(props.financialRecords), { documentId: binding.financialDocumentId });
    // A superseded stage remains viewable as a saved record. The stage worksheet
    // must not silently substitute another invoice or quote from the same deal.
    if (deal?.stageRecords?.[moduleId]?.documentId !== binding.financialDocumentId) moduleId = "";
  }
  return { document, server, moduleId, props };
}

export function linkedIXITransactRecordIds(document = {}) {
  return [...new Set([
    document.sourceFinancialDocumentId,
    ...array(document.relatedFinancialDocumentIds),
    ...array(document.relationships).map(link => link?.financialDocumentId)
  ].map(clean).filter(id => id && id !== clean(document.financialDocumentId)))];
}
