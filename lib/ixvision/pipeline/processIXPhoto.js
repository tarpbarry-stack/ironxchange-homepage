import { IX_PHOTO_POLISH_PRESETS } from "../presets/photoPolishPresets";
import { oemColorProtectionPass } from "../passes/oemColorProtectionPass";

import { applyIXDeblockPass } from "../tools/deblockPass";
import { applyIXDenoisePass } from "../tools/denoisePass";
import { applyIXHaloRepairPass } from "../tools/haloRepairPass";
import { applyIXUpscalePass } from "../tools/upscalePass";
import { applyIXDehazePass } from "../tools/dehazePass";
import { applyIXExposureRecoverPass } from "../tools/exposureRecoverPass";

const PREMIUM_UPLOAD_EMAILS = ["tarpbarry@gmail.com"];

const PREMIUM_COMPANY_NAMES = [
  "IronXchange",
  "Concho Operations",
  "Sales Inc"
];

function isPremiumUploader({ userEmail, companyName } = {}) {
  const email = String(userEmail || "").toLowerCase();
  const company = String(companyName || "").toLowerCase();

  return (
    PREMIUM_UPLOAD_EMAILS.includes(email) ||
    PREMIUM_COMPANY_NAMES.some(name => company.includes(name.toLowerCase()))
  );
}

function getUploadPolicy(options = {}) {
  if (isPremiumUploader(options)) {
    return {
      lane: "premium",
      preserveOriginal: true,
      destructiveCompression: false,
      maxWidth: 6000,
      outputQuality: 0.98,
      defaultMode: "clean"
    };
  }

  return {
    lane: "standard",
    preserveOriginal: false,
    destructiveCompression: true,
    maxWidth: 1800,
    outputQuality: 0.92,
    defaultMode: "clean"
  };
}

function normalizeIXPhotoMode(mode = "clean") {
  if (mode === "dealer-pop") return "dealerPop";
  if (mode === "pop") return "dealerPop";
  if (mode === "dealerPop") return "dealerPop";
  if (mode === "clarity") return "clarity";
  if (mode === "original") return "original";
  if (mode === "clean") return "clean";
  if (mode === "repair") return "repair";
  if (mode === "julio") return "julio";
  return "clean";
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = error => {
      URL.revokeObjectURL(url);
      reject(error);
    };

    img.src = url;
  });
}

function liftToFilter(value) {
  return 1 + Number(value || 0);
}

function getOutputName(file) {
  const originalName = file?.name || "ironxchange-photo.jpg";
  return originalName.replace(/\.[^.]+$/, ".jpg");
}

async function canvasToFile(canvas, file, outputQuality) {
  return await new Promise(resolve => {
    canvas.toBlob(
      blob => {
        resolve(
          new File([blob], getOutputName(file), {
            type: "image/jpeg",
            lastModified: Date.now()
          })
        );
      },
      "image/jpeg",
      outputQuality
    );
  });
}

function applyIXJulioPass(ctx, width, height, preset = {}) {
  const paintPopLift = Number(preset.paintPopLift || 0);
  const glossLift = Number(preset.glossLift || 0);

  const amount = Math.max(0, Math.min(0.35, paintPopLift + glossLift));

  if (!amount) return;

  ctx.save();

  ctx.globalAlpha = amount * 0.65;

  ctx.filter = `
    saturate(${1 + amount * 0.45})
    contrast(${1 + amount * 0.18})
    brightness(${1 + amount * 0.08})
  `;

  ctx.drawImage(ctx.canvas, 0, 0, width, height);

  ctx.restore();
}
function applyIXRepairPass(ctx, width, height, preset = {}) {
  const repairLift = Number(preset.repairLift || 0);

  if (!repairLift) return;

  let imageData;

  try {
    imageData = ctx.getImageData(0, 0, width, height);
  } catch {
    return;
  }

  const src = imageData.data;
  const out = new Uint8ClampedArray(src);

  const amount = Math.max(0, Math.min(0.35, repairLift));
  const smoothStrength = amount * 0.32;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;

      const left = i - 4;
      const right = i + 4;
      const up = i - width * 4;
      const down = i + width * 4;

      for (let c = 0; c < 3; c++) {
        const center = src[i + c];

        const neighborAverage =
          (src[left + c] +
            src[right + c] +
            src[up + c] +
            src[down + c]) / 4;

        const difference = Math.abs(center - neighborAverage);

        const shouldSmooth = difference > 8 && difference < 42;

        out[i + c] = shouldSmooth
          ? Math.max(
              0,
              Math.min(
                255,
                center * (1 - smoothStrength) +
                  neighborAverage * smoothStrength
              )
            )
          : center;
      }
    }
  }

  imageData.data.set(out);
  ctx.putImageData(imageData, 0, 0);
}


function applyIXClarityPass(ctx, width, height, preset = {}) {
  const clarityLift = Number(preset.clarityLift || 0);
  const sharpening = Number(preset.sharpening || 0);

  const amount = Math.max(0, Math.min(0.42, clarityLift + sharpening));

  if (!amount) return;

  let imageData;

  try {
    imageData = ctx.getImageData(0, 0, width, height);
  } catch {
    return;
  }

  const src = imageData.data;
  const out = new Uint8ClampedArray(src);

  const strength = amount * 0.72;
  const edgeBoost = amount * 18;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;

      const left = i - 4;
      const right = i + 4;
      const up = i - width * 4;
      const down = i + width * 4;

      for (let c = 0; c < 3; c++) {
        const center = src[i + c];

        const neighborAverage =
          (src[left + c] +
            src[right + c] +
            src[up + c] +
            src[down + c]) /
          4;

        const edge = center - neighborAverage;

        out[i + c] = Math.max(
          0,
          Math.min(255, center + edge * edgeBoost * strength)
        );
      }
    }
  }

  imageData.data.set(out);
  ctx.putImageData(imageData, 0, 0);
}

export async function processIXPhoto(file, options = {}) {
  const policy = getUploadPolicy(options);

  const {
    mode: rawMode = policy.defaultMode,
    make,
    maxWidth = policy.maxWidth,
    outputQuality = policy.outputQuality,
    bypassProcessing = false
  } = options;

  const mode = normalizeIXPhotoMode(rawMode);

  if (!file) {
    throw new Error("processIXPhoto requires a file.");
  }

  const shouldReturnOriginal =
    bypassProcessing ||
    mode === "original" ||
    (policy.lane === "premium" && options.uploadMaster === true);

  if (shouldReturnOriginal) {
    return file;
  }

  const preset =
  options.customPreset ||
  IX_PHOTO_POLISH_PRESETS[mode] ||
  IX_PHOTO_POLISH_PRESETS[policy.defaultMode] ||
  IX_PHOTO_POLISH_PRESETS.clean;

  const protectedPreset = oemColorProtectionPass({
    preset,
    make
  });

  const toolRecipe = options.toolRecipe || {};

  const img = await loadImage(file);

  const scale = Math.min(1, maxWidth / img.width);
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: false });

  canvas.width = width;
  canvas.height = height;

  ctx.filter = `
    brightness(${liftToFilter(protectedPreset.brightnessLift)})
    contrast(${liftToFilter(protectedPreset.contrastLift)})
    saturate(${liftToFilter(protectedPreset.saturationLift)})
  `;

ctx.drawImage(img, 0, 0, width, height);

applyIXClarityPass(ctx, width, height, protectedPreset);
applyIXRepairPass(ctx, width, height, protectedPreset);
applyIXJulioPass(ctx, width, height, protectedPreset);

  console.log("IX Vision processed:", {
    mode,
    make,
    originalName: file.name,
    originalSize: file.size,
    outputQuality,
    maxWidth,
    protectedPreset
  });

  return await canvasToFile(canvas, file, outputQuality);
}

export async function buildIXPhotoVariants(file, options = {}) {
  const policy = getUploadPolicy(options);

  const originalUrl = URL.createObjectURL(file);

 const cleanFile = await processIXPhoto(file, {
  ...options,
  mode: "clean",
  maxWidth: policy.maxWidth,
  outputQuality: policy.outputQuality
});

const clarityFile = await processIXPhoto(file, {
  ...options,
  mode: "clarity",
  maxWidth: policy.maxWidth,
  outputQuality: policy.outputQuality
});

const repairFile = await processIXPhoto(file, {
  ...options,
  mode: "repair",
  maxWidth: policy.maxWidth,
  outputQuality: policy.outputQuality
});

const julioFile = await processIXPhoto(file, {
  ...options,
  mode: "julio",
  maxWidth: policy.maxWidth,
  outputQuality: policy.outputQuality
});
  
const dealerPopFile = await processIXPhoto(file, {
  ...options,
  mode: "dealerPop",
  maxWidth: policy.maxWidth,
  outputQuality: policy.outputQuality
});

   console.log("IX Vision Variants", {
    hasOriginal: !!originalUrl,
    hasClean: !!cleanFile,
    hasClarity: !!clarityFile,
    hasJulio: !!julioFile,
    hasPop: !!dealerPopFile
  });

  return {
    id: `${Date.now()}-${file.name}-${Math.random()}`,
    originalFile: file,
    originalUrl,

    clarityFile,
clarityUrl: URL.createObjectURL(clarityFile),

repairFile,
repairUrl: URL.createObjectURL(repairFile),

julioFile,
julioUrl: URL.createObjectURL(julioFile),

dealerPopFile,
    dealerPopUrl: URL.createObjectURL(dealerPopFile),

    activeMode: policy.defaultMode,
    file: cleanFile,
    url: URL.createObjectURL(cleanFile),

    existing: false,
    uploadLane: policy.lane,
    preserveOriginal: policy.preserveOriginal
  };
}

export function getIXActivePhotoFile(photoItem) {
  if (!photoItem) return null;

  if (photoItem.activeMode === "original") {
    return photoItem.originalFile || photoItem.file || null;
  }

  if (photoItem.activeMode === "clarity") {
    return photoItem.clarityFile || photoItem.cleanFile || photoItem.file || null;
  }

  if (photoItem.activeMode === "dealerPop") {
    return photoItem.dealerPopFile || photoItem.file || null;
  }

  return photoItem.cleanFile || photoItem.file || null;
}

export function getIXActivePhotoUrl(photoItem) {
  if (!photoItem) return "";

  if (photoItem.activeMode === "original") {
    return photoItem.originalUrl || photoItem.url || "";
  }

  if (photoItem.activeMode === "clarity") {
    return photoItem.clarityUrl || photoItem.cleanUrl || photoItem.url || "";
  }

  if (photoItem.activeMode === "dealerPop") {
    return photoItem.dealerPopUrl || photoItem.url || "";
  }

  return photoItem.cleanUrl || photoItem.url || "";
}
