/*
 * IXI FINANCIAL ENGINE
 *
 * PURPOSE
 * -------
 *
 * Public facade for the IXI AOS Financial
 * subsystem.
 *
 *
 * ALL EXTERNAL CONSUMERS SHOULD PREFER:
 *
 *   IXIFinancialEngine.js
 *
 * instead of importing individual internal
 * engines directly.
 *
 *
 * CONSUMERS INCLUDE:
 *
 * - AOF2 / Financial Face
 * - Financial Workbook
 * - Object Studio
 * - AWS Financial API
 * - Accounting adapters
 * - Import / export tools
 * - Reporting
 * - Automation
 *
 *
 * INTERNAL ENGINE STRUCTURE
 * -------------------------
 *
 * Types
 * Identity
 * References
 * Lines
 * Documents
 * History
 * Rollups
 * Lifecycle
 * Time
 * Audit
 * Permissions
 * Validation
 *
 *
 * CORE DOCTRINE
 * -------------
 *
 * Record once.
 * Attribute everywhere.
 * Sum once per scope.
 *
 * Financial history is preserved.
 *
 * Current AOS relationships may change.
 * Historical financial attribution does not.
 *
 * External accounting systems map at the
 * integration boundary and never replace
 * IXI financial identity.
 */


/* =========================================================
   TYPES
   ========================================================= */

export * from "./IXIFinancialTypes";


/* =========================================================
   IDENTITY
   ========================================================= */

export * from "./IXIFinancialIdentityEngine";


/* =========================================================
   PASSPORT REFERENCES
   ========================================================= */

export * from "./IXIFinancialReferenceEngine";


/* =========================================================
   LINES
   ========================================================= */

export * from "./IXIFinancialLineEngine";


/* =========================================================
   DOCUMENTS
   ========================================================= */

export * from "./IXIFinancialDocumentEngine";


/* =========================================================
   HISTORICAL ATTRIBUTION
   ========================================================= */

export * from "./IXIFinancialHistoryEngine";


/* =========================================================
   ROLLUPS
   ========================================================= */

export * from "./IXIFinancialRollupEngine";


/* =========================================================
   LIFECYCLE
   ========================================================= */

export * from "./IXIFinancialLifecycleEngine";


/* =========================================================
   TIME / LABOR
   ========================================================= */

export * from "./IXIFinancialTimeEngine";


/* =========================================================
   AUDIT
   ========================================================= */

export * from "./IXIFinancialAuditEngine";


/* =========================================================
   PERMISSIONS
   ========================================================= */

export * from "./IXIFinancialPermissionEngine";


/* =========================================================
   VALIDATION
   ========================================================= */

export * from "./IXIFinancialValidationEngine";


/* =========================================================
   NAMESPACE IMPORTS
   ========================================================= */

import * as FinancialTypes
  from "./IXIFinancialTypes";

import * as FinancialIdentity
  from "./IXIFinancialIdentityEngine";

import * as FinancialReferences
  from "./IXIFinancialReferenceEngine";

import * as FinancialLines
  from "./IXIFinancialLineEngine";

import * as FinancialDocuments
  from "./IXIFinancialDocumentEngine";

import * as FinancialHistory
  from "./IXIFinancialHistoryEngine";

import * as FinancialRollups
  from "./IXIFinancialRollupEngine";

import * as FinancialLifecycle
  from "./IXIFinancialLifecycleEngine";

import * as FinancialTime
  from "./IXIFinancialTimeEngine";

import * as FinancialAudit
  from "./IXIFinancialAuditEngine";

import * as FinancialPermissions
  from "./IXIFinancialPermissionEngine";

import * as FinancialValidation
  from "./IXIFinancialValidationEngine";


/* =========================================================
   ENGINE VERSION
   ========================================================= */

export const IXI_FINANCIAL_ENGINE_VERSION =
  "1.0.0";


/* =========================================================
   CAPABILITIES
   ========================================================= */

/*
 * Useful for runtime / API capability
 * negotiation later.
 */

export const IXI_FINANCIAL_CAPABILITIES = {
  identity:
    true,

  documents:
    true,

  lines:
    true,

  passportReferences:
    true,

  historicalAttribution:
    true,

  recursiveRollups:
    true,

  lifecycle:
    true,

  time:
    true,

  audit:
    true,

  permissions:
    true,

  validation:
    true,

  persistence:
    false,

  accountingAdapters:
    false,

  financialFace:
    false,

  workbook:
    false
};


/* =========================================================
   SYSTEM INFO
   ========================================================= */

export function getIXIFinancialEngineInfo() {

  return {
    engine:
      "IXI Financial Engine",

    version:
      IXI_FINANCIAL_ENGINE_VERSION,

    schema:
      FinancialTypes
        .IXI_FINANCIAL_SCHEMA,

    schemaVersion:
      FinancialTypes
        .IXI_FINANCIAL_SCHEMA_VERSION,

    capabilities: {
      ...IXI_FINANCIAL_CAPABILITIES
    }
  };
}


/* =========================================================
   CREATE BASIC EXPENSE
   ========================================================= */

/*
 * Convenience composition helper.
 *
 * This does NOT replace the lower-level
 * Document / Line APIs.
 *
 * It simply proves how the public facade
 * composes the canonical engines.
 */

export function createIXIExpense({
  financialDocumentId = "",

  documentNumber = "",

  title = "EXPENSE",

  description = "",

  amount = 0,

  currency = "USD",

  lineType =
    FinancialTypes
      .IXI_FINANCIAL_LINE_TYPES
      .EXPENSE,

  references = [],

  occurredAt = "",

  transactionDate = "",

  createdAt = "",

  createdByPassportId = "",

  memo = "",

  accounting = {},

  metadata = {}
} = {}) {

  const documentId =
    FinancialIdentity
      .ensureIXIFinancialDocumentId(
        financialDocumentId
      );


  const line =
    FinancialLines
      .createIXIFinancialLine({
        financialDocumentId:
          documentId,

        lineType,

        description:
          description ||
          title,

        quantity:
          1,

        rate:
          amount,

        amount,

        currency,

        direction:
          FinancialTypes
            .IXI_FINANCIAL_DIRECTIONS
            .OUTFLOW,

        references,

        occurredAt,

        memo,

        accounting
      });


  return FinancialDocuments
    .createIXIFinancialDocument({
      financialDocumentId:
        documentId,

      documentType:
        FinancialTypes
          .IXI_FINANCIAL_DOCUMENT_TYPES
          .EXPENSE,

      documentNumber,

      title,

      description,

      financialState:
        FinancialTypes
          .IXI_FINANCIAL_STATES
          .INCURRED,

      currency,

      occurredAt,

      transactionDate,

      createdAt,

      createdByPassportId,

      references,

      lines: [
        line
      ],

      memo,

      metadata
    });
}


/* =========================================================
   CREATE BASIC PURCHASE ORDER
   ========================================================= */

export function createIXIPurchaseOrder({
  financialDocumentId = "",

  documentNumber = "",

  title = "PURCHASE ORDER",

  description = "",

  currency = "USD",

  references = [],

  lines = [],

  occurredAt = "",

  transactionDate = "",

  createdAt = "",

  createdByPassportId = "",

  memo = "",

  metadata = {}
} = {}) {

  const documentId =
    FinancialIdentity
      .ensureIXIFinancialDocumentId(
        financialDocumentId
      );


  const normalizedLines =
    FinancialLines
      .normalizeIXIFinancialLines(
        lines
      )
      .map(
        line => ({
          ...line,

          financialDocumentId:
            documentId,

          direction:
            FinancialTypes
              .IXI_FINANCIAL_DIRECTIONS
              .OUTFLOW
        })
      );


  return FinancialDocuments
    .createIXIFinancialDocument({
      financialDocumentId:
        documentId,

      documentType:
        FinancialTypes
          .IXI_FINANCIAL_DOCUMENT_TYPES
          .PURCHASE_ORDER,

      documentNumber,

      title,

      description,

      financialState:
        FinancialTypes
          .IXI_FINANCIAL_STATES
          .COMMITTED,

      currency,

      occurredAt,

      transactionDate,

      createdAt,

      createdByPassportId,

      references,

      lines:
        normalizedLines,

      memo,

      metadata
    });
}


/* =========================================================
   CREATE BASIC WORK ORDER
   ========================================================= */

export function createIXIWorkOrder({
  financialDocumentId = "",

  documentNumber = "",

  title = "WORK ORDER",

  description = "",

  currency = "USD",

  references = [],

  lines = [],

  occurredAt = "",

  transactionDate = "",

  createdAt = "",

  createdByPassportId = "",

  memo = "",

  metadata = {}
} = {}) {

  const documentId =
    FinancialIdentity
      .ensureIXIFinancialDocumentId(
        financialDocumentId
      );


  const normalizedLines =
    FinancialLines
      .normalizeIXIFinancialLines(
        lines
      )
      .map(
        line => ({
          ...line,

          financialDocumentId:
            documentId
        })
      );


  return FinancialDocuments
    .createIXIFinancialDocument({
      financialDocumentId:
        documentId,

      documentType:
        FinancialTypes
          .IXI_FINANCIAL_DOCUMENT_TYPES
          .WORK_ORDER,

      documentNumber,

      title,

      description,

      financialState:
        FinancialTypes
          .IXI_FINANCIAL_STATES
          .INCURRED,

      currency,

      occurredAt,

      transactionDate,

      createdAt,

      createdByPassportId,

      references,

      lines:
        normalizedLines,

      memo,

      metadata
    });
}


/* =========================================================
   CREATE BASIC BILL
   ========================================================= */

export function createIXIBill({
  financialDocumentId = "",

  documentNumber = "",

  title = "BILL",

  description = "",

  currency = "USD",

  references = [],

  lines = [],

  occurredAt = "",

  transactionDate = "",

  dueDate = "",

  createdAt = "",

  createdByPassportId = "",

  memo = "",

  metadata = {}
} = {}) {

  const documentId =
    FinancialIdentity
      .ensureIXIFinancialDocumentId(
        financialDocumentId
      );


  const normalizedLines =
    FinancialLines
      .normalizeIXIFinancialLines(
        lines
      )
      .map(
        line => ({
          ...line,

          financialDocumentId:
            documentId,

          direction:
            FinancialTypes
              .IXI_FINANCIAL_DIRECTIONS
              .OUTFLOW
        })
      );


  return FinancialDocuments
    .createIXIFinancialDocument({
      financialDocumentId:
        documentId,

      documentType:
        FinancialTypes
          .IXI_FINANCIAL_DOCUMENT_TYPES
          .BILL,

      documentNumber,

      title,

      description,

      financialState:
        FinancialTypes
          .IXI_FINANCIAL_STATES
          .BILLED,

      currency,

      occurredAt,

      transactionDate,

      dueDate,

      createdAt,

      createdByPassportId,

      references,

      lines:
        normalizedLines,

      memo,

      metadata
    });
}


/* =========================================================
   CREATE BASIC CUSTOMER INVOICE
   ========================================================= */

export function createIXIInvoice({
  financialDocumentId = "",

  documentNumber = "",

  title = "INVOICE",

  description = "",

  currency = "USD",

  references = [],

  lines = [],

  occurredAt = "",

  transactionDate = "",

  dueDate = "",

  createdAt = "",

  createdByPassportId = "",

  memo = "",

  metadata = {}
} = {}) {

  const documentId =
    FinancialIdentity
      .ensureIXIFinancialDocumentId(
        financialDocumentId
      );


  const normalizedLines =
    FinancialLines
      .normalizeIXIFinancialLines(
        lines
      )
      .map(
        line => ({
          ...line,

          financialDocumentId:
            documentId,

          direction:
            FinancialTypes
              .IXI_FINANCIAL_DIRECTIONS
              .INFLOW
        })
      );


  return FinancialDocuments
    .createIXIFinancialDocument({
      financialDocumentId:
        documentId,

      documentType:
        FinancialTypes
          .IXI_FINANCIAL_DOCUMENT_TYPES
          .INVOICE,

      documentNumber,

      title,

      description,

      financialState:
        FinancialTypes
          .IXI_FINANCIAL_STATES
          .BILLED,

      currency,

      occurredAt,

      transactionDate,

      dueDate,

      createdAt,

      createdByPassportId,

      references,

      lines:
        normalizedLines,

      memo,

      metadata
    });
}


/* =========================================================
   CREATE PASSPORT SNAPSHOT FROM DOCUMENTS
   ========================================================= */

/*
 * High-level AOF2 preparation helper.
 */

export function createIXIFinancialSnapshotForPassport({
  passportId = "",

  documents = [],

  historyByDocumentId = {},

  startAt = "",

  endAt = ""
} = {}) {

  const facts =
    FinancialRollups
      .createIXIFinancialRollupFacts(
        documents,
        {
          historyByDocumentId
        }
      );


  return FinancialRollups
    .createIXIFinancialPassportSnapshot({
      passportId,

      facts,

      startAt,

      endAt
    });
}


/* =========================================================
   CREATE RECURSIVE SNAPSHOT
   ========================================================= */

export function createIXIFinancialSnapshotForScope({
  rootPassportId = "",

  scopePassportIds = [],

  documents = [],

  historyByDocumentId = {},

  startAt = "",

  endAt = ""
} = {}) {

  const facts =
    FinancialRollups
      .createIXIFinancialRollupFacts(
        documents,
        {
          historyByDocumentId
        }
      );


  return FinancialRollups
    .createIXIFinancialRecursiveScopeSnapshot({
      rootPassportId,

      scopePassportIds,

      facts,

      startAt,

      endAt
    });
}


/* =========================================================
   VALIDATE BEFORE PERSISTENCE
   ========================================================= */

export function prepareIXIFinancialDocumentForPersistence(
  document = {}
) {

  return FinancialValidation
    .canPersistIXIFinancialDocument(
      document
    );
}


/* =========================================================
   PUBLIC ENGINE NAMESPACE
   ========================================================= */

const IXIFinancialEngine = {
  version:
    IXI_FINANCIAL_ENGINE_VERSION,

  capabilities:
    IXI_FINANCIAL_CAPABILITIES,

  getInfo:
    getIXIFinancialEngineInfo,

  Types:
    FinancialTypes,

  Identity:
    FinancialIdentity,

  References:
    FinancialReferences,

  Lines:
    FinancialLines,

  Documents:
    FinancialDocuments,

  History:
    FinancialHistory,

  Rollups:
    FinancialRollups,

  Lifecycle:
    FinancialLifecycle,

  Time:
    FinancialTime,

  Audit:
    FinancialAudit,

  Permissions:
    FinancialPermissions,

  Validation:
    FinancialValidation,

  createExpense:
    createIXIExpense,

  createPurchaseOrder:
    createIXIPurchaseOrder,

  createWorkOrder:
    createIXIWorkOrder,

  createBill:
    createIXIBill,

  createInvoice:
    createIXIInvoice,

  createPassportSnapshot:
    createIXIFinancialSnapshotForPassport,

  createScopeSnapshot:
    createIXIFinancialSnapshotForScope,

  prepareForPersistence:
    prepareIXIFinancialDocumentForPersistence
};


export default IXIFinancialEngine;
