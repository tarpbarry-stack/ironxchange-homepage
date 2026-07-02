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
  );
}

function stripTags(value = "") {
  return decodeHtml(String(value).replace(/<[^>]+>/g, " "));
}

function matchFirst(text, patterns = []) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return clean(match[1]);
  }

  return "";
}

function parseMoney(value = "") {
  const raw = clean(value).replace(/[$,]/g, "");
  const match = raw.match(/\d+(?:\.\d+)?/);
  return match ? match[0] : "";
}

function extractTitle(html) {
  const h1 = matchFirst(html, [
    /<h1[^>]*>[\s\S]*?<span[^>]*dir=["']auto["'][^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/h1>/i
  ]);

  if (h1) return stripTags(h1);

  const title = matchFirst(html, [
    /<title[^>]*>(.*?)<\/title>/i
  ]);

  return clean(title.split(" - ")[0]);
}

function extractPhotos(html, title) {
  const urls = new Set();

  const listingPhotoSection =
    matchFirst(html, [
      /"listing_photos"\s*:\s*(\[[\s\S]*?\])\s*,\s*"pre_recorded_videos"/i,
      /"listing_photos"\s*:\s*(\[[\s\S]*?\])/i
    ]) || "";

  const source = listingPhotoSection || html;

  const matches = source.matchAll(
    /"uri"\s*:\s*"((?:https:\\\/\\\/|https:\/\/)[^"]+)"/gi
  );

  for (const match of matches) {
    const url = clean(match[1])
      .replace(/\\\//g, "/")
      .replace(/\\u0025/g, "%")
      .replace(/\\u0026/g, "&");

    if (
      url.includes("scontent") &&
      !url.includes("static.xx.fbcdn.net") &&
      !url.includes("/rsrc.php/") &&
      !url.includes("safe_image")
    ) {
      urls.add(url);
    }
  }

  return Array.from(urls).slice(0, 40);
}

function extractLocation(html) {
  const aria = matchFirst(html, [
    /aria-label=["'][^"']*?,\s*\$?[\d,]+,\s*([^"']+?),\s*listing\s+\d+/i
  ]);

  const fromTitle = matchFirst(html, [
    /<title[^>]*>.*?-\s*Commercial Vehicles\s*-\s*([^|]+?)\s*\|\s*Facebook Marketplace/i
  ]);

  const raw = clean(aria || fromTitle);

  const parts = raw.split(",").map(clean);

  return {
    raw,
    city: parts[0] || "",
    state: parts[1] || ""
  };
}

function extractDescription(html, title) {
  const titleIndex = html.indexOf(`${title} Wheel Loader`);
  const scoped = titleIndex >= 0 ? html.slice(titleIndex, titleIndex + 2500) : html;

  const description = matchFirst(scoped, [
    /<span[^>]+dir=["']auto["'][^>]*>([\s\S]*?Selling in As-Is condition\.)<\/span>/i,
    /<span[^>]+dir=["']auto["'][^>]*>([\s\S]*?approx\s+[\d,]+\s+hours[\s\S]*?)<\/span>/i
  ]);

  return stripTags(description);
}

function extractCondition(html) {
  return (
    matchFirst(html, [
      /<span[^>]*>\s*Condition\s*<\/span>[\s\S]{0,900}?<span[^>]*>\s*([^<]+?)\s*<\/span>/i
    ]) ||
    matchFirst(html, [
      /"condition"\s*:\s*"([^"]+)"/i
    ])
  );
}


function inferFacts(title = "", description = "") {
  const text = `${title} ${description}`;

  const year = matchFirst(text, [/\b(19[8-9]\d|20[0-3]\d)\b/]);
  const hours = matchFirst(text, [/approx\.?\s*([\d,]+)\s*hours/i, /([\d,]+)\s*(?:hrs|hours)\b/i]);

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
    matchFirst(html, [/listing\s+(\d+)/i]) ||
    matchFirst(html, [/marketplace\/item\/(\d+)/i])
  );
}

async function fetchFacebookHtml(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 IronXchangeBot/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Facebook Marketplace fetch failed: ${response.status}`);
  }

  return response.text();
}

export async function parseFacebookMarketplace(url = "", htmlOverride = "") {
  const html = htmlOverride || await fetchFacebookHtml(url);

  const title = extractTitle(html);
  if (
  !title ||
  title === "Marketplace" ||
  title.toLowerCase().includes("facebook marketplace")
) {
  throw new Error("Facebook listing data not available from fetched page.");
}
  const description = extractDescription(html, title);
  const facts = inferFacts(title, description);
  const location = extractLocation(html);
  const media = extractPhotos(html, title);
  const price = extractPrice(html);
  const condition = extractCondition(html);
  const listingId = extractListingId(url, html);

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
