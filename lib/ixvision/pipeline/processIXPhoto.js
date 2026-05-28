import { IX_PHOTO_POLISH_PRESETS } from "../presets/photoPolishPresets";
import { oemColorProtectionPass } from "../passes/oemColorProtectionPass";

const PREMIUM_UPLOAD_EMAILS = [
  "tarpbarry@gmail.com"
];

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
    PREMIUM_COMPANY_NAMES.some(name =>
      company.includes(name.toLowerCase())
    )
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

export async function processIXPhoto(file, options = {}) {
  const policy = getUploadPolicy(options);

  const {
    mode = policy.defaultMode,
    make,
    maxWidth = policy.maxWidth,
    outputQuality = policy.outputQuality,

    // Set true only when you want untouched master upload.
    bypassProcessing = false
  } = options;

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
    IX_PHOTO_POLISH_PRESETS[mode] ||
    IX_PHOTO_POLISH_PRESETS[policy.defaultMode] ||
    IX_PHOTO_POLISH_PRESETS.clean;

  const protectedPreset = oemColorProtectionPass({
    preset,
    make
  });

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

  const dealerPopFile = await processIXPhoto(file, {
    ...options,
    mode: "dealerPop",
    maxWidth: policy.maxWidth,
    outputQuality: policy.outputQuality
  });

  return {
    id: `${Date.now()}-${file.name}-${Math.random()}`,

    originalFile: file,
    originalUrl,

    cleanFile,
    cleanUrl: URL.createObjectURL(cleanFile),

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

  if (photoItem.activeMode === "dealerPop") {
    return photoItem.dealerPopUrl || photoItem.url || "";
  }

  return photoItem.cleanUrl || photoItem.url || "";
}
