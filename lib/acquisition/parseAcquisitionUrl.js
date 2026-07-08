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

  return payload.result;
}

export async function parseAcquisitionUrl(url = "") {
  const source = detectAcquisitionSource(url);

if (
  source.type === "facebook-marketplace" ||
  source.type === "lyon-auction" ||
  source.type === "purplewave" ||
  source.type === "equipmentshare-used" ||
  source.type === "herc-used" ||
  source.type === "united-rentals-used" ||
  source.type === "worldwide-machinery" ||
  source.type === "rbauction" ||
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
