export function getImageUrlFromIncluded(entity = {}) {
  const imageId = entity?.relationships?.profileImage?.data?.id?.uuid;

  const image = entity?.included?.find(
    item => item?.type === "image" && item?.id?.uuid === imageId
  );

  const variants = image?.attributes?.variants || {};

  return (
    variants.default?.url ||
    variants["landscape-crop"]?.url ||
    variants["landscape-crop2x"]?.url ||
    variants["scaled-large"]?.url ||
    variants["scaled-medium"]?.url ||
    variants["scaled-small"]?.url ||
    Object.values(variants).find(v => v?.url)?.url ||
    null
  );
}

export function getSellerProfile(entity = {}) {
  const profile = entity?.attributes?.profile || {};
  const publicData = profile.publicData || {};

  return {
    sellerName:
      publicData.sellerName ||
      profile.displayName ||
      "IronXchange Seller",

    companyName:
      publicData.companyName ||
      profile.abbreviatedName ||
      publicData.sellerName ||
      profile.displayName ||
      "Seller Profile",

    sellerLocation:
      publicData.sellerLocation ||
      publicData.location ||
      publicData.cityState ||
      "",

    sellerLogo:
      getImageUrlFromIncluded(entity),

    website: publicData.website || "",
    facebookUrl: publicData.facebookUrl || "",
    instagramUrl: publicData.instagramUrl || "",
    linkedinUrl: publicData.linkedinUrl || "",
    youtubeUrl: publicData.youtubeUrl || "",
    tiktokUrl: publicData.tiktokUrl || "",
    bio: publicData.bio || publicData.companyBio || ""
  };
}
