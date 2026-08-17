const clean=value=>String(value??"").trim();
const obj=value=>value&&typeof value==="object"&&!Array.isArray(value)?value:{};
const arr=value=>Array.isArray(value)?value:[];

export const IXI_TRANSACT_RECORD_ACTIONS=Object.freeze({
  "open-canonical-record":{label:"OPEN CANONICAL RECORD",kind:"navigate",requiresInput:false},
  "open-passport":{label:"OPEN PASSPORT",kind:"navigate",requiresInput:false},
  "create-collection-case":{label:"OPEN COLLECTION CASE",kind:"collections",requiresInput:true},
  "record-ar-payment":{label:"POST A/R PAYMENT",kind:"collections",requiresInput:true},
  "record-ar-credit":{label:"POST A/R CREDIT",kind:"collections",requiresInput:true},
  "record-ap-payment":{label:"POST A/P PAYMENT",kind:"payables",requiresInput:true},
  "record-vendor-credit":{label:"POST VENDOR CREDIT",kind:"payables",requiresInput:true},
  "approve-request":{label:"APPROVE REQUEST",kind:"purchase-order",requiresInput:false},
  "return-request":{label:"RETURN REQUEST",kind:"purchase-order",requiresInput:true},
  "deny-request":{label:"DENY REQUEST",kind:"purchase-order",requiresInput:true,dangerous:true},
  "issue-po":{label:"ISSUE PO",kind:"purchase-order",requiresInput:false},
  "send-po":{label:"SEND PO",kind:"purchase-order",requiresInput:false},
  "receive":{label:"RECEIVE",kind:"purchase-order",requiresInput:true},
  "close-remainder":{label:"CLOSE REMAINDER",kind:"purchase-order",requiresInput:true},
  "match-bill":{label:"MATCH BILL",kind:"purchase-order",requiresInput:true},
  "approve-variance":{label:"APPROVE VARIANCE",kind:"purchase-order",requiresInput:true},
  "cancel-remainder":{label:"CANCEL REMAINDER",kind:"purchase-order",requiresInput:true,dangerous:true},
  "void-po":{label:"VOID PO",kind:"purchase-order",requiresInput:true,dangerous:true},
  "reopen":{label:"REOPEN",kind:"purchase-order",requiresInput:true},
  "add-note":{label:"ADD NOTE",kind:"purchase-order",requiresInput:true},
  "treasury-adjustment":{label:"POST CASH ADJUSTMENT",kind:"treasury",requiresInput:true},
  "treasury-transfer":{label:"TRANSFER CASH",kind:"treasury",requiresInput:true},
  "reconcile-account":{label:"RECONCILE ACCOUNT",kind:"treasury",requiresInput:true}
});

function normalizeServerAction(action){
 const source=typeof action==="string"?{id:action}:obj(action);
 const id=clean(source.id||source.action||source.actionId).toLowerCase();
 const definition=IXI_TRANSACT_RECORD_ACTIONS[id];
 if(!definition)return null;
 return{
  id,
  label:clean(source.label)||definition.label,
  kind:definition.kind,
  enabled:source.enabled!==false&&source.allowed!==false,
  reason:clean(source.reason||source.disabledReason),
  requiresInput:source.requiresInput===undefined?definition.requiresInput:source.requiresInput===true,
  dangerous:definition.dangerous===true||source.dangerous===true,
  inputContract:clean(source.inputContract||source.contract),
  metadata:obj(source.metadata)
 };
}

export function normalizeIXITransactRecordActions(actions=[]){
 const seen=new Set();
 return arr(actions).map(normalizeServerAction).filter(action=>{
  if(!action||seen.has(action.id))return false;
  seen.add(action.id);
  return true;
 });
}

export function getUnknownIXITransactRecordActionIds(actions=[]){
 return arr(actions).map(action=>clean(typeof action==="string"?action:action?.id||action?.action||action?.actionId).toLowerCase()).filter(Boolean).filter(id=>!IXI_TRANSACT_RECORD_ACTIONS[id]);
}

export function canExecuteIXITransactRecordAction(action={}){
 const normalized=normalizeServerAction(action);
 return Boolean(normalized&&normalized.enabled&&!normalized.requiresInput);
}

export default{IXI_TRANSACT_RECORD_ACTIONS,normalizeIXITransactRecordActions,getUnknownIXITransactRecordActionIds,canExecuteIXITransactRecordAction};
