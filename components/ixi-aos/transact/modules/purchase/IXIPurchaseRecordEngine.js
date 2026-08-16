import {
  IXI_PURCHASE_ACTIONS,
  evaluateIXIPurchaseRuntime
} from "./IXIPurchasePolicyEngine";

const clean = value => String(value ?? "").trim();
const number = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const money = value => Math.round(number(value) * 100) / 100;
const nowIso = () => new Date().toISOString();

export const IXI_PURCHASE_RECORD_SCHEMA = "ixi-purchase-record-v2";

export const IXI_PURCHASE_STATUSES = Object.freeze([
  "draft",
  "pending-approval",
  "returned",
  "denied",
  "approved",
  "po-issued",
  "sent",
  "partially-received",
  "received",
  "bill-match",
  "closed",
  "cancelled"
]);

function createId(prefix = "PUR") {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeLine(line = {}, index = 0) {
  const quantity = Math.max(0, number(line.quantity));
  const received = Math.max(0, number(line.receivedQuantity));
  const unitPrice = money(line.committedUnitCost ?? line.estimatedUnitCost);

  return {
    lineId: clean(line.lineId) || `LINE-${index + 1}`,
    description: clean(line.description),
    quantity,
    unit: clean(line.unit || "EA").toUpperCase(),
    estimatedUnitCost: money(line.estimatedUnitCost),
    committedUnitCost: unitPrice,
    receivedQuantity: received,
    remainingQuantity: Math.max(0, quantity - received),
    damagedQuantity: Math.max(0, number(line.damagedQuantity)),
    backorderedQuantity: Math.max(0, number(line.backorderedQuantity)),
    substituted: Boolean(line.substituted),
    substitutionDescription: clean(line.substitutionDescription)
  };
}

function timelineEntry({
  type,
  label,
  actor = {},
  note = "",
  data = {},
  occurredAt = ""
} = {}) {
  return {
    activityId: createId("PACT"),
    type: clean(type),
    label: clean(label),
    note: clean(note),
    data: data && typeof data === "object" ? data : {},
    actorId: clean(actor.employeeId || actor.userId || actor.id || actor.passportId),
    actorLabel: clean(actor.displayName || actor.name || actor.label) || "IXI User",
    occurredAt: clean(occurredAt) || nowIso()
  };
}

function recalcReceiving(lines = []) {
  const normalized = lines.map(normalizeLine);
  const ordered = normalized.reduce((sum, line) => sum + line.quantity, 0);
  const received = normalized.reduce((sum, line) => sum + Math.min(line.receivedQuantity, line.quantity), 0);
  const remaining = normalized.reduce((sum, line) => sum + Math.max(0, line.quantity - line.receivedQuantity), 0);

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
  const estimated = money(record?.costs?.estimated ?? record?.purchase?.estimatedTotal);
  const committed = money(record?.costs?.committed || 0);
  const billed = money(record?.costs?.billed || 0);
  const paid = money(record?.costs?.paid || 0);
  return {
    estimated,
    committed,
    billed,
    paid,
    variance: money(billed - committed)
  };
}

export function createIXIPurchaseRecord({
  draft = {},
  context = {},
  actor = null,
  policy = null,
  authority = null,
  forceDirectPo = false
} = {}) {
  const purchaseId = clean(draft?.identity?.purchaseId || draft?.identity?.clientRequestId) || createId("PUR");
  const purchaseNumber = clean(draft?.identity?.purchaseNumber);
  const requestType = clean(draft?.purchase?.requestType) === "purchase-order" ? "purchase-order" : "purchase-request";
  const runtime = evaluateIXIPurchaseRuntime({
    context,
    purchase: draft,
    policy,
    authority
  });
  const directPo = requestType === "purchase-order" && (runtime.canDirectPo || forceDirectPo);
  const status = directPo ? "po-issued" : "pending-approval";
  const requestNumber = purchaseNumber || `PR-${purchaseId.replace(/\D/g, "").slice(-6) || Date.now().toString().slice(-6)}`;
  const poNumber = directPo ? `PO-${purchaseId.replace(/\D/g, "").slice(-6) || Date.now().toString().slice(-6)}` : "";
  const lines = (draft?.purchase?.items || []).map(normalizeLine);
  const receiving = recalcReceiving(lines);
  const createdBy = actor || context?.actor || {};

  const record = {
    schema: IXI_PURCHASE_RECORD_SCHEMA,
    identity: {
      purchaseId,
      clientRequestId: clean(draft?.identity?.clientRequestId) || purchaseId,
      requestNumber,
      poNumber
    },
    context: {
      ...(draft?.context || {}),
      primaryObjectType: clean(context?.primary?.objectType),
      primaryObjectLabel: clean(context?.primary?.label),
      locationLabel: clean(context?.location?.label),
      employeeLabel: clean(context?.actor?.displayName || context?.actor?.name || context?.actor?.label)
    },
    purchase: {
      ...(draft?.purchase || {}),
      items: lines,
      requestedById: clean(createdBy.employeeId || createdBy.userId || createdBy.id || createdBy.passportId),
      requestedByLabel: clean(createdBy.displayName || createdBy.name || createdBy.label) || "Employee",
      requestedAt: nowIso(),
      businessReason: clean(draft?.purchase?.businessReason || draft?.purchase?.notes),
      shipToLabel: clean(draft?.purchase?.shipToLabel || context?.location?.label)
    },
    approval: {
      status: directPo ? "approved" : "pending",
      requiredRole: runtime.approval.role,
      requiredRoleLabel: runtime.approval.label,
      requiredAuthority: runtime.approval.authorityCeiling,
      currentApproverId: "",
      currentApproverLabel: "",
      approvals: [],
      returnedReason: "",
      deniedReason: ""
    },
    receiving,
    costs: {
      estimated: money(draft?.purchase?.estimatedTotal),
      committed: directPo ? money(draft?.purchase?.estimatedTotal) : 0,
      billed: 0,
      paid: 0,
      variance: directPo ? money(0 - draft?.purchase?.estimatedTotal) : 0
    },
    bills: [],
    documents: Array.isArray(draft?.purchase?.attachments) ? [...draft.purchase.attachments] : [],
    notes: [],
    related: [],
    timeline: [timelineEntry({
      type: "request-created",
      label: `Purchase Request ${requestNumber} created`,
      actor: createdBy,
      data: { requestNumber }
    })],
    status,
    closedAt: "",
    updatedAt: nowIso(),
    version: 1
  };

  if (directPo) {
    record.timeline.push(timelineEntry({
      type: "po-issued",
      label: `Purchase Order ${poNumber} issued under direct authority`,
      actor: createdBy,
      data: { poNumber }
    }));
  }

  return {
    ...record,
    costs: recalcCosts(record)
  };
}

export function appendIXIPurchaseRelated(record = {}, related = {}) {
  const identity = clean(related.id || related.objectId || related.passportId || related.externalId);
  if (!identity) return record;
  const list = Array.isArray(record.related) ? record.related : [];
  if (list.some(item => clean(item.id || item.objectId || item.passportId || item.externalId) === identity)) return record;
  return {
    ...record,
    related: [...list, { ...related, id: identity }],
    updatedAt: nowIso(),
    version: Number(record.version || 0) + 1
  };
}

function requireAction(runtime, action) {
  if (!runtime.actions.includes(action)) {
    const error = new Error(`Purchase action is not authorized in current state: ${action}`);
    error.code = "IXI_PURCHASE_ACTION_NOT_AUTHORIZED";
    error.action = action;
    throw error;
  }
}

export function applyIXIPurchaseAction({
  record = {},
  action = "",
  context = {},
  policy = null,
  authority = null,
  actor = null,
  payload = {}
} = {}) {
  const runtime = evaluateIXIPurchaseRuntime({ context, purchase: record, policy, authority });
  requireAction(runtime, action);
  const user = actor || context?.actor || {};
  const next = {
    ...record,
    approval: { ...(record.approval || {}) },
    receiving: { ...(record.receiving || {}) },
    costs: { ...(record.costs || {}) },
    bills: Array.isArray(record.bills) ? [...record.bills] : [],
    documents: Array.isArray(record.documents) ? [...record.documents] : [],
    notes: Array.isArray(record.notes) ? [...record.notes] : [],
    timeline: Array.isArray(record.timeline) ? [...record.timeline] : [],
    updatedAt: nowIso(),
    version: Number(record.version || 0) + 1
  };

  const note = clean(payload.note || payload.reason);

  switch (action) {
    case IXI_PURCHASE_ACTIONS.APPROVE:
      next.status = "approved";
      next.approval.status = "approved";
      next.approval.approvals = [
        ...(next.approval.approvals || []),
        {
          actorId: clean(user.employeeId || user.userId || user.id || user.passportId),
          actorLabel: clean(user.displayName || user.name || user.label),
          decision: "approved",
          amount: runtime.amount,
          occurredAt: nowIso()
        }
      ];
      next.timeline.push(timelineEntry({ type: "approved", label: "Purchase Request approved", actor: user, note }));
      break;

    case IXI_PURCHASE_ACTIONS.RECOMMEND:
      next.approval.approvals = [
        ...(next.approval.approvals || []),
        {
          actorId: clean(user.employeeId || user.userId || user.id || user.passportId),
          actorLabel: clean(user.displayName || user.name || user.label),
          decision: "recommended",
          amount: runtime.amount,
          occurredAt: nowIso()
        }
      ];
      next.timeline.push(timelineEntry({ type: "recommended", label: "Approval recommended", actor: user, note }));
      break;

    case IXI_PURCHASE_ACTIONS.RETURN:
      next.status = "returned";
      next.approval.status = "returned";
      next.approval.returnedReason = note;
      next.timeline.push(timelineEntry({ type: "returned", label: "Purchase Request returned", actor: user, note }));
      break;

    case IXI_PURCHASE_ACTIONS.DENY:
      next.status = "denied";
      next.approval.status = "denied";
      next.approval.deniedReason = note;
      next.timeline.push(timelineEntry({ type: "denied", label: "Purchase Request denied", actor: user, note }));
      break;

    case IXI_PURCHASE_ACTIONS.CANCEL_REQUEST:
      next.status = "cancelled";
      next.timeline.push(timelineEntry({ type: "cancelled", label: "Purchase Request cancelled", actor: user, note }));
      break;

    case IXI_PURCHASE_ACTIONS.ISSUE_PO: {
      const poNumber = clean(next.identity?.poNumber) || `PO-${clean(next.identity?.requestNumber).replace(/^PR-/, "") || Date.now().toString().slice(-6)}`;
      next.identity = { ...(next.identity || {}), poNumber };
      next.status = "po-issued";
      next.costs.committed = money(next.purchase?.estimatedTotal || next.costs.estimated);
      next.costs = recalcCosts(next);
      next.timeline.push(timelineEntry({ type: "po-issued", label: `Converted to Purchase Order ${poNumber}`, actor: user, data: { poNumber } }));
      break;
    }

    case IXI_PURCHASE_ACTIONS.SEND_PO:
      next.status = "sent";
      next.timeline.push(timelineEntry({ type: "po-sent", label: "Purchase Order sent to vendor", actor: user, note }));
      break;

    case IXI_PURCHASE_ACTIONS.RECEIVE: {
      const receipts = Array.isArray(payload.lines) ? payload.lines : [];
      const currentLines = Array.isArray(next.receiving?.lines) ? next.receiving.lines : [];
      const receivedById = clean(user.employeeId || user.userId || user.id || user.passportId);
      const receivedByLabel = clean(user.displayName || user.name || user.label);

      const updatedLines = currentLines.map((line, index) => {
        const incoming = receipts.find(item => clean(item.lineId) === clean(line.lineId)) || receipts[index] || {};
        const delta = Math.max(0, number(incoming.quantity ?? incoming.receivedQuantity));
        const proposed = number(line.receivedQuantity) + delta;
        if (proposed > number(line.quantity) && !runtime.canReceiveOver) {
          const error = new Error(`Over receipt requires additional authority for ${line.description}.`);
          error.code = "IXI_PURCHASE_OVER_RECEIPT_REQUIRES_APPROVAL";
          throw error;
        }
        return normalizeLine({
          ...line,
          receivedQuantity: proposed,
          damagedQuantity: number(line.damagedQuantity) + Math.max(0, number(incoming.damagedQuantity)),
          backorderedQuantity: Math.max(0, number(incoming.backorderedQuantity ?? line.backorderedQuantity))
        }, index);
      });

      next.receiving = {
        ...recalcReceiving(updatedLines),
        lastReceivedAt: nowIso(),
        lastReceivedById: receivedById,
        lastReceivedByLabel: receivedByLabel
      };
      next.status = next.receiving.complete ? "received" : "partially-received";

      if (payload.document) next.documents.push(payload.document);
      next.timeline.push(timelineEntry({
        type: next.receiving.complete ? "received" : "partial-receipt",
        label: next.receiving.complete ? "Purchase Order received" : "Items partially received",
        actor: user,
        note,
        data: { percentReceived: next.receiving.percentReceived }
      }));
      break;
    }

    case IXI_PURCHASE_ACTIONS.CLOSE_SHORT:
    case IXI_PURCHASE_ACTIONS.CANCEL_REMAINDER:
      next.status = "received";
      next.receiving = {
        ...(next.receiving || {}),
        remainingQuantity: 0,
        complete: true,
        closedShort: true
      };
      next.timeline.push(timelineEntry({ type: "closed-short", label: "Remaining quantity closed", actor: user, note }));
      break;

    case IXI_PURCHASE_ACTIONS.MATCH_BILL: {
      const bill = {
        billId: clean(payload.billId) || createId("BILL"),
        invoiceNumber: clean(payload.invoiceNumber),
        amount: money(payload.amount),
        invoiceDate: clean(payload.invoiceDate),
        status: "matched",
        matchedAt: nowIso(),
        matchedBy: clean(user.displayName || user.name || user.label)
      };
      next.bills.push(bill);
      next.costs.billed = money(next.bills.reduce((sum, item) => sum + number(item.amount), 0));
      next.costs = recalcCosts(next);
      next.status = "bill-match";
      next.timeline.push(timelineEntry({ type: "bill-matched", label: `Vendor bill ${bill.invoiceNumber || bill.billId} matched`, actor: user, data: { billId: bill.billId, amount: bill.amount } }));
      break;
    }

    case IXI_PURCHASE_ACTIONS.VOID_PO:
      next.status = "cancelled";
      next.timeline.push(timelineEntry({ type: "po-voided", label: "Purchase Order voided", actor: user, note }));
      break;

    case IXI_PURCHASE_ACTIONS.REOPEN:
      next.status = "sent";
      next.closedAt = "";
      next.timeline.push(timelineEntry({ type: "reopened", label: "Purchase Order reopened", actor: user, note }));
      break;

    case IXI_PURCHASE_ACTIONS.ADD_NOTE:
      next.notes.push({
        noteId: createId("PNOTE"),
        body: note || clean(payload.body),
        createdAt: nowIso(),
        createdBy: clean(user.displayName || user.name || user.label)
      });
      next.timeline.push(timelineEntry({ type: "note-added", label: "Purchase note added", actor: user, note: note || clean(payload.body) }));
      break;

    default:
      break;
  }

  if (
    ["received", "bill-match"].includes(next.status) &&
    next.receiving?.complete &&
    next.bills.length &&
    Math.abs(number(next.costs?.variance)) < 0.01
  ) {
    next.status = "closed";
    next.closedAt = nowIso();
    next.timeline.push(timelineEntry({ type: "closed", label: "Purchase Order closed", actor: user }));
  }

  next.costs = recalcCosts(next);
  return next;
}

export function getIXIPurchaseDisplayNumber(record = {}) {
  return clean(record?.identity?.poNumber || record?.identity?.requestNumber || record?.identity?.purchaseId) || "PURCHASE";
}

export default {
  createIXIPurchaseRecord,
  appendIXIPurchaseRelated,
  applyIXIPurchaseAction,
  getIXIPurchaseDisplayNumber
};
