export function normalizeMachineMediaItems(items = []) {
  return (Array.isArray(items) ? items : [])
    .filter(Boolean)
    .map((item, index) => ({
      id: item.id || item.uuid || item.url || `media-${index}`,
      file: item.file || null,
      url: item.url || item.src || "",
      previewUrl: item.previewUrl || item.url || item.src || "",
      variant: item.variant || "original",
      isHero: Boolean(item.isHero),
      order: Number.isFinite(item.order) ? item.order : index,
      source: item.source || "local"
    }))
    .sort((a, b) => a.order - b.order);
}

export function createMachineMediaModel(items = []) {
  const normalized = normalizeMachineMediaItems(items);

  if (!normalized.length) return [];

  const hasHero = normalized.some(item => item.isHero);

  return normalized.map((item, index) => ({
    ...item,
    order: index,
    isHero: hasHero ? item.isHero : index === 0
  }));
}
