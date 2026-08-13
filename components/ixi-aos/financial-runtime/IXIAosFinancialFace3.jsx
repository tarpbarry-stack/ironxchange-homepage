/*
 * IXI AOS FINANCIAL FACE 3
 * ========================
 *
 * EXPERIMENTAL / PRODUCTION-CANDIDATE FINANCIAL FACE
 *
 * SKIN:
 * IXIFF-003 — ENGRAVED MONEY / CERTIFICATE
 *
 * NATIVE GEOMETRY:
 * 298 × 471
 *
 * IMPORTANT:
 * - This Face owns presentation only.
 * - Financial truth still comes from the Financial Engine / Object data.
 * - No image asset is required for the skin.
 * - All ornament, keylines, paper, engraving, medallions and shell depth
 *   are CSS so the Face stays lightweight.
 * - Existing Financial Face callbacks are preserved.
 */


const FACE_WIDTH = 298;
const FACE_HEIGHT = 471;

const SKIN_ID = "IXIFF-003";


/* =========================================================
   HELPERS
   ========================================================= */

function clean(value) {
  return String(
    value ??
    ""
  ).trim();
}


function safeObject(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  )
    ? value
    : {};
}


function safeArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}


function firstDefined(...values) {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return null;
}


function numberOrZero(value) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}


function formatMoney(
  value,
  currency = "USD"
) {
  const amount =
    numberOrZero(value);

  try {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency:
          clean(currency)
            .toUpperCase() ||
          "USD",
        maximumFractionDigits: 0
      }
    ).format(amount);
  } catch {
    return `$${Math.round(
      amount
    ).toLocaleString()}`;
  }
}


function formatNumber(value) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return Math.round(number)
    .toLocaleString("en-US");
}


function formatDate(value) {
  const raw =
    clean(value);

  if (!raw) {
    return "—";
  }

  const date =
    new Date(raw);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return raw;
  }

  try {
    return new Intl.DateTimeFormat(
      "en-US",
      {
        month: "short",
        day: "2-digit",
        year: "numeric"
      }
    )
      .format(date)
      .toUpperCase();
  } catch {
    return raw;
  }
}


function monthsBetween(
  startValue,
  endValue = new Date()
) {
  const start =
    new Date(startValue);

  const end =
    endValue instanceof Date
      ? endValue
      : new Date(endValue);

  if (
    Number.isNaN(
      start.getTime()
    ) ||
    Number.isNaN(
      end.getTime()
    ) ||
    end <= start
  ) {
    return 0;
  }

  return Math.max(
    1,
    (
      (
        end.getFullYear() -
        start.getFullYear()
      ) * 12
    ) +
    (
      end.getMonth() -
      start.getMonth()
    )
  );
}


function getObjectLabel(object) {
  const source =
    safeObject(object);

  const explicit =
    clean(
      firstDefined(
        source.displayName,
        source.name,
        source.title,
        source.label
      )
    );

  if (explicit) {
    return explicit;
  }

  const parts = [
    clean(source.year),
    clean(
      firstDefined(
        source.make,
        source.manufacturer
      )
    ),
    clean(source.model)
  ].filter(Boolean);

  return (
    parts.join(" ") ||
    "OBJECT"
  );
}


function getPassportId(
  object,
  passportId
) {
  const source =
    safeObject(object);

  return clean(
    firstDefined(
      passportId,
      source.passportId,
      source.ixiPassportId,
      source.passport?.passportId,
      source.passport?.id
    )
  );
}


function getObjectId(object) {
  const source =
    safeObject(object);

  return clean(
    firstDefined(
      source.objectId,
      source.id,
      source.assetId,
      source.unitId,
      source.stockNumber
    )
  );
}


function getVin(object) {
  const source =
    safeObject(object);

  return clean(
    firstDefined(
      source.vin,
      source.serialNumber,
      source.serial,
      source.sn
    )
  );
}


function getCurrentMiles(object) {
  const source =
    safeObject(object);

  return numberOrZero(
    firstDefined(
      source.miles,
      source.mileage,
      source.odometer,
      source.currentMiles,
      source.meter?.miles
    )
  );
}


function normalizeRecentActivity(
  recentActivity
) {
  return safeArray(
    recentActivity
  )
    .slice(0, 3)
    .map(
      (
        item,
        index
      ) => {
        const source =
          safeObject(item);

        return {
          id:
            clean(
              firstDefined(
                source.id,
                source.financialDocumentId,
                source.financialLineId,
                `activity-${index + 1}`
              )
            ),

          date:
            firstDefined(
              source.date,
              source.occurredAt,
              source.transactionDate
            ),

          type:
            clean(
              firstDefined(
                source.type,
                source.documentType,
                source.category,
                "ACTIVITY"
              )
            ),

          label:
            clean(
              firstDefined(
                source.label,
                source.title,
                source.description,
                source.documentType,
                "FINANCIAL ACTIVITY"
              )
            ),

          amount:
            numberOrZero(
              source.amount
            ),

          status:
            clean(
              firstDefined(
                source.status,
                source.paymentStatus,
                ""
              )
            )
        };
      }
    );
}


/* =========================================================
   SMALL PRESENTATION PARTS
   ========================================================= */

function LedgerRow({
  label,
  value,
  strong = false,
  negative = false,
  positive = false
}) {
  return (
    <div
      className={[
        "ff3-ledger-row",
        strong
          ? "strong"
          : "",
        negative
          ? "negative"
          : "",
        positive
          ? "positive"
          : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span>
        {label}
      </span>

      <i />

      <strong>
        {value || "—"}
      </strong>
    </div>
  );
}


function Seal({
  children,
  small = false
}) {
  return (
    <div
      className={[
        "ff3-seal",
        small
          ? "small"
          : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="ff3-seal-inner">
        {children}
      </div>
    </div>
  );
}


/* =========================================================
   COMPONENT
   ========================================================= */

export default function IXIAosFinancialFace3({
  object = {},

  passportId = "",

  currency = "USD",

  financialSnapshot = {},

  lifecycleSnapshot = {},

  recentActivity = [],

  periodLabel = "LIFE",

  onOpenWorkbook = null,

  onCreateExpense = null,

  onCreatePurchaseOrder = null,

  onCreateWorkOrder = null,

  onCreateTimeEntry = null,

  onMoreActions = null,

  compactActions = false,

  className = ""
}) {

  const source =
    safeObject(object);

  const lifecycle =
    safeObject(
      lifecycleSnapshot
    );

  const financial =
    safeObject(
      financialSnapshot
    );

  const resolvedCurrency =
    clean(currency)
      .toUpperCase() ||
    "USD";

  const objectLabel =
    getObjectLabel(
      source
    );

  const resolvedPassportId =
    getPassportId(
      source,
      passportId
    );

  const resolvedObjectId =
    getObjectId(
      source
    );

  const vin =
    getVin(
      source
    );

  const currentMiles =
    getCurrentMiles(
      source
    );

  const purchaseDate =
    firstDefined(
      lifecycle.purchaseDate,
      lifecycle.acquisitionDate,
      lifecycle.dateAcquired,
      source.purchaseDate,
      source.acquisitionDate,
      source.dateInService
    );

  const purchasePrice =
    numberOrZero(
      firstDefined(
        lifecycle.purchasePrice,
        lifecycle.acquisitionCost,
        lifecycle.purchaseCost,
        source.purchasePrice,
        source.acquisitionCost,
        financial.purchasePrice
      )
    );

  const milesAtPurchase =
    numberOrZero(
      firstDefined(
        lifecycle.milesAtPurchase,
        lifecycle.purchaseMiles,
        lifecycle.acquisitionMiles,
        source.milesAtPurchase,
        source.purchaseMiles
      )
    );

  const milesOwned =
    Math.max(
      0,
      currentMiles -
      milesAtPurchase
    );

  const ownershipType =
    clean(
      firstDefined(
        lifecycle.ownershipType,
        lifecycle.financeType,
        source.ownershipType,
        source.financeType,
        "PAID"
      )
    )
      .toUpperCase();

  const loanBalance =
    numberOrZero(
      firstDefined(
        lifecycle.loanBalance,
        lifecycle.currentBalance,
        lifecycle.amountOwed,
        lifecycle.payoffAmount
      )
    );

  const payment =
    numberOrZero(
      firstDefined(
        lifecycle.payment,
        lifecycle.monthlyPayment,
        lifecycle.loanPayment,
        lifecycle.leasePayment
      )
    );

  const interestRate =
    firstDefined(
      lifecycle.interestRate,
      lifecycle.apr
    );

  const maturityDate =
    firstDefined(
      lifecycle.maturityDate,
      lifecycle.loanMaturityDate,
      lifecycle.leaseEndDate
    );

  const expenses =
    safeObject(
      firstDefined(
        lifecycle.expenses,
        financial.expenses,
        {}
      )
    );

  const fuel =
    numberOrZero(
      firstDefined(
        expenses.fuel,
        lifecycle.fuelCost
      )
    );

  const oilLube =
    numberOrZero(
      firstDefined(
        expenses.oilLube,
        expenses.oil,
        lifecycle.oilLubeCost
      )
    );

  const tires =
    numberOrZero(
      firstDefined(
        expenses.tires,
        lifecycle.tireCost
      )
    );

  const parts =
    numberOrZero(
      firstDefined(
        expenses.parts,
        lifecycle.partsCost
      )
    );

  const registration =
    numberOrZero(
      firstDefined(
        expenses.registration,
        expenses.licensing,
        lifecycle.registrationCost,
        lifecycle.licensingCost
      )
    );

  const otherExpenses =
    numberOrZero(
      firstDefined(
        expenses.other,
        lifecycle.otherExpenseCost
      )
    );

  const explicitTotalExpenses =
    firstDefined(
      lifecycle.totalExpenses,
      financial.totalExpenses,
      expenses.total
    );

  const totalExpenses =
    explicitTotalExpenses !== null
      ? numberOrZero(
          explicitTotalExpenses
        )
      : (
          fuel +
          oilLube +
          tires +
          parts +
          registration +
          otherExpenses
        );

  const workOrders =
    safeObject(
      firstDefined(
        lifecycle.workOrders,
        financial.workOrders,
        {}
      )
    );

  const workOrderCount =
    numberOrZero(
      firstDefined(
        workOrders.count,
        lifecycle.workOrderCount
      )
    );

  const workOrderCost =
    numberOrZero(
      firstDefined(
        workOrders.totalCost,
        lifecycle.workOrderCost,
        lifecycle.repairCost,
        expenses.repairs
      )
    );

  const lastWorkOrder =
    safeObject(
      firstDefined(
        workOrders.last,
        lifecycle.lastWorkOrder,
        {}
      )
    );

  const insurance =
    safeObject(
      firstDefined(
        lifecycle.insurance,
        source.insurance,
        {}
      )
    );

  const insuranceProvider =
    clean(
      firstDefined(
        insurance.provider,
        insurance.carrier,
        lifecycle.insuranceCarrier
      )
    );

  const insuranceRenewal =
    firstDefined(
      insurance.renewalDate,
      insurance.expirationDate,
      lifecycle.insuranceRenewalDate
    );

  const insuranceCost =
    numberOrZero(
      firstDefined(
        insurance.annualPremium,
        insurance.cost,
        lifecycle.insuranceCost
      )
    );

  const totalCost =
    numberOrZero(
      firstDefined(
        lifecycle.totalCost,
        lifecycle.totalInvested,
        financial.totalCost,
        (
          purchasePrice +
          totalExpenses +
          workOrderCost +
          insuranceCost
        )
      )
    );

  const currentValue =
    numberOrZero(
      firstDefined(
        lifecycle.currentValue,
        lifecycle.estimatedValue,
        financial.currentValue,
        source.currentValue,
        source.estimatedValue,
        source.value
      )
    );

  const position =
    currentValue -
    totalCost;

  const ownedMonths =
    monthsBetween(
      purchaseDate
    );

  const costPerMile =
    milesOwned > 0
      ? totalCost /
        milesOwned
      : 0;

  const costPerMonth =
    ownedMonths > 0
      ? totalCost /
        ownedMonths
      : 0;

  const costPerYear =
    ownedMonths > 0
      ? (
          totalCost /
          ownedMonths
        ) * 12
      : 0;

  const activity =
    normalizeRecentActivity(
      recentActivity
    );

  const isPaidAsset =
    ownershipType === "PAID" ||
    ownershipType === "OWNED" ||
    (
      !loanBalance &&
      ownershipType !== "LEASE"
    );

  const ownershipLabel =
    isPaidAsset
      ? "PAID ASSET"
      : ownershipType === "LEASE"
        ? "LEASE"
        : "LOAN";


  return (
    <section
      className={[
        "ixi-aos-financial-face3-shell",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      data-ixi-face-skin={
        SKIN_ID
      }
    >

      <div className="ff3-frame">

        <div className="ff3-frame-line ff3-frame-line-1" />
        <div className="ff3-frame-line ff3-frame-line-2" />


        {/* ===================================================
            TOP CARTOUCHE
            =================================================== */}

        <div className="ff3-cartouche">
          <span>
            IXI AOS
          </span>
        </div>


        {/* ===================================================
            DOCUMENT HEADER
            =================================================== */}

        <header className="ff3-document-head">

          <div className="ff3-head-kicker">
            <span>
              FACE 3
            </span>

            <strong>
              FINANCIAL
            </strong>
          </div>


          <div className="ff3-identity-line">

            <div className="ff3-machine-medallion">
              <span>
                IXI
              </span>
            </div>


            <div className="ff3-object-copy">

              <strong>
                {objectLabel}
              </strong>

              <span>
                {
                  clean(
                    source.trim ||
                    source.variant ||
                    source.bodyStyle ||
                    source.category ||
                    "ASSET"
                  )
                }
              </span>

            </div>


            <Seal>
              <span>AOS</span>
            </Seal>

          </div>


          <div className="ff3-id-line">

            <span>
              {
                resolvedObjectId
                  ? `OBJECT ID: ${resolvedObjectId}`
                  : "OBJECT ID: —"
              }
            </span>

            <b>
              •
            </b>

            <span>
              {
                clean(
                  source.status ||
                  "ACTIVE"
                ).toUpperCase()
              }
            </span>

          </div>

        </header>


        {/* ===================================================
            PRIMARY BAND
            =================================================== */}

        <div className="ff3-primary-band">

          <div className="ff3-primary-stat">
            <span>
              PURCHASE DATE
            </span>

            <strong>
              {formatDate(
                purchaseDate
              )}
            </strong>
          </div>


          <div className="ff3-primary-stat">
            <span>
              PURCHASE PRICE
            </span>

            <strong>
              {formatMoney(
                purchasePrice,
                resolvedCurrency
              )}
            </strong>
          </div>


          <div className="ff3-primary-stat">
            <span>
              OWNERSHIP
            </span>

            <strong>
              {ownershipLabel}
            </strong>
          </div>

        </div>


        {/* ===================================================
            IDENTITY LEDGER
            =================================================== */}

        <div className="ff3-paper-block ff3-identity-grid">

          <div>
            <span>
              IXI PASSPORT
            </span>

            <strong>
              {resolvedPassportId || "UNASSIGNED"}
            </strong>
          </div>


          <div>
            <span>
              MILES
            </span>

            <strong>
              {
                currentMiles
                  ? `${formatNumber(
                      currentMiles
                    )} MI`
                  : "—"
              }
            </strong>
          </div>


          <div>
            <span>
              VIN
            </span>

            <strong>
              {vin || "—"}
            </strong>
          </div>


          <div>
            <span>
              ID NUMBER
            </span>

            <strong>
              {resolvedObjectId || "—"}
            </strong>
          </div>

        </div>


        {/* ===================================================
            BODY COLUMNS
            =================================================== */}

        <div className="ff3-body-columns">

          {/* LEFT */}

          <div className="ff3-body-column">

            <section className="ff3-paper-block ff3-section">

              <h3>
                ACQUISITION
              </h3>

              <LedgerRow
                label="PURCHASE DATE"
                value={
                  formatDate(
                    purchaseDate
                  )
                }
              />

              <LedgerRow
                label="PURCHASE PRICE"
                value={
                  formatMoney(
                    purchasePrice,
                    resolvedCurrency
                  )
                }
              />

              <LedgerRow
                label="MILES AT PURCHASE"
                value={
                  milesAtPurchase
                    ? `${formatNumber(
                        milesAtPurchase
                      )} MI`
                    : "—"
                }
              />

            </section>


            <section className="ff3-paper-block ff3-section">

              <h3>
                OWNERSHIP
              </h3>

              <div className="ff3-ownership-banner">
                {ownershipLabel}
              </div>

              {!isPaidAsset ? (
                <>
                  <LedgerRow
                    label="PAYMENT"
                    value={
                      payment
                        ? formatMoney(
                            payment,
                            resolvedCurrency
                          )
                        : "—"
                    }
                  />

                  <LedgerRow
                    label={
                      ownershipType === "LEASE"
                        ? "LEASE BALANCE"
                        : "CURRENT BALANCE"
                    }
                    value={
                      loanBalance
                        ? formatMoney(
                            loanBalance,
                            resolvedCurrency
                          )
                        : "—"
                    }
                  />

                  <LedgerRow
                    label="INTEREST RATE"
                    value={
                      interestRate !== null
                        ? `${interestRate}%`
                        : "—"
                    }
                  />

                  <LedgerRow
                    label={
                      ownershipType === "LEASE"
                        ? "TERM END"
                        : "MATURITY"
                    }
                    value={
                      formatDate(
                        maturityDate
                      )
                    }
                  />
                </>
              ) : (
                <div className="ff3-paid-note">
                  NO CURRENT LOAN OR LEASE BALANCE
                </div>
              )}

            </section>


            <section className="ff3-paper-block ff3-section ff3-cost-block">

              <h3>
                COST
              </h3>

              <LedgerRow
                label="PURCHASE"
                value={
                  formatMoney(
                    purchasePrice,
                    resolvedCurrency
                  )
                }
              />

              <LedgerRow
                label="EXPENSES"
                value={
                  formatMoney(
                    totalExpenses,
                    resolvedCurrency
                  )
                }
              />

              <LedgerRow
                label="WORK ORDERS"
                value={
                  formatMoney(
                    workOrderCost,
                    resolvedCurrency
                  )
                }
              />

              <LedgerRow
                label="INSURANCE"
                value={
                  formatMoney(
                    insuranceCost,
                    resolvedCurrency
                  )
                }
              />

              <LedgerRow
                label="TOTAL COST"
                value={
                  formatMoney(
                    totalCost,
                    resolvedCurrency
                  )
                }
                strong
              />

            </section>

          </div>


          {/* RIGHT */}

          <div className="ff3-body-column">

            <section className="ff3-paper-block ff3-section">

              <h3>
                EXPENSES
              </h3>

              <LedgerRow
                label="FUEL"
                value={
                  formatMoney(
                    fuel,
                    resolvedCurrency
                  )
                }
              />

              <LedgerRow
                label="OIL / LUBE"
                value={
                  formatMoney(
                    oilLube,
                    resolvedCurrency
                  )
                }
              />

              <LedgerRow
                label="TIRES"
                value={
                  formatMoney(
                    tires,
                    resolvedCurrency
                  )
                }
              />

              <LedgerRow
                label="PARTS"
                value={
                  formatMoney(
                    parts,
                    resolvedCurrency
                  )
                }
              />

              <LedgerRow
                label="REG / LICENSE"
                value={
                  formatMoney(
                    registration,
                    resolvedCurrency
                  )
                }
              />

              <LedgerRow
                label="OTHER"
                value={
                  formatMoney(
                    otherExpenses,
                    resolvedCurrency
                  )
                }
              />

              <LedgerRow
                label="TOTAL EXPENSES"
                value={
                  formatMoney(
                    totalExpenses,
                    resolvedCurrency
                  )
                }
                strong
              />

            </section>


            <section className="ff3-paper-block ff3-section">

              <h3>
                INSURANCE
              </h3>

              <LedgerRow
                label="CARRIER"
                value={
                  insuranceProvider ||
                  "—"
                }
              />

              <LedgerRow
                label="RENEWAL"
                value={
                  formatDate(
                    insuranceRenewal
                  )
                }
              />

              <LedgerRow
                label="ANNUAL COST"
                value={
                  formatMoney(
                    insuranceCost,
                    resolvedCurrency
                  )
                }
              />

            </section>


            <section className="ff3-paper-block ff3-section">

              <h3>
                WORK ORDERS
              </h3>

              <LedgerRow
                label="TOTAL"
                value={
                  formatNumber(
                    workOrderCount
                  )
                }
              />

              <LedgerRow
                label="COST"
                value={
                  formatMoney(
                    workOrderCost,
                    resolvedCurrency
                  )
                }
              />

              <LedgerRow
                label="LAST"
                value={
                  clean(
                    firstDefined(
                      lastWorkOrder.label,
                      lastWorkOrder.title,
                      lastWorkOrder.description
                    )
                  ) ||
                  "—"
                }
              />

            </section>

          </div>

        </div>


        {/* ===================================================
            ASSET POSITION
            =================================================== */}

        <div className="ff3-position-row">

          <div className="ff3-paper-block ff3-position-card">

            <span>
              TOTAL COST
            </span>

            <strong>
              {formatMoney(
                totalCost,
                resolvedCurrency
              )}
            </strong>

          </div>


          <div className="ff3-paper-block ff3-position-card">

            <span>
              CURRENT VALUE
            </span>

            <strong>
              {formatMoney(
                currentValue,
                resolvedCurrency
              )}
            </strong>

          </div>


          <div
            className={[
              "ff3-paper-block",
              "ff3-position-card",
              "ff3-position-result",
              position < 0
                ? "negative"
                : "positive"
            ].join(" ")}
          >

            <span>
              POSITION
            </span>

            <strong>
              {formatMoney(
                position,
                resolvedCurrency
              )}
            </strong>

          </div>

        </div>


        {/* ===================================================
            OWNERSHIP METRICS
            =================================================== */}

        <div className="ff3-metrics-strip">

          <div>
            <span>
              MILES OWNED
            </span>

            <strong>
              {
                milesOwned
                  ? formatNumber(
                      milesOwned
                    )
                  : "—"
              }
            </strong>
          </div>


          <div>
            <span>
              COST / MILE
            </span>

            <strong>
              {
                milesOwned
                  ? formatMoney(
                      costPerMile,
                      resolvedCurrency
                    )
                  : "—"
              }
            </strong>
          </div>


          <div>
            <span>
              COST / YEAR
            </span>

            <strong>
              {
                ownedMonths
                  ? formatMoney(
                      costPerYear,
                      resolvedCurrency
                    )
                  : "—"
              }
            </strong>
          </div>


          <div>
            <span>
              COST / MONTH
            </span>

            <strong>
              {
                ownedMonths
                  ? formatMoney(
                      costPerMonth,
                      resolvedCurrency
                    )
                  : "—"
              }
            </strong>
          </div>

        </div>


        {/* ===================================================
            RECENT ACTIVITY
            =================================================== */}

        <section className="ff3-paper-block ff3-activity">

          <h3>
            RECENT FINANCIAL ACTIVITY
          </h3>

          <div className="ff3-activity-head">
            <span>DATE</span>
            <span>TYPE</span>
            <span>DESCRIPTION</span>
            <span>AMOUNT</span>
          </div>


          <div className="ff3-activity-body">

            {activity.length ? (
              activity.map(
                item => (
                  <div
                    key={
                      item.id
                    }
                    className="ff3-activity-row"
                  >
                    <span>
                      {formatDate(
                        item.date
                      )}
                    </span>

                    <span>
                      {item.type || "—"}
                    </span>

                    <strong>
                      {item.label}
                    </strong>

                    <em>
                      {formatMoney(
                        item.amount,
                        resolvedCurrency
                      )}
                    </em>
                  </div>
                )
              )
            ) : (
              <div className="ff3-empty-activity">
                NO RECENT FINANCIAL ACTIVITY
              </div>
            )}

          </div>

        </section>


        {/* ===================================================
            FOOTER ACTION BAR
            =================================================== */}

        <footer className="ff3-footer">

          <button
            type="button"
            onClick={
              onOpenWorkbook
            }
            disabled={
              typeof onOpenWorkbook !==
              "function"
            }
            className="ff3-workbook"
          >
            <span>
              OPEN FINANCIAL WORKBOOK
            </span>

            <small>
              DETAILED FINANCIALS
            </small>
          </button>


          <Seal small>
            <span>
              IXI
            </span>

            <small>
              FF-003
            </small>
          </Seal>


          <div
            className={[
              "ff3-quick-actions",
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
              EXP
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
              PO
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
              WO
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
              TIME
            </button>

            <button
              type="button"
              onClick={
                onMoreActions
              }
              disabled={
                typeof onMoreActions !==
                "function"
              }
              className="more"
            >
              •••
            </button>
          </div>

        </footer>


        <div className="ff3-bottom-signature">
          <span>
            IRONXCHANGE
          </span>

          <strong>
            {SKIN_ID}
          </strong>

          <span>
            OBJECT OPERATING SYSTEM
          </span>
        </div>

      </div>


      <style jsx global>{`

        /* =====================================================
           PHYSICAL FACE
           ===================================================== */

        .ixi-aos-financial-face3-shell,
        .ixi-aos-financial-face3-shell * {
          box-sizing: border-box;
        }


        .ixi-aos-financial-face3-shell {
          --ff3-green-0: #07120b;
          --ff3-green-1: #0c1b10;
          --ff3-green-2: #13291a;
          --ff3-green-3: #1d3a25;
          --ff3-green-4: #304e37;

          --ff3-ivory-0: #f2eddc;
          --ff3-ivory-1: #e8dfc7;
          --ff3-ivory-2: #d7ccb0;

          --ff3-ink: #152219;
          --ff3-line: rgba(25, 46, 31, .32);
          --ff3-gold: #c9b77a;

          position: relative;

          width: ${FACE_WIDTH}px;
          min-width: ${FACE_WIDTH}px;
          max-width: ${FACE_WIDTH}px;

          height: ${FACE_HEIGHT}px;
          min-height: ${FACE_HEIGHT}px;
          max-height: ${FACE_HEIGHT}px;

          margin: 0;
          padding: 0;

          overflow: hidden;

          border:
            1px solid
            rgba(236, 232, 207, .66);

          border-radius: 13px;

          background:
            linear-gradient(
              90deg,
              rgba(255,255,255,.28),
              rgba(80,75,58,.26) 3px,
              rgba(255,255,255,.12) 5px,
              rgba(28,35,27,.88) 9px,
              rgba(5,13,8,.98) 13px,
              rgba(27,40,30,.96) calc(100% - 13px),
              rgba(232,226,201,.32) calc(100% - 4px),
              rgba(255,255,255,.26)
            );

          box-shadow:
            0 18px 42px
              rgba(0,0,0,.56),
            inset 0 1px 0
              rgba(255,255,255,.36);

          font-family:
            Georgia,
            "Times New Roman",
            serif;

          color:
            var(--ff3-ink);
        }


        .ff3-frame {
          position: absolute;

          inset: 5px;

          display: flex;
          flex-direction: column;

          overflow: hidden;

          border:
            1px solid
            rgba(210, 201, 166, .64);

          border-radius: 9px;

          background:
            var(--ff3-green-0);

          box-shadow:
            inset 0 0 0 2px
              rgba(3, 10, 6, .85),
            inset 0 0 0 3px
              rgba(211, 199, 151, .24);
        }


        .ff3-frame::before {
          content: "";

          position: absolute;
          inset: 3px;

          z-index: 0;

          pointer-events: none;

          border:
            1px solid
            rgba(202, 188, 137, .18);

          border-radius: 6px;
        }


        .ff3-frame::after {
          content: "";

          position: absolute;
          inset: 0;

          z-index: 0;

          pointer-events: none;

          opacity: .20;

          background:
            repeating-linear-gradient(
              24deg,
              transparent 0,
              transparent 3px,
              rgba(235, 228, 198, .14) 3px,
              rgba(235, 228, 198, .14) 4px
            ),
            repeating-linear-gradient(
              156deg,
              transparent 0,
              transparent 7px,
              rgba(200, 188, 143, .10) 7px,
              rgba(200, 188, 143, .10) 8px
            );
        }


        .ff3-frame > * {
          position: relative;
          z-index: 1;
        }


        .ff3-frame-line {
          position: absolute;
          pointer-events: none;
          z-index: 2;
        }


        .ff3-frame-line-1 {
          inset: 8px;

          border:
            1px solid
            rgba(213, 200, 153, .22);

          border-radius: 4px;
        }


        .ff3-frame-line-2 {
          inset: 10px;

          border:
            1px solid
            rgba(0, 0, 0, .38);

          border-radius: 3px;
        }


        /* =====================================================
           CARTOUCHE
           ===================================================== */

        .ff3-cartouche {
          position: absolute;

          top: -1px;
          left: 50%;

          z-index: 20;

          transform:
            translateX(-50%);

          width: 108px;
          height: 27px;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            1px solid
            rgba(220, 209, 167, .62);

          border-radius:
            0 0 12px 12px;

          background:
            linear-gradient(
              180deg,
              #1b3522,
              #0c1c11
            );

          box-shadow:
            0 2px 0
              rgba(0,0,0,.58),
            inset 0 -1px 0
              rgba(255,255,255,.08);
        }


        .ff3-cartouche::before,
        .ff3-cartouche::after {
          content: "";

          position: absolute;

          top: 5px;

          width: 19px;
          height: 14px;

          border-top:
            1px solid
            rgba(213, 201, 155, .42);
        }


        .ff3-cartouche::before {
          left: -17px;

          transform:
            skewX(-25deg);
        }


        .ff3-cartouche::after {
          right: -17px;

          transform:
            skewX(25deg);
        }


        .ff3-cartouche span {
          color:
            #eee8d0;

          font-size:
            11px;

          font-weight:
            900;

          letter-spacing:
            1.45px;

          text-shadow:
            0 1px 0
            #000;
        }


        /* =====================================================
           DOCUMENT HEADER
           ===================================================== */

        .ff3-document-head {
          height: 88px;
          flex: 0 0 88px;

          margin:
            8px 8px 0;

          padding:
            14px 8px 6px;

          overflow: hidden;

          border:
            1px solid
            rgba(58, 68, 44, .56);

          border-radius: 4px 4px 0 0;

          background:
            radial-gradient(
              circle at 50% 70%,
              rgba(117, 101, 61, .07),
              transparent 44%
            ),
            repeating-linear-gradient(
              12deg,
              rgba(53, 55, 39, .035) 0,
              rgba(53, 55, 39, .035) 1px,
              transparent 1px,
              transparent 5px
            ),
            var(--ff3-ivory-0);

          color:
            var(--ff3-ink);

          box-shadow:
            inset 0 0 0 2px
              rgba(95, 84, 48, .08);
        }


        .ff3-head-kicker {
          height: 12px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding:
            0 46px;

          color:
            rgba(26, 38, 28, .78);

          font-size:
            5.5px;

          font-weight:
            900;

          letter-spacing:
            .6px;
        }


        .ff3-head-kicker strong {
          font-weight:
            900;

          letter-spacing:
            .55px;
        }


        .ff3-identity-line {
          height: 48px;

          display: grid;

          grid-template-columns:
            42px
            minmax(0, 1fr)
            42px;

          align-items: center;

          gap: 7px;
        }


        .ff3-machine-medallion {
          width: 39px;
          height: 39px;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            1px solid
            #304332;

          border-radius:
            50%;

          background:
            radial-gradient(
              circle,
              #e5dcc2 0 47%,
              #879078 48% 51%,
              #173021 52% 58%,
              #d7ccb0 59% 63%,
              #173021 64%
            );

          box-shadow:
            inset 0 0 0 2px
              rgba(255,255,255,.18);
        }


        .ff3-machine-medallion span {
          color:
            #163020;

          font-size:
            8px;

          font-weight:
            900;

          letter-spacing:
            .8px;
        }


        .ff3-object-copy {
          min-width: 0;

          display: flex;
          flex-direction: column;

          align-items: center;

          gap: 2px;
        }


        .ff3-object-copy strong {
          width: 100%;

          overflow: hidden;

          color:
            #17261c;

          font-size:
            15px;

          font-weight:
            900;

          line-height:
            1;

          letter-spacing:
            -.25px;

          text-align:
            center;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .ff3-object-copy span {
          width: 100%;

          overflow: hidden;

          color:
            rgba(24, 38, 28, .76);

          font-size:
            5.4px;

          font-weight:
            900;

          letter-spacing:
            .9px;

          text-align:
            center;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;

          text-transform:
            uppercase;
        }


        .ff3-id-line {
          height: 13px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 5px;

          overflow: hidden;

          color:
            rgba(24, 39, 28, .78);

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          font-size:
            4.5px;

          font-weight:
            900;

          letter-spacing:
            .35px;

          white-space:
            nowrap;
        }


        .ff3-id-line b {
          font-size:
            4px;
        }


        /* =====================================================
           SEALS
           ===================================================== */

        .ff3-seal {
          width: 39px;
          height: 39px;

          display: flex;
          align-items: center;
          justify-content: center;

          flex: 0 0 auto;

          border:
            1px solid
            #233b28;

          border-radius:
            50%;

          background:
            conic-gradient(
              from 0deg,
              #1e3d27,
              #d3c79d,
              #142d1c,
              #d3c79d,
              #1e3d27
            );

          box-shadow:
            inset 0 0 0 2px
              #112417,
            inset 0 0 0 3px
              rgba(239,230,194,.55),
            0 1px 2px
              rgba(0,0,0,.45);
        }


        .ff3-seal.small {
          width: 38px;
          height: 38px;
        }


        .ff3-seal-inner {
          width: 30px;
          height: 30px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          border:
            1px solid
            rgba(236, 226, 188, .52);

          border-radius:
            50%;

          background:
            radial-gradient(
              circle,
              #29472e,
              #0c1b10 70%
            );

          color:
            #e7dec2;
        }


        .ff3-seal-inner span {
          font-size:
            10px;

          font-weight:
            900;

          line-height:
            1;
        }


        .ff3-seal-inner small {
          margin-top:
            2px;

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          font-size:
            3.6px;

          font-weight:
            900;

          line-height:
            1;
        }


        /* =====================================================
           PRIMARY GREEN BAND
           ===================================================== */

        .ff3-primary-band {
          height: 46px;
          flex: 0 0 46px;

          margin:
            0 8px;

          display: grid;

          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );

          border-left:
            1px solid
            rgba(220, 208, 164, .20);

          border-right:
            1px solid
            rgba(220, 208, 164, .20);

          border-bottom:
            1px solid
            rgba(220, 208, 164, .34);

          background:
            linear-gradient(
              180deg,
              #183522,
              #0b1d11
            );

          color:
            #ece4ca;
        }


        .ff3-primary-stat {
          position: relative;

          min-width: 0;

          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;

          gap: 4px;

          padding:
            5px 6px;

          border-right:
            1px solid
            rgba(227, 215, 174, .16);
        }


        .ff3-primary-stat:last-child {
          border-right: 0;
        }


        .ff3-primary-stat span {
          color:
            rgba(232, 225, 199, .70);

          font-size:
            4.6px;

          font-weight:
            900;

          letter-spacing:
            .35px;
        }


        .ff3-primary-stat strong {
          width: 100%;

          overflow: hidden;

          color:
            #f4edd7;

          font-size:
            8.3px;

          font-weight:
            900;

          line-height:
            1;

          text-align:
            center;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        /* =====================================================
           PAPER SYSTEM
           ===================================================== */

        .ff3-paper-block {
          border:
            1px solid
            rgba(65, 74, 49, .42);

          background:
            repeating-linear-gradient(
              17deg,
              rgba(74, 68, 47, .024) 0,
              rgba(74, 68, 47, .024) 1px,
              transparent 1px,
              transparent 5px
            ),
            linear-gradient(
              180deg,
              #f4efdf,
              #e8dfc7
            );

          box-shadow:
            inset 0 0 0 1px
              rgba(255,255,255,.36),
            inset 0 0 10px
              rgba(99, 87, 51, .055);
        }


        .ff3-identity-grid {
          height: 47px;
          flex: 0 0 47px;

          margin:
            5px 10px 0;

          display: grid;

          grid-template-columns:
            1fr 1fr;

          grid-template-rows:
            1fr 1fr;

          border-radius:
            4px;

          overflow: hidden;
        }


        .ff3-identity-grid > div {
          min-width: 0;

          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;

          gap: 2px;

          padding:
            3px 6px;

          border-right:
            1px solid
            rgba(53, 66, 46, .18);

          border-bottom:
            1px solid
            rgba(53, 66, 46, .18);
        }


        .ff3-identity-grid > div:nth-child(2n) {
          border-right:
            0;
        }


        .ff3-identity-grid > div:nth-child(3),
        .ff3-identity-grid > div:nth-child(4) {
          border-bottom:
            0;
        }


        .ff3-identity-grid span {
          color:
            rgba(22, 38, 27, .65);

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          font-size:
            4px;

          font-weight:
            900;

          letter-spacing:
            .28px;
        }


        .ff3-identity-grid strong {
          width: 100%;

          overflow: hidden;

          color:
            #18291d;

          font-size:
            6px;

          font-weight:
            900;

          line-height:
            1;

          text-align:
            center;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        /* =====================================================
           BODY
           ===================================================== */

        .ff3-body-columns {
          height: 142px;
          flex: 0 0 142px;

          margin:
            5px 10px 0;

          display: grid;

          grid-template-columns:
            minmax(0, 1fr)
            minmax(0, 1fr);

          gap: 5px;
        }


        .ff3-body-column {
          min-width: 0;
          min-height: 0;

          display: flex;
          flex-direction: column;

          gap: 4px;
        }


        .ff3-section {
          min-width: 0;

          padding:
            5px 6px;

          border-radius:
            4px;

          overflow: hidden;
        }


        .ff3-section h3,
        .ff3-activity h3 {
          margin:
            0 0 4px;

          padding:
            0 0 3px;

          border-bottom:
            1px solid
            rgba(32, 48, 35, .18);

          color:
            #1b2f21;

          font-size:
            5.5px;

          font-weight:
            900;

          line-height:
            1;

          letter-spacing:
            .45px;

          text-align:
            center;
        }


        .ff3-body-column
        .ff3-section:first-child {
          flex:
            0 0 auto;
        }


        .ff3-body-column
        .ff3-section:last-child {
          flex:
            1 1 auto;
        }


        .ff3-ledger-row {
          min-width: 0;

          min-height: 11px;

          display: grid;

          grid-template-columns:
            auto
            minmax(8px, 1fr)
            auto;

          align-items: center;

          gap: 3px;
        }


        .ff3-ledger-row > span {
          min-width: 0;

          overflow: hidden;

          color:
            rgba(24, 38, 28, .80);

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          font-size:
            3.9px;

          font-weight:
            900;

          line-height:
            1;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .ff3-ledger-row > i {
          min-width: 0;

          height: 1px;

          opacity: .42;

          background:
            repeating-linear-gradient(
              90deg,
              #425244 0,
              #425244 1px,
              transparent 1px,
              transparent 3px
            );
        }


        .ff3-ledger-row > strong {
          max-width:
            76px;

          overflow: hidden;

          color:
            #18291d;

          font-size:
            4.4px;

          font-weight:
            900;

          line-height:
            1;

          text-align:
            right;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .ff3-ledger-row.strong {
          min-height:
            14px;

          margin-top:
            2px;

          padding-top:
            2px;

          border-top:
            1px solid
            rgba(27, 45, 32, .25);
        }


        .ff3-ledger-row.strong > span,
        .ff3-ledger-row.strong > strong {
          color:
            #173820;

          font-size:
            4.9px;
        }


        .ff3-ledger-row.negative > strong,
        .ff3-position-card.negative strong {
          color:
            #802b21;
        }


        .ff3-ledger-row.positive > strong,
        .ff3-position-card.positive strong {
          color:
            #174d2c;
        }


        .ff3-ownership-banner {
          height: 17px;

          margin-bottom:
            4px;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            1px solid
            rgba(19, 50, 29, .44);

          border-radius:
            3px;

          background:
            linear-gradient(
              180deg,
              #2a5334,
              #17351f
            );

          color:
            #efe7cd;

          font-size:
            5.4px;

          font-weight:
            900;

          letter-spacing:
            .65px;
        }


        .ff3-paid-note {
          height:
            22px;

          display: flex;
          align-items: center;
          justify-content: center;

          color:
            rgba(25, 41, 30, .56);

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          font-size:
            3.6px;

          font-weight:
            900;

          letter-spacing:
            .25px;

          text-align:
            center;
        }


        /* =====================================================
           POSITION
           ===================================================== */

        .ff3-position-row {
          height: 43px;
          flex: 0 0 43px;

          margin:
            5px 10px 0;

          display: grid;

          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );

          gap: 4px;
        }


        .ff3-position-card {
          min-width: 0;

          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;

          gap: 3px;

          padding:
            4px 5px;

          border-radius:
            4px;
        }


        .ff3-position-card span {
          color:
            rgba(22, 38, 27, .68);

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          font-size:
            4px;

          font-weight:
            900;

          letter-spacing:
            .25px;
        }


        .ff3-position-card strong {
          width: 100%;

          overflow: hidden;

          color:
            #162a1c;

          font-size:
            8px;

          font-weight:
            900;

          line-height:
            1;

          text-align:
            center;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .ff3-position-result {
          border-color:
            rgba(47, 74, 49, .50);
        }


        /* =====================================================
           OWNERSHIP METRICS
           ===================================================== */

        .ff3-metrics-strip {
          height: 29px;
          flex: 0 0 29px;

          margin:
            5px 10px 0;

          display: grid;

          grid-template-columns:
            repeat(
              4,
              minmax(0, 1fr)
            );

          overflow: hidden;

          border:
            1px solid
            rgba(210, 199, 153, .26);

          border-radius:
            4px;

          background:
            linear-gradient(
              180deg,
              #1a3823,
              #0c1e12
            );

          color:
            #ece4ca;
        }


        .ff3-metrics-strip > div {
          min-width: 0;

          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;

          gap: 2px;

          padding:
            3px 3px;

          border-right:
            1px solid
            rgba(226, 215, 174, .14);
        }


        .ff3-metrics-strip > div:last-child {
          border-right: 0;
        }


        .ff3-metrics-strip span {
          width: 100%;

          overflow: hidden;

          color:
            rgba(229, 220, 190, .62);

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          font-size:
            3.4px;

          font-weight:
            900;

          line-height:
            1;

          text-align:
            center;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .ff3-metrics-strip strong {
          width: 100%;

          overflow: hidden;

          color:
            #f2ead2;

          font-size:
            4.8px;

          font-weight:
            900;

          line-height:
            1;

          text-align:
            center;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        /* =====================================================
           ACTIVITY
           ===================================================== */

        .ff3-activity {
          height: 62px;
          flex: 0 0 62px;

          margin:
            5px 10px 0;

          padding:
            4px 5px;

          border-radius:
            4px;

          overflow:
            hidden;
        }


        .ff3-activity h3 {
          margin-bottom:
            3px;

          font-size:
            5px;
        }


        .ff3-activity-head,
        .ff3-activity-row {
          display: grid;

          grid-template-columns:
            48px
            36px
            minmax(0, 1fr)
            48px;

          align-items: center;
        }


        .ff3-activity-head {
          height:
            10px;

          padding:
            0 4px;

          background:
            linear-gradient(
              180deg,
              #27452d,
              #17321f
            );

          color:
            #eee6cb;
        }


        .ff3-activity-head span {
          overflow: hidden;

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          font-size:
            3.2px;

          font-weight:
            900;

          text-align:
            center;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .ff3-activity-body {
          height:
            37px;

          overflow:
            hidden;
        }


        .ff3-activity-row {
          height:
            12px;

          padding:
            0 4px;

          border-bottom:
            1px solid
            rgba(31, 50, 35, .12);

          color:
            #192b1e;
        }


        .ff3-activity-row:last-child {
          border-bottom:
            0;
        }


        .ff3-activity-row span,
        .ff3-activity-row strong,
        .ff3-activity-row em {
          min-width: 0;

          overflow: hidden;

          padding:
            0 2px;

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          font-size:
            3.4px;

          font-style:
            normal;

          line-height:
            1;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .ff3-activity-row span:nth-child(1),
        .ff3-activity-row span:nth-child(2),
        .ff3-activity-row em {
          text-align:
            center;
        }


        .ff3-activity-row strong {
          font-weight:
            900;
        }


        .ff3-activity-row em {
          font-weight:
            900;
        }


        .ff3-empty-activity {
          height:
            37px;

          display: flex;
          align-items: center;
          justify-content: center;

          color:
            rgba(24, 40, 28, .45);

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          font-size:
            3.8px;

          font-weight:
            900;

          letter-spacing:
            .3px;
        }


        /* =====================================================
           FOOTER
           ===================================================== */

        .ff3-footer {
          height: 46px;
          flex: 0 0 46px;

          margin:
            5px 8px 0;

          display: grid;

          grid-template-columns:
            minmax(0, 1fr)
            42px
            107px;

          align-items: center;

          gap: 4px;

          padding:
            4px 5px;

          border:
            1px solid
            rgba(209, 197, 147, .30);

          border-radius:
            4px;

          background:
            linear-gradient(
              180deg,
              #17321f,
              #07150c
            );

          box-shadow:
            inset 0 1px 0
            rgba(255,255,255,.045);
        }


        .ff3-footer button {
          appearance:
            none;

          border:
            1px solid
            rgba(217, 205, 162, .30);

          border-radius:
            4px;

          outline:
            none;

          background:
            linear-gradient(
              180deg,
              #1e3e28,
              #0b1d11
            );

          color:
            #ede4ca;

          cursor:
            pointer;

          font-family:
            Georgia,
            "Times New Roman",
            serif;
        }


        .ff3-footer button:hover:not(:disabled) {
          border-color:
            rgba(238, 226, 179, .64);

          background:
            linear-gradient(
              180deg,
              #2d5235,
              #10281a
            );
        }


        .ff3-footer button:disabled {
          opacity:
            .38;

          cursor:
            default;
        }


        .ff3-workbook {
          height:
            34px;

          display: flex;
          flex-direction: column;

          align-items: center;
          justify-content: center;

          gap:
            3px;
        }


        .ff3-workbook span {
          font-size:
            5.4px;

          font-weight:
            900;

          letter-spacing:
            .25px;
        }


        .ff3-workbook small {
          color:
            rgba(232, 223, 193, .60);

          font-size:
            3.5px;

          font-weight:
            900;

          letter-spacing:
            .35px;
        }


        .ff3-quick-actions {
          height:
            34px;

          display: grid;

          grid-template-columns:
            repeat(
              5,
              minmax(0, 1fr)
            );

          gap:
            2px;
        }


        .ff3-quick-actions button {
          min-width:
            0;

          height:
            34px;

          padding:
            0 2px;

          font-family:
            Arial,
            Helvetica,
            sans-serif;

          font-size:
            3.8px;

          font-weight:
            900;
        }


        .ff3-quick-actions.compact {
          gap:
            1px;
        }


        .ff3-quick-actions .more {
          font-size:
            7px;

          letter-spacing:
            1px;
        }


        .ff3-bottom-signature {
          height: 16px;
          flex: 0 0 16px;

          margin:
            0 8px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding:
            0 8px;

          color:
            rgba(225, 215, 178, .52);

          font-size:
            3.8px;

          font-weight:
            900;

          letter-spacing:
            .65px;
        }


        .ff3-bottom-signature strong {
          color:
            rgba(239, 229, 192, .78);

          font-size:
            3.6px;
        }


        /* =====================================================
           HARD CONTAINMENT
           ===================================================== */

        .ixi-aos-financial-face3-shell
        button,
        .ixi-aos-financial-face3-shell
        input,
        .ixi-aos-financial-face3-shell
        select,
        .ixi-aos-financial-face3-shell
        textarea {
          font-synthesis:
            none;
        }


        .ixi-aos-financial-face3-shell
        strong,
        .ixi-aos-financial-face3-shell
        span,
        .ixi-aos-financial-face3-shell
        small,
        .ixi-aos-financial-face3-shell
        em {
          margin:
            0;

          padding:
            0;
        }


        .ixi-aos-financial-face3-shell {
          isolation:
            isolate;
        }

      `}</style>

    </section>
  );
}
