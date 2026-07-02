// /lib/acquisition/parsers/parse4SaleHeavyEquipment.js

import {
  createMachineObjectModel
} from "../../machine-object";

function clean(value) {
  return value ? String(value).replace(/\s+/g, " ").trim() : "";
}

function stripHtml(value = "") {
  return clean(String(value).replace(/<[^>]*>/g, " "));
}

function matchFirst(html, patterns = []) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return clean(match[1]);
  }

  return "";
}

function extractMeta(html, property) {
  return matchFirst(html, [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i")
  ]);
}

function extractImages(html) {
  const urls = new Set();

  const ogImage = extractMeta(html, "og:image");
  if (ogImage) urls.add(ogImage);

  const imageMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);

  for (const match of imageMatches) {
    const src = clean(match[1]);

    if (
      src &&
      !src.includes("logo") &&
      !src.includes("icon") &&
      !src.includes("placeholder")
    ) {
      urls.add(src);
    }
  }

  return Array.from(urls).slice(0, 40);
}

function inferMachineFacts(title = "", description = "") {
  const text = `${title} ${description}`;

  const year = matchFirst(text, [/\b(19[8-9]\d|20[0-3]\d)\b/]);
  const hours = matchFirst(text, [/([\d,]+)\s*(?:hrs|hours)\b/i]);
  const price = matchFirst(text, [/\$\s*([\d,]+)/]);

  const titleParts = clean(title)
    .replace(/[-|].*$/g, "")
    .split(" ")
    .filter(Boolean);

  const yearIndex = titleParts.findIndex(part =>
    /^(19[8-9]\d|20[0-3]\d)$/.test(part)
  );

  const make =
    yearIndex >= 0
      ? titleParts[yearIndex + 1] || ""
      : titleParts[0] || "";

  const model =
    yearIndex >= 0
      ? titleParts.slice(yearIndex + 2, yearIndex + 4).join(" ")
      : titleParts.slice(1, 3).join(" ");

  return {
    year,
    make,
    model,
    hours,
    price
  };
}

export async function parse4SaleHeavyEquipment(url = "") {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 IronXchangeBot/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`4Sale fetch failed: ${response.status}`);
  }

  const html = await response.text();

  const title =
    extractMeta(html, "og:title") ||
    matchFirst(html, [/<title[^>]*>(.*?)<\/title>/i]);

  const description =
    extractMeta(html, "og:description") ||
    matchFirst(html, [/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i]);

  const facts = inferMachineFacts(title, description);
  const media = extractImages(html);

  return {
    source: {
      type: "4sale-heavy-equipment",
      label: "4Sale Heavy Equipment",
      url
    },

   machine: createMachineObjectModel({
  year: facts.year,
  make: facts.make,
  model: facts.model,
      hours: facts.hours,
      price: facts.price,
      description: stripHtml(description || title)
    }),

    media,

    confidence: {
      title: title ? "parsed" : "missing",
      facts: facts.year || facts.make || facts.model ? "partial" : "missing",
      photos: media.length > 0 ? "parsed" : "missing"
    }
  };
}
