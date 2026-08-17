export default function IXIAccessPolicyAuditBadge({ revision = 0 }) {
  return <span>{`REV ${Number(revision || 0)}`}</span>;
}
