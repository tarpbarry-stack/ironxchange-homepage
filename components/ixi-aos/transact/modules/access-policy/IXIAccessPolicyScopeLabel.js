export function getAuthorityScopeLabel(type = "") {
  return type === "target-and-descendants" ? "THIS + DESCENDANTS" : "THIS OBJECT";
}
