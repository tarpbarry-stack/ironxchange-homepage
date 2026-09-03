export const IXI_TRANSACT_MODULES = Object.freeze([
  Object.freeze({ id: "work-order", label: "WORK ORDER", group: "work", documentType: "work-order" }),
  Object.freeze({ id: "expense", label: "EXPENSE", group: "spend", documentType: "expense" }),
  Object.freeze({ id: "technology-work", label: "TECH WORK ORDER", group: "work", documentType: "technology-work-order", specializedWorkOrder: true }),
  Object.freeze({ id: "time", label: "TIME", group: "work", documentType: "time-entry" }),
  Object.freeze({ id: "material", label: "PART / MATERIAL", group: "work", documentType: "material-usage" }),
  Object.freeze({ id: "asset-acquisition", label: "ASSET ACQUISITION", group: "asset", documentType: "asset-acquisition" }),
  Object.freeze({ id: "rental-expense", label: "RENTAL EXPENSE", group: "rent", documentType: "rental-expense" }),
  Object.freeze({ id: "rental-income", label: "RENTAL INCOME", group: "rent", documentType: "rental-income" }),
  Object.freeze({ id: "service-quote", label: "SERVICE QUOTE", group: "sell", documentType: "quote" }),
  Object.freeze({ id: "service-invoice", label: "SERVICE INVOICE", group: "sell", documentType: "invoice" }),
  Object.freeze({ id: "sold", label: "SOLD", group: "sell", documentType: "invoice" }),
  Object.freeze({ id: "collections", label: "COLLECTIONS / A/R", group: "collect", documentType: "collection" }),
  Object.freeze({ id: "payables", label: "PAYABLES / A/P", group: "pay", documentType: "bill" }),
  Object.freeze({ id: "treasury", label: "CASH / TREASURY", group: "cash", documentType: "payment" }),
  Object.freeze({ id: "general-ledger", label: "GENERAL LEDGER / CLOSE", group: "account", documentType: "journal-entry" }),
  Object.freeze({ id: "financial-reporting", label: "FINANCIAL REPORTING", group: "report", documentType: "financial-report" }),
  Object.freeze({ id: "bill", label: "BILL / INVOICE", group: "spend", documentType: "bill" }),
  Object.freeze({ id: "receipt", label: "RECEIPT", group: "spend", documentType: "receipt" }),
  Object.freeze({ id: "purchase-order", label: "PURCHASE ORDER", group: "buy", documentType: "purchase-order" }),
  Object.freeze({ id: "quote", label: "QUOTE", group: "sell", documentType: "quote" }),
  Object.freeze({ id: "invoice", label: "INVOICE", group: "sell", documentType: "invoice" }),
  Object.freeze({ id: "settlement", label: "SETTLEMENT", group: "settle", documentType: "settlement" }),
  Object.freeze({ id: "access-policy", label: "ACCESS / POLICY", group: "security", documentType: "authority-policy", enterpriseSecurity: true })
]);

const MACHINE_ORDER = Object.freeze(["work-order","expense","technology-work","time","material","asset-acquisition","rental-expense","rental-income","service-quote","service-invoice","purchase-order","receipt","bill","payables","treasury","general-ledger","financial-reporting","sold","collections","settlement","quote","invoice","access-policy"]);
const LOCATION_ORDER = Object.freeze(["work-order","expense","purchase-order","bill","payables","treasury","general-ledger","financial-reporting","receipt","technology-work","time","material","asset-acquisition","rental-expense","rental-income","service-quote","service-invoice","sold","collections","settlement","quote","invoice","access-policy"]);

function sortByOrder(items, order) {
  const rank = new Map(order.map((id, index) => [id, index]));
  return [...items].sort((left, right) => (rank.has(left.id) ? rank.get(left.id) : 999) - (rank.has(right.id) ? rank.get(right.id) : 999));
}

function deniedModuleIds(permissions = []) {
  return new Set(
    (Array.isArray(permissions) ? permissions : [])
      .map(value => String(value || "").trim())
      .filter(value => value.startsWith("deny:"))
      .map(value => value.slice(5))
      .filter(Boolean)
  );
}

export function getIXITransactModules({ objectType = "", permissions = [] } = {}) {
  const type = String(objectType || "").trim().toLowerCase();
  const denied = deniedModuleIds(permissions);
  let preferred = IXI_TRANSACT_MODULES;

  if (["machine", "equipment", "vehicle", "truck", "trailer"].includes(type)) {
    preferred = sortByOrder(IXI_TRANSACT_MODULES, MACHINE_ORDER);
  } else if (["location", "yard", "shop"].includes(type)) {
    preferred = sortByOrder(IXI_TRANSACT_MODULES, LOCATION_ORDER);
  }

  return preferred.filter(item => !denied.has(item.id));
}

export function getIXITransactModule(moduleId = "") {
  const id = String(moduleId || "").trim();
  return IXI_TRANSACT_MODULES.find(item => item.id === id) || null;
}

export default {
  getIXITransactModules,
  getIXITransactModule
};
