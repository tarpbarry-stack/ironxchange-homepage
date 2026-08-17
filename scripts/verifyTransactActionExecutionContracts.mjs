import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {pathToFileURL} from "node:url";

async function importSource(relativePath){
  const absolute=path.resolve(process.cwd(),relativePath);
  const source=await fs.readFile(absolute,"utf8");
  const encoded=Buffer.from(`${source}\n//# sourceURL=${pathToFileURL(absolute).href}`).toString("base64");
  return import(`data:text/javascript;base64,${encoded}`);
}

const contract=await importSource("components/ixi-transact-dashboard/data/IXITransactActionExecutionContract.js");

const baseRecord={
  _ixiExecution:{
    object:{passportId:"passport:machine:336",objectId:"machine-336"},
    context:{entity:{passportId:"passport:entity:ixi"},actor:{passportId:"passport:employee:1"}},
    receivable:{invoiceId:"INV-100",balance:10000,currency:"USD"},
    payable:{billId:"BILL-100",balance:8000,currency:"USD"},
    purchaseOrder:{identity:{purchaseOrderRecordId:"POREC-1"},order:{lines:[{lineId:"1",description:"Part",orderedQuantity:1,unitPrice:500,extendedAmount:500}]},costs:{estimated:500}}
  }
};

assert.equal(contract.getIXITransactActionInputContract("record-ar-payment").contract,"ixi-ar-payment-input-v1");
assert.equal(contract.getIXITransactActionInputContract("server-injected-javascript"),null,"Unknown actions must never receive an execution contract.");

const arPayment=contract.validateIXITransactActionExecution({action:{id:"record-ar-payment",enabled:true},record:baseRecord,input:{amount:2500,method:"wire"}});
assert.equal(arPayment.ok,true,"Authorized A/R payment with canonical Invoice context must validate.");
assert.equal(arPayment.context.receivable.invoiceId,"INV-100");

const arOverpay=contract.validateIXITransactActionExecution({action:{id:"record-ar-payment",enabled:true},record:baseRecord,input:{amount:12500}});
assert.equal(arOverpay.ok,false,"Desktop preflight must reject A/R overpayment before canonical command dispatch.");
assert.ok(arOverpay.errors.some(error=>error.code==="amount-exceeds-open-balance"));

const apCreditMissingReason=contract.validateIXITransactActionExecution({action:{id:"record-vendor-credit",enabled:true},record:baseRecord,input:{amount:1000}});
assert.equal(apCreditMissingReason.ok,false,"Vendor credit requires an explicit reason.");
assert.ok(apCreditMissingReason.errors.some(error=>error.code==="credit-reason-required"));

const issuePo=contract.validateIXITransactActionExecution({action:{id:"issue-po",enabled:true},record:baseRecord,input:{}});
assert.equal(issuePo.ok,true,"PO issue is executable only with canonical PO identity and lines.");

const matchBill=contract.validateIXITransactActionExecution({action:{id:"match-bill",enabled:true},record:baseRecord,input:{invoiceNumber:"V-7788",invoiceDate:"2026-08-16",amount:500}});
assert.equal(matchBill.ok,true,"PO Bill match requires canonical PO context plus invoice number/date/amount.");

const missingExecution=contract.validateIXITransactActionExecution({action:{id:"record-ap-payment",enabled:true},record:{},input:{amount:100}});
assert.equal(missingExecution.ok,false,"Projection rows without canonical resolver execution context must never mutate financial truth.");
assert.ok(missingExecution.errors.some(error=>error.code==="object-context-required"));
assert.ok(missingExecution.errors.some(error=>error.code==="entity-context-required"));
assert.ok(missingExecution.errors.some(error=>error.code==="bill-context-required"));

const disabled=contract.validateIXITransactActionExecution({action:{id:"record-ar-payment",enabled:false,reason:"Closed period"},record:baseRecord,input:{amount:100}});
assert.equal(disabled.ok,false,"Server-disabled action must remain blocked even when input is otherwise valid.");
assert.ok(disabled.errors.some(error=>error.code==="action-disabled"));

console.log("IXI TRAN$ACT canonical action execution verification passed.");
