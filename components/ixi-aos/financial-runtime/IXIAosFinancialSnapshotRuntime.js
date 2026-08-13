/*
 * IXI AOS FINANCIAL SNAPSHOT RUNTIME
 *
 * PURPOSE
 * -------
 *
 * One canonical read-side adapter for AOF2.
 *
 *
 * WRITE SIDE
 * ----------
 *
 * Financial Face
 *      ↓
 * Runtime Adapter
 *      ↓
 * Financial Command Client
 *      ↓
 * IX-Core / DynamoDB
 *
 *
 * READ SIDE
 * ---------
 *
 * Financial Snapshot
 *      ↓
 * IXIAosFinancialSnapshotRuntime
 *      ↓
 * AOF2
 *
 *
 * AOF2 SHOULD NOT:
 *
 * - calculate commitment
 * - calculate incurred cost
 * - calculate paid/unpaid
 * - calculate revenue
 * - calculate receivable
 * - calculate operating net
 * - deduplicate recursive facts
 *
 *
 * Those numbers come from the Financial
 * Engine.
 *
 * This file only normalizes and exposes them
 * consistently to the Face.
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


function safeNumber(
  value,
  fallback = 0
) {
  const number =
    Number(
      value
    );


  return Number.isFinite(
    number
  )
    ? number
    : fallback;
}


function roundMoney(
  value
) {
  return Math.round(
    (
      safeNumber(
        value,
        0
      ) +
      Number.EPSILON
    ) *
    100
  ) / 100;
}


function normalizeCurrency(
  value
) {
  const currency =
    clean(
      value ||
      "USD"
    ).toUpperCase();


  return /^[A-Z]{3}$/.test(
    currency
  )
    ? currency
    : "USD";
}


/* =========================================================
   SNAPSHOT SOURCE RESOLUTION
   ========================================================= */

/*
 * Accept any of these shapes:
 *
 * 1. command result
 *
 * {
 *   snapshot: {
 *     data: {...}
 *   }
 * }
 *
 *
 * 2. API envelope
 *
 * {
 *   data: {
 *     lifecycleSnapshot: ...
 *   }
 * }
 *
 *
 * 3. raw snapshot data
 *
 * {
 *   lifecycleSnapshot: ...
 * }
 */

export function getIXIAosFinancialSnapshotData(
  source
) {
  const input =
    safeObject(
      source
    );


  if (
    input
      ?.snapshot
      ?.data
  ) {
    return safeObject(
      input.snapshot.data
    );
  }


  if (
    input
      ?.data
      ?.lifecycleSnapshot ||
    input
      ?.data
      ?.financialSnapshot
  ) {
    return safeObject(
      input.data
    );
  }


  if (
    input.lifecycleSnapshot ||
    input.financialSnapshot
  ) {
    return input;
  }


  return {};
}


/* =========================================================
   CURRENCY RESOLUTION
   ========================================================= */

export function getIXIAosFinancialSnapshotCurrency(
  source,
  fallbackCurrency = "USD"
) {
  const data =
    getIXIAosFinancialSnapshotData(
      source
    );


  return normalizeCurrency(
    data.currency ||
    data
      ?.lifecycleSnapshot
      ?.currency ||
    fallbackCurrency
  );
}


/* =========================================================
   LIFECYCLE SNAPSHOT
   ========================================================= */

export function getIXIAosLifecycleSnapshot(
  source
) {
  const data =
    getIXIAosFinancialSnapshotData(
      source
    );


  return safeObject(
    data.lifecycleSnapshot
  );
}


/* =========================================================
   FINANCIAL FACT SNAPSHOT
   ========================================================= */

export function getIXIAosFinancialFactSnapshot(
  source,
  currency = ""
) {
  const data =
    getIXIAosFinancialSnapshotData(
      source
    );


  const resolvedCurrency =
    normalizeCurrency(
      currency ||
      data.currency ||
      data
        ?.lifecycleSnapshot
        ?.currency ||
      "USD"
    );


  return safeObject(
    data
      ?.financialSnapshot
      ?.snapshots
      ?.[
        resolvedCurrency
      ]
  );
}


/* =========================================================
   RECENT ACTIVITY
   ========================================================= */

export function getIXIAosFinancialRecentActivity(
  source
) {
  const data =
    getIXIAosFinancialSnapshotData(
      source
    );


  return safeArray(
    data.recentActivity
  );
}


/* =========================================================
   FACTS
   ========================================================= */

export function getIXIAosFinancialFacts(
  source,
  currency = ""
) {
  const snapshot =
    getIXIAosFinancialFactSnapshot(
      source,
      currency
    );


  /*
   * Provider currently places raw facts on
   * financialSnapshot.facts, outside the
   * currency snapshot.
   */
  const data =
    getIXIAosFinancialSnapshotData(
      source
    );


  return safeArray(
    data
      ?.financialSnapshot
      ?.facts ||
    snapshot
      ?.facts
  );
}


/* =========================================================
   STANDARD AOF2 LIFECYCLE VALUES
   ========================================================= */

export function getIXIAosFinancialLifecycleValues(
  source
) {
  const lifecycle =
    getIXIAosLifecycleSnapshot(
      source
    );


  return {
    currency:
      normalizeCurrency(
        lifecycle.currency ||
        "USD"
      ),

    commitment:
      roundMoney(
        lifecycle.commitment
      ),

    remainingCommitment:
      roundMoney(
        lifecycle
          .remainingCommitment
      ),

    incurredCost:
      roundMoney(
        lifecycle.incurredCost
      ),

    paid:
      roundMoney(
        lifecycle.paid
      ),

    unpaid:
      roundMoney(
        lifecycle.unpaid
      ),

    revenue:
      roundMoney(
        lifecycle.revenue
      ),

    collected:
      roundMoney(
        lifecycle.collected
      ),

    receivable:
      roundMoney(
        lifecycle.receivable
      ),

    projectedOutflow:
      roundMoney(
        lifecycle.projectedOutflow
      ),

    operatingNet:
      roundMoney(
        lifecycle.operatingNet
      )
  };
}


/* =========================================================
   STANDARD FACT VALUES
   ========================================================= */

export function getIXIAosFinancialFactValues(
  source,
  currency = ""
) {
  const snapshot =
    getIXIAosFinancialFactSnapshot(
      source,
      currency
    );


  return {
    currency:
      normalizeCurrency(
        snapshot.currency ||
        currency ||
        "USD"
      ),

    factCount:
      safeNumber(
        snapshot.factCount,
        0
      ),

    documentCount:
      safeNumber(
        snapshot.documentCount,
        0
      ),

    inflow:
      roundMoney(
        snapshot.inflow
      ),

    outflow:
      roundMoney(
        snapshot.outflow
      ),

    neutral:
      roundMoney(
        snapshot.neutral
      ),

    net:
      roundMoney(
        snapshot.net
      ),

    byFinancialState:
      safeObject(
        snapshot.byFinancialState
      ),

    byLineType:
      safeObject(
        snapshot.byLineType
      ),

    byDocumentType:
      safeObject(
        snapshot.byDocumentType
      )
  };
}


/* =========================================================
   AOF2 COMPLETE VIEW MODEL
   ========================================================= */

/*
 * This is the object the Financial Face
 * should consume.
 *
 * One call.
 * One shape.
 */

export function createIXIAosFinancialViewModel({
  source = null,
  currency = "USD"
} = {}) {
  const data =
    getIXIAosFinancialSnapshotData(
      source
    );


  const resolvedCurrency =
    getIXIAosFinancialSnapshotCurrency(
      data,
      currency
    );


  const lifecycle =
    getIXIAosFinancialLifecycleValues(
      data
    );


  const facts =
    getIXIAosFinancialFactValues(
      data,
      resolvedCurrency
    );


  const recentActivity =
    getIXIAosFinancialRecentActivity(
      data
    );


  const rawFacts =
    getIXIAosFinancialFacts(
      data,
      resolvedCurrency
    );


  return {
    currency:
      resolvedCurrency,


    /*
     * SCOPE
     */

    passportId:
      clean(
        data.passportId
      ),

    rootPassportId:
      clean(
        data.rootPassportId
      ),

    scopePassportIds:
      safeArray(
        data.scopePassportIds
      ),


    /*
     * PAYABLE / COST SIDE
     */

    commitment:
      lifecycle.commitment,

    remainingCommitment:
      lifecycle
        .remainingCommitment,

    incurredCost:
      lifecycle.incurredCost,

    paid:
      lifecycle.paid,

    unpaid:
      lifecycle.unpaid,

    projectedOutflow:
      lifecycle.projectedOutflow,


    /*
     * RECEIVABLE / REVENUE SIDE
     */

    revenue:
      lifecycle.revenue,

    collected:
      lifecycle.collected,

    receivable:
      lifecycle.receivable,


    /*
     * OPERATING RESULT
     */

    operatingNet:
      lifecycle.operatingNet,


    /*
     * RAW FINANCIAL MOVEMENT
     */

    inflow:
      facts.inflow,

    outflow:
      facts.outflow,

    neutral:
      facts.neutral,

    net:
      facts.net,


    /*
     * COUNTS
     */

    factCount:
      facts.factCount,

    documentCount:
      facts.documentCount,


    /*
     * BREAKDOWNS
     */

    byFinancialState:
      facts.byFinancialState,

    byLineType:
      facts.byLineType,

    byDocumentType:
      facts.byDocumentType,


    /*
     * DETAIL
     */

    recentActivity,

    facts:
      rawFacts,


    /*
     * RAW SOURCE
     *
     * Kept available for advanced consoles
     * without forcing the Face to know the
     * server envelope.
     */

    raw:
      data
  };
}


/* =========================================================
   EMPTY MODEL
   ========================================================= */

export function createEmptyIXIAosFinancialViewModel(
  currency = "USD"
) {
  return createIXIAosFinancialViewModel({
    source: {
      currency:
        normalizeCurrency(
          currency
        ),

      lifecycleSnapshot: {
        currency:
          normalizeCurrency(
            currency
          )
      },

      financialSnapshot: {
        snapshots: {
          [
            normalizeCurrency(
              currency
            )
          ]: {
            currency:
              normalizeCurrency(
                currency
              )
          }
        }
      },

      recentActivity:
        []
    },

    currency
  });
}


/* =========================================================
   HAS FINANCIAL ACTIVITY
   ========================================================= */

export function hasIXIAosFinancialActivity(
  source,
  currency = "USD"
) {
  const viewModel =
    createIXIAosFinancialViewModel({
      source,
      currency
    });


  return (
    viewModel.factCount >
      0 ||
    viewModel.documentCount >
      0
  );
}


/* =========================================================
   AOF2 SUMMARY
   ========================================================= */

/*
 * Small stable summary useful for cards,
 * shells, headers, or other AOS modules.
 */

export function getIXIAosFinancialSummary({
  source = null,
  currency = "USD"
} = {}) {
  const model =
    createIXIAosFinancialViewModel({
      source,
      currency
    });


  return {
    currency:
      model.currency,

    commitment:
      model.commitment,

    incurredCost:
      model.incurredCost,

    paid:
      model.paid,

    unpaid:
      model.unpaid,

    revenue:
      model.revenue,

    collected:
      model.collected,

    receivable:
      model.receivable,

    operatingNet:
      model.operatingNet,

    documentCount:
      model.documentCount,

    factCount:
      model.factCount
  };
}


/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

export default {
  getIXIAosFinancialSnapshotData,

  getIXIAosFinancialSnapshotCurrency,

  getIXIAosLifecycleSnapshot,

  getIXIAosFinancialFactSnapshot,

  getIXIAosFinancialRecentActivity,

  getIXIAosFinancialFacts,

  getIXIAosFinancialLifecycleValues,

  getIXIAosFinancialFactValues,

  createIXIAosFinancialViewModel,

  createEmptyIXIAosFinancialViewModel,

  hasIXIAosFinancialActivity,

  getIXIAosFinancialSummary
};
