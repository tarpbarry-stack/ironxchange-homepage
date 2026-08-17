export function getAccessPolicyPassportId(object = {}, context = {}) {
  return String(object?.passportId || object?.ixiPassportId || object?.passport?.passportId || context?.primary?.passportId || context?.passportId || "").trim();
}
