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

const MAX_INPUT_DIGITS = 6;
const MAX_INPUT_VALUE = 999999;

function clampMoneyInput(value = "") {
  const digits = String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, MAX_INPUT_DIGITS);

  if (!digits) {
    return 0;
  }

  return Math.min(
    Number(digits),
    MAX_INPUT_VALUE
  );
}

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
    Math.min(
      cleanNumber(
        listing?.price ??
        publicData?.price ??
        0
      ),
      MAX_INPUT_VALUE
    );

  const [
    estimatedSalePrice,
    setEstimatedSalePrice
  ] = useState(
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
  ] = useState(
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
  ] = useState(
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
  ] = useState(
    Math.min(
      cleanNumber(
        dealerBidPack?.myBid ??
        openingValue
      ),
      MAX_INPUT_VALUE
    )
  );

  const [
    freight1,
    setFreight1
  ] = useState(
    Math.min(
      cleanNumber(
        dealerBidPack?.freight1
      ),
      MAX_INPUT_VALUE
    )
  );

  const [
    freight2,
    setFreight2
  ] = useState(
    Math.min(
      cleanNumber(
        dealerBidPack?.freight2
      ),
      MAX_INPUT_VALUE
    )
  );

  const [
    tech,
    setTech
  ] = useState(
    Math.min(
      cleanNumber(
        dealerBidPack?.tech
      ),
      MAX_INPUT_VALUE
    )
  );

  const [
    clean,
    setClean
  ] = useState(
    Math.min(
      cleanNumber(
        dealerBidPack?.clean
      ),
      MAX_INPUT_VALUE
    )
  );

  const [
    parts,
    setParts
  ] = useState(
    Math.min(
      cleanNumber(
        dealerBidPack?.parts
      ),
      MAX_INPUT_VALUE
    )
  );

  const [
    labor,
    setLabor
  ] = useState(
    Math.min(
      cleanNumber(
        dealerBidPack?.labor
      ),
      MAX_INPUT_VALUE
    )
  );

  const [
    preDelivery,
    setPreDelivery
  ] = useState(
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
      className="aof3 aof3-ledger"
      contentClassName="aof3-content"
      size={faceSize}
      dragHandleProps={dragHandleProps}
      footer={
        <IXIFaceActionFooter />
      }
    >
      <header className="aof3-head">
        <span>PRIVATE DEALER WORKSHEET</span>
        <strong>IXI DEALER BID PACK™</strong>
      </header>

      <div className="aof3-machine-line">
        {[year, make, model]
          .filter(Boolean)
          .join(" ")}

        {hours
          ? ` • ${String(hours)
              .replace(/hrs|hours/gi, "")
              .trim()} HRS`
          : ""}
      </div>

      <section className="aof3-sale-section ledger-panel ledger-panel-accent">
        <div className="aof3-sale-value">
          <span>EST RETAIL SALE PRICE</span>

          <MoneyInput
            className="aof3-sale-input"
            value={estimatedSalePrice}
            onChange={setEstimatedSalePrice}
            onSave={saveBidPack}
          />

          <div className="aof3-advertised-row">
            <MiniValue
              label="LOW ADV"
              value={lowAdvertised}
              onChange={setLowAdvertised}
              onSave={saveBidPack}
            />

            <MiniValue
              label="AVG ADV"
              value={averageAdvertised}
              onChange={setAverageAdvertised}
              onSave={saveBidPack}
            />
          </div>
        </div>
      </section>

      <div className="aof3-cost-grid">
        <section className="aof3-cost-panel ledger-panel">
          <LedgerRow
            label="MY BID"
            input
            value={myBid}
            onChange={setMyBid}
            onSave={saveBidPack}
            emphasized
          />

          <LedgerRow
            label="COMM."
            value={money(mainScenario.commission)}
            muted
          />

          <LedgerRow
            label="FREIGHT 1"
            input
            value={freight1}
            onChange={setFreight1}
            onSave={saveBidPack}
          />

          <LedgerRow
            label="FREIGHT 2"
            input
            value={freight2}
            onChange={setFreight2}
            onSave={saveBidPack}
          />
        </section>

        <section className="aof3-cost-panel ledger-panel">
          <LedgerRow
            label="TECH"
            input
            value={tech}
            onChange={setTech}
            onSave={saveBidPack}
          />

          <LedgerRow
            label="CLEAN"
            input
            value={clean}
            onChange={setClean}
            onSave={saveBidPack}
          />

          <LedgerRow
            label="PARTS"
            input
            value={parts}
            onChange={setParts}
            onSave={saveBidPack}
          />

          <LedgerRow
            label="LABOR"
            input
            value={labor}
            onChange={setLabor}
            onSave={saveBidPack}
          />

          <LedgerRow
            label="PRE DELIVERY"
            input
            value={preDelivery}
            onChange={setPreDelivery}
            onSave={saveBidPack}
          />
        </section>
      </div>

      <div className="aof3-total-grid">
        <LedgerSummary
          label="TOTAL COST"
          value={money(mainScenario.totalCost)}
        />

        <LedgerSummary
          label="TOTAL PROFIT"
          value={money(mainScenario.totalProfit)}
          detail={percentage(mainScenario.profitPercent)}
          accent={mainScenario.totalProfit >= 0}
          negative={mainScenario.totalProfit < 0}
        />
      </div>

      <section className="aof3-bid-pack ledger-panel">
        <div className="aof3-bid-pack-title">
          <span />
          <strong>BID PACK ANALYSIS</strong>
          <span />
        </div>

        <div className="aof3-bid-pack-grid">
          {bidScenarios.map((scenario, index) => (
            <BidScenario
              key={`${scenario.bid}-${index}`}
              scenario={scenario}
              active={index === 2}
            />
          ))}
        </div>
      </section>

      <style jsx>{`
        :global(.aof3-ledger) {
          --ledger-paper: #e4d3b1;
          --ledger-paper-light: #efe1c5;
          --ledger-paper-dark: #c9b58f;
          --ledger-ink: #432b1d;
          --ledger-ink-soft: #6d533e;
          --ledger-line: rgba(86, 58, 37, .48);
          --ledger-line-soft: rgba(86, 58, 37, .22);
          --ledger-accent: #9a6a20;
          --ledger-accent-deep: #755018;
          --ledger-shadow: rgba(54, 35, 20, .16);

          color: var(--ledger-ink);
          border-color: rgba(80, 54, 35, .64) !important;
          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.10),
              rgba(95,62,33,.025)
            ),
            var(--ledger-paper) !important;
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,.26),
            inset 0 0 0 2px rgba(82,55,34,.14),
            0 5px 16px rgba(0,0,0,.20) !important;
        }

        :global(.aof3-ledger::before),
        :global(.aof3-ledger::after) {
          border-color: rgba(81, 55, 35, .32) !important;
        }

        :global(.aof3-content) {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 6px;
          overflow: hidden;
          color: var(--ledger-ink);
          background:
            radial-gradient(
              circle at 18% 14%,
              rgba(255,255,255,.20) 0,
              rgba(255,255,255,0) 32%
            ),
            radial-gradient(
              circle at 78% 72%,
              rgba(105,72,40,.05) 0,
              rgba(105,72,40,0) 34%
            ),
            repeating-linear-gradient(
              0deg,
              rgba(94,61,36,.012) 0,
              rgba(94,61,36,.012) 1px,
              transparent 1px,
              transparent 4px
            ),
            linear-gradient(
              180deg,
              var(--ledger-paper-light) 0%,
              #e7d5b5 50%,
              #dfcca8 100%
            );
          font-variant-numeric: tabular-nums lining-nums;
        }

        :global(.aof3-content::after) {
          content: "";
          position: absolute;
          inset: 2px;
          pointer-events: none;
          border: 1px solid rgba(91, 62, 40, .15);
          box-shadow: inset 0 0 10px rgba(90, 58, 33, .035);
        }

        .aof3-head {
          position: relative;
          z-index: 1;
          min-height: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: var(--ledger-ink);
          font-size: var(--ixi-face-font-label, 7px);
          font-weight: 900;
          letter-spacing: .36px;
          text-transform: uppercase;
        }

        .aof3-head strong {
          color: var(--ledger-ink);
          font-size: var(--ixi-face-font-label, 7px);
          font-weight: 950;
          letter-spacing: .38px;
        }

        .aof3-machine-line {
          position: relative;
          z-index: 1;
          min-height: 15px;
          color: var(--ledger-ink);
          font-family: Georgia, "Times New Roman", serif;
          font-size: var(--ixi-face-font-label, 7px);
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: .20px;
          text-align: center;
          text-transform: uppercase;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ledger-panel {
          position: relative;
          z-index: 1;
          min-width: 0;
          border: 1px solid var(--ledger-line);
          border-radius: 5px;
          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.09),
              rgba(100,67,38,.025)
            );
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,.15),
            0 1px 1px var(--ledger-shadow);
        }

        .ledger-panel-accent {
          border-color: rgba(128, 88, 29, .56);
        }

        .aof3-sale-section {
          flex: 0 0 auto;
          padding: 5px 8px 6px;
        }

        .aof3-sale-value {
          min-height: 58px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .aof3-sale-value > span {
          color: var(--ledger-ink-soft);
          font-size: var(--ixi-face-font-label, 7px);
          font-weight: 950;
          letter-spacing: .46px;
          text-transform: uppercase;
        }

        :global(.aof3-sale-input) {
          width: 96px;
          max-width: 96px;
          height: 25px;
          margin-top: 1px;
          border: 0;
          border-bottom: 1px solid rgba(103, 67, 37, .54);
          border-radius: 0;
          background: transparent;
          color: var(--ledger-ink);
          padding: 0 2px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: var(--ixi-face-font-display, 18px);
          font-weight: 900;
          line-height: 1;
          text-align: center;
          font-variant-numeric: tabular-nums lining-nums;
          outline: none;
        }

        :global(.aof3-sale-input:focus) {
          border-bottom-color: var(--ledger-accent-deep);
          box-shadow: 0 1px 0 rgba(117, 80, 24, .12);
        }

        .aof3-advertised-row {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          margin-top: 4px;
        }

        .aof3-cost-grid,
        .aof3-total-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px;
          min-width: 0;
        }

        .aof3-cost-panel {
          min-width: 0;
          padding: 5px 7px 4px;
        }

        .aof3-total-grid {
          min-height: 46px;
        }

        .aof3-bid-pack {
          min-height: 64px;
          padding: 5px 6px 6px;
        }

        .aof3-bid-pack-title {
          display: grid;
          grid-template-columns: minmax(0,1fr) auto minmax(0,1fr);
          align-items: center;
          gap: 5px;
          margin-bottom: 4px;
          color: var(--ledger-ink);
          font-size: var(--ixi-face-font-micro, 6.5px);
          font-weight: 950;
          letter-spacing: .36px;
          text-align: center;
          text-transform: uppercase;
        }

        .aof3-bid-pack-title span {
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            var(--ledger-line),
            transparent
          );
        }

        .aof3-bid-pack-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 3px;
          min-width: 0;
        }

        :global(.aof3-ledger input) {
          box-sizing: border-box;
          caret-color: var(--ledger-ink);
        }

        :global(.aof3-ledger button) {
          color: var(--ledger-ink) !important;
          border-color: rgba(86, 58, 37, .40) !important;
          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.12),
              rgba(89,59,34,.03)
            ) !important;
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,.12),
            0 1px 1px rgba(72,46,27,.08) !important;
        }

        :global(.aof3-ledger button:hover) {
          border-color: rgba(117, 80, 24, .68) !important;
          background: rgba(135, 91, 28, .07) !important;
        }

        :global(.aof3-ledger button svg) {
          color: var(--ledger-ink) !important;
          fill: currentColor;
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
  const displayValue =
    Number(value)
      ? Math.min(
          Number(value),
          MAX_INPUT_VALUE
        ).toLocaleString("en-US")
      : "";

  return (
    <input
      className={className}
      value={displayValue}
      inputMode="numeric"
      autoComplete="off"
      aria-label="Money value"
      onPointerDown={event => {
        event.stopPropagation();
      }}
      onChange={event => {
        onChange?.(
          clampMoneyInput(
            event.target.value
          )
        );
      }}
      onBlur={() => {
        onSave?.();
      }}
      onKeyDown={event => {
        if (event.key !== "Enter") {
          return;
        }

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
          display: grid;
          grid-template-columns: auto 54px;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        .aof3-mini-value span {
          color: var(--ledger-ink-soft);
          font-size: var(--ixi-face-font-micro, 6.5px);
          font-weight: 900;
          letter-spacing: .24px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        :global(.aof3-mini-input) {
          width: 54px;
          min-width: 54px;
          max-width: 54px;
          height: 15px;
          border: 0;
          border-bottom: 1px solid rgba(86, 58, 37, .28);
          background: transparent;
          color: var(--ledger-ink);
          padding: 0 1px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: var(--ixi-face-font-value, 9px);
          font-weight: 800;
          text-align: right;
          font-variant-numeric: tabular-nums lining-nums;
          outline: none;
        }
      `}</style>
    </label>
  );
}

function LedgerRow({
  label,
  value,
  input = false,
  muted = false,
  emphasized = false,
  onChange,
  onSave
}) {
  return (
    <div
      className={[
        "aof3-row",
        muted ? "muted" : "",
        emphasized ? "emphasized" : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="aof3-row-label">
        {label}
      </span>

      <span className="aof3-row-rule" />

      {input ? (
        <MoneyInput
          value={value}
          onChange={onChange}
          onSave={onSave}
          className="aof3-input"
        />
      ) : (
        <strong className="aof3-row-value">
          {value}
        </strong>
      )}

      <style jsx>{`
        .aof3-row {
          width: 100%;
          min-width: 0;
          height: 19px;
          display: grid;
          grid-template-columns: auto minmax(6px, 1fr) 56px;
          align-items: center;
          column-gap: 4px;
          color: var(--ledger-ink);
          overflow: hidden;
        }

        .aof3-row-label {
          min-width: 0;
          color: var(--ledger-ink);
          font-size: var(--ixi-face-font-micro, 6.5px);
          font-weight: 900;
          letter-spacing: .18px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .aof3-row-rule {
          align-self: center;
          height: 1px;
          min-width: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(86,58,37,.19)
          );
        }

        .aof3-row-value {
          width: 56px;
          min-width: 56px;
          max-width: 56px;
          overflow: hidden;
          color: var(--ledger-ink);
          font-family: Georgia, "Times New Roman", serif;
          font-size: var(--ixi-face-font-value, 9px);
          font-weight: 800;
          text-align: right;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-variant-numeric: tabular-nums lining-nums;
        }

        .aof3-row.muted .aof3-row-label,
        .aof3-row.muted .aof3-row-value {
          color: rgba(67, 43, 29, .62);
        }

        .aof3-row.emphasized .aof3-row-label,
        .aof3-row.emphasized .aof3-row-value {
          color: var(--ledger-ink);
          font-weight: 950;
        }

        :global(.aof3-input) {
          width: 56px !important;
          min-width: 56px !important;
          max-width: 56px !important;
          height: 17px;
          margin: 0 !important;
          border: 0;
          border-bottom: 1px solid rgba(86, 58, 37, .24);
          border-radius: 0;
          background: transparent;
          color: var(--ledger-ink);
          padding: 0 1px !important;
          font-family: Georgia, "Times New Roman", serif;
          font-size: var(--ixi-face-font-value, 9px);
          font-weight: 800;
          line-height: 17px;
          text-align: right;
          font-variant-numeric: tabular-nums lining-nums;
          outline: none;
        }

        :global(.aof3-input:focus) {
          border-bottom-color: var(--ledger-accent-deep);
        }
      `}</style>
    </div>
  );
}

function LedgerSummary({
  label,
  value,
  detail = "",
  accent = false,
  negative = false
}) {
  return (
    <section
      className={[
        "aof3-summary",
        "ledger-panel",
        accent ? "accent" : "",
        negative ? "negative" : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <em>{detail}</em> : null}

      <style jsx>{`
        .aof3-summary {
          min-width: 0;
          min-height: 46px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4px 5px;
          color: var(--ledger-ink);
        }

        .aof3-summary > span {
          color: var(--ledger-ink-soft);
          font-size: var(--ixi-face-font-micro, 6.5px);
          font-weight: 900;
          letter-spacing: .24px;
          text-transform: uppercase;
        }

        .aof3-summary strong {
          max-width: 100%;
          overflow: hidden;
          color: var(--ledger-ink);
          font-family: Georgia, "Times New Roman", serif;
          font-size: var(--ixi-face-font-display, 15px);
          font-weight: 900;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-variant-numeric: tabular-nums lining-nums;
        }

        .aof3-summary em {
          margin-top: -1px;
          color: var(--ledger-ink-soft);
          font-size: var(--ixi-face-font-micro, 6.5px);
          font-weight: 900;
          font-style: normal;
        }

        .aof3-summary.accent {
          border-color: rgba(128, 88, 29, .48);
          background: rgba(151, 102, 29, .035);
        }

        .aof3-summary.accent strong,
        .aof3-summary.accent em {
          color: var(--ledger-accent-deep);
        }

        .aof3-summary.negative strong,
        .aof3-summary.negative em {
          color: #7c2e24;
        }
      `}</style>
    </section>
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
        active ? "active" : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <strong>{money(scenario.bid)}</strong>
      <span>PROFIT</span>
      <b>{money(scenario.totalProfit)}</b>
      <em>{percentage(scenario.profitPercent)}</em>

      <style jsx>{`
        .aof3-bid-scenario {
          min-width: 0;
          min-height: 43px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3px 1px;
          border: 1px solid rgba(86,58,37,.26);
          border-radius: 3px;
          background: rgba(255,255,255,.045);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.07);
          color: var(--ledger-ink);
          overflow: hidden;
        }

        .aof3-bid-scenario.active {
          border-color: rgba(128, 88, 29, .62);
          background: rgba(151, 102, 29, .06);
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,.08),
            0 0 0 1px rgba(128,88,29,.08);
        }

        .aof3-bid-scenario strong,
        .aof3-bid-scenario b {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: Georgia, "Times New Roman", serif;
          font-variant-numeric: tabular-nums lining-nums;
        }

        .aof3-bid-scenario strong {
          color: var(--ledger-ink);
          font-size: var(--ixi-face-font-label, 7px);
          font-weight: 900;
        }

        .aof3-bid-scenario.active strong {
          color: var(--ledger-accent-deep);
        }

        .aof3-bid-scenario span {
          margin-top: 1px;
          color: var(--ledger-ink-soft);
          font-size: 5.2px;
          font-weight: 900;
          letter-spacing: .16px;
          text-transform: uppercase;
        }

        .aof3-bid-scenario b {
          color: var(--ledger-ink);
          font-size: var(--ixi-face-font-micro, 6.5px);
          font-weight: 800;
        }

        .aof3-bid-scenario em {
          margin-top: 1px;
          color: var(--ledger-accent-deep);
          font-size: var(--ixi-face-font-micro, 6.5px);
          font-weight: 950;
          font-style: normal;
        }
      `}</style>
    </div>
  );
}
