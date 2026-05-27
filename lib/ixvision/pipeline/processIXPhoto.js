import { IX_PHOTO_POLISH_PRESETS } from "../presets/photoPolishPresets";
import { oemColorProtectionPass } from "../passes/oemColorProtectionPass";

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = reject;
    img.src = url;
  });
}

function liftToFilter(value) {
  return 1 + value;
}

export async function processIXPhoto(file, options = {}) {
  const {
    mode = "clean",
    make,
    outputQuality = 0.92,
    maxWidth = 1800,
  } = options;

  const preset = IX_PHOTO_POLISH_PRESETS[mode] || IX_PHOTO_POLISH_PRESETS.clean;

  const protectedPreset = oemColorProtectionPass({
    preset,
    make,
  });

  const img = await loadImage(file);

  const scale = Math.min(1, maxWidth / img.width);
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;

  ctx.filter = `
    brightness(${liftToFilter(protectedPreset.brightnessLift)})
    contrast(${liftToFilter(protectedPreset.contrastLift)})
    saturate(${liftToFilter(protectedPreset.saturationLift)})
  `;

  ctx.drawImage(img, 0, 0, width, height);

  return await new Promise(resolve => {
    canvas.toBlob(
      blob => {
        resolve(
          new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
            type: "image/jpeg",
            lastModified: Date.now(),
          })
        );
      },
      "image/jpeg",
      outputQuality
    );
  });
}
