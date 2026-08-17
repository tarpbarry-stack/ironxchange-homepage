export default function IXIAccessPolicyRuleBadge({ effect = "allow" }) {
  const value = String(effect || "allow").trim().toLowerCase();
  return <span>{value === "deny" ? "DENY" : "ALLOW"}</span>;
}
