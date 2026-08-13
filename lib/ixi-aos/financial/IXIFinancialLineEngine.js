/*
 * IXI FINANCIAL LINE ENGINE
 *
 * PURPOSE
 * -------
 *
 * Creates, normalizes and calculates the
 * individual financial lines that ultimately
 * make up:
 *
 * - expenses
 * - purchase orders
 * - work orders
 * - bills
 * - invoices
 * - time entries
 * - labor
 * - parts
 * - fuel
 * - materials
 * - freight
 * - rentals
 * - fees
 * - taxes
 * - credits
 * - revenue
 *
 *
 * CORE RULE
 * ---------
 *
 * The document is the recognizable business
 * record.
 *
 * The line is where the financial math lives.
 *
 *
 * Example:
 *
 * WORK ORDER WO-44309
 *
 *   Labor             $1,260
 *   Hydraulic Pump    $3,840
 *   Outside Service     $650
 *
 * TOTAL               $5,750
 *
 *
 * Each line has:
 *
 * - stable IXI Financial Line ID
 * - quantity
 * - unit
 * - rate / unit price
 * - subtotal
 * - discount
 * - tax
 * - total amount
 * - currency
 * - financial direction
 * - Passport references
 * - optional accounting preparation
 *
 *
 * IMPORTANT
 * ---------
 *
 * This engine does NOT:
 *
 * - persist to AWS
 * - post to accounting software
 * - decide the user's chart of accounts
 * - decide their folder hierarchy
 * - perform document-level rollups
 * - recursively sum Passport containers
 *
 * Those belong to later engines.
 */


import {
  IXI_FINANCIAL_DIRECTIONS,
  IXI_FINANCIAL_ENTRY_SIDES,
  IXI_FINANCIAL_LINE_TYPES,
  IXI_FINANCIAL_TAX_MODES,
  IXI_FINANCIAL_TAX_STATUS,
  normalizeIXIFinancialCurrency,
  normalizeIXIFinancialDirection,
  normalizeIXIFinancialLineType
} from "./IXIFinancialTypes";


import {
  ensureIXIFinancialLineId
} from "./IXIFinancialIdentityEngine";


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
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
  )
    ? value
    : {};
}


/* =========================================================
   NUMERIC HELPERS
   ========================================================= */

export function toIXIFinancialNumber(
  value,
  fallback = 0
) {

  if (
    typeof value ===
      "number" &&
    Number.isFinite(
      value
    )
  ) {
    return value;
  }


  const cleaned =
    clean(
      value
    )
      .replace(
        /[$,%\s,]/g,
        ""
      );


  if (
    !cleaned
  ) {
    return fallback;
  }


  const parsed =
    Number(
      cleaned
    );


  return Number.isFinite(
    parsed
  )
    ? parsed
    : fallback;
}


/* =========================================================
   MONEY PRECISION
   ========================================================= */

/*
 * V1 standard:
 *
 * monetary outputs normalize to 2 decimals.
 *
 * Quantity and rate may keep greater
 * precision because:
 *
 * 7.25 hours
 * 3.187 gallons
 * 1.375 tons
 *
 * can matter operationally.
 *
 * Multi-currency decimal rules can later
 * be extended by currency metadata without
 * rewriting this engine contract.
 */

export function roundIXIFinancialMoney(
  value
) {

  const number =
    toIXIFinancialNumber(
      value,
      0
    );


  return Math.round(
    (
      number +
      Number.EPSILON
    ) *
    100
  ) / 100;
}


export function roundIXIFinancialQuantity(
  value
) {

  const number =
    toIXIFinancialNumber(
      value,
      0
    );


  return Math.round(
    (
      number +
      Number.EPSILON
    ) *
    1000000
  ) / 1000000;
}


/* =========================================================
   TAX MODE
   ========================================================= */

export function normalizeIXIFinancialTaxMode(
  value,
  fallback =
    IXI_FINANCIAL_TAX_MODES
      .NONE
) {

  const cleaned =
    clean(
      value
    )
      .toLowerCase();


  const allowed =
    Object.values(
      IXI_FINANCIAL_TAX_MODES
    );


  return allowed.includes(
    cleaned
  )
    ? cleaned
    : fallback;
}


/* =========================================================
   TAX STATUS
   ========================================================= */

export function normalizeIXIFinancialTaxStatus(
  value,
  fallback =
    IXI_FINANCIAL_TAX_STATUS
      .NOT_APPLICABLE
) {

  const cleaned =
    clean(
      value
    )
      .toLowerCase();


  const allowed =
    Object.values(
      IXI_FINANCIAL_TAX_STATUS
    );


  return allowed.includes(
    cleaned
  )
    ? cleaned
    : fallback;
}


/* =========================================================
   ENTRY SIDE
   ========================================================= */

export function normalizeIXIFinancialEntrySide(
  value,
  fallback = ""
) {

  const cleaned =
    clean(
      value
    )
      .toLowerCase();


  const allowed =
    Object.values(
      IXI_FINANCIAL_ENTRY_SIDES
    );


  return allowed.includes(
    cleaned
  )
    ? cleaned
    : fallback;
}


/* =========================================================
   LINE MATH INPUTS
   ========================================================= */

export function normalizeIXIFinancialLineQuantity(
  value,
  fallback = 1
) {

  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return fallback;
  }


  return roundIXIFinancialQuantity(
    toIXIFinancialNumber(
      value,
      fallback
    )
  );
}


export function normalizeIXIFinancialLineRate(
  value
) {

  return roundIXIFinancialQuantity(
    toIXIFinancialNumber(
      value,
      0
    )
  );
}


/* =========================================================
   DISCOUNT
   ========================================================= */

/*
 * Discounts may be represented as:
 *
 * discountAmount
 *
 * OR
 *
 * discountRate
 *
 * discountRate is decimal:
 *
 * 0.10 = 10%
 *
 * If discountAmount is explicitly supplied,
 * it wins.
 */

export function calculateIXIFinancialDiscount({
  subtotal = 0,

  discountAmount = null,

  discountRate = 0
} = {}) {

  const resolvedSubtotal =
    roundIXIFinancialMoney(
      subtotal
    );


  if (
    discountAmount !==
      null &&
    discountAmount !==
      undefined &&
    discountAmount !==
      ""
  ) {

    const resolvedAmount =
      Math.max(
        0,
        roundIXIFinancialMoney(
          discountAmount
        )
      );


    return Math.min(
      Math.abs(
        resolvedSubtotal
      ),
      resolvedAmount
    );
  }


  const rate =
    Math.max(
      0,
      toIXIFinancialNumber(
        discountRate,
        0
      )
    );


  return roundIXIFinancialMoney(
    Math.abs(
      resolvedSubtotal
    ) *
    rate
  );
}


/* =========================================================
   TAX
   ========================================================= */

/*
 * taxRate is decimal:
 *
 * 0.0825 = 8.25%
 *
 * Tax amount may also be explicitly supplied.
 *
 * Explicit taxAmount wins.
 */

export function calculateIXIFinancialTax({
  taxableAmount = 0,

  taxAmount = null,

  taxRate = 0,

  taxStatus =
    IXI_FINANCIAL_TAX_STATUS
      .NOT_APPLICABLE
} = {}) {

  const resolvedStatus =
    normalizeIXIFinancialTaxStatus(
      taxStatus
    );


  if (
    resolvedStatus ===
      IXI_FINANCIAL_TAX_STATUS
        .NOT_APPLICABLE ||
    resolvedStatus ===
      IXI_FINANCIAL_TAX_STATUS
        .EXEMPT ||
    resolvedStatus ===
      IXI_FINANCIAL_TAX_STATUS
        .ZERO_RATED ||
    resolvedStatus ===
      IXI_FINANCIAL_TAX_STATUS
        .OUT_OF_SCOPE
  ) {
    return 0;
  }


  if (
    taxAmount !==
      null &&
    taxAmount !==
      undefined &&
    taxAmount !==
      ""
  ) {

    return Math.max(
      0,
      roundIXIFinancialMoney(
        taxAmount
      )
    );
  }


  const rate =
    Math.max(
      0,
      toIXIFinancialNumber(
        taxRate,
        0
      )
    );


  return roundIXIFinancialMoney(
    Math.abs(
      taxableAmount
    ) *
    rate
  );
}


/* =========================================================
   CALCULATE LINE TOTALS
   ========================================================= */

/*
 * Standard line math:
 *
 * quantity × rate
 *      ↓
 * subtotal
 *      ↓
 * less discount
 *      ↓
 * taxable amount
 *      ↓
 * plus exclusive tax
 *      ↓
 * total
 *
 *
 * Inclusive tax:
 *
 * line amount already includes tax.
 *
 * The tax amount is tracked separately,
 * but not added again.
 */

export function calculateIXIFinancialLineAmounts({
  quantity = 1,

  rate = 0,

  subtotal = null,

  discountAmount = null,

  discountRate = 0,

  taxAmount = null,

  taxRate = 0,

  taxMode =
    IXI_FINANCIAL_TAX_MODES
      .NONE,

  taxStatus =
    IXI_FINANCIAL_TAX_STATUS
      .NOT_APPLICABLE,

  amount = null
} = {}) {

  const resolvedQuantity =
    normalizeIXIFinancialLineQuantity(
      quantity,
      1
    );


  const resolvedRate =
    normalizeIXIFinancialLineRate(
      rate
    );


  const calculatedSubtotal =
    roundIXIFinancialMoney(
      resolvedQuantity *
      resolvedRate
    );


  const resolvedSubtotal =
    subtotal !==
      null &&
    subtotal !==
      undefined &&
    subtotal !==
      ""
      ? roundIXIFinancialMoney(
          subtotal
        )
      : calculatedSubtotal;


  const resolvedDiscount =
    calculateIXIFinancialDiscount({
      subtotal:
        resolvedSubtotal,

      discountAmount,

      discountRate
    });


  const afterDiscount =
    roundIXIFinancialMoney(
      resolvedSubtotal -
      resolvedDiscount
    );


  const resolvedTaxMode =
    normalizeIXIFinancialTaxMode(
      taxMode
    );


  const resolvedTaxStatus =
    normalizeIXIFinancialTaxStatus(
      taxStatus
    );


  const resolvedTax =
    calculateIXIFinancialTax({
      taxableAmount:
        afterDiscount,

      taxAmount,

      taxRate,

      taxStatus:
        resolvedTaxStatus
    });


  let calculatedAmount =
    afterDiscount;


  if (
    resolvedTaxMode ===
      IXI_FINANCIAL_TAX_MODES
        .EXCLUSIVE
  ) {

    calculatedAmount =
      roundIXIFinancialMoney(
        afterDiscount +
        resolvedTax
      );
  }


  if (
    resolvedTaxMode ===
      IXI_FINANCIAL_TAX_MODES
        .INCLUSIVE
  ) {

    calculatedAmount =
      afterDiscount;
  }


  const resolvedAmount =
    amount !==
      null &&
    amount !==
      undefined &&
    amount !==
      ""
      ? roundIXIFinancialMoney(
          amount
        )
      : calculatedAmount;


  return {
    quantity:
      resolvedQuantity,

    rate:
      resolvedRate,

    subtotal:
      resolvedSubtotal,

    discountAmount:
      resolvedDiscount,

    netBeforeTax:
      afterDiscount,

    taxAmount:
      resolvedTax,

    amount:
      resolvedAmount
  };
}


/* =========================================================
   ACCOUNTING PREPARATION
   ========================================================= */

/*
 * This does NOT post accounting.
 *
 * It simply allows the line to carry
 * accountant-ready classifications later.
 *
 * Example:
 *
 * {
 *   accountId: "...",
 *   accountCode: "6210",
 *   accountName: "Fuel Expense",
 *   entrySide: "debit"
 * }
 *
 * Adapters will translate those values into
 * QuickBooks / Sage / NetSuite / SAP later.
 */

export function createIXIFinancialAccountingPreparation({
  accountId = "",

  accountCode = "",

  accountName = "",

  entrySide = "",

  taxCode = "",

  costCode = "",

  classCode = "",

  departmentCode = "",

  projectCode = "",

  locationCode = "",

  metadata = {}
} = {}) {

  return {
    accountId:
      clean(
        accountId
      ),

    accountCode:
      clean(
        accountCode
      ),

    accountName:
      clean(
        accountName
      ),

    entrySide:
      normalizeIXIFinancialEntrySide(
        entrySide
      ),

    taxCode:
      clean(
        taxCode
      ),

    costCode:
      clean(
        costCode
      ),

    classCode:
      clean(
        classCode
      ),

    departmentCode:
      clean(
        departmentCode
      ),

    projectCode:
      clean(
        projectCode
      ),

    locationCode:
      clean(
        locationCode
      ),

    metadata: {
      ...safeObject(
        metadata
      )
    }
  };
}


/* =========================================================
   CREATE LINE
   ========================================================= */

export function createIXIFinancialLine({
  financialLineId = "",

  financialDocumentId = "",

  lineNumber = null,

  lineType =
    IXI_FINANCIAL_LINE_TYPES
      .OTHER,

  description = "",

  itemCode = "",

  itemName = "",

  quantity = 1,

  unit = "",

  rate = 0,

  subtotal = null,

  discountAmount = null,

  discountRate = 0,

  taxMode =
    IXI_FINANCIAL_TAX_MODES
      .NONE,

  taxStatus =
    IXI_FINANCIAL_TAX_STATUS
      .NOT_APPLICABLE,

  taxRate = 0,

  taxAmount = null,

  amount = null,

  currency = "USD",

  direction =
    IXI_FINANCIAL_DIRECTIONS
      .NEUTRAL,

  references = [],

  accounting = {},

  memo = "",

  occurredAt = "",

  metadata = {}
} = {}) {

  const amounts =
    calculateIXIFinancialLineAmounts({
      quantity,

      rate,

      subtotal,

      discountAmount,

      discountRate,

      taxAmount,

      taxRate,

      taxMode,

      taxStatus,

      amount
    });


  return {
    financialLineId:
      ensureIXIFinancialLineId(
        financialLineId
      ),

    financialDocumentId:
      clean(
        financialDocumentId
      ),

    lineNumber:
      Number.isFinite(
        Number(
          lineNumber
        )
      )
        ? Number(
            lineNumber
          )
        : null,

    lineType:
      normalizeIXIFinancialLineType(
        lineType
      ),

    description:
      clean(
        description
      ),

    itemCode:
      clean(
        itemCode
      ),

    itemName:
      clean(
        itemName
      ),

    quantity:
      amounts.quantity,

    unit:
      clean(
        unit
      )
        .toLowerCase(),

    rate:
      amounts.rate,

    subtotal:
      amounts.subtotal,

    discountAmount:
      amounts.discountAmount,

    netBeforeTax:
      amounts.netBeforeTax,

    tax: {
      mode:
        normalizeIXIFinancialTaxMode(
          taxMode
        ),

      status:
        normalizeIXIFinancialTaxStatus(
          taxStatus
        ),

      rate:
        Math.max(
          0,
          toIXIFinancialNumber(
            taxRate,
            0
          )
        ),

      amount:
        amounts.taxAmount
    },

    amount:
      amounts.amount,

    currency:
      normalizeIXIFinancialCurrency(
        currency
      ),

    direction:
      normalizeIXIFinancialDirection(
        direction
      ),

    references:
      dedupeIXIFinancialReferences(
        references
      ),

    accounting:
      createIXIFinancialAccountingPreparation(
        accounting
      ),

    memo:
      clean(
        memo
      ),

    occurredAt:
      clean(
        occurredAt
      ),

    metadata: {
      ...safeObject(
        metadata
      )
    }
  };
}


/* =========================================================
   NORMALIZE LINE
   ========================================================= */

export function normalizeIXIFinancialLine(
  line = {}
) {

  const source =
    safeObject(
      line
    );


  return createIXIFinancialLine({
    financialLineId:
      source.financialLineId,

    financialDocumentId:
      source.financialDocumentId,

    lineNumber:
      source.lineNumber,

    lineType:
      source.lineType,

    description:
      source.description,

    itemCode:
      source.itemCode,

    itemName:
      source.itemName,

    quantity:
      source.quantity,

    unit:
      source.unit,

    rate:
      source.rate,

    subtotal:
      source.subtotal,

    discountAmount:
      source.discountAmount,

    taxMode:
      source.tax?.mode,

    taxStatus:
      source.tax?.status,

    taxRate:
      source.tax?.rate,

    taxAmount:
      source.tax?.amount,

    amount:
      source.amount,

    currency:
      source.currency,

    direction:
      source.direction,

    references:
      source.references,

    accounting:
      source.accounting,

    memo:
      source.memo,

    occurredAt:
      source.occurredAt,

    metadata:
      source.metadata
  });
}


/* =========================================================
   NORMALIZE LINE COLLECTION
   ========================================================= */

export function normalizeIXIFinancialLines(
  lines = []
) {

  return safeArray(
    lines
  ).map(
    (
      line,
      index
    ) => ({
      ...normalizeIXIFinancialLine(
        line
      ),

      lineNumber:
        index + 1
    })
  );
}


/* =========================================================
   SUM LINES
   ========================================================= */

export function sumIXIFinancialLines(
  lines = [],
  {
    direction = "",
    currency = ""
  } = {}
) {

  const targetDirection =
    clean(
      direction
    )
      ? normalizeIXIFinancialDirection(
          direction
        )
      : "";


  const targetCurrency =
    clean(
      currency
    )
      .toUpperCase();


  const normalized =
    normalizeIXIFinancialLines(
      lines
    );


  return roundIXIFinancialMoney(
    normalized.reduce(
      (
        total,
        line
      ) => {

        if (
          targetDirection &&
          line.direction !==
            targetDirection
        ) {
          return total;
        }


        if (
          targetCurrency &&
          line.currency !==
            targetCurrency
        ) {
          return total;
        }


        return (
          total +
          line.amount
        );
      },
      0
    )
  );
}


/* =========================================================
   LINE BREAKDOWN
   ========================================================= */

export function getIXIFinancialLineBreakdown(
  lines = []
) {

  const normalized =
    normalizeIXIFinancialLines(
      lines
    );


  return normalized.reduce(
    (
      breakdown,
      line
    ) => {

      const type =
        line.lineType ||
        IXI_FINANCIAL_LINE_TYPES
          .OTHER;


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

          amount:
            0
        };
      }


      breakdown[
        type
      ].count +=
        1;


      breakdown[
        type
      ].amount =
        roundIXIFinancialMoney(
          breakdown[
            type
          ].amount +
          line.amount
        );


      return breakdown;
    },
    {}
  );
}


/* =========================================================
   LINE VALIDATION
   ========================================================= */

export function validateIXIFinancialLine(
  line = {}
) {

  const normalized =
    normalizeIXIFinancialLine(
      line
    );


  const errors =
    [];


  if (
    !normalized.financialLineId
  ) {
    errors.push(
      "financialLineId is required."
    );
  }


  if (
    !Number.isFinite(
      normalized.amount
    )
  ) {
    errors.push(
      "amount must be numeric."
    );
  }


  if (
    !normalized.currency
  ) {
    errors.push(
      "currency is required."
    );
  }


  if (
    normalized.quantity <
    0
  ) {
    errors.push(
      "quantity cannot be negative."
    );
  }


  return {
    ok:
      errors.length ===
      0,

    errors,

    line:
      normalized
  };
}


/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

export default {
  toIXIFinancialNumber,

  roundIXIFinancialMoney,
  roundIXIFinancialQuantity,

  normalizeIXIFinancialTaxMode,
  normalizeIXIFinancialTaxStatus,
  normalizeIXIFinancialEntrySide,

  normalizeIXIFinancialLineQuantity,
  normalizeIXIFinancialLineRate,

  calculateIXIFinancialDiscount,
  calculateIXIFinancialTax,
  calculateIXIFinancialLineAmounts,

  createIXIFinancialAccountingPreparation,

  createIXIFinancialLine,
  normalizeIXIFinancialLine,
  normalizeIXIFinancialLines,

  sumIXIFinancialLines,
  getIXIFinancialLineBreakdown,

  validateIXIFinancialLine
};
