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
  getAuctionOpeningBid,
  getAuctionTermsData,
  getPublicData
} from "./auctionObjectSelectors";

function clean(value = "") {
  return String(value || "").trim();
}

function getAuctionCompanyLogo(
  listing = {}
) {
  const publicData =
    getPublicData(listing);

  const auction =
    listing.auction ||
    listing.auctionData ||
    publicData.auction ||
    publicData.auctionData ||
    {};

  const event =
    auction.event ||
    auction.auctionEvent ||
    listing.auctionEvent ||
    publicData.auctionEvent ||
    {};

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

function getAuctionId(
  listing = {}
) {
  const publicData =
    getPublicData(listing);

  const lot =
    getAuctionLotData(listing);

  return clean(
    lot?.auctionId ||
    lot?.assetId ||
    lot?.itemId ||
    lot?.externalId ||
    lot?.lotId ||
    listing.auctionId ||
    publicData.auctionId
  );
}

function getTermValue(
  terms = {},
  keys = [],
  fallback = ""
) {
  for (const key of keys) {
    const value =
      terms?.[key];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return String(value).trim();
    }
  }

  return fallback;
}

export default function IXIAuctionObjectFace2({
  listing = {},
  dragHandleProps,

  sellerMode = false,

  auctionCompanyValue,
  onAuctionCompanyChange,

  auctionDateValue,
  onAuctionDateChange,

  auctionLocationValue,
  onAuctionLocationChange,

  auctionIdValue,
  onAuctionIdChange,

  lotNumberValue,
  onLotNumberChange,

  hoursValue,
  onHoursChange,
  onHoursKeyDown,

  openingBidValue,
  onOpeningBidChange,
  onOpeningBidKeyDown,

  buyersPremiumValue,
  onBuyersPremiumChange,

  feesValue,
  onFeesChange,

  taxRateValue,
  onTaxRateChange,

  paymentDueDateValue,
  onPaymentDueDateChange,

  removalDateValue,
  onRemovalDateChange,

  termsValue,
  onTermsChange,

  conditionValue,
  onConditionChange,

  auctionAlertsEnabled = false,
  onAuctionAlertClick
}) {
  const publicData =
    getPublicData(listing);

  const auctionTerms =
    getAuctionTermsData(listing);

  const passportId =
    listing.passportId ||
    publicData.passportId ||
    "";

  const auctionCompany =
    auctionCompanyValue ??
    getAuctionCompany(listing) ??
    "";

  const auctionCompanyLogo =
    getAuctionCompanyLogo(listing);

  const auctionDate =
    auctionDateValue ??
    getAuctionDate(listing) ??
    "";

  const auctionLocation =
    auctionLocationValue ??
    getAuctionEventLocation(
      listing
    ) ??
    "";

  const serial =
    listing.serialNumber ||
    publicData.serialNumber ||
    "—";

  const auctionId =
    auctionIdValue ??
    getAuctionId(listing) ??
    "";

  const year =
    listing.year ||
    publicData.year ||
    "";

  const make =
    listing.make ||
    publicData.make ||
    "";

  const model =
    listing.model ||
    publicData.model ||
    "";

  const hours =
    hoursValue ??
    listing.hours ??
    publicData.hours ??
    "";

  const currentBid =
    getAuctionCurrentBid(
      listing
    );

  const openingBid =
    openingBidValue ??
    getAuctionOpeningBid(
      listing
    );

  const displayedBid =
    currentBid ??
    openingBid ??
    "";

  const bidLabel =
    currentBid !== null &&
    currentBid !== undefined &&
    currentBid !== ""
      ? "CURRENT BID"
      : "OPENING BID";

  const buyersPremium =
    buyersPremiumValue ??
    getTermValue(
      auctionTerms,
      [
        "buyersPremium",
        "buyerPremium",
        "buyersPremiumText",
        "buyerPremiumText"
      ],
      "NOT LISTED"
    );

  const fees =
    feesValue ??
    getTermValue(
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
    taxRateValue ??
    getTermValue(
      auctionTerms,
      [
        "taxRate",
        "salesTaxRate",
        "tax",
        "taxText"
      ],
      "NOT LISTED"
    );

  const paymentDueDate =
    paymentDueDateValue ??
    getTermValue(
      auctionTerms,
      [
        "paymentDueDate",
        "paymentDue",
        "paymentDeadline",
        "paymentDeadlineText"
      ],
      "NOT LISTED"
    );

  const removalDate =
    removalDateValue ??
    getTermValue(
      auctionTerms,
      [
        "removalDate",
        "machineRemovalDate",
        "removalDeadline",
        "pickupDeadline",
        "removalDeadlineText"
      ],
      "NOT LISTED"
    );

  const paymentTerms =
    termsValue ??
    getTermValue(
      auctionTerms,
      [
        "paymentTerms",
        "terms",
        "termsText",
        "paymentMethod"
      ],
      "NOT LISTED"
    );

  const condition =
    conditionValue ??
    getTermValue(
      auctionTerms,
      [
        "condition",
        "conditionText",
        "saleCondition",
        "asIsWhereIs"
      ],
      "AS IS, WHERE IS"
    );

  const auctionSubtitle =
    [
      auctionDate,
      auctionLocation
    ]
      .filter(Boolean)
      .join(" • ");

  function stopCardClick(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function renderEditableField({
    value,
    onChange,
    className = "",
    placeholder = "",
    maxLength
  }) {
    if (!sellerMode) {
      return (
        <div className="aof2-term-value">
          {value || "NOT LISTED"}
        </div>
      );
    }

    return (
      <input
        className={[
          "aof2-term-input",
          className
        ]
          .filter(Boolean)
          .join(" ")}
        value={value || ""}
        onChange={event =>
          onChange?.(
            event.target.value,
            listing
          )
        }
        onClick={stopCardClick}
        onPointerDown={event =>
          event.stopPropagation()
        }
        placeholder={placeholder}
        maxLength={maxLength}
      />
    );
  }

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
              alt={
                auctionCompany ||
                "Auction company"
              }
            />
          ) : (
            <div className="aof2-logo-fallback">
              {auctionCompany ||
                "AUCTION COMPANY"}
            </div>
          )}
        </div>

        {sellerMode ? (
          <>
            <input
              className="aof2-company-input"
              value={auctionCompany || ""}
              onChange={event =>
                onAuctionCompanyChange?.(
                  event.target.value,
                  listing
                )
              }
              onClick={stopCardClick}
              onPointerDown={event =>
                event.stopPropagation()
              }
              placeholder="AUCTION COMPANY"
            />

            <div className="aof2-company-meta-edit">
              <input
                value={auctionDate || ""}
                onChange={event =>
                  onAuctionDateChange?.(
                    event.target.value,
                    listing
                  )
                }
                onClick={stopCardClick}
                onPointerDown={event =>
                  event.stopPropagation()
                }
                placeholder="SALE DATE"
              />

              <input
                value={
                  auctionLocation ||
                  ""
                }
                onChange={event =>
                  onAuctionLocationChange?.(
                    event.target.value,
                    listing
                  )
                }
                onClick={stopCardClick}
                onPointerDown={event =>
                  event.stopPropagation()
                }
                placeholder="SALE LOCATION"
              />
            </div>
          </>
        ) : (
          <>
            <strong className="aof2-company-name">
              {auctionCompany ||
                "AUCTION COMPANY NOT AVAILABLE"}
            </strong>

            <span className="aof2-company-meta">
              {auctionSubtitle ||
                "SALE DATE AND LOCATION NOT AVAILABLE"}
            </span>
          </>
        )}
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

        <div className="aof2-tag">
          <div className="aof2-tag-label">
            AUCTION ID
          </div>

          {sellerMode ? (
            <input
              className="aof2-auction-id-input"
              value={auctionId || ""}
              onChange={event =>
                onAuctionIdChange?.(
                  event.target.value,
                  listing
                )
              }
              onClick={stopCardClick}
              onPointerDown={event =>
                event.stopPropagation()
              }
              placeholder="AUCTION ID"
            />
          ) : (
            <div className="aof2-tag-value">
              {auctionId || "—"}
            </div>
          )}
        </div>
      </div>

      <IXIAuctionDeadlineRail
        listing={listing}
        sellerMode={sellerMode}
        lotNumberValue={
          lotNumberValue
        }
        onLotNumberChange={
          onLotNumberChange
        }
        alertsEnabled={
          auctionAlertsEnabled
        }
        onAlertClick={
          onAuctionAlertClick
        }
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
            onPointerDown={event =>
              event.stopPropagation()
            }
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

        {sellerMode &&
        (
          currentBid === null ||
          currentBid === undefined ||
          currentBid === ""
        ) ? (
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
            onPointerDown={event =>
              event.stopPropagation()
            }
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
            {displayedBid ||
              "NOT AVAILABLE"}
          </strong>
        )}
      </div>

      <div className="aof2-terms-grid">
        <div className="aof2-term">
          <span>
            BUYER&apos;S PREMIUM
          </span>

          {renderEditableField({
            value: buyersPremium,
            onChange:
              onBuyersPremiumChange,
            placeholder:
              "BUYER'S PREMIUM"
          })}
        </div>

        <div className="aof2-term">
          <span>FEES</span>

          {renderEditableField({
            value: fees,
            onChange: onFeesChange,
            placeholder: "FEES"
          })}
        </div>

        <div className="aof2-term">
          <span>TAX RATE</span>

          {renderEditableField({
            value: taxRate,
            onChange: onTaxRateChange,
            placeholder: "TAX RATE"
          })}
        </div>

        <div className="aof2-term">
          <span>PAYMENT DUE</span>

          {renderEditableField({
            value: paymentDueDate,
            onChange:
              onPaymentDueDateChange,
            placeholder:
              "PAYMENT DUE"
          })}
        </div>

        <div className="aof2-term">
          <span>MACHINE REMOVAL</span>

          {renderEditableField({
            value: removalDate,
            onChange:
              onRemovalDateChange,
            placeholder:
              "REMOVAL DATE"
          })}
        </div>

        <div className="aof2-term aof2-term-wide">
          <span>TERMS</span>

          {renderEditableField({
            value: paymentTerms,
            onChange: onTermsChange,
            placeholder: "TERMS"
          })}
        </div>

        <div className="aof2-term aof2-term-wide">
          <span>CONDITION</span>

          {renderEditableField({
            value: condition,
            onChange:
              onConditionChange,
            placeholder:
              "AS IS, WHERE IS"
          })}
        </div>
      </div>

      <div className="aof2-actions-footer">
        <IXIMachineObjectActions />
      </div>

      <style jsx>{`
        .aof2 {
          box-sizing: border-box;

          width: 100%;
          max-width: 100%;

          height: 378px;
          min-height: 378px;
          max-height: 378px;

          position: relative;

          padding: 10px 14px 30px;

          display: flex;
          flex-direction: column;

          background:
            radial-gradient(
              circle at top,
              rgba(255, 196, 0, .05),
              transparent 42%
            ),
            linear-gradient(
              180deg,
              rgba(255, 255, 255, .028),
              rgba(255, 255, 255, 0)
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

          margin: 0 0 6px;
          padding: 0 1px 5px;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .055
            );
        }

        .aof2-passport-label {
          min-width: 0;

          color:
            rgba(
              255,
              255,
              255,
              .32
            );

          font-size: 6.5px;
          font-weight: 950;
          line-height: 1;
          letter-spacing: .86px;

          text-transform: uppercase;
          white-space: nowrap;
        }

        .aof2-passport-id {
          min-width: 0;

          color:
            rgba(
              255,
              255,
              255,
              .68
            );

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
          min-height: 48px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          margin-bottom: 6px;

          text-align: center;
        }

        .aof2-logo-wrap {
          height: 22px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin-bottom: 2px;
        }

        .aof2-logo-wrap img {
          max-height: 21px;
          max-width: 145px;

          object-fit: contain;
        }

        .aof2-logo-fallback {
          color:
            rgba(
              255,
              255,
              255,
              .80
            );

          font-size: 10px;
          font-weight: 950;
          letter-spacing: .65px;

          text-transform: uppercase;
        }

        .aof2-company-name {
          color:
            rgba(
              255,
              255,
              255,
              .82
            );

          font-size: 9.5px;
          font-weight: 950;
          letter-spacing: .42px;

          text-transform: uppercase;
        }

        .aof2-company-meta {
          max-width: 100%;

          margin-top: 2px;

          color:
            rgba(
              255,
              255,
              255,
              .42
            );

          font-size: 7.4px;
          font-weight: 850;
          letter-spacing: .30px;

          overflow: hidden;
          text-overflow: ellipsis;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .aof2-company-input {
          width: 190px;
          height: 20px;

          margin-bottom: 3px;

          text-align: center;
        }

        .aof2-company-meta-edit {
          width: 100%;

          display: grid;
          grid-template-columns:
            1fr 1fr;

          gap: 5px;
        }

        .aof2-company-input,
        .aof2-company-meta-edit input,
        .aof2-auction-id-input,
        .aof2-hours-input,
        .aof2-bid-input,
        .aof2-term-input {
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .12
            );

          border-radius: 5px;

          background:
            rgba(
              8,
              8,
              8,
              .78
            );

          color: #f2f2f2;

          padding: 0 6px;

          font-size: 8px;
          font-weight: 900;

          outline: none;
        }

        .aof2-company-meta-edit input {
          min-width: 0;
          height: 19px;

          text-align: center;
        }

        .aof2-plate {
          width: 100%;
          min-height: 42px;

          padding: 6px 10px;
          margin-bottom: 5px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 26px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .12
            );

          border-radius: 5px;

          background:
            linear-gradient(
              90deg,
              rgba(
                255,
                255,
                255,
                .10
              ),
              rgba(
                255,
                255,
                255,
                .025
              )
            ),
            #1b1b1b;

          box-shadow:
            inset 0 1px 0
            rgba(
              255,
              255,
              255,
              .12
            ),
            inset 0 -1px 0
            rgba(
              0,
              0,
              0,
              .38
            );
        }

        .aof2-tag {
          flex: 1;
          min-width: 0;

          text-align: center;
        }

        .aof2-tag-label {
          margin-bottom: 4px;

          color:
            rgba(
              255,
              255,
              255,
              .48
            );

          font-size: 7px;
          font-weight: 950;
          letter-spacing: .18em;

          text-transform: uppercase;
        }

        .aof2-tag-value {
          color:
            rgba(
              255,
              255,
              255,
              .94
            );

          font-family:
            "Roboto Condensed",
            "Arial Narrow",
            sans-serif;

          font-size: 11px;
          font-weight: 950;
          letter-spacing: .12em;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .aof2-auction-id-input {
          width: 100%;
          height: 20px;

          text-align: center;
        }

        .aof2-title-row {
          width: 100%;

          display: flex;
          align-items: center;
          justify-content:
            space-between;

          gap: 10px;

          margin-top: 1px;
        }

        .aof2-title-row h2 {
          flex: 1;
          min-width: 0;

          margin: 0;

          color: #f2f2f2;

          font-size: 13px;
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
          color:
            rgba(
              255,
              255,
              255,
              .52
            );

          font-size: 10px;
          font-weight: 850;
          letter-spacing: .38px;

          white-space: nowrap;
        }

        .aof2-hours-input {
          width: 54px;
          height: 22px;

          text-align: right;
        }

        .aof2-bid-row {
          width: 100%;
          min-height: 33px;

          display: flex;
          align-items: center;
          justify-content:
            space-between;

          gap: 10px;

          margin-top: 4px;
          padding: 5px 0;

          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              .055
            );

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .055
            );
        }

        .aof2-bid-label {
          color:
            rgba(
              255,
              255,
              255,
              .38
            );

          font-size: 7.2px;
          font-weight: 950;
          letter-spacing: .70px;

          text-transform: uppercase;
        }

        .aof2-bid-value {
          color: #ffc400;

          font-size: 17px;
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
          flex: 1;
          min-height: 0;

          display: grid;
          grid-template-columns:
            1fr 1fr;

          align-content: start;

          gap: 4px 7px;

          padding-top: 6px;

          overflow: hidden;
        }

        .aof2-term {
          min-width: 0;

          display: grid;
          grid-template-columns:
            minmax(58px, auto)
            minmax(0, 1fr);

          align-items: center;

          gap: 5px;
        }

        .aof2-term-wide {
          grid-column: 1 / -1;

          grid-template-columns:
            76px minmax(0, 1fr);
        }

        .aof2-term > span {
          color:
            rgba(
              255,
              255,
              255,
              .32
            );

          font-size: 6.5px;
          font-weight: 950;
          letter-spacing: .42px;

          text-transform: uppercase;
          white-space: nowrap;
        }

        .aof2-term-value {
          min-width: 0;

          color:
            rgba(
              255,
              255,
              255,
              .69
            );

          font-size: 7.4px;
          font-weight: 850;
          letter-spacing: .15px;

          overflow: hidden;
          text-align: right;
          text-overflow: ellipsis;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .aof2-term-input {
          width: 100%;
          min-width: 0;
          height: 20px;

          text-align: right;
        }

        .aof2-company-input:focus,
        .aof2-company-meta-edit input:focus,
        .aof2-auction-id-input:focus,
        .aof2-hours-input:focus,
        .aof2-bid-input:focus,
        .aof2-term-input:focus {
          border-color:
            rgba(
              255,
              196,
              0,
              .48
            );

          box-shadow:
            0 0 0 1px
            rgba(
              255,
              196,
              0,
              .08
            );
        }

        .aof2-actions-footer {
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 5px;

          min-height: 22px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              .055
            );

          background:
            linear-gradient(
              180deg,
              rgba(
                20,
                20,
                20,
                0
              ),
              #141414 28%
            );

          padding-top: 4px;
        }
      `}</style>
    </section>
  );
}
