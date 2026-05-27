const integrationSdk = require("sharetribe-flex-integration-sdk");
const sharetribeSdk = require("sharetribe-flex-sdk");

const { UUID, Money } = sharetribeSdk.types;

function extractSharetribeError(err) {
  return {
    message: err?.message || null,
    status: err?.status || null,
    errors:
      err?.data?.errors ||
      err?.response?.data?.errors ||
      null
  };
}

function cleanNumber(value) {
  if (!value) return null;

  return Number(
    String(value).replace(/[$,\s]/g, "")
  );
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
    const rows = req.body?.rows || [];

    if (!authorId) {
      return res.status(400).json({
        error: "Missing authorId"
      });
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        error: "Missing rows"
      });
    }

    const results = [];

    for (const row of rows) {
      try {
        if (!row?.isValid) {
          results.push({
            row: row?.rowNumber || 0,
            status: "error",
            title: row?.title || "Invalid Row",
            error:
              row?.errors?.join(", ") ||
              "Invalid row"
          });

          continue;
        }

        const numericPrice = cleanNumber(row.price);

        const created = await sdk.listings.create({
          title: row.title,

          description:
            row.description ||

            "Bulk uploaded listing.",

          authorId: new UUID(authorId),

          state: "published",

          price: new Money(
            numericPrice * 100,
            "USD"
          ),

          publicData: {
            listingType: "free-listing",

            transactionProcessAlias:
              "default-inquiry/release-1",

            unitType: "inquiry",

            categoryLevel1:
              String(row.category || "")
                .toLowerCase()
                .replace(/\s+/g, "-"),

            categoryLevel2:
              `${String(row.category || "")
                .toLowerCase()
                .replace(/\s+/g, "-")}-${String(
                row.make || ""
              )
                .toLowerCase()
                .replace(/\s+/g, "-")}`,

            categoryLevel3:
              `${String(row.category || "")
                .toLowerCase()
                .replace(/\s+/g, "-")}-${String(
                row.make || ""
              )
                .toLowerCase()
                .replace(/\s+/g, "-")}-${String(
                row.model || ""
              )
                .toLowerCase()
                .replace(/\s+/g, "-")}`,

            loc: row.state || row.location || "",

            city: row.city || "",

            category: row.category || "",

            year: String(row.year || ""),

            make: row.make || "",

            model: row.model || "",

            hours: cleanNumber(row.hours),

            location: row.location || "",

            keywords:
              row.keywords || [],

            imageUrls:
              row.imageUrls || [],

            sellerReference:
              row.sellerReference || "",

            serialNumber:
              row.serialNumber || "",

            condition:
              row.condition || "",

            workflowStatus:
              "good-listing",

            listingStatus:
              "live",

            externalLinks:
              row.externalLinks || []
          }
        });

        results.push({
          row: row.rowNumber,
          status: "created",
          title: row.title,
          listingId:
            created?.data?.data?.id?.uuid || null
        });

      } catch (err) {
        console.error(
          "BULK CREATE ERROR:",
          JSON.stringify(
            extractSharetribeError(err),
            null,
            2
          )
        );

        results.push({
          row: row?.rowNumber || 0,
          status: "error",
          title:
            row?.title ||
            "Unknown Machine",

          error:
            err?.data?.errors?.[0]?.title ||
            err?.data?.errors?.[0]?.code ||
            err?.message ||
            "Listing create failed"
        });
      }
    }

    return res.status(200).json({
      results
    });

  } catch (err) {
    console.error(
      "BULK IMPORT FATAL:",
      err
    );

    return res.status(500).json({
      error:
        err?.message ||
        "Bulk upload failed"
    });
  }
}
