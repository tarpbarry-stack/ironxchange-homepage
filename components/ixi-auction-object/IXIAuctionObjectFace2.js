import IXIMachineObjectActions
from "../ixi-machine-object/IXIMachineObjectActions";

import {
  formatHours
} from "../../lib/listingFormatters";

import IXIAuctionDeadlineRail
from "./IXIAuctionDeadlineRail";

import {
  getAuctionCompany,
  getAuctionCurrentBid,
  getAuctionDate,
  getAuctionEventLocation,
  getAuctionLotData,
  getAuctionMachineData,
  getAuctionOpeningBid,
  getAuctionTermsData,
  getPublicData
} from "./auctionObjectSelectors";

function clean(value = "") {
  return String(value || "").trim();
}

function getAuctionRoot(listing = {}) {
  const publicData = getPublicData(listing);

  return (
    listing.auctionObject ||
    publicData.auctionObject ||
    listing.auction ||
    listing.auctionData ||
    publicData.auction ||
    publicData.auctionData ||
    {}
  );
}

function getAuctionEvent(listing = {}) {
  const publicData = getPublicData(listing);
  const auction = getAuctionRoot(listing);

  return (
    auction.event ||
    auction.auctionEvent ||
    listing.auctionEvent ||
    publicData.auctionEvent ||
    {}
  );
}

function getAuctionCompanyLogo(listing = {}) {
  const publicData = getPublicData(listing);
  const auction = getAuctionRoot(listing);
  const event = getAuctionEvent(listing);

  return clean(
    auction?.company?.logoUrl ||
    auction?.company?.logo ||
    auction?.companyLogoUrl ||
    auction?.auctionCompanyLogo ||
    event?.company?.logoUrl ||
    event?.company?.logo ||
    event?.companyLogoUrl ||
    listing.auctionCompanyLogo ||
    publicData.auctionCompanyLogo
  );
}

/*
 * Auction event ID.
 *
 * This belongs in the auction-company section.
 */
function getAuctionEventId(listing = {}) {
  const publicData = getPublicData(listing);
  const auction = getAuctionRoot(listing);
  const event = getAuctionEvent(listing);

  return clean(
    event?.auctionId ||
    event?.eventId ||
    event?.id ||
    event?.externalId ||
    event?.saleId ||
    auction?.eventId ||
    auction?.saleId ||
    listing.auctionEventId ||
    publicData.auctionEventId ||
    listing.auctionId ||
    publicData.auctionId
  );
}

/*
 * Machine-specific ID inside the auction system.
 *
 * This belongs beside the serial number.
 */
function getAuctionMachineId(listing = {}) {
  const publicData = getPublicData(listing);
  const machine = getAuctionMachineData(listing);
  const lot = getAuctionLotData(listing);

  return clean(
    machine?.machineAuctionId ||
    machine?.auctionMachineId ||
    machine?.assetId ||
    machine?.itemId ||
    machine?.externalId ||
    machine?.id ||
    lot?.machineAuctionId ||
    lot?.auctionMachineId ||
    lot?.assetId ||
    lot?.itemId ||
    lot?.externalId ||
    lot?.lotId ||
    lot?.auctionId ||
    listing.auctionMachineId ||
    publicData.auctionMachineId ||
    listing.sourceId ||
    publicData.sourceId
  );
}
/*
 * Preserve the complete machine ID.
 *
 * Only remove the redundant source prefix because the
 * auction company is already clearly displayed above.
 */
function getDisplayAuctionMachineId(value = "") {
  return clean(value).replace(/^rbauction-/i, "");
}

/*
 * Auction term selectors can return a primitive value,
 * an array, or an object.
 *
 * This extracts the most useful readable value and prevents:
 *
 * [object Object]
 */
function getFirstMeaningfulValue(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return clean(value);
  }

  if (Array.isArray(value)) {
    return value
      .map(getFirstMeaningfulValue)
      .filter(Boolean)
      .join(" • ");
  }

  if (typeof value === "object") {
    const preferredKeys = [
      "display",
      "displayValue",
      "formatted",
      "formattedValue",
      "label",
      "text",
      "value",
      "amount",
      "rate",
      "percentage",
      "percent",
      "date",
      "deadline",
      "description",
      "summary"
    ];

    for (const key of preferredKeys) {
      const resolved = getFirstMeaningfulValue(
        value?.[key]
      );

      if (resolved) {
        return resolved;
      }
    }

    for (const nestedValue of Object.values(value)) {
      const resolved = getFirstMeaningfulValue(
        nestedValue
      );

      if (resolved) {
        return resolved;
      }
    }
  }

  return "";
}

function getTermValue(
  terms = {},
  keys = [],
  fallback = ""
) {
  for (const key of keys) {
    const value = getFirstMeaningfulValue(
      terms?.[key]
    );

    if (value) {
      return value;
    }
  }

  return fallback;
}

function formatMoneyDisplay(value) {
  const raw = getFirstMeaningfulValue(value);

  if (!raw) {
    return "NOT AVAILABLE";
  }

  const normalized = raw.replace(/[$,\s]/g, "");

  if (/^[0-9]+(?:\.[0-9]+)?$/.test(normalized)) {
    const amount = Number(normalized);

    if (Number.isFinite(amount)) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
      }).format(amount);
    }
  }

  return raw;
}

function formatAuctionDate(value = "") {
  const raw = clean(value);

  if (!raw) {
    return "";
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return raw.toUpperCase();
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  })
    .format(date)
    .toUpperCase();
}

function normalizeAuctionLocation(value = "") {
  const raw = clean(value);

  if (!raw) {
    return "";
  }

  const stateNames = {
    AL: "ALABAMA",
    AK: "ALASKA",
    AZ: "ARIZONA",
    AR: "ARKANSAS",
    CA: "CALIFORNIA",
    CO: "COLORADO",
    CT: "CONNECTICUT",
    DE: "DELAWARE",
    FL: "FLORIDA",
    GA: "GEORGIA",
    HI: "HAWAII",
    ID: "IDAHO",
    IL: "ILLINOIS",
    IN: "INDIANA",
    IA: "IOWA",
    KS: "KANSAS",
    KY: "KENTUCKY",
    LA: "LOUISIANA",
    ME: "MAINE",
    MD: "MARYLAND",
    MA: "MASSACHUSETTS",
    MI: "MICHIGAN",
    MN: "MINNESOTA",
    MS: "MISSISSIPPI",
    MO: "MISSOURI",
    MT: "MONTANA",
    NE: "NEBRASKA",
    NV: "NEVADA",
    NH: "NEW HAMPSHIRE",
    NJ: "NEW JERSEY",
    NM: "NEW MEXICO",
    NY: "NEW YORK",
    NC: "NORTH CAROLINA",
    ND: "NORTH DAKOTA",
    OH: "OHIO",
    OK: "OKLAHOMA",
    OR: "OREGON",
    PA: "PENNSYLVANIA",
    RI: "RHODE ISLAND",
    SC: "SOUTH CAROLINA",
    SD: "SOUTH DAKOTA",
    TN: "TENNESSEE",
    TX: "TEXAS",
    UT: "UTAH",
    VT: "VERMONT",
    VA: "VIRGINIA",
    WA: "WASHINGTON",
    WV: "WEST VIRGINIA",
    WI: "WISCONSIN",
    WY: "WYOMING"
  };

  const parts = raw
    .split(",")
    .map(part => clean(part))
    .filter(Boolean)
    .filter(
      part =>
        !/^(USA|UNITED STATES|UNITED STATES OF AMERICA)$/i.test(
          part
        )
    );

  if (parts.length >= 2) {
    const city = parts[0].toUpperCase();

    const stateCode = parts[1]
      .slice(0, 2)
      .toUpperCase();

    const state =
      stateNames[stateCode] ||
      parts[1].toUpperCase();

    return `${city}, ${state}`;
  }

  return parts.join(", ").toUpperCase();
}

export default function IXIAuctionObjectFace2({
  listing = {},
  dragHandleProps,

  sellerMode = false,

  lotNumberValue,
  onLotNumberChange,

  hoursValue,
  onHoursChange,
  onHoursKeyDown,

  openingBidValue,
  onOpeningBidChange,
  onOpeningBidKeyDown,

  auctionAlertsEnabled = false,
  onAuctionAlertClick
}) {
  const publicData = getPublicData(listing);
const auctionRoot = getAuctionRoot(listing);
const auctionDeadlines = auctionRoot?.deadlines || {};
const auctionMachine = getAuctionMachineData(listing);
const auctionTerms = getAuctionTermsData(listing);

  const auctionRules =
  auctionRoot?.auctionRules || {};

const buyerPremiumData =
  auctionRules.buyerPremium ||
  auctionRoot?.buyerPremium ||
  {};

const paymentRuleData =
  auctionRules.paymentDue ||
  auctionRoot?.paymentDue ||
  {};

const taxRuleData =
  auctionRules.tax ||
  auctionRoot?.tax ||
  {};

const removalRuleData =
  auctionRules.removal ||
  auctionRoot?.removal ||
  {};

  const passportId =
    listing.passportId ||
    publicData.passportId ||
    "";

  const auctionCompany =
    getAuctionCompany(listing) ||
    "AUCTION COMPANY NOT AVAILABLE";

  const auctionCompanyLogo =
    getAuctionCompanyLogo(listing);

  const auctionEventId =
    getAuctionEventId(listing) ||
    "NOT LISTED";

 const auctionDate = formatAuctionDate(
  auctionDeadlines?.auctionDate ||
  auctionDeadlines?.saleDate ||
  auctionDeadlines?.startDate ||
  getAuctionDate(listing)
);

  const auctionLocation =
    normalizeAuctionLocation(
      getAuctionEventLocation(listing)
    );

const serial =
  auctionMachine?.serialNumber ||
  auctionMachine?.serial ||
  listing.serialNumber ||
  publicData.serialNumber ||
  "—";

  const auctionMachineId =
    getDisplayAuctionMachineId(
      getAuctionMachineId(listing)
    ) || "—";

  const year =
  auctionMachine?.year ||
  listing.year ||
  publicData.year ||
  "";

const make =
  auctionMachine?.make ||
  listing.make ||
  publicData.make ||
  "";

const model =
  auctionMachine?.model ||
  listing.model ||
  publicData.model ||
  "";
  
  const hours =
  hoursValue ??
  auctionMachine?.hours ??
  listing.hours ??
  publicData.hours ??
  "";

  const currentBid =
    getAuctionCurrentBid(listing);

  const openingBid =
    openingBidValue ??
    getAuctionOpeningBid(listing);

  const displayedBid =
    currentBid ??
    openingBid ??
    "";

  const hasCurrentBid =
    currentBid !== null &&
    currentBid !== undefined &&
    currentBid !== "";

  const bidLabel = hasCurrentBid
    ? "CURRENT BID"
    : "OPENING BID";

 const buyersPremium =
  buyerPremiumData.purchaseTiers?.length
    ? buyerPremiumData.purchaseTiers
        .map(tier => {
          const range =
            tier.maxAmount == null
              ? `$${tier.minAmount.toLocaleString()}+`
              : `$${tier.minAmount.toLocaleString()}-$${tier.maxAmount.toLocaleString()}`;

          return `${range} ${tier.cashCheckWireRatePercent}%`;
        })
        .join(" • ")
    : getTermValue(
        auctionTerms,
        [
          "buyersPremium",
          "buyerPremium"
        ],
        "NOT LISTED"
      );

  const fees = getTermValue(
    auctionTerms,
    [
      "fees",
      "feeText",
      "additionalFees",
      "internetFee"
    ],
    "NOT LISTED"
  );

 const taxRate =
  taxRuleData.taxable === true
    ? "SALES TAX APPLIES"
    : taxRuleData.taxable === false
      ? "NO SALES TAX"
      : "SEE TERMS";
  
const paymentDueDate =
  paymentRuleData.relativeBusinessDays != null
    ? `${paymentRuleData.relativeBusinessDays} BUSINESS DAYS`
    : paymentRuleData.dueText ||
      getFirstMeaningfulValue(
        auctionDeadlines?.paymentDueDate ||
        auctionDeadlines?.paymentDue
      ) ||
      "NOT LISTED";
  
  const removalDate =
  removalRuleData.relativeDays != null
    ? `${removalRuleData.relativeDays} DAYS`
    : removalRuleData.deadlineText ||
      "NOT LISTED";
  
 const auctionTermsRawText = [
  buyerPremiumData?.rawText,
  taxRuleData?.rawText,
  paymentRuleData?.rawText,
  removalRuleData?.rawText,
  getFirstMeaningfulValue(
    auctionTerms?.rawText
  ),
  getFirstMeaningfulValue(
    auctionTerms?.termsText
  )
]
  .filter(Boolean)
  .join(" ")
  .toUpperCase();

const basicTerms = [
  /AS[\s-]*IS[\s,/-]*WHERE[\s-]*IS/.test(
    auctionTermsRawText
  )
    ? "AS IS, WHERE IS"
    : "",

  /ALL SALES (?:ARE )?FINAL|FINAL SALE/.test(
    auctionTermsRawText
  )
    ? "ALL SALES FINAL"
    : "",

  removalRuleData?.removalAtBuyerExpense ||
  removalRuleData?.buyerResponsibleForShipping ||
  /BUYER.{0,60}(?:RESPONSIBLE|EXPENSE).{0,60}(?:REMOVAL|SHIPPING|TRANSPORT)/.test(
    auctionTermsRawText
  )
    ? "BUYER RESPONSIBLE FOR REMOVAL"
    : ""
].filter(Boolean);

  function stopCardClick(event) {
    event.preventDefault();
    event.stopPropagation();
  }

const internetPremiumRate =
  buyerPremiumData?.internetAdditional?.ratePercent;

const internetPremiumCap =
  buyerPremiumData?.internetAdditional?.capAmount;

const storageFeePerDay =
  removalRuleData?.storageFeePerDay;

const storageFeePerItem =
  removalRuleData?.storageFeePerItem;

const feeLines = [
  internetPremiumRate
    ? `${internetPremiumRate}% INTERNET PREMIUM`
    : "",

  internetPremiumCap
    ? `$${Number(internetPremiumCap).toLocaleString(
        "en-US"
      )} CAP`
    : "",

  storageFeePerDay
    ? `$${Number(storageFeePerDay).toLocaleString(
        "en-US"
      )}/DAY STORAGE`
    : "",

  storageFeePerItem
    ? `$${Number(storageFeePerItem).toLocaleString(
        "en-US"
      )}/ITEM STORAGE`
    : ""
].filter(Boolean);
  
  return (
    <section
      className="aof2"
      {...(dragHandleProps || {})}
    >
      <div className="aof2-passport-wrap">
        <div className="aof2-passport-label">
          IXI Machine Passport
        </div>

        {passportId ? (
          <a
            href={`/p/${passportId}`}
            className="aof2-passport-id"
            onClick={event => {
              event.stopPropagation();
            }}
            onPointerDown={event => {
              event.stopPropagation();
            }}
          >
            {passportId}
          </a>
        ) : (
          <div className="aof2-passport-id aof2-passport-id-empty">
            &nbsp;
          </div>
        )}
      </div>

     <div className="aof2-company-block">
  <div className="aof2-logo-wrap">
    {auctionCompanyLogo ? (
      <img
        src={auctionCompanyLogo}
        alt={auctionCompany}
      />
    ) : (
      <strong className="aof2-company-name">
        {auctionCompany}
      </strong>
    )}
  </div>

  <div className="aof2-event-id-row">
    <span>AUCTION ID</span>

    <strong>
      {auctionEventId}
    </strong>
  </div>

  <div className="aof2-event-meta-row">
    <div className="aof2-company-date">
      {auctionDate ||
        "SALE DATE NOT AVAILABLE"}
    </div>

    <div className="aof2-company-location">
      {auctionLocation ||
        "SALE LOCATION NOT AVAILABLE"}
    </div>
  </div>
</div>

      <div className="aof2-plate">
        <div className="aof2-tag">
          <div className="aof2-tag-label">
            SERIAL NUMBER
          </div>

          <div className="aof2-tag-value">
            {serial}
          </div>
        </div>

        <div className="aof2-tag aof2-machine-id-tag">
          <div className="aof2-tag-label">
            AUCTION MACHINE ID
          </div>

          <div className="aof2-machine-id-value">
            {auctionMachineId}
          </div>
        </div>
      </div>

      <IXIAuctionDeadlineRail
        listing={listing}
        sellerMode={sellerMode}
        lotNumberValue={lotNumberValue}
        onLotNumberChange={onLotNumberChange}
        alertsEnabled={auctionAlertsEnabled}
        onAlertClick={onAuctionAlertClick}
      />

      <div className="aof2-title-row">
        <h2>
          {[year, make, model]
            .filter(Boolean)
            .join(" ")}
        </h2>

        {sellerMode ? (
          <input
            className="aof2-hours-input"
            value={hours || ""}
            onChange={event =>
              onHoursChange?.(
                event.target.value,
                listing
              )
            }
            onClick={stopCardClick}
            onPointerDown={event => {
              event.stopPropagation();
            }}
            onKeyDown={event =>
              onHoursKeyDown?.(
                event,
                listing
              )
            }
            inputMode="numeric"
            placeholder="HRS"
            maxLength={5}
          />
        ) : (
          <div className="aof2-hours">
            {hours
              ? formatHours(hours)
              : ""}
          </div>
        )}
      </div>

      <div className="aof2-bid-row">
        <span className="aof2-bid-label">
          {bidLabel}
        </span>

        {sellerMode && !hasCurrentBid ? (
          <input
            className="aof2-bid-input"
            value={openingBid || ""}
            onChange={event =>
              onOpeningBidChange?.(
                event.target.value,
                listing
              )
            }
            onClick={stopCardClick}
            onPointerDown={event => {
              event.stopPropagation();
            }}
            onKeyDown={event =>
              onOpeningBidKeyDown?.(
                event,
                listing
              )
            }
            inputMode="numeric"
            placeholder="OPENING BID"
          />
        ) : (
          <strong className="aof2-bid-value">
            {formatMoneyDisplay(displayedBid)}
          </strong>
        )}
      </div>

      <div className="aof2-terms-grid">
        <div className="aof2-term">
          <span>
            BUYER&apos;S PREMIUM
          </span>

          <strong>
            {buyersPremium}
          </strong>
        </div>

        <div className="aof2-term">
  <span>FEES</span>

  {feeLines.length ? (
    <div className="aof2-fee-lines">
      {feeLines.map((line, index) => (
        <div key={`${line}-${index}`}>
          {line}
        </div>
      ))}
    </div>
  ) : (
    <strong>NOT LISTED</strong>
  )}
</div>

        <div className="aof2-term">
          <span>TAX RATE</span>

          <strong>
            {taxRate}
          </strong>
        </div>

        <div className="aof2-term">
          <span>PAYMENT DUE DATE</span>

          <strong>
            {paymentDueDate}
          </strong>
        </div>

        <div className="aof2-term aof2-term-wide">
          <span>
            MACHINE REMOVAL DATE
          </span>

          <strong>
            {removalDate}
          </strong>
        </div>
      </div>

      <div className="aof2-basic-terms">
        <div className="aof2-basic-terms-title">
          BASIC TERMS &amp; CONDITIONS
        </div>

       <div className="aof2-basic-terms-lines">
  {basicTerms.length ? (
    basicTerms.map((term, index) => (
      <span key={`${term}-${index}`}>
        {term}
      </span>
    ))
  ) : (
    <span>TERMS NOT AVAILABLE</span>
  )}
</div>
      </div>

      <div className="aof2-actions-footer">
        <IXIMachineObjectActions />
      </div>

      <style jsx>{`
.aof2,
.aof2 * {
  box-sizing: border-box;
}
      
       .aof2 {
  box-sizing: border-box;

  width: 100%;
  max-width: 100%;

  height: calc(100% - 16px);
  min-height: 0;

  position: relative;

  padding: 8px 14px 8px;

  display: flex;
  flex-direction: column;

  background:
    radial-gradient(
      circle at top,
      rgba(255,196,0,.05),
      transparent 42%
    ),
    linear-gradient(
      180deg,
      rgba(255,255,255,.028),
      rgba(255,255,255,0)
    ),
    #141414;

  color: #f2f2f2;
  overflow: hidden;
}

        .aof2-passport-wrap {
          width: 100%;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 12px;

          margin: 0 0 4px;
          padding: 0 1px 4px;

          border-bottom:
            1px solid rgba(255, 255, 255, .055);
        }

        .aof2-passport-label {
          min-width: 0;

          color: rgba(255, 255, 255, .32);

          font-size: 6.5px;
          font-weight: 950;
          line-height: 1;
          letter-spacing: .86px;

          text-transform: uppercase;
          white-space: nowrap;
        }

        .aof2-passport-id {
          min-width: 0;

          color: rgba(255, 255, 255, .68);

          font-size: 8px;
          font-weight: 950;
          line-height: 1;
          letter-spacing: .82px;

          text-decoration: none;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .aof2-passport-id:hover {
          color: #ffc400;
        }

        .aof2-passport-id-empty {
          min-width: 40px;
          min-height: 8px;

          pointer-events: none;
        }

        .aof2-company-block {
          width: 100%;
          min-height: 63px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          margin-bottom: 4px;

          text-align: center;
        }

        .aof2-logo-wrap {
          min-height: 15px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin-bottom: 1px;
        }

        .aof2-logo-wrap img {
          max-height: 16px;
          max-width: 145px;

          object-fit: contain;
        }

        .aof2-logo-fallback {
          color: rgba(255, 255, 255, .86);

          font-size: 9.5px;
          font-weight: 950;
          letter-spacing: .55px;

          text-transform: uppercase;
        }

        .aof2-company-name {
          color: rgba(255, 255, 255, .88);

          font-size: 9px;
          font-weight: 950;
          letter-spacing: .42px;

          text-transform: uppercase;
        }

        .aof2-event-id-row {
  width: min(100%, 330px);
  min-height: 14px;

  display: flex;
  align-items: center;
  justify-content: center;

  gap: 6px;

  margin-top: 2px;
  padding: 0 4px;

  border: 0;
  border-radius: 0;
  background: transparent;

  overflow: hidden;
}

        .aof2-event-id-row span {
          flex: 0 0 auto;

          color: rgba(255, 255, 255, .32);

          font-size: 6px;
          font-weight: 950;
          letter-spacing: .52px;

          text-transform: uppercase;
        }

        .aof2-event-id-row strong {
  min-width: 0;

  color: rgba(255,255,255,.46);

  font-family:
    "Roboto Condensed",
    "Arial Narrow",
    sans-serif;

  font-size: 6.8px;
  font-weight: 900;
  letter-spacing: .14px;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.aof2-event-meta-row {
  width: 100%;

  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 12px;

  margin-top: 3px;
  padding: 0 2px;

  min-width: 0;
}

.aof2-company-date,
.aof2-company-location {
  min-width: 0;
  margin-top: 0;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.aof2-company-date {
  flex: 1 1 auto;
  text-align: left;
}

.aof2-company-location {
  flex: 1 1 auto;
  text-align: right;
}
        .aof2-company-date {
          margin-top: 2px;

          color: rgba(255, 255, 255, .58);

          font-size: 7px;
          font-weight: 950;
          letter-spacing: .42px;

          text-transform: uppercase;
        }

        .aof2-company-location {
          margin-top: 1px;

          color: rgba(255, 255, 255, .38);

          font-size: 6.8px;
          font-weight: 900;
          letter-spacing: .34px;

          text-transform: uppercase;
        }

.aof2-plate {
  width: 100%;
  min-width: 0;

  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    minmax(0, 1fr);

  gap: 12px;
  overflow: hidden;

  margin: 2px 0 6px;
  padding: 8px 10px;

  border: 1px solid rgba(255, 196, 0, .16);
  border-radius: 7px;
}

        .aof2-tag {
          min-width: 0;
          text-align: left;
        }

        .aof2-tag-label {
  margin-bottom: 4px;

  color: rgba(255, 255, 255, .48);

  font-size: 7.2px;
  font-weight: 950;
  letter-spacing: .14em;

  text-transform: uppercase;
}

.aof2-tag-value {
  color: rgba(255, 255, 255, .96);

  font-family:
    "Roboto Condensed",
    "Arial Narrow",
    sans-serif;

  font-size: 11px;
  font-weight: 950;
  letter-spacing: .07em;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.aof2-machine-id-value {
  width: 100%;
  min-width: 0;

  color: rgba(255, 255, 255, .82);

  font-family:
    "Roboto Condensed",
    "Arial Narrow",
    sans-serif;

  font-size: 8px;
  font-weight: 950;
  line-height: 1.15;
  letter-spacing: .02em;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

        .aof2-title-row {
          width: 100%;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 10px;

          margin-top: 0;
        }

        .aof2-title-row h2 {
          flex: 1;
          min-width: 0;

          margin: 0;

          color: #f2f2f2;

          font-size: 12.5px;
          font-weight: 950;
          line-height: 1.05;
          letter-spacing: -.15px;

          overflow: hidden;
          text-align: left;
          text-overflow: ellipsis;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .aof2-hours {
          color: rgba(255, 255, 255, .52);

          font-size: 10px;
          font-weight: 850;
          letter-spacing: .38px;

          white-space: nowrap;
        }

        .aof2-hours-input,
        .aof2-bid-input {
          border:
            1px solid rgba(255, 255, 255, .12);

          border-radius: 5px;

          background: rgba(8, 8, 8, .78);

          color: #f2f2f2;

          padding: 0 6px;

          font-size: 8px;
          font-weight: 900;

          outline: none;
        }

        .aof2-hours-input {
          width: 54px;
          height: 22px;

          text-align: right;
        }

        .aof2-bid-row {
          width: 100%;
          min-height: 30px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 10px;

          margin-top: 3px;
          padding: 4px 0;

          border-top:
            1px solid rgba(255, 255, 255, .055);

          border-bottom:
            1px solid rgba(255, 255, 255, .055);
        }

        .aof2-bid-label {
          color: rgba(255, 255, 255, .38);

          font-size: 7.2px;
          font-weight: 950;
          letter-spacing: .70px;

          text-transform: uppercase;
        }

        .aof2-bid-value {
          color: #ffc400;

          font-size: 16px;
          font-weight: 950;
          letter-spacing: -.20px;

          white-space: nowrap;
        }

        .aof2-bid-input {
          width: 92px;
          height: 24px;

          color: #ffc400;

          text-align: right;
        }

        .aof2-terms-grid {
  width: 100%;

  display: grid;

  grid-template-columns:
    minmax(0,1fr)
    minmax(0,1fr);

  gap: 6px 10px;

  overflow: hidden;
}

        .aof2-term {
  min-width: 0;

  display: flex;
  flex-direction: column;
  align-items: flex-start;

  gap: 2px;

  overflow: hidden;
}

        .aof2-term-wide {
          grid-column: 1 / -1;
        }

       .aof2-term > span {
  width: 100%;

  color: rgba(255, 255, 255, .3);

  font-size: 6px;
  font-weight: 950;
  line-height: 1;
  letter-spacing: .34px;

  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}

       .aof2-term strong {
  width: 100%;
  min-width: 0;

  display: block;

  color: rgba(255, 255, 255, .62);

  font-size: 6.4px;
  font-weight: 850;
  line-height: 1.25;
  letter-spacing: .08px;

  overflow: hidden;

  text-align: left;
  text-transform: uppercase;

  white-space: normal;
  word-break: normal;
  overflow-wrap: normal;
}

.aof2-fee-lines {
  width: 100%;
  min-width: 0;

  display: grid;
  gap: 1px;

  color: rgba(255, 255, 255, .62);

  font-size: 6.4px;
  font-weight: 850;
  line-height: 1.25;
  letter-spacing: .08px;

  text-align: left;
  text-transform: uppercase;
}

.aof2-fee-lines div {
  min-width: 0;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

     .aof2-basic-terms {
  width: 100%;
  min-width: 0;
  min-height: 58px;

  margin-top: 4px;
  padding: 7px 9px;

  border: 1px solid rgba(255, 196, 0, .10);
  border-radius: 5px;
}

       .aof2-basic-terms-title {
  color: rgba(255,196,0,.56);

  font-size: 5.9px;
  font-weight: 950;
  letter-spacing: .5px;

  text-transform: uppercase;
}

       .aof2-basic-terms-lines {
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  gap: 2px;

  margin-top: 4px;
}

       .aof2-basic-terms-lines span {
  display: block;

  width: 100%;

  white-space: nowrap;

  font-size: 6.4px;
  font-weight: 850;
}
      

        .aof2-hours-input:focus,
        .aof2-bid-input:focus {
          border-color:
            rgba(255, 196, 0, .48);

          box-shadow:
            0 0 0 1px rgba(255, 196, 0, .08);
        }

       .aof2-actions-footer {
  position: static;

  width: 100%;
  height: 34px;
  min-height: 34px;

  margin-top: auto;
  padding-top: 7px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-top: 1px solid rgba(255,255,255,.065);

  background:
    linear-gradient(
      180deg,
      rgba(20,20,20,0),
      #141414 24%
    );
}
        .aof2-actions-footer :global(.mof-actions) {
          position: static;
          top: auto;

          width: 100%;

          margin-top: 0;

          gap: 10px;
        }

        .aof2-actions-footer :global(.mof-actions button) {
          height: 26px;
        }
      `}</style>
    </section>
  );
}
