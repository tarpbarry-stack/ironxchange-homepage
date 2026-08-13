/*
 * IXI FINANCIAL ROLLUP ENGINE
 *
 * PURPOSE
 * -------
 *
 * Calculates financial snapshots for
 * Passport-bearing AOS scopes.
 *
 *
 * CORE DOCTRINE
 * -------------
 *
 * RECORD ONCE.
 * ATTRIBUTE EVERYWHERE.
 * SUM ONCE PER SCOPE.
 *
 *
 * Example:
 *
 * One fuel line:
 *
 * IXF-LINE-ABC
 * $680
 *
 * references:
 *
 * - Entity Passport
 * - Location Passport
 * - Job Passport
 * - Machine Passport
 * - Employee Passport
 *
 *
 * Therefore:
 *
 * Machine AOF2
 *   sees $680
 *
 * Job AOF2
 *   sees $680
 *
 * Location AOF2
 *   sees $680
 *
 * Entity AOF2
 *   sees $680
 *
 *
 * BUT:
 *
 * within any one rollup scope
 * IXF-LINE-ABC may only contribute once.
 *
 *
 * IMPORTANT
 * ---------
 *
 * This engine does NOT:
 *
 * - copy financial records
 * - mutate documents
 * - mutate Passport relationships
 * - persist to AWS
 * - post accounting entries
 * - invent customer hierarchy
 *
 *
 * It reads financial records and produces
 * trustworthy financial scope summaries.
 */


import {
  IXI_FINANCIAL_DIRECTIONS,
  IXI_FINANCIAL_DOCUMENT_STATUS,
  IXI_FINANCIAL_STATES,
  normalizeIXIFinancialCurrency,
  normalizeIXIFinancialDirection
} from "./IXIFinancialTypes";


import {
  normalizeIXIFinancialDocument
} from "./IXIFinancialDocumentEngine";


import {
  normalizeIXIFinancialLine,
  roundIXIFinancialMoney
} from "./IXIFinancialLineEngine";


import {
  createIXIFinancialScopeKey,
  dedupeIXIFinancialReferences
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


/* =========================================================
   FINANCIAL FACT KEY
   ========================================================= */

/*
 * A rollup fact is one Financial Line.
 *
 * This identity is what prevents the same
 * line from being counted twice inside the
 * same scope.
 */

export function createIXIFinancialFactKey({
  financialDocumentId = "",
  financialLineId = ""
} = {}) {

  const documentId =
    clean(
      financialDocumentId
    );


  const lineId =
    clean(
      financialLineId
    );


  if (
    lineId
  ) {
    return `line:${lineId}`;
  }


  if (
    documentId
  ) {
    return `document:${documentId}`;
  }


  return "";
}


/* =========================================================
   EXCLUDED DOCUMENT?
   ========================================================= */

/*
 * VOID / REVERSED / CANCELLED documents
 * do not contribute to active financial
 * rollups.
 *
 * Historical/audit views can still inspect
 * those records separately.
 */

export function isIXIFinancialDocumentExcludedFromRollup(
  document = {}
) {

  const normalized =
    normalizeIXIFinancialDocument(
      document
    );


  return (
    normalized.status ===
      IXI_FINANCIAL_DOCUMENT_STATUS
        .VOID ||

    normalized.status ===
      IXI_FINANCIAL_DOCUMENT_STATUS
        .REVERSED ||

    normalized.status ===
      IXI_FINANCIAL_DOCUMENT_STATUS
        .CANCELLED ||

    normalized.financialState ===
      IXI_FINANCIAL_STATES
        .VOID ||

    normalized.financialState ===
      IXI_FINANCIAL_STATES
        .REVERSED
  );
}


/* =========================================================
   EFFECTIVE REFERENCES
   ========================================================= */

/*
 * A line may carry more specific references
 * than its parent document.
 *
 * Example:
 *
 * Document:
 *   Vendor
 *   Job
 *
 * Line:
 *   Machine
 *   Employee
 *
 *
 * The financial fact legitimately touched
 * all four.
 *
 * Therefore effective references are the
 * deduped union of:
 *
 * document references
 * +
 * line references
 *
 *
 * If frozen historical references are
 * supplied, they are preferred because
 * historical reporting must reflect what
 * was true when the transaction occurred.
 */

export function getIXIFinancialEffectiveReferences({
  document = {},
  line = {},
  historicalReferences = []
} = {}) {

  const frozen =
    dedupeIXIFinancialReferences(
      historicalReferences
    );


  if (
    frozen.length
  ) {
    return frozen;
  }


  const normalizedDocument =
    normalizeIXIFinancialDocument(
      document
    );


  const normalizedLine =
    normalizeIXIFinancialLine(
      line
    );


  return dedupeIXIFinancialReferences([
    ...safeArray(
      normalizedDocument.references
    ),

    ...safeArray(
      normalizedLine.references
    )
  ]);
}


/* =========================================================
   UNIQUE PASSPORT IDS
   ========================================================= */

/*
 * Same Passport may legitimately appear in
 * more than one role.
 *
 * Rollup membership is by Passport identity,
 * not by role count.
 *
 * Therefore:
 *
 * asset:IXP-123
 * object:IXP-123
 *
 * still means the line contributes ONCE to
 * Passport IXP-123.
 */

export function getIXIFinancialReferencedPassportIds(
  references = []
) {

  return Array.from(
    new Set(
      dedupeIXIFinancialReferences(
        references
      )
        .map(
          reference =>
            clean(
              reference.passportId
            )
        )
        .filter(
          Boolean
        )
    )
  );
}


/* =========================================================
   LINE TOUCHES PASSPORT?
   ========================================================= */

export function doesIXIFinancialLineTouchPassport({
  document = {},
  line = {},
  passportId = "",
  historicalReferences = []
} = {}) {

  const target =
    clean(
      passportId
    );


  if (
    !target
  ) {
    return false;
  }


  const references =
    getIXIFinancialEffectiveReferences({
      document,
      line,
      historicalReferences
    });


  return getIXIFinancialReferencedPassportIds(
    references
  ).includes(
    target
  );
}


/* =========================================================
   CREATE ROLLUP FACT
   ========================================================= */

/*
 * Converts a document line into the small
 * immutable calculation shape used by the
 * rollup engine.
 */

export function createIXIFinancialRollupFact({
  document = {},
  line = {},
  historicalReferences = []
} = {}) {

  const normalizedDocument =
    normalizeIXIFinancialDocument(
      document
    );


  const normalizedLine =
    normalizeIXIFinancialLine(
      line
    );


  const references =
    getIXIFinancialEffectiveReferences({
      document:
        normalizedDocument,

      line:
        normalizedLine,

      historicalReferences
    });


  const passportIds =
    getIXIFinancialReferencedPassportIds(
      references
    );


  const factKey =
    createIXIFinancialFactKey({
      financialDocumentId:
        normalizedDocument
          .financialDocumentId,

      financialLineId:
        normalizedLine
          .financialLineId
    });


  return {
    factKey,

    financialDocumentId:
      normalizedDocument
        .financialDocumentId,

    financialLineId:
      normalizedLine
        .financialLineId,

    documentType:
      normalizedDocument
        .documentType,

    documentNumber:
      normalizedDocument
        .documentNumber,

    documentStatus:
      normalizedDocument
        .status,

    financialState:
      normalizedDocument
        .financialState,

    lineType:
      normalizedLine
        .lineType,

    description:
      normalizedLine
        .description,

    amount:
      roundIXIFinancialMoney(
        normalizedLine.amount
      ),

    currency:
      normalizeIXIFinancialCurrency(
        normalizedLine.currency ||
        normalizedDocument.currency
      ),

    direction:
      normalizeIXIFinancialDirection(
        normalizedLine.direction
      ),

    occurredAt:
      clean(
        normalizedLine.occurredAt ||

        normalizedDocument
          .dates
          ?.occurredAt ||

        normalizedDocument
          .dates
          ?.transactionDate ||

        normalizedDocument
          .dates
          ?.documentDate
      ),

    references,

    passportIds
  };
}


/* =========================================================
   DOCUMENT → FACTS
   ========================================================= */

export function createIXIFinancialRollupFactsFromDocument(
  document = {},
  {
    historicalReferences = []
  } = {}
) {

  const normalized =
    normalizeIXIFinancialDocument(
      document
    );


  if (
    isIXIFinancialDocumentExcludedFromRollup(
      normalized
    )
  ) {
    return [];
  }


  return normalized.lines
    .map(
      line =>
        createIXIFinancialRollupFact({
          document:
            normalized,

          line,

          historicalReferences
        })
    )
    .filter(
      fact =>
        Boolean(
          fact.factKey
        )
    );
}


/* =========================================================
   DOCUMENT COLLECTION → FACTS
   ========================================================= */

export function createIXIFinancialRollupFacts(
  documents = [],
  {
    historyByDocumentId = {}
  } = {}
) {

  const historyMap =
    safeObject(
      historyByDocumentId
    );


  return safeArray(
    documents
  ).flatMap(
    document => {

      const normalized =
        normalizeIXIFinancialDocument(
          document
        );


      const documentId =
        normalized
          .financialDocumentId;


      const history =
        safeObject(
          historyMap[
            documentId
          ]
        );


      const historicalReferences =
        safeArray(
          history.references
        );


      return createIXIFinancialRollupFactsFromDocument(
        normalized,
        {
          historicalReferences
        }
      );
    }
  );
}


/* =========================================================
   DEDUPE FACTS
   ========================================================= */

/*
 * Critical safety gate.
 *
 * If the same financial line somehow reaches
 * a rollup query twice, it still contributes
 * only once.
 */

export function dedupeIXIFinancialRollupFacts(
  facts = []
) {

  const map =
    new Map();


  safeArray(
    facts
  ).forEach(
    fact => {

      const source =
        safeObject(
          fact
        );


      const key =
        clean(
          source.factKey
        );


      if (
        !key
      ) {
        return;
      }


      if (
        !map.has(
          key
        )
      ) {
        map.set(
          key,
          source
        );
      }
    }
  );


  return Array.from(
    map.values()
  );
}


/* =========================================================
   FILTER FACTS FOR ONE PASSPORT
   ========================================================= */

export function getIXIFinancialFactsForPassport(
  facts = [],
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


  return dedupeIXIFinancialRollupFacts(
    facts
  ).filter(
    fact =>
      safeArray(
        fact.passportIds
      ).includes(
        target
      )
  );
}


/* =========================================================
   FILTER FACTS FOR MANY PASSPORTS
   ========================================================= */

/*
 * Used later for recursive Container/System
 * Index rollups.
 *
 * IMPORTANT:
 *
 * If one line touches TWO descendants of the
 * requested Container, that line is still
 * counted once for that Container.
 */

export function getIXIFinancialFactsForPassportSet(
  facts = [],
  passportIds = []
) {

  const targets =
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
    );


  if (
    !targets.size
  ) {
    return [];
  }


  return dedupeIXIFinancialRollupFacts(
    facts
  ).filter(
    fact =>
      safeArray(
        fact.passportIds
      ).some(
        passportId =>
          targets.has(
            passportId
          )
      )
  );
}


/* =========================================================
   CURRENCY GROUPING
   ========================================================= */

/*
 * Never blindly add USD + CAD + EUR.
 *
 * Currency conversion belongs to a dedicated
 * currency layer later.
 */

export function groupIXIFinancialFactsByCurrency(
  facts = []
) {

  return dedupeIXIFinancialRollupFacts(
    facts
  ).reduce(
    (
      groups,
      fact
    ) => {

      const currency =
        normalizeIXIFinancialCurrency(
          fact.currency
        );


      if (
        !groups[
          currency
        ]
      ) {
        groups[
          currency
        ] = [];
      }


      groups[
        currency
      ].push(
        fact
      );


      return groups;
    },
    {}
  );
}


/* =========================================================
   DIRECTION TOTALS
   ========================================================= */

export function calculateIXIFinancialDirectionTotals(
  facts = []
) {

  const normalized =
    dedupeIXIFinancialRollupFacts(
      facts
    );


  let inflow =
    0;

  let outflow =
    0;

  let neutral =
    0;


  normalized.forEach(
    fact => {

      const amount =
        roundIXIFinancialMoney(
          fact.amount
        );


      if (
        fact.direction ===
        IXI_FINANCIAL_DIRECTIONS
          .INFLOW
      ) {

        inflow +=
          amount;

        return;
      }


      if (
        fact.direction ===
        IXI_FINANCIAL_DIRECTIONS
          .OUTFLOW
      ) {

        outflow +=
          amount;

        return;
      }


      neutral +=
        amount;
    }
  );


  inflow =
    roundIXIFinancialMoney(
      inflow
    );


  outflow =
    roundIXIFinancialMoney(
      outflow
    );


  neutral =
    roundIXIFinancialMoney(
      neutral
    );


  return {
    inflow,

    outflow,

    neutral,

    net:
      roundIXIFinancialMoney(
        inflow -
        outflow
      )
  };
}


/* =========================================================
   FINANCIAL STATE BREAKDOWN
   ========================================================= */

export function getIXIFinancialStateBreakdown(
  facts = []
) {

  return dedupeIXIFinancialRollupFacts(
    facts
  ).reduce(
    (
      breakdown,
      fact
    ) => {

      const state =
        clean(
          fact.financialState
        ) ||
        IXI_FINANCIAL_STATES
          .PLANNED;


      if (
        !breakdown[
          state
        ]
      ) {

        breakdown[
          state
        ] = {
          financialState:
            state,

          count:
            0,

          inflow:
            0,

          outflow:
            0,

          neutral:
            0,

          net:
            0
        };
      }


      const bucket =
        breakdown[
          state
        ];


      bucket.count +=
        1;


      const amount =
        roundIXIFinancialMoney(
          fact.amount
        );


      if (
        fact.direction ===
        IXI_FINANCIAL_DIRECTIONS
          .INFLOW
      ) {

        bucket.inflow =
          roundIXIFinancialMoney(
            bucket.inflow +
            amount
          );
      } else if (
        fact.direction ===
        IXI_FINANCIAL_DIRECTIONS
          .OUTFLOW
      ) {

        bucket.outflow =
          roundIXIFinancialMoney(
            bucket.outflow +
            amount
          );
      } else {

        bucket.neutral =
          roundIXIFinancialMoney(
            bucket.neutral +
            amount
          );
      }


      bucket.net =
        roundIXIFinancialMoney(
          bucket.inflow -
          bucket.outflow
        );


      return breakdown;
    },
    {}
  );
}


/* =========================================================
   LINE TYPE BREAKDOWN
   ========================================================= */

export function getIXIFinancialRollupLineTypeBreakdown(
  facts = []
) {

  return dedupeIXIFinancialRollupFacts(
    facts
  ).reduce(
    (
      breakdown,
      fact
    ) => {

      const type =
        clean(
          fact.lineType
        ) ||
        "other";


      if (
        !breakdown[
          type
        ]
      ) {

        breakdown[
          type
        ] = {
          lineType:
            type,

          count:
            0,

          inflow:
            0,

          outflow:
            0,

          neutral:
            0,

          net:
            0
        };
      }


      const bucket =
        breakdown[
          type
        ];


      bucket.count +=
        1;


      const amount =
        roundIXIFinancialMoney(
          fact.amount
        );


      if (
        fact.direction ===
        IXI_FINANCIAL_DIRECTIONS
          .INFLOW
      ) {

        bucket.inflow =
          roundIXIFinancialMoney(
            bucket.inflow +
            amount
          );

      } else if (
        fact.direction ===
        IXI_FINANCIAL_DIRECTIONS
          .OUTFLOW
      ) {

        bucket.outflow =
          roundIXIFinancialMoney(
            bucket.outflow +
            amount
          );

      } else {

        bucket.neutral =
          roundIXIFinancialMoney(
            bucket.neutral +
            amount
          );
      }


      bucket.net =
        roundIXIFinancialMoney(
          bucket.inflow -
          bucket.outflow
        );


      return breakdown;
    },
    {}
  );
}


/* =========================================================
   DOCUMENT TYPE BREAKDOWN
   ========================================================= */

export function getIXIFinancialRollupDocumentTypeBreakdown(
  facts = []
) {

  return dedupeIXIFinancialRollupFacts(
    facts
  ).reduce(
    (
      breakdown,
      fact
    ) => {

      const type =
        clean(
          fact.documentType
        ) ||
        "unknown";


      if (
        !breakdown[
          type
        ]
      ) {

        breakdown[
          type
        ] = {
          documentType:
            type,

          factCount:
            0,

          documentIds:
            [],

          inflow:
            0,

          outflow:
            0,

          neutral:
            0,

          net:
            0
        };
      }


      const bucket =
        breakdown[
          type
        ];


      bucket.factCount +=
        1;


      if (
        fact.financialDocumentId &&
        !bucket.documentIds.includes(
          fact.financialDocumentId
        )
      ) {

        bucket.documentIds.push(
          fact.financialDocumentId
        );
      }


      const amount =
        roundIXIFinancialMoney(
          fact.amount
        );


      if (
        fact.direction ===
        IXI_FINANCIAL_DIRECTIONS
          .INFLOW
      ) {

        bucket.inflow =
          roundIXIFinancialMoney(
            bucket.inflow +
            amount
          );

      } else if (
        fact.direction ===
        IXI_FINANCIAL_DIRECTIONS
          .OUTFLOW
      ) {

        bucket.outflow =
          roundIXIFinancialMoney(
            bucket.outflow +
            amount
          );

      } else {

        bucket.neutral =
          roundIXIFinancialMoney(
            bucket.neutral +
            amount
          );
      }


      bucket.net =
        roundIXIFinancialMoney(
          bucket.inflow -
          bucket.outflow
        );


      return breakdown;
    },
    {}
  );
}


/* =========================================================
   DATE FILTER
   ========================================================= */

export function filterIXIFinancialFactsByDateRange(
  facts = [],
  {
    startAt = "",
    endAt = ""
  } = {}
) {

  const start =
    clean(
      startAt
    )
      ? new Date(
          startAt
        ).getTime()
      : null;


  const end =
    clean(
      endAt
    )
      ? new Date(
          endAt
        ).getTime()
      : null;


  return dedupeIXIFinancialRollupFacts(
    facts
  ).filter(
    fact => {

      if (
        !fact.occurredAt
      ) {
        return (
          start === null &&
          end === null
        );
      }


      const timestamp =
        new Date(
          fact.occurredAt
        ).getTime();


      if (
        Number.isNaN(
          timestamp
        )
      ) {
        return false;
      }


      if (
        start !== null &&
        timestamp <
        start
      ) {
        return false;
      }


      if (
        end !== null &&
        timestamp >
        end
      ) {
        return false;
      }


      return true;
    }
  );
}


/* =========================================================
   BUILD ONE CURRENCY SNAPSHOT
   ========================================================= */

export function createIXIFinancialCurrencySnapshot({
  facts = [],
  currency = "USD"
} = {}) {

  const resolvedCurrency =
    normalizeIXIFinancialCurrency(
      currency
    );


  const matchingFacts =
    dedupeIXIFinancialRollupFacts(
      facts
    ).filter(
      fact =>
        normalizeIXIFinancialCurrency(
          fact.currency
        ) ===
        resolvedCurrency
    );


  const directionTotals =
    calculateIXIFinancialDirectionTotals(
      matchingFacts
    );


  const uniqueDocumentIds =
    Array.from(
      new Set(
        matchingFacts
          .map(
            fact =>
              clean(
                fact.financialDocumentId
              )
          )
          .filter(
            Boolean
          )
      )
    );


  return {
    currency:
      resolvedCurrency,

    factCount:
      matchingFacts.length,

    documentCount:
      uniqueDocumentIds.length,

    inflow:
      directionTotals.inflow,

    outflow:
      directionTotals.outflow,

    neutral:
      directionTotals.neutral,

    net:
      directionTotals.net,

    byFinancialState:
      getIXIFinancialStateBreakdown(
        matchingFacts
      ),

    byLineType:
      getIXIFinancialRollupLineTypeBreakdown(
        matchingFacts
      ),

    byDocumentType:
      getIXIFinancialRollupDocumentTypeBreakdown(
        matchingFacts
      )
  };
}


/* =========================================================
   BUILD PASSPORT SNAPSHOT
   ========================================================= */

/*
 * This is the foundation for AOF2.
 *
 * Give it:
 *
 * Passport ID
 * +
 * financial facts
 *
 * and it returns the economic snapshot for
 * that exact Object / Container.
 */

export function createIXIFinancialPassportSnapshot({
  passportId = "",
  facts = [],
  startAt = "",
  endAt = ""
} = {}) {

  const resolvedPassportId =
    clean(
      passportId
    );


  const scopeKey =
    createIXIFinancialScopeKey(
      resolvedPassportId
    );


  let scopedFacts =
    getIXIFinancialFactsForPassport(
      facts,
      resolvedPassportId
    );


  if (
    startAt ||
    endAt
  ) {

    scopedFacts =
      filterIXIFinancialFactsByDateRange(
        scopedFacts,
        {
          startAt,
          endAt
        }
      );
  }


  const currencyGroups =
    groupIXIFinancialFactsByCurrency(
      scopedFacts
    );


  const currencies =
    Object.keys(
      currencyGroups
    );


  const snapshots =
    currencies.reduce(
      (
        result,
        currency
      ) => {

        result[
          currency
        ] =
          createIXIFinancialCurrencySnapshot({
            facts:
              currencyGroups[
                currency
              ],

            currency
          });


        return result;
      },
      {}
    );


  return {
    scopeType:
      "passport",

    passportId:
      resolvedPassportId,

    scopeKey,

    startAt:
      clean(
        startAt
      ),

    endAt:
      clean(
        endAt
      ),

    currencies,

    snapshots,

    facts:
      scopedFacts
  };
}


/* =========================================================
   BUILD RECURSIVE SCOPE SNAPSHOT
   ========================================================= */

/*
 * Used for:
 *
 * Entity
 * System Index
 * Container
 * Sub-container
 * etc.
 *
 *
 * Caller supplies the Passport IDs that are
 * legitimately inside the requested scope.
 *
 * Example:
 *
 * DOZERS Container Passport
 *
 * scopePassportIds:
 *
 * [
 *   dozersContainerPassport,
 *   d6Passport,
 *   d7Passport,
 *   d8Passport
 * ]
 *
 *
 * If one expense references BOTH:
 *
 * the D6
 * AND
 * the DOZERS Container
 *
 * it still contributes once.
 */

export function createIXIFinancialRecursiveScopeSnapshot({
  rootPassportId = "",
  scopePassportIds = [],
  facts = [],
  startAt = "",
  endAt = ""
} = {}) {

  const root =
    clean(
      rootPassportId
    );


  const allScopePassportIds =
    Array.from(
      new Set([
        root,

        ...safeArray(
          scopePassportIds
        )
          .map(
            clean
          )
      ].filter(
        Boolean
      ))
    );


  let scopedFacts =
    getIXIFinancialFactsForPassportSet(
      facts,
      allScopePassportIds
    );


  if (
    startAt ||
    endAt
  ) {

    scopedFacts =
      filterIXIFinancialFactsByDateRange(
        scopedFacts,
        {
          startAt,
          endAt
        }
      );
  }


  const currencyGroups =
    groupIXIFinancialFactsByCurrency(
      scopedFacts
    );


  const currencies =
    Object.keys(
      currencyGroups
    );


  const snapshots =
    currencies.reduce(
      (
        result,
        currency
      ) => {

        result[
          currency
        ] =
          createIXIFinancialCurrencySnapshot({
            facts:
              currencyGroups[
                currency
              ],

            currency
          });


        return result;
      },
      {}
    );


  return {
    scopeType:
      "recursive-passport-set",

    rootPassportId:
      root,

    scopePassportIds:
      allScopePassportIds,

    startAt:
      clean(
        startAt
      ),

    endAt:
      clean(
        endAt
      ),

    currencies,

    snapshots,

    facts:
      scopedFacts
  };
}


/* =========================================================
   SIMPLE OUTGOING COST SELECTOR
   ========================================================= */

/*
 * Convenience selector for AOF2.
 *
 * Returns outgoing value only.
 *
 * This is NOT yet "actual cost" lifecycle
 * accounting.
 *
 * The Lifecycle Engine will distinguish:
 *
 * committed
 * incurred
 * billed
 * paid
 *
 * without double counting PO → Bill chains.
 */

export function getIXIFinancialScopeOutflow(
  snapshot = {},
  currency = "USD"
) {

  const source =
    safeObject(
      snapshot
    );


  const resolvedCurrency =
    normalizeIXIFinancialCurrency(
      currency
    );


  return roundIXIFinancialMoney(
    source
      .snapshots
      ?.[
        resolvedCurrency
      ]
      ?.outflow ||
    0
  );
}


/* =========================================================
   SIMPLE INFLOW SELECTOR
   ========================================================= */

export function getIXIFinancialScopeInflow(
  snapshot = {},
  currency = "USD"
) {

  const source =
    safeObject(
      snapshot
    );


  const resolvedCurrency =
    normalizeIXIFinancialCurrency(
      currency
    );


  return roundIXIFinancialMoney(
    source
      .snapshots
      ?.[
        resolvedCurrency
      ]
      ?.inflow ||
    0
  );
}


/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

export default {
  createIXIFinancialFactKey,

  isIXIFinancialDocumentExcludedFromRollup,

  getIXIFinancialEffectiveReferences,
  getIXIFinancialReferencedPassportIds,

  doesIXIFinancialLineTouchPassport,

  createIXIFinancialRollupFact,

  createIXIFinancialRollupFactsFromDocument,
  createIXIFinancialRollupFacts,

  dedupeIXIFinancialRollupFacts,

  getIXIFinancialFactsForPassport,
  getIXIFinancialFactsForPassportSet,

  groupIXIFinancialFactsByCurrency,

  calculateIXIFinancialDirectionTotals,

  getIXIFinancialStateBreakdown,
  getIXIFinancialRollupLineTypeBreakdown,
  getIXIFinancialRollupDocumentTypeBreakdown,

  filterIXIFinancialFactsByDateRange,

  createIXIFinancialCurrencySnapshot,

  createIXIFinancialPassportSnapshot,
  createIXIFinancialRecursiveScopeSnapshot,

  getIXIFinancialScopeOutflow,
  getIXIFinancialScopeInflow
};
