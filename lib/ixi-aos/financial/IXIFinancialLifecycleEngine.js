/*
 * IXI FINANCIAL LIFECYCLE ENGINE
 *
 * PURPOSE
 * -------
 *
 * Calculates economic lifecycle states
 * across related financial documents.
 *
 *
 * CORE PROBLEM
 * ------------
 *
 * A Purchase Order may create:
 *
 * COMMITMENT
 *
 * A Bill may later create:
 *
 * INCURRED COST
 *
 * A Payment may later create:
 *
 * CASH SETTLEMENT
 *
 *
 * Those are NOT three separate costs.
 *
 *
 * Example:
 *
 * PO
 * $20,000 committed
 *
 * Bill
 * $18,750 incurred
 *
 * Payment
 * $10,000 paid
 *
 *
 * Correct:
 *
 * committed remaining = $1,250
 * incurred = $18,750
 * paid = $10,000
 * unpaid = $8,750
 *
 *
 * Incorrect:
 *
 * total cost =
 * $20,000 + $18,750 + $10,000
 *
 *
 * IMPORTANT
 * ---------
 *
 * This engine does NOT:
 *
 * - mutate accounting records
 * - persist to AWS
 * - post journal entries
 * - infer document relationships
 *
 * Caller supplies legitimate document links.
 */


import {
  IXI_FINANCIAL_DOCUMENT_LINK_TYPES,
  IXI_FINANCIAL_DOCUMENT_TYPES,
  IXI_FINANCIAL_DIRECTIONS,
  IXI_FINANCIAL_STATES,
  normalizeIXIFinancialCurrency
} from "./IXIFinancialTypes";


import {
  normalizeIXIFinancialDocument
} from "./IXIFinancialDocumentEngine";


import {
  roundIXIFinancialMoney
} from "./IXIFinancialLineEngine";


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
    typeof value === "object" &&
    !Array.isArray(value)
  )
    ? value
    : {};
}


/* =========================================================
   DOCUMENT VALUE
   ========================================================= */

export function getIXIFinancialDocumentValue(
  document = {},
  currency = ""
) {

  const normalized =
    normalizeIXIFinancialDocument(
      document
    );


  const targetCurrency =
    normalizeIXIFinancialCurrency(
      currency ||
      normalized.currency
    );


  if (
    normalized.currency !==
    targetCurrency
  ) {
    return 0;
  }


  return roundIXIFinancialMoney(
    normalized
      .totals
      ?.total ||
    0
  );
}


/* =========================================================
   DOCUMENT DIRECTION VALUE
   ========================================================= */

/*
 * A document may contain mixed line
 * directions.
 *
 * This helper extracts only one direction.
 */

export function getIXIFinancialDocumentDirectionalValue({
  document = {},
  direction =
    IXI_FINANCIAL_DIRECTIONS
      .OUTFLOW,
  currency = ""
} = {}) {

  const normalized =
    normalizeIXIFinancialDocument(
      document
    );


  const targetCurrency =
    normalizeIXIFinancialCurrency(
      currency ||
      normalized.currency
    );


  return roundIXIFinancialMoney(
    safeArray(
      normalized.lines
    ).reduce(
      (
        total,
        line
      ) => {

        if (
          line.currency !==
          targetCurrency
        ) {
          return total;
        }


        if (
          line.direction !==
          direction
        ) {
          return total;
        }


        return (
          total +
          Number(
            line.amount ||
            0
          )
        );
      },
      0
    )
  );
}


/* =========================================================
   LINK NORMALIZATION
   ========================================================= */

export function normalizeIXIFinancialDocumentLink(
  link = {}
) {

  const source =
    safeObject(
      link
    );


  return {
    linkType:
      clean(
        source.linkType
      ),

    sourceDocumentId:
      clean(
        source.sourceDocumentId
      ),

    targetDocumentId:
      clean(
        source.targetDocumentId
      ),

    amount:
      source.amount ===
      null ||
      source.amount ===
      undefined ||
      source.amount ===
      ""
        ? null
        : roundIXIFinancialMoney(
            source.amount
          ),

    currency:
      source.currency
        ? normalizeIXIFinancialCurrency(
            source.currency
          )
        : "",

    metadata: {
      ...safeObject(
        source.metadata
      )
    }
  };
}


/* =========================================================
   VALID LINK?
   ========================================================= */

export function isIXIFinancialDocumentLink(
  link = {}
) {

  const normalized =
    normalizeIXIFinancialDocumentLink(
      link
    );


  return Boolean(
    normalized.linkType &&
    normalized.sourceDocumentId &&
    normalized.targetDocumentId
  );
}


/* =========================================================
   DEDUPE LINKS
   ========================================================= */

export function dedupeIXIFinancialDocumentLinks(
  links = []
) {

  const map =
    new Map();


  safeArray(
    links
  )
    .map(
      normalizeIXIFinancialDocumentLink
    )
    .filter(
      isIXIFinancialDocumentLink
    )
    .forEach(
      link => {

        const key =
          [
            link.linkType,
            link.sourceDocumentId,
            link.targetDocumentId,
            link.amount ?? ""
          ].join(":");


        if (
          !map.has(
            key
          )
        ) {
          map.set(
            key,
            link
          );
        }
      }
    );


  return Array.from(
    map.values()
  );
}


/* =========================================================
   DOCUMENT MAP
   ========================================================= */

export function createIXIFinancialDocumentMap(
  documents = []
) {

  const map =
    new Map();


  safeArray(
    documents
  ).forEach(
    document => {

      const normalized =
        normalizeIXIFinancialDocument(
          document
        );


      if (
        normalized
          .financialDocumentId
      ) {
        map.set(
          normalized
            .financialDocumentId,
          normalized
        );
      }
    }
  );


  return map;
}


/* =========================================================
   RELATED LINKS
   ========================================================= */

export function getIXIFinancialLinksForDocument(
  links = [],
  financialDocumentId = ""
) {

  const target =
    clean(
      financialDocumentId
    );


  return dedupeIXIFinancialDocumentLinks(
    links
  ).filter(
    link =>
      link.sourceDocumentId ===
        target ||
      link.targetDocumentId ===
        target
  );
}


/* =========================================================
   LINKED DOCUMENTS
   ========================================================= */

export function getIXIFinancialLinkedDocuments({
  documentId = "",
  documents = [],
  links = [],
  linkTypes = []
} = {}) {

  const target =
    clean(
      documentId
    );


  const typeSet =
    new Set(
      safeArray(
        linkTypes
      )
        .map(
          clean
        )
        .filter(
          Boolean
        )
    );


  const documentMap =
    createIXIFinancialDocumentMap(
      documents
    );


  const relatedLinks =
    getIXIFinancialLinksForDocument(
      links,
      target
    )
      .filter(
        link =>
          !typeSet.size ||
          typeSet.has(
            link.linkType
          )
      );


  const result =
    [];


  relatedLinks.forEach(
    link => {

      const otherId =
        link.sourceDocumentId ===
        target
          ? link.targetDocumentId
          : link.sourceDocumentId;


      const otherDocument =
        documentMap.get(
          otherId
        );


      if (
        otherDocument
      ) {
        result.push({
          link,
          document:
            otherDocument
        });
      }
    }
  );


  return result;
}


/* =========================================================
   LINK VALUE
   ========================================================= */

/*
 * If a link carries an explicit amount,
 * that amount is authoritative for the
 * relationship.
 *
 * Otherwise use the linked document value.
 */

export function getIXIFinancialLinkValue({
  link = {},
  linkedDocument = {},
  currency = "USD"
} = {}) {

  const normalizedLink =
    normalizeIXIFinancialDocumentLink(
      link
    );


  const targetCurrency =
    normalizeIXIFinancialCurrency(
      currency
    );


  if (
    normalizedLink.amount !==
      null
  ) {

    if (
      normalizedLink.currency &&
      normalizedLink.currency !==
      targetCurrency
    ) {
      return 0;
    }


    return roundIXIFinancialMoney(
      normalizedLink.amount
    );
  }


  return getIXIFinancialDocumentValue(
    linkedDocument,
    targetCurrency
  );
}


/* =========================================================
   PURCHASE ORDER LIFECYCLE
   ========================================================= */

/*
 * PO:
 *
 * original commitment
 *
 * less:
 *
 * amounts already billed or otherwise
 * consumed through explicit links.
 */

export function calculateIXIPurchaseOrderLifecycle({
  purchaseOrder = {},
  documents = [],
  links = [],
  currency = ""
} = {}) {

  const po =
    normalizeIXIFinancialDocument(
      purchaseOrder
    );


  const targetCurrency =
    normalizeIXIFinancialCurrency(
      currency ||
      po.currency
    );


  const committed =
    getIXIFinancialDocumentDirectionalValue({
      document:
        po,

      direction:
        IXI_FINANCIAL_DIRECTIONS
          .OUTFLOW,

      currency:
        targetCurrency
    });


  const related =
    getIXIFinancialLinkedDocuments({
      documentId:
        po.financialDocumentId,

      documents,

      links,

      linkTypes: [
        IXI_FINANCIAL_DOCUMENT_LINK_TYPES
          .BILLED_BY,

        IXI_FINANCIAL_DOCUMENT_LINK_TYPES
          .FULFILLS,

        IXI_FINANCIAL_DOCUMENT_LINK_TYPES
          .RECEIVES
      ]
    });


  let billed =
    0;


  let received =
    0;


  related.forEach(
    ({
      link,
      document
    }) => {

      const value =
        getIXIFinancialLinkValue({
          link,
          linkedDocument:
            document,
          currency:
            targetCurrency
        });


      if (
        link.linkType ===
        IXI_FINANCIAL_DOCUMENT_LINK_TYPES
          .BILLED_BY
      ) {

        billed =
          roundIXIFinancialMoney(
            billed +
            value
          );
      }


      if (
        link.linkType ===
          IXI_FINANCIAL_DOCUMENT_LINK_TYPES
            .FULFILLS ||
        link.linkType ===
          IXI_FINANCIAL_DOCUMENT_LINK_TYPES
            .RECEIVES
      ) {

        received =
          roundIXIFinancialMoney(
            received +
            value
          );
      }
    }
  );


  const consumedCommitment =
    Math.max(
      billed,
      received
    );


  const remainingCommitment =
    roundIXIFinancialMoney(
      Math.max(
        0,
        committed -
        consumedCommitment
      )
    );


  return {
    financialDocumentId:
      po.financialDocumentId,

    currency:
      targetCurrency,

    committed,

    billed,

    received,

    consumedCommitment:
      roundIXIFinancialMoney(
        consumedCommitment
      ),

    remainingCommitment
  };
}


/* =========================================================
   BILL / SUPPLIER INVOICE LIFECYCLE
   ========================================================= */

export function calculateIXIBillLifecycle({
  bill = {},
  documents = [],
  links = [],
  currency = ""
} = {}) {

  const normalizedBill =
    normalizeIXIFinancialDocument(
      bill
    );


  const targetCurrency =
    normalizeIXIFinancialCurrency(
      currency ||
      normalizedBill.currency
    );


  const incurred =
    getIXIFinancialDocumentDirectionalValue({
      document:
        normalizedBill,

      direction:
        IXI_FINANCIAL_DIRECTIONS
          .OUTFLOW,

      currency:
        targetCurrency
    });


  const related =
    getIXIFinancialLinkedDocuments({
      documentId:
        normalizedBill
          .financialDocumentId,

      documents,

      links,

      linkTypes: [
        IXI_FINANCIAL_DOCUMENT_LINK_TYPES
          .PAID_BY,

        IXI_FINANCIAL_DOCUMENT_LINK_TYPES
          .CREDITS
      ]
    });


  let paid =
    0;


  let credits =
    0;


  related.forEach(
    ({
      link,
      document
    }) => {

      const value =
        getIXIFinancialLinkValue({
          link,
          linkedDocument:
            document,
          currency:
            targetCurrency
        });


      if (
        link.linkType ===
        IXI_FINANCIAL_DOCUMENT_LINK_TYPES
          .PAID_BY
      ) {

        paid =
          roundIXIFinancialMoney(
            paid +
            value
          );
      }


      if (
        link.linkType ===
        IXI_FINANCIAL_DOCUMENT_LINK_TYPES
          .CREDITS
      ) {

        credits =
          roundIXIFinancialMoney(
            credits +
            value
          );
      }
    }
  );


  const adjustedIncurred =
    roundIXIFinancialMoney(
      Math.max(
        0,
        incurred -
        credits
      )
    );


  const unpaid =
    roundIXIFinancialMoney(
      Math.max(
        0,
        adjustedIncurred -
        paid
      )
    );


  return {
    financialDocumentId:
      normalizedBill
        .financialDocumentId,

    currency:
      targetCurrency,

    incurred,

    credits,

    adjustedIncurred,

    paid,

    unpaid
  };
}


/* =========================================================
   INVOICE / RECEIVABLE LIFECYCLE
   ========================================================= */

export function calculateIXIInvoiceLifecycle({
  invoice = {},
  documents = [],
  links = [],
  currency = ""
} = {}) {

  const normalizedInvoice =
    normalizeIXIFinancialDocument(
      invoice
    );


  const targetCurrency =
    normalizeIXIFinancialCurrency(
      currency ||
      normalizedInvoice.currency
    );


  const billedRevenue =
    getIXIFinancialDocumentDirectionalValue({
      document:
        normalizedInvoice,

      direction:
        IXI_FINANCIAL_DIRECTIONS
          .INFLOW,

      currency:
        targetCurrency
    });


  const related =
    getIXIFinancialLinkedDocuments({
      documentId:
        normalizedInvoice
          .financialDocumentId,

      documents,

      links,

      linkTypes: [
        IXI_FINANCIAL_DOCUMENT_LINK_TYPES
          .PAID_BY,

        IXI_FINANCIAL_DOCUMENT_LINK_TYPES
          .CREDITS
      ]
    });


  let collected =
    0;


  let credits =
    0;


  related.forEach(
    ({
      link,
      document
    }) => {

      const value =
        getIXIFinancialLinkValue({
          link,
          linkedDocument:
            document,
          currency:
            targetCurrency
        });


      if (
        link.linkType ===
        IXI_FINANCIAL_DOCUMENT_LINK_TYPES
          .PAID_BY
      ) {

        collected =
          roundIXIFinancialMoney(
            collected +
            value
          );
      }


      if (
        link.linkType ===
        IXI_FINANCIAL_DOCUMENT_LINK_TYPES
          .CREDITS
      ) {

        credits =
          roundIXIFinancialMoney(
            credits +
            value
          );
      }
    }
  );


  const adjustedReceivable =
    roundIXIFinancialMoney(
      Math.max(
        0,
        billedRevenue -
        credits
      )
    );


  const outstanding =
    roundIXIFinancialMoney(
      Math.max(
        0,
        adjustedReceivable -
        collected
      )
    );


  return {
    financialDocumentId:
      normalizedInvoice
        .financialDocumentId,

    currency:
      targetCurrency,

    billedRevenue,

    credits,

    adjustedReceivable,

    collected,

    outstanding
  };
}


/* =========================================================
   CLASSIFY DOCUMENT ECONOMIC ROLE
   ========================================================= */

/*
 * This allows later AOF2 selectors to know
 * whether a document contributes to:
 *
 * commitment
 * incurred cost
 * revenue
 * settlement
 * planning
 */

export function getIXIFinancialDocumentEconomicRole(
  document = {}
) {

  const normalized =
    normalizeIXIFinancialDocument(
      document
    );


  const type =
    normalized.documentType;


  if (
    type ===
    IXI_FINANCIAL_DOCUMENT_TYPES
      .PURCHASE_ORDER
  ) {
    return "commitment";
  }


  if (
    type ===
      IXI_FINANCIAL_DOCUMENT_TYPES
        .BILL ||
    type ===
      IXI_FINANCIAL_DOCUMENT_TYPES
        .SUPPLIER_INVOICE ||
    type ===
      IXI_FINANCIAL_DOCUMENT_TYPES
        .EXPENSE
  ) {
    return "incurred-cost";
  }


  if (
    type ===
    IXI_FINANCIAL_DOCUMENT_TYPES
      .INVOICE
  ) {
    return "revenue";
  }


  if (
    type ===
      IXI_FINANCIAL_DOCUMENT_TYPES
        .BILL_PAYMENT ||
    type ===
      IXI_FINANCIAL_DOCUMENT_TYPES
        .CUSTOMER_PAYMENT
  ) {
    return "settlement";
  }


  if (
    type ===
      IXI_FINANCIAL_DOCUMENT_TYPES
        .BUDGET ||
    type ===
      IXI_FINANCIAL_DOCUMENT_TYPES
        .FORECAST
  ) {
    return "planning";
  }


  return "operational";
}


/* =========================================================
   LIFECYCLE SNAPSHOT
   ========================================================= */

/*
 * Produces a non-duplicative enterprise
 * view across documents.
 *
 * IMPORTANT:
 *
 * This does NOT blindly add every document.
 */

export function createIXIFinancialLifecycleSnapshot({
  documents = [],
  links = [],
  currency = "USD"
} = {}) {

  const normalizedDocuments =
    safeArray(
      documents
    ).map(
      normalizeIXIFinancialDocument
    );


  const resolvedCurrency =
    normalizeIXIFinancialCurrency(
      currency
    );


  let commitment =
    0;

  let remainingCommitment =
    0;

  let incurredCost =
    0;

  let paid =
    0;

  let revenue =
    0;

  let collected =
    0;

  let receivable =
    0;


  normalizedDocuments.forEach(
    document => {

      const role =
        getIXIFinancialDocumentEconomicRole(
          document
        );


      if (
        role ===
        "commitment"
      ) {

        const result =
          calculateIXIPurchaseOrderLifecycle({
            purchaseOrder:
              document,

            documents:
              normalizedDocuments,

            links,

            currency:
              resolvedCurrency
          });


        commitment =
          roundIXIFinancialMoney(
            commitment +
            result.committed
          );


        remainingCommitment =
          roundIXIFinancialMoney(
            remainingCommitment +
            result.remainingCommitment
          );


        return;
      }


      if (
        role ===
        "incurred-cost"
      ) {

        if (
          document.documentType ===
            IXI_FINANCIAL_DOCUMENT_TYPES
              .BILL ||
          document.documentType ===
            IXI_FINANCIAL_DOCUMENT_TYPES
              .SUPPLIER_INVOICE
        ) {

          const result =
            calculateIXIBillLifecycle({
              bill:
                document,

              documents:
                normalizedDocuments,

              links,

              currency:
                resolvedCurrency
            });


          incurredCost =
            roundIXIFinancialMoney(
              incurredCost +
              result.adjustedIncurred
            );


          paid =
            roundIXIFinancialMoney(
              paid +
              result.paid
            );

        } else {

          incurredCost =
            roundIXIFinancialMoney(
              incurredCost +
              getIXIFinancialDocumentDirectionalValue({
                document,

                direction:
                  IXI_FINANCIAL_DIRECTIONS
                    .OUTFLOW,

                currency:
                  resolvedCurrency
              })
            );
        }


        return;
      }


      if (
        role ===
        "revenue"
      ) {

        const result =
          calculateIXIInvoiceLifecycle({
            invoice:
              document,

            documents:
              normalizedDocuments,

            links,

            currency:
              resolvedCurrency
          });


        revenue =
          roundIXIFinancialMoney(
            revenue +
            result.adjustedReceivable
          );


        collected =
          roundIXIFinancialMoney(
            collected +
            result.collected
          );


        receivable =
          roundIXIFinancialMoney(
            receivable +
            result.outstanding
          );
      }
    }
  );


  return {
    currency:
      resolvedCurrency,

    commitment,

    remainingCommitment,

    incurredCost,

    paid,

    unpaid:
      roundIXIFinancialMoney(
        Math.max(
          0,
          incurredCost -
          paid
        )
      ),

    revenue,

    collected,

    receivable,

    projectedOutflow:
      roundIXIFinancialMoney(
        incurredCost +
        remainingCommitment
      ),

    operatingNet:
      roundIXIFinancialMoney(
        revenue -
        incurredCost
      )
  };
}


/* =========================================================
   STATE SUGGESTION
   ========================================================= */

/*
 * Helpful later when Face 2 / Workbooks
 * need a concise lifecycle label.
 */

export function getIXIFinancialSuggestedState(
  document = {}
) {

  const normalized =
    normalizeIXIFinancialDocument(
      document
    );


  const type =
    normalized.documentType;


  if (
    type ===
    IXI_FINANCIAL_DOCUMENT_TYPES
      .PURCHASE_ORDER
  ) {
    return IXI_FINANCIAL_STATES
      .COMMITTED;
  }


  if (
    type ===
      IXI_FINANCIAL_DOCUMENT_TYPES
        .BILL ||
    type ===
      IXI_FINANCIAL_DOCUMENT_TYPES
        .SUPPLIER_INVOICE ||
    type ===
      IXI_FINANCIAL_DOCUMENT_TYPES
        .EXPENSE
  ) {
    return IXI_FINANCIAL_STATES
      .INCURRED;
  }


  if (
    type ===
      IXI_FINANCIAL_DOCUMENT_TYPES
        .BILL_PAYMENT ||
    type ===
      IXI_FINANCIAL_DOCUMENT_TYPES
        .CUSTOMER_PAYMENT
  ) {
    return IXI_FINANCIAL_STATES
      .PAID;
  }


  return normalized.financialState;
}


/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

export default {
  getIXIFinancialDocumentValue,
  getIXIFinancialDocumentDirectionalValue,

  normalizeIXIFinancialDocumentLink,
  isIXIFinancialDocumentLink,
  dedupeIXIFinancialDocumentLinks,

  createIXIFinancialDocumentMap,

  getIXIFinancialLinksForDocument,
  getIXIFinancialLinkedDocuments,
  getIXIFinancialLinkValue,

  calculateIXIPurchaseOrderLifecycle,
  calculateIXIBillLifecycle,
  calculateIXIInvoiceLifecycle,

  getIXIFinancialDocumentEconomicRole,

  createIXIFinancialLifecycleSnapshot,

  getIXIFinancialSuggestedState
};
