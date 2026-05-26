import SharetribeSdk from "sharetribe-flex-sdk";

const sdk = SharetribeSdk.createInstance({
  clientId: process.env.SHARETRIBE_CLIENT_ID,
  clientSecret: process.env.SHARETRIBE_CLIENT_SECRET
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { listingId, externalLinks } = req.body;

    if (!listingId) {
      return res.status(400).json({
        error: "Missing listingId"
      });
    }

    const cleanLinks = Array.isArray(externalLinks)
      ? externalLinks
          .map(link => ({
            label: String(link?.label || "").trim(),
            url: String(link?.url || "").trim()
          }))
          .filter(link => link.label && link.url)
          .slice(0, 3)
      : [];

    await sdk.ownListings.update({
      id: listingId,
      publicData: {
        externalLinks: cleanLinks
      }
    });

    return res.status(200).json({
      success: true,
      externalLinks: cleanLinks
    });
  } catch (error) {
    console.error("EXTERNAL LINKS UPDATE ERROR:", error);

    return res.status(500).json({
      error: error?.message || "External links update failed"
    });
  }
}
