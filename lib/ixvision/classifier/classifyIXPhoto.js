export function classifyIXPhoto(scores = {}) {
  const {
    resolutionScore = 0,
    sharpnessScore = 0,
    compressionScore = 0,
    exposureScore = 0,
    contrastScore = 0,
    overallScore = 0
  } = scores;

  let photoType = "MIXED_DAMAGE";
  let confidence = 50;
  let pipeline = ["IX_AUTO"];

  if (resolutionScore < 35) {
    photoType = "LOW_RES_WEB";
    confidence = 92;

    pipeline = [
      "UPSCALE",
      "RESTORE",
      "REFINE",
      "JULIO"
    ];
  }

  else if (compressionScore < 45) {
    photoType = "COMPRESSED_WEB";
    confidence = 90;

    pipeline = [
      "DEBLOCK",
      "RESTORE",
      "REFINE",
      "JULIO"
    ];
  }

  else if (sharpnessScore < 45) {
    photoType = "SOFT_IMAGE";
    confidence = 84;

    pipeline = [
      "CLARITY",
      "REFINE",
      "JULIO"
    ];
  }

  else if (exposureScore < 45) {
    photoType = "DARK_MACHINE";
    confidence = 82;

    pipeline = [
      "RECOVER",
      "CLEAN",
      "JULIO"
    ];
  }

  else if (
    overallScore > 70 &&
    compressionScore > 70 &&
    sharpnessScore > 70
  ) {
    photoType = "HIGH_QUALITY_PHONE";
    confidence = 95;

    pipeline = [
      "CLEAN",
      "JULIO"
    ];
  }

  return {
    photoType,
    confidence,
    pipeline
  };
}
