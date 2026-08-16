const clean = value => String(value ?? "").trim();
const amount = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};
const normalizeRole = value => clean(value).toLowerCase().replace(/\s+/g, "-");
const list = value => Array.isArray(value) ? value : [];

export const IXI_PO_ACTIONS = Object.freeze({
  APPROVE_REQUEST: "approve-request",
  RETURN_REQUEST: "return-request",
  DENY_REQUEST: "deny-request",
  ISSUE_PO: "issue-po",
  SEND_PO: "send-po",
  RECEIVE: "receive",
  CLOSE_REMAINDER: "close-remainder",
  MATCH_BILL: "match-bill",
  APPROVE_VARIANCE: "approve-variance",
  CANCEL_REMAINDER: "cancel-remainder",
  VOID_PO: "void-po",
  REOPEN: "reopen",
  ADD_NOTE: "add-note"
});

export const DEFAULT_IXI_PO_POLICY = Object.freeze({
  schema: "ixi-po-policy-v1",
  approval: {
    thresholds: [
      { min: 0, max: 500, role: "supervisor", label: "Supervisor" },
      { min: 500.01, max: 2500, role: "manager", label: "Manager" },
      { min: 2500.01, max: 10000, role: "purchasing-manager", label: "Purchasing Manager" },
      { min: 10000.01, max: 25000, role: "general-manager", label: "General Manager" },
      { min: 25000.01, max: Number.POSITIVE_INFINITY, role: "owner-cfo", label: "Owner / CFO" }
    ]
  },
  directPo: {
    roleLimits: {
      technician: 0,
      supervisor: 500,
      manager: 2500,
      buyer: 25000,
      "purchasing-manager": 25000,
      owner: Number.POSITIVE_INFINITY,
      cfo: Number.POSITIVE_INFINITY,
      "owner-cfo": Number.POSITIVE_INFINITY
    }
  },
  receiving: {
    allowedRoles: ["technician", "yard-manager", "buyer", "manager", "purchasing-manager", "owner", "cfo", "owner-cfo"],
    overReceiptRoles: ["manager", "purchasing-manager", "owner", "cfo", "owner-cfo"],
    closeRemainderRoles: ["buyer", "manager", "purchasing-manager", "owner", "cfo", "owner-cfo"],
    costVisibleRoles: ["buyer", "manager", "purchasing-manager", "accounting", "ap", "owner", "cfo", "owner-cfo"]
  },
  financial: {
    billMatchRoles: ["ap", "accounting", "manager", "owner", "cfo", "owner-cfo"],
    varianceThresholds: [
      { min: 0, max: 100, role: "ap", label: "AP" },
      { min: 100.01, max: 500, role: "manager", label: "Manager" },
      { min: 500.01, max: Number.POSITIVE_INFINITY, role: "owner-cfo", label: "Owner / CFO" }
    ],
    voidRoles: ["purchasing-manager", "owner", "cfo", "owner-cfo"],
    reopenRoles: ["admin", "owner", "cfo", "owner-cfo"]
  }
});

function mergePolicy(policy = {}) {
  return {
    ...DEFAULT_IXI_PO_POLICY,
    ...policy,
    approval: { ...DEFAULT_IXI_PO_POLICY.approval, ...(policy.approval || {}) },
    directPo: {
      ...DEFAULT_IXI_PO_POLICY.directPo,
      ...(policy.directPo || {}),
      roleLimits: {
        ...DEFAULT_IXI_PO_POLICY.directPo.roleLimits,
        ...(policy.directPo?.roleLimits || {})
      }
    },
    receiving: { ...DEFAULT_IXI_PO_POLICY.receiving, ...(policy.receiving || {}) },
    financial: { ...DEFAULT_IXI_PO_POLICY.financial, ...(policy.financial || {}) }
  };
}

function thresholdFor(thresholds = [], value = 0) {
  const numeric = amount(value);
  return list(thresholds).find(entry => {
    const min = Number(entry?.min || 0);
    const max = entry?.max === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : Number(entry?.max || 0);
    return numeric >= min && numeric <= max;
  }) || null;
}

function hasRole(roles = [], allowed = []) {
  const roleSet = new Set(roles.map(normalizeRole));
  return list(allowed).some(role => roleSet.has(normalizeRole(role)));
}

export function resolveIXIPurchaseOrderPolicy(context = {}, explicitPolicy = null) {
  return mergePolicy(
    explicitPolicy ||
    context?.purchasingPolicy ||
    context?.policies?.purchasing ||
    context?.entity?.purchasingPolicy ||
    {}
  );
}

export function resolveIXIPurchaseOrderAuthority(context = {}, explicitAuthority = null) {
  const actor = context?.actor || {};
  const source = explicitAuthority || actor?.purchasingAuthority || context?.purchasingAuthority || {};
  const roles = [
    ...list(source.roles),
    ...list(actor.roles),
    actor.role,
    actor.jobRole,
    actor.title
  ].map(normalizeRole).filter(Boolean);
  const grants = new Set([
    ...list(source.permissions),
    ...list(context?.permissions)
  ].map(value => clean(value).toLowerCase()).filter(Boolean));

  const hasGrant = key => {
    const target = clean(key).toLowerCase();
    return grants.has(target) || grants.has(`purchase:${target}`) || grants.has("purchase:*");
  };

  return {
    actorId: clean(actor.employeeId || actor.userId || actor.id || actor.passportId),
    actorLabel: clean(actor.displayName || actor.name || actor.label) || "Employee",
    roles,
    hasGrant,
    approvalLimit: amount(source.approvalLimit),
    directPoLimit: amount(source.directPoLimit),
    varianceLimit: amount(source.varianceLimit),
    seeCosts: source.seeCosts === true || hasGrant("see-costs"),
    canIssuePo: source.canIssuePo === true || hasGrant("issue-po"),
    canReceive: source.canReceive === true || hasGrant("receive"),
    canMatchBill: source.canMatchBill === true || hasGrant("match-bill"),
    canVoid: source.canVoid === true || hasGrant("void-po"),
    canReopen: source.canReopen === true || hasGrant("reopen")
  };
}

export function evaluateIXIPurchaseOrderRuntime({
  context = {},
  record = {},
  policy = null,
  authority = null
} = {}) {
  const resolvedPolicy = resolveIXIPurchaseOrderPolicy(context, policy);
  const resolvedAuthority = resolveIXIPurchaseOrderAuthority(context, authority);
  const roles = resolvedAuthority.roles;
  const total = amount(record?.costs?.committed || record?.costs?.estimated || record?.total || 0);
  const status = clean(record?.status || "draft").toLowerCase();
  const approvalRule = thresholdFor(resolvedPolicy.approval.thresholds, total);
  const approvalRole = normalizeRole(approvalRule?.role);
  const approvalCeiling = approvalRule?.max === Number.POSITIVE_INFINITY ? Number.MAX_SAFE_INTEGER : amount(approvalRule?.max);

  const roleApprovalLimit = roles.reduce((highest, role) => {
    const matches = list(resolvedPolicy.approval.thresholds).filter(entry => normalizeRole(entry.role) === normalizeRole(role));
    return matches.reduce((max, entry) => Math.max(max, entry.max === Number.POSITIVE_INFINITY ? Number.MAX_SAFE_INTEGER : amount(entry.max)), highest);
  }, 0);
  const approvalLimit = Math.max(resolvedAuthority.approvalLimit, roleApprovalLimit);
  const canApprove = approvalLimit >= total || hasRole(roles, [approvalRole]);

  const roleDirectLimit = roles.reduce((highest, role) => {
    const configured = resolvedPolicy.directPo.roleLimits?.[normalizeRole(role)];
    const numeric = configured === Number.POSITIVE_INFINITY ? Number.MAX_SAFE_INTEGER : amount(configured);
    return Math.max(highest, numeric);
  }, 0);
  const directPoLimit = Math.max(resolvedAuthority.directPoLimit, roleDirectLimit);
  const canDirectPo = resolvedAuthority.hasGrant("direct-po") || directPoLimit >= total;

  const canReceive = resolvedAuthority.canReceive || hasRole(roles, resolvedPolicy.receiving.allowedRoles);
  const canReceiveOver = resolvedAuthority.hasGrant("receive-over") || hasRole(roles, resolvedPolicy.receiving.overReceiptRoles);
  const canCloseRemainder = resolvedAuthority.hasGrant("close-remainder") || hasRole(roles, resolvedPolicy.receiving.closeRemainderRoles);
  const canSeeCosts = resolvedAuthority.seeCosts || hasRole(roles, resolvedPolicy.receiving.costVisibleRoles);
  const canMatchBill = resolvedAuthority.canMatchBill || hasRole(roles, resolvedPolicy.financial.billMatchRoles);
  const variance = Math.abs(Number(record?.costs?.variance || 0));
  const varianceRule = thresholdFor(resolvedPolicy.financial.varianceThresholds, variance);
  const canApproveVariance = variance === 0 || resolvedAuthority.varianceLimit >= variance || resolvedAuthority.hasGrant("approve-variance") || hasRole(roles, [varianceRule?.role]);
  const canVoid = resolvedAuthority.canVoid || hasRole(roles, resolvedPolicy.financial.voidRoles);
  const canReopen = resolvedAuthority.canReopen || hasRole(roles, resolvedPolicy.financial.reopenRoles);

  const actions = new Set([IXI_PO_ACTIONS.ADD_NOTE]);
  if (status === "pending-approval") {
    if (canApprove) {
      actions.add(IXI_PO_ACTIONS.APPROVE_REQUEST);
      actions.add(IXI_PO_ACTIONS.RETURN_REQUEST);
      actions.add(IXI_PO_ACTIONS.DENY_REQUEST);
    }
  }
  if (status === "approved" && (resolvedAuthority.canIssuePo || resolvedAuthority.hasGrant("issue-po") || canApprove)) actions.add(IXI_PO_ACTIONS.ISSUE_PO);
  if (status === "draft" && canDirectPo) actions.add(IXI_PO_ACTIONS.ISSUE_PO);
  if (status === "po-issued") actions.add(IXI_PO_ACTIONS.SEND_PO);
  if (["po-issued", "sent", "partially-received", "received", "bill-match"].includes(status)) {
    if (canReceive) actions.add(IXI_PO_ACTIONS.RECEIVE);
    if (canCloseRemainder) actions.add(IXI_PO_ACTIONS.CLOSE_REMAINDER);
    if (canMatchBill) actions.add(IXI_PO_ACTIONS.MATCH_BILL);
    if (canVoid) actions.add(IXI_PO_ACTIONS.CANCEL_REMAINDER);
  }
  if (status === "bill-match" && variance > 0 && canApproveVariance) actions.add(IXI_PO_ACTIONS.APPROVE_VARIANCE);
  if (status === "closed" && canReopen) actions.add(IXI_PO_ACTIONS.REOPEN);

  return {
    policy: resolvedPolicy,
    authority: resolvedAuthority,
    status,
    total,
    approval: {
      requiredRole: approvalRole,
      requiredRoleLabel: clean(approvalRule?.label || approvalRule?.role),
      requiredAuthority: approvalCeiling,
      actorLimit: approvalLimit,
      canApprove
    },
    directPoLimit,
    canDirectPo,
    canReceive,
    canReceiveOver,
    canCloseRemainder,
    canSeeCosts,
    canMatchBill,
    canApproveVariance,
    variance,
    varianceRule,
    canVoid,
    canReopen,
    actions: [...actions]
  };
}

export default {
  DEFAULT_IXI_PO_POLICY,
  resolveIXIPurchaseOrderPolicy,
  resolveIXIPurchaseOrderAuthority,
  evaluateIXIPurchaseOrderRuntime
};