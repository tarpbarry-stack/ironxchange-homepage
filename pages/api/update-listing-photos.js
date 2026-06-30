import {
  updateListingPhotosVerified
} from "../../lib/sharetribe/IXISharetribePhotoMutationEngine";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  try {
    const {
      listingId,
      imageIds = []
    } = req.body || {};

    if (!listingId) {
      return res.status(400).json({
        ok: false,
        error: "Missing listingId"
      });
    }

    if (!Array.isArray(imageIds)) {
      return res.status(400).json({
        ok: false,
        error: "imageIds must be an array"
      });
    }

    const result = await updateListingPhotosVerified({
      listingId,
      imageIds
    });

    return res.status(200).json({
      ok: true,
      command: "UPDATE_LISTING_PHOTOS",
      listingId: String(listingId),
      requested: {
        imageIds
      },
      ...result
    });
  } catch (error) {
    console.error("UPDATE LISTING PHOTOS ERROR:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Photo update failed"
    });
  }
}
