export function buildIXRestoreRecipe(scores = {}) {
  const {
    compressionScore = 0,
    sharpnessScore = 0,
    resolutionScore = 0
  } = scores;

  return {
    deblock:
      compressionScore < 70 ? 0.7 : 0.25,

    denoise:
      compressionScore < 60 ? 0.6 : 0.2,

    haloRepair:
      sharpnessScore < 70 ? 0.35 : 0.15,

    upscale:
      resolutionScore < 40 ? 2 : 1
  };
}
