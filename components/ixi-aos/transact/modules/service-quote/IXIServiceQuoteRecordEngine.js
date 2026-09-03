const clean = value => String(value ?? "").trim();
const arr = value => Array.isArray(value) ? value : [];
const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const money = value => Math.round((num(value) + Number.EPSILON) * 100) / 100;
const now = () => new Date().toISOString();
const copy = value => JSON.parse(JSON.stringify(value));
const actor = value => ({ actorId: clean(value?.passportId || value?.employeeId || value?.userId || value?.id), actorLabel: clean(value?.displayName || value?.name || value?.label) });
const event = (type, value = {}, extra = {}) => ({ eventId: `SQ-${type.toUpperCase()}-${Date.now()}`, type, occurredAt: now(), ...actor(value), ...extra });
const assertStatus = (record, allowed, action) => { if (!allowed.includes(clean(record?.status))) throw new Error(`${action} is not allowed from ${clean(record?.status) || "unknown"} status.`); };
const updated = (record, item, patch = {}) => ({ ...record, ...patch, activity: [...arr(record.activity), item], audit: { ...(record.audit || {}), updatedAt: item.occurredAt } });

export function sendIXIServiceQuote(record = {}, input = {}, value = {}) {
  assertStatus(record, ["draft", "changes-requested", "sent", "viewed"], "Send");
  const recipient = clean(input.recipient);
  if (!recipient) throw new Error("A delivery recipient is required.");
  const item = event("quote-sent", value, { revision: record.identity?.revision, channel: clean(input.channel || "email"), recipient });
  return updated(record, item, { status: "sent", delivery: { ...(record.delivery || {}), sentAt: record.delivery?.sentAt || item.occurredAt, lastSentAt: item.occurredAt, viewedAt: "", channel: item.channel, recipient } });
}
export function markIXIServiceQuoteViewed(record = {}, value = {}) { assertStatus(record, ["sent"], "Mark viewed"); const item = event("quote-viewed", value, { revision: record.identity?.revision }); return updated(record, item, { status: "viewed", delivery: { ...(record.delivery || {}), viewedAt: item.occurredAt } }); }
export function requestIXIServiceQuoteChanges(record = {}, input = {}, value = {}) { assertStatus(record, ["sent", "viewed"], "Request changes"); if (!clean(input.message)) throw new Error("Change request detail is required."); const item = event("changes-requested", value, { message: clean(input.message), revision: record.identity?.revision }); return updated(record, item, { status: "changes-requested" }); }
export function declineIXIServiceQuote(record = {}, input = {}, value = {}) { assertStatus(record, ["sent", "viewed", "changes-requested"], "Decline"); if (!clean(input.reason)) throw new Error("Decline reason is required."); const item = event("quote-declined", value, { reason: clean(input.reason), revision: record.identity?.revision }); return updated(record, item, { status: "declined", acceptance: { ...(record.acceptance || {}), status: "declined" } }); }

export function acceptIXIServiceQuote(record = {}, input = {}, value = {}) {
  assertStatus(record, ["sent", "viewed"], "Accept");
  const acceptedBy = clean(input.acceptedBy), method = clean(input.method);
  if (!acceptedBy || !method) throw new Error("Accepted by and acceptance method are required.");
  if (clean(record.commercial?.validThrough) && clean(record.commercial.validThrough) < now().slice(0, 10)) throw new Error("Expired quote must be revised before acceptance.");
  const optionalIds = new Set(arr(input.acceptedOptionIds).map(clean));
  const acceptedOptions = arr(record.options).filter(option => option.required || optionalIds.has(clean(option.optionId)));
  const serviceValue = money(acceptedOptions.reduce((sum, option) => sum + num(option.customerTotal), 0));
  if (!(serviceValue > 0)) throw new Error("Accepted scope must have positive service value.");
  const tax = money(record.commercial?.taxAmount), customerTotal = money(serviceValue + tax), acceptedAt = now();
  const acceptedOptionIds = acceptedOptions.map(option => option.optionId);
  const snapshot = copy({ revision: record.identity?.revision, acceptedAt, acceptedOptionIds, customerScope: record.request?.customerScope, assumptions: record.request?.assumptions, exclusions: record.request?.exclusions, pricingType: record.commercial?.pricingType, paymentTerms: record.commercial?.paymentTerms, depositType: record.commercial?.depositType, depositValue: record.commercial?.depositValue, requestedDeposit: record.commercial?.requestedDeposit, serviceValue, tax, customerTotal, options: acceptedOptions });
  const item = event("quote-accepted", value, { revision: record.identity?.revision, acceptedOptionIds, authorizedServiceRevenue: serviceValue, authorizedTax: tax, authorizedCustomerTotal: customerTotal, acceptedBy, method, customerPoNumber: clean(input.customerPoNumber), acceptedAt });
  return updated(record, item, { status: "accepted", economics: { ...(record.economics || {}), authorizedServiceRevenue: serviceValue, authorizedTax: tax, authorizedCustomerTotal: customerTotal, economicEvent: true }, acceptance: { status: "accepted", acceptedRevision: record.identity?.revision, acceptedOptionIds, acceptedBy, acceptedAt, method, signatureDocumentId: clean(input.signatureDocumentId), customerPoNumber: clean(input.customerPoNumber), snapshot } });
}

export function reviseIXIServiceQuote(record = {}, nextDraft = {}, input = {}, value = {}) {
  assertStatus(record, ["draft", "sent", "viewed", "changes-requested", "declined", "expired"], "Revise");
  const snapshot = copy({ revision: record.identity?.revision, status: record.status, economics: record.economics, options: record.options, request: record.request, commercial: record.commercial, delivery: record.delivery, archivedAt: now() });
  const revision = Math.max(1, num(record.identity?.revision)) + 1;
  const item = event("quote-revised", value, { previousRevision: record.identity?.revision, nextRevision: revision, reason: clean(input.reason) });
  return { ...nextDraft, identity: { ...(nextDraft.identity || {}), serviceQuoteId: record.identity?.serviceQuoteId, financialDocumentId: record.identity?.financialDocumentId, number: record.identity?.number, revision, clientRequestId: record.identity?.clientRequestId }, financialBinding: record.financialBinding, revisions: [...arr(record.revisions), snapshot], status: "draft", activity: [...arr(record.activity), item], audit: { ...(record.audit || {}), updatedAt: item.occurredAt } };
}

export function addIXIServiceChangeOrder(record = {}, input = {}, value = {}) {
  assertStatus(record, ["accepted", "converted"], "Create change order");
  const description = clean(input.description), amount = money(input.amount);
  if (!description || !amount) throw new Error("Change Order requires description and non-zero price delta.");
  const changeOrderId = clean(input.changeOrderId) || `CO-${arr(record.changeOrders).length + 1}`;
  if (arr(record.changeOrders).some(item => item.changeOrderId === changeOrderId)) throw new Error("Change Order identity already exists.");
  const item = event("change-order-created", value, { changeOrderId, description, amount, status: "pending" });
  return updated(record, item, { changeOrders: [...arr(record.changeOrders), item] });
}
export function approveIXIServiceChangeOrder(record = {}, id = "", input = {}, value = {}) {
  assertStatus(record, ["accepted", "converted"], "Approve change order");
  const match = arr(record.changeOrders).find(item => item.changeOrderId === id);
  if (!match || match.status !== "pending") throw new Error("Pending Change Order was not found.");
  const acceptedBy = clean(input.acceptedBy), method = clean(input.method);
  if (!acceptedBy || !method) throw new Error("Change Order approval evidence is required.");
  const occurredAt = now(), delta = money(match.amount);
  const changes = arr(record.changeOrders).map(item => item.changeOrderId === id ? { ...item, status: "accepted", acceptedAt: occurredAt, acceptedBy, method } : item);
  const item = { eventId: `SQ-CO-ACCEPT-${Date.now()}`, type: "change-order-accepted", occurredAt, ...actor(value), changeOrderId: id, amount: delta, acceptedBy, method };
  return updated(record, item, { changeOrders: changes, economics: { ...(record.economics || {}), changeOrderAuthorized: money(num(record.economics?.changeOrderAuthorized) + delta), authorizedServiceRevenue: money(num(record.economics?.authorizedServiceRevenue) + delta), authorizedCustomerTotal: money(num(record.economics?.authorizedCustomerTotal) + delta) } });
}
export function convertIXIServiceQuoteToWorkOrder(record = {}, workOrderId = "", value = {}) { assertStatus(record, ["accepted"], "Convert"); const id = clean(workOrderId); if (!id) throw new Error("Canonical Work Order identity is required."); const item = event("service-work-order-created", value, { workOrderId: id }); return updated(record, item, { status: "converted", related: { ...(record.related || {}), customerServiceWorkOrderId: id } }); }

export default { sendIXIServiceQuote, markIXIServiceQuoteViewed, requestIXIServiceQuoteChanges, declineIXIServiceQuote, acceptIXIServiceQuote, reviseIXIServiceQuote, addIXIServiceChangeOrder, approveIXIServiceChangeOrder, convertIXIServiceQuoteToWorkOrder };
