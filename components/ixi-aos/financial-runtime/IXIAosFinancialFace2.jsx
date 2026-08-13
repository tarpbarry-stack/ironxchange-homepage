/*
 * IXI AOS FINANCIAL FACE 2
 *
 * STANDARD AOS FACE
 * -----------------
 *
 * FACE 1
 * Identity / presentation
 *
 * FACE 2
 * Financial
 *
 * FACE 3+
 * User / business defined
 *
 *
 * PURPOSE
 * -------
 *
 * AOF2 is the standard financial snapshot
 * of the Passport-bearing Object or
 * Container currently being viewed.
 *
 *
 * AOF2 DOES NOT OWN FINANCIAL DATA.
 *
 * It consumes the Financial Engine snapshot.
 *
 *
 * Future data flow:
 *
 * AWS Financial Store
 *        ↓
 * IXI Financial Engine
 *        ↓
 * Passport / Recursive Snapshot
 *        ↓
 * AOF2
 *
 *
 * IMPORTANT
 * ---------
 *
 * This Face is standard AOS infrastructure.
 *
 * It is NOT:
 *
 * - a generic Studio-created Face
 * - an accounting database
 * - a QuickBooks Face
 * - an SAP Face
 * - equipment-specific
 *
 *
 * Every Passport-bearing Object / Container
 * may use this same runtime.
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
    typeof value ===
      "object" &&
    !Array.isArray(value)
  )
    ? value
    : {};
}


/* =========================================================
   MONEY
   ========================================================= */

function formatMoney(
  value,
  currency = "USD"
) {

  const amount =
    Number(
      value ||
      0
    );


  try {

    return new Intl
      .NumberFormat(
        "en-US",
        {
          style:
            "currency",

          currency:
            clean(
              currency
            )
              .toUpperCase() ||
            "USD",

          maximumFractionDigits:
            0
        }
      )
      .format(
        Number.isFinite(
          amount
        )
          ? amount
          : 0
      );

  } catch {

    return `$${Math.round(
      Number.isFinite(
        amount
      )
        ? amount
        : 0
    ).toLocaleString()}`;
  }
}


/* =========================================================
   PASSPORT
   ========================================================= */

function getPassportId(
  object,
  passportId
) {

  return clean(
    passportId ||

    object
      ?.passportId ||

    object
      ?.ixiPassportId ||

    object
      ?.passport
      ?.passportId ||

    object
      ?.passport
      ?.id
  );
}


/* =========================================================
   OBJECT LABEL
   ========================================================= */

function getObjectLabel(
  object
) {

  return clean(
    object
      ?.displayName ||

    object
      ?.name ||

    object
      ?.title ||

    object
      ?.label ||

    "OBJECT"
  );
}


/* =========================================================
   SNAPSHOT NORMALIZATION
   ========================================================= */

function getCurrencySnapshot(
  financialSnapshot,
  currency
) {

  const source =
    safeObject(
      financialSnapshot
    );


  const resolvedCurrency =
    clean(
      currency ||
      "USD"
    )
      .toUpperCase();


  return (
    source
      ?.snapshots
      ?.[
        resolvedCurrency
      ] ||
    {}
  );
}


/* =========================================================
   LATEST ACTIVITY
   ========================================================= */

function normalizeRecentActivity(
  recentActivity
) {

  return safeArray(
    recentActivity
  )
    .slice(
      0,
      3
    )
    .map(
      (
        item,
        index
      ) => {

        const source =
          safeObject(
            item
          );


        return {
          id:
            clean(
              source.id ||

              source
                .financialDocumentId ||

              source
                .financialLineId ||

              `activity-${index + 1}`
            ),

          label:
            clean(
              source.label ||

              source.title ||

              source.description ||

              source.documentType ||

              "FINANCIAL ACTIVITY"
            ),

          date:
            clean(
              source.date ||

              source.occurredAt ||

              source.transactionDate
            ),

          amount:
            Number(
              source.amount ||
              0
            )
        };
      }
    );
}


/* =========================================================
   COMPONENT
   ========================================================= */

export default function IXIAosFinancialFace2({
  object = {},

  passportId = "",

  currency = "USD",

  financialSnapshot = {},

  lifecycleSnapshot = {},

  recentActivity = [],

  periodLabel = "YTD",

  onOpenWorkbook = null,

  onCreateExpense = null,

  onCreatePurchaseOrder = null,

  onCreateWorkOrder = null,

  onCreateTimeEntry = null,

  compactActions = false,

  className = ""
}) {

  const resolvedPassportId =
    getPassportId(
      object,
      passportId
    );


  const objectLabel =
    getObjectLabel(
      object
    );


  const resolvedCurrency =
    clean(
      currency
    )
      .toUpperCase() ||
    "USD";


  const snapshot =
    getCurrencySnapshot(
      financialSnapshot,
      resolvedCurrency
    );


  const lifecycle =
    safeObject(
      lifecycleSnapshot
    );


  /*
   * Rollup snapshot supplies broad
   * directional economics.
   */
  const outflow =
    Number(
      snapshot.outflow ||
      0
    );


  const inflow =
    Number(
      snapshot.inflow ||
      0
    );


  /*
   * Lifecycle snapshot supplies accounting
   * progression without double counting.
   */
  const incurredCost =
    Number(
      lifecycle.incurredCost ??
      outflow
    );


  const remainingCommitment =
    Number(
      lifecycle.remainingCommitment ||
      0
    );


  const projectedOutflow =
    Number(
      lifecycle.projectedOutflow ??
      (
        incurredCost +
        remainingCommitment
      )
    );


  const paid =
    Number(
      lifecycle.paid ||
      0
    );


  const unpaid =
    Number(
      lifecycle.unpaid ||
      0
    );


  const revenue =
    Number(
      lifecycle.revenue ??
      inflow
    );


  const collected =
    Number(
      lifecycle.collected ||
      0
    );


  const receivable =
    Number(
      lifecycle.receivable ||
      0
    );


  const operatingNet =
    Number(
      lifecycle.operatingNet ??
      (
        revenue -
        incurredCost
      )
    );


  const activity =
    normalizeRecentActivity(
      recentActivity
    );


  return (
    <section
      className={[
        "ixi-aos-financial-face2",

        className
      ]
        .filter(Boolean)
        .join(" ")}
    >

      {/* ===================================================
          PERMANENT PASSPORT STRIP

          This is deliberately the absolute top of Face 2.
          =================================================== */}

      <div className="passport-strip">

        <span>
          IXI OBJECT PASSPORT
        </span>

        <strong>
          {
            resolvedPassportId ||
            "UNASSIGNED"
          }
        </strong>

      </div>


      {/* ===================================================
          FACE HEADER
          =================================================== */}

      <div className="financial-header">

        <div>

          <span>
            FINANCIAL
          </span>

          <strong>
            {objectLabel}
          </strong>

        </div>


        <em>
          {
            clean(
              periodLabel
            ) ||
            "YTD"
          }
        </em>

      </div>


      {/* ===================================================
          PRIMARY ECONOMIC SNAPSHOT
          =================================================== */}

      <div className="primary-grid">

        <div className="primary-cell">

          <span>
            INCURRED COST
          </span>

          <strong>
            {
              formatMoney(
                incurredCost,
                resolvedCurrency
              )
            }
          </strong>

        </div>


        <div className="primary-cell">

          <span>
            COMMITTED
          </span>

          <strong>
            {
              formatMoney(
                remainingCommitment,
                resolvedCurrency
              )
            }
          </strong>

        </div>


        <div className="primary-cell">

          <span>
            PROJECTED
          </span>

          <strong>
            {
              formatMoney(
                projectedOutflow,
                resolvedCurrency
              )
            }
          </strong>

        </div>


        <div className="primary-cell">

          <span>
            NET
          </span>

          <strong>
            {
              formatMoney(
                operatingNet,
                resolvedCurrency
              )
            }
          </strong>

        </div>

      </div>


      {/* ===================================================
          SECONDARY FINANCIAL STATE
          =================================================== */}

      <div className="detail-grid">

        <div>

          <span>
            PAID
          </span>

          <strong>
            {
              formatMoney(
                paid,
                resolvedCurrency
              )
            }
          </strong>

        </div>


        <div>

          <span>
            UNPAID
          </span>

          <strong>
            {
              formatMoney(
                unpaid,
                resolvedCurrency
              )
            }
          </strong>

        </div>


        <div>

          <span>
            REVENUE
          </span>

          <strong>
            {
              formatMoney(
                revenue,
                resolvedCurrency
              )
            }
          </strong>

        </div>


        <div>

          <span>
            RECEIVABLE
          </span>

          <strong>
            {
              formatMoney(
                receivable,
                resolvedCurrency
              )
            }
          </strong>

        </div>


        <div>

          <span>
            COLLECTED
          </span>

          <strong>
            {
              formatMoney(
                collected,
                resolvedCurrency
              )
            }
          </strong>

        </div>


        <div>

          <span>
            CURRENCY
          </span>

          <strong>
            {resolvedCurrency}
          </strong>

        </div>

      </div>


      {/* ===================================================
          RECENT ACTIVITY
          =================================================== */}

      <div className="activity-block">

        <header>

          <strong>
            RECENT
          </strong>

          <span>
            ACTIVITY
          </span>

        </header>


        <div className="activity-list">

          {
            activity.length
              ? activity.map(
                  item => (

                    <div
                      key={
                        item.id
                      }

                      className="
                        activity-row
                      "
                    >

                      <div>

                        <strong>
                          {
                            item.label
                          }
                        </strong>

                        <span>
                          {
                            item.date
                              ? item.date
                                  .slice(
                                    0,
                                    10
                                  )
                              : ""
                          }
                        </span>

                      </div>


                      <em>
                        {
                          formatMoney(
                            item.amount,
                            resolvedCurrency
                          )
                        }
                      </em>

                    </div>

                  )
                )

              : (
                  <div className="empty-activity">

                    NO FINANCIAL ACTIVITY

                  </div>
                )
          }

        </div>

      </div>


      {/* ===================================================
          QUICK ACTIONS
          =================================================== */}

      <div
        className={[
          "financial-actions",

          compactActions
            ? "compact"
            : ""
        ]
          .filter(Boolean)
          .join(" ")}
      >

        <button
          type="button"

          onClick={
            onCreateExpense
          }

          disabled={
            typeof onCreateExpense !==
            "function"
          }
        >
          + EXPENSE
        </button>


        <button
          type="button"

          onClick={
            onCreatePurchaseOrder
          }

          disabled={
            typeof onCreatePurchaseOrder !==
            "function"
          }
        >
          + PO
        </button>


        <button
          type="button"

          onClick={
            onCreateWorkOrder
          }

          disabled={
            typeof onCreateWorkOrder !==
            "function"
          }
        >
          + WORK
        </button>


        <button
          type="button"

          onClick={
            onCreateTimeEntry
          }

          disabled={
            typeof onCreateTimeEntry !==
            "function"
          }
        >
          + TIME
        </button>

      </div>


      {/* ===================================================
          WORKBOOK ENTRY
          =================================================== */}

      <button
        type="button"

        className="
          workbook-button
        "

        onClick={
          onOpenWorkbook
        }

        disabled={
          typeof onOpenWorkbook !==
          "function"
        }
      >
        OPEN FINANCIAL WORKBOOK
      </button>


      <style jsx>{`

        .ixi-aos-financial-face2 {
          width: 100%;
          height: 100%;

          min-width: 0;
          min-height: 0;

          display: flex;
          flex-direction: column;

          overflow: hidden;

          background:
            rgba(
              8,
              8,
              8,
              .98
            );

          color:
            rgba(
              255,
              255,
              255,
              .74
            );
        }


        /* ===============================================
           PASSPORT
           =============================================== */

        .passport-strip {
          height: 21px;

          flex:
            0 0 21px;

          padding:
            0 8px;

          display: flex;

          align-items: center;

          justify-content:
            space-between;

          gap: 8px;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .055
            );

          background:
            rgba(
              255,
              255,
              255,
              .012
            );
        }


        .passport-strip span {
          color:
            rgba(
              255,
              255,
              255,
              .27
            );

          font-size: 5px;
          font-weight: 950;

          letter-spacing:
            .45px;
        }


        .passport-strip strong {
          min-width: 0;

          overflow: hidden;

          color:
            rgba(
              255,
              196,
              0,
              .73
            );

          font-size: 5px;
          font-weight: 950;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        /* ===============================================
           HEADER
           =============================================== */

        .financial-header {
          min-height: 42px;

          flex:
            0 0 42px;

          padding:
            7px 9px;

          display: flex;

          align-items: center;

          justify-content:
            space-between;

          gap: 8px;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .045
            );
        }


        .financial-header > div {
          min-width: 0;

          display: flex;
          flex-direction: column;

          gap: 2px;
        }


        .financial-header span {
          color: #ffc400;

          font-size: 6px;
          font-weight: 950;

          letter-spacing:
            .55px;
        }


        .financial-header strong {
          overflow: hidden;

          color:
            rgba(
              255,
              255,
              255,
              .72
            );

          font-size: 8px;
          font-weight: 950;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .financial-header em {
          flex: none;

          color:
            rgba(
              255,
              255,
              255,
              .22
            );

          font-size: 5px;
          font-style: normal;
          font-weight: 950;

          letter-spacing:
            .4px;
        }


        /* ===============================================
           PRIMARY
           =============================================== */

        .primary-grid {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          flex:
            0 0 auto;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .045
            );
        }


        .primary-cell {
          min-height: 45px;

          padding:
            7px 8px;

          display: flex;
          flex-direction: column;

          justify-content: center;

          gap: 3px;

          border-right:
            1px solid
            rgba(
              255,
              255,
              255,
              .035
            );

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .035
            );
        }


        .primary-cell:nth-child(
          2n
        ) {
          border-right:
            0;
        }


        .primary-cell span {
          color:
            rgba(
              255,
              255,
              255,
              .22
            );

          font-size: 5px;
          font-weight: 950;
        }


        .primary-cell strong {
          color:
            rgba(
              255,
              255,
              255,
              .79
            );

          font-size: 11px;
          font-weight: 950;

          letter-spacing:
            -.15px;
        }


        /* ===============================================
           DETAILS
           =============================================== */

        .detail-grid {
          display: grid;

          grid-template-columns:
            1fr 1fr 1fr;

          flex:
            0 0 auto;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .045
            );
        }


        .detail-grid > div {
          min-height: 35px;

          padding:
            6px;

          display: flex;
          flex-direction: column;

          justify-content: center;

          gap: 3px;

          border-right:
            1px solid
            rgba(
              255,
              255,
              255,
              .032
            );

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .032
            );
        }


        .detail-grid > div:nth-child(
          3n
        ) {
          border-right:
            0;
        }


        .detail-grid span {
          color:
            rgba(
              255,
              255,
              255,
              .18
            );

          font-size: 4.5px;
          font-weight: 950;
        }


        .detail-grid strong {
          color:
            rgba(
              255,
              255,
              255,
              .57
            );

          font-size: 6.5px;
          font-weight: 950;
        }


        /* ===============================================
           ACTIVITY
           =============================================== */

        .activity-block {
          flex: 1;

          min-height: 0;

          padding:
            7px 8px;

          display: flex;
          flex-direction: column;

          gap: 5px;

          overflow: hidden;
        }


        .activity-block > header {
          flex: none;

          display: flex;

          align-items: baseline;

          gap: 5px;
        }


        .activity-block > header strong {
          color:
            rgba(
              255,
              196,
              0,
              .72
            );

          font-size: 5px;
          font-weight: 950;
        }


        .activity-block > header span {
          color:
            rgba(
              255,
              255,
              255,
              .16
            );

          font-size: 4.5px;
          font-weight: 900;
        }


        .activity-list {
          flex: 1;

          min-height: 0;

          display: flex;
          flex-direction: column;

          gap: 3px;

          overflow: hidden;
        }


        .activity-row {
          min-height: 28px;

          padding:
            4px 6px;

          display: flex;

          align-items: center;

          justify-content:
            space-between;

          gap: 6px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .035
            );

          border-radius: 4px;

          background:
            rgba(
              255,
              255,
              255,
              .01
            );
        }


        .activity-row > div {
          min-width: 0;

          display: flex;
          flex-direction: column;

          gap: 1px;
        }


        .activity-row strong {
          overflow: hidden;

          color:
            rgba(
              255,
              255,
              255,
              .45
            );

          font-size: 5px;
          font-weight: 950;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .activity-row span {
          color:
            rgba(
              255,
              255,
              255,
              .14
            );

          font-size: 4px;
          font-weight: 850;
        }


        .activity-row em {
          flex: none;

          color:
            rgba(
              255,
              255,
              255,
              .56
            );

          font-size: 5px;
          font-style: normal;
          font-weight: 950;
        }


        .empty-activity {
          flex: 1;

          display: flex;

          align-items: center;

          justify-content: center;

          color:
            rgba(
              255,
              255,
              255,
              .12
            );

          font-size: 5px;
          font-weight: 950;

          letter-spacing:
            .45px;
        }


        /* ===============================================
           ACTIONS
           =============================================== */

        .financial-actions {
          flex: none;

          padding:
            6px 7px;

          display: grid;

          grid-template-columns:
            1fr 1fr 1fr 1fr;

          gap: 4px;

          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              .04
            );
        }


        .financial-actions button {
          height: 25px;

          padding:
            0 3px;

          border:
            1px solid
            rgba(
              255,
              196,
              0,
              .12
            );

          border-radius:
            4px;

          background:
            rgba(
              255,
              196,
              0,
              .018
            );

          color:
            rgba(
              255,
              196,
              0,
              .57
            );

          font-size: 4.5px;
          font-weight: 950;

          cursor: pointer;
        }


        .financial-actions button:hover:not(
          :disabled
        ) {
          border-color:
            rgba(
              255,
              196,
              0,
              .40
            );

          color:
            #ffc400;
        }


        .financial-actions button:disabled {
          opacity:
            .26;

          cursor:
            default;
        }


        /* ===============================================
           WORKBOOK
           =============================================== */

        .workbook-button {
          height: 28px;

          flex:
            0 0 28px;

          margin:
            0 7px 7px;

          border:
            1px solid
            rgba(
              255,
              196,
              0,
              .16
            );

          border-radius:
            4px;

          background:
            rgba(
              255,
              196,
              0,
              .025
            );

          color:
            rgba(
              255,
              196,
              0,
              .70
            );

          font-size: 5px;
          font-weight: 950;

          letter-spacing:
            .35px;

          cursor: pointer;
        }


        .workbook-button:hover:not(
          :disabled
        ) {
          border-color:
            rgba(
              255,
              196,
              0,
              .45
            );

          color:
            #ffc400;
        }


        .workbook-button:disabled {
          opacity:
            .28;

          cursor:
            default;
        }

      `}</style>

    </section>
  );
}
