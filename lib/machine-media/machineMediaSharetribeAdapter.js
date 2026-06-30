function getExistingImageId(photo) {
  return (
    photo?.imageId ||
    photo?.id?.uuid ||
    photo?.id ||
    photo?.image?.id?.uuid ||
    photo?.image?.id ||
    null
  );
}

function getUploadFile(photo) {
  return (
    photo?.file ||
    photo?.activeFile ||
    photo?.originalFile ||
    photo?.cleanFile ||
    photo?.dealerPopFile ||
    null
  );
}

export async function buildMachineMediaImageIds({ sdk, photoItems = [] }) {
  const imageIds = [];

  for (const photo of photoItems) {
    const existingId = getExistingImageId(photo);

    if (existingId) {
      imageIds.push(existingId);
      continue;
    }

    const file = getUploadFile(photo);

    if (!file) continue;

    const uploaded = await sdk.images.upload({ image: file });

    const uploadedId =
      uploaded?.data?.data?.id?.uuid ||
      uploaded?.data?.data?.id ||
      uploaded?.data?.id?.uuid ||
      uploaded?.data?.id;

    if (uploadedId) {
      imageIds.push(uploadedId);
    }
  }

  return imageIds;
}

export async function updateMachineMediaForListing({
  sdk,
  listingId,
  photoItems = []
}) {
  const imageIds = await buildMachineMediaImageIds({ sdk, photoItems });

  if (!listingId) {
    throw new Error("Missing listingId for media update");
  }

  const response = await sdk.ownListings.update({
    id: listingId,
    images: imageIds
  });

  return {
    response,
    imageIds
  };
}
