import { getIXDamageProfile } from "./getIXDamageProfile";
import { getIXInspectionProfile } from "./getIXInspectionProfile";

export function classifyIXPhoto(scores = {}) {
  const {
    width = 0,
    height = 0,
    megapixels = 0,
    resolutionScore = 0,
    sharpnessScore = 0,
    compressionScore = 0,
    exposureScore = 0,
    overallScore = 0
  } = scores;

  const damageProfile = getIXDamageProfile(scores);
  const inspectionProfile = getIXInspectionProfile(scores);
  const longestSide = Math.max(width, height);
  const shortestSide = Math.min(width, height);

  const isHighResOriginal =
    megapixels >= 8 ||
    (longestSide >= 3000 && shortestSide >= 2000) ||
    resolutionScore >= 90;

  const isTrueLowRes =
    megapixels < 4 ||
    longestSide < 2200 ||
    resolutionScore < 45;

  if (isHighResOriginal) {
    if (sharpnessScore >= 55 && exposureScore >= 55) {
      return {
        photoType: "HIGH_RES_ORIGINAL",
        confidence: 94,
        pipeline: ["REFINE", "JULIO"],
        inspectionProfile,        damageProfile,
        decision:
          "This is a high-resolution original field photo. It should not be upscaled or restored. IX Vision should preserve inspection detail, lightly refine harsh pixels, and finish with Julio."
      };
    }

    return {
      photoType: "FIELD_READY",
      confidence: 88,
      pipeline: ["CLEAN", "REFINE", "JULIO"],
      inspectionProfile,
      damageProfile,
      decision:
        "This is a usable field photo with enough resolution for buyer inspection. IX Vision should avoid aggressive restoration and apply controlled cleanup, refinement, and Julio finish."
    };
  }

  if (isTrueLowRes) {
    return {
      photoType: "LOW_RES_WEB",
      confidence: 92,
      pipeline: ["UPSCALE", "RESTORE", "REFINE", "JULIO"],
      inspectionProfile,
      damageProfile,
      decision:
        "This photo is too small for buyer inspection. IX Vision should recover size first, restore web-photo damage, refine the edges, and finish with Julio."
    };
  }

  if (compressionScore < 45 && !isHighResOriginal) {
    return {
      photoType: "COMPRESSED_WEB",
      confidence: 90,
      pipeline: ["DEBLOCK", "RESTORE", "REFINE", "JULIO"],
      inspectionProfile,
      damageProfile,
      decision:
        "This photo shows web compression damage. IX Vision should clean artifacts before adding detail, then refine harsh edges and finish with Julio."
    };
  }

  if (sharpnessScore < 45) {
    return {
      photoType: "SOFT_IMAGE",
      confidence: 84,
      pipeline: ["CLARITY", "REFINE", "JULIO"],
      inspectionProfile,
      damageProfile,
      decision:
        "This photo is soft but has enough size to work with. IX Vision should pull machine detail forward, refine pixel breakup, and finish with Julio."
    };
  }

  if (exposureScore < 45) {
    return {
      photoType: "DARK_MACHINE",
      confidence: 82,
      pipeline: ["RECOVER", "CLEAN", "JULIO"],
      inspectionProfile,
      damageProfile,
      decision:
        "This photo is limited by weak exposure. IX Vision should recover brightness and shadows first, then apply safe cleanup and Julio."
    };
  }

  if (overallScore > 70 && compressionScore > 70 && sharpnessScore > 70) {
    return {
      photoType: "MARKETPLACE_READY",
      confidence: 95,
      pipeline: ["CLEAN", "JULIO"],
      inspectionProfile,
      damageProfile,
      decision:
        "This photo is already marketplace-ready. IX Vision should avoid heavy processing and only apply safe cleanup plus Julio presentation finish."
    };
  }

  return {
    photoType: "MIXED_DAMAGE",
    confidence: 68,
    pipeline: ["IX_AUTO", "REFINE", "JULIO"],
    inspectionProfile,
    damageProfile,
    decision:
      "This photo has mixed issues but does not require forced restoration. IX Vision should use a balanced automatic route, refine artifacts, and finish with Julio."
  };
}
