// /lib/acquisition/parsers/parseMachineryTrader.js

import {
  createMachineObjectModel
} from "../../machine-object";

import {
  cleanText,
  extractCanonicalUrl,
  extractJsonLdObjects,
  extractMachineryTraderSpecs,
  extractMetaContent,
  extractSandhillsPhotoUrls,
  parseNumber
} from "../parserUtils";

function findProductJsonLd(html) {
  return extractJsonLdObjects(html).find(item => item?.["@type"] === "Product");
}

function getOffer(product) {
  return product?.offers || product?.itemOffered?.offers || {};
}

function getSeller(product) {
  return getOffer(product)?.seller || {};
}

function getLocation(product, specs) {
  const offer = getOffer(product);
  const raw = cleanText(specs["Machine Location"] || offer?.areaServed || "");

  const match = raw.match(
    /([A-Za-z .'-]+),?\s+(Texas|Oklahoma|Louisiana|Arkansas|New Mexico|Kansas|Missouri|Colorado|California|Florida|Georgia|Alabama|Mississippi|Tennessee|Kentucky|Ohio|Michigan|Indiana|Illinois|Iowa|Nebraska|South Dakota|North Dakota|Minnesota|Wisconsin|Pennsylvania|New York|North Carolina|South Carolina|Virginia|West Virginia|Arizona|Nevada|Utah|Idaho|Montana|Wyoming|Oregon|Washington)\s*(\d{5})?/i
  );

  return {
    raw,
    city: cleanText(match?.[1]),
    state: cleanText(match?.[2]),
    postalCode: cleanText(match?.[3])
  };
}

async function fetchMachineryTraderHtml(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 IronXchangeBot/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`MachineryTrader fetch failed: ${response.status}`);
  }

  return response.text();
}

export async function parseMachineryTrader(url = "", htmlOverride = "") {
  const html = htmlOverride || await fetchMachineryTraderHtml(url);

  const product = findProductJsonLd(html) || {};
  const offer = getOffer(product);
  const seller = getSeller(product);
  const specs = extractMachineryTraderSpecs(html);
  const location = getLocation(product, specs);

  const canonicalUrl =
    extractCanonicalUrl(html) ||
    product.url ||
    offer.url ||
    url;

  const title =
    cleanText(product.name) ||
    cleanText(extractMetaContent(html, "og:title"));

  const year =
    cleanText(specs.Year) ||
    cleanText(title.match(/\b(19|20)\d{2}\b/)?.[0]);

  const make =
    cleanText(specs.Manufacturer) ||
    cleanText(product.manufacturer);

  const model =
    cleanText(specs.Model) ||
    cleanText(product.model);

  const media = extractSandhillsPhotoUrls(html);

  return {
    source: {
      type: "sandhills",
      label: "MachineryTrader / Sandhills",
      url: canonicalUrl
    },

    machine: createMachineObjectModel({
      year,
      make,
      model,
      hours: parseNumber(specs.Hours),
      price: parseNumber(offer.price),
      serialNumber:
        cleanText(specs["Serial Number"]) ||
        cleanText(specs["Serial #"]),
      stockNumber:
        cleanText(specs["Stock Number"]) ||
        cleanText(product.sku),
      city: location.city,
      state: location.state,
      description:
        cleanText(specs.Description) ||
        cleanText(product.description) ||
        cleanText(extractMetaContent(html, "description"))
    }),

    media,

    distributionLinks: [
      {
        name: "MachineryTrader",
        url: canonicalUrl
      }
    ],

    confidence: {
      title: title ? "parsed" : "missing",
      facts: year || make || model ? "parsed" : "missing",
      photos: media.length > 0 ? "parsed" : "missing"
    },

    raw: {
      sourceCategory: cleanText(product.category),
      seller: {
        name: cleanText(seller.name),
        phone: cleanText(seller.telephone)
      },
      specs
    }
  };
}
