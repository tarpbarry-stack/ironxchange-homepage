/*
 * IXI FINANCIAL HISTORY ENGINE
 *
 * PURPOSE
 * -------
 *
 * Preserves historical financial context
 * at the moment a financial record occurs.
 *
 *
 * CORE RULE
 * ---------
 *
 * CURRENT AOS STRUCTURE
 * can change.
 *
 * HISTORICAL FINANCIAL ATTRIBUTION
 * must not.
 *
 *
 * Example:
 *
 * January:
 *
 * CAT D6
 *   Job 100
 *   Midland
 *
 * March:
 *
 * CAT D6
 *   Job 220
 *   Odessa
 *
 *
 * A January repair must continue to report:
 *
 * Job 100
 * Midland
 *
 * even though the machine now belongs to:
 *
 * Job 220
 * Odessa
 *
 *
 * This engine freezes:
 *
 * - Passport references
 * - labels
 * - object/container classes
 * - relationship identifiers
 * - descriptive path snapshots
 * - external/customer identifiers
 * - event dates
 *
 *
 * It does NOT:
 *
 * - change current AOS relationships
 * - calculate financial totals
 * - recursively roll up money
 * - persist to AWS
 * - infer accounting mappings
 */


import {
  dedupeIXIFinancialReferences,
  normalizeIXIFinancialReference
} from "./IXIFinancialReferenceEngine";


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


function clone(
  value
) {
  return JSON.parse(
    JSON.stringify(
      value
    )
  );
}


/* =========================================================
   DATE NORMALIZATION
   ========================================================= */

export function normalizeIXIFinancialHistoryDate(
  value,
  fallback = ""
) {

  const cleaned =
    clean(
      value
    );


  if (
    !cleaned
  ) {
    return fallback;
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
   REFERENCE SNAPSHOT
   ========================================================= */

/*
 * Freeze a financial reference so future
 * Object edits cannot alter what the
 * transaction historically described.
 */

export function createIXIFinancialHistoricalReference(
  reference = {}
) {

  const normalized =
    normalizeIXIFinancialReference(
      reference
    );


  return {
    referenceKey:
      normalized.referenceKey,

    passportId:
      normalized.passportId,

    role:
      normalized.role,

    label:
      normalized.label,

    objectType:
      normalized.objectType,

    objectClass:
      normalized.objectClass,

    relationshipId:
      normalized.relationshipId,

    relationshipType:
      normalized.relationshipType,

    path:
      clone(
        normalized.path ||
        []
      ),

    snapshot:
      clone(
        normalized.snapshot ||
        {}
      ),

    metadata:
      clone(
        normalized.metadata ||
        {}
      )
  };
}


/* =========================================================
   FREEZE REFERENCES
   ========================================================= */

export function freezeIXIFinancialReferences(
  references = []
) {

  return dedupeIXIFinancialReferences(
    references
  ).map(
    createIXIFinancialHistoricalReference
  );
}


/* =========================================================
   EXTERNAL / CUSTOMER ID SNAPSHOT
   ========================================================= */

/*
 * Users may rename an Object or change an
 * internal identifier later.
 *
 * Preserve the identifiers that were known
 * when the financial event occurred.
 */

export function createIXIFinancialExternalIdentitySnapshot({
  customerObjectId = "",

  customerAssetId = "",

  customerJobId = "",

  customerLocationId = "",

  departmentCode = "",

  costCenterCode = "",

  projectCode = "",

  vendorCode = "",

  employeeCode = "",

  accountCode = "",

  costCode = "",

  other = {}
} = {}) {

  return {
    customerObjectId:
      clean(
        customerObjectId
      ),

    customerAssetId:
      clean(
        customerAssetId
      ),

    customerJobId:
      clean(
        customerJobId
      ),

    customerLocationId:
      clean(
        customerLocationId
      ),

    departmentCode:
      clean(
        departmentCode
      ),

    costCenterCode:
      clean(
        costCenterCode
      ),

    projectCode:
      clean(
        projectCode
      ),

    vendorCode:
      clean(
        vendorCode
      ),

    employeeCode:
      clean(
        employeeCode
      ),

    accountCode:
      clean(
        accountCode
      ),

    costCode:
      clean(
        costCode
      ),

    other: {
      ...safeObject(
        other
      )
    }
  };
}


/* =========================================================
   HISTORY CONTEXT
   ========================================================= */

/*
 * Historical context belongs to the
 * financial event/document.
 *
 * It is separate from the current AOS
 * relationship graph.
 */

export function createIXIFinancialHistoryContext({
  occurredAt = "",

  transactionDate = "",

  documentDate = "",

  postingDate = "",

  capturedAt = "",

  capturedByPassportId = "",

  references = [],

  externalIdentity = {},

  source = {},

  notes = "",

  metadata = {}
} = {}) {

  const resolvedCapturedAt =
    normalizeIXIFinancialHistoryDate(
      capturedAt,
      new Date()
        .toISOString()
    );


  const frozenReferences =
    freezeIXIFinancialReferences(
      references
    );


  return {
    occurredAt:
      normalizeIXIFinancialHistoryDate(
        occurredAt
      ),

    transactionDate:
      normalizeIXIFinancialHistoryDate(
        transactionDate
      ),

    documentDate:
      normalizeIXIFinancialHistoryDate(
        documentDate
      ),

    postingDate:
      normalizeIXIFinancialHistoryDate(
        postingDate
      ),

    capturedAt:
      resolvedCapturedAt,

    capturedByPassportId:
      clean(
        capturedByPassportId
      ),

    references:
      frozenReferences,

    externalIdentity:
      createIXIFinancialExternalIdentitySnapshot(
        externalIdentity
      ),

    source: {
      system:
        clean(
          source.system
        ),

      sourceId:
        clean(
          source.sourceId
        ),

      sourceType:
        clean(
          source.sourceType
        ),

      importedAt:
        normalizeIXIFinancialHistoryDate(
          source.importedAt
        ),

      metadata: {
        ...safeObject(
          source.metadata
        )
      }
    },

    notes:
      clean(
        notes
      ),

    metadata: {
      ...safeObject(
        metadata
      )
    }
  };
}


/* =========================================================
   NORMALIZE HISTORY CONTEXT
   ========================================================= */

export function normalizeIXIFinancialHistoryContext(
  history = {}
) {

  const source =
    safeObject(
      history
    );


  return createIXIFinancialHistoryContext({
    occurredAt:
      source.occurredAt,

    transactionDate:
      source.transactionDate,

    documentDate:
      source.documentDate,

    postingDate:
      source.postingDate,

    capturedAt:
      source.capturedAt,

    capturedByPassportId:
      source.capturedByPassportId,

    references:
      source.references,

    externalIdentity:
      source.externalIdentity,

    source:
      source.source,

    notes:
      source.notes,

    metadata:
      source.metadata
  });
}


/* =========================================================
   HISTORY REFERENCE LOOKUPS
   ========================================================= */

export function getIXIFinancialHistoricalReferencesForPassport(
  history = {},
  passportId = ""
) {

  const target =
    clean(
      passportId
    );


  if (
    !target
  ) {
    return [];
  }


  const normalized =
    normalizeIXIFinancialHistoryContext(
      history
    );


  return safeArray(
    normalized.references
  ).filter(
    reference =>
      reference.passportId ===
      target
  );
}


/* =========================================================
   HISTORY HAS PASSPORT?
   ========================================================= */

export function hasIXIFinancialHistoricalPassportReference(
  history = {},
  passportId = ""
) {

  return (
    getIXIFinancialHistoricalReferencesForPassport(
      history,
      passportId
    ).length >
    0
  );
}


/* =========================================================
   CAPTURE HISTORY FROM DOCUMENT
   ========================================================= */

/*
 * Convenience helper.
 *
 * Takes a Financial Document and freezes
 * its current historical attribution.
 *
 * This does NOT mutate the document.
 */

export function createIXIFinancialHistoryFromDocument(
  document = {},
  {
    capturedAt = "",
    capturedByPassportId = "",
    externalIdentity = {},
    source = {},
    metadata = {}
  } = {}
) {

  const sourceDocument =
    safeObject(
      document
    );


  return createIXIFinancialHistoryContext({
    occurredAt:
      sourceDocument
        .dates
        ?.occurredAt,

    transactionDate:
      sourceDocument
        .dates
        ?.transactionDate,

    documentDate:
      sourceDocument
        .dates
        ?.documentDate,

    postingDate:
      sourceDocument
        .accountingState
        ?.postedAt,

    capturedAt,

    capturedByPassportId:

      clean(
        capturedByPassportId
      ) ||

      clean(
        sourceDocument
          .identity
          ?.createdByPassportId
      ),

    references:
      sourceDocument.references,

    externalIdentity,

    source,

    metadata
  });
}


/* =========================================================
   IMMUTABILITY CHECK
   ========================================================= */

/*
 * Basic guard used later by persistence
 * and audit engines.
 *
 * A historical context is considered frozen
 * when it has:
 *
 * - capturedAt
 * - at least one reference OR explicit source
 */

export function isIXIFinancialHistoryFrozen(
  history = {}
) {

  const normalized =
    normalizeIXIFinancialHistoryContext(
      history
    );


  return Boolean(
    normalized.capturedAt &&
    (
      normalized.references.length ||
      normalized.source.sourceId ||
      normalized.source.system
    )
  );
}


/* =========================================================
   COMPARE HISTORICAL REFERENCES
   ========================================================= */

/*
 * Used later to detect whether today's AOS
 * relationship graph differs from what was
 * true when the transaction occurred.
 */

export function compareIXIFinancialHistoricalReferences({
  historicalReferences = [],
  currentReferences = []
} = {}) {

  const historical =
    freezeIXIFinancialReferences(
      historicalReferences
    );


  const current =
    freezeIXIFinancialReferences(
      currentReferences
    );


  const historicalKeys =
    new Set(
      historical.map(
        reference =>
          reference.referenceKey
      )
    );


  const currentKeys =
    new Set(
      current.map(
        reference =>
          reference.referenceKey
      )
    );


  const removed =
    historical.filter(
      reference =>
        !currentKeys.has(
          reference.referenceKey
        )
    );


  const added =
    current.filter(
      reference =>
        !historicalKeys.has(
          reference.referenceKey
        )
    );


  return {
    changed:
      Boolean(
        removed.length ||
        added.length
      ),

    added,

    removed,

    historical,

    current
  };
}


/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

export default {
  normalizeIXIFinancialHistoryDate,

  createIXIFinancialHistoricalReference,
  freezeIXIFinancialReferences,

  createIXIFinancialExternalIdentitySnapshot,

  createIXIFinancialHistoryContext,
  normalizeIXIFinancialHistoryContext,

  getIXIFinancialHistoricalReferencesForPassport,
  hasIXIFinancialHistoricalPassportReference,

  createIXIFinancialHistoryFromDocument,

  isIXIFinancialHistoryFrozen,

  compareIXIFinancialHistoricalReferences
};
