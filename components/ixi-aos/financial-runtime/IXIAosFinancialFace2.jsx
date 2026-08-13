/*
 * IXI AOS FINANCIAL FACE 2
 *
 * STANDARD AOS FINANCIAL FACE
 * ---------------------------
 *
 * FACE 1
 * Identity / presentation.
 *
 * FACE 2
 * Financial.
 *
 * FACE 3+
 * User / business defined.
 *
 *
 * FACE LAB DOCTRINE
 * -----------------
 *
 * This component owns a real physical Face
 * chassis:
 *
 * 298px native panel width
 * 471px native panel height
 * 1px shell border
 * 13px shell radius
 * clipped internal surface
 * physical card shadow
 *
 *
 * AOF2 DATA DOCTRINE
 * ------------------
 *
 * AOF2 does NOT own financial truth.
 *
 * It consumes:
 *
 * Financial Engine
 *        ↓
 * Passport / recursive snapshot
 *        ↓
 * lifecycle snapshot
 *        ↓
 * AOF2
 *
 *
 * VISUAL DOCTRINE
 * ---------------
 *
 * Financial Face uses a restrained
 * U.S.-currency-inspired palette:
 *
 * deep money green
 * engraved green-black
 * paper/ivory white
 * muted mint
 * black
 *
 * No photographic money imagery.
 * No decorative image asset.
 */


const FACE_WIDTH =
  298;

const FACE_HEIGHT =
  471;


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

    const safeAmount =
      Number.isFinite(
        amount
      )
        ? amount
        : 0;


    return `$${Math.round(
      safeAmount
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
   SNAPSHOT
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


  return safeObject(
    source
      ?.snapshots
      ?.[
        resolvedCurrency
      ]
  );
}


/* =========================================================
   RECENT ACTIVITY
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
   METRIC
   ========================================================= */

function FinancialMetric({
  label,
  value,
  currency,
  strong = false
}) {

  return (
    <div
      className={[
        "financial-metric",

        strong
          ? "financial-metric-strong"
          : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >

      <span>
        {label}
      </span>

      <strong>
        {
          formatMoney(
            value,
            currency
          )
        }
      </strong>

    </div>
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
        "ixi-aos-financial-face2-shell",

        className
      ]
        .filter(Boolean)
        .join(" ")}
    >

      {/* ===================================================
          ENGRAVED INNER FACE
          =================================================== */}

      <div className="financial-face">

        {/* ===============================================
            PASSPORT STRIP
            =============================================== */}

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


        {/* ===============================================
            HEADER
            =============================================== */}

        <header className="financial-header">

          <div className="financial-header-copy">

            <span>
              FINANCIAL
            </span>

            <strong>
              {objectLabel}
            </strong>

          </div>


          <div className="period-badge">
            {
              clean(
                periodLabel
              ) ||
              "YTD"
            }
          </div>

        </header>


        {/* ===============================================
            PRIMARY ECONOMICS
            =============================================== */}

        <div className="primary-grid">

          <FinancialMetric
            label="INCURRED COST"

            value={
              incurredCost
            }

            currency={
              resolvedCurrency
            }

            strong
          />


          <FinancialMetric
            label="COMMITTED"

            value={
              remainingCommitment
            }

            currency={
              resolvedCurrency
            }

            strong
          />


          <FinancialMetric
            label="PROJECTED"

            value={
              projectedOutflow
            }

            currency={
              resolvedCurrency
            }

            strong
          />


          <FinancialMetric
            label="NET"

            value={
              operatingNet
            }

            currency={
              resolvedCurrency
            }

            strong
          />

        </div>


        {/* ===============================================
            SECONDARY ECONOMICS
            =============================================== */}

        <div className="secondary-grid">

          <FinancialMetric
            label="PAID"

            value={
              paid
            }

            currency={
              resolvedCurrency
            }
          />


          <FinancialMetric
            label="UNPAID"

            value={
              unpaid
            }

            currency={
              resolvedCurrency
            }
          />


          <FinancialMetric
            label="REVENUE"

            value={
              revenue
            }

            currency={
              resolvedCurrency
            }
          />


          <FinancialMetric
            label="RECEIVABLE"

            value={
              receivable
            }

            currency={
              resolvedCurrency
            }
          />


          <FinancialMetric
            label="COLLECTED"

            value={
              collected
            }

            currency={
              resolvedCurrency
            }
          />


          <div className="currency-cell">

            <span>
              CURRENCY
            </span>

            <strong>
              {resolvedCurrency}
            </strong>

          </div>

        </div>


        {/* ===============================================
            RECENT ACTIVITY
            =============================================== */}

        <div className="activity-block">

          <div className="activity-heading">

            <strong>
              RECENT
            </strong>

            <span>
              ACTIVITY
            </span>

          </div>


          <div className="activity-ledger">

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

                        <div className="activity-copy">

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

                      <span />

                      <strong>
                        NO FINANCIAL ACTIVITY
                      </strong>

                      <span />

                    </div>
                  )
            }

          </div>

        </div>


        {/* ===============================================
            QUICK ACTIONS
            =============================================== */}

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


        {/* ===============================================
            WORKBOOK
            =============================================== */}

        <div className="workbook-zone">

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

        </div>

      </div>


      <style jsx>{`

        /*
         * =================================================
         * PHYSICAL FACE LAB SHELL
         * =================================================
         *
         * Same physical doctrine as Face Lab:
         *
         * 298 native width
         * 471 native height
         * bordered physical object
         * rounded shell
         * clipped contents
         * real card shadow
         */

        .ixi-aos-financial-face2-shell {
          box-sizing:
            border-box;

          position:
            relative;

          width:
            100%;

          min-width:
            100%;

          max-width:
            100%;

          height:
            100%;

          min-height:
            100%;

          max-height:
            100%;

          display:
            flex;

          flex-direction:
            column;

          border:
            1px solid
            rgba(
              177,
              198,
              168,
              .25
            );

          border-radius:
            13px;

          overflow:
            hidden;

          background:
            #101a13;

          box-shadow:
            0 18px 40px
            rgba(
              0,
              0,
              0,
              .46
            );
        }


        /*
         * Native datum remains explicit for
         * Face Lab / Console architecture.
         */
        .ixi-aos-financial-face2-shell {
          --ixi-aof2-native-width:
            ${FACE_WIDTH}px;

          --ixi-aof2-native-height:
            ${FACE_HEIGHT}px;
        }


        /*
         * =================================================
         * MONEY FACE
         * =================================================
         *
         * Layered CSS only.
         *
         * No image.
         *
         * Fine radial/linear fields give a
         * subtle engraved-security-print feel
         * without becoming decorative noise.
         */

        .financial-face {
          box-sizing:
            border-box;

          position:
            relative;

          width:
            100%;

          height:
            100%;

          min-width:
            0;

          min-height:
            0;

          display:
            flex;

          flex-direction:
            column;

          overflow:
            hidden;

          color:
            #f2f2e8;

          background:
            radial-gradient(
              ellipse at 82% 17%,
              rgba(
                143,
                176,
                129,
                .10
              ),
              transparent 33%
            ),
            radial-gradient(
              ellipse at 18% 76%,
              rgba(
                167,
                192,
                153,
                .055
              ),
              transparent 38%
            ),
            repeating-linear-gradient(
              118deg,
              rgba(
                225,
                234,
                215,
                .014
              ) 0px,
              rgba(
                225,
                234,
                215,
                .014
              ) 1px,
              transparent 1px,
              transparent 5px
            ),
            linear-gradient(
              180deg,
              #213a29 0%,
              #172b1e 24%,
              #102117 58%,
              #0b1810 100%
            );
        }


        /*
         * Inner banknote-style keyline.
         */

        .financial-face::before {
          content:
            "";

          position:
            absolute;

          inset:
            5px;

          z-index:
            0;

          pointer-events:
            none;

          border:
            1px solid
            rgba(
              205,
              219,
              193,
              .11
            );

          border-radius:
            9px;
        }


        /*
         * Subtle center watermark field.
         */

        .financial-face::after {
          content:
            "$";

          position:
            absolute;

          right:
            -9px;

          top:
            90px;

          z-index:
            0;

          color:
            rgba(
              215,
              226,
              205,
              .022
            );

          font-family:
            Georgia,
            "Times New Roman",
            serif;

          font-size:
            190px;

          font-weight:
            900;

          line-height:
            .8;

          pointer-events:
            none;
        }


        .financial-face
        > * {
          position:
            relative;

          z-index:
            1;
        }


        /*
         * =================================================
         * PASSPORT STRIP
         * =================================================
         */

        .passport-strip {
          box-sizing:
            border-box;

          height:
            25px;

          flex:
            0 0 25px;

          padding:
            0 10px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            8px;

          border-bottom:
            1px solid
            rgba(
              213,
              225,
              202,
              .12
            );

          background:
            linear-gradient(
              180deg,
              rgba(
                3,
                9,
                5,
                .45
              ),
              rgba(
                3,
                9,
                5,
                .22
              )
            );
        }


        .passport-strip span {
          color:
            rgba(
              226,
              232,
              218,
              .57
            );

          font-family:
            Georgia,
            "Times New Roman",
            serif;

          font-size:
            5.2px;

          font-weight:
            900;

          letter-spacing:
            .75px;
        }


        .passport-strip strong {
          min-width:
            0;

          overflow:
            hidden;

          color:
            #dce7d4;

          font-size:
            5px;

          font-weight:
            950;

          letter-spacing:
            .28px;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        /*
         * =================================================
         * HEADER
         * =================================================
         */

        .financial-header {
          box-sizing:
            border-box;

          min-height:
            55px;

          flex:
            0 0 55px;

          padding:
            8px 10px 9px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            8px;

          border-bottom:
            1px solid
            rgba(
              218,
              228,
              209,
              .14
            );

          background:
            linear-gradient(
              90deg,
              rgba(
                4,
                13,
                8,
                .34
              ),
              rgba(
                101,
                133,
                89,
                .035
              )
            );
        }


        .financial-header-copy {
          min-width:
            0;

          display:
            flex;

          flex-direction:
            column;

          justify-content:
            center;

          gap:
            3px;
        }


        .financial-header-copy span {
          color:
            #c6d6bd;

          font-family:
            Georgia,
            "Times New Roman",
            serif;

          font-size:
            6.5px;

          font-weight:
            900;

          letter-spacing:
            .9px;
        }


        .financial-header-copy strong {
          overflow:
            hidden;

          color:
            #f4f2e6;

          font-family:
            Georgia,
            "Times New Roman",
            serif;

          font-size:
            12px;

          font-weight:
            900;

          letter-spacing:
            -.15px;

          line-height:
            1.05;

          text-overflow:
            ellipsis;

          text-shadow:
            0 1px 0
            rgba(
              0,
              0,
              0,
              .9
            );

          white-space:
            nowrap;
        }


        .period-badge {
          flex:
            none;

          min-width:
            34px;

          height:
            18px;

          padding:
            0 7px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border:
            1px solid
            rgba(
              211,
              224,
              199,
              .18
            );

          border-radius:
            3px;

          background:
            rgba(
              3,
              10,
              6,
              .32
            );

          color:
            #d9e4d1;

          font-family:
            Georgia,
            "Times New Roman",
            serif;

          font-size:
            5.5px;

          font-weight:
            900;

          letter-spacing:
            .6px;
        }


        /*
         * =================================================
         * PRIMARY GRID
         * =================================================
         */

        .primary-grid {
          box-sizing:
            border-box;

          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          flex:
            0 0 auto;

          margin:
            6px 7px 0;

          overflow:
            hidden;

          border:
            1px solid
            rgba(
              211,
              224,
              199,
              .14
            );

          border-radius:
            5px;

          background:
            rgba(
              2,
              8,
              4,
              .24
            );
        }


        .financial-metric {
          box-sizing:
            border-box;

          min-width:
            0;

          min-height:
            37px;

          padding:
            6px 7px;

          display:
            flex;

          flex-direction:
            column;

          justify-content:
            center;

          gap:
            2px;
        }


        .primary-grid
        .financial-metric {
          min-height:
            46px;

          border-right:
            1px solid
            rgba(
              211,
              224,
              199,
              .09
            );

          border-bottom:
            1px solid
            rgba(
              211,
              224,
              199,
              .09
            );
        }


        .primary-grid
        .financial-metric:nth-child(
          2n
        ) {
          border-right:
            0;
        }


        .primary-grid
        .financial-metric:nth-child(
          3
        ),
        .primary-grid
        .financial-metric:nth-child(
          4
        ) {
          border-bottom:
            0;
        }


        .financial-metric span,
        .currency-cell span {
          color:
            rgba(
              205,
              218,
              195,
              .53
            );

          font-size:
            4.7px;

          font-weight:
            950;

          letter-spacing:
            .38px;
        }


        .financial-metric strong,
        .currency-cell strong {
          color:
            #ebece2;

          font-family:
            Georgia,
            "Times New Roman",
            serif;

          font-size:
            7px;

          font-weight:
            900;

          line-height:
            1;
        }


        .financial-metric-strong strong {
          color:
            #ffffff;

          font-size:
            12px;

          text-shadow:
            0 1px 0
            #000;
        }


        /*
         * =================================================
         * SECONDARY GRID
         * =================================================
         */

        .secondary-grid {
          box-sizing:
            border-box;

          display:
            grid;

          grid-template-columns:
            1fr 1fr 1fr;

          flex:
            0 0 auto;

          margin:
            6px 7px 0;

          overflow:
            hidden;

          border:
            1px solid
            rgba(
              211,
              224,
              199,
              .11
            );

          border-radius:
            5px;

          background:
            rgba(
              2,
              8,
              4,
              .17
            );
        }


        .secondary-grid
        .financial-metric,
        .currency-cell {
          min-height:
            34px;

          border-right:
            1px solid
            rgba(
              211,
              224,
              199,
              .075
            );

          border-bottom:
            1px solid
            rgba(
              211,
              224,
              199,
              .075
            );
        }


        .secondary-grid
        .financial-metric:nth-child(
          3
        ),
        .secondary-grid
        .currency-cell {
          border-right:
            0;
        }


        .secondary-grid
        .financial-metric:nth-child(
          4
        ),
        .secondary-grid
        .financial-metric:nth-child(
          5
        ),
        .secondary-grid
        .currency-cell {
          border-bottom:
            0;
        }


        .currency-cell {
          box-sizing:
            border-box;

          padding:
            6px 7px;

          display:
            flex;

          flex-direction:
            column;

          justify-content:
            center;

          gap:
            2px;
        }


        /*
         * =================================================
         * ACTIVITY LEDGER
         * =================================================
         */

        .activity-block {
          box-sizing:
            border-box;

          flex:
            1;

          min-height:
            0;

          margin:
            6px 7px 0;

          display:
            flex;

          flex-direction:
            column;

          overflow:
            hidden;

          border:
            1px solid
            rgba(
              211,
              224,
              199,
              .11
            );

          border-radius:
            5px;

          background:
            rgba(
              2,
              8,
              4,
              .18
            );
        }


        .activity-heading {
          height:
            22px;

          flex:
            0 0 22px;

          padding:
            0 7px;

          display:
            flex;

          align-items:
            center;

          gap:
            5px;

          border-bottom:
            1px solid
            rgba(
              211,
              224,
              199,
              .09
            );

          background:
            rgba(
              197,
              214,
              186,
              .025
            );
        }


        .activity-heading strong {
          color:
            #d7e2cf;

          font-family:
            Georgia,
            "Times New Roman",
            serif;

          font-size:
            5.5px;

          font-weight:
            900;

          letter-spacing:
            .55px;
        }


        .activity-heading span {
          color:
            rgba(
              213,
              224,
              204,
              .35
            );

          font-size:
            4.4px;

          font-weight:
            950;

          letter-spacing:
            .3px;
        }


        .activity-ledger {
          flex:
            1;

          min-height:
            0;

          padding:
            4px;

          display:
            flex;

          flex-direction:
            column;

          gap:
            3px;

          overflow:
            hidden;

          background:
            repeating-linear-gradient(
              180deg,
              transparent 0,
              transparent 25px,
              rgba(
                205,
                219,
                195,
                .035
              ) 25px,
              rgba(
                205,
                219,
                195,
                .035
              ) 26px
            );
        }


        .activity-row {
          box-sizing:
            border-box;

          min-height:
            29px;

          padding:
            4px 6px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            6px;

          border:
            1px solid
            rgba(
              205,
              219,
              195,
              .065
            );

          border-radius:
            3px;

          background:
            rgba(
              0,
              0,
              0,
              .12
            );
        }


        .activity-copy {
          min-width:
            0;

          display:
            flex;

          flex-direction:
            column;

          gap:
            1px;
        }


        .activity-copy strong {
          overflow:
            hidden;

          color:
            rgba(
              240,
              241,
              232,
              .78
            );

          font-size:
            5px;

          font-weight:
            950;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .activity-copy span {
          color:
            rgba(
              205,
              219,
              195,
              .36
            );

          font-size:
            4px;

          font-weight:
            850;
        }


        .activity-row em {
          flex:
            none;

          color:
            #f0f1e8;

          font-family:
            Georgia,
            "Times New Roman",
            serif;

          font-size:
            5.5px;

          font-style:
            normal;

          font-weight:
            900;
        }


        .empty-activity {
          flex:
            1;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            6px;
        }


        .empty-activity span {
          width:
            22px;

          height:
            1px;

          background:
            rgba(
              205,
              219,
              195,
              .22
            );
        }


        .empty-activity strong {
          color:
            rgba(
              222,
              230,
              214,
              .30
            );

          font-family:
            Georgia,
            "Times New Roman",
            serif;

          font-size:
            5px;

          font-weight:
            900;

          letter-spacing:
            .45px;
        }


        /*
         * =================================================
         * ACTIONS
         * =================================================
         */

        .financial-actions {
          box-sizing:
            border-box;

          flex:
            0 0 34px;

          min-height:
            34px;

          padding:
            5px 7px 4px;

          display:
            grid;

          grid-template-columns:
            1fr 1fr 1fr 1fr;

          gap:
            4px;
        }


        .financial-actions button {
          min-width:
            0;

          height:
            25px;

          padding:
            0 2px;

          border:
            1px solid
            rgba(
              202,
              219,
              191,
              .16
            );

          border-radius:
            4px;

          background:
            linear-gradient(
              180deg,
              rgba(
                214,
                227,
                203,
                .055
              ),
              rgba(
                0,
                0,
                0,
                .16
              )
            );

          color:
            #d9e4d1;

          font-size:
            4.5px;

          font-weight:
            950;

          letter-spacing:
            .15px;

          cursor:
            pointer;
        }


        .financial-actions
        button:hover:not(
          :disabled
        ) {
          border-color:
            rgba(
              225,
              235,
              216,
              .42
            );

          background:
            rgba(
              213,
              228,
              202,
              .10
            );

          color:
            #ffffff;
        }


        .financial-actions
        button:disabled {
          opacity:
            .32;

          cursor:
            default;
        }


        /*
         * =================================================
         * WORKBOOK
         * =================================================
         */

        .workbook-zone {
          box-sizing:
            border-box;

          flex:
            0 0 38px;

          min-height:
            38px;

          padding:
            0 7px 7px;

          display:
            flex;

          align-items:
            flex-end;
        }


        .workbook-button {
          width:
            100%;

          height:
            30px;

          border:
            1px solid
            rgba(
              220,
              231,
              211,
              .22
            );

          border-radius:
            4px;

          background:
            linear-gradient(
              180deg,
              #d5dfcd,
              #aebfa5
            );

          color:
            #0b160e;

          font-family:
            Georgia,
            "Times New Roman",
            serif;

          font-size:
            5.5px;

          font-weight:
            900;

          letter-spacing:
            .42px;

          box-shadow:
            inset 0 1px 0
            rgba(
              255,
              255,
              255,
              .34
            );

          cursor:
            pointer;
        }


        .workbook-button:hover:not(
          :disabled
        ) {
          background:
            linear-gradient(
              180deg,
              #edf2e8,
              #c3d1ba
            );

          color:
            #050a06;
        }


        .workbook-button:disabled {
          opacity:
            .42;

          cursor:
            default;
        }

      `}</style>

    </section>
  );
}
