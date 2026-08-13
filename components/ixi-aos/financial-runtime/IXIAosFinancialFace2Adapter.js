/*
 * IXI AOS FINANCIAL FACE 2 ADAPTER
 *
 * PURPOSE
 * -------
 *
 * Converts IXI Financial Engine output into
 * the stable data contract consumed by:
 *
 *   IXIAosFinancialFace2
 *
 *
 * AOF2 should not need to understand:
 *
 * - rollup internals
 * - lifecycle internals
 * - raw Financial Documents
 * - raw Financial Lines
 * - AWS response shapes
 *
 *
 * The adapter owns that translation.
 *
 *
 * FUTURE DATA FLOW
 * ----------------
 *
 * AWS
 *   ↓
 * Financial Engine
 *   ↓
 * Financial Face 2 Adapter
 *   ↓
 * AOF2
 *
 *
 * CORE RULE
 * ---------
 *
 * UI SHAPE IS STABLE.
 *
 * DATA SOURCES MAY EVOLVE.
 */


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


/* =========================================================
   CURRENCY
   ========================================================= */

export function normalizeAosFinancialFace2Currency(
  value,
  fallback = "USD"
) {

  const currency =
    clean(
      value ||
      fallback
    )
      .toUpperCase();


  return /^[A-Z]{3}$/.test(
    currency
  )
    ? currency
    : clean(
        fallback ||
        "USD"
      )
        .toUpperCase();
}


/* =========================================================
   SNAPSHOT EXTRACTION
   ========================================================= */

export function getAosFinancialFace2CurrencySnapshot(
  financialSnapshot = {},
  currency = "USD"
) {

  const source =
    safeObject(
      financialSnapshot
    );


  const resolvedCurrency =
    normalizeAosFinancialFace2Currency(
      currency
    );


  return safeObject(
    source
      ?.snapshots
      ?.[
        resolvedCurrency
      ]
  );
}


/* =========================================================
   LIFECYCLE NORMALIZATION
   ========================================================= */

export function normalizeAosFinancialFace2Lifecycle(
  lifecycleSnapshot = {},
  {
    fallbackOutflow = 0,
    fallbackInflow = 0
  } = {}
) {

  const source =
    safeObject(
      lifecycleSnapshot
    );


  const incurredCost =
    safeNumber(
      source.incurredCost,
      fallbackOutflow
    );


  const remainingCommitment =
    safeNumber(
      source.remainingCommitment,
      0
    );


  const revenue =
    safeNumber(
      source.revenue,
      fallbackInflow
    );


  const paid =
    safeNumber(
      source.paid,
      0
    );


  const unpaid =
    safeNumber(
      source.unpaid,
      Math.max(
        0,
        incurredCost -
        paid
      )
    );


  const collected =
    safeNumber(
      source.collected,
      0
    );


  const receivable =
    safeNumber(
      source.receivable,
      Math.max(
        0,
        revenue -
        collected
      )
    );


  return {
    commitment:
      safeNumber(
        source.commitment,
        0
      ),

    remainingCommitment,

    incurredCost,

    paid,

    unpaid,

    revenue,

    collected,

    receivable,

    projectedOutflow:
      safeNumber(
        source.projectedOutflow,
        incurredCost +
        remainingCommitment
      ),

    operatingNet:
      safeNumber(
        source.operatingNet,
        revenue -
        incurredCost
      )
  };
}


/* =========================================================
   RECENT ACTIVITY FROM FACTS
   ========================================================= */

/*
 * AOF2 only needs a small recent activity
 * list.
 *
 * This intentionally does not expose the
 * full Financial Document model.
 */

export function createAosFinancialFace2RecentActivityFromFacts(
  facts = [],
  {
    limit = 3
  } = {}
) {

  const resolvedLimit =
    Math.max(
      0,
      Number(
        limit
      ) ||
      3
    );


  return safeArray(
    facts
  )
    .map(
      fact => {

        const source =
          safeObject(
            fact
          );


        return {
          id:
            clean(
              source.factKey ||

              source.financialLineId ||

              source.financialDocumentId
            ),

          financialDocumentId:
            clean(
              source.financialDocumentId
            ),

          financialLineId:
            clean(
              source.financialLineId
            ),

          documentType:
            clean(
              source.documentType
            ),

          documentNumber:
            clean(
              source.documentNumber
            ),

          lineType:
            clean(
              source.lineType
            ),

          label:
            clean(
              source.description ||

              source.documentNumber ||

              source.documentType ||

              source.lineType ||

              "FINANCIAL ACTIVITY"
            ),

          occurredAt:
            clean(
              source.occurredAt
            ),

          amount:
            safeNumber(
              source.amount,
              0
            ),

          direction:
            clean(
              source.direction
            ),

          currency:
            normalizeAosFinancialFace2Currency(
              source.currency
            )
        };
      }
    )
    .sort(
      (
        a,
        b
      ) => {

        const timeA =
          new Date(
            a.occurredAt ||
            0
          )
            .getTime();


        const timeB =
          new Date(
            b.occurredAt ||
            0
          )
            .getTime();


        return (
          (
            Number.isNaN(
              timeB
            )
              ? 0
              : timeB
          ) -
          (
            Number.isNaN(
              timeA
            )
              ? 0
              : timeA
          )
        );
      }
    )
    .slice(
      0,
      resolvedLimit
    );
}


/* =========================================================
   LINE TYPE BREAKDOWN
   ========================================================= */

export function normalizeAosFinancialFace2LineTypeBreakdown(
  financialSnapshot = {},
  currency = "USD"
) {

  const snapshot =
    getAosFinancialFace2CurrencySnapshot(
      financialSnapshot,
      currency
    );


  const source =
    safeObject(
      snapshot.byLineType
    );


  return Object.keys(
    source
  ).reduce(
    (
      result,
      key
    ) => {

      const item =
        safeObject(
          source[
            key
          ]
        );


      result[
        key
      ] = {
        lineType:
          clean(
            item.lineType ||
            key
          ),

        count:
          safeNumber(
            item.count,
            0
          ),

        inflow:
          safeNumber(
            item.inflow,
            0
          ),

        outflow:
          safeNumber(
            item.outflow,
            0
          ),

        neutral:
          safeNumber(
            item.neutral,
            0
          ),

        net:
          safeNumber(
            item.net,
            0
          )
      };


      return result;
    },
    {}
  );
}


/* =========================================================
   DOCUMENT TYPE BREAKDOWN
   ========================================================= */

export function normalizeAosFinancialFace2DocumentTypeBreakdown(
  financialSnapshot = {},
  currency = "USD"
) {

  const snapshot =
    getAosFinancialFace2CurrencySnapshot(
      financialSnapshot,
      currency
    );


  const source =
    safeObject(
      snapshot.byDocumentType
    );


  return Object.keys(
    source
  ).reduce(
    (
      result,
      key
    ) => {

      const item =
        safeObject(
          source[
            key
          ]
        );


      result[
        key
      ] = {
        documentType:
          clean(
            item.documentType ||
            key
          ),

        factCount:
          safeNumber(
            item.factCount,
            0
          ),

        documentIds:
          safeArray(
            item.documentIds
          )
            .map(
              clean
            )
            .filter(
              Boolean
            ),

        inflow:
          safeNumber(
            item.inflow,
            0
          ),

        outflow:
          safeNumber(
            item.outflow,
            0
          ),

        neutral:
          safeNumber(
            item.neutral,
            0
          ),

        net:
          safeNumber(
            item.net,
            0
          )
      };


      return result;
    },
    {}
  );
}


/* =========================================================
   PERIOD LABEL
   ========================================================= */

export function createAosFinancialFace2PeriodLabel({
  periodLabel = "",
  startAt = "",
  endAt = ""
} = {}) {

  const explicit =
    clean(
      periodLabel
    );


  if (
    explicit
  ) {
    return explicit;
  }


  if (
    startAt &&
    endAt
  ) {
    return "PERIOD";
  }


  if (
    startAt
  ) {
    return "FROM";
  }


  return "YTD";
}


/* =========================================================
   MAIN ADAPTER
   ========================================================= */

export function createAosFinancialFace2Model({
  financialSnapshot = {},

  lifecycleSnapshot = {},

  currency = "USD",

  periodLabel = "",

  recentActivity = null,

  recentActivityLimit = 3
} = {}) {

  const resolvedCurrency =
    normalizeAosFinancialFace2Currency(
      currency
    );


  const currencySnapshot =
    getAosFinancialFace2CurrencySnapshot(
      financialSnapshot,
      resolvedCurrency
    );


  const outflow =
    safeNumber(
      currencySnapshot.outflow,
      0
    );


  const inflow =
    safeNumber(
      currencySnapshot.inflow,
      0
    );


  const lifecycle =
    normalizeAosFinancialFace2Lifecycle(
      lifecycleSnapshot,
      {
        fallbackOutflow:
          outflow,

        fallbackInflow:
          inflow
      }
    );


  const sourceFacts =
    safeArray(
      financialSnapshot
        ?.facts
    );


  const resolvedRecentActivity =
    Array.isArray(
      recentActivity
    )
      ? recentActivity

      : createAosFinancialFace2RecentActivityFromFacts(
          sourceFacts,
          {
            limit:
              recentActivityLimit
          }
        );


  return {
    currency:
      resolvedCurrency,

    periodLabel:
      createAosFinancialFace2PeriodLabel({
        periodLabel,

        startAt:
          financialSnapshot
            ?.startAt,

        endAt:
          financialSnapshot
            ?.endAt
      }),

    financialSnapshot,

    lifecycleSnapshot:
      lifecycle,

    recentActivity:
      resolvedRecentActivity,

    economics: {
      inflow,

      outflow,

      incurredCost:
        lifecycle.incurredCost,

      commitment:
        lifecycle.commitment,

      remainingCommitment:
        lifecycle.remainingCommitment,

      projectedOutflow:
        lifecycle.projectedOutflow,

      paid:
        lifecycle.paid,

      unpaid:
        lifecycle.unpaid,

      revenue:
        lifecycle.revenue,

      collected:
        lifecycle.collected,

      receivable:
        lifecycle.receivable,

      operatingNet:
        lifecycle.operatingNet
    },

    byLineType:
      normalizeAosFinancialFace2LineTypeBreakdown(
        financialSnapshot,
        resolvedCurrency
      ),

    byDocumentType:
      normalizeAosFinancialFace2DocumentTypeBreakdown(
        financialSnapshot,
        resolvedCurrency
      )
  };
}


/* =========================================================
   EMPTY MODEL
   ========================================================= */

/*
 * Useful before AWS is wired.
 *
 * We can render a real AOF2 without fake
 * Financial Documents.
 */

export function createEmptyAosFinancialFace2Model({
  currency = "USD",
  periodLabel = "YTD"
} = {}) {

  const resolvedCurrency =
    normalizeAosFinancialFace2Currency(
      currency
    );


  return createAosFinancialFace2Model({
    currency:
      resolvedCurrency,

    periodLabel,

    financialSnapshot: {
      snapshots: {
        [
          resolvedCurrency
        ]: {
          currency:
            resolvedCurrency,

          factCount:
            0,

          documentCount:
            0,

          inflow:
            0,

          outflow:
            0,

          neutral:
            0,

          net:
            0,

          byFinancialState:
            {},

          byLineType:
            {},

          byDocumentType:
            {}
        }
      },

      currencies: [
        resolvedCurrency
      ],

      facts: []
    },

    lifecycleSnapshot: {
      currency:
        resolvedCurrency,

      commitment:
        0,

      remainingCommitment:
        0,

      incurredCost:
        0,

      paid:
        0,

      unpaid:
        0,

      revenue:
        0,

      collected:
        0,

      receivable:
        0,

      projectedOutflow:
        0,

      operatingNet:
        0
    },

    recentActivity: []
  });
}


/* =========================================================
   FACE PROPS
   ========================================================= */

/*
 * Converts adapter model directly into the
 * prop subset expected by
 *
 * IXIAosFinancialFace2.
 */

export function createAosFinancialFace2Props(
  model = {}
) {

  const source =
    safeObject(
      model
    );


  return {
    currency:
      normalizeAosFinancialFace2Currency(
        source.currency
      ),

    financialSnapshot:
      safeObject(
        source.financialSnapshot
      ),

    lifecycleSnapshot:
      safeObject(
        source.lifecycleSnapshot
      ),

    recentActivity:
      safeArray(
        source.recentActivity
      ),

    periodLabel:
      clean(
        source.periodLabel
      ) ||
      "YTD"
  };
}


/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

export default {
  normalizeAosFinancialFace2Currency,

  getAosFinancialFace2CurrencySnapshot,

  normalizeAosFinancialFace2Lifecycle,

  createAosFinancialFace2RecentActivityFromFacts,

  normalizeAosFinancialFace2LineTypeBreakdown,
  normalizeAosFinancialFace2DocumentTypeBreakdown,

  createAosFinancialFace2PeriodLabel,

  createAosFinancialFace2Model,
  createEmptyAosFinancialFace2Model,

  createAosFinancialFace2Props
};
