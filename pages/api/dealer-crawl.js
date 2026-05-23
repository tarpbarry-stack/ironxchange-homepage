function extractEmails(text) {
  const regex =
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

  const matches = text.match(regex) || [];

  return [...new Set(matches)].filter((email) => {
    const lower = email.toLowerCase();

    const blocked = [
      "example.com",
      "wixpress.com",
      "sentry.io",
      "noreply",
      "no-reply"
    ];

    return !blocked.some((bad) =>
      lower.includes(bad)
    );
  });
}

function extractMailtoEmails(html) {
  const matches =
    html.match(/mailto:[^"'? ]+/gi) || [];

  return matches
    .map((match) =>
      match.replace(/mailto:/i, "").trim()
    )
    .filter(Boolean);
}

function extractPhones(text) {
  const regex =
    /(\+1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/g;

  return [...new Set(text.match(regex) || [])];
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

  const contacts = [];

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const lower = line.toLowerCase();

    const useful =
      lower.includes("sales") ||
      lower.includes("manager") ||
      lower.includes("equipment") ||
      lower.includes("rental") ||
      lower.includes("service") ||
      lower.includes("parts");

    const clean =
      line.length >= 4 &&
      line.length <= 120 &&
      !lower.includes("copyright") &&
      !lower.includes("privacy") &&
      !lower.includes("cookie");

    if (useful && clean) {
      contacts.push(line);
    }
  }

  return [...new Set(contacts)].slice(0, 25);
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
    "team",
    "staff",
    "sales",
    "locations",
    "about",
    "service",
    "parts",
    "rental",
    "used-equipment"
  ];

  const badWords = [
    "facebook",
    "instagram",
    "youtube",
    "linkedin",
    "twitter",
    "x.com",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".pdf",
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

  const matches =
    html.match(/href=["']([^"']+)["']/gi) || [];

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

  return [...new Set(links)].slice(0, 8);
}

async function fetchPage(url) {
  try {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 IXI Dealer Graph Bot"
      }
    });

    clearTimeout(timeout);

    const html = await response.text();

    return {
      url,
      emails: [
        ...extractEmails(html),
        ...extractMailtoEmails(html)
      ],
      phones: extractPhones(html),
      contacts: extractContacts(html),
      links: extractInternalLinks(html, url)
    };
  } catch (error) {
    return {
      url,
      emails: [],
      phones: [],
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
    .slice(0, 10);

  const results = [];

  for (const dealer of crawlTargets) {
    let allEmails = [];
    let allPhones = [];
    let allContacts = [];
    let scannedLinks = [];

    const homepage = await fetchPage(dealer.website);

    scannedLinks.push(homepage.url);

    allEmails.push(...homepage.emails);
    allPhones.push(...homepage.phones);
    allContacts.push(...homepage.contacts);

    for (const link of homepage.links) {
      const scan = await fetchPage(link);

      scannedLinks.push(scan.url);

      allEmails.push(...scan.emails);
      allPhones.push(...scan.phones);
      allContacts.push(...scan.contacts);
    }

    results.push({
      ...dealer,
      emails: [...new Set(allEmails)],
      phones: [...new Set(allPhones)],
      contacts: [...new Set(allContacts)],
      scannedLinks: [...new Set(scannedLinks)]
    });
  }

  const totalEmails = results.reduce(
    (sum, item) => sum + item.emails.length,
    0
  );

  const totalPhones = results.reduce(
    (sum, item) => sum + item.phones.length,
    0
  );

  return res.status(200).json({
    success: true,
    message: `Scanned ${results.length} dealer websites. Found ${totalEmails} emails and ${totalPhones} phone numbers.`,
    results,
    totalEmails,
    totalPhones
  });
}
