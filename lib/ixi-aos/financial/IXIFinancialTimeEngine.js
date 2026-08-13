/*
 * IXI FINANCIAL TIME ENGINE
 *
 * PURPOSE
 * -------
 *
 * Makes time and labor first-class AOS
 * financial inputs.
 *
 *
 * USE CASES
 * ---------
 *
 * Mechanic:
 * 6.5 hours on machine
 *
 * Technician:
 * 3 hours on customer equipment
 *
 * Driver:
 * 10 hours on route
 *
 * Consultant:
 * 4.5 billable hours
 *
 * Teacher / school staff:
 * time against program / department
 *
 * Farm employee:
 * time against field / crop / equipment
 *
 *
 * CORE RULE
 * ---------
 *
 * Time is captured once.
 *
 * It may touch:
 *
 * - employee Passport
 * - asset Passport
 * - job Passport
 * - location Passport
 * - container Passport
 * - entity Passport
 * - any other legitimate AOS Passport
 *
 *
 * The resulting labor cost can then appear
 * in every relevant AOF2 scope without
 * duplicating the time entry.
 *
 *
 * IMPORTANT
 * ---------
 *
 * This engine does NOT:
 *
 * - perform payroll
 * - calculate taxes / deductions
 * - calculate overtime law
 * - persist to AWS
 * - infer employee relationships
 * - decide customer accounting codes
 *
 * Those belong to later layers.
 */


import {
  IXI_FINANCIAL_DIRECTIONS,
  IXI_FINANCIAL_DOCUMENT_TYPES,
  IXI_FINANCIAL_LINE_TYPES,
  IXI_FINANCIAL_STATES,
  IXI_FINANCIAL_UNITS,
  normalizeIXIFinancialCurrency
} from "./IXIFinancialTypes";


import {
  createIXIFinancialDocument
} from "./IXIFinancialDocumentEngine";


import {
  createIXIFinancialLine,
  roundIXIFinancialMoney,
  roundIXIFinancialQuantity,
  toIXIFinancialNumber
} from "./IXIFinancialLineEngine";


import {
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
   TIME QUANTITY
   ========================================================= */

export function normalizeIXIFinancialHours(
  value
) {

  return Math.max(
    0,
    roundIXIFinancialQuantity(
      toIXIFinancialNumber(
        value,
        0
      )
    )
  );
}


/* =========================================================
   RATE
   ========================================================= */

/*
 * rate may be:
 *
 * internal labor cost
 * loaded labor cost
 * billable rate
 * contractual rate
 *
 * The caller decides what the rate means.
 */

export function normalizeIXIFinancialTimeRate(
  value
) {

  return Math.max(
    0,
    roundIXIFinancialQuantity(
      toIXIFinancialNumber(
        value,
        0
      )
    )
  );
}


/* =========================================================
   TIME COST
   ========================================================= */

export function calculateIXIFinancialTimeCost({
  hours = 0,
  rate = 0
} = {}) {

  const resolvedHours =
    normalizeIXIFinancialHours(
      hours
    );


  const resolvedRate =
    normalizeIXIFinancialTimeRate(
      rate
    );


  return roundIXIFinancialMoney(
    resolvedHours *
    resolvedRate
  );
}


/* =========================================================
   BILLABLE VALUE
   ========================================================= */

export function calculateIXIFinancialBillableValue({
  hours = 0,
  billableRate = 0
} = {}) {

  const resolvedHours =
    normalizeIXIFinancialHours(
      hours
    );


  const resolvedRate =
    normalizeIXIFinancialTimeRate(
      billableRate
    );


  return roundIXIFinancialMoney(
    resolvedHours *
    resolvedRate
  );
}


/* =========================================================
   TIME METRICS
   ========================================================= */

export function createIXIFinancialTimeMetrics({
  hours = 0,

  costRate = 0,

  billableRate = 0,

  overtimeHours = 0,

  overtimeRate = 0,

  currency = "USD"
} = {}) {

  const resolvedHours =
    normalizeIXIFinancialHours(
      hours
    );


  const resolvedCostRate =
    normalizeIXIFinancialTimeRate(
      costRate
    );


  const resolvedBillableRate =
    normalizeIXIFinancialTimeRate(
      billableRate
    );


  const resolvedOvertimeHours =
    normalizeIXIFinancialHours(
      overtimeHours
    );


  const resolvedOvertimeRate =
    normalizeIXIFinancialTimeRate(
      overtimeRate
    );


  const regularHours =
    roundIXIFinancialQuantity(
      Math.max(
        0,
        resolvedHours -
        resolvedOvertimeHours
      )
    );


  const regularCost =
    calculateIXIFinancialTimeCost({
      hours:
        regularHours,

      rate:
        resolvedCostRate
    });


  const overtimeCost =
    calculateIXIFinancialTimeCost({
      hours:
        resolvedOvertimeHours,

      rate:
        resolvedOvertimeRate
    });


  const totalCost =
    roundIXIFinancialMoney(
      regularCost +
      overtimeCost
    );


  const billableValue =
    calculateIXIFinancialBillableValue({
      hours:
        resolvedHours,

      billableRate:
        resolvedBillableRate
    });


  return {
    currency:
      normalizeIXIFinancialCurrency(
        currency
      ),

    hours:
      resolvedHours,

    regularHours,

    overtimeHours:
      resolvedOvertimeHours,

    costRate:
      resolvedCostRate,

    overtimeRate:
      resolvedOvertimeRate,

    billableRate:
      resolvedBillableRate,

    regularCost,

    overtimeCost,

    totalCost,

    billableValue
  };
}


/* =========================================================
   TIME ENTRY LINE
   ========================================================= */

/*
 * This creates the labor/time financial line
 * that can participate in AOF2 rollups.
 */

export function createIXIFinancialTimeLine({
  financialLineId = "",

  financialDocumentId = "",

  description = "",

  hours = 0,

  costRate = 0,

  currency = "USD",

  references = [],

  occurredAt = "",

  memo = "",

  accounting = {},

  metadata = {}
} = {}) {

  const resolvedHours =
    normalizeIXIFinancialHours(
      hours
    );


  const resolvedRate =
    normalizeIXIFinancialTimeRate(
      costRate
    );


  return createIXIFinancialLine({
    financialLineId,

    financialDocumentId,

    lineType:
      IXI_FINANCIAL_LINE_TYPES
        .LABOR,

    description:
      clean(
        description
      ) ||
      "LABOR",

    quantity:
      resolvedHours,

    unit:
      IXI_FINANCIAL_UNITS
        .HOUR,

    rate:
      resolvedRate,

    currency:
      normalizeIXIFinancialCurrency(
        currency
      ),

    direction:
      IXI_FINANCIAL_DIRECTIONS
        .OUTFLOW,

    references:
      dedupeIXIFinancialReferences(
        references
      ),

    occurredAt,

    memo,

    accounting,

    metadata: {
      ...safeObject(
        metadata
      ),

      sourceType:
        "time-entry"
    }
  });
}


/* =========================================================
   BILLABLE TIME LINE
   ========================================================= */

/*
 * Separate revenue-side line when time is
 * billable.
 *
 * Cost and revenue remain separate facts.
 */

export function createIXIFinancialBillableTimeLine({
  financialLineId = "",

  financialDocumentId = "",

  description = "",

  hours = 0,

  billableRate = 0,

  currency = "USD",

  references = [],

  occurredAt = "",

  memo = "",

  accounting = {},

  metadata = {}
} = {}) {

  const resolvedHours =
    normalizeIXIFinancialHours(
      hours
    );


  const resolvedRate =
    normalizeIXIFinancialTimeRate(
      billableRate
    );


  return createIXIFinancialLine({
    financialLineId,

    financialDocumentId,

    lineType:
      IXI_FINANCIAL_LINE_TYPES
        .TIME,

    description:
      clean(
        description
      ) ||
      "BILLABLE TIME",

    quantity:
      resolvedHours,

    unit:
      IXI_FINANCIAL_UNITS
        .HOUR,

    rate:
      resolvedRate,

    currency:
      normalizeIXIFinancialCurrency(
        currency
      ),

    direction:
      IXI_FINANCIAL_DIRECTIONS
        .INFLOW,

    references:
      dedupeIXIFinancialReferences(
        references
      ),

    occurredAt,

    memo,

    accounting,

    metadata: {
      ...safeObject(
        metadata
      ),

      sourceType:
        "billable-time"
    }
  });
}


/* =========================================================
   TIME ENTRY DOCUMENT
   ========================================================= */

/*
 * Creates a standard TIME ENTRY document
 * containing the cost line.
 */

export function createIXIFinancialTimeEntry({
  financialDocumentId = "",

  documentNumber = "",

  title = "",

  description = "",

  employeePassportId = "",

  references = [],

  hours = 0,

  costRate = 0,

  billableRate = 0,

  currency = "USD",

  occurredAt = "",

  transactionDate = "",

  createdAt = "",

  createdByPassportId = "",

  memo = "",

  accounting = {},

  metadata = {}
} = {}) {

  const resolvedReferences =
    dedupeIXIFinancialReferences(
      references
    );


  const timeLine =
    createIXIFinancialTimeLine({
      financialDocumentId,

      description:
        description ||
        title ||
        "LABOR",

      hours,

      costRate,

      currency,

      references:
        resolvedReferences,

      occurredAt,

      memo,

      accounting,

      metadata: {
        ...safeObject(
          metadata
        ),

        employeePassportId:
          clean(
            employeePassportId
          )
      }
    });


  const document =
    createIXIFinancialDocument({
      financialDocumentId,

      documentType:
        IXI_FINANCIAL_DOCUMENT_TYPES
          .TIME_ENTRY,

      documentNumber,

      title:
        clean(
          title
        ) ||
        "TIME ENTRY",

      description,

      financialState:
        IXI_FINANCIAL_STATES
          .INCURRED,

      currency,

      transactionDate,

      occurredAt,

      createdAt,

      createdByPassportId,

      references:
        resolvedReferences,

      lines: [
        timeLine
      ],

      memo,

      metadata: {
        ...safeObject(
          metadata
        ),

        employeePassportId:
          clean(
            employeePassportId
          ),

        billableRate:
          normalizeIXIFinancialTimeRate(
            billableRate
          )
      }
    });


  return {
    ...document,

    time: {
      hours:
        normalizeIXIFinancialHours(
          hours
        ),

      costRate:
        normalizeIXIFinancialTimeRate(
          costRate
        ),

      billableRate:
        normalizeIXIFinancialTimeRate(
          billableRate
        ),

      cost:
        calculateIXIFinancialTimeCost({
          hours,
          rate:
            costRate
        }),

      billableValue:
        calculateIXIFinancialBillableValue({
          hours,
          billableRate
        })
    }
  };
}


/* =========================================================
   TIME ENTRY WITH OVERTIME
   ========================================================= */

export function createIXIFinancialTimeEntryWithOvertime({
  financialDocumentId = "",

  documentNumber = "",

  title = "",

  description = "",

  employeePassportId = "",

  references = [],

  hours = 0,

  costRate = 0,

  overtimeHours = 0,

  overtimeRate = 0,

  billableRate = 0,

  currency = "USD",

  occurredAt = "",

  transactionDate = "",

  createdAt = "",

  createdByPassportId = "",

  memo = "",

  metadata = {}
} = {}) {

  const metrics =
    createIXIFinancialTimeMetrics({
      hours,

      costRate,

      overtimeHours,

      overtimeRate,

      billableRate,

      currency
    });


  const resolvedReferences =
    dedupeIXIFinancialReferences(
      references
    );


  const lines =
    [];


  if (
    metrics.regularHours >
    0
  ) {

    lines.push(
      createIXIFinancialLine({
        financialDocumentId,

        lineType:
          IXI_FINANCIAL_LINE_TYPES
            .LABOR,

        description:
          clean(
            description
          ) ||
          "REGULAR LABOR",

        quantity:
          metrics.regularHours,

        unit:
          IXI_FINANCIAL_UNITS
            .HOUR,

        rate:
          metrics.costRate,

        currency:
          metrics.currency,

        direction:
          IXI_FINANCIAL_DIRECTIONS
            .OUTFLOW,

        references:
          resolvedReferences,

        occurredAt,

        metadata: {
          laborType:
            "regular"
        }
      })
    );
  }


  if (
    metrics.overtimeHours >
    0
  ) {

    lines.push(
      createIXIFinancialLine({
        financialDocumentId,

        lineType:
          IXI_FINANCIAL_LINE_TYPES
            .LABOR,

        description:
          "OVERTIME LABOR",

        quantity:
          metrics.overtimeHours,

        unit:
          IXI_FINANCIAL_UNITS
            .HOUR,

        rate:
          metrics.overtimeRate,

        currency:
          metrics.currency,

        direction:
          IXI_FINANCIAL_DIRECTIONS
            .OUTFLOW,

        references:
          resolvedReferences,

        occurredAt,

        metadata: {
          laborType:
            "overtime"
        }
      })
    );
  }


  const document =
    createIXIFinancialDocument({
      financialDocumentId,

      documentType:
        IXI_FINANCIAL_DOCUMENT_TYPES
          .TIME_ENTRY,

      documentNumber,

      title:
        clean(
          title
        ) ||
        "TIME ENTRY",

      description,

      financialState:
        IXI_FINANCIAL_STATES
          .INCURRED,

      currency:
        metrics.currency,

      transactionDate,

      occurredAt,

      createdAt,

      createdByPassportId,

      references:
        resolvedReferences,

      lines,

      memo,

      metadata: {
        ...safeObject(
          metadata
        ),

        employeePassportId:
          clean(
            employeePassportId
          ),

        billableRate:
          metrics.billableRate
      }
    });


  return {
    ...document,

    time:
      metrics
  };
}


/* =========================================================
   TIME SUMMARY
   ========================================================= */

export function summarizeIXIFinancialTimeEntries(
  documents = [],
  {
    employeePassportId = "",
    currency = "USD"
  } = {}
) {

  const targetEmployee =
    clean(
      employeePassportId
    );


  const resolvedCurrency =
    normalizeIXIFinancialCurrency(
      currency
    );


  let totalHours =
    0;

  let totalCost =
    0;

  let totalBillableValue =
    0;

  let entryCount =
    0;


  safeArray(
    documents
  ).forEach(
    document => {

      if (
        document
          ?.documentType !==
        IXI_FINANCIAL_DOCUMENT_TYPES
          .TIME_ENTRY
      ) {
        return;
      }


      if (
        targetEmployee &&
        clean(
          document
            ?.metadata
            ?.employeePassportId
        ) !==
        targetEmployee
      ) {
        return;
      }


      if (
        normalizeIXIFinancialCurrency(
          document.currency
        ) !==
        resolvedCurrency
      ) {
        return;
      }


      const hours =
        normalizeIXIFinancialHours(
          document
            ?.time
            ?.hours ||
          safeArray(
            document.lines
          )
            .filter(
              line =>
                line.lineType ===
                IXI_FINANCIAL_LINE_TYPES
                  .LABOR
            )
            .reduce(
              (
                sum,
                line
              ) =>
                sum +
                Number(
                  line.quantity ||
                  0
                ),
              0
            )
        );


      const cost =
        roundIXIFinancialMoney(
          document
            ?.time
            ?.totalCost ??
          document
            ?.time
            ?.cost ??
          safeArray(
            document.lines
          )
            .filter(
              line =>
                line.direction ===
                IXI_FINANCIAL_DIRECTIONS
                  .OUTFLOW
            )
            .reduce(
              (
                sum,
                line
              ) =>
                sum +
                Number(
                  line.amount ||
                  0
                ),
              0
            )
        );


      const billableValue =
        roundIXIFinancialMoney(
          document
            ?.time
            ?.billableValue ||
          0
        );


      totalHours =
        roundIXIFinancialQuantity(
          totalHours +
          hours
        );


      totalCost =
        roundIXIFinancialMoney(
          totalCost +
          cost
        );


      totalBillableValue =
        roundIXIFinancialMoney(
          totalBillableValue +
          billableValue
        );


      entryCount +=
        1;
    }
  );


  return {
    currency:
      resolvedCurrency,

    employeePassportId:
      targetEmployee,

    entryCount,

    totalHours,

    totalCost,

    totalBillableValue,

    grossMargin:
      roundIXIFinancialMoney(
        totalBillableValue -
        totalCost
      )
  };
}


/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

export default {
  normalizeIXIFinancialHours,
  normalizeIXIFinancialTimeRate,

  calculateIXIFinancialTimeCost,
  calculateIXIFinancialBillableValue,

  createIXIFinancialTimeMetrics,

  createIXIFinancialTimeLine,
  createIXIFinancialBillableTimeLine,

  createIXIFinancialTimeEntry,
  createIXIFinancialTimeEntryWithOvertime,

  summarizeIXIFinancialTimeEntries
};
