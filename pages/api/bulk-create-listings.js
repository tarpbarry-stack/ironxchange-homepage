const integrationSdk = require("sharetribe-flex-integration-sdk");
const sharetribeSdk = require("sharetribe-flex-sdk");

const { UUID, Money } = sharetribeSdk.types;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const sdk = integrationSdk.createInstance({
      clientId: process.env.SHARETRIBE_CLIENT_ID,
      clientSecret: process.env.SHARETRIBE_CLIENT_SECRET
    });

    const authorId =
      req.body?.authorId ||
      "11111111-1111-1111-1111-111111111111";

    const created = await sdk.listings.create({
      title: "BULK TEST MACHINE",

      description:
        "Bulk upload API test listing.",

      authorId: new UUID(authorId),

      state: "draft",

      price: new Money(
        28500000,
        "USD"
      ),

      publicData: {
        category: "DOZERS",
        year: 2021,
        make: "CATERPILLAR",
        model: "D6",
        hours: 3210,
        location: "Dallas, TX",
        workflowStatus: "good-listing",
        listingStatus: "live",
        externalLinks: []
      }
    });

    return res.status(200).json({
      success: true,
      created
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error:
        err?.data?.errors?.[0]?.detail ||
        err?.message ||
        "Listing create failed"
    });
  }
}
