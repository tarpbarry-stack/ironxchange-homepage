import { paymentHistorySummary } from "../ixi-aos/transact/payments/IXIPaymentHistory.js";
import {
  paymentSummary,
  expensePaymentMethod,
} from "../ixi-aos/transact/payments/IXIPaymentModel.js";

// Read-only lifetime projection. Canonical documents remain the accounting authority.
const text = (value) => String(value ?? "").trim();
const lower = (value) => text(value).toLowerCase();
const array = (value) => (Array.isArray(value) ? value : []);
export const financialDocument = (value) =>
  value?.record?.financialDocument ||
  value?.financialDocument ||
  value?.document ||
  value ||
  {};
export const cents = (value) =>
  value === "" || value == null || !Number.isFinite(Number(value))
    ? null
    : Math.round((Number(value) + Number.EPSILON) * 100);
const inactive = new Set([
  "void",
  "voided",
  "reversed",
  "cancelled",
  "canceled",
  "rejected",
  "declined",
  "superseded",
]);
const pending = new Set([
  "draft",
  "submitted",
  "pending",
  "pending-approval",
  "changes-requested",
  "returned",
]);
const costTypes = new Set([
  "asset-acquisition",
  "expense",
  "bill",
  "supplier-invoice",
  "time-entry",
  "material-usage",
  "rental-expense",
  "freight",
  "freight-order",
]);
const containers = new Set([
  "work-order",
  "technology-work-order",
  "service-order",
  "settlement",
  "journal-entry",
  "payables-control",
  "collection",
]);
const commitments = new Set([
  "purchase-order",
  "purchase",
  "sales-order",
  "rental-income",
  "quote",
  "service-quote",
]);
const revenueTypes = new Set(["invoice", "service-invoice"]);

export function recordParty(doc = {}) {
  return text(
    doc.vendorName ||
      doc.customer?.name ||
      doc.customer?.label ||
      doc.vendor?.name ||
      doc.vendor?.label ||
      doc.billRecord?.bill?.vendorLabel ||
      doc.expenseRecord?.expense?.vendor ||
      doc.expense?.vendor ||
      doc.expenseDetails?.vendor ||
      (typeof doc.vendor === "string" ? doc.vendor : "") ||
      doc.partyName ||
      doc.counterpartyName ||
      doc.metadata?.customerName ||
      doc.metadata?.vendorName ||
      array(doc.references).find((item) =>
        ["vendor", "customer", "payee", "payer", "employee"].includes(
          lower(item.role),
        ),
      )?.label,
  );
}

export function recordDate(doc = {}) {
  return text(
    doc.occurredAt ||
      doc.expenseDate ||
      doc.invoiceDate ||
      doc.issuedAt ||
      doc.date,
  ).slice(0, 10);
}

export function recordAmountCents(doc = {}) {
  return cents(
    doc.totals?.total ??
      doc.totals?.amount ??
      doc.amount ??
      doc.assetAcquisition?.acquisition?.currentAcquisitionBasis ??
      doc.billRecord?.bill?.amount,
  );
}

export function moneyLabel(amount, currency = "USD") {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency}`;
  }
}

export function currentFinancialRecords(records = []) {
  const unique = new Map();
  for (const raw of array(records)) {
    const doc = financialDocument(raw);
    const id = text(doc.financialDocumentId);
    if (!id) continue;
    const revision = Number(
      raw?.record?.server?.revision ??
        raw?.server?.revision ??
        doc.revision ??
        0,
    );
    if (!unique.has(id) || unique.get(id).revision < revision)
      unique.set(id, { raw, doc, revision });
  }
  return [...unique.values()];
}

export function buildMachineLedger(
  records = [],
  { passportId = "", currency = "USD" } = {},
) {
  const current = currentFinancialRecords(records);
  const byId = new Map(
    current.map((item) => [item.doc.financialDocumentId, item.doc]),
  );
  const warnings = [];
  const rows = current.map(({ raw, doc, revision }) => {
    const row = {
      id: doc.financialDocumentId,
      title: text(
        doc.documentNumber ||
          doc.invoiceNumber ||
          doc.identity?.number ||
          doc.financialDocumentId,
      ),
      type: lower(doc.documentType),
      status: text(doc.financialState || doc.status || "active").toUpperCase(),
      party: recordParty(doc),
      date: recordDate(doc),
      dueDate: text(doc.dueDate || doc.dueAt).slice(0, 10),
      currency: text(doc.currency || currency).toUpperCase(),
      amountCents: recordAmountCents(doc),
      revision,
      sourceId: text(doc.sourceFinancialDocumentId),
      costCents: 0,
      revenueCents: 0,
      receivedCents: 0,
      paidCents: 0,
      pendingCents: 0,
      hours: 0,
      reason: "",
      review: false,
      raw,
      document: doc,
    };
    const review = (reason) => {
      row.review = true;
      row.reason = reason;
    };
    const state = lower(row.status);
    const treatment =
      doc.accountingTreatment || doc.metadata?.accountingTreatment || {};
    const source = byId.get(row.sourceId);
    const assetRefs = [
      ...new Set(
        [
          ...array(doc.references),
          ...array(doc.lines).flatMap((line) => array(line.references)),
        ]
          .filter((ref) => ["asset", "machine"].includes(lower(ref.role)))
          .map((ref) => text(ref.passportId))
          .filter(Boolean),
      ),
    ];
    if (inactive.has(state))
      row.reason = "Inactive record; no current financial effect";
    else if (passportId && assetRefs.length > 1)
      review("Shared across machines; allocation must be verified");
    else if (row.amountCents == null && !containers.has(row.type))
      review("Amount is missing");
    else if (pending.has(state)) {
      row.pendingCents = costTypes.has(row.type) ? row.amountCents || 0 : 0;
      row.reason = "Pending; excluded from actual totals";
    } else if (doc.metadata?.expenseCorrection === true) {
      if (!source || lower(source.documentType) !== "expense")
        review("Expense correction source is unavailable");
      else if (inactive.has(lower(source.financialState)))
        review("Correction references an inactive expense");
      else {
        const delta = cents(doc.expenseCorrection?.amountDelta);
        if (delta == null || delta !== row.amountCents)
          review("Expense correction amount does not reconcile");
        else {
          row.costCents = delta;
          row.reason = "Expense correction delta";
        }
      }
    } else if (row.type === "credit") {
      if (!source) review("Credit source is unavailable");
      else if (lower(source.currency || currency) !== lower(row.currency))
        review("Credit currency differs from its source");
      else if (inactive.has(lower(source.financialState)))
        review("Credit references an inactive transaction");
      else if (revenueTypes.has(lower(source.documentType))) {
        row.revenueCents =
          -Math.abs(row.amountCents) +
          (cents(doc.totals?.tax ?? doc.metadata?.commercialBreakdown?.tax) ||
            0);
        row.reason = "Customer credit, excluding stated tax";
      } else if (costTypes.has(lower(source.documentType))) {
        row.costCents = -Math.abs(row.amountCents);
        row.reason = "Vendor credit";
      } else review("Credit treatment requires review");
    } else if (row.type === "payment") {
      const direction = lower(doc.paymentDirection);
      if (direction === "inflow") row.receivedCents = row.amountCents;
      else if (direction === "outflow") row.paidCents = row.amountCents;
      else review("Payment direction is missing");
      if (!row.reason)
        row.reason = "Cash movement; does not create cost or revenue";
    } else if (containers.has(row.type))
      row.reason =
        "Control record; linked transactions carry financial effects";
    else if (commitments.has(row.type))
      row.reason = "Estimate or commitment; excluded from actual totals";
    else if (costTypes.has(row.type)) {
      if (
        treatment.createsIncurredExpense === false ||
        treatment.economicEvent === false
      ) {
        row.pendingCents = row.amountCents;
        row.reason = "Captured cost; not yet recognized";
      } else {
        row.costCents = row.amountCents;
        row.reason = "Recorded machine cost";
        if (row.type === "time-entry") {
          const hours = Number(
            doc.totals?.laborHours ?? doc.timeEntry?.time?.hours,
          );
          if (Number.isFinite(hours) && hours >= 0) row.hours = hours;
          else review("Labor hours are missing");
        }
      }
    } else if (revenueTypes.has(row.type)) {
      if (
        treatment.createsBilledRevenue === false ||
        treatment.economicEvent === false
      )
        row.reason = "Revenue is not yet invoiced";
      else {
        row.revenueCents =
          row.amountCents -
          (cents(doc.totals?.tax ?? doc.metadata?.commercialBreakdown?.tax) ||
            0);
        row.reason = "Invoiced revenue, excluding stated tax";
      }
    } else review("Financial treatment is not classified");
    if (!row.date) review("Transaction date is missing");
    return row;
  });

  const rowsById = new Map(rows.map((row) => [row.id, row]));
  const rowsBySource = new Map();
  for (const row of rows) {
    if (!rowsBySource.has(row.sourceId)) rowsBySource.set(row.sourceId, []);
    rowsBySource.get(row.sourceId).push(row);
  }
  // Only explicit replacement lineage can consume a cost. Equal amounts or matching
  // descriptions are never enough to identify two records as the same obligation.
  for (const row of rows) {
    const parent = rowsById.get(row.sourceId);
    if (
      row.costCents > 0 &&
      parent?.costCents > 0 &&
      ["bill", "supplier-invoice"].includes(row.type) &&
      ["expense", "freight", "freight-order", "rental-expense"].includes(
        parent.type,
      )
    ) {
      if (
        row.currency === parent.currency &&
        row.costCents === parent.costCents
      ) {
        parent.costCents = 0;
        parent.reason = `Cost represented by ${row.title}`;
      } else {
        row.review = true;
        row.reason = "Linked cost amounts require allocation review";
        row.costCents = 0;
      }
    }
  }

  const balances = new Map();
  for (const row of rows.filter((item) =>
    [
      "bill",
      "supplier-invoice",
      "expense",
      "invoice",
      "service-invoice",
    ].includes(item.type),
  )) {
    const linked = (rowsBySource.get(row.id) || []).filter(
      (item) =>
        !inactive.has(lower(item.status)) &&
        !pending.has(lower(item.status)) &&
        !item.review &&
        item.currency === row.currency,
    );
    const bill = ["bill", "supplier-invoice", "expense"].includes(row.type);
    if (bill) {
      const shared = paymentSummary(
        row.raw,
        (rowsBySource.get(row.id) || [])
          .filter((item) => item.currency === row.currency)
          .map((item) => item.raw),
      );
      const method = expensePaymentMethod(row.raw);
      const knownExpenseMethod = [
        "company-card",
        "company-cash",
        "other",
        "unpaid",
        "my-money",
      ].includes(method);
      const eligible =
        !inactive.has(lower(row.status)) &&
        !pending.has(lower(row.status)) &&
        row.costCents !== 0;
      if (shared && (row.type !== "expense" || knownExpenseMethod)) {
        row.openCents = eligible ? cents(shared.balance) : null;
        row.paymentStatus =
          shared.status === "PARTIALLY PAID" ? "PART PAID" : shared.status;
        row.paymentAction = shared.active
          ? shared.balance > 0
            ? "MARK PAID"
            : "PAYMENT DETAILS"
          : "";
        row.payable =
          eligible &&
          (row.type !== "expense" || ["unpaid", "my-money"].includes(method));
        if (eligible && shared.paidAtEntry && !shared.allPayments.length)
          row.paidCents = cents(shared.paid) || 0;
        balances.set(row.id, {
          open: row.openCents || 0,
          paid: cents(shared.paid),
          credited: cents(shared.credited),
          eligible,
        });
      } else if (eligible) {
        row.review = true;
        row.reason =
          "Expense payment method is missing; outstanding balance needs review";
      }
      continue;
    }
    const payments = linked.filter(
      (item) =>
        item.type === "payment" && (bill ? item.paidCents : item.receivedCents),
    );
    const legacyPaid = bill
      ? cents(row.document.billRecord?.payment?.amountPaid) || 0
      : 0;
    const paid = payments.length
      ? payments.reduce(
          (sum, item) => sum + (bill ? item.paidCents : item.receivedCents),
          0,
        )
      : legacyPaid;
    const credited = linked
      .filter((item) => item.type === "credit")
      .reduce((sum, item) => sum + Math.abs(item.amountCents || 0), 0);
    const eligible =
      !inactive.has(lower(row.status)) &&
      !pending.has(lower(row.status)) &&
      (bill ? row.costCents !== 0 : row.revenueCents !== 0);
    const open = eligible
      ? Math.max(0, (row.amountCents || 0) - paid - credited)
      : 0;
    balances.set(row.id, { open, paid, credited, eligible });
    row.openCents = eligible ? open : null;
    row.paymentStatus = eligible
      ? open === 0
        ? "PAID"
        : paid > 0
          ? "PART PAID"
          : "UNPAID"
      : "";
  }

  for (const row of rows) {
    if (["work-order", "technology-work-order", "service-order", "freight", "freight-order"].includes(row.type)) {
      row.paymentStatus = paymentHistorySummary(row.raw, rows.map(item => item.raw))?.status.replace("PARTIALLY PAID", "PART PAID") || "";
    }
  }

  rows.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const currencies = [...new Set(rows.map((row) => row.currency))].sort();
  const totals = {};
  for (const unit of currencies.length ? currencies : [currency]) {
    const matching = rows.filter((row) => row.currency === unit);
    const sum = (key) =>
      matching.reduce((total, row) => total + (row[key] || 0), 0);
    let running = 0;
    matching.forEach((row) => {
      running += row.costCents;
      row.runningCostCents = running;
    });
    totals[unit] = {
      costCents: sum("costCents"),
      revenueCents: sum("revenueCents"),
      receivedCents: sum("receivedCents"),
      paidCents: sum("paidCents"),
      pendingCents: sum("pendingCents"),
      marginCents: sum("revenueCents") - sum("costCents"),
      receivableCents: matching
        .filter((row) => revenueTypes.has(row.type))
        .reduce((sum, row) => sum + (row.openCents || 0), 0),
      payableCents: matching
        .filter((row) => row.payable)
        .reduce((sum, row) => sum + (row.openCents || 0), 0),
      hours: Math.round(sum("hours") * 10000) / 10000,
    };
  }
  const reviewRows = rows.filter((row) => row.review);
  if (reviewRows.length)
    warnings.push(
      `${reviewRows.length} record${reviewRows.length === 1 ? " requires" : "s require"} review. Totals reflect only classified financial effects.`,
    );
  if (currencies.length > 1)
    warnings.push(
      "Currencies are totaled separately; no exchange rate has been assumed.",
    );
  if (current.length !== array(records).length)
    warnings.push(
      "Repeated revisions were consolidated by financial document ID.",
    );
  return {
    rows,
    totals,
    currencies: Object.keys(totals),
    warnings,
    reviewRows,
    balances,
  };
}

export function filterMachineLedger(
  rows,
  {
    query = "",
    from = "",
    to = "",
    type = "",
    effect = "",
    direction = "desc",
  } = {},
) {
  const search = lower(query);
  function matchesEffect(row) {
    switch (effect) {
      case "review":
        return row.review;
      case "cost":
        return row.costCents !== 0;
      case "revenue":
        return row.revenueCents !== 0;
      case "received":
        return row.receivedCents !== 0;
      case "payable":
        return row.payable && row.openCents > 0;
      case "receivable":
        return revenueTypes.has(row.type) && row.openCents > 0;
      case "pending":
        return row.pendingCents !== 0;
      case "hours":
        return row.hours !== 0;
      default:
        return true;
    }
  }
  return rows
    .filter((row) => {
      const haystack = lower(
        [
          row.title,
          row.id,
          row.party,
          row.type,
          row.status,
          row.document.description,
          row.sourceId,
          row.amountCents == null ? "" : (row.amountCents / 100).toFixed(2),
        ].join(" "),
      );
      return (
        (!search || haystack.includes(search)) &&
        (!from || row.date >= from) &&
        (!to || (Boolean(row.date) && row.date <= to)) &&
        (!type || row.type === type) &&
        matchesEffect(row)
      );
    })
    .sort((a, b) =>
      direction === "asc"
        ? a.date.localeCompare(b.date) || a.id.localeCompare(b.id)
        : b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
    );
}
