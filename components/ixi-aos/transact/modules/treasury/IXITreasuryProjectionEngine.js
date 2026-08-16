const clean=value=>String(value??"").trim();
const num=value=>Number.isFinite(Number(value))?Number(value):0;
const money=value=>Math.round(num(value)*100)/100;
const arr=value=>Array.isArray(value)?value:[];
function docType(r={}){return clean(r.documentType||r.type||r.financialDocument?.documentType||r.document?.documentType||r.metadata?.documentType).toLowerCase();}
function input(r={}){return r.input||r.financialDocument?.input||r.document?.input||r;}
function amount(r={}){const s=input(r);return money(s.amount??s.total??s.subtotal??r.amount??r.financialDocument?.amount);}
function transactionClass(r={}){const s=input(r);return clean(s.transactionClass||r.transactionClass||r.metadata?.transactionClass).toLowerCase();}
function accountId(r={}){const s=input(r);return clean(s.accountId||s.cashAccountId||r.accountId||r.metadata?.accountId);}
function fromAccountId(r={}){const s=input(r);return clean(s.fromAccountId||r.fromAccountId||r.metadata?.fromAccountId);}
function toAccountId(r={}){const s=input(r);return clean(s.toAccountId||r.toAccountId||r.metadata?.toAccountId);}
function direction(r={}){const s=input(r);return clean(s.direction||r.direction||r.financialState).toLowerCase();}
function dateValue(r={}){const s=input(r);return clean(s.effectiveDate||s.documentDate||s.occurredAt||r.createdAt||r.audit?.createdAt);}
function parseDate(v=""){const d=new Date(v);return Number.isNaN(d.getTime())?null:d;}
function paymentDelta(record={},id=""){
 if(docType(record)!=="payment")return 0;const cls=transactionClass(record),amt=amount(record);if(cls==="account-transfer"){if(fromAccountId(record)===id)return -amt;if(toAccountId(record)===id)return amt;return 0;}if(accountId(record)!==id)return 0;const dir=direction(record);if(dir==="out"||dir==="paid"||dir==="debit")return -amt;if(dir==="in"||dir==="received"||dir==="credit")return amt;return 0;
}
function isForecastIncoming(r={}){if(docType(r)!=="invoice")return false;const s=input(r);return clean(s.financialState).toLowerCase()==="receivable"||clean(s.direction).toLowerCase()==="out"||Boolean(s.invoiceType);}
function isForecastOutgoing(r={}){if(docType(r)!=="bill")return false;const s=input(r);return clean(s.status).toLowerCase()!=="paid"&&clean(s.status).toLowerCase()!=="void";}
function dueDate(r={}){const s=input(r);return clean(s.dueDate||s.invoiceDueDate||s.documentDate||s.occurredAt);}
function withinDays(date,days,asOf){const d=parseDate(date);if(!d)return false;const ms=d.getTime()-asOf.getTime();return ms>=0&&ms<=days*86400000;}
export function buildIXITreasuryProjection({accounts=[],financialRecords=[],scheduledOutflows=[],expectedInflows=[],asOf=new Date()}={}){
 const records=arr(financialRecords),active=arr(accounts).filter(a=>a.account?.active!==false),accountRows=active.map(account=>{const id=clean(account.identity?.accountId),opening=money(account.opening?.amount),movement=money(records.reduce((sum,r)=>sum+paymentDelta(r,id),0)),bookBalance=money(opening+movement);return{account,accountId:id,name:clean(account.account?.name),type:clean(account.account?.accountType),institution:clean(account.account?.institution),last4:clean(account.account?.last4),currency:clean(account.account?.currency||"USD"),openingBalance:opening,movement,bookBalance,lastStatementBalance:account.control?.lastStatementBalance,lastReconciledAt:clean(account.control?.lastReconciledAt),minimumCash:money(account.control?.minimumCash),availableCash:money(bookBalance-Math.max(0,money(account.control?.minimumCash)))};});
 const totalCash=money(accountRows.reduce((s,a)=>s+a.bookBalance,0)),availableCash=money(accountRows.reduce((s,a)=>s+a.availableCash,0));
 const invoices=records.filter(isForecastIncoming),bills=records.filter(isForecastOutgoing);const customIn=arr(expectedInflows),customOut=arr(scheduledOutflows);
 function forecast(days){let incoming=0,outgoing=0;invoices.forEach(r=>{if(withinDays(dueDate(r),days,asOf))incoming+=amount(r)});bills.forEach(r=>{if(withinDays(dueDate(r),days,asOf))outgoing+=amount(r)});customIn.forEach(x=>{if(withinDays(x.date,days,asOf))incoming+=num(x.amount)});customOut.forEach(x=>{if(withinDays(x.date,days,asOf))outgoing+=num(x.amount)});return{days,incoming:money(incoming),outgoing:money(outgoing),net:money(incoming-outgoing),endingCash:money(totalCash+incoming-outgoing)};}
 const forecasts=[forecast(7),forecast(30),forecast(60),forecast(90)];return{accounts:accountRows,totalCash,availableCash,expectedIn7:forecasts[0].incoming,scheduledOut7:forecasts[0].outgoing,forecasts};
}
export default{buildIXITreasuryProjection};