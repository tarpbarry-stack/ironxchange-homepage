/*
 * IXI FINANCIAL TYPES
 *
 * PURPOSE
 * -------
 *
 * Canonical vocabulary for the IXI AOS
 * Financial Engine.
 *
 * This file contains NO:
 *
 * - React
 * - UI
 * - AWS
 * - database code
 * - QuickBooks-specific code
 * - Sage-specific code
 * - NetSuite-specific code
 * - SAP-specific code
 *
 * All financial engines, Face 2 runtimes,
 * Workbooks, persistence services and
 * accounting adapters must use this
 * canonical vocabulary.
 *
 *
 * CORE DOCTRINE
 * -------------
 *
 * FACE 1
 * Identity / presentation.
 *
 * FACE 2
 * Financial.
 *
 * FACE 3+
 * User / business defined.
 *
 *
 * Financial records use established
 * accounting terminology wherever an
 * established term exists.
 *
 * IXI does not invent replacement words
 * for standard accounting concepts.
 */


/* =========================================================
   SCHEMA
   ========================================================= */

export const IXI_FINANCIAL_SCHEMA =
  "ixi-financial-v1";


export const IXI_FINANCIAL_SCHEMA_VERSION =
  1;


/* =========================================================
   RECORD TYPES
   ========================================================= */

/*
 * A document is the recognizable business
 * record:
 *
 * PO
 * invoice
 * bill
 * expense
 * work order
 * time entry
 * etc.
 *
 * Financial lines live inside documents.
 */
export const IXI_FINANCIAL_RECORD_TYPES = {
  DOCUMENT:
    "document",

  LINE:
    "line",

  PAYMENT:
    "payment",

  JOURNAL:
    "journal",

  BUDGET:
    "budget",

  ALLOCATION:
    "allocation",

  ADJUSTMENT:
    "adjustment"
};


/* =========================================================
   DOCUMENT TYPES
   ========================================================= */

export const IXI_FINANCIAL_DOCUMENT_TYPES = {

  /* -------------------------
     PURCHASING / PAYABLES
     ------------------------- */

  PURCHASE_REQUISITION:
    "purchase-requisition",

  PURCHASE_ORDER:
    "purchase-order",

  RECEIPT:
    "receipt",

  EXPENSE:
    "expense",

  BILL:
    "bill",

  SUPPLIER_INVOICE:
    "supplier-invoice",

  VENDOR_CREDIT:
    "vendor-credit",

  BILL_PAYMENT:
    "bill-payment",


  /* -------------------------
     SALES / RECEIVABLES
     ------------------------- */

  ESTIMATE:
    "estimate",

  QUOTE:
    "quote",

  SALES_ORDER:
    "sales-order",

  INVOICE:
    "invoice",

  CUSTOMER_CREDIT:
    "customer-credit",

  CUSTOMER_PAYMENT:
    "customer-payment",


  /* -------------------------
     OPERATIONS
     ------------------------- */

  WORK_ORDER:
    "work-order",

  SERVICE_ORDER:
    "service-order",

  TIME_ENTRY:
    "time-entry",

  LABOR_ENTRY:
    "labor-entry",

  MATERIAL_USAGE:
    "material-usage",

  INVENTORY_USAGE:
    "inventory-usage",

  FUEL_ENTRY:
    "fuel-entry",

  RENTAL:
    "rental",

  FREIGHT:
    "freight",


  /* -------------------------
     ACCOUNTING
     ------------------------- */

  JOURNAL_ENTRY:
    "journal-entry",

  ADJUSTMENT:
    "adjustment",

  TRANSFER:
    "transfer",

  REFUND:
    "refund",


  /* -------------------------
     PLANNING
     ------------------------- */

  BUDGET:
    "budget",

  FORECAST:
    "forecast"
};


/* =========================================================
   DOCUMENT STATUS
   ========================================================= */

/*
 * Document workflow state.
 *
 * Not every document uses every state.
 */
export const IXI_FINANCIAL_DOCUMENT_STATUS = {
  DRAFT:
    "draft",

  SUBMITTED:
    "submitted",

  PENDING_APPROVAL:
    "pending-approval",

  APPROVED:
    "approved",

  REJECTED:
    "rejected",

  OPEN:
    "open",

  PARTIALLY_FULFILLED:
    "partially-fulfilled",

  FULFILLED:
    "fulfilled",

  PARTIALLY_BILLED:
    "partially-billed",

  BILLED:
    "billed",

  PARTIALLY_PAID:
    "partially-paid",

  PAID:
    "paid",

  CLOSED:
    "closed",

  VOID:
    "void",

  REVERSED:
    "reversed",

  CANCELLED:
    "cancelled"
};


/* =========================================================
   FINANCIAL STATE
   ========================================================= */

/*
 * Economic lifecycle.
 *
 * This is separate from the document's
 * workflow status.
 *
 * Example:
 *
 * PO
 *   committed
 *
 * supplier bill
 *   incurred / billed
 *
 * payment
 *   paid
 */
export const IXI_FINANCIAL_STATES = {
  PLANNED:
    "planned",

  BUDGETED:
    "budgeted",

  REQUESTED:
    "requested",

  APPROVED:
    "approved",

  COMMITTED:
    "committed",

  ORDERED:
    "ordered",

  RECEIVED:
    "received",

  INCURRED:
    "incurred",

  BILLED:
    "billed",

  POSTED:
    "posted",

  PAID:
    "paid",

  RECONCILED:
    "reconciled",

  REVERSED:
    "reversed",

  VOID:
    "void"
};


/* =========================================================
   ACCOUNTING POSTING STATUS
   ========================================================= */

export const IXI_FINANCIAL_POSTING_STATUS = {
  NOT_READY:
    "not-ready",

  READY:
    "ready",

  PENDING_REVIEW:
    "pending-review",

  APPROVED:
    "approved",

  QUEUED:
    "queued",

  POSTED:
    "posted",

  FAILED:
    "failed",

  REVERSED:
    "reversed"
};


/* =========================================================
   PAYMENT STATUS
   ========================================================= */

export const IXI_FINANCIAL_PAYMENT_STATUS = {
  NOT_APPLICABLE:
    "not-applicable",

  UNPAID:
    "unpaid",

  PARTIALLY_PAID:
    "partially-paid",

  PAID:
    "paid",

  OVERPAID:
    "overpaid",

  REFUNDED:
    "refunded"
};


/* =========================================================
   ACCOUNT TYPES
   ========================================================= */

/*
 * Broad standard accounting classes.
 *
 * Individual companies retain their own
 * chart-of-account names and codes.
 */
export const IXI_FINANCIAL_ACCOUNT_TYPES = {
  ASSET:
    "asset",

  LIABILITY:
    "liability",

  EQUITY:
    "equity",

  REVENUE:
    "revenue",

  EXPENSE:
    "expense",

  COST_OF_GOODS_SOLD:
    "cost-of-goods-sold",

  OTHER_INCOME:
    "other-income",

  OTHER_EXPENSE:
    "other-expense"
};


/* =========================================================
   PARTY TYPES
   ========================================================= */

export const IXI_FINANCIAL_PARTY_TYPES = {
  ENTITY:
    "entity",

  CUSTOMER:
    "customer",

  VENDOR:
    "vendor",

  SUPPLIER:
    "supplier",

  EMPLOYEE:
    "employee",

  CONTRACTOR:
    "contractor",

  OTHER:
    "other"
};


/* =========================================================
   PASSPORT REFERENCE ROLES
   ========================================================= */

/*
 * These describe WHY a Passport is attached
 * to a financial record.
 *
 * They do not dictate the user's folder or
 * Container structure.
 */
export const IXI_FINANCIAL_REFERENCE_ROLES = {
  OWNER:
    "owner",

  ENTITY:
    "entity",

  CUSTOMER:
    "customer",

  VENDOR:
    "vendor",

  SUPPLIER:
    "supplier",

  EMPLOYEE:
    "employee",

  CONTRACTOR:
    "contractor",

  ASSET:
    "asset",

  OBJECT:
    "object",

  CONTAINER:
    "container",

  JOB:
    "job",

  PROJECT:
    "project",

  LOCATION:
    "location",

  DEPARTMENT:
    "department",

  COST_CENTER:
    "cost-center",

  PROFIT_CENTER:
    "profit-center",

  BUSINESS_UNIT:
    "business-unit",

  ITEM:
    "item",

  SERVICE:
    "service",

  SOURCE:
    "source",

  DESTINATION:
    "destination",

  OTHER:
    "other"
};


/* =========================================================
   LINE TYPES
   ========================================================= */

export const IXI_FINANCIAL_LINE_TYPES = {
  ITEM:
    "item",

  SERVICE:
    "service",

  LABOR:
    "labor",

  TIME:
    "time",

  MATERIAL:
    "material",

  PART:
    "part",

  FUEL:
    "fuel",

  FREIGHT:
    "freight",

  RENTAL:
    "rental",

  TAX:
    "tax",

  DISCOUNT:
    "discount",

  FEE:
    "fee",

  INTEREST:
    "interest",

  EXPENSE:
    "expense",

  REVENUE:
    "revenue",

  OTHER:
    "other"
};


/* =========================================================
   QUANTITY UNITS
   ========================================================= */

/*
 * Open enough for broad AOS use.
 *
 * Custom unit strings remain allowed by
 * the engines. These are common canonical
 * values only.
 */
export const IXI_FINANCIAL_UNITS = {
  EACH:
    "each",

  HOUR:
    "hour",

  DAY:
    "day",

  WEEK:
    "week",

  MONTH:
    "month",

  MILE:
    "mile",

  KILOMETER:
    "kilometer",

  GALLON:
    "gallon",

  LITER:
    "liter",

  TON:
    "ton",

  POUND:
    "pound",

  KILOGRAM:
    "kilogram",

  FOOT:
    "foot",

  METER:
    "meter",

  ACRE:
    "acre",

  HECTARE:
    "hectare",

  LOAD:
    "load",

  CYCLE:
    "cycle",

  UNIT:
    "unit"
};


/* =========================================================
   DEBIT / CREDIT
   ========================================================= */

export const IXI_FINANCIAL_ENTRY_SIDES = {
  DEBIT:
    "debit",

  CREDIT:
    "credit"
};


/* =========================================================
   TAX
   ========================================================= */

export const IXI_FINANCIAL_TAX_MODES = {
  NONE:
    "none",

  EXCLUSIVE:
    "exclusive",

  INCLUSIVE:
    "inclusive"
};


export const IXI_FINANCIAL_TAX_STATUS = {
  NOT_APPLICABLE:
    "not-applicable",

  TAXABLE:
    "taxable",

  EXEMPT:
    "exempt",

  ZERO_RATED:
    "zero-rated",

  OUT_OF_SCOPE:
    "out-of-scope"
};


/* =========================================================
   CURRENCY
   ========================================================= */

/*
 * Currency itself is represented by ISO
 * currency code strings such as:
 *
 * USD
 * CAD
 * EUR
 * GBP
 *
 * Do not create a closed currency enum.
 */
export const IXI_FINANCIAL_EXCHANGE_RATE_SOURCES = {
  MANUAL:
    "manual",

  ACCOUNTING_SYSTEM:
    "accounting-system",

  BANK:
    "bank",

  MARKET:
    "market",

  OTHER:
    "other"
};


/* =========================================================
   DATE ROLES
   ========================================================= */

export const IXI_FINANCIAL_DATE_ROLES = {
  CREATED:
    "created",

  OCCURRED:
    "occurred",

  TRANSACTION:
    "transaction",

  DOCUMENT:
    "document",

  POSTING:
    "posting",

  DUE:
    "due",

  APPROVED:
    "approved",

  RECEIVED:
    "received",

  PAID:
    "paid",

  RECONCILED:
    "reconciled"
};


/* =========================================================
   SOURCE / ORIGIN
   ========================================================= */

export const IXI_FINANCIAL_ORIGINS = {
  IXI:
    "ixi",

  IMPORT:
    "import",

  API:
    "api",

  ACCOUNTING_SYSTEM:
    "accounting-system",

  MANUAL:
    "manual",

  AUTOMATION:
    "automation"
};


/* =========================================================
   EXTERNAL SYSTEM TYPES
   ========================================================= */

/*
 * These values identify mappings and sync
 * records.
 *
 * They do NOT alter the canonical IXI
 * financial structure.
 */
export const IXI_FINANCIAL_EXTERNAL_SYSTEMS = {
  QUICKBOOKS:
    "quickbooks",

  SAGE:
    "sage",

  NETSUITE:
    "netsuite",

  SAP:
    "sap",

  MICROSOFT_DYNAMICS:
    "microsoft-dynamics",

  XERO:
    "xero",

  OTHER:
    "other"
};


/* =========================================================
   SYNC STATUS
   ========================================================= */

export const IXI_FINANCIAL_SYNC_STATUS = {
  NOT_LINKED:
    "not-linked",

  READY:
    "ready",

  QUEUED:
    "queued",

  SYNCING:
    "syncing",

  SYNCED:
    "synced",

  PARTIAL:
    "partial",

  CONFLICT:
    "conflict",

  FAILED:
    "failed"
};


/* =========================================================
   APPROVAL STATUS
   ========================================================= */

export const IXI_FINANCIAL_APPROVAL_STATUS = {
  NOT_REQUIRED:
    "not-required",

  PENDING:
    "pending",

  APPROVED:
    "approved",

  REJECTED:
    "rejected",

  CANCELLED:
    "cancelled"
};


/* =========================================================
   AUDIT ACTIONS
   ========================================================= */

export const IXI_FINANCIAL_AUDIT_ACTIONS = {
  CREATED:
    "created",

  UPDATED:
    "updated",

  SUBMITTED:
    "submitted",

  APPROVED:
    "approved",

  REJECTED:
    "rejected",

  POSTED:
    "posted",

  PAID:
    "paid",

  RECONCILED:
    "reconciled",

  LINKED:
    "linked",

  UNLINKED:
    "unlinked",

  IMPORTED:
    "imported",

  EXPORTED:
    "exported",

  SYNCED:
    "synced",

  REVERSED:
    "reversed",

  VOIDED:
    "voided"
};


/* =========================================================
   ATTACHMENT TYPES
   ========================================================= */

export const IXI_FINANCIAL_ATTACHMENT_TYPES = {
  RECEIPT:
    "receipt",

  INVOICE:
    "invoice",

  BILL:
    "bill",

  PURCHASE_ORDER:
    "purchase-order",

  WORK_ORDER:
    "work-order",

  TIMESHEET:
    "timesheet",

  PHOTO:
    "photo",

  PDF:
    "pdf",

  DOCUMENT:
    "document",

  OTHER:
    "other"
};


/* =========================================================
   RELATION TYPES BETWEEN FINANCIAL DOCUMENTS
   ========================================================= */

/*
 * Financial-document relationships.
 *
 * These are not AOS Passport graph
 * relationships.
 *
 * Example:
 *
 * Purchase Order
 *      ↓ billed-by
 * Vendor Bill
 *
 * Vendor Bill
 *      ↓ paid-by
 * Payment
 */
export const IXI_FINANCIAL_DOCUMENT_LINK_TYPES = {
  DERIVED_FROM:
    "derived-from",

  FULFILLS:
    "fulfills",

  RECEIVES:
    "receives",

  BILLED_BY:
    "billed-by",

  PAYS:
    "pays",

  PAID_BY:
    "paid-by",

  CREDITS:
    "credits",

  REVERSES:
    "reverses",

  ADJUSTS:
    "adjusts",

  RELATED:
    "related"
};


/* =========================================================
   VALUE DIRECTION
   ========================================================= */

/*
 * Used for financial rollups.
 *
 * INFLOW
 * money/value coming in.
 *
 * OUTFLOW
 * money/value going out.
 *
 * NEUTRAL
 * informational or non-economic state.
 */
export const IXI_FINANCIAL_DIRECTIONS = {
  INFLOW:
    "inflow",

  OUTFLOW:
    "outflow",

  NEUTRAL:
    "neutral"
};


/* =========================================================
   NORMALIZATION HELPERS
   ========================================================= */

function clean(
  value
) {
  return String(
    value ??
    ""
  ).trim();
}


function normalizeEnumValue(
  value,
  allowedValues,
  fallback = ""
) {

  const cleaned =
    clean(
      value
    )
      .toLowerCase();


  if (
    allowedValues.includes(
      cleaned
    )
  ) {
    return cleaned;
  }


  return fallback;
}


function valuesOf(
  object
) {
  return Object.values(
    object || {}
  );
}


/* =========================================================
   PUBLIC NORMALIZERS
   ========================================================= */

export function normalizeIXIFinancialDocumentType(
  value,
  fallback =
    IXI_FINANCIAL_DOCUMENT_TYPES
      .EXPENSE
) {

  return normalizeEnumValue(
    value,
    valuesOf(
      IXI_FINANCIAL_DOCUMENT_TYPES
    ),
    fallback
  );
}


export function normalizeIXIFinancialDocumentStatus(
  value,
  fallback =
    IXI_FINANCIAL_DOCUMENT_STATUS
      .DRAFT
) {

  return normalizeEnumValue(
    value,
    valuesOf(
      IXI_FINANCIAL_DOCUMENT_STATUS
    ),
    fallback
  );
}


export function normalizeIXIFinancialState(
  value,
  fallback =
    IXI_FINANCIAL_STATES
      .PLANNED
) {

  return normalizeEnumValue(
    value,
    valuesOf(
      IXI_FINANCIAL_STATES
    ),
    fallback
  );
}


export function normalizeIXIFinancialLineType(
  value,
  fallback =
    IXI_FINANCIAL_LINE_TYPES
      .OTHER
) {

  return normalizeEnumValue(
    value,
    valuesOf(
      IXI_FINANCIAL_LINE_TYPES
    ),
    fallback
  );
}


export function normalizeIXIFinancialReferenceRole(
  value,
  fallback =
    IXI_FINANCIAL_REFERENCE_ROLES
      .OTHER
) {

  return normalizeEnumValue(
    value,
    valuesOf(
      IXI_FINANCIAL_REFERENCE_ROLES
    ),
    fallback
  );
}


export function normalizeIXIFinancialDirection(
  value,
  fallback =
    IXI_FINANCIAL_DIRECTIONS
      .NEUTRAL
) {

  return normalizeEnumValue(
    value,
    valuesOf(
      IXI_FINANCIAL_DIRECTIONS
    ),
    fallback
  );
}


export function normalizeIXIFinancialCurrency(
  value,
  fallback = "USD"
) {

  const currency =
    clean(
      value ||
      fallback
    )
      .toUpperCase();


  return /^[A-Z]{3}$/.test(
    currency
  )
    ? currency
    : String(
        fallback ||
        "USD"
      ).toUpperCase();
}


/* =========================================================
   TYPE CHECKS
   ========================================================= */

export function isIXIFinancialDocumentType(
  value
) {

  return valuesOf(
    IXI_FINANCIAL_DOCUMENT_TYPES
  ).includes(
    clean(
      value
    ).toLowerCase()
  );
}


export function isIXIFinancialLineType(
  value
) {

  return valuesOf(
    IXI_FINANCIAL_LINE_TYPES
  ).includes(
    clean(
      value
    ).toLowerCase()
  );
}


export function isIXIFinancialReferenceRole(
  value
) {

  return valuesOf(
    IXI_FINANCIAL_REFERENCE_ROLES
  ).includes(
    clean(
      value
    ).toLowerCase()
  );
}


/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

export default {
  IXI_FINANCIAL_SCHEMA,
  IXI_FINANCIAL_SCHEMA_VERSION,

  IXI_FINANCIAL_RECORD_TYPES,
  IXI_FINANCIAL_DOCUMENT_TYPES,
  IXI_FINANCIAL_DOCUMENT_STATUS,
  IXI_FINANCIAL_STATES,
  IXI_FINANCIAL_POSTING_STATUS,
  IXI_FINANCIAL_PAYMENT_STATUS,
  IXI_FINANCIAL_ACCOUNT_TYPES,
  IXI_FINANCIAL_PARTY_TYPES,
  IXI_FINANCIAL_REFERENCE_ROLES,
  IXI_FINANCIAL_LINE_TYPES,
  IXI_FINANCIAL_UNITS,
  IXI_FINANCIAL_ENTRY_SIDES,
  IXI_FINANCIAL_TAX_MODES,
  IXI_FINANCIAL_TAX_STATUS,
  IXI_FINANCIAL_EXCHANGE_RATE_SOURCES,
  IXI_FINANCIAL_DATE_ROLES,
  IXI_FINANCIAL_ORIGINS,
  IXI_FINANCIAL_EXTERNAL_SYSTEMS,
  IXI_FINANCIAL_SYNC_STATUS,
  IXI_FINANCIAL_APPROVAL_STATUS,
  IXI_FINANCIAL_AUDIT_ACTIONS,
  IXI_FINANCIAL_ATTACHMENT_TYPES,
  IXI_FINANCIAL_DOCUMENT_LINK_TYPES,
  IXI_FINANCIAL_DIRECTIONS,

  normalizeIXIFinancialDocumentType,
  normalizeIXIFinancialDocumentStatus,
  normalizeIXIFinancialState,
  normalizeIXIFinancialLineType,
  normalizeIXIFinancialReferenceRole,
  normalizeIXIFinancialDirection,
  normalizeIXIFinancialCurrency,

  isIXIFinancialDocumentType,
  isIXIFinancialLineType,
  isIXIFinancialReferenceRole
};
