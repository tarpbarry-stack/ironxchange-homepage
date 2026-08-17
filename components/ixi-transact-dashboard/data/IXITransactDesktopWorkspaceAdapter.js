const clean=value=>String(value??"").trim();
const obj=value=>value&&typeof value==="object"&&!Array.isArray(value)?value:{};
const arr=value=>Array.isArray(value)?value:[];
const num=value=>Number.isFinite(Number(value))?Number(value):null;
const firstNumber=(source,keys=[])=>{for(const key of keys){const value=key.split(".").reduce((x,p)=>x?.[p],source);const n=num(value);if(n!==null)return n;}return null;};

export function createIXIARDesktopModel(projection={}){
 const source=obj(projection.ar);const totals=obj(source.totals||source.summary);const rows=arr(source.receivables||source.rows||source.items);const customers=arr(source.customers||source.customerExposure);
 return{currency:clean(source.currency||projection.currency||"USD").toUpperCase(),totals:{totalAR:firstNumber(totals,["totalAR","open","balance"]),current:firstNumber(totals,["current"]),days1to30:firstNumber(totals,["days1to30","1-30"]),days31to60:firstNumber(totals,["days31to60","31-60"]),days61to90:firstNumber(totals,["days61to90","61-90"]),days90plus:firstNumber(totals,["days90plus","90+"]),overdue:firstNumber(totals,["overdue"])},receivables:rows,customers};
}
export function createIXIAPDesktopModel(projection={}){
 const source=obj(projection.ap);const totals=obj(source.totals||source.summary);return{currency:clean(source.currency||projection.currency||"USD").toUpperCase(),totals:{totalAP:firstNumber(totals,["totalAP","open","balance"]),current:firstNumber(totals,["current"]),overdue:firstNumber(totals,["overdue"]),needsApproval:firstNumber(totals,["needsApproval"]),matchException:firstNumber(totals,["matchException"]),scheduled:firstNumber(totals,["scheduled"])},payables:arr(source.payables||source.rows||source.items),vendors:arr(source.vendors||source.vendorExposure)};
}
export function createIXITreasuryDesktopModel(projection={}){
 const source=obj(projection.treasury);return{currency:clean(source.currency||projection.currency||"USD").toUpperCase(),totalCash:firstNumber(source,["totalCash","bookCash","summary.totalCash"]),availableCash:firstNumber(source,["availableCash","summary.availableCash"]),expectedIn7:firstNumber(source,["expectedIn7","summary.expectedIn7"]),scheduledOut7:firstNumber(source,["scheduledOut7","summary.scheduledOut7"]),accounts:arr(source.accounts),forecasts:arr(source.forecasts||source.forecast?.series)};
}
export function createIXIGLDesktopModel(projection={}){
 const source=obj(projection.gl);return{periodStatus:clean(source.periodStatus||source.period?.status),period:clean(source.period||source.periodNumber||source.accountingPeriod),closeReady:source.closeReady===true,postingExceptions:firstNumber(source,["postingExceptions","counts.exceptions"]),unposted:firstNumber(source,["unposted","counts.ready"]),controls:arr(source.controls||source.checks||source.closeChecks),journals:arr(source.journals),exceptions:arr(source.exceptions||source.postingExceptionsList)};
}
export default{createIXIARDesktopModel,createIXIAPDesktopModel,createIXITreasuryDesktopModel,createIXIGLDesktopModel};