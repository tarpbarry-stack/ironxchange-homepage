function extractEmails(text) {
  const normalEmails =
    text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];

  const obfuscatedEmails = text
    .replace(/\s*\[at\]\s*/gi, "@")
    .replace(/\s*\(at\)\s*/gi, "@")
    .replace(/\s+at\s+/gi, "@")
    .replace(/\s*\[dot\]\s*/gi, ".")
    .replace(/\s*\(dot\)\s*/gi, ".")
    .replace(/\s+dot\s+/gi, ".")
    .match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];

  return [...new Set([...normalEmails, ...obfuscatedEmails])].filter((email) => {
    const lower = email.toLowerCase();

    const blocked = [
      "example.com",
      "sentry.io",
      "wixpress.com",
      "noreply",
      "no-reply",
      "privacy@",
      "support@wordpress",
      "domain.com",
      "email.com",
      "yourname@"
    ];

    return !blocked.some((bad) => lower.includes(bad));
  });
}

function extractMailtoEmails(html) {
  const matches = html.match(/mailto:[^"'?\s>]+/gi) || [];

  return matches
    .map((match) => match.replace(/mailto:/i, "").trim())
    .filter((email) => email.includes("@"));
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function extractContacts(html) {
  const text = stripHtml(html);

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const contacts = [];

  for (const line of lines) {
    const lower = line.toLowerCase();

    const useful =
      lower.includes("sales") ||
      lower.includes("used equipment") ||
      lower.includes("manager") ||
      lower.includes("rental") ||
      lower.includes("service") ||
      lower.includes("parts") ||
      lower.includes("branch") ||
      lower.includes("contact") ||
      lower.includes("equipment") ||
      lower.includes("territory") ||
      lower.includes("representative");

    const clean =
      line.length >= 4 &&
      line.length <= 160 &&
      !lower.includes("copyright") &&
      !lower.includes("privacy") &&
      !lower.includes("cookie") &&
      !lower.includes("javascript") &&
      !lower.includes("all rights reserved");

    if (useful && clean) {
      contacts.push(line);
    }
  }

  return [...new Set(contacts)].slice(0, 50);
}

function normalizeBaseUrl(url) {
  if (!url) return "";

  let clean = url.trim();

  if (
    !clean.startsWith("http://") &&
    !clean.startsWith("https://")
  ) {
    clean = `https://${clean}`;
  }

  return clean.replace(/\/$/, "");
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function shouldScanLink(url) {
  const lower = url.toLowerCase();

  const goodWords = [
    "contact",
    "contact-us",
    "team",
    "staff",
    "sales",
    "locations",
    "location",
    "about",
    "service",
    "parts",
    "rental",
    "used-equipment",
    "used",
    "directory",
    "employees",
    "people",
    "meet",
    "representatives",
    "rep",
    "branches",
    "branch",
    "departments"
  ];

  const badWords = [
    "facebook",
    "instagram",
    "youtube",
    "linkedin",
    "twitter",
    "x.com",
    "mailto:",
    "tel:",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".zip",
    "#",
    "google.com",
    "machinerytrader.com"
  ];

  if (badWords.some((word) => lower.includes(word))) {
    return false;
  }

  return goodWords.some((word) => lower.includes(word));
}

function extractInternalLinks(html, baseUrl) {
  const baseDomain = getDomain(baseUrl);

  const matches = html.match(/href=["']([^"']+)["']/gi) || [];

  const links = matches
    .map((match) => {
      const raw = match
        .replace(/^href=/i, "")
        .replace(/["']/g, "")
        .trim();

      try {
        if (raw.startsWith("/")) {
          return `${baseUrl.replace(/\/$/, "")}${raw}`;
        }

        if (raw.startsWith("http")) {
          const rawDomain = getDomain(raw);

          if (rawDomain === baseDomain) {
            return raw;
          }
        }

        return null;
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .filter(shouldScanLink);

  return [...new Set(links)].slice(0, 15);
}

function priorityPages(baseUrl) {
  const base = baseUrl.replace(/\/$/, "");

  return [
    "",
    "/contact",
    "/contact-us",
    "/locations",
    "/location",
    "/team",
    "/our-team",
    "/meet-the-team",
    "/staff",
    "/staff-directory",
    "/employees",
    "/sales",
    "/sales-team",
    "/used-equipment",
    "/parts",
    "/service",
    "/rental",
    "/branches",
    "/about",
    "/about-us"
  ].map((path) => `${base}${path}`);
}

async function fetchPage(url) {
  try {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 6000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 IXI Email Hunter Bot",
        Accept: "text/html"
      }
    });

    clearTimeout(timeout);

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("text/html")) {
      return {
        url,
        emails: [],
        contacts: [],
        links: []
      };
    }

    const html = await response.text();

    return {
      url,
      emails: [
        ...extractEmails(html),
        ...extractMailtoEmails(html)
      ],
      contacts: extractContacts(html),
      links: extractInternalLinks(html, url)
    };
  } catch (error) {
    return {
      url,
      emails: [],
      contacts: [],
      links: [],
      error: error.message
    };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed"
    });
  }

  const { rows } = req.body;

  if (!rows || !Array.isArray(rows)) {
    return res.status(400).json({
      message: "No dealer rows received"
    });
  }

  const dataRows = rows.slice(1);

  const crawlTargets = dataRows
    .map((row) => ({
      company: row[0] || "",
      website: normalizeBaseUrl(row[1] || ""),
      category: row[2] || "",
      state: row[3] || ""
    }))
    .filter((dealer) => {
      const lower = dealer.website.toLowerCase();

      return (
        dealer.website &&
        !lower.includes("google.com") &&
        !lower.includes("machinerytrader.com")
      );
    })
    .slice(0, 8);

  const results = [];

  for (const dealer of crawlTargets) {
    let allEmails = [];
    let allContacts = [];
    let scannedLinks = [];

    const queuedPages = [
      ...priorityPages(dealer.website)
    ];

    let pagesScannedForDealer = 0;

    for (const page of queuedPages) {
      if (pagesScannedForDealer >= 18) {
        break;
      }

      const scan = await fetchPage(page);

      pagesScannedForDealer += 1;

      scannedLinks.push(scan.url);
      allEmails.push(...scan.emails);
      allContacts.push(...scan.contacts);

      for (const link of scan.links.slice(0, 6)) {
        if (pagesScannedForDealer >= 18) {
          break;
        }

        const deeperScan = await fetchPage(link);

        pagesScannedForDealer += 1;

        scannedLinks.push(deeperScan.url);
        allEmails.push(...deeperScan.emails);
        allContacts.push(...deeperScan.contacts);
      }
    }

    results.push({
      ...dealer,
      emails: [...new Set(allEmails)],
      phones: [],
      contacts: [...new Set(allContacts)],
      scannedLinks: [...new Set(scannedLinks)]
    });
  }

  const totalEmails = results.reduce(
    (sum, item) => sum + item.emails.length,
    0
  );

  return res.status(200).json({
    success: true,
    message: `Email Hunter scanned ${results.length} websites and found ${totalEmails} emails.`,
    results,
    totalEmails,
    totalPhones: 0
  });
}
