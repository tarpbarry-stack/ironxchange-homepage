Today 1:45 PM
Pasted text(1213).txt
Document
ironxchange-homepage-main (5)(1).zip
Zip Archive
stop : the console in XL is fine side by side - 
okay okay okay okay okay - good job chat you got that fixed - but at the same time by doing so you revealed a flaw in teh way we make card faces - hahaha - can you find the issue in this photo - 
i think you kind of understood what happened - let me break it down for you - im going to upload teh files of these differnt auction faces - visually the aof2 on teh right of the listing card is much smaller horizontally - and that is really odd to me - as to why - i actually dont know that I am against it ? but I dont konw that I am foir it - hahah - look at this now - same aof2 form a differnt auction with different info ? 
Pasted text(1214).txt
Document
Pasted text (2)(94).txt
Document
Pasted text (3)(34).txt
Document
so how do we fix this now ? import {
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

      <style jsx>{
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
      }</style>
    </div>
  );
} ; 
we have another spacing issue - one that has been prevelant but I never really stopped to address it : look at our board spacing on each of these scale sizes - obviuously its fucked up - I think the board needs to be much smarter - we need to make it smarter - teh gap between an opened card and teh next uponed card is likeley because of the previous chat not understanding that the board controls that - and he triued to make soem code in another page control it - bad plan - 
ironxchange-homepage-main (5)(2).zip
Zip Archive
Pasted text(1216).txt
Document
ironxchange-homepage-main (6).zip
Zip Archive
this one is 45 seconds old 
Pasted text(1217).txt
Document
give me a file to migrate teh board - i will upload the file start at teh top - 
Pasted text(1218).txt
Document
Pasted text(1219).txt
Document
we spoke about this - we spoke about it - it wasnt suppsoed to matter ??? that swhat I askled - that what yuou said 
Pasted text(1220).txt
Document
here is the current file 
Pasted text(1221).txt
Document
5 - more specific - like I am a retarded retard - this is what I have changed so Far - check it - 1-4 - 
Pasted text(1222).txt
Document
rewrite teh whole file I will drop it in 
Pasted text(1223).txt
Document
export function getUpdatedMachineFactMessages({
  before = {},
  after = {}
}) {
  const messages = [];

  const beforePrice = String(before.price || "").replace(/[^0-9]/g, "");
  const afterPrice = String(after.price || "").replace(/[^0-9]/g, "");

  const beforeHours = String(before.hours || "").replace(/[^0-9]/g, "");
  const afterHours = String(after.hours || "").replace(/[^0-9]/g, "");

  const beforeLocation = String(before.location || "");
  const afterLocation = String(after.location || "");

    const beforeDescription = String(before.description || "");
  const afterDescription = String(after.description || "");

  const beforeKeywords = Array.isArray(before.keywords)
    ? before.keywords.map(String).sort()
    : [];

  const afterKeywords = Array.isArray(after.keywords)
    ? after.keywords.map(String).sort()
    : [];

  if (beforePrice !== afterPrice) {
    messages.push("PRICE UPDATED");
  }

  if (beforeHours !== afterHours) {
    messages.push("HOURS UPDATED");
  }

  if (beforeLocation !== afterLocation) {
    messages.push("LOCATION UPDATED");
  }

    if (beforeDescription !== afterDescription) {
    messages.push("DESCRIPTION UPDATED");
  }

  if (JSON.stringify(beforeKeywords) !== JSON.stringify(afterKeywords)) {
    messages.push("KEYWORDS UPDATED");
  }

  if (!messages.length) {
    messages.push("LISTING UPDATED");
  }

  return messages;
}

export async function updateMachineFacts({
  commandBus,
  listingId,
  title = "",
  before = {},
  after = {},
  context = ""
}) {
  if (!listingId) {
    throw new Error("Missing listingId");
  }

  if (!commandBus?.updateMachineFacts) {
    throw new Error("Missing updateMachineFacts command");
  }

  const result = await commandBus.updateMachineFacts({
    listingId,
    title,
    price: after.price,
    hours: after.hours,
    location: after.location,
    description: after.description,
    keywords: after.keywords || []
  });

  const notices = getUpdatedMachineFactMessages({
    before,
    after
  });

  return {
    ok: true,
    command: "UPDATE_MACHINE_FACTS",
    context,
    listingId: String(listingId),
    requested: {
      title,
      price: after.price,
      hours: after.hours,
      location: after.location,
      description: after.description,
      keywords: after.keywords || []
    },
    result,
    listing: result?.listing,
    verification: result?.verification,
    notices
  };
}
Pasted text(1224).txt
Document
Pasted text(1225).txt
Document
ironxchange-homepage-main (7).zip
Zip Archive
Pasted text(1226).txt
Document
Pasted text (2)(95).txt
Document
Pasted text (3)(35).txt
Document
import {
  formatAuctionLabel,
  getAuctionCompany,
  getAuctionDate,
  getAuctionEventLocation,
  getAuctionEventName,
  getAuctionFormat,
  getAuctionParticipation,
  getAuctionTime
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

  const auctionTime =
  getAuctionTime(listing);

  const auctionDateTimeLine = [
  auctionDate,
  auctionTime
]
  .filter(Boolean)
  .join(" • ");

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
  {auctionDateTimeLine ||
    "SALE DATE NOT AVAILABLE"}
</span>

      <style jsx>{
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
      }</style>
    </div>
  );
} : import {
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
        <div className="auction-location-editor location-row">
          <input
            className="auction-city-input city-input"
            value={machineCity}
            onChange={event =>
              onLocationChange?.(
                ${event.target.value}, ${machineState},
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
            className="auction-state-input state-input"
            value={machineState}
            onChange={event =>
              onLocationChange?.(
                ${machineCity}, ${event.target.value
                  .slice(0, 2)
                  .toUpperCase()},
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

      <style jsx>{
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
      }</style>
    </div>
  );
} : function clean(value = "") {
  return String(value || "").trim();
}

function cleanObject(value) {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? value
    : {};
}

export function getPublicData(listing = {}) {
  return (
    listing.publicData ||
    listing.attributes?.publicData ||
    {}
  );
}

export function getAuctionData(listing = {}) {
  const publicData =
    getPublicData(listing);

  return cleanObject(
    listing.auctionObject ||
    publicData.auctionObject ||
    listing.auction ||
    listing.auctionData ||
    publicData.auction ||
    publicData.auctionData
  );
}

/*
 * Prefer the canonical nested auction event.
 * Compatibility event objects remain fallback-only.
 */
export function getAuctionEventData(
  listing = {}
) {
  const publicData =
    getPublicData(listing);

  const auction =
    getAuctionData(listing);

  return cleanObject(
    auction.event ||
    auction.auctionEvent ||
    listing.auctionEvent ||
    publicData.auctionEvent
  );
}

export function getAuctionMachineData(
  listing = {}
) {
  const publicData =
    getPublicData(listing);

  const auction =
    getAuctionData(listing);

  return cleanObject(
    auction.machine ||
    auction.asset ||
    listing.auctionMachine ||
    publicData.auctionMachine
  );
}

/*
 * Auction lot may be nested inside the canonical
 * auction object or supplied as a separate object.
 */
export function getAuctionLotData(
  listing = {}
) {
  const publicData =
    getPublicData(listing);

  const auction =
    getAuctionData(listing);

  const machine =
    getAuctionMachineData(listing);

  return cleanObject(
    listing.auctionLot ||
    publicData.auctionLot ||
    auction.lot ||
    auction.auctionLot ||
    machine
  );
}

export function getAuctionTermsData(
  listing = {}
) {
  const publicData =
    getPublicData(listing);

  const auction =
    getAuctionData(listing);

  return cleanObject(
    listing.auctionTerms ||
    publicData.auctionTerms ||
    auction.terms ||
    auction.auctionTerms
  );
}

export function getAuctionCompany(
  listing = {}
) {
  const publicData =
    getPublicData(listing);

  const auction =
    getAuctionData(listing);

  const event =
    getAuctionEventData(listing);

  return clean(
    auction?.company?.name ||
    auction?.companyName ||
    auction?.auctionCompanyName ||
    event?.company?.name ||
    event?.companyName ||
    event?.auctionCompanyName ||
    auction?.provider?.name ||
    auction?.providerName ||
    auction?.provider ||
    auction?.platform?.name ||
    auction?.platformName ||
    auction?.platform ||
    listing.auctionCompanyName ||
    publicData.auctionCompanyName ||
    publicData.auctionCompany
  );
}

export function getAuctionEventName(
  listing = {}
) {
  const publicData =
    getPublicData(listing);

  const event =
    getAuctionEventData(listing);

  return clean(
  event?.name ||
  event?.eventName ||
  event?.eventTitle ||
  event?.title ||
  event?.saleName ||
  listing.auctionEventName ||
  publicData.auctionEventName
);
}

export function getAuctionFormat(
  listing = {}
) {
  const publicData =
    getPublicData(listing);

  const auction =
    getAuctionData(listing);

  const event =
    getAuctionEventData(listing);

  return clean(
  event?.format ||
  event?.auctionFormat ||
  event?.auctionType ||
  event?.saleFormat ||
  auction?.format ||
  auction?.auctionFormat ||
  auction?.auctionType ||
  listing.auctionFormat ||
  publicData.auctionFormat
);
}

export function getAuctionParticipation(
  listing = {}
) {
  const publicData =
    getPublicData(listing);

  const auction =
    getAuctionData(listing);

  const event =
    getAuctionEventData(listing);

  return clean(
    event?.participation ||
    event?.participationType ||
    event?.biddingType ||
    auction?.participation ||
    auction?.participationType ||
    listing.auctionParticipation ||
    publicData.auctionParticipation
  );
}

export function getAuctionEventLocation(
  listing = {}
) {
  const publicData =
    getPublicData(listing);

  const event =
    getAuctionEventData(listing);

  return clean(
  event?.location?.label ||
  event?.location?.name ||
  event?.location?.fullAddress ||
  event?.location?.address ||
  event?.location?.street ||
  [
    event?.location?.city,
    event?.location?.state
  ]
    .filter(Boolean)
    .join(", ") ||
  event?.locationLabel ||
  event?.eventLocation ||
  event?.cityState ||
  listing.auctionLocation ||
  publicData.auctionLocation
);
}

export function getAuctionDate(
  listing = {}
) {
  const publicData =
    getPublicData(listing);

  const event =
    getAuctionEventData(listing);

  const lot =
    getAuctionLotData(listing);

  return clean(
    event?.dateText ||
    event?.saleDateText ||
    event?.auctionDateText ||
    event?.startsAt ||
    event?.startAt ||
    event?.saleDate ||
    event?.date ||
    lot?.saleDateText ||
    lot?.saleDate ||
    listing.auctionDate ||
    publicData.auctionDate
  );
}

export function getAuctionTime(
  listing = {}
) {
  const publicData =
    getPublicData(listing);

  const event =
    getAuctionEventData(listing);

  const lot =
    getAuctionLotData(listing);

  return clean(
    event?.timeText ||
    event?.saleTimeText ||
    event?.auctionTimeText ||
    event?.startTimeText ||
    event?.time ||
    lot?.saleTimeText ||
    lot?.timeText ||
    listing.auctionTime ||
    publicData.auctionTime
  );
}

export function getLotNumber(
  listing = {}
) {
  const publicData =
    getPublicData(listing);

  const machine =
    getAuctionMachineData(listing);

  const lot =
    getAuctionLotData(listing);

  return clean(
    machine?.lotNumber ||
    machine?.lotNo ||
    machine?.lotId ||
    machine?.lot ||
    lot?.number ||
    lot?.lotNumber ||
    lot?.lotNo ||
    lot?.lotId ||
    listing.lotNumber ||
    publicData.lotNumber
  );
}

export function getScheduledCloseAt(
  listing = {}
) {
  const publicData =
    getPublicData(listing);

  const auction =
    getAuctionData(listing);

  const event =
    getAuctionEventData(listing);

  const lot =
    getAuctionLotData(listing);

  const deadlines =
    auction?.deadlines || {};

  return clean(
    deadlines?.scheduledCloseAt ||
    deadlines?.closeAt ||
    deadlines?.closesAt ||
    deadlines?.endAt ||
    lot?.scheduledCloseAt ||
    lot?.closeAt ||
    lot?.closesAt ||
    lot?.endAt ||
    lot?.timing?.scheduledCloseAt ||
    lot?.timing?.closeAt ||
    auction?.scheduledCloseAt ||
    auction?.closeAt ||
    auction?.timing?.scheduledCloseAt ||
    auction?.timing?.closeAt ||
    event?.scheduledCloseAt ||
    event?.closeAt ||
    event?.endsAt ||
    event?.timing?.scheduledCloseAt ||
    event?.timing?.closeAt ||
    listing.scheduledCloseAt ||
    publicData.scheduledCloseAt ||
    publicData.auctionCloseAt
  );
}
export function getSourceTimezone(
  listing = {}
) {
  const publicData =
    getPublicData(listing);

  const auction =
    getAuctionData(listing);

  const event =
    getAuctionEventData(listing);

  const lot =
    getAuctionLotData(listing);

  return clean(
    lot?.timezone ||
    lot?.timing?.timezone ||
    event?.timezone ||
    event?.timing?.timezone ||
    auction?.timezone ||
    auction?.timing?.timezone ||
    listing.auctionTimezone ||
    publicData.auctionTimezone
  );
}

export function getMachineLocation(
  listing = {}
) {
  const publicData =
    getPublicData(listing);

  const lot =
    getAuctionLotData(listing);

  return clean(
    lot?.machineLocation?.label ||
    lot?.machineLocation?.name ||
    lot?.machineLocation?.address ||
    lot?.machineLocationLabel ||
    lot?.location?.label ||
    lot?.locationLabel ||
    listing.location ||
    publicData.location ||
    publicData.cityState ||
    publicData.loc?.address ||
    publicData.loc
  );
}

export function splitLocation(
  value = ""
) {
  const parts =
    String(value || "")
      .split(",")
      .map(item =>
        item.trim()
      );

  return {
    city:
      parts[0] || "",

    state:
      String(parts[1] || "")
        .slice(0, 2)
        .toUpperCase()
  };
}

export function formatAuctionLabel(
  value = ""
) {
  return clean(value)
    .replace(/[_-]+/g, " ")
    .toUpperCase();
}

export function getAuctionOpeningBid(
  listing = {}
) {
  const auction =
    getAuctionData(listing);

  const machine =
    getAuctionMachineData(listing);

  const lot =
    getAuctionLotData(listing);

  return (
    machine?.openingBid ??
    machine?.bidding?.openingBid ??
    lot?.openingBid ??
    lot?.bidding?.openingBid ??
    auction?.openingBid ??
    auction?.bidding?.openingBid ??
    null
  );
}

export function getAuctionCurrentBid(
  listing = {}
) {
  const auction =
    getAuctionData(listing);

  const machine =
    getAuctionMachineData(listing);

  const lot =
    getAuctionLotData(listing);

  return (
    machine?.currentBid ??
    machine?.bidding?.currentBid ??
    lot?.currentBid ??
    lot?.bidding?.currentBid ??
    auction?.currentBid ??
    auction?.bidding?.currentBid ??
    null
  );
} : 
Pasted text(1227).txt
Document
let me tell you some facts - teh auction items are url uploads - tehy are private to teh user - they have 1 picture on sharetribe and a descrip[tion just to make the listing - we use or do nothing to update any of that - this goes 100% through aws - 
Pasted text(1228).txt
Document
read this 
Pasted text(1229).txt
Document
where do I add thsi function - show me exactly 
Pasted text(1231).txt
Document
import IXIMachineObjectActions from "./IXIMachineObjectActions";
import { formatHours } from "../../lib/listingFormatters";

export default function IXIMachineObjectFace2({
  listing = {},
  dragHandleProps
}) {
  const publicData = listing.publicData || listing.attributes?.publicData || {};

  const passportId =
  listing.passportId ||
  publicData.passportId ||
  "";

  const sellerLogo =
    listing.sellerLogo ||
    listing.profileImage ||
    publicData.sellerLogo ||
    "";

  const sellerName =
    listing.sellerCompany ||
    listing.companyName ||
    listing.sellerName ||
    listing.authorName ||
    "IRONXCHANGE SELLER";

  const serial =
    listing.serialNumber ||
    publicData.serialNumber ||
    "—";

  const stock =
    listing.stockNumber ||
    publicData.stockNumber ||
    "—";

  const year = listing.year || publicData.year || "";
  const make = listing.make || publicData.make || "";
  const model = listing.model || publicData.model || "";

  const hours =
    listing.hours ||
    publicData.hours ||
    "";

  const price =
    listing.price ||
    publicData.price ||
    "Call for price";

  const description =
    listing.description ||
    publicData.description ||
    publicData.details ||
    "Machine bio not listed.";

  return (
    <section
  className="mof2"
  {...(dragHandleProps || {})}
>

 <div className="mof2-passport-wrap">
  <div className="mof2-passport-label">
    IXI Machine Passport
  </div>

  {passportId ? (
    <a
      href={/p/${passportId}}
      className="mof2-passport-id"
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
    <div className="mof2-passport-id mof2-passport-id-empty">
      &nbsp;
    </div>
  )}
</div>
      <div className="mof2-logo-wrap">
        {sellerLogo ? (
          <img src={sellerLogo} alt={sellerName} />
        ) : (
          <div className="mof2-logo-fallback">{sellerName}</div>
        )}
      </div>

    <div className="mof2-plate">
  <div className="mof2-tag">
    <div className="mof2-tag-label">
      SERIAL NUMBER
    </div>

    <div className="mof2-tag-value">
      {serial}
    </div>
  </div>

  <div className="mof2-tag">
    <div className="mof2-tag-label">
      STOCK NUMBER
    </div>

    <div className="mof2-tag-value">
      {stock}
    </div>
  </div>
</div>

     <div className="mof2-title-row">
  <h2>
    {[year, make, model].filter(Boolean).join(" ")}
  </h2>

  <div className="mof2-hours">
    {hours ? formatHours(hours) : ""}
  </div>
</div>

<div className="mof2-price">{price}</div>
      <p className="mof2-bio">{description}</p>

     <IXIMachineObjectActions />

      <style jsx>{
        .mof2 {
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
          align-items: center;
          text-align: center;
          background:
            radial-gradient(circle at top, rgba(255,196,0,.05), transparent 42%),
            linear-gradient(180deg, rgba(255,255,255,.028), rgba(255,255,255,0)),
            #141414;
          color: #f2f2f2;
        }

.mof2-passport-wrap {
  width: 100%;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  gap: 12px;

  margin: 0 0 7px;
  padding: 0 1px 6px;

  border-bottom: 1px solid rgba(255, 255, 255, 0.055);
}

.mof2-passport-label {
  min-width: 0;

  color: rgba(255, 255, 255, 0.32);

  font-size: 6.5px;
  font-weight: 950;
  line-height: 1;
  letter-spacing: 0.86px;

  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}

.mof2-passport-id {
  display: block;
  min-width: 0;

  margin: 0;

  color: rgba(255, 255, 255, 0.68);

  font-size: 8px;
  font-weight: 950;
  line-height: 1;
  letter-spacing: 0.82px;

  text-align: right;
  text-decoration: none;
  text-transform: uppercase;
  white-space: nowrap;

  transition:
    color 0.14s ease,
    text-shadow 0.14s ease;
}

.mof2-passport-id:hover {
  color: #ffc400;

  text-shadow:
    0 0 12px rgba(255, 196, 0, 0.12);
}

.mof2-passport-id-empty {
  min-width: 40px;
  min-height: 8px;
  pointer-events: none;
}

        .mof2-logo-wrap {
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }

        .mof2-logo-wrap img {
          max-height: 42px;
          max-width: 150px;
          object-fit: contain;
        }

        .mof2-logo-fallback {
          color: rgba(255,255,255,.68);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: .8px;
          text-transform: uppercase;
        }

     .mof2-plate {
  width: 100%;
  min-height: 52px;

  padding: 8px 10px;
  margin-bottom: 13px;

  display: flex;
  justify-content: center;
  align-items: center;

  gap: 26px;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 5px;
          background:
            linear-gradient(90deg, rgba(255,255,255,.10), rgba(255,255,255,.025)),
            #1b1b1b;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.12),
            inset 0 -1px 0 rgba(0,0,0,.38);
        }

        .mof2-plate span {
          color: rgba(255,255,255,.64);
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .62px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

          .mof2-tag {
  flex: 1;
  min-width: 0;
  text-align: center;
}

.mof2-tag-label {
   font-size: 9px;
  font-weight: 950;

  letter-spacing: .22em;

  color: rgba(255,255,255,.48);

  text-transform: uppercase;
  text-align: center;
  margin-bottom: 6px;
}

.mof2-tag-value {
  font-size: 15px;
  font-weight: 950;

  letter-spacing: .16em;

  color: rgba(255,255,255,.94);

  font-family:
    "Roboto Condensed",
    "Arial Narrow",
    sans-serif;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}


        h2 {
          margin: 0;
          max-width: 100%;
          color: #f2f2f2;
          font-size: 14px;
          font-weight: 950;
          line-height: 1.05;
          letter-spacing: -.15px;
          text-transform: uppercase;
        }

        .mof2-title-row {
  width: 100%;

  display: flex;
  justify-content: space-between;
  align-items: center;
  
  gap: 10px;
}

.mof2-title-row h2 {
  text-align: left;
  flex: 1;
}

.mof2-hours {
  white-space: nowrap;

  color: rgba(255,255,255,.48);

  font-size: 14px;
  font-weight: 800;

  position: relative;
  top: -2px;
}

        .mof2-hours {
          margin-top: 5px;
          color: rgba(255,255,255,.52);
          font-size: 11px;
          font-weight: 850;
          letter-spacing: .38px;
        }

        .mof2-price {
          margin-top: 9px;
          color: #FFC400;
          font-size: 18px;
          font-weight: 950;
          letter-spacing: -.25px;
        }

        .mof2-bio {
          width: 100%;
          flex: 1;
          margin: 12px 0 12px;
          padding: 12px 10px;
          overflow: hidden;
          color: rgba(255,255,255,.70);
          font-size: 11px;
          font-weight: 700;
          line-height: 1.38;
          text-align: left;
          border-top: 1px solid rgba(255,255,255,.055);
          border-bottom: 1px solid rgba(255,255,255,.055);
        }


      }</style>
    </section>
  );
} : import IXIMachineObjectActions from "./IXIMachineObjectActions";

export default function IXIMachineObjectFace4({
  dragHandleProps
}) {
  return (
    <section
  className="mof4"
  {...(dragHandleProps || {})}
>
      <div className="mof4-logo">IRONXCHANGE</div>

      <div className="mof4-kicker">HELP BUILD THE IRON NETWORK</div>

      <h2>WE NEED YOUR IRON</h2>

      <p>
        List your machines free. Use the tools. Reach real buyers.
      </p>

      <div className="mof4-points">
        <span>NO LISTING FEES</span>
        <span>NO CREDIT CARDS</span>
        <span>NO NONSENSE</span>
      </div>

      <p className="mof4-copy">
        Built for equipment people who actually buy and sell iron.
        Add your machines and help us build the marketplace this industry
        should already have.
      </p>

      <div className="mof4-cta">
        CREATE ACCOUNT · POST FREE · SELL MORE IRON
      </div>

      <IXIMachineObjectActions labels={["JOIN", "POST", "MORE"]} />

      <style jsx>{
        .mof4 {
          box-sizing: border-box;
          width: 100%;
          max-width: 100%;
          height: 378px;
          min-height: 378px;
          max-height: 378px;

          position: relative;

          padding: 18px 14px 43px;

          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;

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
          color: #f2f2f2;
        }

        .mof4-logo {
          margin-top: 4px;
          color: #FFC400;
          font-size: 18px;
          font-weight: 950;
          letter-spacing: 1.2px;
        }

        .mof4-kicker {
          margin-top: 12px;
          color: rgba(255,255,255,.48);
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .7px;
        }

        h2 {
          margin: 12px 0 0;
          color: #f2f2f2;
          font-size: 22px;
          font-weight: 950;
          letter-spacing: -.5px;
        }

        p {
          max-width: 92%;
          margin: 12px 0 0;
          color: rgba(255,255,255,.72);
          font-size: 12px;
          font-weight: 800;
          line-height: 1.35;
        }

        .mof4-points {
          width: 100%;
          margin-top: 16px;

          display: grid;
          grid-template-columns: 1fr;
          gap: 7px;
        }

        .mof4-points span {
          padding: 7px 8px;

          border: 1px solid rgba(255,196,0,.18);
          border-radius: 7px;

          background:
            linear-gradient(180deg, rgba(255,196,0,.055), rgba(255,196,0,0)),
            rgba(0,0,0,.34);

          color: #FFC400;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .5px;
        }

        .mof4-copy {
          margin-top: 14px;
          color: rgba(255,255,255,.62);
          font-size: 10px;
          font-weight: 750;
          line-height: 1.42;
        }

        .mof4-cta {
          margin-top: auto;
          margin-bottom: 8px;

          color: rgba(255,255,255,.5);
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .45px;
        }
      }</style>
    </section>
  );
} :  import IXIMachineObjectActions from "./IXIMachineObjectActions";

export default function IXIMachineObjectFace4({
  dragHandleProps
}) {
  return (
    <section
  className="mof4"
  {...(dragHandleProps || {})}
>
      <div className="mof4-logo">IRONXCHANGE</div>

      <div className="mof4-kicker">HELP BUILD THE IRON NETWORK</div>

      <h2>WE NEED YOUR IRON</h2>

      <p>
        List your machines free. Use the tools. Reach real buyers.
      </p>

      <div className="mof4-points">
        <span>NO LISTING FEES</span>
        <span>NO CREDIT CARDS</span>
        <span>NO NONSENSE</span>
      </div>

      <p className="mof4-copy">
        Built for equipment people who actually buy and sell iron.
        Add your machines and help us build the marketplace this industry
        should already have.
      </p>

      <div className="mof4-cta">
        CREATE ACCOUNT · POST FREE · SELL MORE IRON
      </div>

      <IXIMachineObjectActions labels={["JOIN", "POST", "MORE"]} />

      <style jsx>{
        .mof4 {
          box-sizing: border-box;
          width: 100%;
          max-width: 100%;
          height: 378px;
          min-height: 378px;
          max-height: 378px;

          position: relative;

          padding: 18px 14px 43px;

          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;

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
          color: #f2f2f2;
        }

        .mof4-logo {
          margin-top: 4px;
          color: #FFC400;
          font-size: 18px;
          font-weight: 950;
          letter-spacing: 1.2px;
        }

        .mof4-kicker {
          margin-top: 12px;
          color: rgba(255,255,255,.48);
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .7px;
        }

        h2 {
          margin: 12px 0 0;
          color: #f2f2f2;
          font-size: 22px;
          font-weight: 950;
          letter-spacing: -.5px;
        }

        p {
          max-width: 92%;
          margin: 12px 0 0;
          color: rgba(255,255,255,.72);
          font-size: 12px;
          font-weight: 800;
          line-height: 1.35;
        }

        .mof4-points {
          width: 100%;
          margin-top: 16px;

          display: grid;
          grid-template-columns: 1fr;
          gap: 7px;
        }

        .mof4-points span {
          padding: 7px 8px;

          border: 1px solid rgba(255,196,0,.18);
          border-radius: 7px;

          background:
            linear-gradient(180deg, rgba(255,196,0,.055), rgba(255,196,0,0)),
            rgba(0,0,0,.34);

          color: #FFC400;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .5px;
        }

        .mof4-copy {
          margin-top: 14px;
          color: rgba(255,255,255,.62);
          font-size: 10px;
          font-weight: 750;
          line-height: 1.42;
        }

        .mof4-cta {
          margin-top: auto;
          margin-bottom: 8px;

          color: rgba(255,255,255,.5);
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .45px;
        }
      }</style>
    </section>
  );
}
Pasted text(1232).txt
Document
Pasted text(1233).txt
Document
lets go !!!!!!
Pasted text(1234).txt
Document
Pasted text(1235).txt
Document
Edit
Edit
marketplace - squared ??????.htm
File
what happened to my photos what happened ?????????? the edges have never been squared never never never never 
Pasted text(1236).txt
Document
Pasted text(1237).txt
Document
Pasted text(1238).txt
Document
Pasted text(1239).txt
Document
Pasted text (2)(96).txt
Document
Pasted text(1240).txt
Document
Pasted text(1241).txt
Document
Pasted text(1242).txt
Document
Pasted text(1243).txt
Document
okay - now we got the card its in teh right place - but when you click to open it - then its higher and small again : 
Pasted text(1244).txt
Document
Pasted text(1245).txt
Document
where do the variant Tall go : 
Pasted text(1246).txt
Document
Pasted text(1247).txt
Document
okay AOF2 - every thing above teh action buttons are correct - does not need to move not 1 px - the action boxes need t o be 10px higher - 
Pasted text(1248).txt
Document
i need aof3 to be on teh same line and teh same excact height of the AOF2
so we just made this change - look at where teh footer went - Look we need to fucking standardize all of these faces and we need to do it now - Maybe we need to build face studio now - so we can use it to build faces - IDK 
Pasted text(1249).txt
Document
 1348 |           gap: 4px;
 1349 |         }
 1350 |       }</style>
 1351 |     </section>
      :     ^^^^^^^^^^
 1352 |   );
 1353 | }
      ----
Caused by:
    Syntax Error
Import trace for requested module:
./components/ixi-auction-object/IXIAuctionObjectFace3.jsx
./components/ixi-machine-card/auction/AuctionListingCard.js
./components/ixi-machine-card/IXIMachineCard.js
./components/ixi-chassis/IXIBoard.js
./pages/auction-market/index.js
> Build failed because of webpack errors
Error: Command "npm run build" exited with 1
Pasted text(1250).txt
Document
Pasted text(1251).txt
Document
 734 |             )}
 735 |           </em>
 736 |         </div>
 737 | </IXIFaceFrame>
     : ^^^^^^^^^^^^^^^
 738 | 
 739 |       <section className="aof3-bid-pack">
 740 |         <div className="aof3-bid-pack-title">
     ----
Caused by:
    Syntax Error
Import trace for requested module:
./components/ixi-auction-object/IXIAuctionObjectFace3.jsx
./components/ixi-machine-card/auction/AuctionListingCard.js
./components/ixi-machine-card/IXIMachineCard.js
./components/ixi-chassis/IXIBoard.js
./pages/auction-market/index.js
> Build failed because of webpack errors
Error: Command "npm run build" exited with 1 : read teh file - show me what to change description lines above and below 

Yes. That is the right move. We were turning a single migration into dozens of tiny edits.

I rewrote the entire AOF3 file as the finished Face Studio version, preserving the bid calculations and fields while standardizing:

compact/tall faceSize;
shared IXIFaceFrame;
permanent shared action footer;
shared sections;
shared rows;
shared grids;
shared total cards;
removal of the old conflicting chassis and footer CSS.

It is based on the current file you posted.

IXIAuctionObjectFace3.finished.jsx

Replace:

components/ixi-auction-object/IXIAuctionObjectFace3.jsx

with that complete file.

IXIAuctionObjectFace3.finished.jsx
Code
next

Next is AOF2, and we are not doing another chain of tiny edits.

I’ll rewrite the entire current IXIAuctionObjectFace2.jsx so it:

preserves every selector, auction term, deadline, buyer-premium tier, input, and source link;
uses IXIFaceFrame;
uses the shared fixed IXIFaceActionFooter;
accepts faceSize="tall" by default;
supports compact/tall rendering inside Face Lab;
removes the old 472px chassis and the hand-positioned footer;
keeps everything above the footer in the same order.

Then we replace the whole production file once and compile.

go 
Pasted text(1252).txt
Document
Worked for 47s

I rewrote AOF2 completely against the Face Studio chassis while preserving its auction selectors, buyer-premium logic, deadlines, terms, editable values, and source link.

IXIAuctionObjectFace2.finished.jsx

Replace:

components/ixi-auction-object/IXIAuctionObjectFace2.jsx

with that file.

Then in:

components/ixi-face-studio/IXIFacePreview.jsx

find the AOF2 preview call and add:

faceSize={
  previewSize
}

It should read:

<IXIAuctionObjectFace2
  listing={
    previewListing
  }

  faceSize={
    previewSize
  }

  sourceListingUrl={
    "https://example.com/auction-listing"
  }

  sellerMode={
    true
  }

  lotNumberValue={
    "1842"
  }

  onLotNumberChange={() => {}}
  onLotNumberKeyDown={() => {}}

  hoursValue={
    "2485"
  }

  onHoursChange={() => {}}
  onHoursKeyDown={() => {}}

  openingBidValue={
    "125000"
  }

  onOpeningBidChange={() => {}}
  onOpeningBidKeyDown={() => {}}
/>

Production remains tall by default. Face Lab can render AOF2 in both compact and tall chassis.

IXIAuctionObjectFace2.finished.jsx
Code

Library
/
IXIAuctionObjectFace2.finished.jsx
import IXIFaceFrame
  from "../ixi-face-studio/IXIFaceFrame";

import IXIFaceActionFooter
  from "../ixi-face-studio/IXIFaceActionFooter";

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

function cleanObject(value) {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? value
    : {};
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

/*
 * Normalize buyer-premium tier structures for AOF2.
 *
 * Existing purchaseTiers always win. This preserves
 * Proxibid and every parser already using the shared
 * frontend contract.
 *
 * RB-style `tiers` are fallback-only.
 */
function normalizeBuyerPremiumData(
  value = {}
) {
  const buyerPremium =
    cleanObject(value);

  const existingPurchaseTiers =
    Array.isArray(
      buyerPremium.purchaseTiers
    )
      ? buyerPremium.purchaseTiers
      : [];

  if (
    existingPurchaseTiers.length > 0
  ) {
    return buyerPremium;
  }

  const sourceTiers =
    Array.isArray(
      buyerPremium.tiers
    )
      ? buyerPremium.tiers
      : [];

  if (sourceTiers.length === 0) {
    return buyerPremium;
  }

  return {
    ...buyerPremium,

    purchaseTiers:
      sourceTiers.map(tier => ({
        minAmount:
          tier?.minAmount ??
          tier?.minimumAmount ??
          0,

        minAmountExclusive:
          tier?.minAmountExclusive ??
          null,

        maxAmount:
          tier?.maxAmount ??
          tier?.maximumAmount ??
          null,

        cashCheckWireRatePercent:
          tier?.cashCheckWireRatePercent ??
          tier?.ratePercent ??
          null,

        minimumFee:
          tier?.minimumFee ??
          null,

        flatFee:
          tier?.flatFee ??
          null,

        rawText:
          tier?.rawText ??
          ""
      }))
  };
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
  sourceListingUrl = "",
  dragHandleProps,

  sellerMode = false,

  lotNumberValue,
onLotNumberChange,
onLotNumberKeyDown,
  
  hoursValue,
  onHoursChange,
  onHoursKeyDown,

  openingBidValue,
  onOpeningBidChange,
  onOpeningBidKeyDown,

  auctionAlertsEnabled = false,
  onAuctionAlertClick,

  faceSize = "tall"
}) {
  const publicData = getPublicData(listing);
const auctionRoot = getAuctionRoot(listing);
const auctionDeadlines = auctionRoot?.deadlines || {};
const auctionMachine = getAuctionMachineData(listing);
const auctionTerms = getAuctionTermsData(listing);

  const originalListingUrl =
  clean(sourceListingUrl);

  const auctionRules =
  auctionRoot?.auctionRules || {};

const buyerPremiumData =
  normalizeBuyerPremiumData(
    auctionRules?.buyerPremium ||
    auctionRoot?.buyerPremium ||
    auctionTerms?.buyerPremium ||
    auctionTerms?.buyersPremium ||
    {}
  );

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

const specialFees =
  Array.isArray(
    auctionTerms?.specialFees
  )
    ? auctionTerms.specialFees
    : [];

const interestFee =
  specialFees.find(
    fee =>
      clean(
        fee?.type
      ).toLowerCase() ===
      "interest"
  ) || {};

const lateFee =
  specialFees.find(
    fee =>
      clean(
        fee?.type
      ).toLowerCase() ===
      "late_fee"
  ) || {};
  
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
  clean(
    getAuctionEventLocation(listing)
  ).toUpperCase();

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

const buyerPremiumLines =
  Array.isArray(
    buyerPremiumData.purchaseTiers
  ) &&
  buyerPremiumData.purchaseTiers.length
    ? buyerPremiumData.purchaseTiers
        .map(tier => {
          const minAmountRaw =
            tier?.minAmountExclusive ??
            tier?.minAmount ??
            0;

          const minAmount =
            Number(minAmountRaw);

          const maxAmount =
            tier?.maxAmount == null
              ? null
              : Number(
                  tier.maxAmount
                );

          const ratePercent =
            tier?.cashCheckWireRatePercent ==
            null
              ? null
              : Number(
                  tier.cashCheckWireRatePercent
                );

          const minimumFee =
            tier?.minimumFee == null
              ? null
              : Number(
                  tier.minimumFee
                );

          const flatFee =
            tier?.flatFee == null
              ? null
              : Number(
                  tier.flatFee
                );

          const safeMinAmount =
            Number.isFinite(minAmount)
              ? minAmount
              : 0;

          const safeMaxAmount =
            Number.isFinite(maxAmount)
              ? maxAmount
              : null;

          let range = "";

          if (
            safeMaxAmount !== null &&
            safeMinAmount <= 0
          ) {
            range =
              `UP TO $${safeMaxAmount.toLocaleString(
                "en-US"
              )}`;
          } else if (
            safeMaxAmount !== null
          ) {
            range =
              `$${safeMinAmount.toLocaleString(
                "en-US"
              )}–$${safeMaxAmount.toLocaleString(
                "en-US"
              )}`;
          } else {
            range =
              `OVER $${safeMinAmount.toLocaleString(
                "en-US"
              )}`;
          }

          if (
            Number.isFinite(flatFee)
          ) {
            return (
              `${range} — ` +
              `$${flatFee.toLocaleString(
                "en-US"
              )} FLAT`
            );
          }

          if (
            Number.isFinite(ratePercent)
          ) {
            const minimumText =
              Number.isFinite(minimumFee)
                ? (
                    ` — $${minimumFee.toLocaleString(
                      "en-US"
                    )} MINIMUM`
                  )
                : "";

            return (
              `${range} — ` +
              `${ratePercent}%` +
              minimumText
            );
          }

          return clean(
            tier?.rawText
          );
        })
        .filter(Boolean)
    : [];

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
  
 const basicTerms =
  Array.isArray(
    auctionTerms?.basicTerms
  )
    ? auctionTerms.basicTerms.filter(
        term =>
          term &&
          term.confirmed !== false &&
          clean(term.label)
      )
    : [];

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

const interestRatePercent =
  interestFee?.ratePercent == null
    ? null
    : Number(
        interestFee.ratePercent
      );

const feeLines = [
  internetPremiumRate
    ? `${internetPremiumRate}% INTERNET PREMIUM`
    : "",

  internetPremiumCap
    ? `$${Number(internetPremiumCap).toLocaleString(
        "en-US"
      )} CAP`
    : "",

  Number.isFinite(
    interestRatePercent
  )
    ? `${interestRatePercent}% ANNUAL INTEREST`
    : "",

  storageFeePerDay
    ? (
        `$${Number(storageFeePerDay).toLocaleString(
          "en-US"
        )}/DAY` +
        (
          storageFeePerItem
            ? " PER ITEM STORAGE"
            : " STORAGE"
        )
      )
    : "",

  lateFee?.rawText
    ? clean(
        lateFee.rawText
      ).toUpperCase()
    : ""
].filter(Boolean);
  
  return (
    <IXIFaceFrame
      className="aof2"
      contentClassName="aof2-content"
      size={faceSize}
      dragHandleProps={
        dragHandleProps
      }
      footer={
        <IXIFaceActionFooter />
      }
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
        onLotNumberKeyDown={onLotNumberKeyDown}
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

  {buyerPremiumLines.length ? (
    <div className="aof2-premium-lines">
      {buyerPremiumLines.map((line, index) => (
        <div key={`${line}-${index}`}>
          {line}
        </div>
      ))}
    </div>
  ) : (
    <strong>
      {getTermValue(
        auctionTerms,
        [
          "buyersPremium",
          "buyerPremium"
        ],
        "NOT LISTED"
      )}
    </strong>
  )}
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
  <span
    key={
      term.code ||
      `${term.label}-${index}`
    }
  >
    {term.label}
  </span>
))
  ) : (
    <span>TERMS NOT AVAILABLE</span>
  )}
</div>
      </div>

     {originalListingUrl ? (
  <div className="aof2-source-listing">
    <a
      href={originalListingUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="aof2-source-link"
      onClick={event => {
        event.stopPropagation();
      }}
      onPointerDown={event => {
        event.stopPropagation();
      }}
    >
      OPEN ORIGINAL LISTING →
    </a>
  </div>
) : null}
      <style jsx>{`
:global(.aof2-content) {
  display: flex;
  flex-direction: column;

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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  text-align: center;
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

margin-top: 5px;

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
  align-items: center;
  justify-content: flex-start;

  text-align: center;

  gap: 7px;

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

  font-size: 8.2px;
font-weight: 850;
line-height: 1.18;
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

  align-items: center;
  text-align: center;

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

.aof2-premium-lines {
  width: 100%;
  min-width: 0;

  align-items: center;
  text-align: center;

  display: grid;
  gap: 2px;

  color: rgba(255, 255, 255, .62);

 font-size: 8.2px;
  font-weight: 850;
  line-height: 1.18;
  letter-spacing: .08px;

  text-align: left;
  text-transform: uppercase;
}

.aof2-premium-lines div {
  min-width: 0;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

     .aof2-basic-terms {
  width: 100%;
  min-width: 0;
  min-height: 58px;

  display: flex;
  flex-direction: column;
  align-items: center;

  margin-top: 4px;
  padding: 7px 9px;

  border: 1px solid rgba(255, 196, 0, .10);
  border-radius: 5px;
}

       .aof2-basic-terms-title {
  color: rgba(255,196,0,.56);

  text-align: center;

  font-size: 8.2px;
  font-weight: 850;
  letter-spacing: .5px;

  text-transform: uppercase;
}

       .aof2-basic-terms-lines {
 width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;

  text-align: center;

  gap: 2px;

  margin-top: 4px;
}

       .aof2-basic-terms-lines span {
  display: block;

  width: 100%;

  white-space: nowrap;

 font-size: 8.2px;
  font-weight: 850;
}
      

        .aof2-hours-input:focus,
        .aof2-bid-input:focus {
          border-color:
            rgba(255, 196, 0, .48);

          box-shadow:
            0 0 0 1px rgba(255, 196, 0, .08);
        }

        .aof2-source-listing {
  width: 100%;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-top: 4px;
  padding: 4px 0 2px;
}

.aof2-source-link {
  color: rgba(255, 196, 0, .62);

  font-size: 6.8px;
  font-weight: 950;
  line-height: 1;
  letter-spacing: .48px;

  text-decoration: none;
  text-transform: uppercase;
}

.aof2-source-link:hover {
  color: #ffc400;
}

             `}</style>
    </IXIFaceFrame>
  );
}
Library
/
IXIAuctionObjectFace2.finished.jsx
import IXIFaceFrame
  from "../ixi-face-studio/IXIFaceFrame";

import IXIFaceActionFooter
  from "../ixi-face-studio/IXIFaceActionFooter";

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

function cleanObject(value) {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? value
    : {};
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

/*
 * Normalize buyer-premium tier structures for AOF2.
 *
 * Existing purchaseTiers always win. This preserves
 * Proxibid and every parser already using the shared
 * frontend contract.
 *
 * RB-style `tiers` are fallback-only.
 */
function normalizeBuyerPremiumData(
  value = {}
) {
  const buyerPremium =
    cleanObject(value);

  const existingPurchaseTiers =
    Array.isArray(
      buyerPremium.purchaseTiers
    )
      ? buyerPremium.purchaseTiers
      : [];

  if (
    existingPurchaseTiers.length > 0
  ) {
    return buyerPremium;
  }

  const sourceTiers =
    Array.isArray(
      buyerPremium.tiers
    )
      ? buyerPremium.tiers
      : [];

  if (sourceTiers.length === 0) {
    return buyerPremium;
  }

  return {
    ...buyerPremium,

    purchaseTiers:
      sourceTiers.map(tier => ({
        minAmount:
          tier?.minAmount ??
          tier?.minimumAmount ??
          0,

        minAmountExclusive:
          tier?.minAmountExclusive ??
          null,

        maxAmount:
          tier?.maxAmount ??
          tier?.maximumAmount ??
          null,

        cashCheckWireRatePercent:
          tier?.cashCheckWireRatePercent ??
          tier?.ratePercent ??
          null,

        minimumFee:
          tier?.minimumFee ??
          null,

        flatFee:
          tier?.flatFee ??
          null,

        rawText:
          tier?.rawText ??
          ""
      }))
  };
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
  sourceListingUrl = "",
  dragHandleProps,

  sellerMode = false,

  lotNumberValue,
onLotNumberChange,
onLotNumberKeyDown,
  
  hoursValue,
  onHoursChange,
  onHoursKeyDown,

  openingBidValue,
  onOpeningBidChange,
  onOpeningBidKeyDown,

  auctionAlertsEnabled = false,
  onAuctionAlertClick,

  faceSize = "tall"
}) {
  const publicData = getPublicData(listing);
const auctionRoot = getAuctionRoot(listing);
const auctionDeadlines = auctionRoot?.deadlines || {};
const auctionMachine = getAuctionMachineData(listing);
const auctionTerms = getAuctionTermsData(listing);

  const originalListingUrl =
  clean(sourceListingUrl);

  const auctionRules =
  auctionRoot?.auctionRules || {};

const buyerPremiumData =
  normalizeBuyerPremiumData(
    auctionRules?.buyerPremium ||
    auctionRoot?.buyerPremium ||
    auctionTerms?.buyerPremium ||
    auctionTerms?.buyersPremium ||
    {}
  );

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

const specialFees =
  Array.isArray(
    auctionTerms?.specialFees
  )
    ? auctionTerms.specialFees
    : [];

const interestFee =
  specialFees.find(
    fee =>
      clean(
        fee?.type
      ).toLowerCase() ===
      "interest"
  ) || {};

const lateFee =
  specialFees.find(
    fee =>
      clean(
        fee?.type
      ).toLowerCase() ===
      "late_fee"
  ) || {};
  
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
  clean(
    getAuctionEventLocation(listing)
  ).toUpperCase();

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

const buyerPremiumLines =
  Array.isArray(
    buyerPremiumData.purchaseTiers
  ) &&
  buyerPremiumData.purchaseTiers.length
    ? buyerPremiumData.purchaseTiers
        .map(tier => {
          const minAmountRaw =
            tier?.minAmountExclusive ??
            tier?.minAmount ??
            0;

          const minAmount =
            Number(minAmountRaw);

          const maxAmount =
            tier?.maxAmount == null
              ? null
              : Number(
                  tier.maxAmount
                );

          const ratePercent =
            tier?.cashCheckWireRatePercent ==
            null
              ? null
              : Number(
                  tier.cashCheckWireRatePercent
                );

          const minimumFee =
            tier?.minimumFee == null
              ? null
              : Number(
                  tier.minimumFee
                );

          const flatFee =
            tier?.flatFee == null
              ? null
              : Number(
                  tier.flatFee
                );

          const safeMinAmount =
            Number.isFinite(minAmount)
              ? minAmount
              : 0;

          const safeMaxAmount =
            Number.isFinite(maxAmount)
              ? maxAmount
              : null;

          let range = "";

          if (
            safeMaxAmount !== null &&
            safeMinAmount <= 0
          ) {
            range =
              `UP TO $${safeMaxAmount.toLocaleString(
                "en-US"
              )}`;
          } else if (
            safeMaxAmount !== null
          ) {
            range =
              `$${safeMinAmount.toLocaleString(
                "en-US"
              )}–$${safeMaxAmount.toLocaleString(
                "en-US"
              )}`;
          } else {
            range =
              `OVER $${safeMinAmount.toLocaleString(
                "en-US"
              )}`;
          }

          if (
            Number.isFinite(flatFee)
          ) {
            return (
              `${range} — ` +
              `$${flatFee.toLocaleString(
                "en-US"
              )} FLAT`
            );
          }

          if (
            Number.isFinite(ratePercent)
          ) {
            const minimumText =
              Number.isFinite(minimumFee)
                ? (
                    ` — $${minimumFee.toLocaleString(
                      "en-US"
                    )} MINIMUM`
                  )
                : "";

            return (
              `${range} — ` +
              `${ratePercent}%` +
              minimumText
            );
          }

          return clean(
            tier?.rawText
          );
        })
        .filter(Boolean)
    : [];

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
  
 const basicTerms =
  Array.isArray(
    auctionTerms?.basicTerms
  )
    ? auctionTerms.basicTerms.filter(
        term =>
          term &&
          term.confirmed !== false &&
          clean(term.label)
      )
    : [];

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

const interestRatePercent =
  interestFee?.ratePercent == null
    ? null
    : Number(
        interestFee.ratePercent
      );

const feeLines = [
  internetPremiumRate
    ? `${internetPremiumRate}% INTERNET PREMIUM`
    : "",

  internetPremiumCap
    ? `$${Number(internetPremiumCap).toLocaleString(
        "en-US"
      )} CAP`
    : "",

  Number.isFinite(
    interestRatePercent
  )
    ? `${interestRatePercent}% ANNUAL INTEREST`
    : "",

  storageFeePerDay
    ? (
        `$${Number(storageFeePerDay).toLocaleString(
          "en-US"
        )}/DAY` +
        (
          storageFeePerItem
            ? " PER ITEM STORAGE"
            : " STORAGE"
        )
      )
    : "",

  lateFee?.rawText
    ? clean(
        lateFee.rawText
      ).toUpperCase()
    : ""
].filter(Boolean);
  
  return (
    <IXIFaceFrame
      className="aof2"
      contentClassName="aof2-content"
      size={faceSize}
      dragHandleProps={
        dragHandleProps
      }
      footer={
        <IXIFaceActionFooter />
      }
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
        onLotNumberKeyDown={onLotNumberKeyDown}
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

  {buyerPremiumLines.length ? (
    <div className="aof2-premium-lines">
      {buyerPremiumLines.map((line, index) => (
        <div key={`${line}-${index}`}>
          {line}
        </div>
      ))}
    </div>
  ) : (
    <strong>
      {getTermValue(
        auctionTerms,
        [
          "buyersPremium",
          "buyerPremium"
        ],
        "NOT LISTED"
      )}
    </strong>
  )}
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
  <span
    key={
      term.code ||
      `${term.label}-${index}`
    }
  >
    {term.label}
  </span>
))
  ) : (
    <span>TERMS NOT AVAILABLE</span>
  )}
</div>
      </div>

     {originalListingUrl ? (
  <div className="aof2-source-listing">
    <a
      href={originalListingUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="aof2-source-link"
      onClick={event => {
        event.stopPropagation();
      }}
      onPointerDown={event => {
        event.stopPropagation();
      }}
    >
      OPEN ORIGINAL LISTING →
    </a>
  </div>
) : null}
      <style jsx>{`
:global(.aof2-content) {
  display: flex;
  flex-direction: column;

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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  text-align: center;
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

margin-top: 5px;

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
  align-items: center;
  justify-content: flex-start;

  text-align: center;

  gap: 7px;

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

  font-size: 8.2px;
font-weight: 850;
line-height: 1.18;
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

  align-items: center;
  text-align: center;

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

.aof2-premium-lines {
  width: 100%;
  min-width: 0;

  align-items: center;
  text-align: center;

  display: grid;
  gap: 2px;

  color: rgba(255, 255, 255, .62);

 font-size: 8.2px;
  font-weight: 850;
  line-height: 1.18;
  letter-spacing: .08px;

  text-align: left;
  text-transform: uppercase;
}

.aof2-premium-lines div {
  min-width: 0;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

     .aof2-basic-terms {
  width: 100%;
  min-width: 0;
  min-height: 58px;

  display: flex;
  flex-direction: column;
  align-items: center;

  margin-top: 4px;
  padding: 7px 9px;

  border: 1px solid rgba(255, 196, 0, .10);
  border-radius: 5px;
}

       .aof2-basic-terms-title {
  color: rgba(255,196,0,.56);

  text-align: center;

  font-size: 8.2px;
  font-weight: 850;
  letter-spacing: .5px;

  text-transform: uppercase;
}

       .aof2-basic-terms-lines {
 width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;

  text-align: center;

  gap: 2px;

  margin-top: 4px;
}

       .aof2-basic-terms-lines span {
  display: block;

  width: 100%;

  white-space: nowrap;

 font-size: 8.2px;
  font-weight: 850;
}
      

        .aof2-hours-input:focus,
        .aof2-bid-input:focus {
          border-color:
            rgba(255, 196, 0, .48);

          box-shadow:
            0 0 0 1px rgba(255, 196, 0, .08);
        }

        .aof2-source-listing {
  width: 100%;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-top: 4px;
  padding: 4px 0 2px;
}

.aof2-source-link {
  color: rgba(255, 196, 0, .62);

  font-size: 6.8px;
  font-weight: 950;
  line-height: 1;
  letter-spacing: .48px;

  text-decoration: none;
  text-transform: uppercase;
}

.aof2-source-link:hover {
  color: #ffc400;
}

             `}</style>
    </IXIFaceFrame>
  );
}
