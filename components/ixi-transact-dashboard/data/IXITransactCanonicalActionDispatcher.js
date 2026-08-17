import {recordIXICollectionPayment,recordIXICollectionCredit} from "../../ixi-aos/transact/modules/collections/IXICollectionsCommands";
import {postIXIPayablesPayment,postIXIPayablesCredit} from "../../ixi-aos/transact/modules/payables/IXIPayablesCommands";
import {issueIXIPurchaseOrder,matchIXIPurchaseOrderBill} from "../../ixi-aos/transact/modules/purchase-order/IXIPurchaseOrderCommands";
import {invalidateIXITransactDashboardCache} from "./IXITransactDashboardCache";
import {validateIXITransactActionExecution} from "./IXITransactActionExecutionContract";

const clean=value=>String(value??"").trim();

export class IXITransactActionExecutionError extends Error{
  constructor(message,{code="action-execution-failed",validation=null,cause=null}={}){
    super(message);this.name="IXITransactActionExecutionError";this.code=code;this.validation=validation;this.cause=cause;
  }
}

export async function executeIXITransactCanonicalRecordAction({action={},record={},input={},signal}={}){
  const validation=validateIXITransactActionExecution({action,record,input});
  if(!validation.ok){
    const first=validation.errors[0];
    throw new IXITransactActionExecutionError(first?.message||"Canonical action validation failed.",{code:first?.code||"action-validation-failed",validation});
  }
  const id=clean(action?.id||action).toLowerCase();
  const context=validation.context;
  let result;
  try{
    if(id==="record-ar-payment")result=await recordIXICollectionPayment({object:context.object,context:context.context,receivable:context.receivable,collection:context.collection,input,metadata:context.metadata,signal});
    else if(id==="record-ar-credit")result=await recordIXICollectionCredit({object:context.object,context:context.context,receivable:context.receivable,collection:context.collection,input,metadata:context.metadata,signal});
    else if(id==="record-ap-payment")result=await postIXIPayablesPayment({object:context.object,context:context.context,payable:context.payable,input,metadata:context.metadata,signal});
    else if(id==="record-vendor-credit")result=await postIXIPayablesCredit({object:context.object,context:context.context,payable:context.payable,input,metadata:context.metadata,signal});
    else if(id==="issue-po")result=await issueIXIPurchaseOrder({object:context.object,context:context.context,record:context.record,metadata:context.metadata,signal});
    else if(id==="match-bill")result=await matchIXIPurchaseOrderBill({object:context.object,context:context.context,record:context.record,input,metadata:context.metadata,signal});
    else throw new IXITransactActionExecutionError("Desktop action is not implemented.",{code:"unsupported-action"});
  }catch(cause){
    if(cause instanceof IXITransactActionExecutionError)throw cause;
    throw new IXITransactActionExecutionError(clean(cause?.message)||"Canonical TRAN$ACT action failed.",{code:clean(cause?.code)||"canonical-command-failed",cause});
  }
  invalidateIXITransactDashboardCache();
  return{ok:true,actionId:id,result};
}

export default{IXITransactActionExecutionError,executeIXITransactCanonicalRecordAction};
