import {
  createIXIAosObjectFinancialDocument,
  createIXIAosFinancialObjectReference,
  mergeIXIAosFinancialReferences,
} from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import { runIXIActionNoticeLifecycle } from "../../../../ixi-object-system/IXIActionNoticeEngine";
const clean = (value) => String(value ?? "").trim();
const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const requestId = (prefix) =>
  globalThis.crypto?.randomUUID?.() ||
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
function refs(context = {}, account = {}, object = {}) {
  const list = [];
  for (const [candidate, role] of [
    [context.primary || object, "object"],
    [context.entity || {}, "entity"],
    [context.location || {}, "location"],
    [context.actor || {}, "employee"],
  ]) {
    const ref = createIXIAosFinancialObjectReference({
      object: candidate,
      role,
    });
    if (ref) list.push(ref);
  }
  if (account?.identity?.accountId)
    list.push({
      passportId: clean(context.entity?.passportId),
      externalId: account.identity.accountId,
      role: "cash-account",
      label: account.account?.name || account.identity.number,
      objectType: "financial-account",
    });
  return mergeIXIAosFinancialReferences(list);
}
function stored(response = {}) {
  return response?.data?.record || response?.record || {};
}
function document(response = {}) {
  return (
    stored(response)?.financialDocument ||
    response?.financialDocument ||
    response?.document ||
    {}
  );
}
function responseId(response = {}) {
  return clean(
    document(response)?.financialDocumentId ||
      response?.documentId ||
      response?.id,
  );
}

export async function saveIXITreasuryAccount({
  object = {},
  context = {},
  account = {},
  signal,
} = {}) {
  const commandId = requestId("TR-ACCOUNT"),
    references = refs(context, account, object),
    response = await createIXIAosObjectFinancialDocument({
      object,
      documentType: "treasury-account",
      commandId,
      idempotencyKey: `ixi-treasury-account:${commandId}`,
      signal,
      input: {
        currency: clean(account.account?.currency || "USD"),
        occurredAt: clean(account.audit?.createdAt),
        treasuryAccount: account,
        references,
      },
      additionalReferences: references,
      metadata: { transactModule: "treasury", action: "account-create" },
    }),
    canonical = document(response)?.treasuryAccount || account,
    financialDocumentId = responseId(response);
  return {
    response,
    account: {
      ...canonical,
      identity: { ...canonical.identity, accountId: financialDocumentId },
      financialBinding: {
        financialDocumentId,
        revision: Number(stored(response)?.server?.revision || 1),
      },
    },
  };
}

async function post({
  object = {},
  context = {},
  account = {},
  input = {},
  transactionClass = "",
  paymentDirection = "",
  description = "",
  movement = {},
  metadata = {},
  signal,
} = {}) {
  const amount = Math.round(num(input.amount) * 100) / 100;
  if (!(amount > 0))
    throw new Error("Treasury amount must be greater than zero.");
  const commandId =
      clean(input.clientRequestId) || requestId(`TR-${transactionClass}`),
    references = refs(context, account, object),
    accountId = clean(account.identity?.accountId);
  if (!accountId)
    throw new Error("Treasury movement requires a canonical account.");
  return runIXIActionNoticeLifecycle({
    objectId: clean(
      context.primary?.objectId ||
        context.primary?.passportId ||
        object.objectId ||
        object.passportId,
    ),
    commandId,
    source: `ixi-transact-treasury-${transactionClass}`,
    savingMessage: "POSTING TO IXI FINANCIAL...",
    successMessage: "TREASURY POSTED",
    errorMessage: (error) => clean(error?.message) || "TREASURY POST FAILED",
    operation: () =>
      createIXIAosObjectFinancialDocument({
        object,
        documentType: "payment",
        commandId,
        idempotencyKey: `ixi-treasury:${commandId}`,
        signal,
        input: {
          currency: clean(
            input.currency || account.account?.currency || "USD",
          ).toUpperCase(),
          amount,
          financialState: "posted",
          paymentDirection,
          occurredAt: clean(input.date) || new Date().toISOString(),
          paymentMethod: clean(input.method || "book-entry"),
          transactionReference: clean(input.reference),
          description,
          references,
          treasuryMovement: {
            transactionClass,
            cashAccountFinancialDocumentId: accountId,
            evidenceReference: clean(input.reference),
            ...movement,
          },
        },
        additionalReferences: references,
        metadata: {
          ...metadata,
          transactModule: "treasury",
          transactionClass,
          accountFinancialDocumentId: accountId,
        },
      }),
  });
}

export async function postIXITreasuryOpeningBalance({
  object = {},
  context = {},
  account = {},
  metadata = {},
  signal,
} = {}) {
  if (account.opening?.posted)
    return {
      response: null,
      financialDocumentId: clean(account.opening?.financialDocumentId),
    };
  const openingAmount = Math.round(num(account.opening?.amount) * 100) / 100;
  if (openingAmount === 0) return { response: null, financialDocumentId: "" };
  const response = await post({
    object,
    context,
    account,
    input: {
      amount: Math.abs(openingAmount),
      date: account.opening?.effectiveDate,
      reference:
        account.opening?.reference || `OPEN-${clean(account.identity?.number)}`,
      currency: account.account?.currency,
      method: "opening-balance",
    },
    transactionClass: "opening-balance",
    paymentDirection: openingAmount < 0 ? "outflow" : "inflow",
    description: `Opening balance · ${account.account?.name}`,
    movement: { openingSource: clean(account.opening?.source) },
    metadata,
    signal,
  });
  return { response, financialDocumentId: responseId(response) };
}
export async function postIXITreasuryAdjustment({
  object = {},
  context = {},
  account = {},
  input = {},
  metadata = {},
  signal,
} = {}) {
  const amount = Math.round(num(input.amount) * 100) / 100;
  if (!(amount > 0))
    throw new Error("Adjustment amount must be greater than zero.");
  if (!clean(input.reason)) throw new Error("Adjustment reason is required.");
  if (!clean(input.reference))
    throw new Error("Adjustment reference is required.");
  const response = await post({
    object,
    context,
    account,
    input: {
      amount,
      date: input.date,
      reference: input.reference,
      currency: account.account?.currency,
      method: "adjustment",
    },
    transactionClass: "cash-adjustment",
    paymentDirection: clean(input.direction) === "out" ? "outflow" : "inflow",
    description: `Cash adjustment · ${clean(input.reason)}`,
    movement: { reason: clean(input.reason) },
    metadata,
    signal,
  });
  return { response, financialDocumentId: responseId(response) };
}
export async function postIXITreasuryTransfer({
  object = {},
  context = {},
  fromAccount = {},
  toAccount = {},
  input = {},
  metadata = {},
  signal,
} = {}) {
  const amount = Math.round(num(input.amount) * 100) / 100;
  if (!(amount > 0))
    throw new Error("Transfer amount must be greater than zero.");
  const fromId = clean(fromAccount.identity?.accountId),
    toId = clean(toAccount.identity?.accountId);
  if (!fromId || !toId)
    throw new Error("Both transfer accounts must be canonical.");
  if (fromId === toId) throw new Error("Transfer accounts must be different.");
  if (
    clean(fromAccount.account?.currency) !== clean(toAccount.account?.currency)
  )
    throw new Error("Transfer currencies must match.");
  if (!clean(input.reference))
    throw new Error("Transfer reference is required.");
  const response = await post({
    object,
    context,
    account: fromAccount,
    input: {
      amount,
      date: input.date,
      reference: input.reference,
      currency: fromAccount.account?.currency,
      method: "internal-transfer",
    },
    transactionClass: "account-transfer",
    paymentDirection: "outflow",
    description: `Transfer · ${fromAccount.account?.name} → ${toAccount.account?.name}`,
    movement: {
      cashAccountFinancialDocumentId: "",
      fromCashAccountFinancialDocumentId: fromId,
      toCashAccountFinancialDocumentId: toId,
      reason: "Internal cash transfer",
    },
    metadata,
    signal,
  });
  return { response, financialDocumentId: responseId(response) };
}

export async function postIXITreasuryReconciliation({
  object = {},
  context = {},
  account = {},
  reconciliation = {},
  signal,
} = {}) {
  const commandId = requestId("TR-RECON"),
    references = refs(context, account, object),
    response = await createIXIAosObjectFinancialDocument({
      object,
      documentType: "treasury-reconciliation",
      commandId,
      idempotencyKey: `ixi-treasury-reconciliation:${commandId}`,
      signal,
      input: {
        currency: clean(account.account?.currency || "USD"),
        occurredAt: clean(reconciliation.statement?.date),
        treasuryReconciliation: reconciliation,
        references,
      },
      additionalReferences: references,
      metadata: { transactModule: "treasury", action: "reconciliation" },
    }),
    canonical = document(response)?.treasuryReconciliation || reconciliation,
    financialDocumentId = responseId(response);
  return {
    response,
    reconciliation: {
      ...canonical,
      identity: {
        ...canonical.identity,
        reconciliationId: financialDocumentId,
      },
      financialBinding: {
        financialDocumentId,
        revision: Number(stored(response)?.server?.revision || 1),
      },
    },
  };
}
export default {
  saveIXITreasuryAccount,
  postIXITreasuryOpeningBalance,
  postIXITreasuryAdjustment,
  postIXITreasuryTransfer,
  postIXITreasuryReconciliation,
};
