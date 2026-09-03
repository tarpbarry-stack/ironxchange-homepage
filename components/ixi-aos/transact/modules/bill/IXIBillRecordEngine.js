import {
  getIXIBillApprovalRequirement,
  getIXIBillAvailableActions,
  getIXIBillVarianceRequirement,
  DEFAULT_IXI_BILL_POLICY
} from "./IXIBillPolicyEngine";

const clean = value => String(value ?? "").trim();
const numeric = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const money = value => Math.round(numeric(value) * 100) / 100;

function actorIdentity(actor = {}) {
  return {
    id: clean(actor.employeeId || actor.userId || actor.objectId || actor.passportId),
    label: clean(actor.displayName || actor.name || actor.label)
  };
}

function appendTimeline(record, event) {
  const timeline = Array.isArray(record.timeline) ? record.timeline : [];
  return [...timeline, event];
}

function nextAudit(record) {
  return {
    ...(record.audit || {}),
    updatedAt: new Date().toISOString(),
    version: Number(record.audit?.version || 0) + 1
  };
}

function assertAction(record, action, actor, authority, policy) {
  const actions = getIXIBillAvailableActions({ record, actor, authority, policy });
  if (!actions.has(action)) {
    const error = new Error(`Bill action not authorized in current state: ${action}`);
    error.code = "IXI_BILL_ACTION_NOT_AUTHORIZED";
    throw error;
  }
}

export function initializeIXIBillApproval(record = {}, policy = DEFAULT_IXI_BILL_POLICY) {
  const requirement = getIXIBillApprovalRequirement(record, policy);
  if (!requirement.required) {
    return {
      ...record,
      status: "approved",
      approval: {
        ...(record.approval || {}),
        status: "approved",
        requiredAuthority: 0,
        requiredRole: "",
        autoApproved: true,
        autoApprovalReason: requirement.reason,
        approvedAt: new Date().toISOString(),
        approvedById: "ixi-policy",
        approvedByLabel: "IXI Policy"
      }
    };
  }
  return {
    ...record,
    status: "open",
    approval: {
      ...(record.approval || {}),
      status: "pending",
      requiredAuthority: requirement.authority,
      requiredRole: requirement.role,
      requiredRoleLabel: requirement.label
    }
  };
}

export function applyIXIBillAction({
  record = {},
  action = "",
  actor = {},
  authority = {},
  policy = DEFAULT_IXI_BILL_POLICY,
  payload = {}
} = {}) {
  const resolvedAction = clean(action);
  assertAction(record, resolvedAction, actor, authority, policy);
  const who = actorIdentity(actor);
  const now = new Date().toISOString();
  let next = { ...record };

  if (resolvedAction === "approve") {
    next = {
      ...next,
      status: "approved",
      approval: {
        ...(next.approval || {}),
        status: "approved",
        approvedById: who.id,
        approvedByLabel: who.label,
        approvedAt: now
      },
      timeline: appendTimeline(next, {
        activityId: `ACT-APPROVE-${now}`,
        type: "bill-approved",
        label: "Bill approved",
        actorLabel: who.label,
        occurredAt: now
      })
    };
  } else if (resolvedAction === "return") {
    if (!clean(payload.reason)) {
      const error = new Error("A correction reason is required.");
      error.code = "IXI_BILL_RETURN_REASON_REQUIRED";
      throw error;
    }
    next = {
      ...next,
      status: "submitted",
      approval: {
        ...(next.approval || {}),
        status: "returned",
        returnedById: who.id,
        returnedByLabel: who.label,
        returnedAt: now,
        returnReason: clean(payload.reason)
      },
      timeline: appendTimeline(next, {
        activityId: `ACT-RETURN-${now}`,
        type: "bill-returned",
        label: "Bill returned for correction",
        actorLabel: who.label,
        occurredAt: now,
        note: clean(payload.reason)
      })
    };
  } else if (resolvedAction === "reject") {
    if (!clean(payload.reason)) {
      const error = new Error("A rejection reason is required.");
      error.code = "IXI_BILL_REJECT_REASON_REQUIRED";
      throw error;
    }
    next = {
      ...next,
      status: "void",
      approval: {
        ...(next.approval || {}),
        status: "rejected",
        rejectedById: who.id,
        rejectedByLabel: who.label,
        rejectedAt: now,
        rejectReason: clean(payload.reason)
      },
      timeline: appendTimeline(next, {
        activityId: `ACT-REJECT-${now}`,
        type: "bill-rejected",
        label: "Bill rejected",
        actorLabel: who.label,
        occurredAt: now,
        note: clean(payload.reason)
      })
    };
  } else if (resolvedAction === "approve-variance") {
    const requirement = getIXIBillVarianceRequirement(next, policy);
    next = {
      ...next,
      purchaseMatch: {
        ...(next.purchaseMatch || {}),
        status: "matched",
        varianceApproval: {
          amount: requirement.variance,
          approvedById: who.id,
          approvedByLabel: who.label,
          approvedAt: now
        }
      },
      timeline: appendTimeline(next, {
        activityId: `ACT-VARIANCE-${now}`,
        type: "bill-variance-approved",
        label: `Bill variance ${money(requirement.variance).toFixed(2)} approved`,
        actorLabel: who.label,
        occurredAt: now
      })
    };
  } else if (resolvedAction === "schedule-payment") {
    const scheduledDate = clean(payload.scheduledDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
      const error = new Error("A valid scheduled payment date is required.");
      error.code = "IXI_BILL_PAYMENT_DATE_REQUIRED";
      throw error;
    }
    next = {
      ...next,
      payment: {
        ...(next.payment || {}),
        status: "scheduled",
        scheduledDate
      },
      timeline: appendTimeline(next, {
        activityId: `ACT-SCHEDULE-${now}`,
        type: "bill-payment-scheduled",
        label: `Payment scheduled for ${scheduledDate}`,
        actorLabel: who.label,
        occurredAt: now
      })
    };
  } else if (resolvedAction === "record-payment") {
    const amount = money(payload.amount || next.bill?.amount);
    const method = clean(payload.method);
    const reference = clean(payload.reference);
    const total = money(next.bill?.amount);
    const remaining = money(total - numeric(next.payment?.amountPaid));
    if (!(amount > 0) || amount > remaining + 0.005 || !method || !reference) {
      const error = new Error("Payment amount, method, and transaction reference are required and cannot exceed the remaining balance.");
      error.code = "IXI_BILL_PAYMENT_INVALID";
      throw error;
    }
    const paidTotal = money(numeric(next.payment?.amountPaid) + amount);
    const fullyPaid = paidTotal + 0.005 >= total;
    next = {
      ...next,
      payment: {
        ...(next.payment || {}),
        status: fullyPaid ? "paid" : "partial",
        paidDate: clean(payload.paidDate) || now.slice(0, 10),
        amountPaid: Math.min(paidTotal, total),
        method,
        reference,
        paidById: who.id,
        paidByLabel: who.label
      },
      timeline: appendTimeline(next, {
        activityId: `ACT-PAY-${now}`,
        type: fullyPaid ? "bill-paid" : "bill-partial-payment",
        label: fullyPaid ? "Bill paid" : "Partial payment recorded",
        actorLabel: who.label,
        occurredAt: now,
        amount
      })
    };
  } else if (resolvedAction === "void") {
    if (!clean(payload.reason)) {
      const error = new Error("A void reason is required.");
      error.code = "IXI_BILL_VOID_REASON_REQUIRED";
      throw error;
    }
    next = {
      ...next,
      status: "void",
      timeline: appendTimeline(next, {
        activityId: `ACT-VOID-${now}`,
        type: "bill-voided",
        label: "Bill voided",
        actorLabel: who.label,
        occurredAt: now,
        note: clean(payload.reason)
      })
    };
  } else if (resolvedAction === "edit") {
    const bill = { ...(next.bill || {}), ...(payload.bill || {}) };
    const invoiceNumber = clean(payload?.identity?.invoiceNumber || next?.identity?.invoiceNumber);
    if (!clean(bill.vendorLabel) || !invoiceNumber || !clean(bill.description) || !(money(bill.amount) > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(clean(bill.invoiceDate)) || (clean(bill.dueDate) && clean(bill.dueDate) < clean(bill.invoiceDate))) {
      const error = new Error("Vendor, invoice number, description, positive amount, and valid dates are required.");
      error.code = "IXI_BILL_EDIT_INVALID";
      throw error;
    }
    const hasPo = Boolean(clean(next?.purchaseMatch?.purchaseOrderNumber));
    const variance = hasPo ? money(bill.amount - numeric(next?.purchaseMatch?.poCommittedAmount)) : 0;
    next = {
      ...next,
      identity: { ...(next.identity || {}), invoiceNumber },
      bill,
      purchaseMatch: { ...(next.purchaseMatch || {}), billedAmount: money(bill.amount), variance, status: hasPo ? (next?.purchaseMatch?.receivedComplete && Math.abs(variance) < 0.005 ? "matched" : "exception") : "n/a", varianceApproval: null },
      timeline: appendTimeline(next, {
        activityId: `ACT-EDIT-${now}`,
        type: "bill-edited",
        label: "Bill edited",
        actorLabel: who.label,
        occurredAt: now
      })
    };
  }

  return { ...next, audit: nextAudit(next) };
}

export default { initializeIXIBillApproval, applyIXIBillAction };
