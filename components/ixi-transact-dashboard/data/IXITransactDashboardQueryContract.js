const clean = value => String(value ?? "").trim();
const safeArray = value => Array.isArray(value) ? value : [];
const safeObject = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};

export const IXI_TRANSACT_DASHBOARD_INCLUDES = Object.freeze([
  "executive","attention","ar","ap","treasury","gl-controls","reporting","operations","work-orders","purchase-orders"
]);

const WORKSPACE_INCLUDES = Object.freeze({
  executive: ["executive", "attention", "ar", "ap", "treasury", "gl-controls", "reporting"],
  ar: ["ar", "attention"],
  invoices: ["ar"],
  sales: ["ar", "reporting"],
  ap: ["ap", "attention"],
  bills: ["ap", "attention"],
  "purchase-orders": ["purchase-orders", "attention"],
  treasury: ["treasury", "attention"],
  reconciliation: ["treasury", "attention"],
  gl: ["gl-controls", "attention"],
  close: ["gl-controls", "attention"],
  reporting: ["reporting"],
  profitability: ["reporting"],
  "work-orders": ["operations", "work-orders", "attention"],
  assets: ["operations", "reporting"],
  service: ["operations", "work-orders", "ar", "attention"],
  rental: ["operations", "reporting"]
});

export function getIXITransactWorkspaceIncludes(workspace = "executive") {const key=clean(workspace||"executive"),includes=WORKSPACE_INCLUDES[key]||WORKSPACE_INCLUDES.executive;return Array.from(new Set(includes));}
export function normalizeIXITransactDashboardScope(scope = {}) {const source=safeObject(scope),normalizeIds=values=>Array.from(new Set(safeArray(values).map(clean).filter(Boolean)));return{entityPassportIds:normalizeIds(source.entityPassportIds),locationPassportIds:normalizeIds(source.locationPassportIds),assetPassportIds:normalizeIds(source.assetPassportIds),customerPassportIds:normalizeIds(source.customerPassportIds),vendorPassportIds:normalizeIds(source.vendorPassportIds)};}
export function normalizeIXITransactDashboardPeriod(period = {}) {const source=safeObject(period);return{from:clean(source.from),through:clean(source.through),accountingPeriod:clean(source.accountingPeriod)};}
export function createIXITransactDashboardQuery({scope={},period={},currency="USD",filters={},include=IXI_TRANSACT_DASHBOARD_INCLUDES}={}){const normalizedInclude=Array.from(new Set(safeArray(include).map(clean).filter(value=>IXI_TRANSACT_DASHBOARD_INCLUDES.includes(value))));return{contract:"ixi-transact-dashboard-query",contractVersion:"1.2.0",scope:normalizeIXITransactDashboardScope(scope),period:normalizeIXITransactDashboardPeriod(period),currency:/^[A-Z]{3}$/.test(clean(currency).toUpperCase())?clean(currency).toUpperCase():"USD",filters:safeObject(filters),include:normalizedInclude.length?normalizedInclude:[...IXI_TRANSACT_DASHBOARD_INCLUDES]};}
export function validateIXITransactDashboardQuery(query={}){const source=safeObject(query),errors=[];if(!safeArray(source.scope?.entityPassportIds).length)errors.push({code:"entity-scope-required",message:"At least one authorized entity Passport is required."});if(!clean(source.period?.accountingPeriod)&&!clean(source.period?.through))errors.push({code:"period-required",message:"Accounting period or through date is required."});return{ok:errors.length===0,errors};}
export default{IXI_TRANSACT_DASHBOARD_INCLUDES,getIXITransactWorkspaceIncludes,normalizeIXITransactDashboardScope,normalizeIXITransactDashboardPeriod,createIXITransactDashboardQuery,validateIXITransactDashboardQuery};
