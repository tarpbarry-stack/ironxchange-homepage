/*
 * IXI AOS — FINANCIAL FACE 3
 * IXIFF-003
 *
 * Native geometry: 298 × 471
 *
 * FIXED:
 * - identity header
 * - purchase / ownership
 * - total cost
 * - current value
 * - current miles
 * - miles owned
 * - cost / mile
 * - cost / year
 * - cost / month
 * - time owned
 * - footer actions
 *
 * SCROLL:
 * - passport / VIN / location
 * - acquisition detail
 * - ownership detail
 * - expenses
 * - work orders
 * - insurance
 * - cost detail
 * - position
 * - recent activity
 *
 * DATA:
 * object.fields.* FIRST
 * Financial Engine / lifecycle data remains authoritative.
 */


const FACE_WIDTH = 298;
const FACE_HEIGHT = 471;

const SKIN_ID = "IXIFF-003";


/* =========================================================
   BASIC HELPERS
   ========================================================= */


function clean(value) {
  return String(
    value ??
    ""
  ).trim();
}


function asObject(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  )
    ? value
    : {};
}


function asArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}


function first(...values) {
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


function money(
  value,
  currency = "USD",
  decimals = 0
) {
  const amount =
    Number(value);

  if (
    !Number.isFinite(amount)
  ) {
    return "—";
  }

  try {
    return new Intl.NumberFormat(
      "en-US",
      {
        style:
          "currency",

        currency:
          clean(currency)
            .toUpperCase() ||
          "USD",

        minimumFractionDigits:
          decimals,

        maximumFractionDigits:
          decimals
      }
    ).format(amount);
  } catch {
    return `$${amount.toLocaleString()}`;
  }
}


function number(value) {
  const amount =
    Number(value);

  if (
    !Number.isFinite(amount)
  ) {
    return "—";
  }

  return Math.round(
    amount
  ).toLocaleString(
    "en-US"
  );
}


function dateLabel(value) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return clean(value);
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month:
        "short",

      day:
        "2-digit",

      year:
        "numeric"
    }
  )
    .format(date)
    .toUpperCase();
}


/* =========================================================
   OBJECT DATA

   THIS IS THE IMPORTANT FIX.

   Object Studio currently stores the proof vehicle values
   inside:

   object.fields.year
   object.fields.make
   object.fields.model
   object.fields.vin
   object.fields.miles
   object.fields.price
   object.fields.location

   So fields[] wins before every legacy fallback.
   ========================================================= */


function field(
  object,
  ...keys
) {

  const source =
    asObject(object);

  const fields =
    asObject(
      source.fields
    );

  const data =
    asObject(
      source.data
    );

  const attributes =
    asObject(
      source.attributes
    );


  for (
    const key
    of keys
  ) {

    const value =
      first(
        fields[key],
        source[key],
        data[key],
        attributes[key]
      );


    if (
      value !== null
    ) {
      return value;
    }
  }


  return null;
}


/* =========================================================
   OWNERSHIP TIME
   ========================================================= */


function ownershipMonths(
  purchaseDate
) {

  if (!purchaseDate) {
    return 0;
  }


  const start =
    new Date(
      purchaseDate
    );


  if (
    Number.isNaN(
      start.getTime()
    )
  ) {
    return 0;
  }


  const today =
    new Date();


  const months =
    (
      (
        today.getFullYear() -
        start.getFullYear()
      ) * 12
    ) +
    (
      today.getMonth() -
      start.getMonth()
    );


  return Math.max(
    1,
    months
  );
}


function ownershipTimeLabel(
  months
) {

  if (!months) {
    return "—";
  }


  const years =
    Math.floor(
      months / 12
    );


  const remainder =
    months % 12;


  if (
    years &&
    remainder
  ) {
    return `${years}Y ${remainder}M`;
  }


  if (years) {
    return `${years}Y`;
  }


  return `${remainder}M`;
}


/* =========================================================
   SMALL UI PARTS
   ========================================================= */


function LedgerRow({
  label,
  value,
  strong = false,
  positive = false,
  negative = false
}) {

  return (
    <div
      className={[
        "ff3-ledger-row",

        strong
          ? "strong"
          : "",

        positive
          ? "positive"
          : "",

        negative
          ? "negative"
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
  top = "IXI",
  bottom = "AOS"
}) {

  return (
    <div className="ff3-seal">

      <div className="ff3-seal-ring">

        <strong>
          {top}
        </strong>

        <span>
          {bottom}
        </span>

      </div>

    </div>
  );
}


/* =========================================================
   FACE
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

  dragHandleProps = null,

  className = ""

}) {


  const financial =
    asObject(
      financialSnapshot
    );


  const lifecycle =
    asObject(
      lifecycleSnapshot
    );


  const expenses =
    asObject(
      first(
        lifecycle.expenses,
        financial.expenses,
        {}
      )
    );


  const workOrders =
    asObject(
      first(
        lifecycle.workOrders,
        financial.workOrders,
        {}
      )
    );


  const insurance =
    asObject(
      first(
        lifecycle.insurance,
        object?.insurance,
        {}
      )
    );


  /* =======================================================
     FACE 1 / OBJECT IDENTITY
     ======================================================= */


  const year =
    clean(
      field(
        object,
        "year"
      )
    );


  const make =
    clean(
      field(
        object,
        "make",
        "manufacturer"
      )
    );


  const model =
    clean(
      field(
        object,
        "model"
      )
    );


  const objectTitle =
    clean(
      first(
        object?.displayName,
        object?.name,
        object?.title,

        [
          year,
          make,
          model
        ]
          .filter(Boolean)
          .join(" ")
      )
    ) ||
    "OBJECT";


  const descriptor =
    clean(
      field(
        object,
        "trim",
        "variant",
        "bodyStyle",
        "category",
        "objectType",
        "type"
      )
    ) ||
    "VEHICLE";


  const vin =
    clean(
      field(
        object,
        "vin",
        "serialNumber",
        "serial",
        "sn"
      )
    );


  const currentMiles =
    Number(
      field(
        object,
        "miles",
        "mileage",
        "odometer",
        "currentMiles"
      )
    ) || 0;


  const face1Price =
    Number(
      field(
        object,
        "price"
      )
    ) || 0;


  const location =
    clean(
      field(
        object,
        "location"
      )
    );


  const objectId =
    clean(
      first(
        object?.objectId,

        field(
          object,
          "objectId",
          "unitId",
          "unitNumber",
          "assetId",
          "stockNumber",
          "idNumber"
        ),

        object?.id
      )
    );


  const resolvedPassportId =
    clean(
      first(
        passportId,
        object?.passportId,
        object?.ixiPassportId,
        object?.passport?.passportId,
        object?.passport?.id
      )
    );


  const status =
    clean(
      field(
        object,
        "status"
      ) ||
      "ACTIVE"
    )
      .toUpperCase();


  /* =======================================================
     ACQUISITION
     ======================================================= */


  const purchaseDate =
    first(
      lifecycle.purchaseDate,
      lifecycle.acquisitionDate,
      lifecycle.dateAcquired,

      field(
        object,
        "purchaseDate",
        "acquisitionDate",
        "dateInService"
      )
    );


  /*
   * Face 1's price is intentionally a final fallback.
   *
   * That means the current Studio proof truck immediately
   * shows its existing $44,500 value instead of $0 while
   * the proper acquisition record is not populated yet.
   */

  const purchasePrice =
    Number(
      first(
        lifecycle.purchasePrice,
        lifecycle.acquisitionCost,
        lifecycle.purchaseCost,

        financial.purchasePrice,

        field(
          object,
          "purchasePrice",
          "acquisitionCost"
        ),

        face1Price
      )
    ) || 0;


  const milesAtPurchase =
    Number(
      first(
        lifecycle.milesAtPurchase,
        lifecycle.purchaseMiles,
        lifecycle.acquisitionMiles,

        field(
          object,
          "milesAtPurchase",
          "purchaseMiles"
        )
      )
    ) || 0;


  const milesOwned =
    (
      currentMiles > 0 &&
      milesAtPurchase > 0
    )
      ? Math.max(
          0,
          currentMiles -
          milesAtPurchase
        )
      : 0;


  /* =======================================================
     OWNERSHIP
     ======================================================= */


  const ownershipType =
    clean(
      first(
        lifecycle.ownershipType,
        lifecycle.financeType,

        field(
          object,
          "ownershipType",
          "financeType"
        ),

        "PAID"
      )
    )
      .toUpperCase();


  const loanBalance =
    Number(
      first(
        lifecycle.loanBalance,
        lifecycle.currentBalance,
        lifecycle.amountOwed,
        lifecycle.payoffAmount
      )
    ) || 0;


  const payment =
    Number(
      first(
        lifecycle.payment,
        lifecycle.monthlyPayment,
        lifecycle.loanPayment,
        lifecycle.leasePayment
      )
    ) || 0;


  const interestRate =
    first(
      lifecycle.interestRate,
      lifecycle.apr
    );


  const maturityDate =
    first(
      lifecycle.maturityDate,
      lifecycle.loanMaturityDate,
      lifecycle.leaseEndDate
    );


  const ownershipLabel =
    (
      ownershipType === "PAID" ||
      ownershipType === "OWNED" ||
      (
        !loanBalance &&
        ownershipType !== "LEASE"
      )
    )
      ? "PAID ASSET"
      : ownershipType === "LEASE"
        ? "LEASE"
        : "LOAN";


  const isPaidAsset =
    ownershipLabel ===
    "PAID ASSET";


  /* =======================================================
     EXPENSES
     ======================================================= */


  const fuel =
    Number(
      first(
        expenses.fuel,
        lifecycle.fuelCost
      )
    ) || 0;


  const oilLube =
    Number(
      first(
        expenses.oilLube,
        expenses.oil,
        lifecycle.oilLubeCost
      )
    ) || 0;


  const tires =
    Number(
      first(
        expenses.tires,
        lifecycle.tireCost
      )
    ) || 0;


  const parts =
    Number(
      first(
        expenses.parts,
        lifecycle.partsCost
      )
    ) || 0;


  const repairs =
    Number(
      first(
        expenses.repairs,
        lifecycle.repairExpense
      )
    ) || 0;


  const registration =
    Number(
      first(
        expenses.registration,
        expenses.licensing,
        lifecycle.registrationCost,
        lifecycle.licensingCost
      )
    ) || 0;


  const otherExpenses =
    Number(
      first(
        expenses.other,
        lifecycle.otherExpenseCost
      )
    ) || 0;


  const calculatedExpenses =
    fuel +
    oilLube +
    tires +
    parts +
    repairs +
    registration +
    otherExpenses;


  const totalExpenses =
    Number(
      first(
        lifecycle.totalExpenses,
        financial.totalExpenses,
        expenses.total,
        calculatedExpenses
      )
    ) || 0;


  /* =======================================================
     WORK ORDERS
     ======================================================= */


  const workOrderCount =
    Number(
      first(
        workOrders.count,
        lifecycle.workOrderCount
      )
    ) || 0;


  const workOrderCost =
    Number(
      first(
        workOrders.totalCost,
        lifecycle.workOrderCost,
        lifecycle.repairCost
      )
    ) || 0;


  const lastWorkOrder =
    asObject(
      first(
        workOrders.last,
        lifecycle.lastWorkOrder,
        {}
      )
    );


  /* =======================================================
     INSURANCE
     ======================================================= */


  const insuranceCarrier =
    clean(
      first(
        insurance.provider,
        insurance.carrier,
        lifecycle.insuranceCarrier
      )
    );


  const insurancePolicy =
    clean(
      first(
        insurance.policyNumber,
        insurance.policy,
        lifecycle.insurancePolicyNumber
      )
    );


  const insuranceRenewal =
    first(
      insurance.renewalDate,
      insurance.expirationDate,
      lifecycle.insuranceRenewalDate
    );


  const insuranceCost =
    Number(
      first(
        insurance.annualPremium,
        insurance.cost,
        lifecycle.insuranceCost
      )
    ) || 0;


  /* =======================================================
     OWNER INTELLIGENCE
     ======================================================= */


  const calculatedTotalCost =
    purchasePrice +
    totalExpenses +
    workOrderCost +
    insuranceCost;


  const totalCost =
    Number(
      first(
        lifecycle.totalCost,
        lifecycle.totalInvested,
        financial.totalCost,
        calculatedTotalCost
      )
    ) || 0;


  /*
   * Current value can come from a proper Financial /
   * lifecycle valuation.
   *
   * Until that exists, the Object's existing value/price
   * can act as the Studio proof fallback.
   */

  const currentValue =
    Number(
      first(
        lifecycle.currentValue,
        lifecycle.estimatedValue,
        financial.currentValue,

        field(
          object,
          "currentValue",
          "estimatedValue",
          "value"
        ),

        face1Price
      )
    ) || 0;


  const position =
    currentValue -
    totalCost;


  const ownedMonths =
    ownershipMonths(
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
      ? costPerMonth * 12
      : 0;


  const activity =
    asArray(
      recentActivity
    ).slice(
      0,
      12
    );

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

      <div className="ff3-metal-shell">

        <div className="ff3-ridge ff3-ridge-a" />
        <div className="ff3-ridge ff3-ridge-b" />
        <div className="ff3-ridge ff3-ridge-c" />


        <div className="ff3-certificate">

          <div className="ff3-guilloche" />


          {/* =================================================
              FIXED DRAG / IDENTITY HEADER
              ================================================= */}

          <div
            className="ff3-drag-zone"
            {...(
              dragHandleProps ||
              {}
            )}
          >

            <div className="ff3-cartouche">
              IXI AOS
            </div>


            <header className="ff3-document-head">

              <div className="ff3-kicker">

                <span>
                  FACE 3
                </span>

                <strong>
                  FINANCIAL
                </strong>

              </div>


              <div className="ff3-title-row">

                <Seal
                  top="IXI"
                  bottom="AOS"
                />


                <div className="ff3-object-copy">

                  <strong>
                    {objectTitle}
                  </strong>

                  <span>
                    {descriptor}
                  </span>

                </div>


                <Seal
                  top="AOS"
                  bottom="IXI"
                />

              </div>


              <div className="ff3-id-line">

                <span>
                  {
                    objectId
                      ? `OBJECT ID: ${objectId}`
                      : "OBJECT ID: —"
                  }
                </span>


                <b>
                  •
                </b>


                <span>
                  STATUS: {status}
                </span>

              </div>

            </header>


            {/* ===============================================
                FIXED ACQUISITION BAND
                =============================================== */}

            <div className="ff3-primary-band">

              <div>

                <span>
                  PURCHASE DATE
                </span>

                <strong>
                  {dateLabel(
                    purchaseDate
                  )}
                </strong>

              </div>


              <div>

                <span>
                  PURCHASE PRICE
                </span>

                <strong>
                  {money(
                    purchasePrice,
                    currency
                  )}
                </strong>

              </div>


              <div>

                <span>
                  OWNERSHIP
                </span>

                <strong>
                  {ownershipLabel}
                </strong>

              </div>

            </div>

          </div>


          {/* =================================================
              FIXED OWNER INTELLIGENCE

              THIS IS THE STUFF WE ALWAYS WANT TO SEE.
              ================================================= */}

          <section className="ff3-hero-intelligence">

            {/* TOTAL COST / CURRENT VALUE */}

            <div className="ff3-hero-row ff3-hero-money">

              <div className="ff3-hero-cell">

                <span>
                  TOTAL COST
                </span>

                <strong>
                  {money(
                    totalCost,
                    currency
                  )}
                </strong>

              </div>


              <div className="ff3-hero-cell">

                <span>
                  CURRENT VALUE
                </span>

                <strong>
                  {money(
                    currentValue,
                    currency
                  )}
                </strong>

              </div>

            </div>


            {/* CURRENT MILES / MILES OWNED / COST PER MILE / TIME */}

            <div className="ff3-hero-row ff3-hero-usage">

              <div className="ff3-hero-cell">

                <span>
                  CURRENT MILES
                </span>

                <strong>
                  {
                    currentMiles
                      ? number(
                          currentMiles
                        )
                      : "—"
                  }
                </strong>

              </div>


              <div className="ff3-hero-cell">

                <span>
                  MILES OWNED
                </span>

                <strong>
                  {
                    milesOwned
                      ? number(
                          milesOwned
                        )
                      : "—"
                  }
                </strong>

              </div>


              <div className="ff3-hero-cell">

                <span>
                  COST / MILE
                </span>

                <strong>
                  {
                    milesOwned
                      ? money(
                          costPerMile,
                          currency,
                          2
                        )
                      : "—"
                  }
                </strong>

              </div>


              <div className="ff3-hero-cell">

                <span>
                  TIME OWNED
                </span>

                <strong>
                  {ownershipTimeLabel(
                    ownedMonths
                  )}
                </strong>

              </div>

            </div>


            {/* COST PER YEAR / MONTH */}

            <div className="ff3-hero-row ff3-hero-time">

              <div className="ff3-hero-cell">

                <span>
                  COST / YEAR
                </span>

                <strong>
                  {
                    ownedMonths
                      ? money(
                          costPerYear,
                          currency
                        )
                      : "—"
                  }
                </strong>

              </div>


              <div className="ff3-hero-cell">

                <span>
                  COST / MONTH
                </span>

                <strong>
                  {
                    ownedMonths
                      ? money(
                          costPerMonth,
                          currency
                        )
                      : "—"
                  }
                </strong>

              </div>

            </div>

          </section>


          {/* =================================================
              SCROLL START

              POINTER DOWN STOPS HERE SO THIS AREA SCROLLS
              AND DOES NOT START DRAGGING THE CARD.
              ================================================= */}

          <div
            className="ff3-scroll-body"
            tabIndex={0}
            aria-label="Financial detail"
            onPointerDown={
              event =>
                event.stopPropagation()
            }
          >

            {/* ===============================================
                IDENTITY DETAIL
                =============================================== */}

            <section className="ff3-paper-card ff3-identity-grid">

              <div>

                <span>
                  IXI PASSPORT
                </span>

                <strong>
                  {
                    resolvedPassportId ||
                    "UNASSIGNED"
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
                  {objectId || "—"}
                </strong>

              </div>


              <div>

                <span>
                  LOCATION
                </span>

                <strong>
                  {location || "—"}
                </strong>

              </div>

            </section>


            {/* ===============================================
                ACQUISITION DETAIL
                =============================================== */}

            <section className="ff3-paper-card ff3-section">

              <div className="ff3-section-title">
                ACQUISITION
              </div>


              <LedgerRow
                label="PURCHASE DATE"
                value={
                  dateLabel(
                    purchaseDate
                  )
                }
              />


              <LedgerRow
                label="PURCHASE PRICE"
                value={
                  money(
                    purchasePrice,
                    currency
                  )
                }
              />


              <LedgerRow
                label="MILES AT PURCHASE"
                value={
                  milesAtPurchase
                    ? `${number(
                        milesAtPurchase
                      )} MI`
                    : "—"
                }
              />


              <LedgerRow
                label="CURRENT MILES"
                value={
                  currentMiles
                    ? `${number(
                        currentMiles
                      )} MI`
                    : "—"
                }
              />


              <LedgerRow
                label="MILES OWNED"
                value={
                  milesOwned
                    ? `${number(
                        milesOwned
                      )} MI`
                    : "—"
                }
              />

            </section>


            {/* ===============================================
                OWNERSHIP DETAIL
                =============================================== */}

            <section className="ff3-paper-card ff3-section">

              <div className="ff3-section-title">
                OWNERSHIP
              </div>


              <div className="ff3-ownership-banner">
                {ownershipLabel}
              </div>


              {!isPaidAsset ? (
                <>

                  <LedgerRow
                    label="PAYMENT"
                    value={
                      payment
                        ? money(
                            payment,
                            currency
                          )
                        : "—"
                    }
                  />


                  <LedgerRow
                    label={
                      ownershipType ===
                      "LEASE"
                        ? "LEASE BALANCE"
                        : "CURRENT BALANCE"
                    }
                    value={
                      loanBalance
                        ? money(
                            loanBalance,
                            currency
                          )
                        : "—"
                    }
                  />


                  <LedgerRow
                    label="INTEREST RATE"
                    value={
                      interestRate !== null &&
                      interestRate !== undefined
                        ? `${interestRate}%`
                        : "—"
                    }
                  />


                  <LedgerRow
                    label={
                      ownershipType ===
                      "LEASE"
                        ? "TERM END"
                        : "MATURITY DATE"
                    }
                    value={
                      dateLabel(
                        maturityDate
                      )
                    }
                  />

                </>
              ) : (

                <div className="ff3-paid-copy">
                  NO CURRENT LOAN OR LEASE BALANCE
                </div>

              )}

            </section>


            {/* ===============================================
                EXPENSE DETAIL
                =============================================== */}

            <section className="ff3-paper-card ff3-section">

              <div className="ff3-section-title">
                EXPENSES SINCE PURCHASE
              </div>


              <LedgerRow
                label="FUEL"
                value={
                  money(
                    fuel,
                    currency
                  )
                }
              />


              <LedgerRow
                label="OIL / LUBE"
                value={
                  money(
                    oilLube,
                    currency
                  )
                }
              />


              <LedgerRow
                label="TIRES"
                value={
                  money(
                    tires,
                    currency
                  )
                }
              />


              <LedgerRow
                label="PARTS"
                value={
                  money(
                    parts,
                    currency
                  )
                }
              />


              <LedgerRow
                label="REPAIRS"
                value={
                  money(
                    repairs,
                    currency
                  )
                }
              />


              <LedgerRow
                label="REGISTRATION / LICENSING"
                value={
                  money(
                    registration,
                    currency
                  )
                }
              />


              <LedgerRow
                label="OTHER"
                value={
                  money(
                    otherExpenses,
                    currency
                  )
                }
              />


              <LedgerRow
                label="TOTAL EXPENSES"
                value={
                  money(
                    totalExpenses,
                    currency
                  )
                }
                strong
              />

            </section>

                         {/* ===============================================
                WORK ORDER DETAIL
                =============================================== */}

            <section className="ff3-paper-card ff3-section">

              <div className="ff3-section-title">
                WORK ORDER HISTORY
              </div>


              <LedgerRow
                label="TOTAL WORK ORDERS"
                value={
                  number(
                    workOrderCount
                  )
                }
              />


              <LedgerRow
                label="TOTAL WORK ORDER COST"
                value={
                  money(
                    workOrderCost,
                    currency
                  )
                }
              />


              <LedgerRow
                label="LAST WORK ORDER"
                value={
                  clean(
                    first(
                      lastWorkOrder.label,
                      lastWorkOrder.title,
                      lastWorkOrder.description
                    )
                  ) ||
                  "—"
                }
              />


              <LedgerRow
                label="LAST WORK ORDER DATE"
                value={
                  dateLabel(
                    first(
                      lastWorkOrder.date,
                      lastWorkOrder.occurredAt,
                      lastWorkOrder.completedAt
                    )
                  )
                }
              />

            </section>


            {/* ===============================================
                INSURANCE DETAIL
                =============================================== */}

            <section className="ff3-paper-card ff3-section">

              <div className="ff3-section-title">
                INSURANCE
              </div>


              <LedgerRow
                label="CARRIER"
                value={
                  insuranceCarrier ||
                  "—"
                }
              />


              <LedgerRow
                label="POLICY #"
                value={
                  insurancePolicy ||
                  "—"
                }
              />


              <LedgerRow
                label="RENEWAL DATE"
                value={
                  dateLabel(
                    insuranceRenewal
                  )
                }
              />


              <LedgerRow
                label="ANNUAL COST"
                value={
                  money(
                    insuranceCost,
                    currency
                  )
                }
              />

            </section>


            {/* ===============================================
                COST DETAIL
                =============================================== */}

            <section className="ff3-paper-card ff3-section">

              <div className="ff3-section-title">
                COST DETAIL
              </div>


              <LedgerRow
                label="PURCHASE PRICE"
                value={
                  money(
                    purchasePrice,
                    currency
                  )
                }
              />


              <LedgerRow
                label="EXPENSES"
                value={
                  money(
                    totalExpenses,
                    currency
                  )
                }
              />


              <LedgerRow
                label="WORK ORDERS"
                value={
                  money(
                    workOrderCost,
                    currency
                  )
                }
              />


              <LedgerRow
                label="INSURANCE"
                value={
                  money(
                    insuranceCost,
                    currency
                  )
                }
              />


              <LedgerRow
                label="TOTAL COST"
                value={
                  money(
                    totalCost,
                    currency
                  )
                }
                strong
              />

            </section>


            {/* ===============================================
                VALUE / POSITION

                POSITION LIVES DOWN HERE ON PURPOSE.
                IT IS NOT A HEADLINE OWNERSHIP METRIC.
                =============================================== */}

            <section className="ff3-paper-card ff3-section">

              <div className="ff3-section-title">
                VALUE DETAIL
              </div>


              <LedgerRow
                label="CURRENT VALUE"
                value={
                  money(
                    currentValue,
                    currency
                  )
                }
                strong
              />


              <LedgerRow
                label="TOTAL COST"
                value={
                  money(
                    totalCost,
                    currency
                  )
                }
              />


              <LedgerRow
                label="POSITION"
                value={
                  money(
                    position,
                    currency
                  )
                }
                positive={
                  position > 0
                }
                negative={
                  position < 0
                }
              />

            </section>


            {/* ===============================================
                OWNERSHIP METRIC DETAIL
                =============================================== */}

            <section className="ff3-paper-card ff3-section">

              <div className="ff3-section-title">
                OWNERSHIP METRICS
              </div>


              <LedgerRow
                label="CURRENT MILES"
                value={
                  currentMiles
                    ? `${number(
                        currentMiles
                      )} MI`
                    : "—"
                }
              />


              <LedgerRow
                label="MILES AT PURCHASE"
                value={
                  milesAtPurchase
                    ? `${number(
                        milesAtPurchase
                      )} MI`
                    : "—"
                }
              />


              <LedgerRow
                label="MILES OWNED"
                value={
                  milesOwned
                    ? `${number(
                        milesOwned
                      )} MI`
                    : "—"
                }
              />


              <LedgerRow
                label="TIME OWNED"
                value={
                  ownershipTimeLabel(
                    ownedMonths
                  )
                }
              />


              <LedgerRow
                label="COST / MILE"
                value={
                  milesOwned
                    ? money(
                        costPerMile,
                        currency,
                        2
                      )
                    : "—"
                }
              />


              <LedgerRow
                label="COST / YEAR"
                value={
                  ownedMonths
                    ? money(
                        costPerYear,
                        currency
                      )
                    : "—"
                }
              />


              <LedgerRow
                label="COST / MONTH"
                value={
                  ownedMonths
                    ? money(
                        costPerMonth,
                        currency
                      )
                    : "—"
                }
              />

            </section>


            {/* ===============================================
                RECENT FINANCIAL ACTIVITY
                =============================================== */}

            <section className="ff3-paper-card ff3-section ff3-activity">

              <div className="ff3-section-title">
                RECENT FINANCIAL ACTIVITY
              </div>


              <div className="ff3-activity-head">

                <span>
                  DATE
                </span>

                <span>
                  TYPE
                </span>

                <span>
                  DESCRIPTION
                </span>

                <span>
                  AMOUNT
                </span>

              </div>


              {activity.length ? (

                <div className="ff3-activity-body">

                  {activity.map(
                    (
                      item,
                      index
                    ) => {

                      const activityDate =
                        first(
                          item?.date,
                          item?.occurredAt,
                          item?.transactionDate
                        );


                      const activityType =
                        clean(
                          first(
                            item?.type,
                            item?.documentType,
                            item?.category,
                            "ACTIVITY"
                          )
                        );


                      const activityLabel =
                        clean(
                          first(
                            item?.label,
                            item?.title,
                            item?.description,
                            item?.documentType,
                            "FINANCIAL ACTIVITY"
                          )
                        );


                      const activityAmount =
                        Number(
                          item?.amount
                        ) || 0;


                      const activityId =
                        clean(
                          first(
                            item?.id,
                            item?.financialDocumentId,
                            item?.financialLineId,
                            `activity-${index}`
                          )
                        );


                      return (
                        <div
                          key={
                            activityId
                          }
                          className="ff3-activity-row"
                        >

                          <span>
                            {dateLabel(
                              activityDate
                            )}
                          </span>


                          <span>
                            {
                              activityType ||
                              "—"
                            }
                          </span>


                          <strong>
                            {
                              activityLabel ||
                              "—"
                            }
                          </strong>


                          <em>
                            {money(
                              activityAmount,
                              currency
                            )}
                          </em>

                        </div>
                      );
                    }
                  )}

                </div>

              ) : (

                <div className="ff3-empty-activity">
                  NO RECENT FINANCIAL ACTIVITY
                </div>

              )}

            </section>


            {/* ===============================================
                END OF SCROLL DOCUMENT
                =============================================== */}

            <div className="ff3-scroll-end">

              <span>
                IRONXCHANGE
              </span>

              <strong>
                OBJECT FINANCIAL RECORD
              </strong>

              <span>
                {
                  clean(
                    periodLabel
                  ) ||
                  "LIFE"
                }
              </span>

            </div>

          </div>


          {/* =================================================
              FIXED FOOTER

              POINTER DOWN STOPS HERE.
              BUTTON CLICKS MUST NOT START CARD DRAG.
              ================================================= */}

          <footer
            className="ff3-footer"
            onPointerDown={
              event =>
                event.stopPropagation()
            }
          >

            <button
              type="button"
              className="ff3-workbook"
              onClick={
                onOpenWorkbook
              }
              disabled={
                typeof onOpenWorkbook !==
                "function"
              }
            >

              <span>
                OPEN FINANCIAL WORKBOOK
              </span>

              <small>
                DETAILED FINANCIALS
              </small>

            </button>


            <Seal
              top="IXI"
              bottom="FF-003"
            />


            <div className="ff3-actions">

              <button
                type="button"
                onClick={
                  onCreateExpense
                }
                disabled={
                  typeof onCreateExpense !==
                  "function"
                }
                title="Create Expense"
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
                title="Create Purchase Order"
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
                title="Create Work Order"
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
                title="Create Time Entry"
              >
                TIME
              </button>


              <button
                type="button"
                className="more"
                onClick={
                  onMoreActions
                }
                disabled={
                  typeof onMoreActions !==
                  "function"
                }
                title="More Financial Actions"
              >
                •••
              </button>

            </div>

          </footer>


          <div className="ff3-bottom-mark">

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

      </div>


      {/* =====================================================
          CSS STARTS HERE.

          PART 4 CONTINUES FROM THIS EXACT POINT.
          DO NOT ADD </section> YET.
          ===================================================== */}

      <style jsx global>{`

              /* =====================================================
           IXIFF-003
           ENGRAVED CERTIFICATE / MONEY GREEN
           ===================================================== */


        .ixi-aos-financial-face3-shell,
        .ixi-aos-financial-face3-shell * {
          box-sizing:
            border-box;
        }


        .ixi-aos-financial-face3-shell {
          --ff3-green-black:
            #071008;

          --ff3-green-deep:
            #0a1b10;

          --ff3-green:
            #17351f;

          --ff3-green-mid:
            #294b30;

          --ff3-ivory:
            #f2eddc;

          --ff3-ivory-dark:
            #ded2b3;

          --ff3-ink:
            #17271c;

          --ff3-brass:
            #c5b274;


          position:
            relative;


          width:
            ${FACE_WIDTH}px;

          min-width:
            ${FACE_WIDTH}px;

          max-width:
            ${FACE_WIDTH}px;


          height:
            ${FACE_HEIGHT}px;

          min-height:
            ${FACE_HEIGHT}px;

          max-height:
            ${FACE_HEIGHT}px;


          margin:
            0;

          padding:
            0;


          overflow:
            hidden;


          border-radius:
            13px;


          isolation:
            isolate;


          background:
            #080b08;


          font-family:
            Georgia,
            "Times New Roman",
            serif;


          box-shadow:
            0 18px 42px
            rgba(
              0,
              0,
              0,
              .55
            );
        }



        /* =====================================================
           METAL SHELL
           ===================================================== */


        .ff3-metal-shell {
          position:
            absolute;

          inset:
            0;


          overflow:
            hidden;


          border:
            1px solid
            rgba(
              243,
              239,
              220,
              .72
            );


          border-radius:
            13px;


          background:
            linear-gradient(
              90deg,

              #d9d4c6 0%,

              #6d6b64 1.2%,

              #f1ede0 2.2%,

              #434944 3.3%,

              #cbc6b7 4.2%,

              #2d342e 5.3%,

              #101912 7%,

              #101912 93%,

              #333b34 94.7%,

              #cdc8b8 95.9%,

              #5d5d58 97.1%,

              #f0ecdf 98.2%,

              #a9a69c 100%
            );


          box-shadow:
            inset 0 1px 0
            rgba(
              255,
              255,
              255,
              .65
            ),

            inset 0 -1px 0
            rgba(
              0,
              0,
              0,
              .90
            );
        }


        .ff3-ridge {
          position:
            absolute;


          pointer-events:
            none;


          border-radius:
            11px;
        }


        .ff3-ridge-a {
          inset:
            2px;


          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .24
            );
        }


        .ff3-ridge-b {
          inset:
            5px;


          border:
            1px solid
            rgba(
              20,
              27,
              22,
              .85
            );
        }


        .ff3-ridge-c {
          inset:
            7px;


          border:
            1px solid
            rgba(
              211,
              201,
              161,
              .34
            );
        }



        /* =====================================================
           CERTIFICATE CHASSIS
           ===================================================== */


        .ff3-certificate {
          position:
            absolute;


          inset:
            8px;


          z-index:
            1;


          display:
            flex;


          flex-direction:
            column;


          min-width:
            0;


          min-height:
            0;


          overflow:
            hidden;


          border:
            1px solid
            rgba(
              214,
              202,
              157,
              .62
            );


          border-radius:
            7px;


          background:
            var(
              --ff3-green-black
            );


          box-shadow:
            inset 0 0 0 2px
            rgba(
              3,
              9,
              5,
              .95
            ),

            inset 0 0 0 3px
            rgba(
              205,
              191,
              142,
              .18
            );
        }


        .ff3-certificate::before {
          content:
            "";


          position:
            absolute;


          inset:
            3px;


          z-index:
            1;


          pointer-events:
            none;


          border:
            1px solid
            rgba(
              205,
              192,
              143,
              .18
            );


          border-radius:
            4px;
        }


        .ff3-guilloche {
          position:
            absolute;


          inset:
            0;


          z-index:
            0;


          pointer-events:
            none;


          opacity:
            .35;


          background-image:
            repeating-radial-gradient(
              ellipse at 0 0,

              transparent 0,

              transparent 5px,

              rgba(
                218,
                204,
                154,
                .11
              ) 5px,

              rgba(
                218,
                204,
                154,
                .11
              ) 6px
            ),

            repeating-linear-gradient(
              37deg,

              transparent 0,

              transparent 3px,

              rgba(
                220,
                207,
                160,
                .055
              ) 3px,

              rgba(
                220,
                207,
                160,
                .055
              ) 4px
            );


          background-size:
            26px 18px,
            auto;
        }


        .ff3-certificate > * {
          position:
            relative;


          z-index:
            2;
        }



        /* =====================================================
           DRAG ZONE / HEADER
           ===================================================== */


        .ff3-drag-zone {
          flex:
            0 0 auto;


          cursor:
            grab;
        }


        .ff3-drag-zone:active {
          cursor:
            grabbing;
        }


        .ff3-cartouche {
          position:
            absolute;


          top:
            -1px;


          left:
            50%;


          z-index:
            20;


          width:
            112px;


          height:
            29px;


          transform:
            translateX(
              -50%
            );


          display:
            flex;


          align-items:
            center;


          justify-content:
            center;


          border:
            1px solid
            rgba(
              232,
              221,
              180,
              .66
            );


          border-top:
            0;


          border-radius:
            0 0 13px 13px;


          background:
            radial-gradient(
              ellipse at 50% 0%,

              rgba(
                255,
                255,
                255,
                .13
              ),

              transparent 60%
            ),

            linear-gradient(
              180deg,

              #25472e,

              #0c1c11
            );


          color:
            #f1ead3;


          font-size:
            11px;


          font-weight:
            900;


          letter-spacing:
            1.45px;


          text-shadow:
            0 1px 0
            #000;


          box-shadow:
            0 2px 2px
            rgba(
              0,
              0,
              0,
              .60
            ),

            inset 0 -1px 0
            rgba(
              255,
              255,
              255,
              .08
            );
        }


        .ff3-document-head {
          height:
            94px;


          min-height:
            94px;


          margin:
            7px 7px 0;


          padding:
            15px 9px 6px;


          overflow:
            hidden;


          border:
            1px solid
            rgba(
              54,
              67,
              44,
              .60
            );


          border-radius:
            4px 4px 0 0;


          background-image:
            radial-gradient(
              ellipse at 50% 55%,

              rgba(
                72,
                83,
                57,
                .06
              ),

              transparent 55%
            ),

            repeating-linear-gradient(
              15deg,

              rgba(
                58,
                61,
                43,
                .03
              ) 0,

              rgba(
                58,
                61,
                43,
                .03
              ) 1px,

              transparent 1px,

              transparent 6px
            ),

            repeating-linear-gradient(
              -21deg,

              transparent 0,

              transparent 9px,

              rgba(
                104,
                94,
                59,
                .028
              ) 9px,

              rgba(
                104,
                94,
                59,
                .028
              ) 10px
            ),

            linear-gradient(
              180deg,

              #f6f0df,

              #e9dfc4
            );


          color:
            var(
              --ff3-ink
            );


          box-shadow:
            inset 0 0 0 2px
            rgba(
              100,
              86,
              47,
              .08
            ),

            inset 0 0 18px
            rgba(
              89,
              76,
              41,
              .055
            );
        }


        .ff3-kicker {
          height:
            11px;


          display:
            flex;


          align-items:
            center;


          justify-content:
            space-between;


          padding:
            0 50px;


          color:
            rgba(
              25,
              39,
              28,
              .78
            );


          font-size:
            5px;


          font-weight:
            900;


          letter-spacing:
            .55px;
        }


        .ff3-title-row {
          height:
            53px;


          display:
            grid;


          grid-template-columns:
            42px
            minmax(
              0,
              1fr
            )
            42px;


          align-items:
            center;


          gap:
            6px;
        }


        .ff3-object-copy {
          min-width:
            0;


          display:
            flex;


          flex-direction:
            column;


          align-items:
            center;


          justify-content:
            center;


          gap:
            3px;
        }


        .ff3-object-copy strong {
          width:
            100%;


          overflow:
            hidden;


          color:
            #17271c;


          font-size:
            15.4px;


          font-weight:
            900;


          line-height:
            .98;


          letter-spacing:
            -.30px;


          text-align:
            center;


          text-overflow:
            ellipsis;


          white-space:
            nowrap;
        }


        .ff3-object-copy span {
          width:
            100%;


          overflow:
            hidden;


          color:
            rgba(
              24,
              38,
              28,
              .70
            );


          font-size:
            5.2px;


          font-weight:
            900;


          letter-spacing:
            .85px;


          text-align:
            center;


          text-overflow:
            ellipsis;


          text-transform:
            uppercase;


          white-space:
            nowrap;
        }


        .ff3-id-line {
          height:
            13px;


          display:
            flex;


          align-items:
            center;


          justify-content:
            center;


          gap:
            5px;


          overflow:
            hidden;


          color:
            rgba(
              23,
              39,
              28,
              .72
            );


          font-family:
            Arial,
            Helvetica,
            sans-serif;


          font-size:
            4.2px;


          font-weight:
            900;


          letter-spacing:
            .28px;


          white-space:
            nowrap;
        }



        /* =====================================================
           SEALS
           ===================================================== */


        .ff3-seal {
          width:
            40px;


          height:
            40px;


          flex:
            0 0 40px;


          display:
            flex;


          align-items:
            center;


          justify-content:
            center;


          border:
            1px solid
            #243d29;


          border-radius:
            50%;


          background:
            conic-gradient(
              from 0deg,

              #213d29,

              #d3c79d,

              #17301e,

              #9f9160,

              #1d3a26,

              #d8cca1,

              #213d29
            );


          box-shadow:
            inset 0 0 0 2px
            #102316,

            inset 0 0 0 3px
            rgba(
              239,
              230,
              194,
              .52
            ),

            0 2px 3px
            rgba(
              0,
              0,
              0,
              .36
            );
        }


        .ff3-seal-ring {
          width:
            29px;


          height:
            29px;


          display:
            flex;


          flex-direction:
            column;


          align-items:
            center;


          justify-content:
            center;


          border:
            1px solid
            rgba(
              236,
              226,
              188,
              .55
            );


          border-radius:
            50%;


          background:
            radial-gradient(
              circle at 35% 30%,

              #35573a,

              #102216 68%
            );


          color:
            #ede4c6;
        }


        .ff3-seal-ring strong {
          font-size:
            9px;


          font-weight:
            900;


          line-height:
            1;
        }


        .ff3-seal-ring span {
          margin-top:
            2px;


          color:
            rgba(
              237,
              228,
              198,
              .70
            );


          font-family:
            Arial,
            Helvetica,
            sans-serif;


          font-size:
            3px;


          font-weight:
            900;


          line-height:
            1;
        }



        /* =====================================================
           PRIMARY ACQUISITION BAND
           ===================================================== */


        .ff3-primary-band {
          height:
            49px;


          min-height:
            49px;


          margin:
            0 7px;


          display:
            grid;


          grid-template-columns:
            repeat(
              3,
              minmax(
                0,
                1fr
              )
            );


          overflow:
            hidden;


          border-left:
            1px solid
            rgba(
              221,
              210,
              167,
              .20
            );


          border-right:
            1px solid
            rgba(
              221,
              210,
              167,
              .20
            );


          border-bottom:
            1px solid
            rgba(
              221,
              210,
              167,
              .38
            );


          background:
            repeating-linear-gradient(
              28deg,

              transparent 0,

              transparent 4px,

              rgba(
                218,
                205,
                158,
                .032
              ) 4px,

              rgba(
                218,
                205,
                158,
                .032
              ) 5px
            ),

            linear-gradient(
              180deg,

              #1b3b25,

              #0a1b10
            );


          color:
            #efe6cb;
        }


        .ff3-primary-band > div {
          min-width:
            0;


          display:
            flex;


          flex-direction:
            column;


          align-items:
            center;


          justify-content:
            center;


          gap:
            5px;


          padding:
            5px 6px;


          border-right:
            1px solid
            rgba(
              230,
              218,
              176,
              .16
            );
        }


        .ff3-primary-band > div:last-child {
          border-right:
            0;
        }


        .ff3-primary-band span {
          color:
            rgba(
              236,
              227,
              197,
              .70
            );


          font-size:
            4.4px;


          font-weight:
            900;


          letter-spacing:
            .32px;
        }


        .ff3-primary-band strong {
          width:
            100%;


          overflow:
            hidden;


          color:
            #f7efd6;


          font-size:
            8.2px;


          font-weight:
            900;


          text-align:
            center;


          text-overflow:
            ellipsis;


          white-space:
            nowrap;
        }



        /* =====================================================
           FIXED OWNER INTELLIGENCE
           ===================================================== */


        .ff3-hero-intelligence {
          flex:
            0 0 auto;


          margin:
            5px 7px 0;


          overflow:
            hidden;


          border:
            1px solid
            rgba(
              210,
              198,
              149,
              .30
            );


          border-radius:
            4px;


          background:
            radial-gradient(
              ellipse at 50% 0%,

              rgba(
                101,
                84,
                44,
                .045
              ),

              transparent 60%
            ),

            repeating-linear-gradient(
              18deg,

              rgba(
                70,
                68,
                47,
                .022
              ) 0,

              rgba(
                70,
                68,
                47,
                .022
              ) 1px,

              transparent 1px,

              transparent 6px
            ),

            linear-gradient(
              180deg,

              #f4efdf,

              #e7dcc1
            );


          color:
            var(
              --ff3-ink
            );


          box-shadow:
            inset 0 0 0 1px
            rgba(
              255,
              255,
              255,
              .40
            );
        }


        .ff3-hero-row {
          display:
            grid;
        }


        .ff3-hero-money {
          grid-template-columns:
            1fr 1fr;


          min-height:
            40px;
        }


        .ff3-hero-usage {
          grid-template-columns:
            repeat(
              4,
              minmax(
                0,
                1fr
              )
            );


          min-height:
            30px;


          border-top:
            1px solid
            rgba(
              43,
              58,
              44,
              .15
            );
        }


        .ff3-hero-time {
          grid-template-columns:
            1fr 1fr;


          min-height:
            29px;


          border-top:
            1px solid
            rgba(
              43,
              58,
              44,
              .15
            );
        }


        .ff3-hero-cell {
          min-width:
            0;


          display:
            flex;


          flex-direction:
            column;


          align-items:
            center;


          justify-content:
            center;


          gap:
            3px;


          padding:
            4px 5px;


          border-right:
            1px solid
            rgba(
              43,
              58,
              44,
              .15
            );
        }


        .ff3-hero-row
        .ff3-hero-cell:last-child {
          border-right:
            0;
        }


        .ff3-hero-cell span {
          width:
            100%;


          overflow:
            hidden;


          color:
            rgba(
              22,
              38,
              27,
              .62
            );


          font-family:
            Arial,
            Helvetica,
            sans-serif;


          font-size:
            3.8px;


          font-weight:
            900;


          letter-spacing:
            .22px;


          text-align:
            center;


          text-overflow:
            ellipsis;


          white-space:
            nowrap;
        }


        .ff3-hero-money strong {
          color:
            #15371f;


          font-size:
            9.6px;


          font-weight:
            900;


          line-height:
            1;
        }


        .ff3-hero-usage strong,
        .ff3-hero-time strong {
          width:
            100%;


          overflow:
            hidden;


          color:
            #18301f;


          font-size:
            5.6px;


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
           SCROLL BODY
           ===================================================== */


        .ff3-scroll-body {
          min-width:
            0;


          min-height:
            0;


          flex:
            1 1 auto;


          margin:
            5px 5px 0 7px;


          padding:
            0 4px 12px 0;


          overflow-x:
            hidden;


          overflow-y:
            auto;


          overscroll-behavior:
            contain;


          scrollbar-width:
            thin;


          scrollbar-color:
            #b9a667
            #102216;


          outline:
            none;
        }


        .ff3-scroll-body:focus-visible {
          box-shadow:
            inset 0 0 0 1px
            rgba(
              214,
              199,
              144,
              .28
            );
        }


        .ff3-scroll-body::-webkit-scrollbar {
          width:
            4px;
        }


        .ff3-scroll-body::-webkit-scrollbar-track {
          border-radius:
            999px;


          background:
            #102216;
        }


        .ff3-scroll-body::-webkit-scrollbar-thumb {
          border:
            1px solid
            rgba(
              51,
              44,
              28,
              .55
            );


          border-radius:
            999px;


          background:
            linear-gradient(
              180deg,

              #ded19a,

              #a28d52 52%,

              #6e5e37
            );


          box-shadow:
            inset 0 1px 0
            rgba(
              255,
              255,
              255,
              .28
            );
        }


        .ff3-scroll-body::-webkit-scrollbar-thumb:hover {
          background:
            linear-gradient(
              180deg,

              #eee2aa,

              #b49d5e 52%,

              #806c3f
            );
        }



        /* =====================================================
           PAPER CARDS
           ===================================================== */


        .ff3-paper-card {
          position:
            relative;


          width:
            100%;


          margin:
            0 0 6px;


          padding:
            7px 8px;


          overflow:
            hidden;


          border:
            1px solid
            rgba(
              54,
              68,
              44,
              .50
            );


          border-radius:
            4px;


          background:
            radial-gradient(
              ellipse at 20% 15%,

              rgba(
                111,
                92,
                51,
                .055
              ),

              transparent 38%
            ),

            repeating-linear-gradient(
              15deg,

              rgba(
                73,
                72,
                48,
                .025
              ) 0,

              rgba(
                73,
                72,
                48,
                .025
              ) 1px,

              transparent 1px,

              transparent 6px
            ),

            linear-gradient(
              180deg,

              #f5efdd,

              #e6dcc2
            );


          color:
            var(
              --ff3-ink
            );


          box-shadow:
            inset 0 0 0 1px
            rgba(
              255,
              255,
              255,
              .44
            ),

            inset 0 0 14px
            rgba(
              80,
              67,
              34,
              .055
            ),

            0 1px 0
            rgba(
              0,
              0,
              0,
              .20
            );
        }


        .ff3-paper-card::after {
          content:
            "";


          position:
            absolute;


          inset:
            3px;


          pointer-events:
            none;


          border:
            1px solid
            rgba(
              73,
              78,
              53,
              .075
            );


          border-radius:
            2px;
        }



        /* =====================================================
           IDENTITY DETAIL
           ===================================================== */


        .ff3-identity-grid {
          display:
            grid;


          grid-template-columns:
            1fr 1fr;


          padding:
            0;
        }


        .ff3-identity-grid > div {
          min-width:
            0;


          min-height:
            37px;


          display:
            flex;


          flex-direction:
            column;


          align-items:
            center;


          justify-content:
            center;


          gap:
            3px;


          padding:
            5px 7px;


          border-right:
            1px solid
            rgba(
              44,
              61,
              43,
              .15
            );


          border-bottom:
            1px solid
            rgba(
              44,
              61,
              43,
              .15
            );
        }


        .ff3-identity-grid > div:nth-child(2n) {
          border-right:
            0;
        }


        .ff3-identity-grid > div:nth-last-child(-n+2) {
          border-bottom:
            0;
        }


        .ff3-identity-grid span {
          color:
            rgba(
              22,
              38,
              27,
              .62
            );


          font-family:
            Arial,
            Helvetica,
            sans-serif;


          font-size:
            4.2px;


          font-weight:
            900;


          letter-spacing:
            .28px;
        }


        .ff3-identity-grid strong {
          width:
            100%;


          overflow:
            hidden;


          color:
            #182b1e;


          font-size:
            6.8px;


          font-weight:
            900;


          text-align:
            center;


          text-overflow:
            ellipsis;


          white-space:
            nowrap;
        }



        /* =====================================================
           SECTION SYSTEM
           ===================================================== */


        .ff3-section-title {
          min-height:
            16px;


          margin:
            0 0 5px;


          padding:
            0 0 4px;


          border-bottom:
            1px solid
            rgba(
              33,
              50,
              36,
              .20
            );


          color:
            #1a3020;


          font-size:
            6.5px;


          font-weight:
            900;


          letter-spacing:
            .42px;


          text-align:
            center;
        }


        .ff3-ledger-row {
          min-width:
            0;


          min-height:
            17px;


          display:
            grid;


          grid-template-columns:
            auto
            minmax(
              10px,
              1fr
            )
            auto;


          align-items:
            center;


          gap:
            5px;
        }


        .ff3-ledger-row > span {
          min-width:
            0;


          overflow:
            hidden;


          color:
            rgba(
              24,
              38,
              28,
              .84
            );


          font-family:
            Arial,
            Helvetica,
            sans-serif;


          font-size:
            5.1px;


          font-weight:
            900;


          text-overflow:
            ellipsis;


          white-space:
            nowrap;
        }


        .ff3-ledger-row > i {
          min-width:
            0;


          height:
            1px;


          background:
            repeating-linear-gradient(
              90deg,

              rgba(
                46,
                62,
                47,
                .56
              ) 0,

              rgba(
                46,
                62,
                47,
                .56
              ) 1px,

              transparent 1px,

              transparent 3px
            );
        }


        .ff3-ledger-row > strong {
          max-width:
            120px;


          overflow:
            hidden;


          color:
            #162a1c;


          font-size:
            5.9px;


          font-weight:
            900;


          text-align:
            right;


          text-overflow:
            ellipsis;


          white-space:
            nowrap;
        }


        .ff3-ledger-row.strong {
          min-height:
            20px;


          margin-top:
            3px;


          padding-top:
            3px;


          border-top:
            1px solid
            rgba(
              29,
              47,
              33,
              .25
            );
        }


        .ff3-ledger-row.strong > span,
        .ff3-ledger-row.strong > strong {
          color:
            #174326;


          font-size:
            6.5px;
        }


        .ff3-ledger-row.positive > strong {
          color:
            #17542d;
        }


        .ff3-ledger-row.negative > strong {
          color:
            #8c2f22;
        }



        /* =====================================================
           OWNERSHIP
           ===================================================== */


        .ff3-ownership-banner {
          height:
            28px;


          margin:
            1px 0 6px;


          display:
            flex;


          align-items:
            center;


          justify-content:
            center;


          border:
            1px solid
            rgba(
              27,
              63,
              36,
              .55
            );


          border-radius:
            3px;


          background:
            repeating-linear-gradient(
              30deg,

              transparent 0,

              transparent 4px,

              rgba(
                232,
                220,
                177,
                .032
              ) 4px,

              rgba(
                232,
                220,
                177,
                .032
              ) 5px
            ),

            linear-gradient(
              180deg,

              #315b3a,

              #16351f
            );


          color:
            #f0e7cd;


          font-size:
            7.4px;


          font-weight:
            900;


          letter-spacing:
            .7px;
        }


        .ff3-paid-copy {
          height:
            24px;


          display:
            flex;


          align-items:
            center;


          justify-content:
            center;


          color:
            rgba(
              24,
              39,
              28,
              .58
            );


          font-family:
            Arial,
            Helvetica,
            sans-serif;


          font-size:
            4.5px;


          font-weight:
            900;


          letter-spacing:
            .25px;


          text-align:
            center;
        }



        /* =====================================================
           ACTIVITY
           ===================================================== */


        .ff3-activity-head,
        .ff3-activity-row {
          display:
            grid;


          grid-template-columns:
            58px
            42px
            minmax(
              0,
              1fr
            )
            56px;


          align-items:
            center;
        }


        .ff3-activity-head {
          height:
            18px;


          border:
            1px solid
            rgba(
              30,
              55,
              34,
              .40
            );


          background:
            linear-gradient(
              180deg,

              #315538,

              #173521
            );


          color:
            #f0e8ce;
        }


        .ff3-activity-head span {
          overflow:
            hidden;


          padding:
            0 3px;


          font-family:
            Arial,
            Helvetica,
            sans-serif;


          font-size:
            4px;


          font-weight:
            900;


          text-align:
            center;


          text-overflow:
            ellipsis;


          white-space:
            nowrap;
        }


        .ff3-activity-row {
          min-height:
            19px;


          border-bottom:
            1px solid
            rgba(
              35,
              52,
              39,
              .13
            );
        }


        .ff3-activity-row span,
        .ff3-activity-row strong,
        .ff3-activity-row em {
          min-width:
            0;


          overflow:
            hidden;


          padding:
            0 3px;


          color:
            #192d1f;


          font-family:
            Arial,
            Helvetica,
            sans-serif;


          font-size:
            4.4px;


          font-style:
            normal;


          text-overflow:
            ellipsis;


          white-space:
            nowrap;
        }


        .ff3-activity-row strong,
        .ff3-activity-row em {
          font-weight:
            900;
        }


        .ff3-activity-row em {
          text-align:
            right;
        }


        .ff3-empty-activity {
          height:
            42px;


          display:
            flex;


          align-items:
            center;


          justify-content:
            center;


          color:
            rgba(
              25,
              40,
              29,
              .45
            );


          font-family:
            Arial,
            Helvetica,
            sans-serif;


          font-size:
            4.5px;


          font-weight:
            900;


          letter-spacing:
            .28px;
        }


        .ff3-scroll-end {
          height:
            28px;


          display:
            flex;


          align-items:
            center;


          justify-content:
            space-between;


          padding:
            0 8px;


          color:
            rgba(
              223,
              213,
              176,
              .50
            );


          font-size:
            4px;


          font-weight:
            900;


          letter-spacing:
            .45px;
        }


        .ff3-scroll-end strong {
          color:
            rgba(
              232,
              222,
              185,
              .70
            );
        }



        /* =====================================================
           FOOTER
           ===================================================== */


        .ff3-footer {
          height:
            48px;


          min-height:
            48px;


          flex:
            0 0 48px;


          margin:
            0 7px;


          display:
            grid;


          grid-template-columns:
            minmax(
              0,
              1fr
            )
            40px
            106px;


          align-items:
            center;


          gap:
            4px;


          padding:
            4px 5px;


          border:
            1px solid
            rgba(
              210,
              198,
              149,
              .31
            );


          border-radius:
            4px;


          background:
            repeating-linear-gradient(
              30deg,

              transparent 0,

              transparent 4px,

              rgba(
                220,
                207,
                158,
                .035
              ) 4px,

              rgba(
                220,
                207,
                158,
                .035
              ) 5px
            ),

            linear-gradient(
              180deg,

              #193822,

              #07150c
            );
        }


        .ff3-footer button {
          appearance:
            none;


          border:
            1px solid
            rgba(
              218,
              205,
              160,
              .34
            );


          border-radius:
            4px;


          outline:
            none;


          background:
            linear-gradient(
              180deg,

              #25482d,

              #0b1d11
            );


          color:
            #eee5cb;


          cursor:
            pointer;
        }


        .ff3-footer button:hover:not(:disabled) {
          border-color:
            rgba(
              238,
              226,
              179,
              .66
            );


          background:
            linear-gradient(
              180deg,

              #355d3b,

              #10291a
            );
        }


        .ff3-footer button:disabled {
          opacity:
            .35;


          cursor:
            default;
        }


        .ff3-workbook {
          height:
            36px;


          display:
            flex;


          flex-direction:
            column;


          align-items:
            center;


          justify-content:
            center;


          gap:
            3px;


          font-family:
            Georgia,
            "Times New Roman",
            serif;
        }


        .ff3-workbook span {
          font-size:
            5.3px;


          font-weight:
            900;


          letter-spacing:
            .20px;
        }


        .ff3-workbook small {
          color:
            rgba(
              232,
              223,
              193,
              .60
            );


          font-size:
            3.5px;


          font-weight:
            900;


          letter-spacing:
            .25px;
        }


        .ff3-actions {
          height:
            36px;


          display:
            grid;


          grid-template-columns:
            repeat(
              5,
              minmax(
                0,
                1fr
              )
            );


          gap:
            2px;
        }


        .ff3-actions button {
          min-width:
            0;


          height:
            36px;


          padding:
            0 2px;


          font-family:
            Arial,
            Helvetica,
            sans-serif;


          font-size:
            3.9px;


          font-weight:
            900;
        }


        .ff3-actions button.more {
          font-size:
            7px;
        }


        .ff3-bottom-mark {
          height:
            18px;


          min-height:
            18px;


          flex:
            0 0 18px;


          margin:
            0 7px;


          display:
            flex;


          align-items:
            center;


          justify-content:
            space-between;


          padding:
            0 8px;


          color:
            rgba(
              225,
              214,
              177,
              .52
            );


          font-size:
            3.7px;


          font-weight:
            900;


          letter-spacing:
            .50px;
        }


        .ff3-bottom-mark strong {
          color:
            rgba(
              240,
              230,
              192,
              .82
            );


          font-size:
            3.6px;
        }



        /* =====================================================
           HARD CONTAINMENT
           ===================================================== */


        .ixi-aos-financial-face3-shell
        strong,

        .ixi-aos-financial-face3-shell
        span,

        .ixi-aos-financial-face3-shell
        em,

        .ixi-aos-financial-face3-shell
        small {
          margin:
            0;


          padding:
            0;
        }


        .ixi-aos-financial-face3-shell
        button {
          font-synthesis:
            none;
        }


      `}</style>

    </section>
  );
}
