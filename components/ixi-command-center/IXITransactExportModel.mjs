import { financialDocument, moneyLabel } from "./IXITransactMachineLedger.mjs";

const text = (value) => String(value ?? "").trim();
export const exportColumns = Object.freeze([
  "Financial document ID",
  "Revision",
  "Record number",
  "Document type",
  "Transaction date",
  "Due date",
  "Party",
  "Status",
  "Payment status",
  "Currency",
  "Document amount",
  "Machine cost effect",
  "Revenue effect",
  "Money received",
  "Money paid",
  "Open balance",
  "Pending cost",
  "Labor hours",
  "Running lifetime machine cost",
  "Source financial document ID",
  "Object ID",
  "Passport ID",
  "Entity",
  "Financial treatment",
  "Review required",
]);

export function exportValues(row, context = {}, entity = {}) {
  const amount = (value) => (value == null ? null : value / 100);
  return [
    row.id,
    row.revision,
    row.title,
    row.type,
    row.date,
    row.dueDate,
    row.party,
    row.status,
    row.paymentStatus || "",
    row.currency,
    amount(row.amountCents),
    amount(row.costCents),
    amount(row.revenueCents),
    amount(row.receivedCents),
    amount(row.paidCents),
    amount(row.openCents),
    amount(row.pendingCents),
    row.hours,
    amount(row.runningCostCents),
    row.sourceId,
    context.sourceId || context.objectId || context.id || "",
    context.passportId || "",
    entity.displayName || entity.name || "",
    row.reason,
    row.review ? "YES" : "NO",
  ];
}

// Keep spreadsheet applications from interpreting vendor names or record numbers as formulas.
export function csvCell(value) {
  if (value == null) return '""';
  if (typeof value === "number")
    return Number.isFinite(value) ? String(value) : '""';
  let cell = String(value);
  if (/^[\s]*[=+@-]/.test(cell) || /^[\t\r\n]/.test(cell)) cell = `'${cell}`;
  return `"${cell.replace(/"/g, '""')}"`;
}

export function machineCsv(rows, context, entity) {
  return (
    "\uFEFF" +
    [exportColumns, ...rows.map((row) => exportValues(row, context, entity))]
      .map((values) => values.map(csvCell).join(","))
      .join("\r\n") +
    "\r\n"
  );
}

export function safeFileName(value, fallback = "transaction") {
  return (
    text(value)
      .normalize("NFKC")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "")
      .slice(0, 100) || fallback
  );
}

const privateKeys =
  /^(verification|storageKey|bucket|uploadUrl|downloadUrl|url|previewUrl|fileUrl|token|secret|authorization|financialBinding)$/i;
export function exportDocumentSnapshot(value) {
  if (Array.isArray(value)) return value.map(exportDocumentSnapshot);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !privateKeys.test(key))
        .map(([key, item]) => [key, exportDocumentSnapshot(item)]),
    );
  return value;
}

export function recordEvidence(doc = {}) {
  const lists = [
    doc.attachments,
    doc.expenseRecord?.attachments,
    doc.billRecord?.documents,
    doc.assetAcquisition?.documents,
    doc.salesOrder?.documents,
  ];
  const result = new Map();
  for (const list of lists)
    for (const item of Array.isArray(list) ? list : []) {
      const key =
        item.attachmentId ||
        item.documentId ||
        item.storageKey ||
        item.fileName;
      if (key && !result.has(key)) result.set(key, item);
    }
  return [...result.values()];
}

export function documentPrintFields(row) {
  const doc = financialDocument(row.raw || row.document);
  const fields = [
    ["Record", row.title],
    ["Type", row.type],
    ["Status", row.status],
    ["Party", row.party],
    ["Transaction date", row.date],
    ["Due date", row.dueDate],
    ["Currency", row.currency],
    ["Document amount", moneyLabel(row.amountCents, row.currency)],
    ["Machine cost effect", moneyLabel(row.costCents, row.currency)],
    ["Revenue effect", moneyLabel(row.revenueCents, row.currency)],
    ["Money received", moneyLabel(row.receivedCents, row.currency)],
    ["Money paid", moneyLabel(row.paidCents, row.currency)],
    ["Payment status", row.paymentStatus],
    [
      "Open balance",
      row.openCents == null ? "" : moneyLabel(row.openCents, row.currency),
    ],
    ["Labor hours", row.hours || ""],
    ["Treatment", row.reason],
    ["Description", doc.description],
    ["Notes", doc.memo],
    ["Payment method", doc.paymentMethod],
    ["Payment reference", doc.transactionReference || doc.externalReference],
    ["Source transaction", row.sourceId],
    ["Financial document ID", row.id],
    ["Revision", row.revision],
  ].filter(([, value]) => value !== "" && value != null);
  for (const [index, line] of (doc.lines || []).entries()) {
    fields.push([
      `Line ${index + 1}`,
      [
        line.description,
        line.lineType,
        line.quantity == null ? "" : `Quantity ${line.quantity}`,
        line.amount == null
          ? ""
          : moneyLabel(
              Math.round(Number(line.amount) * 100),
              line.currency || row.currency,
            ),
      ]
        .filter(Boolean)
        .join(" · "),
    ]);
  }
  for (const reference of doc.references || [])
    fields.push([
      text(reference.role) || "Reference",
      [reference.label, reference.passportId].filter(Boolean).join(" · "),
    ]);
  const embedded =
    doc.workOrder ||
    doc.technologyWorkOrder ||
    doc.techWorkOrder ||
    doc.assetAcquisition ||
    doc.expenseRecord ||
    doc.billRecord ||
    doc.salesOrder ||
    doc.assetSettlement ||
    doc.rentalIncome ||
    doc.rentalExpense ||
    doc.timeEntry ||
    doc.purchaseOrder ||
    doc.serviceQuote;
  const skip =
    /^(metadata|audit|financialBinding|identity|context|attachments|documents|references|relatedFinancialRecords|financialRecords)$/;
  function append(object, path = "Details", depth = 0) {
    if (depth > 7 || object == null) return;
    if (typeof object !== "object") {
      if (text(object)) fields.push([path, String(object)]);
      return;
    }
    for (const [key, value] of Object.entries(object))
      if (!skip.test(key) && !privateKeys.test(key))
        append(
          value,
          `${path} / ${key.replace(/([a-z])([A-Z])/g, "$1 $2")}`,
          depth + 1,
        );
  }
  append(embedded);
  for (const evidence of recordEvidence(doc))
    fields.push([
      "Supporting evidence",
      [
        evidence.fileName || evidence.title || evidence.attachmentId,
        evidence.status,
      ]
        .filter(Boolean)
        .join(" · "),
    ]);
  return fields;
}

export function transactionLink(context, row, origin) {
  const url = new URL("/transact", origin);
  url.searchParams.set("passport", context.passportId);
  if (row?.id) url.searchParams.set("record", row.id);
  return url.toString();
}
