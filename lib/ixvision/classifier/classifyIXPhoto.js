import { getIXDamageProfile } from "./getIXDamageProfile";

export function classifyIXPhoto(scores = {}) {
  const {
    resolutionScore = 0,
    sharpnessScore = 0,
    compressionScore = 0,
    exposureScore = 0,
    overallScore = 0
  } = scores;

  const damageProfile = getIXDamageProfile(scores);
  
  if (resolutionScore < 35) {
    return {
      photoType: "LOW_RES_WEB",
      confidence: 92,
      pipeline: ["UPSCALE", "RESTORE", "REFINE", "JULIO"],
      damageProfile,
      decision:
        "This photo has usable exposure, contrast, and color, but the resolution is too low for buyer inspection. IX Vision should recover size first, then restore web-photo damage, refine the edges, and finish with Julio."
    };
  }

  if (compressionScore < 45) {
    return {
      photoType: "COMPRESSED_WEB",
      confidence: 90,
      pipeline: ["DEBLOCK", "RESTORE", "REFINE", "JULIO"],
      damageProfile,
      decision:
        "This photo shows compression damage or blockiness. IX Vision should clean the web-photo artifacts before adding detail, then refine harsh edges and finish with Julio."
    };
  }

  if (sharpnessScore < 45) {
    return {
      photoType: "SOFT_IMAGE",
      confidence: 84,
      pipeline: ["CLARITY", "REFINE", "JULIO"],
      damageProfile,
      decision:
        "This photo is soft but not destroyed. IX Vision should pull machine detail forward with Clarity, buff the pixel breakup with Refine, and finish with Julio for presentation."
    };
  }

  if (exposureScore < 45) {
    return {
      photoType: "DARK_MACHINE",
      confidence: 82,
      pipeline: ["RECOVER", "CLEAN", "JULIO"],
      damageProfile,
      decision:
        "This photo is limited by weak exposure. IX Vision should recover brightness and shadows first, then apply a safe clean pass and finish with Julio."
    };
  }

  if (overallScore > 70 && compressionScore > 70 && sharpnessScore > 70) {
    return {
      photoType: "HIGH_QUALITY_PHONE",
      confidence: 95,
      pipeline: ["CLEAN", "JULIO"],
      damageProfile,
      decision:
        "This photo is already strong. IX Vision should avoid heavy restoration and only apply safe marketplace cleanup plus Julio presentation finish."
    };
  }

  return {
    photoType: "MIXED_DAMAGE",
    confidence: 68,
    pipeline: ["IX_AUTO", "REFINE", "JULIO"],
    damageProfile,
    decision:
      "This photo has mixed issues that do not fall into one clean bucket. IX Vision should use a balanced automatic route, refine artifacts, and finish with Julio."
  };
}
