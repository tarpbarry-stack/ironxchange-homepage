/*
 * IXI FINANCIAL TYPES
 *
 * Canonical vocabulary for the IXI AOS Financial Engine.
 */

export const IXI_FINANCIAL_SCHEMA = "ixi-financial-v1";
export const IXI_FINANCIAL_SCHEMA_VERSION = 1;

export const IXI_FINANCIAL_RECORD_TYPES = {
  DOCUMENT: "document",
  LINE: "line",
  PAYMENT: "payment",
  JOURNAL: "journal",
  BUDGET: "budget",
  ALLOCATION: "allocation",
  ADJUSTMENT: "adjustment"
};

export const IXI_FINANCIAL_DOCUMENT_TYPES = {
  /* PURCHASING / PAYABLES */
  PURCHASE_REQUISITION: "purchase-requisition",
  PURCHASE_ORDER: "purchase-order",
  RECEIPT: "receipt",
  EXPENSE: "expense",
  BILL: "bill",
  SUPPLIER_INVOICE: "supplier-invoice",
  VENDOR_CREDIT: "vendor-credit",
  BILL_PAYMENT: "bill-payment",

  /* SALES / RECEIVABLES */
  ESTIMATE: "estimate",
  QUOTE: "quote",
  SALES_ORDER: "sales-order",
  INVOICE: "invoice",
  CUSTOMER_CREDIT: "customer-credit",
  CUSTOMER_PAYMENT: "customer-payment",

  /* ASSET LIFECYCLE */
  ASSET_ACQUISITION: "asset-acquisition",

  /* OPERATIONS */
  WORK_ORDER: "work-order",
  SERVICE_ORDER: "service-order",
  TIME_ENTRY: "time-entry",
  LABOR_ENTRY: "labor-entry",
  MATERIAL_USAGE: "material-usage",
  INVENTORY_USAGE: "inventory-usage",
  FUEL_ENTRY: "fuel-entry",
  RENTAL: "rental",
  FREIGHT: "freight",

  /* ACCOUNTING */
  JOURNAL_ENTRY: "journal-entry",
  ADJUSTMENT: "adjustment",
  TRANSFER: "transfer",
  REFUND: "refund",

  /* PLANNING */
  BUDGET: "budget",
  FORECAST: "forecast"
};
