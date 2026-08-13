/*
 * IXI FINANCIAL VALIDATION ENGINE
 *
 * PURPOSE
 * -------
 *
 * Performs structural validation across
 * IXI Financial records before they are:
 *
 * - persisted
 * - indexed
 * - rolled up
 * - synced
 * - exposed to accounting adapters
 *
 *
 * CORE RULE
 * ---------
 *
 * BAD FINANCIAL DATA SHOULD FAIL EARLY.
 *
 *
 * This engine validates:
 *
 * - financial IDs
 * - document identity
 * - line identity
 * - currencies
 * - references
 * - dates
 * - totals
 * - duplicate line IDs
 * - line/document consistency
 * - lifecycle sanity
 *
 *
 * IMPORTANT
 * ---------
 *
 * This engine does NOT:
 *
 * - authorize users
 * - persist to AWS
 * - infer missing relationships
 * - fix accounting mappings
 * - silently invent required data
 *
 * It reports problems.
 */


import {
  IXI_FINANCIAL_DOCUMENT_TYPES,
  IXI_FINANCIAL_DIRECTIONS,
  IXI_FINANCIAL_STATES,
  isIXIFinancialDocumentType,
  isIXIFinancialLineType,
  normalizeIXIFinancialCurrency
} from "./IXIFinancialTypes";


import {
  isIXIFinancialDocumentId,
  isIXIFinancialLineId
} from "./IXIFinancialIdentityEngine";


import {
  normalizeIXIFinancialDocument
} from "./IXIFinancialDocumentEngine";


import {
  normalizeIXIFinancialLine,
  roundIXIFinancialMoney,
  validateIXIFinancialLine
} from "./IXIFinancialLineEngine";


import {
  isIXIFinancialReference,
  normalizeIXIFinancialReference
} from "./IXIFinancialReferenceEngine";


/* =========================================================
   HELPERS
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
   RESULT HELPERS
   ========================================================= */

export function createIXIFinancialValidationResult({
  ok = true,
  errors = [],
  warnings = [],
  normalized = null,
  metadata = {}
} = {}) {

  return {
    ok:
      Boolean(
        ok
      ) &&
      safeArray(
        errors
      ).length ===
      0,

    errors:
      safeArray(
        errors
      ),

    warnings:
      safeArray(
        warnings
      ),

    normalized,

    metadata: {
      ...safeObject(
        metadata
      )
    }
  };
}


/* =========================================================
   DATE VALIDATION
   ========================================================= */

export function isValidIXIFinancialDate(
  value
) {

  const cleaned =
    clean(
      value
    );


  if (
    !cleaned
  ) {
    return true;
  }


  const parsed =
    new Date(
      cleaned
    );


  return !Number.isNaN(
    parsed.getTime()
  );
}


/* =========================================================
   CURRENCY VALIDATION
   ========================================================= */

export function isValidIXIFinancialCurrency(
  value
) {

  const currency =
    clean(
      value
    )
      .toUpperCase();


  return /^[A-Z]{3}$/.test(
    currency
  );
}


/* =========================================================
   REFERENCE VALIDATION
   ========================================================= */

export function validateIXIFinancialReference(
  reference = {}
) {

  const normalized =
    normalizeIXIFinancialReference(
      reference
    );


  const errors =
    [];


  if (
    !normalized.passportId
  ) {
    errors.push(
      "passportId is required."
    );
  }


  if (
    !normalized.role
  ) {
    errors.push(
      "reference role is required."
    );
  }


  if (
    normalized.passportId &&
    !normalized.referenceKey
  ) {
    errors.push(
      "referenceKey could not be created."
    );
  }


  if (
    !isIXIFinancialReference(
      normalized
    )
  ) {
    errors.push(
      "reference is invalid."
    );
  }


  return createIXIFinancialValidationResult({
    errors,

    normalized
  });
}


/* =========================================================
   LINE VALIDATION
   ========================================================= */

export function validateIXIFinancialLineStrict(
  line = {},
  {
    expectedDocumentId = "",
    expectedCurrency = ""
  } = {}
) {

  const normalized =
    normalizeIXIFinancialLine(
      line
    );


  const base =
    validateIXIFinancialLine(
      normalized
    );


  const errors = [
    ...safeArray(
      base.errors
    )
  ];


  const warnings =
    [];


  if (
    !isIXIFinancialLineId(
      normalized.financialLineId
    )
  ) {
    errors.push(
      "financialLineId is not a valid IXI Financial Line ID."
    );
  }


  if (
    !isIXIFinancialLineType(
      normalized.lineType
    )
  ) {
    errors.push(
      "lineType is invalid."
    );
  }


  if (
    expectedDocumentId &&
    normalized.financialDocumentId !==
      expectedDocumentId
  ) {
    errors.push(
      "financialDocumentId does not match parent document."
    );
  }


  if (
    expectedCurrency &&
    normalizeIXIFinancialCurrency(
      normalized.currency
    ) !==
    normalizeIXIFinancialCurrency(
      expectedCurrency
    )
  ) {
    errors.push(
      "line currency does not match parent document currency."
    );
  }


  if (
    !Number.isFinite(
      Number(
        normalized.amount
      )
    )
  ) {
    errors.push(
      "line amount must be finite."
    );
  }


  if (
    !Number.isFinite(
      Number(
        normalized.quantity
      )
    )
  ) {
    errors.push(
      "line quantity must be finite."
    );
  }


  if (
    Number(
      normalized.quantity
    ) <
    0
  ) {
    errors.push(
      "line quantity cannot be negative."
    );
  }


  if (
    !isValidIXIFinancialCurrency(
      normalized.currency
    )
  ) {
    errors.push(
      "line currency must be a 3-letter currency code."
    );
  }


  if (
    normalized.occurredAt &&
    !isValidIXIFinancialDate(
      normalized.occurredAt
    )
  ) {
    errors.push(
      "line occurredAt is not a valid date."
    );
  }


  safeArray(
    normalized.references
  ).forEach(
    (
      reference,
      index
    ) => {

      const result =
        validateIXIFinancialReference(
          reference
        );


      result.errors.forEach(
        error => {
          errors.push(
            `references[${index}]: ${error}`
          );
        }
      );
    }
  );


  if (
    normalized.direction ===
      IXI_FINANCIAL_DIRECTIONS
        .NEUTRAL &&
    normalized.amount !==
      0
  ) {
    warnings.push(
      "non-zero line has neutral financial direction."
    );
  }


  return createIXIFinancialValidationResult({
    errors,

    warnings,

    normalized
  });
}


/* =========================================================
   DUPLICATE LINE IDS
   ========================================================= */

export function getDuplicateIXIFinancialLineIds(
  lines = []
) {

  const counts =
    new Map();


  safeArray(
    lines
  ).forEach(
    line => {

      const id =
        clean(
          line
            ?.financialLineId
        );


      if (
        !id
      ) {
        return;
      }


      counts.set(
        id,
        (
          counts.get(
            id
          ) ||
          0
        ) +
        1
      );
    }
  );


  return Array.from(
    counts.entries()
  )
    .filter(
      ([
        ,
        count
      ]) =>
        count >
        1
    )
    .map(
      ([
        id
      ]) =>
        id
    );
}


/* =========================================================
   DOCUMENT DATE VALIDATION
   ========================================================= */

function validateDocumentDates(
  document,
  errors
) {

  const dates =
    safeObject(
      document.dates
    );


  Object.entries(
    dates
  ).forEach(
    ([
      key,
      value
    ]) => {

      if (
        value &&
        !isValidIXIFinancialDate(
          value
        )
      ) {
        errors.push(
          `dates.${key} is not a valid date.`
        );
      }
    }
  );
}


/* =========================================================
   DOCUMENT REFERENCES
   ========================================================= */

function validateDocumentReferences(
  document,
  errors
) {

  safeArray(
    document.references
  ).forEach(
    (
      reference,
      index
    ) => {

      const result =
        validateIXIFinancialReference(
          reference
        );


      result.errors.forEach(
        error => {
          errors.push(
            `references[${index}]: ${error}`
          );
        }
      );
    }
  );
}


/* =========================================================
   DOCUMENT LINE VALIDATION
   ========================================================= */

function validateDocumentLines(
  document,
  errors,
  warnings
) {

  const duplicateIds =
    getDuplicateIXIFinancialLineIds(
      document.lines
    );


  duplicateIds.forEach(
    id => {
      errors.push(
        `duplicate financialLineId: ${id}`
      );
    }
  );


  safeArray(
    document.lines
  ).forEach(
    (
      line,
      index
    ) => {

      const result =
        validateIXIFinancialLineStrict(
          line,
          {
            expectedDocumentId:
              document
                .financialDocumentId,

            expectedCurrency:
              document.currency
          }
        );


      result.errors.forEach(
        error => {
          errors.push(
            `lines[${index}]: ${error}`
          );
        }
      );


      result.warnings.forEach(
        warning => {
          warnings.push(
            `lines[${index}]: ${warning}`
          );
        }
      );
    }
  );
}


/* =========================================================
   TOTAL VALIDATION
   ========================================================= */

function validateDocumentTotals(
  document,
  errors
) {

  const lineTotal =
    roundIXIFinancialMoney(
      safeArray(
        document.lines
      ).reduce(
        (
          total,
          line
        ) =>
          total +
          Number(
            line.amount ||
            0
          ),
        0
      )
    );


  const documentTotal =
    roundIXIFinancialMoney(
      document
        .totals
        ?.total ||
      0
    );


  if (
    lineTotal !==
    documentTotal
  ) {
    errors.push(
      `document total ${documentTotal} does not equal line total ${lineTotal}.`
    );
  }
}


/* =========================================================
   BASIC LIFECYCLE SANITY
   ========================================================= */

function validateLifecycleSanity(
  document,
  warnings
) {

  const type =
    document.documentType;


  const state =
    document.financialState;


  if (
    type ===
      IXI_FINANCIAL_DOCUMENT_TYPES
        .PURCHASE_ORDER &&
    state ===
      IXI_FINANCIAL_STATES
        .PAID
  ) {
    warnings.push(
      "purchase order is directly marked paid; normally settlement occurs through linked bill/payment documents."
    );
  }


  if (
    (
      type ===
        IXI_FINANCIAL_DOCUMENT_TYPES
          .BILL ||
      type ===
        IXI_FINANCIAL_DOCUMENT_TYPES
          .SUPPLIER_INVOICE
    ) &&
    state ===
      IXI_FINANCIAL_STATES
        .COMMITTED
  ) {
    warnings.push(
      "bill/supplier invoice is marked committed instead of incurred/billed."
    );
  }


  if (
    type ===
      IXI_FINANCIAL_DOCUMENT_TYPES
        .INVOICE &&
    state ===
      IXI_FINANCIAL_STATES
        .COMMITTED
  ) {
    warnings.push(
      "customer invoice is marked committed; normally invoices represent billed revenue."
    );
  }
}


/* =========================================================
   STRICT DOCUMENT VALIDATION
   ========================================================= */

export function validateIXIFinancialDocumentStrict(
  document = {}
) {

  const normalized =
    normalizeIXIFinancialDocument(
      document
    );


  const errors =
    [];


  const warnings =
    [];


  if (
    !normalized.financialDocumentId
  ) {
    errors.push(
      "financialDocumentId is required."
    );
  }


  if (
    normalized.financialDocumentId &&
    !isIXIFinancialDocumentId(
      normalized.financialDocumentId
    )
  ) {
    errors.push(
      "financialDocumentId is not a valid IXI Financial Document ID."
    );
  }


  if (
    !isIXIFinancialDocumentType(
      normalized.documentType
    )
  ) {
    errors.push(
      "documentType is invalid."
    );
  }


  if (
    !isValidIXIFinancialCurrency(
      normalized.currency
    )
  ) {
    errors.push(
      "document currency must be a 3-letter currency code."
    );
  }


  validateDocumentDates(
    normalized,
    errors
  );


  validateDocumentReferences(
    normalized,
    errors
  );


  validateDocumentLines(
    normalized,
    errors,
    warnings
  );


  validateDocumentTotals(
    normalized,
    errors
  );


  validateLifecycleSanity(
    normalized,
    warnings
  );


  if (
    normalized.lines.length ===
    0
  ) {
    warnings.push(
      "document contains no financial lines."
    );
  }


  if (
    normalized.references.length ===
    0
  ) {
    warnings.push(
      "document contains no Passport references."
    );
  }


  return createIXIFinancialValidationResult({
    errors,

    warnings,

    normalized
  });
}


/* =========================================================
   COLLECTION VALIDATION
   ========================================================= */

export function validateIXIFinancialDocuments(
  documents = []
) {

  const results =
    safeArray(
      documents
    ).map(
      (
        document,
        index
      ) => {

        const result =
          validateIXIFinancialDocumentStrict(
            document
          );


        return {
          index,
          ...result
        };
      }
    );


  const documentIds =
    new Map();


  const collectionErrors =
    [];


  results.forEach(
    result => {

      const id =
        clean(
          result
            .normalized
            ?.financialDocumentId
        );


      if (
        !id
      ) {
        return;
      }


      documentIds.set(
        id,
        (
          documentIds.get(
            id
          ) ||
          0
        ) +
        1
      );
    }
  );


  Array.from(
    documentIds.entries()
  )
    .filter(
      ([
        ,
        count
      ]) =>
        count >
        1
    )
    .forEach(
      ([
        id
      ]) => {
        collectionErrors.push(
          `duplicate financialDocumentId: ${id}`
        );
      }
    );


  const invalidCount =
    results.filter(
      result =>
        !result.ok
    ).length;


  return {
    ok:
      invalidCount ===
        0 &&
      collectionErrors.length ===
        0,

    documentCount:
      results.length,

    invalidCount,

    errors:
      collectionErrors,

    results
  };
}


/* =========================================================
   PERSISTENCE GATE
   ========================================================= */

/*
 * This is the function AWS persistence will
 * eventually call before accepting a record.
 */

export function canPersistIXIFinancialDocument(
  document = {}
) {

  const validation =
    validateIXIFinancialDocumentStrict(
      document
    );


  return {
    allowed:
      validation.ok,

    errors:
      validation.errors,

    warnings:
      validation.warnings,

    document:
      validation.normalized
  };
}


/* =========================================================
   ASSERT VALID
   ========================================================= */

/*
 * Useful for server-side code where invalid
 * Financial data should immediately fail.
 */

export function assertValidIXIFinancialDocument(
  document = {}
) {

  const result =
    validateIXIFinancialDocumentStrict(
      document
    );


  if (
    !result.ok
  ) {

    const error =
      new Error(
        [
          "Invalid IXI Financial Document.",
          ...result.errors
        ].join(
          " "
        )
      );


    error.name =
      "IXIFinancialValidationError";


    error.validation =
      result;


    throw error;
  }


  return result.normalized;
}


/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

export default {
  createIXIFinancialValidationResult,

  isValidIXIFinancialDate,
  isValidIXIFinancialCurrency,

  validateIXIFinancialReference,

  validateIXIFinancialLineStrict,

  getDuplicateIXIFinancialLineIds,

  validateIXIFinancialDocumentStrict,
  validateIXIFinancialDocuments,

  canPersistIXIFinancialDocument,

  assertValidIXIFinancialDocument
};
