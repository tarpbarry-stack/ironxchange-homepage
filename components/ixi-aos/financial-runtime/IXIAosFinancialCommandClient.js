/*
 * IXI AOS FINANCIAL COMMAND CLIENT
 *
 * PURPOSE
 * -------
 *
 * One browser-side client for creating
 * Financial Documents through IX-Core.
 *
 *
 * FRONTEND FLOW
 * -------------
 *
 * Financial Face
 *      ↓
 * IXIAosFinancialCommandClient
 *      ↓
 * POST /financial/commands/create
 *      ↓
 * trusted server auth
 *      ↓
 * Financial Command Engine
 *      ↓
 * DynamoDB
 *      ↓
 * refreshed AOF2 snapshot
 *
 *
 * IMPORTANT
 * ---------
 *
 * Frontend does NOT send:
 *
 * roles
 * permissions
 * managedPassportIds
 *
 * Actor/entity authority is resolved by
 * the server.
 */


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


function safeArray(
  value
) {
  return Array.isArray(
    value
  )
    ? value
    : [];
}


/* =========================================================
   ENDPOINT
   ========================================================= */

export function getIXIFinancialCommandEndpoint({
  apiBaseUrl = ""
} = {}) {

  const base =
    clean(
      apiBaseUrl
    )
      .replace(
        /\/+$/,
        ""
      );


  if (
    base
  ) {
    return `${base}/financial/commands/create`;
  }


  /*
   * Same-origin/default API proxy path.
   *
   * If IronXchange already proxies IX-Core
   * through another browser endpoint, we can
   * change this in one place later.
   */
  return "/financial/commands/create";
}


/* =========================================================
   ERROR
   ========================================================= */

export class IXIFinancialCommandError
  extends Error {

  constructor(
    message,
    {
      status = 0,
      result = null,
      operation = "",
      errors = []
    } = {}
  ) {

    super(
      message
    );


    this.name =
      "IXIFinancialCommandError";


    this.status =
      Number(
        status ||
        0
      );


    this.result =
      result;


    this.operation =
      clean(
        operation
      );


    this.errors =
      safeArray(
        errors
      );
  }
}


/* =========================================================
   COMMAND NORMALIZATION
   ========================================================= */

export function normalizeIXIFinancialCommand({
  documentType = "",
  input = {},
  commandId = "",
  idempotencyKey = "",
  snapshot = {},
  metadata = {}
} = {}) {

  return {
    documentType:
      clean(
        documentType
      ).toLowerCase(),

    input: {
      ...safeObject(
        input
      )
    },

    commandId:
      clean(
        commandId
      ),

    idempotencyKey:
      clean(
        idempotencyKey
      ),

    snapshot: {
      ...safeObject(
        snapshot
      )
    },

    metadata: {
      ...safeObject(
        metadata
      )
    }
  };
}


/* =========================================================
   RESPONSE NORMALIZATION
   ========================================================= */

export function normalizeIXIFinancialCommandResult(
  result
) {

  const source =
    safeObject(
      result
    );


  return {
    ok:
      source.ok ===
        true,

    stage:
      clean(
        source.stage
      ),

    commandId:
      clean(
        source.commandId
      ),

    idempotencyKey:
      clean(
        source.idempotencyKey
      ),

    documentType:
      clean(
        source.documentType ||
        source.financialDocument
          ?.documentType
      ),

    financialDocument:
      source.financialDocument ||
      null,

    record:
      source.record ||
      null,

    created:
      source.created ===
        true,

    idempotentReplay:
      source.idempotentReplay ===
        true,

    indexedPassportIds:
      safeArray(
        source.indexedPassportIds
      ),

    storageProvider:
      clean(
        source.storageProvider
      ),

    snapshot:
      source.snapshot ||
      null,

    warnings:
      safeArray(
        source.warnings
      ),

    errors:
      safeArray(
        source.errors
      )
  };
}


/* =========================================================
   EXECUTE COMMAND
   ========================================================= */

export async function createIXIFinancialDocument({
  documentType = "",
  input = {},
  commandId = "",
  idempotencyKey = "",
  snapshot = {},
  metadata = {},

  apiBaseUrl = "",

  headers = {},

  signal = undefined
} = {}) {

  const command =
    normalizeIXIFinancialCommand({
      documentType,

      input,

      commandId,

      idempotencyKey,

      snapshot,

      metadata
    });


  if (
    !command.documentType
  ) {

    throw new IXIFinancialCommandError(
      "Financial documentType is required.",
      {
        status:
          0,

        operation:
          "financial.command.create"
      }
    );
  }


  const endpoint =
    getIXIFinancialCommandEndpoint({
      apiBaseUrl
    });


  let response;


  try {

    response =
      await fetch(
        endpoint,
        {
          method:
            "POST",

          credentials:
            "include",

          headers: {
            "Content-Type":
              "application/json",

            "X-IXI-Source":
              "ixi-aos-financial-face",

            ...safeObject(
              headers
            )
          },

          body:
            JSON.stringify(
              command
            ),

          signal
        }
      );

  } catch (
    error
  ) {

    throw new IXIFinancialCommandError(
      clean(
        error?.message ||
        "Financial command request failed."
      ),
      {
        status:
          0,

        operation:
          "financial.command.create"
      }
    );
  }


  let rawResult =
    null;


  try {

    rawResult =
      await response
        .json();

  } catch {

    throw new IXIFinancialCommandError(
      `Financial command returned HTTP ${response.status} without a valid JSON response.`,
      {
        status:
          response.status,

        operation:
          "financial.command.create"
      }
    );
  }


  const result =
    normalizeIXIFinancialCommandResult(
      rawResult
    );


  if (
    !response.ok ||
    !result.ok
  ) {

    const firstError =
      result.errors[0];


    throw new IXIFinancialCommandError(
      clean(
        firstError
          ?.message ||
        `Financial command failed with HTTP ${response.status}.`
      ),
      {
        status:
          response.status,

        result,

        operation:
          "financial.command.create",

        errors:
          result.errors
      }
    );
  }


  return result;
}


/* =========================================================
   CONVENIENCE COMMANDS
   ========================================================= */

export async function createIXIExpense(
  input = {},
  options = {}
) {

  return createIXIFinancialDocument({
    ...safeObject(
      options
    ),

    documentType:
      "expense",

    input
  });
}


export async function createIXIPurchaseOrder(
  input = {},
  options = {}
) {

  return createIXIFinancialDocument({
    ...safeObject(
      options
    ),

    documentType:
      "purchase-order",

    input
  });
}


export async function createIXIBill(
  input = {},
  options = {}
) {

  return createIXIFinancialDocument({
    ...safeObject(
      options
    ),

    documentType:
      "bill",

    input
  });
}


export async function createIXIPayment(
  input = {},
  options = {}
) {

  return createIXIFinancialDocument({
    ...safeObject(
      options
    ),

    documentType:
      "payment",

    input
  });
}


export async function createIXIInvoice(
  input = {},
  options = {}
) {

  return createIXIFinancialDocument({
    ...safeObject(
      options
    ),

    documentType:
      "invoice",

    input
  });
}


export async function createIXIWorkOrder(
  input = {},
  options = {}
) {

  return createIXIFinancialDocument({
    ...safeObject(
      options
    ),

    documentType:
      "work-order",

    input
  });
}


export async function createIXITimeEntry(
  input = {},
  options = {}
) {

  return createIXIFinancialDocument({
    ...safeObject(
      options
    ),

    documentType:
      "time-entry",

    input
  });
}


export async function createIXICredit(
  input = {},
  options = {}
) {

  return createIXIFinancialDocument({
    ...safeObject(
      options
    ),

    documentType:
      "credit",

    input
  });
}


/* =========================================================
   SNAPSHOT HELPERS
   ========================================================= */

export function getIXIFinancialCommandSnapshot(
  result
) {

  return result
    ?.snapshot
    ?.data ||
    null;
}


export function getIXIFinancialLifecycleSnapshot(
  result
) {

  return result
    ?.snapshot
    ?.data
    ?.lifecycleSnapshot ||
    null;
}


export function getIXIFinancialSnapshotByCurrency(
  result,
  currency = "USD"
) {

  const key =
    clean(
      currency ||
      "USD"
    ).toUpperCase();


  return result
    ?.snapshot
    ?.data
    ?.financialSnapshot
    ?.snapshots
    ?.[
      key
    ] ||
    null;
}


/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

export default {
  getIXIFinancialCommandEndpoint,

  normalizeIXIFinancialCommand,
  normalizeIXIFinancialCommandResult,

  createIXIFinancialDocument,

  createIXIExpense,
  createIXIPurchaseOrder,
  createIXIBill,
  createIXIPayment,
  createIXIInvoice,
  createIXIWorkOrder,
  createIXITimeEntry,
  createIXICredit,

  getIXIFinancialCommandSnapshot,
  getIXIFinancialLifecycleSnapshot,
  getIXIFinancialSnapshotByCurrency
};
