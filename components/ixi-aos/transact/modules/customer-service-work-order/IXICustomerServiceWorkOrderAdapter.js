import { createIXIWorkOrderDraft } from "../work-order/IXIWorkOrderContract";

const clean = value => String(value ?? "").trim();
const arr = value => Array.isArray(value) ? value : [];
const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;

export const IXI_CUSTOMER_SERVICE_WORK_ORDER_SCHEMA = "ixi-customer-service-work-order-v1";

function acceptedOptions(quote = {}) {
  const acceptedIds = arr(quote.acceptance?.acceptedOptionIds);
  return arr(quote.options).filter(option => option.required || acceptedIds.includes(option.optionId));
}

export function createIXICustomerServiceWorkOrderFromQuote({ quote = {}, context = {}, actor = {} } = {}) {
  if (!quote || !["accepted", "converted"].includes(clean(quote.status))) {
    throw new Error("Customer Service Work Order requires an accepted Service Quote.");
  }

  const options = acceptedOptions(quote);
  const quotedLines = options.flatMap(option =>
    arr(option.lines).map(line => ({
      ...line,
      optionId: option.optionId,
      optionLabel: option.label,
      required: option.required
    }))
  );

  const sourceContext = {
    ...context,
    primary: {
      ...(context.primary || {}),
      passportId: clean(quote.asset?.passportId || context.primary?.passportId),
      objectId: clean(quote.asset?.objectId || context.primary?.objectId),
      objectType: clean(quote.asset?.objectType || context.primary?.objectType || "machine"),
      label: clean(quote.asset?.label || context.primary?.label)
    },
    actor: Object.keys(actor || {}).length ? actor : context.actor
  };

  const draft = createIXIWorkOrderDraft({
    context: sourceContext,
    input: {
      title: clean(quote.request?.problem).slice(0, 80) || "Customer service work",
      description: clean(quote.request?.customerScope),
      type: "repair",
      priority: "normal",
      machineCondition: "operable",
      assignedTo: []
    }
  });

  const stamp = Date.now();
  draft.schema = IXI_CUSTOMER_SERVICE_WORK_ORDER_SCHEMA;
  draft.identity.workOrderId = `CSWO-${stamp}`;
  draft.identity.number = `CSWO-${String(stamp).slice(-6)}`;
  draft.work.status = "open";
  draft.work.serviceDirection = "external-customer";
  draft.work.customerService = true;
  draft.customer = {
    ...(quote.customer || {})
  };
  draft.commercial = {
    serviceQuoteId: clean(quote.identity?.serviceQuoteId),
    serviceQuoteNumber: clean(quote.identity?.number),
    acceptedRevision: num(quote.acceptance?.acceptedRevision || quote.identity?.revision),
    pricingType: clean(quote.commercial?.pricingType || "estimate"),
    originalAuthorizedRevenue: num(quote.economics?.authorizedRevenue),
    approvedChangeOrderRevenue: num(quote.economics?.changeOrderAuthorized),
    totalAuthorizedRevenue: num(quote.economics?.authorizedRevenue),
    customerPoNumber: clean(quote.acceptance?.customerPoNumber || quote.customer?.poNumber),
    acceptedAt: clean(quote.acceptance?.acceptedAt),
    acceptedBy: clean(quote.acceptance?.acceptedBy),
    acceptanceMethod: clean(quote.acceptance?.method),
    acceptedOptionIds: arr(quote.acceptance?.acceptedOptionIds),
    acceptedOptions: options,
    quotedLines,
    assumptions: clean(quote.request?.assumptions),
    exclusions: clean(quote.request?.exclusions),
    quoteSnapshot: {
      number: clean(quote.identity?.number),
      revision: num(quote.identity?.revision),
      customerScope: clean(quote.request?.customerScope),
      pricingType: clean(quote.commercial?.pricingType),
      quotedRevenue: num(quote.economics?.quotedRevenue),
      estimatedInternalCost: num(quote.economics?.estimatedInternalCost),
      authorizedRevenue: num(quote.economics?.authorizedRevenue),
      options
    }
  };
  draft.references = {
    ...(draft.references || {}),
    serviceQuoteIds: [clean(quote.identity?.serviceQuoteId || quote.identity?.number)].filter(Boolean),
    changeOrderIds: arr(quote.changeOrders).filter(item => item.status === "accepted").map(item => item.changeOrderId)
  };
  draft.financial = {
    ...(draft.financial || {}),
    estimated: num(quote.economics?.estimatedInternalCost),
    authorizedRevenue: num(quote.economics?.authorizedRevenue),
    quotedRevenue: num(quote.economics?.quotedRevenue),
    invoiceableRevenue: 0,
    invoicedRevenue: 0,
    receivedRevenue: 0,
    status: "open"
  };
  draft.activityProjection = [{
    activityId: `ACT-CSWO-CREATE-${stamp}`,
    type: "customer-service-work-order-created",
    serviceQuoteId: clean(quote.identity?.serviceQuoteId),
    serviceQuoteNumber: clean(quote.identity?.number),
    quoteRevision: num(quote.identity?.revision),
    authorizedRevenue: num(quote.economics?.authorizedRevenue),
    occurredAt: new Date().toISOString(),
    actorLabel: clean(sourceContext.actor?.displayName || sourceContext.actor?.name || sourceContext.actor?.label)
  }];

  return draft;
}

export function applyIXIServiceQuoteAuthorizationToWorkOrder(workOrder = {}, quote = {}) {
  const acceptedChanges = arr(quote.changeOrders).filter(item => item.status === "accepted");
  const authorizedRevenue = num(quote.economics?.authorizedRevenue);
  return {
    ...workOrder,
    commercial: {
      ...(workOrder.commercial || {}),
      approvedChangeOrderRevenue: num(quote.economics?.changeOrderAuthorized),
      totalAuthorizedRevenue: authorizedRevenue,
      acceptedChangeOrders: acceptedChanges
    },
    references: {
      ...(workOrder.references || {}),
      changeOrderIds: acceptedChanges.map(item => item.changeOrderId)
    },
    financial: {
      ...(workOrder.financial || {}),
      authorizedRevenue
    }
  };
}

export default {
  createIXICustomerServiceWorkOrderFromQuote,
  applyIXIServiceQuoteAuthorizationToWorkOrder
};
