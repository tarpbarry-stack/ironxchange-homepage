// Shorten only the sidebar label; keep the canonical title and hours intact.
export function sidebarObjectTitle(context = {}) {
  const title = String(context.title || "");
  if (context.kind !== "machine") return title;
  return title.replace(/\s+(?:[-–—·|]\s*)?\d[\d,]*(?:\.\d+)?\s*(?:hrs?|hours?)\.?\s*$/i, "");
}

// A display reference never changes a saved financial document number or identity.
export function transactionDisplayTitle(document = {}, fallback = "") {
  const id = String(document.financialDocumentId || "");
  const number = String(
    document.documentNumber ||
      document.invoiceNumber ||
      document.identity?.number ||
      fallback ||
      "",
  ).trim();
  if (number && number !== id && !/^ifd_/i.test(number)) return number;
  const type = String(document.documentType || "transaction")
    .replaceAll("-", " ")
    .toUpperCase();
  return id ? `${type} · …${id.slice(-8).toUpperCase()}` : number || type;
}
