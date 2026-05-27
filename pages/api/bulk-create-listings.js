const integrationSdk = require("sharetribe-flex-integration-sdk");
const sharetribeSdk = require("sharetribe-flex-sdk");

const { UUID, Money } = sharetribeSdk.types;

function extractSharetribeError(err) {
  return {
    message: err?.message || null,
    status: err?.status || err?.statusCode || err?.response?.status || null,
    data: err?.data || null,
    responseData: err?.response?.data || null,
    errors: err?.data?.errors || err?.response?.data?.errors || null
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const sdk = integrationSdk.createInstance({
      clientId: process.env.SHARETRIBE_CLIENT_ID,
      clientSecret: process.env.SHARETRIBE_CLIENT_SECRET
    });

    const authorId = req.body?.authorId;

    if (!authorId) {
      return res.status(400).json({ error: "Missing authorId" });
    }

    const createParams = {
      title: "BULK TEST MACHINE",
      description: "Bulk upload API test listing.",
      authorId: new UUID(authorId),
      state: "published",
      price: new Money(28500000, "USD"),
      publicData: {
        listingType: "free-listing",
        transactionProcessAlias: "default-inquiry/release-1",
        unitType: "inquiry",
        categoryLevel1: "dozers",
        categoryLevel2: "dozers-caterpillar",
        categoryLevel3: "dozers-caterpillar-d6",
        loc: "TX",
        city: "Dallas",
        year: "2021",
        make: "CATERPILLAR",
        model: "D6",
        hours: 3210,
        workflowStatus: "good-listing",
        listingStatus: "live",
        keywords: [],
        externalLinks: []
      }
    };

    const created = await sdk.listings.create(createParams, {
      expand: true
    });

    return res.status(200).json({
      success: true,
      listingId: created?.data?.data?.id?.uuid || null,
      created
    });

  } catch (err) {
    console.error(
      "BULK CREATE ERROR FULL:",
      JSON.stringify(extractSharetribeError(err), null, 2)
    );

    return res.status(500).json({
      error: "Listing create failed",
      sharetribe: extractSharetribeError(err)
    });
  }
}
