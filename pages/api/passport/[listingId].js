// /pages/api/passport-listing/[listingId].js

const integrationSdk = require(
  "sharetribe-flex-integration-sdk"
);

function extractError(error) {
  return (
    error?.data?.errors?.[0]?.title ||
    error?.data?.errors?.[0]?.detail ||
    error?.data?.errors?.[0]?.code ||
    error?.message ||
    "Machine lookup failed"
  );
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  const { listingId } = req.query;

  if (!listingId) {
    return res.status(400).json({
      ok: false,
      error: "listingId is required"
    });
  }

  const clientId = process.env.SHARETRIBE_CLIENT_ID;
  const clientSecret =
    process.env.SHARETRIBE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      ok: false,
      error: "Sharetribe Integration credentials are missing"
    });
  }

  const sdk = integrationSdk.createInstance({
    clientId,
    clientSecret
  });

  try {
    const response = await sdk.listings.show(
      {
        id: listingId,
        include: ["author", "images"]
      },
      {
        expand: true
      }
    );

    const listing = response?.data?.data;
    const included = response?.data?.included || [];

    if (!listing) {
      return res.status(404).json({
        ok: false,
        error: "Machine listing was not found"
      });
    }

    return res.status(200).json({
      ok: true,
      listing,
      included
    });
  } catch (error) {
    console.error("PASSPORT LISTING LOOKUP ERROR:", {
      listingId,
      error: extractError(error)
    });

    const status =
      error?.status ||
      error?.statusCode ||
      error?.data?.status ||
      500;

    return res.status(
      Number.isInteger(status) ? status : 500
    ).json({
      ok: false,
      error: extractError(error)
    });
  }
}
