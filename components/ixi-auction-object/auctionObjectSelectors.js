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

  return cleanObject(
    listing.auctionLot ||
    publicData.auctionLot ||
    auction.lot ||
    auction.auctionLot
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

  const lot =
    getAuctionLotData(listing);

  return clean(
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

  return clean(
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
