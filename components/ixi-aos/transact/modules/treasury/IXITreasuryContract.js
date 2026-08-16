const clean=value=>String(value??"").trim();
const num=value=>Number.isFinite(Number(value))?Number(value):0;
const money=value=>Math.round(num(value)*100)/100;
const arr=value=>Array.isArray(value)?value:[];

export const IXI_TREASURY_ACCOUNT_SCHEMA="ixi-treasury-account-v1";
export const IXI_TREASURY_RECON_SCHEMA="ixi-treasury-reconciliation-v1";
export const IXI_TREASURY_ACCOUNT_TYPES=Object.freeze(["checking","savings","cash","clearing","money-market"]);

export function createIXITreasuryAccount({context={},input={}}={}){
 const stamp=Date.now();
 const type=IXI_TREASURY_ACCOUNT_TYPES.includes(clean(input.accountType))?clean(input.accountType):"checking";
 return{schema:IXI_TREASURY_ACCOUNT_SCHEMA,identity:{accountId:clean(input.accountId)||`CASH-${stamp}`,number:clean(input.number)||`CASH-${String(stamp).slice(-6)}`},account:{name:clean(input.name),accountType:type,institution:clean(input.institution),last4:clean(input.last4).slice(-4),currency:clean(input.currency||"USD").toUpperCase(),entityPassportId:clean(context.entity?.passportId),entityLabel:clean(context.entity?.label),locationPassportId:clean(context.location?.passportId),locationLabel:clean(context.location?.label),active:true},opening:{effectiveDate:clean(input.openingDate),amount:money(input.openingBalance),source:clean(input.openingSource||"bank-statement"),reference:clean(input.openingReference),documentName:clean(input.documentName),financialDocumentId:"",posted:false},control:{allowNegative:Boolean(input.allowNegative),minimumCash:money(input.minimumCash),lastReconciledAt:"",lastStatementBalance:null,lastBookBalance:null},audit:{createdAt:new Date().toISOString(),createdBy:clean(context.actor?.passportId||context.actor?.employeeId||context.actor?.id),createdByLabel:clean(context.actor?.displayName||context.actor?.name||context.actor?.label),updatedAt:new Date().toISOString()},activity:[]};
}

export function validateIXITreasuryAccount(record={}){
 const errors={};if(!clean(record.account?.name))errors.name="required";if(!clean(record.account?.currency))errors.currency="required";if(!/^\d{4}-\d{2}-\d{2}$/.test(clean(record.opening?.effectiveDate)))errors.openingDate="required";if(!Number.isFinite(Number(record.opening?.amount)))errors.openingBalance="required";return{valid:Object.keys(errors).length===0,errors};
}

export function createIXITreasuryReconciliation({account={},input={},actor={}}={}){
 const statement=money(input.statementBalance),book=money(input.bookBalance),deposits=money(input.depositsInTransit),outstanding=money(input.outstandingPayments),other=money(input.otherReconcilingItems),adjustedBank=money(statement+deposits-outstanding+other),difference=money(book-adjustedBank),stamp=Date.now();
 return{schema:IXI_TREASURY_RECON_SCHEMA,identity:{reconciliationId:`REC-${stamp}`,number:`REC-${String(stamp).slice(-6)}`},accountId:clean(account.identity?.accountId),accountNumber:clean(account.identity?.number),statement:{date:clean(input.statementDate),balance:statement,reference:clean(input.statementReference)},book:{balance:book},reconciling:{depositsInTransit:deposits,outstandingPayments:outstanding,otherReconcilingItems:other,adjustedBankBalance:adjustedBank,difference},status:Math.abs(difference)<0.005?"reconciled":"out-of-balance",notes:clean(input.notes),audit:{createdAt:new Date().toISOString(),createdBy:clean(actor.passportId||actor.employeeId||actor.id),createdByLabel:clean(actor.displayName||actor.name||actor.label)}};
}

export function validateIXITreasuryReconciliation(record={}){const errors={};if(!clean(record.accountId))errors.account="required";if(!/^\d{4}-\d{2}-\d{2}$/.test(clean(record.statement?.date)))errors.statementDate="required";if(!Number.isFinite(Number(record.statement?.balance)))errors.statementBalance="required";return{valid:Object.keys(errors).length===0,errors};}

export function normalizeIXITreasuryAccounts(accounts=[]){return arr(accounts).filter(item=>clean(item.identity?.accountId)&&item.account?.active!==false);}
export default{createIXITreasuryAccount,validateIXITreasuryAccount,createIXITreasuryReconciliation,validateIXITreasuryReconciliation,normalizeIXITreasuryAccounts};