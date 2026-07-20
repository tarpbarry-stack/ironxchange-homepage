// /lib/acquisition/createAcquisitionSource.js

function clean(value) {
  return value ? String(value).trim() : "";
}

export function detectAcquisitionSource(url = "") {
  const raw = clean(url);
  const lower = raw.toLowerCase();

  if (!raw) {
    return {
      type: "empty",
      label: "Empty URL",
      supported: false,
      url: raw
    };
  }

  if (lower.includes("facebook.com/marketplace")) {
    return {
      type: "facebook-marketplace",
      label: "Facebook Marketplace",
      supported: true,
      url: raw
    };
  }

  if (lower.includes("lyonauction.com")) {
    return {
      type: "lyon-auction",
      label: "Lyon Auction",
      supported: true,
      url: raw
    };
  }

  if (lower.includes("purplewave.com")) {
    return {
      type: "purplewave",
      label: "Purple Wave",
      supported: true,
      url: raw
    };
  }

  if (lower.includes("worldwidemachinery.com")) {
  return {
    type: "worldwide-machinery",
    label: "Worldwide Machinery",
    url
  };
}

  if (lower.includes("used.equipmentshare.com/products/")) {
    return {
      type: "equipmentshare-used",
      label: "EquipmentShare Used",
      supported: true,
      url: raw
    };
  }

  if (lower.includes("used.hercrentals.com/equipment/detail/")) {
    return {
      type: "herc-used",
      label: "Herc Rentals Used",
      supported: true,
      url: raw
    };
  }

  if (lower.includes("unitedrentals.com/sales/equipment/")) {
  return {
    type: "united-rentals-used",
    label: "United Rentals Used",
    supported: true,
    url: raw
  };
}

  if (
    lower.includes("used.sunbeltrentals.com/en-us/equipment/details/")
  ) {
    return {
      type: "sunbelt-used",
      label: "Sunbelt Rentals Used",
      supported: true,
      url: raw
    };
  }

  if (
    lower.includes("used.sunstateequip.com/en-us/equipment/details/")
  ) {
    return {
      type: "sunstate-used",
      label: "Sunstate Equipment Used",
      supported: true,
      url: raw
    };
  }

  
  if (lower.includes("empire-cat.com")) {
    return {
      type: "empire-cat",
      label: "Empire Cat",
      supported: true,
      url: raw
    };
  }

  if (lower.includes("4saleheavyequipment.com")) {
    return {
      type: "4sale-heavy-equipment",
      label: "4Sale Heavy Equipment",
      supported: true,
      url: raw
    };
  }

    if (
    lower.includes("rbauction.com/pdp/") ||
    lower.includes("rbauction.com/") ||
    lower.includes("ritchiebros.com/")
  ) {
    return {
      type: "rbauction",
      label: "Ritchie Bros.",
      supported: true,
      url: raw
    };
  }
  
   if (
    lower.includes("machinerytrader.com") ||
    lower.includes("tractorhouse.com") ||
    lower.includes("truckpaper.com") ||
    lower.includes("auctiontime.com") ||
    lower.includes("equipmentfacts.com") ||
    lower.includes("/inventory/?/listing/")
  ) {
    return {
      type: "sandhills-inventory",
      label: "Sandhills / MachineryTrader",
      supported: true,
      url: raw
    };
  }

  if (
    lower.includes("ironplanet.com/for-sale/") ||
    lower.includes("ironplanet.com/")
  ) {
    return {
      type: "ironplanet",
      label: "IronPlanet",
      supported: true,
      url: raw
    };
  }

if (lower.includes("proxibid.com")) {
  return {
    type: "proxibid",
    label: "Proxibid",
    supported: true,
    url: raw
  };
}
  
  return {
    type: "generic-dealer-site",
    label: "Generic Dealer Website",
    supported: false,
    url: raw
  };
}
