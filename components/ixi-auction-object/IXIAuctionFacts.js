import {
  formatAuctionLabel,
  getAuctionCompany,
  getAuctionDate,
  getAuctionEventLocation,
  getAuctionEventName,
  getAuctionFormat,
  getAuctionParticipation
} from "./auctionObjectSelectors";

export default function IXIAuctionFacts({
  listing = {}
}) {
  const auctionCompany =
    getAuctionCompany(listing);

  const auctionEventName =
    getAuctionEventName(listing);

  const auctionFormat =
    getAuctionFormat(listing);

  const auctionParticipation =
    getAuctionParticipation(
      listing
    );

  const auctionEventLocation =
    getAuctionEventLocation(
      listing
    );

  const auctionDate =
    getAuctionDate(listing);

  const auctionTypeLine = [
    formatAuctionLabel(
      auctionFormat
    ),
    formatAuctionLabel(
      auctionParticipation
    )
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="auction-facts">
      <strong className="auction-company">
        {auctionCompany ||
          "AUCTION COMPANY NOT AVAILABLE"}
      </strong>

      <span className="auction-event-name">
        {auctionEventName ||
          "AUCTION EVENT NOT AVAILABLE"}
      </span>

      <span className="auction-type">
        {auctionTypeLine ||
          "AUCTION FORMAT NOT AVAILABLE"}
      </span>

      <span className="auction-event-location">
        {auctionEventLocation ||
          "EVENT LOCATION NOT AVAILABLE"}
      </span>

      <span className="auction-date">
        {auctionDate ||
          "SALE DATE NOT AVAILABLE"}
      </span>

      <style jsx>{`
        .auction-facts {
          min-height: 73px;
          min-width: 0;

          display: flex;
          flex-direction: column;

          margin-top: 3px;
          padding-top: 6px;

          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              .045
            );

          overflow: hidden;
        }

        .auction-facts span,
        .auction-company {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          text-transform: uppercase;
        }

        .auction-company {
          color:
            rgba(
              255,
              255,
              255,
              .82
            );

          font-size: 9.5px;
          font-weight: 950;
          letter-spacing: .34px;
        }

        .auction-event-name {
          margin-top: 2px;

          color:
            rgba(
              255,
              255,
              255,
              .66
            );

          font-size: 8.7px;
          font-weight: 900;
          letter-spacing: .3px;
        }

        .auction-type,
        .auction-event-location,
        .auction-date {
          margin-top: 2px;

          color:
            rgba(
              255,
              255,
              255,
              .45
            );

          font-size: 8.4px;
          font-weight: 850;
          letter-spacing: .32px;
        }
      `}</style>
    </div>
  );
}
