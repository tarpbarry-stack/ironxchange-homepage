const clean = value => String(value ?? "").trim();
const arr = value => Array.isArray(value) ? value : [];
const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const money = value => Math.round(num(value) * 100) / 100;

export const IXI_COLLECTIONS_SCHEMA = "ixi-collections-case-v1";
export const IXI_COLLECTIONS_STATUSES = Object.freeze(["open","promise-pending","disputed","escalated","resolved","closed"]);

export function createIXICollectionCase({ context = {}, receivable = {}, input = {} } = {}) {
  const now = new Date().toISOString();
  return {
    schema: IXI_COLLECTIONS_SCHEMA,
    identity: {
      collectionId: clean(input.collectionId),
      number: clean(input.number),
      clientRequestId: clean(input.clientRequestId) || `COLL-${Date.now()}`
    },
    receivable: {
      invoiceId: clean(receivable.invoiceId),
      invoiceNumber: clean(receivable.invoiceNumber),
      invoiceType: clean(receivable.invoiceType),
      originalAmount: money(receivable.originalAmount),
      openBalance: money(receivable.balance),
      dueDate: clean(receivable.dueDate),
      agingBucket: clean(receivable.agingBucket),
      daysPastDue: num(receivable.daysPastDue)
    },
    customer: {
      passportId: clean(receivable.customerPassportId),
      customerId: clean(receivable.customerId),
      label: clean(receivable.customerLabel)
    },
    context: {
      primaryPassportId: clean(context.primary?.passportId),
      primaryObjectId: clean(context.primary?.objectId),
      primaryObjectType: clean(context.primary?.objectType),
      primaryLabel: clean(context.primary?.label),
      entityPassportId: clean(context.entity?.passportId),
      entityLabel: clean(context.entity?.label),
      actorPassportId: clean(context.actor?.passportId),
      actorId: clean(context.actor?.employeeId || context.actor?.userId || context.actor?.id),
      actorLabel: clean(context.actor?.displayName || context.actor?.name || context.actor?.label)
    },
    assignment: {
      ownerId: clean(input.ownerId || context.actor?.employeeId || context.actor?.id),
      ownerLabel: clean(input.ownerLabel || context.actor?.displayName || context.actor?.name || context.actor?.label),
      priority: clean(input.priority || "normal"),
      nextActionAt: clean(input.nextActionAt)
    },
    promises: arr(input.promises),
    disputes: arr(input.disputes),
    contacts: arr(input.contacts),
    escalations: arr(input.escalations),
    status: "open",
    audit: {
      createdAt: now,
      createdBy: clean(context.actor?.passportId || context.actor?.employeeId || context.actor?.id),
      createdByLabel: clean(context.actor?.displayName || context.actor?.name || context.actor?.label),
      updatedAt: now
    },
    activity: []
  };
}

export function validateIXICollectionCase(record = {}) {
  const errors = {};
  if (!clean(record.receivable?.invoiceId)) errors.invoice = "required";
  if (!clean(record.customer?.label)) errors.customer = "required";
  return { valid: Object.keys(errors).length === 0, errors };
}

export default { IXI_COLLECTIONS_SCHEMA, IXI_COLLECTIONS_STATUSES, createIXICollectionCase, validateIXICollectionCase };
