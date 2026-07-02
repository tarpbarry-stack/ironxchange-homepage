export function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractJsonLdObjects(html) {
  const blocks = [];
  const regex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  let match;

  while ((match = regex.exec(html))) {
    try {
      blocks.push(JSON.parse(match[1].trim()));
    } catch {
      // Ignore bad JSON-LD blocks.
    }
  }

  return blocks;
}

export function findJsonLdByType(html, type) {
  return extractJsonLdObjects(html).find(
    item => item?.["@type"] === type
  );
}

export function extractMetaContent(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
      "i"
    )
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }

  return "";
}

export function extractCanonicalUrl(html) {
  const match = html.match(
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i
  );

  return match?.[1] || "";
}

export function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function extractMachineryTraderSpecs(html) {
  const specs = {};
  const regex =
    /<div class="detail__specs-label">([\s\S]*?)<\/div>\s*<div class="detail__specs-value">([\s\S]*?)<\/div>/gi;

  let match;

  while ((match = regex.exec(html))) {
    const label = cleanText(stripTags(match[1]));
    const value = cleanText(stripTags(decodeHtml(match[2])));

    if (label && value) {
      specs[label] = value;
    }
  }

  return specs;
}

export function stripTags(value) {
  return String(value || "").replace(/<[^>]*>/g, " ");
}

export function extractSandhillsPhotoUrls(html) {
  const urls = [];
  const seen = new Set();

  const regex =
    /https:\/\/media\.sandhills\.com\/img\.axd\?[^"'<>\s]+/gi;

  let match;

  while ((match = regex.exec(html))) {
    const raw = decodeHtml(match[0]);

    if (!raw.includes("id=")) continue;

    const normalized = normalizeSandhillsImageUrl(raw);

    if (!seen.has(normalized)) {
      seen.add(normalized);
      urls.push(normalized);
    }
  }

  return urls;
}

export function normalizeSandhillsImageUrl(url) {
  try {
    const parsed = new URL(url);

    // Preserve source image identity and checksum, but request full-size image.
    parsed.searchParams.set("w", "0");
    parsed.searchParams.set("h", "0");

    return parsed.toString();
  } catch {
    return url;
  }
}

export function parseNumber(value) {
  const cleaned = String(value || "").replace(/[^\d.]/g, "");
  if (!cleaned) return "";
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : "";
}
