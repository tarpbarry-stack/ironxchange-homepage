import {
  useMemo,
  useState
} from "react";

import IXIFaceFrame
  from "../ixi-face-studio/IXIFaceFrame";

import IXIFaceActionFooter
  from "../ixi-face-studio/IXIFaceActionFooter";

import {
  getAuctionData,
  getAuctionTermsData,
  getPublicData
} from "./auctionObjectSelectors";


/* =========================================================
   CONSTANTS
   ========================================================= */

const MAX_INPUT_DIGITS =
  6;

const MAX_INPUT_VALUE =
  999999;


/* =========================================================
   MONEY HELPERS
   ========================================================= */

function clampMoneyInput(
  value = ""
) {
  const digits =
    String(
      value ??
      ""
    )
      .replace(
        /\D/g,
        ""
      )
      .slice(
        0,
        MAX_INPUT_DIGITS
      );


  if (
    !digits
  ) {
    return 0;
  }


  return Math.min(
    Number(
      digits
    ),
    MAX_INPUT_VALUE
  );
}


function cleanNumber(
  value = ""
) {
  const cleaned =
    String(
      value ??
      ""
    ).replace(
      /[^0-9.]/g,
      ""
    );


  const parsed =
    Number(
      cleaned
    );


  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
}


function money(
  value = 0
) {
  const amount =
    Number.isFinite(
      Number(
        value
      )
    )
      ? Number(
          value
        )
      : 0;


  return amount.toLocaleString(
    "en-US",
    {
      style:
        "currency",

      currency:
        "USD",

      maximumFractionDigits:
        0
    }
  );
}


function percentage(
  value = 0
) {
  const amount =
    Number.isFinite(
      Number(
        value
      )
    )
      ? Number(
          value
        )
      : 0;


  return `${amount.toFixed(1)}%`;
}


/* =========================================================
   BUYER PREMIUM
   ========================================================= */

function getBuyerPremiumData(
  listing = {}
) {
  const auction =
    getAuctionData(
      listing
    );


  const terms =
    getAuctionTermsData(
      listing
    );


  const auctionRules =
    auction
      ?.auctionRules ||
    {};


  return (
    auctionRules
      ?.buyerPremium ||
    auction
      ?.buyerPremium ||
    terms
      ?.buyerPremium ||
    terms
      ?.buyersPremium ||
    {}
  );
}


function getBuyerPremiumTiers(
  listing = {}
) {
  const premium =
    getBuyerPremiumData(
      listing
    );


  if (
    Array.isArray(
      premium
        ?.purchaseTiers
    )
  ) {
    return premium
      .purchaseTiers;
  }


  if (
    Array.isArray(
      premium
        ?.tiers
    )
  ) {
    return premium
      .tiers;
  }


  return [];
}


/* =========================================================
   COMMISSION
   ========================================================= */

function calculateCommission(
  listing,
  bidAmount
) {
  const bid =
    cleanNumber(
      bidAmount
    );


  if (
    !bid
  ) {
    return 0;
  }


  const premium =
    getBuyerPremiumData(
      listing
    );


  const tiers =
    getBuyerPremiumTiers(
      listing
    );


  const matchingTier =
    tiers.find(
      tier => {
        const minimum =
          cleanNumber(
            tier
              ?.minAmountExclusive ??
            tier
              ?.minAmount ??
            tier
              ?.minimumAmount ??
            0
          );


        const maximumRaw =
          tier
            ?.maxAmount ??
          tier
            ?.maximumAmount;


        const maximum =
          maximumRaw ===
            null ||
          maximumRaw ===
            undefined ||
          maximumRaw ===
            ""
            ? null
            : cleanNumber(
                maximumRaw
              );


        const minimumIsExclusive =
          tier
            ?.minAmountExclusive !==
              null &&
          tier
            ?.minAmountExclusive !==
              undefined;


        const passesMinimum =
          minimumIsExclusive
            ? bid >
                minimum
            : bid >=
                minimum;


        const passesMaximum =
          maximum ===
            null ||
          bid <=
            maximum;


        return (
          passesMinimum &&
          passesMaximum
        );
      }
    );


  if (
    matchingTier
  ) {
    const flatFee =
      cleanNumber(
        matchingTier
          ?.flatFee
      );


    if (
      flatFee
    ) {
      return flatFee;
    }


    const ratePercent =
      cleanNumber(
        matchingTier
          ?.cashCheckWireRatePercent ??
        matchingTier
          ?.ratePercent ??
        matchingTier
          ?.percent
      );


    const minimumFee =
      cleanNumber(
        matchingTier
          ?.minimumFee
      );


    if (
      ratePercent
    ) {
      const calculated =
        bid *
        (
          ratePercent /
          100
        );


      return Math.max(
        calculated,
        minimumFee
      );
    }
  }


  const flatFee =
    cleanNumber(
      premium
        ?.flatFee
    );


  if (
    flatFee
  ) {
    return flatFee;
  }


  const ratePercent =
    cleanNumber(
      premium
        ?.ratePercent ??
      premium
        ?.percent ??
      premium
        ?.rate
    );


  const minimumFee =
    cleanNumber(
      premium
        ?.minimumFee
    );


  const capAmount =
    cleanNumber(
      premium
        ?.capAmount
    );


  if (
    ratePercent
  ) {
    let calculated =
      bid *
      (
        ratePercent /
        100
      );


    if (
      minimumFee
    ) {
      calculated =
        Math.max(
          calculated,
          minimumFee
        );
    }


    if (
      capAmount
    ) {
      calculated =
        Math.min(
          calculated,
          capAmount
        );
    }


    return calculated;
  }


  return 0;
}


/* =========================================================
   SCENARIO CALCULATION
   ========================================================= */

function calculateScenario({
  listing,
  bid,
  estimatedSalePrice,
  freight1,
  freight2,
  tech,
  clean,
  parts,
  labor,
  preDelivery
}) {
  const commission =
    calculateCommission(
      listing,
      bid
    );


  const otherCosts =
    freight1 +
    freight2 +
    tech +
    clean +
    parts +
    labor +
    preDelivery;


  const totalCost =
    bid +
    commission +
    otherCosts;


  const totalProfit =
    estimatedSalePrice -
    totalCost;


  const profitPercent =
    totalCost
      ? (
          totalProfit /
          totalCost
        ) *
        100
      : 0;


  return {
    bid,
    commission,
    totalCost,
    totalProfit,
    profitPercent
  };
}


/* =========================================================
   MAIN FACE
   ========================================================= */

export default function IXIAuctionObjectFace3({
  listing = {},

  dealerBidPack = {},
  onSaveDealerBidPack,

  faceSize = "tall",

  dragHandleProps
}) {
  const publicData =
    getPublicData(
      listing
    );


  const year =
    listing
      ?.year ||
    publicData
      ?.year ||
    "";


  const make =
    listing
      ?.make ||
    publicData
      ?.make ||
    "";


  const model =
    listing
      ?.model ||
    publicData
      ?.model ||
    "";


  const hours =
    listing
      ?.hours ||
    publicData
      ?.hours ||
    "";


  const openingValue =
    Math.min(
      cleanNumber(
        listing
          ?.price ??
        publicData
          ?.price ??
        0
      ),
      MAX_INPUT_VALUE
    );


  const [
    estimatedSalePrice,
    setEstimatedSalePrice
  ] =
    useState(
      Math.min(
        cleanNumber(
          dealerBidPack
            ?.estimatedSalePrice ??
          openingValue
        ),
        MAX_INPUT_VALUE
      )
    );


  const [
    lowAdvertised,
    setLowAdvertised
  ] =
    useState(
      Math.min(
        cleanNumber(
          dealerBidPack
            ?.lowAdvertised
        ),
        MAX_INPUT_VALUE
      )
    );


  const [
    averageAdvertised,
    setAverageAdvertised
  ] =
    useState(
      Math.min(
        cleanNumber(
          dealerBidPack
            ?.averageAdvertised
        ),
        MAX_INPUT_VALUE
      )
    );


  const [
    myBid,
    setMyBid
  ] =
    useState(
      Math.min(
        cleanNumber(
          dealerBidPack
            ?.myBid ??
          openingValue
        ),
        MAX_INPUT_VALUE
      )
    );


  const [
    freight1,
    setFreight1
  ] =
    useState(
      Math.min(
        cleanNumber(
          dealerBidPack
            ?.freight1
        ),
        MAX_INPUT_VALUE
      )
    );


  const [
    freight2,
    setFreight2
  ] =
    useState(
      Math.min(
        cleanNumber(
          dealerBidPack
            ?.freight2
        ),
        MAX_INPUT_VALUE
      )
    );


  const [
    tech,
    setTech
  ] =
    useState(
      Math.min(
        cleanNumber(
          dealerBidPack
            ?.tech
        ),
        MAX_INPUT_VALUE
      )
    );


  const [
    clean,
    setClean
  ] =
    useState(
      Math.min(
        cleanNumber(
          dealerBidPack
            ?.clean
        ),
        MAX_INPUT_VALUE
      )
    );


  const [
    parts,
    setParts
  ] =
    useState(
      Math.min(
        cleanNumber(
          dealerBidPack
            ?.parts
        ),
        MAX_INPUT_VALUE
      )
    );


  const [
    labor,
    setLabor
  ] =
    useState(
      Math.min(
        cleanNumber(
          dealerBidPack
            ?.labor
        ),
        MAX_INPUT_VALUE
      )
    );


  const [
    preDelivery,
    setPreDelivery
  ] =
    useState(
      Math.min(
        cleanNumber(
          dealerBidPack
            ?.preDelivery
        ),
        MAX_INPUT_VALUE
      )
    );


  function saveBidPack() {
    onSaveDealerBidPack?.({
      estimatedSalePrice,
      lowAdvertised,
      averageAdvertised,
      myBid,
      freight1,
      freight2,
      tech,
      clean,
      parts,
      labor,
      preDelivery
    });
  }


  const mainScenario =
    useMemo(
      () =>
        calculateScenario({
          listing,

          bid:
            myBid,

          estimatedSalePrice,

          freight1,
          freight2,

          tech,
          clean,
          parts,
          labor,
          preDelivery
        }),
      [
        listing,
        myBid,
        estimatedSalePrice,
        freight1,
        freight2,
        tech,
        clean,
        parts,
        labor,
        preDelivery
      ]
    );


  const bidScenarios =
    useMemo(
      () =>
        [
          myBid +
            5000,

          myBid +
            2500,

          myBid,

          Math.max(
            myBid -
              2500,
            0
          ),

          Math.max(
            myBid -
              5000,
            0
          )
        ].map(
          bid =>
            calculateScenario({
              listing,
              bid,

              estimatedSalePrice,

              freight1,
              freight2,

              tech,
              clean,
              parts,
              labor,
              preDelivery
            })
        ),
      [
        listing,
        myBid,
        estimatedSalePrice,
        freight1,
        freight2,
        tech,
        clean,
        parts,
        labor,
        preDelivery
      ]
    );


  const machineLabel =
    [
      year,
      make,
      model
    ]
      .filter(
        Boolean
      )
      .join(
        " "
      );


  const hourLabel =
    hours
      ? String(
          hours
        )
          .replace(
            /hrs|hours/gi,
            ""
          )
          .trim()
      : "";


  return (
    <IXIFaceFrame
      className="
        aof3
        aof3-certificate
      "
      contentClassName="
        aof3-content
      "
      size={
        faceSize
      }
      dragHandleProps={
        dragHandleProps
      }
      footer={
        <div className="aof3-footer-skin">
          <IXIFaceActionFooter />
        </div>
      }
    >

      <div className="aof3-certificate-inner">

        {/* ================================================
            HEADER
            ================================================ */}

        <header className="aof3-head">

          <strong>
            PRIVATE DEALER WORKSHEET
          </strong>

          <span>
            IXI DEALER BID PACK™
          </span>

        </header>


        <div className="aof3-ornament aof3-ornament-top">
          <span />
          <b>◆</b>
          <span />
        </div>


        <div className="aof3-machine-line">

          <strong>
            {machineLabel}
          </strong>

          {hourLabel
            ? (
              <>
                <span>
                  •
                </span>

                <strong>
                  {Number(
                    cleanNumber(
                      hourLabel
                    )
                  ).toLocaleString(
                    "en-US"
                  )} HRS
                </strong>
              </>
            )
            : null}

        </div>


        {/* ================================================
            ESTIMATED RETAIL
            ================================================ */}

        <section
          className="
            ledger-panel
            ledger-panel-major
            aof3-sale-section
          "
        >

          <div className="aof3-sale-title">
            EST RETAIL SALE PRICE
          </div>


          <div className="aof3-sale-money">

            <span className="aof3-sale-dollar">
              $
            </span>

            <MoneyInput
              className="aof3-sale-input"
              value={
                estimatedSalePrice
              }
              onChange={
                setEstimatedSalePrice
              }
              onSave={
                saveBidPack
              }
              showPrefix={
                false
              }
            />

          </div>


          <div className="aof3-sale-rule">
            <span />
            <b>◇</b>
            <span />
          </div>


          <div className="aof3-advertised-row">

            <MiniValue
              label="LOW ADV"
              value={
                lowAdvertised
              }
              onChange={
                setLowAdvertised
              }
              onSave={
                saveBidPack
              }
            />


            <MiniValue
              label="AVG ADV"
              value={
                averageAdvertised
              }
              onChange={
                setAverageAdvertised
              }
              onSave={
                saveBidPack
              }
            />

          </div>

        </section>


        {/* ================================================
            COST PANELS
            ================================================ */}

        <div className="aof3-cost-grid">

          <section
            className="
              aof3-cost-panel
              ledger-panel
            "
          >

            <LedgerRow
              label="MY BID"
              input
              value={
                myBid
              }
              onChange={
                setMyBid
              }
              onSave={
                saveBidPack
              }
              emphasized
            />


            <LedgerRow
              label="COMM."
              value={
                money(
                  mainScenario
                    .commission
                )
              }
              muted
            />


            <LedgerRow
              label="FREIGHT 1"
              input
              value={
                freight1
              }
              onChange={
                setFreight1
              }
              onSave={
                saveBidPack
              }
            />


            <LedgerRow
              label="FREIGHT 2"
              input
              value={
                freight2
              }
              onChange={
                setFreight2
              }
              onSave={
                saveBidPack
              }
            />

          </section>


          <section
            className="
              aof3-cost-panel
              ledger-panel
            "
          >

            <LedgerRow
              label="TECH"
              input
              value={
                tech
              }
              onChange={
                setTech
              }
              onSave={
                saveBidPack
              }
            />


            <LedgerRow
              label="CLEAN"
              input
              value={
                clean
              }
              onChange={
                setClean
              }
              onSave={
                saveBidPack
              }
            />


            <LedgerRow
              label="PARTS"
              input
              value={
                parts
              }
              onChange={
                setParts
              }
              onSave={
                saveBidPack
              }
            />


            <LedgerRow
              label="LABOR"
              input
              value={
                labor
              }
              onChange={
                setLabor
              }
              onSave={
                saveBidPack
              }
            />


            <LedgerRow
              label="PRE DELIVERY"
              input
              value={
                preDelivery
              }
              onChange={
                setPreDelivery
              }
              onSave={
                saveBidPack
              }
            />

          </section>

        </div>


        {/* ================================================
            TOTALS
            ================================================ */}

        <section
          className="
            aof3-total-grid
            ledger-panel
          "
        >

          <LedgerSummary
            label="TOTAL COST"
            value={
              money(
                mainScenario
                  .totalCost
              )
            }
          />


          <LedgerSummary
            label="TOTAL PROFIT"
            value={
              money(
                mainScenario
                  .totalProfit
              )
            }
            detail={
              percentage(
                mainScenario
                  .profitPercent
              )
            }
            accent={
              mainScenario
                .totalProfit >=
              0
            }
            negative={
              mainScenario
                .totalProfit <
              0
            }
          />

        </section>


        {/* ================================================
            BID PACK ANALYSIS
            ================================================ */}

        <section
          className="
            aof3-bid-pack
            ledger-panel
          "
        >

          <div className="aof3-bid-pack-title">

            <span />

            <strong>
              BID PACK ANALYSIS
            </strong>

            <span />

          </div>


          <div className="aof3-bid-pack-grid">

            {bidScenarios.map(
              (
                scenario,
                index
              ) => (
                <BidScenario
                  key={
                    `${scenario.bid}-${index}`
                  }
                  scenario={
                    scenario
                  }
                  scenarioNumber={
                    index +
                    1
                  }
                  active={
                    index ===
                    2
                  }
                />
              )
            )}

          </div>

        </section>


        <div className="aof3-bottom-ornament">
          <span />
          <b>◆</b>
          <span />
        </div>

      </div>


      {/* ===================================================
          COMPLETE CERTIFICATE SKIN
          =================================================== */}

      <style jsx>{`

  /* =======================================================
     AOF3 — PRIVATE DEALER WORKSHEET
     CERTIFICATE / LEDGER SKIN

     IMPORTANT FACE LAB RULE:

     IXI SHELL OWNS:
     - outer perimeter
     - outer radius
     - object rail
     - card edge

     THIS FACE OWNS:
     - parchment paint
     - internal panels
     - typography
     - internal ornament
     - action presentation

     THE FACE BACKGROUND CONTINUES THROUGH THE
     FINAL 19PX IXI RAIL ZONE.

     DO NOT DRAW A SECOND CARD SHELL HERE.
     ======================================================= */


  /* =======================================================
     ROOT FACE PAINT

     NO BORDER.
     NO RADIUS.
     NO SECOND SHELL.
     NO OUTER SHADOW.

     The IXI shell already does all of that.
     ======================================================= */

  :global(.aof3-certificate) {

    --aof3-paper-00:
      #fffaf0;

    --aof3-paper-01:
      #faeed5;

    --aof3-paper-02:
      #f2dfba;

    --aof3-paper-03:
      #ead2a7;

    --aof3-paper-04:
      #ddbf8c;

    --aof3-ink:
      #2b1a11;

    --aof3-ink-2:
      #4c3120;

    --aof3-ink-soft:
      #73533c;

    --aof3-gold:
      #98610a;

    --aof3-gold-deep:
      #754704;

    --aof3-line:
      rgba(
        120,
        78,
        37,
        .49
      );

    --aof3-line-soft:
      rgba(
        120,
        78,
        37,
        .20
      );

    --aof3-rail-height:
      19px;


    position:
      relative !important;


    color:
      var(
        --aof3-ink
      ) !important;


    /*
     * DO NOT EDGE THE FACE.
     * IXIFaceFrame / IXI shell owns it.
     */

    border:
      0 !important;

    border-radius:
      0 !important;

    box-shadow:
      none !important;


    /*
     * THIS is what fixes the exposed black strip.
     *
     * The root face itself is parchment,
     * including whatever area exists beneath
     * the visible content/footer and behind
     * the IXI object rail.
     */

    background:

      radial-gradient(
        circle
          at
          14%
          8%,
        rgba(
          255,
          255,
          255,
          .42
        )
          0%,
        rgba(
          255,
          255,
          255,
          0
        )
          30%
      ),

      radial-gradient(
        circle
          at
          84%
          72%,
        rgba(
          115,
          73,
          30,
          .055
        )
          0%,
        rgba(
          115,
          73,
          30,
          0
        )
          34%
      ),

      repeating-linear-gradient(
        0deg,
        rgba(
          92,
          58,
          29,
          .010
        )
          0px,
        rgba(
          92,
          58,
          29,
          .010
        )
          1px,
        transparent
          1px,
        transparent
          4px
      ),

      linear-gradient(
        180deg,
        var(
          --aof3-paper-00
        )
          0%,
        var(
          --aof3-paper-01
        )
          30%,
        var(
          --aof3-paper-02
        )
          72%,
        var(
          --aof3-paper-03
        )
          100%
      ) !important;


    font-variant-numeric:
      tabular-nums
      lining-nums;
  }



  /* =======================================================
     FACE CONTENT

     Paint reaches full width/height.

     Bottom spacing deliberately reserves the
     IXI 19px rail without turning that region
     black.
     ======================================================= */

  :global(.aof3-content) {

    position:
      relative !important;


    display:
      flex !important;


    flex-direction:
      column !important;


    width:
      100% !important;


    height:
      100% !important;


    min-height:
      0 !important;


    box-sizing:
      border-box !important;


    padding:
      8px
      9px
      4px !important;


    gap:
      5px;


    overflow:
      hidden !important;


    color:
      var(
        --aof3-ink
      ) !important;


    /*
     * Same parchment recipe as root.
     * No visual seam between content/footer.
     */

    background:

      radial-gradient(
        circle
          at
          12%
          8%,
        rgba(
          255,
          255,
          255,
          .44
        )
          0%,
        rgba(
          255,
          255,
          255,
          0
        )
          31%
      ),

      radial-gradient(
        circle
          at
          87%
          72%,
        rgba(
          125,
          83,
          37,
          .050
        )
          0%,
        rgba(
          125,
          83,
          37,
          0
        )
          35%
      ),

      repeating-linear-gradient(
        0deg,
        rgba(
          89,
          58,
          31,
          .010
        )
          0px,
        rgba(
          89,
          58,
          31,
          .010
        )
          1px,
        transparent
          1px,
        transparent
          4px
      ),

      linear-gradient(
        180deg,
        var(
          --aof3-paper-00
        )
          0%,
        var(
          --aof3-paper-01
        )
          28%,
        var(
          --aof3-paper-02
        )
          69%,
        var(
          --aof3-paper-03
        )
          100%
      ) !important;
  }



  /*
   * NO full card perimeter here.
   *
   * These are only subtle INTERNAL certificate
   * lines so it looks printed, not double-shelled.
   */

  :global(.aof3-content::before) {

    content:
      "";


    position:
      absolute;


    inset:
      5px
      6px
      3px;


    z-index:
      0;


    pointer-events:
      none;


    border:
      1px solid
      rgba(
        148,
        97,
        38,
        .29
      );


    border-radius:
      5px;
  }


  :global(.aof3-content::after) {

    content:
      "";


    position:
      absolute;


    left:
      8px;

    right:
      8px;

    top:
      7px;

    bottom:
      5px;


    z-index:
      0;


    pointer-events:
      none;


    border:
      1px solid
      rgba(
        148,
        97,
        38,
        .11
      );


    border-radius:
      4px;
  }



  /* =======================================================
     CONTENT STACK
     ======================================================= */

  .aof3-certificate-inner {

    position:
      relative;


    z-index:
      1;


    display:
      flex;


    flex:
      1
      1
      auto;


    min-height:
      0;


    flex-direction:
      column;


    gap:
      5px;


    padding:
      1px
      2px
      0;
  }



  /* =======================================================
     HEADER
     ======================================================= */

  .aof3-head {

    min-height:
      17px;


    display:
      flex;


    align-items:
      center;


    justify-content:
      space-between;


    gap:
      8px;


    padding:
      0
      3px;


    color:
      var(
        --aof3-ink
      );


    font-family:
      Arial,
      Helvetica,
      sans-serif;


    font-size:
      7.5px;


    font-weight:
      900;


    line-height:
      1;


    letter-spacing:
      .26px;


    text-transform:
      uppercase;
  }


  .aof3-head strong,
  .aof3-head span {

    overflow:
      hidden;


    text-overflow:
      ellipsis;


    white-space:
      nowrap;
  }


  .aof3-head span {

    font-weight:
      950;
  }



  /* =======================================================
     ORNAMENT
     ======================================================= */

  .aof3-ornament {

    display:
      grid;


    grid-template-columns:
      30px
      auto
      30px;


    align-items:
      center;


    justify-content:
      center;


    gap:
      4px;


    height:
      6px;


    color:
      var(
        --aof3-gold
      );
  }


  .aof3-ornament span {

    height:
      1px;


    background:
      linear-gradient(
        90deg,
        transparent,
        rgba(
          154,
          99,
          11,
          .68
        ),
        transparent
      );
  }


  .aof3-ornament b {

    font-family:
      Georgia,
      "Times New Roman",
      serif;


    font-size:
      6px;


    font-weight:
      400;
  }



  /* =======================================================
     MACHINE
     ======================================================= */

  .aof3-machine-line {

    min-height:
      18px;


    display:
      flex;


    align-items:
      center;


    justify-content:
      center;


    gap:
      4px;


    overflow:
      hidden;


    padding:
      0
      4px;


    color:
      var(
        --aof3-ink
      );


    font-family:
      Georgia,
      "Times New Roman",
      serif;


    font-size:
      8.3px;


    font-weight:
      800;


    line-height:
      1.1;


    letter-spacing:
      .19px;


    text-align:
      center;


    text-transform:
      uppercase;


    white-space:
      nowrap;
  }


  .aof3-machine-line strong {

    min-width:
      0;


    overflow:
      hidden;


    text-overflow:
      ellipsis;


    white-space:
      nowrap;
  }


  .aof3-machine-line span {

    flex:
      0
      0
      auto;


    color:
      var(
        --aof3-gold
      );
  }



  /* =======================================================
     INTERNAL PANELS

     THESE ARE MODULE PANELS — GOOD.
     They are not card shells.
     ======================================================= */

  .ledger-panel {

    position:
      relative;


    min-width:
      0;


    border:
      1px solid
      rgba(
        151,
        103,
        48,
        .57
      );


    border-radius:
      6px;


    background:

      linear-gradient(
        180deg,
        rgba(
          255,
          255,
          255,
          .28
        ),
        rgba(
          255,
          255,
          255,
          .06
        )
      ),

      rgba(
        247,
        231,
        198,
        .34
      );


    box-shadow:

      inset
      0
      0
      0
      1px
      rgba(
        255,
        255,
        255,
        .23
      ),

      0
      1px
      2px
      rgba(
        71,
        42,
        20,
        .08
      );
  }



  /* =======================================================
     RETAIL SALE PRICE
     ======================================================= */

  .aof3-sale-section {

    flex:
      0
      0
      77px;


    padding:
      7px
      10px
      6px;


    border-color:
      rgba(
        158,
        103,
        35,
        .66
      );
  }


  .aof3-sale-title {

    color:
      var(
        --aof3-ink-2
      );


    font-family:
      Arial,
      Helvetica,
      sans-serif;


    font-size:
      8.2px;


    font-weight:
      900;


    line-height:
      1;


    letter-spacing:
      .42px;


    text-align:
      center;


    text-transform:
      uppercase;
  }


  .aof3-sale-money {

    height:
      32px;


    display:
      flex;


    align-items:
      center;


    justify-content:
      center;


    gap:
      1px;


    margin-top:
      1px;
  }


  .aof3-sale-dollar {

    color:
      var(
        --aof3-ink
      );


    font-family:
      Georgia,
      "Times New Roman",
      serif;


    font-size:
      21px;


    font-weight:
      700;


    line-height:
      1;
  }


  :global(.aof3-sale-input) {

    width:
      104px !important;


    min-width:
      104px !important;


    max-width:
      104px !important;


    height:
      31px !important;


    margin:
      0 !important;


    padding:
      0 !important;


    border:
      0 !important;


    border-radius:
      0 !important;


    outline:
      none !important;


    background:
      transparent !important;


    color:
      var(
        --aof3-ink
      ) !important;


    font-family:
      Georgia,
      "Times New Roman",
      serif !important;


    font-size:
      20px !important;


    font-weight:
      900 !important;


    line-height:
      31px !important;


    letter-spacing:
      -.35px;


    text-align:
      left !important;
  }


  .aof3-sale-rule {

    display:
      grid;


    grid-template-columns:
      minmax(
        0,
        1fr
      )
      auto
      minmax(
        0,
        1fr
      );


    align-items:
      center;


    gap:
      5px;


    height:
      5px;


    padding:
      0
      13px;


    color:
      var(
        --aof3-gold
      );
  }


  .aof3-sale-rule span {

    height:
      1px;


    background:
      rgba(
        151,
        103,
        48,
        .53
      );
  }


  .aof3-sale-rule b {

    font-size:
      7px;


    font-weight:
      400;
  }


  .aof3-advertised-row {

    display:
      grid;


    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );


    align-items:
      center;


    gap:
      16px;


    margin-top:
      1px;
  }



  /* =======================================================
     COST GRID
     ======================================================= */

  .aof3-cost-grid {

    flex:
      0
      0
      91px;


    display:
      grid;


    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );


    gap:
      5px;


    min-width:
      0;
  }


  .aof3-cost-panel {

    min-width:
      0;


    padding:
      6px
      7px
      5px;
  }



  /* =======================================================
     TOTALS
     ======================================================= */

  .aof3-total-grid {

    position:
      relative;


    flex:
      0
      0
      58px;


    display:
      grid;


    grid-template-columns:
      repeat(
        2,
        minmax(
          0,
          1fr
        )
      );


    overflow:
      hidden;


    padding:
      0;
  }


  .aof3-total-grid::after {

    content:
      "";


    position:
      absolute;


    top:
      8px;


    bottom:
      8px;


    left:
      50%;


    width:
      1px;


    background:
      rgba(
        151,
        103,
        48,
        .39
      );
  }



  /* =======================================================
     BID PACK ANALYSIS

     LARGE / READABLE.
     ======================================================= */

  .aof3-bid-pack {

    flex:
      1
      1
      auto;


    min-height:
      78px;


    padding:
      6px
      6px
      7px;


    display:
      flex;


    flex-direction:
      column;
  }


  .aof3-bid-pack-title {

    flex:
      0
      0
      14px;


    display:
      grid;


    grid-template-columns:
      minmax(
        0,
        1fr
      )
      auto
      minmax(
        0,
        1fr
      );


    align-items:
      center;


    gap:
      6px;


    margin-bottom:
      4px;


    color:
      var(
        --aof3-ink
      );
  }


  .aof3-bid-pack-title strong {

    font-family:
      Arial,
      Helvetica,
      sans-serif;


    font-size:
      8px;


    font-weight:
      950;


    line-height:
      1;


    letter-spacing:
      .42px;


    text-align:
      center;


    text-transform:
      uppercase;


    white-space:
      nowrap;
  }


  .aof3-bid-pack-title span {

    height:
      1px;


    background:
      linear-gradient(
        90deg,
        transparent,
        rgba(
          112,
          74,
          39,
          .47
        ),
        transparent
      );
  }


  .aof3-bid-pack-grid {

    flex:
      1
      1
      auto;


    min-height:
      0;


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



  /* =======================================================
     BOTTOM ORNAMENT
     ======================================================= */

  .aof3-bottom-ornament {

    flex:
      0
      0
      5px;


    display:
      grid;


    grid-template-columns:
      18px
      auto
      18px;


    align-items:
      center;


    justify-content:
      center;


    gap:
      3px;


    color:
      var(
        --aof3-gold
      );
  }


  .aof3-bottom-ornament span {

    height:
      1px;


    background:
      rgba(
        154,
        99,
        11,
        .46
      );
  }


  .aof3-bottom-ornament b {

    font-size:
      5px;


    line-height:
      1;
  }



  /* =======================================================
     ACTION FOOTER

     IMPORTANT:
     BUTTONS STAY ABOVE RAIL.

     WE DO NOT MOVE THE BUTTONS INTO THE FINAL
     19PX.

     THE ROOT PARCHMENT BEHIND THEM CONTINUES
     INTO THAT ZONE INSTEAD.
     ======================================================= */

  :global(.aof3-footer-skin) {

    position:
      relative;


    z-index:
      2;


    width:
      100%;


    min-height:
      42px;


    display:
      flex;


    align-items:
      center;


    box-sizing:
      border-box;


    padding:
      6px
      10px
      8px;


    /*
     * NO OUTER FACE BORDER HERE.
     */

    border:
      0 !important;


    border-top:
      1px solid
      rgba(
        128,
        82,
        36,
        .34
      ) !important;


    /*
     * Same parchment.
     */

    background:

      linear-gradient(
        180deg,
        rgba(
          255,
          255,
          255,
          .14
        ),
        rgba(
          255,
          255,
          255,
          0
        )
      ),

      linear-gradient(
        180deg,
        #f0dcba
          0%,
        #e8cca0
          100%
      ) !important;


    box-shadow:
      inset
      0
      1px
      0
      rgba(
        255,
        255,
        255,
        .32
      ) !important;
  }


  :global(.aof3-footer-skin > *) {

    width:
      100%;
  }


  :global(.aof3-footer-skin button) {

    min-height:
      28px !important;


    color:
      var(
        --aof3-ink
      ) !important;


    border:
      1px solid
      rgba(
        126,
        82,
        38,
        .46
      ) !important;


    border-radius:
      4px !important;


    background:

      linear-gradient(
        180deg,
        rgba(
          255,
          255,
          255,
          .34
        ),
        rgba(
          144,
          92,
          34,
          .04
        )
      ) !important;


    box-shadow:

      inset
      0
      0
      0
      1px
      rgba(
        255,
        255,
        255,
        .18
      ),

      0
      1px
      1px
      rgba(
        69,
        42,
        20,
        .08
      ) !important;


    font-family:
      Arial,
      Helvetica,
      sans-serif !important;


    font-size:
      7px !important;


    font-weight:
      900 !important;


    letter-spacing:
      .28px !important;


    text-transform:
      uppercase !important;
  }


  :global(.aof3-footer-skin button:hover) {

    border-color:
      var(
        --aof3-gold
      ) !important;


    background:
      rgba(
        172,
        111,
        22,
        .10
      ) !important;
  }


  :global(.aof3-footer-skin button svg) {

    color:
      var(
        --aof3-ink
      ) !important;


    fill:
      currentColor !important;
  }



  /* =======================================================
     THE 19PX RAIL PAINT EXTENSION

     This pseudo-element paints ONLY behind
     the IXI rail area.

     It belongs to the face skin visually,
     but the actual IXI rail remains above it.
     ======================================================= */

  :global(.aof3-certificate::after) {

    content:
      "";


    position:
      absolute;


    z-index:
      0;


    pointer-events:
      none;


    left:
      0;


    right:
      0;


    bottom:
      0;


    height:
      var(
        --aof3-rail-height
      );


    border:
      0;


    border-radius:
      0;


    background:

      linear-gradient(
        180deg,
        #ead0a3
          0%,
        #e2c28e
          100%
      ) !important;
  }



  /* =======================================================
     INPUT GLOBALS
     ======================================================= */

  :global(.aof3-certificate input) {

    box-sizing:
      border-box;


    caret-color:
      var(
        --aof3-ink
      );


    outline:
      none;
  }


  :global(.aof3-certificate input::selection) {

    background:
      rgba(
        165,
        111,
        28,
        .20
      );
  }

`         `}</style>

    </IXIFaceFrame>
  );
}
