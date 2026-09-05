const clean = value => String(value ?? "").trim();
const obj = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const arr = value => Array.isArray(value) ? value : [];

function money(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
}

function validDateOnly(value) {
  const candidate = clean(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return false;
  const date = new Date(`${candidate}T00:00:00`);
  return !Number.isNaN(date.getTime());
}

function normalizeCurrency(value) {
  return clean(value || "USD").toUpperCase();
}

export const IXI_EXPENSE_SCHEMA = "ixi-expense-v3";

export const IXI_EXPENSE_PAYMENT_METHODS = Object.freeze([
  "company-card",
  "company-cash",
  "my-money",
  "other"
]);

function normalizePaymentMethod(value = "") {
  const candidate = clean(value).toLowerCase();

  if (["personal-card", "personal", "employee-paid"].includes(candidate)) {
    return "my-money";
  }

  if (candidate === "cash") {
    return "company-cash";
  }

  return IXI_EXPENSE_PAYMENT_METHODS.includes(candidate) ? candidate : "";
}

export function createIXIExpenseDraft({
  context = {},
  workOrder = {},
  input = {}
} = {}) {
  const now = new Date().toISOString();
  const primary = obj(context.primary);
  const actor = obj(context.actor);
  const location = obj(context.location);
  const entity = obj(context.entity);
  const workOrderIdentity = obj(workOrder.identity);
  const paymentMethod = normalizePaymentMethod(input.paymentMethod || input.paidWith);
  const amount = money(input.amount);
  const employeePaid = paymentMethod === "my-money";
  const clientRequestId = clean(input.clientRequestId);
  const currency = normalizeCurrency(input.currency);

  return {
    schema: IXI_EXPENSE_SCHEMA,
    identity: {
      expenseId: clean(input.expenseId),
      number: clean(input.number),
      clientRequestId
    },
    context: {
      entityPassportId: clean(entity.passportId),
      primaryPassportId: clean(primary.passportId),
      primaryObjectId: clean(primary.objectId || primary.id),
      primaryObjectType: clean(primary.objectType),
      primaryLabel: clean(primary.label),
      locationPassportId: clean(location.passportId || context.locationPassportId),
      locationLabel: clean(location.label || context.locationLabel),
      workOrderId: clean(workOrderIdentity.workOrderId),
      workOrderNumber: clean(
        workOrderIdentity.number ||
          workOrder.workOrderNumber ||
          workOrder.number
      ),
      employeePassportId: clean(actor.passportId),
      employeeId: clean(actor.employeeId || actor.id || actor.userId),
      employeeLabel: clean(actor.displayName || actor.name || actor.label)
    },
    expense: {
      vendor: clean(input.vendor),
      description: clean(input.description),
      amount,
      currency,
      category: clean(input.category),
      costPurpose: clean(input.costPurpose || "other"),
      expenseDate: clean(input.expenseDate),
      paymentMethod,
      referenceNumber: clean(input.referenceNumber),
      notes: clean(input.notes),
      receiptRequired: Boolean(input.receiptRequired)
    },
    accounting: {
      category: clean(input.category),
      costPurpose: clean(input.costPurpose || "other"),
      glAccountCode: clean(input.glAccountCode),
      glAccountName: clean(input.glAccountName)
    },
    reimbursement: {
      required: employeePaid,
      employeePassportId: employeePaid ? clean(actor.passportId) : "",
      employeeId: employeePaid ? clean(actor.employeeId || actor.id || actor.userId) : "",
      employeeLabel: employeePaid ? clean(actor.displayName || actor.name || actor.label) : "",
      amount: employeePaid ? amount : 0,
      currency,
      status: employeePaid ? "owed" : "not-applicable"
    },
    attachments: arr(input.attachments),
    status: "draft",
    createdAt: now,
    createdBy: clean(actor.passportId || actor.userId || actor.employeeId || actor.id),
    revision: 1
  };
}

export function validateIXIExpense(expense = {}) {
  const details = obj(expense.expense);
  const reimbursement = obj(expense.reimbursement);
  const errors = {};

  if (!clean(expense.context?.primaryPassportId)) {
    errors.primary = "Originating AOS Passport is required";
  }

  if (!clean(details.vendor)) {
    errors.vendor = "Vendor is required";
  }

  if (!clean(details.description)) {
    errors.description = "Description is required";
  }

  if (!(Number(details.amount) > 0)) {
    errors.amount = "Amount must be greater than zero";
  }

  if (!clean(details.category)) {
    errors.category = "Category is required";
  }

  if (!clean(details.costPurpose)) {
    errors.costPurpose = "Cost purpose is required";
  }

  if (!validDateOnly(details.expenseDate)) {
    errors.expenseDate = clean(details.expenseDate)
      ? "Expense date is invalid"
      : "Expense date is required";
  }

  if (!/^[A-Z]{3}$/.test(clean(details.currency))) {
    errors.currency = "Currency must be a three-letter code";
  }

  if (!IXI_EXPENSE_PAYMENT_METHODS.includes(clean(details.paymentMethod))) {
    errors.paymentMethod = "Paid With is required";
  }

  if (details.receiptRequired && !arr(expense.attachments).length) {
    errors.receipt = "Receipt is required by company policy";
  }

  if (reimbursement.required) {
    if (!clean(reimbursement.employeePassportId) && !clean(reimbursement.employeeId)) {
      errors.reimbursementEmployee = "Employee identity is required for reimbursement";
    }

    if (!(Number(reimbursement.amount) > 0)) {
      errors.reimbursementAmount = "Reimbursement amount must be greater than zero";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export default {
  createIXIExpenseDraft,
  validateIXIExpense
};
