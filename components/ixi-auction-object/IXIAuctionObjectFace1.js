import {
  cleanMachineTitle,
  formatHours,
  getListingHref
} from "../../lib/listingFormatters";

import IXIAuctionDeadlineRail
from "./IXIAuctionDeadlineRail";

import IXIAuctionFacts
from "./IXIAuctionFacts";

import IXIAuctionMachineFooter
from "./IXIAuctionMachineFooter";

import {
  getPublicData
} from "./auctionObjectSelectors";

export default function IXIAuctionObjectFace1({
  listing = {},
  from = "browse",
  onListingClick,

  sellerMode = false,

  lotNumberValue,
onLotNumberChange,
onLotNumberKeyDown,

  hoursValue,
  onHoursChange,
  onHoursKeyDown,

  priceValue,
  onPriceChange,
  onPriceKeyDown,

  locationValue,
  onLocationChange,
  onLocationKeyDown,

  auctionAlertsEnabled = false,
  onAuctionAlertClick
}) {
  const publicData =
    getPublicData(listing);

  const currentHours =
    hoursValue ??
    String(
      listing.hours ||
      publicData.hours ||
      ""
    ).replace(
      /[^0-9]/g,
      ""
    );

  function stopCardClick(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div className="aof1">
      <IXIAuctionDeadlineRail
        listing={listing}
        sellerMode={sellerMode}

        lotNumberValue={
          lotNumberValue
        }

        onLotNumberChange={
          onLotNumberChange
        }

  onLotNumberKeyDown={
  onLotNumberKeyDown
}

        alertsEnabled={
          auctionAlertsEnabled
        }

        onAlertClick={
          onAuctionAlertClick
        }
      />

      <a
        href={getListingHref(
          listing,
          from
        )}
        className="aof1-title-link"
        onClick={onListingClick}
      >
        <div className="aof1-title-row">
          <h3>
            {cleanMachineTitle(
              listing.title
            )}
          </h3>

          {sellerMode ? (
            <input
              className="aof1-hours-input"
              value={currentHours}
              onChange={event =>
                onHoursChange?.(
                  event.target.value,
                  listing
                )
              }
              onClick={stopCardClick}
              onKeyDown={event =>
                onHoursKeyDown?.(
                  event,
                  listing
                )
              }
              inputMode="numeric"
              maxLength={5}
              placeholder="HRS"
            />
          ) : (
            <span className="aof1-hours">
              {formatHours(
                listing.hours ||
                publicData.hours
              )}
            </span>
          )}
        </div>
      </a>

      <IXIAuctionFacts
        listing={listing}
      />

      <IXIAuctionMachineFooter
        listing={listing}
        sellerMode={sellerMode}

        priceValue={
          priceValue
        }

        onPriceChange={
          onPriceChange
        }

        onPriceKeyDown={
          onPriceKeyDown
        }

        locationValue={
          locationValue
        }

        onLocationChange={
          onLocationChange
        }

        onLocationKeyDown={
          onLocationKeyDown
        }
      />

      <style jsx>{`
        .aof1 {
          height: 100%;
          min-width: 0;

          display: flex;
          flex-direction: column;
        }

        .aof1-title-link {
          display: block;

          color: inherit;
          text-decoration: none;

          min-width: 0;
        }

        .aof1-title-row {
          position: relative;

          height: 34px;
          min-height: 34px;

          display: flex;
          justify-content:
            space-between;
          align-items: flex-start;

          gap: 10px;

          overflow: hidden;
        }

        .aof1-title-row h3 {
          margin: 0;

          max-width:
            calc(
              100% - 62px
            );

          color: #f2f2f2;

          font-size: 15.5px;
          font-weight: 900;
          line-height: 1.12;
          letter-spacing: -.28px;

          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient:
            vertical;

          overflow: hidden;
        }

        .aof1-hours {
          position: absolute;
          top: 1px;
          right: 0;

          width: 58px;

          color:
            rgba(
              255,
              255,
              255,
              .54
            );

          font-size: 12px;
          font-weight: 500;
          line-height: 1;
          letter-spacing: .18px;

          text-align: right;
          white-space: nowrap;
        }

        .aof1-hours-input {
          position: absolute;
          top: 0;
          right: 0;

          width: 52px;
          height: 24px;

          border: 1px solid
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

          color:
            rgba(
              255,
              255,
              255,
              .68
            );

          padding: 0 6px;

          font-size: 9px;
          font-weight: 900;

          text-align: right;
          outline: none;
        }

        .aof1-hours-input:focus {
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
      `}</style>
    </div>
  );
}
