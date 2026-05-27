const sharetribeIntegrationSdk = require("sharetribe-flex-integration-sdk");
const sharetribeSdk = require("sharetribe-flex-sdk");

const flexTypes = sharetribeSdk.types;
const { UUID, Money } = flexTypes;

function toCents(price) {
  if (!price) return null;

  return Math.round(Number(String(price).replace(/[$,\s]/g, "")) * 100);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { authorId, rows } = req.body || {};

    if (!authorId) {
      return res.status(400).json({
        error: "Missing authorId",
      });
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        error: "Missing rows",
      });
    }

    if (!process.env.SHARETRIBE_CLIENT_ID || !process.env.SHARETRIBE_CLIENT_SECRET) {
      return res.status(500).json({
        error: "Missing Sharetribe Integration SDK env variables",
      });
    }

    const integrationSdk = sharetribeIntegrationSdk.createInstance({
      clientId: process.env.SHARETRIBE_CLIENT_ID,
      clientSecret: process.env.SHARETRIBE_CLIENT_SECRET,
    });

    const results = [];

    for (const row of rows) {
      try {
        if (!row.isValid) {
          results.push({
            row: row.rowNumber,
            status: "error",
            title: row.title || "-",
            error: row.errors?.join(", ") || "Invalid row",
          });

          continue;
        }

        const cents = toCents(row.price);

        const publicData = {
          category: row.category,
          year: Number(row.year),
          make: row.make,
          model: row.model,
          hours: Number(row.hours),
          price: row.price ? Number(row.price) : null,
          location: row.location,
          description: row.description,
          keywords: row.keywords || [],
          imageUrls: row.imageUrls || [],
          workflowStatus: "good-listing",
          listingStatus: "live",
          externalLinks: row.externalLinks || [],
          sellerReference: row.sellerReference || "",
          serialNumber: row.serialNumber || "",
          condition: row.condition || "",
          city: row.city || "",
          state: row.state || "",
        };

        const createParams = {
          title: row.title,
          authorId: new UUID(authorId),
          state: "published",
          description: row.description,
          publicData,
          metadata: {
            workflowStatus: "good-listing",
            listingStatus: "live",
          },
        };

        if (cents) {
          createParams.price = new Money(cents, "USD");
        }

        const response = await integrationSdk.listings.create(createParams, {
          expand: true,
        });

        const listingId = response?.data?.data?.id?.uuid;

        results.push({
          row: row.rowNumber,
          status: "created",
          listingId,
          title: row.title,
        });

        await sleep(500);
      } catch (err) {
        console.error("BULK IMPORT ROW ERROR:", err);

        results.push({
          row: row.rowNumber,
          status: "error",
          title: row.title || "-",
          error:
            err?.data?.errors?.[0]?.detail ||
            err?.data?.errors?.[0]?.title ||
            err?.message ||
            "Listing creation failed",
        });
      }
    }

    return res.status(200).json({
      results,
    });
  } catch (err) {
    console.error("BULK IMPORT API ERROR:", err);

    return res.status(500).json({
      error: err?.message || "Bulk upload failed",
    });
  }
}
