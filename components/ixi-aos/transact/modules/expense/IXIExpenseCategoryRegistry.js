const clean = value => String(value ?? "").trim();
const LEGACY_CATEGORY_ALIASES = Object.freeze({
  "parts-fittings": "parts-material",
  supplies: "supplies-consumables",
  fuel: "fuel-fluids"
});

export function normalizeIXIExpenseCategoryId(value = "") {
  const id = clean(value).toLowerCase();
  return LEGACY_CATEGORY_ALIASES[id] || id;
}

export const IXI_EXPENSE_DEFAULT_CATEGORIES = Object.freeze([
  { id: "parts-material", label: "Parts / Material", labelEs: "Partes / Material", glAccountCode: "" },
  { id: "supplies-consumables", label: "Supplies / Consumables", labelEs: "Suministros / Consumibles", glAccountCode: "" },
  { id: "fuel-fluids", label: "Fuel / Fluids", labelEs: "Combustible / Fluidos", glAccountCode: "" },
  { id: "contract-labor-1099", label: "Contract Labor / 1099", labelEs: "Mano de Obra Contratada / 1099", glAccountCode: "" },
  { id: "outside-service", label: "Outside Service", labelEs: "Servicio Externo", glAccountCode: "" },
  { id: "cleaning-detailing", label: "Cleaning / Detailing", labelEs: "Limpieza / Detallado", glAccountCode: "" },
  { id: "travel", label: "Travel", labelEs: "Viaje", glAccountCode: "" },
  { id: "yard-storage", label: "Yard / Storage", labelEs: "Patio / Almacenamiento", glAccountCode: "" },
  { id: "permits-fees", label: "Permits / Fees", labelEs: "Permisos / Cargos", glAccountCode: "" },
  { id: "rental", label: "Rental", labelEs: "Renta", glAccountCode: "" },
  { id: "other", label: "Other", labelEs: "Otro", glAccountCode: "" }
]);

export const IXI_EXPENSE_DEFAULT_COST_PURPOSES = Object.freeze([
  { id: "make-ready-cleanup", label: "Make-Ready / Cleanup", labelEs: "Preparación / Limpieza" },
  { id: "repair-maintenance", label: "Repair / Maintenance", labelEs: "Reparación / Mantenimiento" },
  { id: "inventory-preparation", label: "Inventory Preparation", labelEs: "Preparación de Inventario" },
  { id: "sales-delivery", label: "Sales / Delivery", labelEs: "Venta / Entrega" },
  { id: "operating", label: "Operating", labelEs: "Operación" },
  { id: "yard-overhead", label: "Yard / Overhead", labelEs: "Patio / Gastos Generales" },
  { id: "administrative", label: "Administrative", labelEs: "Administrativo" },
  { id: "other", label: "Other / Unspecified", labelEs: "Otro / Sin Especificar" }
]);

function normalizeEntry(entry = {}) {
  if (typeof entry === "string") {
    const id = clean(entry).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return id ? { id, label: clean(entry), labelEs: clean(entry), glAccountCode: "", active: true } : null;
  }
  const id = clean(entry.id || entry.value || entry.code).toLowerCase();
  if (!id) return null;
  return {
    id,
    label: clean(entry.label || entry.name || id),
    labelEs: clean(entry.labelEs || entry.spanishLabel || entry.label || entry.name || id),
    glAccountCode: clean(entry.glAccountCode || entry.accountCode),
    glAccountName: clean(entry.glAccountName || entry.accountName),
    active: entry.active !== false
  };
}

function mergeCatalog(defaults, configured = [], mode = "extend") {
  const map = new Map();
  if (clean(mode).toLowerCase() !== "replace") {
    defaults.forEach(entry => map.set(entry.id, { ...entry }));
  }
  (Array.isArray(configured) ? configured : []).map(normalizeEntry).filter(Boolean).forEach(entry => {
    if (entry.active) map.set(entry.id, { ...(map.get(entry.id) || {}), ...entry });
    else map.delete(entry.id);
  });
  return [...map.values()];
}

export function getIXIExpenseCategories(policy = {}) {
  return mergeCatalog(
    IXI_EXPENSE_DEFAULT_CATEGORIES,
    policy.categories || policy.categoryCatalog,
    policy.categoryMode
  );
}

export function getIXIExpenseCostPurposes(policy = {}) {
  return mergeCatalog(
    IXI_EXPENSE_DEFAULT_COST_PURPOSES,
    policy.costPurposes || policy.costPurposeCatalog,
    policy.costPurposeMode
  );
}

export function getIXIExpenseCategory(policy = {}, categoryId = "") {
  const id = normalizeIXIExpenseCategoryId(categoryId);
  return getIXIExpenseCategories(policy).find(entry => entry.id === id) || null;
}

export default {
  getIXIExpenseCategories,
  getIXIExpenseCostPurposes,
  getIXIExpenseCategory,
  normalizeIXIExpenseCategoryId
};
