import { createIXIAosObjectFinancialDocument, createIXIAosFinancialObjectReference } from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import { createIXIBill } from "../bill/IXIBillCommands";
import { runIXIFreightAction } from "./IXIFreightClient";
import { freightVariance, invoiceCharges } from "./IXIFreightContract";

const clean = value => String(value ?? "").trim();
const responseDocument = response => response?.data?.record?.financialDocument || response?.record?.financialDocument || response?.financialDocument || {};

export async function createAndMatchIXIFreightInvoice({ order = {}, input = {}, context = {}, object = {} } = {}) {
  const { charges, amount, totalMismatch } = invoiceCharges(input);
  if (totalMismatch) {
    const error = new Error("Actual cost total must equal the optional itemized charge breakdown.");
    error.code = "IXI_FREIGHT_INVOICE_TOTAL_MISMATCH";
    throw error;
  }
  if (!clean(input.invoiceNumber) || !/^\d{4}-\d{2}-\d{2}$/.test(clean(input.invoiceDate)) || !(amount > 0)) {
    const error = new Error("Invoice number, invoice date, and positive carrier charges are required.");
    error.code = "IXI_FREIGHT_INVOICE_VALIDATION_FAILED";
    throw error;
  }

  const orderId = clean(order?.identity?.freightOrderId);
  const carrier = clean(order?.execution?.carrierName);
  const isCredit = clean(input.documentType) === "carrier-credit";
  const hasExpected = freightVariance(order).hasExpected;
  let financialResponse;
  let financialDocumentId;

  if (isCredit) {
    const references = [
      createIXIAosFinancialObjectReference({ object:context.primary || object, role:"asset" }),
      createIXIAosFinancialObjectReference({ object:context.entity || {}, role:"entity" }),
      createIXIAosFinancialObjectReference({ object:context.actor || {}, role:"employee" })
    ].filter(Boolean);
    const sourceInvoice = [...(order?.invoices||[])].reverse().find(item=>item.documentType!=="carrier-credit");
    const sourceFinancialDocumentId = clean(input.sourceBillDocumentId || sourceInvoice?.billDocumentId);
    if (!sourceFinancialDocumentId) throw new Error("A carrier credit must identify the original Freight Bill.");
    financialResponse = await createIXIAosObjectFinancialDocument({
      object, documentType:"credit", commandId:`${orderId}:${clean(input.invoiceNumber)}`,
      idempotencyKey:`ixi-freight-credit:${orderId}:${clean(input.invoiceNumber).toLowerCase()}`,
      input:{ documentNumber:clean(input.invoiceNumber), occurredAt:`${clean(input.invoiceDate)}T12:00:00.000Z`, amount, currency:"USD", category:"freight-credit", description:`Carrier credit for Freight Order ${orderId}`, sourceFinancialDocumentId, references },
      additionalReferences:references,
      metadata:{ transactModule:"freight", freightOrderId:orderId, carrierInvoiceNumber:clean(input.invoiceNumber), capitalizable:order?.purpose?.type==="acquisition-inbound" }
    });
    financialDocumentId = clean(responseDocument(financialResponse).financialDocumentId);
  } else {
    const result = await createIXIBill({
      object, context,
      input:{
        clientRequestId:`${orderId}:${clean(input.invoiceNumber)}`, vendorPassportId:clean(order?.execution?.carrierPassportId), vendorLabel:carrier,
        invoiceNumber:clean(input.invoiceNumber), description:`Freight Order ${orderId} · ${order?.route?.origin?.label||"Origin"} to ${order?.route?.destination?.label||"Destination"}`,
        amount, invoiceDate:clean(input.invoiceDate), dueDate:clean(input.dueDate), category:`freight-${clean(order?.purpose?.type||"other")}`, currency:"USD",
        ...(hasExpected?{purchaseOrderId:orderId,purchaseOrderNumber:orderId,poCommittedAmount:Number(order?.economics?.expectedTotal||0)}:{}), receivedAmount:amount,
        receivedComplete:order.status==="delivered"||order.status==="billed", notes:clean(input.notes), attachments:[]
      },
      metadata:{
        source:"ixi-transact-freight", transactModule:"freight", freightOrderId:orderId,
        capitalizable:order?.purpose?.type==="acquisition-inbound", acquisitionPeriod:order?.purpose?.type==="acquisition-inbound",
        acquisitionCost:order?.purpose?.type==="acquisition-inbound", acquisitionCategory:order?.purpose?.type==="acquisition-inbound"?"freight":"",
        costPhase:order?.purpose?.type==="acquisition-inbound"?"acquisition":"operations"
      }
    });
    financialResponse = result.response;
    financialDocumentId = clean(result?.record?.financialBinding?.financialDocumentId);
  }

  if (!financialDocumentId) throw new Error("IXI Financial did not return a canonical Bill/Credit identity.");
  const next = await runIXIFreightAction(orderId, "invoice", {
    commandId:`freight-invoice:${financialDocumentId}`,
    invoice:{
      documentType:isCredit?"carrier-credit":"carrier-invoice", invoiceNumber:clean(input.invoiceNumber), invoiceDate:clean(input.invoiceDate), dueDate:clean(input.dueDate),
      billDocumentId:financialDocumentId, payableId:isCredit?"":financialDocumentId, charges, notes:clean(input.notes),
      document:clean(input.documentReference)?{ type:"carrier-invoice", reference:clean(input.documentReference), status:"referenced" }:null
    }
  });
  return { order:next, financialResponse, financialDocumentId };
}

export default { createAndMatchIXIFreightInvoice };
