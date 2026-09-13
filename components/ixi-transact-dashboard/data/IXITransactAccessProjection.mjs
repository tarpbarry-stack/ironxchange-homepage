const clean = value => String(value ?? "").trim();

// Capabilities are decisions returned by IX-Core. Do not infer an owner's
// authority from a label or reconstruct server roles in the browser.
export function normalizeIXITransactAccess(payload) {
  if (payload?.ok !== true || !payload.data) return payload;
  const data = payload.data;
  const capabilities = data.capabilities;
  if (!capabilities || typeof capabilities !== "object" || Array.isArray(capabilities)) return payload;
  const denied = new Set((data.deniedPermissions || []).map(clean));
  const permissions = Object.entries(capabilities)
    .filter(([action, allowed]) => allowed === true && !denied.has(action))
    .map(([action]) => action);
  return { ...payload, data: { ...data, explicitPermissions: data.permissions || [], permissions } };
}
