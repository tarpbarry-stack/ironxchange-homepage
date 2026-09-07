const clean = value => String(value ?? "").trim();

export const IXI_AOS_CARD_NUMBER_MIN = 1;
export const IXI_AOS_CARD_NUMBER_MAX = 18;
export const IXI_AOS_SELECTOR_CARD_COUNT = 20;

const CARD_007_VARIANT_SLUGS = Object.freeze({
  "universal-object-007": "A",
  "universal-object-007b": "B",
  "universal-object-007c": "C"
});


export function getAosTemplateNumber(template = {}) {
  const value = Number(
    template?.templateNumber ||
    template?.metadata?.cardNumber ||
    0
  );

  return Number.isInteger(value) &&
    value >= IXI_AOS_CARD_NUMBER_MIN &&
    value <= IXI_AOS_CARD_NUMBER_MAX
    ? value
    : 0;
}


export function getSelectableAosSystemTemplates(
  templates = []
) {
  const bySelectorKey = new Map();

  (Array.isArray(templates) ? templates : [])
    .forEach(template => {
      const number =
        getAosTemplateNumber(template);

      if (!number) return;

      const slug =
        clean(template?.templateSlug)
          .toLowerCase();

      /* 009B is not an independently admitted selector layout. */
      if (slug === "aos-card-009b") return;

      const card007Variant = number === 7
        ? CARD_007_VARIANT_SLUGS[slug] || clean(template?.metadata?.cardVariant).toUpperCase() || "A"
        : "";
      const selectorKey = number === 7
        ? `007${card007Variant}`
        : String(number).padStart(3, "0");

      if (!bySelectorKey.has(selectorKey)) {
        bySelectorKey.set(selectorKey, template);
      }
    });

  return [...bySelectorKey.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([, template]) => template);
}


export function isCompleteAosSystemTemplateSet(
  templates = []
) {
  const selectable =
    getSelectableAosSystemTemplates(
      templates
    );

  const selectorLabels = new Set(
    selectable.map(template => getAosSelectorCardLabel(template))
  );

  return selectable.length === IXI_AOS_SELECTOR_CARD_COUNT &&
    ["007A", "007B", "007C"].every(label => selectorLabels.has(label)) &&
    Array.from({ length: IXI_AOS_CARD_NUMBER_MAX }, (_, index) => index + 1)
      .every(number => selectable.some(template => getAosTemplateNumber(template) === number));
}


export function formatAosCardNumber(value) {
  return String(
    Number(value) || 0
  ).padStart(3, "0");
}


export function getAosSelectorCardLabel(template = {}) {
  const number = getAosTemplateNumber(template);
  if (number !== 7) return formatAosCardNumber(number);

  const slug = clean(template?.templateSlug).toLowerCase();
  const variant = CARD_007_VARIANT_SLUGS[slug] ||
    clean(template?.metadata?.cardVariant).toUpperCase() ||
    "A";

  return `007${variant}`;
}
