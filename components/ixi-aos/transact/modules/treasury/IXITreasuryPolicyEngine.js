const clean = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();
const setOf = (context) =>
  new Set(
    (Array.isArray(context?.permissions) ? context.permissions : []).map(clean),
  );
const has = (set, ...permissions) =>
  permissions.some((permission) => set.has(permission)) ||
  set.has("financial.admin");
export function getIXITreasuryPolicy({ context = {} } = {}) {
  const permissions = setOf(context);
  return {
    canManageAccounts: has(permissions, "financial.treasury.manage"),
    canPostMovements: has(permissions, "financial.treasury.movement.post"),
    canReconcile: has(permissions, "financial.treasury.reconcile"),
  };
}
export default { getIXITreasuryPolicy };
