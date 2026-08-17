export const IXI_TRANSACT_MODULE_CAPABILITIES = Object.freeze({
  "access-policy": "authority.view",
  "work-order": "transact.execute",
  expense: "transact.execute",
  "technology-work": "transact.execute",
  time: "transact.execute",
  material: "transact.execute",
  "asset-acquisition": "financial.create",
  "rental-expense": "financial.create",
  "rental-income": "financial.create",
  "service-quote": "financial.create",
  "service-invoice": "financial.create",
  sold: "financial.create",
  collections: "financial.view",
  payables: "financial.view",
  treasury: "financial.pay",
  "general-ledger": "financial.gl",
  "financial-reporting": "financial.view",
  bill: "financial.create",
  receipt: "financial.create",
  "purchase-order": "financial.create",
  quote: "financial.create",
  invoice: "financial.create",
  settlement: "financial.approve"
});

export function getIXITransactModuleCapability(moduleId = "") {
  return IXI_TRANSACT_MODULE_CAPABILITIES[String(moduleId || "").trim()] || "transact.execute";
}

export default { IXI_TRANSACT_MODULE_CAPABILITIES, getIXITransactModuleCapability };
