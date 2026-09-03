import {
  IXI_PO_ACTIONS,
  evaluateIXIPurchaseOrderRuntime
} from "./IXIPurchaseOrderPolicyEngine";

const clean = value => String(value ?? "").trim();
const numeric = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const money = value => Math.round(numeric(value) * 100) / 100;
const nowIso = () => new Date().toISOString();

export const IXI_PURCHASE_ORDER_SCHEMA = "ixi-purchase-order-record-v1";
export const IXI_PURCHASE_ORDER_STATUSES = Object.freeze([
  "draft",
  "pending-approval",
  "approved",
  "returned",
  "denied",
  "po-issued",
  "sent",
  "partially-received",
  "received",
  "bill-match",
  "closed",
  "cancelled"
]);

function id(prefix) {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeLine(line = {}, index = 0) {
  const ordered = Math.max(0, numeric(line.quantity ?? line.orderedQuantity));
  const received = Math.max(0, numeric(line.receivedQuantity));
  const unitPrice = money(line.unitPrice ?? line.estimatedUnitCost ?? line.committedUnitCost);

  return {
    lineId: clean(line.lineId) || `LINE-${index + 1}`,
    description: clean(line.description),
    orderedQuantity: ordered,
    receivedQuantity: received,
    remainingQuantity: Math.max(0, ordered - received),
    damagedQuantity: Math.max(0, numeric(line.damagedQuantity)),
    backorderedQuantity: Math.max(0, numeric(line.backorderedQuantity)),
    unit: clean(line.unit || "EA").toUpperCase(),
    unitPrice,
    extendedAmount: money(ordered * unitPrice),
    substituted: Boolean(line.substituted),
    substitutionDescription: clean(line.substitutionDescription)
  };
}

function recalcReceiving(lines = []) {
  const normalized = lines.map(normalizeLine);
  const ordered = normalized.reduce((sum, line) => sum + line.orderedQuantity, 0);
  const received = normalized.reduce((sum, line) => sum + Math.min(line.receivedQuantity, line.orderedQuantity), 0);
  const remaining = normalized.reduce((sum, line) => sum + line.remainingQuantity, 0);

  return {
    lines: normalized,
    orderedQuantity: ordered,
    receivedQuantity: received,
    remainingQuantity: remaining,
    percentReceived: ordered > 0 ? Math.min(100, Math.round((received / ordered) * 100)) : 0,
    complete: ordered > 0 && remaining === 0
  };
}

function recalcCosts(record = {}) {
  const estimated = money(record?.costs?.estimated);
  const committed = money(record?.costs?.committed);
  const billed = money(record?.costs?.billed);
  const paid = money(record?.costs?.paid);
  const hasBill = Array.isArray(record?.bills) && record.bills.length > 0;

  return {
    estimated,
    committed,
    billed,
    paid,
    variance: hasBill ? money(billed - committed) : 0,
    varianceApproved: Boolean(record?.costs?.varianceApproved),
    varianceApprovedAt: clean(record?.costs?.varianceApprovedAt),
    varianceApprovedBy: clean(record?.costs?.varianceApprovedBy)
  };
}

function event(type, label, actor = {}, data = {}, note = "") {
  return {
    activityId: id("POACT"),
    type,
    label,
    note: clean(note),
    data: data && typeof data === "object" ? data : {},
    actorId: clean(actor.employeeId || actor.userId || actor.id || actor.passportId),
    actorLabel: clean(actor.displayName || actor.name || actor.label) || "IXI User",
    occurredAt: nowIso()
  };
}

export function createIXIPurchaseOrderRecord({
  sourceRequest = null,
  directDraft = null,
  context = {},
  actor = null
} = {}) {
  const source = sourceRequest || directDraft || {};
  const sourcePurchase = source.purchase || source;
  const requestId = clean(source?.identity?.purchaseId || source?.identity?.requestId || source?.requestId);
  const requestNumber = clean(source?.identity?.purchaseNumber || source?.identity?.requestNumber || source?.requestNumber);
  const recordId = clean(source?.identity?.purchaseOrderRecordId) || id("POREC");
  const lines = (sourcePurchase.items || sourcePurchase.lines || []).map(normalizeLine);
  const estimated = money(
    sourcePurchase.estimatedTotal ??
    sourcePurchase.total ??
    lines.reduce((sum, line) => sum + line.extendedAmount, 0)
  );
  const requester = actor || context.actor || {};
  const direct = !sourceRequest;
  const status = direct ? "draft" : "pending-approval";

  const record = {
    schema: IXI_PURCHASE_ORDER_SCHEMA,
    identity: {
      purchaseOrderRecordId: recordId,
      sourceRequestId: requestId,
      sourceRequestNumber: requestNumber,
      poDocumentId: "",
      poNumber: ""
    },
    context: {
      primaryPassportId: clean(context.primary?.passportId),
      primaryObjectId: clean(context.primary?.objectId || context.primary?.id),
      primaryObjectType: clean(context.primary?.objectType),
      primaryObjectLabel: clean(context.primary?.label),
      entityPassportId: clean(context.entity?.passportId),
      locationPassportId: clean(context.location?.passportId),
      locationLabel: clean(context.location?.label),
      employeePassportId: clean(context.actor?.passportId),
      employeeLabel: clean(context.actor?.displayName || context.actor?.name || context.actor?.label),
      workOrderId: clean(source?.context?.workOrderId),
      workOrderNumber: clean(source?.context?.workOrderNumber)
    },
    order: {
      vendorId: clean(sourcePurchase.vendorId),
      vendorPassportId: clean(sourcePurchase.vendorPassportId),
      vendorLabel: clean(sourcePurchase.vendorLabel || sourcePurchase.vendorName),
      neededByDate: clean(sourcePurchase.neededByDate || sourcePurchase.dueDate),
      shipToLabel: clean(sourcePurchase.shipToLabel || context.location?.label),
      businessReason: clean(sourcePurchase.businessReason || sourcePurchase.notes),
      description: clean(sourcePurchase.whatNeeded || sourcePurchase.description),
      priority: clean(sourcePurchase.priority || "normal"),
      currency: clean(sourcePurchase.currency || "USD").toUpperCase(),
      lines
    },
    approval: {
      status: direct ? "not-applicable" : "pending",
      requestedById: clean(requester.employeeId || requester.userId || requester.id || requester.passportId),
      requestedByLabel: clean(requester.displayName || requester.name || requester.label),
      approvals: [],
      returnedReason: "",
      deniedReason: ""
    },
    receiving: recalcReceiving(lines),
    costs: {
      estimated,
      committed: 0,
      billed: 0,
      paid: 0,
      variance: 0,
      varianceApproved: false,
      varianceApprovedAt: "",
      varianceApprovedBy: ""
    },
    bills: [],
    documents: Array.isArray(sourcePurchase.attachments) ? [...sourcePurchase.attachments] : [],
    related: [],
    timeline: [event(
      direct ? "direct-po-draft-created" : "purchase-request-linked",
      direct ? "Direct Purchase Order draft created" : `Purchase Request ${requestNumber || requestId || "REQUEST"} linked`,
      requester,
      { requestId, requestNumber }
    )],
    status,
    closedAt: "",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    version: 1
  };

  return {
    ...record,
    costs: recalcCosts(record)
  };
}

export function attachIXIPurchaseOrderFinancialIdentity(record = {}, { documentId = "", poNumber = "", revision = 0 } = {}) {
  return {
    ...record,
    identity: {
      ...(record.identity || {}),
      poDocumentId: clean(documentId),
      poNumber: clean(poNumber) || clean(record.identity?.poNumber)
    },
    financialBinding: {
      financialDocumentId: clean(documentId),
      revision: Number(revision || record?.financialBinding?.revision || 0)
    },
    updatedAt: nowIso(),
    version: Number(record.version || 0) + 1
  };
}

export function hydrateIXIPurchaseOrderRecord(financialRecord = {}) {
  const envelope = financialRecord?.record || financialRecord || {};
  const document = envelope?.financialDocument || financialRecord?.financialDocument || envelope;
  if (clean(document?.documentType).toLowerCase() !== "purchase-order") return null;
  const stored = document?.purchaseOrderRecord;
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return null;
  const financialDocumentId = clean(document.financialDocumentId);
  if (!financialDocumentId) return null;
  return attachIXIPurchaseOrderFinancialIdentity(stored, {
    documentId: financialDocumentId,
    poNumber: clean(document.documentNumber || stored?.identity?.poNumber),
    revision: Number(envelope?.server?.revision || financialRecord?.server?.revision || 0)
  });
}

export function addIXIPurchaseOrderRelated(record = {}, related = {}) {
  const identity = clean(related.id || related.objectId || related.passportId || related.externalId);
  if (!identity) return record;
  const current = Array.isArray(record.related) ? record.related : [];
  if (current.some(item => clean(item.id || item.objectId || item.passportId || item.externalId) === identity)) return record;

  return {
    ...record,
    related: [...current, { ...related, id: identity }],
    updatedAt: nowIso(),
    version: Number(record.version || 0) + 1
  };
}

function requireAction(runtime, action) {
  if (runtime.actions.includes(action)) return;
  const error = new Error(`Purchase Order action is not authorized in current state: ${action}`);
  error.code = "IXI_PO_ACTION_NOT_AUTHORIZED";
  error.action = action;
  throw error;
}

export function applyIXIPurchaseOrderAction({
  record = {},
  action = "",
  context = {},
  policy = null,
  authority = null,
  actor = null,
  payload = {}
} = {}) {
  const runtime = evaluateIXIPurchaseOrderRuntime({ context, record, policy, authority });
  requireAction(runtime, action);
  const user = actor || context.actor || {};
  const next = {
    ...record,
    identity: { ...(record.identity || {}) },
    approval: { ...(record.approval || {}), approvals: [...(record.approval?.approvals || [])] },
    receiving: { ...(record.receiving || {}), lines: [...(record.receiving?.lines || [])] },
    costs: { ...(record.costs || {}) },
    bills: [...(record.bills || [])],
    documents: [...(record.documents || [])],
    related: [...(record.related || [])],
    timeline: [...(record.timeline || [])],
    updatedAt: nowIso(),
    version: Number(record.version || 0) + 1
  };
  const note = clean(payload.note || payload.reason);

  switch (action) {
    case IXI_PO_ACTIONS.APPROVE_REQUEST:
      next.status = "approved";
      next.approval.status = "approved";
      next.approval.approvals.push({
        actorId: clean(user.employeeId || user.userId || user.id || user.passportId),
        actorLabel: clean(user.displayName || user.name || user.label),
        decision: "approved",
        amount: runtime.total,
        occurredAt: nowIso()
      });
      next.timeline.push(event("request-approved", "Purchase Request approved", user, { amount: runtime.total }, note));
      break;

    case IXI_PO_ACTIONS.RETURN_REQUEST:
      next.status = "returned";
      next.approval.status = "returned";
      next.approval.returnedReason = note;
      next.timeline.push(event("request-returned", "Purchase Request returned", user, {}, note));
      break;

    case IXI_PO_ACTIONS.DENY_REQUEST:
      next.status = "denied";
      next.approval.status = "denied";
      next.approval.deniedReason = note;
      next.timeline.push(event("request-denied", "Purchase Request denied", user, {}, note));
      break;

    case IXI_PO_ACTIONS.ISSUE_PO:
      next.status = "po-issued";
      next.costs.committed = money(payload.committedAmount ?? next.costs.estimated);
      next.timeline.push(event("po-issued", `Purchase Order ${clean(next.identity.poNumber) || "issued"}`, user, { poNumber: clean(next.identity.poNumber) }));
      break;

    case IXI_PO_ACTIONS.SEND_PO:
      next.status = "sent";
      next.timeline.push(event("po-sent", "Purchase Order sent to vendor", user, {}, note));
      break;

    case IXI_PO_ACTIONS.RECEIVE: {
      const receipts = Array.isArray(payload.lines) ? payload.lines : [];
      const updated = next.receiving.lines.map((line, index) => {
        const incoming = receipts.find(item => clean(item.lineId) === clean(line.lineId)) || receipts[index] || {};
        const delta = Math.max(0, numeric(incoming.quantity ?? incoming.receivedQuantity));
        const proposed = numeric(line.receivedQuantity) + delta;
        if (proposed > numeric(line.orderedQuantity) && !runtime.canReceiveOver) {
          const error = new Error(`Over receipt requires approval for ${line.description}.`);
          error.code = "IXI_PO_OVER_RECEIPT_REQUIRES_APPROVAL";
          throw error;
        }
        return normalizeLine({
          ...line,
          quantity: line.orderedQuantity,
          receivedQuantity: proposed,
          damagedQuantity: numeric(line.damagedQuantity) + Math.max(0, numeric(incoming.damagedQuantity)),
          backorderedQuantity: Math.max(0, numeric(incoming.backorderedQuantity ?? line.backorderedQuantity))
        }, index);
      });
      next.receiving = {
        ...recalcReceiving(updated),
        lastReceivedAt: nowIso(),
        lastReceivedById: clean(user.employeeId || user.userId || user.id || user.passportId),
        lastReceivedByLabel: clean(user.displayName || user.name || user.label)
      };
      next.status = next.receiving.complete ? "received" : "partially-received";
      if (payload.document) next.documents.push(payload.document);
      next.timeline.push(event(
        next.receiving.complete ? "received" : "partial-receipt",
        next.receiving.complete ? "Purchase Order received" : "Items partially received",
        user,
        { percentReceived: next.receiving.percentReceived },
        note
      ));
      break;
    }

    case IXI_PO_ACTIONS.CLOSE_REMAINDER:
    case IXI_PO_ACTIONS.CANCEL_REMAINDER:
      next.receiving = { ...(next.receiving || {}), remainingQuantity: 0, complete: true, closedShort: true };
      next.status = "received";
      next.timeline.push(event("remainder-closed", "Remaining Purchase Order quantity closed", user, {}, note));
      break;

    case IXI_PO_ACTIONS.MATCH_BILL: {
      const bill = {
        billId: clean(payload.billId) || id("BILL"),
        invoiceNumber: clean(payload.invoiceNumber),
        amount: money(payload.amount),
        invoiceDate: clean(payload.invoiceDate),
        matchedAt: nowIso(),
        matchedBy: clean(user.displayName || user.name || user.label)
      };
      next.bills.push(bill);
      next.costs.billed = money(next.bills.reduce((sum, item) => sum + numeric(item.amount), 0));
      next.status = "bill-match";
      next.timeline.push(event("bill-matched", `Vendor bill ${bill.invoiceNumber || bill.billId} matched`, user, { billId: bill.billId, amount: bill.amount }));
      break;
    }

    case IXI_PO_ACTIONS.APPROVE_VARIANCE:
      next.costs.varianceApproved = true;
      next.costs.varianceApprovedAt = nowIso();
      next.costs.varianceApprovedBy = clean(user.displayName || user.name || user.label);
      next.timeline.push(event("variance-approved", "Purchase Order variance approved", user, { variance: next.costs.variance }, note));
      break;

    case IXI_PO_ACTIONS.REOPEN:
      next.status = "sent";
      next.closedAt = "";
      next.timeline.push(event("po-reopened", "Purchase Order reopened", user, {}, note));
      break;

    case IXI_PO_ACTIONS.ADD_NOTE:
      next.timeline.push(event("note-added", "Purchase Order note added", user, {}, note || clean(payload.body)));
      break;

    default:
      break;
  }

  next.costs = recalcCosts(next);

  const varianceResolved = Math.abs(numeric(next.costs.variance)) < 0.01 || next.costs.varianceApproved;
  if (
    ["received", "bill-match"].includes(next.status) &&
    next.receiving?.complete &&
    next.bills.length > 0 &&
    varianceResolved
  ) {
    next.status = "closed";
    next.closedAt = nowIso();
    next.timeline.push(event("po-closed", "Purchase Order closed", user));
  }

  return next;
}

export function getIXIPurchaseOrderDisplayNumber(record = {}) {
  return clean(record?.identity?.poNumber || record?.identity?.sourceRequestNumber || record?.identity?.purchaseOrderRecordId) || "PURCHASE ORDER";
}

export default {
  createIXIPurchaseOrderRecord,
  attachIXIPurchaseOrderFinancialIdentity,
  hydrateIXIPurchaseOrderRecord,
  addIXIPurchaseOrderRelated,
  applyIXIPurchaseOrderAction,
  getIXIPurchaseOrderDisplayNumber
};
