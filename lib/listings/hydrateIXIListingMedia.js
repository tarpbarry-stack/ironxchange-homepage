import {
  getIXIMachineMedia
} from "../media/ixiMediaClient";

function getIXIMediaMachineKey(listing = {}) {
  const publicData =
    listing.publicData ||
    listing.attributes?.publicData ||
    {};

 return String(
  listing.ixiMedia?.machineKey ||
  listing.ixiMediaMachineKey ||
  listing.machineKey ||
  publicData.ixiMedia?.machineKey ||
  publicData.ixiMediaMachineKey ||
  ""
).trim();
}

function buildIXIManifestImageObjects(manifest = {}) {
  const media = Array.isArray(manifest.media)
    ? manifest.media
    : [];

  return media
    .map((item, index) => {
      const url =
        item?.url ||
        item?.cdnUrl ||
        item?.publicUrl ||
        item?.optimizedUrl ||
        item?.originalUrl ||
        "";

      if (!url) return null;

      return {
        id:
          item.mediaId ||
          item.id ||
          `ixi-media-${index}`,

        url,

        src: url,

        imageUrl: url,

        previewUrl:
          item.previewUrl ||
          item.thumbnailUrl ||
          url,

        thumbnailUrl:
          item.thumbnailUrl ||
          item.previewUrl ||
          url,

        width:
          item.width ||
          null,

        height:
          item.height ||
          null,

        position:
          item.position ??
          item.order ??
          index,

        isHero:
          Boolean(item.isHero) ||
          String(manifest.heroMediaId || "") ===
            String(item.mediaId || item.id || ""),

        source: "ixi"
      };
    })
    .filter(Boolean);
}

export async function hydrateIXIListingMedia(
  listing = {}
) {
  const machineKey =
    getIXIMediaMachineKey(listing);

  if (!machineKey) {
    return listing;
  }

  if (listing.ixiMediaSource === "ixi") {
    return listing;
  }

  try {
    const response =
      await getIXIMachineMedia(machineKey);

    const manifest =
      response?.manifest ||
      response?.machine ||
      response;

    const imageObjects =
      buildIXIManifestImageObjects(manifest);

    if (!imageObjects.length) {
      return listing;
    }

    const imageUrls =
      imageObjects.map(item => item.url);

    return {
      ...listing,

      imageObjects,

      imageUrls,

      images: imageObjects,

      imageUrl: imageUrls[0] || listing.imageUrl,

      image: imageObjects[0] || listing.image,

      ixiMediaSource: "ixi",

      ixiMediaMachineKey: machineKey,

      ixiMediaVersion:
        manifest?.version ||
        manifest?.updatedAt ||
        "",

      ixiHeroMediaId:
        manifest?.heroMediaId ||
        imageObjects.find(item => item.isHero)?.id ||
        "",

      ixiManifest: manifest
    };
  } catch (error) {
    console.warn(
      "IXI MEDIA LISTING HYDRATION FAILED:",
      machineKey,
      error
    );

    return listing;
  }
}

export async function hydrateIXIListingCollection(
  listings = []
) {
  if (!Array.isArray(listings)) {
    return [];
  }

  return Promise.all(
    listings.map(listing =>
      hydrateIXIListingMedia(listing)
    )
  );
}
