import {
  cleanMachineTitle,
  formatHours,
  getListingHref
} from "../../lib/listingFormatters";

function clean(value = "") {
  return String(value || "").trim();
}

function getPublicData(listing = {}) {
  return (
    listing.publicData ||
    listing.attributes?.publicData ||
    {}
  );
}

function getAuctionData(listing = {}) {
  const publicData = getPublicData(listing);

  return (
    listing.auction ||
    listing.auctionData ||
    publicData.auction ||
    publicData.auctionData ||
    {}
  );
}

function getAuctionCompany(listing = {}) {
  const publicData = getPublicData(listing);
  const auction = getAuctionData(listing);

  return clean(
    auction?.company?.name ||
    auction?.event?.companyName ||
    listing.auctionCompanyName ||
    publicData.auctionCompanyName ||
    publicData.auctionCompany
  );
}

function getAuctionEventName(listing = {}) {
  const publicData = getPublicData(listing);
  const auction = getAuctionData(listing);

  return clean(
    auction?.event?.name ||
    auction?.event?.eventName ||
    listing.auctionEventName ||
    publicData.auctionEventName
  );
}

function getAuctionFormat(listing = {}) {
  const publicData = getPublicData(listing);
  const auction = getAuctionData(listing);

  return clean(
    auction?.event?.format ||
    listing.auctionFormat ||
    publicData.auctionFormat
  );
}

function getAuctionParticipation(listing = {}) {
  const publicData = getPublicData(listing);
  const auction = getAuctionData(listing);

  return clean(
    auction?.event?.participation ||
    listing.auctionParticipation ||
    publicData.auctionParticipation
  );
}

function getAuctionEventLocation(listing = {}) {
  const publicData = getPublicData(listing);
  const auction = getAuctionData(listing);

  return clean(
    auction?.event?.location?.label ||
    auction?.event?.locationLabel ||
    listing.auctionLocation ||
    publicData.auctionLocation
  );
}

function getAuctionDate(listing = {}) {
  const publicData = getPublicData(listing);
  const auction = getAuctionData(listing);

  return clean(
    auction?.event?.dateText ||
    auction?.event?.saleDateText ||
    auction?.event?.startsAt ||
    listing.auctionDate ||
    publicData.auctionDate
  );
}

function getLotNumber(listing = {}) {
  const publicData = getPublicData(listing);
  const auction = getAuctionData(listing);

  return clean(
    auction?.lot?.number ||
    auction?.lot?.lotNumber ||
    listing.lotNumber ||
    publicData.lotNumber
  );
}

function getMachineLocation(listing = {}) {
  const publicData = getPublicData(listing);
  const auction = getAuctionData(listing);

  return clean(
    auction?.lot?.machineLocation?.label ||
    listing.location ||
    publicData.location ||
    publicData.cityState ||
    publicData.loc?.address ||
    publicData.loc
  );
}

function splitLocation(value = "") {
  const parts = String(value || "")
    .split(",")
    .map(item => item.trim());

  return {
    city: parts[0] || "",
    state: String(parts[1] || "")
      .slice(0, 2)
      .toUpperCase()
  };
}

function formatAuctionLabel(value = "") {
  return clean(value)
    .replace(/[_-]+/g, " ")
    .toUpperCase();
}

export default function IXIAuctionObjectFace1({
  listing = {},
  from = "browse",
  onListingClick,

  sellerMode = false,

  lotNumberValue,
  onLotNumberChange,

  hoursValue,
  onHoursChange,
  onHoursKeyDown,

  priceValue,
  onPriceChange,
  onPriceKeyDown,

  locationValue,
  onLocationChange,
  onLocationKeyDown
}) {
  const publicData = getPublicData(listing);

  const lotNumber =
    lotNumberValue ??
    getLotNumber(listing);

  const auctionCompany =
    getAuctionCompany(listing);

  const auctionEventName =
    getAuctionEventName(listing);

  const auctionFormat =
    getAuctionFormat(listing);

  const auctionParticipation =
    getAuctionParticipation(listing);

  const auctionEventLocation =
    getAuctionEventLocation(listing);

  const auctionDate =
    getAuctionDate(listing);

  const machineLocation =
    locationValue ||
    getMachineLocation(listing);

  const {
    city: machineCity,
    state: machineState
  } = splitLocation(machineLocation);

  const currentHours =
    hoursValue ??
    String(
      listing.hours ||
      publicData.hours ||
      ""
    ).replace(/[^0-9]/g, "");

  const currentPrice =
    priceValue ??
    listing.price ??
    publicData.price ??
    "";

  const auctionTypeLine = [
    formatAuctionLabel(auctionFormat),
    formatAuctionLabel(auctionParticipation)
  ]
    .filter(Boolean)
    .join(" ");

  function stopCardClick(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div className="aof1">
      <div className="aof1-lot-row">
        <span className="aof1-lot-label">
          LOT #
        </span>

        {sellerMode ? (
          <input
            className="aof1-lot-input"
            value={lotNumber}
            onChange={event =>
              onLotNumberChange?.(
                event.target.value,
                listing
              )
            }
            onClick={stopCardClick}
            placeholder="LOT"
            maxLength={12}
          />
        ) : (
          <strong className="aof1-lot-value">
            {lotNumber || "—"}
          </strong>
        )}
      </div>

      <a
        href={getListingHref(listing, from)}
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

      <div className="aof1-auction-information">
        <strong className="aof1-company">
          {auctionCompany ||
            "AUCTION COMPANY NOT AVAILABLE"}
        </strong>

        <span className="aof1-event-name">
          {auctionEventName ||
            "AUCTION EVENT NOT AVAILABLE"}
        </span>

        <span className="aof1-event-type">
          {auctionTypeLine ||
            "AUCTION FORMAT NOT AVAILABLE"}
        </span>

        <span className="aof1-event-location">
          {auctionEventLocation ||
            "EVENT LOCATION NOT AVAILABLE"}
        </span>

        <span className="aof1-event-date">
          {auctionDate ||
            "SALE DATE NOT AVAILABLE"}
        </span>
      </div>

      <div className="aof1-bottom">
        {sellerMode ? (
          <input
            className="aof1-price-input"
            value={currentPrice}
            onChange={event =>
              onPriceChange?.(
                event.target.value,
                listing
              )
            }
            onClick={stopCardClick}
            onKeyDown={event =>
              onPriceKeyDown?.(
                event,
                listing
              )
            }
          />
        ) : (
          <strong className="aof1-price">
            {currentPrice ||
              "Call for price"}
          </strong>
        )}

        {sellerMode ? (
          <div className="aof1-location-editor">
            <input
              className="aof1-city-input"
              value={machineCity}
              onChange={event =>
                onLocationChange?.(
                  `${event.target.value}, ${machineState}`,
                  listing
                )
              }
              onClick={stopCardClick}
              onKeyDown={event =>
                onLocationKeyDown?.(
                  event,
                  listing
                )
              }
              placeholder="CITY"
              maxLength={18}
            />

            <input
              className="aof1-state-input"
              value={machineState}
              onChange={event =>
                onLocationChange?.(
                  `${machineCity}, ${event.target.value
                    .slice(0, 2)
                    .toUpperCase()}`,
                  listing
                )
              }
              onClick={stopCardClick}
              onKeyDown={event =>
                onLocationKeyDown?.(
                  event,
                  listing
                )
              }
              placeholder="ST"
              maxLength={2}
            />
          </div>
        ) : (
          <span className="aof1-machine-location">
            ⌖ {machineLocation ||
              "LOCATION NOT AVAILABLE"}
          </span>
        )}
      </div>

      <style jsx>{`
        .aof1 {
          height: 100%;
          min-width: 0;

          display: flex;
          flex-direction: column;
        }

        .aof1-lot-row {
          height: 22px;
          min-height: 22px;

          display: flex;
          align-items: center;
          gap: 5px;

          color: #ffc400;
        }

        .aof1-lot-label,
        .aof1-lot-value {
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .72px;
          line-height: 1;

          text-transform: uppercase;
        }

        .aof1-lot-input {
          width: 66px;
          height: 22px;

          border: 1px solid #343434;
          border-radius: 7px;

          background: #101010;
          color: #ffc400;

          padding: 0 7px;

          font-size: 9px;
          font-weight: 950;
          letter-spacing: .45px;

          outline: none;
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
          justify-content: space-between;
          align-items: flex-start;

          gap: 10px;
          overflow: hidden;
        }

        .aof1-title-row h3 {
          margin: 0;

          max-width: calc(100% - 62px);

          color: #f2f2f2;

          font-size: 15.5px;
          font-weight: 900;
          line-height: 1.12;
          letter-spacing: -.28px;

          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;

          overflow: hidden;
        }

        .aof1-hours {
          position: absolute;
          top: 1px;
          right: 0;

          width: 58px;

          color: rgba(255,255,255,.54);

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

          width: 54px;
          height: 30px;

          border: 1px solid #343434;
          border-radius: 8px;

          background: #101010;
          color: rgba(255,255,255,.62);

          padding: 0 8px;

          font-size: 11px;
          font-weight: 900;

          text-align: right;
          outline: none;
        }

        .aof1-auction-information {
          min-height: 79px;

          display: flex;
          flex-direction: column;

          margin-top: 4px;
          padding-top: 6px;

          border-top:
            1px solid
            rgba(255,255,255,.045);

          overflow: hidden;
        }

        .aof1-auction-information span,
        .aof1-company {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          text-transform: uppercase;
        }

        .aof1-company {
          color: rgba(255,255,255,.82);

          font-size: 9.5px;
          font-weight: 950;
          letter-spacing: .34px;
        }

        .aof1-event-name {
          margin-top: 3px;

          color: rgba(255,255,255,.66);

          font-size: 8.7px;
          font-weight: 900;
          letter-spacing: .3px;
        }

        .aof1-event-type,
        .aof1-event-location,
        .aof1-event-date {
          margin-top: 3px;

          color: rgba(255,255,255,.45);

          font-size: 8.4px;
          font-weight: 850;
          letter-spacing: .32px;
        }

        .aof1-bottom {
          position: relative;

          min-height: 42px;

          display: flex;
          align-items: flex-end;
          justify-content: space-between;

          gap: 10px;

          margin-top: auto;
          padding-top: 12px;
        }

        .aof1-bottom::before {
          content: "";

          position: absolute;
          top: 4px;
          left: 0;

          width: 100%;
          height: 1px;

          background:
            rgba(255,255,255,.045);
        }

        .aof1-bottom::after {
          content: "";

          position: absolute;
          top: 4px;
          left: 0;

          width: 34%;
          height: 1px;

          background:
            linear-gradient(
              90deg,
              rgba(255,196,0,.26),
              transparent
            );
        }

        .aof1-price {
          color: #f2f2f2;

          font-size: 17.25px;
          font-weight: 850;

          white-space: nowrap;
        }

        .aof1-price-input {
          width: 62px;
          height: 32px;

          border: 1px solid #343434;
          border-radius: 8px;

          background: #101010;
          color: #f2f2f2;

          padding: 0 10px;

          font-size: 11px;
          font-weight: 900;

          outline: none;
        }

        .aof1-location-editor {
          display: flex;
          gap: 6px;
        }

        .aof1-city-input,
        .aof1-state-input {
          height: 32px;

          border: 1px solid #343434;
          border-radius: 8px;

          background: #101010;
          color: rgba(255,255,255,.62);

          padding: 0 8px;

          font-size: 10px;
          font-weight: 900;
          letter-spacing: .28px;

          text-transform: uppercase;
          outline: none;
        }

        .aof1-city-input {
          width: 72px;
        }

        .aof1-state-input {
          width: 30px;
          text-align: center;
        }

        .aof1-machine-location {
          max-width: 52%;

          color: rgba(255,255,255,.48);

          font-size: 10.5px;
          font-weight: 850;
          letter-spacing: .42px;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          text-align: right;
          text-transform: uppercase;
        }

        .aof1-lot-input:focus,
        .aof1-hours-input:focus,
        .aof1-price-input:focus,
        .aof1-city-input:focus,
        .aof1-state-input:focus {
          border-color:
            rgba(255,196,0,.42);

          box-shadow:
            0 0 0 1px
            rgba(255,196,0,.10);
        }
      `}</style>
    </div>
  );
}
