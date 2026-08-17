export function getAuthorityPolicyStatus(policy) {
  return policy?.policyId ? "ACTIVE" : "NONE";
}
