// pages/api/current-user-profile.js

import { getSdk } from "../../util/api";

function pickImageUrl(image) {
  if (!image) return null;

  const variants =
    image?.attributes?.variants ||
    image?.attributes?.variants?.default ||
    {};

  return (
    variants?.default?.url ||
    variants?.squareSmall?.url ||
    variants?.squareSmall2x?.url ||
    variants?.landscapeCrop?.url ||
    image?.attributes?.url ||
    null
  );
}

function findIncludedImage(included, relationshipData) {
  if (!relationshipData?.id?.uuid) return null;

  const imageId = relationshipData.id.uuid;

  return included?.find(item => {
    return (
      item?.type === "image" &&
      item?.id?.uuid === imageId
    );
  });
}

export default async function handler(req, res) {
  try {
    const sdk = getSdk(req, res);

    const response = await sdk.currentUser.show({
      include: ["profileImage"],
      "fields.image": ["variants.default", "variants.squareSmall", "variants.squareSmall2x"],
    });

    const user = response?.data?.data || null;
    const included = response?.data?.included || [];

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "No authenticated current user found",
      });
    }

    const profile = user?.attributes?.profile || {};
    const protectedData = profile?.protectedData || {};
    const publicData = profile?.publicData || {};
    const privateData = profile?.privateData || {};

    const profileImageRelationship =
      user?.relationships?.profileImage?.data || null;

    const profileImage = findIncludedImage(
      included,
      profileImageRelationship
    );

    const logoUrl = pickImageUrl(profileImage);

    return res.status(200).json({
      ok: true,

      id: user?.id?.uuid || null,

      displayName:
        profile?.displayName ||
        publicData?.companyName ||
        null,

      abbreviatedName:
        profile?.abbreviatedName ||
        null,

      phoneNumber:
        protectedData?.phoneNumber ||
        privateData?.phoneNumber ||
        null,

      logoUrl,
      profileImageUrl: logoUrl,

      savedListings: [],

      raw: {
        hasProfileImage: Boolean(profileImage),
        hasProtectedPhone: Boolean(protectedData?.phoneNumber),
      },
    });
  } catch (error) {
    console.error("current-user-profile error:", error);

    return res.status(500).json({
      ok: false,
      error: "Failed to load current user profile",
    });
  }
}
