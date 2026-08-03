import {
  useMemo,
  useState
} from "react";

import IXIFaceFrame
  from "../ixi-face-studio/IXIFaceFrame";

import IXIFaceActionFooter
  from "../ixi-face-studio/IXIFaceActionFooter";

import IXIFaceGrid
  from "../ixi-face-studio/IXIFaceGrid";

import IXIFaceSummaryCard
  from "../ixi-face-studio/IXIFaceSummaryCard";

import {
  getAuctionData,
  getAuctionTermsData,
  getPublicData
} from "./auctionObjectSelectors";

function cleanNumber(value = "") {
  const cleaned = String(
    value ?? ""
  ).replace(
    /[^0-9.]/g,
    ""
  );

  const parsed = Number(cleaned);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function money(value = 0) {
  const amount =
    Number.isFinite(Number(value))
      ? Number(value)
      : 0;

  return amount.toLocaleString(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }
  );
}

function percentage(value = 0) {
  const amount =
    Number.isFinite(Number(value))
      ? Number(value)
      : 0;

  return `${amount.toFixed(1)}%`;
}

function getBuyerPremiumData(
  listing = {}
) {
  const auction =
    getAuctionData(listing);

  const terms =
    getAuctionTermsData(listing);

  const auctionRules =
    auction?.auctionRules || {};

  return (
    auctionRules?.buyerPremium ||
    auction?.buyerPremium ||
    terms?.buyerPremium ||
    terms?.buyersPremium ||
    {}
  );
}

function getBuyerPremiumTiers(
  listing = {}
) {
  const premium =
    getBuyerPremiumData(listing);

  if (
    Array.isArray(
      premium?.purchaseTiers
    )
  ) {
    return premium.purchaseTiers;
  }

  if (
    Array.isArray(
      premium?.tiers
    )
  ) {
    return premium.tiers;
  }

  return [];
}

function calculateCommission(
  listing,
  bidAmount
) {
  const bid =
    cleanNumber(bidAmount);

  if (!bid) {
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
    tiers.find(tier => {
      const minimum =
        cleanNumber(
          tier?.minAmountExclusive ??
          tier?.minAmount ??
          tier?.minimumAmount ??
          0
        );

      const maximumRaw =
        tier?.maxAmount ??
        tier?.maximumAmount;

      const maximum =
        maximumRaw === null ||
        maximumRaw === undefined ||
        maximumRaw === ""
          ? null
          : cleanNumber(
              maximumRaw
            );

      const minimumIsExclusive =
        tier?.minAmountExclusive !==
        null &&
        tier?.minAmountExclusive !==
        undefined;

      const passesMinimum =
        minimumIsExclusive
          ? bid > minimum
          : bid >= minimum;

      const passesMaximum =
        maximum === null ||
        bid <= maximum;

      return (
        passesMinimum &&
        passesMaximum
      );
    });

  if (matchingTier) {
    const flatFee =
      cleanNumber(
        matchingTier?.flatFee
      );

    if (flatFee) {
      return flatFee;
    }

    const ratePercent =
      cleanNumber(
        matchingTier
          ?.cashCheckWireRatePercent ??
        matchingTier?.ratePercent ??
        matchingTier?.percent
      );

    const minimumFee =
      cleanNumber(
        matchingTier?.minimumFee
      );

    if (ratePercent) {
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
      premium?.flatFee
    );

  if (flatFee) {
    return flatFee;
  }

  const ratePercent =
    cleanNumber(
      premium?.ratePercent ??
      premium?.percent ??
      premium?.rate
    );

  const minimumFee =
    cleanNumber(
      premium?.minimumFee
    );

  const capAmount =
    cleanNumber(
      premium?.capAmount
    );

  if (ratePercent) {
    let calculated =
      bid *
      (
        ratePercent /
        100
      );

    if (minimumFee) {
      calculated =
        Math.max(
          calculated,
          minimumFee
        );
    }

    if (capAmount) {
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
        ) * 100
      : 0;

  return {
    bid,
    commission,
    totalCost,
    totalProfit,
    profitPercent
  };
}

export default function IXIAuctionObjectFace3({
  listing = {},

  dealerBidPack = {},
  onSaveDealerBidPack,

  faceSize = "tall",

  dragHandleProps
}) {
  const publicData =
    getPublicData(listing);

  const year =
    listing?.year ||
    publicData?.year ||
    "";

  const make =
    listing?.make ||
    publicData?.make ||
    "";

  const model =
    listing?.model ||
    publicData?.model ||
    "";

  const hours =
    listing?.hours ||
    publicData?.hours ||
    "";

  const openingValue =
    cleanNumber(
      listing?.price ??
      publicData?.price ??
      0
    );

 const [
  estimatedSalePrice,
  setEstimatedSalePrice
] = useState(
  cleanNumber(
    dealerBidPack
      ?.estimatedSalePrice ??
    openingValue
  )
);

const [
  lowAdvertised,
  setLowAdvertised
] = useState(
  cleanNumber(
    dealerBidPack
      ?.lowAdvertised
  )
);
 const [
  averageAdvertised,
  setAverageAdvertised
] = useState(
  cleanNumber(
    dealerBidPack
      ?.averageAdvertised
  )
);
 const [
  myBid,
  setMyBid
] = useState(
  cleanNumber(
    dealerBidPack?.myBid ??
    openingValue
  )
);

 const [
  freight1,
  setFreight1
] = useState(
  cleanNumber(
    dealerBidPack?.freight1
  )
);

const [
  freight2,
  setFreight2
] = useState(
  cleanNumber(
    dealerBidPack?.freight2
  )
);

const [
  tech,
  setTech
] = useState(
  cleanNumber(
    dealerBidPack?.tech
  )
);

const [
  clean,
  setClean
] = useState(
  cleanNumber(
    dealerBidPack?.clean
  )
);

const [
  parts,
  setParts
] = useState(
  cleanNumber(
    dealerBidPack?.parts
  )
);

const [
  labor,
  setLabor
] = useState(
  cleanNumber(
    dealerBidPack?.labor
  )
);

const [
  preDelivery,
  setPreDelivery
] = useState(
  cleanNumber(
    dealerBidPack
      ?.preDelivery
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
          bid: myBid,
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
          myBid + 5000,
          myBid + 2500,
          myBid,
          Math.max(
            myBid - 2500,
            0
          ),
          Math.max(
            myBid - 5000,
            0
          )
        ].map(bid =>
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

  return (
 <IXIFaceFrame
  className="aof3"
  contentClassName="aof3-content"
  size={faceSize}
  dragHandleProps={
    dragHandleProps
  }
  footer={
    <IXIFaceActionFooter />
  }
>
      <header className="aof3-head">
        <span>
          PRIVATE DEALER WORKSHEET
        </span>

        <strong>
          IXI DEALER BID PACK™
        </strong>
      </header>

      <div className="aof3-machine-line">
        {[
          year,
          make,
          model
        ]
          .filter(Boolean)
          .join(" ")}

        {hours
          ? (
              ` • ${String(hours)
                .replace(
                  /hrs|hours/gi,
                  ""
                )
                .trim()} HRS`
            )
          : ""}
      </div>

      <section className="aof3-sale-value">
        <span>
          EST SALE PRICE
        </span>

        <MoneyInput
          className="aof3-sale-input"
          value={
            estimatedSalePrice
          }
          onChange={
            setEstimatedSalePrice
          }
          onSave={saveBidPack}
        />

        <div className="aof3-advertised-row">
          <MiniValue
            label="LOW ADV"
            value={
              lowAdvertised
            }
            onChange={
              setLowAdvertised
            }
            onSave={saveBidPack}
          />

          <MiniValue
            label="AVG ADV"
            value={
              averageAdvertised
            }
            onChange={
              setAverageAdvertised
            }
            onSave={saveBidPack}            
          />
        </div>
      </section>

      <div className="aof3-grid">
        <div className="aof3-panel">
          <Row
            label="MY BID"
            input
            value={myBid}
            onChange={setMyBid}
            onSave={saveBidPack}            
            emphasized
          />

          <Row
            label="COMM."
            value={money(
              mainScenario
                .commission
            )}
            muted
          />

          <Row
            label="FREIGHT 1"
            input
            value={freight1}
            onChange={setFreight1}
            onSave={saveBidPack}
          />

          <Row
            label="FREIGHT 2"
            input
            value={freight2}
            onChange={setFreight2}
            onSave={saveBidPack}
          />
        </div>

        <div className="aof3-panel">
          <Row
            label="TECH"
            input
            value={tech}
            onChange={setTech}
            onSave={saveBidPack}
          />

          <Row
            label="CLEAN"
            input
            value={clean}
            onChange={setClean}
            onSave={saveBidPack}
          />

          <Row
            label="PARTS"
            input
            value={parts}
            onChange={setParts}
            onSave={saveBidPack}
          />

          <Row
            label="LABOR"
            input
            value={labor}
            onChange={setLabor}
            onSave={saveBidPack}
          />

          <Row
            label="PRE DELIVERY"
            input
            value={preDelivery}
            onChange={setPreDelivery}
            onSave={saveBidPack}
          />
        </div>
      </div>

      <IXIFaceGrid
  columns={2}
  gap="sm"
  className="aof3-total-grid"
>
  <IXIFaceSummaryCard
    label="TOTAL COST"
    value={
      money(
        mainScenario
          .totalCost
      )
    }
    compact
  />

  <IXIFaceSummaryCard
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
    tone={
      mainScenario.totalProfit < 0
        ? "negative"
        : "accent"
    }
    compact
  />
</IXIFaceGrid>

      <section className="aof3-bid-pack">
        <div className="aof3-bid-pack-title">
          BID PACK ANALYSIS
        </div>

        <div className="aof3-bid-pack-grid">
          {bidScenarios.map(
            (
              scenario,
              index
            ) => (
              <BidScenario
                key={`${scenario.bid}-${index}`}
                scenario={
                  scenario
                }
                active={
                  index === 2
                }
              />
            )
          )}
        </div>
</section>

<style jsx>{`
        :global(.aof3-content) {
  display: flex;
  flex-direction: column;

  gap: 6px;

  overflow: hidden;
}
        .aof3-head {
          height: 16px;

          position: relative;
          top: -2px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 8px;

          color:
            rgba(
              255,
              255,
              255,
              .48
            );

          font-size: 7.2px;
          font-weight: 950;
          letter-spacing: .44px;

          text-transform: uppercase;
        }

        .aof3-head strong {
          color: #ffc400;

          font-size: 7.7px;
          font-weight: 950;
          letter-spacing: .52px;
        }

        .aof3-machine-line {
          min-height: 15px;

          color:
            rgba(
              255,
              255,
              255,
              .56
            );

          font-size: 7.2px;
          font-weight: 950;
          line-height: 1.15;
          letter-spacing: .28px;

          text-align: center;
          text-transform: uppercase;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .aof3-sale-value {
          min-height: 66px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          padding: 6px 10px;

          border:
            1px solid
            rgba(
              255,
              196,
              0,
              .16
            );

          border-radius: 8px;

          background:
            linear-gradient(
              180deg,
              rgba(
                255,
                196,
                0,
                .065
              ),
              rgba(
                255,
                196,
                0,
                .012
              )
            ),
            rgba(
              0,
              0,
              0,
              .32
            );

          box-shadow:
            inset 0 1px 0
            rgba(
              255,
              255,
              255,
              .03
            );
        }

        .aof3-sale-value > span {
          color:
            rgba(
              255,
              255,
              255,
              .46
            );

          font-size: 7.4px;
          font-weight: 950;
          letter-spacing: .58px;

          text-transform: uppercase;
        }

        :global(.aof3-sale-input) {
          width: 104px;
          height: 23px;

          margin-top: 2px;

          border: 0;
          border-bottom:
            2px solid
            rgba(
              255,
              196,
              0,
              .48
            );

          border-radius: 0;

          background: transparent;
          color: #ffc400;

          padding: 0 3px;

          font-size: 16px;
          font-weight: 950;
          line-height: 1;

          text-align: center;
          outline: none;
        }

        .aof3-advertised-row {
          width: 100%;

          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            minmax(0, 1fr);

          gap: 20px;

          margin-top: 4px;
        }

        .aof3-grid {
          display: grid;

          grid-template-columns:
            minmax(0, 1fr)
            minmax(0, 1fr);

          gap: 7px;
        }

        .aof3-panel {
          min-width: 0;

          padding: 6px 7px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .07
            );

          border-radius: 7px;

          background:
            linear-gradient(
              180deg,
              rgba(
                255,
                255,
                255,
                .025
              ),
              rgba(
                255,
                255,
                255,
                0
              )
            ),
            rgba(
              10,
              10,
              10,
              .46
            );

          box-shadow:
            inset 0 1px 0
            rgba(
              255,
              255,
              255,
              .035
            );
        }

        :global(.aof3-row) {
          min-height: 17px;

          display: grid;

          grid-template-columns:
            61px
            minmax(0, 1fr);

          align-items: center;

          gap: 4px;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .035
            );
        }

        :global(.aof3-row:last-child) {
          border-bottom: 0;
        }

        :global(.aof3-label) {
          color:
            rgba(
              255,
              255,
              255,
              .42
            );

          font-size: 6.8px;
          font-weight: 950;
          letter-spacing: .3px;

          text-transform: uppercase;
          white-space: nowrap;
        }

        :global(.aof3-value) {
          color:
            rgba(
              255,
              255,
              255,
              .84
            );

          font-size: 7.8px;
          font-weight: 950;

          text-align: right;
          white-space: nowrap;
        }

        :global(.aof3-value.muted) {
          color:
            rgba(
              255,
              196,
              0,
              .84
            );
        }

        :global(.aof3-input) {
          width: 58px;
          min-width: 58px;
          max-width: 58px;

          height: 14px;

          justify-self: end;

          border: 0;

          border-bottom:
            2px solid
            rgba(
              255,
              255,
              255,
              .16
            );

          border-radius: 0;

          background: transparent;
          color:
            rgba(
              255,
              255,
              255,
              .88
            );

          padding: 0 2px;

          font-size: 7.8px;
          font-weight: 950;

          text-align: right;
          outline: none;
        }

        :global(.aof3-input.emphasized) {
          color: #ffc400;

          border-bottom-color:
            rgba(
              255,
              196,
              0,
              .48
            );
        }

        :global(.aof3-input:focus) {
          border-bottom-color:
            rgba(
              255,
              196,
              0,
              .78
            );

          box-shadow:
            0 3px 8px
            rgba(
              255,
              196,
              0,
              .10
            );
        }

        

       

      

     
       :global(.aof3-total-grid) {
  min-height: 46px;
}

        .aof3-bid-pack {
          min-height: 66px;

          padding: 5px 5px 6px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .065
            );

          border-radius: 7px;

          background:
            rgba(
              8,
              8,
              8,
              .48
            );
        }

        .aof3-bid-pack-title {
          margin-bottom: 4px;

          color:
            rgba(
              255,
              255,
              255,
              .38
            );

          font-size: 6.3px;
          font-weight: 950;
          letter-spacing: .5px;

          text-align: center;
          text-transform: uppercase;
        }

        .aof3-bid-pack-grid {
          display: grid;

          grid-template-columns:
            repeat(
              5,
              minmax(
                0,
                1fr
              )
            );

          gap: 4px;
        }
      `}</style>
  </IXIFaceFrame>
  );
}

function MoneyInput({
  value,
  onChange,
  onSave,
  className = ""
}) {
  return (
    <input
      className={className}
      value={
        value
          ? Number(value).toLocaleString("en-US")
          : ""
      }
      inputMode="numeric"

      onPointerDown={event => {
        event.stopPropagation();
      }}

      onChange={event => {
        onChange?.(
          cleanNumber(event.target.value)
        );
      }}

      onBlur={() => {
        onSave?.();
      }}

      onKeyDown={event => {
        if (event.key !== "Enter") return;

        event.preventDefault();
        event.stopPropagation();

        onSave?.();

        event.currentTarget.blur();
      }}
    />
  );
}
function MiniValue({
  label,
  value,
  onChange,
  onSave
}) {
  return (
    <label className="aof3-mini-value">
      <span>{label}</span>

      <MoneyInput
  value={value}
  onChange={onChange}
  onSave={onSave}
  className="aof3-mini-input"
/>

      <style jsx>{`
        .aof3-mini-value {
          min-width: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 5px;
        }

        .aof3-mini-value span {
          color:
            rgba(
              255,
              255,
              255,
              .34
            );

          font-size: 6.2px;
          font-weight: 950;
          letter-spacing: .38px;

          text-transform: uppercase;
          white-space: nowrap;
        }

        :global(.aof3-mini-input) {
          width: 60px;
          height: 13px;

          border: 0;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .18
            );

          background: transparent;

          color:
            rgba(
              255,
              255,
              255,
              .72
            );

          padding: 0 2px;

          font-size: 7.5px;
          font-weight: 950;

          text-align: right;
          outline: none;
        }
      `}</style>
    </label>
  );
}

function Row({
  label,
  value,
  input = false,
  muted = false,
  emphasized = false,
  onChange,
  onSave
}) {
  return (
    <div className="aof3-row">
      <span className="aof3-label">
        {label}
      </span>

      {input ? (
       <MoneyInput
  value={value}
  onChange={onChange}
  onSave={onSave}
  className={[
    "aof3-input",
    emphasized
      ? "emphasized"
      : ""
  ]
    .filter(Boolean)
    .join(" ")}
/>
      ) : (
        <strong
          className={[
            "aof3-value",
            muted
              ? "muted"
              : ""
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {value}
        </strong>
      )}
    </div>
  );
}

function BidScenario({
  scenario,
  active = false
}) {
  return (
    <div
      className={[
        "aof3-bid-scenario",
        active
          ? "active"
          : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <strong>
        {money(
          scenario.bid
        )}
      </strong>

      <span>
        PROFIT
      </span>

      <b>
        {money(
          scenario.totalProfit
        )}
      </b>

      <em>
        {percentage(
          scenario.profitPercent
        )}
      </em>

      <style jsx>{`
        .aof3-bid-scenario {
          min-width: 0;

          min-height: 43px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          padding: 3px 2px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .055
            );

          border-radius: 5px;

          background:
            rgba(
              12,
              12,
              12,
              .62
            );

          overflow: hidden;
        }

        .aof3-bid-scenario.active {
          border-color:
            rgba(
              255,
              196,
              0,
              .28
            );

          background:
            rgba(
              255,
              196,
              0,
              .045
            );

          box-shadow:
            0 0 8px
            rgba(
              255,
              196,
              0,
              .07
            );
        }

        .aof3-bid-scenario strong {
          max-width: 100%;

          color:
            rgba(
              255,
              255,
              255,
              .88
            );

          font-size: 7px;
          font-weight: 950;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .aof3-bid-scenario.active strong {
          color: #ffc400;
        }

        .aof3-bid-scenario span {
          margin-top: 2px;

          color:
            rgba(
              255,
              255,
              255,
              .28
            );

          font-size: 5.1px;
          font-weight: 950;
          letter-spacing: .24px;

          text-transform: uppercase;
        }

        .aof3-bid-scenario b {
          max-width: 100%;

          color:
            rgba(
              255,
              255,
              255,
              .68
            );

          font-size: 6.3px;
          font-weight: 950;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .aof3-bid-scenario em {
          margin-top: 1px;

          color:
            rgba(
              255,
              196,
              0,
              .72
            );

          font-size: 6.1px;
          font-weight: 950;
          font-style: normal;
        }

      
      `}</style>
    </div>
  );
}
