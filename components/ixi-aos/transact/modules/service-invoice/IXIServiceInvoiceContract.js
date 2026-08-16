const clean = value => String(value ?? "").trim();
const arr = value => Array.isArray(value) ? value : [];
const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const money = value => Math.round(num(value) * 100) / 100;

export const IXI_SERVICE_INVOICE_SCHEMA = "ixi-service-invoice-v1";
export const IXI_SERVICE_INVOICE_STATUSES = Object.freeze(["draft", "issued", "void", "credited"]);
export const IXI_SERVICE_AR_STATUSES = Object.freeze(["open", "partial", "paid", "overdue"]);

function workOrderIdentity(workOrder = {}) {
  return clean(
    workOrder.identity?.workOrderId ||
    workOrder.identity?.number ||
    workOrder.workOrderId ||
    workOrder.number
  );
}

function acceptedAuthorizedRevenue(workOrder = {}) {
  return money(
    workOrder.commercial?.totalAuthorizedRevenue ??
    workOrder.financial?.authorizedRevenue ??
    workOrder.commercial?.originalAuthorizedRevenue
  );
}

function getActuals(workOrder = {}) {
  const f = workOrder.financial || {};
  return {
    labor: money(f.laborActual),
    material: money(f.materialActual),
    service: money(f.serviceActual),
    other: money(f.otherActual),
    total: money(num(f.laborActual) + num(f.materialActual) + num(f.serviceActual) + num(f.otherActual))
  };
}

function deriveBillable({ workOrder = {}, input = {} } = {}) {
  const pricingType = clean(workOrder.commercial?.pricingType || "estimate");
  const authorized = acceptedAuthorizedRevenue(workOrder);
  const actuals = getActuals(workOrder);
  const manualSubtotal = money(input.subtotal);
  const actualBillable = manualSubtotal > 0 ? manualSubtotal : actuals.total;

  if (pricingType === "fixed-price") {
    return {
      pricingType,
      authorized,
      actualBillable,
      suggestedSubtotal: authorized,
      authorizationException: false,
      authorizationExceptionAmount: 0
    };
  }

  if (pricingType === "not-to-exceed") {
    const suggested = Math.min(actualBillable, authorized);
    return {
      pricingType,
      authorized,
      actualBillable,
      suggestedSubtotal: money(suggested),
      authorizationException: actualBillable > authorized + 0.005,
      authorizationExceptionAmount: money(Math.max(0, actualBillable - authorized))
    };
  }

  return {
    pricingType: "estimate",
    authorized,
    actualBillable,
    suggestedSubtotal: actualBillable,
    authorizationException: actualBillable > authorized + 0.005,
    authorizationExceptionAmount: money(Math.max(0, actualBillable - authorized))
  };
}

export function createIXIServiceInvoiceDraft({ context = {}, workOrder = {}, input = {} } = {}) {
  const now = new Date().toISOString();
  const actuals = getActuals(workOrder);
  const billing = deriveBillable({ workOrder, input });
  const subtotal = money(input.subtotal > 0 ? input.subtotal : billing.suggestedSubtotal);
  const tax = money(input.taxAmount);
  const depositCredit = money(input.depositCredit);
  const otherCredit = money(input.otherCredit);
  const totalCredits = money(depositCredit + otherCredit);
  const amountDue = money(Math.max(0, subtotal + tax - totalCredits));
  const primary = context.primary || {};
  const customer = workOrder.customer || {};

  return {
    schema: IXI_SERVICE_INVOICE_SCHEMA,
    identity: {
      serviceInvoiceId: clean(input.serviceInvoiceId),
      number: clean(input.number),
      clientRequestId: clean(input.clientRequestId) || `SINV-${Date.now()}`
    },
    context: {
      primaryPassportId: clean(primary.passportId || workOrder.context?.primaryPassportId),
      primaryObjectId: clean(primary.objectId || workOrder.context?.primaryObjectId),
      primaryObjectType: clean(primary.objectType || workOrder.context?.primaryObjectType),
      primaryLabel: clean(primary.label || workOrder.context?.primaryLabel),
      entityPassportId: clean(context.entity?.passportId || workOrder.context?.entityPassportId),
      locationPassportId: clean(context.location?.passportId || workOrder.context?.locationPassportId),
      locationLabel: clean(context.location?.label || workOrder.context?.locationLabel),
      actorPassportId: clean(context.actor?.passportId),
      actorId: clean(context.actor?.employeeId || context.actor?.userId || context.actor?.id),
      actorLabel: clean(context.actor?.displayName || context.actor?.name || context.actor?.label)
    },
    customer: {
      passportId: clean(customer.passportId),
      customerId: clean(customer.customerId),
      name: clean(customer.name),
      contactName: clean(customer.contactName),
      email: clean(customer.email),
      phone: clean(customer.phone),
      poNumber: clean(workOrder.commercial?.customerPoNumber || customer.poNumber)
    },
    asset: {
      passportId: clean(workOrder.context?.primaryPassportId || primary.passportId),
      objectId: clean(workOrder.context?.primaryObjectId || primary.objectId),
      objectType: clean(workOrder.context?.primaryObjectType || primary.objectType),
      label: clean(workOrder.context?.primaryLabel || primary.label)
    },
    source: {
      customerServiceWorkOrderId: workOrderIdentity(workOrder),
      serviceQuoteId: clean(workOrder.commercial?.serviceQuoteId),
      serviceQuoteNumber: clean(workOrder.commercial?.serviceQuoteNumber),
      acceptedRevision: num(workOrder.commercial?.acceptedRevision),
      pricingType: clean(workOrder.commercial?.pricingType || "estimate"),
      customerPoNumber: clean(workOrder.commercial?.customerPoNumber),
      approvedChangeOrders: arr(workOrder.commercial?.acceptedChangeOrders),
      acceptedOptionIds: arr(workOrder.commercial?.acceptedOptionIds)
    },
    comparison: {
      quotedRevenue: money(workOrder.commercial?.quoteSnapshot?.quotedRevenue || workOrder.financial?.quotedRevenue),
      authorizedRevenue: billing.authorized,
      actualInternalCost: actuals.total,
      previouslyInvoiced: money(workOrder.financial?.invoicedRevenue),
      receivedRevenue: money(workOrder.financial?.receivedRevenue)
    },
    charges: {
      labor: money(input.laborAmount ?? actuals.labor),
      material: money(input.materialAmount ?? actuals.material),
      outsideService: money(input.serviceAmount ?? actuals.service),
      travelFreight: money(input.travelFreightAmount),
      other: money(input.otherAmount ?? actuals.other),
      subtotal,
      tax,
      depositCredit,
      otherCredit,
      totalCredits,
      amountDue
    },
    billingRule: billing,
    terms: {
      invoiceDate: clean(input.invoiceDate),
      dueDate: clean(input.dueDate),
      paymentTerms: clean(input.paymentTerms || "NET 30"),
      memo: clean(input.memo)
    },
    documents: arr(input.documents),
    status: "draft",
    ar: {
      status: "open",
      amountDue,
      amountReceived: 0,
      balanceDue: amountDue,
      payments: []
    },
    timeline: [{
      activityId: `ACT-SINV-DRAFT-${Date.now()}`,
      type: "service-invoice-drafted",
      label: "Service invoice drafted",
      occurredAt: now,
      actorLabel: clean(context.actor?.displayName || context.actor?.name || context.actor?.label)
    }],
    audit: {
      createdAt: now,
      createdBy: clean(context.actor?.employeeId || context.actor?.userId || context.actor?.passportId),
      createdByLabel: clean(context.actor?.displayName || context.actor?.name || context.actor?.label),
      updatedAt: now,
      version: 1
    }
  };
}

export function validateIXIServiceInvoice(record = {}) {
  const errors = {};
  if (!clean(record.customer?.name)) errors.customer = "required";
  if (!clean(record.source?.customerServiceWorkOrderId)) errors.workOrder = "required";
  if (!clean(record.terms?.invoiceDate)) errors.invoiceDate = "required";
  if (!(num(record.charges?.amountDue) >= 0)) errors.amountDue = "invalid";
  if (record.source?.pricingType === "not-to-exceed" && record.billingRule?.authorizationException) {
    errors.authorization = "n-t-e-exceeded";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export default {
  createIXIServiceInvoiceDraft,
  validateIXIServiceInvoice
};
