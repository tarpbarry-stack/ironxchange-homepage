import { createIXIAosObjectFinancialDocument, createIXIAosFinancialObjectReference } from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import { createIXIBill } from "../bill/IXIBillCommands";
import { loadIXIFreightOrder } from "./IXIFreightClient";
import { patchIXIAosFinancialDocument } from "../../../financial-runtime/IXIAosFinancialReadClient";
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
  const carrier = clean(input.carrierName || order?.execution?.carrierName);
  const isCredit = clean(input.documentType) === "carrier-credit";
  if (!carrier) throw new Error("Enter the carrier name on this Bill. The Freight request can stay unassigned.");
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
    if (input.creditRecord) {
      const stored = input.creditRecord, doc = stored.financialDocument;
      financialResponse = await patchIXIAosFinancialDocument({ financialDocumentId: doc.financialDocumentId, expectedRevision: stored.server.revision,
        commandId: input.commandId, idempotencyKey: `ixi-freight-credit-edit:${input.commandId}`,
        patch: { documentNumber: clean(input.invoiceNumber), occurredAt: `${clean(input.invoiceDate)}T12:00:00.000Z`, description: clean(input.notes) || doc.description,
          lines: doc.lines.map((line, index) => index === 0 ? { ...line, quantity: 1, rate: amount, amount } : line), totals: { subtotal: amount, total: amount } },
        metadata: { action: "freight-credit-correction", freightOrderId: orderId } });
    } else financialResponse = await createIXIAosObjectFinancialDocument({
      object, documentType:"credit", commandId:`${orderId}:${clean(input.invoiceNumber)}`,
      idempotencyKey:`ixi-freight-credit:${orderId}:${clean(input.invoiceNumber).toLowerCase()}`,
      input:{ documentNumber:clean(input.invoiceNumber), occurredAt:`${clean(input.invoiceDate)}T12:00:00.000Z`, amount, reasonCode:"vendor-credit", currency:"USD", category:"freight-credit", description:`Carrier credit for Freight Order ${orderId}`, sourceFinancialDocumentId, references },
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
        receivedAmount:amount,
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
  // The Bill's canonical metadata is the durable link. A second Freight write
  // is unnecessary and could leave a saved Bill reported as a failed request.
  let next;
  try { next = await loadIXIFreightOrder(orderId); }
  catch (error) { error.message = "The Bill/credit was saved, but its refreshed view could not load. Refresh this request before saving another document."; error.financialDocumentId = financialDocumentId; throw error; }

  return { order:next, financialResponse, financialDocumentId };
}

export default { createAndMatchIXIFreightInvoice };
