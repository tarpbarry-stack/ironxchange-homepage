export function canAdministerAuthority(accessContext = {}) {
  const grants = accessContext?.principal?.directGrants || accessContext?.capabilities?.directGrants || [];
  return Array.isArray(grants) && grants.includes("authority.manage");
}
