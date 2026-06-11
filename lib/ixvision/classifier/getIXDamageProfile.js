export function getIXDamageProfile(scores = {}) {
  const {
    resolutionScore = 0,
    compressionScore = 0,
    sharpnessScore = 0,
    exposureScore = 0
  } = scores;

  return {
    resolution:
      resolutionScore >= 90
        ? "NONE"
        : resolutionScore >= 75
        ? "MINOR"
        : resolutionScore >= 55
        ? "MODERATE"
        : resolutionScore >= 35
        ? "SEVERE"
        : "EXTREME",

    compression:
      compressionScore >= 80
        ? "NONE"
        : compressionScore >= 65
        ? "MINOR"
        : compressionScore >= 50
        ? "MODERATE"
        : compressionScore >= 35
        ? "SEVERE"
        : "EXTREME",

    sharpness:
      sharpnessScore >= 80
        ? "NONE"
        : sharpnessScore >= 65
        ? "MINOR"
        : sharpnessScore >= 50
        ? "MODERATE"
        : sharpnessScore >= 35
        ? "SEVERE"
        : "EXTREME",

    exposure:
      exposureScore >= 85
        ? "NONE"
        : exposureScore >= 65
        ? "MINOR"
        : exposureScore >= 50
        ? "MODERATE"
        : exposureScore >= 35
        ? "SEVERE"
        : "EXTREME"
  };
}
