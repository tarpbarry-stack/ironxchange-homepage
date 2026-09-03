const clean = value => String(value ?? "").trim().toLowerCase();
const permissionsOf = context => new Set(
  (Array.isArray(context?.permissions) ? context.permissions : []).map(clean)
);
const rolesOf = context => new Set(
  (Array.isArray(context?.roles) ? context.roles : []).map(clean)
);
const has = (permissions, ...values) =>
  permissions.has("financial.admin") || values.some(value => permissions.has(value));

export function getIXIGeneralLedgerPolicy({ context = {} } = {}) {
  const permissions = permissionsOf(context);
  const roles = rolesOf(context);
  const accounting = roles.has("financial-accounting");
  const controller = roles.has("financial-controller");
  const admin = roles.has("financial-admin");
  const control = controller || admin;
  return {
    canView: accounting || control || has(permissions, "financial.gl.view", "financial.scope.snapshot.view"),
    canCreateJournal: accounting || control || has(permissions, "financial.gl.journal.create"),
    canPostJournal: accounting || control || has(permissions, "financial.gl.journal.post"),
    canReverseJournal: accounting || control || has(permissions, "financial.gl.journal.reverse"),
    canClosePeriod: control || has(permissions, "financial.gl.period.close"),
    canReopenPeriod: control || has(permissions, "financial.gl.period.reopen"),
    canManageRules: control || has(permissions, "financial.gl.posting-rules.manage"),
    canViewReports: accounting || control || has(permissions, "financial.reporting.view", "financial.gl.view")
  };
}

export default { getIXIGeneralLedgerPolicy };
