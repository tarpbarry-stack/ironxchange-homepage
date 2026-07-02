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

  if (
    lower.includes("machinerytrader.com") ||
    lower.includes("tractorhouse.com") ||
    lower.includes("truckpaper.com")
  ) {
    return {
      type: "sandhills",
      label: "MachineryTrader / Sandhills",
      supported: false,
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

  return {
    type: "generic-dealer-site",
    label: "Generic Dealer Website",
    supported: false,
    url: raw
  };
}
