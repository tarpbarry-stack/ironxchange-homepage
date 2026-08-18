const clean = value => String(value ?? "").trim();

const ADMIN_CAPABILITIES = Object.freeze({
  READ: "admin.read",
  COMMAND: "admin.command",
  OBJECTS_READ: "admin.objects.read",
  OBJECTS_REPAIR: "admin.objects.repair",
  ACCOUNTS_READ: "admin.accounts.read",
  ACCOUNTS_FREEZE: "admin.accounts.freeze",
  MARKETPLACE_READ: "admin.marketplace.read",
  MARKETPLACE_COMMAND: "admin.marketplace.command",
  ACQUISITION_READ: "admin.acquisition.read",
  ACQUISITION_RETRY: "admin.acquisition.retry",
  MEDIA_READ: "admin.media.read",
  MEDIA_RETRY: "admin.media.retry",
  FINANCIAL_READ: "admin.financial.read",
  FINANCIAL_APPROVE: "admin.financial.approve",
  INFRASTRUCTURE_READ: "admin.infrastructure.read",
  INFRASTRUCTURE_COMMAND: "admin.infrastructure.command",
  AUDIT_READ: "admin.audit.read"
});

function getCapabilities(accessContext = {}) {
  const candidates = [
    accessContext.capabilities,
    accessContext.permissions,
    accessContext.authority?.capabilities,
    accessContext.policy?.capabilities,
    accessContext.data?.capabilities
  ];

  return Array.from(new Set(candidates.flatMap(value => Array.isArray(value) ? value : []).map(clean).filter(Boolean)));
}

function hasAdminCapability(accessContext, capability) {
  const capabilities = getCapabilities(accessContext);
  return capabilities.includes("admin.*") || capabilities.includes(capability);
}

function requireAdminCapability(accessContext, capability) {
  if (!hasAdminCapability(accessContext, capability)) {
    const error = new Error(`Missing Admin Daddy capability: ${capability}`);
    error.code = "ADMIN_DADDY_AUTHORITY_DENIED";
    error.statusCode = 403;
    throw error;
  }
  return true;
}

module.exports = {
  ADMIN_CAPABILITIES,
  getCapabilities,
  hasAdminCapability,
  requireAdminCapability
};
