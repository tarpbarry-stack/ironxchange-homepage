function clean(value = "") {
  return String(value || "").trim().toUpperCase();
}

export function normalizeImportedModel(model = "") {
  return clean(model)
    .replace(/[^A-Z0-9]+/g, "");
}

export function isSafeModelVariant(importedModel = "", baseModel = "") {
  const imported = normalizeImportedModel(importedModel);
  const base = normalizeImportedModel(baseModel);

  if (!imported || !base) return false;
  if (imported === base) return false;

  // SD115B is a safe variant of SD115
  if (imported.startsWith(base) && imported.length <= base.length + 3) {
    return true;
  }

  return false;
}
