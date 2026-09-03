const clean = (value) => String(value ?? "").trim();
const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const money = (value) => Math.round(num(value) * 100) / 100;
const arr = (value) => (Array.isArray(value) ? value : []);

function document(record = {}) {
  const envelope = record?.record || record;
  const source = envelope?.financialDocument || envelope?.document?.financialDocument || envelope?.document || envelope;
  return { ...source, metadata: { ...(envelope?.metadata || {}), ...(source?.metadata || {}) } };
}

function documentType(record = {}) {
  const source = document(record);
  return clean(
    source.documentType || source.type || source.metadata?.documentType,
  ).toLowerCase();
}

function documentId(record = {}) {
  const source = document(record);
  return clean(
    source.financialDocumentId ||
      source.documentId ||
      source.id ||
      source.identity?.invoiceId ||
      source.identity?.serviceInvoiceId ||
      source.identity?.saleId,
  );
}

function input(record = {}) {
  const source = document(record);
  return source.input || source;
}

function references(record = {}) {
  return arr(input(record).references || document(record).references);
}

function referenceByRole(record = {}, role = "") {
  return (
    references(record).find((ref) => clean(ref?.role).toLowerCase() === role) ||
    null
  );
}

function invoiceNumber(record = {}) {
  const source = input(record);
  return clean(
    source.invoiceNumber ||
      source.number ||
      record.identity?.number ||
      record.identity?.invoiceNumber ||
      record.metadata?.saleNumber ||
      record.metadata?.serviceInvoiceNumber ||
      documentId(record),
  );
}

function amount(record = {}) {
  const source = document(record);
  return money(
    source?.totals?.total ??
      source?.totals?.subtotal ??
      input(record).amount ??
      source.amount,
  );
}

function dateValue(record = {}) {
  const source = input(record);
  return clean(
    source.dueDate ||
      source.invoiceDueDate ||
      source.occurredAt ||
      source.invoiceDate ||
      record.dueDate ||
      record.createdAt ||
      record.audit?.createdAt,
  );
}

function relatedInvoiceId(record = {}) {
  const source = document(record);
  return clean(
    source.sourceFinancialDocumentId ||
      source.relatedInvoiceId ||
      source.invoiceId ||
      source.metadata?.invoiceId ||
      source.metadata?.relatedInvoiceId,
  );
}

function isReceivableInvoice(record = {}) {
  if (documentType(record) !== "invoice") return false;
  const source = input(record);
  const canonical = document(record);
  const state = clean(
    source.financialState || canonical.financialState,
  ).toLowerCase();
  const direction = clean(
    source.direction || canonical.direction,
  ).toLowerCase();
  return (
    state === "receivable" ||
    state === "open" ||
    direction === "out" ||
    Boolean(source.invoiceType) ||
    Boolean(canonical.metadata?.assetSale) ||
    Boolean(canonical.metadata?.serviceInvoice)
  );
}

function isIncomingPayment(record = {}) {
  if (documentType(record) !== "payment") return false;
  const source = document(record);
  return (
    clean(source.paymentDirection || source.direction).toLowerCase() ===
      "inflow" ||
    clean(source.direction).toLowerCase() === "in" ||
    clean(source.financialState).toLowerCase() === "received"
  );
}

function isReceivableCredit(record = {}) {
  if (documentType(record) !== "credit") return false;
  const source = document(record);
  return (
    source?.metadata?.arCredit === true ||
    clean(source.direction || "out").toLowerCase() !== "in"
  );
}

function parseDate(value = "") {
  if (!clean(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getIXIAgingBucket({
  dueDate = "",
  balance = 0,
  asOf = new Date(),
} = {}) {
  if (!(num(balance) > 0)) return "paid";
  const due = parseDate(dueDate);
  if (!due) return "current";
  const current = asOf instanceof Date ? asOf : new Date(asOf);
  const daysPastDue = Math.max(
    0,
    Math.floor((current.getTime() - due.getTime()) / 86400000),
  );
  if (daysPastDue <= 0) return "current";
  if (daysPastDue <= 30) return "1-30";
  if (daysPastDue <= 60) return "31-60";
  if (daysPastDue <= 90) return "61-90";
  return "90+";
}

export function getIXIDaysPastDue(dueDate = "", asOf = new Date()) {
  const due = parseDate(dueDate);
  if (!due) return 0;
  const current = asOf instanceof Date ? asOf : new Date(asOf);
  return Math.max(
    0,
    Math.floor((current.getTime() - due.getTime()) / 86400000),
  );
}

export function buildIXIReceivableProjection({
  financialRecords = [],
  collectionCases = [],
  asOf = new Date(),
} = {}) {
  const records = arr(financialRecords);
  const invoices = records.filter(isReceivableInvoice);
  const payments = records.filter(isIncomingPayment);
  const credits = records.filter(isReceivableCredit);

  const receivables = invoices.map((invoice) => {
    const id = documentId(invoice);
    const source = input(invoice);
    const customerRef = referenceByRole(invoice, "customer");
    const relatedPayments = payments.filter(
      (payment) => relatedInvoiceId(payment) === id,
    );
    const relatedCredits = credits.filter(
      (credit) => relatedInvoiceId(credit) === id,
    );
    const originalAmount = amount(invoice);
    const received = money(
      relatedPayments.reduce((sum, item) => sum + amount(item), 0),
    );
    const credited = money(
      relatedCredits.reduce((sum, item) => sum + amount(item), 0),
    );
    const balance = money(Math.max(0, originalAmount - received - credited));
    const dueDate = clean(
      source.dueDate || source.invoiceDueDate || invoice.dueDate,
    );
    const bucket = getIXIAgingBucket({ dueDate, balance, asOf });
    const daysPastDue = getIXIDaysPastDue(dueDate, asOf);
    const collectionCase =
      arr(collectionCases).find(
        (item) => clean(item.receivable?.invoiceId) === id,
      ) || null;
    return {
      invoiceId: id,
      invoiceNumber: invoiceNumber(invoice),
      invoiceType: clean(
        source.invoiceType ||
          document(invoice).metadata?.invoiceType ||
          "invoice",
      ),
      customerPassportId: clean(customerRef?.passportId),
      customerId: clean(customerRef?.externalId),
      customerLabel: clean(
        customerRef?.label ||
          source.customerName ||
          source.customerLabel ||
          "CUSTOMER",
      ),
      assetReference: referenceByRole(invoice, "asset"),
      entityReference: referenceByRole(invoice, "entity"),
      locationReference: referenceByRole(invoice, "location"),
      invoiceDate: clean(
        source.invoiceDate || source.occurredAt || invoice.createdAt,
      ),
      dueDate,
      currency: clean(source.currency || "USD").toUpperCase(),
      originalAmount,
      received,
      credited,
      balance,
      daysPastDue,
      agingBucket: bucket,
      status: balance <= 0 ? "paid" : daysPastDue > 0 ? "overdue" : "open",
      collectionCase,
      sourceInvoice: invoice,
      payments: relatedPayments,
      credits: relatedCredits,
    };
  });

  const totals = receivables.reduce(
    (acc, item) => {
      acc.totalAR = money(acc.totalAR + item.balance);
      if (item.agingBucket === "current")
        acc.current = money(acc.current + item.balance);
      if (item.agingBucket === "1-30")
        acc.days1to30 = money(acc.days1to30 + item.balance);
      if (item.agingBucket === "31-60")
        acc.days31to60 = money(acc.days31to60 + item.balance);
      if (item.agingBucket === "61-90")
        acc.days61to90 = money(acc.days61to90 + item.balance);
      if (item.agingBucket === "90+")
        acc.days90plus = money(acc.days90plus + item.balance);
      if (item.status === "overdue")
        acc.overdue = money(acc.overdue + item.balance);
      return acc;
    },
    {
      totalAR: 0,
      current: 0,
      days1to30: 0,
      days31to60: 0,
      days61to90: 0,
      days90plus: 0,
      overdue: 0,
    },
  );

  const customerMap = new Map();
  receivables.forEach((item) => {
    const key = clean(
      item.customerPassportId || item.customerId || item.customerLabel,
    ).toLowerCase();
    if (!customerMap.has(key))
      customerMap.set(key, {
        customerPassportId: item.customerPassportId,
        customerId: item.customerId,
        customerLabel: item.customerLabel,
        totalAR: 0,
        overdue: 0,
        oldestDays: 0,
        invoices: [],
      });
    const customer = customerMap.get(key);
    customer.totalAR = money(customer.totalAR + item.balance);
    if (item.status === "overdue")
      customer.overdue = money(customer.overdue + item.balance);
    customer.oldestDays = Math.max(customer.oldestDays, item.daysPastDue);
    customer.invoices.push(item);
  });

  return {
    receivables: receivables.sort(
      (a, b) => b.daysPastDue - a.daysPastDue || b.balance - a.balance,
    ),
    customers: Array.from(customerMap.values()).sort(
      (a, b) => b.overdue - a.overdue || b.totalAR - a.totalAR,
    ),
    totals,
  };
}

export default {
  buildIXIReceivableProjection,
  getIXIAgingBucket,
  getIXIDaysPastDue,
};
