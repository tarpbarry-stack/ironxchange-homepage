export function getIXDamageProfile(scores = {}) {
  const {
    resolutionScore = 0,
    compressionScore = 0,
    sharpnessScore = 0,
    exposureScore = 0
  } = scores;

  return {
    resolution:
      resolutionScore < 35
        ? "EXTREME"
        : resolutionScore < 55
        ? "HIGH"
        : resolutionScore < 75
        ? "MEDIUM"
        : "LOW",

    compression:
      compressionScore < 45
        ? "HIGH"
        : compressionScore < 70
        ? "MEDIUM"
        : "LOW",

    sharpness:
      sharpnessScore < 45
        ? "HIGH"
        : sharpnessScore < 70
        ? "MEDIUM"
        : "LOW",

    exposure:
      exposureScore < 45
        ? "HIGH"
        : exposureScore < 70
        ? "MEDIUM"
        : "LOW"
  };
}
