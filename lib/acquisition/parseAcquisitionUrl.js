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

export async function parseAcquisitionUrl(url = "") {
  const source = detectAcquisitionSource(url);

  if (source.type === "4sale-heavy-equipment") {
    return parse4SaleHeavyEquipment(url);
  }

  if (source.type === "sandhills") {
    return parseMachineryTrader(url);
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
