const clean = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();
const permissionsOf = (context) =>
  new Set(
    (Array.isArray(context?.permissions) ? context.permissions : []).map(clean),
  );
const has = (set, ...values) =>
  values.some((value) => set.has(value)) || set.has("financial.admin");

export function getIXIPayablesPolicy({ context = {}, payable = null } = {}) {
  const permissions = permissionsOf(context),
    recognized = Boolean(payable?.recognized),
    open = Number(payable?.balance) > 0;
  const canManage = has(
    permissions,
    "financial.document.patch",
    "financial.payables.manage",
  );
  const canSchedule =
    canManage &&
    has(permissions, "financial.payment.schedule", "financial.payment.create");
  const canPostPayment =
    recognized &&
    open &&
    !payable?.hold &&
    !payable?.disputed &&
    has(permissions, "financial.payment.create");
  const canApplyCredit =
    recognized &&
    open &&
    has(
      permissions,
      "financial.vendor-credit.apply",
      "financial.document.create",
    );
  return {
    canManage,
    canSchedule,
    canPostPayment,
    canApplyCredit,
    recognized,
    open,
  };
}
export default { getIXIPayablesPolicy };
