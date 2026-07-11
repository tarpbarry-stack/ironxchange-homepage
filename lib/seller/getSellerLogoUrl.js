// /lib/seller/getSellerLogoUrl.js

function getId(value) {
  return value?.uuid || value || "";
}

function getVariantUrl(variants = {}) {
  const nonSquareVariant = Object.entries(variants).find(
    ([key, value]) =>
      value?.url &&
      !String(key).toLowerCase().includes("square")
  );

  return (
    variants.default?.url ||
    variants["landscape-crop"]?.url ||
    variants["landscape-crop2x"]?.url ||
    variants["scaled-large"]?.url ||
    variants["scaled-medium"]?.url ||
    variants["scaled-small"]?.url ||
    nonSquareVariant?.[1]?.url ||
    Object.values(variants).find(value => value?.url)?.url ||
    ""
  );
}

export default function getSellerLogoUrl(source = {}) {
  /*
   * Already-resolved URL support.
   * This keeps the adapter useful outside Sharetribe too.
   */
  const directUrl =
    source.sellerLogo ||
    source.logo ||
    source.logoUrl ||
    source.profileImageUrl ||
    source.attributes?.sellerLogo ||
    source.attributes?.publicData?.sellerLogo ||
    source.attributes?.profile?.publicData?.sellerLogo ||
    "";

  if (typeof directUrl === "string" && directUrl.trim()) {
    return directUrl.trim();
  }

  /*
   * Sharetribe profileImage relationship.
   */
  const profileImageId = getId(
    source?.relationships?.profileImage?.data?.id
  );

  if (!profileImageId) {
    return "";
  }

  const included = Array.isArray(source.included)
    ? source.included
    : [];

  const image = included.find(item => {
    if (item?.type !== "image") return false;

    return getId(item?.id) === profileImageId;
  });

  return getVariantUrl(image?.attributes?.variants || {});
}
