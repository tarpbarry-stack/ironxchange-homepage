/*
 * IXI FINANCIAL IDENTITY ENGINE
 *
 * PURPOSE
 * -------
 *
 * Gives permanent IXI identity to financial
 * records that are NOT Passport-bearing
 * AOS Objects.
 *
 *
 * Examples:
 *
 * Purchase Order
 *   IXF-DOC-...
 *
 * Work Order
 *   IXF-DOC-...
 *
 * Expense
 *   IXF-DOC-...
 *
 * Time Entry
 *   IXF-DOC-...
 *
 * Individual financial line
 *   IXF-LINE-...
 *
 *
 * CORE DOCTRINE
 * -------------
 *
 * Financial records do not receive
 * AOS Passports merely because they exist.
 *
 * Instead:
 *
 * PASSPORT-BEARING OBJECT
 *        ↓
 * financial document
 *        ↓
 * financial lines
 *
 *
 * The financial record has its own stable
 * IXI Financial ID.
 *
 * It attaches to one or more Passport IDs.
 *
 *
 * NEVER regenerate an ID for an existing
 * record.
 */


import {
  IXI_FINANCIAL_SCHEMA,
  IXI_FINANCIAL_SCHEMA_VERSION
} from "./IXIFinancialTypes";


/* =========================================================
   ID PREFIXES
   ========================================================= */

export const IXI_FINANCIAL_ID_PREFIXES = {
  DOCUMENT:
    "IXF-DOC",

  LINE:
    "IXF-LINE",

  PAYMENT:
    "IXF-PAY",

  JOURNAL:
    "IXF-JRN",

  BUDGET:
    "IXF-BUD",

  ALLOCATION:
    "IXF-ALLOC",

  ADJUSTMENT:
    "IXF-ADJ",

  AUDIT:
    "IXF-AUD",

  LINK:
    "IXF-LINK",

  ATTACHMENT:
    "IXF-ATT",

  EXTERNAL_REF:
    "IXF-EXT"
};


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


function upper(
  value
) {
  return clean(
    value
  ).toUpperCase();
}


/* =========================================================
   RANDOM ID SEGMENT
   ========================================================= */

/*
 * crypto.randomUUID() is preferred when
 * available.
 *
 * The fallback exists so this pure engine
 * remains usable in environments where
 * randomUUID is unavailable.
 *
 * The generated ID is NOT an accounting
 * document number.
 *
 * Example:
 *
 * IXF-DOC-A62F... 
 *
 * Customer-facing PO / WO / Invoice numbers
 * are separate fields.
 */
function createRandomSegment() {

  try {

    if (
      typeof globalThis !==
        "undefined" &&
      globalThis.crypto &&
      typeof globalThis.crypto
        .randomUUID ===
        "function"
    ) {

      return globalThis.crypto
        .randomUUID()
        .replace(
          /-/g,
          ""
        )
        .toUpperCase();
    }

  } catch {
    /*
     * Continue to fallback.
     */
  }


  const timestamp =
    Date.now()
      .toString(36)
      .toUpperCase();


  const randomA =
    Math.random()
      .toString(36)
      .slice(2)
      .toUpperCase();


  const randomB =
    Math.random()
      .toString(36)
      .slice(2)
      .toUpperCase();


  return [
    timestamp,
    randomA,
    randomB
  ]
    .join("")
    .replace(
      /[^A-Z0-9]/g,
      ""
    )
    .slice(
      0,
      32
    );
}


/* =========================================================
   CREATE ID
   ========================================================= */

export function createIXIFinancialId(
  prefix
) {

  const resolvedPrefix =
    upper(
      prefix
    )
      .replace(
        /[^A-Z0-9-]/g,
        ""
      );


  if (
    !resolvedPrefix
  ) {
    throw new Error(
      "IXI Financial ID prefix is required."
    );
  }


  return [
    resolvedPrefix,
    createRandomSegment()
  ].join("-");
}


/* =========================================================
   SPECIFIC ID CREATORS
   ========================================================= */

export function createIXIFinancialDocumentId() {
  return createIXIFinancialId(
    IXI_FINANCIAL_ID_PREFIXES
      .DOCUMENT
  );
}


export function createIXIFinancialLineId() {
  return createIXIFinancialId(
    IXI_FINANCIAL_ID_PREFIXES
      .LINE
  );
}


export function createIXIFinancialPaymentId() {
  return createIXIFinancialId(
    IXI_FINANCIAL_ID_PREFIXES
      .PAYMENT
  );
}


export function createIXIFinancialJournalId() {
  return createIXIFinancialId(
    IXI_FINANCIAL_ID_PREFIXES
      .JOURNAL
  );
}


export function createIXIFinancialBudgetId() {
  return createIXIFinancialId(
    IXI_FINANCIAL_ID_PREFIXES
      .BUDGET
  );
}


export function createIXIFinancialAllocationId() {
  return createIXIFinancialId(
    IXI_FINANCIAL_ID_PREFIXES
      .ALLOCATION
  );
}


export function createIXIFinancialAdjustmentId() {
  return createIXIFinancialId(
    IXI_FINANCIAL_ID_PREFIXES
      .ADJUSTMENT
  );
}


export function createIXIFinancialAuditId() {
  return createIXIFinancialId(
    IXI_FINANCIAL_ID_PREFIXES
      .AUDIT
  );
}


export function createIXIFinancialLinkId() {
  return createIXIFinancialId(
    IXI_FINANCIAL_ID_PREFIXES
      .LINK
  );
}


export function createIXIFinancialAttachmentId() {
  return createIXIFinancialId(
    IXI_FINANCIAL_ID_PREFIXES
      .ATTACHMENT
  );
}


export function createIXIFinancialExternalRefId() {
  return createIXIFinancialId(
    IXI_FINANCIAL_ID_PREFIXES
      .EXTERNAL_REF
  );
}


/* =========================================================
   ID VALIDATION
   ========================================================= */

export function isIXIFinancialId(
  value
) {

  const id =
    upper(
      value
    );


  return /^IXF-[A-Z]+-[A-Z0-9]+$/.test(
    id
  );
}


export function hasIXIFinancialPrefix(
  value,
  prefix
) {

  const id =
    upper(
      value
    );

  const resolvedPrefix =
    upper(
      prefix
    );


  if (
    !id ||
    !resolvedPrefix
  ) {
    return false;
  }


  return id.startsWith(
    `${resolvedPrefix}-`
  );
}


export function isIXIFinancialDocumentId(
  value
) {

  return hasIXIFinancialPrefix(
    value,
    IXI_FINANCIAL_ID_PREFIXES
      .DOCUMENT
  );
}


export function isIXIFinancialLineId(
  value
) {

  return hasIXIFinancialPrefix(
    value,
    IXI_FINANCIAL_ID_PREFIXES
      .LINE
  );
}


/* =========================================================
   PRESERVE OR CREATE
   ========================================================= */

/*
 * This is one of the most important rules
 * in the Financial Engine:
 *
 * EXISTING ID
 *   → preserve it
 *
 * NO ID
 *   → create one
 *
 * Never silently replace identity.
 */

export function ensureIXIFinancialDocumentId(
  value
) {

  const existing =
    clean(
      value
    );


  if (
    existing
  ) {
    return existing;
  }


  return createIXIFinancialDocumentId();
}


export function ensureIXIFinancialLineId(
  value
) {

  const existing =
    clean(
      value
    );


  if (
    existing
  ) {
    return existing;
  }


  return createIXIFinancialLineId();
}


export function ensureIXIFinancialAuditId(
  value
) {

  const existing =
    clean(
      value
    );


  if (
    existing
  ) {
    return existing;
  }


  return createIXIFinancialAuditId();
}


/* =========================================================
   FINANCIAL IDENTITY BLOCK
   ========================================================= */

/*
 * Standard identity metadata carried by
 * financial records.
 *
 * This does NOT contain:
 *
 * - amount
 * - accounting classification
 * - Passport relationships
 * - vendor
 * - customer
 * - document number
 *
 * Those belong to the record itself.
 */
export function createIXIFinancialIdentity({
  financialId = "",

  recordType = "",

  createdAt = "",

  createdByPassportId = "",

  origin = "ixi"
} = {}) {

  const resolvedCreatedAt =
    clean(
      createdAt
    ) ||
    new Date()
      .toISOString();


  return {
    schema:
      IXI_FINANCIAL_SCHEMA,

    schemaVersion:
      IXI_FINANCIAL_SCHEMA_VERSION,

    financialId:
      clean(
        financialId
      ),

    recordType:
      clean(
        recordType
      )
        .toLowerCase(),

    origin:
      clean(
        origin
      )
        .toLowerCase() ||
      "ixi",

    createdAt:
      resolvedCreatedAt,

    createdByPassportId:
      clean(
        createdByPassportId
      )
  };
}


/* =========================================================
   NORMALIZE FINANCIAL IDENTITY
   ========================================================= */

export function normalizeIXIFinancialIdentity(
  identity = {}
) {

  const source =
    identity &&
    typeof identity ===
      "object" &&
    !Array.isArray(
      identity
    )
      ? identity
      : {};


  return createIXIFinancialIdentity({
    financialId:
      source.financialId,

    recordType:
      source.recordType,

    createdAt:
      source.createdAt,

    createdByPassportId:
      source.createdByPassportId,

    origin:
      source.origin
  });
}


/* =========================================================
   CUSTOMER / EXTERNAL DOCUMENT NUMBERS
   ========================================================= */

/*
 * IXI identity and business document
 * number are intentionally separate.
 *
 * Example:
 *
 * financialDocumentId
 *   IXF-DOC-6A83...
 *
 * documentNumber
 *   PO-88217
 *
 *
 * The customer keeps their own numbers.
 * IXI keeps permanent internal identity.
 */

export function normalizeIXIFinancialDocumentNumber(
  value
) {

  return clean(
    value
  );
}


/* =========================================================
   EXTERNAL IDENTITY
   ========================================================= */

/*
 * External systems receive their own
 * identity records.
 *
 * Example:
 *
 * IXF-DOC-ABC...
 *      ↕
 * QuickBooks Bill ID 9381
 *
 *
 * NEVER replace the IXI financial ID with
 * an external accounting-system ID.
 */
export function createIXIFinancialExternalReference({
  externalRefId = "",

  system = "",

  connectionId = "",

  companyId = "",

  recordType = "",

  externalId = "",

  externalVersion = "",

  syncedAt = "",

  metadata = {}
} = {}) {

  return {
    externalRefId:
      clean(
        externalRefId
      ) ||
      createIXIFinancialExternalRefId(),

    system:
      clean(
        system
      )
        .toLowerCase(),

    connectionId:
      clean(
        connectionId
      ),

    companyId:
      clean(
        companyId
      ),

    recordType:
      clean(
        recordType
      ),

    externalId:
      clean(
        externalId
      ),

    externalVersion:
      clean(
        externalVersion
      ),

    syncedAt:
      clean(
        syncedAt
      ),

    metadata:
      metadata &&
      typeof metadata ===
        "object" &&
      !Array.isArray(
        metadata
      )
        ? {
            ...metadata
          }
        : {}
  };
}


/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

export default {
  IXI_FINANCIAL_ID_PREFIXES,

  createIXIFinancialId,

  createIXIFinancialDocumentId,
  createIXIFinancialLineId,
  createIXIFinancialPaymentId,
  createIXIFinancialJournalId,
  createIXIFinancialBudgetId,
  createIXIFinancialAllocationId,
  createIXIFinancialAdjustmentId,
  createIXIFinancialAuditId,
  createIXIFinancialLinkId,
  createIXIFinancialAttachmentId,
  createIXIFinancialExternalRefId,

  isIXIFinancialId,
  hasIXIFinancialPrefix,
  isIXIFinancialDocumentId,
  isIXIFinancialLineId,

  ensureIXIFinancialDocumentId,
  ensureIXIFinancialLineId,
  ensureIXIFinancialAuditId,

  createIXIFinancialIdentity,
  normalizeIXIFinancialIdentity,

  normalizeIXIFinancialDocumentNumber,

  createIXIFinancialExternalReference
};
