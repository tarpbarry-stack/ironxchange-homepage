function extractLinks(html, baseUrl) {
  const matches = html.match(/href=["']([^"']+)["']/gi) || [];

  return matches
    .map((match) =>
      match.replace(/^href=/i, "").replace(/["']/g, "").trim()
    )
    .map((href) => {
      if (href.startsWith("/")) {
        return `${baseUrl}${href}`;
      }

      if (href.startsWith("http")) {
        return href;
      }

      return null;
    })
    .filter(Boolean);
}

function cleanNameFromUrl(url) {
  return url
    .replace("https://", "")
    .replace("http://", "")
    .replace("www.", "")
    .split("/")[0]
    .replace(".com", "")
    .replace(/[-_]/g, " ")
    .toUpperCase();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed"
    });
  }

  const sourceUrl = "https://www.machinerytrader.com/dealers";
  const baseUrl = "https://www.machinerytrader.com";

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; IXI Dealer Discovery Bot)",
        Accept: "text/html"
      }
    });

    const html = await response.text();

    const links = extractLinks(html, baseUrl);

    const dealerLinks = links
      .filter((link) => {
        const lower = link.toLowerCase();

        return (
          lower.includes("dealer") ||
          lower.includes("inventory") ||
          lower.includes("company")
        );
      })
      .slice(0, 25);

    const targets = dealerLinks.map((link) => ({
      company: cleanNameFromUrl(link),
      website: link,
      category: "MachineryTrader Dealer Discovery",
      state: "US"
    }));

    if (targets.length === 0) {
      return res.status(200).json({
        success: true,
        message:
          "MachineryTrader page loaded, but no dealer targets were extracted yet.",
        targets: [
          {
            company: "MachineryTrader Dealers",
            website: sourceUrl,
            category: "Dealer Discovery Source",
            state: "US"
          }
        ]
      });
    }

    return res.status(200).json({
      success: true,
      message: `Discovered ${targets.length} MachineryTrader targets.`,
      targets
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      message: `MachineryTrader discovery error: ${error.message}`,
      targets: [
        {
          company: "MachineryTrader Dealers",
          website: sourceUrl,
          category: "Dealer Discovery Source",
          state: "US"
        }
      ]
    });
  }
}
