// /lib/acquisition/parsers/parseFacebookMarketplace.js

import {
  createMachineObjectModel
} from "../../machine-object";

function clean(value) {
  return value ? String(value).replace(/\s+/g, " ").trim() : "";
}

function decodeHtml(value = "") {
  return clean(
    String(value)
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\\u0025/g, "%")
      .replace(/\\u0026/g, "&")
      .replace(/\\\//g, "/")
  );
}

function stripTags(value = "") {
  return decodeHtml(String(value).replace(/<[^>]+>/g, " "));
}

function matchFirst(text = "", patterns = []) {
  for (const pattern of patterns) {
    const match = String(text).match(pattern);
    if (match?.[1]) return clean(match[1]);
  }

  return "";
}

function parseMoney(value = "") {
  const raw = clean(value).replace(/[$,]/g, "");
  const match = raw.match(/\d+(?:\.\d+)?/);
  return match ? match[0] : "";
}

function extractTitle(html = "") {
  const ogTitle = matchFirst(html, [
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i
  ]);

  if (ogTitle) {
    return clean(decodeHtml(ogTitle).split(" - ")[0]);
  }

  const title = matchFirst(html, [
    /<title[^>]*>(.*?)<\/title>/i
  ]);

  return clean(decodeHtml(title).split(" - ")[0]);
}

function extractPrice(html = "") {
  return (
    parseMoney(matchFirst(html, [
      /"formatted_price"\s*:\s*\{\s*"text"\s*:\s*"([^"]+)"/i,
      /"formatted_amount_zeros_stripped"\s*:\s*"([^"]+)"/i,
      /"price"\s*:\s*\{\s*"amount"\s*:\s*"?(\d+)/i,
      /"listing_price"\s*:\s*\{\s*"amount"\s*:\s*"?(\d+)/i
    ])) ||
    parseMoney(matchFirst(html, [
      /\$[\s]*([\d,]+)/i
    ]))
  );
}

function extractLocation(html = "") {
  const fromTitle = matchFirst(html, [
    /<title[^>]*>.*?-\s*Commercial Vehicles\s*-\s*([^|]+?)\s*\|\s*Facebook Marketplace/i
  ]);

  const aria = matchFirst(html, [
    /aria-label=["'][^"']*?,\s*\$?[\d,]+,\s*([^"']+?),\s*listing\s+\d+/i
  ]);

  const raw = clean(decodeHtml(fromTitle || aria));
  const parts = raw.split(",").map(clean);

  return {
    raw,
    city: parts[0] || "",
    state: parts[1] || ""
  };
}

function extractDescription(html = "", title = "") {
  const titleIndex = title ? html.indexOf(title) : -1;
  const scoped = titleIndex >= 0 ? html.slice(titleIndex, titleIndex + 8000) : html;

  const description = matchFirst(scoped, [
    /"redacted_description"\s*:\s*\{\s*"text"\s*:\s*"([^"]+)"/i,
    /"description"\s*:\s*\{\s*"text"\s*:\s*"([^"]+)"/i,
    /"marketplace_listing_title"[\s\S]{0,5000}?"text"\s*:\s*"([^"]*hours[^"]*)"/i,
    /<span[^>]+dir=["']auto["'][^>]*>([\s\S]*?hours[\s\S]*?)<\/span>/i
  ]);

  return stripTags(description);
}

function extractCondition(html = "") {
  return (
    matchFirst(html, [
      /"condition"\s*:\s*"([^"]+)"/i,
      /<span[^>]*>\s*Condition\s*<\/span>[\s\S]{0,900}?<span[^>]*>\s*([^<]+?)\s*<\/span>/i
    ])
  );
}

function extractPhotos(html = "", listingId = "") {
  const urls = new Set();

  const scripts = String(html).matchAll(
    /<script[^>]+type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi
  );

  for (const script of scripts) {
    const raw = decodeHtml(script[1] || "");

    if (!raw.includes("listing_photos")) continue;

    try {
      const json = JSON.parse(raw);
      walkFacebookJsonForPhotos(json, urls);
    } catch (error) {
      // Ignore malformed chunks.
    }
  }

  if (urls.size === 0) {
    const normalized = String(html)
      .replace(/\\\//g, "/")
      .replace(/\\u0025/g, "%")
      .replace(/\\u0026/g, "&")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"');

    const ogImage = matchFirst(normalized, [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i
    ]);

    if (isFacebookMachinePhoto(ogImage)) {
      urls.add(ogImage);
    }
  }

  console.log("FB FINAL CLEAN PHOTO COUNT:", urls.size);

  return Array.from(urls).slice(0, 40);
}

function walkFacebookJsonForPhotos(value, urls) {
  if (!value) return;

  if (Array.isArray(value)) {
    for (const item of value) {
      walkFacebookJsonForPhotos(item, urls);
    }
    return;
  }

  if (typeof value !== "object") return;

  if (Array.isArray(value.listing_photos)) {
    for (const photo of value.listing_photos) {
      const url =
        photo?.image?.uri ||
        photo?.image?.url ||
        photo?.uri ||
        "";

      const normalizedUrl = clean(url)
        .replace(/\\\//g, "/")
        .replace(/\\u0025/g, "%")
        .replace(/\\u0026/g, "&");

      if (isFacebookMachinePhoto(normalizedUrl)) {
        urls.add(normalizedUrl);
      }
    }
  }

  for (const child of Object.values(value)) {
    walkFacebookJsonForPhotos(child, urls);
  }
}

function findMarketplaceObjects(value, path = "root", results = []) {
  if (!value) return results;

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      findMarketplaceObjects(item, `${path}[${index}]`, results);
    });
    return results;
  }

  if (typeof value !== "object") return results;

  const keys = Object.keys(value);

  const looksLikeListing =
    keys.includes("marketplace_listing_title") ||
    keys.includes("listing_photos") ||
    keys.includes("redacted_description") ||
    keys.includes("formatted_price") ||
    keys.includes("location") ||
    keys.includes("listing_price");

  if (looksLikeListing) {
    results.push({
      path,
      keys,
      sample: value
    });
  }

  for (const [key, child] of Object.entries(value)) {
    findMarketplaceObjects(child, `${path}.${key}`, results);
  }

  return results;
}

function debugFacebookListingShape(html = "") {
  const scripts = Array.from(
    html.matchAll(/<script[^>]+type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi)
  );

  console.log("FB JSON SCRIPT COUNT:", scripts.length);

  scripts.forEach((script, index) => {
    const raw = decodeHtml(script[1] || "");

    try {
      const json = JSON.parse(raw);
      const found = findMarketplaceObjects(json);

      if (found.length > 0) {
        console.log("FB MARKETPLACE OBJECT SCRIPT:", index);
        console.log(
          JSON.stringify(
            found.map(item => ({
              path: item.path,
              keys: item.keys,
              sample: item.sample
            })),
            null,
            2
          ).slice(0, 12000)
        );
      }
    } catch (error) {
      console.log("FB JSON SCRIPT FAILED:", index, error.message);
    }
  });
}

function extractBalancedArray(text = "", startIndex = -1) {
  if (startIndex < 0 || text[startIndex] !== "[") return "";

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = startIndex; i < text.length; i += 1) {
    const char = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "[") depth += 1;

    if (char === "]") {
      depth -= 1;

      if (depth === 0) {
        return text.slice(startIndex, i + 1);
      }
    }
  }

  return "";
}

function isFacebookMachinePhoto(url = "") {
  return (
    /^https?:\/\//i.test(url) &&
    (url.includes("scontent") || url.includes("fbcdn")) &&
    !url.includes("static.xx.fbcdn.net") &&
    !url.includes("/rsrc.php/") &&
    !url.includes("safe_image") &&
    !url.includes("emoji") &&
    !url.includes("profile")
  );
}


function inferFacts(title = "", description = "") {
  const text = `${title} ${description}`;

  const year = matchFirst(text, [
    /\b(19[8-9]\d|20[0-3]\d)\b/
  ]);

  const hours = matchFirst(text, [
    /approx\.?\s*([\d,]+)\s*hours/i,
    /([\d,]+)\s*(?:hrs|hours)\b/i
  ]);

  const withoutYear = clean(title.replace(/\b(19[8-9]\d|20[0-3]\d)\b/, ""));
  const parts = withoutYear.split(" ").filter(Boolean);

  const make =
    parts[0] && parts[1]
      ? `${parts[0]} ${parts[1]}`
      : parts[0] || "";

  const model = parts.slice(make.includes(" ") ? 2 : 1).join(" ");

  return {
    year,
    make,
    model,
    hours
  };
}

function extractListingId(url = "", html = "") {
  return (
    matchFirst(url, [/marketplace\/item\/(\d+)/i]) ||
    matchFirst(html, [/marketplace\/item\/(\d+)/i]) ||
    matchFirst(html, [/listing\s+(\d+)/i])
  );
}

function normalizeFacebookMarketplaceUrl(url = "") {
  const id = matchFirst(url, [
    /marketplace\/item\/(\d+)/i
  ]);

  if (!id) return url;

  return `https://www.facebook.com/marketplace/item/${id}/`;
}

async function fetchFacebookHtml(url) {
  const fetchUrl = normalizeFacebookMarketplaceUrl(url);

const response = await fetch(fetchUrl, {
    headers: {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36",
  "Accept":
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "max-age=0",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "sec-ch-ua-mobile": "?1",
  "sec-ch-ua-platform": "\"Android\"",
  "sec-ch-ua-model": "\"Pixel 9\""
}
  });

 if (!response.ok) {
  const errorText = await response.text();

  console.log("FACEBOOK FETCH URL:", fetchUrl);
  console.log("FACEBOOK FETCH STATUS:", response.status);
  console.log("FACEBOOK FETCH BODY:", errorText.substring(0, 2000));

  throw new Error(`Facebook Marketplace fetch failed: ${response.status}`);
}

  return response.text();
}

export async function parseFacebookMarketplace(url = "", htmlOverride = "") {
  const html = htmlOverride || await fetchFacebookHtml(url);

  console.log("FB HAS ScheduledServerJS:", html.includes("ScheduledServerJS"));
console.log("FB HAS __bbox:", html.includes("__bbox"));
console.log(
  "FB HAS marketplace_listing_renderable_target:",
  html.includes("marketplace_listing_renderable_target")
);
console.log("FB HAS redacted_description:", html.includes("redacted_description"));
console.log("FB HAS listing_price:", html.includes("listing_price"));
console.log("FB HAS listing_photos:", html.includes("listing_photos"));
console.log(
  "FB HAS MarketplacePDPC2CMediaViewerWithImagesQuery:",
  html.includes("MarketplacePDPC2CMediaViewerWithImagesQuery")
);
  
  console.log("FACEBOOK HTML DEBUG START");
  console.log(html.substring(0, 3000));
  console.log("FACEBOOK HTML DEBUG END");

  const title = extractTitle(html);
  const description = extractDescription(html, title);
  const facts = inferFacts(title, description);
  const location = extractLocation(html);
  console.log("FB HTML HAS listing_photos:", html.includes("listing_photos"));
  console.log("FB HTML HAS MediaViewer:", html.includes("MarketplacePDPC2CMediaViewerWithImagesQuery"));
  console.log("FB HTML LENGTH:", html.length);

  debugFacebookListingShape(html);

const listingId = extractListingId(url, html);
const media = extractPhotos(html, listingId);

console.log("FB PHOTO COUNT:", media.length);
console.log("FB PHOTOS:", media);

const price = extractPrice(html);
const condition = extractCondition(html);

  if (!title || title === "Marketplace") {
    throw new Error("Facebook listing title not available from fetched page.");
  }

  return {
    source: {
      type: "facebook-marketplace",
      label: "Facebook Marketplace",
      url
    },

    machine: createMachineObjectModel({
      year: facts.year,
      make: facts.make,
      model: facts.model,
      hours: facts.hours,
      price,
      city: location.city,
      state: location.state,
      description
    }),

    media,

    distributionLinks: [
      {
        name: "Facebook Marketplace",
        url
      }
    ],

    confidence: {
      title: title ? "parsed" : "missing",
      facts: facts.year || facts.make || facts.model ? "parsed" : "missing",
      photos: media.length > 0 ? "parsed" : "missing"
    },

    raw: {
      listingId,
      condition,
      title,
      location,
      sourceCategory: "Commercial Vehicles"
    }
  };
}
