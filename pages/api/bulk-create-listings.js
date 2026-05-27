const integrationSdk = require("sharetribe-flex-integration-sdk");
const sharetribeSdk = require("sharetribe-flex-sdk");

const { UUID, Money } = sharetribeSdk.types;

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function cleanNumber(value) {
  if (!value) return null;

  const cleaned = String(value).replace(/[$,\s]/g, "");

  if (!cleaned) return null;

  const number = Number(cleaned);

  return Number.isNaN(number) ? null : number;
}

function toSlugPart(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractSharetribeError(err) {
  return (
    err?.data?.errors?.[0]?.title ||
    err?.data?.errors?.[0]?.code ||
    err?.message ||
    "Listing create failed"
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

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

  const sdk = integrationSdk.createInstance({
    clientId: process.env.SHARETRIBE_CLIENT_ID,
    clientSecret: process.env.SHARETRIBE_CLIENT_SECRET
  });

  const results = [];

  for (const row of rows) {
    try {
      if (!row?.isValid) {
        results.push({
          row: row?.rowNumber || 0,
          status: "error",
          title: row?.title || "Invalid Row",
          listingId: null,
          launchStudioUrl: null,
          publicUrl: null,
          error: row?.errors?.join(", ") || "Invalid row"
        });

        continue;
      }

      const categorySlug = toSlugPart(row.category);
      const makeSlug = toSlugPart(row.make);
      const modelSlug = toSlugPart(row.model);

      const numericPrice = cleanNumber(row.price);
      const numericHours = cleanNumber(row.hours);

      const title =
        row.title ||
        `${row.year} ${row.make} ${row.model} - ${row.hours} hrs`;

      const priceMoney = new Money(
        numericPrice ? numericPrice * 100 : 0,
        "USD"
      );

      const publicData = {
        listingType: "free-listing",
        transactionProcessAlias: "default-inquiry/release-1",
        unitType: "inquiry",

        categoryLevel1: categorySlug,
        categoryLevel2: `${categorySlug}-${makeSlug}`,
        categoryLevel3: `${categorySlug}-${makeSlug}-${modelSlug}`,

        category: row.category || "",
        year: String(row.year || ""),
        make: row.make || "",
        model: row.model || "",
        hours: numericHours || 0,

        price: numericPrice || null,
        callForPrice: !numericPrice,

        location: row.location || "",
        loc: row.state || row.location || "",
        city: row.city || "",

        description: row.description || "",

        keywords: row.keywords || [],
        imageUrls: row.imageUrls || [],

        sellerReference: row.sellerReference || "",
        stockNumber: row.sellerReference || "",

        serialNumber: row.serialNumber || "",
        condition: row.condition || "",

        workflowStatus: "good-listing",
        listingStatus: "live",

        externalLinks: row.externalLinks || []
      };

      const created = await sdk.listings.create(
        {
          title,
          description: row.description || "Bulk uploaded listing.",
          authorId: new UUID(authorId),
          state: "published",
          price: priceMoney,
          publicData,
          metadata: {
            workflowStatus: "good-listing",
            listingStatus: "live",
            bulkUploaded: true,
            sellerReference: row.sellerReference || ""
          }
        },
        {
          expand: true
        }
      );

      const listingId =
        created?.data?.data?.id?.uuid || null;

      results.push({
        row: row.rowNumber,
        status: "created",
        title,
        listingId,
        launchStudioUrl: listingId ? `/live?id=${listingId}` : null,
        publicUrl: `/listing/${slugify(title)}`,
        error: null
      });
    } catch (err) {
      console.error("BULK CREATE ROW ERROR:", {
        row: row?.rowNumber,
        title: row?.title,
        error: extractSharetribeError(err),
        raw: err?.data?.errors || err?.message
      });

      results.push({
        row: row?.rowNumber || 0,
        status: "error",
        title: row?.title || "Unknown Machine",
        listingId: null,
        launchStudioUrl: null,
        publicUrl: null,
        error: extractSharetribeError(err)
      });
    }
  }

  return res.status(200).json({
    results
  });
}
