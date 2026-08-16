/*
 * IXI FINANCIAL TYPES
 * Canonical vocabulary for the IXI AOS Financial Engine.
 */

export const IXI_FINANCIAL_SCHEMA = "ixi-financial-v1";
export const IXI_FINANCIAL_SCHEMA_VERSION = 1;

export const IXI_FINANCIAL_RECORD_TYPES = {
  DOCUMENT:"document", LINE:"line", PAYMENT:"payment", JOURNAL:"journal",
  BUDGET:"budget", ALLOCATION:"allocation", ADJUSTMENT:"adjustment"
};

export const IXI_FINANCIAL_DOCUMENT_TYPES = {
  PURCHASE_REQUISITION:"purchase-requisition",
  PURCHASE_ORDER:"purchase-order",
  RECEIPT:"receipt",
  EXPENSE:"expense",
  BILL:"bill",
  SUPPLIER_INVOICE:"supplier-invoice",
  VENDOR_CREDIT:"vendor-credit",
  BILL_PAYMENT:"bill-payment",
  ESTIMATE:"estimate",
  QUOTE:"quote",
  SALES_ORDER:"sales-order",
  INVOICE:"invoice",
  CUSTOMER_CREDIT:"customer-credit",
  CUSTOMER_PAYMENT:"customer-payment",
  ASSET_ACQUISITION:"asset-acquisition",
  WORK_ORDER:"work-order",
  SERVICE_ORDER:"service-order",
  TIME_ENTRY:"time-entry",
  LABOR_ENTRY:"labor-entry",
  MATERIAL_USAGE:"material-usage",
  INVENTORY_USAGE:"inventory-usage",
  FUEL_ENTRY:"fuel-entry",
  RENTAL:"rental",
  FREIGHT:"freight",
  JOURNAL_ENTRY:"journal-entry",
  ADJUSTMENT:"adjustment",
  TRANSFER:"transfer",
  REFUND:"refund",
  BUDGET:"budget",
  FORECAST:"forecast"
};

export const IXI_FINANCIAL_DOCUMENT_STATUS = {
  DRAFT:"draft", SUBMITTED:"submitted", PENDING_APPROVAL:"pending-approval",
  APPROVED:"approved", REJECTED:"rejected", OPEN:"open",
  PARTIALLY_FULFILLED:"partially-fulfilled", FULFILLED:"fulfilled",
  PARTIALLY_BILLED:"partially-billed", BILLED:"billed",
  PARTIALLY_PAID:"partially-paid", PAID:"paid", CLOSED:"closed",
  VOID:"void", REVERSED:"reversed", CANCELLED:"cancelled"
};

export const IXI_FINANCIAL_STATES = {
  PLANNED:"planned", BUDGETED:"budgeted", REQUESTED:"requested", APPROVED:"approved",
  COMMITTED:"committed", ORDERED:"ordered", RECEIVED:"received", INCURRED:"incurred",
  BILLED:"billed", POSTED:"posted", PAID:"paid", RECONCILED:"reconciled",
  REVERSED:"reversed", VOID:"void"
};

export const IXI_FINANCIAL_POSTING_STATUS = {
  NOT_READY:"not-ready", READY:"ready", PENDING_REVIEW:"pending-review", APPROVED:"approved",
  QUEUED:"queued", POSTED:"posted", FAILED:"failed", REVERSED:"reversed"
};

export const IXI_FINANCIAL_PAYMENT_STATUS = {
  NOT_APPLICABLE:"not-applicable", UNPAID:"unpaid", PARTIALLY_PAID:"partially-paid",
  PAID:"paid", OVERPAID:"overpaid", REFUNDED:"refunded"
};

export const IXI_FINANCIAL_ACCOUNT_TYPES = {
  ASSET:"asset", LIABILITY:"liability", EQUITY:"equity", REVENUE:"revenue",
  EXPENSE:"expense", COST_OF_GOODS_SOLD:"cost-of-goods-sold",
  OTHER_INCOME:"other-income", OTHER_EXPENSE:"other-expense"
};

export const IXI_FINANCIAL_PARTY_TYPES = {
  ENTITY:"entity", CUSTOMER:"customer", VENDOR:"vendor", SUPPLIER:"supplier",
  EMPLOYEE:"employee", CONTRACTOR:"contractor", OTHER:"other"
};

export const IXI_FINANCIAL_REFERENCE_ROLES = {
  OWNER:"owner", ENTITY:"entity", CUSTOMER:"customer", VENDOR:"vendor", SUPPLIER:"supplier",
  EMPLOYEE:"employee", CONTRACTOR:"contractor", ASSET:"asset", OBJECT:"object",
  CONTAINER:"container", JOB:"job", PROJECT:"project", LOCATION:"location",
  DEPARTMENT:"department", COST_CENTER:"cost-center", PROFIT_CENTER:"profit-center",
  BUSINESS_UNIT:"business-unit", ITEM:"item", SERVICE:"service", SOURCE:"source",
  DESTINATION:"destination", OTHER:"other"
};

export const IXI_FINANCIAL_LINE_TYPES = {
  ITEM:"item", SERVICE:"service", LABOR:"labor", TIME:"time", MATERIAL:"material",
  PART:"part", FUEL:"fuel", FREIGHT:"freight", RENTAL:"rental", TAX:"tax",
  DISCOUNT:"discount", FEE:"fee", INTEREST:"interest", EXPENSE:"expense",
  REVENUE:"revenue", OTHER:"other"
};

export const IXI_FINANCIAL_UNITS = {
  EACH:"each", HOUR:"hour", DAY:"day", WEEK:"week", MONTH:"month", MILE:"mile",
  KILOMETER:"kilometer", GALLON:"gallon", LITER:"liter", TON:"ton", POUND:"pound",
  KILOGRAM:"kilogram", FOOT:"foot", METER:"meter", ACRE:"acre", HECTARE:"hectare",
  LOAD:"load", CYCLE:"cycle", UNIT:"unit"
};

export const IXI_FINANCIAL_ENTRY_SIDES = { DEBIT:"debit", CREDIT:"credit" };
export const IXI_FINANCIAL_TAX_MODES = { NONE:"none", EXCLUSIVE:"exclusive", INCLUSIVE:"inclusive" };
export const IXI_FINANCIAL_TAX_STATUS = {
  NOT_APPLICABLE:"not-applicable", TAXABLE:"taxable", EXEMPT:"exempt",
  ZERO_RATED:"zero-rated", OUT_OF_SCOPE:"out-of-scope"
};
export const IXI_FINANCIAL_EXCHANGE_RATE_SOURCES = {
  MANUAL:"manual", ACCOUNTING_SYSTEM:"accounting-system", BANK:"bank", MARKET:"market", OTHER:"other"
};
export const IXI_FINANCIAL_DATE_ROLES = {
  CREATED:"created", OCCURRED:"occurred", TRANSACTION:"transaction", DOCUMENT:"document",
  POSTING:"posting", DUE:"due", APPROVED:"approved", RECEIVED:"received",
  PAID:"paid", RECONCILED:"reconciled"
};
export const IXI_FINANCIAL_ORIGINS = {
  IXI:"ixi", IMPORT:"import", API:"api", ACCOUNTING_SYSTEM:"accounting-system",
  MANUAL:"manual", AUTOMATION:"automation"
};
export const IXI_FINANCIAL_EXTERNAL_SYSTEMS = {
  QUICKBOOKS:"quickbooks", SAGE:"sage", NETSUITE:"netsuite", SAP:"sap",
  MICROSOFT_DYNAMICS:"microsoft-dynamics", XERO:"xero", OTHER:"other"
};
export const IXI_FINANCIAL_SYNC_STATUS = {
  NOT_LINKED:"not-linked", READY:"ready", QUEUED:"queued", SYNCING:"syncing",
  SYNCED:"synced", PARTIAL:"partial", CONFLICT:"conflict", FAILED:"failed"
};
export const IXI_FINANCIAL_APPROVAL_STATUS = {
  NOT_REQUIRED:"not-required", PENDING:"pending", APPROVED:"approved",
  REJECTED:"rejected", CANCELLED:"cancelled"
};
export const IXI_FINANCIAL_AUDIT_ACTIONS = {
  CREATED:"created", UPDATED:"updated", SUBMITTED:"submitted", APPROVED:"approved",
  REJECTED:"rejected", POSTED:"posted", PAID:"paid", RECONCILED:"reconciled",
  LINKED:"linked", UNLINKED:"unlinked", IMPORTED:"imported", EXPORTED:"exported",
  SYNCED:"synced", REVERSED:"reversed", VOIDED:"voided"
};
export const IXI_FINANCIAL_ATTACHMENT_TYPES = {
  RECEIPT:"receipt", INVOICE:"invoice", BILL:"bill", PURCHASE_ORDER:"purchase-order",
  WORK_ORDER:"work-order", TIMESHEET:"timesheet", PHOTO:"photo", PDF:"pdf",
  DOCUMENT:"document", OTHER:"other"
};
export const IXI_FINANCIAL_DOCUMENT_LINK_TYPES = {
  DERIVED_FROM:"derived-from", FULFILLS:"fulfills", RECEIVES:"receives",
  BILLED_BY:"billed-by", PAYS:"pays", PAID_BY:"paid-by", CREDITS:"credits",
  REVERSES:"reverses", ADJUSTS:"adjusts", RELATED:"related"
};
export const IXI_FINANCIAL_DIRECTIONS = { INFLOW:"inflow", OUTFLOW:"outflow", NEUTRAL:"neutral" };

function clean(value){ return String(value ?? "").trim(); }
function valuesOf(object){ return Object.values(object || {}); }
function normalizeEnumValue(value, allowedValues, fallback=""){
  const cleaned=clean(value).toLowerCase();
  return allowedValues.includes(cleaned) ? cleaned : fallback;
}

export function normalizeIXIFinancialDocumentType(value,fallback=IXI_FINANCIAL_DOCUMENT_TYPES.EXPENSE){
  return normalizeEnumValue(value,valuesOf(IXI_FINANCIAL_DOCUMENT_TYPES),fallback);
}
export function normalizeIXIFinancialDocumentStatus(value,fallback=IXI_FINANCIAL_DOCUMENT_STATUS.DRAFT){
  return normalizeEnumValue(value,valuesOf(IXI_FINANCIAL_DOCUMENT_STATUS),fallback);
}
export function normalizeIXIFinancialState(value,fallback=IXI_FINANCIAL_STATES.PLANNED){
  return normalizeEnumValue(value,valuesOf(IXI_FINANCIAL_STATES),fallback);
}
export function normalizeIXIFinancialLineType(value,fallback=IXI_FINANCIAL_LINE_TYPES.OTHER){
  return normalizeEnumValue(value,valuesOf(IXI_FINANCIAL_LINE_TYPES),fallback);
}
export function normalizeIXIFinancialReferenceRole(value,fallback=IXI_FINANCIAL_REFERENCE_ROLES.OTHER){
  return normalizeEnumValue(value,valuesOf(IXI_FINANCIAL_REFERENCE_ROLES),fallback);
}
export function normalizeIXIFinancialDirection(value,fallback=IXI_FINANCIAL_DIRECTIONS.NEUTRAL){
  return normalizeEnumValue(value,valuesOf(IXI_FINANCIAL_DIRECTIONS),fallback);
}
export function normalizeIXIFinancialCurrency(value,fallback="USD"){
  const currency=clean(value||fallback).toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : String(fallback||"USD").toUpperCase();
}
export function isIXIFinancialDocumentType(value){ return valuesOf(IXI_FINANCIAL_DOCUMENT_TYPES).includes(clean(value).toLowerCase()); }
export function isIXIFinancialLineType(value){ return valuesOf(IXI_FINANCIAL_LINE_TYPES).includes(clean(value).toLowerCase()); }
export function isIXIFinancialReferenceRole(value){ return valuesOf(IXI_FINANCIAL_REFERENCE_ROLES).includes(clean(value).toLowerCase()); }

export default {
  IXI_FINANCIAL_SCHEMA, IXI_FINANCIAL_SCHEMA_VERSION,
  IXI_FINANCIAL_RECORD_TYPES, IXI_FINANCIAL_DOCUMENT_TYPES,
  IXI_FINANCIAL_DOCUMENT_STATUS, IXI_FINANCIAL_STATES,
  IXI_FINANCIAL_POSTING_STATUS, IXI_FINANCIAL_PAYMENT_STATUS,
  IXI_FINANCIAL_ACCOUNT_TYPES, IXI_FINANCIAL_PARTY_TYPES,
  IXI_FINANCIAL_REFERENCE_ROLES, IXI_FINANCIAL_LINE_TYPES,
  IXI_FINANCIAL_UNITS, IXI_FINANCIAL_ENTRY_SIDES,
  IXI_FINANCIAL_TAX_MODES, IXI_FINANCIAL_TAX_STATUS,
  IXI_FINANCIAL_EXCHANGE_RATE_SOURCES, IXI_FINANCIAL_DATE_ROLES,
  IXI_FINANCIAL_ORIGINS, IXI_FINANCIAL_EXTERNAL_SYSTEMS,
  IXI_FINANCIAL_SYNC_STATUS, IXI_FINANCIAL_APPROVAL_STATUS,
  IXI_FINANCIAL_AUDIT_ACTIONS, IXI_FINANCIAL_ATTACHMENT_TYPES,
  IXI_FINANCIAL_DOCUMENT_LINK_TYPES, IXI_FINANCIAL_DIRECTIONS,
  normalizeIXIFinancialDocumentType, normalizeIXIFinancialDocumentStatus,
  normalizeIXIFinancialState, normalizeIXIFinancialLineType,
  normalizeIXIFinancialReferenceRole, normalizeIXIFinancialDirection,
  normalizeIXIFinancialCurrency, isIXIFinancialDocumentType,
  isIXIFinancialLineType, isIXIFinancialReferenceRole
};
