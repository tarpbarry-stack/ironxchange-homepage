const clean = value => String(value ?? "").trim();
const safeArray = value => Array.isArray(value) ? value : [];

export function getIXITransactFinancialDocument(record = {}) {
  return record?.financialDocument || record?.record?.financialDocument || null;
}

function firstText(...values) {
  return values.map(clean).find(Boolean) || "";
}

function finiteMoney(...values) {
  for (const value of values) {
    if (value === "" || value === null || value === undefined) continue;
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
}

function documentParty(document = {}) {
  return firstText(
    document?.customer?.label,
    document?.customer?.name,
    document?.vendor?.label,
    document?.vendor?.name,
    document?.bill?.vendorLabel,
    document?.payee?.label,
    document?.payer?.label,
    document?.partyName,
    document?.counterpartyName,
    document?.metadata?.customerName,
    document?.metadata?.vendorName,
    document?.documentType
  );
}

function documentDate(record = {}, document = {}) {
  return firstText(
    document?.dueDate,
    document?.dueAt,
    document?.occurredAt,
    document?.issuedAt,
    document?.invoiceDate,
    document?.date,
    document?.createdAt,
    record?.server?.updatedAt,
    record?.updatedAt
  );
}

function documentAmount(document = {}) {
  return finiteMoney(
    document?.openBalance,
    document?.totals?.total,
    document?.totals?.amount,
    document?.amount,
    document?.bill?.amount,
    document?.assetAcquisition?.acquisition?.currentAcquisitionBasis,
    document?.assetSettlement?.settlement?.amount
  );
}

export function normalizeIXITransactPassportRecords(records = []) {
  return safeArray(records).flatMap((record, index) => {
    const document = getIXITransactFinancialDocument(record);
    if (!document) return [];
    const id = firstText(document.financialDocumentId, document.documentId, record?.id, `financial-${index}`);
    const type = clean(document.documentType || "financial-record").toLowerCase();

    return [{
      id,
      title: firstText(document.documentNumber, document.invoiceNumber, document.identity?.number, id),
      party: documentParty(document),
      date: documentDate(record, document) || "—",
      status: firstText(document.financialState, document.status, document.paymentStatus, "ACTIVE").toUpperCase(),
      amount: documentAmount(document),
      type,
      raw: record,
      document
    }];
  }).sort((left, right) => {
    const leftDate = Date.parse(left.date) || 0;
    const rightDate = Date.parse(right.date) || 0;
    return rightDate - leftDate;
  });
}

const WORKSPACE_TYPES = Object.freeze({
  purchasing: new Set(["purchase-order", "asset-acquisition"]),
  sales: new Set(["quote", "service-quote", "sales-order", "invoice", "collection", "settlement"]),
  ar: new Set(["invoice", "collection", "credit"]),
  ap: new Set(["bill", "supplier-invoice", "payables-control", "credit"]),
  treasury: new Set(["treasury-account", "treasury-reconciliation", "payment", "collection", "credit"]),
  gl: new Set(["journal-entry", "period-close", "period-reopen", "posting-rule"])
});

export function getIXITransactWorkspaceRecords(records = [], workspace = "records") {
  const normalized = normalizeIXITransactPassportRecords(records);
  if (["records", "work"].includes(clean(workspace).toLowerCase())) return normalized;
  const allowed = WORKSPACE_TYPES[clean(workspace).toLowerCase()];
  if (!allowed) return [];
  return normalized.filter(record => {
    if (allowed.has(record.type)) return true;
    if (workspace === "ar" && record.type === "payment") {
      return clean(record.document?.paymentDirection).toLowerCase() === "inflow";
    }
    if (workspace === "ap" && record.type === "payment") {
      return clean(record.document?.paymentDirection).toLowerCase() === "outflow";
    }
    return false;
  });
}

export function getIXITransactActionableRecords(records = []) {
  const terminal = /^(PAID|POSTED|CLOSED|COMPLETE|COMPLETED|CANCELED|CANCELLED|VOID)$/;
  return normalizeIXITransactPassportRecords(records).filter(record => !terminal.test(record.status));
}
