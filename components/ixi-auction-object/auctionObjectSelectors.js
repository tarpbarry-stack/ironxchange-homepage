function clean(value = "") {
  return String(value || "").trim();
}

export function getPublicData(listing = {}) {
  return (
    listing.publicData ||
    listing.attributes?.publicData ||
    {}
  );
}

export function getAuctionData(listing = {}) {
  const publicData = getPublicData(listing);

  return (
    listing.auction ||
    listing.auctionData ||
    publicData.auction ||
    publicData.auctionData ||
    {}
  );
}

export function getAuctionCompany(listing = {}) {
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

export function getAuctionEventName(listing = {}) {
  const publicData = getPublicData(listing);
  const auction = getAuctionData(listing);

  return clean(
    auction?.event?.name ||
    auction?.event?.eventName ||
    listing.auctionEventName ||
    publicData.auctionEventName
  );
}

export function getAuctionFormat(listing = {}) {
  const publicData = getPublicData(listing);
  const auction = getAuctionData(listing);

  return clean(
    auction?.event?.format ||
    listing.auctionFormat ||
    publicData.auctionFormat
  );
}

export function getAuctionParticipation(
  listing = {}
) {
  const publicData = getPublicData(listing);
  const auction = getAuctionData(listing);

  return clean(
    auction?.event?.participation ||
    listing.auctionParticipation ||
    publicData.auctionParticipation
  );
}

export function getAuctionEventLocation(
  listing = {}
) {
  const publicData = getPublicData(listing);
  const auction = getAuctionData(listing);

  return clean(
    auction?.event?.location?.label ||
    auction?.event?.locationLabel ||
    listing.auctionLocation ||
    publicData.auctionLocation
  );
}

export function getAuctionDate(listing = {}) {
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

export function getLotNumber(listing = {}) {
  const publicData = getPublicData(listing);
  const auction = getAuctionData(listing);

  return clean(
    auction?.lot?.number ||
    auction?.lot?.lotNumber ||
    listing.lotNumber ||
    publicData.lotNumber
  );
}

export function getScheduledCloseAt(
  listing = {}
) {
  const publicData = getPublicData(listing);
  const auction = getAuctionData(listing);

  return clean(
    auction?.lot?.scheduledCloseAt ||
    auction?.lot?.closeAt ||
    auction?.scheduledCloseAt ||
    auction?.closeAt ||
    listing.scheduledCloseAt ||
    publicData.scheduledCloseAt ||
    publicData.auctionCloseAt
  );
}

export function getSourceTimezone(
  listing = {}
) {
  const publicData = getPublicData(listing);
  const auction = getAuctionData(listing);

  return clean(
    auction?.lot?.timezone ||
    auction?.event?.timezone ||
    auction?.timezone ||
    listing.auctionTimezone ||
    publicData.auctionTimezone
  );
}

export function getMachineLocation(
  listing = {}
) {
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

export function splitLocation(value = "") {
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

export function formatAuctionLabel(
  value = ""
) {
  return clean(value)
    .replace(/[_-]+/g, " ")
    .toUpperCase();
}
