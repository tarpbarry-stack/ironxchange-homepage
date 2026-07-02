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
  const offer = getOffer(product);
  return offer?.seller || {};
}

function getLocation(product, specs) {
  const offer = getOffer(product);
  const served = offer?.areaServed || "";

  const locationText =
    specs["Machine Location"] ||
    served ||
    "";

  const stateMatch = locationText.match(
    /\b(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)\b/i
  );

  const cityStateZip = locationText.match(
    /([A-Za-z .'-]+),?\s+(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)\s*(\d{5})?/i
  );

  return {
    raw: cleanText(locationText),
    city: cleanText(cityStateZip?.[1]),
    state: cleanText(stateMatch?.[1] || cityStateZip?.[2]),
    postalCode: cleanText(cityStateZip?.[3])
  };
}

export const machineryTraderParser = {
  id: "machinerytrader",
  label: "MachineryTrader",

  canParse(url = "") {
    return /machinerytrader\.com\/listing\/for-sale/i.test(url);
  },

  parse({ html, url }) {
    const product = findProductJsonLd(html) || {};
    const offer = getOffer(product);
    const seller = getSeller(product);
    const specs = extractMachineryTraderSpecs(html);

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

    const price =
      parseNumber(offer.price);

    const hours =
      parseNumber(specs.Hours);

    const stockNumber =
      cleanText(specs["Stock Number"]) ||
      cleanText(product.sku);

    const serialNumber =
      cleanText(specs["Serial Number"]) ||
      cleanText(specs["Serial #"]);

    const description =
      cleanText(specs.Description) ||
      cleanText(product.description) ||
      cleanText(extractMetaContent(html, "description"));

    const photoUrls = extractSandhillsPhotoUrls(html);

    const location = getLocation(product, specs);

    return {
      source: "MachineryTrader",
      sourceUrl: canonicalUrl,
      externalId: cleanText(product["@id"]),
      title,

      machine: {
        year,
        make,
        model,
        hours,
        price,
        condition: cleanText(specs.Condition),
        stockNumber,
        serialNumber,
        description,

        // Parser returns source vocabulary only.
        // Taxonomy owns final IronXchange category.
        sourceCategory: cleanText(product.category),

        location: {
          city: location.city,
          state: location.state,
          postalCode: location.postalCode,
          raw: location.raw
        },

        seller: {
          name: cleanText(seller.name),
          phone: cleanText(seller.telephone),
          contact: cleanText(specs.Contact),
          raw: seller
        },

        media: {
          heroUrl: photoUrls[0] || cleanText(product.image),
          photoUrls
        },

        specs,

        distribution: {
          source: "MachineryTrader",
          url: canonicalUrl
        }
      },

      inspector: {
        source: "MachineryTrader",
        confidence: {
          title: Boolean(title),
          year: Boolean(year),
          make: Boolean(make),
          model: Boolean(model),
          price: Boolean(price),
          hours: Boolean(hours),
          photos: photoUrls.length
        },
        counts: {
          specs: Object.keys(specs).length,
          photos: photoUrls.length
        }
      }
    };
  }
};
