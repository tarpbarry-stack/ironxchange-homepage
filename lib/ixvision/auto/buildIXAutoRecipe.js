import { classifyIXPhoto } from "../classifier/classifyIXPhoto";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

function round3(value) {
  return Math.round(value * 1000) / 1000;
}

export function buildIXAutoRecipe(scores = {}, options = {}) {
  const classification = classifyIXPhoto(scores);

  const {
    resolutionScore = 0,
    sharpnessScore = 0,
    compressionScore = 0,
    exposureScore = 0,
    contrastScore = 0,
    colorScore = 0
  } = scores;

  const resolutionDamage = clamp((75 - resolutionScore) / 75, 0, 1);
  const sharpnessDamage = clamp((72 - sharpnessScore) / 72, 0, 1);
  const compressionDamage = clamp((76 - compressionScore) / 76, 0, 1);
  const exposureDamage = clamp((72 - exposureScore) / 72, 0, 1);
  const contrastNeed = clamp((72 - contrastScore) / 72, 0, 1);
  const colorNeed = clamp((68 - colorScore) / 68, 0, 1);

  const brightnessLift = round3(
    clamp(0.025 + exposureDamage * 0.07, 0.015, 0.095)
  );

  const contrastLift = round3(
    clamp(0.12 + contrastNeed * 0.12 + sharpnessDamage * 0.04, 0.10, 0.26)
  );

  const saturationLift = round3(
    clamp(0.018 + colorNeed * 0.045, 0.012, 0.075)
  );

  const clarityLift = round3(
    clamp(0.08 + sharpnessDamage * 0.18 - compressionDamage * 0.04, 0.04, 0.24)
  );

  const sharpening = round3(
    clamp(0.07 + sharpnessDamage * 0.16 - compressionDamage * 0.035, 0.035, 0.22)
  );

  const repairLift = round3(
    clamp(0.08 + compressionDamage * 0.18 + sharpnessDamage * 0.06, 0.06, 0.28)
  );

  const paintPopLift = round3(
    clamp(0.10 + colorNeed * 0.08 + contrastNeed * 0.05, 0.08, 0.24)
  );

  const glossLift = round3(
    clamp(0.06 + contrastNeed * 0.08 + resolutionDamage * 0.035, 0.04, 0.17)
  );

  const outputQuality = resolutionDamage > 0.55 ? 0.98 : 0.94;
  const maxWidth = resolutionDamage > 0.55 ? 2600 : 2200;

  return {
    name: `${classification.photoType}_AUTO_RECIPE`,
    classification,
    sourceScores: scores,

    damageWeights: {
      resolution: round3(resolutionDamage),
      sharpness: round3(sharpnessDamage),
      compression: round3(compressionDamage),
      exposure: round3(exposureDamage),
      contrast: round3(contrastNeed),
      color: round3(colorNeed)
    },

    steps: classification.pipeline,

    settings: {
      brightnessLift,
      contrastLift,
      saturationLift,
      sharpening,
      clarityLift,
      repairLift,
      paintPopLift,
      glossLift
    },

    output: {
      maxWidth,
      outputQuality
    }
  };
}
