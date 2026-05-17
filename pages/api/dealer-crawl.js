function extractEmails(text) {
  const matches = text.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
  );

  return [...new Set(matches || [])];
}

function extractPhones(text) {
  const matches = text.match(
    /(\+1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/g
  );

  return [...new Set(matches || [])];
}

function extractContacts(text) {
  const contacts = [];

  const lines = text.split("\n");

  for (const line of lines) {
    const clean = line.trim();

    if (
      clean.includes("Sales") ||
      clean.includes("Manager") ||
      clean.includes("Equipment") ||
      clean.includes("Rental")
    ) {
      if (clean.length < 120) {
        contacts.push(clean);
      }
    }
  }

  return [...new Set(contacts)].slice(0, 20);
}

function extractInternalLinks(html, baseUrl) {
  const matches = html.match(/href="([^"]+)"/gi) || [];

  const links = matches
    .map((match) => {
      const url = match.replace(/href=|"/gi, "");

      if (url.startsWith("/")) {
        return baseUrl.replace(/\/$/, "") + url;
      }

      if (url.startsWith(baseUrl)) {
        return url;
      }

      return null;
    })
    .filter(Boolean);

  return [...new Set(links)].slice(0, 15);
}

async function fetchPage(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "IXI Dealer Graph Research Bot"
      }
    });

    const html = await response.text();

    return {
      html,
      emails: extractEmails(html),
      phones: extractPhones(html),
      contacts: extractContacts(html),
      links: extractInternalLinks(html, url)
    };
  } catch (error) {
    return {
      html: "",
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
      company: row[0],
      website: row[1],
      category: row[2],
      state: row[3]
    }))
    .filter((dealer) => dealer.website);

  const results = [];

  for (const dealer of crawlTargets) {
    let allEmails = [];
    let allPhones = [];
    let allContacts = [];
    let scannedLinks = [];

    const homepage = await fetchPage(dealer.website);

    allEmails.push(...homepage.emails);
    allPhones.push(...homepage.phones);
    allContacts.push(...homepage.contacts);

    scannedLinks.push(dealer.website);

    for (const link of homepage.links.slice(0, 10)) {
      const scan = await fetchPage(link);

      scannedLinks.push(link);

      allEmails.push(...scan.emails);
      allPhones.push(...scan.phones);
      allContacts.push(...scan.contacts);
    }

    results.push({
      ...dealer,
      emails: [...new Set(allEmails)],
      phones: [...new Set(allPhones)],
      contacts: [...new Set(allContacts)],
      scannedLinks
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
