import {
  getAuctionCurrentBid,
  getAuctionOpeningBid,
  getMachineLocation,
  getPublicData,
  splitLocation
} from "./auctionObjectSelectors";

export default function IXIAuctionMachineFooter({
  listing = {},

  sellerMode = false,

  priceValue,
  onPriceChange,
  onPriceKeyDown,

  locationValue,
  onLocationChange,
  onLocationKeyDown
}) {
  const publicData =
    getPublicData(listing);

  const machineLocation =
    locationValue ||
    getMachineLocation(listing);

  const {
    city: machineCity,
    state: machineState
  } = splitLocation(
    machineLocation
  );

  const currentBid =
  getAuctionCurrentBid(
    listing
  );

const openingBid =
  getAuctionOpeningBid(
    listing
  );

const currentPrice =
  priceValue ??
  currentBid ??
  openingBid ??
  "";

  function stopCardClick(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div className="auction-machine-footer">
      {sellerMode ? (
        <input
          className="auction-price-input"
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
          placeholder="PRICE"
        />
      ) : (
        <strong className="auction-price">
          {currentPrice ||
            "Call for price"}
        </strong>
      )}

      {sellerMode ? (
        <div className="auction-location-editor">
          <input
            className="auction-city-input"
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
            className="auction-state-input"
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
        <span className="auction-machine-location">
          ⌖{" "}
          {machineLocation ||
            "LOCATION NOT AVAILABLE"}
        </span>
      )}

      <style jsx>{`
        .auction-machine-footer {
          position: relative;

          height: 39px;
          min-height: 39px;

          display: flex;
          align-items: flex-end;
          justify-content: space-between;

          gap: 10px;

          margin-top: 4px;
          padding-top: 10px;
        }

        .auction-machine-footer::before {
          content: "";

          position: absolute;
          top: 3px;
          left: 0;

          width: 100%;
          height: 1px;

          background:
            rgba(
              255,
              255,
              255,
              .045
            );
        }

        .auction-machine-footer::after {
          content: "";

          position: absolute;
          top: 3px;
          left: 0;

          width: 34%;
          height: 1px;

          background:
            linear-gradient(
              90deg,
              rgba(
                255,
                196,
                0,
                .26
              ),
              transparent
            );
        }

        .auction-price {
          color: #f2f2f2;

          font-size: 17.25px;
          font-weight: 850;

          white-space: nowrap;
        }

        .auction-price-input {
          width: 62px;
          height: 25px;

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

          color: #f2f2f2;

          padding: 0 7px;

          font-size: 9px;
          font-weight: 900;

          outline: none;
        }

        .auction-location-editor {
          display: flex;
          gap: 5px;
        }

        .auction-city-input,
        .auction-state-input {
          height: 25px;

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
              .62
            );

          padding: 0 7px;

          font-size: 9px;
          font-weight: 900;
          letter-spacing: .25px;

          text-transform: uppercase;
          outline: none;
        }

        .auction-city-input {
          width: 70px;
        }

        .auction-state-input {
          width: 29px;
          text-align: center;
        }

        .auction-price-input:focus,
        .auction-city-input:focus,
        .auction-state-input:focus {
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

        .auction-machine-location {
          max-width: 52%;

          color:
            rgba(
              255,
              255,
              255,
              .48
            );

          font-size: 10.5px;
          font-weight: 850;
          letter-spacing: .42px;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          text-align: right;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}
