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
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const sdk = integrationSdk.createInstance({
      clientId: process.env.SHARETRIBE_CLIENT_ID,
      clientSecret: process.env.SHARETRIBE_CLIENT_SECRET
    });

    const authorId = req.body?.authorId;

    if (!authorId) {
      return res.status(400).json({
        error: "Missing authorId"
      });
    }

    const created = await sdk.listings.create({
      title: "BULK TEST MACHINE",

      description:
        "Bulk upload API test listing.",

      authorId: new UUID(authorId),

      state: "published",

      price: new Money(
        28500000,
        "USD"
      ),

      publicData: {
        listingType: "free-listing",
        transactionProcessAlias:
          "default-inquiry/release-1",

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
    });

    return res.status(200).json({
      results: [
        {
          row: 2,
          status: "created",
          title: "BULK TEST MACHINE",
          listingId:
            created?.data?.data?.id?.uuid || null
        }
      ]
    });

  } catch (err) {
    console.error(
      "BULK CREATE ERROR FULL:",
      JSON.stringify(
        extractSharetribeError(err),
        null,
        2
      )
    );

    return res.status(500).json({
      results: [
        {
          row: 2,
          status: "error",
          title: "BULK TEST MACHINE",
          error:
            err?.data?.errors?.[0]?.title ||
            err?.data?.errors?.[0]?.code ||
            err?.message ||
            "Listing create failed"
        }
      ]
    });
  }
}
