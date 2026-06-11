export function getIXInspectionProfile(scores = {}) {
  const {
    resolutionScore = 0,
    sharpnessScore = 0,
    compressionScore = 0,
    exposureScore = 0,
    overallScore = 0
  } = scores;

  return {
    inspectionDetail:
      sharpnessScore >= 80
        ? "EXCELLENT"
        : sharpnessScore >= 65
        ? "GOOD"
        : sharpnessScore >= 50
        ? "FAIR"
        : "POOR",

    photoResolution:
      resolutionScore >= 90
        ? "EXCELLENT"
        : resolutionScore >= 70
        ? "GOOD"
        : resolutionScore >= 50
        ? "FAIR"
        : "POOR",

    exposure:
      exposureScore >= 85
        ? "EXCELLENT"
        : exposureScore >= 65
        ? "GOOD"
        : exposureScore >= 50
        ? "FAIR"
        : "POOR",

    compressionRisk:
      compressionScore >= 75
        ? "LOW"
        : compressionScore >= 55
        ? "MEDIUM"
        : "HIGH",

    marketplaceReadiness:
      overallScore >= 80
        ? "READY"
        : overallScore >= 65
        ? "NEAR READY"
        : "NEEDS WORK"
  };
}
