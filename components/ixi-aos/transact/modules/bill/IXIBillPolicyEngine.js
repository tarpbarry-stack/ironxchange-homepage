const clean = value => String(value ?? "").trim().toLowerCase();
const numeric = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const DEFAULT_IXI_BILL_POLICY = Object.freeze({
  approvalThresholds: Object.freeze([
    Object.freeze({ max: 500, role: "supervisor", label: "Supervisor" }),
    Object.freeze({ max: 5000, role: "manager", label: "Manager" }),
    Object.freeze({ max: 25000, role: "general-manager", label: "General Manager" }),
    Object.freeze({ max: Infinity, role: "owner-cfo", label: "Owner / CFO" })
  ]),
  poAutoApproval: Object.freeze({ enabled: true, maxVariance: 50 }),
  nonPoApprovalRequiredAbove: 0,
  paymentRoles: Object.freeze(["accounting", "ap", "controller", "cfo", "owner"]),
  voidRoles: Object.freeze(["accounting-manager", "controller", "cfo", "owner", "admin"]),
  varianceAuthority: Object.freeze([
    Object.freeze({ max: 100, role: "accounting", label: "Accounting" }),
    Object.freeze({ max: 500, role: "manager", label: "Manager" }),
    Object.freeze({ max: Infinity, role: "owner-cfo", label: "Owner / CFO" })
  ])
});

function roleSet(actor = {}, authority = {}) {
  return new Set([
    ...(Array.isArray(actor.roles) ? actor.roles : []),
    ...(Array.isArray(authority.roles) ? authority.roles : [])
  ].map(clean).filter(Boolean));
}

function thresholdFor(amount, thresholds = []) {
  const value = Math.abs(numeric(amount));
  return thresholds.find(item => value <= numeric(item.max === Infinity ? Number.MAX_SAFE_INTEGER : item.max)) || thresholds[thresholds.length - 1] || null;
}

export function getIXIBillApprovalRequirement(record = {}, policy = DEFAULT_IXI_BILL_POLICY) {
  const amount = numeric(record?.bill?.amount);
  const match = record?.purchaseMatch || {};
  const hasPo = Boolean(match.purchaseOrderNumber);
  const variance = Math.abs(numeric(match.variance));
  const exactPoMatch = hasPo && match.receivedComplete && clean(match.status) === "matched" && variance <= numeric(policy.poAutoApproval?.maxVariance);

  if (policy.poAutoApproval?.enabled && exactPoMatch) {
    return { required: false, reason: "matched-po", amount, role: "", label: "", authority: 0 };
  }

  if (!hasPo && amount <= numeric(policy.nonPoApprovalRequiredAbove)) {
    return { required: false, reason: "below-non-po-threshold", amount, role: "", label: "", authority: 0 };
  }

  const threshold = thresholdFor(amount, policy.approvalThresholds || []);
  return {
    required: true,
    reason: hasPo ? "po-exception-or-threshold" : "non-po-threshold",
    amount,
    role: clean(threshold?.role),
    label: String(threshold?.label || threshold?.role || "Approver"),
    authority: numeric(threshold?.max === Infinity ? amount : threshold?.max)
  };
}

export function canIXIActorApproveBill({ record = {}, actor = {}, authority = {}, policy = DEFAULT_IXI_BILL_POLICY } = {}) {
  const requirement = getIXIBillApprovalRequirement(record, policy);
  if (!requirement.required) return true;
  const limit = numeric(authority.billApprovalLimit ?? authority.approvalLimit);
  const roles = roleSet(actor, authority);
  const explicit = authority.canApproveBills === true || roles.has("owner") || roles.has("cfo") || roles.has("admin");
  const requiredRole = clean(requirement.role);
  const roleMatches = !requiredRole || roles.has(requiredRole) || (requiredRole === "owner-cfo" && (roles.has("owner") || roles.has("cfo")));
  return explicit && limit >= requirement.amount && (roleMatches || roles.has("owner") || roles.has("cfo") || roles.has("admin"));
}

export function canIXIActorPayBill({ actor = {}, authority = {}, policy = DEFAULT_IXI_BILL_POLICY } = {}) {
  const roles = roleSet(actor, authority);
  if (authority.canPayBills === true) return true;
  return (policy.paymentRoles || []).map(clean).some(role => roles.has(role));
}

export function canIXIActorVoidBill({ actor = {}, authority = {}, policy = DEFAULT_IXI_BILL_POLICY } = {}) {
  const roles = roleSet(actor, authority);
  if (authority.canVoidBills === true) return true;
  return (policy.voidRoles || []).map(clean).some(role => roles.has(role));
}

export function getIXIBillVarianceRequirement(record = {}, policy = DEFAULT_IXI_BILL_POLICY) {
  const variance = Math.abs(numeric(record?.purchaseMatch?.variance));
  if (!(variance > 0)) return { required: false, variance: 0, role: "", label: "", authority: 0 };
  const threshold = thresholdFor(variance, policy.varianceAuthority || []);
  return {
    required: true,
    variance,
    role: clean(threshold?.role),
    label: String(threshold?.label || threshold?.role || "Approver"),
    authority: numeric(threshold?.max === Infinity ? variance : threshold?.max)
  };
}

export function canIXIActorApproveBillVariance({ record = {}, actor = {}, authority = {}, policy = DEFAULT_IXI_BILL_POLICY } = {}) {
  const requirement = getIXIBillVarianceRequirement(record, policy);
  if (!requirement.required) return true;
  const roles = roleSet(actor, authority);
  const limit = numeric(authority.billVarianceLimit ?? authority.varianceLimit);
  const explicit = authority.canApproveBillVariance === true || roles.has("owner") || roles.has("cfo") || roles.has("admin");
  return explicit && limit >= requirement.variance;
}

export function getIXIBillAvailableActions({ record = {}, actor = {}, authority = {}, policy = DEFAULT_IXI_BILL_POLICY } = {}) {
  const actions = new Set();
  const status = clean(record.status);
  const approval = clean(record?.approval?.status);
  const payment = clean(record?.payment?.status);
  const match = clean(record?.purchaseMatch?.status);

  if (status === "void") return actions;

  if (["open", "submitted"].includes(status) && approval === "pending" && match !== "exception") {
    if (canIXIActorApproveBill({ record, actor, authority, policy })) {
      actions.add("approve");
      actions.add("return");
      actions.add("reject");
    }
  }

  if (match === "exception" && canIXIActorApproveBillVariance({ record, actor, authority, policy })) {
    actions.add("approve-variance");
  }

  if ((status === "approved" || approval === "approved") && payment !== "paid" && canIXIActorPayBill({ actor, authority, policy })) {
    actions.add("schedule-payment");
    actions.add("record-payment");
  }

  if (payment === "scheduled" && canIXIActorPayBill({ actor, authority, policy })) actions.add("record-payment");
  if (status !== "void" && payment !== "paid" && canIXIActorVoidBill({ actor, authority, policy })) actions.add("void");
  if (["open", "submitted"].includes(status) && ["pending", "returned"].includes(approval) && payment === "unpaid") actions.add("edit");
  return actions;
}

export default {
  DEFAULT_IXI_BILL_POLICY,
  getIXIBillApprovalRequirement,
  getIXIBillVarianceRequirement,
  canIXIActorApproveBill,
  canIXIActorPayBill,
  canIXIActorVoidBill,
  canIXIActorApproveBillVariance,
  getIXIBillAvailableActions
};
