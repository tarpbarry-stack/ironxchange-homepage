import { classifyIXPhoto } from "../classifier/classifyIXPhoto";
import { processIXPhoto } from "../pipeline/processIXPhoto";

function getFinalModeForPipeline(pipeline = []) {
  if (pipeline.includes("JULIO")) return "julio";
  if (pipeline.includes("REFINE")) return "repair";
  if (pipeline.includes("CLARITY")) return "clarity";
  if (pipeline.includes("CLEAN")) return "clean";

  return "clean";
}

export async function runIXAutoPipeline(file, scores = {}, options = {}) {
  if (!file) {
    throw new Error("runIXAutoPipeline requires a file.");
  }

  const classification = classifyIXPhoto(scores);
  const finalMode = getFinalModeForPipeline(classification.pipeline);

 const outputFile = await processIXPhoto(file, {
  ...options,
  mode: "custom",
  customPreset: recipe.settings,
  toolRecipe: recipe.toolRecipe,
  maxWidth: recipe.output.maxWidth,
  outputQuality: recipe.output.outputQuality
});

  return {
    classification,
    finalMode,
    outputFile,
    outputUrl: URL.createObjectURL(outputFile)
  };
}
