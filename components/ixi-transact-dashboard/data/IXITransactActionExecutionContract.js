const clean=value=>String(value??"").trim();
const obj=value=>value&&typeof value==="object"&&!Array.isArray(value)?value:{};
const num=value=>{if(value===null||value===undefined||value==="")return null;const parsed=Number(value);return Number.isFinite(parsed)?parsed:null;};

export const IXI_TRANSACT_ACTION_INPUT_CONTRACTS=Object.freeze({
  "record-ar-payment":{contract:"ixi-ar-payment-input-v1",fields:["amount","date","method","reference"]},
  "record-ar-credit":{contract:"ixi-ar-credit-input-v1",fields:["amount","reason","description","writeOff"]},
  "record-ap-payment":{contract:"ixi-ap-payment-input-v1",fields:["amount","date","method","reference"]},
  "record-vendor-credit":{contract:"ixi-vendor-credit-input-v1",fields:["amount","date","reason"]},
  "issue-po":{contract:"ixi-po-issue-input-v1",fields:[]},
  "match-bill":{contract:"ixi-po-bill-match-input-v1",fields:["invoiceNumber","invoiceDate","amount"]}
});

function executionEnvelope(record={}){
  const source=obj(record);
  return obj(source._ixiExecution||source.execution||source.actionExecution);
}

export function getIXITransactActionInputContract(actionId=""){
  return IXI_TRANSACT_ACTION_INPUT_CONTRACTS[clean(actionId).toLowerCase()]||null;
}

export function getIXITransactActionExecutionContext(record={},actionId=""){
  const action=clean(actionId).toLowerCase();
  const execution=executionEnvelope(record);
  const common={object:obj(execution.object),context:obj(execution.context),metadata:obj(execution.metadata)};
  if(action==="record-ar-payment"||action==="record-ar-credit")return{...common,receivable:obj(execution.receivable||execution.ar),collection:obj(execution.collection)};
  if(action==="record-ap-payment"||action==="record-vendor-credit")return{...common,payable:obj(execution.payable||execution.ap)};
  if(action==="issue-po"||action==="match-bill")return{...common,record:obj(execution.purchaseOrder||execution.record||record)};
  return common;
}

export function validateIXITransactActionExecution({action={},record={},input={}}={}){
  const id=clean(action?.id||action).toLowerCase();
  const definition=getIXITransactActionInputContract(id);
  const errors=[];
  if(!definition){errors.push({code:"unsupported-action",message:"Desktop action is not implemented."});return{ok:false,errors,context:{}};}
  if(action&&typeof action==="object"&&action.enabled===false)errors.push({code:"action-disabled",message:clean(action.reason)||"Action is not authorized in the current record state."});
  const context=getIXITransactActionExecutionContext(record,id);
  if(!clean(context.object?.passportId||context.object?.objectId||context.object?.id))errors.push({code:"object-context-required",message:"Canonical object execution context is required."});
  if(!clean(context.context?.entity?.passportId||context.context?.entityPassportId))errors.push({code:"entity-context-required",message:"Trusted entity execution context is required."});
  if(id==="record-ar-payment"||id==="record-ar-credit"){
    const balance=num(context.receivable?.balance??context.receivable?.openBalance??context.receivable?.balanceDue);
    const amount=num(input?.amount);
    if(!clean(context.receivable?.invoiceId||context.receivable?.financialDocumentId))errors.push({code:"invoice-context-required",message:"Canonical receivable invoice identity is required."});
    if(!(amount>0))errors.push({code:"positive-amount-required",message:"Amount must be greater than zero."});
    if(balance!==null&&amount!==null&&amount>balance+0.005)errors.push({code:"amount-exceeds-open-balance",message:"Amount cannot exceed the open receivable balance."});
    if(id==="record-ar-credit"&&!clean(input?.reason||input?.description))errors.push({code:"credit-reason-required",message:"A/R credit reason is required."});
  }
  if(id==="record-ap-payment"||id==="record-vendor-credit"){
    const balance=num(context.payable?.balance??context.payable?.openBalance??context.payable?.balanceDue);
    const amount=num(input?.amount);
    if(!clean(context.payable?.billId||context.payable?.financialDocumentId))errors.push({code:"bill-context-required",message:"Canonical payable Bill identity is required."});
    if(!(amount>0))errors.push({code:"positive-amount-required",message:"Amount must be greater than zero."});
    if(balance!==null&&amount!==null&&amount>balance+0.005)errors.push({code:"amount-exceeds-open-balance",message:"Amount cannot exceed the open A/P balance."});
    if(id==="record-vendor-credit"&&!clean(input?.reason))errors.push({code:"credit-reason-required",message:"Vendor credit reason is required."});
  }
  if(id==="issue-po"){
    if(!clean(context.record?.identity?.purchaseOrderRecordId))errors.push({code:"purchase-order-record-required",message:"Canonical Purchase Order record identity is required."});
    if(!Array.isArray(context.record?.order?.lines)||!context.record.order.lines.length)errors.push({code:"purchase-order-lines-required",message:"Purchase Order lines are required before issue."});
  }
  if(id==="match-bill"){
    if(!clean(context.record?.identity?.purchaseOrderRecordId))errors.push({code:"purchase-order-record-required",message:"Canonical Purchase Order record identity is required."});
    if(!clean(input?.invoiceNumber))errors.push({code:"invoice-number-required",message:"Vendor invoice number is required."});
    if(!/^\d{4}-\d{2}-\d{2}$/.test(clean(input?.invoiceDate)))errors.push({code:"invoice-date-required",message:"Vendor invoice date must be YYYY-MM-DD."});
    if(!(num(input?.amount)>0))errors.push({code:"positive-amount-required",message:"Bill amount must be greater than zero."});
  }
  return{ok:errors.length===0,errors,context,inputContract:definition.contract};
}

export default{IXI_TRANSACT_ACTION_INPUT_CONTRACTS,getIXITransactActionInputContract,getIXITransactActionExecutionContext,validateIXITransactActionExecution};
