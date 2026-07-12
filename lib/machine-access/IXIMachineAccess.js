// /lib/machine-access/IXIMachineAccess.js

export const IXI_MACHINE_ACCESS = Object.freeze({
  PUBLIC: "public",
  PRIVATE: "private"
});

export const IXI_MACHINE_CHANNELS = Object.freeze({
  NONE: "none",
  MARKETPLACE: "marketplace",
  AUCTION: "auction"
});

const VALID_MACHINE_ACCESS = new Set(
  Object.values(IXI_MACHINE_ACCESS)
);

const VALID_MACHINE_CHANNELS = new Set(
  Object.values(IXI_MACHINE_CHANNELS)
);

/*
 * LEGACY DEFAULTS
 *
 * Every machine currently inside IronXchange is public
 * and belongs to the Marketplace.
 *
 * Missing values must therefore resolve to:
 *
 * access: public
 * channel: marketplace
 */

export function normalizeMachineAccess(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  return VALID_MACHINE_ACCESS.has(normalized)
    ? normalized
    : IXI_MACHINE_ACCESS.PUBLIC;
}

export function normalizeMachineChannel(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  return VALID_MACHINE_CHANNELS.has(normalized)
    ? normalized
    : IXI_MACHINE_CHANNELS.MARKETPLACE;
}

export function getMachineAccess(listing = {}) {
  const publicData =
    listing.publicData ||
    listing.attributes?.publicData ||
    {};

  const metadata =
    listing.metadata ||
    listing.attributes?.metadata ||
    {};

  return normalizeMachineAccess(
    listing.machineAccess ||
    publicData.machineAccess ||
    metadata.machineAccess
  );
}

export function getMachineChannel(listing = {}) {
  const publicData =
    listing.publicData ||
    listing.attributes?.publicData ||
    {};

  const metadata =
    listing.metadata ||
    listing.attributes?.metadata ||
    {};

  return normalizeMachineChannel(
    listing.machineChannel ||
    publicData.machineChannel ||
    metadata.machineChannel
  );
}

export function getMachinePlacement(listing = {}) {
  return {
    access: getMachineAccess(listing),
    channel: getMachineChannel(listing)
  };
}

export function isPublicMarketplaceMachine(listing = {}) {
  const { access, channel } =
    getMachinePlacement(listing);

  return (
    access === IXI_MACHINE_ACCESS.PUBLIC &&
    channel === IXI_MACHINE_CHANNELS.MARKETPLACE
  );
}

export function isPublicAuctionMachine(listing = {}) {
  const { access, channel } =
    getMachinePlacement(listing);

  return (
    access === IXI_MACHINE_ACCESS.PUBLIC &&
    channel === IXI_MACHINE_CHANNELS.AUCTION
  );
}

export function isPrivateMachine(listing = {}) {
  return (
    getMachineAccess(listing) ===
    IXI_MACHINE_ACCESS.PRIVATE
  );
}

export function isPrivateAuctionMachine(listing = {}) {
  const { access, channel } =
    getMachinePlacement(listing);

  return (
    access === IXI_MACHINE_ACCESS.PRIVATE &&
    channel === IXI_MACHINE_CHANNELS.AUCTION
  );
}

export function validateMachinePlacement({
  access,
  channel
} = {}) {
  const normalizedAccess =
    String(access || "").trim().toLowerCase();

  const normalizedChannel =
    String(channel || "").trim().toLowerCase();

  if (!VALID_MACHINE_ACCESS.has(normalizedAccess)) {
    return {
      ok: false,
      error: `Invalid machine access: ${access}`
    };
  }

  if (!VALID_MACHINE_CHANNELS.has(normalizedChannel)) {
    return {
      ok: false,
      error: `Invalid machine channel: ${channel}`
    };
  }

  if (
    normalizedAccess === IXI_MACHINE_ACCESS.PUBLIC &&
    normalizedChannel === IXI_MACHINE_CHANNELS.NONE
  ) {
    return {
      ok: false,
      error:
        "A public machine must belong to Marketplace or Auction."
    };
  }

  return {
    ok: true,
    access: normalizedAccess,
    channel: normalizedChannel
  };
}
