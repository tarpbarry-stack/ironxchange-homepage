import { buildIXAutoRecipe } from "./buildIXAutoRecipe";
import { processIXPhoto } from "../pipeline/processIXPhoto";

export async function runIXAutoRecipe(file, scores = {}, options = {}) {
  if (!file) {
    throw new Error("runIXAutoRecipe requires a file.");
  }

  const recipe = buildIXAutoRecipe(scores, options);

  const outputFile = await processIXPhoto(file, {
    ...options,
    mode: "custom",
    customPreset: recipe.settings,
    maxWidth: recipe.output.maxWidth,
    outputQuality: recipe.output.outputQuality
  });

  return {
    recipe,
    outputFile,
    outputUrl: URL.createObjectURL(outputFile)
  };
}
