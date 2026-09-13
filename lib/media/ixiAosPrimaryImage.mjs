const clean = value => String(value ?? "").trim();
const record = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};

// Cards and their lightweight container references must select the same
// persisted photo, including explicit per-media visibility restrictions.
export function getAosVisiblePrimaryImage(object = {}) {
  for (const item of Array.isArray(object?.media) ? object.media : []) {
    const permissions = {
      ...record(item?.access),
      ...record(item?.permissions),
      ...record(item?.effectivePermissions)
    };
    const deniedActions = permissions.deniedActions || permissions.deny || permissions.denied;
    const denied = new Set((Array.isArray(deniedActions) ? deniedActions : [])
      .map(value => clean(value).toLowerCase()));
    const aliases = ["view", "read", "canView", "canRead"];
    if (aliases.some(alias => permissions[alias] === false || denied.has(alias.toLowerCase()))) continue;
    const url = typeof item === "string" ? clean(item) : clean(item?.url || item?.src || item?.imageUrl);
    if (url) return url;
  }

  const fields = record(object?.fields);
  const metadata = record(object?.metadata);
  const definition = record(object?.definition || fields.definition || metadata.definition);
  const presentation = {
    ...record(definition.presentation),
    ...record(metadata.presentation),
    ...record(fields.presentation),
    ...record(object?.presentation)
  };
  return clean(object?.primaryImageUrl || fields.primaryImageUrl || metadata.primaryImageUrl || presentation.primaryImageUrl);
}
