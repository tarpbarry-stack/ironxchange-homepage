// /lib/acquisition/parsers/parse4SaleHeavyEquipment.js

import {
  createMachineObjectModel
} from "../../machine-object";

export async function parse4SaleHeavyEquipment(url = "") {
  return {
    source: {
      type: "4sale-heavy-equipment",
      label: "4Sale Heavy Equipment",
      url
    },

    machine: createMachineObjectModel({
      category: "EXCAVATORS",
      year: "2020",
      make: "CATERPILLAR",
      model: "320",
      hours: "3500",
      price: "145000",
      city: "Dallas",
      state: "TX",
      description: "Imported draft from 4Sale Heavy Equipment URL."
    }),

    media: [],

    confidence: {
      title: "draft",
      facts: "draft",
      photos: "not-loaded"
    }
  };
}
