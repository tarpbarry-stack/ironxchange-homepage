import { createInstance, types as sdkTypes } from "sharetribe-flex-sdk";

const { UUID, Money } = sdkTypes;

function cleanNumber(value = "") {
  return String(value).replace(/[^0-9]/g, "");
}

async function safeJson(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      listingId,
      title,
      price,
      hours,
      location,
      description,
      keywords = []
    } = req.body;

    if (!listingId) {
      return res.status(400).json({ error: "Missing listingId" });
    }

    const sdk = createInstance({
      clientId: process.env.SHARETRIBE_CLIENT_ID,
      clientSecret: process.env.SHARETRIBE_CLIENT_SECRET
    });

    const updatePayload = {
      id: new UUID(listingId),
      description: description || "",
      publicData: {
        hours: Number(cleanNumber(hours)),
        city: location || "",
        keywords: Array.isArray(keywords) ? keywords : []
      }
    };

    if (title) {
      updatePayload.title = title;
    }

    if (cleanNumber(price)) {
      updatePayload.price = new Money(Number(cleanNumber(price)) * 100, "USD");
    }

    const response = await sdk.ownListings.update(updatePayload, {
      expand: true
    });

    return res.status(200).json({
      ok: true,
      listing: response.data.data
    });
  } catch (err) {
    console.error("UPDATE LISTING DETAILS ERROR:", err);

    return res.status(500).json({
      error: "Update failed",
      message: err.message,
      details: err.data || null
    });
  }
}
