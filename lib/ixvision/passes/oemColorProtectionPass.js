import { OEM_COLOR_PROFILES } from "../profiles/oemColorProfiles";

function normalizeMake(make) {
  return String(make || "")
    .toUpperCase()
    .replace(/&/g, "AND")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function getOEMProfile(make) {
  const key = normalizeMake(make);

  if (key.includes("CAT") || key.includes("CATERPILLAR")) {
    return OEM_COLOR_PROFILES.CATERPILLAR;
  }

  if (key.includes("DEERE") || key.includes("JOHN_DEERE")) {
    return OEM_COLOR_PROFILES.JOHN_DEERE;
  }

  if (key.includes("KOMATSU")) {
    return OEM_COLOR_PROFILES.KOMATSU;
  }

  if (key.includes("VOLVO")) {
    return OEM_COLOR_PROFILES.VOLVO;
  }

  if (key.includes("CASE")) {
    return OEM_COLOR_PROFILES.CASE;
  }

  return OEM_COLOR_PROFILES.DEFAULT;
}

export function oemColorProtectionPass({ preset, make }) {
  const profile = getOEMProfile(make);

  return {
    ...preset,
    brightnessLift: Math.min(preset.brightnessLift, profile.maxBrightnessLift),
    contrastLift: Math.min(preset.contrastLift, profile.maxContrastLift),
    saturationLift: Math.min(preset.saturationLift, profile.maxSaturationLift),
    profile,
  };
}
