import {createIXIAosExpense,createIXIAosFinancialObjectReference} from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import {createIXIExpenseDraft,validateIXIExpense} from "./IXIExpenseContract";

const clean=value=>String(value??"").trim();

export async function createIXIExpense({object={},context={},workOrder={},input={},commandId="",idempotencyKey="",metadata={},apiBaseUrl="",headers={},signal}={}){
 const draft=createIXIExpenseDraft({context,workOrder,input});
 const validation=validateIXIExpense(draft);
 if(!validation.valid){const error=new Error("Expense is incomplete");error.validation=validation;throw error;}

 const stableId=clean(commandId||idempotencyKey||draft.identity.clientRequestId);
 const additionalReferences=[];
 const locationRef=createIXIAosFinancialObjectReference({object:context.location||{},role:"location"});
 if(locationRef)additionalReferences.push(locationRef);
 const employeeRef=createIXIAosFinancialObjectReference({object:context.actor||{},role:"employee"});
 if(employeeRef)additionalReferences.push(employeeRef);
 const workOrderRef=createIXIAosFinancialObjectReference({object:{passportId:workOrder?.context?.primaryPassportId||"",objectId:draft.context.workOrderId,label:draft.context.workOrderNumber,objectType:"work-order"},role:"work-order"});
 if(workOrderRef)additionalReferences.push(workOrderRef);

 const response=await createIXIAosExpense({
  object,
  input:{
   currency:draft.expense.currency,
   amount:draft.expense.amount,
   description:draft.expense.description,
   status:"posted",
   vendor:draft.expense.vendor,
   category:draft.expense.category,
   expenseDate:draft.expense.expenseDate,
   paymentMethod:draft.expense.paymentMethod,
   referenceNumber:draft.expense.referenceNumber,
   notes:draft.expense.notes,
   attachments:draft.attachments,
   references:additionalReferences,
   relationships:{
    workOrderId:draft.context.workOrderId,
    workOrderNumber:draft.context.workOrderNumber,
    reimbursementRequired:draft.reimbursement.required,
    reimbursementEmployeePassportId:draft.reimbursement.employeePassportId,
    reimbursementEmployeeId:draft.reimbursement.employeeId
   }
  },
  additionalReferences,
  commandId:stableId,
  idempotencyKey:stableId,
  metadata:{
   ...metadata,
   transactModule:"expense",
   expenseSchema:draft.schema,
   originatingPassportId:draft.context.primaryPassportId,
   originatingObjectType:draft.context.primaryObjectType,
   workOrderId:draft.context.workOrderId,
   workOrderNumber:draft.context.workOrderNumber,
   reimbursement:draft.reimbursement
  },
  apiBaseUrl,headers,signal
 });

 return {draft:{...draft,status:"posted"},response};
}

export default {createIXIExpense};
