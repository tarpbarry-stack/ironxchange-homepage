export function getAuthoritySubjectLabel(subject = {}) {
  return String(subject?.id || subject?.type || "").trim();
}
