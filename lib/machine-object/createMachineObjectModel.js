// /lib/machine-object/createMachineObjectModel.js

import {
  inferMachineCategory
} from "./inferMachineCategory";

function clean(value) {
  return value ? String(value).trim() : "";
}

function cleanNumber(value = "") {
  const cleaned = String(value).replace(/[^0-9.]/g, "");

  if (!cleaned) return "";

  const number = Number(cleaned);

  return Number.isFinite(number)
    ? String(Math.round(number))
    : "";
}

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildMachineTitle({ year, make, model, hours } = {}) {
  const base = [year, make, model]
    .filter(Boolean)
    .map(clean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const rawHours = cleanNumber(hours);

  if (!base) return "Machine Listing";
  if (!rawHours) return base;

  return `${base} - ${Number(rawHours).toLocaleString()} Hrs`;
}

export function createMachineObjectModel(input = {}) {
  const category =
  clean(input.category) ||
  inferMachineCategory(
    input.make,
    input.model
  );
  const year = cleanNumber(input.year).slice(0, 4);
  const make = clean(input.make);
  const model = clean(input.model);
  const hours = cleanNumber(input.hours);
  const price = cleanNumber(input.price);

  const city = clean(input.city);
  const state = clean(input.state || input.stateCode || input.loc);
  const location = clean(input.location) || [city, state].filter(Boolean).join(", ");

  const title = buildMachineTitle({
    year,
    make,
    model,
    hours
  });

  const categorySlug = slugify(category);
  const makeSlug = slugify(`${category}-${make}`);
  const modelSlug = slugify(`${category}-${make}-${model}`);

  return {
    title,

    category,
    year,
    make,
    model,
    hours,
    price,

    stockNumber: clean(input.stockNumber),
    serialNumber: clean(input.serialNumber),

    city,
    state,
    stateCode: state,
    loc: state,
    location,

    description: clean(input.description || input.details),

    keywords: Array.isArray(input.keywords)
      ? input.keywords.filter(Boolean).map(String)
      : [],

    externalLinks: Array.isArray(input.externalLinks)
      ? input.externalLinks
          .map(link => ({
            label: clean(link.label),
            url: clean(link.url)
          }))
          .filter(link => link.label && link.url)
          .slice(0, 3)
      : [],

    workflowStatus: clean(input.workflowStatus) || "good-listing",
    listingStatus: clean(input.listingStatus) || "live",
    listingType: clean(input.listingType) || "free-listing",

    categoryLevel1: categorySlug,
    categoryLevel2: makeSlug,
    categoryLevel3: modelSlug,

    transactionProcessAlias: "default-inquiry/release-1",
    unitType: "inquiry"
  };
}

export function createSharetribePublicDataFromMachine(machine = {}) {
  return {
    categoryLevel1: machine.categoryLevel1,
    categoryLevel2: machine.categoryLevel2,
    categoryLevel3: machine.categoryLevel3,

    category: machine.category,
    year: String(machine.year || ""),
    make: machine.make,
    model: machine.model,

    hours: machine.hours ? Number(machine.hours) : undefined,

    stockNumber: machine.stockNumber,
    serialNumber: machine.serialNumber,

    city: machine.city,
    location: machine.location,
    loc: machine.loc,

    keywords: machine.keywords || [],
    externalLinks: machine.externalLinks || [],

    workflowStatus: machine.workflowStatus || "good-listing",
    listingType: machine.listingType || "free-listing",
    listingStatus: machine.listingStatus || "live",

    transactionProcessAlias: machine.transactionProcessAlias || "default-inquiry/release-1",
    unitType: machine.unitType || "inquiry"
  };
}
