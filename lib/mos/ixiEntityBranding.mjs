const clean = value => typeof value === "string" ? value.trim() : "";
const imageId = value => clean(value?.uuid || value);

// Resolve presentation only from this Entity or the authenticated user's
// linked profile image. Included machine/user images are never a fallback.
export function getIXIEntityLogoUrl(environment = {}, entity = {}) {
  const savedLogo = clean(entity.logoUrl) || clean(entity.imageUrl);
  if (savedLogo) return savedLogo;

  const currentUser = environment.currentUser || {};
  const linkedId = imageId(currentUser.relationships?.profileImage?.data?.id);
  if (!linkedId) return "";
  const included = [
    ...(Array.isArray(currentUser.included) ? currentUser.included : []),
    ...(Array.isArray(environment.included) ? environment.included : [])
  ];
  const image = included.find(item => item?.type === "image" && imageId(item.id) === linkedId);
  const variants = image?.attributes?.variants || {};
  const preferred = ["default", "scaled-large", "scaled-medium", "scaled-small", "landscape-crop", "landscape-crop2x"];
  for (const key of preferred) {
    if (clean(variants[key]?.url)) return clean(variants[key].url);
  }
  return clean(Object.values(variants).find(variant => clean(variant?.url))?.url);
}
