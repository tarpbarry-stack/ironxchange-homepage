import {
  cleanMachineTitle,
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
  const publicData =
    getPublicData(listing);

  return (
    listing.auctionData ||
    publicData.auctionData ||
    {}
  );
}

function getAuctionEvent(listing = {}) {
  const publicData =
    getPublicData(listing);

  const auctionData =
    getAuctionData(listing);

  return (
    listing.auctionEvent ||
    publicData.auctionEvent ||
    auctionData.event ||
    {}
  );
}

function getAuctionLot(listing = {}) {
  const publicData =
    getPublicData(listing);

  const auctionData =
    getAuctionData(listing);

  return (
    listing.auctionLot ||
    publicData.auctionLot ||
    auctionData.lot ||
    {}
  );
}

function getLotNumber(listing = {}) {
  const publicData =
    getPublicData(listing);

  const auctionData =
    getAuctionData(listing);

  const auctionLot =
    getAuctionLot(listing);

  return clean(
    auctionLot.lotNumber ||
    auctionLot.number ||
    auctionData.lotNumber ||
    publicData.lotNumber ||
    listing.lotNumber
  );
}

function getAuctionCompany(listing = {}) {
  const publicData =
    getPublicData(listing);

  const auctionData =
    getAuctionData(listing);

  const auctionEvent =
    getAuctionEvent(listing);

  return clean(
    auctionEvent.companyName ||
    auctionEvent.auctionHouseName ||
    auctionData.companyName ||
    auctionData.auctionCompany ||
    publicData.auctionCompanyName ||
    publicData.auctionCompany ||
    listing.auctionCompanyName ||
    listing.auctionCompany
  ) || "AUCTION COMPANY";
}

function getAuctionDate(listing = {}) {
  const publicData =
    getPublicData(listing);

  const auctionData =
    getAuctionData(listing);

  const auctionEvent =
    getAuctionEvent(listing);

  return clean(
    auctionEvent.saleDateText ||
    auctionEvent.startsAt ||
    auctionEvent.saleDate ||
    auctionData.saleDateText ||
    auctionData.saleDate ||
    auctionData.auctionDate ||
    publicData.auctionDate ||
    listing.auctionDate
  ) || "SALE DATE NOT LISTED";
}

function getLocation(listing = {}) {
  const publicData =
    getPublicData(listing);

  return clean(
    listing.location ||
    publicData.location ||
    publicData.cityState ||
    publicData.loc?.address ||
    publicData.loc
  ) || "LOCATION NOT LISTED";
}

function getAuctionPrice(listing = {}) {
  const publicData =
    getPublicData(listing);

  return clean(
    listing.auctionDisplayPrice ||
    publicData.auctionDisplayPrice ||
    listing.price
  ) || "$1.00";
}

export default function IXIAuctionObjectFace1({
  listing = {},
  from = "browse",
  onListingClick
}) {
  const lotNumber =
    getLotNumber(listing);

  const auctionCompany =
    getAuctionCompany(listing);

  const auctionDate =
    getAuctionDate(listing);

  const auctionPrice =
    getAuctionPrice(listing);

  const location =
    getLocation(listing);

  return (
    <div className="aof1">
      <div className="aof1-lot">
        LOT #{lotNumber || "—"}
      </div>

      <a
        href={getListingHref(listing, from)}
        className="aof1-title-link"
        onClick={onListingClick}
      >
        <h3>
          {cleanMachineTitle(
            listing.title
          )}
        </h3>
      </a>

      <div className="aof1-auction">
        <strong>
          {auctionCompany}
        </strong>

        <span>
          {auctionDate}
        </span>
      </div>

      <div className="aof1-bottom">
        <strong className="aof1-price">
          {auctionPrice}
        </strong>

        <span className="aof1-location">
          ⌖ {location}
        </span>
      </div>

      <style jsx>{`
        .aof1 {
          height: 100%;

          display: flex;
          flex-direction: column;

          min-width: 0;
        }

        .aof1-lot {
          height: 18px;
          min-height: 18px;

          color: #ffc400;

          font-size: 9px;
          font-weight: 950;
          letter-spacing: 0.72px;
          line-height: 1;

          text-transform: uppercase;
        }

        .aof1-title-link {
          display: block;

          color: inherit;
          text-decoration: none;

          min-width: 0;
        }

        .aof1-title-link h3 {
          margin: 0;

          color: #f2f2f2;

          font-size: 15.5px;
          font-weight: 900;
          line-height: 1.12;
          letter-spacing: -0.28px;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          text-rendering: geometricPrecision;
        }

        .aof1-auction {
          min-height: 48px;

          display: flex;
          flex-direction: column;
          justify-content: center;

          margin-top: 8px;
          padding-top: 8px;

          border-top:
            1px solid
            rgba(255,255,255,.045);
        }

        .aof1-auction strong {
          color: rgba(255,255,255,.78);

          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.38px;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          text-transform: uppercase;
        }

        .aof1-auction span {
          margin-top: 4px;

          color: rgba(255,255,255,.46);

          font-size: 9px;
          font-weight: 850;
          letter-spacing: 0.38px;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          text-transform: uppercase;
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
          top: 5px;
          left: 0;

          width: 100%;
          height: 1px;

          background:
            rgba(255,255,255,.045);
        }

        .aof1-bottom::after {
          content: "";

          position: absolute;
          top: 5px;
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
          letter-spacing: -0.12px;

          white-space: nowrap;
        }

        .aof1-location {
          color: rgba(255,255,255,.48);

          font-size: 10.5px;
          font-weight: 850;
          letter-spacing: 0.42px;

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
