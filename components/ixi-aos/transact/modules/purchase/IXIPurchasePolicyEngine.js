const clean = value => String(value ?? "").trim();
const number = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const IXI_PURCHASE_ACTIONS = Object.freeze({
  EDIT_REQUEST: "edit-request",
  CANCEL_REQUEST: "cancel-request",
  DENY: "deny",
  RETURN: "return",
  RECOMMEND: "recommend-approval",
  APPROVE: "approve",
  ISSUE_PO: "issue-po",
  SEND_PO: "send-po",
  CHANGE_PO: "change-po",
  CANCEL_REMAINDER: "cancel-remainder",
  RECEIVE: "receive",
  RECEIVE_OVER: "receive-over",
  ACCEPT_SUBSTITUTION: "accept-substitution",
  CLOSE_SHORT: "close-short",
  MATCH_BILL: "match-bill",
  APPROVE_VARIANCE: "approve-variance",
  VOID_PO: "void-po",
  REOPEN: "reopen",
  ADD_NOTE: "add-note"
});

export const DEFAULT_IXI_PURCHASING_POLICY = Object.freeze({
  schema: "ixi-purchasing-policy-v1",
  request: {
    canRequest: "all-employees",
    requireDescription: true,
    requireBusinessReason: true,
    requireEstimatedAmount: false,
    requireVendor: false,
    quoteThresholds: [
      { amount: 1000, quotes: 1 },
      { amount: 5000, quotes: 2 },
      { amount: 15000, quotes: 3 }
    ]
  },
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
    substitutionRoles: ["buyer", "manager", "purchasing-manager", "owner", "cfo", "owner-cfo"],
    closeShortRoles: ["buyer", "manager", "purchasing-manager", "owner", "cfo", "owner-cfo"],
    costVisibility: "role-based",
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

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function mergePolicy(policy = {}) {
  return {
    ...DEFAULT_IXI_PURCHASING_POLICY,
    ...policy,
    request: {
      ...DEFAULT_IXI_PURCHASING_POLICY.request,
      ...(policy.request || {})
    },
    approval: {
      ...DEFAULT_IXI_PURCHASING_POLICY.approval,
      ...(policy.approval || {})
    },
    directPo: {
      ...DEFAULT_IXI_PURCHASING_POLICY.directPo,
      ...(policy.directPo || {}),
      roleLimits: {
        ...DEFAULT_IXI_PURCHASING_POLICY.directPo.roleLimits,
        ...(policy.directPo?.roleLimits || {})
      }
    },
    receiving: {
      ...DEFAULT_IXI_PURCHASING_POLICY.receiving,
      ...(policy.receiving || {})
    },
    financial: {
      ...DEFAULT_IXI_PURCHASING_POLICY.financial,
      ...(policy.financial || {})
    }
  };
}

function normalizeRole(value) {
  return clean(value).toLowerCase().replace(/\s+/g, "-");
}

export function resolveIXIPurchasingPolicy(context = {}, explicitPolicy = null) {
  return mergePolicy(
    explicitPolicy ||
    context?.purchasingPolicy ||
    context?.policies?.purchasing ||
    context?.entity?.purchasingPolicy ||
    {}
  );
}

export function resolveIXIPurchaseAuthority(context = {}, explicitAuthority = null) {
  const actor = context?.actor || {};
  const source = explicitAuthority || actor?.purchasingAuthority || context?.purchasingAuthority || {};
  const permissionValues = safeArray(context?.permissions);

  const roles = new Set(
    [
      ...safeArray(source.roles),
      ...safeArray(actor.roles),
      actor.role,
      actor.jobRole,
      actor.title
    ]
      .map(normalizeRole)
      .filter(Boolean)
  );

  const grants = new Set(
    [
      ...safeArray(source.permissions),
      ...permissionValues
    ]
      .map(value => clean(value).toLowerCase())
      .filter(Boolean)
  );

  const deny = new Set(
    [...grants]
      .filter(value => value.startsWith("deny:"))
      .map(value => value.slice(5))
  );

  function hasGrant(key) {
    const resolved = clean(key).toLowerCase();
    if (!resolved || deny.has(resolved)) return false;
    return grants.has(resolved) || grants.has(`purchase:${resolved}`) || grants.has("purchase:*");
  }

  return {
    actorId: clean(actor.employeeId || actor.userId || actor.id || actor.passportId),
    actorLabel: clean(actor.displayName || actor.name || actor.label) || "Employee",
    roles: [...roles],
    grants,
    hasGrant,
    request: source.request !== false && !deny.has("request"),
    approvalLimit: number(source.approvalLimit),
    directPoLimit: number(source.directPoLimit),
    varianceLimit: number(source.varianceLimit),
    seeCosts: source.seeCosts === true || hasGrant("see-costs"),
    canIssuePo: source.canIssuePo === true || hasGrant("issue-po"),
    canReceive: source.canReceive === true || hasGrant("receive"),
    canMatchBill: source.canMatchBill === true || hasGrant("match-bill"),
    canVoid: source.canVoid === true || hasGrant("void-po"),
    canReopen: source.canReopen === true || hasGrant("reopen")
  };
}

function roleMatches(roles = [], allowedRoles = []) {
  const roleSet = new Set(roles.map(normalizeRole));
  return safeArray(allowedRoles).map(normalizeRole).some(role => roleSet.has(role));
}

function thresholdForAmount(thresholds = [], amount = 0) {
  const value = Math.max(0, number(amount));
  return safeArray(thresholds).find(entry => {
    const min = number(entry?.min);
    const max = entry?.max === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : number(entry?.max);
    return value >= min && value <= max;
  }) || null;
}

export function getIXIPurchaseApprovalRequirement(policy = DEFAULT_IXI_PURCHASING_POLICY, amount = 0) {
  const resolvedPolicy = mergePolicy(policy);
  const threshold = thresholdForAmount(resolvedPolicy.approval.thresholds, amount);

  return threshold
    ? {
        required: true,
        role: normalizeRole(threshold.role),
        label: clean(threshold.label || threshold.role),
        amount: Math.max(0, number(amount)),
        authorityCeiling: threshold.max
      }
    : {
        required: false,
        role: "",
        label: "",
        amount: Math.max(0, number(amount)),
        authorityCeiling: 0
      };
}

export function getIXIPurchaseQuoteRequirement(policy = DEFAULT_IXI_PURCHASING_POLICY, amount = 0) {
  const resolvedPolicy = mergePolicy(policy);
  const applicable = safeArray(resolvedPolicy.request.quoteThresholds)
    .filter(entry => Math.max(0, number(amount)) >= number(entry.amount))
    .sort((left, right) => number(right.amount) - number(left.amount))[0];

  return {
    requiredQuotes: applicable ? Math.max(0, Math.floor(number(applicable.quotes))) : 0,
    threshold: applicable ? number(applicable.amount) : 0
  };
}

export function evaluateIXIPurchaseRuntime({
  context = {},
  purchase = {},
  policy = null,
  authority = null
} = {}) {
  const resolvedPolicy = resolveIXIPurchasingPolicy(context, policy);
  const resolvedAuthority = resolveIXIPurchaseAuthority(context, authority);
  const amount = number(
    purchase?.costs?.committed ||
    purchase?.financial?.committedAmount ||
    purchase?.purchase?.estimatedTotal ||
    purchase?.costs?.estimated ||
    0
  );
  const status = clean(purchase?.status || "draft").toLowerCase();
  const approval = getIXIPurchaseApprovalRequirement(resolvedPolicy, amount);
  const quoteRequirement = getIXIPurchaseQuoteRequirement(resolvedPolicy, amount);
  const roles = resolvedAuthority.roles;

  const roleDirectLimit = roles.reduce(
    (highest, role) => Math.max(highest, number(resolvedPolicy.directPo.roleLimits?.[normalizeRole(role)])),
    0
  );
  const directPoLimit = Math.max(roleDirectLimit, resolvedAuthority.directPoLimit);
  const approvalLimit = Math.max(resolvedAuthority.approvalLimit, ...roles.map(role => {
    const matches = safeArray(resolvedPolicy.approval.thresholds).filter(entry => normalizeRole(entry.role) === normalizeRole(role));
    return matches.reduce((highest, entry) => Math.max(highest, entry.max === Number.POSITIVE_INFINITY ? Number.MAX_SAFE_INTEGER : number(entry.max)), 0);
  }));

  const canApprove =
    resolvedAuthority.hasGrant("approve") ||
    approvalLimit >= amount ||
    roleMatches(roles, [approval.role]);
  const canDirectPo =
    resolvedAuthority.canIssuePo ||
    resolvedAuthority.hasGrant("direct-po") ||
    directPoLimit >= amount;
  const canReceive =
    resolvedAuthority.canReceive ||
    roleMatches(roles, resolvedPolicy.receiving.allowedRoles);
  const canReceiveOver =
    resolvedAuthority.hasGrant("receive-over") ||
    roleMatches(roles, resolvedPolicy.receiving.overReceiptRoles);
  const canSubstitute =
    resolvedAuthority.hasGrant("accept-substitution") ||
    roleMatches(roles, resolvedPolicy.receiving.substitutionRoles);
  const canCloseShort =
    resolvedAuthority.hasGrant("close-short") ||
    roleMatches(roles, resolvedPolicy.receiving.closeShortRoles);
  const canSeeCosts =
    resolvedAuthority.seeCosts ||
    roleMatches(roles, resolvedPolicy.receiving.costVisibleRoles);
  const canMatchBill =
    resolvedAuthority.canMatchBill ||
    roleMatches(roles, resolvedPolicy.financial.billMatchRoles);
  const canVoid =
    resolvedAuthority.canVoid ||
    roleMatches(roles, resolvedPolicy.financial.voidRoles);
  const canReopen =
    resolvedAuthority.canReopen ||
    roleMatches(roles, resolvedPolicy.financial.reopenRoles);

  const variance = Math.abs(number(purchase?.costs?.variance || 0));
  const varianceRequirement = thresholdForAmount(resolvedPolicy.financial.varianceThresholds, variance);
  const canApproveVariance =
    variance === 0 ||
    resolvedAuthority.varianceLimit >= variance ||
    resolvedAuthority.hasGrant("approve-variance") ||
    roleMatches(roles, [varianceRequirement?.role]);

  const actions = new Set([IXI_PURCHASE_ACTIONS.ADD_NOTE]);

  if (["draft", "pending-approval", "returned"].includes(status)) {
    actions.add(IXI_PURCHASE_ACTIONS.EDIT_REQUEST);
    actions.add(IXI_PURCHASE_ACTIONS.CANCEL_REQUEST);
  }

  if (status === "pending-approval") {
    if (canApprove) {
      actions.add(IXI_PURCHASE_ACTIONS.DENY);
      actions.add(IXI_PURCHASE_ACTIONS.RETURN);
      actions.add(IXI_PURCHASE_ACTIONS.APPROVE);
    } else if (approvalLimit > 0) {
      actions.add(IXI_PURCHASE_ACTIONS.RECOMMEND);
    }
  }

  if (status === "approved") {
    if (resolvedAuthority.canIssuePo || canDirectPo || canApprove) {
      actions.add(IXI_PURCHASE_ACTIONS.ISSUE_PO);
    }
  }

  if (status === "po-issued") {
    actions.add(IXI_PURCHASE_ACTIONS.SEND_PO);
    if (canVoid) actions.add(IXI_PURCHASE_ACTIONS.VOID_PO);
  }

  if (["sent", "partially-received", "received"].includes(status)) {
    if (canReceive) actions.add(IXI_PURCHASE_ACTIONS.RECEIVE);
    if (canCloseShort) actions.add(IXI_PURCHASE_ACTIONS.CLOSE_SHORT);
    if (canVoid) actions.add(IXI_PURCHASE_ACTIONS.CANCEL_REMAINDER);
    if (canMatchBill) actions.add(IXI_PURCHASE_ACTIONS.MATCH_BILL);
  }

  if (status === "closed" && canReopen) {
    actions.add(IXI_PURCHASE_ACTIONS.REOPEN);
  }

  return {
    policy: resolvedPolicy,
    authority: resolvedAuthority,
    amount,
    status,
    approval,
    quoteRequirement,
    directPoLimit,
    approvalLimit,
    canApprove,
    canDirectPo,
    canReceive,
    canReceiveOver,
    canSubstitute,
    canCloseShort,
    canSeeCosts,
    canMatchBill,
    canApproveVariance,
    canVoid,
    canReopen,
    actions: [...actions]
  };
}

export default {
  DEFAULT_IXI_PURCHASING_POLICY,
  resolveIXIPurchasingPolicy,
  resolveIXIPurchaseAuthority,
  getIXIPurchaseApprovalRequirement,
  getIXIPurchaseQuoteRequirement,
  evaluateIXIPurchaseRuntime
};
