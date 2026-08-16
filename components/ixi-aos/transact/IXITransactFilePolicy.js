const clean = value => String(value ?? "").trim();

function extensionOf(fileName = "") {
  const name = clean(fileName).toLowerCase();
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot) : "";
}

export function validateIXITransactFile(file, {
  maxBytes = 10 * 1024 * 1024,
  allowedMimeTypes = [],
  allowedExtensions = []
} = {}) {
  if (!file) {
    return {
      valid: false,
      code: "required",
      message: "A file is required."
    };
  }

  const size = Number(file.size || 0);
  const mimeType = clean(file.type).toLowerCase();
  const extension = extensionOf(file.name);
  const mimeRules = Array.isArray(allowedMimeTypes)
    ? allowedMimeTypes.map(value => clean(value).toLowerCase()).filter(Boolean)
    : [];
  const extensionRules = Array.isArray(allowedExtensions)
    ? allowedExtensions.map(value => {
        const normalized = clean(value).toLowerCase();
        return normalized && normalized.startsWith(".") ? normalized : `.${normalized}`;
      }).filter(Boolean)
    : [];

  if (size <= 0) {
    return {
      valid: false,
      code: "empty",
      message: "The selected file is empty."
    };
  }

  if (maxBytes > 0 && size > maxBytes) {
    return {
      valid: false,
      code: "too-large",
      message: `The selected file exceeds the ${Math.round(maxBytes / 1024 / 1024)}MB limit.`
    };
  }

  const mimeAllowed = !mimeRules.length || mimeRules.includes(mimeType);
  const extensionAllowed = !extensionRules.length || extensionRules.includes(extension);

  if (!mimeAllowed && !extensionAllowed) {
    return {
      valid: false,
      code: "unsupported-type",
      message: "The selected file type is not supported."
    };
  }

  return {
    valid: true,
    code: "ok",
    message: ""
  };
}

export function createIXIPendingAttachment(file, {
  type = "attachment",
  status = "local-pending-upload",
  extra = {}
} = {}) {
  if (!file) return null;

  return {
    type: clean(type) || "attachment",
    fileName: clean(file.name),
    mimeType: clean(file.type),
    size: Number(file.size || 0),
    status: clean(status) || "local-pending-upload",
    ...extra
  };
}

export default {
  validateIXITransactFile,
  createIXIPendingAttachment
};
