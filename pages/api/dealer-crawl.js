function extractEmails(text) {
  const matches = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  return [...new Set(matches || [])];
}

function extractPhones(text) {
  const matches = text.match(/(\+1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/g);
  return [...new Set(matches || [])];
}

async function scanWebsite(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "IXI Dealer Graph Research Bot"
      }
    });

    const html = await response.text();

    return {
      emails: extractEmails(html),
      phones: extractPhones(html)
    };
  } catch (error) {
    return {
      emails: [],
      phones: [],
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
    const scan = await scanWebsite(dealer.website);

    results.push({
      ...dealer,
      emails: scan.emails,
      phones: scan.phones,
      error: scan.error || null
    });
  }

  const totalEmails = results.reduce((sum, item) => sum + item.emails.length, 0);
  const totalPhones = results.reduce((sum, item) => sum + item.phones.length, 0);

  return res.status(200).json({
    success: true,
    message: `Scanned ${results.length} dealer websites. Found ${totalEmails} emails and ${totalPhones} phone numbers.`,
    crawlTargets,
    results,
    totalEmails,
    totalPhones
  });
}
