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

      <style jsx global>{`

  /* =====================================================
     AOF2
     FINANCIAL FACE
     PHYSICAL CARD SHELL
     ===================================================== */

  .ixi-aos-financial-face2-shell {
    --ixi-aof2-native-width: ${FACE_WIDTH}px;
    --ixi-aof2-native-height: ${FACE_HEIGHT}px;

    box-sizing: border-box;

    position: relative;

    width: 100%;
    min-width: 100%;
    max-width: 100%;

    height: 100%;
    min-height: 100%;
    max-height: 100%;

    margin: 0;
    padding: 0;

    display: flex;
    flex-direction: column;

    overflow: hidden;

    border:
      1px solid
      rgba(
        177,
        198,
        168,
        .28
      );

    border-radius: 13px;

    background: #101a13;

    box-shadow:
      0 18px 40px
      rgba(
        0,
        0,
        0,
        .46
      );
  }


  /* =====================================================
     GLOBAL RESET
     ONLY INSIDE AOF2
     ===================================================== */

  .ixi-aos-financial-face2-shell *,
  .ixi-aos-financial-face2-shell *::before,
  .ixi-aos-financial-face2-shell *::after {
    box-sizing: border-box;
  }


  .ixi-aos-financial-face2-shell div,
  .ixi-aos-financial-face2-shell section,
  .ixi-aos-financial-face2-shell header,
  .ixi-aos-financial-face2-shell span,
  .ixi-aos-financial-face2-shell strong,
  .ixi-aos-financial-face2-shell em,
  .ixi-aos-financial-face2-shell button {
    margin-top: 0;
    margin-bottom: 0;
  }


  /* =====================================================
     MONEY FACE SURFACE
     ===================================================== */

  .ixi-aos-financial-face2-shell
  .financial-face {
    position: relative;

    width: 100%;
    height: 100%;

    min-width: 0;
    min-height: 0;

    margin: 0;
    padding: 0;

    display: flex;
    flex-direction: column;

    overflow: hidden;

    color: #f2f2e8;

    background:
      radial-gradient(
        ellipse at 84% 17%,
        rgba(
          150,
          181,
          137,
          .105
        ),
        transparent 34%
      ),
      radial-gradient(
        ellipse at 16% 77%,
        rgba(
          171,
          196,
          156,
          .055
        ),
        transparent 40%
      ),
      repeating-linear-gradient(
        118deg,
        rgba(
          225,
          234,
          215,
          .015
        ) 0,
        rgba(
          225,
          234,
          215,
          .015
        ) 1px,
        transparent 1px,
        transparent 5px
      ),
      linear-gradient(
        180deg,
        #213a29 0%,
        #193020 23%,
        #122619 50%,
        #0e1f15 73%,
        #0a170f 100%
      );
  }


  /* =====================================================
     INNER BILL KEYLINE
     ===================================================== */

  .ixi-aos-financial-face2-shell
  .financial-face::before {
    content: "";

    position: absolute;

    inset: 5px;

    z-index: 0;

    pointer-events: none;

    border:
      1px solid
      rgba(
        205,
        219,
        193,
        .11
      );

    border-radius: 9px;
  }


  /* =====================================================
     WATERMARK
     ===================================================== */

  .ixi-aos-financial-face2-shell
  .financial-face::after {
    content: "$";

    position: absolute;

    right: -10px;
    top: 91px;

    z-index: 0;

    pointer-events: none;

    color:
      rgba(
        215,
        226,
        205,
        .025
      );

    font-family:
      Georgia,
      "Times New Roman",
      serif;

    font-size: 190px;
    font-weight: 900;

    line-height: .8;
  }


  .ixi-aos-financial-face2-shell
  .financial-face > * {
    position: relative;

    z-index: 1;
  }


  /* =====================================================
     PASSPORT STRIP
     ===================================================== */

  .ixi-aos-financial-face2-shell
  .passport-strip {
    width: 100%;

    height: 25px;
    min-height: 25px;

    flex: 0 0 25px;

    padding:
      0 10px;

    display: flex;

    align-items: center;
    justify-content: space-between;

    gap: 8px;

    overflow: hidden;

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
          .48
        ),
        rgba(
          3,
          9,
          5,
          .22
        )
      );
  }


  .ixi-aos-financial-face2-shell
  .passport-strip span {
    display: block;

    min-width: 0;

    margin: 0;
    padding: 0;

    overflow: hidden;

    color:
      rgba(
        226,
        232,
        218,
        .58
      );

    font-family:
      Georgia,
      "Times New Roman",
      serif;

    font-size: 5.2px;
    font-weight: 900;

    line-height: 1;

    letter-spacing: .75px;

    text-overflow: ellipsis;
    white-space: nowrap;
  }


  .ixi-aos-financial-face2-shell
  .passport-strip strong {
    display: block;

    min-width: 0;

    margin: 0;
    padding: 0;

    overflow: hidden;

    color: #eef2e9;

    font-family:
      Arial,
      Helvetica,
      sans-serif;

    font-size: 5px;
    font-weight: 900;

    line-height: 1;

    letter-spacing: .28px;

    text-overflow: ellipsis;
    white-space: nowrap;
  }


  /* =====================================================
     FINANCIAL HEADER
     ===================================================== */

  .ixi-aos-financial-face2-shell
  .financial-header {
    width: 100%;

    height: 55px;
    min-height: 55px;

    flex: 0 0 55px;

    padding:
      8px 10px 9px;

    display: flex;

    align-items: center;
    justify-content: space-between;

    gap: 8px;

    overflow: hidden;

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
          .35
        ),
        rgba(
          101,
          133,
          89,
          .04
        )
      );
  }


  .ixi-aos-financial-face2-shell
  .financial-header-copy {
    min-width: 0;

    flex: 1 1 auto;

    display: flex;
    flex-direction: column;
    justify-content: center;

    gap: 4px;

    overflow: hidden;
  }


  .ixi-aos-financial-face2-shell
  .financial-header-copy span {
    display: block;

    margin: 0;
    padding: 0;

    color: #c6d6bd;

    font-family:
      Georgia,
      "Times New Roman",
      serif;

    font-size: 6.5px;
    font-weight: 900;

    line-height: 1;

    letter-spacing: .9px;

    white-space: nowrap;
  }


  .ixi-aos-financial-face2-shell
  .financial-header-copy strong {
    display: block;

    min-width: 0;

    margin: 0;
    padding: 0;

    overflow: hidden;

    color: #ffffff;

    font-family:
      Georgia,
      "Times New Roman",
      serif;

    font-size: 12px;
    font-weight: 900;

    line-height: 1.05;

    letter-spacing: -.15px;

    text-overflow: ellipsis;
    white-space: nowrap;

    text-shadow:
      0 1px 0
      rgba(
        0,
        0,
        0,
        .95
      );
  }


  .ixi-aos-financial-face2-shell
  .period-badge {
    flex: none;

    min-width: 34px;
    height: 18px;

    padding:
      0 7px;

    display: flex;

    align-items: center;
    justify-content: center;

    border:
      1px solid
      rgba(
        211,
        224,
        199,
        .20
      );

    border-radius: 3px;

    background:
      rgba(
        3,
        10,
        6,
        .35
      );

    color: #edf2e8;

    font-family:
      Georgia,
      "Times New Roman",
      serif;

    font-size: 5.5px;
    font-weight: 900;

    line-height: 1;

    letter-spacing: .6px;
  }


  /* =====================================================
     PRIMARY FINANCIAL GRID
     ===================================================== */

  .ixi-aos-financial-face2-shell
  .primary-grid {
    width: auto;

    height: 94px;
    min-height: 94px;

    flex: 0 0 94px;

    margin:
      6px 7px 0;

    display: grid;

    grid-template-columns:
      minmax(0, 1fr)
      minmax(0, 1fr);

    grid-template-rows:
      46px
      46px;

    overflow: hidden;

    border:
      1px solid
      rgba(
        211,
        224,
        199,
        .14
      );

    border-radius: 5px;

    background:
      rgba(
        2,
        8,
        4,
        .25
      );
  }


  /* =====================================================
     FINANCIAL METRIC
     IMPORTANT:
     THIS IS A CHILD REACT COMPONENT.
     THESE RULES MUST REMAIN GLOBAL.
     ===================================================== */

  .ixi-aos-financial-face2-shell
  .financial-metric {
    width: 100%;
    height: 100%;

    min-width: 0;
    min-height: 0;

    margin: 0;

    padding:
      6px 7px;

    display: flex;

    flex-direction: column;

    align-items: flex-start;
    justify-content: center;

    gap: 4px;

    overflow: hidden;
  }


  .ixi-aos-financial-face2-shell
  .primary-grid
  .financial-metric {
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


  .ixi-aos-financial-face2-shell
  .primary-grid
  .financial-metric:nth-child(2),
  .ixi-aos-financial-face2-shell
  .primary-grid
  .financial-metric:nth-child(4) {
    border-right: 0;
  }


  .ixi-aos-financial-face2-shell
  .primary-grid
  .financial-metric:nth-child(3),
  .ixi-aos-financial-face2-shell
  .primary-grid
  .financial-metric:nth-child(4) {
    border-bottom: 0;
  }


  .ixi-aos-financial-face2-shell
  .financial-metric span {
    display: block;

    width: 100%;

    min-width: 0;

    margin: 0;
    padding: 0;

    overflow: hidden;

    color:
      rgba(
        205,
        218,
        195,
        .58
      );

    font-family:
      Arial,
      Helvetica,
      sans-serif;

    font-size: 4.7px;
    font-style: normal;
    font-weight: 900;

    line-height: 1;

    letter-spacing: .38px;

    text-align: left;

    text-overflow: ellipsis;
    white-space: nowrap;
  }


  .ixi-aos-financial-face2-shell
  .financial-metric strong {
    display: block;

    width: 100%;

    min-width: 0;

    margin: 0;
    padding: 0;

    overflow: hidden;

    color: #ebece2;

    font-family:
      Georgia,
      "Times New Roman",
      serif;

    font-size: 7px;
    font-style: normal;
    font-weight: 900;

    line-height: 1;

    letter-spacing: 0;

    text-align: left;

    text-overflow: ellipsis;
    white-space: nowrap;
  }


  .ixi-aos-financial-face2-shell
  .financial-metric-strong strong {
    color: #ffffff;

    font-size: 12px;
    font-weight: 900;

    line-height: 1;

    text-shadow:
      0 1px 0
      rgba(
        0,
        0,
        0,
        .95
      );
  }


  /* =====================================================
     SECONDARY FINANCIAL GRID
     ===================================================== */

  .ixi-aos-financial-face2-shell
  .secondary-grid {
    width: auto;

    height: 70px;
    min-height: 70px;

    flex: 0 0 70px;

    margin:
      6px 7px 0;

    display: grid;

    grid-template-columns:
      repeat(
        3,
        minmax(0, 1fr)
      );

    grid-template-rows:
      34px
      34px;

    overflow: hidden;

    border:
      1px solid
      rgba(
        211,
        224,
        199,
        .11
      );

    border-radius: 5px;

    background:
      rgba(
        2,
        8,
        4,
        .18
      );
  }


  .ixi-aos-financial-face2-shell
  .secondary-grid
  .financial-metric,
  .ixi-aos-financial-face2-shell
  .secondary-grid
  .currency-cell {
    width: 100%;
    height: 100%;

    min-width: 0;
    min-height: 0;

    margin: 0;

    overflow: hidden;

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


  .ixi-aos-financial-face2-shell
  .secondary-grid
  .financial-metric:nth-child(3),
  .ixi-aos-financial-face2-shell
  .secondary-grid
  .currency-cell {
    border-right: 0;
  }


  .ixi-aos-financial-face2-shell
  .secondary-grid
  .financial-metric:nth-child(4),
  .ixi-aos-financial-face2-shell
  .secondary-grid
  .financial-metric:nth-child(5),
  .ixi-aos-financial-face2-shell
  .secondary-grid
  .currency-cell {
    border-bottom: 0;
  }


  /* =====================================================
     CURRENCY CELL
     ===================================================== */

  .ixi-aos-financial-face2-shell
  .currency-cell {
    padding:
      6px 7px;

    display: flex;

    flex-direction: column;

    align-items: flex-start;
    justify-content: center;

    gap: 4px;
  }


  .ixi-aos-financial-face2-shell
  .currency-cell span {
    display: block;

    width: 100%;

    margin: 0;
    padding: 0;

    color:
      rgba(
        205,
        218,
        195,
        .58
      );

    font-family:
      Arial,
      Helvetica,
      sans-serif;

    font-size: 4.7px;
    font-weight: 900;

    line-height: 1;

    letter-spacing: .38px;
  }


  .ixi-aos-financial-face2-shell
  .currency-cell strong {
    display: block;

    width: 100%;

    margin: 0;
    padding: 0;

    color: #ebece2;

    font-family:
      Georgia,
      "Times New Roman",
      serif;

    font-size: 7px;
    font-weight: 900;

    line-height: 1;
  }


  /* =====================================================
     RECENT ACTIVITY BLOCK
     ===================================================== */

  .ixi-aos-financial-face2-shell
  .activity-block {
    width: auto;

    flex:
      1 1 auto;

    min-width: 0;
    min-height: 0;

    margin:
      6px 7px 0;

    display: flex;
    flex-direction: column;

    overflow: hidden;

    border:
      1px solid
      rgba(
        211,
        224,
        199,
        .11
      );

    border-radius: 5px;

    background:
      rgba(
        2,
        8,
        4,
        .18
      );
  }


  .ixi-aos-financial-face2-shell
  .activity-heading {
    width: 100%;

    height: 22px;
    min-height: 22px;

    flex: 0 0 22px;

    padding:
      0 7px;

    display: flex;

    align-items: center;

    gap: 5px;

    overflow: hidden;

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


  .ixi-aos-financial-face2-shell
  .activity-heading strong {
    display: block;

    margin: 0;
    padding: 0;

    color: #d7e2cf;

    font-family:
      Georgia,
      "Times New Roman",
      serif;

    font-size: 5.5px;
    font-weight: 900;

    line-height: 1;

    letter-spacing: .55px;

    white-space: nowrap;
  }


  .ixi-aos-financial-face2-shell
  .activity-heading span {
    display: block;

    margin: 0;
    padding: 0;

    color:
      rgba(
        213,
        224,
        204,
        .36
      );

    font-family:
      Arial,
      Helvetica,
      sans-serif;

    font-size: 4.4px;
    font-weight: 900;

    line-height: 1;

    letter-spacing: .3px;

    white-space: nowrap;
  }


  /* =====================================================
     ACTIVITY LEDGER
     ===================================================== */

  .ixi-aos-financial-face2-shell
  .activity-ledger {
    width: 100%;

    flex:
      1 1 auto;

    min-width: 0;
    min-height: 0;

    padding: 4px;

    display: flex;

    flex-direction: column;

    gap: 3px;

    overflow: hidden;

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


  .ixi-aos-financial-face2-shell
  .activity-row {
    width: 100%;

    min-width: 0;
    min-height: 29px;

    margin: 0;

    padding:
      4px 6px;

    display: flex;

    align-items: center;
    justify-content: space-between;

    gap: 6px;

    overflow: hidden;

    border:
      1px solid
      rgba(
        205,
        219,
        195,
        .065
      );

    border-radius: 3px;

    background:
      rgba(
        0,
        0,
        0,
        .12
      );
  }


  .ixi-aos-financial-face2-shell
  .activity-copy {
    min-width: 0;

    flex:
      1 1 auto;

    display: flex;

    flex-direction: column;

    gap: 2px;

    overflow: hidden;
  }


  .ixi-aos-financial-face2-shell
  .activity-copy strong {
    display: block;

    width: 100%;

    min-width: 0;

    margin: 0;
    padding: 0;

    overflow: hidden;

    color:
      rgba(
        240,
        241,
        232,
        .80
      );

    font-family:
      Arial,
      Helvetica,
      sans-serif;

    font-size: 5px;
    font-weight: 900;

    line-height: 1;

    text-overflow: ellipsis;
    white-space: nowrap;
  }


  .ixi-aos-financial-face2-shell
  .activity-copy span {
    display: block;

    width: 100%;

    min-width: 0;

    margin: 0;
    padding: 0;

    overflow: hidden;

    color:
      rgba(
        205,
        219,
        195,
        .38
      );

    font-family:
      Arial,
      Helvetica,
      sans-serif;

    font-size: 4px;
    font-weight: 800;

    line-height: 1;

    text-overflow: ellipsis;
    white-space: nowrap;
  }


  .ixi-aos-financial-face2-shell
  .activity-row em {
    flex:
      0 0 auto;

    margin: 0;
    padding: 0;

    color: #f0f1e8;

    font-family:
      Georgia,
      "Times New Roman",
      serif;

    font-size: 5.5px;
    font-style: normal;
    font-weight: 900;

    line-height: 1;

    white-space: nowrap;
  }


  /* =====================================================
     EMPTY ACTIVITY
     ===================================================== */

  .ixi-aos-financial-face2-shell
  .empty-activity {
    width: 100%;

    flex:
      1 1 auto;

    min-height: 0;

    display: flex;

    align-items: center;
    justify-content: center;

    gap: 7px;

    overflow: hidden;
  }


  .ixi-aos-financial-face2-shell
  .empty-activity span {
    display: block;

    width: 22px;
    height: 1px;

    flex:
      0 0 22px;

    background:
      rgba(
        205,
        219,
        195,
        .22
      );
  }


  .ixi-aos-financial-face2-shell
  .empty-activity strong {
    display: block;

    margin: 0;
    padding: 0;

    color:
      rgba(
        222,
        230,
        214,
        .34
      );

    font-family:
      Georgia,
      "Times New Roman",
      serif;

    font-size: 5px;
    font-weight: 900;

    line-height: 1;

    letter-spacing: .45px;

    white-space: nowrap;
  }

  /* =====================================================
     QUICK ACTIONS
     ===================================================== */

  .ixi-aos-financial-face2-shell
  .financial-actions {
    width: 100%;

    height: 34px;
    min-height: 34px;

    flex: 0 0 34px;

    padding:
      5px 7px 4px;

    display: grid;

    grid-template-columns:
      repeat(
        4,
        minmax(0, 1fr)
      );

    gap: 4px;

    overflow: hidden;
  }


  .ixi-aos-financial-face2-shell
  .financial-actions.compact {
    gap: 3px;
  }


  .ixi-aos-financial-face2-shell
  .financial-actions button {
    appearance: none;

    width: 100%;
    min-width: 0;

    height: 25px;
    min-height: 25px;

    margin: 0;
    padding: 0 3px;

    display: flex;

    align-items: center;
    justify-content: center;

    overflow: hidden;

    border:
      1px solid
      rgba(
        202,
        219,
        191,
        .17
      );

    border-radius: 4px;

    outline: none;

    background:
      linear-gradient(
        180deg,
        rgba(
          214,
          227,
          203,
          .060
        ),
        rgba(
          0,
          0,
          0,
          .17
        )
      );

    color: #d9e4d1;

    font-family:
      Arial,
      Helvetica,
      sans-serif;

    font-size: 4.5px;
    font-style: normal;
    font-weight: 900;

    line-height: 1;

    letter-spacing: .16px;

    text-align: center;

    text-overflow: ellipsis;
    white-space: nowrap;

    cursor: pointer;

    box-shadow:
      inset 0 1px 0
      rgba(
        255,
        255,
        255,
        .025
      );

    transition:
      border-color 120ms ease,
      background 120ms ease,
      color 120ms ease;
  }


  .ixi-aos-financial-face2-shell
  .financial-actions
  button:hover:not(:disabled) {
    border-color:
      rgba(
        225,
        235,
        216,
        .42
      );

    background:
      linear-gradient(
        180deg,
        rgba(
          222,
          234,
          212,
          .12
        ),
        rgba(
          11,
          28,
          17,
          .32
        )
      );

    color: #ffffff;
  }


  .ixi-aos-financial-face2-shell
  .financial-actions
  button:active:not(:disabled) {
    transform:
      translateY(1px);
  }


  .ixi-aos-financial-face2-shell
  .financial-actions
  button:focus-visible {
    border-color:
      rgba(
        236,
        244,
        230,
        .60
      );

    box-shadow:
      0 0 0 1px
      rgba(
        218,
        231,
        207,
        .12
      );
  }


  .ixi-aos-financial-face2-shell
  .financial-actions
  button:disabled {
    opacity: .32;

    color:
      rgba(
        213,
        226,
        203,
        .62
      );

    cursor: default;

    transform: none;
  }


  /* =====================================================
     WORKBOOK ZONE
     ===================================================== */

  .ixi-aos-financial-face2-shell
  .workbook-zone {
    width: 100%;

    height: 38px;
    min-height: 38px;

    flex: 0 0 38px;

    padding:
      0 7px 7px;

    display: flex;

    align-items: flex-end;
    justify-content: stretch;

    overflow: hidden;
  }


  .ixi-aos-financial-face2-shell
  .workbook-button {
    appearance: none;

    width: 100%;

    height: 30px;
    min-height: 30px;

    margin: 0;

    padding:
      0 8px;

    display: flex;

    align-items: center;
    justify-content: center;

    overflow: hidden;

    border:
      1px solid
      rgba(
        220,
        231,
        211,
        .26
      );

    border-radius: 4px;

    outline: none;

    background:
      linear-gradient(
        180deg,
        #d9e3d2 0%,
        #c2d0ba 48%,
        #aebfa5 100%
      );

    color: #0b160e;

    font-family:
      Georgia,
      "Times New Roman",
      serif;

    font-size: 5.5px;
    font-style: normal;
    font-weight: 900;

    line-height: 1;

    letter-spacing: .42px;

    text-align: center;

    text-overflow: ellipsis;
    white-space: nowrap;

    cursor: pointer;

    box-shadow:
      inset 0 1px 0
      rgba(
        255,
        255,
        255,
        .38
      ),
      0 1px 2px
      rgba(
        0,
        0,
        0,
        .22
      );

    transition:
      background 120ms ease,
      border-color 120ms ease,
      color 120ms ease;
  }


  .ixi-aos-financial-face2-shell
  .workbook-button:hover:not(:disabled) {
    border-color:
      rgba(
        236,
        243,
        231,
        .44
      );

    background:
      linear-gradient(
        180deg,
        #edf2e8 0%,
        #d5e0ce 48%,
        #c3d1ba 100%
      );

    color: #050a06;
  }


  .ixi-aos-financial-face2-shell
  .workbook-button:active:not(:disabled) {
    transform:
      translateY(1px);
  }


  .ixi-aos-financial-face2-shell
  .workbook-button:focus-visible {
    box-shadow:
      inset 0 1px 0
      rgba(
        255,
        255,
        255,
        .38
      ),
      0 0 0 1px
      rgba(
        236,
        243,
        231,
        .26
      );
  }


  .ixi-aos-financial-face2-shell
  .workbook-button:disabled {
    opacity: .46;

    cursor: default;

    transform: none;
  }


  /* =====================================================
     HARD TYPOGRAPHY CONTAINMENT
     ===================================================== */

  .ixi-aos-financial-face2-shell
  .primary-grid strong,
  .ixi-aos-financial-face2-shell
  .secondary-grid strong,
  .ixi-aos-financial-face2-shell
  .activity-block strong {
    max-width: 100%;
  }


  .ixi-aos-financial-face2-shell
  .primary-grid span,
  .ixi-aos-financial-face2-shell
  .secondary-grid span,
  .ixi-aos-financial-face2-shell
  .activity-block span {
    max-width: 100%;
  }


  /*
   * Prevent external object-card typography
   * from forcing headings / values into
   * inherited large sizes.
   */

  .ixi-aos-financial-face2-shell
  .financial-face h1,
  .ixi-aos-financial-face2-shell
  .financial-face h2,
  .ixi-aos-financial-face2-shell
  .financial-face h3,
  .ixi-aos-financial-face2-shell
  .financial-face h4,
  .ixi-aos-financial-face2-shell
  .financial-face h5,
  .ixi-aos-financial-face2-shell
  .financial-face h6,
  .ixi-aos-financial-face2-shell
  .financial-face p {
    margin: 0;

    font-size: inherit;
    line-height: inherit;
  }


  /* =====================================================
     SHELL EDGE HIGHLIGHTS
     ===================================================== */

  .ixi-aos-financial-face2-shell {
    isolation: isolate;
  }


  .ixi-aos-financial-face2-shell::before {
    content: "";

    position: absolute;

    inset: 0;

    z-index: 20;

    pointer-events: none;

    border-radius:
      inherit;

    box-shadow:
      inset 0 1px 0
      rgba(
        255,
        255,
        255,
        .045
      ),
      inset 1px 0 0
      rgba(
        255,
        255,
        255,
        .018
      );
  }


  /* =====================================================
     NATIVE FACE SIZE GUARD
     ===================================================== */

  /*
   * Console scaling happens outside this
   * Face. The Face itself should always fill
   * the physical panel handed to it.
   */

  .ixi-aos-financial-face2-shell,
  .ixi-aos-financial-face2-shell
  .financial-face {
    max-width: 100% !important;
    max-height: 100% !important;
  }


  .ixi-aos-financial-face2-shell
  .financial-face {
    flex:
      1 1 auto;
  }


  /* =====================================================
     SMALLER PRESENTATION SAFETY
     ===================================================== */

  /*
   * These do NOT rescale the card.
   * They simply protect labels if the parent
   * scaled shell makes the rendered pixels
   * very small.
   */

  @media
  (max-width: 700px) {

    .ixi-aos-financial-face2-shell
    .financial-header-copy strong {
      font-size: 11px;
    }


    .ixi-aos-financial-face2-shell
    .financial-metric-strong strong {
      font-size: 11px;
    }


    .ixi-aos-financial-face2-shell
    .financial-actions button {
      font-size: 4.2px;
    }

  }


  /* =====================================================
     FINAL AOF2 SAFETY
     ===================================================== */

  .ixi-aos-financial-face2-shell
  button {
    font-synthesis: none;
  }


  .ixi-aos-financial-face2-shell
  strong,
  .ixi-aos-financial-face2-shell
  span,
  .ixi-aos-financial-face2-shell
  em {
    text-transform: none;
  }


  .ixi-aos-financial-face2-shell
  .passport-strip span,
  .ixi-aos-financial-face2-shell
  .financial-header-copy span,
  .ixi-aos-financial-face2-shell
  .financial-metric span,
  .ixi-aos-financial-face2-shell
  .currency-cell span,
  .ixi-aos-financial-face2-shell
  .activity-heading strong,
  .ixi-aos-financial-face2-shell
  .activity-heading span,
  .ixi-aos-financial-face2-shell
  .financial-actions button,
  .ixi-aos-financial-face2-shell
  .workbook-button {
    text-transform: uppercase;
  }


`}</style>

     

    </section>
  );
}
