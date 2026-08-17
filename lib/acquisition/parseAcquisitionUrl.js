// /lib/acquisition/parseAcquisitionUrl.js

import {
  detectAcquisitionSource
} from "./createAcquisitionSource";

import {
  parse4SaleHeavyEquipment
} from "./parsers/parse4SaleHeavyEquipment";

import {
  parseMachineryTrader
} from "./parsers/parseMachineryTrader";

function cleanObject(value) {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? value
    : {};
}

function hasValue(value) {
  if (value === null || value === undefined || value === "") {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "object") {
    return Object.keys(value).length > 0;
  }

  return true;
}

function mergeCompatibilityData(
  compatibilityValue,
  canonicalValue
) {
  const compatibilityIsObject =
    compatibilityValue &&
    typeof compatibilityValue === "object" &&
    !Array.isArray(compatibilityValue);

  const canonicalIsObject =
    canonicalValue &&
    typeof canonicalValue === "object" &&
    !Array.isArray(canonicalValue);

  if (compatibilityIsObject && canonicalIsObject) {
    const merged = {
      ...compatibilityValue
    };

    Object.keys(canonicalValue).forEach(key => {
      merged[key] =
        mergeCompatibilityData(
          compatibilityValue?.[key],
          canonicalValue[key]
        );
    });

    return merged;
  }

  return hasValue(canonicalValue)
    ? canonicalValue
    : compatibilityValue;
}

/*
 * IX-Core historically returned both a canonical auction object and
 * compatibility siblings such as auctionEvent / auctionLot / auctionTerms.
 *
 * Sharetribe now persists one auction object only. Fold compatibility data
 * into that canonical object here, at the acquisition boundary, so no auction
 * facts are lost when the duplicate top-level payloads are intentionally not
 * persisted.
 *
 * The merge is recursive and canonical-first. A populated canonical value wins,
 * while empty canonical shells cannot erase populated compatibility data such
 * as an IronPlanet auction-specific buyer premium.
 */
function canonicalizeAuctionResult(result = {}) {
  const sourceResult =
    cleanObject(result);

  const auction =
    cleanObject(sourceResult.auction);

  const compatibilityEvent =
    cleanObject(sourceResult.auctionEvent);

  const compatibilityLot =
    cleanObject(sourceResult.auctionLot);

  const compatibilityTerms =
    cleanObject(sourceResult.auctionTerms);

  const canonicalEvent =
    cleanObject(
      auction.event ||
      auction.auctionEvent
    );

  const canonicalLot =
    cleanObject(
      auction.lot ||
      auction.auctionLot
    );

  const canonicalTerms =
    cleanObject(
      auction.terms ||
      auction.auctionTerms
    );

  const hasAuctionData =
    Object.keys(auction).length > 0 ||
    Object.keys(compatibilityEvent).length > 0 ||
    Object.keys(compatibilityLot).length > 0 ||
    Object.keys(compatibilityTerms).length > 0;

  if (!hasAuctionData) {
    return sourceResult;
  }

  const nextAuction = {
    ...auction
  };

  if (
    Object.keys(compatibilityEvent).length > 0 ||
    Object.keys(canonicalEvent).length > 0
  ) {
    nextAuction.event =
      mergeCompatibilityData(
        compatibilityEvent,
        canonicalEvent
      );
  }

  if (
    Object.keys(compatibilityLot).length > 0 ||
    Object.keys(canonicalLot).length > 0
  ) {
    nextAuction.lot =
      mergeCompatibilityData(
        compatibilityLot,
        canonicalLot
      );
  }

  if (
    Object.keys(compatibilityTerms).length > 0 ||
    Object.keys(canonicalTerms).length > 0
  ) {
    nextAuction.terms =
      mergeCompatibilityData(
        compatibilityTerms,
        canonicalTerms
      );
  }

  return {
    ...sourceResult,
    auction: nextAuction
  };
}

async function acquireFromIXCore(url = "") {
  const response = await fetch("http://3.131.46.49:4100/acquisition", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url })
  });

  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "IX Core acquisition failed.");
  }

  return canonicalizeAuctionResult(
    payload.result
  );
}

export async function parseAcquisitionUrl(url = "") {
  const source = detectAcquisitionSource(url);

if (
  source.type === "facebook-marketplace" ||
  source.type === "lyon-auction" ||
  source.type === "purplewave" ||
  source.type === "equipmentshare-used" ||
  source.type === "herc-used" ||
  source.type === "sunbelt-used" ||
  source.type === "sunstate-used" ||  
  source.type === "united-rentals-used" ||
  source.type === "worldwide-machinery" ||
  source.type === "rbauction" ||
  source.type === "ironplanet" ||
  source.type === "proxibid" ||
  source.type === "sandhills-inventory"
) {
  return acquireFromIXCore(url);
}

  if (source.type === "4sale-heavy-equipment") {
    return parse4SaleHeavyEquipment(url);
  }

   if (source.type === "sandhills") {
    return acquireFromIXCore(url);
  }

  return {
    source,
    machine: null,
    media: [],
    confidence: {
      title: "unsupported",
      facts: "unsupported",
      photos: "unsupported"
    }
  };
}
