/*
 * IXI FINANCIAL AUDIT ENGINE
 *
 * PURPOSE
 * -------
 *
 * Creates immutable audit records for
 * financial activity.
 *
 *
 * CORE RULE
 * ---------
 *
 * FINANCIAL HISTORY IS APPEND-ONLY.
 *
 *
 * If:
 *
 * $5,000
 *
 * is corrected to:
 *
 * $4,500
 *
 * we do NOT erase the fact that the record
 * previously said $5,000.
 *
 *
 * The current Financial Document may be
 * updated by the document engine.
 *
 * The Audit Engine preserves:
 *
 * - who changed it
 * - when
 * - what action occurred
 * - previous state
 * - next state
 * - reason / note
 * - Passport attribution
 * - external accounting context
 *
 *
 * IMPORTANT
 * ---------
 *
 * This engine does NOT:
 *
 * - mutate Financial Documents
 * - persist to AWS
 * - authorize users
 * - post accounting entries
 * - calculate financial totals
 *
 * Persistence later stores these audit
 * records as immutable events.
 */


import {
  IXI_FINANCIAL_AUDIT_ACTIONS,
  IXI_FINANCIAL_ORIGINS
} from "./IXIFinancialTypes";


import {
  createIXIFinancialAuditId
} from "./IXIFinancialIdentityEngine";


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
    typeof value ===
      "object" &&
    !Array.isArray(value)
  )
    ? value
    : {};
}


function clone(
  value
) {

  if (
    value === undefined
  ) {
    return null;
  }


  return JSON.parse(
    JSON.stringify(
      value
    )
  );
}


/* =========================================================
   AUDIT ACTION
   ========================================================= */

export function normalizeIXIFinancialAuditAction(
  value,
  fallback =
    IXI_FINANCIAL_AUDIT_ACTIONS
      .UPDATED
) {

  const cleaned =
    clean(
      value
    )
      .toLowerCase();


  const allowed =
    Object.values(
      IXI_FINANCIAL_AUDIT_ACTIONS
    );


  return allowed.includes(
    cleaned
  )
    ? cleaned
    : fallback;
}


/* =========================================================
   ORIGIN
   ========================================================= */

export function normalizeIXIFinancialAuditOrigin(
  value,
  fallback =
    IXI_FINANCIAL_ORIGINS
      .IXI
) {

  const cleaned =
    clean(
      value
    )
      .toLowerCase();


  const allowed =
    Object.values(
      IXI_FINANCIAL_ORIGINS
    );


  return allowed.includes(
    cleaned
  )
    ? cleaned
    : fallback;
}


/* =========================================================
   TIMESTAMP
   ========================================================= */

export function normalizeIXIFinancialAuditTimestamp(
  value
) {

  const cleaned =
    clean(
      value
    );


  if (
    !cleaned
  ) {
    return new Date()
      .toISOString();
  }


  const parsed =
    new Date(
      cleaned
    );


  return Number.isNaN(
    parsed.getTime()
  )
    ? cleaned
    : parsed.toISOString();
}


/* =========================================================
   AUDIT SUBJECT
   ========================================================= */

/*
 * What Financial record is this Audit Event
 * about?
 */

export function createIXIFinancialAuditSubject({
  financialDocumentId = "",

  financialLineId = "",

  financialRecordId = "",

  recordType = "",

  documentType = "",

  documentNumber = ""
} = {}) {

  return {
    financialDocumentId:
      clean(
        financialDocumentId
      ),

    financialLineId:
      clean(
        financialLineId
      ),

    financialRecordId:
      clean(
        financialRecordId ||
        financialLineId ||
        financialDocumentId
      ),

    recordType:
      clean(
        recordType
      )
        .toLowerCase(),

    documentType:
      clean(
        documentType
      )
        .toLowerCase(),

    documentNumber:
      clean(
        documentNumber
      )
  };
}


/* =========================================================
   ACTOR
   ========================================================= */

export function createIXIFinancialAuditActor({
  passportId = "",

  userId = "",

  employeeId = "",

  displayName = "",

  email = "",

  role = "",

  metadata = {}
} = {}) {

  return {
    passportId:
      clean(
        passportId
      ),

    userId:
      clean(
        userId
      ),

    employeeId:
      clean(
        employeeId
      ),

    displayName:
      clean(
        displayName
      ),

    email:
      clean(
        email
      ),

    role:
      clean(
        role
      ),

    metadata: {
      ...safeObject(
        metadata
      )
    }
  };
}


/* =========================================================
   EXTERNAL CONTEXT
   ========================================================= */

export function createIXIFinancialAuditExternalContext({
  system = "",

  connectionId = "",

  companyId = "",

  externalRecordType = "",

  externalRecordId = "",

  externalVersion = "",

  requestId = "",

  syncId = "",

  metadata = {}
} = {}) {

  return {
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

    externalRecordType:
      clean(
        externalRecordType
      ),

    externalRecordId:
      clean(
        externalRecordId
      ),

    externalVersion:
      clean(
        externalVersion
      ),

    requestId:
      clean(
        requestId
      ),

    syncId:
      clean(
        syncId
      ),

    metadata: {
      ...safeObject(
        metadata
      )
    }
  };
}


/* =========================================================
   CREATE AUDIT EVENT
   ========================================================= */

export function createIXIFinancialAuditEvent({
  financialAuditId = "",

  action =
    IXI_FINANCIAL_AUDIT_ACTIONS
      .UPDATED,

  occurredAt = "",

  origin =
    IXI_FINANCIAL_ORIGINS
      .IXI,

  subject = {},

  actor = {},

  passportIds = [],

  previous = null,

  next = null,

  reason = "",

  note = "",

  external = {},

  metadata = {}
} = {}) {

  return {
    financialAuditId:
      clean(
        financialAuditId
      ) ||
      createIXIFinancialAuditId(),

    action:
      normalizeIXIFinancialAuditAction(
        action
      ),

    occurredAt:
      normalizeIXIFinancialAuditTimestamp(
        occurredAt
      ),

    origin:
      normalizeIXIFinancialAuditOrigin(
        origin
      ),

    subject:
      createIXIFinancialAuditSubject(
        subject
      ),

    actor:
      createIXIFinancialAuditActor(
        actor
      ),

    passportIds:
      Array.from(
        new Set(
          safeArray(
            passportIds
          )
            .map(
              clean
            )
            .filter(
              Boolean
            )
        )
      ),

    /*
     * Immutable snapshots.
     *
     * These must never be references to a
     * mutable live JS object.
     */
    previous:
      clone(
        previous
      ),

    next:
      clone(
        next
      ),

    reason:
      clean(
        reason
      ),

    note:
      clean(
        note
      ),

    external:
      createIXIFinancialAuditExternalContext(
        external
      ),

    metadata: {
      ...safeObject(
        metadata
      )
    }
  };
}


/* =========================================================
   NORMALIZE AUDIT EVENT
   ========================================================= */

export function normalizeIXIFinancialAuditEvent(
  event = {}
) {

  const source =
    safeObject(
      event
    );


  return createIXIFinancialAuditEvent({
    financialAuditId:
      source.financialAuditId,

    action:
      source.action,

    occurredAt:
      source.occurredAt,

    origin:
      source.origin,

    subject:
      source.subject,

    actor:
      source.actor,

    passportIds:
      source.passportIds,

    previous:
      source.previous,

    next:
      source.next,

    reason:
      source.reason,

    note:
      source.note,

    external:
      source.external,

    metadata:
      source.metadata
  });
}


/* =========================================================
   AUDIT EVENT VALIDATION
   ========================================================= */

export function validateIXIFinancialAuditEvent(
  event = {}
) {

  const normalized =
    normalizeIXIFinancialAuditEvent(
      event
    );


  const errors =
    [];


  if (
    !normalized.financialAuditId
  ) {
    errors.push(
      "financialAuditId is required."
    );
  }


  if (
    !normalized.action
  ) {
    errors.push(
      "action is required."
    );
  }


  if (
    !normalized.occurredAt
  ) {
    errors.push(
      "occurredAt is required."
    );
  }


  if (
    !normalized
      .subject
      .financialRecordId
  ) {
    errors.push(
      "subject.financialRecordId is required."
    );
  }


  return {
    ok:
      errors.length ===
      0,

    errors,

    event:
      normalized
  };
}


/* =========================================================
   CREATE CHANGE EVENT
   ========================================================= */

/*
 * Most common audit operation.
 */

export function createIXIFinancialChangeAudit({
  action =
    IXI_FINANCIAL_AUDIT_ACTIONS
      .UPDATED,

  previous = null,

  next = null,

  subject = {},

  actor = {},

  passportIds = [],

  reason = "",

  note = "",

  origin =
    IXI_FINANCIAL_ORIGINS
      .IXI,

  external = {},

  metadata = {}
} = {}) {

  return createIXIFinancialAuditEvent({
    action,

    origin,

    subject,

    actor,

    passportIds,

    previous,

    next,

    reason,

    note,

    external,

    metadata
  });
}


/* =========================================================
   CREATE DOCUMENT AUDIT
   ========================================================= */

export function createIXIFinancialDocumentAudit({
  action =
    IXI_FINANCIAL_AUDIT_ACTIONS
      .UPDATED,

  previousDocument = null,

  nextDocument = null,

  actor = {},

  passportIds = [],

  reason = "",

  note = "",

  origin =
    IXI_FINANCIAL_ORIGINS
      .IXI,

  external = {},

  metadata = {}
} = {}) {

  const document =
    safeObject(
      nextDocument ||
      previousDocument
    );


  return createIXIFinancialChangeAudit({
    action,

    previous:
      previousDocument,

    next:
      nextDocument,

    subject: {
      financialDocumentId:
        document
          .financialDocumentId,

      financialRecordId:
        document
          .financialDocumentId,

      recordType:
        "document",

      documentType:
        document
          .documentType,

      documentNumber:
        document
          .documentNumber
    },

    actor,

    passportIds,

    reason,

    note,

    origin,

    external,

    metadata
  });
}


/* =========================================================
   CREATE LINE AUDIT
   ========================================================= */

export function createIXIFinancialLineAudit({
  action =
    IXI_FINANCIAL_AUDIT_ACTIONS
      .UPDATED,

  previousLine = null,

  nextLine = null,

  actor = {},

  passportIds = [],

  reason = "",

  note = "",

  origin =
    IXI_FINANCIAL_ORIGINS
      .IXI,

  external = {},

  metadata = {}
} = {}) {

  const line =
    safeObject(
      nextLine ||
      previousLine
    );


  return createIXIFinancialChangeAudit({
    action,

    previous:
      previousLine,

    next:
      nextLine,

    subject: {
      financialDocumentId:
        line
          .financialDocumentId,

      financialLineId:
        line
          .financialLineId,

      financialRecordId:
        line
          .financialLineId,

      recordType:
        "line"
    },

    actor,

    passportIds,

    reason,

    note,

    origin,

    external,

    metadata
  });
}


/* =========================================================
   APPEND AUDIT EVENT
   ========================================================= */

/*
 * Append only.
 *
 * Existing events remain untouched.
 */

export function appendIXIFinancialAuditEvent(
  auditEvents = [],
  event = {}
) {

  const normalized =
    normalizeIXIFinancialAuditEvent(
      event
    );


  const existing =
    safeArray(
      auditEvents
    )
      .map(
        normalizeIXIFinancialAuditEvent
      );


  if (
    existing.some(
      item =>
        item.financialAuditId ===
        normalized.financialAuditId
    )
  ) {

    return existing;
  }


  return [
    ...existing,
    normalized
  ];
}


/* =========================================================
   AUDIT EVENT COLLECTION
   ========================================================= */

export function normalizeIXIFinancialAuditEvents(
  events = []
) {

  const map =
    new Map();


  safeArray(
    events
  )
    .map(
      normalizeIXIFinancialAuditEvent
    )
    .forEach(
      event => {

        if (
          !event.financialAuditId
        ) {
          return;
        }


        if (
          !map.has(
            event.financialAuditId
          )
        ) {

          map.set(
            event.financialAuditId,
            event
          );
        }
      }
    );


  return Array.from(
    map.values()
  )
    .sort(
      (
        a,
        b
      ) => {

        const timeA =
          new Date(
            a.occurredAt
          ).getTime();


        const timeB =
          new Date(
            b.occurredAt
          ).getTime();


        return (
          (
            Number.isNaN(
              timeA
            )
              ? 0
              : timeA
          ) -
          (
            Number.isNaN(
              timeB
            )
              ? 0
              : timeB
          )
        );
      }
    );
}


/* =========================================================
   AUDIT HISTORY FOR RECORD
   ========================================================= */

export function getIXIFinancialAuditHistoryForRecord(
  events = [],
  financialRecordId = ""
) {

  const target =
    clean(
      financialRecordId
    );


  if (
    !target
  ) {
    return [];
  }


  return normalizeIXIFinancialAuditEvents(
    events
  ).filter(
    event =>
      event
        .subject
        .financialRecordId ===
      target
  );
}


/* =========================================================
   AUDIT HISTORY FOR DOCUMENT
   ========================================================= */

export function getIXIFinancialAuditHistoryForDocument(
  events = [],
  financialDocumentId = ""
) {

  const target =
    clean(
      financialDocumentId
    );


  if (
    !target
  ) {
    return [];
  }


  return normalizeIXIFinancialAuditEvents(
    events
  ).filter(
    event =>
      event
        .subject
        .financialDocumentId ===
      target
  );
}


/* =========================================================
   AUDIT HISTORY FOR PASSPORT
   ========================================================= */

/*
 * Allows:
 *
 * Machine Workbook
 * Employee Workbook
 * Job Workbook
 * Entity Workbook
 *
 * to inspect financial activity touching
 * that Passport.
 */

export function getIXIFinancialAuditHistoryForPassport(
  events = [],
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


  return normalizeIXIFinancialAuditEvents(
    events
  ).filter(
    event =>
      safeArray(
        event.passportIds
      ).includes(
        target
      )
  );
}


/* =========================================================
   CURRENT REVISION
   ========================================================= */

/*
 * Number of audit events for one record.
 *
 * This is NOT used as identity.
 *
 * It is a convenient revision indicator.
 */

export function getIXIFinancialAuditRevision(
  events = [],
  financialRecordId = ""
) {

  return getIXIFinancialAuditHistoryForRecord(
    events,
    financialRecordId
  ).length;
}


/* =========================================================
   LATEST AUDIT EVENT
   ========================================================= */

export function getLatestIXIFinancialAuditEvent(
  events = [],
  financialRecordId = ""
) {

  const history =
    getIXIFinancialAuditHistoryForRecord(
      events,
      financialRecordId
    );


  return (
    history[
      history.length - 1
    ] ||
    null
  );
}


/* =========================================================
   RECONSTRUCT LATEST SNAPSHOT
   ========================================================= */

/*
 * Audit is not the primary Financial store.
 *
 * But this helper can reconstruct the most
 * recent captured next-state from the audit
 * history.
 */

export function getLatestIXIFinancialAuditedSnapshot(
  events = [],
  financialRecordId = ""
) {

  const latest =
    getLatestIXIFinancialAuditEvent(
      events,
      financialRecordId
    );


  if (
    !latest
  ) {
    return null;
  }


  if (
    latest.next !==
      null &&
    latest.next !==
      undefined
  ) {

    return clone(
      latest.next
    );
  }


  return clone(
    latest.previous
  );
}


/* =========================================================
   CREATE AUDIT CHAIN SUMMARY
   ========================================================= */

export function createIXIFinancialAuditSummary(
  events = [],
  financialRecordId = ""
) {

  const history =
    getIXIFinancialAuditHistoryForRecord(
      events,
      financialRecordId
    );


  const first =
    history[0] ||
    null;


  const latest =
    history[
      history.length - 1
    ] ||
    null;


  const actionCounts =
    history.reduce(
      (
        result,
        event
      ) => {

        const action =
          event.action ||
          "unknown";


        result[
          action
        ] =
          (
            result[
              action
            ] ||
            0
          ) +
          1;


        return result;
      },
      {}
    );


  return {
    financialRecordId:
      clean(
        financialRecordId
      ),

    revision:
      history.length,

    createdAt:
      first
        ?.occurredAt ||
      "",

    lastChangedAt:
      latest
        ?.occurredAt ||
      "",

    lastAction:
      latest
        ?.action ||
      "",

    actionCounts,

    history
  };
}


/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

export default {
  normalizeIXIFinancialAuditAction,
  normalizeIXIFinancialAuditOrigin,
  normalizeIXIFinancialAuditTimestamp,

  createIXIFinancialAuditSubject,
  createIXIFinancialAuditActor,
  createIXIFinancialAuditExternalContext,

  createIXIFinancialAuditEvent,
  normalizeIXIFinancialAuditEvent,

  validateIXIFinancialAuditEvent,

  createIXIFinancialChangeAudit,
  createIXIFinancialDocumentAudit,
  createIXIFinancialLineAudit,

  appendIXIFinancialAuditEvent,
  normalizeIXIFinancialAuditEvents,

  getIXIFinancialAuditHistoryForRecord,
  getIXIFinancialAuditHistoryForDocument,
  getIXIFinancialAuditHistoryForPassport,

  getIXIFinancialAuditRevision,

  getLatestIXIFinancialAuditEvent,
  getLatestIXIFinancialAuditedSnapshot,

  createIXIFinancialAuditSummary
};
