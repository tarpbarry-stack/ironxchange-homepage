// /lib/machine-object/normalizeBulkMachineRows.js

import {
  createMachineObjectModel
} from "./createMachineObjectModel";

function pick(row = {}, keys = []) {
  for (const key of keys) {
    const value = row[key];

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return "";
}

export function normalizeBulkMachineRow(row = {}) {
  return createMachineObjectModel({
    category: pick(row, ["category", "Category", "type", "Type"]),
    year: pick(row, ["year", "Year"]),
    make: pick(row, ["make", "Make", "manufacturer", "Manufacturer"]),
    model: pick(row, ["model", "Model"]),
    hours: pick(row, ["hours", "Hours", "hrs", "Hrs"]),
    price: pick(row, ["price", "Price", "ask", "Ask"]),
    serialNumber: pick(row, ["serialNumber", "Serial Number", "serial", "Serial"]),
    stockNumber: pick(row, ["stockNumber", "Stock Number", "stock", "Stock"]),
    city: pick(row, ["city", "City"]),
    state: pick(row, ["state", "State", "stateCode", "State Code", "loc", "Loc"]),
    location: pick(row, ["location", "Location"]),
    description: pick(row, ["description", "Description", "details", "Details"])
  });
}

export function normalizeBulkMachineRows(rows = []) {
  return rows.map((row, index) => ({
    id: `bulk-${index}-${Date.now()}`,
    sourceRow: row,
    machine: normalizeBulkMachineRow(row),
    status: "draft",
    selected: true,
    errors: []
  }));
}
