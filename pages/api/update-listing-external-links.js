import { IntegrationSdk } from "sharetribe-flex-integration-sdk";

const sdk = new IntegrationSdk({
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
    const {
      listingId,
      externalLinks
    } = req.body;

    if (!listingId) {
      return res.status(400).json({
        error: "Missing listingId"
      });
    }

    const cleanLinks = Object.fromEntries(
      Object.entries(externalLinks || {}).map(
        ([key, value]) => [
          key,
          String(value || "").trim()
        ]
      )
    );

    await sdk.listings.update(
      {
        id: listingId,
        publicData: {
          externalLinks: cleanLinks
        }
      },
      {
        expand: true
      }
    );

    return res.status(200).json({
      success: true
    });

  } catch (error) {
    console.error(
      "EXTERNAL LINKS UPDATE ERROR:",
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "External links update failed"
    });
  }
}
