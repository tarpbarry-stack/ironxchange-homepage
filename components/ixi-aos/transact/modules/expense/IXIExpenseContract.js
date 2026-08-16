const clean=value=>String(value??"").trim();
const obj=value=>value&&typeof value==="object"&&!Array.isArray(value)?value:{};
const arr=value=>Array.isArray(value)?value:[];
const money=value=>{const n=Number(value);return Number.isFinite(n)?Math.round(n*100)/100:0};

export const IXI_EXPENSE_SCHEMA="ixi-expense-v2";
export const IXI_EXPENSE_PAYMENT_METHODS=Object.freeze(["company-card","company-cash","my-money","other"]);

function normalizePaymentMethod(value=""){
 const v=clean(value).toLowerCase();
 if(v==="personal-card"||v==="personal"||v==="employee-paid")return "my-money";
 if(v==="cash")return "company-cash";
 return IXI_EXPENSE_PAYMENT_METHODS.includes(v)?v:"";
}

export function createIXIExpenseDraft({context={},workOrder={},input={}}={}){
 const now=new Date().toISOString();
 const primary=obj(context.primary),actor=obj(context.actor),location=obj(context.location),entity=obj(context.entity),wo=obj(workOrder.identity);
 const paymentMethod=normalizePaymentMethod(input.paymentMethod||input.paidWith);
 const amount=money(input.amount);
 const employeePaid=paymentMethod==="my-money";
 const clientRequestId=clean(input.clientRequestId);
 return {
  schema:IXI_EXPENSE_SCHEMA,
  identity:{expenseId:"",number:"",clientRequestId},
  context:{
   entityPassportId:clean(entity.passportId),
   primaryPassportId:clean(primary.passportId),
   primaryObjectId:clean(primary.objectId||primary.id),
   primaryObjectType:clean(primary.objectType),
   primaryLabel:clean(primary.label),
   locationPassportId:clean(location.passportId||context.locationPassportId),
   locationLabel:clean(location.label||context.locationLabel),
   workOrderId:clean(wo.workOrderId),
   workOrderNumber:clean(wo.number||workOrder.workOrderNumber||workOrder.number),
   employeePassportId:clean(actor.passportId),
   employeeId:clean(actor.employeeId||actor.id),
   employeeLabel:clean(actor.displayName||actor.name||actor.label)
  },
  expense:{
   vendor:clean(input.vendor),
   description:clean(input.description),
   amount,
   currency:clean(input.currency||"USD").toUpperCase(),
   category:clean(input.category),
   expenseDate:clean(input.expenseDate),
   paymentMethod,
   referenceNumber:clean(input.referenceNumber),
   notes:clean(input.notes),
   receiptRequired:Boolean(input.receiptRequired)
  },
  reimbursement:{
   required:employeePaid,
   employeePassportId:employeePaid?clean(actor.passportId):"",
   employeeId:employeePaid?clean(actor.employeeId||actor.id):"",
   employeeLabel:employeePaid?clean(actor.displayName||actor.name||actor.label):"",
   amount:employeePaid?amount:0,
   currency:clean(input.currency||"USD").toUpperCase(),
   status:employeePaid?"owed":"not-applicable"
  },
  attachments:arr(input.attachments),
  status:"draft",
  createdAt:now,
  createdBy:clean(actor.passportId||actor.userId||actor.employeeId||actor.id),
  revision:1
 };
}

export function validateIXIExpense(expense={}){
 const e=obj(expense.expense),errors={};
 if(!clean(expense.context?.primaryPassportId))errors.primary="Originating AOS Passport is required";
 if(!clean(e.vendor))errors.vendor="Vendor is required";
 if(!clean(e.description))errors.description="Description is required";
 if(!(Number(e.amount)>0))errors.amount="Amount must be greater than zero";
 if(!clean(e.category))errors.category="Category is required";
 if(!clean(e.expenseDate))errors.expenseDate="Expense date is required";
 if(!IXI_EXPENSE_PAYMENT_METHODS.includes(clean(e.paymentMethod)))errors.paymentMethod="Paid With is required";
 if(e.receiptRequired&&!arr(expense.attachments).length)errors.receipt="Receipt is required by company policy";
 return {valid:Object.keys(errors).length===0,errors};
}

export default {createIXIExpenseDraft,validateIXIExpense};
