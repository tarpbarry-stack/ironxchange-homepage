/*
 * IXI FINANCIAL DOCUMENT ENGINE
 *
 * PURPOSE
 * -------
 *
 * Creates, normalizes and validates the
 * recognizable business documents used
 * throughout the IXI AOS Financial system.
 *
 *
 * Examples:
 *
 * - expense
 * - purchase order
 * - work order
 * - bill
 * - supplier invoice
 * - invoice
 * - time entry
 * - labor entry
 * - payment
 * - journal entry
 *
 *
 * CORE RULE
 * ---------
 *
 * A financial document is the human-facing
 * business record.
 *
 * Financial lines carry the monetary math.
 *
 *
 * Example:
 *
 * WORK ORDER WO-44309
 *
 *   Labor             $1,260
 *   Hydraulic Pump    $3,840
 *   Outside Service     $650
 *
 * TOTAL               $5,750
 *
 *
 * The document total is derived from its
 * lines unless an authoritative explicit
 * total is deliberately supplied.
 *
 *
 * IMPORTANT
 * ---------
 *
 * This engine does NOT:
 *
 * - recursively roll money through Passports
 * - persist to AWS
 * - post to QuickBooks / Sage / NetSuite / SAP
 * - decide GL mappings
 * - infer the user's hierarchy
 */


import {
  IXI_FINANCIAL_APPROVAL_STATUS,
  IXI_FINANCIAL_DOCUMENT_STATUS,
  IXI_FINANCIAL_DOCUMENT_TYPES,
  IXI_FINANCIAL_ORIGINS,
  IXI_FINANCIAL_PAYMENT_STATUS,
  IXI_FINANCIAL_POSTING_STATUS,
  IXI_FINANCIAL_STATES,
  normalizeIXIFinancialCurrency,
  normalizeIXIFinancialDocumentStatus,
  normalizeIXIFinancialDocumentType,
  normalizeIXIFinancialState
} from "./IXIFinancialTypes";


import {
  createIXIFinancialIdentity,
  ensureIXIFinancialDocumentId,
  normalizeIXIFinancialDocumentNumber
} from "./IXIFinancialIdentityEngine";


import {
  dedupeIXIFinancialReferences
} from "./IXIFinancialReferenceEngine";


import {
  getIXIFinancialLineBreakdown,
  normalizeIXIFinancialLines,
  roundIXIFinancialMoney,
  sumIXIFinancialLines
} from "./IXIFinancialLineEngine";


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function clean(
  value
) {
  return String(
    value ??
    ""
  ).trim();
}


function safeArray(
  value
) {
  return Array.isArray(
    value
  )
    ? value
    : [];
}


function safeObject(
  value
) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  )
    ? value
    : {};
}


/* =========================================================
   ENUM NORMALIZERS
   ========================================================= */

function normalizeEnumValue(
  value,
  allowed,
  fallback
) {

  const cleaned =
    clean(
      value
    )
      .toLowerCase();


  return allowed.includes(
    cleaned
  )
    ? cleaned
    : fallback;
}


export function normalizeIXIFinancialApprovalStatus(
  value,
  fallback =
    IXI_FINANCIAL_APPROVAL_STATUS
      .NOT_REQUIRED
) {

  return normalizeEnumValue(
    value,
    Object.values(
      IXI_FINANCIAL_APPROVAL_STATUS
    ),
    fallback
  );
}


export function normalizeIXIFinancialPostingStatus(
  value,
  fallback =
    IXI_FINANCIAL_POSTING_STATUS
      .NOT_READY
) {

  return normalizeEnumValue(
    value,
    Object.values(
      IXI_FINANCIAL_POSTING_STATUS
    ),
    fallback
  );
}


export function normalizeIXIFinancialPaymentStatus(
  value,
  fallback =
    IXI_FINANCIAL_PAYMENT_STATUS
      .NOT_APPLICABLE
) {

  return normalizeEnumValue(
    value,
    Object.values(
      IXI_FINANCIAL_PAYMENT_STATUS
    ),
    fallback
  );
}


export function normalizeIXIFinancialOrigin(
  value,
  fallback =
    IXI_FINANCIAL_ORIGINS
      .IXI
) {

  return normalizeEnumValue(
    value,
    Object.values(
      IXI_FINANCIAL_ORIGINS
    ),
    fallback
  );
}


/* =========================================================
   DATE HELPERS
   ========================================================= */

export function normalizeIXIFinancialDate(
  value
) {

  const cleaned =
    clean(
      value
    );


  if (
    !cleaned
  ) {
    return "";
  }


  const parsed =
    new Date(
      cleaned
    );


  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return cleaned;
  }


  return parsed.toISOString();
}


/* =========================================================
   DOCUMENT TOTALS
   ========================================================= */

/*
 * V1 rule:
 *
 * Document monetary total comes from its
 * lines.
 *
 * This prevents:
 *
 * WORK ORDER TOTAL      $5,750
 * + line totals         $5,750
 * ----------------------------
 * incorrect             $11,500
 *
 *
 * The document is a wrapper.
 *
 * The lines own the value.
 */

export function calculateIXIFinancialDocumentTotals(
  lines = [],
  {
    currency = "USD"
  } = {}
) {

  const resolvedCurrency =
    normalizeIXIFinancialCurrency(
      currency
    );


  const normalizedLines =
    normalizeIXIFinancialLines(
      lines
    );


  const sameCurrencyLines =
    normalizedLines.filter(
      line =>
        line.currency ===
        resolvedCurrency
    );


  const total =
    sumIXIFinancialLines(
      sameCurrencyLines,
      {
        currency:
          resolvedCurrency
      }
    );


  const breakdown =
    getIXIFinancialLineBreakdown(
      sameCurrencyLines
    );


  const subtotal =
    roundIXIFinancialMoney(
      sameCurrencyLines.reduce(
        (
          running,
          line
        ) =>
          running +
          Number(
            line.subtotal ||
            0
          ),
        0
      )
    );


  const discountTotal =
    roundIXIFinancialMoney(
      sameCurrencyLines.reduce(
        (
          running,
          line
        ) =>
          running +
          Number(
            line.discountAmount ||
            0
          ),
        0
      )
    );


  const taxTotal =
    roundIXIFinancialMoney(
      sameCurrencyLines.reduce(
        (
          running,
          line
        ) =>
          running +
          Number(
            line.tax?.amount ||
            0
          ),
        0
      )
    );


  return {
    currency:
      resolvedCurrency,

    lineCount:
      sameCurrencyLines.length,

    subtotal,

    discountTotal,

    taxTotal,

    total,

    breakdown
  };
}


/* =========================================================
   APPROVAL BLOCK
   ========================================================= */

export function createIXIFinancialApproval({
  status =
    IXI_FINANCIAL_APPROVAL_STATUS
      .NOT_REQUIRED,

  requestedAt = "",

  requestedByPassportId = "",

  approvedAt = "",

  approvedByPassportId = "",

  rejectedAt = "",

  rejectedByPassportId = "",

  note = ""
} = {}) {

  return {
    status:
      normalizeIXIFinancialApprovalStatus(
        status
      ),

    requestedAt:
      normalizeIXIFinancialDate(
        requestedAt
      ),

    requestedByPassportId:
      clean(
        requestedByPassportId
      ),

    approvedAt:
      normalizeIXIFinancialDate(
        approvedAt
      ),

    approvedByPassportId:
      clean(
        approvedByPassportId
      ),

    rejectedAt:
      normalizeIXIFinancialDate(
        rejectedAt
      ),

    rejectedByPassportId:
      clean(
        rejectedByPassportId
      ),

    note:
      clean(
        note
      )
  };
}


/* =========================================================
   ACCOUNTING STATE
   ========================================================= */

export function createIXIFinancialAccountingState({
  postingStatus =
    IXI_FINANCIAL_POSTING_STATUS
      .NOT_READY,

  paymentStatus =
    IXI_FINANCIAL_PAYMENT_STATUS
      .NOT_APPLICABLE,

  postedAt = "",

  postedByPassportId = "",

  reconciledAt = "",

  reconciledByPassportId = "",

  accountingPeriod = "",

  externalRefs = []
} = {}) {

  return {
    postingStatus:
      normalizeIXIFinancialPostingStatus(
        postingStatus
      ),

    paymentStatus:
      normalizeIXIFinancialPaymentStatus(
        paymentStatus
      ),

    postedAt:
      normalizeIXIFinancialDate(
        postedAt
      ),

    postedByPassportId:
      clean(
        postedByPassportId
      ),

    reconciledAt:
      normalizeIXIFinancialDate(
        reconciledAt
      ),

    reconciledByPassportId:
      clean(
        reconciledByPassportId
      ),

    accountingPeriod:
      clean(
        accountingPeriod
      ),

    externalRefs:
      safeArray(
        externalRefs
      )
        .map(
          ref =>
            safeObject(
              ref
            )
        )
  };
}


/* =========================================================
   CREATE DOCUMENT
   ========================================================= */

export function createIXIFinancialDocument({
  financialDocumentId = "",

  documentType =
    IXI_FINANCIAL_DOCUMENT_TYPES
      .EXPENSE,

  documentNumber = "",

  title = "",

  description = "",

  status =
    IXI_FINANCIAL_DOCUMENT_STATUS
      .DRAFT,

  financialState =
    IXI_FINANCIAL_STATES
      .PLANNED,

  currency = "USD",

  documentDate = "",

  transactionDate = "",

  occurredAt = "",

  dueDate = "",

  createdAt = "",

  createdByPassportId = "",

  origin =
    IXI_FINANCIAL_ORIGINS
      .IXI,

  references = [],

  lines = [],

  approval = {},

  accountingState = {},

  memo = "",

  attachments = [],

  links = [],

  metadata = {}
} = {}) {

  const resolvedDocumentId =
    ensureIXIFinancialDocumentId(
      financialDocumentId
    );


  const resolvedCurrency =
    normalizeIXIFinancialCurrency(
      currency
    );


  const normalizedLines =
    normalizeIXIFinancialLines(
      lines
    ).map(
      line => ({
        ...line,

        financialDocumentId:
          resolvedDocumentId,

        currency:
          normalizeIXIFinancialCurrency(
            line.currency ||
            resolvedCurrency
          )
      })
    );


  const totals =
    calculateIXIFinancialDocumentTotals(
      normalizedLines,
      {
        currency:
          resolvedCurrency
      }
    );


  const identity =
    createIXIFinancialIdentity({
      financialId:
        resolvedDocumentId,

      recordType:
        "document",

      createdAt,

      createdByPassportId,

      origin:
        normalizeIXIFinancialOrigin(
          origin
        )
    });


  return {
    schema:
      identity.schema,

    schemaVersion:
      identity.schemaVersion,

    financialDocumentId:
      resolvedDocumentId,

    identity,

    documentType:
      normalizeIXIFinancialDocumentType(
        documentType
      ),

    documentNumber:
      normalizeIXIFinancialDocumentNumber(
        documentNumber
      ),

    title:
      clean(
        title
      ),

    description:
      clean(
        description
      ),

    status:
      normalizeIXIFinancialDocumentStatus(
        status
      ),

    financialState:
      normalizeIXIFinancialState(
        financialState
      ),

    currency:
      resolvedCurrency,

    dates: {
      documentDate:
        normalizeIXIFinancialDate(
          documentDate
        ),

      transactionDate:
        normalizeIXIFinancialDate(
          transactionDate
        ),

      occurredAt:
        normalizeIXIFinancialDate(
          occurredAt
        ),

      dueDate:
        normalizeIXIFinancialDate(
          dueDate
        ),

      createdAt:
        identity.createdAt
    },

    references:
      dedupeIXIFinancialReferences(
        references
      ),

    lines:
      normalizedLines,

    totals,

    approval:
      createIXIFinancialApproval(
        approval
      ),

    accountingState:
      createIXIFinancialAccountingState(
        accountingState
      ),

    memo:
      clean(
        memo
      ),

    attachments:
      safeArray(
        attachments
      ).map(
        attachment =>
          safeObject(
            attachment
          )
      ),

    links:
      safeArray(
        links
      ).map(
        link =>
          safeObject(
            link
          )
      ),

    metadata: {
      ...safeObject(
        metadata
      )
    }
  };
}


/* =========================================================
   NORMALIZE DOCUMENT
   ========================================================= */

export function normalizeIXIFinancialDocument(
  document = {}
) {

  const source =
    safeObject(
      document
    );


  return createIXIFinancialDocument({
    financialDocumentId:
      source.financialDocumentId,

    documentType:
      source.documentType,

    documentNumber:
      source.documentNumber,

    title:
      source.title,

    description:
      source.description,

    status:
      source.status,

    financialState:
      source.financialState,

    currency:
      source.currency,

    documentDate:
      source.dates
        ?.documentDate,

    transactionDate:
      source.dates
        ?.transactionDate,

    occurredAt:
      source.dates
        ?.occurredAt,

    dueDate:
      source.dates
        ?.dueDate,

    createdAt:
      source.dates
        ?.createdAt ||
      source.identity
        ?.createdAt,

    createdByPassportId:
      source.identity
        ?.createdByPassportId,

    origin:
      source.identity
        ?.origin,

    references:
      source.references,

    lines:
      source.lines,

    approval:
      source.approval,

    accountingState:
      source.accountingState,

    memo:
      source.memo,

    attachments:
      source.attachments,

    links:
      source.links,

    metadata:
      source.metadata
  });
}


/* =========================================================
   ADD LINE
   ========================================================= */

export function addIXIFinancialDocumentLine(
  document,
  line
) {

  const normalized =
    normalizeIXIFinancialDocument(
      document
    );


  return createIXIFinancialDocument({
    ...normalized,

    lines: [
      ...normalized.lines,
      line
    ],

    createdAt:
      normalized.identity
        ?.createdAt,

    createdByPassportId:
      normalized.identity
        ?.createdByPassportId,

    origin:
      normalized.identity
        ?.origin,

    documentDate:
      normalized.dates
        ?.documentDate,

    transactionDate:
      normalized.dates
        ?.transactionDate,

    occurredAt:
      normalized.dates
        ?.occurredAt,

    dueDate:
      normalized.dates
        ?.dueDate
  });
}


/* =========================================================
   REMOVE LINE
   ========================================================= */

export function removeIXIFinancialDocumentLine(
  document,
  financialLineId
) {

  const normalized =
    normalizeIXIFinancialDocument(
      document
    );


  const target =
    clean(
      financialLineId
    );


  return createIXIFinancialDocument({
    ...normalized,

    lines:
      normalized.lines.filter(
        line =>
          line.financialLineId !==
          target
      ),

    createdAt:
      normalized.identity
        ?.createdAt,

    createdByPassportId:
      normalized.identity
        ?.createdByPassportId,

    origin:
      normalized.identity
        ?.origin,

    documentDate:
      normalized.dates
        ?.documentDate,

    transactionDate:
      normalized.dates
        ?.transactionDate,

    occurredAt:
      normalized.dates
        ?.occurredAt,

    dueDate:
      normalized.dates
        ?.dueDate
  });
}


/* =========================================================
   REPLACE LINE
   ========================================================= */

export function updateIXIFinancialDocumentLine(
  document,
  financialLineId,
  patch = {}
) {

  const normalized =
    normalizeIXIFinancialDocument(
      document
    );


  const target =
    clean(
      financialLineId
    );


  const nextLines =
    normalized.lines.map(
      line => {

        if (
          line.financialLineId !==
          target
        ) {
          return line;
        }


        return {
          ...line,
          ...safeObject(
            patch
          ),

          financialLineId:
            line.financialLineId
        };
      }
    );


  return createIXIFinancialDocument({
    ...normalized,

    lines:
      nextLines,

    createdAt:
      normalized.identity
        ?.createdAt,

    createdByPassportId:
      normalized.identity
        ?.createdByPassportId,

    origin:
      normalized.identity
        ?.origin,

    documentDate:
      normalized.dates
        ?.documentDate,

    transactionDate:
      normalized.dates
        ?.transactionDate,

    occurredAt:
      normalized.dates
        ?.occurredAt,

    dueDate:
      normalized.dates
        ?.dueDate
  });
}


/* =========================================================
   DOCUMENT VALIDATION
   ========================================================= */

export function validateIXIFinancialDocument(
  document = {}
) {

  const normalized =
    normalizeIXIFinancialDocument(
      document
    );


  const errors =
    [];


  if (
    !normalized.financialDocumentId
  ) {
    errors.push(
      "financialDocumentId is required."
    );
  }


  if (
    !normalized.documentType
  ) {
    errors.push(
      "documentType is required."
    );
  }


  if (
    !normalized.currency
  ) {
    errors.push(
      "currency is required."
    );
  }


  normalized.lines.forEach(
    (
      line,
      index
    ) => {

      if (
        line.currency !==
        normalized.currency
      ) {
        errors.push(
          `Line ${index + 1} currency does not match document currency.`
        );
      }
    }
  );


  return {
    ok:
      errors.length ===
      0,

    errors,

    document:
      normalized
  };
}


/* =========================================================
   DOCUMENT TYPE HELPERS
   ========================================================= */

export function isIXIFinancialPurchaseOrder(
  document
) {

  return (
    normalizeIXIFinancialDocument(
      document
    ).documentType ===
    IXI_FINANCIAL_DOCUMENT_TYPES
      .PURCHASE_ORDER
  );
}


export function isIXIFinancialWorkOrder(
  document
) {

  return (
    normalizeIXIFinancialDocument(
      document
    ).documentType ===
    IXI_FINANCIAL_DOCUMENT_TYPES
      .WORK_ORDER
  );
}


export function isIXIFinancialExpense(
  document
) {

  return (
    normalizeIXIFinancialDocument(
      document
    ).documentType ===
    IXI_FINANCIAL_DOCUMENT_TYPES
      .EXPENSE
  );
}


export function isIXIFinancialBill(
  document
) {

  const type =
    normalizeIXIFinancialDocument(
      document
    ).documentType;


  return (
    type ===
      IXI_FINANCIAL_DOCUMENT_TYPES
        .BILL ||
    type ===
      IXI_FINANCIAL_DOCUMENT_TYPES
        .SUPPLIER_INVOICE
  );
}


export function isIXIFinancialInvoice(
  document
) {

  return (
    normalizeIXIFinancialDocument(
      document
    ).documentType ===
    IXI_FINANCIAL_DOCUMENT_TYPES
      .INVOICE
  );
}


/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

export default {
  normalizeIXIFinancialApprovalStatus,
  normalizeIXIFinancialPostingStatus,
  normalizeIXIFinancialPaymentStatus,
  normalizeIXIFinancialOrigin,

  normalizeIXIFinancialDate,

  calculateIXIFinancialDocumentTotals,

  createIXIFinancialApproval,
  createIXIFinancialAccountingState,

  createIXIFinancialDocument,
  normalizeIXIFinancialDocument,

  addIXIFinancialDocumentLine,
  removeIXIFinancialDocumentLine,
  updateIXIFinancialDocumentLine,

  validateIXIFinancialDocument,

  isIXIFinancialPurchaseOrder,
  isIXIFinancialWorkOrder,
  isIXIFinancialExpense,
  isIXIFinancialBill,
  isIXIFinancialInvoice
};
